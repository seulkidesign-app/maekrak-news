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
check("circled Reuters cannot NFKC-launder into trusted Reuters", canonicalSourceName("Ⓡⓔⓤⓣⓔⓡⓢ") === "Unverified source");
check("circled BBC cannot NFKC-launder into trusted BBC", canonicalSourceName("ⒷⒷⒸ") === "Unverified source");
check("script-letter Reuters cannot NFKC-launder into trusted Reuters", canonicalSourceName("ℛeuters") === "Unverified source");
check("modifier-letter Reuters cannot NFKC-launder into trusted Reuters", canonicalSourceName("ᴿeuters") === "Unverified source");
check("script-letter BBC cannot NFKC-launder into trusted BBC", canonicalSourceName("ℬBC") === "Unverified source");
check("modifier-letter AP cannot NFKC-launder into trusted AP", canonicalSourceName("ᴬP") === "Unverified source");
check("compatibility-spoof variants collapse to one unverified identity", canonicalOutletCount([
  { source: "𝖱𝖾𝗎𝗍𝖾𝗋𝗌" },
  { source: "Ⓡⓔⓤⓣⓔⓡⓢ" },
  { source: "ℛeuters" },
  { source: "ᴿeuters" },
]) === 1);
check("existing full-width trusted-label normalization is preserved", canonicalSourceName("Ｒｅｕｔｅｒｓ") === "Reuters");
check("benign compatibility normalization does not reject an unrelated outlet", canonicalSourceName("Ａｃｍｅ　Ｄａｉｌｙ") === "Acme Daily");
check("unrelated letterlike outlet does not become unverified", canonicalSourceName("ℛiver Daily") !== "Unverified source");

console.log(`\nCompatibility trusted-brand spoof abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
