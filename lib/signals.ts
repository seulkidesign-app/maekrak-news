import type { NewsEvent, NewsItem } from "@/lib/news";

export type EvidenceLabel = "보도된 사실" | "주장·발언" | "추가 확인 필요";

const claimPatterns = [
  /말했|밝혔|주장|반박|촉구|경고|전망|예상|의혹|혐의|가능성|계획|검토|시사|says?|said|claims?|alleges?|warns?|expects?|plans?|could|may|might/i,
];
const uncertaintyPatterns = [
  /추정|잠정|확인 중|미확인|알려졌|보인다|가능성|reportedly|unconfirmed|appears?|likely|estimated/i,
];

export function classifyEvidence(article: NewsItem): EvidenceLabel {
  const text = `${article.title} ${article.description}`;
  if (uncertaintyPatterns.some((pattern) => pattern.test(text))) return "추가 확인 필요";
  if (claimPatterns.some((pattern) => pattern.test(text))) return "주장·발언";
  return "보도된 사실";
}

export function eventEvidenceSummary(event: NewsEvent) {
  const counts: Record<EvidenceLabel, number> = {
    "보도된 사실": 0,
    "주장·발언": 0,
    "추가 확인 필요": 0,
  };
  event.articles.forEach((article) => { counts[classifyEvidence(article)] += 1; });
  return counts;
}

export function eventTimeline(event: NewsEvent) {
  const seen = new Set<string>();
  return [...event.articles]
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
    .filter((article) => {
      const key = `${article.source}-${new Date(article.publishedAt).toISOString().slice(0, 13)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(-4);
}
