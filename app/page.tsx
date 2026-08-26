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
import { buildWorldFlows, dailyMemoryLine, historicalOneLiner, koreaImpact } from "@/lib/world-briefing";
import { translateToKorean } from "@/lib/translate";
import { BriefingComplete, RegionPulse, WorldFlowBoard } from "./world-flow";
import ReturningBrief from "./returning-brief";
import { SourceCheck } from "./trust-panel";
import { MoreTodayCompact } from "./more-today";

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
    timeZone: "Asia/Seoul", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function eventCategoryLabel(category: string, lang: Language) {
  return categoryLabel(category, lang);
}

function coverageLabel(event: NewsEvent, lang: Language) {
  if (lang === "ko") return event.sourceCount >= 3 ? `${event.sourceCount}개 매체 보도` : event.sourceCount === 2 ? "2개 매체 보도" : "단일 매체 보도";
  return event.sourceCount >= 3 ? `${event.sourceCount} outlets` : event.sourceCount === 2 ? "2 outlets" : "Single outlet";
}

function localizedSignal(label: ReturnType<typeof classifyEvidence>, lang: Language) {
  if (lang === "ko") return label;
  const map = { "일반 보도": "General reporting", "발언·주장": "Statement / claim", "전망·추정": "Forecast / estimate" } as const;
  return map[label];
}

function whyText(code: BriefWhyCode, lang: Language) {
  const ko: Record<BriefWhyCode, string> = {
    security: "이 사건이 이후 외교·안보 대응이나 국제 정세 변화로 이어지는지 볼 필요가 있습니다.",
    politics: "논의나 발언보다 실제 정책·제도 변화가 어디까지 확정되는지가 핵심입니다.",
    economy: "금리·물가·환율·기업 활동처럼 생활과 시장에 연결되는 변수가 어떻게 움직이는지 봐야 합니다.",
    disaster: "피해 규모보다 공식 대응과 추가 위험이 어떻게 업데이트되는지 확인하는 것이 중요합니다.",
    technology: "기업 경쟁·규제·공급망 등 산업 구조에 실제 변화가 생기는지 볼 필요가 있습니다.",
    society: "치안·교육·의료·노동·주거 등 일상 제도에 어떤 변화가 생기는지가 핵심입니다.",
    "broad-impact": "여러 보도 흐름과 연결돼 있어 오늘 전체 상황을 이해할 때 함께 볼 가치가 있는 사건입니다.",
  };
  const en: Record<BriefWhyCode, string> = {
    security: "Watch whether this changes diplomatic or security responses and the wider geopolitical picture.",
    politics: "The key is what becomes a formal policy or institutional change rather than remaining discussion or rhetoric.",
    economy: "Watch variables tied to daily life and markets, including rates, prices, currencies and business activity.",
    disaster: "Focus on official response, verified damage and whether the risk is still evolving.",
    technology: "Watch for concrete changes in competition, regulation, supply chains or industry structure.",
    society: "The key is whether everyday institutions such as healthcare, education, labor or housing actually change.",
    "broad-impact": "This connects to several parts of today's news flow and is useful for understanding the broader picture.",
  };
  return (lang === "ko" ? ko : en)[code];
}

