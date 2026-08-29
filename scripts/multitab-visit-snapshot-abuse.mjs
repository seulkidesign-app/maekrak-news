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
    read(key) { return map.get(key); },
  };
}

const key = "maekrak:last-briefing:v2";
const now = Date.now();
const yesterday = snapshot(now - 60 * 60_000, "yesterday");
const tabA = snapshot(now, "tab_a");
const tabB = snapshot(now + 5_000, "tab_b");
const storage = memoryStorage({ [key]: JSON.stringify(yesterday) });

const firstBaseline = rotateVisitSnapshot(storage, key, tabA, now);
check("first tab compares against the prior visit", firstBaseline?.eventIds[0] === "evt_yesterday");
check("first tab preserves the prior visit as the session baseline", JSON.parse(storage.read(`${key}:session-baseline`)).eventIds[0] === "evt_yesterday");

const secondBaseline = rotateVisitSnapshot(storage, key, tabB, now + 5_000);
check("second tab in the same session still compares against the original prior visit", secondBaseline?.eventIds[0] === "evt_yesterday");
check("second tab does not replace the session baseline", JSON.parse(storage.read(`${key}:session-baseline`)).eventIds[0] === "evt_yesterday");
check("main snapshot still advances to the latest tab state", JSON.parse(storage.read(key)).eventIds[0] === "evt_tab_b");

const nextSession = snapshot(now + 16 * 60_000, "next_session");
const nextBaseline = rotateVisitSnapshot(storage, key, nextSession, now + 16 * 60_000);
check("a later session compares against the last state from the previous session", nextBaseline?.eventIds[0] === "evt_tab_b");
check("a later session starts a new baseline", JSON.parse(storage.read(`${key}:session-baseline`)).eventIds[0] === "evt_tab_b");

const corrupted = memoryStorage({
  [key]: JSON.stringify(tabA),
  [`${key}:session-baseline`]: "{broken-json",
});
const fallback = rotateVisitSnapshot(corrupted, key, tabB, now + 5_000);
check("corrupt companion baseline safely falls back to the recent main snapshot", fallback?.eventIds[0] === "evt_tab_a");

console.log(`Multitab visit snapshot abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
