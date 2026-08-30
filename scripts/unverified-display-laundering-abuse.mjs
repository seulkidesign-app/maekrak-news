const failures = [];
const passes = [];
const { getDisplayArticle } = await import("../lib/news.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const now = new Date().toISOString();
const verified = {
  title: "Central bank holds rates after inflation report",
  description: "The central bank held interest rates steady after reviewing the latest inflation data and economic outlook.",
  source: "Reuters",
  link: "https://www.reuters.com/world/example",
  publishedAt: now,
  category: "경제",
  scope: "world",
  sourceType: "aggregated",
  sourceRole: "wire",
};
const unverifiedKorean = {
  title: "중앙은행이 금리를 10% 인상했다는 미확인 주장",
  description: "출처가 확인되지 않은 한국어 설명이지만 언어 선호 점수만으로 대표 기사에 올라가면 안 됩니다.",
  source: "Unverified source",
  link: "https://example.invalid/story",
  publishedAt: now,
  category: "경제",
  scope: "world",
  sourceType: "aggregated",
  sourceRole: "other",
};
const event = {
  id: "evt_display_laundering",
  title: verified.title,
  category: "경제",
  scope: "world",
  summary: verified.description,
  publishedAt: now,
  dayStatus: "today",
  articles: [unverifiedKorean, verified],
  sourceCount: 1,
  importanceScore: 5,
  whySelected: [],
  briefWhy: "economy",
  briefWatch: "single-source",
};

const koreanPick = getDisplayArticle(event, "ko");
check("verified article beats unverified Korean-language bait", koreanPick.source === "Reuters", `picked=${koreanPick.source}`);

const unverifiedOnly = { ...event, articles: [unverifiedKorean], sourceCount: 0 };
check("unverified-only event still has a display fallback", getDisplayArticle(unverifiedOnly, "ko").source === "Unverified source");

const verifiedKorean = { ...verified, title: "중앙은행, 물가 보고서 뒤 금리 동결", source: "연합뉴스", sourceRole: "wire", link: "https://www.yna.co.kr/view/example" };
const multiVerified = { ...event, articles: [verified, verifiedKorean, unverifiedKorean], sourceCount: 2 };
check("language preference still works inside verified pool", getDisplayArticle(multiVerified, "ko").source === "연합뉴스");
check("English preference still selects verified English article", getDisplayArticle(multiVerified, "en").source === "Reuters");

console.log(`Unverified display laundering abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
