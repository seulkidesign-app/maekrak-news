const failures = [];
const passes = [];
const { auditEventAccuracy } = await import("../lib/accuracy.ts");
function check(name, condition) { if (condition) passes.push(name); else failures.push(name); }
const article = (title, source) => ({ title, description: title, source, link: "https://example.com/story", publishedAt: "2026-08-31T00:00:00Z", category: "경제", scope: "world", sourceType: "aggregated", sourceRole: source === "Reuters" ? "wire" : "international" });
const event = (...articles) => ({ id: "number-label", title: articles[0]?.title ?? "", category: "경제", scope: "world", summary: "", publishedAt: "2026-08-31T00:00:00Z", dayStatus: "today", articles, sourceCount: articles.length, importanceScore: 7, whySelected: [], briefWhy: "economy", briefWatch: "follow-up" });
const rank = auditEventAccuracy(event(article("Company ranked No. 5 globally", "Reuters"), article("Company ranked fifth globally", "BBC")));
check("No. 5 ranking label does not create negation disagreement", !rank.negationDifference && rank.negationExamples.every((item) => !item.negated));
const rankNoDot = auditEventAccuracy(event(article("Team is No 1 in exports", "Reuters"), article("Team is number one in exports", "BBC")));
check("No 1 label without a period is not treated as negation", !rankNoDot.negationDifference && rankNoDot.negationExamples.every((item) => !item.negated));
const realNo = auditEventAccuracy(event(article("Government says no agreement was reached", "Reuters"), article("Government says agreement was reached", "BBC")));
check("real no negation still triggers a disagreement", realNo.negationDifference);
const realNot = auditEventAccuracy(event(article("Company did not approve the merger", "Reuters"), article("Company approved the merger", "BBC")));
check("existing not-negation detection remains active", realNot.negationDifference);
console.log("Number-label negation ambiguity abuse: " + passes.length + " passed / " + failures.length + " failed");
passes.forEach((name) => console.log("PASS  " + name));
failures.forEach((name) => console.error("FAIL  " + name));
if (failures.length) process.exit(1);
