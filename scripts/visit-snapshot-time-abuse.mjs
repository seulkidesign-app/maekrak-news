const failures = [];
const passes = [];
const { parseVisitSnapshot } = await import("../lib/visit-snapshot.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const now = Date.parse("2026-08-29T00:00:00.000Z");
function snapshot(savedAt) {
  return JSON.stringify({ savedAt, eventIds: ["evt_a"], priorityEventIds: ["evt_a"] });
}

check("current visit snapshot is accepted", Boolean(parseVisitSnapshot(snapshot("2026-08-29T00:00:00.000Z"), now)));
check("small client clock skew is tolerated", Boolean(parseVisitSnapshot(snapshot("2026-08-29T00:04:59.000Z"), now)));
check("future visit snapshot poisoning is rejected", parseVisitSnapshot(snapshot("2099-01-01T00:00:00.000Z"), now) === null);
check("future snapshot beyond skew window is rejected", parseVisitSnapshot(snapshot("2026-08-29T00:05:01.000Z"), now) === null);
check("past snapshots remain usable", Boolean(parseVisitSnapshot(snapshot("2026-08-01T00:00:00.000Z"), now)));

console.log(`Visit snapshot time abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
