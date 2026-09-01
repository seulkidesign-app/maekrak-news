import { readFile } from "node:fs/promises";

// Regression coverage includes feed-window starvation via invalid, duplicate, and stale-valid front-loading.
const source = await readFile(new URL("../lib/news.ts", import.meta.url), "utf8");
const { __test } = await import("../lib/news.ts");
const failures = [];
const passes = [];
const check = (name, ok) => {
  if (ok) {
    passes.push(name);
    console.log(`PASS  ${name}`);
  } else {
    failures.push(name);
    console.error(`FAIL  ${name}`);
  }
};

const article = (title, link, publishedAt) => ({
  title,
  link,
  publishedAt,
  source: "Reuters",
  category: "세계",
  scope: "world",
  description: title,
  sourceType: "aggregated",
  sourceRole: "wire",
});

check("RSS parser disables custom entity expansion", /new XMLParser\(\{[^}]*processEntities:\s*false/.test(source));
check("RSS fetch refuses automatic redirects", /fetch\(feed\.url,\s*\{[\s\S]*?redirect:\s*["']error["']/.test(source));
check("feed payload keeps an explicit byte ceiling", source.includes("readResponseTextLimited(response)"));
check("article URLs reject private hosts", source.includes("isPrivateHostname(url.hostname)"));
check("feed maps the full byte-bounded parsed item list before output limiting", source.includes("const candidates = rawItems.map") && !source.includes("rawItems.slice(0, 112).map"));

const invalidFrontload = Array.from({ length: 28 }, (_, index) =>
  article(`poison-${index}`, "", "")
);
const rescued = __test.selectFeedWindow([
  ...invalidFrontload,
  article("Valid story A", "https://www.reuters.com/world/valid-a", "2026-08-31T01:00:00Z"),
  article("Valid story B", "https://www.reuters.com/world/valid-b", "2026-08-31T02:00:00Z"),
]);
check("invalid front-loaded entries cannot consume valid output slots", rescued.length === 2 && rescued.every((item) => item.link));

const duplicateFrontload = Array.from({ length: 28 }, (_, index) =>
  article("Repeated correction", "https://www.reuters.com/world/repeated", `2026-08-31T${String(index % 24).padStart(2, "0")}:00:00Z`)
);
const deduped = __test.selectFeedWindow([
  ...duplicateFrontload,
  article("Independent story", "https://www.reuters.com/world/independent", "2026-08-31T23:30:00Z"),
]);
check("duplicate front-loaded entries cannot crowd out a later unique story", deduped.length === 2 && deduped.some((item) => item.link.endsWith("/independent")));
check("duplicate front-load keeps the newest revision", deduped.some((item) => item.link.endsWith("/repeated") && item.publishedAt === "2026-08-31T23:00:00Z"));

// New attack class: a feed can be syntactically valid but deliberately/mistakenly reverse-ordered.
// More than the old 112-item scan cap of stale articles must not hide a fresh item at the tail.
const staleFrontload = Array.from({ length: 112 }, (_, index) =>
  article(
    `Stale story ${index}`,
    `https://www.reuters.com/world/stale-${index}`,
    `2026-08-29T${String(index % 24).padStart(2, "0")}:00:00Z`,
  )
);
const staleRescue = __test.selectFeedWindow([
  ...staleFrontload,
  article("Fresh story after stale prefix", "https://www.reuters.com/world/fresh-after-prefix", "2026-08-31T23:45:00Z"),
]);
check("stale valid front-load cannot starve a newer article from the 28 output slots", staleRescue.some((item) => item.link.endsWith("/fresh-after-prefix")));
check("feed window is ordered newest-first after validation and dedupe", staleRescue[0]?.link.endsWith("/fresh-after-prefix"));

console.log(`\nFeed boundary abuse: ${passes.length} passed / ${failures.length} failed`);
if (failures.length) process.exit(1);
