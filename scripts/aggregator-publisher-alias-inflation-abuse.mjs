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
  const wrapperA = "https://news.google.com/rss/articles/alias-a";
  const wrapperB = "https://news.google.com/rss/articles/alias-b";
  const attribution = "https://publisher.example/about";

  const sourceA = sourceForLink("Outlet Alpha", wrapperA, "aggregated", attribution);
  const sourceB = sourceForLink("Outlet Beta", wrapperB, "aggregated", attribution);

  check(
    "one aggregator publisher cannot mint two verified source identities by changing display labels",
    sourceA === sourceB,
  );

  const articles = [
    {
      title: "Central bank announces policy change",
      description: "Officials announced a policy change after a scheduled meeting.",
      link: wrapperA,
      source: sourceA,
      publishedAt: new Date().toISOString(),
      category: "경제",
      scope: "world",
      sourceType: "aggregated",
      sourceRole: "other",
    },
    {
      title: "Central bank announces policy change",
      description: "Officials announced a policy change after a scheduled meeting.",
      link: wrapperB,
      source: sourceB,
      publishedAt: new Date().toISOString(),
      category: "경제",
      scope: "world",
      sourceType: "aggregated",
      sourceRole: "other",
    },
  ];

  const count = verifiedSourceCount(articles);
  check("same attributed publisher counts as one verified source", count === 1);
  check(
    "same attributed publisher cannot earn multi-source trust copy",
    !selectionReasons(articles, importanceFor(articles)).includes("여러 매체에서 동시 보도"),
  );

  const differentPublisher = sourceForLink(
    "Outlet Gamma",
    "https://news.google.com/rss/articles/alias-c",
    "aggregated",
    "https://different-publisher.example/about",
  );
  check("different attributed publishers remain distinguishable", differentPublisher !== sourceA);
}

console.log(`\nAggregator publisher alias inflation abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
