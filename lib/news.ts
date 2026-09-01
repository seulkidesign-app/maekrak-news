import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { canonicalSourceName, normalizeExternalText, outletIdentityKey } from "./source-normalize.ts";

export type NewsCategory = "국내" | "세계" | "정치" | "사회" | "경제" | "기술" | "재난";
export type NewsScope = "domestic" | "world";
export type SourceRole = "broadcaster" | "wire" | "international" | "other";
export type HealthStatus = "ok" | "http-error" | "empty" | "fetch-error";
export type BriefWhyCode = "security" | "politics" | "economy" | "disaster" | "technology" | "society" | "broad-impact";
export type BriefWatchCode = "single-source" | "uncertain" | "claim-heavy" | "multi-source" | "follow-up";
export type EventDayStatus = "today" | "ongoing";

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  category: NewsCategory;
  scope: NewsScope;
  description: string;
  sourceType: "direct" | "aggregated";
  sourceRole: SourceRole;
};

export type SourceHealth = {
  name: string;
  ok: boolean;
  itemCount: number;
  sourceType: "direct" | "aggregated";
  role: SourceRole;
  status: HealthStatus;
  checkedAt: string;
  latestPublishedAt?: string;
};

export type NewsEvent = {
  id: string;
  title: string;
  category: NewsCategory;
  scope: NewsScope;
  summary: string;
  publishedAt: string;
  dayStatus: EventDayStatus;
  articles: NewsItem[];
  sourceCount: number;
  importanceScore: number;
  whySelected: string[];
  briefWhy: BriefWhyCode;
  briefWatch: BriefWatchCode;
};

export type Briefing = {
  news: NewsItem[];
  events: NewsEvent[];
  priorityEventIds: string[];
  sourceHealth: SourceHealth[];
  healthySources: number;
  totalSources: number;
  categoryCoverage: Record<NewsCategory, number>;
};

type Feed = {
  name: string;
  sourceType: "direct" | "aggregated";
  role: SourceRole;
  defaultCategory: NewsCategory;
  scope: NewsScope;
  url: string;
  weight: number;
};

const googleNewsSearch = (query: string, locale: "ko" | "en") => {
  if (locale === "ko") return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR%3Ako`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US%3Aen`;
};

const googleNewsTopKo = "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR%3Ako";
const googleNewsWorldKo = "https://news.google.com/rss/headlines/section/topic/WORLD?hl=ko&gl=KR&ceid=KR%3Ako";

const feeds: Feed[] = [
  { name: "SBS", role: "broadcaster", weight: 1.0, defaultCategory: "국내", scope: "domestic", sourceType: "direct", url: "https://news.sbs.co.kr/news/newsflashRssFeed.do?plink=RSSREADER" },
  { name: "BBC", role: "international", weight: 1.15, defaultCategory: "세계", scope: "world", sourceType: "direct", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "KBS", role: "broadcaster", weight: 1.1, defaultCategory: "국내", scope: "domestic", sourceType: "aggregated", url: googleNewsSearch("site:news.kbs.co.kr", "ko") },
  { name: "MBC", role: "broadcaster", weight: 1.0, defaultCategory: "국내", scope: "domestic", sourceType: "aggregated", url: googleNewsSearch("site:imnews.imbc.com", "ko") },
  { name: "연합뉴스", role: "wire", weight: 1.25, defaultCategory: "국내", scope: "domestic", sourceType: "aggregated", url: googleNewsSearch("site:yna.co.kr", "ko") },
  { name: "Google 뉴스 주요", role: "broadcaster", weight: 0.85, defaultCategory: "국내", scope: "domestic", sourceType: "aggregated", url: googleNewsTopKo },
  { name: "Google 뉴스 세계", role: "international", weight: 0.9, defaultCategory: "세계", scope: "world", sourceType: "aggregated", url: googleNewsWorldKo },
  { name: "Reuters", role: "wire", weight: 1.35, defaultCategory: "세계", scope: "world", sourceType: "aggregated", url: googleNewsSearch("site:reuters.com", "en") },
  { name: "AP", role: "wire", weight: 1.3, defaultCategory: "세계", scope: "world", sourceType: "aggregated", url: googleNewsSearch("site:apnews.com", "en") },
  { name: "CNN", role: "international", weight: 1.0, defaultCategory: "세계", scope: "world", sourceType: "aggregated", url: googleNewsSearch("site:cnn.com", "en") },
  { name: "DW", role: "international", weight: 0.95, defaultCategory: "세계", scope: "world", sourceType: "aggregated", url: googleNewsSearch("site:dw.com", "en") },
  { name: "Al Jazeera", role: "international", weight: 1.0, defaultCategory: "세계", scope: "world", sourceType: "aggregated", url: googleNewsSearch("site:aljazeera.com", "en") },
  { name: "NHK", role: "international", weight: 0.95, defaultCategory: "세계", scope: "world", sourceType: "aggregated", url: googleNewsSearch("site:www3.nhk.or.jp", "en") },
];

const feedByName = new Map(feeds.map((feed) => [feed.name, feed]));
const sourceWeights: Record<string, number> = {
  Reuters: 1.35,
  AP: 1.3,
  연합뉴스: 1.25,
  BBC: 1.15,
  KBS: 1.1,
  SBS: 1.0,
  MBC: 1.0,
  CNN: 1.0,
  "Al Jazeera": 1.0,
  DW: 0.95,
  NHK: 0.95,
};
const trustedSourceDomains: Record<string, string[]> = {
  Reuters: ["reuters.com"],
  AP: ["apnews.com"],
  연합뉴스: ["yna.co.kr"],
  BBC: ["bbc.com", "bbc.co.uk"],
  KBS: ["kbs.co.kr"],
  SBS: ["sbs.co.kr"],
  MBC: ["imbc.com"],
  CNN: ["cnn.com"],
  "Al Jazeera": ["aljazeera.com"],
  DW: ["dw.com"],
  NHK: ["nhk.or.jp"],
};
const allowedAggregatorDomains = ["news.google.com"];
const parser = new XMLParser({ ignoreAttributes: false, processEntities: false });
const stopwords = new Set([
  "속보", "단독", "영상", "뉴스", "today", "live", "says", "said", "after", "with", "from", "that", "this", "대한", "관련", "오늘", "정부",
  "new", "latest", "breaking", "report", "reports", "update", "업데이트", "reuters", "ap", "bbc", "cnn", "dw", "kbs", "sbs", "mbc", "yonhap", "연합뉴스",
]);

