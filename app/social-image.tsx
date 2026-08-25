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
        padding: "64px 72px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.05em" }}>맥락</div>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.16em", color: "#1f55d5" }}>NEWS, WITH CONTEXT</div>
        </div>
        <div style={{ fontSize: 17, color: "#6b6b68" }}>약 10분 브리핑</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 980 }}>
        <div style={{ fontSize: 74, lineHeight: 1.06, fontWeight: 800, letterSpacing: "-0.055em" }}>
          오늘의 한국과 세계를,<br />하나의 흐름으로.
        </div>
        <div style={{ fontSize: 25, lineHeight: 1.5, color: "#454541", maxWidth: 880 }}>
          여러 뉴스 채널을 따로 보지 않아도, 무슨 일이 있었는지부터 왜 중요한지와 배경까지.
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid #cbc9c1", paddingTop: 28 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 850 }}>
          {['무슨 일', '왜 중요', '어려운 용어', '역사적 배경', '다음 장면'].map((label) => (
            <div key={label} style={{ padding: "10px 15px", border: "1px solid #cbc9c1", background: "#fffef9", fontSize: 16, fontWeight: 700 }}>
              {label}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1f55d5" }}>maekrak</div>
      </div>
    </div>
  );
}
