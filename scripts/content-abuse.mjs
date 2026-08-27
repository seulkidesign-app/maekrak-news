import { readFile } from "node:fs/promises";

const failures = [];
const passes = [];
function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");
const { buildWorldFlows, koreaImpact, dailyMemoryLine } = await import("../lib/world-briefing.ts");

check("AP aliases canonicalize to one publisher",
  ["AP", "AP News", "Associated Press", "The Associated Press"].every((name) => canonicalSourceName(name) === "AP"));
check("Yonhap aliases canonicalize to one publisher",
  ["연합뉴스", "Yonhap", "Yonhap News Agency"].every((name) => canonicalSourceName(name) === "연합뉴스"));
check("publisher aliases count as one outlet",
  canonicalOutletCount([{ source: "AP" }, { source: "AP News" }, { source: "Associated Press" }]) === 1);

function article(title, description = title, source = "Reuters") {
  return {
    title,
    description,
    source,
    link: "https://example.com/story",
    publishedAt: new Date().toISOString(),
    category: "세계",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: "wire",
  };
}

function event(id, title, { category = "세계", scope = "world", briefWhy = "security", importanceScore = 8 } = {}) {
  return {
    id,
    title,
    category,
    scope,
    summary: title,
    publishedAt: new Date().toISOString(),
    dayStatus: "today",
    articles: [article(title)],
    sourceCount: 1,
    importanceScore,
    whySelected: [],
    briefWhy,
    briefWatch: "single-source",
  };
}

const singleIran = event("iran-1", "Iran and Israel discuss ceasefire after regional attacks");
check("one event is never marketed as a world flow", buildWorldFlows([singleIran], "ko").length === 0);

const iranA = event("iran-a", "Iran and Israel discuss ceasefire after regional attacks", { importanceScore: 9 });
const iranB = event("iran-b", "Hormuz shipping risk rises as Iran tensions continue", { importanceScore: 8 });
const linkedSecurity = buildWorldFlows([iranA, iranB], "ko");
check("two events sharing a real thread can form a flow",
  linkedSecurity.some((flow) => flow.code === "security" && flow.eventIds.length === 2));

const ukraine = event("ukraine", "Ukraine reports new Russian missile attack", { importanceScore: 8.5 });
check("unrelated security regions are not forced into one flow",
  buildWorldFlows([iranA, ukraine], "ko").length === 0);

const unrelatedWorld = event("world-other", "Election debate opens in a distant country", { briefWhy: "politics" });
check("Korea impact stays blank without a reviewed mechanism", koreaImpact(unrelatedWorld, "ko") === null);
const energyImpact = event("energy", "Iran tensions disrupt Hormuz oil shipping routes");
check("Korea impact appears only with region plus transmission mechanism", Boolean(koreaImpact(energyImpact, "ko")));
check("empty flow state does not claim a complete big picture", /충분한 사건 흐름/.test(dailyMemoryLine([], "ko")));

const newsSource = await readFile(new URL("../lib/news.ts", import.meta.url), "utf8");
check("missing publication time is not replaced with now", !/publishedAt\s*=.*new Date\(\)\.toISOString\(\)/.test(newsSource));
check("publication timestamps pass a sanity validator", newsSource.includes("safePublishedAt("));
check("future timestamps are rejected", /time > now \+ 20 \* 60_000/.test(newsSource));
check("feed body has an explicit size ceiling", newsSource.includes("readResponseTextLimited(response)"));
check("feed title length is bounded", /clean\(item\?\.title, 320\)/.test(newsSource));
check("feed description length is bounded", /, 2400\)/.test(newsSource));
check("unsafe link protocols are filtered", newsSource.includes("safeHttpUrl(rawLink)"));

console.log(`\nContent abuse regression: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