const entityAliases: Record<string, string[]> = {
  israel: ["israel", "israeli", "이스라엘"],
  palestine: ["palestine", "palestinian", "gaza", "west bank", "팔레스타인", "가자", "서안"],
  iran: ["iran", "iranian", "이란"],
  hormuz: ["hormuz", "호르무즈"],
  ukraine: ["ukraine", "ukrainian", "우크라이나"],
  russia: ["russia", "russian", "러시아"],
  china: ["china", "chinese", "중국"],
  canada: ["canada", "canadian", "캐나다"],
  oman: ["oman", "오만"],
  syria: ["syria", "syrian", "시리아"],
  us: ["united states", "u s", "america", "미국"],
  southkorea: ["south korea", "republic of korea", "rok", "대한민국", "남한"],
  korea: ["korea", "한국"],
  northkorea: ["north korea", "dprk", "북한"],
  japan: ["japan", "japanese", "일본"],
  trump: ["trump", "트럼프"],
  lee: ["lee jae myung", "이재명"],
  fed: ["federal reserve", "fed", "fomc", "연준"],
  nato: ["nato", "나토", "북대서양조약기구"],
  eu: ["european union", "eu", "유럽연합"],
  tariffs: ["tariff", "tariffs", "관세"],
  ceasefire: ["ceasefire", "truce", "휴전"],
};

const actionAliases: Record<string, string[]> = {
  attack: ["attack", "bomb", "missile", "공격", "공습", "폭격", "미사일"],
  threat: ["threat", "threaten", "위협", "협박"],
  ceasefire: ["ceasefire", "truce", "휴전"],
  tariff: ["tariff", "trade duty", "관세"],
  sanction: ["sanction", "제재"],
  election: ["election", "vote", "선거", "투표"],
  rate: ["interest rate", "rate cut", "rate hike", "금리", "기준금리"],
  summit: ["summit", "meeting", "talks", "회담", "정상회담", "협상"],
  law: ["law", "bill", "court", "법안", "법원", "판결"],
  reform: ["reform", "개혁", "개편"],
  housing: ["housing", "home", "주택", "주거", "부동산"],
  labor: ["wage", "labor", "임금", "노동", "파업"],
  visa: ["visa", "h-1b", "h1b", "비자"],
  disaster: ["earthquake", "flood", "wildfire", "typhoon", "지진", "홍수", "산불", "태풍", "호우"],
  death: ["dies", "dead", "killed", "death", "사망", "숨져"],
  launch: ["launch", "release", "발표", "출시", "공개"],
};

const disasterPattern = /태풍|호우|폭우|홍수|산불|지진|폭염|한파|재난|\b(?:typhoon|flood|wildfire|earthquake|storm|heatwave)\b/i;
const strongTechPattern = /인공지능|반도체|\b(?:ai|artificial intelligence|semiconductors?|openai|nvidia|apple|google|microsoft)\b/i;
const chipPattern = /\bchips?\b/i;
const nonTechChipPattern = /\b(?:potato|snack|food|crisps?|tortilla|chocolate|cookie|wood)\b/i;
const topicRules: Array<{ category: NewsCategory; pattern: RegExp }> = [
  { category: "경제", pattern: /금리|환율|물가|증시|주가|관세|무역|경제|은행|재정|예산|임금|\b(?:inflation|interest rates?|rate cut|rate hike|tariffs?|markets?|stocks?|economy|banks?|budget|wages?)\b/i },
  { category: "정치", pattern: /대통령|총리|국회|의회|선거|탄핵|정당|장관|외교|개혁|\b(?:president|prime minister|parliament|congress|election|impeachment|minister|diplomacy|reform)\b/i },
  { category: "사회", pattern: /사건|사고|범죄|수사|검찰|경찰|교육|의료|병원|노동|주거|주택|\b(?:crime|police|prosecut(?:or|ors|ion)?|education|healthcare|hospital|labor|housing)\b/i },
];

const highImpactPattern = /전쟁|공격|미사일|핵|휴전|계엄|탄핵|선거|대통령|총리|붕괴|지진|태풍|홍수|산불|금리|관세|제재|\b(?:war|attack|missiles?|nuclear|ceasefire|election|president|prime minister|earthquake|typhoon|flood|wildfire|interest rates?|tariffs?|sanctions?)\b/i;
const leaderDeathPattern = /(?:대통령|총리|국왕|교황).{0,35}(?:사망|숨져)|(?:사망|숨져).{0,35}(?:대통령|총리|국왕|교황)|\b(?:president|prime minister|king|pope)\b.{0,35}\b(?:dies|dead|death)\b|\b(?:dies|dead|death)\b.{0,35}\b(?:president|prime minister|king|pope)\b/i;
const softNewsPattern = /연예|가수|배우|콘서트|앨범|스포츠|축구|야구|농구|\b(?:celebrity|singer|actor|actress|concert|album|country music|football|baseball|basketball)\b/i;
const structuralImpactPattern = /경찰 개혁|검찰 개혁|재정|예산|주택 공급|부동산|출생|인구|반도체|\b(?:police reform|prosecution reform|budget|housing supply|birth|population|semiconductor)\b/i;
const uncertaintyPattern = /추정|잠정|확인 중|미확인|알려졌|보인다|가능성|\b(?:reportedly|unconfirmed|appears?|likely|estimated|might|could)\b/i;
const claimPattern = /말했|밝혔|주장|반박|촉구|경고|전망|예상|계획|검토|시사|\b(?:says?|said|claims?|alleges?|warns?|expects?|plans?)\b/i;
const worldSignals = /북한|미국|중국|일본|러시아|우크라이나|이란|이스라엘|팔레스타인|가자|캐나다|유럽|나토|호르무즈|\b(?:north korea|dprk|united states|china|japan|russia|ukraine|iran|israel|gaza|canada|europe|nato|hormuz)\b|palestin/i;
const domesticSignals = /한국|대한민국|남한|서울|부산|제주|국회|청와대|이재명|코스피|\b(?:south korea|republic of korea|seoul|busan|jeju|lee jae myung|kospi)\b/i;

