import type { Language } from "@/lib/i18n";
import type { NewsEvent } from "@/lib/news";
import { canonicalSourceName } from "./source-normalize.ts";

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
  return event.articles
    .filter((article) => canonicalSourceName(article.source) !== "Unverified source")
    .map((article) => `${article.title} ${article.description}`)
    .join(" ")
    .toLowerCase();
}

const trustedImpactSources = new Set([
  "Reuters", "AP", "연합뉴스", "BBC", "KBS", "SBS", "MBC", "CNN", "Al Jazeera", "DW", "NHK",
]);

function trustedEventText(event: NewsEvent) {
  return event.articles
    .filter((article) => trustedImpactSources.has(canonicalSourceName(article.source)))
    .map((article) => `${article.title} ${article.description}`)
    .join(" ")
    .toLowerCase();
}

function signatures(event: NewsEvent, code: WorldFlowCode) {
  const text = eventText(event);
  const found = new Set<string>();
  const add = (id: string, pattern: RegExp) => { if (pattern.test(text)) found.add(id); };

  if (code === "security") {
    add("middle-east", /\b(?:iran|israel|gaza|hormuz|syria|oman)\b|이란|이스라엘|가자|palestin|팔레스타인|호르무즈|시리아|오만|\bmiddle east\b|중동/);
    add("russia-ukraine", /\b(?:russia|ukraine)\b|러시아|우크라이나/);
    add("korea-security", /\b(?:north korea|south korea|korean peninsula)\b|북한|대한민국|한반도/);
    add("sanctions", /\bsanctions?\b|제재/);
    add("ceasefire", /\b(?:ceasefire|truce)\b|휴전/);
    add("election", /\b(?:election|vote)\b|선거|투표/);
  }

  if (code === "economy") {
    add("rates", /\b(?:federal reserve|fed|fomc|interest rates?|bonds?)\b|연준|금리|채권/);
    add("inflation", /\b(?:inflation|consumer prices?)\b|물가|소비자물가/);
    add("trade", /\b(?:tariffs?|trade|exports?|imports?)\b|\bsupply chain\b|관세|무역|수출|수입|공급망/);
    add("energy", /\b(?:oil|crude|gas|hormuz)\b|유가|원유|가스|호르무즈/);
    add("currency", /\b(?:dollar|yuan|yen|exchange rate)\b|달러|환율|위안|엔화/);
    add("markets", /\b(?:stocks?|markets?|treasur(?:y|ies))\b|증시|주가|시장|국채/);
  }

  if (code === "korea") {
    add("police-justice", /\b(?:police|prosecut(?:or|ors|ion)?|court)\b|경찰|검찰|수사|법원|사법/);
    add("housing", /\b(?:housing|real estate)\b|주택|주거|부동산/);
    add("party-politics", /\b(?:party|parliament)\b|정당|대표|국민의힘|민주당|개혁신당|국회/);
    add("labor", /\b(?:labor|wage|employment)\b|노동|임금|고용/);
    add("health", /\b(?:health|hospital)\b|의료|병원|건강/);
  }

  if (code === "technology") {
    add("ai", /\b(?:artificial intelligence|ai|openai|nvidia)\b|인공지능/);
    add("chips", /\b(?:semiconductors?|chips?)\b|반도체/);
    add("platform", /\b(?:platform|google|apple|microsoft|meta)\b|플랫폼/);
    add("supply-chain", /\b(?:supply chain|export controls?)\b|공급망|수출 통제/);
  }

  if (code === "climate") {
    add("heat", /\bheatwave\b|폭염|더위/);
    add("flood", /\b(?:flood|heavy rain)\b|홍수|폭우|호우/);
    add("wildfire", /\bwildfire\b|산불/);
    add("storm", /\b(?:typhoon|tornado|storm)\b|태풍|토네이도|폭풍/);
    add("earthquake", /\bearthquake\b|지진/);
  }

  return found;
}

