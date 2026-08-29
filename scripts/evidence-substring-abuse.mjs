const failures = [];
const passes = [];
const { classifyEvidence } = await import("../lib/signals.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

function article(title, description = title) {
  return {
    title,
    description,
    source: "Reuters",
    link: "https://www.reuters.com/world/test-story",
    publishedAt: new Date().toISOString(),
    category: "세계",
    scope: "world",
    sourceType: "direct",
    sourceRole: "wire",
  };
}

check(
  "Mayor substring does not impersonate uncertainty token may",
  classifyEvidence(article("Mayor opens bridge after council vote")) === "일반 보도",
);
check(
  "Planet substring does not impersonate uncertainty token plan",
  classifyEvidence(article("Planet mission reaches orbit after launch")) === "일반 보도",
);
check(
  "real standalone may remains uncertainty",
  classifyEvidence(article("Company may delay factory launch")) === "전망·추정",
);
check(
  "real standalone plans remains uncertainty",
  classifyEvidence(article("Company plans factory expansion next year")) === "전망·추정",
);
check(
  "real claim wording remains a claim",
  classifyEvidence(article("Minister said the bill will be introduced Friday")) === "발언·주장",
);

console.log(`Evidence substring abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
