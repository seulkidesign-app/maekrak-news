import fs from "node:fs";
import { acceptsMarkdown } from "../lib/accept-negotiation.ts";

const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

check("q=0 explicitly refuses markdown representation", acceptsMarkdown("text/html, text/markdown;q=0") === false);
check("malformed markdown quality cannot force markdown representation", acceptsMarkdown("text/html, text/markdown;q=bogus") === false);
check("out-of-range markdown quality cannot force markdown representation", acceptsMarkdown("text/html, text/markdown;q=2") === false);
check("markdown substring inside another media type does not negotiate markdown", acceptsMarkdown("application/x-text/markdown, text/html") === false);
check("positive markdown quality still enables markdown representation", acceptsMarkdown("text/markdown; q=0.5, text/html") === true);
check("plain markdown media type remains accepted", acceptsMarkdown("text/markdown") === true);
check("media type comparison is case-insensitive", acceptsMarkdown("TEXT/MARKDOWN;Q=1") === true);

// Malformed RFC qvalues that JavaScript Number() would otherwise coerce into valid numbers.
check("leading-dot qvalue cannot force markdown representation", acceptsMarkdown("text/html, text/markdown;q=.5") === false);
check("signed qvalue cannot force markdown representation", acceptsMarkdown("text/html, text/markdown;q=+0.5") === false);
check("qvalue with more than three fractional digits is rejected", acceptsMarkdown("text/html, text/markdown;q=0.0001") === false);
check("1 qvalue with more than three trailing zeroes is rejected", acceptsMarkdown("text/html, text/markdown;q=1.0000") === false);
check("minimum valid three-decimal positive qvalue remains accepted", acceptsMarkdown("text/markdown;q=0.001, text/html") === true);
check("maximum valid three-decimal qvalue remains accepted", acceptsMarkdown("text/markdown;q=1.000, text/html") === true);

// Duplicate q parameters inside one media range are malformed and can make parsers disagree.
check("conflicting duplicate qvalues cannot force markdown representation", acceptsMarkdown("text/html, text/markdown;q=1;q=0") === false);
check("reverse-order conflicting duplicate qvalues remain rejected", acceptsMarkdown("text/html, text/markdown;q=0;q=1") === false);
check("identical duplicate qvalues are still malformed and rejected", acceptsMarkdown("text/markdown;q=0.5;q=0.5, text/html") === false);
check("non-q extension parameters do not break valid markdown negotiation", acceptsMarkdown("text/markdown;level=1;q=0.5, text/html") === true);

// New attack class: duplicate markdown media ranges can let different HTTP parsers,
// caches, or proxies choose conflicting qvalues. Fail closed on any repeated markdown range.
check("conflicting duplicate markdown ranges cannot smuggle an accepted representation", acceptsMarkdown("text/markdown;q=0, text/markdown;q=1") === false);
check("reverse-order duplicate markdown ranges remain rejected", acceptsMarkdown("text/markdown;q=1, text/markdown;q=0") === false);
check("identical duplicate markdown ranges are rejected as ambiguous", acceptsMarkdown("text/markdown;q=0.5, text/markdown;q=0.5") === false);
check("a single markdown range alongside other media types remains valid", acceptsMarkdown("text/html;q=1, text/markdown;q=0.5, application/json;q=0.8") === true);

const proxySource = fs.readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
check("proxy uses the hardened Accept parser", proxySource.includes("acceptsMarkdown(accept)"));
check("proxy no longer uses substring-only markdown negotiation", !proxySource.includes('accept.includes("text/markdown")'));
check("markdown representation still varies on Accept", /set\("Vary",\s*"Accept, Accept-Encoding"\)/.test(proxySource));

console.log(`\nAccept negotiation abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
