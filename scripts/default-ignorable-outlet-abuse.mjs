const failures = [];
const passes = [];

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const { canonicalOutletCount, canonicalSourceName, normalizeExternalText, outletIdentityKey } = await import("../lib/source-normalize.ts");

const variants = [
  { source: "Example News" },
  { source: "Example\u00AD News" },
  { source: "Example\u034F News" },
  { source: "Example\uFE0F News" },
  { source: "Example\u2060 News" },
];

check(
  "default-ignorable Unicode variants of one outlet count once",
  canonicalOutletCount(variants) === 1,
  `count=${canonicalOutletCount(variants)} keys=${variants.map((item) => outletIdentityKey(item.source)).join("|")}`,
);

check(
  "soft hyphen is removed from external source text",
  normalizeExternalText("Example\u00AD News") === "Example News",
);

check(
  "combining grapheme joiner is removed from external source text",
  normalizeExternalText("Example\u034F News") === "Example News",
);

check(
  "variation selector is removed from external source text",
  normalizeExternalText("Example\uFE0F News") === "Example News",
);

check(
  "trusted brand cannot be split with a default-ignorable code point",
  canonicalSourceName("Reu\u00ADters") === "Reuters",
);

check(
  "distinct visible outlet names remain distinct",
  canonicalOutletCount([{ source: "Example News" }, { source: "Example Times" }]) === 2,
);

console.log(`\nDefault-ignorable outlet abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
