const failures = [];
const passes = [];

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { parseVisitSnapshot } = await import("../lib/visit-snapshot.ts");
const now = Date.parse("2026-08-29T00:00:00.000Z");
const savedAt = new Date(now - 60_000).toISOString();

function snapshot(eventIds, priorityEventIds) {
  return JSON.stringify({ savedAt, eventIds, priorityEventIds });
}

check(
  "consistent priority ids remain accepted",
  Boolean(parseVisitSnapshot(snapshot(["evt_a", "evt_b"], ["evt_a"]), now)),
);
check(
  "priority id missing from eventIds is rejected",
  parseVisitSnapshot(snapshot(["evt_a"], ["evt_hidden_new_priority"]), now) === null,
);
check(
  "mixed valid and orphan priority ids are rejected",
  parseVisitSnapshot(snapshot(["evt_a", "evt_b"], ["evt_a", "evt_orphan"]), now) === null,
);
check(
  "empty priority list remains valid",
  Boolean(parseVisitSnapshot(snapshot(["evt_a"], []), now)),
);

console.log(`Visit snapshot relation abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
