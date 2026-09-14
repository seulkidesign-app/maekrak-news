const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test } = await import("../lib/news.ts");
const { safeHttpUrl } = __test;

const teredoUrls = [
  "https://[2001:0000:4136:e378:8000:63bf:3fff:fdd2]/story",
  "https://[2001:0:53aa:64c:0:0:4abc:1]/story",
  "https://[2001:0000:0000:0000:0000:0000:0000:0001]/story",
];

for (const url of teredoUrls) {
  check(`Teredo IPv6 article URL is rejected: ${url}`, safeHttpUrl(url) === "");
}

check(
  "ordinary globally routable IPv6 article URL remains allowed",
  safeHttpUrl("https://[2606:4700:4700::1111]/story") !== "",
);

console.log(`\nTeredo IPv6 link abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
