import type { NewsEvent, NewsItem } from "@/lib/news";
import { canonicalSourceName } from "./source-normalize.ts";

const UNCERTAINTY = /추정|잠정|미확인|가능성|가능할|전망|예상|것으로 보|\b(?:reportedly|unconfirmed|alleged|appear|appears|likely|estimated|might|could)\b/i;
const SYNDICATION_TERMS = ["reuters", "associated press", " ap ", " afp ", "agence france", "연합뉴스", "yonhap"];

const MAGNITUDE_MULTIPLIERS: Array<[RegExp, number]> = [
  [/\btrillion\b|조/i, 1_000_000_000_000],
  [/\bbillion\b/i, 1_000_000_000],
  [/억/i, 100_000_000],
  [/\bmillion\b|백만/i, 1_000_000],
  [/만/i, 10_000],
  [/\bthousand\b|천/i, 1_000],
];

function currencyUnit(value: string) {
  const lower = value.toLowerCase();
  if (/\$|\busd\b|\bdollars?\b|달러/.test(lower)) return "USD";
  if (/€|\beur\b|\beuros?\b|유로/.test(lower)) return "EUR";
  if (/£|\bgbp\b/.test(lower)) return "GBP";
  if (/₩|\bkrw\b|\bwon\b|원/.test(lower)) return "KRW";
  if (/¥|\bjpy\b|\byen\b|엔/.test(lower)) return "JPY";
  return "";
}

function canonicalNumber(value: string) {
  const lower = value.toLowerCase().trim();
  const unit = /%|percent|퍼센트/.test(lower)
    ? "%"
    : /명/.test(lower)
      ? "명"
      : currencyUnit(lower);
  const numericText = lower.replace(/,/g, "").match(/\d+(?:\.\d+)?/)?.[0] ?? "";
  let number = Number(numericText);
  if (!numericText || !Number.isFinite(number)) return "";
  const multiplier = MAGNITUDE_MULTIPLIERS.find(([pattern]) => pattern.test(lower))?.[1] ?? 1;
  number *= multiplier;
  if (/^(?:[$€£₩¥]|(?:usd|eur|gbp|krw|jpy)\s*)?[\s]*[\-−]/i.test(lower)) number *= -1;
  if (!Number.isFinite(number)) return "";
  return `${String(number)}${unit}`;
}

function headlineNumbers(title: string): string[] {
  const matcher = /(?:[$€£₩¥]|\b(?:USD|EUR|GBP|KRW|JPY)\b\s*)?[+\-−]?\d+(?:[.,]\d+)*(?:\s*(?:%|percent|퍼센트|명|thousand|million|billion|trillion|천|만|백만|억|조))?(?:\s*(?:dollars?|euros?|won|yen|원|달러|유로|엔))?/gi;
  const cleaned: string[] = [];
  for (const match of title.matchAll(matcher)) {
    const value = match[0];
    const index = match.index ?? 0;
    const before = title.slice(Math.max(0, index - 3), index);
    const after = title.slice(index + value.length, index + value.length + 2);
    const attachedToIdentifier = /[A-Za-z]$/.test(before) || /[A-Za-z]-$/.test(before) || /^[A-Za-z]/.test(after);
    if (attachedToIdentifier) continue;

    const compact = value.replace(/\s+/g, "").toLowerCase();
    const plainText = compact.replace(/,/g, "").match(/\d+(?:\.\d+)?/)?.[0] ?? "";
    const plain = Number(plainText);
    const hasMagnitude = MAGNITUDE_MULTIPLIERS.some(([pattern]) => pattern.test(value));
    const looksLikeYear = !hasMagnitude && /^[+]?\d{4}$/.test(compact) && Number.isInteger(plain) && plain >= 1900 && plain <= 2100;
    const canonical = canonicalNumber(value);
    if (!looksLikeYear && canonical) cleaned.push(canonical);
  }
  return Array.from(new Set(cleaned)).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

function articleText(article: NewsItem): string {
  return `${article.title} ${article.description}`;
}

function hasSyndicationHint(article: NewsItem): boolean {
  const text = ` ${articleText(article).toLowerCase()} `;
  const source = canonicalSourceName(article.source).toLowerCase();
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
    const canonical = canonicalSourceName(article.source);
    if (!bySource.has(canonical)) bySource.set(canonical, { ...article, source: canonical });
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
