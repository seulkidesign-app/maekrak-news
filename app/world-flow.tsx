import { getDisplayArticle, type NewsEvent } from "@/lib/news";
import type { Language } from "@/lib/i18n";
import { translateToKorean } from "@/lib/translate";
import { dailyMemoryLine, koreaImpact, type WorldFlow } from "@/lib/world-briefing";
import { TrustLegend } from "./trust-panel";

type SignalRule = { pattern: RegExp; ko: string; en: string };

const signalRules: SignalRule[] = [
  { pattern: /이란|iran/i, ko: "이란", en: "Iran" },
  { pattern: /이스라엘|israel/i, ko: "이스라엘", en: "Israel" },
  { pattern: /가자|팔레스타인|gaza|palestin/i, ko: "가자·팔레스타인", en: "Gaza · Palestine" },
  { pattern: /호르무즈|hormuz/i, ko: "호르무즈", en: "Hormuz" },
  { pattern: /우크라이나|ukraine/i, ko: "우크라이나", en: "Ukraine" },
  { pattern: /러시아|russia/i, ko: "러시아", en: "Russia" },
  { pattern: /나토|nato/i, ko: "NATO", en: "NATO" },
  { pattern: /휴전|ceasefire|truce/i, ko: "휴전", en: "Ceasefire" },
  { pattern: /금리|연준|federal reserve|\bfed\b|fomc|interest rate/i, ko: "금리·Fed", en: "Rates · Fed" },
  { pattern: /물가|inflation/i, ko: "물가", en: "Inflation" },
  { pattern: /달러|환율|dollar|exchange rate/i, ko: "달러·환율", en: "Dollar · FX" },
  { pattern: /관세|tariff/i, ko: "관세", en: "Tariffs" },
  { pattern: /무역|trade|공급망|supply chain/i, ko: "무역·공급망", en: "Trade · Supply chain" },
  { pattern: /원유|유가|oil|crude/i, ko: "유가", en: "Oil" },
  { pattern: /중국|china/i, ko: "중국", en: "China" },
  { pattern: /미국|united states|\bu\.s\.?\b|america/i, ko: "미국", en: "U.S." },
  { pattern: /일본|japan/i, ko: "일본", en: "Japan" },
  { pattern: /국회|의회|parliament|congress/i, ko: "국회·의회", en: "Parliament" },
  { pattern: /대통령|president/i, ko: "대통령", en: "President" },
  { pattern: /주택|부동산|housing/i, ko: "주거", en: "Housing" },
  { pattern: /노동|임금|labor|wage/i, ko: "노동·임금", en: "Labor · Wages" },
  { pattern: /인공지능|artificial intelligence|\bai\b/i, ko: "AI", en: "AI" },
  { pattern: /반도체|semiconductor|chip/i, ko: "반도체", en: "Chips" },
  { pattern: /태풍|typhoon/i, ko: "태풍", en: "Typhoon" },
  { pattern: /폭우|호우|홍수|flood|heavy rain/i, ko: "폭우·홍수", en: "Flooding" },
  { pattern: /산불|wildfire/i, ko: "산불", en: "Wildfire" },
  { pattern: /지진|earthquake/i, ko: "지진", en: "Earthquake" },
];

const regionRules = [
  { code: "korea", ko: "한국", en: "Korea", pattern: /한국|대한민국|서울|부산|제주|국회|이재명|south korea|seoul|busan|jeju|lee jae myung/i },
  { code: "north-america", ko: "미국·북미", en: "U.S. · N. America", pattern: /미국|캐나다|멕시코|트럼프|연준|united states|america|canada|mexico|trump|federal reserve|\bfed\b/i },
  { code: "china", ko: "중국", en: "China", pattern: /중국|홍콩|대만|china|chinese|hong kong|taiwan/i },
  { code: "europe", ko: "유럽", en: "Europe", pattern: /유럽|\beu\b|나토|영국|프랑스|독일|이탈리아|스페인|폴란드|europe|european union|nato|britain|\buk\b|france|germany|italy|spain|poland/i },
  { code: "middle-east", ko: "중동", en: "Middle East", pattern: /중동|이란|이스라엘|가자|팔레스타인|호르무즈|시리아|오만|사우디|이라크|레바논|iran|israel|gaza|palestin|hormuz|syria|oman|saudi|iraq|lebanon|middle east/i },
  { code: "russia-ukraine", ko: "러시아·우크라이나", en: "Russia · Ukraine", pattern: /러시아|우크라이나|russia|russian|ukraine|ukrainian/i },
  { code: "asia", ko: "일본·아시아", en: "Japan · Asia", pattern: /일본|인도|인도네시아|베트남|태국|필리핀|싱가포르|말레이시아|파키스탄|방글라데시|japan|india|indonesia|vietnam|thailand|philippines|singapore|malaysia|pakistan|bangladesh/i },
  { code: "africa", ko: "아프리카", en: "Africa", pattern: /아프리카|남아공|이집트|에티오피아|수단|케냐|나이지리아|콩고|소말리아|리비아|africa|south africa|egypt|ethiopia|sudan|kenya|nigeria|congo|somalia|libya/i },
  { code: "latin-america", ko: "중남미", en: "Latin America", pattern: /중남미|남미|브라질|아르헨티나|칠레|콜롬비아|베네수엘라|페루|쿠바|브라질리아|latin america|south america|brazil|argentina|chile|colombia|venezuela|peru|cuba/i },
  { code: "oceania", ko: "오세아니아", en: "Oceania", pattern: /오세아니아|호주|뉴질랜드|피지|파푸아뉴기니|australia|australian|new zealand|fiji|papua new guinea|oceania/i },
] as const;

