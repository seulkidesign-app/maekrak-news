const failures = [];
const passes = [];

const { canonicalSourceName, canonicalOutletCount, normalizeExternalText } = await import("../lib/source-normalize.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

check("Devanagari digits normalize to ASCII", normalizeExternalText("Unknown १") === "Unknown 1");
check("Bengali digits normalize to ASCII", normalizeExternalText("Unknown ৫") === "Unknown 5");
check("Thai digits normalize to ASCII", normalizeExternalText("Unknown ๙") === "Unknown 9");
check("Devanagari numbered placeholder is unverified", canonicalSourceName("Unknown १") === "Unverified source");
check("Bengali numbered placeholder is unverified", canonicalSourceName("Unknown ৫") === "Unverified source");
check("Thai numbered placeholder is unverified", canonicalSourceName("Unknown ๙") === "Unverified source");

const inflated = [
  { source: "Unknown १" },
  { source: "Unknown ৫" },
  { source: "Unknown ๙" },
  { source: "Unknown 4" },
];
check("cross-script placeholder digits cannot inflate outlet count", canonicalOutletCount(inflated) === 1, `count=${canonicalOutletCount(inflated)}`);

const legitimate = [
  { source: "भारत समाचार १" },
  { source: "भारत समाचार 2" },
];
check("non-placeholder outlet names remain distinct when their real numeric suffix differs", canonicalOutletCount(legitimate) === 2);

console.log(`Unicode placeholder digit abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
