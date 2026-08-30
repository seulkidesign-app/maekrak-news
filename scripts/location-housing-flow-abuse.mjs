const failures = [];
const passes = [];
const { buildWorldFlows } = await import("../lib/world-briefing.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

function article(title, source = "연합뉴스") {
  return {
    title,
    description: title,
    source,
    link: `https://example.com/${encodeURIComponent(title)}`,
    publishedAt: "2026-08-30T06:00:00.000Z",
    category: "국내",
    scope: "domestic",
    sourceType: "direct",
    sourceRole: "wire",
  };
}

function event(id, title, importanceScore) {
  return {
    id,
    title,
    category: "국내",
    scope: "domestic",
    summary: title,
    publishedAt: "2026-08-30T06:00:00.000Z",
    dayStatus: "today",
    articles: [article(title)],
    sourceCount: 1,
    importanceScore,
    whySelected: [],
    briefWhy: "politics",
    briefWatch: "single-source",
  };
}

const locationOnly = [
  event("yongsan-diplomacy", "용산 대통령실에서 해외 정상 외교 일정 발표", 9),
  event("yongsan-rail", "용산역 철도 운행 장애 복구 후 정상화", 8),
];
const poisonedFlow = buildWorldFlows(locationOnly, "ko").find((flow) => flow.code === "korea");
check("shared Yongsan place name does not manufacture a housing flow", !poisonedFlow);

const streamOnly = [
  event("tancheon-sports", "탄천 인근 체육행사 교통 통제", 9),
  event("tancheon-walk", "탄천 산책로 일부 구간 야간 통행 제한", 8),
];
const streamFlow = buildWorldFlows(streamOnly, "ko").find((flow) => flow.code === "korea");
check("shared Tancheon place name does not manufacture a housing flow", !streamFlow);

const realHousing = [
  event("housing-supply", "서울 주택 공급 계획 발표", 9),
  event("housing-rules", "수도권 부동산 규제 조정 논의", 8),
];
const housingFlow = buildWorldFlows(realHousing, "ko").find((flow) => flow.code === "korea");
check("real housing stories can still form a Korea policy flow", Boolean(housingFlow && housingFlow.eventIds.length === 2));

console.log(`Location housing-flow abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
