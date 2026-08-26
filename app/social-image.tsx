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
        padding: "52px 58px 48px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 900, letterSpacing: "-0.06em" }}>맥락</div>
          <div style={{ display: "flex", padding: "7px 11px", background: "#1f55d5", color: "#ffffff", fontSize: 13, fontWeight: 900, letterSpacing: "0.08em" }}>
            10분 뉴스 브리핑
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 16, fontWeight: 700, color: "#77736b" }}>NEWS, WITH CONTEXT</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1090 }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 94, lineHeight: 0.98, fontWeight: 900, letterSpacing: "-0.065em" }}>
          <div style={{ display: "flex" }}>오늘 뉴스,</div>
          <div style={{ display: "flex", color: "#1f55d5" }}>3가지 흐름으로.</div>
        </div>
        <div style={{ display: "flex", fontSize: 26, lineHeight: 1.35, fontWeight: 700, color: "#403d38" }}>
          핵심 사건 5개 · 출처 · 한국과의 연결 · 배경지식
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #111111", paddingTop: 18 }}>
        <div style={{ display: "flex", fontSize: 18, fontWeight: 800 }}>
          뉴스를 더 많이 보지 말고, 오늘을 이해하세요.
        </div>
        <div style={{ display: "flex", fontSize: 15, fontWeight: 800, color: "#1f55d5" }}>maekrak</div>
      </div>
    </div>
  );
}
