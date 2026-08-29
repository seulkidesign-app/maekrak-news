const failures = [];
const passes = [];

const { normalizeExternalText } = await import("../lib/source-normalize.ts");
const { auditEventAccuracy } = await import("../lib/accuracy.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

function article(title, source) {
  return {
    title,
    description: title,
    source,
    link: `https://example.com/${encodeURIComponent(source)}`,
    publishedAt: new Date().toISOString(),
    category: "경제",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: source === "Reuters" ? "wire" : "international",
  };
}

function event(articles) {
  return {
    id: "unicode-number-test",
    title: articles[0].title,
    category: "경제",
    scope: "world",
    summary: articles[0].description,
    publishedAt: new Date().toISOString(),
    dayStatus: "today",
    articles,
    sourceCount: articles.length,
    importanceScore: 8,
    whySelected: [],
    briefWhy: "economy",
    briefWatch: "follow-up",
  };
}

check("Arabic-Indic digits normalize to ASCII", normalizeExternalText("التضخم ٣٪") === "التضخم 3%");
check("Extended Arabic-Indic digits normalize to ASCII", normalizeExternalText("تورم ۴٫۵٪") === "تورم 4.5%");
check("Arabic thousands separator normalizes", normalizeExternalText("١٬٢٣٤") === "1,234");

const equivalent = auditEventAccuracy(event([
  article(normalizeExternalText("Inflation reaches ٣٪"), "Reuters"),
  article("Inflation reaches 3%", "BBC"),
]));
check("equivalent Arabic-script and ASCII percentages do not create false disagreement", !equivalent.headlineNumberDifference);

const disagreement = auditEventAccuracy(event([
  article(normalizeExternalText("Inflation reaches ٣٪"), "Reuters"),
  article("Inflation reaches 4%", "BBC"),
]));
check("Arabic-script numeric glyph cannot hide a real cross-source disagreement", disagreement.headlineNumberDifference);

const decimalEquivalent = auditEventAccuracy(event([
  article(normalizeExternalText("Inflation reaches ۴٫۵٪"), "Reuters"),
  article("Inflation reaches 4.5%", "BBC"),
]));
check("Arabic decimal separator remains numerically equivalent", !decimalEquivalent.headlineNumberDifference);

console.log(`Unicode numeric glyph abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
