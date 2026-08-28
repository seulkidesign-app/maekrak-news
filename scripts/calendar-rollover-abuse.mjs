const { __test } = await import("../lib/news.ts");
const ok = [
  __test.safePublishedAt("2026-02-30T10:00:00Z", Date.parse("2026-03-10T00:00:00Z")) === "",
  __test.safePublishedAt("2025-02-29T10:00:00Z", Date.parse("2025-03-10T00:00:00Z")) === "",
  __test.safePublishedAt("2024-02-29T10:00:00Z", Date.parse("2024-03-10T00:00:00Z")) === "2024-02-29T10:00:00.000Z",
  __test.safePublishedAt("Fri, 28 Aug 2026 10:00:00 GMT", Date.parse("2026-08-28T12:00:00Z")) === "2026-08-28T10:00:00.000Z",
];
if (!ok.every(Boolean)) process.exit(1);
console.log("Calendar rollover abuse: 4 passed / 0 failed");
