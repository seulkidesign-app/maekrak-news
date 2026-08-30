const failures = [];
const passes = [];
const { canonicalOutletCount, outletIdentityKey } = await import("../lib/source-normalize.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const latin = "Example News";
const cyrillicE = "Examplе News"; // Cyrillic small ie U+0435
const greekE = "Εxample News"; // Greek capital epsilon U+0395

check("Latin and Cyrillic-e lookalike outlets share one identity",
  outletIdentityKey(latin) === outletIdentityKey(cyrillicE));
check("Latin and Greek-e lookalike outlets share one identity",
  outletIdentityKey(latin) === outletIdentityKey(greekE));
check("generic homoglyph variants cannot inflate outlet count",
  canonicalOutletCount([{ source: latin }, { source: cyrillicE }, { source: greekE }]) === 1);

check("genuine Latin-Cyrillic multilingual outlet stays distinct from transliteration",
  canonicalOutletCount([{ source: "Meduza Россия" }, { source: "Meduza Rossiya" }]) === 2);
check("genuine Latin-Greek multilingual outlet stays distinct from transliteration",
  canonicalOutletCount([{ source: "Athens Voice Ελλάδα" }, { source: "Athens Voice Ellada" }]) === 2);
check("different ordinary outlets remain distinct",
  canonicalOutletCount([{ source: "Example News" }, { source: "Example Times" }]) === 2);

console.log(`Generic homoglyph outlet inflation abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
