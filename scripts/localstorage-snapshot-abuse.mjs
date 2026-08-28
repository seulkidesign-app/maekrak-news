const failures = [];
const passes = [];
const { parseVisitSnapshot } = await import("../lib/visit-snapshot.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const valid = JSON.stringify({
  savedAt: new Date().toISOString(),
  eventIds: ["evt_a", "evt_b"],
  priorityEventIds: ["evt_a"],
});
check("valid returning-brief snapshot is accepted", Boolean(parseVisitSnapshot(valid)));
check("malformed JSON is rejected", parseVisitSnapshot("{not-json") === null);
check("primitive JSON is rejected", parseVisitSnapshot('"poison"') === null);
check("null JSON is rejected", parseVisitSnapshot("null") === null);
check("object-shaped eventIds poison is rejected", parseVisitSnapshot(JSON.stringify({ savedAt: new Date().toISOString(), eventIds: {}, priorityEventIds: [] })) === null);
check("non-string IDs are rejected", parseVisitSnapshot(JSON.stringify({ savedAt: new Date().toISOString(), eventIds: ["evt_a", 7], priorityEventIds: [] })) === null);
check("invalid savedAt is rejected", parseVisitSnapshot(JSON.stringify({ savedAt: "not-a-date", eventIds: [], priorityEventIds: [] })) === null);
check("oversized ID arrays are rejected", parseVisitSnapshot(JSON.stringify({ savedAt: new Date().toISOString(), eventIds: Array.from({ length: 501 }, (_, i) => `evt_${i}`), priorityEventIds: [] })) === null);
check("oversized individual IDs are rejected", parseVisitSnapshot(JSON.stringify({ savedAt: new Date().toISOString(), eventIds: ["x".repeat(161)], priorityEventIds: [] })) === null);

console.log(`LocalStorage snapshot abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
