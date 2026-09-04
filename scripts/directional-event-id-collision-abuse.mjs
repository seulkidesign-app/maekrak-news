const { __test } = await import("../lib/news.ts");

const article = (title) => ({
  title,
  description: title,
  source: "Reuters",
  link: "https://www.reuters.com/world/example",
  publishedAt: "2026-09-04T00:00:00.000Z",
  category: "세계",
  scope: "world",
  sourceType: "aggregated",
  sourceRole: "wire",
});

const cases = [
  ["Iran attacks Israel with missiles", "Israel attacks Iran with missiles", "English actor/target reversal"],
  ["이란이 이스라엘을 공격", "이스라엘이 이란을 공격", "Korean actor/target reversal"],
];

let failed = 0;
for (const [leftTitle, rightTitle, name] of cases) {
  const left = article(leftTitle);
  const right = article(rightTitle);
  if (__test.sameEvent(left, right)) {
    failed += 1;
    console.error(`${name}: reversed events were incorrectly clustered together`);
  }
  const leftId = __test.stableEventId([left]);
  const rightId = __test.stableEventId([right]);
  if (leftId === rightId) {
    failed += 1;
    console.error(`${name}: distinct reversed events received the same stable event ID (${leftId})`);
  }
}

if (failed) process.exit(1);
console.log("Directional event ID collision abuse: 4 passed / 0 failed");
