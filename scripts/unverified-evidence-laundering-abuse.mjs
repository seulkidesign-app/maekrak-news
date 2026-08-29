const failures = [];
const passes = [];

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const { eventEvidenceSummary } = await import("../lib/signals.ts");

function article(source, title = "Officials confirm the same event") {
  return {
    title,
    description: title,
    source,
    link: `https://example.com/${encodeURIComponent(source)}`,
    publishedAt: new Date().toISOString(),
    category: "세계",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: source === "Reuters" ? "wire" : "other",
  };
}

function event(articles) {
  return {
    id: "evt-unverified-evidence",
    title: articles[0]?.title ?? "event",
    category: "세계",
    scope: "world",
    summary: "event",
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

const trustedPlusUnknown = eventEvidenceSummary(event([
  article("Reuters"),
  article("Unverified source"),
]));
const trustedPlusUnknownTotal = Object.values(trustedPlusUnknown).reduce((sum, value) => sum + value, 0);
check(
  "unverified source does not inflate independent evidence count",
  trustedPlusUnknownTotal === 1,
  `count=${trustedPlusUnknownTotal}`,
);

const placeholderVariants = eventEvidenceSummary(event([
  article("Unknown"),
  article("N/A"),
  article("Source unavailable"),
]));
const placeholderTotal = Object.values(placeholderVariants).reduce((sum, value) => sum + value, 0);
check(
  "placeholder-only reporting contributes zero independent evidence votes",
  placeholderTotal === 0,
  `count=${placeholderTotal}`,
);

const twoIdentified = eventEvidenceSummary(event([
  article("Reuters"),
  article("BBC"),
]));
const twoIdentifiedTotal = Object.values(twoIdentified).reduce((sum, value) => sum + value, 0);
check(
  "two identified publishers still contribute two evidence votes",
  twoIdentifiedTotal === 2,
  `count=${twoIdentifiedTotal}`,
);

const cautiousIdentified = eventEvidenceSummary(event([
  article("Reuters", "Officials confirm the event"),
  article("Reuters", "Officials say outcome could change"),
  article("Unverified source", "Outcome could change"),
]));
check(
  "unverified uncertainty cannot add a second cautious evidence vote",
  cautiousIdentified["전망·추정"] === 1 && Object.values(cautiousIdentified).reduce((sum, value) => sum + value, 0) === 1,
);

console.log(`\nUnverified evidence laundering abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
