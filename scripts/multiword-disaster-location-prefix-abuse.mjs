const { __test } = await import("../lib/news.ts");
const { sameEvent } = __test;

function item(title, publishedAt) {
  return {
    title,
    link: `https://example.com/${encodeURIComponent(title)}`,
    source: "Reuters",
    publishedAt,
    category: "재난",
    scope: "world",
    description: "",
    sourceType: "aggregated",
    sourceRole: "wire",
  };
}

const attacks = [
  [
    "shared New prefix must not merge New York and New Delhi floods",
    item("Flood hits New York after heavy rain forces evacuations", "2026-09-09T00:00:00Z"),
    item("Flood hits New Delhi after heavy rain forces evacuations", "2026-09-09T02:00:00Z"),
  ],
  [
    "shared Port prefix must not merge Port Sudan and Port Vila earthquakes",
    item("Earthquake strikes Port Sudan as residents flee buildings", "2026-09-09T00:00:00Z"),
    item("Earthquake strikes Port Vila as residents flee buildings", "2026-09-09T03:00:00Z"),
  ],
];

let failed = 0;
for (const [name, left, right] of attacks) {
  if (sameEvent(left, right)) {
    failed += 1;
    console.error(`${name}: distinct multi-word disaster locations were merged`);
  }
}

const sameIncident = sameEvent(
  item("Flood hits New York after heavy rain forces evacuations", "2026-09-09T00:00:00Z"),
  item("Heavy rain forces evacuations as flood hits New York", "2026-09-09T01:00:00Z"),
);
if (!sameIncident) {
  failed += 1;
  console.error("same New York flood reports no longer cluster");
}

if (failed) process.exit(1);
console.log("Multi-word disaster location prefix abuse: 3 passed / 0 failed");
