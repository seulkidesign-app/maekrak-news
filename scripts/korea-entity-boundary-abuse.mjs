const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

function article(title) {
  return {
    title,
    description: title,
    source: "Reuters",
    link: "https://www.reuters.com/world/story",
    publishedAt: new Date().toISOString(),
    category: "세계",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: "wire",
  };
}

const south = article("South Korea launches missile during military drill");
const north = article("North Korea launches missile during military drill");

check("South and North Korea missile stories are not merged", !__test.sameEvent(south, north));

const southEntities = __test.normalizedEntities(south.title);
const northEntities = __test.normalizedEntities(north.title);
check("South Korea resolves to a dedicated entity", southEntities.has("southkorea") && !southEntities.has("korea"), [...southEntities].join(","));
check("North Korea resolves to a dedicated entity", northEntities.has("northkorea") && !northEntities.has("korea"), [...northEntities].join(","));
check("South Korea is inferred as domestic scope", __test.inferScope("South Korea election opens", "", "world") === "domestic");
check("North Korea is inferred as world scope", __test.inferScope("North Korea missile launch", "", "domestic") === "world");
check("DPRK alias is inferred as world scope", __test.inferScope("DPRK missile launch", "", "domestic") === "world");
check("Ambiguous bare Korea does not override fallback", __test.inferScope("Korea talks continue", "", "world") === "world");

console.log(`Korea entity boundary abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
