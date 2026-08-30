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
    link: "https://www.reuters.com/world/test-story",
    publishedAt: new Date().toISOString(),
    category: "세계",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: "wire",
  };
}

check("observation deck compound is not treated as forecast",
  classifyEvidence(article("서울 새 전망대가 오늘 시민에게 개장했다")) === "일반 보도");
check("current-affairs program noun is not treated as uncertainty",
  classifyEvidence(article("방송사가 새 시사 프로그램 편성을 확정했다")) === "일반 보도");
check("implication noun is not treated as uncertain reporting",
  classifyEvidence(article("보고서는 정책의 시사점을 세 가지로 정리했다")) === "일반 보도");
check("real forecast language remains uncertain",
  classifyEvidence(article("정부는 올해 성장률이 낮아질 것으로 전망했다")) === "전망·추정");
check("real suggestive language remains uncertain",
  classifyEvidence(article("이번 결정은 추가 규제 가능성을 시사한다")) === "전망·추정");
check("real plan language remains uncertain",
  classifyEvidence(article("회사는 내년 공장 증설을 계획하고 있다")) === "전망·추정");

console.log(`Korean evidence lexical ambiguity abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
