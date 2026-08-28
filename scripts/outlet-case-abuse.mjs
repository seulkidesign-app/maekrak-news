const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");

check("unknown outlet case variants canonicalize identically",
  ["Example News", "EXAMPLE NEWS", "example news", "ExAmPlE NeWs"].every((name) => canonicalSourceName(name) === "Example News"));
check("unknown outlet case variants cannot inflate outlet count",
  canonicalOutletCount([
    { source: "Example News" },
    { source: "EXAMPLE NEWS" },
    { source: "example news" },
  ]) === 1);
check("distinct unknown outlets still remain distinct",
  canonicalOutletCount([{ source: "Example News" }, { source: "Another News" }]) === 2);
check("trusted publisher aliases remain canonical",
  canonicalSourceName("reuters") === "Reuters" && canonicalSourceName("AP NEWS") === "AP");

console.log(`\nOutlet case abuse regression: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
