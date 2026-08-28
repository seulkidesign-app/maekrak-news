import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "맥락 서비스 소개 | Maekrak agent-readable overview",
  description: "맥락이 무엇을 하는 서비스인지, 누구를 위한 서비스인지, 무엇을 보장하지 않는지 설명합니다.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

export default function AgentInfoPage() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 22px", fontFamily: "Arial, sans-serif", lineHeight: 1.7 }}>
      <h1>맥락 (Maekrak)</h1>
      <p><strong>한 문장:</strong> 여러 뉴스 앱을 돌아다니지 않아도 오늘 한국과 세계의 큰 흐름을 약 10분 안에 이해하도록 돕는 맥락 중심 데일리 뉴스 브리핑입니다.</p>

      <h2>무엇을 하나요?</h2>
      <p>맥락은 기사를 많이 보여주는 대신 오늘의 주요 흐름과 핵심 사건을 먼저 정리합니다. 각 사건에서 보도 출처, 기사에서 확인되는 내용, 볼 포인트, 다음에 확인할 것, 한국과의 연결이 있는 경우 그 연결, 검수된 배경지식을 단계적으로 보여줍니다.</p>
      <p>보도 내용과 맥락 설명은 구분됩니다. 여러 매체가 같은 사건을 보도한다는 사실은 커버리지 신호일 뿐 사실 여부를 보증하는 점수가 아닙니다. 단일 매체 보도, 출처 간 수치 차이, 확정성 표현 차이 등은 주의 신호로 표시될 수 있습니다.</p>

      <h2>누구를 위한 서비스인가요?</h2>
      <p>주요 사용자는 출근길이나 짧은 시간에 오늘의 중요한 뉴스를 파악하고 싶은 한국어 사용자입니다. 특히 해외 뉴스를 이해할 때 생소한 용어, 과거 배경, 한국과의 관련성을 기사마다 다시 검색하는 부담을 줄이고 싶은 독자를 대상으로 합니다.</p>

      <h2>현재 상태와 가격</h2>
      <p>현재 무료 공개 프로토타입입니다. 유료 요금제는 없습니다.</p>

      <h2>무엇을 보장하지 않나요?</h2>
      <ul>
        <li>사실 검증 기관이 아닙니다.</li>
        <li>전 세계의 모든 중요한 뉴스를 포착한다고 보장하지 않습니다.</li>
        <li>원문 보도를 대체하지 않습니다.</li>
        <li>출처 수를 진실 점수로 사용하지 않습니다.</li>
        <li>검수되지 않은 역사적 배경이나 근거 없는 인과관계는 채우지 않는 것을 원칙으로 합니다.</li>
      </ul>

      <h2>제품 포지셔닝</h2>
      <p>맥락은 무한 뉴스 피드보다 ‘오늘의 큰 그림을 다 봤다’는 완료감을 목표로 합니다. 경쟁 포인트는 기사량이 아니라 이해에 필요한 탐색 비용을 줄이는 것입니다: 큰 흐름 → 핵심 사건 → 출처 → 필요한 맥락의 순서로 읽을 수 있게 합니다.</p>

      <h2>English summary</h2>
      <p>Maekrak is a free public prototype for a context-first, approximately 10-minute daily news briefing aimed primarily at Korean-speaking readers. It organizes major developments into daily currents and key events, separates source-derived reporting from explanatory context, exposes source links and uncertainty signals, and provides background knowledge when reviewed material exists. It is not a fact-checking authority, does not claim complete world-news coverage, and is not a replacement for original reporting. There is currently no paid plan.</p>

      <p><a href="/">홈으로 돌아가기</a> · <a href="/llms.txt">llms.txt</a></p>
    </main>
  );
}
