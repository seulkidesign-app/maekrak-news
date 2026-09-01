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

const concatenatedPlaceholders = [
  "Unknown source2",
  "Unknown3",
  "Source unavailable4",
  "Unverified source5",
  "출처 없음6",
  "출처 불명7",
  "출처 미상8",
  "미상9",
  "확인 불가10",
];

check("numbered placeholder aliases collapse to unverified source",
  numberedPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("concatenated numeric placeholder aliases collapse to unverified source",
  concatenatedPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("numbered and concatenated placeholders cannot manufacture outlet diversity",
  canonicalOutletCount([...numberedPlaceholders, ...concatenatedPlaceholders].map((source) => ({ source }))) === 1);

check("numbered real outlet names are preserved",
  canonicalSourceName("Channel News 24") === "Channel News 24");

check("real outlets with attached digits remain preserved",
  canonicalSourceName("Channel News24") === "Channel News24");

check("real outlets remain distinct from numbered placeholders",
  canonicalOutletCount([{ source: "Reuters" }, ...numberedPlaceholders.map((source) => ({ source })), ...concatenatedPlaceholders.map((source) => ({ source }))]) === 2);

console.log(`\nNumbered/concatenated placeholder outlet abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);