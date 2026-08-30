const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test } = await import("../lib/news.ts");
const { sourceForLink } = __test;

check("source-aware article URL validator is exported for regression tests", typeof sourceForLink === "function");

if (typeof sourceForLink === "function") {
  check("Reuters on official root domain stays trusted", sourceForLink("Reuters", "https://reuters.com/world/story", "direct") === "Reuters");
  check("Reuters on official subdomain stays trusted", sourceForLink("Reuters", "https://www.reuters.com/world/story", "direct") === "Reuters");
  check("trusted Reuters label on unrelated domain is downgraded", sourceForLink("Reuters", "https://evil.example/reuters/story", "direct") === "Unverified source");
  check("suffix trap reuters.com.evil.example is downgraded", sourceForLink("Reuters", "https://reuters.com.evil.example/story", "direct") === "Unverified source");
  check("IDN homograph of Reuters domain is downgraded", sourceForLink("Reuters", "https://reutеrs.com/world/story", "direct") === "Unverified source");
  check("plaintext HTTP on official Reuters domain is not trusted", sourceForLink("Reuters", "http://reuters.com/world/story", "direct") === "Unverified source");
  check("plaintext HTTP Google News wrapper is not trusted", sourceForLink("Reuters", "http://news.google.com/rss/articles/example", "aggregated") === "Unverified source");
  check("Google News wrapper is allowed for aggregated trusted sources", sourceForLink("Reuters", "https://news.google.com/rss/articles/example", "aggregated") === "Reuters");
  check("Google News wrapper is not accepted for a direct-feed claim", sourceForLink("Reuters", "https://news.google.com/rss/articles/example", "direct") === "Unverified source");
  check("BBC official UK domain stays trusted", sourceForLink("BBC", "https://www.bbc.co.uk/news/world-1", "direct") === "BBC");
  check("unknown outlets keep safe public links without invented authority", sourceForLink("Example News", "https://example.com/story", "aggregated") === "Example News");
}

console.log(`\nSource-link trust abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
