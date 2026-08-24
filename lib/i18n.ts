import type { DetectedContext } from "@/lib/context";

export type Language = "ko" | "en";

type UiCopy = {
  brand: string;
  eventsNav: string;
  principlesNav: string;
  heroTitle: [string, string];
  heroBody: string;
  updated: string;
  cache: string;
  level1: string;
  level1Body: string;
  level2: string;
  level2Body: string;
  level3: string;
  level3Body: string;
  today: string;
  eventUnit: string;
  quick: string;
  quickEmpty: string;
  understand: string;
  concepts: string;
  noConcept: string;
  glossary: string;
  meaning: string;
  why: string;
  history: string;
  deeper: string;
  source: string;
  pending: string;
  more: string;
  evidence: string;
  signal: string;
  fact: string;
  claim: string;
  verify: string;
  timeline: string;
  originals: string;
  aggregated: string;
  sourceLanguage: string;
  trustTitle: [string, string];
  footer: string;
};

export const copy: Record<Language, UiCopy> = {
  ko: {
    brand: "맥락",
    eventsNav: "오늘의 사건",
    principlesNav: "원칙",
    heroTitle: ["오늘의 한국과 세계를,", "하나의 흐름으로."],
    heroBody: "여러 뉴스 채널을 따로 보지 않아도, 오늘 무슨 일이 있었는지와 왜 중요한지까지 쉽게 이해합니다.",
    updated: "최근 갱신",
    cache: "최대 15분 캐시",
    level1: "30초",
    level1Body: "오늘 무슨 일이 있었는지.",
    level2: "맥락",
    level2Body: "왜 중요한지와 배경지식.",
    level3: "근거",
    level3Body: "보도 흐름과 원문 확인.",
    today: "오늘 이해해둘 사건",
    eventUnit: "기사 수가 아니라 사건 단위",
    quick: "30초 이해",
    quickEmpty: "요약 정보가 충분하지 않아 원문 확인이 필요합니다.",
    understand: "이 사건을 이해하려면",
    concepts: "개 핵심 개념",
    noConcept: "연결된 개념 없음",
    glossary: "어려운 용어 정리",
    meaning: "용어 뜻",
    why: "왜 중요한가",
    history: "역사적 배경",
    deeper: "더 깊게",
    source: "배경자료",
    pending: "검수된 배경 개념을 찾지 못했습니다. 추측해서 채우지 않고 원문을 우선 제공합니다.",
    more: "보도 흐름과 근거 더 보기",
    evidence: "보도 성격",
    signal: "표현 기반 참고 신호",
    fact: "사실 서술",
    claim: "주장·발언",
    verify: "추가 확인",
    timeline: "이 사건의 흐름",
    originals: "원문 비교",
    aggregated: "집계 피드",
    sourceLanguage: "기사 제목은 출처 언어 그대로 표시됩니다.",
    trustTitle: ["쉽게 보여주되,", "근거는 숨기지 않습니다."],
    footer: "맥락 · 뉴스를 소비하는 대신 이해하기",
  },
  en: {
    brand: "Context",
    eventsNav: "Today's events",
    principlesNav: "Principles",
    heroTitle: ["Korea and the world today,", "in one clear flow."],
    heroBody: "Understand what happened today and why it matters without checking multiple news channels.",
    updated: "Updated",
    cache: "up to 15 min cache",
    level1: "30 sec",
    level1Body: "What happened today.",
    level2: "Context",
    level2Body: "Why it matters and what sits behind it.",
    level3: "Evidence",
    level3Body: "Timeline and original reporting.",
    today: "Events worth understanding today",
    eventUnit: "Grouped by event, not article count",
    quick: "30-second read",
    quickEmpty: "There is not enough summary information yet. Please check the original reporting.",
    understand: "What you need to know",
    concepts: " key concepts",
    noConcept: "No linked concepts",
    glossary: "Difficult terms",
    meaning: "Meaning",
    why: "Why it matters",
    history: "Historical background",
    deeper: "Go deeper",
    source: "Background source",
    pending: "No reviewed background concept could be linked reliably. We show the original reporting instead of guessing.",
    more: "See reporting timeline and evidence",
    evidence: "Reporting type",
    signal: "Language-based reference signal",
    fact: "Factual wording",
    claim: "Claim / statement",
    verify: "Needs verification",
    timeline: "How the story developed",
    originals: "Compare original reports",
    aggregated: "aggregated feed",
    sourceLanguage: "Article headlines remain in the source language.",
    trustTitle: ["Easy to read,", "without hiding the evidence."],
    footer: "Context · Understand the news, not just consume it",
  },
};

type LocalizedConcept = {
  term: string;
  simple: string;
  context: string;
  deep: string;
  history: string;
  kind: string;
};

