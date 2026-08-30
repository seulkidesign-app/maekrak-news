const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const make = (source, time, title) => ({
  title,
  description: title,
  source,
  link: "https://example.com/story",
  publishedAt: time,
  category: "세계",
  scope: "world",
  sourceType: "aggregated",
  sourceRole: source === "Reuters" ? "wire" : source === "BBC" ? "international" : "other",
});

const reuters = make("Reuters", "2026-08-30T10:00:00Z", "Iran sanctions talks resume in Oman Tuesday");
const poison = make("Unverified source", "2026-08-30T09:00:00Z", "Iran sanctions talks resume in Oman Monday");
check("attack article still clusters with verified article", __test.sameEvent(reuters, poison));
check(
  "unverified backfill cannot change verified event ID",
  __test.stableEventId([reuters]) === __test.stableEventId([reuters, poison]),
);

const bbc = make("BBC", "2026-08-30T08:00:00Z", "Iran sanctions talks resume in Oman Wednesday");
check(
  "earlier verified reporting can still define the event identity",
  __test.stableEventId([reuters, poison, bbc]) === __test.stableEventId([reuters, bbc]),
);

const unknownA = make("Unverified source", "2026-08-30T09:00:00Z", "Storm closes airport after flooding Monday");
const unknownB = make("Unverified source", "2026-08-30T10:00:00Z", "Storm closes airport after flooding Tuesday");
check(
  "all-unverified events still receive deterministic IDs",
  __test.stableEventId([unknownA, unknownB]) === __test.stableEventId([unknownB, unknownA]),
);

console.log(`Unverified event ID churn abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
