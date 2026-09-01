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

// Unicode Roman numerals are compatibility characters. NFKC turns them into ASCII
// letters (Ⅱ -> II, Ⅳ -> IV), which must not let machine-generated placeholder
// labels masquerade as distinct publishers.
const romanNumeralPlaceholders = [
  "Unknown source Ⅱ",
  "Unknown Ⅲ",
  "Source unavailable Ⅳ",
  "Unverified source (Ⅴ)",
  "출처 없음 Ⅵ",
  "출처 불명Ⅶ",
  "출처 미상 Ⅷ",
  "미상Ⅸ",
  "확인 불가 Ⅹ",
];

check("numbered placeholder aliases collapse to unverified source",
  numberedPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("concatenated numeric placeholder aliases collapse to unverified source",
  concatenatedPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("Roman-numeral placeholder aliases collapse to unverified source",
  romanNumeralPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("numbered, concatenated, and Roman-numeral placeholders cannot manufacture outlet diversity",
  canonicalOutletCount([...numberedPlaceholders, ...concatenatedPlaceholders, ...romanNumeralPlaceholders].map((source) => ({ source }))) === 1);

check("numbered real outlet names are preserved",
  canonicalSourceName("Channel News 24") === "Channel News 24");

check("real outlets with attached digits remain preserved",
  canonicalSourceName("Channel News24") === "Channel News24");

check("real outlets with Roman numerals remain preserved",
  canonicalSourceName("Channel News Ⅳ") === "Channel News IV");

check("real outlets remain distinct from numbered placeholders",
  canonicalOutletCount([{ source: "Reuters" }, ...numberedPlaceholders.map((source) => ({ source })), ...concatenatedPlaceholders.map((source) => ({ source })), ...romanNumeralPlaceholders.map((source) => ({ source }))]) === 2);

console.log(`\nNumbered/concatenated/Roman-numeral placeholder outlet abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);