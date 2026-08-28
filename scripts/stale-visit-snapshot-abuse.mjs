const failures = [];
const passes = [];
const { parseVisitSnapshot } = await import("../lib/visit-snapshot.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const now = Date.parse("2026-08-29T00:00:00.000Z");
function snapshot(savedAt, id = "evt_recurring_policy_event") {
  return JSON.stringify({ savedAt, eventIds: [id], priorityEventIds: [id] });
}

check("snapshot just inside 48h replay window is accepted",
  Boolean(parseVisitSnapshot(snapshot("2026-08-27T00:00:01.000Z"), now)));
check("snapshot exactly 48h old is accepted",
  Boolean(parseVisitSnapshot(snapshot("2026-08-27T00:00:00.000Z"), now)));
check("snapshot older than 48h is rejected",
  parseVisitSnapshot(snapshot("2026-08-26T23:59:59.999Z"), now) === null);
check("month-old recurring event snapshot cannot suppress a fresh event with the same stable id",
  parseVisitSnapshot(snapshot("2026-07-29T00:00:00.000Z"), now) === null);

console.log(`Stale visit snapshot abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