function highImpactSignalText(text: string) {
  return text
    .replace(/\bwar memorial\b/gi, " memorial ")
    .replace(/\bwar museum\b/gi, " museum ")
    .replace(/\bwar and peace\b/gi, " literary work ")
    .replace(/전쟁기념관/g, "기념관")
    .replace(/전쟁\s*박물관/g, "박물관");
}

function isHighImpact(text: string) {
  const signalText = highImpactSignalText(text);
  return highImpactPattern.test(signalText) || leaderDeathPattern.test(signalText);
}

function safeCodePoint(raw: string, radix: number) {
  const value = Number.parseInt(raw, radix);
  return Number.isInteger(value) && value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : "�";
}

function decodeEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code) => safeCodePoint(code, 10))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => safeCodePoint(code, 16))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function clean(value: unknown, maxLength = 4000) {
  const withoutMarkup = decodeEntities(String(value ?? ""))
    .replace(/<[^>]*>/g, " ")
    .replace(/^[▲△▶►◆■●]\s*/, "");
  return normalizeExternalText(withoutMarkup).slice(0, maxLength);
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isPrivateIpv4Parts(parts: number[]) {
  if (parts.length != 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
}

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "::" || host === "::1" || /^(?:fc|fd)[0-9a-f]{2}:/i.test(host) || /^fe[89ab][0-9a-f]:/i.test(host)) return true;
  const mapped = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (mapped) {
    const high = Number.parseInt(mapped[1], 16);
    const low = Number.parseInt(mapped[2], 16);
    return isPrivateIpv4Parts([high >> 8, high & 255, low >> 8, low & 255]);
  }
  const nat64 = host.match(/^64:ff9b::([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
if (nat64) {
  const high = Number.parseInt(nat64[1], 16);
  const low = Number.parseInt(nat64[2], 16);
  if (isPrivateIpv4Parts([high >> 8, high & 255, low >> 8, low & 255])) return true;
}
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  return isPrivateIpv4Parts(ipv4.slice(1).map(Number));
}

function safeHttpUrl(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    if (url.username || url.password || isPrivateHostname(url.hostname)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function hostMatches(hostname: string, domain: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const normalizedDomain = domain.toLowerCase().replace(/\.$/, "");
  return host === normalizedDomain || host.endsWith(`.${normalizedDomain}`);
}

function sourceForLink(source: string, link: string, sourceType: Feed["sourceType"], sourceAttributionUrl = "") {
  const trustedDomains = trustedSourceDomains[source];
  if (!trustedDomains) return source;
  try {
    const url = new URL(link);
    if (url.protocol !== "https:") return "Unverified source";
    const hostname = url.hostname;
    const official = trustedDomains.some((domain) => hostMatches(hostname, domain));
    if (official) return source;

    const allowedAggregator = sourceType === "aggregated" && allowedAggregatorDomains.some((domain) => hostMatches(hostname, domain));
    if (!allowedAggregator) return "Unverified source";

    const attribution = safeHttpUrl(sourceAttributionUrl);
    if (!attribution) return "Unverified source";
    const attributionUrl = new URL(attribution);
    if (attributionUrl.protocol !== "https:") return "Unverified source";
    const attributionHostname = attributionUrl.hostname;
    return trustedDomains.some((domain) => hostMatches(attributionHostname, domain)) ? source : "Unverified source";
  } catch {
    return "Unverified source";
  }
}

const rfcMonths: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function isValidCalendarParts(year: number, month: number, day: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function hasValidExplicitCalendarDate(raw: string) {
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s|$)/);
  if (iso) return isValidCalendarParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const rfc = raw.match(/^(?:[A-Za-z]{3},\s*)?(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})(?:\s|$)/);
  if (rfc) {
    if (rfc[3].length !== 4) return false;
    const month = rfcMonths[rfc[2].toLowerCase()];
    if (!month) return false;
    return isValidCalendarParts(Number(rfc[3]), month, Number(rfc[1]));
  }
  return false;
}

function hasExplicitTimezoneForTimestamp(raw: string) {
  const hasClock = /(?:T|\s)\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?/.test(raw);
  if (!hasClock) return false;
  const normalized = raw.trim();
  if (/(?:Z|[+-]\d{2}:?\d{2})(?:\s*\([^)]*\))?$/i.test(normalized)) return true;
  return /(?:GMT|UTC)(?:\s*\([^)]*\))?$/i.test(normalized);
}

function safePublishedAt(value: unknown, now = Date.now()) {
  const raw = String(value ?? "").trim();
  if (!raw || !hasValidExplicitCalendarDate(raw) || !hasExplicitTimezoneForTimestamp(raw)) return "";
  const parsed = new Date(raw);
  const time = parsed.getTime();
  if (!Number.isFinite(time)) return "";
  if (time > now + 2 * 60_000) return "";
  if (time > now) return new Date(now).toISOString();
  return parsed.toISOString();
}

async function readResponseTextLimited(response: Response, maxBytes = 2_000_000) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error("feed-too-large");
  if (!response.body) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error("feed-too-large");
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error("feed-too-large");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

function stripSourceSuffix(title: string, source: string, feedName: string) {
  let result = clean(title, 320);
  for (const label of [source, feedName, "Reuters", "Associated Press", "AP", "BBC", "CNN", "연합뉴스"]) {
    if (!label) continue;
    result = result.replace(new RegExp(`\\s+-\\s+${escapeRegExp(label)}\\s*$`, "i"), "").trim();
  }
  return result;
}

function inferSourceRole(source: string): SourceRole {
  const value = source.toLowerCase().trim();
  if (/^(?:reuters|ap|연합뉴스|afp|agence france-presse)$/.test(value)) return "wire";
  if (/^(?:kbs|mbc|sbs|jtbc|ytn|채널a|tv조선)$/.test(value)) return "broadcaster";
  if (/^(?:bbc|cnn|dw|al jazeera|nhk|guardian|the guardian|new york times|the new york times|washington post|the washington post|financial times|bloomberg)$/.test(value)) return "international";
  return "other";
}

function inferScope(title: string, description: string, fallback: NewsScope): NewsScope {
  const text = `${title} ${description}`;
  const domestic = domesticSignals.test(text);
  const world = worldSignals.test(text);
  if (domestic && !world) return "domestic";
  if (world && !domestic) return "world";
  return fallback;
}

function inferCategory(title: string, description: string, fallback: NewsCategory): NewsCategory {
  const text = `${title} ${description}`;
  if (disasterPattern.test(text)) return "재난";
  if (strongTechPattern.test(text) || (chipPattern.test(text) && !nonTechChipPattern.test(text))) return "기술";
  return topicRules.find((rule) => rule.pattern.test(text))?.category ?? fallback;
}

function normalizePhrase(text: string) {
  return ` ${normalizeExternalText(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim()} `;
}

function normalizedConcepts(text: string, aliases: Record<string, string[]>) {
  const normalized = normalizePhrase(text);
  const found = new Set<string>();
  Object.entries(aliases).forEach(([concept, variants]) => {
    if (variants.some((variant) => normalized.includes(normalizePhrase(variant)))) found.add(concept);
  });
  return found;
}

function normalizedEntities(text: string) {
  const found = normalizedConcepts(text, entityAliases);
  if (found.has("northkorea") || found.has("southkorea")) found.delete("korea");
  return found;
}

function hasMutuallyExclusiveEntityConflict(left: Set<string>, right: Set<string>) {
  return (left.has("southkorea") && right.has("northkorea")) || (left.has("northkorea") && right.has("southkorea"));
}

function normalizedActions(text: string) {
  const found = normalizedConcepts(text, actionAliases);
  const normalized = normalizeExternalText(text).toLowerCase();
  if (/\bstrike\b/.test(normalized)) {
    const laborContext = /\b(?:worker|workers|union|unions|employee|employees|labor|labour|wage|wages|walkout|picket|industrial action)\b/.test(normalized);
    const militaryContext = /\b(?:air strike|airstrike|military|missile|bomb|bombing|drone|attack|attacks|militant|militants|forces|target|targets|war)\b/.test(normalized);
    if (laborContext && !militaryContext) found.add("labor");
    if (militaryContext && !laborContext) found.add("attack");
  }
  return found;
}

function tokens(text: string) {
  return new Set(
    clean(text).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/)
      .filter((word) => word.length >= 2 && !stopwords.has(word))
  );
}