function flowEvents(flow: WorldFlow, events: NewsEvent[]) {
  const byId = new Map(events.map((event) => [event.id, event]));
  return flow.eventIds.map((id) => byId.get(id)).filter((event): event is NewsEvent => Boolean(event));
}

function eventText(event: NewsEvent) {
  return event.articles.map((article) => `${article.title} ${article.description}`).join(" ");
}

function flowSignals(flow: WorldFlow, events: NewsEvent[], lang: Language) {
  const matchedEvents = flowEvents(flow, events);
  const text = matchedEvents.flatMap((event) => event.articles.map((article) => `${article.title} ${article.description}`)).join(" ");
  const labels: string[] = [];
  signalRules.forEach((rule) => { if (rule.pattern.test(text)) labels.push(lang === "ko" ? rule.ko : rule.en); });

  if (labels.length < 2) {
    matchedEvents.forEach((event) => {
      const fallback = lang === "ko"
        ? event.category === "세계" ? "국제정세" : event.category
        : event.category === "경제" ? "Economy" : event.category === "정치" ? "Politics" : event.category === "사회" ? "Society" : event.category === "기술" ? "Technology" : event.category === "재난" ? "Disaster" : event.scope === "world" ? "World affairs" : "Korea";
      labels.push(fallback);
    });
  }
  return [...new Set(labels)].slice(0, 4);
}

function flowKoreaImpact(flow: WorldFlow, events: NewsEvent[], lang: Language) {
  for (const event of flowEvents(flow, events)) {
    const impact = koreaImpact(event, lang);
    if (impact) return impact;
  }
  return null;
}

function flowSources(flow: WorldFlow, events: NewsEvent[]) {
  const seen = new Set<string>();
  const links: Array<{ source: string; link: string }> = [];
  flowEvents(flow, events).forEach((event) => {
    event.articles.forEach((article) => {
      if (!seen.has(article.source)) {
        seen.add(article.source);
        links.push({ source: article.source, link: article.link });
      }
    });
  });
  return links;
}

function todayLabel(lang: Language) {
  return new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-US", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  }).format(new Date());
}

async function localizedHeadline(event: NewsEvent, lang: Language) {
  const article = getDisplayArticle(event, lang);
  if (lang !== "ko" || /[가-힣]/.test(article.title)) return article.title || event.title;
  return await translateToKorean(article.title) ?? article.title ?? event.title;
}

