const failures = [];
const passes = [];
function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const { canonicalSourceName, outletIdentityKey, canonicalOutletCount } = await import("../lib/source-normalize.ts");

const legacyIpv4Aliases = [
  "2130706433",      // 127.0.0.1 as a single decimal integer
  "0x7f000001",     // 127.0.0.1 as hexadecimal
  "0177.0.0.1",     // 127.0.0.1 with an octal first component
  "127.1",          // shortened IPv4 form for 127.0.0.1
];

for (const alias of legacyIpv4Aliases) {
  check(
    `legacy IPv4 alias ${alias} is not presented as a publisher`,
    canonicalSourceName(alias) === "Unverified source",
    `rendered as ${canonicalSourceName(alias)}`,
  );
}

check(
  "legacy aliases cannot manufacture corroborating publisher identities",
  canonicalOutletCount(legacyIpv4Aliases.map((source) => ({ source }))) === 1,
);

check(
  "legacy IPv4 and canonical loopback collapse to the same unverified identity",
  legacyIpv4Aliases.every((alias) => outletIdentityKey(alias) === outletIdentityKey("127.0.0.1")),
);

check(
  "ordinary numeric brand names are not broadly rejected",
  canonicalSourceName("404 Media") === "404 Media",
);

console.log(`\nLegacy IPv4 source laundering abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
