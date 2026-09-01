const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");

check("plain Reuters remains trusted", canonicalSourceName("Reuters") === "Reuters");
check("script-letter Reuters cannot NFKC-launder into trusted Reuters", canonicalSourceName("ℛeuters") === "Unverified source");
check("modifier-letter Reuters cannot NFKC-launder into trusted Reuters", canonicalSourceName("ᴿeuters") === "Unverified source");
check("script-letter BBC cannot NFKC-launder into trusted BBC", canonicalSourceName("ℬBC") === "Unverified source");
check("modifier-letter AP cannot NFKC-launder into trusted AP", canonicalSourceName("ᴬP") === "Unverified source");
check("letterlike compatibility spoofs collapse to one unverified identity", canonicalOutletCount([
  { source: "ℛeuters" },
  { source: "ᴿeuters" },
]) === 1);
check("full-width Reuters remains an intentionally supported normalization", canonicalSourceName("Ｒｅｕｔｅｒｓ") === "Reuters");
check("unrelated letterlike outlet does not become unverified", canonicalSourceName("ℛiver Daily") !== "Unverified source");

console.log(`\nLetterlike compatibility trusted-brand abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
