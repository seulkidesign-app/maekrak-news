const { __test } = await import("../lib/news.ts");
const { sameEvent } = __test;

function item(title, publishedAt) {
  return {
    title,
    link: `https://example.com/${encodeURIComponent(title)}`,
    source: "연합뉴스",
    publishedAt,
    category: "재난",
    scope: "domestic",
    description: "",
    sourceType: "aggregated",
    sourceRole: "wire",
  };
}

const attacks = [
  [
    "제주와 서울의 유사 문구 지진은 서로 다른 사건이어야 한다",
    item("제주 지진 규모 4.0 발생 주민 대피", "2026-09-10T00:00:00Z"),
    item("서울 지진 규모 4.0 발생 주민 대피", "2026-09-10T02:00:00Z"),
  ],
  [
    "부산과 인천의 유사 문구 홍수는 서로 다른 사건이어야 한다",
    item("부산 홍수 피해 확산 주민 긴급 대피", "2026-09-10T00:00:00Z"),
    item("인천 홍수 피해 확산 주민 긴급 대피", "2026-09-10T03:00:00Z"),
  ],
];

let failed = 0;
for (const [name, left, right] of attacks) {
  if (sameEvent(left, right)) {
    failed += 1;
    console.error(`${name}: distinct Korean disaster locations were merged`);
  }
}

const sameIncident = sameEvent(
  item("제주 지진 규모 4.0 발생 주민 대피", "2026-09-10T00:00:00Z"),
  item("제주 지진 규모 4.0 발생 주민 긴급 대피", "2026-09-10T01:00:00Z"),
);
if (!sameIncident) {
  failed += 1;
  console.error("same 제주 earthquake reports no longer cluster");
}

if (failed) process.exit(1);
console.log("Korean disaster location collision abuse: 3 passed / 0 failed");
