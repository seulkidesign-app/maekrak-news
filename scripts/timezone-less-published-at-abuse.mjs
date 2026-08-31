const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(name + (detail ? " — " + detail : ""));
}

const now = Date.UTC(2026, 7, 30, 12, 0, 0);
const parse = (value) => __test.safePublishedAt(value, now);

check("timezone-less ISO datetime is rejected", parse("2026-08-30T10:00:00") === "");
check("timezone-less space-separated datetime is rejected", parse("2026-08-30 10:00:00") === "");
check("timezone-less RFC datetime is rejected", parse("Sun, 30 Aug 2026 10:00:00") === "");
check("UTC Z timestamp remains allowed", parse("2026-08-30T10:00:00Z") === "2026-08-30T10:00:00.000Z");
check("numeric ISO offset remains allowed", parse("2026-08-30T19:00:00+09:00") === "2026-08-30T10:00:00.000Z");
check("RFC GMT timestamp remains allowed", Boolean(parse("Sun, 30 Aug 2026 10:00:00 GMT")));
check("RFC UTC timestamp remains allowed", Boolean(parse("Sun, 30 Aug 2026 10:00:00 UTC")));
check("RFC numeric offset remains allowed", Boolean(parse("Sun, 30 Aug 2026 19:00:00 +0900")));
check("ambiguous CST abbreviation is rejected", parse("Sun, 30 Aug 2026 10:00:00 CST") === "");
check("ambiguous IST abbreviation is rejected", parse("Sun, 30 Aug 2026 10:00:00 IST") === "");
check("ambiguous BST abbreviation is rejected", parse("Sun, 30 Aug 2026 10:00:00 BST") === "");
check("date-only publication value is rejected because recency precision is unknown", parse("2026-08-30") === "");

console.log("Timezone-less publication timestamp abuse: " + passes.length + " passed / " + failures.length + " failed");
passes.forEach((name) => console.log("PASS  " + name));
failures.forEach((name) => console.error("FAIL  " + name));
if (failures.length) process.exit(1);
