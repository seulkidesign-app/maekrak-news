const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");

// Machine-generated or adversarial feeds can rotate ordinary ASCII suffixes to make
// an "unknown source" placeholder look like many independent publishers. Existing
// numeric/Roman/compatibility-letter defenses must not leave plain A/B/C as a gap.
const asciiLetterPlaceholders = [
  "Unknown source A",
  "Unknown source B",
  "Unknown C",
  "Source unavailable D",
  "Unverified source E",
  "N/A F",
  "None G",
  "null H",
  "출처 없음 A",
  "출처 불명 B",
  "출처 미상 C",
  "미상 D",
  "확인 불가 E",
];

check("ASCII-letter placeholder aliases collapse to unverified source",
  asciiLetterPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("ASCII-letter placeholder aliases cannot manufacture outlet diversity",
  canonicalOutletCount(asciiLetterPlaceholders.map((source) => ({ source }))) === 1);

check("ordinary outlet names ending in a single ASCII letter remain preserved",
  canonicalSourceName("Channel News A") === "Channel News A" &&
  canonicalSourceName("Studio B") === "Studio B");

check("real outlets remain distinct from collapsed placeholder variants",
  canonicalOutletCount([{ source: "Reuters" }, ...asciiLetterPlaceholders.map((source) => ({ source }))]) === 2);

const alphanumericPlaceholders = [
  "Unknown source A1", "Unknown source B2", "Unknown v2", "Source unavailable r3",
  "Unverified source 2026A", "N/A x9", "None build7", "null id42",
  "출처 없음 A1", "출처 불명 v2", "출처 미상 2026B", "미상 id7", "확인 불가 r4",
];

check("mixed alphanumeric placeholder aliases collapse to unverified source",
  alphanumericPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));
check("mixed alphanumeric placeholders cannot manufacture outlet diversity",
  canonicalOutletCount(alphanumericPlaceholders.map((source) => ({ source }))) === 1);
const benignAlphanumericOutlets = ["Studio 54", "Channel A1", "Newsroom 2026A"];
check("ordinary alphanumeric outlet names remain preserved",
  benignAlphanumericOutlets.every((value) => canonicalSourceName(value) !== "Unverified source") &&
  canonicalOutletCount(benignAlphanumericOutlets.map((source) => ({ source }))) === 3);
check("real outlets remain distinct from mixed alphanumeric placeholders",
  canonicalOutletCount([{ source: "Reuters" }, ...alphanumericPlaceholders.map((source) => ({ source }))]) === 2);

console.log(`\nASCII placeholder suffix abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