const genericTitleCaseWords = new Set([
  "A", "An", "As", "At", "After", "Before", "Company", "Government", "President", "Prime", "Minister", "Officials", "Police", "Court", "Bank", "Central", "New", "Latest", "Breaking",
]);

const koreanOrganizationSuffix = /(?:전자|자동차|하이닉스|그룹|은행|증권|보험|항공|제약|바이오|건설|화학|에너지|텔레콤|카드|캐피탈|금융|상사|중공업|조선|모비스|로보틱스)$/;
const koreanGenericOrganizationPrefixes = /^(?:전기|수소|자율주행|친환경|승용|상용|소형|대형|국내|해외)$/;

function properNameTokens(text: string) {
  const cleaned = clean(text);
  const english = cleaned.match(/\b[A-Z][A-Za-z0-9&.-]{1,}\b/g) ?? [];
  const korean = cleaned
    .split(/\s+/)
    .map((word) => word.replace(/^[^가-힣A-Za-z0-9]+|[^가-힣A-Za-z0-9·&.-]+$/g, ""))
    .filter((word) => {
      if (!/[가-힣]/.test(word) || !koreanOrganizationSuffix.test(word)) return false;
      const stem = word.replace(koreanOrganizationSuffix, "");
      return stem.length >= 2 && !koreanGenericOrganizationPrefixes.test(stem);
    });
  return new Set([
    ...english.filter((word) => !genericTitleCaseWords.has(word)).map((word) => word.toLowerCase()),
    ...korean,
  ]);
}

function hasProperNameConflict(a: string, b: string) {
  const left = properNameTokens(a);
  const right = properNameTokens(b);
  if (!left.size || !right.size) return false;
  for (const value of left) if (right.has(value)) return false;
  return true;
}

function setSimilarity(left: Set<string>, right: Set<string>) {
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  left.forEach((value) => { if (right.has(value)) overlap += 1; });
  return overlap / Math.min(left.size, right.size);
}

function titleSimilarity(a: string, b: string) {
  return setSimilarity(tokens(a), tokens(b));
}

function entitySimilarity(a: string, b: string) {
  return setSimilarity(normalizedEntities(a), normalizedEntities(b));
}

