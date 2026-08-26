import { getDisplayArticle, type NewsEvent } from "@/lib/news";
import type { Language } from "@/lib/i18n";

function relativeTime(date: string, lang: Language) {
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return "";
  const mins = Math.max(1, Math.floor((Date.now() - time) / 60000));
  if (mins < 60) return lang === "ko" ? `${mins}분 전` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === "ko" ? `${hours}시간 전` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang === "ko" ? `${days}일 전` : `${days}d ago`;
}

export function MoreTodayCompact({ events, lang }: { events: NewsEvent[]; lang: Language }) {
  if (!events.length) return null;

  return (
    <section className="moreCompactSection">
      <details className="moreCompactDetails">
        <summary>
          <div>
            <span className="eyebrow">MORE TODAY</span>
            <strong>{lang === "ko" ? "더 보고 싶은 뉴스가 있다면" : "If you want to scan more"}</strong>
          </div>
          <em>{lang === "ko" ? `${events.length}개 추가 사건` : `${events.length} more events`}</em>
        </summary>
        <div className="moreCompactList">
          {events.map((event) => {
            const article = getDisplayArticle(event, lang);
            return (
              <a href={article.link} target="_blank" rel="noreferrer" key={event.id}>
                <span className="moreCompactMeta">
                  <b>{event.category}</b>
                  <em>{article.source}</em>
                  <small>{relativeTime(event.publishedAt, lang)}</small>
                </span>
                <strong>{article.title || event.title}</strong>
                <span className="moreCompactArrow">↗</span>
              </a>
            );
          })}
        </div>
      </details>
    </section>
  );
}
