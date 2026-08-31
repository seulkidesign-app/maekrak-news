const failures = [];
const passes = [];

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { parseVisitSnapshot } = await import("../lib/visit-snapshot.ts");
const now = Date.parse("2026-09-01T00:00:00.000Z");
const savedAt = new Date(now - 60_000).toISOString();

function snapshot(eventIds, priorityEventIds) {
  return JSON.stringify({ savedAt, eventIds, priorityEventIds });
}

check(
  "unique event and priority ids remain accepted",
  Boolean(parseVisitSnapshot(snapshot(["evt_a", "evt_b"], ["evt_a"]), now)),
);
check(
  "duplicate event ids are rejected",
  parseVisitSnapshot(snapshot(["evt_a", "evt_a"], ["evt_a"]), now) === null,
);
check(
  "duplicate priority ids are rejected",
  parseVisitSnapshot(snapshot(["evt_a", "evt_b"], ["evt_a", "evt_a"]), now) === null,
);
check(
  "duplicate flood cannot consume the 500-id allowance",
  parseVisitSnapshot(snapshot(Array(500).fill("evt_same"), ["evt_same"]), now) === null,
);

console.log(`Duplicate visit snapshot ID abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
