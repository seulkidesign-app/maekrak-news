import { readFile } from "node:fs/promises";

const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const now = new Date().toISOString();
function article(source, title, { category = "정치", scope = "world", sourceRole = "other", sourceType = "aggregated" } = {}) {
  return { title, description: title, source, link: "https://example.com/story", publishedAt: now, category, scope, sourceRole, sourceType };
}

const reuters = article("Reuters", "Government committee meets on budget proposal", { sourceRole: "wire" });
const poison = article("Unverified source", "Nuclear war attack triggers emergency sanctions", { category: "재난", scope: "domestic" });
const unknown = article("Unknown source", "Nuclear war attack triggers emergency sanctions", { category: "재난", scope: "domestic" });

check("unverified aliases do not increase verified source count", __test.verifiedSourceCount([reuters, poison, unknown]) === 1, `count=${__test.verifiedSourceCount([reuters, poison, unknown])}`);
check("unverified article cannot upgrade single-source watch status", __test.briefWatchFor([reuters, poison]) === "single-source", `watch=${__test.briefWatchFor([reuters, poison])}`);
check("unverified high-impact text cannot inflate a verified event importance score", __test.importanceFor([reuters, poison]) === __test.importanceFor([reuters]), `${__test.importanceFor([reuters, poison])} vs ${__test.importanceFor([reuters])}`);

const bbc = article("BBC", "Government committee meets on budget proposal", { sourceRole: "international" });
const reasons = __test.selectionReasons([reuters, bbc, poison], 6);
check("unverified third source cannot manufacture a three-outlet selection reason", !reasons.includes("여러 매체에서 동시 보도"), reasons.join(" | "));

const verifiedOther = article("Example News", "City council approves transit plan", { category: "정치", scope: "world" });
const unverifiedNewest = article("Unverified source", "City council approves transit plan", { category: "경제", scope: "domestic" });
check("unverified source cannot win a source-balanced category tie via fallback", __test.sourceBalancedMajority([verifiedOther, unverifiedNewest], (item) => item.category, "경제") === "정치");
check("unverified source cannot win a source-balanced scope tie via fallback", __test.sourceBalancedMajority([verifiedOther, unverifiedNewest], (item) => item.scope, "domestic") === "world");

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
check("zero verified-source events are labeled as needing source verification", pageSource.includes("event.sourceCount === 0") && pageSource.includes("출처 확인 필요") && pageSource.includes("Source identity unverified"));

console.log(`Unverified trust-signal laundering abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
