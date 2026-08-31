const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const publishedAt = new Date(Date.now() - 30 * 60_000).toISOString();
const makeArticle = (source, index, overrides = {}) => ({
  title: "Central bank announces interest rate decision",
  link: `https://example.com/story?id=${index}`,
  source,
  publishedAt,
  category: "경제",
  scope: "world",
  description: "Officials announced an interest rate decision after the scheduled meeting.",
  sourceType: "aggregated",
  sourceRole: "other",
  ...overrides,
});

const variants = ["Example News", "Example-News", "Example.News", "Example/News"];
const laundered = variants.map((source, index) => makeArticle(source, index));
const sameLabel = variants.map((_, index) => makeArticle("Example News", index));

check(
  "production verified source count collapses separator aliases",
  __test.verifiedSourceCount(laundered) === 1,
  `count=${__test.verifiedSourceCount(laundered)}`,
);
check(
  "separator aliases cannot manufacture multi-source trust UX",
  __test.briefWatchFor(laundered) === "single-source",
  `watch=${__test.briefWatchFor(laundered)}`,
);
check(
  "separator aliases cannot manufacture simultaneous-coverage reason",
  !__test.selectionReasons(laundered, __test.importanceFor(laundered)).includes("여러 매체에서 동시 보도"),
);
check(
  "separator aliases cannot inflate ranking diversity",
  __test.importanceFor(laundered) === __test.importanceFor(sameLabel),
  `aliases=${__test.importanceFor(laundered)} baseline=${__test.importanceFor(sameLabel)}`,
);

const duplicateUrl = variants.map((source, index) => ({
  ...makeArticle(source, index),
  link: "https://example.com/shared-story?utm_source=attacker",
}));
check(
  "dedupe uses outlet identity rather than display punctuation",
  __test.dedupeNews(duplicateUrl).length === 1,
  `count=${__test.dedupeNews(duplicateUrl).length}`,
);

const votePoisoning = [
  makeArticle("Example News", 10, { scope: "world" }),
  makeArticle("Example-News", 11, { scope: "world" }),
  makeArticle("Example.News", 12, { scope: "world" }),
  makeArticle("Actual Times", 13, { scope: "domestic" }),
];
check(
  "source-balanced vote counts aliases as one outlet",
  __test.sourceBalancedMajority(votePoisoning, (article) => article.scope, "domestic") === "domestic",
  `scope=${__test.sourceBalancedMajority(votePoisoning, (article) => article.scope, "domestic")}`,
);

console.log(`Source identity integration abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
