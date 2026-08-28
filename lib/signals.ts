import type { NewsEvent, NewsItem } from "@/lib/news";
import { canonicalSourceName } from "@/lib/source-normalize";

export type EvidenceLabel = "일반 보도" | "발언·주장" | "전망·추정";

const claimPatterns = [
  /말했|밝혔|주장|반박|촉구|경고|의혹|혐의|발언|인터뷰|says?|said|claims?|alleges?|warns?|statement|according to/i,
];
const uncertaintyPatterns = [
  /전망|예상|추정|잠정|확인 중|미확인|알려졌|보인다|가능성|계획|검토|시사|reportedly|unconfirmed|appears?|likely|estimated|expects?|plans?|could|may|might/i,
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

  // Count each canonical publisher once. A single outlet can publish many updates
  // to the same story; treating every update as independent evidence inflates the
  // trust UI. When one publisher has mixed wording, keep its most cautious label.
  const labelBySource = new Map<string, EvidenceLabel>();
  event.articles.forEach((article) => {
    const source = canonicalSourceName(article.source);
    const label = classifyEvidence(article);
    const previous = labelBySource.get(source);
    if (!previous || evidenceRank[label] > evidenceRank[previous]) labelBySource.set(source, label);
  });
  labelBySource.forEach((label) => { counts[label] += 1; });
  return counts;
}

export function eventTimeline(event: NewsEvent) {
  const seen = new Set<string>();
  return [...event.articles]
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
    .filter((article) => {
      const parsed = new Date(article.publishedAt);
      const hour = Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 13) : article.publishedAt;
      const key = `${canonicalSourceName(article.source)}-${hour}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(-5);
}
