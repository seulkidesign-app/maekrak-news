const failures = [];
const passes = [];

const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const maliciousPlaceholders = [
  "Unknown source ᴬ",
  "Unknown source ᵃ",
  "Unknown source ₐ",
  "Source unknown ᴮ",
  "출처 미상 ᶜ",
];

for (const source of maliciousPlaceholders) {
  check(`${JSON.stringify(source)} compatibility-letter suffix is unverified`, canonicalSourceName(source) === "Unverified source", `canonical=${JSON.stringify(canonicalSourceName(source))}`);
}

check(
  "modifier/subscript placeholder variants cannot inflate independent outlet count",
  canonicalOutletCount(maliciousPlaceholders.map((source) => ({ source }))) === 1,
  `count=${canonicalOutletCount(maliciousPlaceholders.map((source) => ({ source })))}`,
);

const legitimate = [
  { source: "Channel News ᴬ" },
  { source: "Channel News ᴮ" },
];
check(
  "non-placeholder outlet names with compatibility-letter suffixes are not collapsed to unverified",
  legitimate.every(({ source }) => canonicalSourceName(source) !== "Unverified source"),
);

console.log(`Compatibility placeholder letter abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
