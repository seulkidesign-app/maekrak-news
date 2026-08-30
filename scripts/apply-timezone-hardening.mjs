import { readFileSync, writeFileSync, unlinkSync } from "node:fs";

const newsPath = "lib/news.ts";
let news = readFileSync(newsPath, "utf8");

const oldBlock = `function safePublishedAt(value: unknown, now = Date.now()) {
  const raw = String(value ?? "").trim();
  if (!raw || !hasValidExplicitCalendarDate(raw)) return "";
  const parsed = new Date(raw);
`;
const newBlock = `function hasExplicitTimezoneForTimestamp(raw: string) {
  const hasClock = /(?:T|\\s)\\d{1,2}:\\d{2}(?::\\d{2}(?:\\.\\d+)?)?/.test(raw);
  if (!hasClock) return true;
  return /(?:Z|[+-]\\d{2}:?\\d{2}|[A-Z]{2,5})(?:\\s*\\([^)]*\\))?$/i.test(raw);
}

function safePublishedAt(value: unknown, now = Date.now()) {
  const raw = String(value ?? "").trim();
  if (!raw || !hasValidExplicitCalendarDate(raw) || !hasExplicitTimezoneForTimestamp(raw)) return "";
  const parsed = new Date(raw);
`;

if (news.includes(oldBlock)) news = news.replace(oldBlock, newBlock);
else if (!news.includes("hasExplicitTimezoneForTimestamp")) throw new Error("safePublishedAt patch anchor not found");
writeFileSync(newsPath, news);

const regression = `const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(\`${"${name}${detail ? ` — ${detail}` : ""}"}\`);
}

const now = Date.UTC(2026, 7, 30, 12, 0, 0);
const parse = (value) => __test.safePublishedAt(value, now);

check("timezone-less ISO datetime is rejected", parse("2026-08-30T10:00:00") === "");
check("timezone-less space-separated datetime is rejected", parse("2026-08-30 10:00:00") === "");
check("timezone-less RFC datetime is rejected", parse("Sun, 30 Aug 2026 10:00:00") === "");
check("UTC Z timestamp remains allowed", parse("2026-08-30T10:00:00Z") === "2026-08-30T10:00:00.000Z");
check("numeric ISO offset remains allowed", parse("2026-08-30T19:00:00+09:00") === "2026-08-30T10:00:00.000Z");
check("RFC GMT timestamp remains allowed", Boolean(parse("Sun, 30 Aug 2026 10:00:00 GMT")));
check("RFC numeric offset remains allowed", Boolean(parse("Sun, 30 Aug 2026 19:00:00 +0900")));
check("date-only value remains deterministic", parse("2026-08-30") === "2026-08-30T00:00:00.000Z");

console.log(\`Timezone-less publication timestamp abuse: ${"${passes.length}"} passed / ${"${failures.length}"} failed\`);
passes.forEach((name) => console.log(\`PASS  ${"${name}"}\`));
failures.forEach((name) => console.error(\`FAIL  ${"${name}"}\`));
if (failures.length) process.exit(1);
`;
writeFileSync("scripts/timezone-less-published-at-abuse.mjs", regression);

const ciPath = ".github/workflows/adversarial-e2e.yml";
let ci = readFileSync(ciPath, "utf8");
const anchor = `      - name: Timestamp poisoning abuse
        run: node scripts/timestamp-abuse.mjs
`;
const addition = `      - name: Timezone-less publication timestamp abuse
        run: node scripts/timezone-less-published-at-abuse.mjs
${anchor}`;
if (!ci.includes("Timezone-less publication timestamp abuse")) {
  if (!ci.includes(anchor)) throw new Error("CI insertion anchor not found");
  ci = ci.replace(anchor, addition);
}
writeFileSync(ciPath, ci);

try { unlinkSync(".github/workflows/timezone-less-published-at-patch.yml"); } catch {}
try { unlinkSync("scripts/apply-timezone-hardening.mjs"); } catch {}
