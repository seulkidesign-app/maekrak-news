import { XMLParser } from "fast-xml-parser";

export type NewsCategory = "국내" | "세계" | "정치" | "사회" | "경제" | "기술" | "재난";
export type NewsScope = "domestic" | "world";
export type SourceRole = "broadcaster" | "wire" | "international";
export type HealthStatus = "ok" | "http-error" | "empty" | "fetch-error";
export type BriefWhyCode = "security" | "politics" | "economy" | "disaster" | "technology" | "society" | "broad-impact";
export type BriefWatchCode = "single-source" | "uncertain" | "claim-heavy" | "multi-source" | "follow-up";

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
};

export type NewsEvent = {
  id: string;
  title: string;
  category: NewsCategory;
  scope: NewsScope;
  summary: string;
  publishedAt: string;
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

const googleNews = (query: string, locale: "ko" | "en") => {
  if (locale === "ko") {
    return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR%3Ako`;
  }
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US%3Aen`;
};

const feeds: Feed[] = [
  { name: "SBS", role: "broadcaster", weight: 1.0, defaultCategory: "국내", scope: "domestic", sourceType: "direct", url: "https://news.sbs.co.kr/news/newsflashRssFeed.do?plink=RSSREADER" },
  { name: "BBC", role: "international", weight: 1.15, defaultCategory: "세계", scope: "world", sourceType: "direct", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "KBS", role: "broadcaster", weight: 1.1, defaultCategory: "국내", scope: "domestic", sourceType: "aggregated", url: googleNews("site:news.kbs.co.kr", "ko") },
  { name: "MBC", role: "broadcaster", weight: 1.0, defaultCategory: "국내", scope: "domestic", sourceType: "aggregated", url: googleNews("site:imnews.imbc.com", "ko") },
  { name: "연합뉴스", role: "wire", weight: 1.25, defaultCategory: "국내", scope: "domestic", sourceType: "aggregated", url: googleNews("site:yna.co.kr", "ko") },
  { name: "Reuters", role: "wire", weight: 1.35, defaultCategory: "세계", scope: "world", sourceType: "aggregated", url: googleNews("site:reuters.com", "en") },
  { name: "AP", role: "wire", weight: 1.3, defaultCategory: "세계", scope: "world", sourceType: "aggregated", url: googleNews("site:apnews.com", "en") },
  { name: "CNN", role: "international", weight: 1.0, defaultCategory: "세계", scope: "world", sourceType: "aggregated", url: googleNews("site:cnn.com", "en") },
  { name: "DW", role: "international", weight: 0.95, defaultCategory: "세계", scope: "world", sourceType: "aggregated", url: googleNews("site:dw.com", "en") },
  { name: "Al Jazeera", role: "international", weight: 1.0, defaultCategory: "세계", scope: "world", sourceType: "aggregated", url: googleNews("site:aljazeera.com", "en") },
  { name: "NHK", role: "international", weight: 0.95, defaultCategory: "세계", scope: "world", sourceType: "aggregated", url: googleNews("site:www3.nhk.or.jp", "en") },
];

const feedByName = new Map(feeds.map((feed) => [feed.name, feed]));
const parser = new XMLParser({ ignoreAttributes: false });
const stopwords = new Set([
  "속보", "단독", "영상", "뉴스", "today", "live", "says", "said", "after", "with", "from", "that", "this", "대한", "관련", "오늘", "정부",
  "new", "latest", "breaking", "report", "reports", "update", "업데이트",
]);

const entityAliases: Record<string, string[]> = {
  israel: ["israel", "israeli", "이스라엘"],
  palestine: ["palestine", "palestinian", "gaza", "west bank", "팔레스타인", "가자", "서안"],
  ukraine: ["ukraine", "ukrainian", "우크라이나"],
  russia: ["russia", "russian", "러시아"],
  china: ["china", "chinese", "중국"],
  us: ["united states", "u.s.", "u.s ", "america", "미국"],
  korea: ["south korea", "korea", "한국", "대한민국"],
  northkorea: ["north korea", "dprk", "북한"],
  japan: ["japan", "japanese", "일본"],
  trump: ["trump", "트럼프"],
  fed: ["federal reserve", "fed", "fomc", "연준"],
  nato: ["nato", "나토", "북대서양조약기구"],
  eu: ["european union", " eu ", "유럽연합"],
  tariffs: ["tariff", "tariffs", "관세"],
  ceasefire: ["ceasefire", "truce", "휴전"],
};

const actionAliases: Record<string, string[]> = {
  attack: ["attack", "strike", "bomb", "missile", "공격", "공습", "폭격", "미사일"],
  ceasefire: ["ceasefire", "truce", "휴전"],
  tariff: ["tariff", "trade duty", "관세"],
  sanction: ["sanction", "제재"],
  election: ["election", "vote", "선거", "투표"],
  rate: ["interest rate", "rate cut", "rate hike", "금리", "기준금리"],
  summit: ["summit", "meeting", "talks", "회담", "정상회담", "협상"],
  law: ["law", "bill", "court", "법안", "법원", "판결"],
  disaster: ["earthquake", "flood", "wildfire", "typhoon", "지진", "홍수", "산불", "태풍", "호우"],
  death: ["dies", "dead", "killed", "death", "사망", "숨져"],
  launch: ["launch", "release", "발표", "출시", "공개"],
};

const topicRules: Array<{ category: NewsCategory; pattern: RegExp }> = [
  { category: "재난", pattern: /태풍|호우|폭우|홍수|산불|지진|폭염|한파|재난|typhoon|flood|wildfire|earthquake|storm|heatwave/i },
  { category: "기술", pattern: /인공지능|반도체|칩|ai\b|artificial intelligence|semiconductor|chip|openai|nvidia|apple|google|microsoft/i },
  { category: "경제", pattern: /금리|환율|물가|증시|주가|관세|무역|경제|은행|inflation|interest rate|rate cut|rate hike|tariff|market|stocks|economy|bank/i },
  { category: "정치", pattern: /대통령|총리|국회|의회|선거|탄핵|정당|장관|외교|president|prime minister|parliament|congress|election|impeachment|minister|diplomacy/i },
  { category: "사회", pattern: /사건|사고|범죄|수사|검찰|경찰|교육|의료|병원|노동|주거|crime|police|prosecut|education|healthcare|hospital|labor|housing/i },
];

const highImpactPatterns = [
  /전쟁|공격|미사일|핵|휴전|계엄|탄핵|선거|대통령|총리|사망|붕괴|지진|태풍|홍수|산불|금리|관세|제재|war|attack|missile|nuclear|ceasefire|election|president|prime minister|earthquake|typhoon|flood|wildfire|interest rate|tariff|sanction/i,
];
const uncertaintyPattern = /추정|잠정|확인 중|미확인|알려졌|보인다|가능성|reportedly|unconfirmed|appears?|likely|estimated|may|might|could/i;
const claimPattern = /말했|밝혔|주장|반박|촉구|경고|전망|예상|계획|검토|시사|says?|said|claims?|alleges?|warns?|expects?|plans?/i;

function clean(value: unknown) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function inferCategory(title: string, description: string, fallback: NewsCategory): NewsCategory {
  const text = `${title} ${description}`;
  const matched = topicRules.find((rule) => rule.pattern.test(text));
  return matched?.category ?? fallback;
}

function normalizedConcepts(text: string, aliases: Record<string, string[]>) {
  const normalized = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}.\s-]/gu, " ").replace(/\s+/g, " ")} `;
  const found = new Set<string>();
  Object.entries(aliases).forEach(([concept, variants]) => {
    if (variants.some((variant) => normalized.includes(variant.toLowerCase()))) found.add(concept);
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
    text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/)
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

  if (hours > 72) return false;
  if (lexical >= 0.52 && hours <= 48) return true;
  if (entities >= 0.67 && actions >= 0.5 && hours <= 36) return true;
  if (entities === 1 && normalizedEntities(a.title).size >= 2 && normalizedEntities(b.title).size >= 2 && actions > 0 && hours <= 18) return true;
  return false;
}

async function loadFeed(feed: Feed): Promise<{ items: NewsItem[]; health: SourceHealth }> {
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(feed.url, {
      next: { revalidate: 900 },
      headers: { "User-Agent": "Mozilla/5.0 MaekrakNews/3.0" },
    });
    if (!response.ok) {
      return { items: [], health: { name: feed.name, ok: false, itemCount: 0, sourceType: feed.sourceType, role: feed.role, status: "http-error", checkedAt } };
    }

    const xml = await response.text();
    const data = parser.parse(xml);
    const rawItems = asArray<any>(data?.rss?.channel?.item ?? data?.feed?.entry);
    const items = rawItems.slice(0, 24).map((item: any) => {
      const source = clean(item?.source?.["#text"] ?? item?.source ?? feed.name);
      const link = typeof item?.link === "string" ? item.link : item?.link?.["@_href"] ?? item?.guid ?? "#";
      const publishedAt = item?.pubDate ?? item?.published ?? item?.updated ?? new Date().toISOString();
      const title = clean(item?.title);
      const description = clean(item?.description ?? item?.summary ?? item?.content);
      return {
        title,
        link: String(link),
        source: source || feed.name,
        publishedAt: String(publishedAt),
        category: inferCategory(title, description, feed.defaultCategory),
        scope: feed.scope,
        description,
        sourceType: feed.sourceType,
        sourceRole: feed.role,
      } satisfies NewsItem;
    }).filter((item: NewsItem) => item.title && item.link !== "#");

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
      },
    };
  } catch {
    return { items: [], health: { name: feed.name, ok: false, itemCount: 0, sourceType: feed.sourceType, role: feed.role, status: "fetch-error", checkedAt } };
  }
}

function importanceFor(articles: NewsItem[]) {
  const now = Date.now();
  const sources = new Set(articles.map((article) => article.source));
  const roles = new Set(articles.map((article) => article.sourceRole));
  const validTimes = articles.map((article) => new Date(article.publishedAt).getTime()).filter(Number.isFinite);
  const newest = validTimes.length ? Math.max(...validTimes) : now - 86_400_000;
  const ageHours = Math.max(0, (now - newest) / 3_600_000);
  const recency = Math.max(0, 2.4 - ageHours / 12);
  const diversity = Math.min(4, sources.size) * 1.15;
  const roleDiversity = Math.min(3, roles.size) * 0.65;
  const sourceAuthority = Math.max(...articles.map((article) => feedByName.get(article.source)?.weight ?? (article.sourceRole === "wire" ? 1.2 : 0.9)));
  const impactText = articles.map((article) => `${article.title} ${article.description}`).join(" ");
  const impact = highImpactPatterns.some((pattern) => pattern.test(impactText)) ? 2.1 : 0;
  const crossScope = new Set(articles.map((article) => article.scope)).size > 1 ? 0.8 : 0;
  return Math.round((diversity + roleDiversity + sourceAuthority + recency + impact + crossScope) * 100) / 100;
}

function selectionReasons(articles: NewsItem[], score: number) {
  const reasons: string[] = [];
  const sources = new Set(articles.map((article) => article.source));
  const roles = new Set(articles.map((article) => article.sourceRole));
  const text = articles.map((article) => `${article.title} ${article.description}`).join(" ");
  if (sources.size >= 3) reasons.push("여러 출처에서 동시 보도");
  if (roles.has("wire")) reasons.push("통신사 보도 포함");
  if (roles.size >= 2) reasons.push("서로 다른 유형의 출처");
  if (highImpactPatterns.some((pattern) => pattern.test(text))) reasons.push("정책·안보·재난 등 영향도가 큰 주제");
  if (score >= 7 && reasons.length === 0) reasons.push("최신성과 보도량을 함께 반영");
  return reasons.slice(0, 3);
}

function briefWhyFor(category: NewsCategory, articles: NewsItem[]): BriefWhyCode {
  const text = articles.map((article) => `${article.title} ${article.description}`).join(" ");
  if (/전쟁|공격|미사일|핵|휴전|제재|war|attack|missile|nuclear|ceasefire|sanction/i.test(text)) return "security";
  if (category === "정치" || /선거|대통령|총리|국회|election|president|prime minister|parliament/i.test(text)) return "politics";
  if (category === "경제") return "economy";
  if (category === "재난") return "disaster";
  if (category === "기술") return "technology";
  if (category === "사회") return "society";
  return "broad-impact";
}

function briefWatchFor(articles: NewsItem[]): BriefWatchCode {
  const text = articles.map((article) => `${article.title} ${article.description}`).join(" ");
  const sources = new Set(articles.map((article) => article.source));
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
  const selected: NewsEvent[] = [];
  const add = (event?: NewsEvent) => {
    if (event && !selected.some((item) => item.id === event.id) && selected.length < limit) selected.push(event);
  };

  add(events[0]);
  add(events.find((event) => event.scope === "domestic"));
  add(events.find((event) => event.scope === "world"));
  add(events.find((event) => event.category === "경제"));
  add(events.find((event) => ["정치", "재난", "기술", "사회"].includes(event.category)));
  events.forEach(add);
  return selected.slice(0, limit).map((event) => event.id);
}

export function getDisplayArticle(event: NewsEvent, lang: "ko" | "en") {
  const wantsKorean = lang === "ko";
  const scored = event.articles.map((article) => {
    const hasHangul = /[가-힣]/.test(`${article.title} ${article.description}`);
    const languageScore = wantsKorean ? (hasHangul ? 4 : 0) : (!hasHangul ? 4 : 0);
    const roleScore = article.sourceRole === "wire" ? 1.4 : article.sourceType === "direct" ? 1 : 0.4;
    const ageHours = Math.max(0, (Date.now() - new Date(article.publishedAt).getTime()) / 3_600_000);
    const recencyScore = Number.isFinite(ageHours) ? Math.max(0, 1 - ageHours / 48) : 0;
    return { article, score: languageScore + roleScore + recencyScore };
  });
  return scored.sort((a, b) => b.score - a.score)[0]?.article ?? event.articles[0];
}

export async function getBriefing(): Promise<Briefing> {
  const loaded = await Promise.all(feeds.map(loadFeed));
  const sourceHealth = loaded.map((result) => result.health);
  const news = loaded.flatMap((result) => result.items)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 180);

  const clusters: NewsItem[][] = [];
  for (const item of news) {
    const match = clusters.find((cluster) => cluster.some((existing) => sameEvent(existing, item)));
    if (match) match.push(item);
    else clusters.push([item]);
  }

  const events = clusters.map((articles, index) => {
    const sorted = [...articles].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const primary = sorted.find((article) => article.sourceRole === "wire")
      ?? sorted.find((article) => article.sourceType === "direct")
      ?? sorted[0];
    const sources = new Set(sorted.map((article) => article.source));
    const category = majority(sorted.map((article) => article.category), primary.category);
    const scope = majority(sorted.map((article) => article.scope), primary.scope);
    const importanceScore = importanceFor(sorted);
    return {
      id: `${index}-${primary.title.slice(0, 36)}`,
      title: primary.title,
      category,
      scope,
      summary: primary.description,
      publishedAt: primary.publishedAt,
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
  }).slice(0, 24);

  const categoryCoverage: Record<NewsCategory, number> = {
    국내: 0,
    세계: 0,
    정치: 0,
    사회: 0,
    경제: 0,
    기술: 0,
    재난: 0,
  };
  events.forEach((event) => { categoryCoverage[event.category] += 1; });

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
  return loaded.flatMap((result) => result.items)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 180);
}

export async function getEvents(): Promise<NewsEvent[]> {
  return (await getBriefing()).events;
}
