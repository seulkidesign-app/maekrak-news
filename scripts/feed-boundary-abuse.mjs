import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../lib/news.ts", import.meta.url), "utf8");
const failures = [];
const checks = [
  ["RSS parser disables custom entity expansion", /new XMLParser\(\{[^}]*processEntities:\s*false/.test(source)],
  ["RSS fetch refuses automatic redirects", /fetch\(feed\.url,\s*\{[\s\S]*?redirect:\s*["']error["']/.test(source)],
  ["feed payload keeps an explicit byte ceiling", source.includes("readResponseTextLimited(response)")],
  ["article URLs reject private hosts", source.includes("isPrivateHostname(url.hostname)")],
];

for (const [name, ok] of checks) {
  if (ok) console.log(`PASS  ${name}`);
  else {
    console.error(`FAIL  ${name}`);
    failures.push(name);
  }
}

console.log(`\nFeed boundary abuse: ${checks.length - failures.length} passed / ${failures.length} failed`);
if (failures.length) process.exit(1);
