const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");

const numberedPlaceholders = [
  "Unknown source 1",
  "Unknown source #2",
  "Unknown 3",
  "Source unavailable 4",
  "Unverified source (5)",
  "N/A #6",
  "None 7",
  "null:8",
];

check("numbered placeholder aliases collapse to unverified source",
  numberedPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("numbered placeholders cannot manufacture outlet diversity",
  canonicalOutletCount(numberedPlaceholders.map((source) => ({ source }))) === 1);

check("numbered real outlet names are preserved",
  canonicalSourceName("Channel News 24") === "Channel News 24");

check("real outlets remain distinct from numbered placeholders",
  canonicalOutletCount([{ source: "Reuters" }, ...numberedPlaceholders.map((source) => ({ source }))]) === 2);

console.log(`\nNumbered placeholder outlet abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
