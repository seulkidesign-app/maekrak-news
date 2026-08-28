const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { auditEventAccuracy } = await import("../lib/accuracy.ts");

function article(title, source) {
  return {
    title,
    description: title,
    source,
    link: `https://example.com/${source}/story`,
    publishedAt: new Date().toISOString(),
    category: "세계",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: source === "Reuters" ? "wire" : "international",
  };
}

function audit(first, second) {
  return auditEventAccuracy({
    id: "clock-test",
    title: first.title,
    category: "세계",
    scope: "world",
    summary: first.description,
    publishedAt: new Date().toISOString(),
    dayStatus: "today",
    articles: [first, second],
    sourceCount: 2,
    importanceScore: 8,
    whySelected: [],
    briefWhy: "broad-impact",
    briefWatch: "follow-up",
  });
}

const equivalentClock = audit(
  article("Officials say meeting starts at 3:30 PM", "Reuters"),
  article("Officials say meeting starts at 15:30", "BBC"),
);
check("equivalent 12-hour and 24-hour clock times do not create numeric disagreement", !equivalentClock.headlineNumberDifference);

const dottedClock = audit(
  article("Officials say meeting starts at 3.30 p.m.", "Reuters"),
  article("Officials say meeting starts at 15:30", "BBC"),
);
check("dotted clock notation does not create numeric disagreement", !dottedClock.headlineNumberDifference);

const realDifferenceBesideClock = audit(
  article("Meeting starts at 3:30 PM after 4 injuries", "Reuters"),
  article("Meeting starts at 15:30 after 5 injuries", "BBC"),
);
check("real numbers beside clock times still produce disagreement", realDifferenceBesideClock.headlineNumberDifference);

console.log(`\nClock-time number abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
