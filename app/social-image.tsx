export function SocialImage() {
  const chips = ["오늘의 3대 흐름", "핵심 사건 5개", "한국에는?", "역사적 배경"];

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
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: "-0.05em" }}>맥락</div>
          <div style={{ display: "flex", fontSize: 15, fontWeight: 800, letterSpacing: "0.16em", color: "#1f55d5" }}>DAILY WORLD BRIEF</div>
        </div>
        <div style={{ display: "flex", fontSize: 17, color: "#6b6b68" }}>약 10분</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1000 }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 72, lineHeight: 1.05, fontWeight: 800, letterSpacing: "-0.055em" }}>
          <div style={{ display: "flex" }}>오늘은 이 3개 흐름만</div>
          <div style={{ display: "flex" }}>잡으면 됩니다.</div>
        </div>
        <div style={{ display: "flex", fontSize: 24, lineHeight: 1.5, color: "#454541", maxWidth: 900 }}>
          여러 뉴스 채널 대신, 오늘 세계의 큰 흐름부터 한국에 미칠 영향과 배경지식까지 한 번에.
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid #cbc9c1", paddingTop: 28 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 900 }}>
          {chips.map((label) => (
            <div key={label} style={{ display: "flex", padding: "10px 15px", border: "1px solid #cbc9c1", background: "#fffef9", fontSize: 16, fontWeight: 700 }}>
              {label}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 18, fontWeight: 800, color: "#1f55d5" }}>maekrak</div>
      </div>
    </div>
  );
}
