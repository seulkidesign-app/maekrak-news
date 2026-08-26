import { getDisplayArticle, type NewsEvent } from "@/lib/news";
import type { Language } from "@/lib/i18n";
import { dailyMemoryLine, koreaImpact, type WorldFlow } from "@/lib/world-briefing";

type SignalRule = {
  pattern: RegExp;
  ko: string;
  en: string;
};

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
  { code: "north-america", ko: "미국·북미", en: "U.S. · N. America", pattern: /미국|캐나다|트럼프|연준|united states|america|canada|trump|federal reserve|\bfed\b/i },
  { code: "china", ko: "중국", en: "China", pattern: /중국|홍콩|대만|china|chinese|hong kong|taiwan/i },
  { code: "europe", ko: "유럽", en: "Europe", pattern: /유럽|EU|나토|영국|프랑스|독일|이탈리아|europe|european union|nato|britain|uk\b|france|germany|italy/i },
  { code: "middle-east", ko: "중동", en: "Middle East", pattern: /중동|이란|이스라엘|가자|팔레스타인|호르무즈|시리아|오만|iran|israel|gaza|palestin|hormuz|syria|oman|middle east/i },
  { code: "russia-ukraine", ko: "러시아·우크라이나", en: "Russia · Ukraine", pattern: /러시아|우크라이나|russia|russian|ukraine|ukrainian/i },
  { code: "asia", ko: "일본·아시아", en: "Japan · Asia", pattern: /일본|인도|인도네시아|베트남|태국|필리핀|싱가포르|japan|india|indonesia|vietnam|thailand|philippines|singapore/i },
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
  signalRules.forEach((rule) => {
    if (rule.pattern.test(text)) labels.push(lang === "ko" ? rule.ko : rule.en);
  });

  if (labels.length < 2) {
    const fallback = matchedEvents.map((event) => {
      if (lang === "ko") {
        if (event.category === "경제") return "경제";
        if (event.category === "정치") return "정치";
        if (event.category === "사회") return "사회";
        if (event.category === "기술") return "기술";
        if (event.category === "재난") return "재난";
        return event.scope === "world" ? "국제정세" : "한국";
      }
      if (event.category === "경제") return "Economy";
      if (event.category === "정치") return "Politics";
      if (event.category === "사회") return "Society";
      if (event.category === "기술") return "Technology";
      if (event.category === "재난") return "Disaster";
      return event.scope === "world" ? "World affairs" : "Korea";
    });
    fallback.forEach((label) => labels.push(label));
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

function todayLabel(lang: Language) {
  const formatter = new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  return formatter.format(new Date());
}

export function WorldFlowBoard({ flows, events, lang }: { flows: WorldFlow[]; events: NewsEvent[]; lang: Language }) {
  const memoryLine = dailyMemoryLine(flows, lang);

  return (
    <section className="worldFlowSection" id="world-flow">
      <div className="worldFlowDate">{todayLabel(lang)} · {lang === "ko" ? "오늘의 세계" : "TODAY'S WORLD"}</div>

      <div className="worldFlowHead">
        <div>
          <div className="eyebrow">THE BIG PICTURE</div>
          <h2>{lang === "ko" ? `오늘 뉴스를 이해하는 ${flows.length || 3}가지 흐름` : `${flows.length || 3} currents to understand today's news`}</h2>
        </div>
        <p>{lang === "ko" ? "뉴스를 하나씩 외우는 대신, 오늘 함께 봐야 할 사건을 큰 흐름으로 먼저 정리했습니다." : "Instead of memorizing headlines, start with the major currents that organize today's events."}</p>
      </div>

      <div className="worldMemoryLine">
        <span>{lang === "ko" ? "오늘 기억할 한 문장" : "One sentence to remember"}</span>
        <strong>{memoryLine}</strong>
      </div>

      <div className="worldFlowGrid">
        {flows.map((flow, index) => {
          const matchedEvents = flowEvents(flow, events);
          const signals = flowSignals(flow, events, lang);
          const impact = flowKoreaImpact(flow, events, lang);
          const eventSpecificTitle = signals.length >= 2 ? signals.slice(0, 2).join(" · ") : flow.title;

          return (
            <article className="worldFlowCard" key={flow.code}>
              <div className="flowIndex">0{index + 1}</div>
              <div className="flowBody">
                <div className="flowCount">{matchedEvents.length} {lang === "ko" ? "개 사건을 한 흐름으로" : "events in one current"}</div>
                <h3>{eventSpecificTitle}</h3>
                {eventSpecificTitle !== flow.title && <div className="flowTheme">{flow.title}</div>}
                <p>{flow.summary}</p>

                {signals.length > 0 && (
                  <div className="signalBlock">
                    <span>{lang === "ko" ? "함께 볼 키워드 · 인과관계 아님" : "Read together · not a causal chain"}</span>
                    <div className="signalRail">
                      {signals.map((signal) => <b key={signal}>{signal}</b>)}
                    </div>
                  </div>
                )}

                <div className="flowEvents">
                  {matchedEvents.slice(0, 3).map((event, eventIndex) => {
                    const article = getDisplayArticle(event, lang);
                    return (
                      <a href="#events" key={event.id}>
                        <span>{String(eventIndex + 1).padStart(2, "0")}</span>
                        <b>{article.title || event.title}</b>
                      </a>
                    );
                  })}
                </div>

                {impact && (
                  <div className="flowKorea">
                    <span>🇰🇷 {lang === "ko" ? "한국에서 볼 포인트" : "Korea lens"}</span>
                    <p>{impact}</p>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="flowFooter">
        <p>{lang === "ko" ? "키워드는 오늘 뉴스를 읽는 순서를 돕는 장치입니다. 같은 흐름에 있다고 해서 사건 사이의 직접적인 인과를 뜻하지 않습니다." : "Keywords are reading aids for today's news. Sharing a current does not assert direct causality between events."}</p>
        <a href="#events">{lang === "ko" ? "핵심 사건 5개 이해하기 ↓" : "Understand the 5 key events ↓"}</a>
      </div>
    </section>
  );
}

export function RegionPulse({ events, lang }: { events: NewsEvent[]; lang: Language }) {
  const rows = regionRules.map((region) => {
    const matched = events.filter((event) => region.pattern.test(eventText(event)));
    const top = [...matched].sort((a, b) => b.importanceScore - a.importanceScore)[0];
    return { ...region, matched, top };
  });

  return (
    <section className="regionPulse" aria-label={lang === "ko" ? "세계 지역별 뉴스 커버리지" : "Regional news coverage"}>
      <div className="regionPulseHead">
        <div>
          <div className="eyebrow">WORLD COVERAGE</div>
          <h2>{lang === "ko" ? "세계 어디에서 무슨 일이 잡혔나" : "Where today's events are coming from"}</h2>
        </div>
        <p>{lang === "ko" ? "0은 ‘아무 일도 없음’이 아니라, 현재 수집된 주요 사건에서 잡히지 않았다는 뜻입니다." : "A zero does not mean nothing happened — only that no major event from that region was captured in the current collection."}</p>
      </div>
      <div className="regionPulseGrid">
        {rows.map((row) => (
          <div className={`regionPulseItem ${row.matched.length === 0 ? "regionEmpty" : ""}`} key={row.code}>
            <span>{lang === "ko" ? row.ko : row.en}</span>
            <b>{row.matched.length}</b>
            <small>{row.top ? getDisplayArticle(row.top, lang).title : (lang === "ko" ? "현재 주요 사건 미포착" : "No major event captured")}</small>
          </div>
        ))}
      </div>
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
        <div className="memoryTags">
          {flows.map((flow) => <span key={flow.code}>{flow.title}</span>)}
        </div>
      </div>
    </section>
  );
}
