const failures = [];
const passes = [];
const { parseVisitSnapshot } = await import("../lib/visit-snapshot.ts");
const { rotateVisitSnapshot } = await import("../lib/visit-storage.ts");

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

const oversizedPayload = JSON.stringify({
  savedAt: new Date().toISOString(),
  eventIds: [],
  priorityEventIds: [],
  padding: "x".repeat(2 * 1024 * 1024),
});
const originalJsonParse = JSON.parse;
let oversizedParseCalls = 0;
JSON.parse = function guardedParse(...args) {
  oversizedParseCalls += 1;
  return originalJsonParse.apply(this, args);
};
let oversizedResult;
try {
  oversizedResult = parseVisitSnapshot(oversizedPayload);
} finally {
  JSON.parse = originalJsonParse;
}
check("oversized raw snapshot is rejected", oversizedResult === null);
check("oversized raw snapshot is rejected before JSON.parse", oversizedParseCalls === 0);

const now = Date.now();
const previous = {
  savedAt: new Date(now - 60 * 60_000).toISOString(),
  eventIds: ["evt_previous"],
  priorityEventIds: ["evt_previous"],
};
const current = {
  savedAt: new Date(now).toISOString(),
  eventIds: ["evt_current"],
  priorityEventIds: ["evt_current"],
};
const quotaStorage = {
  getItem() { return JSON.stringify(previous); },
  setItem() {
    const error = new Error("QuotaExceededError");
    error.name = "QuotaExceededError";
    throw error;
  },
};
const preserved = rotateVisitSnapshot(quotaStorage, "maekrak:last-briefing:v2", current, now);
check("quota-exhausted write preserves a valid previous snapshot", preserved?.eventIds[0] === "evt_previous");

let persisted = "";
const normalStorage = {
  getItem() { return JSON.stringify(previous); },
  setItem(_key, value) { persisted = value; },
};
const normalPrevious = rotateVisitSnapshot(normalStorage, "maekrak:last-briefing:v2", current, now);
check("normal rotation returns the previous snapshot", normalPrevious?.priorityEventIds[0] === "evt_previous");
check("normal rotation persists the current snapshot", JSON.parse(persisted).eventIds[0] === "evt_current");

console.log(`LocalStorage snapshot abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
