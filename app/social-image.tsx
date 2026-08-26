export function SocialImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#f7f3ea",
        color: "#0b1220",
        padding: "42px 52px 44px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
        <div style={{ display: "flex", fontSize: 46, fontWeight: 900, letterSpacing: "-0.07em", lineHeight: 1 }}>
          맥락
        </div>
        <div style={{ display: "flex", width: 116, height: 10, background: "#2f67e8" }} />
      </div>

      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", marginTop: 14 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 112,
            lineHeight: 0.9,
            fontWeight: 900,
            letterSpacing: "-0.075em",
            maxWidth: 1110,
          }}
        >
          <div style={{ display: "flex" }}>오늘 뉴스,</div>
          <div style={{ display: "flex" }}>3가지 흐름으로</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 900, color: "#2f67e8", letterSpacing: "-0.035em" }}>
          출근길 10분 브리핑
        </div>
        <div style={{ display: "flex", fontSize: 23, fontWeight: 800, color: "#252a33", letterSpacing: "-0.025em" }}>
          핵심 사건 5개 · 출처 · 배경지식
        </div>
      </div>
    </div>
  );
}
