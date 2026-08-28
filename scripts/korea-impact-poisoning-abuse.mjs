const failures = [];
const passes = [];
const { koreaImpact } = await import("../lib/world-briefing.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

function article({ source, sourceRole, title, description, sourceType = "aggregated" }) {
  return {
    source,
    sourceRole,
    sourceType,
    title,
    description,
    link: "https://example.com/story",
    publishedAt: "2026-08-28T10:00:00.000Z",
    category: "세계",
    scope: "world",
  };
}

function event(articles, scope = "world") {
  return {
    id: "evt-impact-poison",
    title: articles[0]?.title ?? "Story",
    category: scope === "domestic" ? "국내" : "세계",
    scope,
    summary: articles[0]?.description ?? "",
    publishedAt: "2026-08-28T10:00:00.000Z",
    dayStatus: "today",
    articles,
    sourceCount: new Set(articles.map((item) => item.source)).size,
    importanceScore: 8,
    whySelected: [],
    briefWhy: "broad-impact",
    briefWatch: "follow-up",
  };
}

const neutralReuters = article({
  source: "Reuters",
  sourceRole: "wire",
  title: "Company updates quarterly outlook",
  description: "The company updated its quarterly outlook after its board meeting.",
});
const poisonedUnknown = article({
  source: "Unverified source",
  sourceRole: "other",
  title: "Company updates quarterly outlook",
  description: "Iran Hormuz oil shipping supply sanctions could hit Korean import costs.",
});

check(
  "one unverified article cannot manufacture a Korea energy-impact explanation",
  koreaImpact(event([neutralReuters, poisonedUnknown]), "ko") === null,
);

const realReutersEnergy = article({
  source: "Reuters",
  sourceRole: "wire",
  title: "Hormuz shipping disruption lifts oil risk",
  description: "Iran tensions disrupt oil shipping and crude supply through the Strait of Hormuz.",
});
check(
  "trusted reporting can still produce a reviewed Korea energy-impact explanation",
  Boolean(koreaImpact(event([realReutersEnergy]), "ko")),
);

check(
  "domestic events keep their direct Korea connection even without a trusted external outlet",
  Boolean(koreaImpact(event([poisonedUnknown], "domestic"), "ko")),
);

console.log(`Korea-impact poisoning abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
