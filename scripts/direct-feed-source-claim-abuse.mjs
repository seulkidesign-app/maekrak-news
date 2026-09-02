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
  // New attack class: a direct RSS item can provide an arbitrary <source> label.
  // If that unknown label is accepted for any HTTPS link, downstream trust signals
  // can count attacker-controlled outlet names as independent verified evidence.
  check(
    "unknown outlet claim from a direct feed is not trusted solely because the link is HTTPS",
    sourceForLink("Example Wire", "https://attacker.example/story", "direct") === "Unverified source",
  );
  check(
    "registered Reuters claim still requires an official Reuters domain",
    sourceForLink("Reuters", "https://attacker.example/story", "direct") === "Unverified source",
  );
  check(
    "registered Reuters claim on official HTTPS domain remains trusted",
    sourceForLink("Reuters", "https://www.reuters.com/world/example", "direct") === "Reuters",
  );
  check(
    "unknown aggregator publisher with explicit HTTPS attribution keeps its name",
    sourceForLink("Example Wire", "https://news.google.com/rss/articles/example", "aggregated", "https://example.com/story") === "Example Wire",
  );
}

console.log(`\nDirect-feed source-claim abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
