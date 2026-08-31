import { readFile } from "node:fs/promises";

const failures = [];
const passes = [];
function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const source = await readFile(new URL("../next.config.mjs", import.meta.url), "utf8");

check("HSTS header is configured", source.includes('key: "Strict-Transport-Security"'));
const hsts = source.match(/key:\s*"Strict-Transport-Security"[\s\S]{0,160}?value:\s*"([^"]+)"/i)?.[1] ?? "";
check("HSTS max-age is at least one year", (() => {
  const seconds = Number(hsts.match(/max-age=(\d+)/i)?.[1]);
  return Number.isFinite(seconds) && seconds >= 31_536_000;
})(), hsts);
check("HSTS does not contain an invalid zero max-age", !/max-age=0(?:\D|$)/i.test(hsts), hsts);
check("existing clickjacking defense remains present", source.includes('key: "X-Frame-Options", value: "DENY"') && source.includes("frame-ancestors 'none'"));
check("existing opener isolation remains present", source.includes('key: "Cross-Origin-Opener-Policy", value: "same-origin"'));

console.log(`Transport downgrade abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