function actionSimilarity(a: string, b: string) {
  return setSimilarity(normalizedActions(a), normalizedActions(b));
}

function timeDistanceHours(a: string, b: string) {
  const left = new Date(a).getTime();
  const right = new Date(b).getTime();
  if (!Number.isFinite(left) || !Number.isFinite(right)) return 999;
  return Math.abs(left - right) / 3_600_000;
}

function firstNormalizedEntity(text: string) {
  const normalized = normalizePhrase(text);
  const allowed = normalizedEntities(text);
  let best: { concept: string; index: number } | null = null;
  for (const concept of allowed) {
    const variants = entityAliases[concept] ?? [];
    for (const variant of variants) {
      const index = normalized.indexOf(normalizePhrase(variant));
      if (index >= 0 && (!best || index < best.index)) best = { concept, index };
    }
  }
  return best?.concept ?? null;
}

function koreanDirectionalEntityRelation(text: string) {
  const normalized = normalizeExternalText(text).toLowerCase();
  const action = /(?:공격|공습|폭격|위협|협박)/.exec(normalized);
  if (!action || action.index === undefined) return null;
  const prefix = normalized.slice(0, action.index);
  const occurrences: Array<{ concept: string; index: number; particle: string }> = [];
  for (const [concept, variants] of Object.entries(entityAliases)) {
    for (const variant of variants.filter((value) => /[가-힣]/.test(value))) {
      let from = 0;
      while (from < prefix.length) {
        const index = prefix.indexOf(variant.toLowerCase(), from);
        if (index < 0) break;
        const particle = prefix.slice(index + variant.length, index + variant.length + 1);
        occurrences.push({ concept, index, particle });
        from = index + variant.length;
      }
    }
  }
  const ordered = occurrences
    .sort((a, b) => a.index - b.index)
    .filter((entry, index, list) => list.findIndex((candidate) => candidate.concept === entry.concept) === index)
    .filter((entry) => entry.concept !== "korea" || !occurrences.some((candidate) => candidate.concept === "northkorea" || candidate.concept === "southkorea"));
  const markedActor = ordered.find((entry) => entry.particle === "이" || entry.particle === "가")?.concept;
  const markedTarget = ordered.find((entry) => entry.particle === "을" || entry.particle === "를")?.concept;
  if (markedActor && markedTarget && markedActor !== markedTarget) return [markedActor, markedTarget] as const;
  const [actor, target] = ordered;
  return actor && target && actor.concept !== target.concept ? [actor.concept, target.concept] as const : null;
}

function directionalEntityRelation(text: string) {
  const normalized = normalizeExternalText(text).toLowerCase();
  const verb = /\b(?:attacks?|attacked|bombs?|bombed|threatens?|threatened)\b/.exec(normalized);
  if (verb && verb.index !== undefined) {
    const actor = firstNormalizedEntity(normalized.slice(0, verb.index));
    const target = firstNormalizedEntity(normalized.slice(verb.index + verb[0].length));
    if (actor && target && actor !== target) return [actor, target] as const;
  }
  return koreanDirectionalEntityRelation(normalized);
}

function hasDirectionalRoleReversal(a: string, b: string) {
  const left = directionalEntityRelation(a);
  const right = directionalEntityRelation(b);
  return Boolean(left && right && left[0] === right[1] && left[1] === right[0]);
}

function sameEvent(a: NewsItem, b: NewsItem) {
  const leftEntities = normalizedEntities(a.title);
  const rightEntities = normalizedEntities(b.title);
  const lexical = titleSimilarity(a.title, b.title);
  const entities = setSimilarity(leftEntities, rightEntities);
  const actions = actionSimilarity(a.title, b.title);
  const hours = timeDistanceHours(a.publishedAt, b.publishedAt);
  const properNameConflict = hasProperNameConflict(a.title, b.title);

  if (hours > 30) return false;
  if (hasMutuallyExclusiveEntityConflict(leftEntities, rightEntities)) return false;
  if (hasDirectionalRoleReversal(a.title, b.title)) return false;
  if (lexical >= 0.9 && hours <= 24 && !properNameConflict) return true;
  if (lexical >= 0.74 && (entities > 0 || actions > 0) && hours <= 18 && !(properNameConflict && entities === 0)) return true;
  if (lexical >= 0.58 && entities > 0 && actions > 0 && hours <= 18) return true;
  if (entities >= 0.67 && actions >= 0.5 && lexical >= 0.42 && hours <= 12) return true;
  if (entities === 1 && leftEntities.size >= 2 && rightEntities.size >= 2 && actions === 1 && lexical >= 0.5 && hours <= 6) return true;
  return false;
}

function stableHash(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 24);
}

function stableEventId(articles: NewsItem[]) {
  const verified = verifiedSourceArticles(articles);
  const identityPool = verified.length ? verified : articles;
  const earliest = [...identityPool].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())[0];
  const anchor = earliest?.title ?? identityPool[0]?.title ?? "event";
  const entities = [...normalizedEntities(anchor)].sort();
  const actions = [...normalizedActions(anchor)].sort();
  const anchorTokens = [...tokens(anchor)].sort().slice(0, 12);
  const fingerprint = [entities.join(","), actions.join(","), anchorTokens.join(",")].filter(Boolean).join("|") || normalizePhrase(anchor);
  return `evt_${stableHash(fingerprint)}`;
}

function kstDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function isTodayKst(value: string) {
  return kstDateKey(value) === kstDateKey(new Date());
}

function isWithinHours(value: string, hours: number) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return false;
  const age = Date.now() - time;
  return age >= 0 && age <= hours * 3_600_000;
}

function isOngoingCandidate(item: NewsItem) {
  if (isTodayKst(item.publishedAt) || !isWithinHours(item.publishedAt, 18)) return false;
  return isHighImpact(`${item.title} ${item.description}`);
}