function watchText(code: BriefWatchCode, lang: Language) {
  const ko: Record<BriefWatchCode, string> = {
    "single-source": "다른 매체나 공식 기관이 같은 내용을 확인하는지 보세요.",
    uncertain: "추정·가능성 표현이 있어 후속 확인 전까지 확정적으로 읽지 않는 편이 좋습니다.",
    "claim-heavy": "당사자 발언이 포함돼 있어 반대 측 설명이나 공식 자료가 나오는지 함께 보세요.",
    "multi-source": "여러 매체가 보도 중입니다. 다음 공식 결정·수치·현장 확인을 보면 됩니다.",
    "follow-up": "공식 발표나 추가 취재가 이어지는지 확인하면 됩니다.",
  };
  const en: Record<BriefWatchCode, string> = {
    "single-source": "Watch for confirmation from other reporting or official records.",
    uncertain: "The reporting contains uncertainty; avoid treating it as settled until follow-up confirmation appears.",
    "claim-heavy": "The story includes statements or claims; watch for opposing accounts or official documentation.",
    "multi-source": "Multiple outlets are covering it; watch for the next official decision, verified figure or on-the-ground confirmation.",
    "follow-up": "Watch for a formal announcement or additional reporting.",
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
        <span>{lang === "ko" ? "수집 상태" : "Source health"}</span>
        <b>{health.length - failed.length}/{health.length} {lang === "ko" ? "응답" : "responding"}</b>
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
      <p className="healthWarning">
        {lang === "ko" ? "수집 응답 상태는 기사 내용의 사실 여부나 전체 뉴스 커버리지를 보증하지 않습니다." : "Source response status does not verify article accuracy or complete news coverage."}
      </p>
      {failed.length > 0 && (
        <p className="healthWarning">
          {lang === "ko" ? `일부 소스(${failed.map((source) => source.name).join(", ")}) 수집에 문제가 있어 오늘 커버리지가 평소보다 낮을 수 있습니다.` : `Some sources (${failed.map((source) => source.name).join(", ")}) have collection issues, so today's coverage may be incomplete.`}
        </p>
      )}
    </details>
  );
}

const coverageOrder: NewsCategory[] = ["국내", "세계", "정치", "경제", "사회", "기술", "재난"];

