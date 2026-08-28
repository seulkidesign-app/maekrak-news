const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test } = await import("../lib/news.ts");
const safeArticleUrl = __test.safeArticleUrl;

check("source-aware article URL validator is exported for regression tests", typeof safeArticleUrl === "function");

if (typeof safeArticleUrl === "function") {
  check("trusted Reuters label rejects unrelated public domain",
    safeArticleUrl("https://evil.example/story", "Reuters", "aggregated") === "");
  check("trusted Reuters label accepts official Reuters domain",
    safeArticleUrl("https://www.reuters.com/world/example", "Reuters", "aggregated").startsWith("https://www.reuters.com/"));
  check("aggregated trusted publisher may use Google News wrapper",
    safeArticleUrl("https://news.google.com/rss/articles/example", "Reuters", "aggregated").startsWith("https://news.google.com/"));
  check("direct trusted publisher cannot hide behind Google News wrapper",
    safeArticleUrl("https://news.google.com/rss/articles/example", "BBC", "direct") === "");
  check("trusted BBC label accepts BBC official domain",
    safeArticleUrl("https://www.bbc.com/news/example", "BBC", "direct").startsWith("https://www.bbc.com/"));
  check("unknown publisher may keep an otherwise safe public URL",
    safeArticleUrl("https://example.com/story", "Example Daily", "aggregated").startsWith("https://example.com/"));
}

console.log(`\nSource-link trust abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
