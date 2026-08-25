import {
  getBriefing,
  getDisplayArticle,
  type BriefWatchCode,
  type BriefWhyCode,
  type NewsCategory,
  type NewsEvent,
  type SourceHealth,
} from "@/lib/news";
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

function whyText(code: BriefWhyCode, lang: Language) {
  const ko: Record<BriefWhyCode, string> = {
    security: "전쟁·안보·외교 관계에 영향을 줄 수 있는 사건이라 이후 대응에 따라 국제 정세가 달라질 수 있습니다.",
    politics: "정책과 권력관계, 향후 의사결정에 영향을 줄 수 있어 후속 정치 일정과 공식 결정을 볼 필요가 있습니다.",
    economy: "금리·물가·환율·기업 활동처럼 생활과 시장에 연결되는 경제 변수에 영향을 줄 수 있습니다.",
    disaster: "인명·안전·교통·생활에 직접 영향을 줄 수 있어 피해 규모와 공식 대응을 계속 확인해야 합니다.",
    technology: "산업 경쟁과 기업 전략, 규제 또는 기술 생태계 변화로 이어질 수 있는 이슈입니다.",
    society: "교육·의료·노동·치안·주거처럼 일상과 제도에 직접 연결될 수 있는 사회 이슈입니다.",
    "broad-impact": "여러 매체가 다루고 있거나 영향 범위가 넓어 오늘의 흐름을 이해하는 데 필요한 사건으로 분류됐습니다.",
  };
  const en: Record<BriefWhyCode, string> = {
    security: "It may affect security, diplomacy or an ongoing conflict, so the next official responses could change the wider situation.",
    politics: "It may shape policy, political power or upcoming decisions, making the next formal steps important to watch.",
    economy: "It can affect economic variables tied to daily life and markets, such as rates, prices, currencies or business activity.",
    disaster: "It may directly affect safety, transport and daily life, so official damage and response updates matter.",
    technology: "It may influence industry competition, company strategy, regulation or the broader technology ecosystem.",
    society: "It can affect everyday institutions such as healthcare, education, labor, policing or housing.",
    "broad-impact": "It is being treated as part of today's core flow because of its reach, coverage or potential impact.",
  };
  return (lang === "ko" ? ko : en)[code];
}

function watchText(code: BriefWatchCode, lang: Language) {
  const ko: Record<BriefWatchCode, string> = {
    "single-source": "현재는 단일 출처 중심입니다. 다른 매체나 공식 확인이 추가되는지 확인하세요.",
    uncertain: "추정·가능성·미확인 표현이 포함돼 있습니다. 후속 확인 전까지 단정해서 읽지 않는 편이 좋습니다.",
    "claim-heavy": "당사자 발언이나 주장이 포함돼 있습니다. 반대 측 설명과 공식 자료가 나오는지 확인하세요.",
    "multi-source": "여러 출처가 보도 중입니다. 다음 단계는 공식 결정·수치·현장 확인이 추가되는지 보는 것입니다.",
    "follow-up": "현재 확인된 보도 이후 공식 발표나 추가 보도가 이어지는지 확인할 필요가 있습니다.",
  };
  const en: Record<BriefWatchCode, string> = {
    "single-source": "Coverage currently relies mainly on one source. Watch for confirmation from other outlets or official records.",
    uncertain: "The reporting contains uncertainty or estimates. Avoid treating it as settled until follow-up confirmation appears.",
    "claim-heavy": "The story includes statements or claims. Watch for opposing accounts and official documentation.",
    "multi-source": "Multiple sources are reporting it. The next useful signal is an official decision, verified figure or on-the-ground confirmation.",
    "follow-up": "Watch for a formal announcement or additional reporting that confirms what happens next.",
  };
  return (lang === "ko" ? ko : en)[code];
}

function healthStatusText(source: SourceHealth, lang: Language) {
  if (source.status === "ok") return lang === "ko" ? `${source.itemCount}건 수집` : `${source.itemCount} items`;
  if (source.status === "http-error") return lang === "ko" ? "응답 오류" : "HTTP error";
  if (source.status === "empty") return lang === "ko" ? "수집 결과 없음" : "No items returned";
  return lang === "ko" ? "수집 실패" : "Fetch failed";
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
            <small>{healthStatusText(source, lang)}</small>
          </div>
        ))}
      </div>
      {failed.length > 0 && (
        <p className="healthWarning">
          {lang === "ko"
            ? `일부 소스(${failed.map((source) => source.name).join(", ")}) 수집에 문제가 있어 오늘의 커버리지가 평소보다 낮을 수 있습니다.`
            : `Some sources (${failed.map((source) => source.name).join(", ")}) have collection issues, so today's coverage may be incomplete.`}
        </p>
      )}
    </details>
  );
}

const coverageOrder: NewsCategory[] = ["국내", "세계", "정치", "경제", "사회", "기술", "재난"];