function canonicalDedupeUrl(link: string) {
  try {
    const url = new URL(link);
    url.hash = "";
    const trackingKeys = [...url.searchParams.keys()].filter((key) =>
      /^utm_/i.test(key) || /^(?:gclid|fbclid|mc_cid|mc_eid)$/i.test(key)
    );
    trackingKeys.forEach((key) => url.searchParams.delete(key));
    url.searchParams.sort();
    return url.toString();
  } catch {
    return link.trim();
  }
}

function dedupeNews(items: NewsItem[]) {
  const latestByIdentity = new Map<string, NewsItem>();
  for (const item of items) {
    const source = outletIdentityKey(item.source);
    const articleIdentity = canonicalDedupeUrl(item.link) || normalizePhrase(item.title);
    const key = `${source}|${articleIdentity}`;
    const existing = latestByIdentity.get(key);
    if (!existing || new Date(item.publishedAt).getTime() > new Date(existing.publishedAt).getTime()) {
      latestByIdentity.set(key, item);
    }
  }
  return [...latestByIdentity.values()];
}

function selectFeedWindow(candidates: NewsItem[], maxItems = 28) {
  return dedupeNews(
    candidates.filter((item) => item.title && item.link && item.publishedAt)
  )
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, maxItems);
}

function sourceForFeed(value: unknown, feed: Feed) {
  const cleaned = clean(value, 100);
  if (cleaned) return canonicalSourceName(cleaned);
  return feed.sourceType === "direct" ? canonicalSourceName(feed.name) : "Unverified source";
}

async function loadFeed(feed: Feed): Promise<{ items: NewsItem[]; health: SourceHealth }> {
  const checkedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(feed.url, {
      next: { revalidate: 900 },
      redirect: "error",
      headers: { "User-Agent": "Mozilla/5.0 MaekrakNews/7.8" },
      signal: controller.signal,
    });
    if (!response.ok) {
      return { items: [], health: { name: feed.name, ok: false, itemCount: 0, sourceType: feed.sourceType, role: feed.role, status: "http-error", checkedAt } };
    }

    const xml = await readResponseTextLimited(response);
    const data = parser.parse(xml);
    const rawItems = asArray<any>(data?.rss?.channel?.item ?? data?.feed?.entry);
    const candidates = rawItems.map((item: any) => {
      const sourceNode = item?.source;
      const sourceRaw = sourceNode?.["#text"] ?? sourceNode;
      const sourceAttributionUrl = typeof sourceNode === "object" ? sourceNode?.["@_url"] ?? "" : "";
      const claimedSource = sourceForFeed(sourceRaw, feed);
      const rawTitle = clean(item?.title, 320);
      const title = stripSourceSuffix(rawTitle, claimedSource, feed.name);
      const rawLink = typeof item?.link === "string" ? item.link : item?.link?.["@_href"] ?? item?.guid ?? "";
      const link = safeHttpUrl(rawLink);
      const source = link ? sourceForLink(claimedSource, link, feed.sourceType, sourceAttributionUrl) : claimedSource;
      const publishedAt = safePublishedAt(item?.pubDate ?? item?.published ?? item?.updated);
      const description = clean(item?.description ?? item?.summary ?? item?.content, 2400);
      const scope = inferScope(title, description, feed.scope);
      const category = inferCategory(title, description, scope === "world" ? "세계" : feed.defaultCategory);
      return {
        title,
        link,
        source,
        publishedAt,
        category,
        scope,
        description,
        sourceType: feed.sourceType,
        sourceRole: inferSourceRole(source),
      } satisfies NewsItem;
    });
    const items = selectFeedWindow(candidates);

    const latestPublishedAt = [...items]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0]?.publishedAt;

    return {
      items,
      health: {
        name: feed.name,
        ok: items.length > 0,
        itemCount: items.length,
        sourceType: feed.sourceType,
        role: feed.role,
        status: items.length > 0 ? "ok" : "empty",
        checkedAt,
        latestPublishedAt,
      },
    };
  } catch {
    return { items: [], health: { name: feed.name, ok: false, itemCount: 0, sourceType: feed.sourceType, role: feed.role, status: "fetch-error", checkedAt } };
  } finally {
    clearTimeout(timeout);
  }
}

function sourceAuthorityWeight(article: NewsItem) {
  const known = sourceWeights[article.source] ?? feedByName.get(article.source)?.weight;
  if (known !== undefined) return known;
  if (article.sourceRole === "wire") return 1.2;
  if (article.sourceRole === "broadcaster" || article.sourceRole === "international") return 0.9;
  return 0.72;
}

function verifiedSourceArticles(articles: NewsItem[]) {
  return articles.filter((article) => canonicalSourceName(article.source) !== "Unverified source");
}

function rankingSignalArticles(articles: NewsItem[]) {
  const verified = verifiedSourceArticles(articles);
  return verified.length ? verified : articles;
}

function verifiedSourceCount(articles: NewsItem[]) {
  return new Set(verifiedSourceArticles(articles).map((article) => outletIdentityKey(article.source))).size;
}

