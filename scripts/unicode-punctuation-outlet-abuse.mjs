const failures = [];
const passes = [];

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const { canonicalOutletCount, outletIdentityKey } = await import("../lib/source-normalize.ts");

const dashVariants = [
  { source: "Example-News" },
  { source: "Example–News" },
  { source: "Example—News" },
  { source: "Example‒News" },
];

check(
  "Unicode dash variants cannot inflate one outlet into several",
  canonicalOutletCount(dashVariants) === 1,
  `count=${canonicalOutletCount(dashVariants)}`,
);

const apostropheVariants = [
  { source: "People's Daily" },
  { source: "People’s Daily" },
  { source: "People‘S Daily" },
  { source: "Peopleʼs Daily" },
];

check(
  "typographic apostrophe variants share one outlet identity",
  canonicalOutletCount(apostropheVariants) === 1,
  `count=${canonicalOutletCount(apostropheVariants)}`,
);

check(
  "Unicode punctuation normalization remains deterministic",
  new Set([...dashVariants, ...apostropheVariants].map((item) => outletIdentityKey(item.source))).size === 2,
);

const domainDelimiterVariants = [
  { source: "desk.publisher.example" },
  { source: "desk.publisher。example" },
  { source: "desk.publisher｡example" },
];

check(
  "Unicode hostname dot aliases cannot inflate one publisher into several",
  canonicalOutletCount(domainDelimiterVariants) === 1,
  `identities=${domainDelimiterVariants.map((item) => outletIdentityKey(item.source)).join(" | ")}`,
);

check(
  "genuinely different outlet names remain distinct",
  canonicalOutletCount([{ source: "Example-News" }, { source: "Example-Times" }]) === 2,
);

check(
  "different registrable publisher domains remain distinct",
  canonicalOutletCount([{ source: "desk.publisher.example" }, { source: "desk.other.example" }]) === 2,
);

console.log(`\nUnicode punctuation outlet abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