function CoverageBoard({ coverage, lang }: { coverage: Record<NewsCategory, number>; lang: Language }) {
  return (
    <details className="coverageBoard">
      <summary>
        <div><span className="eyebrow">COVERAGE CHECK</span><strong>{lang === "ko" ? "주제별 커버리지 확인" : "Check topic coverage"}</strong></div>
        <small>{lang === "ko" ? "빠진 영역이 있는지 확인" : "See possible gaps"}</small>
      </summary>
      <div className="coverageBody">
        <p>{lang === "ko" ? "오늘 KST 기준으로 수집된 사건입니다. 0은 아무 일도 없다는 뜻이 아니라 현재 수집에서 포착하지 못했다는 뜻입니다." : "Events collected for today in KST. Zero means the current collection did not capture a major event, not that nothing happened."}</p>
        <div className="coverageGrid">
          {coverageOrder.map((category) => (
            <div className={`coverageItem ${coverage[category] === 0 ? "coverageMissing" : ""}`} key={category}>
              <span>{eventCategoryLabel(category, lang)}</span><b>{coverage[category]}</b>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}

function conciseExcerpt(event: NewsEvent, lang: Language) {
  const article = getDisplayArticle(event, lang);
  let text = article.description || article.title || event.summary;
  if (text.startsWith(article.title)) text = text.slice(article.title.length).replace(/^\s*[-:·]\s*/, "");
  return { article, text: text.trim() };
}

async function EventCard({ event, index, total, lang }: { event: NewsEvent; index: number; total: number; lang: Language }) {
  const t = copy[lang];
  const contexts = detectContext(event);
  const evidence = eventEvidenceSummary(event);
  const timeline = eventTimeline(event);
  const { article: displayArticle, text: displayText } = conciseExcerpt(event, lang);
  const needsTranslation = lang === "ko" && !/[가-힣]/.test(displayArticle.title);
  const translatedTitle = needsTranslation ? await translateToKorean(displayArticle.title) : null;
  const translatedExcerpt = needsTranslation && displayText ? await translateToKorean(displayText.slice(0, 430)) : null;
  const shownTitle = translatedTitle ?? displayArticle.title ?? event.title;
  const shownText = translatedExcerpt ?? displayText;
  const primaryContext = contexts[0] ? localizedContext(contexts[0], lang) : null;
  const why = primaryContext?.context ?? whyText(event.briefWhy, lang);
  const impact = koreaImpact(event, lang);
  const history = historicalOneLiner(event, lang, primaryContext?.history ?? null);

  return (
    <article className="eventCard priorityEvent">
      <div className="eventNumber">{index + 1}/{total}</div>
      <div className="eventBody">
        <div className="meta">
          <span className="priorityMark">{lang === "ko" ? "오늘 핵심" : "Must know"}</span>
          <span>{eventCategoryLabel(event.category, lang)}</span>
          <span>{coverageLabel(event, lang)}</span>
          <span>{relativeTime(event.publishedAt, lang)}</span>
        </div>
        <h3>{shownTitle}</h3>
        {needsTranslation && translatedTitle && <div className="translationNote">자동 번역 · 원문 제목은 출처에서 확인</div>}

        <SourceCheck event={event} representative={displayArticle} evidence={evidence} lang={lang} />

        <div className="quickRead briefingThree">
          <div className="briefLine primaryBrief">
            <span>{lang === "ko" ? "무슨 일" : "What happened"}</span>
            <p>{shownText ? `${shownText.slice(0, 250)}${shownText.length > 250 ? "…" : ""}` : t.quickEmpty}</p>
            <small>{needsTranslation && translatedExcerpt ? `자동 번역 · ${displayArticle.source} 원문 기반` : (lang === "ko" ? `원문 기반 · ${displayArticle.source}` : `Source-derived · ${displayArticle.source}`)}</small>
          </div>
          <div className="briefLine contextBrief">
            <span>{lang === "ko" ? "볼 포인트" : "What to notice"}</span>
            <p>{why}</p>
            <small>{lang === "ko" ? "맥락 해설 · 원문 인용 아님" : "Context guide · not a source quote"}</small>
          </div>
          <div className="briefLine">
            <span>{lang === "ko" ? "다음 확인" : "What to watch"}</span>
            <p>{watchText(event.briefWatch, lang)}</p>
          </div>
        </div>

        {impact && (
          <div className="koreaImpactLine">
            <span>{lang === "ko" ? "🇰🇷 한국과의 연결" : "🇰🇷 Korea connection"}</span>
            <p>{impact}</p>
          </div>
        )}

        {history && (
          <div className="historyZoomLine">
            <span>{lang === "ko" ? "배경지식" : "Background"}</span>
            <p>{history.replace(/^지금만 보면 놓치는 배경 · |^Background beyond today's headline · /, "")}</p>
          </div>
        )}

        {contexts.length > 0 && (
          <details className="contextDisclosure">
            <summary>
              <span>{lang === "ko" ? "용어와 배경 더 보기" : "More terms and background"}</span>
              <small>{lang === "ko" ? `${contexts.length}개 핵심 개념` : `${contexts.length} key concepts`}</small>
            </summary>
            <div className="contextSection">
              <div className="glossaryStrip" aria-label={t.glossary}>
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
                        <div><small>{lang === "ko" ? "이 기사에서 볼 점" : "In this story"}</small><p>{localized.context}</p></div>
                        {localized.history && <div className="historyCell"><small>{t.history}</small><p>{localized.history}</p></div>}
                        <div><small>{t.deeper}</small><p>{localized.deep}</p></div>
                      </div>
                      <a className="referenceLink" href={info.referenceUrl} target="_blank" rel="noreferrer">{t.source} · {info.referenceLabel} ↗</a>
                    </details>
                  );
                })}
              </div>
            </div>
          </details>
        )}

        <details className="moreContext">
          <summary>{lang === "ko" ? "보도 흐름과 전체 원문" : "Reporting timeline and all sources"}</summary>
          <div className="evidenceBox">
            <div className="sectionRow">
              <div className="boxLabel">{lang === "ko" ? "보도 표현" : "Reporting language"}</div>
              <span>{lang === "ko" ? "사실 판정이 아닌 표현 기반 분류" : "Language-based classification, not a fact-check verdict"}</span>
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
              <p className="timelineNote">{lang === "ko" ? "기사 발행 순서이며 사건 발생 시각과는 다를 수 있습니다." : "This is publication order and may differ from the event's actual timeline."}</p>
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

function hasHeadlineForLanguage(event: NewsEvent, lang: Language) {
  const title = getDisplayArticle(event, lang).title;
  return lang === "ko" ? /[가-힣]/.test(title) : !/[가-힣]/.test(title);
}

async function TranslatedSourceOnly({ events }: { events: NewsEvent[] }) {
  const rows = await Promise.all(events.slice(0, 12).map(async (event) => {
    const article = getDisplayArticle(event, "en");
    const translated = await translateToKorean(article.title);
    return { event, article, translated };
  }));

  return (
    <section className="section sourceOnlySection">
      <details className="sourceOnlyDetails">
        <summary>한국어 보도가 아직 없는 해외 원문 {events.length}건</summary>
        <p>제목은 무료 자동 번역을 보조로 제공하며, 판단이 필요한 내용은 반드시 원문 링크에서 확인할 수 있습니다.</p>
        <div className="sourceOnlyList">
          {rows.map(({ event, article, translated }) => (
            <a href={article.link} target="_blank" rel="noreferrer" key={event.id}>
              <b>{article.source}</b>
              <span>{translated ?? article.title}</span>
              <small>{translated ? "자동 번역 · " : "원문 · "}{relativeTime(event.publishedAt, "ko")} ↗</small>
            </a>
          ))}
        </div>
      </details>
    </section>
  );
}

type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const lang: Language = params.lang === "en" ? "en" : "ko";
  const t = copy[lang];
  const briefing = await getBriefing();
  const events = briefing.events;

  const readyEvents = events;
  const languagePending = lang === "ko" ? events.filter((event) => !hasHeadlineForLanguage(event, "ko")) : [];
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
  const moreEvents = readyEvents.filter((event) => !priorityIds.has(event.id) && (lang === "en" || hasHeadlineForLanguage(event, "ko")));
  const worldFlows = buildWorldFlows(readyEvents, lang);
  const memoryLine = dailyMemoryLine(worldFlows, lang);
  const updatedAt = new Date().toLocaleString(lang === "ko" ? "ko-KR" : "en-US", { timeZone: "Asia/Seoul" });
  const visitEvents = readyEvents.map((event) => ({ id: event.id, title: getDisplayArticle(event, lang).title || event.title, publishedAt: event.publishedAt, priority: priorityIds.has(event.id) }));

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top">{t.brand}</a>
        <div className="topActions">
          <nav>
            <a href="#world-flow">{lang === "ko" ? "오늘의 흐름" : "Today's flow"}</a>
            <a href="#events">{lang === "ko" ? "핵심 뉴스" : "Key events"}</a>
            <a href="#principles">{lang === "ko" ? "편집 원칙" : "Editorial policy"}</a>
          </nav>
          <div className="languageToggle" aria-label="Language">
            <a className={lang === "ko" ? "active" : ""} href="?lang=ko">한</a>
            <a className={lang === "en" ? "active" : ""} href="?lang=en">EN</a>
          </div>
        </div>
      </header>

      <section className="hero compactHero" id="top">
        <div className="eyebrow">DAILY NEWS, WITH CONTEXT</div>
        <h1>{lang === "ko" ? <>오늘 무슨 일이 있었고,<br />왜 봐야 하는지만.</> : <>What happened today,<br />and what is worth noticing.</>}</h1>
        <p>{lang === "ko" ? "여러 뉴스 채널을 돌아다니지 않아도, 오늘 KST 기준의 흐름·핵심 사건·출처·배경지식을 한 번에 봅니다." : "See today's KST-based currents, key events, sources and background without hopping between news channels."}</p>
        <div className="heroMeta">
          <span>{lang === "ko" ? `오늘의 흐름 → 핵심 ${priorityEvents.length}개 → 출처와 배경` : `Today's currents → ${priorityEvents.length} key events → sources & context`}</span>
          <a href="#world-flow">{lang === "ko" ? "오늘 브리핑 시작 ↓" : "Start today's brief ↓"}</a>
        </div>
        <div className="status"><span className={`dot ${briefing.healthySources < briefing.totalSources ? "warningDot" : ""}`} /> {t.updated} {updatedAt} · {t.cache}</div>
      </section>

      <WorldFlowBoard flows={worldFlows} events={readyEvents} lang={lang} />
      <ReturningBrief events={visitEvents} lang={lang} />

      <section className="section mustKnowSection" id="events">
        <div className="sectionHead">
          <div><div className="eyebrow">KEY EVENTS</div><h2>{lang === "ko" ? `오늘은 이 ${priorityEvents.length}개부터 보면 됩니다` : `Start with these ${priorityEvents.length} events today`}</h2></div>
          <p>{lang === "ko" ? "보도와 맥락을 섞지 않고 단계별로 보여줍니다." : "Reporting and context are kept visibly separate."}</p>
        </div>

        {priorityEvents.length === 0 ? (
          <div className="empty">{lang === "ko" ? "오늘 KST 기준으로 핵심 브리핑을 만들 만큼 최신 기사를 수집하지 못했습니다." : "Not enough current KST-day reporting was collected to build the briefing."}</div>
        ) : (
          <div className="eventList">{priorityEvents.map((event, index) => <EventCard key={event.id} event={event} index={index} total={priorityEvents.length} lang={lang} />)}</div>
        )}
      </section>

      {priorityEvents.length > 0 && <BriefingComplete memoryLine={memoryLine} flows={worldFlows} lang={lang} />}

      <section className="secondaryUtilityArea">
        <RegionPulse events={readyEvents} lang={lang} />
        <CoverageBoard coverage={briefing.categoryCoverage} lang={lang} />
        <div className="sourceStatusWrap"><SourceStatus health={briefing.sourceHealth} lang={lang} /></div>
      </section>

      <MoreTodayCompact events={moreEvents} lang={lang} />

      {lang === "ko" && languagePending.length > 0 && <TranslatedSourceOnly events={languagePending} />}

      <section className="principles" id="principles">
        <details className="principlesDetails">
          <summary>
            <div><span className="eyebrow">EDITORIAL POLICY</span><strong>{lang === "ko" ? "맥락은 어떻게 편향을 줄이나요?" : "How does Context reduce editorial bias?"}</strong></div>
            <small>{lang === "ko" ? "선정·해설·출처 원칙 보기" : "See selection, explanation and source rules"}</small>
          </summary>
          <div className="principleGrid">
            {lang === "ko" ? (
              <>
                <p><strong>‘맥락’도 편집적 판단이 될 수 있음을 표시합니다.</strong> 흐름 묶기와 ‘볼 포인트’는 사실 문장과 시각적으로 구분합니다.</p>
                <p><strong>정치 진영을 평가하지 않습니다.</strong> 좋다·나쁘다 같은 가치판단보다 제도·정책·경제·안보에 어떤 변화가 생기는지를 설명합니다.</p>
                <p><strong>발언과 확인된 보도를 구분합니다.</strong> 주장·추정 표현을 별도로 표시하고 원문 비교를 제공합니다.</p>
                <p><strong>출처 수를 진실 점수로 쓰지 않습니다.</strong> 복수 매체 보도는 커버리지 신호일 뿐, 사실 보증이 아닙니다.</p>
                <p><strong>자동 번역은 번역이라고 표시합니다.</strong> 번역문은 이해를 위한 보조이며, 원문 링크를 항상 함께 제공합니다.</p>
                <p><strong>모르면 비워둡니다.</strong> 검수되지 않은 역사 배경이나 근거 없는 원인·의도·정치 성향은 채우지 않습니다.</p>
              </>
            ) : (
              <>
                <p><strong>Context can involve editorial judgment.</strong> Story grouping and reading points are visually separated from source-derived reporting.</p>
                <p><strong>We do not rate political camps.</strong> Explanations focus on institutional, policy, economic and security effects instead of value judgments.</p>
                <p><strong>Claims and reporting are separated.</strong> Claim and uncertainty language is flagged and originals can be compared.</p>
                <p><strong>Source count is not a truth score.</strong> Multiple coverage is a breadth signal, not a guarantee of accuracy.</p>
                <p><strong>Machine translation is labeled.</strong> It is an aid to understanding and the original link remains available.</p>
                <p><strong>Unknowns stay unknown.</strong> We do not fill unreviewed history, motives, causality or political alignment without support.</p>
              </>
            )}
          </div>
        </details>
      </section>

      <footer>{t.footer}</footer>
    </main>
  );
}
