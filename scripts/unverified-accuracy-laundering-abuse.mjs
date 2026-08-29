const failures = [];
const passes = [];
const { auditEventAccuracy } = await import("../lib/accuracy.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

function article(source, title, description = title) {
  return {
    source,
    title,
    description,
    link: `https://example.com/${encodeURIComponent(source)}`,
    publishedAt: new Date().toISOString(),
    category: "경제",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: source === "Reuters" || source === "BBC" ? "international" : "other",
  };
}

function event(articles) {
  return {
    id: "unverified-accuracy-laundering",
    title: articles[0]?.title ?? "event",
    category: "경제",
    scope: "world",
    summary: "",
    publishedAt: new Date().toISOString(),
    dayStatus: "today",
    articles,
    sourceCount: articles.length,
    importanceScore: 5,
    whySelected: [],
    briefWhy: "economy",
    briefWatch: "follow-up",
  };
}

const anonymousConflict = auditEventAccuracy(event([
  article("Reuters", "Inflation rises 3% after monthly report"),
  article("Unknown source", "Inflation may rise 99% after monthly report"),
]));
check("unverified outlet does not inflate independent outlet count", anonymousConflict.outletCount === 1, `count=${anonymousConflict.outletCount}`);
check("unverified numeric claim cannot manufacture a cross-source number warning", !anonymousConflict.headlineNumberDifference);
check("unverified uncertainty wording cannot manufacture a certainty warning", !anonymousConflict.certaintyDifference);
check("unverified outlet is absent from numeric examples", anonymousConflict.numberExamples.every((item) => item.source !== "Unverified source"));
check("unverified outlet is absent from certainty examples", anonymousConflict.certaintyExamples.every((item) => item.source !== "Unverified source"));

const verifiedConflict = auditEventAccuracy(event([
  article("Reuters", "Inflation rises 3% after monthly report"),
  article("BBC", "Inflation may rise 4% after monthly report"),
  article("Source unavailable", "Inflation rises 99% after monthly report"),
]));
check("two verified publishers still count as two outlets", verifiedConflict.outletCount === 2, `count=${verifiedConflict.outletCount}`);
check("real verified numeric disagreement still raises a warning", verifiedConflict.headlineNumberDifference);
check("real verified certainty disagreement still raises a warning", verifiedConflict.certaintyDifference);

const anonymousOnly = auditEventAccuracy(event([
  article("N/A", "Market falls 40%"),
  article("Unknown source #2", "Market rises 90%"),
]));
check("anonymous-only event has zero independently identified outlets", anonymousOnly.outletCount === 0, `count=${anonymousOnly.outletCount}`);
check("anonymous-only disagreement is not presented as cross-source verification conflict", !anonymousOnly.headlineNumberDifference && !anonymousOnly.certaintyDifference);

console.log(`Unverified accuracy laundering abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
