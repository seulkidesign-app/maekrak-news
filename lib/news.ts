import { XMLParser } from "fast-xml-parser";

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  category: string;
  description: string;
};

const feeds = [
  { name: "SBS", category: "국내", url: "https://news.sbs.co.kr/news/newsflashRssFeed.do?plink=RSSREADER" },
  { name: "BBC", category: "세계", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "CNN", category: "세계", url: "https://news.google.com/rss/search?q=site%3Acnn.com&hl=en-US&gl=US&ceid=US%3Aen" },
  { name: "MBC", category: "국내", url: "https://news.google.com/rss/search?q=site%3Aimnews.imbc.com&hl=ko&gl=KR&ceid=KR%3Ako" }
];

const parser = new XMLParser({ ignoreAttributes: false });

function clean(value: unknown) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
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

    return items.slice(0, 12).map((item: any) => {
      const source = clean(item?.source?.["#text"] ?? item?.source ?? feed.name);
      const link = typeof item?.link === "string" ? item.link : item?.link?.["@_href"] ?? item?.guid ?? "#";
      const publishedAt = item?.pubDate ?? item?.published ?? item?.updated ?? new Date().toISOString();
      return {
        title: clean(item?.title),
        link: String(link),
        source: source || feed.name,
        publishedAt: String(publishedAt),
        category: feed.category,
        description: clean(item?.description ?? item?.summary ?? item?.content)
      };
    });
  } catch {
    return [];
  }
}

export async function getNews(): Promise<NewsItem[]> {
  const groups = await Promise.all(feeds.map(loadFeed));
  return groups.flat().filter((item) => item.title && item.link).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 36);
}
