import { XMLParser } from "fast-xml-parser";
import { canonicalSourceName } from "@/lib/source-normalize";

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
  "Associated Press": 1.3,
  "AP News": 1.3,
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
const parser = new XMLParser({ ignoreAttributes: false });
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
  korea: ["south korea", "korea", "한국", "대한민국"],
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
  attack: ["attack", "strike", "bomb", "missile", "공격", "공습", "폭격", "미사일"],
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
  labor: ["wage", "labor", "strike", "임금", "노동", "파업"],
  visa: ["visa", "h-1b", "h1b", "비자"],
  disaster: ["earthquake", "flood", "wildfire", "typhoon", "지진", "홍수", "산불", "태풍", "호우"],
  death: ["dies", "dead", "killed", "death", "사망", "숨져"],
  launch: ["launch", "release", "발표", "출시", "공개"],
};

const topicRules: Array<{ category: NewsCategory; pattern: RegExp }> = [
  { category: "재난", pattern: /태풍|호우|폭우|홍수|산불|지진|폭염|한파|재난|typhoon|flood|wildfire|earthquake|storm|heatwave/i },
  { category: "기술", pattern: /인공지능|반도체|칩|\bai\b|artificial intelligence|semiconductor|chip|openai|nvidia|apple|google|microsoft/i },
  { category: "경제", pattern: /금리|환율|물가|증시|주가|관세|무역|경제|은행|재정|예산|임금|inflation|interest rate|rate cut|rate hike|tariff|market|stocks|economy|bank|budget|wage/i },
  { category: "정치", pattern: /대통령|총리|국회|의회|선거|탄핵|정당|장관|외교|개혁|president|prime minister|parliament|congress|election|impeachment|minister|diplomacy|reform/i },
  { category: "사회", pattern: /사건|사고|범죄|수사|검찰|경찰|교육|의료|병원|노동|주거|주택|crime|police|prosecut|education|healthcare|hospital|labor|housing/i },
];

const highImpactPattern = /전쟁|공격|미사일|핵|휴전|계엄|탄핵|선거|대통령|총리|붕괴|지진|태풍|홍수|산불|금리|관세|제재|war|attack|missile|nuclear|ceasefire|election|president|prime minister|earthquake|typhoon|flood|wildfire|interest rate|tariff|sanction/i;
const leaderDeathPattern = /(?:대통령|총리|국왕|교황).{0,35}(?:사망|숨져)|(?:사망|숨져).{0,35}(?:대통령|총리|국왕|교황)|(?:president|prime minister|king|pope).{0,35}(?:dies|dead|death)|(?:dies|dead|death).{0,35}(?:president|prime minister|king|pope)/i;
const softNewsPattern = /연예|가수|배우|콘서트|앨범|스포츠|축구|야구|농구|celebrity|singer|actor|actress|concert|album|country music|football|baseball|basketball/i;
const structuralImpactPattern = /경찰 개혁|검찰 개혁|재정|예산|주택 공급|부동산|출생|인구|반도체|police reform|prosecution reform|budget|housing supply|birth|population|semiconductor/i;
const uncertaintyPattern = /추정|잠정|확인 중|미확인|알려졌|보인다|가능성|reportedly|unconfirmed|appears?|likely|estimated|may|might|could/i;
const claimPattern = /말했|밝혔|주장|반박|촉구|경고|전망|예상|계획|검토|시사|says?|said|claims?|alleges?|warns?|expects?|plans?/i;
const worldSignals = /미국|중국|일본|러시아|우크라이나|이란|이스라엘|팔레스타인|가자|캐나다|유럽|나토|호르무즈|united states|china|japan|russia|ukraine|iran|israel|palestin|gaza|canada|europe|nato|hormuz/i;
const domesticSignals = /한국|대한민국|서울|부산|제주|국회|청와대|이재명|코스피|korea|seoul|busan|jeju|lee jae myung|kospi/i;

