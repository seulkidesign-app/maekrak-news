import type { NewsEvent, NewsItem } from "@/lib/news";
import { canonicalSourceName } from "./source-normalize.ts";

export type EvidenceLabel = "일반 보도" | "발언·주장" | "전망·추정";

const claimPatterns = [
  /말했|밝혔|주장|반박|촉구|경고|의혹|혐의|발언|인터뷰/i,
  /\b(?:says?|said|claims?|alleges?|warns?|statement|according to)\b/i,
];
const uncertaintyPatterns = [
  /전망|예상|추정|잠정|확인 중|미확인|알려졌|보인다|가능성|계획|검토|시사/i,
  /\b(?:reportedly|unconfirmed|appears?|likely|estimated|expects?|plans?|could|may|might)\b/i,
];

export function classifyEvidence(article: NewsItem): EvidenceLabel {
  const text = `${article.title} ${article.description}`;
  if (uncertaintyPatterns.some((pattern) => pattern.test(text))) return "전망·추정";
  if (claimPatterns.some((pattern) => pattern.test(text))) return "발언·주장";
  return "일반 보도";
}

const evidenceRank: Record<EvidenceLabel, number> = {
  "일반 보도": 0,
  "발언·주장": 1,
  "전망·추정": 2,
};

export function eventEvidenceSummary(event: NewsEvent) {
  const counts: Record<EvidenceLabel, number> = {
    "일반 보도": 0,
    "발언·주장": 0,
    "전망·추정": 0,
  };

  // Count each identified canonical publisher once. A single outlet can publish
  // many updates to the same story; treating every update as independent evidence
  // inflates the trust UI. Articles whose publisher identity is unavailable stay
  // visible in source/timeline views but do not add an independent evidence vote.
  // When one identified publisher has mixed wording, keep its most cautious label.
  const labelBySource = new Map<string, EvidenceLabel>();
  event.articles.forEach((article) => {
    const source = canonicalSourceName(article.source);
    if (source === "Unverified source") return;
    const label = classifyEvidence(article);
    const previous = labelBySource.get(source);
    if (!previous || evidenceRank[label] > evidenceRank[previous]) labelBySource.set(source, label);
  });
  labelBySource.forEach((label) => { counts[label] += 1; });
  return counts;
}

export function eventTimeline(event: NewsEvent) {
  const sorted = [...event.articles]
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
  const latestBySourceHour = new Map<string, NewsItem>();

  // A publisher can issue a correction or materially revised headline within the
  // same hour. Keep the latest version for that publisher-hour bucket rather than
  // the first one, otherwise the trust timeline can preserve stale wording while
  // silently dropping the correction.
  for (const article of sorted) {
    const parsed = new Date(article.publishedAt);
    const hour = Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 13) : article.publishedAt;
    const key = `${canonicalSourceName(article.source)}-${hour}`;
    latestBySourceHour.set(key, article);
  }

  const deduped = [...latestBySourceHour.values()]
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
  const identified = deduped.filter((article) => canonicalSourceName(article.source) !== "Unverified source");
  const latestUnverified = [...deduped].reverse().find((article) => canonicalSourceName(article.source) === "Unverified source");

  // Unknown publisher identity is useful context, but it must not be able to occupy
  // every visible timeline slot simply by publishing once per hour. Keep at most the
  // latest unverified item while preserving identified publishers for comparison.
  return [...identified, ...(latestUnverified ? [latestUnverified] : [])]
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
    .slice(-5);
}
