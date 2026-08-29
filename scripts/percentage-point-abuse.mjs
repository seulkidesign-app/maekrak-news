const failures = [];
const passes = [];
const { auditEventAccuracy } = await import("../lib/accuracy.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

function article(source, title) {
  return {
    title,
    description: title,
    source,
    link: `https://example.com/${source}`,
    publishedAt: "2026-08-30T00:00:00.000Z",
    category: "경제",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: source === "Reuters" ? "wire" : "international",
  };
}

function event(articles) {
  return {
    id: "evt-percentage-point-abuse",
    title: articles[0].title,
    category: "경제",
    scope: "world",
    summary: articles[0].title,
    publishedAt: articles[0].publishedAt,
    dayStatus: "today",
    articles,
    sourceCount: articles.length,
    importanceScore: 8,
    whySelected: [],
    briefWhy: "economy",
    briefWatch: "follow-up",
  };
}

const distinct = auditEventAccuracy(event([
  article("Reuters", "Approval rating rises 2 percentage points to 52%"),
  article("BBC", "Approval rating rises 2% to 52%"),
]));
check("percentage points are not collapsed into percent", distinct.headlineNumberDifference);
check("percentage-point token is preserved in audit examples",
  distinct.numberExamples.some((row) => row.values.includes("2PP")));

const equivalent = auditEventAccuracy(event([
  article("Reuters", "Approval rating rises 2 percentage points to 52%"),
  article("BBC", "Approval rating rises 2 percentage points to 52 percent"),
]));
check("equivalent percentage-point wording stays equivalent", !equivalent.headlineNumberDifference);

const koreanDistinct = auditEventAccuracy(event([
  article("Reuters", "지지율이 2퍼센트포인트 상승해 52%"),
  article("BBC", "지지율이 2퍼센트 상승해 52%"),
]));
check("Korean 퍼센트포인트 is distinct from 퍼센트", koreanDistinct.headlineNumberDifference);

console.log(`Percentage-point abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
