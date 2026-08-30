const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");
function check(name, condition) { if (condition) passes.push(name); else failures.push(name); }
const article = (source, link, publishedAt, title = "Live updates") => ({
  title, description: title, source, link, publishedAt,
  category: "세계", scope: "world", sourceType: "aggregated",
  sourceRole: source === "Reuters" ? "wire" : "international",
});
const distinctSameTitle = __test.dedupeNews([
  article("Reuters", "https://www.reuters.com/world/story-a", "2026-08-30T09:00:00Z"),
  article("Reuters", "https://www.reuters.com/world/story-b", "2026-08-30T10:00:00Z"),
]);
check("same outlet same title but different URLs are preserved", distinctSameTitle.length === 2);
const correction = __test.dedupeNews([
  article("Reuters", "https://www.reuters.com/world/story-c", "2026-08-30T09:00:00Z", "Election results"),
  article("Reuters", "https://www.reuters.com/world/story-c", "2026-08-30T10:00:00Z", "Election results"),
]);
check("same article URL keeps only one revision", correction.length === 1);
check("same article URL keeps the latest revision", correction[0]?.publishedAt === "2026-08-30T10:00:00Z");
const reverseCorrection = __test.dedupeNews([
  article("Reuters", "https://www.reuters.com/world/story-c", "2026-08-30T10:00:00Z", "Election results"),
  article("Reuters", "https://www.reuters.com/world/story-c", "2026-08-30T09:00:00Z", "Election results"),
]);
check("revision retention is independent of feed order", reverseCorrection[0]?.publishedAt === "2026-08-30T10:00:00Z");
const trackingVariants = __test.dedupeNews([
  article("Reuters", "https://www.reuters.com/world/story-d?utm_source=rss&x=1", "2026-08-30T09:00:00Z"),
  article("Reuters", "https://www.reuters.com/world/story-d?x=1&utm_medium=feed", "2026-08-30T10:00:00Z"),
]);
check("tracking-only URL variants collapse to one article", trackingVariants.length === 1 && trackingVariants[0]?.publishedAt === "2026-08-30T10:00:00Z");
const meaningfulQueries = __test.dedupeNews([
  article("Reuters", "https://www.reuters.com/live?id=alpha", "2026-08-30T09:00:00Z"),
  article("Reuters", "https://www.reuters.com/live?id=beta", "2026-08-30T10:00:00Z"),
]);
check("meaningful query differences remain distinct", meaningfulQueries.length === 2);
const differentOutlets = __test.dedupeNews([
  article("Reuters", "https://example.com/shared", "2026-08-30T09:00:00Z"),
  article("BBC", "https://example.com/shared", "2026-08-30T09:00:00Z"),
]);
check("different outlets sharing a URL remain distinct", differentOutlets.length === 2);
console.log("Dedupe URL identity abuse: " + passes.length + " passed / " + failures.length + " failed");
passes.forEach((name) => console.log("PASS  " + name));
failures.forEach((name) => console.error("FAIL  " + name));
if (failures.length) process.exit(1);
