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

// New trust-UX attack class: benign publisher labels wrapped by feed/UI decoration
// must not be downgraded or counted as separate outlets. Extra attacker text must remain untrusted.
check("parenthesized Reuters remains trusted", canonicalSourceName("(Reuters)") === "Reuters");
check("CJK-wrapped BBC remains trusted", canonicalSourceName("【BBC】") === "BBC");
check("quoted AP remains trusted", canonicalSourceName("“AP News”") === "AP");
check("nested decorative wrappers do not inflate publisher count",
  canonicalOutletCount([{ source: "Reuters" }, { source: "【(Reuters)】" }]) === 1);
check("wrapper stripping does not bless extra attacker text",
  canonicalSourceName("(Reuters attacker)") === "Unverified source");

console.log(`Benign mixed-script outlet abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
