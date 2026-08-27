const failures = [];
const passes = [];
const check = (name, condition) => (condition ? passes : failures).push(name);

const { auditEventAccuracy } = await import("../lib/accuracy.ts");

function article(title, source) {
  return {
    title,
    description: title,
    source,
    link: `https://example.com/${source}`,
    publishedAt: new Date().toISOString(),
    category: "경제",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: source === "Reuters" ? "wire" : "international",
  };
}

function event(articles) {
  return {
    id: "magnitude-abuse",
    title: articles[0].title,
    category: "경제",
    scope: "world",
    summary: articles[0].title,
    publishedAt: new Date().toISOString(),
    dayStatus: "today",
    articles,
    sourceCount: articles.length,
    importanceScore: 8,
    whySelected: [],
    briefWhy: "economy",
    briefWatch: "follow-up",
  };
}

const millionVsBillion = auditEventAccuracy(event([
  article("Government announces 3 million dollar aid package", "Reuters"),
  article("Government announces 3 billion dollar aid package", "BBC"),
]));
check("million versus billion is detected as a real numeric disagreement", millionVsBillion.headlineNumberDifference);

const equivalentMagnitude = auditEventAccuracy(event([
  article("Government announces 3 million dollar aid package", "Reuters"),
  article("Government announces 3000000 dollar aid package", "BBC"),
]));
check("3 million and 3000000 normalize to the same value", !equivalentMagnitude.headlineNumberDifference);

const koreanMagnitude = auditEventAccuracy(event([
  article("지원 규모 3억 원 발표", "Reuters"),
  article("지원 규모 300000000원 발표", "BBC"),
]));
check("Korean 억 magnitude and raw number normalize to the same value", !koreanMagnitude.headlineNumberDifference);

console.log(`\nNumber magnitude abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
