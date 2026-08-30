const failures = [];
const passes = [];
const { auditEventAccuracy } = await import("../lib/accuracy.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}
function article(source, title, publishedAt) {
  return { title, description: title, source, link: "https://example.com", publishedAt, category: "세계", scope: "world", sourceType: "aggregated", sourceRole: source.toLowerCase() === "reuters" ? "wire" : "international" };
}
function event(articles) {
  return { id: "evt_accuracy_correction", title: "Rate update", category: "경제", scope: "world", summary: "Rate update", publishedAt: "2026-08-30T10:45:00.000Z", dayStatus: "today", articles, sourceCount: 2, importanceScore: 8, whySelected: [], briefWhy: "economy", briefWatch: "follow-up" };
}

const corrected = auditEventAccuracy(event([
  article("Reuters", "Central bank cuts rate by 0.5%", "2026-08-30T10:05:00.000Z"),
  article("BBC", "Central bank cuts rate by 0.25%", "2026-08-30T10:20:00.000Z"),
  article("REUTERS", "Correction: Central bank cuts rate by 0.25%", "2026-08-30T10:42:00.000Z"),
]));
check("latest same-publisher correction replaces stale numeric claim", !corrected.headlineNumberDifference, JSON.stringify(corrected.numberExamples));
check("publisher correction does not inflate outlet count", corrected.outletCount === 2, String(corrected.outletCount));
check("audit exposes corrected Reuters value", corrected.numberExamples.some(x => x.source === "Reuters" && x.values.includes("0.25%")), JSON.stringify(corrected.numberExamples));
check("audit drops stale Reuters value", !corrected.numberExamples.some(x => x.source === "Reuters" && x.values.includes("0.5%")), JSON.stringify(corrected.numberExamples));

const realConflict = auditEventAccuracy(event([
  article("Reuters", "Central bank cuts rate by 0.5%", "2026-08-30T10:42:00.000Z"),
  article("BBC", "Central bank cuts rate by 0.25%", "2026-08-30T10:20:00.000Z"),
]));
check("real latest cross-publisher numeric conflict remains visible", realConflict.headlineNumberDifference, JSON.stringify(realConflict.numberExamples));

console.log(`Accuracy correction abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach(name => console.log(`PASS  ${name}`));
failures.forEach(name => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
