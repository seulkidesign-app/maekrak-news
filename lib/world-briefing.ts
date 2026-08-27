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
    koSummary: "같은 지역·협상·안보 축에서 함께 읽을 필요가 있는 사건만 묶습니다.",
    enSummary: "Only stories sharing the same regional, diplomatic or security thread are grouped together.",
    matches: (event) => event.briefWhy === "security" || (event.scope === "world" && event.briefWhy === "politics"),
  },
  {
    code: "economy",
    koTitle: "돈의 흐름: 금리·물가·무역",
    enTitle: "Money flows: rates, prices and trade",
    koSummary: "같은 금리·에너지·무역·시장 축에서 실제로 연결되는 사건을 함께 봅니다.",
    enSummary: "Stories are grouped only when they share a rates, energy, trade or market thread.",
    matches: (event) => event.category === "경제" || event.briefWhy === "economy",
  },
  {
    code: "korea",
    koTitle: "한국의 정책과 일상 변화",
    enTitle: "Policy and daily-life change in Korea",
    koSummary: "한국의 제도·정책 변화 가운데 같은 생활 영역에서 이어지는 사건을 함께 봅니다.",
    enSummary: "Korean policy stories are grouped when they affect the same institutional or daily-life area.",
    matches: (event) => event.scope === "domestic" && ["정치", "사회", "국내"].includes(event.category),
  },
  {
    code: "technology",
    koTitle: "기술이 산업 질서를 바꾸는 흐름",
    enTitle: "Technology reshaping industry",
    koSummary: "AI·반도체·플랫폼 중 같은 산업 축에 놓인 사건만 함께 봅니다.",
    enSummary: "AI, chip and platform stories are grouped only when they share the same industry thread.",
    matches: (event) => event.category === "기술" || event.briefWhy === "technology",
  },
  {
    code: "climate",
    koTitle: "기후·재난이 바꾸는 하루",
    enTitle: "Climate and disasters shaping the day",
    koSummary: "같은 기상·재난 유형이나 지역적 영향이 이어질 때만 함께 봅니다.",
    enSummary: "Disaster stories are grouped only when they share a weather, hazard or regional thread.",
    matches: (event) => event.category === "재난" || event.briefWhy === "disaster",
  },
];

function eventText(event: NewsEvent) {
  return event.articles.map((article) => `${article.title} ${article.description}`).join(" ").toLowerCase();
}

function signatures(event: NewsEvent, code: WorldFlowCode) {
  const text = eventText(event);
  const found = new Set<string>();
  const add = (id: string, pattern: RegExp) => { if (pattern.test(text)) found.add(id); };

  if (code === "security") {
    add("middle-east", /iran|이란|israel|이스라엘|gaza|가자|palestin|팔레스타인|hormuz|호르무즈|syria|시리아|oman|오만|middle east|중동/);
    add("russia-ukraine", /russia|러시아|ukraine|우크라이나/);
    add("korea-security", /north korea|북한|korean peninsula|한반도|missile|미사일/);
    add("sanctions", /sanction|제재/);
    add("ceasefire", /ceasefire|truce|휴전/);
    add("election", /election|선거|vote|투표/);
  }

  if (code === "economy") {
    add("rates", /federal reserve|\bfed\b|fomc|연준|interest rate|금리|bond|채권/);
    add("inflation", /inflation|물가|consumer price|소비자물가/);
    add("trade", /tariff|관세|trade|무역|export|수출|import|수입|supply chain|공급망/);
    add("energy", /oil|crude|유가|원유|gas|가스|hormuz|호르무즈/);
    add("currency", /dollar|달러|exchange rate|환율|yuan|위안|yen|엔화/);
    add("markets", /stock|증시|주가|market|시장|treasury|국채/);
  }

  if (code === "korea") {
    add("police-justice", /경찰|검찰|수사|법원|police|prosecut|court|사법/);
    add("housing", /주택|주거|부동산|용산|탄천|housing|real estate/);
    add("party-politics", /정당|대표|국민의힘|민주당|개혁신당|국회|party|parliament/);
    add("labor", /노동|임금|고용|labor|wage|employment/);
    add("health", /의료|병원|건강|health|hospital/);
  }

  if (code === "technology") {
    add("ai", /artificial intelligence|\bai\b|인공지능|openai|nvidia/);
    add("chips", /semiconductor|chip|반도체/);
    add("platform", /platform|플랫폼|google|apple|microsoft|meta/);
    add("supply-chain", /supply chain|공급망|export control|수출 통제/);
  }

  if (code === "climate") {
    add("heat", /heatwave|폭염|더위/);
    add("flood", /flood|홍수|폭우|호우|heavy rain/);
    add("wildfire", /wildfire|산불/);
    add("storm", /typhoon|태풍|tornado|토네이도|storm|폭풍/);
    add("earthquake", /earthquake|지진/);
  }

  return found;
}

function shareSignature(seed: NewsEvent, candidate: NewsEvent, code: WorldFlowCode) {
  const a = signatures(seed, code);
  const b = signatures(candidate, code);
  if (!a.size || !b.size) return false;
  for (const value of a) if (b.has(value)) return true;
  return false;
}

function coherentMatches(rule: FlowRule, events: NewsEvent[]) {
  const candidates = events.filter(rule.matches).sort((a, b) => b.importanceScore - a.importanceScore);
  const seed = candidates[0];
  if (!seed) return [];
  const result = [seed];
  for (const candidate of candidates.slice(1)) {
    if (result.length >= 3) break;
    if (shareSignature(seed, candidate, rule.code)) result.push(candidate);
  }
  return result;
}

export function buildWorldFlows(events: NewsEvent[], lang: Language, limit = 3): WorldFlow[] {
  const candidates = flowRules.map((rule) => {
    const matched = coherentMatches(rule, events);
    const score = matched.reduce((sum, event, index) => sum + event.importanceScore / (index + 1), 0) + matched.length * 1.2;
    return {
      code: rule.code,
      title: lang === "ko" ? rule.koTitle : rule.enTitle,
      summary: lang === "ko" ? rule.koSummary : rule.enSummary,
      eventIds: matched.map((event) => event.id),
      score,
    } satisfies WorldFlow;
  }).filter((flow) => flow.eventIds.length >= 2);

  return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function koreaImpact(event: NewsEvent, lang: Language): string | null {
  if (event.scope === "domestic") {
    return lang === "ko"
      ? "한국에 직접 연결된 뉴스입니다. 발표·논의가 실제 제도와 생활 변화로 이어지는지 확인해 보세요."
      : "This story directly concerns Korea. Watch whether the announcement or debate turns into concrete institutional or daily-life change.";
  }

  const text = eventText(event);
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
    return `오늘은 ${names.join(" · ")} 축을 중심으로 보면 한국과 세계의 큰 그림을 정리하기 쉽습니다.`;
  }
  return `Today's big picture is easiest to read through these threads: ${names.join(" · ")}.`;
}