const contextEn: Record<string, LocalizedConcept> = {
  "interest-rate": { term: "Policy rate", simple: "The benchmark interest rate a central bank uses to influence borrowing costs across the economy.", context: "Changes can affect loans, savings, spending and investment, making policy rates central to inflation and growth stories.", deep: "They can also move exchange rates, housing and business investment, although the effect depends on economic conditions and market expectations.", history: "Modern central banks increasingly used short-term policy rates as a main monetary-policy tool from the late 20th century onward.", kind: "Economy" },
  fed: { term: "U.S. Federal Reserve (Fed)", simple: "The central banking system of the United States.", context: "Fed decisions influence the dollar and global capital flows, so they often affect Korean and global financial markets as well.", deep: "The Fed weighs both price stability and employment, and markets often react as much to future guidance as to the rate decision itself.", history: "The Federal Reserve was created in 1913 after repeated U.S. banking crises highlighted the need for a more stable central banking system.", kind: "Economy" },
  tariff: { term: "Tariff", simple: "A tax charged on goods entering a country.", context: "Higher tariffs can raise import prices and business costs and may trigger retaliation from trading partners.", deep: "Tariffs are tied to supply chains, exchange rates and industrial policy, and are often used as a negotiating tool between governments.", history: "Tariffs were once a major source of government revenue. After World War II, multilateral trade agreements gradually reduced many tariff barriers.", kind: "Economy" },
  inflation: { term: "Inflation", simple: "A sustained rise in the overall price level of goods and services.", context: "It directly affects living costs and real income and is a key factor in central-bank rate decisions.", deep: "Demand, supply shocks, wages and exchange rates can all contribute, so inflation rarely has a single cause.", history: "High inflation episodes in the 1970s reshaped modern monetary policy and strengthened central banks' focus on price stability.", kind: "Economy" },
  "exchange-rate": { term: "Exchange rate", simple: "The rate at which one currency can be exchanged for another.", context: "A change in the won can affect import prices, overseas travel costs and exporters' earnings.", deep: "Rates are influenced by interest-rate gaps, trade, risk sentiment and policy expectations rather than a single factor.", history: "Many major currencies moved toward floating exchange rates after the Bretton Woods fixed-rate system broke down in the early 1970s.", kind: "Economy" },
  nato: { term: "NATO", simple: "A military alliance linking countries in North America and Europe.", context: "Its collective-defence principle makes an attack on one member a security issue for the alliance as a whole.", deep: "Membership expansion, defence spending and relations with Russia are central to Europe's security order.", history: "NATO was founded in 1949 during the early Cold War as a collective-defence alliance among Western countries.", kind: "World" },
  ceasefire: { term: "Ceasefire", simple: "An agreement to stop fighting, usually without ending the underlying conflict.", context: "It can create space for civilian protection, humanitarian aid and negotiations, but it is not the same as a peace agreement.", deep: "Its durability depends on who guarantees it, how violations are defined and whether the parties have incentives to keep it.", history: "Ceasefires have long been used as temporary pauses in war; some become stepping stones to peace agreements, while others collapse quickly.", kind: "World" },
  sanctions: { term: "Economic sanctions", simple: "Restrictions on trade, finance or assets aimed at a country, organization or individual.", context: "They allow governments to apply pressure without direct military action but can also affect markets and ordinary people.", deep: "Their effectiveness depends on how many countries participate, whether trade can be rerouted and how exposed the target is.", history: "Economic sanctions became a more prominent foreign-policy tool in the 20th century, especially through the League of Nations and later the United Nations.", kind: "World" },
  unsc: { term: "UN Security Council", simple: "The UN body with primary responsibility for international peace and security.", context: "It can authorize sanctions and peacekeeping measures, which is why it appears frequently in conflict reporting.", deep: "Its five permanent members—China, France, Russia, the UK and the US—hold veto power, which can block action.", history: "The Security Council was created with the United Nations in 1945 after World War II, giving major powers permanent seats and vetoes.", kind: "World" },
  eu: { term: "European Union (EU)", simple: "A political and economic union of European countries.", context: "Its rules on trade, privacy, climate and competition can affect companies well beyond Europe.", deep: "The EU is not a single country; authority is divided differently between EU institutions and member states depending on the policy area.", history: "European integration began after World War II with coal and steel cooperation and developed into today's EU through a series of treaties.", kind: "World" },
  impeachment: { term: "Impeachment", simple: "A constitutional process for accusing and potentially removing a senior public official for serious legal or constitutional violations.", context: "Political criticism and legal grounds for impeachment are not the same, so the procedure and deciding institution matter.", deep: "The process differs by country, so cases in different political systems are not directly comparable.", history: "The idea developed from parliamentary practice in Britain and was later incorporated into several constitutional systems, including the United States and South Korea.", kind: "Politics" },
  referendum: { term: "Referendum", simple: "A vote in which citizens decide or express a view on a specific public issue.", context: "Unlike a general election, it usually focuses on one question such as a constitutional change, policy or independence.", deep: "Its political meaning depends on whether the result is legally binding and how the question is written.", history: "Modern referendums expanded alongside constitutional democracy and have been used for questions ranging from constitutional reform to national independence.", kind: "Politics" },
  "local-heavy-rain": { term: "Localized torrential rain", simple: "Very heavy rain concentrated over a small area in a short period of time.", context: "Even within one city, flooding and damage can be severe in one neighborhood while another receives much less rain.", deep: "Atmospheric instability, terrain and drainage capacity all shape the risk, so total rainfall alone does not tell the whole story.", history: "Urban flood risk has grown in importance as dense development and more frequent extreme-rain events expose limits in drainage systems.", kind: "Climate" },
  typhoon: { term: "Typhoon", simple: "A powerful tropical cyclone that develops over warm ocean water in the western North Pacific.", context: "Damage can occur far from the storm center because wind fields and rain bands cover a wide area.", deep: "Forecast tracks contain uncertainty, so the latest official forecast matters more than a single earlier projection.", history: "Modern satellite observation and numerical weather models have greatly improved typhoon tracking since the second half of the 20th century.", kind: "Climate" },
  nile: { term: "Nile River", simple: "A major river system crossing several African countries before reaching the Mediterranean Sea.", context: "Upstream dams and water use can affect agriculture, electricity and water security in downstream countries.", deep: "The operation of Ethiopia's GERD has become closely tied to negotiations with Egypt and Sudan over water security.", history: "Nile water politics were shaped by colonial-era agreements and later treaties, while upstream countries increasingly challenged older allocations in the 21st century.", kind: "Geography" },
};

