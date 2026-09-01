const { __test } = await import("../lib/news.ts");

const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const now = Date.parse("2026-09-02T00:00:00Z");
const parse = (value) => __test.safePublishedAt(value, now);

check("two-digit RFC year is rejected", parse("Tue, 01 Sep 26 07:00:00 GMT") === "");
check("two-digit RFC year without weekday is rejected", parse("01 Sep 26 07:00:00 GMT") === "");
check("ambiguous slash date is rejected", parse("09/01/2026 07:00:00 GMT") === "");
check("implementation-dependent month-first text is rejected", parse("Sep 01 2026 07:00:00 GMT") === "");
check("three-digit RFC year is rejected", parse("Tue, 01 Sep 026 07:00:00 GMT") === "");
check("valid four-digit RFC timestamp is accepted", parse("Tue, 01 Sep 2026 07:00:00 GMT") === "2026-09-01T07:00:00.000Z");
check("valid ISO timestamp is accepted", parse("2026-09-01T07:00:00Z") === "2026-09-01T07:00:00.000Z");
check("impossible RFC calendar date is rejected", parse("Tue, 31 Feb 2026 07:00:00 GMT") === "");

console.log(`\nAmbiguous publication-format abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
