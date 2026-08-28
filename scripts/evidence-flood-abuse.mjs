const failures = [];
const passes = [];
function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const { eventEvidenceSummary, eventTimeline } = await import("../lib/signals.ts");

function article(source, title, publishedAt) {
  return {
    title,
    description: title,
    source,
    link: `https://example.com/${encodeURIComponent(source)}/${encodeURIComponent(title)}`,
    publishedAt,
    category: "세계",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: "other",
  };
}

const base = new Date("2026-08-29T00:00:00Z");
const articles = [
  article("Reuters", "Officials say talks continue", new Date(base.getTime() + 1 * 60_000).toISOString()),
  article("REUTERS", "Officials said talks continue after meeting", new Date(base.getTime() + 2 * 60_000).toISOString()),
  article("Reuters", "Talks could continue into next week", new Date(base.getTime() + 3 * 60_000).toISOString()),
  article("BBC", "Talks continue after meeting", new Date(base.getTime() + 4 * 60_000).toISOString()),
];

const event = {
  id: "evidence-flood",
  title: articles[0].title,
  category: "세계",
  scope: "world",
  summary: articles[0].title,
  publishedAt: articles[0].publishedAt,
  dayStatus: "today",
  articles,
  sourceCount: 2,
  importanceScore: 8,
  whySelected: [],
  briefWhy: "broad-impact",
  briefWatch: "multi-source",
};

const summary = eventEvidenceSummary(event);
const totalEvidence = Object.values(summary).reduce((sum, value) => sum + value, 0);
check("one publisher cannot inflate evidence count with repeated updates", totalEvidence === 2, JSON.stringify(summary));
check("publisher with mixed wording keeps the most cautious evidence label", summary["전망·추정"] === 1, JSON.stringify(summary));
check("independent publisher remains represented", summary["일반 보도"] === 1, JSON.stringify(summary));

const timeline = eventTimeline(event);
check("canonical source aliases cannot inflate one-hour timeline", timeline.length === 2, timeline.map((item) => item.source).join(","));

console.log(`\nEvidence flood abuse regression: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
