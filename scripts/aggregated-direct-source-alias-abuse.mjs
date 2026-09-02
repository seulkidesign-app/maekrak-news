const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test } = await import("../lib/news.ts");
const { sourceForLink, verifiedSourceCount, selectionReasons, importanceFor } = __test;

check("source-aware validator is exported", typeof sourceForLink === "function");
check("verified source counting is exported", typeof verifiedSourceCount === "function");

if (typeof sourceForLink === "function") {
  const linkA = "https://publisher.example/story-a";
  const linkB = "https://publisher.example/story-b";

  const noAttributionA = sourceForLink("Outlet Alpha", linkA, "aggregated");
  const noAttributionB = sourceForLink("Outlet Beta", linkB, "aggregated");
  check(
    "unknown aggregated direct-link outlet without publisher attribution is downgraded",
    noAttributionA === "Unverified source" && noAttributionB === "Unverified source",
  );

  check(
    "mismatched publisher attribution cannot bless an unknown direct-link outlet",
    sourceForLink("Outlet Alpha", linkA, "aggregated", "https://different.example/about") === "Unverified source",
  );

  check(
    "matching publisher attribution can preserve an unknown direct-link outlet name",
    sourceForLink("Outlet Alpha", linkA, "aggregated", "https://publisher.example/about") === "Outlet Alpha",
  );

  const articles = [
    {
      title: "Central bank announces policy change",
      description: "Officials announced a policy change after a scheduled meeting.",
      link: linkA,
      source: noAttributionA,
      publishedAt: new Date().toISOString(),
      category: "경제",
      scope: "world",
      sourceType: "aggregated",
      sourceRole: "other",
    },
    {
      title: "Central bank announces policy change",
      description: "Officials announced a policy change after a scheduled meeting.",
      link: linkB,
      source: noAttributionB,
      publishedAt: new Date().toISOString(),
      category: "경제",
      scope: "world",
      sourceType: "aggregated",
      sourceRole: "other",
    },
  ];

  const count = verifiedSourceCount(articles);
  check("same unverified publisher cannot mint two verified outlet identities", count === 0);
  check(
    "same unverified publisher cannot earn multi-source selection copy",
    !selectionReasons(articles, importanceFor(articles)).includes("여러 매체에서 동시 보도"),
  );
}

console.log(`\nAggregated direct source alias abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
