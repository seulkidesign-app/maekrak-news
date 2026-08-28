export default function NotFound() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 22px", fontFamily: "Arial, sans-serif", lineHeight: 1.7 }}>
      <p style={{ fontSize: 13, fontWeight: 700 }}>404 · NOT FOUND</p>
      <h1>이 페이지는 찾을 수 없습니다.</h1>
      <p>주소가 바뀌었거나 존재하지 않는 경로입니다. 오늘의 뉴스 브리핑은 홈에서 계속 확인할 수 있습니다.</p>
      <p lang="en">This page does not exist. Return to the public homepage for today&apos;s briefing, or use the agent-readable overview for a stable description of the service.</p>
      <p>
        <a href="/">홈으로 돌아가기</a> · <a href="/agent-info">서비스 소개</a> · <a href="/llms.txt">llms.txt</a>
      </p>
    </main>
  );
}
