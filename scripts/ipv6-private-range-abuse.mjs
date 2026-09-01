const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

// New abuse class: non-loopback IPv6 addresses that are still non-public must never
// be accepted as article URLs. These differ from ::1, IPv4-mapped IPv6 and NAT64.
check("IPv6 unspecified address is rejected", __test.safeHttpUrl("http://[::]/admin") === "");
check("IPv6 unique-local fc00::/7 address is rejected", __test.safeHttpUrl("http://[fc00::1]/admin") === "");
check("IPv6 unique-local fd00::/8 address is rejected", __test.safeHttpUrl("http://[fd12:3456:789a::1]/admin") === "");
check("IPv6 link-local fe80::/10 address is rejected", __test.safeHttpUrl("http://[fe80::1]/admin") === "");
check("nearby public IPv6 remains allowed", Boolean(__test.safeHttpUrl("https://[2606:4700:4700::1111]/story")));

console.log(`IPv6 private-range abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
