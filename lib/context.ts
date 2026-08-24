import type { NewsEvent } from "@/lib/news";

export type ContextConcept = {
  id: string;
  term: string;
  aliases: string[];
  simple: string;
  context: string;
  deep: string;
  kind: "경제" | "정치" | "국제" | "기후" | "기술" | "지리";
  referenceLabel: string;
  referenceUrl: string;
};

export type DetectedContext = ContextConcept & {
  matchedBy: string[];
  confidence: "높음" | "보통";
};

const concepts: ContextConcept[] = [
  {
    id: "interest-rate",
    term: "기준금리",
    aliases: ["기준금리", "금리 인상", "금리 인하", "interest rate", "rate cut", "rate hike", "central bank"],
    simple: "중앙은행이 시중 금리에 영향을 주기 위해 기준으로 삼는 금리예요.",
    context: "변화하면 대출·예금 금리와 소비·투자에 영향을 주기 때문에 물가와 경기 뉴스에서 중요합니다.",
    deep: "환율·주택시장·기업 투자에도 연결되지만 실제 효과는 경기 상황과 시장 기대에 따라 달라질 수 있습니다.",
    kind: "경제",
    referenceLabel: "한국은행 경제용어",
    referenceUrl: "https://www.bok.or.kr/portal/main/main.do"
  },
  {
    id: "fed",
    term: "미 연준(Fed)",
    aliases: ["연준", "fed ", "federal reserve", "fomc", "파월", "powell"],
    simple: "미국의 중앙은행 역할을 하는 연방준비제도예요.",
    context: "미국 금리 결정은 달러와 글로벌 자금 흐름에 영향을 주기 때문에 한국 금융시장에도 연결됩니다.",
    deep: "연준은 물가 안정과 고용을 함께 고려하며, 실제 시장 반응은 결정 자체뿐 아니라 향후 정책 신호에 크게 좌우됩니다.",
    kind: "경제",
    referenceLabel: "Federal Reserve",
    referenceUrl: "https://www.federalreserve.gov/"
  },
  {
    id: "tariff",
    term: "관세",
    aliases: ["관세", "tariff", "무역전쟁", "trade war"],
    simple: "국경을 넘어 들어오는 상품에 붙이는 세금이에요.",
    context: "높아지면 수입품 가격과 기업 비용이 오를 수 있고 상대국의 보복 조치로 이어질 수 있습니다.",
    deep: "관세는 무역수지뿐 아니라 공급망·환율·산업정책과 연결되어 국가 간 협상 수단으로도 사용됩니다.",
    kind: "경제",
    referenceLabel: "WTO",
    referenceUrl: "https://www.wto.org/"
  },
  {
    id: "inflation",
    term: "인플레이션",
    aliases: ["인플레이션", "물가 상승", "inflation", "cpi", "소비자물가"],
    simple: "전반적인 상품과 서비스 가격 수준이 지속적으로 오르는 현상이에요.",
    context: "생활비와 실질소득에 직접 영향을 주고 중앙은행의 금리 결정에도 중요한 기준이 됩니다.",
    deep: "수요 증가, 공급 충격, 임금, 환율 등 여러 요인이 동시에 작용할 수 있어 원인을 하나로 단정하기 어렵습니다.",
    kind: "경제",
    referenceLabel: "한국은행",
    referenceUrl: "https://www.bok.or.kr/"
  },
  {
    id: "exchange-rate",
    term: "환율",
    aliases: ["환율", "원·달러", "원달러", "exchange rate", "won", "dollar"],
    simple: "한 나라의 돈을 다른 나라 돈으로 바꿀 때의 교환 비율이에요.",
    context: "원화 가치가 변하면 수입 물가, 해외여행 비용, 수출기업 실적 등에 영향을 줄 수 있습니다.",
    deep: "금리 차이·무역·위험 회피 심리·정책 기대가 함께 영향을 주기 때문에 한 요인만으로 움직이지 않습니다.",
    kind: "경제",
    referenceLabel: "한국은행",
    referenceUrl: "https://www.bok.or.kr/"
  },
  {
    id: "nato",
    term: "나토(NATO)",
    aliases: ["나토", "nato", "북대서양조약기구"],
    simple: "북미와 유럽 국가들이 만든 군사 동맹이에요.",
    context: "한 회원국에 대한 공격을 동맹 전체의 문제로 보는 집단방위 원칙 때문에 안보 뉴스에서 중요합니다.",
    deep: "회원국 확대, 방위비 분담, 러시아와의 관계가 유럽 안보 질서와 직접 연결됩니다.",
    kind: "국제",
    referenceLabel: "NATO",
    referenceUrl: "https://www.nato.int/"
  },
  {
    id: "ceasefire",
    term: "휴전",
    aliases: ["휴전", "ceasefire", "truce"],
    simple: "전쟁을 완전히 끝내는 평화협정과 달리 일정 기간 전투를 멈추기로 하는 합의예요.",
    context: "민간인 보호와 인도적 지원, 협상을 위한 시간을 만들 수 있지만 갈등 해결 자체를 뜻하지는 않습니다.",
    deep: "누가 합의를 보장하고 어떤 행동을 위반으로 판단하는지가 실제 지속 가능성을 좌우합니다.",
    kind: "국제",
    referenceLabel: "UN Peacemaker",
    referenceUrl: "https://peacemaker.un.org/"
  },
  {
    id: "sanctions",
    term: "경제 제재",
    aliases: ["제재", "경제제재", "sanction", "sanctions"],
    simple: "특정 국가·기관·개인의 거래나 자산 이용을 제한하는 외교·경제 수단이에요.",
    context: "군사 행동 없이 압박할 수 있지만 무역·금융시장과 일반 시민의 생활에도 영향을 줄 수 있습니다.",
    deep: "제재 효과는 참여 국가의 범위, 우회 거래 가능성, 대상 국가의 경제 구조에 따라 크게 달라집니다.",
    kind: "국제",
    referenceLabel: "UN Security Council",
    referenceUrl: "https://main.un.org/securitycouncil/"
  },
  {
    id: "unsc",
    term: "유엔 안전보장이사회",
    aliases: ["안보리", "유엔 안전보장이사회", "security council", "unsc"],
    simple: "국제 평화와 안보 문제를 다루는 유엔의 핵심 기관이에요.",
    context: "제재나 평화유지 활동 같은 중요한 결정을 할 수 있어 국제 분쟁 뉴스에서 자주 등장합니다.",
    deep: "미국·중국·러시아·영국·프랑스 5개 상임이사국은 거부권을 갖고 있어 합의가 막히는 경우가 있습니다.",
    kind: "국제",
    referenceLabel: "UN Security Council",
    referenceUrl: "https://main.un.org/securitycouncil/"
  },
  {
    id: "eu",
    term: "유럽연합(EU)",
    aliases: ["유럽연합", " eu ", "european union"],
    simple: "유럽 국가들이 경제·정치적으로 협력하기 위해 만든 연합체예요.",
    context: "무역, 개인정보, 환경, 경쟁정책 같은 규칙이 회원국뿐 아니라 글로벌 기업에도 영향을 줍니다.",
    deep: "EU는 하나의 국가가 아니며 외교·재정 등 영역마다 회원국과 EU 기관의 권한이 다릅니다.",
    kind: "국제",
    referenceLabel: "European Union",
    referenceUrl: "https://european-union.europa.eu/"
  },
  {
    id: "impeachment",
    term: "탄핵",
    aliases: ["탄핵", "impeachment"],
    simple: "고위 공직자가 헌법이나 법률을 위반했는지 판단해 직무에서 물러나게 할 수 있는 절차예요.",
    context: "정치적 비판과 법적 탄핵 사유는 같은 것이 아니므로 절차와 판단 기관을 구분해서 봐야 합니다.",
    deep: "국가마다 발의·의결·최종 심판 구조가 달라 다른 나라 사례를 그대로 비교하기 어렵습니다.",
    kind: "정치",
    referenceLabel: "대한민국 헌법재판소",
    referenceUrl: "https://www.ccourt.go.kr/"
  },
  {
    id: "referendum",
    term: "국민투표",
    aliases: ["국민투표", "referendum"],
    simple: "중요한 국가 사안을 유권자가 직접 투표로 결정하거나 의견을 표시하는 제도예요.",
    context: "일반 선거와 달리 특정 정책·헌법·독립 같은 하나의 쟁점이 중심이 됩니다.",
    deep: "법적 구속력이 있는지, 투표 문항이 어떻게 설계됐는지에 따라 정치적 의미가 달라질 수 있습니다.",
    kind: "정치",
    referenceLabel: "대한민국 중앙선거관리위원회",
    referenceUrl: "https://www.nec.go.kr/"
  },
  {
    id: "local-heavy-rain",
    term: "국지성 호우",
    aliases: ["국지성 호우", "집중호우", "극한호우", "heavy rain", "torrential rain"],
    simple: "좁은 지역에 짧은 시간 동안 많은 비가 집중되는 현상이에요.",
    context: "같은 도시 안에서도 특정 지역만 침수되거나 피해가 크게 날 수 있습니다.",
    deep: "대기 불안정, 지형, 도시 배수 능력이 피해 규모를 바꿔 단순 강수량만으로 위험을 판단하기 어렵습니다.",
    kind: "기후",
    referenceLabel: "기상청",
    referenceUrl: "https://www.weather.go.kr/"
  },
  {
    id: "typhoon",
    term: "태풍",
    aliases: ["태풍", "typhoon", "tropical cyclone"],
    simple: "따뜻한 열대 바다에서 발달하는 강한 저기압성 폭풍이에요.",
    context: "중심 경로뿐 아니라 강풍 반경과 비구름 분포 때문에 멀리 떨어진 지역에도 피해가 생길 수 있습니다.",
    deep: "진로 예측에는 불확실성이 있으므로 한 시점의 예상 경로보다 최신 기상청 정보를 계속 확인해야 합니다.",
    kind: "기후",
    referenceLabel: "기상청",
    referenceUrl: "https://www.weather.go.kr/"
  },
  {
    id: "nile",
    term: "나일강",
    aliases: ["나일강", "nile", "gerd", "그랜드 에티오피아 르네상스 댐"],
    simple: "아프리카 여러 나라를 지나 지중해로 흐르는 큰 강이에요.",
    context: "상류의 댐과 물 사용은 하류 국가의 농업·전력·생활용수와 연결될 수 있습니다.",
    deep: "특히 에티오피아의 GERD 운영과 이집트·수단의 물 안보가 얽혀 국가 간 협상의 핵심 의제가 되어 왔습니다.",
    kind: "지리",
    referenceLabel: "Nile Basin Initiative",
    referenceUrl: "https://nilebasin.org/"
  },
  {
    id: "hormuz",
    term: "호르무즈 해협",
    aliases: ["호르무즈", "hormuz"],
    simple: "페르시아만과 외해를 잇는 좁은 해상 통로예요.",
    context: "중동산 원유와 가스의 주요 수송로라 긴장이 높아지면 국제 에너지 시장이 민감하게 반응할 수 있습니다.",
    deep: "실제 가격 영향은 통항 차질의 규모·기간, 대체 공급 능력, 시장 기대에 따라 달라집니다.",
    kind: "지리",
    referenceLabel: "U.S. EIA",
    referenceUrl: "https://www.eia.gov/"
  },
  {
    id: "semiconductor",
    term: "반도체 공급망",
    aliases: ["반도체", "semiconductor", "chip", "칩스법", "chips act"],
    simple: "반도체는 설계·장비·소재·제조·패키징이 여러 나라와 기업에 나뉜 복잡한 산업이에요.",
    context: "한 국가의 수출규제나 보조금 정책이 다른 국가의 생산과 가격, 기술 경쟁에 연쇄적으로 영향을 줄 수 있습니다.",
    deep: "첨단 공정은 소수 기업과 장비 공급사에 집중돼 있어 경제정책과 안보정책이 함께 움직이는 분야입니다.",
    kind: "기술",
    referenceLabel: "OECD Digital Economy",
    referenceUrl: "https://www.oecd.org/digital/"
  },
  {
    id: "ai-regulation",
    term: "AI 규제",
    aliases: ["ai 규제", "ai법", "ai act", "인공지능법", "artificial intelligence act"],
    simple: "인공지능을 어디까지, 어떤 책임 아래 사용할지 정하는 법과 제도예요.",
    context: "서비스 제공자의 의무, 개인정보, 저작권, 안전성 기준이 제품 개발 방식에 직접 영향을 줄 수 있습니다.",
    deep: "국가마다 위험 분류와 집행 방식이 달라 글로벌 서비스는 여러 규정을 동시에 고려해야 할 수 있습니다.",
    kind: "기술",
    referenceLabel: "European Commission AI Act",
    referenceUrl: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai"
  }
];

function normalize(text: string) {
  return ` ${text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim()} `;
}

export function detectContext(event: NewsEvent): DetectedContext[] {
  const fullText = normalize([
    event.title,
    event.summary,
    ...event.articles.flatMap((article) => [article.title, article.description])
  ].join(" "));

  return concepts
    .map((concept) => {
      const matchedBy = concept.aliases.filter((alias) => fullText.includes(normalize(alias).trim()));
      if (!matchedBy.length) return null;
      const primaryMatch = matchedBy.some((alias) => normalize(event.title).includes(normalize(alias).trim()));
      return {
        ...concept,
        matchedBy,
        confidence: primaryMatch || matchedBy.length >= 2 ? "높음" as const : "보통" as const,
        score: (primaryMatch ? 4 : 0) + matchedBy.length
      };
    })
    .filter((item): item is DetectedContext & { score: number } => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score: _score, ...item }) => item);
}
