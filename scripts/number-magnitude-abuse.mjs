const failures = [];
const passes = [];
const check = (name, condition) => (condition ? passes : failures).push(name);

const { auditEventAccuracy } = await import("../lib/accuracy.ts");

function article(title, source) {
  return {
    title,
    description: title,
    source,
    link: `https://example.com/${source}`,
    publishedAt: new Date().toISOString(),
    category: "경제",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: source === "Reuters" ? "wire" : "international",
  };
}

function event(articles) {
  return {
    id: "magnitude-abuse",
    title: articles[0].title,
    category: "경제",
    scope: "world",
    summary: articles[0].title,
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

const millionVsBillion = auditEventAccuracy(event([
  article("Government announces 3 million dollar aid package", "Reuters"),
  article("Government announces 3 billion dollar aid package", "BBC"),
]));
check("million versus billion is detected as a real numeric disagreement", millionVsBillion.headlineNumberDifference);

const equivalentMagnitude = auditEventAccuracy(event([
  article("Government announces 3 million dollar aid package", "Reuters"),
  article("Government announces 3000000 dollar aid package", "BBC"),
]));
check("3 million and 3000000 normalize to the same value", !equivalentMagnitude.headlineNumberDifference);

const koreanMagnitude = auditEventAccuracy(event([
  article("지원 규모 3억 원 발표", "Reuters"),
  article("지원 규모 300000000원 발표", "BBC"),
]));
check("Korean 억 magnitude and raw number normalize to the same value", !koreanMagnitude.headlineNumberDifference);

const signedDirection = auditEventAccuracy(event([
  article("Factory output falls -3% in July", "Reuters"),
  article("Factory output rises +3% in July", "BBC"),
]));
check("negative versus positive values are detected as a disagreement", signedDirection.headlineNumberDifference);

const unicodeMinus = auditEventAccuracy(event([
  article("Factory output changes -3% in July", "Reuters"),
  article("Factory output changes −3% in July", "BBC"),
]));
check("ASCII and Unicode minus signs normalize to the same negative value", !unicodeMinus.headlineNumberDifference);

const explicitPositive = auditEventAccuracy(event([
  article("Factory output changes +3% in July", "Reuters"),
  article("Factory output changes 3% in July", "BBC"),
]));
check("explicit plus and unsigned positive values normalize to the same value", !explicitPositive.headlineNumberDifference);

const currencyMismatch = auditEventAccuracy(event([
  article("Aid package reaches $3 billion", "Reuters"),
  article("Aid package reaches €3 billion", "BBC"),
]));
check("same magnitude in different currencies is detected as a disagreement", currencyMismatch.headlineNumberDifference);

const currencyAliases = auditEventAccuracy(event([
  article("Aid package reaches $3 billion", "Reuters"),
  article("Aid package reaches USD 3 billion", "BBC"),
]));
check("currency symbol and ISO code normalize to the same currency", !currencyAliases.headlineNumberDifference);

const koreanCurrencyAliases = auditEventAccuracy(event([
  article("지원 규모 3억 원 발표", "Reuters"),
  article("지원 규모 KRW 300000000 발표", "BBC"),
]));
check("Korean won label and KRW code normalize to the same currency", !koreanCurrencyAliases.headlineNumberDifference);

const englishWonAlias = auditEventAccuracy(event([
  article("Support package reaches 3 billion won", "Reuters"),
  article("Support package reaches KRW 3 billion", "BBC"),
]));
check("English won label and KRW code normalize to the same currency", !englishWonAlias.headlineNumberDifference);

console.log(`\nNumber magnitude abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
