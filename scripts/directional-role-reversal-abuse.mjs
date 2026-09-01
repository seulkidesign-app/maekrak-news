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

// Korean case particles encode actor/target roles just as clearly as English word order.
// A malicious or simply unlucky pair of headlines must not collapse opposite attacks into one event.
check("Korean attacker-target reversal is not one event",
  !__test.sameEvent(article("이란이 이스라엘을 공격 긴장 고조"), article("이스라엘이 이란을 공격 긴장 고조", "BBC")));
check("same Korean directional attack remains clusterable",
  __test.sameEvent(article("이란이 이스라엘을 공격 긴장 고조"), article("이란이 이스라엘을 공격 긴장 고조 속보", "BBC")));
check("Korean threat actor-target reversal is not one event",
  !__test.sameEvent(article("이란이 이스라엘을 위협 협상 결렬"), article("이스라엘이 이란을 위협 협상 결렬", "BBC")));

console.log("Directional role reversal abuse: " + passes.length + " passed / " + failures.length + " failed");
passes.forEach((name) => console.log("PASS  " + name));
failures.forEach((name) => console.error("FAIL  " + name));
if (failures.length) process.exit(1);