function importanceFor(articles: NewsItem[]) {
  const now = Date.now();
  const verified = verifiedSourceArticles(articles);
  const signalArticles = verified.length ? verified : articles;
  const sources = new Set(verified.map((article) => outletIdentityKey(article.source)));
  const roles = new Set(verified.map((article) => article.sourceRole));
  const validTimes = signalArticles.map((article) => new Date(article.publishedAt).getTime()).filter(Number.isFinite);
  const newest = validTimes.length ? Math.max(...validTimes) : now - 86_400_000;
  const ageHours = Math.max(0, (now - newest) / 3_600_000);
  const recency = Math.max(0, 2.4 - ageHours / 12);
  const diversity = Math.min(4, sources.size) * 1.05;
  const roleDiversity = Math.min(3, roles.size) * 0.6;
  const sourceAuthority = verified.length ? Math.max(...verified.map(sourceAuthorityWeight)) : 0.45;
  const text = signalArticles.map((article) => `${article.title} ${article.description}`).join(" ");
  const impact = isHighImpact(text) ? 2.0 : structuralImpactPattern.test(text) ? 1.25 : 0;
  const softNewsPenalty = softNewsPattern.test(text) && !structuralImpactPattern.test(text) && !isHighImpact(text) ? 1.8 : 0;
  const crossScope = new Set(signalArticles.map((article) => article.scope)).size > 1 ? 0.65 : 0;
  const directSignal = verified.some((article) => article.sourceType === "direct") ? 0.45 : 0;
  const singleSourcePenalty = sources.size <= 1 ? 1.6 : 0;
  const aggregatedOnlyPenalty = sources.size <= 1 && signalArticles.every((article) => article.sourceType === "aggregated") ? 0.45 : 0;
  const score = diversity + roleDiversity + sourceAuthority + recency + impact + crossScope + directSignal - singleSourcePenalty - aggregatedOnlyPenalty - softNewsPenalty;
  return Math.round(Math.max(0, score) * 100) / 100;
}

function selectionReasons(articles: NewsItem[], score: number) {
  const reasons: string[] = [];
  const verified = verifiedSourceArticles(articles);
  const signalArticles = verified.length ? verified : articles;
  const sources = new Set(verified.map((article) => outletIdentityKey(article.source)));
  const roles = new Set(verified.map((article) => article.sourceRole));
  const text = signalArticles.map((article) => `${article.title} ${article.description}`).join(" ");
  if (sources.size >= 3) reasons.push("여러 매체에서 동시 보도");
  if (roles.has("wire")) reasons.push("통신사 보도 포함");
  if (roles.size >= 2) reasons.push("서로 다른 유형의 출처");
  if (isHighImpact(text)) reasons.push("정책·안보·재난 등 영향도가 큰 주제");
  else if (structuralImpactPattern.test(text)) reasons.push("제도·생활에 이어질 구조적 이슈");
  if (score >= 7 && reasons.length === 0 && sources.size > 0) reasons.push("최신성과 보도량을 함께 반영");
  return reasons.slice(0, 3);
}

function briefWhyFor(category: NewsCategory, articles: NewsItem[]): BriefWhyCode {
  const text = rankingSignalArticles(articles).map((article) => `${article.title} ${article.description}`).join(" ");
  if (/전쟁|공격|미사일|핵|휴전|제재|\b(?:war|attack|missiles?|nuclear|ceasefire|sanctions?)\b/i.test(text)) return "security";
  if (category === "정치" || /선거|대통령|총리|국회|개혁|\b(?:election|president|prime minister|parliament|reform)\b/i.test(text)) return "politics";
  if (category === "경제") return "economy";
  if (category === "재난") return "disaster";
  if (category === "기술") return "technology";
  if (category === "사회") return "society";
  return "broad-impact";
}

function briefWatchFor(articles: NewsItem[]): BriefWatchCode {
  const verified = verifiedSourceArticles(articles);
  const text = rankingSignalArticles(articles).map((article) => `${article.title} ${article.description}`).join(" ");
  const sources = new Set(verified.map((article) => outletIdentityKey(article.source)));
  if (sources.size <= 1) return "single-source";
  if (uncertaintyPattern.test(text)) return "uncertain";
  if (claimPattern.test(text)) return "claim-heavy";
  if (sources.size >= 3) return "multi-source";
  return "follow-up";
}

function majority<T extends string>(values: T[], fallback: T): T {
  const counts = new Map<T, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? fallback;
}
function sourceBalancedMajority<T extends string>(articles: NewsItem[], select: (article: NewsItem) => T, fallback: T): T {
  const bySource = new Map<string, T[]>();
  const verified = verifiedSourceArticles(articles);
  const votingArticles = verified.length ? verified : articles;
  for (const article of votingArticles) {
    const source = outletIdentityKey(article.source);
    const values = bySource.get(source) ?? [];
    values.push(select(article));
    bySource.set(source, values);
  }
  const sourceVotes = [...bySource.values()].map((values) => majority(values, fallback));
  const counts = new Map<T, number>();
  sourceVotes.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => {
    const delta = b[1] - a[1];
    if (delta) return delta;
    if (a[0] === fallback) return -1;
    if (b[0] === fallback) return 1;
    return 0;
  })[0]?.[0] ?? fallback;
}

function selectPriorityEventIds(events: NewsEvent[], limit = 5) {
  const eligibleEvents = events.filter((event) => event.sourceCount > 0);
  const selected = eligibleEvents.slice(0, limit);
  if (!selected.length) return [];

  const ensureScope = (scope: NewsScope) => {
    if (selected.some((event) => event.scope === scope)) return;
    const candidate = eligibleEvents.find((event) => event.scope === scope && !selected.some((item) => item.id === event.id));
    if (!candidate) return;
    const lowestIndex = selected.reduce((lowest, event, index) => event.importanceScore < selected[lowest].importanceScore ? index : lowest, 0);
    const lowest = selected[lowestIndex];
    if (candidate.importanceScore >= lowest.importanceScore * 0.75) selected[lowestIndex] = candidate;
  };

  ensureScope("domestic");
  ensureScope("world");
  return [...new Map(selected.map((event) => [event.id, event])).values()]
    .sort((a, b) => b.importanceScore - a.importanceScore)
    .slice(0, limit)
    .map((event) => event.id);
}

