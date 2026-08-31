const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");
function check(name, condition) { if (condition) passes.push(name); else failures.push(name); }
const article = (title, source = "Reuters") => ({
  title, description: title, source, link: "https://example.com/story",
  publishedAt: "2026-08-31T01:00:00Z", category: "세계", scope: "world",
  sourceType: "aggregated", sourceRole: source === "Reuters" ? "wire" : "international",
});
check("attacker-target reversal is not one event",
  !__test.sameEvent(article("Russia attacks Ukraine near border"), article("Ukraine attacks Russia near border", "BBC")));
check("same directional attack remains clusterable",
  __test.sameEvent(article("Russia attacks Ukraine near border"), article("Russia attacks Ukraine near border today", "BBC")));
check("threat actor-target reversal is not one event",
  !__test.sameEvent(article("Iran threatens Israel after talks"), article("Israel threatens Iran after talks", "BBC")));
check("non-directional entity order does not force a split",
  __test.sameEvent(article("Russia Ukraine ceasefire talks continue"), article("Ukraine Russia ceasefire talks continue", "BBC")));
console.log("Directional role reversal abuse: " + passes.length + " passed / " + failures.length + " failed");
passes.forEach((name) => console.log("PASS  " + name));
failures.forEach((name) => console.error("FAIL  " + name));
if (failures.length) process.exit(1);
