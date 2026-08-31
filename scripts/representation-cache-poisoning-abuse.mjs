import { readFile } from "node:fs/promises";

const failures = [];
const passes = [];
function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const source = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");

const botBranch = source.match(/if \(AGENT_UA\.test\(userAgent\)\) \{([\s\S]*?)\n    \}/)?.[1] ?? "";
check("bot representation emits Vary", /headers\.set\(\s*["']Vary["']/.test(botBranch));
const vary = botBranch.match(/headers\.set\(\s*["']Vary["']\s*,\s*["']([^"']+)["']/)?.[1] ?? "";
check("bot representation varies on User-Agent", /(?:^|,)\s*User-Agent\s*(?:,|$)/i.test(vary), vary);
check("bot representation also varies on compression", /(?:^|,)\s*Accept-Encoding\s*(?:,|$)/i.test(vary), vary);
check("markdown representation still varies on Accept", source.includes('response.headers.set("Vary", "Accept, Accept-Encoding")'));
check("agent representation marker remains present", source.includes('X-Agent-Representation') && source.includes('static-html'));

console.log(`Representation cache poisoning abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
