import { readFile } from "node:fs/promises";
const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");
function check(name, condition) { if (condition) passes.push(name); else failures.push(name); }
const event = (id, sourceCount, importanceScore, scope = "world") => ({
  id, title: id, category: "세계", scope, summary: id,
  publishedAt: "2026-08-31T00:00:00Z", dayStatus: "today", articles: [], sourceCount,
  importanceScore, whySelected: [], briefWhy: "broad-impact", briefWatch: "single-source",
});
const poisoned = [
  event("unknown-1", 0, 99), event("unknown-2", 0, 98), event("unknown-3", 0, 97),
  event("unknown-4", 0, 96), event("unknown-5", 0, 95),
  event("verified-world", 1, 6, "world"), event("verified-domestic", 1, 5, "domestic"), event("verified-2", 2, 4, "world"),
];
const selected = __test.selectPriorityEventIds(poisoned, 5);
check("unverified-only events cannot occupy priority IDs", selected.every((id) => !id.startsWith("unknown-")));
check("verified events survive priority-slot flooding", selected.includes("verified-world") && selected.includes("verified-domestic") && selected.includes("verified-2"));
check("selector returns only available verified candidates", selected.length === 3);
check("all-unverified input produces no promoted key events", __test.selectPriorityEventIds(poisoned.slice(0, 5), 5).length === 0);
const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
check("page fallback filters key-event candidates by verified source count", page.includes('const priorityCandidates = readyEvents.filter((event) => event.sourceCount > 0);'));
check("page fallback no longer refills key slots from all events", page.includes('for (const event of priorityCandidates)') && !page.includes('for (const event of readyEvents)'));
console.log("Priority trust-slot poisoning abuse: " + passes.length + " passed / " + failures.length + " failed");
passes.forEach((name) => console.log("PASS  " + name));
failures.forEach((name) => console.error("FAIL  " + name));
if (failures.length) process.exit(1);
