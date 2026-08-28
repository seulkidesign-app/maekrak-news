const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");

const placeholders = [
  "",
  "Unknown",
  "unknown source",
  "Source Unknown",
  "Unverified source",
  "SOURCE UNAVAILABLE",
  "N/A",
  "NA",
  "None",
  "null",
  "-",
];

check("all source placeholders collapse to one unverified identity",
  placeholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("placeholder aliases cannot inflate outlet count",
  canonicalOutletCount(placeholders.map((source) => ({ source }))) === 1);

check("real unknown outlets remain distinguishable",
  canonicalOutletCount([{ source: "Example Daily" }, { source: "Another Journal" }]) === 2);

check("trusted publisher remains distinct from placeholders",
  canonicalOutletCount([{ source: "Reuters" }, { source: "Unknown" }, { source: "N/A" }]) === 2);

console.log(`\nPlaceholder outlet abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
