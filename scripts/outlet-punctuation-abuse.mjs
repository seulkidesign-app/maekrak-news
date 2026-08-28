const failures = [];
const passes = [];

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const { canonicalOutletCount, canonicalSourceName, outletIdentityKey } = await import("../lib/source-normalize.ts");

const punctuationVariants = [
  { source: "Example News" },
  { source: "Example-News" },
  { source: "Example.News" },
  { source: "EXAMPLE_NEWS" },
];

check(
  "punctuation variants of one unknown outlet count once",
  canonicalOutletCount(punctuationVariants) === 1,
  `count=${canonicalOutletCount(punctuationVariants)}`,
);

check(
  "punctuation identity normalization is stable",
  new Set(punctuationVariants.map((item) => outletIdentityKey(item.source))).size === 1,
);

check(
  "distinct unknown outlet names remain distinct",
  canonicalOutletCount([{ source: "Example News" }, { source: "Example Times" }]) === 2,
);

check(
  "display canonicalization does not falsely promote unknown outlets",
  canonicalSourceName("Example-News") === "Example-News",
);

console.log(`\nOutlet punctuation inflation abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