function clusterNewsItems(items: NewsItem[]) {
  const verifiedItems = verifiedSourceArticles(items);
  const unverifiedItems = items.filter((item) => canonicalSourceName(item.source) === "Unverified source");
  const verifiedClusters: NewsItem[][] = [];

  for (const item of verifiedItems) {
    const match = verifiedClusters.find((cluster) => cluster.length > 0 && cluster.every((member) => sameEvent(member, item)));
    if (match) match.push(item);
    else verifiedClusters.push([item]);
  }

  const unverifiedOnlyClusters: NewsItem[][] = [];
  for (const item of unverifiedItems) {
    const verifiedMatch = verifiedClusters.find((cluster) => {
      const trustedMembers = verifiedSourceArticles(cluster);
      return trustedMembers.length > 0 && trustedMembers.every((member) => sameEvent(member, item));
    });
    if (verifiedMatch) {
      verifiedMatch.push(item);
      continue;
    }

    const unverifiedMatch = unverifiedOnlyClusters.find((cluster) => cluster.length > 0 && cluster.every((member) => sameEvent(member, item)));
    if (unverifiedMatch) unverifiedMatch.push(item);
    else unverifiedOnlyClusters.push([item]);
  }

  return [...verifiedClusters, ...unverifiedOnlyClusters];
}

export function getDisplayArticle(event: NewsEvent, lang: "ko" | "en") {
  const wantsKorean = lang === "ko";
  const verified = verifiedSourceArticles(event.articles);
  const candidates = verified.length ? verified : event.articles;
  const scored = candidates.map((article) => {
    const titleHasHangul = /[가-힣]/.test(article.title);
    const languageScore = wantsKorean ? (titleHasHangul ? 4 : 0) : (!titleHasHangul ? 4 : 0);
    const roleScore = article.sourceRole === "wire" ? 1.4 : article.sourceType === "direct" ? 1 : 0.4;
    const ageHours = Math.max(0, (Date.now() - new Date(article.publishedAt).getTime()) / 3_600_000);
    const recencyScore = Number.isFinite(ageHours) ? Math.max(0, 3 - ageHours / 8) : 0;
    const descriptionScore = article.description.length >= 60 ? 0.5 : 0;
    return { article, score: languageScore + roleScore + recencyScore + descriptionScore };
  });
  return scored.sort((a, b) => b.score - a.score)[0]?.article ?? event.articles[0];
}

function categoryCoverageFor(events: NewsEvent[]): Record<NewsCategory, number> {
  const verifiedEvents = events.filter((event) => event.sourceCount > 0);
  return {
    국내: verifiedEvents.filter((event) => event.scope === "domestic").length,
    세계: verifiedEvents.filter((event) => event.scope === "world").length,
    정치: verifiedEvents.filter((event) => event.category === "정치").length,
    사회: verifiedEvents.filter((event) => event.category === "사회").length,
    경제: verifiedEvents.filter((event) => event.category === "경제").length,
    기술: verifiedEvents.filter((event) => event.category === "기술").length,
    재난: verifiedEvents.filter((event) => event.category === "재난").length,
  };
}

export async function getBriefing(): Promise<Briefing> {
  const loaded = await Promise.all(feeds.map(loadFeed));
  const sourceHealth = loaded.map((result) => result.health);
  const allNews = dedupeNews(loaded.flatMap((result) => result.items))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const news = allNews
    .filter((item) => isTodayKst(item.publishedAt) || isOngoingCandidate(item))
    .slice(0, 260);
  const clusters = clusterNewsItems(news);

  const events = clusters.map((articles) => {
    const sorted = [...articles].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const signalPool = rankingSignalArticles(sorted);
    const primary = signalPool.find((article) => article.sourceRole === "wire")
      ?? signalPool.find((article) => article.sourceType === "direct")
      ?? signalPool[0]
      ?? sorted[0];
    const sourceCount = verifiedSourceCount(sorted);
    const category = sourceBalancedMajority(sorted, (article) => article.category, primary.category);
    const scope = sourceBalancedMajority(sorted, (article) => article.scope, primary.scope);
    const importanceScore = importanceFor(sorted);
    return {
      id: stableEventId(sorted),
      title: primary.title,
      category,
      scope,
      summary: primary.description,
      publishedAt: sorted[0].publishedAt,
      dayStatus: sorted.some((article) => isTodayKst(article.publishedAt)) ? "today" : "ongoing",
      articles: sorted,
      sourceCount,
      importanceScore,
      whySelected: selectionReasons(sorted, importanceScore),
      briefWhy: briefWhyFor(category, sorted),
      briefWatch: briefWatchFor(sorted),
    } satisfies NewsEvent;
  }).sort((a, b) => {
    if (b.importanceScore !== a.importanceScore) return b.importanceScore - a.importanceScore;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  }).slice(0, 30);

  const categoryCoverage = categoryCoverageFor(events);

  return {
    news,
    events,
    priorityEventIds: selectPriorityEventIds(events),
    sourceHealth,
    healthySources: sourceHealth.filter((source) => source.ok).length,
    totalSources: sourceHealth.length,
    categoryCoverage,
  };
}

export async function getNews(): Promise<NewsItem[]> {
  return (await getBriefing()).news;
}

export async function getEvents(): Promise<NewsEvent[]> {
  return (await getBriefing()).events;
}

export const __test = {
  canonicalSourceName,
  clean,
  decodeEntities,
  safeHttpUrl,
  safePublishedAt,
  sourceForFeed,
  sourceForLink,
  inferScope,
  inferCategory,
  inferSourceRole,
  isHighImpact,
  briefWatchFor,
  normalizedEntities,
  hasMutuallyExclusiveEntityConflict,
  properNameTokens,
  hasProperNameConflict,
  sameEvent,
  clusterNewsItems,
  categoryCoverageFor,
  selectPriorityEventIds,
  canonicalDedupeUrl,
  dedupeNews,
  selectFeedWindow,
  stableEventId,
  sourceBalancedMajority,
  verifiedSourceArticles,
  verifiedSourceCount,
  importanceFor,
  selectionReasons,
};