import { XMLParser } from "fast-xml-parser";

export type NewsCategory = "국내" | "세계" | "경제" | "기술" | "재난";
export type SourceRole = "broadcaster" | "wire" | "international";

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  category: NewsCategory;
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
};

export type NewsEvent = {
  id: string;
  title: string;
  category: NewsCategory;
  summary: string;
  publishedAt: string;
  articles: NewsItem[];
  sourceCount: number;
  importanceScore: number;
  whySelected: string[];
};

export type Briefing = {
  events: NewsEvent[];
  sourceHealth: SourceHealth[];
  healthySources: number;
  totalSources: number;
};

type Feed = {
  name: string;
  sourceType: "direct" | "aggregated";
  role: SourceRole;
  defaultCategory: NewsCategory;
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
  { name: "SBS", role: "broadcaster", weight: 1.0, defaultCategory: "국내", sourceType: "direct", url: "https://news.sbs.co.kr/news/newsflashRssFeed.do?plink=RSSREADER" },
  { name: "BBC", role: "international", weight: 1.15, defaultCategory: "세계", sourceType: "direct", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "KBS", role: "broadcaster", weight: 1.1, defaultCategory: "국내", sourceType: "aggregated", url: googleNews("site:news.kbs.co.kr", "ko") },
  { name: "MBC", role: "broadcaster", weight: 1.0, defaultCategory: "국내", sourceType: "aggregated", url: googleNews("site:imnews.imbc.com", "ko") },
  { name: "연합뉴스", role: "wire", weight: 1.25, defaultCategory: "국내", sourceType: "aggregated", url: googleNews("site:yna.co.kr", "ko") },
  { name: "Reuters", role: "wire", weight: 1.35, defaultCategory: "세계", sourceType: "aggregated", url: googleNews("site:reuters.com", "en") },
  { name: "AP", role: "wire", weight: 1.3, defaultCategory: "세계", sourceType: "aggregated", url: googleNews("site:apnews.com", "en") },
  { name: "CNN", role: "international", weight: 1.0, defaultCategory: "세계", sourceType: "aggregated", url: googleNews("site:cnn.com", "en") },
  { name: "DW", role: "international", weight: 0.95, defaultCategory: "세계", sourceType: "aggregated", url: googleNews("site:dw.com", "en") },
  { name: "Al Jazeera", role: "international", weight: 1.0, defaultCategory: "세계", sourceType: "aggregated", url: googleNews("site:aljazeera.com", "en") },
  { name: "NHK", role: "international", weight: 0.95, defaultCategory: "세계", sourceType: "aggregated", url: googleNews("site:www3.nhk.or.jp", "en") },
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

const topicRules: Array<{ category: NewsCategory; pattern: RegExp }> = [
  { category: "재난", pattern: /태풍|호우|폭우|홍수|산불|지진|폭염|한파|재난|typhoon|flood|wildfire|earthquake|storm|heatwave/i },
  { category: "기술", pattern: /인공지능|반도체|칩|ai\b|artificial intelligence|semiconductor|chip|openai|nvidia|apple|google|microsoft/i },
  { category: "경제", pattern: /금리|환율|물가|증시|주가|관세|무역|경제|은행|inflation|interest rate|rate cut|rate hike|tariff|market|stocks|economy|bank/i },
];

const highImpactPatterns = [
  /전쟁|공격|미사일|핵|휴전|계엄|탄핵|선거|대통령|총리|사망|붕괴|지진|태풍|홍수|산불|금리|관세|제재|war|attack|missile|nuclear|ceasefire|election|president|prime minister|earthquake|typhoon|flood|wildfire|interest rate|tariff|sanction/i,
];

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

function normalizedEntities(text: string) {
  const normalized = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}.\s-]/gu, " ").replace(/\s+/g, " ")} `;
  const found = new Set<string>();
  Object.entries(entityAliases).forEach(([entity, aliases]) => {
    if (aliases.some((alias) => normalized.includes(alias.toLowerCase()))) found.add(entity);
  });
  return found;
}

function tokens(text: string) {
  return new Set(
    text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/)
      .filter((word) => word.length >= 2 && !stopwords.has(word))
  );
}

function titleSimilarity(a: string, b: string) {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  left.forEach((word) => { if (right.has(word)) overlap += 1; });
  return overlap / Math.min(left.size, right.size);
}

function entitySimilarity(a: string, b: string) {
  const left = normalizedEntities(a);
  const right = normalizedEntities(b);
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  left.forEach((entity) => { if (right.has(entity)) overlap += 1; });
  return overlap / Math.min(left.size, right.size);
}

function sameEvent(a: NewsItem, b: NewsItem) {
  const lexical = titleSimilarity(a.title, b.title);
  const entities = entitySimilarity(a.title, b.title);
  if (lexical >= 0.46) return true;
  if (entities >= 0.67 && lexical >= 0.12) return true;
  if (entities === 1 && normalizedEntities(a.title).size >= 2 && normalizedEntities(b.title).size >= 2) return true;
  return false;
}

async function loadFeed(feed: Feed): Promise<{ items: NewsItem[]; health: SourceHealth }> {
  try {
    const response = await fetch(feed.url, {
      next: { revalidate: 900 },
      headers: { "User-Agent": "Mozilla/5.0 MaekrakNews/2.0" },
    });
    if (!response.ok) {
      return { items: [], health: { name: feed.name, ok: false, itemCount: 0, sourceType: feed.sourceType, role: feed.role } };
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
        description,
        sourceType: feed.sourceType,
        sourceRole: feed.role,
      } satisfies NewsItem;
    }).filter((item: NewsItem) => item.title && item.link !== "#");

    return {
      items,
      health: { name: feed.name, ok: items.length > 0, itemCount: items.length, sourceType: feed.sourceType, role: feed.role },
    };
  } catch {
    return { items: [], health: { name: feed.name, ok: false, itemCount: 0, sourceType: feed.sourceType, role: feed.role } };
  }
}

function importanceFor(articles: NewsItem[]) {
  const now = Date.now();
  const sources = new Set(articles.map((article) => article.source));
  const roles = new Set(articles.map((article) => article.sourceRole));
  const newest = Math.max(...articles.map((article) => new Date(article.publishedAt).getTime()).filter(Number.isFinite));
  const ageHours = Number.isFinite(newest) ? Math.max(0, (now - newest) / 3_600_000) : 24;
  const recency = Math.max(0, 2.4 - ageHours / 12);
  const diversity = Math.min(4, sources.size) * 1.15;
  const roleDiversity = Math.min(3, roles.size) * 0.65;
  const sourceAuthority = Math.max(...articles.map((article) => feedByName.get(article.source)?.weight ?? (article.sourceRole === "wire" ? 1.2 : 0.9)));
  const impactText = articles.map((article) => `${article.title} ${article.description}`).join(" ");
  const impact = highImpactPatterns.some((pattern) => pattern.test(impactText)) ? 2.1 : 0;
  const crossRegion = articles.some((article) => article.category === "세계") && articles.some((article) => article.category === "국내") ? 0.8 : 0;
  return Math.round((diversity + roleDiversity + sourceAuthority + recency + impact + crossRegion) * 100) / 100;
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
    const categoryCounts = new Map<NewsCategory, number>();
    sorted.forEach((article) => categoryCounts.set(article.category, (categoryCounts.get(article.category) ?? 0) + 1));
    const category = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? primary.category;
    const importanceScore = importanceFor(sorted);
    return {
      id: `${index}-${primary.title.slice(0, 36)}`,
      title: primary.title,
      category,
      summary: primary.description,
      publishedAt: primary.publishedAt,
      articles: sorted,
      sourceCount: sources.size,
      importanceScore,
      whySelected: selectionReasons(sorted, importanceScore),
    } satisfies NewsEvent;
  }).sort((a, b) => {
    if (b.importanceScore !== a.importanceScore) return b.importanceScore - a.importanceScore;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  }).slice(0, 24);

  return {
    events,
    sourceHealth,
    healthySources: sourceHealth.filter((source) => source.ok).length,
    totalSources: sourceHealth.length,
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
