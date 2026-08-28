const { __test } = await import("../lib/news.ts");
const article = (title) => ({ title, description:title, source:"Example News", link:"https://example.com/story", publishedAt:"2026-08-28T00:00:00.000Z", category:"세계", scope:"world", sourceType:"direct", sourceRole:"other" });
const a = __test.stableEventId([article("clkabuym fverifen")]);
const b = __test.stableEventId([article("nkhbrcyr oltwxqyh")]);
if (a === b || !/^evt_[0-9a-f]{24}$/.test(a) || __test.stableEventId([article("clkabuym fverifen")]) !== a) process.exit(1);
console.log("Event ID collision abuse: 3 passed / 0 failed");
