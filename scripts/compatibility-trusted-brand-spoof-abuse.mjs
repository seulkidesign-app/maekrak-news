const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");

check("plain Reuters remains trusted", canonicalSourceName("Reuters") === "Reuters");
check("plain BBC remains trusted", canonicalSourceName("BBC") === "BBC");
check("mathematical-style Reuters cannot NFKC-launder into trusted Reuters", canonicalSourceName("𝖱𝖾𝗎𝗍𝖾𝗋𝗌") === "Unverified source");
check("fullwidth Reuters cannot NFKC-launder into trusted Reuters", canonicalSourceName("Ｒｅｕｔｅｒｓ") === "Unverified source");
check("circled BBC cannot NFKC-launder into trusted BBC", canonicalSourceName("ⒷⒷⒸ") === "Unverified source");
check("compatibility-spoof variants collapse to one unverified identity", canonicalOutletCount([
  { source: "𝖱𝖾𝗎𝗍𝖾𝗋𝗌" },
  { source: "Ｒｅｕｔｅｒｓ" },
]) === 1);
check("benign compatibility normalization does not reject an unrelated outlet", canonicalSourceName("Ａｃｍｅ　Ｄａｉｌｙ") === "Acme Daily");

console.log(`\nCompatibility trusted-brand spoof abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
