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
    koSummary: "전쟁·외교·선거·제재처럼 국가의 다음 행동을 바꿀 수 있는 사건을 함께 봅니다.",
    enSummary: "Stories that can change governments' next moves, from conflict and diplomacy to elections and sanctions.",
    matches: (event) => event.briefWhy === "security" || (event.scope === "world" && event.briefWhy === "politics"),
  },
  {
    code: "economy",
    koTitle: "돈의 흐름: 금리·물가·무역",
    enTitle: "Money flows: rates, prices and trade",
    koSummary: "금리·물가·관세·시장 뉴스 가운데 오늘 함께 볼 필요가 있는 사건을 묶었습니다.",
    enSummary: "Today's rates, inflation, tariffs and market stories that are useful to read together.",
    matches: (event) => event.category === "경제" || event.briefWhy === "economy",
  },
  {
    code: "korea",
    koTitle: "한국의 정책과 일상 변화",
    enTitle: "Policy and daily-life change in Korea",
    koSummary: "정치·사회 제도의 변화가 실제 정책과 생활에 어디까지 이어지는지를 함께 봅니다.",
    enSummary: "A view of how Korean political and social developments may turn into concrete policy or daily-life changes.",
    matches: (event) => event.scope === "domestic" && ["정치", "사회", "국내"].includes(event.category),
  },
  {
    code: "technology",
    koTitle: "기술이 산업 질서를 바꾸는 흐름",
    enTitle: "Technology reshaping industry",
    koSummary: "AI·반도체·플랫폼 변화 가운데 기업 경쟁·규제·공급망과 관련된 사건을 함께 봅니다.",
    enSummary: "AI, chips and platform shifts tied to competition, regulation and supply chains.",
    matches: (event) => event.category === "기술" || event.briefWhy === "technology",
  },
  {
    code: "climate",
    koTitle: "기후·재난이 바꾸는 하루",
    enTitle: "Climate and disasters shaping the day",
    koSummary: "재난 뉴스는 피해 숫자뿐 아니라 이동·안전과 공식 대응을 함께 확인합니다.",
    enSummary: "Disaster stories read alongside transport, safety and official response.",
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
      ? "한국에 직접 연결된 뉴스입니다. 발표·논의가 실제 제도와 생활 변화로 이어지는지 확인해 보세요."
      : "This story directly concerns Korea. Watch whether the announcement or debate turns into concrete institutional or daily-life change.";
  }

  const text = event.articles.map((article) => `${article.title} ${article.description}`).join(" ").toLowerCase();
  const has = (pattern: RegExp) => pattern.test(text);

  const energyRegion = has(/hormuz|호르무즈|middle east|중동|iran|이란|gulf|걸프/);
  const energyMechanism = has(/oil|crude|원유|유가|shipping|ship|운송|해운|supply|공급|export|수출|sanction|제재/);
  if (energyRegion && energyMechanism) {
    return lang === "ko"
      ? "중동의 에너지 공급·운송 변화는 한국의 원유 도입 비용, 운임, 수입물가에 연결될 수 있습니다. 실제 유가·운송 지표가 움직이는지 함께 확인할 필요가 있습니다."
      : "Middle East energy-supply or shipping changes can reach Korea through crude-import costs, freight and import prices. Check whether oil and shipping indicators actually move.";
  }

  const monetaryActor = has(/federal reserve|\bfed\b|fomc|연준/);
  const monetaryMechanism = has(/interest rate|rate cut|rate hike|금리|dollar|달러|inflation|물가|bond|채권/);
  if (monetaryActor && monetaryMechanism) {
    return lang === "ko"
      ? "미 연준의 금리·달러 관련 변화는 원·달러 환율과 자금 흐름을 통해 한국 금융시장에 연결될 수 있습니다. 실제 환율과 한국은행의 후속 판단을 확인해야 합니다."
      : "Fed rate and dollar developments can reach Korean markets through the won-dollar rate and capital flows. Check the actual FX move and Bank of Korea response.";
  }

  const tradeActor = has(/united states|\bu\.s\.?\b|미국|china|중국|european union|\beu\b|유럽연합|canada|캐나다/);
  const tradeMechanism = has(/tariff|관세|trade|무역|supply chain|공급망|export control|수출 통제|import|수입|export|수출/);
  if (tradeActor && tradeMechanism) {
    return lang === "ko"
      ? "주요국의 관세·무역 규칙 변화는 한국의 수출기업과 공급망에 영향을 줄 수 있습니다. 자동차·반도체·배터리 등 실제 적용 품목과 시행 시점을 확인해야 합니다."
      : "Tariff and trade-rule changes in major economies can affect Korean exporters and supply chains. Check the products actually covered and the implementation date.";
  }

  const techCore = has(/semiconductor|chip|반도체|artificial intelligence|\bai\b|인공지능|nvidia/);
  const techMechanism = has(/supply chain|공급망|export|수출|investment|투자|regulation|규제|manufactur|생산|fab|공장/);
  if (techCore && techMechanism) {
    return lang === "ko"
      ? "반도체·AI 관련 공급망, 투자, 규제 변화는 한국의 주요 기술기업과 수출 산업에 연결될 수 있습니다. 어떤 기업·품목에 실제 적용되는지 확인이 필요합니다."
      : "Chip and AI supply-chain, investment or regulatory changes can reach Korea's major technology companies and exports. Check which firms and products are actually affected.";
  }

  const koreaSecurityMention = has(/north korea|북한|south korea|대한민국|한국|korean peninsula|한반도/);
  const securityMechanism = has(/nuclear|핵|missile|미사일|military|군사|defen[cs]e|방위|sanction|제재|exercise|훈련/);
  if (koreaSecurityMention && securityMechanism) {
    return lang === "ko"
      ? "한반도 안보와 직접 관련된 요소가 포함된 사건입니다. 정부의 공식 대응과 실제 군사·외교 조치가 이어지는지 확인해야 합니다."
      : "This event contains a direct Korean Peninsula security element. Watch for official responses and concrete military or diplomatic measures.";
  }

  return null;
}

export function historicalOneLiner(event: NewsEvent, lang: Language, history?: string | null) {
  if (!history?.trim()) return null;
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
