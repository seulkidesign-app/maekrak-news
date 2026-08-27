import type { NewsItem } from "@/lib/news";

export function canonicalSourceName(value: string) {
  const raw = String(value ?? "").replace(/\s+/g, " ").trim();
  const lower = raw.toLowerCase();
  if (!raw) return "Unknown";
  if (/^(reuters|reuters news)$/.test(lower)) return "Reuters";
  if (/^(ap|ap news|associated press|the associated press)$/.test(lower)) return "AP";
  if (/^(연합뉴스|yonhap|yonhap news|yonhap news agency)$/.test(lower)) return "연합뉴스";
  if (/^(bbc|bbc news)$/.test(lower)) return "BBC";
  if (/^kbs(?: news)?$/.test(lower)) return "KBS";
  if (/^mbc(?: news)?$/.test(lower)) return "MBC";
  if (/^sbs(?: news)?$/.test(lower)) return "SBS";
  if (/^(al jazeera|al jazeera english)$/.test(lower)) return "Al Jazeera";
  if (/^(dw|deutsche welle)$/.test(lower)) return "DW";
  if (/^(nhk|nhk world|nhk world-japan)$/.test(lower)) return "NHK";
  return raw;
}

export function canonicalOutletCount(articles: Pick<NewsItem, "source">[]) {
  return new Set(articles.map((article) => canonicalSourceName(article.source))).size;
}
