const failures = [];
const passes = [];
const { canonicalOutletCount, outletIdentityKey } = await import("../lib/source-normalize.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const plain = "Example News";
const shortOverlay = "Exa\u0338mple News";
const verticalOverlay = "Exam\u20D2ple News";
const reverseOverlay = "Examp\u20E5le News";

check("short solidus overlay does not create a second outlet identity",
  outletIdentityKey(plain) === outletIdentityKey(shortOverlay));
check("vertical overlay does not create a second outlet identity",
  outletIdentityKey(plain) === outletIdentityKey(verticalOverlay));
check("reverse overlay does not create a second outlet identity",
  outletIdentityKey(plain) === outletIdentityKey(reverseOverlay));
check("multiple visual overlay variants count as one publisher",
  canonicalOutletCount([
    { source: plain },
    { source: shortOverlay },
    { source: verticalOverlay },
    { source: reverseOverlay },
  ]) === 1);
check("genuinely different unknown outlets remain distinct",
  canonicalOutletCount([{ source: "Example News" }, { source: "Example Times" }]) === 2);
check("ordinary accented outlet identity is not stripped as an overlay",
  outletIdentityKey("El País") !== outletIdentityKey("El Pais"));

console.log(`Combining-overlay outlet abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
