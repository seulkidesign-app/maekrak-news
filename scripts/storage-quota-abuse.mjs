const failures = [];
const passes = [];
const { rotateVisitSnapshot } = await import("../lib/visit-storage.ts");

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const now = Date.parse("2026-08-29T00:00:00.000Z");
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

let quotaWriteAttempts = 0;
const quotaStorage = {
  getItem() {
    return JSON.stringify(previous);
  },
  setItem() {
    quotaWriteAttempts += 1;
    const error = new Error("QuotaExceededError");
    error.name = "QuotaExceededError";
    throw error;
  },
};

const preserved = rotateVisitSnapshot(quotaStorage, "maekrak:last-briefing:v2", current, now);
check("valid previous snapshot survives quota-exhausted write", preserved?.eventIds[0] === "evt_previous");
check("quota-exhausted storage still attempts one rotation write", quotaWriteAttempts === 1, `attempts=${quotaWriteAttempts}`);

let successfulWrite = "";
const normalStorage = {
  getItem() {
    return JSON.stringify(previous);
  },
  setItem(_key, value) {
    successfulWrite = value;
  },
};
const normalPrevious = rotateVisitSnapshot(normalStorage, "maekrak:last-briefing:v2", current, now);
check("normal storage preserves previous snapshot", normalPrevious?.priorityEventIds[0] === "evt_previous");
check("normal storage persists current snapshot", JSON.parse(successfulWrite).eventIds[0] === "evt_current");

let writeAfterReadFailure = "";
const readDeniedStorage = {
  getItem() {
    throw new Error("SecurityError");
  },
  setItem(_key, value) {
    writeAfterReadFailure = value;
  },
};
const missingPrevious = rotateVisitSnapshot(readDeniedStorage, "maekrak:last-briefing:v2", current, now);
check("storage read denial fails closed to first-visit state", missingPrevious === null);
check("a read denial does not prevent a best-effort current snapshot write", JSON.parse(writeAfterReadFailure).eventIds[0] === "evt_current");

console.log(`Storage quota abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
