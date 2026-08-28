"use client";

import { useEffect, useMemo, useState } from "react";
import { type VisitSnapshot } from "@/lib/visit-snapshot";
import { rotateVisitSnapshot } from "@/lib/visit-storage";

export type VisitEvent = {
  id: string;
  title: string;
  publishedAt: string;
  priority: boolean;
};

const STORAGE_KEY = "maekrak:last-briefing:v2";

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
  const [previous, setPrevious] = useState<VisitSnapshot | null | undefined>(undefined);
  const current = useMemo(() => ({
    savedAt: new Date().toISOString(),
    eventIds: events.map((event) => event.id),
    priorityEventIds: events.filter((event) => event.priority).map((event) => event.id),
  } satisfies VisitSnapshot), [events]);

  useEffect(() => {
    setPrevious(rotateVisitSnapshot(window.localStorage, STORAGE_KEY, current));
  }, [current]);

  if (previous === undefined) return null;

  if (!previous) {
    return (
      <section className="returningBrief firstVisit">
        <span className="returningLabel">{lang === "ko" ? "첫 브리핑" : "FIRST BRIEFING"}</span>
        <div>
          <strong>{lang === "ko" ? "다음 방문부터 새로 잡힌 핵심 사건만 확인할 수 있습니다." : "Next time, you can focus on newly captured key events."}</strong>
          <p>{lang === "ko" ? "이 기기에서 마지막으로 본 사건 ID와 비교합니다." : "This device compares stable event IDs with your last briefing."}</p>
        </div>
      </section>
    );
  }

  const previousPriority = new Set(previous.priorityEventIds);
  const newPriority = events.filter((event) => event.priority && !previousPriority.has(event.id));
  const previousAll = new Set(previous.eventIds);
  const newAll = events.filter((event) => !previousAll.has(event.id));

  return (
    <section className={`returningBrief ${newPriority.length ? "hasDelta" : "noDelta"}`}>
      <span className="returningLabel">{lang === "ko" ? "지난 방문 이후" : "SINCE YOUR LAST VISIT"}</span>
      <div className="returningMain">
        <strong>
          {newPriority.length > 0
            ? (lang === "ko" ? `핵심 사건 ${newPriority.length}개가 새로 잡혔습니다.` : `${newPriority.length} new key ${newPriority.length === 1 ? "event" : "events"}.`)
            : (lang === "ko" ? "핵심 사건의 큰 변화는 아직 없습니다." : "No major change in the key events yet.")}
        </strong>
        <p>{lang === "ko" ? `${formatPrevious(previous.savedAt, lang)} 이후 비교 · 이 기기 기준` : `Compared with ${formatPrevious(previous.savedAt, lang)} · on this device`}</p>
        {newPriority.length > 0 && (
          <div className="deltaHeadlines">
            {newPriority.slice(0, 3).map((event) => <span key={event.id}>{event.title}</span>)}
          </div>
        )}
        {newPriority.length === 0 && newAll.length > 0 && (
          <small>{lang === "ko" ? `추가로 새로 잡힌 사건 ${newAll.length}건이 있습니다.` : `${newAll.length} additional new events were captured.`}</small>
        )}
      </div>
    </section>
  );
}
