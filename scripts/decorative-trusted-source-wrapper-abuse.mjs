const failures = [];
const passes = [];
const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

check("parenthesized Reuters remains trusted", canonicalSourceName("(Reuters)") === "Reuters");
check("CJK-wrapped BBC remains trusted", canonicalSourceName("【BBC】") === "BBC");
check("quoted AP remains trusted", canonicalSourceName("“AP News”") === "AP");
check("nested decorative wrappers do not inflate publisher count",
  canonicalOutletCount([{ source: "Reuters" }, { source: "【(Reuters)】" }]) === 1);
check("wrapper stripping does not bless extra attacker text",
  canonicalSourceName("(Reuters attacker)") === "Unverified source");

console.log(`Decorative trusted-source wrapper abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
