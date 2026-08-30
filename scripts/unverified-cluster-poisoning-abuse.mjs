const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");
function check(name, condition) { if (condition) passes.push(name); else failures.push(name); }
const make = (source, publishedAt, title) => ({ title, description: title, source, link: "https://example.com/story", publishedAt, category: "세계", scope: "world", sourceType: "aggregated", sourceRole: source === "Reuters" ? "wire" : source === "BBC" ? "international" : "other" });
const poison = make("Unverified source", "2026-08-30T20:00:00Z", "Iran sanctions talks resume in Oman Monday");
const reuters = make("Reuters", "2026-08-30T10:00:00Z", "Iran sanctions talks resume in Oman Tuesday");
const bbc = make("BBC", "2026-08-30T00:00:00Z", "Iran sanctions talks resume in Oman Wednesday");
check("poison matches newer verified report", __test.sameEvent(poison, reuters));
check("verified reports match each other", __test.sameEvent(reuters, bbc));
check("poison does not match older verified report", !__test.sameEvent(poison, bbc));
const clusters = __test.clusterNewsItems([poison, reuters, bbc]);
const trusted = clusters.find((cluster) => cluster.some((x) => x.source === "Reuters") && cluster.some((x) => x.source === "BBC"));
check("unverified poison cannot split verified reports", Boolean(trusted));
check("poison cannot contaminate trusted cluster unless it matches every trusted member", Boolean(trusted) && !trusted.some((x) => x.source === "Unverified source"));
check("poison remains visible separately", clusters.some((cluster) => cluster.some((x) => x.source === "Unverified source")));
const unknownOnly = __test.clusterNewsItems([
  make("Unverified source", "2026-08-30T10:00:00Z", "Storm closes airport after flooding"),
  make("Unverified source", "2026-08-30T09:00:00Z", "Storm closes airport after flooding"),
]);
check("all-unverified reporting still clusters", unknownOnly.length === 1 && unknownOnly[0].length === 2);
console.log("Unverified cluster poisoning abuse: " + passes.length + " passed / " + failures.length + " failed");
passes.forEach((name) => console.log("PASS  " + name));
failures.forEach((name) => console.error("FAIL  " + name));
if (failures.length) process.exit(1);
