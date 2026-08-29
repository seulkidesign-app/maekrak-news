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

const decimalCommaPercent = auditEventAccuracy(event([
  article("Inflation slows to 3.5% in July", "Reuters"),
  article("Inflation slows to 3,5% in July", "BBC"),
]));
check("decimal comma and decimal point percentages normalize to the same value", !decimalCommaPercent.headlineNumberDifference);

const decimalCommaMagnitude = auditEventAccuracy(event([
  article("Aid package reaches 1.5 million euros", "Reuters"),
  article("Aid package reaches 1,5 million euros", "BBC"),
]));
check("decimal comma and decimal point magnitudes normalize to the same value", !decimalCommaMagnitude.headlineNumberDifference);

const thousandsComma = auditEventAccuracy(event([
  article("Company plans 1,000 new jobs", "Reuters"),
  article("Company plans 1000 new jobs", "BBC"),
]));
check("thousands comma remains a thousands separator", !thousandsComma.headlineNumberDifference);

const realDecimalDifference = auditEventAccuracy(event([
  article("Inflation slows to 3.5% in July", "Reuters"),
  article("Inflation slows to 3,6% in July", "BBC"),
]));
check("real decimal disagreement still raises a warning", realDecimalDifference.headlineNumberDifference);

const basisPointAlias = auditEventAccuracy(event([
  article("Central bank cuts rates by 50 basis points", "Reuters"),
  article("Central bank cuts rates by 0.5%", "BBC"),
]));
check("50 basis points and 0.5 percent normalize to the same change", !basisPointAlias.headlineNumberDifference);

const bpsAlias = auditEventAccuracy(event([
  article("Central bank cuts rates by 25 bps", "Reuters"),
  article("Central bank cuts rates by 0.25 percent", "BBC"),
]));
check("bps abbreviation and percent normalize to the same change", !bpsAlias.headlineNumberDifference);

const realBasisPointDifference = auditEventAccuracy(event([
  article("Central bank cuts rates by 50 basis points", "Reuters"),
  article("Central bank cuts rates by 0.25%", "BBC"),
]));
check("real basis-point disagreement still raises a warning", realBasisPointDifference.headlineNumberDifference);

const fractionalShareAlias = auditEventAccuracy(event([
  article("3/4 of voters support the plan", "Reuters"),
  article("75% of voters support the plan", "BBC"),
]));
check("explicit 3/4 share and 75 percent normalize to the same value", !fractionalShareAlias.headlineNumberDifference);

const realFractionalShareDifference = auditEventAccuracy(event([
  article("2/4 of voters support the plan", "Reuters"),
  article("75% of voters support the plan", "BBC"),
]));
check("real fractional-share disagreement still raises a warning", realFractionalShareDifference.headlineNumberDifference);

const slashOutsideShareContext = auditEventAccuracy(event([
  article("Vote scheduled for 3/4 with turnout at 75%", "Reuters"),
  article("Vote scheduled for 4/5 with turnout at 75%", "BBC"),
]));
check("slash numbers outside explicit share context are not silently converted", slashOutsideShareContext.headlineNumberDifference);

console.log(`\nNumber magnitude abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
