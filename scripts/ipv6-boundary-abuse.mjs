const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

check("public IPv6 article URL remains allowed", Boolean(__test.safeHttpUrl("https://[2606:4700:4700::1111]/story")));
check("IPv6 loopback is rejected", __test.safeHttpUrl("http://[::1]/admin") === "");
check("IPv4-mapped IPv6 loopback is rejected", __test.safeHttpUrl("http://[::ffff:127.0.0.1]/admin") === "");
check("IPv4-mapped IPv6 RFC1918 address is rejected", __test.safeHttpUrl("http://[::ffff:10.0.0.1]/admin") === "");
check("hex IPv4-mapped loopback is rejected", __test.safeHttpUrl("http://[::ffff:7f00:1]/admin") === "");

console.log(`IPv6 boundary abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
