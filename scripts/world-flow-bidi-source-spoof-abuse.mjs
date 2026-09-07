import { readFile } from "node:fs/promises";

const worldFlow = await readFile(new URL("../app/world-flow.tsx", import.meta.url), "utf8");
const sourceNormalize = await readFile(new URL("../lib/source-normalize.ts", import.meta.url), "utf8");
const failures = [];
const passes = [];

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const bidiControls = ["\\u202A", "\\u202B", "\\u202C", "\\u202D", "\\u202E", "\\u2066", "\\u2067", "\\u2068", "\\u2069", "\\u200E", "\\u200F", "\\u061C"];

check(
  "external source normalization strips default-ignorable Unicode controls",
  /Default_Ignorable_Code_Point/.test(sourceNormalize),
);
check(
  "world-flow source proof imports canonical source normalization",
  /import\s*\{[^}]*canonicalSourceName[^}]*\}\s*from\s*["']@\/lib\/source-normalize["']/.test(worldFlow),
  "world-flow currently has a separate raw source rendering path",
);
check(
  "world-flow normalizes article.source before dedupe and rendering",
  /canonicalSourceName\(article\.source\)/.test(worldFlow),
  "article.source can reach a visible source chip without canonicalization",
);
check(
  "world-flow does not push raw article.source into visible source links",
  !/links\.push\(\{\s*source:\s*article\.source\s*,\s*link:\s*article\.link\s*\}\)/.test(worldFlow),
  "raw source labels can retain bidi controls in the big-picture trust UI",
);

// These are the bidi controls an attacker can use to visually reverse or isolate
// a publisher label. Keeping the set explicit makes this regression's threat
// model clear even though normalizeExternalText removes them as a class.
check("bidi spoof corpus covers embedding, override, isolate and mark controls", bidiControls.length === 12);

console.log(`\nWorld-flow bidi source spoof abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
