// Regression: RFC 5180 benchmarking IPv6 must never become a usable article link.
const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test } = await import("../lib/news.ts");
const { safeHttpUrl } = __test;

const benchmarkingIpv6 = [
  "https://[2001:2::1]/story",
  "http://[2001:2:0:ffff::1234]/admin",
];

for (const url of benchmarkingIpv6) {
  check(
    `benchmarking-only IPv6 address cannot masquerade as a usable article URL: ${url}`,
    safeHttpUrl(url) === "",
  );
}

check(
  "ordinary globally routable IPv6 article URL remains allowed",
  safeHttpUrl("https://[2606:4700:4700::1111]/story") !== "",
);

console.log(`\nbenchmarking IPv6 link abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
