import type { Metadata } from "next";
import { auditEventAccuracy } from "@/lib/accuracy";
import { getBriefing, getDisplayArticle, type NewsEvent, type NewsItem } from "@/lib/news";
import "./qa.css";

export const revalidate = 900;
export const metadata: Metadata = { title: "맥락 QA", robots: { index: false, follow: false } };

const REFERENCE_SOURCE = /^(SBS|KBS|MBC|연합뉴스|Reuters|AP|BBC)$/i;

function isReference(article: NewsItem) {
  return REFERENCE_SOURCE.test(article.source.trim());
}

function ageHours(value?: string) {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.max(0, (Date.now() - time) / 3_600_000);
}

function relative(value?: string) {
  const hours = ageHours(value);
  if (hours === null) return "시간 없음";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}분 전`;
  return `${Math.round(hours)}시간 전`;
}

function eventReferenceCount(event: NewsEvent) {
  return new Set(event.articles.filter(isReference).map((article) => article.source)).size;
}

function qaStatus(value: boolean, good: string, bad: string) {
  return <span className={value ? "qaOk" : "qaWarn"}>{value ? good : bad}</span>;
}

export default async function QaPage() {
  const briefing = await getBriefing();
  const news = briefing.news;
  const events = briefing.events;
  const priorityIds = new Set(briefing.priorityEventIds);
  const linkToEvent = new Map<string, NewsEvent>();
  events.forEach((event) => event.articles.forEach((article) => linkToEvent.set(article.link, event)));

  const referenceArticles = news.filter(isReference).slice(0, 80);
  const referenceEventMap = new Map<string, NewsEvent>();
  let unmatchedReferenceArticles = 0;
  referenceArticles.forEach((article) => {
    const event = linkToEvent.get(article.link);
    if (event) referenceEventMap.set(event.id, event);
    else unmatchedReferenceArticles += 1;
  });

  const referenceEvents = [...referenceEventMap.values()].sort((a, b) => {
    const sourceDiff = eventReferenceCount(b) - eventReferenceCount(a);
    return sourceDiff || b.importanceScore - a.importanceScore;
  });
  const referenceTop = referenceEvents.slice(0, 10);
  const referenceTopInPriority = referenceTop.filter((event) => priorityIds.has(event.id)).length;

  const priorityEvents = briefing.priorityEventIds
    .map((id) => events.find((event) => event.id === id))
    .filter((event): event is NewsEvent => Boolean(event));
  const singleSourcePriority = priorityEvents.filter((event) => event.sourceCount <= 1).length;
  const accuracyWarningPriority = priorityEvents.filter((event) => {
    const audit = auditEventAccuracy(event);
    return audit.headlineNumberDifference || audit.certaintyDifference;
  }).length;
  const ongoingPriority = priorityEvents.filter((event) => event.dayStatus === "ongoing").length;
  const staleSources = briefing.sourceHealth.filter((source) => {
    const hours = ageHours(source.latestPublishedAt);
    return source.ok && (hours === null || hours > 12);
  });

  const referenceCapture = referenceArticles.length
    ? Math.round(((referenceArticles.length - unmatchedReferenceArticles) / referenceArticles.length) * 100)
    : 0;
  const topPriorityCoverage = referenceTop.length ? Math.round((referenceTopInPriority / referenceTop.length) * 100) : 0;

  return (
    <main className="qaPage">
      <header className="qaHeader">
        <div><a href="/">← 맥락</a><span>INTERNAL QA · NOINDEX</span></div>
        <h1>오늘 브리핑 정확도 운영 QA</h1>
        <p>이 페이지의 비율은 ‘진실 점수’가 아닙니다. 수집·선정·묶기 과정의 이상 신호를 빨리 찾기 위한 내부 진단입니다.</p>
      </header>

      <section className="qaMetrics">
        <div><small>기준 매체 기사 → 사건 포착</small><strong>{referenceCapture}%</strong><p>{referenceArticles.length - unmatchedReferenceArticles}/{referenceArticles.length}건</p></div>
        <div><small>기준 이벤트 Top 10 → 핵심 브리핑</small><strong>{topPriorityCoverage}%</strong><p>{referenceTopInPriority}/{referenceTop.length}개</p></div>
        <div><small>핵심 단일 매체</small><strong>{singleSourcePriority}</strong><p>5개 중</p></div>
        <div><small>핵심 출처 표현 차이</small><strong>{accuracyWarningPriority}</strong><p>수치·확정성 기준</p></div>
        <div><small>이어지는 핵심 사건</small><strong>{ongoingPriority}</strong><p>전날→오늘</p></div>
        <div><small>12시간+ 오래된 소스</small><strong>{staleSources.length}</strong><p>{briefing.totalSources}개 수집 경로 중</p></div>
      </section>

      <section className="qaBlock">
        <div className="qaBlockHead"><div><span>CHECK 01</span><h2>핵심 브리핑 5개</h2></div><p>단일 출처·출처 차이·진행 중 여부를 먼저 봅니다.</p></div>
        <div className="qaEventList">
          {priorityEvents.map((event, index) => {
            const audit = auditEventAccuracy(event);
            const article = getDisplayArticle(event, "ko");
            const hasDifference = audit.headlineNumberDifference || audit.certaintyDifference;
            return (
              <article key={event.id}>
                <span className="qaIndex">{index + 1}</span>
                <div>
                  <div className="qaTags">
                    <b>{event.category}</b>
                    {qaStatus(event.sourceCount >= 2, `${event.sourceCount}개 매체`, "단일 매체")}
                    {hasDifference && <span className="qaWarn">출처 표현 차이</span>}
                    {event.dayStatus === "ongoing" && <span>이어지는 사건</span>}
                  </div>
                  <h3>{article.title || event.title}</h3>
                  <p>{event.articles.slice(0, 5).map((item) => item.source).filter((v, i, a) => a.indexOf(v) === i).join(" · ")}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="qaBlock">
        <div className="qaBlockHead"><div><span>CHECK 02</span><h2>기준 매체에서 많이 겹친 오늘의 사건</h2></div><p>기준: SBS·KBS·MBC·연합뉴스·Reuters·AP·BBC. 외부 독립 벤치마크가 아니라 동일 수집 스냅샷의 내부 기준집합입니다.</p></div>
        <div className="qaReferenceList">
          {referenceTop.map((event, index) => {
            const article = getDisplayArticle(event, "ko");
            return (
              <article key={event.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{article.title || event.title}</h3><p>기준 매체 {eventReferenceCount(event)}곳 · 전체 {event.sourceCount}곳 · {relative(event.publishedAt)}</p></div>
                {priorityIds.has(event.id) ? <b className="qaOk">핵심 포함</b> : <b className="qaWarn">핵심 미포함</b>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="qaBlock qaSources">
        <div className="qaBlockHead"><div><span>CHECK 03</span><h2>수집 경로 최신성</h2></div><p>응답 성공과 최신 기사 제공은 다른 문제입니다.</p></div>
        <div className="qaSourceGrid">
          {briefing.sourceHealth.map((source) => {
            const hours = ageHours(source.latestPublishedAt);
            const stale = source.ok && (hours === null || hours > 12);
            return <div key={source.name} className={stale || !source.ok ? "hasIssue" : ""}><b>{source.name}</b><span>{source.ok ? relative(source.latestPublishedAt) : source.status}</span><small>{source.itemCount}건</small></div>;
          })}
        </div>
      </section>

      <section className="qaNotes">
        <h2>PASS 기준</h2>
        <p>운영 초기 목표: 기준 기사 사건 포착 95%+, 기준 Top 10의 핵심 브리핑 포함률은 50%만으로 판단하지 않고 실제 중요도 수동 검토를 병행합니다. 핵심 5개에서 출처 표현 차이는 0이 목표가 아니라, 감지되면 사용자에게 숨기지 않는 것이 목표입니다.</p>
      </section>
    </main>
  );
}
