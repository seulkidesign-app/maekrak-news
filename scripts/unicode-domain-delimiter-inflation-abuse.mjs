import { canonicalOutletCount, outletIdentityKey } from "../lib/source-normalize.ts";

const failures = [];
const passes = [];
function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` :: ${detail}` : ""}`);
}

const ascii = "desk.publisher.example";
const ideographic = "desk.publisher。example"; // U+3002 IDEOGRAPHIC FULL STOP
const halfwidth = "desk.publisher｡example"; // U+FF61 HALFWIDTH IDEOGRAPHIC FULL STOP

check(
  "ideographic full stop cannot create a second publisher identity",
  outletIdentityKey(ascii) === outletIdentityKey(ideographic),
  `${outletIdentityKey(ascii)} != ${outletIdentityKey(ideographic)}`,
);
check(
  "halfwidth ideographic full stop cannot create a second publisher identity",
  outletIdentityKey(ascii) === outletIdentityKey(halfwidth),
  `${outletIdentityKey(ascii)} != ${outletIdentityKey(halfwidth)}`,
);
check(
  "unicode dot aliases cannot inflate canonical outlet count",
  canonicalOutletCount([{ source: ascii }, { source: ideographic }, { source: halfwidth }]) === 1,
  `count=${canonicalOutletCount([{ source: ascii }, { source: ideographic }, { source: halfwidth }])}`,
);
check(
  "different registrable publishers remain distinct",
  canonicalOutletCount([{ source: "desk.publisher.example" }, { source: "desk.other.example" }]) === 2,
);

console.log(`Unicode domain delimiter inflation abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
