const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");
function check(name, condition) { if (condition) passes.push(name); else failures.push(name); }
const now = Date.UTC(2026, 7, 31, 1, 0, 0);
const parse = (value) => __test.safePublishedAt(value, now);
check("ISO date-only publication is rejected", parse("2026-08-31") === "");
check("RFC date-only publication is rejected", parse("Mon, 31 Aug 2026") === "");
check("full UTC timestamp remains accepted", parse("2026-08-31T00:00:00Z") === "2026-08-31T00:00:00.000Z");
check("full numeric-offset timestamp remains accepted", parse("2026-08-31T09:00:00+09:00") === "2026-08-31T00:00:00.000Z");
check("full RFC GMT timestamp remains accepted", parse("Mon, 31 Aug 2026 00:00:00 GMT") === "2026-08-31T00:00:00.000Z");
check("timezone-less clock remains rejected", parse("2026-08-31T00:00:00") === "");
check("near-future publication skew is clamped to ingestion time", parse("2026-08-31T01:01:59Z") === "2026-08-31T01:00:00.000Z");
check("one-millisecond future publication skew is clamped", parse("2026-08-31T01:00:00.001Z") === "2026-08-31T01:00:00.000Z");
check("publication beyond tolerated future skew is rejected", parse("2026-08-31T01:02:01Z") === "");
console.log("Publication precision spoofing abuse: " + passes.length + " passed / " + failures.length + " failed");
passes.forEach((name) => console.log("PASS  " + name));
failures.forEach((name) => console.error("FAIL  " + name));
if (failures.length) process.exit(1);
