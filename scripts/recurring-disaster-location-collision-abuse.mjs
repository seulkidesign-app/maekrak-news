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
    "same-country separate earthquakes",
    item("Japan earthquake strikes Fukushima coast magnitude 5.1", "2026-09-09T00:00:00Z"),
    item("Japan earthquake strikes Okinawa coast magnitude 5.1", "2026-09-09T02:00:00Z"),
  ],
  [
    "same-country separate wildfires",
    item("Canada wildfire forces evacuation near Jasper", "2026-09-09T00:00:00Z"),
    item("Canada wildfire forces evacuation near Kelowna", "2026-09-09T03:00:00Z"),
  ],
  [
    "same-country separate floods",
    item("Japan flood warning issued for Fukuoka after heavy rain", "2026-09-09T00:00:00Z"),
    item("Japan flood warning issued for Hokkaido after heavy rain", "2026-09-09T04:00:00Z"),
  ],
];

let failed = 0;
for (const [name, left, right] of attacks) {
  if (sameEvent(left, right)) {
    failed += 1;
    console.error(`${name}: distinct disaster locations were merged into one event`);
  }
}

const sameIncident = sameEvent(
  item("Japan earthquake strikes Fukushima coast magnitude 5.1", "2026-09-09T00:00:00Z"),
  item("Magnitude 5.1 earthquake strikes Fukushima coast in Japan", "2026-09-09T01:00:00Z"),
);
if (!sameIncident) {
  failed += 1;
  console.error("same-location earthquake reports no longer cluster");
}

if (failed) process.exit(1);
console.log("Recurring disaster location collision abuse: 4 passed / 0 failed");
