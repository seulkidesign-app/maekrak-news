const failures = [];
const passes = [];
function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const { auditEventAccuracy } = await import("../lib/accuracy.ts");

function article(title, source) {
  return {
    title,
    description: title,
    source,
    link: `https://example.com/${encodeURIComponent(source)}`,
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
    summary: articles[0].description,
    publishedAt: new Date().toISOString(),
    dayStatus: "today",
    articles,
    sourceCount: articles.length,
    importanceScore: 7,
    whySelected: [],
    briefWhy: "broad-impact",
    briefWatch: "follow-up",
  };
}

const weightAudit = auditEventAccuracy(event("weight", [
  article("Newborn weighs 7 pounds after delivery", "Reuters"),
  article("Newborn weighs 7 lbs after delivery", "BBC"),
]));
check("weight pounds and lbs do not trigger a false numeric disagreement", !weightAudit.headlineNumberDifference);
check("weight pounds are not mislabeled as GBP in trust examples",
  weightAudit.numberExamples.every((item) => item.values.every((value) => !value.endsWith("GBP"))));

const sterlingAudit = auditEventAccuracy(event("sterling", [
  article("Fund raises £7 million for expansion", "Reuters"),
  article("Fund raises GBP 7 million for expansion", "BBC"),
]));
check("explicit sterling symbols and codes still normalize as GBP",
  !sterlingAudit.headlineNumberDifference && sterlingAudit.numberExamples.every((item) => item.values.includes("7000000GBP")));

console.log(`\nUnit ambiguity abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
