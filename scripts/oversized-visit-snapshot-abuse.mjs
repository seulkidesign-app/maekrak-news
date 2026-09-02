import assert from "node:assert/strict";
import { parseVisitSnapshot } from "../lib/visit-snapshot.ts";

const now = Date.UTC(2026, 8, 2, 1, 0, 0);
const savedAt = new Date(now).toISOString();
const oversized = JSON.stringify({
  savedAt,
  eventIds: [],
  priorityEventIds: [],
  padding: "x".repeat(2 * 1024 * 1024),
});

const originalParse = JSON.parse;
let parseCalls = 0;
JSON.parse = function guardedParse(...args) {
  parseCalls += 1;
  return originalParse.apply(this, args);
};

try {
  assert.equal(
    parseVisitSnapshot(oversized, now),
    null,
    "oversized attacker-controlled visit snapshots must be rejected",
  );
  assert.equal(
    parseCalls,
    0,
    "oversized snapshots must be rejected before invoking JSON.parse",
  );
} finally {
  JSON.parse = originalParse;
}

console.log("oversized visit snapshot abuse regression passed");
