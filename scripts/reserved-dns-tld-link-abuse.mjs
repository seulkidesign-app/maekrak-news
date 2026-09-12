// Regression: RFC 2606 reserved DNS TLDs must never become usable public article links.
// Keep both root-like subdomains and nested subdomains covered so suffix checks cannot regress.
const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test } = await import("../lib/news.ts");
const { safeHttpUrl } = __test;

const reservedDnsUrls = [
  "https://publisher.test/story",
  "https://news.invalid/breaking",
  "http://desk.example/article",
  "https://deep.publisher.test/story",
];

for (const url of reservedDnsUrls) {
  check(
    `reserved DNS TLD cannot masquerade as a usable public article URL: ${url}`,
    safeHttpUrl(url) === "",
  );
}

check(
  "ordinary public article hostname remains allowed",
  safeHttpUrl("https://example.com/story") !== "",
);

console.log(`\nreserved DNS TLD link abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
