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
    publishedAt: "2026-08-31T05:00:00Z",
    category: "경제",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: source === "Reuters" ? "wire" : "international",
  };
}

function event(articles) {
  return {
    id: "negation-scope-regression",
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

const notOnly = auditEventAccuracy(event([
  article("Company not only raises revenue but boosts profit", "Reuters"),
  article("Company raises revenue and boosts profit", "BBC"),
]));
check("not only emphasis does not create a negation disagreement", notOnly.negationDifference === false);

const notJust = auditEventAccuracy(event([
  article("Inflation is not just falling; wage growth is cooling too", "Reuters"),
  article("Inflation is falling and wage growth is cooling", "BBC"),
]));
check("not just emphasis does not create a negation disagreement", notJust.negationDifference === false);

const notMerely = auditEventAccuracy(event([
  article("The move is not merely symbolic; it changes the rules", "Reuters"),
  article("The move changes the rules, beyond symbolism", "BBC"),
]));
check("not merely emphasis does not create a negation disagreement", notMerely.negationDifference === false);

const realConflict = auditEventAccuracy(event([
  article("Company raises guidance after earnings", "Reuters"),
  article("Company does not raise guidance after earnings", "BBC"),
]));
check("real proposition negation is still surfaced", realConflict.negationDifference === true);

const mixedSentence = auditEventAccuracy(event([
  article("Company not only cuts costs but also does not raise guidance", "Reuters"),
  article("Company cuts costs and raises guidance", "BBC"),
]));
check("real negation later in a not-only sentence remains detectable", mixedSentence.negationDifference === true);

console.log(`Negation scope false-positive abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
