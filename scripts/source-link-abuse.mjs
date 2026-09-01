const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test } = await import("../lib/news.ts");
const { sourceForLink, safeHttpUrl } = __test;

check("source-aware article URL validator is exported for regression tests", typeof sourceForLink === "function");
check("safe public URL validator is exported for regression tests", typeof safeHttpUrl === "function");

if (typeof sourceForLink === "function") {
  check("Reuters on official root domain stays trusted", sourceForLink("Reuters", "https://reuters.com/world/story", "direct") === "Reuters");
  check("Reuters on official subdomain stays trusted", sourceForLink("Reuters", "https://www.reuters.com/world/story", "direct") === "Reuters");
  check("trusted Reuters label on unrelated domain is downgraded", sourceForLink("Reuters", "https://evil.example/reuters/story", "direct") === "Unverified source");
  check("suffix trap reuters.com.evil.example is downgraded", sourceForLink("Reuters", "https://reuters.com.evil.example/story", "direct") === "Unverified source");
  check("IDN homograph of Reuters domain is downgraded", sourceForLink("Reuters", "https://reutеrs.com/world/story", "direct") === "Unverified source");
  check("plaintext HTTP on official Reuters domain is not trusted", sourceForLink("Reuters", "http://reuters.com/world/story", "direct") === "Unverified source");
  check("plaintext HTTP Google News wrapper is not trusted", sourceForLink("Reuters", "http://news.google.com/rss/articles/example", "aggregated", "https://www.reuters.com") === "Unverified source");
  check("Google News wrapper with trusted label alone is downgraded", sourceForLink("Reuters", "https://news.google.com/rss/articles/example", "aggregated") === "Unverified source");
  check("Google News wrapper requires publisher-domain attribution", sourceForLink("Reuters", "https://news.google.com/rss/articles/example", "aggregated", "https://www.reuters.com") === "Reuters");
  check("Google News wrapper rejects plaintext publisher attribution downgrade", sourceForLink("Reuters", "https://news.google.com/rss/articles/example", "aggregated", "http://www.reuters.com") === "Unverified source");
  check("Google News wrapper rejects plaintext publisher attribution on official root domain", sourceForLink("Reuters", "https://news.google.com/rss/articles/example", "aggregated", "http://reuters.com") === "Unverified source");
  check("Google News wrapper rejects spoofed publisher attribution", sourceForLink("Reuters", "https://news.google.com/rss/articles/example", "aggregated", "https://reuters.com.evil.example") === "Unverified source");
  check("Google News wrapper rejects unrelated publisher attribution", sourceForLink("Reuters", "https://news.google.com/rss/articles/example", "aggregated", "https://example.com") === "Unverified source");
  check("Google News wrapper is not accepted for a direct-feed claim", sourceForLink("Reuters", "https://news.google.com/rss/articles/example", "direct", "https://www.reuters.com") === "Unverified source");
  check("BBC official UK domain stays trusted", sourceForLink("BBC", "https://www.bbc.co.uk/news/world-1", "direct") === "BBC");
  check("unknown outlets keep safe public links without invented authority", sourceForLink("Example News", "https://example.com/story", "aggregated") === "Example News");

  // New attack class: URL userinfo / credential smuggling.
  // Browsers parse the host after '@', while humans can easily read the prefix as the publisher.
  check("userinfo prefix cannot disguise an evil host as Reuters", sourceForLink("Reuters", "https://reuters.com@evil.example/world/story", "direct") === "Unverified source");
  check("aggregator attribution cannot smuggle trusted host through userinfo", sourceForLink("Reuters", "https://news.google.com/rss/articles/example", "aggregated", "https://reuters.com@evil.example/story") === "Unverified source");
}

if (typeof safeHttpUrl === "function") {
  check("article URL with username on trusted host is rejected before trust evaluation", safeHttpUrl("https://attacker@reuters.com/world/story") === "");
  check("article URL with username and password on trusted host is rejected", safeHttpUrl("https://attacker:secret@reuters.com/world/story") === "");
  check("userinfo host-confusion URL is rejected", safeHttpUrl("https://reuters.com@evil.example/world/story") === "");
  check("ordinary HTTPS Reuters URL remains accepted", safeHttpUrl("https://reuters.com/world/story").startsWith("https://reuters.com/"));
}

console.log(`\nSource-link trust abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
