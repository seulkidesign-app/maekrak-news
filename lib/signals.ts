import type { NewsEvent, NewsItem } from "@/lib/news";
import { canonicalSourceName } from "./source-normalize.ts";

export type EvidenceLabel = "일반 보도" | "발언·주장" | "전망·추정";

const claimPatterns = [
  /말했|밝혔|주장|반박|촉구|경고|의혹|혐의|발언|인터뷰/i,
  /\b(?:says?|said|alleges?|warns?|according to)\b/i,
];
const uncertaintyPatterns = [
  /전망|예상|추정|잠정|확인 중|미확인|알려졌|보인다|가능성|계획|검토|시사/i,
  /\b(?:reportedly|unconfirmed|appears?|likely|estimated|expects?|plans?|could|may|might)\b/i,
];

const nonAssertionClaimNouns = [
  /\b(?:jobless|unemployment|insurance|benefit|benefits|initial|weekly)\s+claims?\b/gi,
  /\bclaims?\s+(?:for\s+)?(?:unemployment|insurance|benefits?|compensation|damages?)\b/gi,
];
const nonAssertionStatements = /\b(?:financial|income|bank|account)\s+statements?\b/gi;

// Feed text can contain default-ignorable Unicode code points (zero-width spaces,
// word joiners, soft hyphens, variation selectors, etc.). They are nearly invisible
// to readers but can split epistemic markers such as "claims", "reportedly", "주장",
// or "검토" and launder cautious language into the factual-looking "일반 보도" label.
// Normalize compatibility forms and remove those invisible separators before any
// trust classification. This is intentionally scoped to classification text only.
function normalizeEvidenceText(text: string) {
  return text
    .normalize("NFKC")
    .replace(/\p{Default_Ignorable_Code_Point}/gu, "");
}

// Korean morphemes used for uncertainty can also appear inside ordinary nouns.
// Mask narrow, clearly non-epistemic senses before applying the uncertainty rules:
// - 전망대: an observation deck / observatory, not a forecast
// - 시사 프로그램/방송/잡지: current-affairs media, not "suggests/indicates"
// - 시사점: an implication/takeaway noun, not a claim that an event is uncertain
const nonUncertaintyKoreanLexemes = [
  /전망대/g,
  /시사\s*(?:프로그램|방송|잡지|교양)/g,
  /시사점/g,
];

function hasUncertaintyLanguage(text: string) {
  const masked = nonUncertaintyKoreanLexemes.reduce(
    (value, pattern) => value.replace(pattern, " "),
    text,
  );
  return uncertaintyPatterns.some((pattern) => pattern.test(masked));
}

function hasClaimLanguage(text: string) {
  if (claimPatterns.some((pattern) => pattern.test(text))) return true;

  // "claims" and "statement" are ambiguous nouns in ordinary reporting. Economic
  // claims data and financial/account statements are documents or measurements,
  // not assertions by a speaker. Mask those narrow noun senses while preserving
  // actual assertion language such as "the minister claims..." or "issued a statement".
  const withoutNonAssertionClaims = nonAssertionClaimNouns.reduce(
    (value, pattern) => value.replace(pattern, " "),
    text,
  );
  if (/\bclaims?\b/i.test(withoutNonAssertionClaims)) return true;

  const withoutDocumentStatements = text.replace(nonAssertionStatements, " ");
  return /\bstatements?\b/i.test(withoutDocumentStatements);
}

export function classifyEvidence(article: NewsItem): EvidenceLabel {
  const text = normalizeEvidenceText(`${article.title} ${article.description}`);
  if (hasUncertaintyLanguage(text)) return "전망·추정";
  if (hasClaimLanguage(text)) return "발언·주장";
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
