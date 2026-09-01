const { __test } = await import("../lib/news.ts");

const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const now = Date.parse("2026-09-02T00:00:00.000Z");
const iso = (offsetMs) => new Date(now + offsetMs).toISOString();

// A feed clock may be slightly ahead, but that skew must never become a future
// publication time that can win recency ranking or be rendered as if it already happened.
check(
  "119-second future timestamp is clamped to ingestion time",
  __test.safePublishedAt(iso(119_000), now) === iso(0),
);
check(
  "1-millisecond future timestamp is clamped to ingestion time",
  __test.safePublishedAt(iso(1), now) === iso(0),
);
check(
  "exact-now timestamp is preserved",
  __test.safePublishedAt(iso(0), now) === iso(0),
);
check(
  "past timestamp is preserved",
  __test.safePublishedAt(iso(-1_000), now) === iso(-1_000),
);
check(
  "timestamp beyond tolerated future skew is rejected",
  __test.safePublishedAt(iso(121_000), now) === "",
);

console.log(`\nFuture-skew freshness abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
