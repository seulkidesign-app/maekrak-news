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
  return parsed.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function coverageLabel(event: NewsEvent) {
  if (event.sourceCount >= 3) return "여러 출처";
  if (event.sourceCount === 2) return "2개 출처";
  return "단일 출처";
}

export default async function Home() {
  const events = await getEvents();
  const updatedAt = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top">맥락</a>
        <nav><a href="#events">오늘의 사건</a><a href="#principles">원칙</a></nav>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">NEWS, WITH CONTEXT</div>
        <h1>무슨 일이 있었는지보다,<br />왜 중요한지까지.</h1>
        <p>같은 사건을 묶고, 이해에 필요한 배경만 먼저 보여줍니다. 더 알고 싶을 때 타임라인과 원문까지 내려가세요.</p>
        <div className="status"><span className="dot" /> 최근 갱신 {updatedAt} · 최대 15분 캐시</div>
      </section>

      <section className="levels">
        <div><span>01</span><strong>30초</strong><p>지금 무슨 일이 일어났는지.</p></div>
        <div><span>02</span><strong>맥락</strong><p>왜 이 사건을 이해해야 하는지.</p></div>
        <div><span>03</span><strong>근거</strong><p>어디서 나온 정보인지 직접 확인.</p></div>
      </section>

      <section className="section" id="events">
        <div className="sectionHead">
          <div><div className="eyebrow">TODAY</div><h2>오늘 이해해둘 사건</h2></div>
          <p>{events.length}개 사건 · 기사 수가 아니라 사건 단위</p>
        </div>

        {events.length === 0 ? (
          <div className="empty">현재 피드를 불러오지 못했습니다. 잠시 뒤 다시 확인해 주세요.</div>
        ) : (
          <div className="eventList">
            {events.map((event, index) => {
              const contexts = detectContext(event);
              const evidence = eventEvidenceSummary(event);
              const timeline = eventTimeline(event);
              return (
                <article className="eventCard" key={event.id}>
                  <div className="eventNumber">{String(index + 1).padStart(2, "0")}</div>
                  <div className="eventBody">
                    <div className="meta">
                      <span>{event.category}</span><span>{coverageLabel(event)}</span><span>{relativeTime(event.publishedAt)}</span>
                    </div>
                    <h3>{event.title}</h3>

                    <div className="quickRead">
                      <div className="boxLabel">30초 이해</div>
                      <p>{event.summary ? `${event.summary.slice(0, 240)}${event.summary.length > 240 ? "…" : ""}` : "요약 정보가 충분하지 않아 원문 확인이 필요합니다."}</p>
                    </div>

                    <div className="contextSection">
                      <div className="sectionRow"><div className="boxLabel">이 사건을 이해하려면</div><span>{contexts.length ? `${contexts.length}개 핵심 개념` : "연결된 개념 없음"}</span></div>
                      {contexts.length > 0 ? (
                        <div className="conceptChips">
                          {contexts.map((info) => (
                            <details className="concept" key={info.id}>
                              <summary><b>{info.term}</b><span>{info.kind}</span></summary>
                              <div className="depth">
                                <div><small>쉽게</small><p>{info.simple}</p></div>
                                <div><small>이 기사에서</small><p>{info.context}</p></div>
                                <div><small>더 깊게</small><p>{info.deep}</p></div>
                              </div>
                              <a className="referenceLink" href={info.referenceUrl} target="_blank" rel="noreferrer">배경자료 · {info.referenceLabel} ↗</a>
                            </details>
                          ))}
                        </div>
                      ) : (
                        <p className="pending">검수된 배경 개념을 찾지 못했습니다. 추측해서 채우지 않고 원문을 우선 제공합니다.</p>
                      )}
                    </div>

                    <details className="moreContext">
                      <summary>보도 흐름과 근거 더 보기</summary>
                      <div className="evidenceBox">
                        <div className="sectionRow"><div className="boxLabel">보도 성격</div><span>표현 기반 참고 신호</span></div>
                        <div className="evidencePills">
                          <span>사실 서술 {evidence["보도된 사실"]}</span>
                          <span>주장·발언 {evidence["주장·발언"]}</span>
                          <span>추가 확인 {evidence["추가 확인 필요"]}</span>
                        </div>
                      </div>

                      {timeline.length > 1 && (
                        <div className="timelineSection">
                          <div className="boxLabel">이 사건의 흐름</div>
                          <ol className="timeline">
                            {timeline.map((article, timelineIndex) => (
                              <li key={`${article.link}-${timelineIndex}`}>
                                <time>{shortTime(article.publishedAt)}</time>
                                <div><b>{article.source}</b><span className="evidenceTag">{classifyEvidence(article)}</span><p>{article.title}</p></div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      <div className="sourcesBlock">
                        <div className="boxLabel">원문 비교</div>
                        <div className="sourceList">
                          {event.articles.map((article, articleIndex) => (
                            <a href={article.link} target="_blank" rel="noreferrer" key={`${article.link}-${articleIndex}`}>
                              <span><b>{article.source}</b>{article.sourceType === "aggregated" && <em>집계 피드</em>}</span>
                              <span>{article.title}</span>
                              <small>{relativeTime(article.publishedAt)} ↗</small>
                            </a>
                          ))}
                        </div>
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
        <div><div className="eyebrow">TRUST MODEL</div><h2>쉽게 보여주되,<br />근거는 숨기지 않습니다.</h2></div>
        <div className="principleGrid">
          <p><strong>같은 사건을 묶습니다.</strong> 비슷한 보도를 반복해서 보여주지 않습니다.</p>
          <p><strong>맥락을 먼저 보여줍니다.</strong> 사용자가 무엇을 모르는지 직접 찾아야 하는 부담을 줄입니다.</p>
          <p><strong>사실과 발언을 구분합니다.</strong> 단, 현재 분류는 문장 표현 기반 참고 신호입니다.</p>
          <p><strong>출처를 바로 열 수 있습니다.</strong> 요약과 배경자료 모두 원문으로 돌아갈 수 있습니다.</p>
          <p><strong>모르면 비워둡니다.</strong> 확실하지 않은 배경을 그럴듯하게 생성하지 않습니다.</p>
          <p><strong>무료 규칙 기반으로 시작합니다.</strong> 유료 AI는 비용 대비 품질 이득이 명확할 때만 도입합니다.</p>
        </div>
      </section>

      <footer>맥락 · 뉴스를 소비하는 대신 이해하기</footer>
    </main>
  );
}
