const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test } = await import("../lib/news.ts");
const { safeHttpUrl } = __test;

const localNat64Aliases = [
  "http://[64:ff9b:1::1]/admin",
  "https://[64:ff9b:1:7f00::1]/story",
  "https://[64:ff9b:1:ffff:ffff:ffff:ffff:ffff]/story",
];

for (const alias of localNat64Aliases) {
  check(
    `RFC 8215 local-use NAT64 prefix is rejected: ${alias}`,
    safeHttpUrl(alias) === "",
  );
}

check(
  "ordinary public IPv6 article URL remains allowed",
  safeHttpUrl("https://[2606:4700:4700::1111]/story") !== "",
);

console.log(`\nLocal NAT64 prefix link abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
