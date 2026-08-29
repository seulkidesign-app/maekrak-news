const failures = [];
const passes = [];
const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

check("benign Latin+Cyrillic outlet name keeps its identity",
  canonicalSourceName("Meduza Россия") !== "Unverified source");
check("benign Latin+Greek outlet name keeps its identity",
  canonicalSourceName("Athens Voice Ελλάδα") !== "Unverified source");
check("mixed-script Reuters homoglyph is still downgraded",
  canonicalSourceName("Rеuters") === "Unverified source");
check("pure Cyrillic BBC homoglyph is still downgraded",
  canonicalSourceName("ВВС") === "Unverified source");
check("benign multilingual outlets remain distinct publishers",
  canonicalOutletCount([{ source: "Meduza Россия" }, { source: "Athens Voice Ελλάδα" }]) === 2);

console.log(`Benign mixed-script outlet abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
