import type { Language } from "@/lib/i18n";
import type { NewsEvent } from "@/lib/news";

export type WorldFlowCode = "security" | "economy" | "korea" | "technology" | "climate";

export type WorldFlow = {
  code: WorldFlowCode;
  title: string;
  summary: string;
  eventIds: string[];
  score: number;
};

type FlowRule = {
  code: WorldFlowCode;
  koTitle: string;
  enTitle: string;
  koSummary: string;
  enSummary: string;
  matches: (event: NewsEvent) => boolean;
};

const flowRules: FlowRule[] = [
  {
    code: "security",
    koTitle: "안보·외교의 긴장과 협상",
    enTitle: "Security, diplomacy and negotiation",
    koSummary: "전쟁·외교·선거·제재처럼 국가의 다음 행동을 바꿀 수 있는 사건을 한 흐름으로 봅니다.",
    enSummary: "Stories that can change governments' next moves, from conflict and diplomacy to elections and sanctions.",
    matches: (event) => event.briefWhy === "security" || (event.scope === "world" && event.briefWhy === "politics"),
  },
  {
    code: "economy",
    koTitle: "돈의 흐름: 금리·물가·무역",
    enTitle: "Money flows: rates, prices and trade",
    koSummary: "금리·물가·관세·시장 뉴스는 따로 보이지만 환율과 기업 활동, 생활비를 통해 서로 영향을 주고받을 수 있습니다.",
    enSummary: "Rates, inflation, tariffs and markets can interact through currencies, business activity and living costs.",
    matches: (event) => event.category === "경제" || event.briefWhy === "economy",
  },
  {
    code: "korea",
    koTitle: "한국의 정책과 일상 변화",
    enTitle: "Policy and daily-life change in Korea",
    koSummary: "정치·사회 제도의 변화가 실제 정책과 생활에 어디까지 이어지는지를 묶어 봅니다.",
    enSummary: "A view of how Korean political and social developments may turn into concrete policy or daily-life changes.",
    matches: (event) => event.scope === "domestic" && ["정치", "사회", "국내"].includes(event.category),
  },
  {
    code: "technology",
    koTitle: "기술이 산업 질서를 바꾸는 흐름",
    enTitle: "Technology reshaping industry",
    koSummary: "AI·반도체·플랫폼 변화가 기업 경쟁과 규제, 공급망에 어떻게 이어지는지 함께 봅니다.",
    enSummary: "How AI, chips and platform shifts connect to competition, regulation and supply chains.",
    matches: (event) => event.category === "기술" || event.briefWhy === "technology",
  },
  {
    code: "climate",
    koTitle: "기후·재난이 바꾸는 하루",
    enTitle: "Climate and disasters shaping the day",
    koSummary: "재난 뉴스는 피해 숫자만이 아니라 이동·에너지·안전과 공식 대응까지 함께 봐야 합니다.",
    enSummary: "Disaster stories matter beyond damage counts, affecting transport, energy, safety and official response.",
    matches: (event) => event.category === "재난" || event.briefWhy === "disaster",
  },
];

export function buildWorldFlows(events: NewsEvent[], lang: Language, limit = 3): WorldFlow[] {
  const candidates = flowRules.map((rule) => {
    const matched = events.filter(rule.matches).sort((a, b) => b.importanceScore - a.importanceScore).slice(0, 3);
    const score = matched.reduce((sum, event, index) => sum + event.importanceScore / (index + 1), 0) + matched.length * 1.5;
    return {
      code: rule.code,
      title: lang === "ko" ? rule.koTitle : rule.enTitle,
      summary: lang === "ko" ? rule.koSummary : rule.enSummary,
      eventIds: matched.map((event) => event.id),
      score,
    } satisfies WorldFlow;
  }).filter((flow) => flow.eventIds.length > 0);

  return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function koreaImpact(event: NewsEvent, lang: Language): string | null {
  if (event.scope === "domestic") {
    return lang === "ko"
      ? "이미 한국에 직접 연결된 뉴스입니다. 발표·논의가 실제 제도와 생활 변화로 이어지는지 확인하는 것이 핵심입니다."
      : "This story already affects Korea directly. The key is whether the announcement or debate turns into a concrete institutional or daily-life change.";
  }

  const text = event.articles.map((article) => `${article.title} ${article.description}`).join(" ").toLowerCase();

  const rules: Array<{ pattern: RegExp; ko: string; en: string }> = [
    {
      pattern: /hormuz|호르무즈|oil|crude|원유|유가|middle east|중동|iran|이란/,
      ko: "한국은 에너지 수입 의존도가 높아, 공급 차질이나 운송 불안이 커지면 국제유가·운임·수입물가를 통해 영향을 받을 수 있습니다.",
      en: "Korea depends heavily on imported energy, so supply or shipping disruptions can feed into oil prices, freight costs and import inflation.",
    },
    {
      pattern: /federal reserve|\bfed\b|fomc|연준|interest rate|rate cut|rate hike|금리|dollar|달러/,
      ko: "미국 금리와 달러의 방향은 원·달러 환율, 외국인 자금 흐름, 한국은행의 정책 판단과 국내 금융시장에 영향을 줄 수 있습니다.",
      en: "U.S. rates and the dollar can affect the won-dollar exchange rate, foreign capital flows, Bank of Korea decisions and Korean markets.",
    },
    {
      pattern: /tariff|관세|trade|무역|china|중국|united states|미국|supply chain|공급망/,
      ko: "한국은 수출과 글로벌 공급망 비중이 커서, 주요국의 관세·무역 규칙 변화가 자동차·반도체·배터리 같은 산업에 연결될 수 있습니다.",
      en: "Korea is highly exposed to exports and global supply chains, so tariff and trade-rule changes can reach industries such as autos, chips and batteries.",
    },
    {
      pattern: /semiconductor|chip|반도체|nvidia|ai\b|artificial intelligence|인공지능/,
      ko: "반도체와 AI 산업의 변화는 한국의 주요 수출기업, 투자, 공급망 경쟁과 직접 연결될 가능성이 큽니다.",
      en: "Changes in chips and AI are closely tied to Korea's major exporters, investment and supply-chain competition.",
    },
    {
      pattern: /north korea|북한|nuclear|핵|missile|미사일|nato|나토|ukraine|우크라이나|russia|러시아/,
      ko: "직접적인 영향은 사건마다 다르지만, 안보 환경과 에너지 가격, 한국의 외교·방산 판단에 간접적으로 연결될 수 있습니다.",
      en: "The direct effect varies by event, but it can connect indirectly to Korea's security environment, energy prices, diplomacy and defence policy.",
    },
  ];

  const matched = rules.find((rule) => rule.pattern.test(text));
  return matched ? (lang === "ko" ? matched.ko : matched.en) : null;
}

export function historicalOneLiner(event: NewsEvent, lang: Language, history?: string | null) {
  if (!history) return null;
  return lang === "ko" ? `지금만 보면 놓치는 배경 · ${history}` : `Background beyond today's headline · ${history}`;
}

export function dailyMemoryLine(flows: WorldFlow[], lang: Language) {
  const names = flows.map((flow) => flow.title);
  if (!names.length) {
    return lang === "ko" ? "오늘은 아직 충분한 사건 흐름을 만들 만큼 데이터가 모이지 않았습니다." : "There is not enough collected data yet to build a reliable picture of today's main currents.";
  }
  if (lang === "ko") {
    return `오늘은 ${names.join(" · ")} 흐름을 중심으로 보면 한국과 세계의 큰 그림이 정리됩니다.`;
  }
  return `Today's big picture is easiest to understand through these currents: ${names.join(" · ")}.`;
}
