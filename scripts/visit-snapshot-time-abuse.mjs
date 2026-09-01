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
check("recent past snapshots remain usable", Boolean(parseVisitSnapshot(snapshot("2026-08-28T00:00:00.000Z"), now)));

// New attack class: runtime-dependent visit timestamp ambiguity.
// The app writes ISO UTC via toISOString(); accepting looser Date.parse-compatible strings lets a poisoned
// localStorage value shift the "since your last visit" baseline differently across runtimes/time zones.
check("slash-form visit timestamp is rejected", parseVisitSnapshot(snapshot("08/28/2026 23:30"), now) === null);
check("timezone-less ISO-like visit timestamp is rejected", parseVisitSnapshot(snapshot("2026-08-28 23:30"), now) === null);
check("timezone-less RFC visit timestamp is rejected", parseVisitSnapshot(snapshot("Fri, 28 Aug 2026 23:30:00"), now) === null);
check("offset ISO visit timestamp is rejected in favor of canonical storage format", parseVisitSnapshot(snapshot("2026-08-28T23:30:00+00:00"), now) === null);
check("canonical millisecond ISO UTC remains accepted", Boolean(parseVisitSnapshot(snapshot("2026-08-28T23:30:00.000Z"), now)));
check("non-canonical ISO precision is rejected", parseVisitSnapshot(snapshot("2026-08-28T23:30:00Z"), now) === null);

console.log(`Visit snapshot time abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
