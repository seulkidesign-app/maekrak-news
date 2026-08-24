import { getNews, type NewsItem } from "@/lib/news";

export const revalidate = 900;

const terms: Record<string, { simple: string; context: string; deep: string }> = {
  "기준금리": {
    simple: "중앙은행이 경제의 돈값을 조절할 때 기준이 되는 금리예요.",
    context: "오르면 대출 부담이 커지고 소비·투자가 줄어 물가를 낮추는 방향으로 작용할 수 있어요.",
    deep: "환율, 주택시장, 기업 투자와도 연결됩니다. 다만 실제 영향은 경기와 시장 기대에 따라 달라져요."
  },
  "나토": {
    simple: "북미와 유럽 국가들이 만든 군사 동맹이에요.",
    context: "한 회원국에 대한 공격을 동맹 전체의 문제로 본다는 원칙 때문에 안보 뉴스에서 중요해요.",
    deep: "회원국 확대, 방위비, 러시아와의 관계가 유럽 안보 질서와 직접 연결됩니다."
  },
  "국지성 호우": {
    simple: "좁은 지역에 짧은 시간 동안 매우 많은 비가 집중되는 현상이에요.",
    context: "같은 도시 안에서도 특정 지역만 침수되거나 피해가 크게 날 수 있어요.",
    deep: "대기 불안정, 지형, 도시 배수 능력이 피해 규모를 좌우해 단순 강수량만으로 위험을 판단하기 어렵습니다."
  },
  "나일강": {
    simple: "아프리카 여러 나라를 지나 지중해로 흐르는 큰 강이에요.",
    context: "상류의 댐과 물 사용이 하류 국가의 농업·전력·생활용수에 영향을 줄 수 있어요.",
    deep: "에티오피아의 대형 댐 운영과 이집트·수단의 물 안보가 얽혀 있어 외교 갈등의 핵심 자원이 됩니다."
  }
};

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function findTerm(item: NewsItem) {
  return Object.keys(terms).find((term) => `${item.title} ${item.description}`.includes(term));
}

export default async function Home() {
  const news = await getNews();
  const updatedAt = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top">맥락</a>
        <nav><a href="#news">오늘의 뉴스</a><a href="#principles">원칙</a></nav>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">알수록 보이는 뉴스</div>
        <h1>뉴스를 읽었는데,<br />왜 중요한지는 모르겠다면.</h1>
        <p>무슨 일이 일어났는지부터, 그 일이 왜 생겼고 무엇과 연결되는지까지. 필요한 만큼만 깊게 읽어보세요.</p>
        <div className="status"><span className="dot" /> 최근 갱신 {updatedAt} · 최대 15분 캐시</div>
      </section>

      <section className="levels">
        <div><span>01</span><strong>한눈에</strong><p>지금 무슨 일이 일어났는지.</p></div>
        <div><span>02</span><strong>맥락 보기</strong><p>왜 이 단어와 배경이 중요한지.</p></div>
        <div><span>03</span><strong>깊이 이해</strong><p>역사·정치·경제의 연결고리까지.</p></div>
      </section>

      <section className="section" id="news">
        <div className="sectionHead"><div><div className="eyebrow">LIVE FEED</div><h2>오늘의 국내외 뉴스</h2></div><p>{news.length}개의 최신 기사 · 출처 원문으로 이동</p></div>
        {news.length === 0 ? (
          <div className="empty">현재 뉴스 피드를 불러오지 못했습니다. 잠시 뒤 새로고침해 주세요.</div>
        ) : (
          <div className="grid">
            {news.map((item, index) => {
              const term = findTerm(item);
              const explainer = term ? terms[term] : null;
              return (
                <article className="card" key={`${item.link}-${index}`}>
                  <div className="meta"><span>{item.category}</span><span>{item.source}</span><span>{relativeTime(item.publishedAt)}</span></div>
                  <h3>{item.title}</h3>
                  {item.description && <p className="summary">{item.description.slice(0, 155)}{item.description.length > 155 ? "…" : ""}</p>}
                  {explainer && (
                    <details>
                      <summary><span>알아두면 이해되는 말</span><b>{term}</b></summary>
                      <div className="context">
                        <div><small>한눈에</small><p>{explainer.simple}</p></div>
                        <div><small>맥락 보기</small><p>{explainer.context}</p></div>
                        <div><small>깊이 이해</small><p>{explainer.deep}</p></div>
                      </div>
                    </details>
                  )}
                  <a className="sourceLink" href={item.link} target="_blank" rel="noreferrer">원문에서 확인 ↗</a>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="principles" id="principles">
        <div><div className="eyebrow">HOW WE READ</div><h2>맥락의 원칙</h2></div>
        <div className="principleGrid">
          <p><strong>사실과 해석을 구분합니다.</strong> 정치인·정당을 평가하기보다 확인된 사실과 각 주체의 주장을 분리합니다.</p>
          <p><strong>원문을 숨기지 않습니다.</strong> 모든 기사에서 출처와 원문 링크를 바로 확인할 수 있습니다.</p>
          <p><strong>모르는 것은 단정하지 않습니다.</strong> 배경 설명은 이해를 돕기 위한 것이며, 확인되지 않은 추론을 사실처럼 쓰지 않습니다.</p>
          <p><strong>쉬워도 얕지 않게.</strong> 한 문장 정의에서 시작해 필요할 때 역사·정치·경제의 연결까지 내려갑니다.</p>
        </div>
      </section>

      <footer>맥락 · 뉴스를 이해하기 위한 작은 지도</footer>
    </main>
  );
}
