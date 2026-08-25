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
    security: "안보·외교·전쟁의 다음 대응과 연결될 수 있는 사건입니다. 당사국의 공식 조치가 이어지면 국제 정세와 시장에도 영향을 줄 수 있습니다.",
    politics: "정책과 권한 배분, 이후 정부 결정에 이어질 수 있는 사건입니다. 실제 제도 변화가 어디까지 확정되는지가 중요합니다.",
    economy: "금리·물가·환율·주가·기업 활동처럼 생활과 시장에 연결되는 변수에 영향을 줄 수 있습니다.",
    disaster: "인명·안전·교통·생활에 바로 영향을 줄 수 있습니다. 피해 규모와 공식 대응이 업데이트되는지 봐야 합니다.",
    technology: "산업 경쟁, 기업 전략, 규제 또는 기술 생태계 변화로 이어질 수 있는 이슈입니다.",
    society: "치안·교육·의료·노동·주거처럼 일상과 제도에 직접 연결될 수 있는 사회 이슈입니다.",
    "broad-impact": "오늘 여러 보도 흐름과 연결되거나 영향 범위가 넓어 전체 상황을 이해하는 데 필요한 사건입니다.",
  };
  const en: Record<BriefWhyCode, string> = {
    security: "It may shape the next security, diplomatic or military response and can spill into markets or wider geopolitics.",
    politics: "It may lead to policy or institutional change. The key question is what becomes a formal decision rather than political discussion.",
    economy: "It can affect variables tied to daily life and markets, including rates, prices, currencies, stocks or business activity.",
    disaster: "It can directly affect safety, transport and daily life. Watch for verified damage and official response updates.",
    technology: "It may influence industry competition, company strategy, regulation or the broader technology ecosystem.",
    society: "It can affect everyday institutions such as policing, healthcare, education, labor or housing.",
    "broad-impact": "It connects to several parts of today's news flow or has enough reach to matter beyond a single headline.",
  };
  return (lang === "ko" ? ko : en)[code];
}

