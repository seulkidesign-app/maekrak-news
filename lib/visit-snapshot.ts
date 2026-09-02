export type VisitSnapshot = {
  savedAt: string;
  eventIds: string[];
  priorityEventIds: string[];
};

const MAX_EVENT_IDS = 500;
const MAX_ID_LENGTH = 160;
const MAX_RAW_SNAPSHOT_LENGTH = 256 * 1024;
const MAX_FUTURE_SKEW_MS = 5 * 60_000;
const MAX_SNAPSHOT_AGE_MS = 48 * 60 * 60_000;
const CANONICAL_ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function validIdArray(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.length <= MAX_EVENT_IDS
    && value.every((item) => typeof item === "string" && item.length > 0 && item.length <= MAX_ID_LENGTH)
    && new Set(value).size === value.length;
}

function hasConsistentEventRelations(eventIds: string[], priorityEventIds: string[]) {
  const all = new Set(eventIds);
  return priorityEventIds.every((id) => all.has(id));
}

function canonicalVisitTimestamp(value: string) {
  if (!CANONICAL_ISO_UTC.test(value)) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) return null;
  return parsed;
}

export function parseVisitSnapshot(raw: string | null, now = Date.now()): VisitSnapshot | null {
  if (!raw || raw.length > MAX_RAW_SNAPSHOT_LENGTH) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.savedAt !== "string") return null;
    const savedAt = canonicalVisitTimestamp(candidate.savedAt);
    if (!savedAt) return null;
    const savedAtMs = savedAt.getTime();
    if (savedAtMs > now + MAX_FUTURE_SKEW_MS) return null;
    if (savedAtMs < now - MAX_SNAPSHOT_AGE_MS) return null;
    if (!validIdArray(candidate.eventIds) || !validIdArray(candidate.priorityEventIds)) return null;
    if (!hasConsistentEventRelations(candidate.eventIds, candidate.priorityEventIds)) return null;
    return {
      savedAt: candidate.savedAt,
      eventIds: [...candidate.eventIds],
      priorityEventIds: [...candidate.priorityEventIds],
    };
  } catch {
    return null;
  }
}