function isHighImpact(text: string) {
  return highImpactPattern.test(text) || leaderDeathPattern.test(text);
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
  return decodeEntities(String(value ?? ""))
    .replace(/<[^>]*>/g, " ")
    .replace(/^[▲△▶►◆■●]\s*/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeHttpUrl(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function safePublishedAt(value: unknown, now = Date.now()) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  const time = parsed.getTime();
  if (!Number.isFinite(time)) return "";
  if (time > now + 20 * 60_000) return "";
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
  const value = source.toLowerCase();
  if (/reuters|associated press|\bap news\b|^ap$|연합뉴스|yonhap|afp|agence france/i.test(value)) return "wire";
  if (/kbs|mbc|sbs|jtbc|ytn|채널a|tv조선/i.test(value)) return "broadcaster";
  if (/bbc|cnn|dw|al jazeera|nhk|guardian|new york times|washington post|financial times|bloomberg/i.test(value)) return "international";
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
  return topicRules.find((rule) => rule.pattern.test(text))?.category ?? fallback;
}

function normalizePhrase(text: string) {
  return ` ${text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim()} `;
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
  return normalizedConcepts(text, entityAliases);
}

function normalizedActions(text: string) {
  return normalizedConcepts(text, actionAliases);
}

function tokens(text: string) {
  return new Set(
    clean(text).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/)
      .filter((word) => word.length >= 2 && !stopwords.has(word))
  );
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

function sameEvent(a: NewsItem, b: NewsItem) {
  const lexical = titleSimilarity(a.title, b.title);
  const entities = entitySimilarity(a.title, b.title);
  const actions = actionSimilarity(a.title, b.title);
  const hours = timeDistanceHours(a.publishedAt, b.publishedAt);

  if (hours > 30) return false;
  if (lexical >= 0.74 && hours <= 24) return true;
  if (lexical >= 0.58 && entities > 0 && actions > 0 && hours <= 18) return true;
  if (entities >= 0.67 && actions >= 0.5 && lexical >= 0.42 && hours <= 12) return true;
  if (entities === 1 && normalizedEntities(a.title).size >= 2 && normalizedEntities(b.title).size >= 2 && actions === 1 && lexical >= 0.5 && hours <= 6) return true;
  return false;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function stableEventId(articles: NewsItem[]) {
  const earliest = [...articles].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())[0];
  const anchor = earliest?.title ?? articles[0]?.title ?? "event";
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

function dedupeNews(items: NewsItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${canonicalSourceName(item.source).toLowerCase()}|${normalizePhrase(item.title)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function loadFeed(feed: Feed): Promise<{ items: NewsItem[]; health: SourceHealth }> {
  const checkedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(feed.url, {
      next: { revalidate: 900 },
      headers: { "User-Agent": "Mozilla/5.0 MaekrakNews/7.4" },
      signal: controller.signal,
    });
    if (!response.ok) {
      return { items: [], health: { name: feed.name, ok: false, itemCount: 0, sourceType: feed.sourceType, role: feed.role, status: "http-error", checkedAt } };
    }

    const xml = await readResponseTextLimited(response);
    const data = parser.parse(xml);
    const rawItems = asArray<any>(data?.rss?.channel?.item ?? data?.feed?.entry);
    const items = rawItems.slice(0, 28).map((item: any) => {
      const sourceRaw = clean(item?.source?.["#text"] ?? item?.source ?? feed.name, 100) || feed.name;
      const source = canonicalSourceName(sourceRaw);
      const rawTitle = clean(item?.title, 320);
      const title = stripSourceSuffix(rawTitle, source, feed.name);
      const rawLink = typeof item?.link === "string" ? item.link : item?.link?.["@_href"] ?? item?.guid ?? "";
      const link = safeHttpUrl(rawLink);
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
    }).filter((item: NewsItem) => item.title && item.link && item.publishedAt);

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

function importanceFor(articles: NewsItem[]) {
  const now = Date.now();
  const sources = new Set(articles.map((article) => canonicalSourceName(article.source)));
  const roles = new Set(articles.map((article) => article.sourceRole));
  const validTimes = articles.map((article) => new Date(article.publishedAt).getTime()).filter(Number.isFinite);
  const newest = validTimes.length ? Math.max(...validTimes) : now - 86_400_000;
  const ageHours = Math.max(0, (now - newest) / 3_600_000);
  const recency = Math.max(0, 2.4 - ageHours / 12);
  const diversity = Math.min(4, sources.size) * 1.05;
  const roleDiversity = Math.min(3, roles.size) * 0.6;
  const sourceAuthority = Math.max(...articles.map(sourceAuthorityWeight));
  const text = articles.map((article) => `${article.title} ${article.description}`).join(" ");
  const impact = isHighImpact(text) ? 2.0 : structuralImpactPattern.test(text) ? 1.25 : 0;
  const softNewsPenalty = softNewsPattern.test(text) && !structuralImpactPattern.test(text) && !isHighImpact(text) ? 1.8 : 0;
  const crossScope = new Set(articles.map((article) => article.scope)).size > 1 ? 0.65 : 0;
  const directSignal = articles.some((article) => article.sourceType === "direct") ? 0.45 : 0;
  const singleSourcePenalty = sources.size === 1 ? 1.6 : 0;
  const aggregatedOnlyPenalty = sources.size === 1 && articles.every((article) => article.sourceType === "aggregated") ? 0.45 : 0;
  const score = diversity + roleDiversity + sourceAuthority + recency + impact + crossScope + directSignal - singleSourcePenalty - aggregatedOnlyPenalty - softNewsPenalty;
  return Math.round(Math.max(0, score) * 100) / 100;
}

function selectionReasons(articles: NewsItem[], score: number) {
  const reasons: string[] = [];
  const sources = new Set(articles.map((article) => canonicalSourceName(article.source)));
  const roles = new Set(articles.map((article) => article.sourceRole));
  const text = articles.map((article) => `${article.title} ${article.description}`).join(" ");
  if (sources.size >= 3) reasons.push("여러 매체에서 동시 보도");
  if (roles.has("wire")) reasons.push("통신사 보도 포함");
  if (roles.size >= 2) reasons.push("서로 다른 유형의 출처");
  if (isHighImpact(text)) reasons.push("정책·안보·재난 등 영향도가 큰 주제");
  else if (structuralImpactPattern.test(text)) reasons.push("제도·생활에 이어질 구조적 이슈");
  if (score >= 7 && reasons.length === 0) reasons.push("최신성과 보도량을 함께 반영");
  return reasons.slice(0, 3);
}

function briefWhyFor(category: NewsCategory, articles: NewsItem[]): BriefWhyCode {
  const text = articles.map((article) => `${article.title} ${article.description}`).join(" ");
  if (/전쟁|공격|미사일|핵|휴전|제재|war|attack|missile|nuclear|ceasefire|sanction/i.test(text)) return "security";
  if (category === "정치" || /선거|대통령|총리|국회|개혁|election|president|prime minister|parliament|reform/i.test(text)) return "politics";
  if (category === "경제") return "economy";
  if (category === "재난") return "disaster";
  if (category === "기술") return "technology";
  if (category === "사회") return "society";
  return "broad-impact";
}

function briefWatchFor(articles: NewsItem[]): BriefWatchCode {
  const text = articles.map((article) => `${article.title} ${article.description}`).join(" ");
  const sources = new Set(articles.map((article) => canonicalSourceName(article.source)));
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

function selectPriorityEventIds(events: NewsEvent[], limit = 5) {
  const selected = events.slice(0, limit);
  if (!selected.length) return [];

  const ensureScope = (scope: NewsScope) => {
    if (selected.some((event) => event.scope === scope)) return;
    const candidate = events.find((event) => event.scope === scope && !selected.some((item) => item.id === event.id));
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

export function getDisplayArticle(event: NewsEvent, lang: "ko" | "en") {
  const wantsKorean = lang === "ko";
  const scored = event.articles.map((article) => {
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

export async function getBriefing(): Promise<Briefing> {
  const loaded = await Promise.all(feeds.map(loadFeed));
  const sourceHealth = loaded.map((result) => result.health);
  const allNews = dedupeNews(loaded.flatMap((result) => result.items))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const news = allNews
    .filter((item) => isTodayKst(item.publishedAt) || isOngoingCandidate(item))
    .slice(0, 260);

  const clusters: NewsItem[][] = [];
  for (const item of news) {
    const match = clusters.find((cluster) => cluster.length > 0 && sameEvent(cluster[0], item));
    if (match) match.push(item);
    else clusters.push([item]);
  }

  const events = clusters.map((articles) => {
    const sorted = [...articles].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const primary = sorted.find((article) => article.sourceRole === "wire")
      ?? sorted.find((article) => article.sourceType === "direct")
      ?? sorted[0];
    const sources = new Set(sorted.map((article) => canonicalSourceName(article.source)));
    const category = majority(sorted.map((article) => article.category), primary.category);
    const scope = majority(sorted.map((article) => article.scope), primary.scope);
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
      sourceCount: sources.size,
      importanceScore,
      whySelected: selectionReasons(sorted, importanceScore),
      briefWhy: briefWhyFor(category, sorted),
      briefWatch: briefWatchFor(sorted),
    } satisfies NewsEvent;
  }).sort((a, b) => {
    if (b.importanceScore !== a.importanceScore) return b.importanceScore - a.importanceScore;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  }).slice(0, 30);

  const categoryCoverage: Record<NewsCategory, number> = {
    국내: events.filter((event) => event.scope === "domestic").length,
    세계: events.filter((event) => event.scope === "world").length,
    정치: events.filter((event) => event.category === "정치").length,
    사회: events.filter((event) => event.category === "사회").length,
    경제: events.filter((event) => event.category === "경제").length,
    기술: events.filter((event) => event.category === "기술").length,
    재난: events.filter((event) => event.category === "재난").length,
  };

  return {
    events,
    priorityEventIds: selectPriorityEventIds(events),
    sourceHealth,
    healthySources: sourceHealth.filter((source) => source.ok).length,
    totalSources: sourceHealth.length,
    categoryCoverage,
  };
}

export async function getNews(): Promise<NewsItem[]> {
  const loaded = await Promise.all(feeds.map(loadFeed));
  return dedupeNews(loaded.flatMap((result) => result.items))
    .filter((item) => isTodayKst(item.publishedAt) || isOngoingCandidate(item))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 260);
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
  sameEvent,
};
