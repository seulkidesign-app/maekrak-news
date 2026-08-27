const failures = [];
const passes = [];

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test: newsTest } = await import("../lib/news.ts");

function article(title, source) {
  return {
    title,
    description: title,
    source,
    link: `https://example.com/${encodeURIComponent(source)}/story`,
    publishedAt: new Date().toISOString(),
    category: "세계",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: source === "Reuters" ? "wire" : "international",
  };
}

const acme = article(
  "Acme recalls phones following battery defect as nationwide consumer safety investigation expands",
  "Reuters",
);
const globex = article(
  "Globex recalls phones following battery defect as nationwide consumer safety investigation expands",
  "BBC",
);
check("different named companies are not merged by near-identical headline templates", !newsTest.sameEvent(acme, globex));
check("proper-name conflict is detected for template collisions", newsTest.hasProperNameConflict(acme.title, globex.title));

const sameAcmeA = article(
  "Acme recalls phones following battery defect as nationwide consumer safety investigation expands",
  "Reuters",
);
const sameAcmeB = article(
  "Acme recalls phones following battery defect as nationwide consumer safety investigation expands rapidly",
  "BBC",
);
check("same named company with a near-identical headline can still cluster", newsTest.sameEvent(sameAcmeA, sameAcmeB));

console.log(`\nTemplate collision abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
