const failures = [];
const passes = [];
function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const { auditEventAccuracy } = await import("../lib/accuracy.ts");

function article(title, source) {
  return {
    title,
    description: title,
    source,
    link: `https://example.com/${encodeURIComponent(source)}`,
    publishedAt: new Date().toISOString(),
    category: "세계",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: source === "Reuters" ? "wire" : "international",
  };
}

function event(id, articles) {
  return {
    id,
    title: articles[0].title,
    category: "세계",
    scope: "world",
    summary: articles[0].description,
    publishedAt: new Date().toISOString(),
    dayStatus: "today",
    articles,
    sourceCount: articles.length,
    importanceScore: 7,
    whySelected: [],
    briefWhy: "broad-impact",
    briefWatch: "follow-up",
  };
}

const weightAudit = auditEventAccuracy(event("weight", [
  article("Newborn weighs 7 pounds after delivery", "Reuters"),
  article("Newborn weighs 7 lbs after delivery", "BBC"),
]));
check("weight pounds and lbs normalize to the same measurement",
  !weightAudit.headlineNumberDifference && weightAudit.numberExamples.every((item) => item.values.includes("7LB")));
check("weight pounds are not mislabeled as GBP in trust examples",
  weightAudit.numberExamples.every((item) => item.values.every((value) => !value.endsWith("GBP"))));

const sterlingAudit = auditEventAccuracy(event("sterling", [
  article("Fund raises £7 million for expansion", "Reuters"),
  article("Fund raises GBP 7 million for expansion", "BBC"),
]));
check("explicit sterling symbols and codes still normalize as GBP",
  !sterlingAudit.headlineNumberDifference && sterlingAudit.numberExamples.every((item) => item.values.includes("7000000GBP")));

const temperatureConflict = auditEventAccuracy(event("temperature-conflict", [
  article("City records temperature of 30°C", "Reuters"),
  article("City records temperature of 30°F", "BBC"),
]));
check("same number with different temperature scales triggers disagreement", temperatureConflict.headlineNumberDifference);
check("temperature scales stay visible in trust examples",
  temperatureConflict.numberExamples.some((item) => item.values.includes("30°C")) &&
  temperatureConflict.numberExamples.some((item) => item.values.includes("30°F")));

const distanceConflict = auditEventAccuracy(event("distance-conflict", [
  article("Route length measured at 50 km", "Reuters"),
  article("Route length measured at 50 miles", "BBC"),
]));
check("same number with different distance units triggers disagreement", distanceConflict.headlineNumberDifference);

const metricAliases = auditEventAccuracy(event("metric-aliases", [
  article("Route length measured at 50 kilometers", "Reuters"),
  article("Route length measured at 50 km", "BBC"),
]));
check("equivalent distance aliases do not trigger false disagreement",
  !metricAliases.headlineNumberDifference && metricAliases.numberExamples.every((item) => item.values.includes("50000M")));

const metricDistanceConversion = auditEventAccuracy(event("metric-distance-conversion", [
  article("Evacuation zone extends 1 km from the site", "Reuters"),
  article("Evacuation zone extends 1000 meters from the site", "BBC"),
]));
check("1 km and 1000 meters do not trigger false disagreement",
  !metricDistanceConversion.headlineNumberDifference && metricDistanceConversion.numberExamples.every((item) => item.values.includes("1000M")));

const metricDistanceDifference = auditEventAccuracy(event("metric-distance-difference", [
  article("Evacuation zone extends 1 km from the site", "Reuters"),
  article("Evacuation zone extends 900 meters from the site", "BBC"),
]));
check("real converted distance disagreement is still detected", metricDistanceDifference.headlineNumberDifference);

const massConflict = auditEventAccuracy(event("mass-conflict", [
  article("Shipment weight listed as 5 kg", "Reuters"),
  article("Shipment weight listed as 5 pounds", "BBC"),
]));
check("same number with different mass units triggers disagreement", massConflict.headlineNumberDifference);

const metricMassConversion = auditEventAccuracy(event("metric-mass-conversion", [
  article("Shipment contains 1 kg of material", "Reuters"),
  article("Shipment contains 1000 grams of material", "BBC"),
]));
check("1 kg and 1000 grams do not trigger false disagreement",
  !metricMassConversion.headlineNumberDifference && metricMassConversion.numberExamples.every((item) => item.values.includes("1000G")));

console.log(`\nUnit ambiguity abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
