const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");

const obfuscatedPlaceholders = [
  "N.A.",
  "N-A",
  "N A",
  "N_A",
  "Unknown-Source",
  "Unknown_Source",
  "Source.Unavailable",
  "Source_unavailable",
  "Unverified-Source",
  "Unknown/Source #2",
];

const koreanPlaceholders = [
  "출처 없음",
  "출처-없음",
  "출처_없음",
  "출처 불명",
  "출처 미상",
  "알 수 없음",
  "미상",
  "확인 불가",
  "출처 없음 #2",
];

check("separator-obfuscated placeholders collapse to unverified",
  obfuscatedPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("separator variants cannot manufacture outlet diversity",
  canonicalOutletCount(obfuscatedPlaceholders.map((source) => ({ source }))) === 1);

check("Korean placeholder variants collapse to unverified",
  koreanPlaceholders.every((value) => canonicalSourceName(value) === "Unverified source"));

check("Korean placeholders cannot manufacture outlet diversity",
  canonicalOutletCount(koreanPlaceholders.map((source) => ({ source }))) === 1);

check("real outlet with slash-like placeholder prefix stays intact",
  canonicalSourceName("N/A News") === "N/A News");

check("real hyphenated outlet stays intact",
  canonicalSourceName("North-America Daily") === "North-America Daily");

check("real Korean outlet containing placeholder word stays intact",
  canonicalSourceName("미상일보") === "미상일보");

check("trusted source stays distinct from obfuscated placeholders",
  canonicalOutletCount([{ source: "Reuters" }, ...obfuscatedPlaceholders.map((source) => ({ source })), ...koreanPlaceholders.map((source) => ({ source }))]) === 2);

console.log(`\nSeparator placeholder outlet abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
