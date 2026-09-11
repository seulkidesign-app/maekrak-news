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

const sameLocationVariants = [
  [
    "title-case attribution after New York must not create a fake location conflict",
    item("Earthquake hits New York as residents evacuate", "2026-09-11T00:00:00Z"),
    item("Earthquake hits New York Officials Say as residents evacuate", "2026-09-11T01:00:00Z"),
  ],
  [
    "title-case response phrase after Port Vila must not split one cyclone incident",
    item("Storm hits Port Vila as residents seek shelter", "2026-09-11T00:00:00Z"),
    item("Storm hits Port Vila Emergency Teams Respond as residents seek shelter", "2026-09-11T02:00:00Z"),
  ],
];

let failed = 0;
for (const [name, left, right] of sameLocationVariants) {
  if (!sameEvent(left, right)) {
    failed += 1;
    console.error(`${name}: same disaster was split by title-case tail poisoning`);
  }
}

const distinctLocations = sameEvent(
  item("Earthquake hits New York as residents evacuate", "2026-09-11T00:00:00Z"),
  item("Earthquake hits New Delhi as residents evacuate", "2026-09-11T01:00:00Z"),
);
if (distinctLocations) {
  failed += 1;
  console.error("distinct New York and New Delhi earthquakes were merged");
}

if (failed) process.exit(1);
console.log("Disaster location title-case tail abuse: 3 passed / 0 failed");
