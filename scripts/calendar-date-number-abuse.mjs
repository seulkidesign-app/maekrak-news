const { auditEventAccuracy } = await import("../lib/accuracy.ts");

const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

function article(title, source) {
  return {
    title,
    description: title,
    source,
    link: `https://example.com/${source}`,
    publishedAt: new Date().toISOString(),
    category: "세계",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: source === "Reuters" ? "wire" : "international",
  };
}

function event(id, articles) {
  return {
    id,
    title: articles[0].title,
    category: "세계",
    scope: "world",
    summary: articles[0].title,
    publishedAt: new Date().toISOString(),
    dayStatus: "today",
    articles,
    sourceCount: articles.length,
    importanceScore: 8,
    whySelected: [],
    briefWhy: "broad-impact",
    briefWatch: "follow-up",
  };
}

const isoVsMonth = auditEventAccuracy(event("date-iso-month", [
  article("Summit scheduled for 2026-08-28", "Reuters"),
  article("Summit scheduled for Aug 28, 2026", "BBC"),
]));
check("ISO and English-month date formats do not create numeric conflict", !isoVsMonth.headlineNumberDifference);

const dmyVsKorean = auditEventAccuracy(event("date-dmy-korean", [
  article("Meeting confirmed for 28/08/2026", "Reuters"),
  article("Meeting confirmed for 2026년 8월 28일", "BBC"),
]));
check("day-month-year and Korean date formats do not create numeric conflict", !dmyVsKorean.headlineNumberDifference);

const dateWithSameNumber = auditEventAccuracy(event("date-same-count", [
  article("On 2026-08-28, officials report 4 injuries", "Reuters"),
  article("On Aug 28, 2026, officials report 4 injuries", "BBC"),
]));
check("same real number beside differently formatted dates stays equal", !dateWithSameNumber.headlineNumberDifference);

const dateWithDifferentNumber = auditEventAccuracy(event("date-different-count", [
  article("On 2026-08-28, officials report 4 injuries", "Reuters"),
  article("On Aug 28, 2026, officials report 5 injuries", "BBC"),
]));
check("real numeric disagreement beside dates is still detected", dateWithDifferentNumber.headlineNumberDifference);

console.log(`\nCalendar-date number abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
