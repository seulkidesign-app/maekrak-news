const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const blocked = [
  ["nip.io dotted loopback", "https://127.0.0.1.nip.io/admin"],
  ["sslip.io dashed RFC1918", "https://internal-10-0-0-1.sslip.io/admin"],
  ["nip.io hex RFC1918", "https://internal-c0a80101.nip.io/admin"],
  ["nip.io link-local metadata", "https://169.254.169.254.nip.io/latest/meta-data/"],
  ["sslip.io carrier-grade NAT", "https://edge-100-64-0-1.sslip.io/admin"],
];

for (const [name, url] of blocked) {
  check(`${name} is rejected`, __test.safeHttpUrl(url) === "");
}

check(
  "nip.io public IPv4 remains allowed",
  Boolean(__test.safeHttpUrl("https://8.8.8.8.nip.io/story")),
);
check(
  "sslip.io public dashed IPv4 remains allowed",
  Boolean(__test.safeHttpUrl("https://edge-8-8-8-8.sslip.io/story")),
);
check(
  "unrelated numeric hostname remains allowed",
  Boolean(__test.safeHttpUrl("https://news-10-0-0-1.example.com/story")),
);

console.log(`Wildcard DNS private-IP abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
