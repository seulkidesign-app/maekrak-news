const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const now = Date.UTC(2026, 7, 30, 20, 0, 0);
const parse = (value) => __test.safePublishedAt(value, now);
check("CST is rejected because it can mean multiple offsets", parse("Sun, 30 Aug 2026 10:00:00 CST") === "");
check("IST is rejected because it can mean multiple offsets", parse("Sun, 30 Aug 2026 10:00:00 IST") === "");
check("BST is rejected because it can mean multiple offsets", parse("Sun, 30 Aug 2026 10:00:00 BST") === "");
check("PST named zone is rejected in favor of explicit offset", parse("Sun, 30 Aug 2026 10:00:00 PST") === "");
check("explicit minus offset remains deterministic", parse("Sun, 30 Aug 2026 10:00:00 -0600") === "2026-08-30T16:00:00.000Z");
check("explicit plus offset remains deterministic", parse("Sun, 30 Aug 2026 10:00:00 +0800") === "2026-08-30T02:00:00.000Z");
check("GMT remains deterministic", parse("Sun, 30 Aug 2026 10:00:00 GMT") === "2026-08-30T10:00:00.000Z");

console.log("Ambiguous timezone abbreviation abuse: " + passes.length + " passed / " + failures.length + " failed");
passes.forEach((name) => console.log("PASS  " + name));
failures.forEach((name) => console.error("FAIL  " + name));
if (failures.length) process.exit(1);
