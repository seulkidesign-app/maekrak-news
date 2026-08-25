import { getBriefing, type NewsEvent, type SourceHealth } from "@/lib/news";
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

function eventCategoryLabel(category: string, lang: Language) {
  if (lang === "en" && category === "재난") return "Disaster";
  return categoryLabel(category, lang);
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

function localizedSignal(label: ReturnType<typeof classifyEvidence>, lang: Language) {
  if (lang === "ko") return label;
  const map = {
    "일반 보도": "General reporting",
    "발언·주장": "Statement / claim",
    "전망·추정": "Forecast / estimate",
  } as const;
  return map[label];
}

function SourceStatus({ health, lang }: { health: SourceHealth[]; lang: Language }) {
  const failed = health.filter((source) => !source.ok);
  return (
    <details className={`sourceHealth ${failed.length ? "hasWarning" : ""}`}>
      <summary>
        <span>{lang === "ko" ? "뉴스 수집 상태" : "News source status"}</span>
        <b>{health.length - failed.length}/{health.length} {lang === "ko" ? "정상" : "healthy"}</b>
      </summary>
      <div className="sourceHealthGrid">
        {health.map((source) => (
          <div className="sourceHealthItem" key={source.name}>
            <span className={`healthDot ${source.ok ? "ok" : "fail"}`} />
            <b>{source.name}</b>
            <small>{source.ok ? `${source.itemCount} ${lang === "ko" ? "건 수집" : "items"}` : (lang === "ko" ? "수집 지연" : "delayed")}</small>
          </div>
        ))}
      </div>
      {failed.length > 0 && (
        <p className="healthWarning">
          {lang === "ko"
            ? `일부 소스(${failed.map((source) => source.name).join(", ")}) 수집이 지연되고 있어 오늘의 뉴스 커버리지가 평소보다 낮을 수 있습니다.`
            : `Some sources (${failed.map((source) => source.name).join(", ")}) are delayed, so today's coverage may be incomplete.`}
        </p>
      )}
    </details>
  );
}

function EventCard({ event, index, lang, priority }: { event: NewsEvent; index: number; lang: Language; priority: boolean }) {
  const t = copy[lang];
  const contexts = detectContext(event);
  const evidence = eventEvidenceSummary(event);
  const timeline = eventTimeline(event);

  return (
    <article className={`eventCard ${priority ? "priorityEvent" : ""}`}>
      <div className="eventNumber">{String(index + 1).padStart(2, "0")}</div>
      <div className="eventBody">
        <div className="meta">
          {priority && <span className="priorityMark">{lang === "ko" ? "오늘 핵심" : "Must know"}</span>}
          <span>{eventCategoryLabel(event.category, lang)}</span>
          <span>{coverageLabel(event, lang)}</span>
          <span>{relativeTime(event.publishedAt, lang)}</span>
        </div>
        <h3>{event.title}</h3>
        {lang === "en" && <p className="sourceLanguageNote">{t.sourceLanguage}</p>}

        <div className="quickRead">
          <div className="boxLabel">{t.quick}</div>
          <p>{event.summary ? `${event.summary.slice(0, 280)}${event.summary.length > 280 ? "…" : ""}` : t.quickEmpty}</p>
        </div>

        {event.whySelected.length > 0 && (
          <div className="selectionReason">
            <span>{lang === "ko" ? "왜 오늘 봐야 하나" : "Why it made today's briefing"}</span>
            <div>
              {event.whySelected.map((reason) => <em key={reason}>{lang === "ko" ? reason : translateReason(reason)}</em>)}
            </div>
          </div>
        )}

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
            <div className="sectionRow">
              <div className="boxLabel">{lang === "ko" ? "보도 표현" : "Reporting language"}</div>
              <span>{lang === "ko" ? "사실 검증 결과가 아닌 표현 기반 분류" : "Language-based classification, not a fact-check verdict"}</span>
            </div>
            <div className="evidencePills">
              <span>{localizedSignal("일반 보도", lang)} {evidence["일반 보도"]}</span>
              <span>{localizedSignal("발언·주장", lang)} {evidence["발언·주장"]}</span>
              <span>{localizedSignal("전망·추정", lang)} {evidence["전망·추정"]}</span>
            </div>
          </div>

          {timeline.length > 1 && (
            <div className="timelineSection">
              <div className="boxLabel">{lang === "ko" ? "보도 타임라인" : "Reporting timeline"}</div>
              <p className="timelineNote">{lang === "ko" ? "기사 발행 순서입니다. 사건 자체의 발생 시각과는 다를 수 있습니다." : "This is the publication order of reports and may differ from the event's actual timeline."}</p>
              <ol className="timeline">
                {timeline.map((article, timelineIndex) => (
                  <li key={`${article.link}-${timelineIndex}`}>
                    <time>{shortTime(article.publishedAt, lang)}</time>
                    <div><b>{article.source}</b><span className="evidenceTag">{localizedSignal(classifyEvidence(article), lang)}</span><p>{article.title}</p></div>
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
}

function translateReason(reason: string) {
  const map: Record<string, string> = {
    "여러 출처에서 동시 보도": "Reported by multiple sources",
    "통신사 보도 포함": "Includes wire-service reporting",
    "서로 다른 유형의 출처": "Covered by different source types",
    "정책·안보·재난 등 영향도가 큰 주제": "High-impact policy, security or disaster topic",
    "최신성과 보도량을 함께 반영": "Selected for recency and reporting volume",
  };
  return map[reason] ?? reason;
}

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const lang: Language = params.lang === "en" ? "en" : "ko";
  const t = copy[lang];
  const briefing = await getBriefing();
  const events = briefing.events;
  const priorityEvents = events.slice(0, 5);
  const moreEvents = events.slice(5);
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
        <div className="status"><span className={`dot ${briefing.healthySources < briefing.totalSources ? "warningDot" : ""}`} /> {t.updated} {updatedAt} · {t.cache}</div>
        <SourceStatus health={briefing.sourceHealth} lang={lang} />
      </section>

      <section className="levels">
        <div><span>01</span><strong>{lang === "ko" ? "오늘 핵심" : "Must know"}</strong><p>{lang === "ko" ? "중요도와 커버리지를 기준으로 먼저 볼 사건." : "Priority events selected by impact and coverage."}</p></div>
        <div><span>02</span><strong>{t.level2}</strong><p>{t.level2Body}</p></div>
        <div><span>03</span><strong>{t.level3}</strong><p>{t.level3Body}</p></div>
      </section>

      <section className="section" id="events">
        <div className="sectionHead">
          <div><div className="eyebrow">MUST KNOW</div><h2>{lang === "ko" ? "오늘 반드시 알아둘 5가지" : "5 things to know today"}</h2></div>
          <p>{lang === "ko" ? `${briefing.healthySources}/${briefing.totalSources}개 소스 수집 기준` : `Based on ${briefing.healthySources}/${briefing.totalSources} healthy sources`}</p>
        </div>

        {priorityEvents.length === 0 ? (
          <div className="empty">{lang === "ko" ? "현재 피드를 불러오지 못했습니다. 잠시 뒤 다시 확인해 주세요." : "The feeds could not be loaded right now. Please try again shortly."}</div>
        ) : (
          <div className="eventList">
            {priorityEvents.map((event, index) => <EventCard key={event.id} event={event} index={index} lang={lang} priority />)}
          </div>
        )}
      </section>

      {moreEvents.length > 0 && (
        <section className="section secondarySection">
          <div className="sectionHead">
            <div><div className="eyebrow">MORE TODAY</div><h2>{lang === "ko" ? "더 알아두면 좋은 사건" : "More events worth knowing"}</h2></div>
            <p>{lang === "ko" ? `${moreEvents.length}개 사건` : `${moreEvents.length} events`}</p>
          </div>
          <div className="eventList compactEvents">
            {moreEvents.map((event, index) => <EventCard key={event.id} event={event} index={index + 5} lang={lang} priority={false} />)}
          </div>
        </section>
      )}

      <section className="principles" id="principles">
        <div><div className="eyebrow">TRUST MODEL</div><h2>{t.trustTitle[0]}<br />{t.trustTitle[1]}</h2></div>
        <div className="principleGrid">
          {lang === "ko" ? (
            <>
              <p><strong>수집 실패를 숨기지 않습니다.</strong> 핵심 소스가 지연되면 커버리지가 낮을 수 있다고 표시합니다.</p>
              <p><strong>중요도와 보도량을 구분합니다.</strong> 여러 출처, 통신사, 영향도, 최신성을 함께 반영해 순서를 정합니다.</p>
              <p><strong>같은 사건을 최대한 묶습니다.</strong> 제목 유사도뿐 아니라 한·영 핵심 엔티티 별칭도 함께 사용합니다.</p>
              <p><strong>표현 분류는 사실검증이 아닙니다.</strong> 일반 보도·발언·전망을 구분하되 진실 여부를 단정하지 않습니다.</p>
              <p><strong>맥락을 먼저 보여줍니다.</strong> 어려운 용어와 역사적 배경을 기사 옆에서 바로 확인합니다.</p>
              <p><strong>모르면 비워둡니다.</strong> 확실하지 않은 배경을 그럴듯하게 생성하지 않습니다.</p>
            </>
          ) : (
            <>
              <p><strong>Source failures are visible.</strong> We warn when delayed sources may reduce coverage.</p>
              <p><strong>Importance is not the same as volume.</strong> Ranking combines source diversity, wire coverage, impact and recency.</p>
              <p><strong>We try to group the same event.</strong> Clustering uses title similarity plus Korean-English entity aliases.</p>
              <p><strong>Language signals are not fact checks.</strong> General reporting, statements and forecasts are separated without declaring truth.</p>
              <p><strong>Context comes first.</strong> Difficult terms and historical background sit next to the story.</p>
              <p><strong>Unknowns stay unknown.</strong> We do not invent plausible-sounding context when confidence is low.</p>
            </>
          )}
        </div>
      </section>

      <footer>{t.footer}</footer>
    </main>
  );
}
