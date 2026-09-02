const failures = [];
const passes = [];
const { canonicalOutletCount, outletIdentityKey } = await import("../lib/source-normalize.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

// New attack class: dot-like/bullet Unicode separators can render as lightweight
// word separators while remaining distinct code points. A malicious feed can cycle
// through them to make one publisher look like several independent outlets.
const separatorVariants = [
  { source: "Example News" },
  { source: "Example·News" },      // U+00B7 MIDDLE DOT
  { source: "Example•News" },      // U+2022 BULLET
  { source: "Example‧News" },      // U+2027 HYPHENATION POINT
  { source: "Example∙News" },      // U+2219 BULLET OPERATOR
  { source: "Example⋅News" },      // U+22C5 DOT OPERATOR
];

check(
  "dot-like Unicode separator variants of one outlet count once",
  canonicalOutletCount(separatorVariants) === 1,
  `count=${canonicalOutletCount(separatorVariants)}`,
);
check(
  "dot-like separator identity normalization is stable",
  new Set(separatorVariants.map((item) => outletIdentityKey(item.source))).size === 1,
);
check(
  "distinct outlet words remain distinct after separator folding",
  canonicalOutletCount([{ source: "Example News" }, { source: "Example Times" }]) === 2,
);

console.log(`Middle-dot outlet inflation abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
