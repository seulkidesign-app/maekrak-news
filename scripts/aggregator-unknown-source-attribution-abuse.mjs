const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test } = await import("../lib/news.ts");
const { sourceForLink } = __test;

check("source-aware article URL validator is exported", typeof sourceForLink === "function");

if (typeof sourceForLink === "function") {
  // New attack class: an aggregated wrapper can currently attach any non-placeholder
  // publisher label without proving a publisher attribution URL. Downstream code then
  // treats that arbitrary label as verified evidence and can inflate sourceCount/trust UX.
  check(
    "unknown outlet on Google News wrapper without publisher attribution is downgraded",
    sourceForLink("Example News", "https://news.google.com/rss/articles/example", "aggregated") === "Unverified source",
  );
  check(
    "unknown outlet on Google News wrapper with invalid attribution is downgraded",
    sourceForLink("Example News", "https://news.google.com/rss/articles/example", "aggregated", "javascript:alert(1)") === "Unverified source",
  );
  check(
    "unknown outlet on Google News wrapper with HTTPS publisher attribution remains named",
    sourceForLink("Example News", "https://news.google.com/rss/articles/example", "aggregated", "https://example.com/news") === "Example News",
  );
  check(
    "unknown outlet direct public article remains named without aggregator attribution",
    sourceForLink("Example News", "https://example.com/story", "direct") === "Example News",
  );
}

console.log(`\nAggregator unknown-source attribution abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
