import { parseVisitSnapshot, type VisitSnapshot } from "./visit-snapshot.ts";

export type VisitStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function rotateVisitSnapshot(
  storage: VisitStorage,
  key: string,
  current: VisitSnapshot,
  now = Date.now(),
): VisitSnapshot | null {
  let previous: VisitSnapshot | null = null;

  try {
    previous = parseVisitSnapshot(storage.getItem(key), now);
  } catch {
    previous = null;
  }

  try {
    storage.setItem(key, JSON.stringify(current));
  } catch {
    // Storage can be unavailable or full (for example Safari private mode or quota exhaustion).
    // A failed write must not erase a valid snapshot that was already read.
  }

  return previous;
}
