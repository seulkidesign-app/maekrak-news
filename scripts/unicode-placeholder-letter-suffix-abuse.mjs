const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");

// A malicious or low-quality feed can rotate a single non-ASCII letter after a
// placeholder label and manufacture fake outlet diversity. ASCII A/B/C and numeric
// suffixes are already collapsed; Greek/Cyrillic/Armenian letters must not reopen
// the same trust-counting gap.
const unicodeLetterPlaceholders = [
  "Unknown source Α", // Greek Alpha
  "Unknown source Β", // Greek Beta
  "Unknown source Б", // Cyrillic Be
  "Source unavailable Ж",
  "Unverified source Ω",
  "None Յ", // Armenian Yi
  "null Ա",
  "출처 없음 Α",
  "출처 불명 Б",
  "출처 미상 Ω",
  "확인 불가 Յ",
];

check("Unicode-letter placeholder aliases collapse to unverified source",
  unicodeLetterPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("Unicode-letter placeholder aliases cannot manufacture outlet diversity",
  canonicalOutletCount(unicodeLetterPlaceholders.map((source) => ({ source }))) === 1);

check("real outlets remain distinct from collapsed Unicode placeholder variants",
  canonicalOutletCount([{ source: "Reuters" }, ...unicodeLetterPlaceholders.map((source) => ({ source }))]) === 2);

const benignUnicodeOutlets = ["Αθήνα News", "Новости Б", "Հայ Լուրեր"];
check("ordinary non-ASCII outlet names remain preserved",
  benignUnicodeOutlets.every((value) => canonicalSourceName(value) !== "Unverified source") &&
  canonicalOutletCount(benignUnicodeOutlets.map((source) => ({ source }))) === 3);

console.log(`\nUnicode placeholder letter suffix abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