function shareSignature(seed: NewsEvent, candidate: NewsEvent, code: WorldFlowCode) {
  const a = signatures(seed, code);
  const b = signatures(candidate, code);
  if (!a.size || !b.size) return false;
  const shared = [...a].filter((value) => b.has(value));
  if (!shared.length) return false;

  if (code === "security") {
    const regionalThreads = new Set(["middle-east", "russia-ukraine", "korea-security"]);
    return shared.some((value) => regionalThreads.has(value));
  }

  return true;
}

function coherentMatches(rule: FlowRule, events: NewsEvent[]) {
  const uniqueEvents = [...new Map(events.map((event) => [event.id, event])).values()];
  const candidates = uniqueEvents.filter(rule.matches).sort((a, b) => b.importanceScore - a.importanceScore);
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

  const text = trustedEventText(event);
  if (!text) return null;
  const has = (pattern: RegExp) => pattern.test(text);

  const energyRegion = has(/\b(?:hormuz|middle east|iran|gulf)\b|호르무즈|중동|이란|걸프/);
  const energyMechanism = has(/\b(?:oil|crude|shipping|ship|ships|supply|export|exports|sanction|sanctions)\b|원유|유가|운송|해운|공급|수출|제재/);
  if (energyRegion && energyMechanism) {
    return lang === "ko"
      ? "중동의 에너지 공급·운송 변화는 한국의 원유 도입 비용, 운임, 수입물가에 연결될 수 있습니다. 실제 유가·운송 지표가 움직이는지 함께 확인할 필요가 있습니다."
      : "Middle East energy-supply or shipping changes can reach Korea through crude-import costs, freight and import prices. Check whether oil and shipping indicators actually move.";
  }

  const monetaryActor = has(/\b(?:federal reserve|fed|fomc)\b|연준/);
  const monetaryMechanism = has(/\b(?:interest rates?|rate cut|rate hike|dollar|inflation|bonds?)\b|금리|달러|물가|채권/);
  if (monetaryActor && monetaryMechanism) {
    return lang === "ko"
      ? "미 연준의 금리·달러 관련 변화는 원·달러 환율과 자금 흐름을 통해 한국 금융시장에 연결될 수 있습니다. 실제 환율과 한국은행의 후속 판단을 확인해야 합니다."
      : "Fed rate and dollar developments can reach Korean markets through the won-dollar rate and capital flows. Check the actual FX move and Bank of Korea response.";
  }

  const tradeActor = has(/\b(?:united states|u\.s\.?|china|european union|eu|canada)\b|미국|중국|유럽연합|캐나다/);
  const tradeMechanism = has(/\b(?:tariffs?|trade|imports?|exports?|supply chain|export controls?)\b|관세|무역|공급망|수출 통제|수입|수출/);
  if (tradeActor && tradeMechanism) {
    return lang === "ko"
      ? "주요국의 관세·무역 규칙 변화는 한국의 수출기업과 공급망에 영향을 줄 수 있습니다. 자동차·반도체·배터리 등 실제 적용 품목과 시행 시점을 확인해야 합니다."
      : "Tariff and trade-rule changes in major economies can affect Korean exporters and supply chains. Check the products actually covered and the implementation date.";
  }

  const techCore = has(/\b(?:semiconductors?|chips?|artificial intelligence|ai|nvidia)\b|반도체|인공지능/);
  const techMechanism = has(/\b(?:supply chain|exports?|investments?|regulations?|manufacturing|manufacture|production|fabs?)\b|공급망|수출|투자|규제|생산|공장/);
  if (techCore && techMechanism) {
    return lang === "ko"
      ? "반도체·AI 관련 공급망, 투자, 규제 변화는 한국의 주요 기술기업과 수출 산업에 연결될 수 있습니다. 어떤 기업·품목에 실제 적용되는지 확인이 필요합니다."
      : "Chip and AI supply-chain, investment or regulatory changes can reach Korea's major technology companies and exports. Check which firms and products are actually affected.";
  }

  const koreaSecurityMention = has(/\b(?:north korea|south korea|korean peninsula)\b|북한|대한민국|한국|한반도/);
  const securityMechanism = has(/\b(?:nuclear|missiles?|military|defen[cs]e|sanctions?|exercises?)\b|핵|미사일|군사|방위|제재|훈련/);
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