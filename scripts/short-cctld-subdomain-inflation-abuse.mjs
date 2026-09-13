const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { outletIdentityKey, canonicalOutletCount } = await import("../lib/source-normalize.ts");

const flatCcTldRoot = outletIdentityKey("abc.de");
const flatCcTldDesk = outletIdentityKey("desk.abc.de");
const flatCcTldWire = outletIdentityKey("wire.abc.de");
const ukPublisherA = outletIdentityKey("alpha.co.uk");
const ukPublisherASubdomain = outletIdentityKey("desk.alpha.co.uk");
const ukPublisherB = outletIdentityKey("beta.co.uk");

check(
  "subdomains of a short-name flat ccTLD publisher collapse to one identity",
  flatCcTldDesk === flatCcTldWire && flatCcTldDesk === flatCcTldRoot,
);
check(
  "subdomain aliases cannot inflate canonical source diversity",
  canonicalOutletCount([{ source: "desk.abc.de" }, { source: "wire.abc.de" }]) === 1,
);
check(
  "known second-level ccTLD publisher boundary is preserved",
  ukPublisherA === ukPublisherASubdomain && ukPublisherA !== ukPublisherB,
);

console.log(`\nShort ccTLD subdomain inflation abuse: ${passes.length} passed / ${failures.length} failed`);
console.log(`flat ccTLD identities: ${flatCcTldRoot} / ${flatCcTldDesk} / ${flatCcTldWire}`);
console.log(`co.uk identities: ${ukPublisherA} / ${ukPublisherASubdomain} / ${ukPublisherB}`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
