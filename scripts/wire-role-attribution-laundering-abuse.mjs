const failures = [];
const passes = [];

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const { __test } = await import("../lib/news.ts");
const { sourceForLink, inferSourceRole } = __test;

check("wire-role inference is exported", typeof inferSourceRole === "function");
check("source-link validator is exported", typeof sourceForLink === "function");

if (typeof inferSourceRole === "function" && typeof sourceForLink === "function") {
  check("AFP is recognized as a wire role", inferSourceRole("AFP") === "wire");
  check("Agence France-Presse is recognized as a wire role", inferSourceRole("Agence France-Presse") === "wire");

  // New attack class: wire-role attribution laundering.
  // An aggregator-controlled source label must not earn the app's high-trust 'wire' signal
  // unless the claimed wire service is bound to its official publisher domain.
  const googleWrapper = "https://news.google.com/rss/articles/example";
  const evilAttribution = "https://attacker.example/afp/story";
  const officialAttribution = "https://www.afp.com/en/news/story";

  check(
    "AFP claim on Google News with unrelated attribution is downgraded",
    sourceForLink("AFP", googleWrapper, "aggregated", evilAttribution) === "Unverified source",
    `result=${sourceForLink("AFP", googleWrapper, "aggregated", evilAttribution)}`,
  );
  check(
    "full Agence France-Presse claim with unrelated attribution is downgraded",
    sourceForLink("Agence France-Presse", googleWrapper, "aggregated", evilAttribution) === "Unverified source",
    `result=${sourceForLink("Agence France-Presse", googleWrapper, "aggregated", evilAttribution)}`,
  );
  check(
    "AFP claim with official afp.com attribution stays trusted",
    sourceForLink("AFP", googleWrapper, "aggregated", officialAttribution) === "AFP",
    `result=${sourceForLink("AFP", googleWrapper, "aggregated", officialAttribution)}`,
  );
}

console.log(`Wire-role attribution laundering abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
