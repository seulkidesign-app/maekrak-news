import { XMLParser } from "fast-xml-parser";

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  category: string;
  description: string;
  sourceType: "direct" | "aggregated";
};

export type NewsEvent = {
  id: string;
  title: string;
  category: string;
  summary: string;
  publishedAt: string;
  articles: NewsItem[];
  sourceCount: number;
};

const feeds = [
  { name: "SBS", category: "국내", sourceType: "direct" as const, url: "https://news.sbs.co.kr/news/newsflashRssFeed.do?plink=RSSREADER" },
  { name: "BBC", category: "세계", sourceType: "direct" as const, url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "CNN", category: "세계", sourceType: "aggregated" as const, url: "https://news.google.com/rss/search?q=site%3Acnn.com&hl=en-US&gl=US&ceid=US%3Aen" },
  { name: "MBC", category: "국내", sourceType: "aggregated" as const, url: "https://news.google.com/rss/search?q=site%3Aimnews.imbc.com&hl=ko&gl=KR&ceid=KR%3Ako" }
];

const parser = new XMLParser({ ignoreAttributes: false });
const stopwords = new Set(["속보", "단독", "영상", "뉴스", "today", "live", "says", "after", "with", "from", "that", "this", "대한", "관련", "오늘", "정부"]);

function clean(value: unknown) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function tokens(text: string) {
  return new Set(
    text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/)
      .filter((word) => word.length >= 2 && !stopwords.has(word))
  );
}

function similarity(a: string, b: string) {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  left.forEach((word) => { if (right.has(word)) overlap += 1; });
  return overlap / Math.min(left.size, right.size);
}

async function loadFeed(feed: (typeof feeds)[number]): Promise<NewsItem[]> {
  try {
    const response = await fetch(feed.url, {
      next: { revalidate: 900 },
      headers: { "User-Agent": "Mozilla/5.0 MaekrakNews/1.0" }
    });
    if (!response.ok) return [];
    const xml = await response.text();
    const data = parser.parse(xml);
    const items = asArray<any>(data?.rss?.channel?.item ?? data?.feed?.entry);

    return items.slice(0, 16).map((item: any) => {
      const source = clean(item?.source?.["#text"] ?? item?.source ?? feed.name);
      const link = typeof item?.link === "string" ? item.link : item?.link?.["@_href"] ?? item?.guid ?? "#";
      const publishedAt = item?.pubDate ?? item?.published ?? item?.updated ?? new Date().toISOString();
      return {
        title: clean(item?.title),
        link: String(link),
        source: source || feed.name,
        publishedAt: String(publishedAt),
        category: feed.category,
        description: clean(item?.description ?? item?.summary ?? item?.content),
        sourceType: feed.sourceType
      };
    });
  } catch {
    return [];
  }
}

export async function getNews(): Promise<NewsItem[]> {
  const groups = await Promise.all(feeds.map(loadFeed));
  return groups.flat().filter((item) => item.title && item.link)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 48);
}

export async function getEvents(): Promise<NewsEvent[]> {
  const news = await getNews();
  const clusters: NewsItem[][] = [];

  for (const item of news) {
    const match = clusters.find((cluster) => cluster.some((existing) => similarity(existing.title, item.title) >= 0.42));
    if (match) match.push(item);
    else clusters.push([item]);
  }

  return clusters.map((articles, index) => {
    const sorted = [...articles].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const primary = sorted.find((article) => article.sourceType === "direct") ?? sorted[0];
    const sources = new Set(sorted.map((article) => article.source));
    return {
      id: `${index}-${primary.title.slice(0, 24)}`,
      title: primary.title,
      category: primary.category,
      summary: primary.description,
      publishedAt: primary.publishedAt,
      articles: sorted,
      sourceCount: sources.size
    };
  }).sort((a, b) => {
    const diversity = Math.min(b.sourceCount, 3) - Math.min(a.sourceCount, 3);
    if (diversity !== 0) return diversity;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  }).slice(0, 10);
}
