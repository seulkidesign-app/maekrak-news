const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const blocked = [
  ["NAT64 loopback", "http://[64:ff9b::127.0.0.1]/admin"],
  ["NAT64 RFC1918 10/8", "http://[64:ff9b::10.0.0.1]/admin"],
  ["NAT64 RFC1918 172.16/12", "http://[64:ff9b::172.16.0.1]/admin"],
  ["NAT64 RFC1918 192.168/16", "http://[64:ff9b::192.168.1.1]/admin"],
  ["NAT64 carrier-grade NAT", "http://[64:ff9b::100.64.0.1]/admin"],
  ["NAT64 link-local", "http://[64:ff9b::169.254.1.1]/admin"],
];

for (const [name, url] of blocked) {
  check(`${name} is rejected`, __test.safeHttpUrl(url) === "");
}

check(
  "NAT64 public IPv4 remains allowed",
  Boolean(__test.safeHttpUrl("https://[64:ff9b::8.8.8.8]/story")),
);

console.log(`NAT64 private-IP abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
