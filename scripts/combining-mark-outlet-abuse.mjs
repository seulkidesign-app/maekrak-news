const failures = [];
const passes = [];
const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const spoofedReuters = "Reu\u0308ters";
const spoofedBBC = "B\u0338BC";
const spoofedAP = "A\u0301P";

check("combining-mark Reuters spoof is downgraded", canonicalSourceName(spoofedReuters) === "Unverified source");
check("overlay-mark BBC spoof is downgraded", canonicalSourceName(spoofedBBC) === "Unverified source");
check("accented AP spoof is downgraded", canonicalSourceName(spoofedAP) === "Unverified source");
check("trusted brand plus combining spoof cannot inflate outlet count", canonicalOutletCount([
  { source: "Reuters" },
  { source: spoofedReuters },
  { source: "Unverified source" },
]) === 2);
check("benign accented outlet remains distinct", canonicalSourceName("El País") !== "Unverified source");
check("benign accented outlet is not collapsed into trusted brand", canonicalSourceName("El País") !== "Reuters");

console.log(`Combining-mark outlet abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
