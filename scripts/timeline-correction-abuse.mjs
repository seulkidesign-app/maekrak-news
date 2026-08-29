const failures = [];
const passes = [];
const { eventTimeline } = await import("../lib/signals.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

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
    sourceRole: source === "Reuters" ? "wire" : "international",
  };
}

const event = {
  id: "evt_timeline_correction",
  title: "Port incident update",
  category: "세계",
  scope: "world",
  summary: "Port incident update",
  publishedAt: "2026-08-29T10:42:00.000Z",
  dayStatus: "today",
  articles: [
    article("Reuters", "Port blast kills 12, officials say", "2026-08-29T10:05:00.000Z"),
    article("BBC", "Port blast casualty count under review", "2026-08-29T10:20:00.000Z"),
    article("REUTERS", "Correction: Port blast kills 8, officials say", "2026-08-29T10:42:00.000Z"),
  ],
  sourceCount: 2,
  importanceScore: 8,
  whySelected: [],
  briefWhy: "disaster",
  briefWatch: "follow-up",
};

const timeline = eventTimeline(event);
const titles = timeline.map((item) => item.title);

check("same-hour publisher correction is retained",
  titles.includes("Correction: Port blast kills 8, officials say"), titles.join(" | "));
check("stale pre-correction headline from same publisher-hour is removed",
  !titles.includes("Port blast kills 12, officials say"), titles.join(" | "));
check("independent publisher in the same hour remains visible",
  titles.includes("Port blast casualty count under review"), titles.join(" | "));
check("timeline remains chronological after publisher-hour replacement",
  timeline.every((item, index) => index === 0 || new Date(timeline[index - 1].publishedAt) <= new Date(item.publishedAt)));

console.log(`Timeline correction abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
