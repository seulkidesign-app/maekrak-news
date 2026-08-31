from pathlib import Path

news_path = Path("lib/news.ts")
news = news_path.read_text()

marker = "function sourceForFeed(value: unknown, feed: Feed) {\n"
helper = """function selectFeedWindow(candidates: NewsItem[], maxItems = 28) {
  return dedupeNews(
    candidates.filter((item) => item.title && item.link && item.publishedAt)
  ).slice(0, maxItems);
}

"""
if helper not in news:
    if marker not in news:
        raise SystemExit("sourceForFeed marker not found")
    news = news.replace(marker, helper + marker, 1)

old_start = "    const items = rawItems.slice(0, 28).map((item: any) => {\n"
new_start = "    const candidates = rawItems.slice(0, 112).map((item: any) => {\n"
if old_start in news:
    news = news.replace(old_start, new_start, 1)
elif new_start not in news:
    raise SystemExit("feed map window marker not found")

old_end = "      } satisfies NewsItem;\n    }).filter((item: NewsItem) => item.title && item.link && item.publishedAt);\n"
new_end = "      } satisfies NewsItem;\n    });\n    const items = selectFeedWindow(candidates);\n"
if old_end in news:
    news = news.replace(old_end, new_end, 1)
elif new_end not in news:
    raise SystemExit("feed filter marker not found")

old_export = "  canonicalDedupeUrl,\n  dedupeNews,\n  stableEventId,\n"
new_export = "  canonicalDedupeUrl,\n  dedupeNews,\n  selectFeedWindow,\n  stableEventId,\n"
if old_export in news:
    news = news.replace(old_export, new_export, 1)
elif new_export not in news:
    raise SystemExit("__test export marker not found")

news_path.write_text(news)

regression = '''import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../lib/news.ts", import.meta.url), "utf8");
const { __test } = await import("../lib/news.ts");
const failures = [];
const passes = [];
const check = (name, ok) => {
  if (ok) {
    passes.push(name);
    console.log(`PASS  ${name}`);
  } else {
    failures.push(name);
    console.error(`FAIL  ${name}`);
  }
};

const article = (title, link, publishedAt) => ({
  title,
  link,
  publishedAt,
  source: "Reuters",
  category: "세계",
  scope: "world",
  description: title,
  sourceType: "aggregated",
  sourceRole: "wire",
});

check("RSS parser disables custom entity expansion", /new XMLParser\\(\\{[^}]*processEntities:\\s*false/.test(source));
check("RSS fetch refuses automatic redirects", /fetch\\(feed\\.url,\\s*\\{[\\s\\S]*?redirect:\\s*["']error["']/.test(source));
check("feed payload keeps an explicit byte ceiling", source.includes("readResponseTextLimited(response)"));
check("article URLs reject private hosts", source.includes("isPrivateHostname(url.hostname)"));
check("feed scans beyond the 28 output slots before validation", source.includes("rawItems.slice(0, 112).map"));

const invalidFrontload = Array.from({ length: 28 }, (_, index) =>
  article(`poison-${index}`, "", "")
);
const rescued = __test.selectFeedWindow([
  ...invalidFrontload,
  article("Valid story A", "https://www.reuters.com/world/valid-a", "2026-08-31T01:00:00Z"),
  article("Valid story B", "https://www.reuters.com/world/valid-b", "2026-08-31T02:00:00Z"),
]);
check("invalid front-loaded entries cannot consume valid output slots", rescued.length === 2 && rescued.every((item) => item.link));

const duplicateFrontload = Array.from({ length: 28 }, (_, index) =>
  article("Repeated correction", "https://www.reuters.com/world/repeated", `2026-08-31T${String(index % 24).padStart(2, "0")}:00:00Z`)
);
const deduped = __test.selectFeedWindow([
  ...duplicateFrontload,
  article("Independent story", "https://www.reuters.com/world/independent", "2026-08-31T23:30:00Z"),
]);
check("duplicate front-loaded entries cannot crowd out a later unique story", deduped.length === 2 && deduped.some((item) => item.link.endsWith("/independent")));
check("duplicate front-load keeps the newest revision", deduped.some((item) => item.link.endsWith("/repeated") && item.publishedAt === "2026-08-31T23:00:00Z"));

console.log(`\\nFeed boundary abuse: ${passes.length} passed / ${failures.length} failed`);
if (failures.length) process.exit(1);
'''
Path("scripts/feed-boundary-abuse.mjs").write_text(regression)
