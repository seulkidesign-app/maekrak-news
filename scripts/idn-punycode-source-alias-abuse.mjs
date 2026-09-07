const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { outletIdentityKey, canonicalOutletCount } = await import("../lib/source-normalize.ts");

const unicodeHost = "news.例え.com";
const asciiHost = "news.xn--r8jz45g.com";

check(
  "Unicode IDN and its Punycode A-label collapse to one publisher identity",
  outletIdentityKey(unicodeHost) === outletIdentityKey(asciiHost),
);

check(
  "Unicode/Punycode aliases cannot inflate publisher count",
  canonicalOutletCount([{ source: unicodeHost }, { source: asciiHost }]) === 1,
);

const differentUnicodeHost = "news.日本.com";
check(
  "different IDN publishers remain distinguishable",
  outletIdentityKey(unicodeHost) !== outletIdentityKey(differentUnicodeHost),
);

console.log(`\nIDN/Punycode source alias abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
