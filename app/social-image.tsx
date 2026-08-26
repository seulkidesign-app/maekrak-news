export function SocialImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#f4f2ec",
        color: "#111111",
        padding: "54px 64px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: "-0.05em" }}>맥락</div>
          <div style={{ display: "flex", fontSize: 14, fontWeight: 800, letterSpacing: "0.14em", color: "#1f55d5" }}>DAILY NEWS BRIEF</div>
        </div>
        <div style={{ display: "flex", fontSize: 16, color: "#66635d" }}>약 10분</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1030 }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 61, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.05em" }}>
          <div style={{ display: "flex" }}>뉴스를 더 모으지 않고,</div>
          <div style={{ display: "flex" }}>오늘을 이해하게 합니다.</div>
        </div>
        <div style={{ display: "flex", fontSize: 22, lineHeight: 1.5, color: "#4f4c47", maxWidth: 980 }}>
          여러 뉴스 채널을 돌아다니지 않아도 오늘의 흐름, 핵심 사건, 출처와 배경지식을 한 번에.
        </div>
      </div>

      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 9, padding: "18px 20px", border: "1px solid #c9c6bd", background: "#ebe8df" }}>
          <div style={{ display: "flex", fontSize: 12, fontWeight: 900, letterSpacing: "0.12em", color: "#77736b" }}>PROBLEM</div>
          <div style={{ display: "flex", fontSize: 18, fontWeight: 750, lineHeight: 1.35 }}>기사만 보면 흐름과 배경이 흩어집니다</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 24, color: "#1f55d5" }}>→</div>
        <div style={{ display: "flex", flex: 1.8, flexDirection: "column", gap: 9, padding: "18px 20px", border: "1px solid #aebbe1", background: "#fffef9" }}>
          <div style={{ display: "flex", fontSize: 12, fontWeight: 900, letterSpacing: "0.12em", color: "#1f55d5" }}>MAEKRAK</div>
          <div style={{ display: "flex", fontSize: 18, fontWeight: 800, lineHeight: 1.35 }}>3가지 흐름 → 핵심 5개 → 출처 · 한국 연결 · 배경지식</div>
        </div>
      </div>
    </div>
  );
}
