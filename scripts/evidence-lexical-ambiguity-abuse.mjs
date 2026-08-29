const failures = [];
const passes = [];
const { classifyEvidence } = await import("../lib/signals.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

function article(title) {
  return {
    title,
    description: title,
    source: "Reuters",
    link: "https://reuters.com/world/test",
    publishedAt: new Date().toISOString(),
    category: "경제",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: "wire",
  };
}

check(
  "jobless claims data is not mislabeled as a speaker claim",
  classifyEvidence(article("US weekly jobless claims fall to 210,000")) === "일반 보도",
);
check(
  "unemployment benefit claims are not mislabeled as assertions",
  classifyEvidence(article("Claims for unemployment benefits decline for a third week")) === "일반 보도",
);
check(
  "financial statement is treated as a document rather than a speaker statement",
  classifyEvidence(article("Company files annual financial statement with regulator")) === "일반 보도",
);
check(
  "bank statement is treated as a document rather than a speaker statement",
  classifyEvidence(article("Court reviews bank statements in audit record")) === "일반 보도",
);
check(
  "actual claims verb remains claim language",
  classifyEvidence(article("Minister claims the vote was manipulated")) === "발언·주장",
);
check(
  "actual issued statement remains claim language",
  classifyEvidence(article("Minister issues statement denying the allegation")) === "발언·주장",
);
check(
  "according-to attribution remains claim language",
  classifyEvidence(article("Policy will change next month, according to the ministry")) === "발언·주장",
);

console.log(`Evidence lexical ambiguity abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