const historyKo: Record<string, string> = {
  "interest-rate": "현대 중앙은행은 20세기 후반부터 단기 정책금리를 물가와 경기를 조절하는 핵심 수단으로 널리 사용해 왔습니다.",
  fed: "미 연준은 반복된 금융위기 이후 미국 금융시스템을 안정시키기 위해 1913년에 만들어졌습니다.",
  tariff: "관세는 과거 국가 재정의 중요한 수입원이었지만, 제2차 세계대전 이후 다자간 무역협정이 확대되며 많은 국가가 관세 장벽을 낮춰왔습니다.",
  inflation: "1970년대의 높은 인플레이션은 현대 통화정책을 크게 바꾸었고, 중앙은행이 물가 안정을 더 강하게 중시하는 계기가 됐습니다.",
  "exchange-rate": "1970년대 초 브레턴우즈 고정환율 체제가 무너진 뒤 주요 통화는 점차 시장에서 움직이는 변동환율제로 전환됐습니다.",
  nato: "나토는 냉전 초기인 1949년 서방 국가들의 집단방위를 위해 창설됐습니다.",
  ceasefire: "휴전은 오랫동안 전쟁을 일시 중단하는 수단으로 사용돼 왔으며, 어떤 휴전은 평화협정으로 이어지고 어떤 휴전은 다시 무너지기도 했습니다.",
  sanctions: "경제 제재는 20세기에 국제정치의 주요 압박 수단으로 자리 잡았고, 유엔 체제 이후 다자 제재의 비중도 커졌습니다.",
  unsc: "안보리는 제2차 세계대전 직후인 1945년 유엔과 함께 만들어졌고, 당시 주요 승전국 5개국에 상임이사국 지위와 거부권이 주어졌습니다.",
  eu: "유럽 통합은 제2차 세계대전 이후 석탄·철강 공동관리에서 시작해 여러 조약을 거치며 오늘날의 EU로 발전했습니다.",
  impeachment: "탄핵 제도는 영국 의회 관행에서 발전했고 이후 미국·한국을 포함한 여러 헌정 체제에 서로 다른 형태로 도입됐습니다.",
  referendum: "근대 국민투표는 입헌 민주주의가 확대되면서 헌법 개정, 영토, 독립 같은 큰 쟁점을 시민에게 직접 묻는 방식으로 사용돼 왔습니다.",
  "local-heavy-rain": "도시가 고밀도로 개발되고 극한 강수 위험이 커지면서 배수 능력과 도시 침수 문제가 더 중요한 재난 이슈가 됐습니다.",
  typhoon: "20세기 후반 위성 관측과 수치예보 기술이 발전하면서 태풍의 위치와 진로를 훨씬 더 정확하게 추적할 수 있게 됐습니다.",
  nile: "나일강 물 분배는 식민지 시기 협정들의 영향을 오래 받아왔고, 21세기 들어 상류 국가들이 기존 질서에 문제를 제기하며 갈등 구조가 달라졌습니다.",
};

export function localizedContext(info: DetectedContext, lang: Language): LocalizedConcept {
  if (lang === "ko") {
    return {
      term: info.term,
      simple: info.simple,
      context: info.context,
      deep: info.deep,
      history: historyKo[info.id] ?? "이 개념의 역사적 배경은 검수 후 추가할 예정입니다.",
      kind: info.kind,
    };
  }

  return contextEn[info.id] ?? {
    term: info.term,
    simple: info.simple,
    context: info.context,
    deep: info.deep,
    history: "Historical background is being reviewed before publication.",
    kind: info.kind,
  };
}

export function categoryLabel(category: string, lang: Language) {
  if (lang === "ko") return category;
  const map: Record<string, string> = { 국내: "Korea", 세계: "World", 경제: "Economy", 정치: "Politics", 사회: "Society", 기술: "Technology", 기후: "Climate" };
  return map[category] ?? category;
}
