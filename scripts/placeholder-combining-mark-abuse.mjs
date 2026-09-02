const failures = [];
const passes = [];
const { canonicalSourceName } = await import("../lib/source-normalize.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const attacks = [
  ["English placeholder with internal overlay mark", "Unknown sourc\u0338e"],
  ["English placeholder with internal acute mark", "Unkno\u0301wn source"],
  ["Korean placeholder with internal overlay mark", "출처 미\u0338상"],
];

for (const [name, value] of attacks) {
  const normalized = canonicalSourceName(value);
  check(name, normalized === "Unverified source", `normalized=${JSON.stringify(normalized)}`);
}

// False-positive control: combining marks in a legitimate unknown outlet name must not
// make the whole source unverified merely because the mark exists.
const benign = canonicalSourceName("Cafe\u0301 News");
check("benign accented outlet remains a named outlet", benign !== "Unverified source", `normalized=${JSON.stringify(benign)}`);

console.log(`Placeholder combining-mark abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