export async function WorldFlowBoard({ flows, events, lang }: { flows: WorldFlow[]; events: NewsEvent[]; lang: Language }) {
  const memoryLine = dailyMemoryLine(flows, lang);
  const cards = await Promise.all(flows.map(async (flow, index) => {
    const matchedEvents = flowEvents(flow, events);
    const signals = flowSignals(flow, events, lang);
    const impact = flowKoreaImpact(flow, events, lang);
    const sources = flowSources(flow, events);
    const eventSpecificTitle = signals.length >= 2 ? signals.slice(0, 2).join(" · ") : flow.title;
    const eventRows = await Promise.all(matchedEvents.slice(0, 2).map(async (event, eventIndex) => ({
      id: event.id,
      index: eventIndex,
      title: await localizedHeadline(event, lang),
    })));
    return { flow, index, matchedEvents, signals, impact, sources, eventSpecificTitle, eventRows };
  }));

  return (
    <section className="worldFlowSection" id="world-flow">
      <div className="worldFlowDate">{todayLabel(lang)} · {lang === "ko" ? "오늘의 브리핑" : "TODAY'S BRIEF"}</div>
      <div className="worldFlowHead">
        <div>
          <div className="eyebrow">THE BIG PICTURE</div>
          <h2>{lang === "ko" ? `오늘 뉴스를 이해하는 ${flows.length}가지 흐름` : `${flows.length} currents to understand today's news`}</h2>
        </div>
        <p>{lang === "ko" ? "기사 목록보다 먼저, 오늘 함께 봐야 할 사건의 큰 줄기를 정리합니다." : "Start with the major currents before diving into individual stories."}</p>
      </div>

      <div className="worldMemoryLine">
        <span>{lang === "ko" ? "오늘 기억할 한 문장" : "One sentence to remember"}</span>
        <strong>{memoryLine}</strong>
      </div>

      <TrustLegend lang={lang} />

      <div className="worldFlowGrid">
        {cards.map(({ flow, index, matchedEvents, signals, impact, sources, eventSpecificTitle, eventRows }) => (
          <article className="worldFlowCard" key={flow.code}>
            <div className="flowIndex">0{index + 1}</div>
            <div className="flowBody">
              <div className="flowCount">{matchedEvents.length} {lang === "ko" ? "개 핵심 사건" : "key events"}</div>
              <h3>{eventSpecificTitle}</h3>
              {eventSpecificTitle !== flow.title && <div className="flowTheme">{flow.title}</div>}
              <p>{flow.summary}</p>

              {signals.length > 0 && (
                <div className="signalRail" aria-label={lang === "ko" ? "함께 볼 키워드" : "Key terms"}>
                  {signals.map((signal) => <b key={signal}>{signal}</b>)}
                </div>
              )}

              <div className="flowEvents">
                {eventRows.map((row) => (
                  <a href="#events" key={row.id}>
                    <span>{String(row.index + 1).padStart(2, "0")}</span>
                    <b>{row.title}</b>
                  </a>
                ))}
              </div>

              <div className="flowSourceProof">
                <span>{lang === "ko" ? "출처" : "Sources"}</span>
                <div>
                  {sources.slice(0, 3).map((source) => (
                    <a href={source.link} target="_blank" rel="noreferrer" key={`${flow.code}-${source.source}`}>{source.source} ↗</a>
                  ))}
                  {sources.length > 3 && <small>+{sources.length - 3}</small>}
                </div>
              </div>

              {impact && (
                <div className="flowKorea">
                  <span>🇰🇷 {lang === "ko" ? "한국과의 연결" : "Korea connection"}</span>
                  <p>{impact}</p>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="flowFooter">
        <p>{lang === "ko" ? "흐름 묶기와 ‘볼 포인트’는 이해를 돕는 편집적 가이드입니다. 직접적인 인과나 정치적 평가를 의미하지 않습니다." : "Story grouping and reading points are editorial aids, not claims of direct causality or political judgment."}</p>
        <a href="#events">{lang === "ko" ? "핵심 사건 보기 ↓" : "See the key events ↓"}</a>
      </div>
    </section>
  );
}

export async function RegionPulse({ events, lang }: { events: NewsEvent[]; lang: Language }) {
  const rows = await Promise.all(regionRules.map(async (region) => {
    const matched = events.filter((event) => region.pattern.test(eventText(event)));
    const top = [...matched].sort((a, b) => b.importanceScore - a.importanceScore)[0];
    const topTitle = top ? await localizedHeadline(top, lang) : null;
    return { ...region, matched, topTitle };
  }));

  return (
    <section className="regionPulse">
      <details className="regionPulseDetails">
        <summary>
          <div><span className="eyebrow">WORLD COVERAGE</span><strong>{lang === "ko" ? "지역별 커버리지 확인" : "Check regional coverage"}</strong></div>
          <small>{lang === "ko" ? "누락 가능성을 투명하게 보여줍니다" : "See possible coverage gaps"}</small>
        </summary>
        <div className="regionPulseBody">
          <p>{lang === "ko" ? "0은 ‘아무 일도 없음’이 아니라 오늘 KST 기준 수집에서 주요 사건을 포착하지 못했다는 뜻입니다." : "A zero means no major event was captured in today's KST collection, not that nothing happened."}</p>
          <div className="regionPulseGrid">
            {rows.map((row) => (
              <div className={`regionPulseItem ${row.matched.length === 0 ? "regionEmpty" : ""}`} key={row.code}>
                <span>{lang === "ko" ? row.ko : row.en}</span>
                <b>{row.matched.length}</b>
                <small>{row.topTitle ?? (lang === "ko" ? "현재 주요 사건 미포착" : "No major event captured")}</small>
              </div>
            ))}
          </div>
        </div>
      </details>
    </section>
  );
}

export function BriefingComplete({ memoryLine, flows, lang }: { memoryLine: string; flows: WorldFlow[]; lang: Language }) {
  return (
    <section className="briefingComplete">
      <div className="completeCheck">✓</div>
      <div>
        <div className="eyebrow">TODAY IN ONE SENTENCE</div>
        <h2>{lang === "ko" ? "여기까지 읽었다면, 오늘의 큰 흐름은 잡았습니다." : "If you've read this far, you have today's big picture."}</h2>
        <p className="memoryLine">{memoryLine}</p>
        <div className="memoryTags">{flows.map((flow) => <span key={flow.code}>{flow.title}</span>)}</div>
      </div>
    </section>
  );
}
