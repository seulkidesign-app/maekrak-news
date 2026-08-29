const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const when = "2026-08-30T00:00:00.000Z";
function article(title, source) {
  return {
    title,
    description: title,
    source,
    link: `https://example.com/${encodeURIComponent(source)}/${encodeURIComponent(title)}`,
    publishedAt: when,
    category: "세계",
    scope: "world",
    sourceType: "aggregated",
    sourceRole: "other",
  };
}

const iran = article("Iran sanctions talks continue", "Outlet A");
const bridge = article("Iran sanctions talks continue as Ukraine missile launch reported", "Outlet B");
const ukraine = article("Ukraine missile launch reported", "Outlet C");

check("bridge matches Iran story", __test.sameEvent(bridge, iran));
check("bridge matches Ukraine story", __test.sameEvent(bridge, ukraine));
check("Iran and Ukraine stories are distinct", !__test.sameEvent(iran, ukraine));

function legacyCluster(items) {
  const clusters = [];
  for (const item of items) {
    const match = clusters.find((cluster) => cluster.length > 0 && __test.sameEvent(cluster[0], item));
    if (match) match.push(item);
    else clusters.push([item]);
  }
  return clusters;
}

const cluster = __test.clusterNewsItems ?? legacyCluster;
const permutations = [
  [bridge, iran, ukraine],
  [bridge, ukraine, iran],
  [iran, bridge, ukraine],
  [iran, ukraine, bridge],
  [ukraine, bridge, iran],
  [ukraine, iran, bridge],
];

for (const [index, order] of permutations.entries()) {
  const clusters = cluster(order);
  const mergedOpposites = clusters.some((items) => items.includes(iran) && items.includes(ukraine));
  check(`permutation ${index + 1} keeps unrelated endpoints apart`, !mergedOpposites, `clusters=${clusters.length}`);
  check(`permutation ${index + 1} does not collapse three articles into one event`, clusters.length >= 2, `clusters=${clusters.length}`);
}

console.log(`Cluster bridge abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
