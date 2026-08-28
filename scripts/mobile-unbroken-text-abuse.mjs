import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../app/trust.css", import.meta.url), "utf8");
const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

check("flow source pills can break hostile unbroken text", /\.flowSourceProof a\{[^}]*max-width:100%[^}]*overflow-wrap:anywhere[^}]*word-break:break-word/.test(css));
check("source mini-list container can shrink", /\.sourceMiniList a\{[^}]*min-width:0/.test(css));
check("source mini-list labels can break hostile unbroken text", /\.sourceMiniList b\{[^}]*overflow-wrap:anywhere[^}]*word-break:break-word/.test(css));
check("source mini-list label wrapper can shrink and wrap", /\.sourceMiniList a>span\{[^}]*min-width:0[^}]*overflow-wrap:anywhere/.test(css));

console.log(`\nMobile unbroken-text abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
