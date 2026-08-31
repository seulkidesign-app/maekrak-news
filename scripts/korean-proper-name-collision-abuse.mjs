const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");
function check(name, condition) { if (condition) passes.push(name); else failures.push(name); }
const make = (title, source = "Reuters") => ({
  title, description: title, source, link: "https://example.com/story", publishedAt: "2026-08-31T03:00:00Z",
  category: "경제", scope: "domestic", sourceType: "aggregated",
  sourceRole: source === "Reuters" ? "wire" : "broadcaster",
});
const samsung = make("삼성전자 정부와 함께 차세대 배터리 생산 확대 계획 공식 발표 오늘 서울 행사", "Reuters");
const hyundai = make("현대자동차 정부와 함께 차세대 배터리 생산 확대 계획 공식 발표 오늘 서울 행사", "KBS");
check("different Korean companies are recognized as conflicting proper names", __test.hasProperNameConflict(samsung.title, hyundai.title));
check("different Korean companies are not merged despite template similarity", !__test.sameEvent(samsung, hyundai));
const samsungBusan = make("삼성전자 정부와 함께 차세대 배터리 생산 확대 계획 공식 발표 오늘 부산 행사", "KBS");
check("same Korean company remains mergeable across minor location wording", __test.sameEvent(samsung, samsungBusan));
check("Samsung Electronics token is extracted", __test.properNameTokens(samsung.title).has("삼성전자"));
check("Hyundai Motor token is extracted", __test.properNameTokens(hyundai.title).has("현대자동차"));
const genericEv = __test.properNameTokens("전기자동차 시장 성장 전망과 배터리 가격 변화 분석");
check("generic electric-car phrase is not treated as a company", !genericEv.has("전기자동차"));
console.log("Korean proper-name template collision abuse: " + passes.length + " passed / " + failures.length + " failed");
passes.forEach((name) => console.log("PASS  " + name));
failures.forEach((name) => console.error("FAIL  " + name));
if (failures.length) process.exit(1);