function CoverageBoard({ coverage, lang }: { coverage: Record<NewsCategory, number>; lang: Language }) {
  return (
    <section className="coverageBoard" aria-label={lang === "ko" ? "오늘 뉴스 커버리지" : "Today's coverage"}>
      <div className="coverageIntro">
        <div className="eyebrow">COVERAGE CHECK</div>
        <strong>{lang === "ko" ? "오늘 어떤 영역을 잡았나" : "What today's briefing covers"}</strong>
        <p>{lang === "ko" ? "수집된 사건 기준입니다. 세상의 모든 뉴스를 다 담았다는 의미는 아닙니다." : "Based on collected events. This does not mean every news story in the world is covered."}</p>
      </div>
      <div className="coverageGrid">
        {coverageOrder.map((category) => (
          <div className={`coverageItem ${coverage[category] === 0 ? "coverageMissing" : ""}`} key={category}>
            <span>{eventCategoryLabel(category, lang)}</span>
            <b>{coverage[category]}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function EventCard({ event, index, lang, priority }: { event: NewsEvent; index: number; lang: Language; priority: boolean }) {
  const t = copy[lang];
  const contexts = detectContext(event);
  const evidence = eventEvidenceSummary(event);
  const timeline = eventTimeline(event);
  const displayArticle = getDisplayArticle(event, lang);
  const displayText = displayArticle.description || displayArticle.title || event.summary;
  const languageMismatch = lang === "ko" ? !/[가-힣]/.test(displayArticle.title) : /[가-힣]/.test(displayArticle.title);

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
        <h3>{displayArticle.title || event.title}</h3>
        {languageMismatch && <p className="sourceLanguageNote">{t.sourceLanguage}</p>}

        <div className="quickRead briefingThree">
          <div className="briefLine">
            <span>{lang === "ko" ? "무슨 일" : "What happened"}</span>
            <p>{displayText ? `${displayText.slice(0, 300)}${displayText.length > 300 ? "…" : ""}` : t.quickEmpty}</p>
            <small>{lang === "ko" ? `대표 보도 발췌 · ${displayArticle.source}` : `Excerpt from representative report · ${displayArticle.source}`}</small>
          </div>
          <div className="briefLine">
            <span>{lang === "ko" ? "왜 중요" : "Why it matters"}</span>
            <p>{whyText(event.briefWhy, lang)}</p>
          </div>
          <div className="briefLine">
            <span>{lang === "ko" ? "다음 확인" : "What to watch"}</span>
            <p>{watchText(event.briefWatch, lang)}</p>
          </div>
        </div>

        {event.whySelected.length > 0 && (
          <div className="selectionReason">
            <span>{lang === "ko" ? "선정 근거" : "Selection basis"}</span>
            <div>
              {event.whySelected.map((reason) => <em key={reason}>{lang === "ko" ? reason : translateReason(reason)}</em>)}
            </div>
            <small>{lang === "ko" ? `규칙 기반 중요도 ${event.importanceScore.toFixed(1)}` : `Rule-based importance ${event.importanceScore.toFixed(1)}`}</small>
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
  const eventById = new Map(events.map((event) => [event.id, event]));
  const priorityEvents = briefing.priorityEventIds.map((id) => eventById.get(id)).filter((event): event is NewsEvent => Boolean(event));
  const priorityIds = new Set(briefing.priorityEventIds);
  const moreEvents = events.filter((event) => !priorityIds.has(event.id));
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
        <div><span>01</span><strong>{lang === "ko" ? "오늘 핵심" : "Must know"}</strong><p>{lang === "ko" ? "국내·세계·경제가 한쪽으로 쏠리지 않게 먼저 볼 사건." : "Priority events balanced across Korea, world and economy."}</p></div>
        <div><span>02</span><strong>{t.level2}</strong><p>{t.level2Body}</p></div>
        <div><span>03</span><strong>{t.level3}</strong><p>{t.level3Body}</p></div>
      </section>

      <CoverageBoard coverage={briefing.categoryCoverage} lang={lang} />

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
            {moreEvents.map((event, index) => <EventCard key={event.id} event={event} index={index + priorityEvents.length} lang={lang} priority={false} />)}
          </div>
        </section>
      )}

      <section className="principles" id="principles">
        <div><div className="eyebrow">TRUST MODEL</div><h2>{t.trustTitle[0]}<br />{t.trustTitle[1]}</h2></div>
        <div className="principleGrid">
          {lang === "ko" ? (
            <>
              <p><strong>빠진 영역을 숨기지 않습니다.</strong> 수집 소스와 카테고리 커버리지를 함께 보여줍니다.</p>
              <p><strong>같은 사건을 묶되 과하게 합치지 않습니다.</strong> 제목뿐 아니라 핵심 대상·행동·시간 간격을 함께 봅니다.</p>
              <p><strong>30초 이해를 세 부분으로 나눕니다.</strong> 대표 보도 발췌, 영향 설명, 다음 확인 포인트를 구분합니다.</p>
              <p><strong>사실 검증처럼 보이는 라벨을 쓰지 않습니다.</strong> 기사 문장 표현을 일반 보도·주장·추정으로만 분류합니다.</p>
              <p><strong>맥락을 먼저 보여줍니다.</strong> 어려운 용어와 역사적 배경을 기사 옆에서 바로 확인합니다.</p>
              <p><strong>모르면 비워둡니다.</strong> 확실하지 않은 배경을 그럴듯하게 생성하지 않습니다.</p>
            </>
          ) : (
            <>
              <p><strong>Coverage gaps stay visible.</strong> Source health and category coverage are shown alongside the briefing.</p>
              <p><strong>Events are grouped conservatively.</strong> Headlines, entities, actions and time distance are considered together.</p>
              <p><strong>The 30-second read has three layers.</strong> A source excerpt, why it matters, and what to verify next are kept separate.</p>
              <p><strong>We avoid fact-check-like labels.</strong> Article language is classified only as general reporting, claims or uncertainty.</p>
              <p><strong>Context comes first.</strong> Difficult terms and historical background sit next to the story.</p>
              <p><strong>Unknowns stay unknown.</strong> We do not fabricate plausible background when a link is uncertain.</p>
            </>
          )}
        </div>
      </section>

      <footer>{t.footer}</footer>
    </main>
  );
}
