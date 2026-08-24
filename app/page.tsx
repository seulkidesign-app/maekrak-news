import { getEvents, type NewsEvent } from "@/lib/news";
import { detectContext } from "@/lib/context";
import { classifyEvidence, eventEvidenceSummary, eventTimeline } from "@/lib/signals";
import { categoryLabel, copy, localizedContext, type Language } from "@/lib/i18n";

export const revalidate = 900;

function relativeTime(date: string, lang: Language) {
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return lang === "ko" ? "시간 확인 중" : "Time unavailable";
  const mins = Math.max(1, Math.floor((Date.now() - time) / 60000));
  if (mins < 60) return lang === "ko" ? `${mins}분 전` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === "ko" ? `${hours}시간 전` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang === "ko" ? `${days}일 전` : `${days}d ago`;
}

function shortTime(date: string, lang: Language) {
  const parsed = new Date(date);
  if (!Number.isFinite(parsed.getTime())) return lang === "ko" ? "시간 확인 중" : "Time unavailable";
  return parsed.toLocaleString(lang === "ko" ? "ko-KR" : "en-US", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function coverageLabel(event: NewsEvent, lang: Language) {
  if (lang === "ko") {
    if (event.sourceCount >= 3) return "여러 출처";
    if (event.sourceCount === 2) return "2개 출처";
    return "단일 출처";
  }
  if (event.sourceCount >= 3) return "Multiple sources";
  if (event.sourceCount === 2) return "2 sources";
  return "Single source";
}

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const lang: Language = params.lang === "en" ? "en" : "ko";
  const t = copy[lang];
  const events = await getEvents();
  const updatedAt = new Date().toLocaleString(lang === "ko" ? "ko-KR" : "en-US", { timeZone: "Asia/Seoul" });

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top">{t.brand}</a>
        <div className="topActions">
          <nav><a href="#events">{t.eventsNav}</a><a href="#principles">{t.principlesNav}</a></nav>
          <div className="languageToggle" aria-label="Language">
            <a className={lang === "ko" ? "active" : ""} href="?lang=ko">한</a>
            <a className={lang === "en" ? "active" : ""} href="?lang=en">EN</a>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">NEWS, WITH CONTEXT</div>
        <h1>{t.heroTitle[0]}<br />{t.heroTitle[1]}</h1>
        <p>{t.heroBody}</p>
        <div className="status"><span className="dot" /> {t.updated} {updatedAt} · {t.cache}</div>
      </section>

      <section className="levels">
        <div><span>01</span><strong>{t.level1}</strong><p>{t.level1Body}</p></div>
        <div><span>02</span><strong>{t.level2}</strong><p>{t.level2Body}</p></div>
        <div><span>03</span><strong>{t.level3}</strong><p>{t.level3Body}</p></div>
      </section>

      <section className="section" id="events">
        <div className="sectionHead">
          <div><div className="eyebrow">TODAY</div><h2>{t.today}</h2></div>
          <p>{events.length} {lang === "ko" ? `개 사건 · ${t.eventUnit}` : `events · ${t.eventUnit}`}</p>
        </div>

        {events.length === 0 ? (
          <div className="empty">{lang === "ko" ? "현재 피드를 불러오지 못했습니다. 잠시 뒤 다시 확인해 주세요." : "The feeds could not be loaded right now. Please try again shortly."}</div>
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
                      <span>{categoryLabel(event.category, lang)}</span><span>{coverageLabel(event, lang)}</span><span>{relativeTime(event.publishedAt, lang)}</span>
                    </div>
                    <h3>{event.title}</h3>
                    {lang === "en" && <p className="sourceLanguageNote">{t.sourceLanguage}</p>}

                    <div className="quickRead">
                      <div className="boxLabel">{t.quick}</div>
                      <p>{event.summary ? `${event.summary.slice(0, 240)}${event.summary.length > 240 ? "…" : ""}` : t.quickEmpty}</p>
                    </div>

                    <div className="contextSection">
                      <div className="sectionRow"><div className="boxLabel">{t.understand}</div><span>{contexts.length ? `${contexts.length}${t.concepts}` : t.noConcept}</span></div>
                      {contexts.length > 0 ? (
                        <>
                          <div className="glossaryStrip" aria-label={t.glossary}>
                            <span className="glossaryLabel">{t.glossary}</span>
                            {contexts.map((info) => {
                              const localized = localizedContext(info, lang);
                              return <span className="glossaryChip" key={`chip-${info.id}`}><b>{localized.term}</b><em>{localized.simple}</em></span>;
                            })}
                          </div>
                          <div className="conceptChips">
                            {contexts.map((info) => {
                              const localized = localizedContext(info, lang);
                              return (
                                <details className="concept" key={info.id}>
                                  <summary><b>{localized.term}</b><span>{localized.kind}</span></summary>
                                  <div className="depth depthFour">
                                    <div><small>{t.meaning}</small><p>{localized.simple}</p></div>
                                    <div><small>{t.why}</small><p>{localized.context}</p></div>
                                    <div className="historyCell"><small>{t.history}</small><p>{localized.history}</p></div>
                                    <div><small>{t.deeper}</small><p>{localized.deep}</p></div>
                                  </div>
                                  <a className="referenceLink" href={info.referenceUrl} target="_blank" rel="noreferrer">{t.source} · {info.referenceLabel} ↗</a>
                                </details>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <p className="pending">{t.pending}</p>
                      )}
                    </div>

                    <details className="moreContext">
                      <summary>{t.more}</summary>
                      <div className="evidenceBox">
                        <div className="sectionRow"><div className="boxLabel">{t.evidence}</div><span>{t.signal}</span></div>
                        <div className="evidencePills">
                          <span>{t.fact} {evidence["보도된 사실"]}</span>
                          <span>{t.claim} {evidence["주장·발언"]}</span>
                          <span>{t.verify} {evidence["추가 확인 필요"]}</span>
                        </div>
                      </div>

                      {timeline.length > 1 && (
                        <div className="timelineSection">
                          <div className="boxLabel">{t.timeline}</div>
                          <ol className="timeline">
                            {timeline.map((article, timelineIndex) => (
                              <li key={`${article.link}-${timelineIndex}`}>
                                <time>{shortTime(article.publishedAt, lang)}</time>
                                <div><b>{article.source}</b><span className="evidenceTag">{classifyEvidence(article)}</span><p>{article.title}</p></div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      <div className="sourcesBlock">
                        <div className="boxLabel">{t.originals}</div>
                        <div className="sourceList">
                          {event.articles.map((article, articleIndex) => (
                            <a href={article.link} target="_blank" rel="noreferrer" key={`${article.link}-${articleIndex}`}>
                              <span><b>{article.source}</b>{article.sourceType === "aggregated" && <em>{t.aggregated}</em>}</span>
                              <span>{article.title}</span>
                              <small>{relativeTime(article.publishedAt, lang)} ↗</small>
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
        <div><div className="eyebrow">TRUST MODEL</div><h2>{t.trustTitle[0]}<br />{t.trustTitle[1]}</h2></div>
        <div className="principleGrid">
          {lang === "ko" ? (
            <>
              <p><strong>같은 사건을 묶습니다.</strong> 비슷한 보도를 반복해서 보여주지 않습니다.</p>
              <p><strong>맥락을 먼저 보여줍니다.</strong> 어려운 용어와 역사적 배경을 기사 옆에서 바로 확인합니다.</p>
              <p><strong>사실과 발언을 구분합니다.</strong> 단, 현재 분류는 문장 표현 기반 참고 신호입니다.</p>
              <p><strong>출처를 바로 열 수 있습니다.</strong> 요약과 배경자료 모두 원문으로 돌아갈 수 있습니다.</p>
              <p><strong>모르면 비워둡니다.</strong> 확실하지 않은 배경을 그럴듯하게 생성하지 않습니다.</p>
              <p><strong>언어를 바꿔도 근거는 같습니다.</strong> 한·영 설명은 같은 배경자료를 기준으로 제공합니다.</p>
            </>
          ) : (
            <>
              <p><strong>We group the same event.</strong> Similar reports are not repeated as separate stories.</p>
              <p><strong>Context comes first.</strong> Difficult terms and historical background sit next to the story.</p>
              <p><strong>Statements are separated from factual wording.</strong> The current classification is a language-based reference signal, not a fact-check verdict.</p>
              <p><strong>Sources stay one click away.</strong> Both reporting and background references can be opened directly.</p>
              <p><strong>Unknowns stay unknown.</strong> We do not generate plausible-sounding background when the link is uncertain.</p>
              <p><strong>Evidence stays consistent across languages.</strong> Korean and English explanations point back to the same background sources.</p>
            </>
          )}
        </div>
      </section>

      <footer>{t.footer}</footer>
    </main>
  );
}
