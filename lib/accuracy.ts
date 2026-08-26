import type { NewsEvent, NewsItem } from "@/lib/news";

const UNCERTAINTY = /추정|잠정|미확인|가능성|가능할|전망|예상|것으로 보|reportedly|unconfirmed|alleged|appears?|likely|estimated|\bmay\b|\bmight\b|\bcould\b/i;
const SYNDICATION_TERMS = ["reuters", "associated press", " ap ", " afp ", "agence france", "연합뉴스", "yonhap"];

function headlineNumbers(title: string): string[] {
  const raw = title.match(/\d+(?:[.,]\d+)*(?:\s*%|\s*percent|\s*퍼센트|\s*명)?/gi) ?? [];
  const cleaned = raw
    .map((value) => value.replace(/\s+/g, "").toLowerCase())
    .filter((value) => {
      const plainText = value.replace(/[^\d.]/g, "");
      const plain = Number(plainText);
      const looksLikeYear = /^\d{4}$/.test(value) && Number.isInteger(plain) && plain >= 1900 && plain <= 2100;
      return !looksLikeYear;
    });
  return Array.from(new Set(cleaned));
}

function articleText(article: NewsItem): string {
  return `${article.title} ${article.description}`;
}

function hasSyndicationHint(article: NewsItem): boolean {
  const text = ` ${articleText(article).toLowerCase()} `;
  const source = article.source.toLowerCase();
  return SYNDICATION_TERMS.some((term) => {
    const normalized = term.trim();
    if (!text.includes(term)) return false;
    return normalized.length > 0 && !source.includes(normalized);
  });
}

export type AccuracyAudit = {
  outletCount: number;
  headlineNumberDifference: boolean;
  numberExamples: Array<{ source: string; values: string[] }>;
  certaintyDifference: boolean;
  certaintyExamples: Array<{ source: string; uncertain: boolean }>;
  syndicationHintSources: string[];
};

export function auditEventAccuracy(event: NewsEvent): AccuracyAudit {
  const bySource = new Map<string, NewsItem>();
  event.articles.forEach((article) => {
    if (!bySource.has(article.source)) bySource.set(article.source, article);
  });
  const uniqueArticles = Array.from(bySource.values());

  const numberExamples = uniqueArticles
    .map((article) => ({ source: article.source, values: headlineNumbers(article.title) }))
    .filter((item) => item.values.length > 0);
  const numberSignatures = new Set(numberExamples.map((item) => item.values.join("|")));
  const headlineNumberDifference = numberExamples.length >= 2 && numberSignatures.size >= 2;

  const certaintyExamples = uniqueArticles.map((article) => ({
    source: article.source,
    uncertain: UNCERTAINTY.test(articleText(article)),
  }));
  const certaintyStates = new Set(certaintyExamples.map((item) => item.uncertain));
  const certaintyDifference = uniqueArticles.length >= 2 && certaintyStates.size >= 2;

  const syndicationHintSources = Array.from(new Set(
    uniqueArticles.filter(hasSyndicationHint).map((article) => article.source),
  )).slice(0, 5);

  return {
    outletCount: bySource.size,
    headlineNumberDifference,
    numberExamples: numberExamples.slice(0, 5),
    certaintyDifference,
    certaintyExamples: certaintyExamples.slice(0, 6),
    syndicationHintSources,
  };
}
