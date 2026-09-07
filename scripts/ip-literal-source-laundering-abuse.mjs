const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { canonicalSourceName, outletIdentityKey, canonicalOutletCount } = await import("../lib/source-normalize.ts");

const ipv4A = "203.0.113.7";
const ipv4B = "198.51.100.8";
const ipv4Alias = "203。0。113。7";

check(
  "raw IPv4 infrastructure is not presented as a verified publisher label",
  canonicalSourceName(ipv4A) === "Unverified source",
);

check(
  "Unicode-dot IPv4 alias is also rejected as a publisher label",
  canonicalSourceName(ipv4Alias) === "Unverified source",
);

check(
  "multiple raw IP endpoints cannot manufacture multi-publisher corroboration",
  canonicalOutletCount([{ source: ipv4A }, { source: ipv4B }]) === 1,
);

check(
  "ASCII and Unicode-dot forms of the same IP collapse to the same unverified identity",
  outletIdentityKey(ipv4A) === outletIdentityKey(ipv4Alias),
);

check(
  "normal publisher domains remain accepted",
  canonicalSourceName("news.publisher.example") !== "Unverified source",
);

console.log(`\nIP-literal source laundering abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
