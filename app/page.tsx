import { getEvents, type NewsEvent } from "@/lib/news";
import { detectContext } from "@/lib/context";
import { classifyEvidence, eventEvidenceSummary, eventTimeline } from "@/lib/signals";

export const revalidate = 900;

function relativeTime(date: string) {
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return "시간 확인 중";
  const mins = Math.max(1, Math.floor((Date.now() - time) / 60000));
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function shortTime(date: string) {
  const parsed = new Date(date);
  if (!Number.isFinite(parsed.getTime())) return "시간 확인 중";
  return parsed.toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function coverageLabel(event: NewsEvent) {
  if (event.sourceCount >= 3) return "여러 출처에서 보도 중";
  if (event.sourceCount === 2) return "2개 출처에서 보도 중";
  return "단일 출처 기준";
}

export default async function Home() {
  const events = await getEvents();
  const updatedAt = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top">맥락</a>
        <nav><a href="#events">오늘 이해할 사건</a><a href="#principles">검증 원칙</a></nav>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">NEWS, WITH CONTEXT</div>
        <h1>뉴스를 더 많이 말고,<br />오늘 이해할 것만.</h1>
        <p>같은 사건의 보도를 묶고, 기사 속 핵심 개념과 보도의 성격을 나눠 보여줍니다. 모르는 부분은 채우지 않고 남겨둡니다.</p>
        <div className="status"><span className="dot" /> 최근 갱신 {updatedAt} · 최대 15분 캐시 · 유료 AI 미사용</div>
      </section>

      <section className="levels">
        <div><span>01</span><strong>30초 이해</strong><p>무슨 일이 보도되고 있는지.</p></div>
        <div><span>02</span><strong>맥락 찾기</strong><p>이 사건을 이해할 핵심 배경을 찾습니다.</p></div>
        <div><span>03</span><strong>근거 확인</strong><p>사실·주장·불확실성을 나누고 원문을 비교합니다.</p></div>
      </section>

      <section className="section" id="events">
        <div className="sectionHead">
          <div><div className="eyebrow">TODAY&apos;S EVENTS</div><h2>오늘 이해해둘 사건</h2></div>
          <p>기사 수가 아니라 사건 단위로 봅니다.</p>
        </div>

        {events.length === 0 ? <div className="empty">현재 피드를 불러오지 못했습니다. 잠시 뒤 다시 확인해 주세요.</div> : (
          <div className="eventList">
            {events.map((event, index) => {
              const contexts = detectContext(event);
              const evidence = eventEvidenceSummary(event);
              const timeline = eventTimeline(event);
              return (
                <article className="eventCard" key={event.id}>
                  <div className="eventNumber">{String(index + 1).padStart(2, "0")}</div>
                  <div className="eventBody">
                    <div className="meta"><span>{event.category}</span><span>{coverageLabel(event)}</span><span>{relativeTime(event.publishedAt)}</span></div>
                    <h3>{event.title}</h3>
                    {event.summary && <p className="lead">{event.summary.slice(0, 220)}{event.summary.length > 220 ? "…" : ""}</p>}

                    <div className="evidenceBox">
                      <div className="boxLabel">현재 확인 가능한 보도</div>
                      <p>현재 <strong>{event.sourceCount}개 출처</strong>의 {event.articles.length}개 기사를 같은 사건으로 묶었습니다. 출처 수는 비교 신호일 뿐, 독립 검증 점수로 사용하지 않습니다.</p>
                      <div className="evidencePills">
                        <span>보도된 사실 {evidence["보도된 사실"]}</span>
                        <span>주장·발언 {evidence["주장·발언"]}</span>
                        <span>추가 확인 필요 {evidence["추가 확인 필요"]}</span>
                      </div>
                    </div>

                    {timeline.length > 1 && (
                      <div className="timelineSection">
                        <div className="boxLabel">이 사건의 흐름</div>
                        <ol className="timeline">
                          {timeline.map((article, timelineIndex) => (
                            <li key={`${article.link}-${timelineIndex}`}>
                              <time>{shortTime(article.publishedAt)}</time>
                              <div><b>{article.source}</b><span className={`evidenceTag evidenceTag-${classifyEvidence(article).replace(/[^가-힣]/g, "")}`}>{classifyEvidence(article)}</span><p>{article.title}</p></div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    <div className="contextSection">
                      <div className="boxLabel">이 사건을 이해하려면</div>
                      {contexts.length > 0 ? (
                        <div className="concepts">
                          {contexts.map((info) => (
                            <details className="concept" key={info.id}>
                              <summary><b>{info.term}</b><span>{info.kind} · 탐지 신뢰 {info.confidence}</span></summary>
                              <div className="depth">
                                <div><small>30초</small><p>{info.simple}</p></div>
                                <div><small>맥락</small><p>{info.context}</p></div>
                                <div><small>깊이</small><p>{info.deep}</p></div>
                              </div>
                              <a className="referenceLink" href={info.referenceUrl} target="_blank" rel="noreferrer">배경자료: {info.referenceLabel} ↗</a>
                            </details>
                          ))}
                        </div>
                      ) : <p className="pending">신뢰할 수 있는 배경 개념을 아직 연결하지 못했습니다. 억지 설명 대신 원문 비교를 우선 제공합니다.</p>}
                    </div>

                    <details className="sources">
                      <summary>출처 {event.articles.length}개 비교하기</summary>
                      <div className="sourceList">
                        {event.articles.map((article, articleIndex) => (
                          <a href={article.link} target="_blank" rel="noreferrer" key={`${article.link}-${articleIndex}`}>
                            <span><b>{article.source}</b>{article.sourceType === "aggregated" && <em>집계 피드</em>}</span>
                            <span>{article.title}</span>
                            <small>{classifyEvidence(article)} · {relativeTime(article.publishedAt)} ↗</small>
                          </a>
                        ))}
                      </div>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="principles" id="principles">
        <div><div className="eyebrow">TRUST MODEL</div><h2>설명보다 먼저<br />근거를 설계합니다.</h2></div>
        <div className="principleGrid">
          <p><strong>사건과 기사를 구분합니다.</strong> 유사 보도는 하나의 사건으로 묶습니다.</p>
          <p><strong>보도의 성격을 구분합니다.</strong> 사실로 서술된 보도, 발언·주장, 불확실성이 포함된 표현을 별도 표시합니다.</p>
          <p><strong>맥락은 자동 탐지하되 생성하지 않습니다.</strong> 현재 버전은 검수한 개념 사전과 동의어 규칙만 사용합니다.</p>
          <p><strong>시간의 흐름을 보여줍니다.</strong> 같은 사건의 보도가 언제 어떻게 이어졌는지 짧은 타임라인으로 확인합니다.</p>
          <p><strong>모르면 비워둡니다.</strong> 관련 개념을 찾지 못하면 AI처럼 추측해 채우지 않습니다.</p>
          <p><strong>유료 AI는 아직 쓰지 않습니다.</strong> 비용과 정확성 이득이 확인될 때 별도 승인 후 도입합니다.</p>
        </div>
      </section>

      <footer>맥락 · 뉴스를 소비하는 대신 이해하기</footer>
    </main>
  );
}
