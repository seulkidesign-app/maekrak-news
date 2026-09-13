// Regression: non-routable ORCHID/ORCHIDv2 IPv6 identifiers must never become usable article links.
const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test } = await import("../lib/news.ts");
const { safeHttpUrl } = __test;

const nonRoutableOrchidIpv6 = [
  "https://[2001:10::1]/story",
  "https://[2001:1f:ffff::1]/story",
  "http://[2001:20::1]/admin",
  "https://[2001:2f:ffff::1234]/story",
];

for (const url of nonRoutableOrchidIpv6) {
  check(
    `ORCHID identifier cannot masquerade as a usable article URL: ${url}`,
    safeHttpUrl(url) === "",
  );
}

check(
  "ordinary globally routable IPv6 article URL remains allowed",
  safeHttpUrl("https://[2606:4700:4700::1111]/story") !== "",
);

console.log(`\nORCHID IPv6 link abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
