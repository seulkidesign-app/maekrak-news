const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const article = (link, publishedAt) => ({
  title: "Central bank announces rate decision",
  description: "Central bank announces rate decision",
  source: "Reuters",
  link,
  publishedAt,
  category: "경제",
  scope: "world",
  sourceType: "aggregated",
  sourceRole: "wire",
});

const trackerAliases = [
  "gbraid=AAA",
  "wbraid=BBB",
  "msclkid=CCC",
  "dclid=DDD",
  "twclid=EEE",
  "igshid=FFF",
  "_gl=GGG",
];

for (const tracker of trackerAliases) {
  const deduped = __test.dedupeNews([
    article("https://www.reuters.com/world/story-tracker?x=1", "2026-09-01T18:00:00Z"),
    article(`https://www.reuters.com/world/story-tracker?x=1&${tracker}`, "2026-09-01T18:05:00Z"),
  ]);
  check(`${tracker.split("=")[0]} cannot inflate one article into two`, deduped.length === 1);
  check(`${tracker.split("=")[0]} keeps the newest revision`, deduped[0]?.publishedAt === "2026-09-01T18:05:00Z");
}

const meaningful = __test.dedupeNews([
  article("https://www.reuters.com/live?id=alpha", "2026-09-01T18:00:00Z"),
  article("https://www.reuters.com/live?id=beta", "2026-09-01T18:05:00Z"),
]);
check("meaningful query IDs remain distinct", meaningful.length === 2);

console.log(`Tracker alias dedupe abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
