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

// Enclosed/compatibility letters also NFKC-fold to plain ASCII letters. A feed can
// rotate them (Ⓐ, Ⓑ, Ⓒ...) to make placeholders look like independent publishers.
const compatibilityLetterPlaceholders = [
  "Unknown source Ⓐ",
  "Unknown source Ⓑ",
  "Unknown Ⓒ",
  "Source unavailable ⓓ",
  "Unverified source ⓔ",
  "출처 없음 Ⓕ",
  "출처 불명 Ⓖ",
  "출처 미상 Ⓗ",
  "미상 Ⓘ",
  "확인 불가 Ⓙ",
];

check("numbered placeholder aliases collapse to unverified source",
  numberedPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("concatenated numeric placeholder aliases collapse to unverified source",
  concatenatedPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("Roman-numeral placeholder aliases collapse to unverified source",
  romanNumeralPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("compatibility-letter placeholder aliases collapse to unverified source",
  compatibilityLetterPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("numbered, concatenated, Roman-numeral, and compatibility-letter placeholders cannot manufacture outlet diversity",
  canonicalOutletCount([...numberedPlaceholders, ...concatenatedPlaceholders, ...romanNumeralPlaceholders, ...compatibilityLetterPlaceholders].map((source) => ({ source }))) === 1);

check("numbered real outlet names are preserved",
  canonicalSourceName("Channel News 24") === "Channel News 24");

check("real outlets with attached digits remain preserved",
  canonicalSourceName("Channel News24") === "Channel News24");

check("real outlets with Roman numerals remain verified as ordinary outlet names",
  canonicalSourceName("Channel News Ⅳ") !== "Unverified source");

check("Roman numeral compatibility folding does not split a legitimate outlet identity",
  canonicalOutletCount([{ source: "Channel News Ⅳ" }, { source: "Channel News IV" }]) === 1);

check("real outlets with enclosed letters remain ordinary outlet names",
  canonicalSourceName("Channel News Ⓐ") !== "Unverified source");

check("enclosed-letter compatibility folding does not split a legitimate outlet identity",
  canonicalOutletCount([{ source: "Channel News Ⓐ" }, { source: "Channel News A" }]) === 1);

check("real outlets remain distinct from placeholder variants",
  canonicalOutletCount([{ source: "Reuters" }, ...numberedPlaceholders.map((source) => ({ source })), ...concatenatedPlaceholders.map((source) => ({ source })), ...romanNumeralPlaceholders.map((source) => ({ source })), ...compatibilityLetterPlaceholders.map((source) => ({ source }))]) === 2);

console.log(`\nNumbered/concatenated/Roman-numeral/compatibility-letter placeholder outlet abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);