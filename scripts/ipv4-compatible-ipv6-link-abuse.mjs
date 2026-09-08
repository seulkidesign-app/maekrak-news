const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test } = await import("../lib/news.ts");
const { safeHttpUrl } = __test;

const loopbackAliases = [
  "http://[::127.0.0.1]/admin",
  "http://[::7f00:1]/admin",
  "http://[0:0:0:0:0:0:127.0.0.1]/admin",
];

for (const alias of loopbackAliases) {
  check(
    `IPv4-compatible IPv6 loopback alias is rejected: ${alias}`,
    safeHttpUrl(alias) === "",
  );
}

check(
  "ordinary public IPv6 article URL remains allowed",
  safeHttpUrl("https://[2606:4700:4700::1111]/story") !== "",
);

console.log(`\nIPv4-compatible IPv6 link abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
