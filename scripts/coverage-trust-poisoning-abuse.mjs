const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");
function check(name, condition) { if (condition) passes.push(name); else failures.push(name); }
const event = (id, category, scope, sourceCount) => ({
  id, title: id, category, scope, summary: id,
  publishedAt: "2026-08-30T10:00:00Z", dayStatus: "today", articles: [], sourceCount,
  importanceScore: 1, whySelected: [], briefWhy: "broad-impact", briefWatch: "single-source",
});
const poisoned = __test.categoryCoverageFor([
  event("verified-economy", "경제", "domestic", 1),
  event("unknown-disaster", "재난", "world", 0),
]);
check("verified domestic event counts toward domestic coverage", poisoned.국내 === 1);
check("verified economy event counts toward economy coverage", poisoned.경제 === 1);
check("unverified world event cannot fake world coverage", poisoned.세계 === 0);
check("unverified disaster event cannot hide a disaster coverage gap", poisoned.재난 === 0);
const mixed = __test.categoryCoverageFor([
  event("verified-world-disaster", "재난", "world", 2),
  event("unknown-politics", "정치", "domestic", 0),
]);
check("verified world disaster still counts", mixed.세계 === 1 && mixed.재난 === 1);
check("unverified politics does not inflate politics or domestic coverage", mixed.정치 === 0 && mixed.국내 === 0);
const singleVerified = __test.categoryCoverageFor([event("mixed-source-event", "기술", "world", 1)]);
check("an event with at least one verified source remains visible in coverage", singleVerified.기술 === 1 && singleVerified.세계 === 1);
console.log("Coverage trust poisoning abuse: " + passes.length + " passed / " + failures.length + " failed");
passes.forEach((name) => console.log("PASS  " + name));
failures.forEach((name) => console.error("FAIL  " + name));
if (failures.length) process.exit(1);
