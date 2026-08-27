import { readFile } from "node:fs/promises";

const failures = [];
const passes = [];
function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const { canonicalSourceName, canonicalOutletCount, normalizeExternalText } = await import("../lib/source-normalize.ts");
const { buildWorldFlows, koreaImpact, dailyMemoryLine } = await import("../lib/world-briefing.ts");
const { auditEventAccuracy } = await import("../lib/accuracy.ts");

check("AP aliases canonicalize to one publisher",
  ["AP", "AP News", "Associated Press", "The Associated Press"].every((name) => canonicalSourceName(name) === "AP"));
check("Yonhap aliases canonicalize to one publisher",
  ["연합뉴스", "Yonhap", "Yonhap News Agency"].every((name) => canonicalSourceName(name) === "연합뉴스"));
check("publisher aliases count as one outlet",
  canonicalOutletCount([{ source: "AP" }, { source: "AP News" }, { source: "Associated Press" }]) === 1);
check("zero-width publisher spoof collapses to canonical Reuters",
  canonicalSourceName("Reu\u200Bters") === "Reuters");
check("bidi publisher spoof collapses to canonical Reuters",
  canonicalSourceName("\u202EReuters\u202C") === "Reuters");
check("full-width publisher spoof is normalized",
  canonicalSourceName("ＡＰ") === "AP");
check("invisible alias variants still count as one outlet",
  canonicalOutletCount([{ source: "Reuters" }, { source: "Reu\u200Bters" }, { source: "\u202EReuters" }]) === 1);
check("external text strips bidi and zero-width controls",
  !/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/.test(normalizeExternalText("A\u202EB\u200BC")));
check("trusted brand substring spoof is downgraded",
  canonicalSourceName("Reuters Scam Daily") === "Unverified source");
check("prefixed trusted brand spoof is downgraded",
  canonicalSourceName("Fake BBC World") === "Unverified source");
check("trusted Korean brand substring spoof is downgraded",
  canonicalSourceName("연합뉴스 사칭 채널") === "Unverified source");
check("mixed Latin-Cyrillic publisher homograph is downgraded",
  canonicalSourceName("Rеuters") === "Unverified source");

