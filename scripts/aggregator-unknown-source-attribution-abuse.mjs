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
  // Aggregated wrappers need publisher attribution before an unknown outlet name can be
  // treated as evidence. Direct-feed unknown labels are also not independently verified:
  // a direct RSS channel can otherwise mint arbitrary outlet identities through <source>.
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
    "unknown outlet claim from a direct feed is downgraded without a registered trust mapping",
    sourceForLink("Example News", "https://example.com/story", "direct") === "Unverified source",
  );
}

console.log(`\nAggregator unknown-source attribution abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
