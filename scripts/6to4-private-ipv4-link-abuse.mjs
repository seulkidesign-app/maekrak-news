const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test } = await import("../lib/news.ts");
const { safeHttpUrl } = __test;

const private6to4Aliases = [
  "http://[2002:7f00:1::]/admin",
  "https://[2002:0a00:0001::]/story",
  "https://[2002:c0a8:0101::]/story",
  "https://[2002:a9fe:0101::]/story",
];

for (const alias of private6to4Aliases) {
  check(
    `6to4 address embedding a non-public IPv4 endpoint is rejected: ${alias}`,
    safeHttpUrl(alias) === "",
  );
}

check(
  "6to4 address embedding an ordinary public IPv4 endpoint remains allowed",
  safeHttpUrl("https://[2002:0808:0808::]/story") !== "",
);
check(
  "ordinary public IPv6 article URL remains allowed",
  safeHttpUrl("https://[2606:4700:4700::1111]/story") !== "",
);

console.log(`\n6to4 private IPv4 link abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