function watchText(code: BriefWatchCode, lang: Language) {
  const ko: Record<BriefWatchCode, string> = {
    "single-source": "아직 한 매체 중심입니다. 다른 매체나 공식 기관이 같은 내용을 확인하는지 봐야 합니다.",
    uncertain: "추정·가능성·미확인 표현이 포함돼 있습니다. 후속 확인 전까지 확정된 사실처럼 읽지 않는 편이 좋습니다.",
    "claim-heavy": "당사자의 발언이나 주장이 섞여 있습니다. 반대 측 설명과 공식 자료가 나오는지 확인해야 합니다.",
    "multi-source": "여러 매체가 보도 중입니다. 이제 공식 결정·수치·현장 확인이 추가되는지 보면 됩니다.",
    "follow-up": "현재 보도 다음에 공식 발표나 추가 취재가 이어지는지 확인하면 됩니다.",
  };
  const en: Record<BriefWatchCode, string> = {
    "single-source": "Coverage still relies mainly on one outlet. Watch for confirmation from other reporting or official records.",
    uncertain: "The reporting contains uncertainty or estimates. Avoid treating it as settled until follow-up confirmation appears.",
    "claim-heavy": "The story includes statements or claims. Watch for opposing accounts and official documentation.",
    "multi-source": "Multiple outlets are covering it. The next useful signal is an official decision, verified figure or on-the-ground confirmation.",
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

function conciseExcerpt(event: NewsEvent, lang: Language) {
  const article = getDisplayArticle(event, lang);
  let text = article.description || article.title || event.summary;
  if (text.startsWith(article.title)) text = text.slice(article.title.length).replace(/^\s*[-:·]\s*/, "");
  return { article, text: text.trim() };
}

function EventCard({ event, index, lang, priority }: { event: NewsEvent; index: number; lang: Language; priority: boolean }) {
  const t = copy[lang];
  const contexts = detectContext(event);
  const evidence = eventEvidenceSummary(event);
  const timeline = eventTimeline(event);
  const { article: displayArticle, text: displayText } = conciseExcerpt(event, lang);
  const primaryContext = contexts[0] ? localizedContext(contexts[0], lang) : null;
  const why = primaryContext?.context ?? whyText(event.briefWhy, lang);

  return (
    <article className={`eventCard ${priority ? "priorityEvent" : ""}`}>
      <div className="eventNumber">{priority ? `${index + 1}/5` : String(index + 1).padStart(2, "0")}</div>
      <div className="eventBody">
        <div className="meta">
          {priority && <span className="priorityMark">{lang === "ko" ? "오늘 핵심" : "Must know"}</span>}
          <span>{eventCategoryLabel(event.category, lang)}</span>
          <span>{coverageLabel(event, lang)}</span>
          <span>{relativeTime(event.publishedAt, lang)}</span>
        </div>
        <h3>{displayArticle.title || event.title}</h3>

        <div className="quickRead briefingThree">
          <div className="briefLine">
            <span>{lang === "ko" ? "무슨 일" : "What happened"}</span>
            <p>{displayText ? `${displayText.slice(0, 270)}${displayText.length > 270 ? "…" : ""}` : t.quickEmpty}</p>
            <small>{lang === "ko" ? `대표 보도 발췌 · ${displayArticle.source}` : `Excerpt from representative report · ${displayArticle.source}`}</small>
          </div>
          <div className="briefLine">
            <span>{lang === "ko" ? "왜 중요" : "Why it matters"}</span>
            <p>{why}</p>
          </div>
          <div className="briefLine">
            <span>{lang === "ko" ? "앞으로" : "What to watch"}</span>
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
    "여러 매체에서 동시 보도": "Reported by multiple outlets",
    "통신사 보도 포함": "Includes wire-service reporting",
    "서로 다른 유형의 출처": "Covered by different source types",
    "정책·안보·재난 등 영향도가 큰 주제": "High-impact policy, security or disaster topic",
    "제도·생활에 이어질 구조적 이슈": "Structural issue with policy or daily-life impact",
    "최신성과 보도량을 함께 반영": "Selected for recency and reporting volume",
  };
  return map[reason] ?? reason;
}

function hasHeadlineForLanguage(event: NewsEvent, lang: Language) {
  const title = getDisplayArticle(event, lang).title;
  return lang === "ko" ? /[가-힣]/.test(title) : !/[가-힣]/.test(title);
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

  const readyEvents = lang === "ko" ? events.filter((event) => hasHeadlineForLanguage(event, lang)) : events;
  const languagePending = lang === "ko" ? events.filter((event) => !hasHeadlineForLanguage(event, lang)) : [];
  const readyById = new Map(readyEvents.map((event) => [event.id, event]));
  const priorityEvents: NewsEvent[] = [];

  for (const id of briefing.priorityEventIds) {
    const event = readyById.get(id);
    if (event && priorityEvents.length < 5) priorityEvents.push(event);
  }
  for (const event of readyEvents) {
    if (priorityEvents.length >= 5) break;
    if (!priorityEvents.some((item) => item.id === event.id)) priorityEvents.push(event);
  }

  const priorityIds = new Set(priorityEvents.map((event) => event.id));
  const moreEvents = readyEvents.filter((event) => !priorityIds.has(event.id));
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
        <div className="briefingPromise">
          <div><b>{lang === "ko" ? "약 10분 브리핑" : "About a 10-minute briefing"}</b><span>{lang === "ko" ? "오늘은 이 5개부터 보면 됩니다." : "Start with these five stories today."}</span></div>
          <a href="#events">{lang === "ko" ? "5개 바로 보기 ↓" : "Read the five ↓"}</a>
        </div>
        <div className="status"><span className={`dot ${briefing.healthySources < briefing.totalSources ? "warningDot" : ""}`} /> {t.updated} {updatedAt} · {t.cache}</div>
        <SourceStatus health={briefing.sourceHealth} lang={lang} />
      </section>

      <section className="section mustKnowSection" id="events">
        <div className="sectionHead">
          <div><div className="eyebrow">MUST KNOW · 5</div><h2>{lang === "ko" ? "오늘은 이 5개부터 보면 됩니다" : "Start with these five today"}</h2></div>
          <p>{lang === "ko" ? "한국·세계·경제를 섞어 큰 흐름부터" : "A balanced view across Korea, world and economy"}</p>
        </div>
        <p className="sectionLead">{lang === "ko" ? "다섯 개를 먼저 읽고, 더 필요하면 아래 뉴스를 이어보세요. 중요도는 보도량만이 아니라 출처·영향도·최신성·영역 균형을 함께 봅니다." : "Read these five first, then continue only if you need more. Priority considers sources, impact, recency and topic balance—not article volume alone."}</p>

        {priorityEvents.length === 0 ? (
          <div className="empty">{lang === "ko" ? "현재 피드를 불러오지 못했습니다. 잠시 뒤 다시 확인해 주세요." : "The feeds could not be loaded right now. Please try again shortly."}</div>
        ) : (
          <div className="eventList">
            {priorityEvents.map((event, index) => <EventCard key={event.id} event={event} index={index} lang={lang} priority />)}
          </div>
        )}
      </section>

      <CoverageBoard coverage={briefing.categoryCoverage} lang={lang} />

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

      {lang === "ko" && languagePending.length > 0 && (
        <section className="section sourceOnlySection">
          <details className="sourceOnlyDetails">
            <summary>한국어 대응 보도를 아직 찾지 못한 해외 원문 {languagePending.length}건</summary>
            <p>커버리지에서 완전히 버리지는 않되, 한국어 브리핑 본문에는 섞지 않았습니다.</p>
            <div className="sourceOnlyList">
              {languagePending.slice(0, 12).map((event) => {
                const article = getDisplayArticle(event, "en");
                return <a href={article.link} target="_blank" rel="noreferrer" key={event.id}><b>{article.source}</b><span>{article.title}</span><small>{relativeTime(article.publishedAt, "ko")} ↗</small></a>;
              })}
            </div>
          </details>
        </section>
      )}

      <section className="principles" id="principles">
        <div><div className="eyebrow">TRUST MODEL</div><h2>{t.trustTitle[0]}<br />{t.trustTitle[1]}</h2></div>
        <div className="principleGrid">
          {lang === "ko" ? (
            <>
              <p><strong>한국어 화면에는 한국어 보도를 우선합니다.</strong> 영어 원문만 확인된 사건은 별도 영역으로 분리합니다.</p>
              <p><strong>빠진 영역을 숨기지 않습니다.</strong> 수집 소스와 카테고리 커버리지를 함께 보여줍니다.</p>
              <p><strong>같은 사건을 보수적으로 묶습니다.</strong> 제목뿐 아니라 대상·행동·시간 간격이 함께 맞아야 합니다.</p>
              <p><strong>30초 이해를 세 부분으로 나눕니다.</strong> 무슨 일, 왜 중요한지, 앞으로 확인할 점을 구분합니다.</p>
              <p><strong>사실 검증처럼 보이는 라벨을 쓰지 않습니다.</strong> 기사 표현을 일반 보도·주장·추정으로만 분류합니다.</p>
              <p><strong>모르면 비워둡니다.</strong> 맥락도 한 기사에 우연히 등장한 단어만으로 연결하지 않습니다.</p>
            </>
          ) : (
            <>
              <p><strong>Headline language follows the selected view.</strong> Stories without a matching-language report are kept out of the main briefing.</p>
              <p><strong>Coverage gaps stay visible.</strong> Source health and category coverage are shown alongside the briefing.</p>
              <p><strong>Events are grouped conservatively.</strong> Headlines, entities, actions and time distance must align.</p>
              <p><strong>The 30-second read has three layers.</strong> What happened, why it matters and what to watch are kept separate.</p>
              <p><strong>We avoid fact-check-like labels.</strong> Article language is classified only as general reporting, claims or uncertainty.</p>
              <p><strong>Unknowns stay unknown.</strong> Context is not attached from a single stray keyword in a secondary report.</p>
            </>
          )}
        </div>
      </section>

      <footer>{t.footer}</footer>
    </main>
  );
}
