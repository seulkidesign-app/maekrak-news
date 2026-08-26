"use client";

import { useEffect, useMemo, useState } from "react";

export type VisitEvent = {
  title: string;
  publishedAt: string;
  priority: boolean;
};

type Snapshot = {
  savedAt: string;
  fingerprints: string[];
  priorityFingerprints: string[];
};

const STORAGE_KEY = "maekrak:last-briefing:v1";

function fingerprint(title: string) {
  const words = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2)
    .filter((word) => !["속보", "단독", "영상", "뉴스", "today", "live", "breaking", "update"].includes(word));
  return [...new Set(words)].sort().slice(0, 10).join("|");
}

function formatPrevious(date: string, lang: "ko" | "en") {
  const parsed = new Date(date);
  if (!Number.isFinite(parsed.getTime())) return lang === "ko" ? "이전 방문" : "previous visit";
  return parsed.toLocaleString(lang === "ko" ? "ko-KR" : "en-US", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReturningBrief({ events, lang }: { events: VisitEvent[]; lang: "ko" | "en" }) {
  const [previous, setPrevious] = useState<Snapshot | null | undefined>(undefined);
  const current = useMemo(() => {
    const fingerprints = events.map((event) => fingerprint(event.title)).filter(Boolean);
    const priorityFingerprints = events.filter((event) => event.priority).map((event) => fingerprint(event.title)).filter(Boolean);
    return { savedAt: new Date().toISOString(), fingerprints, priorityFingerprints } satisfies Snapshot;
  }, [events]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setPrevious(raw ? JSON.parse(raw) as Snapshot : null);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      setPrevious(null);
    }
  }, [current]);

  if (previous === undefined) return null;

  if (!previous) {
    return (
      <section className="returningBrief firstVisit">
        <span className="returningLabel">{lang === "ko" ? "첫 브리핑" : "FIRST BRIEFING"}</span>
        <div>
          <strong>{lang === "ko" ? "오늘부터 변화만 따라가도 됩니다." : "From today, you can follow only what changes."}</strong>
          <p>{lang === "ko" ? "다음 방문부터 이 기기에서 마지막으로 본 브리핑과 비교해 새 핵심 사건을 표시합니다." : "On your next visit, this device will compare the briefing with what you last saw and highlight new key events."}</p>
        </div>
      </section>
    );
  }

  const previousPriority = new Set(previous.priorityFingerprints);
  const newPriority = events.filter((event) => event.priority && !previousPriority.has(fingerprint(event.title)));
  const previousAll = new Set(previous.fingerprints);
  const newAll = events.filter((event) => !previousAll.has(fingerprint(event.title)));

  return (
    <section className={`returningBrief ${newPriority.length ? "hasDelta" : "noDelta"}`}>
      <span className="returningLabel">{lang === "ko" ? "지난 방문 이후" : "SINCE YOUR LAST VISIT"}</span>
      <div className="returningMain">
        <strong>
          {newPriority.length > 0
            ? (lang === "ko" ? `핵심 사건 ${newPriority.length}개가 새로 잡혔습니다.` : `${newPriority.length} new key ${newPriority.length === 1 ? "event" : "events"}.`)
            : (lang === "ko" ? "핵심 5개의 큰 변화는 아직 없습니다." : "No major change in the five key events yet.")}
        </strong>
        <p>{lang === "ko" ? `${formatPrevious(previous.savedAt, lang)} 이후 비교 · 이 기기 기준` : `Compared with ${formatPrevious(previous.savedAt, lang)} · on this device`}</p>
        {newPriority.length > 0 && (
          <div className="deltaHeadlines">
            {newPriority.slice(0, 3).map((event) => <span key={`${event.title}-${event.publishedAt}`}>{event.title}</span>)}
          </div>
        )}
        {newPriority.length === 0 && newAll.length > 0 && (
          <small>{lang === "ko" ? `추가 뉴스 ${newAll.length}건은 아래에서 확인할 수 있습니다.` : `${newAll.length} additional new stories are available below.`}</small>
        )}
      </div>
    </section>
  );
}
