import { acceptsMarkdown } from "../lib/accept-negotiation.ts";

const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

// New attack class: duplicate q parameters can make different HTTP parsers/proxies
// disagree about which representation the client actually accepts. Fail closed.
check(
  "conflicting duplicate qvalues cannot force markdown representation",
  acceptsMarkdown("text/html, text/markdown;q=1;q=0") === false,
);
check(
  "reverse-order conflicting duplicate qvalues remain rejected",
  acceptsMarkdown("text/html, text/markdown;q=0;q=1") === false,
);
check(
  "identical duplicate qvalues are still malformed and rejected",
  acceptsMarkdown("text/markdown;q=0.5;q=0.5, text/html") === false,
);
check(
  "non-q extension parameters do not break valid markdown negotiation",
  acceptsMarkdown("text/markdown;level=1;q=0.5, text/html") === true,
);

console.log(`\nDuplicate qvalue Accept abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
