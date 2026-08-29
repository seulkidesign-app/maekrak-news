import { parseVisitSnapshot, type VisitSnapshot } from "./visit-snapshot.ts";

export type VisitStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

const SESSION_WINDOW_MS = 15 * 60_000;

export function rotateVisitSnapshot(
  storage: VisitStorage,
  key: string,
  current: VisitSnapshot,
  now = Date.now(),
): VisitSnapshot | null {
  let previous: VisitSnapshot | null = null;
  let sessionBaseline: VisitSnapshot | null = null;
  const baselineKey = `${key}:session-baseline`;

  try {
    previous = parseVisitSnapshot(storage.getItem(key), now);
  } catch {
    previous = null;
  }

  try {
    sessionBaseline = parseVisitSnapshot(storage.getItem(baselineKey), now);
  } catch {
    sessionBaseline = null;
  }

  const previousTime = previous ? new Date(previous.savedAt).getTime() : Number.NaN;
  const previousAge = Number.isFinite(previousTime) ? now - previousTime : Number.POSITIVE_INFINITY;
  const sameSession = Boolean(previous && previousAge >= 0 && previousAge <= SESSION_WINDOW_MS);
  const comparisonBaseline = sameSession && sessionBaseline ? sessionBaseline : previous;

  if (!sameSession) {
    try {
      storage.setItem(baselineKey, previous ? JSON.stringify(previous) : "");
    } catch {
      // Baseline persistence is best-effort. If it fails, the valid main snapshot still remains usable.
    }
  }

  try {
    storage.setItem(key, JSON.stringify(current));
  } catch {
    // Storage can be unavailable or full (for example Safari private mode or quota exhaustion).
    // A failed write must not erase a valid snapshot that was already read.
  }

  return comparisonBaseline;
}
