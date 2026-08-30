const failures = [];
const passes = [];
const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const armenianOh = "օ";
const spoof = `Y${armenianOh}nhap`;
const spoofAgency = `Y${armenianOh}nhap News Agency`;

check("Armenian-o Yonhap homoglyph is downgraded",
  canonicalSourceName(spoof) === "Unverified source",
  canonicalSourceName(spoof));
check("Armenian-o Yonhap agency homoglyph is downgraded",
  canonicalSourceName(spoofAgency) === "Unverified source",
  canonicalSourceName(spoofAgency));
check("multiple Armenian Yonhap spoof variants collapse to one unverified outlet",
  canonicalOutletCount([{ source: spoof }, { source: spoofAgency }, { source: "Unverified source" }]) === 1);
check("real Yonhap still canonicalizes to trusted Korean wire name",
  canonicalSourceName("Yonhap") === "연합뉴스");
check("benign Armenian outlet text is not blanket-blocked",
  canonicalSourceName("Ազատություն") !== "Unverified source");

console.log(`Armenian trusted-brand homoglyph abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
