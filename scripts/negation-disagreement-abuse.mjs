const failures = [];
const passes = [];
const { auditEventAccuracy } = await import("../lib/accuracy.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

function article(title, source) {
  return {
    title,
    description: title,
    source,
    link: `https://example.com/${encodeURIComponent(source)}`,
    publishedAt: new Date().toISOString(),
    category: "정치",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: source === "Reuters" ? "wire" : "international",
  };
}

function event(articles) {
  return {
    id: "negation-regression",
    title: articles[0].title,
    category: "정치",
    scope: "world",
    summary: articles[0].title,
    publishedAt: new Date().toISOString(),
    dayStatus: "today",
    articles,
    sourceCount: articles.length,
    importanceScore: 8,
    whySelected: [],
    briefWhy: "politics",
    briefWatch: "follow-up",
  };
}

const englishConflict = auditEventAccuracy(event([
  article("Government approves the bill after parliament vote", "Reuters"),
  article("Government does not approve the bill after parliament vote", "BBC"),
]));
check("explicit English negation disagreement is surfaced", englishConflict.negationDifference === true);

const contractionConflict = auditEventAccuracy(event([
  article("Company will acquire the rival", "Reuters"),
  article("Company won't acquire the rival", "BBC"),
]));
check("English contraction negation disagreement is surfaced", contractionConflict.negationDifference === true);

const hasntConflict = auditEventAccuracy(event([
  article("Government approved the bill", "Reuters"),
  article("Government hasn't approved the bill", "BBC"),
]));
check("hasn't negation disagreement is surfaced", hasntConflict.negationDifference === true);

const isntConflict = auditEventAccuracy(event([
  article("Government approves the bill", "Reuters"),
  article("Government isn't approving the bill", "BBC"),
]));
check("isn't negation disagreement is surfaced", isntConflict.negationDifference === true);

const wasntConflict = auditEventAccuracy(event([
  article("Government approved the bill", "Reuters"),
  article("Government wasn't approving the bill", "BBC"),
]));
check("wasn't negation disagreement is surfaced", wasntConflict.negationDifference === true);

const couldntConflict = auditEventAccuracy(event([
  article("Government approved the bill", "Reuters"),
  article("Government couldn't approve the bill", "BBC"),
]));
check("couldn't negation disagreement is surfaced", couldntConflict.negationDifference === true);

const shouldntConflict = auditEventAccuracy(event([
  article("Government approves the bill", "Reuters"),
  article("Government shouldn't approve the bill", "BBC"),
]));
check("shouldn't negation disagreement is surfaced", shouldntConflict.negationDifference === true);

const curlyApostropheConflict = auditEventAccuracy(event([
  article("Government approved the bill", "Reuters"),
  article("Government hasn’t approved the bill", "BBC"),
]));
check("curly-apostrophe negation contraction is surfaced", curlyApostropheConflict.negationDifference === true);

const koreanConflict = auditEventAccuracy(event([
  article("정부가 법안을 승인했다", "Reuters"),
  article("정부가 법안을 승인하지 않았다", "BBC"),
]));
check("Korean negation disagreement is surfaced", koreanConflict.negationDifference === true);

const aligned = auditEventAccuracy(event([
  article("Government approves the bill", "Reuters"),
  article("Government backs the bill", "BBC"),
]));
check("aligned affirmative reports do not create negation warning", aligned.negationDifference === false);

const unverifiedPoison = auditEventAccuracy(event([
  article("Government approves the bill", "Reuters"),
  article("Government does not approve the bill", "Unverified source"),
]));
check("unverified negation cannot manufacture a verified-source conflict", unverifiedPoison.negationDifference === false);

const wifeFalsePositive = auditEventAccuracy(event([
  article("대통령 부인 행사 참석", "Reuters"),
  article("대통령 배우자 행사 참석", "BBC"),
]));
check("Korean wife noun does not masquerade as denial", wifeFalsePositive.negationDifference === false);

console.log(`Negation disagreement abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
