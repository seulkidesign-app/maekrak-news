const failures = [];
const passes = [];

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const { __test } = await import("../lib/news.ts");
const { canonicalSourceName, sourceForLink, inferSourceRole } = __test;

check("wire-role inference is exported", typeof inferSourceRole === "function");
check("source-link validator is exported", typeof sourceForLink === "function");
check("source canonicalizer is exported", typeof canonicalSourceName === "function");

if (typeof inferSourceRole === "function" && typeof sourceForLink === "function" && typeof canonicalSourceName === "function") {
  // New attack class: wire-role attribution laundering.
  // `inferSourceRole` knows AFP as a wire service, but AFP has no domain binding in the
  // trusted-source map. Therefore an aggregator-provided AFP label must be downgraded
  // before it can enter role/authority scoring. This stays conservative even when the
  // attribution happens to point at afp.com until AFP is explicitly domain-bound there.
  const googleWrapper = "https://news.google.com/rss/articles/example";
  const evilAttribution = "https://attacker.example/afp/story";
  const officialAttribution = "https://www.afp.com/en/news/story";
  const afp = canonicalSourceName("AFP");
  const fullAfp = canonicalSourceName("Agence France-Presse");

  check("raw AFP label would otherwise be interpreted as wire", inferSourceRole("AFP") === "wire");
  check("raw full AFP name would otherwise be interpreted as wire", inferSourceRole("Agence France-Presse") === "wire");
  check("unbound AFP authority label is canonicalized to unverified", afp === "Unverified source", `result=${afp}`);
  check("unbound full AFP authority label is canonicalized to unverified", fullAfp === "Unverified source", `result=${fullAfp}`);
  check("canonicalized AFP no longer receives wire role", inferSourceRole(afp) === "other", `role=${inferSourceRole(afp)}`);

  check(
    "AFP claim on Google News with unrelated attribution cannot launder wire trust",
    sourceForLink(afp, googleWrapper, "aggregated", evilAttribution) === "Unverified source",
    `result=${sourceForLink(afp, googleWrapper, "aggregated", evilAttribution)}`,
  );
  check(
    "full AFP claim with unrelated attribution cannot launder wire trust",
    sourceForLink(fullAfp, googleWrapper, "aggregated", evilAttribution) === "Unverified source",
    `result=${sourceForLink(fullAfp, googleWrapper, "aggregated", evilAttribution)}`,
  );
  check(
    "AFP remains unverified even with afp.com attribution until domain binding is explicit",
    sourceForLink(afp, googleWrapper, "aggregated", officialAttribution) === "Unverified source",
    `result=${sourceForLink(afp, googleWrapper, "aggregated", officialAttribution)}`,
  );

  check("ordinary unknown outlet remains available for non-authority attribution", canonicalSourceName("Example News") === "Example News");
}

console.log(`Wire-role attribution laundering abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
