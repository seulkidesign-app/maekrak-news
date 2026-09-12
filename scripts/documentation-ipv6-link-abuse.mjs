const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test } = await import("../lib/news.ts");
const { safeHttpUrl } = __test;

const documentationIpv6 = [
  "https://[2001:db8::1]/story",
  "http://[2001:0db8:ffff::1234]/admin",
];

for (const url of documentationIpv6) {
  check(
    `documentation-only IPv6 address cannot masquerade as a usable article URL: ${url}`,
    safeHttpUrl(url) === "",
  );
}

check(
  "ordinary globally routable IPv6 article URL remains allowed",
  safeHttpUrl("https://[2606:4700:4700::1111]/story") !== "",
);

console.log(`\ndocumentation IPv6 link abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
