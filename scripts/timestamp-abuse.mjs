const failures = [];
const passes = [];

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const { __test } = await import("../lib/news.ts");
const { safePublishedAt } = __test;

const now = Date.parse("2026-08-28T00:00:00.000Z");
const iso = (offsetMs) => new Date(now + offsetMs).toISOString();

check("current timestamp is accepted", safePublishedAt(iso(0), now) === iso(0));
check("small 90-second clock skew is tolerated", safePublishedAt(iso(90_000), now) === iso(90_000));
check("two-minute boundary is tolerated", safePublishedAt(iso(120_000), now) === iso(120_000));
check("three-minute future timestamp is rejected", safePublishedAt(iso(180_000), now) === "");
check("old twenty-minute poisoning window is rejected", safePublishedAt(iso(20 * 60_000), now) === "");
check("invalid timestamp is rejected", safePublishedAt("not-a-date", now) === "");

console.log(`\nTimestamp abuse regression: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
