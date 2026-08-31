const failures = [];
const passes = [];
const { canonicalOutletCount, outletIdentityKey } = await import("../lib/source-normalize.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const variants = [
  { source: "Example News" },
  { source: "Example/News" },
  { source: "Example∕News" }, // U+2215 DIVISION SLASH
  { source: "Example⁄News" }, // U+2044 FRACTION SLASH
];

check(
  "Unicode slash lookalikes cannot inflate one outlet into several",
  canonicalOutletCount(variants) === 1,
  `count=${canonicalOutletCount(variants)}`,
);
check(
  "Unicode slash identity normalization is stable",
  new Set(variants.map((item) => outletIdentityKey(item.source))).size === 1,
);
check(
  "distinct outlet words remain distinct",
  canonicalOutletCount([{ source: "Example News" }, { source: "Example Times" }]) === 2,
);

console.log(`Unicode slash outlet inflation abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
