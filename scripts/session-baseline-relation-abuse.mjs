const failures = [];
const passes = [];
const { rotateVisitSnapshot } = await import("../lib/visit-storage.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

function snapshot(savedAt, suffix) {
  return {
    savedAt: new Date(savedAt).toISOString(),
    eventIds: [`evt_${suffix}`],
    priorityEventIds: [`evt_${suffix}`],
  };
}

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, value); },
  };
}

const key = "maekrak:last-briefing:v2";
const now = Date.now();
const mainRecent = snapshot(now - 60_000, "main_recent");
const poisonedFutureBaseline = snapshot(now + 4 * 60_000, "poisoned_future");
const current = snapshot(now, "current");

const poisoned = memoryStorage({
  [key]: JSON.stringify(mainRecent),
  [`${key}:session-baseline`]: JSON.stringify(poisonedFutureBaseline),
});
const fallback = rotateVisitSnapshot(poisoned, key, current, now);
check("future-dated companion baseline cannot override a newer main snapshot", fallback?.eventIds[0] === "evt_main_recent");
check("future-dated companion baseline cannot suppress deltas with attacker IDs", !fallback?.eventIds.includes("evt_poisoned_future"));

const legitimateBaseline = snapshot(now - 60 * 60_000, "prior_visit");
const legitimate = memoryStorage({
  [key]: JSON.stringify(mainRecent),
  [`${key}:session-baseline`]: JSON.stringify(legitimateBaseline),
});
const preserved = rotateVisitSnapshot(legitimate, key, current, now);
check("older session baseline still preserves the original prior visit", preserved?.eventIds[0] === "evt_prior_visit");

console.log(`Session baseline relation abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
