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
  const wrapperA = "https://news.google.com/rss/articles/subdomain-a";
  const wrapperB = "https://news.google.com/rss/articles/subdomain-b";

  const sourceA = sourceForLink(
    "Outlet Alpha",
    wrapperA,
    "aggregated",
    "https://desk.publisher.example/about",
  );
  const sourceB = sourceForLink(
    "Outlet Beta",
    wrapperB,
    "aggregated",
    "https://mobile.publisher.example/about",
  );

  check(
    "one publisher cannot mint multiple verified identities with controlled subdomains",
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
  check("controlled subdomains count as one publisher", count === 1);
  check(
    "controlled subdomains cannot earn multi-source trust copy",
    !selectionReasons(articles, importanceFor(articles)).includes("여러 매체에서 동시 보도"),
  );

  const ccSourceA = sourceForLink(
    "Outlet Gamma",
    "https://news.google.com/rss/articles/subdomain-c",
    "aggregated",
    "https://news.publisher.co.uk/about",
  );
  const ccSourceB = sourceForLink(
    "Outlet Delta",
    "https://news.google.com/rss/articles/subdomain-d",
    "aggregated",
    "https://m.publisher.co.uk/about",
  );
  check("common ccTLD publisher subdomains also collapse", ccSourceA === ccSourceB);

  const differentPublisher = sourceForLink(
    "Outlet Epsilon",
    "https://news.google.com/rss/articles/subdomain-e",
    "aggregated",
    "https://desk.other-publisher.example/about",
  );
  check("different registrable publishers remain distinguishable", differentPublisher !== sourceA);
}

console.log(`\nAggregator subdomain inflation abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
