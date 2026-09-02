const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");

// Adversarial feeds can rotate short machine-like alphanumeric suffixes to turn the
// same unknown-source placeholder into many apparent publishers. Single letters and
// pure numbers are already defended; mixed letter+digit suffixes are a separate gap.
const alphanumericPlaceholders = [
  "Unknown source A1",
  "Unknown source B2",
  "Unknown v2",
  "Source unavailable r3",
  "Unverified source 2026A",
  "N/A x9",
  "None build7",
  "null id42",
  "출처 없음 A1",
  "출처 불명 v2",
  "출처 미상 2026B",
  "미상 id7",
  "확인 불가 r4",
];

check("alphanumeric placeholder aliases collapse to unverified source",
  alphanumericPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("alphanumeric placeholder aliases cannot manufacture outlet diversity",
  canonicalOutletCount(alphanumericPlaceholders.map((source) => ({ source }))) === 1);

check("ordinary outlet names containing alphanumeric tokens remain preserved",
  canonicalSourceName("Studio 54") === "Studio 54" &&
  canonicalSourceName("Channel A1") === "Channel A1" &&
  canonicalSourceName("Newsroom 2026A") === "Newsroom 2026A");

check("real outlets remain distinct from collapsed placeholder variants",
  canonicalOutletCount([{ source: "Reuters" }, ...alphanumericPlaceholders.map((source) => ({ source }))]) === 2);

console.log(`\nAlphanumeric placeholder suffix abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
