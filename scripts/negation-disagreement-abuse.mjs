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

const refuteConflict = auditEventAccuracy(event([
  article("Iran attacked Israel with missiles", "Reuters"),
  article("Officials refute reports that Iran attacked Israel with missiles", "BBC"),
]));
check("semantic refute denial cannot launder an affirmative report", refuteConflict.negationDifference === true);

const debunkConflict = auditEventAccuracy(event([
  article("Iran attacked Israel with missiles", "Reuters"),
  article("Investigation debunks claim that Iran attacked Israel with missiles", "BBC"),
]));
check("semantic debunk denial cannot launder an affirmative report", debunkConflict.negationDifference === true);

const ruleOutConflict = auditEventAccuracy(event([
  article("Officials say Iran attacked Israel with missiles", "Reuters"),
  article("Officials rule out Iran attack on Israel", "BBC"),
]));
check("rule-out denial cannot launder an affirmative report", ruleOutConflict.negationDifference === true);

const koreanRefuteConflict = auditEventAccuracy(event([
  article("이란이 이스라엘을 미사일로 공격했다", "Reuters"),
  article("당국, 이란의 이스라엘 공격 보도 반박했다", "BBC"),
]));
check("Korean rebuttal wording cannot launder an affirmative report", koreanRefuteConflict.negationDifference === true);

const rulesPositiveControl = auditEventAccuracy(event([
  article("Court rules on the attack case", "Reuters"),
  article("Court issues ruling on the attack case", "BBC"),
]));
check("ordinary rules wording is not mistaken for rule-out denial", rulesPositiveControl.negationDifference === false);

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

const noFewerFalsePositive = auditEventAccuracy(event([
  article("No fewer than 10 people were evacuated after the fire", "Reuters"),
  article("At least 10 people were evacuated after the fire", "BBC"),
]));
check("no-fewer-than quantitative bound is not treated as propositional negation", noFewerFalsePositive.negationDifference === false);

const noMoreFalsePositive = auditEventAccuracy(event([
  article("No more than 20 flights were canceled", "Reuters"),
  article("At most 20 flights were canceled", "BBC"),
]));
check("no-more-than quantitative bound is not treated as propositional negation", noMoreFalsePositive.negationDifference === false);

const notLessFalsePositive = auditEventAccuracy(event([
  article("Turnout was not less than 60 percent", "Reuters"),
  article("Turnout was at least 60 percent", "BBC"),
]));
check("not-less-than comparative bound is not treated as propositional negation", notLessFalsePositive.negationDifference === false);

const realNoConflict = auditEventAccuracy(event([
  article("Government says an agreement was reached", "Reuters"),
  article("Government says no agreement was reached", "BBC"),
]));
check("ordinary no-negation still produces a disagreement warning", realNoConflict.negationDifference === true);

console.log(`Negation disagreement abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
