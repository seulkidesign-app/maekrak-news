export type VisitSnapshot = {
  savedAt: string;
  eventIds: string[];
  priorityEventIds: string[];
};

const MAX_EVENT_IDS = 500;
const MAX_ID_LENGTH = 160;
const MAX_FUTURE_SKEW_MS = 5 * 60_000;

function validIdArray(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.length <= MAX_EVENT_IDS
    && value.every((item) => typeof item === "string" && item.length > 0 && item.length <= MAX_ID_LENGTH);
}

export function parseVisitSnapshot(raw: string | null, now = Date.now()): VisitSnapshot | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.savedAt !== "string") return null;
    const savedAtMs = new Date(candidate.savedAt).getTime();
    if (!Number.isFinite(savedAtMs) || savedAtMs > now + MAX_FUTURE_SKEW_MS) return null;
    if (!validIdArray(candidate.eventIds) || !validIdArray(candidate.priorityEventIds)) return null;
    return {
      savedAt: candidate.savedAt,
      eventIds: [...candidate.eventIds],
      priorityEventIds: [...candidate.priorityEventIds],
    };
  } catch {
    return null;
  }
}