function article(title, description = title, source = "Reuters") {
  return {
    title,
    description,
    source,
    link: `https://example.com/${encodeURIComponent(source)}/story`,
    publishedAt: new Date().toISOString(),
    category: "세계",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: source === "Reuters" || source === "AP" ? "wire" : "international",
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

function multiSourceEvent(id, articles) {
  return {
    id,
    title: articles[0]?.title ?? "event",
    category: "세계",
    scope: "world",
    summary: articles[0]?.description ?? "",
    publishedAt: new Date().toISOString(),
    dayStatus: "today",
    articles,
    sourceCount: new Set(articles.map((item) => canonicalSourceName(item.source))).size,
    importanceScore: 8,
    whySelected: [],
    briefWhy: "broad-impact",
    briefWatch: "follow-up",
  };
}

const singleIran = event("iran-1", "Iran and Israel discuss ceasefire after regional attacks");
check("one event is never marketed as a world flow", buildWorldFlows([singleIran], "ko").length === 0);
check("duplicated event id is not enough to manufacture a world flow", buildWorldFlows([singleIran, { ...singleIran }], "ko").length === 0);

const iranA = event("iran-a", "Iran and Israel discuss ceasefire after regional attacks", { importanceScore: 9 });
const iranB = event("iran-b", "Hormuz shipping risk rises as Iran tensions continue", { importanceScore: 8 });
const linkedSecurity = buildWorldFlows([iranA, iranB], "ko");
check("two events sharing a real thread can form a flow",
  linkedSecurity.some((flow) => flow.code === "security" && flow.eventIds.length === 2));

const ukraine = event("ukraine", "Ukraine reports new Russian missile attack", { importanceScore: 8.5 });
check("unrelated security regions are not forced into one flow",
  buildWorldFlows([iranA, ukraine], "ko").length === 0);
const yemenMissile = event("yemen", "Yemen militia reports another missile launch in Red Sea tensions", { importanceScore: 8.2 });
check("generic missile wording does not connect unrelated regions",
  buildWorldFlows([ukraine, yemenMissile], "ko").length === 0);
const germanyElection = event("germany-election", "Germany election enters final voting day", { briefWhy: "politics", importanceScore: 8.1 });
const taiwanElection = event("taiwan-election", "Taiwan election campaign opens with televised debate", { briefWhy: "politics", importanceScore: 8 });
check("generic election wording does not connect unrelated regions",
  buildWorldFlows([germanyElection, taiwanElection], "ko").length === 0);
const womanElection = event("woman-election", "Woman elected mayor after local vote", { briefWhy: "politics", importanceScore: 8.1 });
const omanElection = event("oman-election", "Oman election commission opens voting", { briefWhy: "politics", importanceScore: 8 });
check("woman text does not impersonate Oman regional signature",
  buildWorldFlows([womanElection, omanElection], "ko").length === 0);
const madagascarMarket = event("madagascar", "Madagascar market reform debate continues", { category: "경제", briefWhy: "economy", importanceScore: 8.1 });
const europeGas = event("europe-gas", "Natural gas prices rise in Europe", { category: "경제", briefWhy: "economy", importanceScore: 8 });
check("Madagascar text does not impersonate gas energy signature",
  buildWorldFlows([madagascarMarket, europeGas], "ko").length === 0);

const unrelatedWorld = event("world-other", "Election debate opens in a distant country", { briefWhy: "politics" });
check("Korea impact stays blank without a reviewed mechanism", koreaImpact(unrelatedWorld, "ko") === null);
const energyImpact = event("energy", "Iran tensions disrupt Hormuz oil shipping routes");
check("Korea impact appears only with region plus transmission mechanism", Boolean(koreaImpact(energyImpact, "ko")));
const iranLeadership = event("iran-leadership", "Iran leadership transition becomes a major election issue", { briefWhy: "politics" });
check("leadership suffix does not fake shipping mechanism", koreaImpact(iranLeadership, "ko") === null);
const usImportantElection = event("us-important", "United States calls election an important democratic moment", { briefWhy: "politics" });
check("important prefix does not fake import trade mechanism", koreaImpact(usImportantElection, "ko") === null);
check("empty flow state does not claim a complete big picture", /충분한 사건 흐름/.test(dailyMemoryLine([], "ko")));

const mayDateAudit = auditEventAccuracy(multiSourceEvent("may-date", [
  article("Election commission confirms vote on May 28", "Election commission confirms vote on May 28", "Reuters"),
  article("Election commission confirms voting date", "Election commission confirms voting date", "BBC"),
]));
check("May month name is not treated as uncertainty", !mayDateAudit.certaintyDifference && mayDateAudit.certaintyExamples.every((item) => !item.uncertain));

const appearanceAudit = auditEventAccuracy(multiSourceEvent("appearance", [
  article("Leader appearance follows cabinet meeting", "Leader appearance follows cabinet meeting", "Reuters"),
  article("Leader speaks after cabinet meeting", "Leader speaks after cabinet meeting", "BBC"),
]));
check("appearance substring is not treated as uncertainty", !appearanceAudit.certaintyDifference && appearanceAudit.certaintyExamples.every((item) => !item.uncertain));

const realUncertaintyAudit = auditEventAccuracy(multiSourceEvent("real-uncertainty", [
  article("Rate cut likely after inflation report", "Rate cut likely after inflation report", "Reuters"),
  article("Central bank meets after inflation report", "Central bank meets after inflation report", "BBC"),
]));
check("real uncertainty wording still produces a difference warning", realUncertaintyAudit.certaintyDifference);

const identifierAudit = auditEventAccuracy(multiSourceEvent("identifiers", [
  article("G7 leaders discuss H-1B and F-16 policy", "G7 leaders discuss H-1B and F-16 policy", "Reuters"),
  article("G7 leaders discuss H-1B and F-16 policy", "G7 leaders discuss H-1B and F-16 policy", "BBC"),
]));
check("embedded identifier numbers do not create numeric conflict", !identifierAudit.headlineNumberDifference);

const newsSource = await readFile(new URL("../lib/news.ts", import.meta.url), "utf8");
const qaSource = await readFile(new URL("../app/qa/page.tsx", import.meta.url), "utf8");
check("missing publication time is not replaced with now", !/publishedAt\s*=.*new Date\(\)\.toISOString\(\)/.test(newsSource));
check("publication timestamps pass a sanity validator", newsSource.includes("safePublishedAt("));
check("future timestamps are rejected", /time > now \+ 20 \* 60_000/.test(newsSource));
check("feed body has an explicit size ceiling", newsSource.includes("readResponseTextLimited(response)"));
check("XML custom entity processing is disabled", newsSource.includes("processEntities: false"));
check("feed title length is bounded", /clean\(item\?\.title, 320\)/.test(newsSource));
check("feed description length is bounded", /, 2400\)/.test(newsSource));
check("unsafe link protocols are filtered", newsSource.includes("safeHttpUrl(rawLink)"));
check("credential-style deceptive article URLs are rejected", newsSource.includes("url.username || url.password"));
check("localhost and private-network article links are rejected", newsSource.includes("isPrivateHostname(url.hostname)"));
check("article display text uses external Unicode normalization", newsSource.includes("normalizeExternalText(withoutMarkup)"));
check("technology classifier has non-tech chip exclusions", newsSource.includes("nonTechChipPattern"));
check("May is not used as a generic uncertainty token", !newsSource.includes("estimated|may|might") && newsSource.includes("estimated|might|could"));
check("high-impact English terms use word boundaries", newsSource.includes("\\b(?:war|attack|missiles?|nuclear|ceasefire|election"));
check("source roles use anchored exact-name matching", newsSource.includes("^(?:reuters|ap|연합뉴스|afp|agence france-presse)$"));
check("unknown publishers do not inherit aggregate feed roles", !newsSource.includes("inferSourceRole(source, feed.role)"));
check("unknown publisher role is explicitly low-trust", /return "other";/.test(newsSource) && /return 0\.72;/.test(newsSource));
check("briefing exposes the exact raw-news snapshot used for clustering", newsSource.includes("news: NewsItem[]") && /return \{\s*news,/m.test(newsSource));
check("QA does not perform a second news collection", !qaSource.includes("getNews") && qaSource.includes("const news = briefing.news"));

console.log(`\nContent abuse regression: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
