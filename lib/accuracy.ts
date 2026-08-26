import type { NewsEvent, NewsItem } from "@/lib/news";

const UNCERTAINTY = /추정|잠정|미확인|가능성|가능할|전망|예상|것으로 보|reportedly|unconfirmed|alleged|appears?|likely|estimated|\bmay\b|\bmight\b|\bcould\b/i;
const SYNDICATION = /\breuters\b|associated press|\bap\b|\bafp\b|agence france|연합뉴스|yonhap/i;

function headlineNumbers(title: string) {
  return [...new Set((title.match(/\d+(?:[.,]\d+)*(?:\s*%|\s*percent|\s*퍼센트|\s*명|\s*명)?/gi) ?? [])
    .map((value) => value.replace(/\s+/g, "").toLowerCase())
    .filter((value) => {
      const plain = Number(value.replace(/[^\d.]/g, ""));
      return !(Number.isInteger(plain) && plain >= 1900 && plain <= 2100 && /^\d{4}$/.test(value));
    })];
}

function articleText(article: NewsItem) {
  return `${article.title} ${article.description}`;
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
  const uniqueArticles = [...bySource.values()];

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

  const syndicationHintSources = uniqueArticles
    .filter((article) => {
      const match = articleText(article).match(SYNDICATION)?.[0]?.toLowerCase();
      if (!match) return false;
      return !article.source.toLowerCase().includes(match);
    })
    .map((article) => article.source);

  return {
    outletCount: bySource.size,
    headlineNumberDifference,
    numberExamples: numberExamples.slice(0, 5),
    certaintyDifference,
    certaintyExamples: certaintyExamples.slice(0, 6),
    syndicationHintSources: [...new Set(syndicationHintSources)].slice(0, 5),
  };
}
