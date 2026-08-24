import { getEvents, type NewsEvent } from "@/lib/news";

export const revalidate = 900;

type Knowledge = { simple: string; context: string; deep: string };

const knowledge: Record<string, Knowledge> = {
  "기준금리": {
    simple: "중앙은행이 경제의 돈값을 조절할 때 기준이 되는 금리예요.",
    context: "금리가 오르면 대출 부담이 커지고 소비·투자가 줄어 물가를 낮추는 방향으로 작용할 수 있어요.",
    deep: "환율·주택시장·기업 투자까지 연결되지만, 실제 영향은 경기와 시장 기대에 따라 달라집니다."
  },
  "나토": {
    simple: "북미와 유럽 국가들이 만든 군사 동맹이에요.",
    context: "한 회원국에 대한 공격을 동맹 전체의 문제로 보는 원칙 때문에 안보 뉴스에서 중요해요.",
    deep: "회원국 확대, 방위비, 러시아와의 관계가 유럽 안보 질서와 직접 연결됩니다."
  },
  "국지성 호우": {
    simple: "좁은 지역에 짧은 시간 동안 많은 비가 집중되는 현상이에요.",
    context: "같은 도시 안에서도 특정 지역만 침수되거나 피해가 크게 날 수 있어요.",
    deep: "대기 불안정, 지형, 도시 배수 능력이 피해 규모를 바꿔 단순 강수량만으로 위험을 판단하기 어렵습니다."
  },
  "나일강": {
    simple: "아프리카 여러 나라를 지나 지중해로 흐르는 큰 강이에요.",
    context: "상류의 댐과 물 사용이 하류 국가의 농업·전력·생활용수에 영향을 줄 수 있어요.",
    deep: "에티오피아의 대형 댐 운영과 이집트·수단의 물 안보가 얽혀 있어 외교 갈등의 핵심 자원이 됩니다."
  },
  "관세": {
    simple: "국경을 넘어 들어오는 상품에 붙이는 세금이에요.",
    context: "관세가 높아지면 수입품 가격과 기업 비용이 오르고, 상대국의 보복 조치로 이어질 수 있어요.",
    deep: "무역수지뿐 아니라 공급망, 환율, 산업정책과 연결되기 때문에 국가 간 협상 수단으로도 쓰입니다."
  },
  "휴전": {
    simple: "싸움을 완전히 끝내는 평화협정과 달리, 일정 기간 전투를 멈추기로 합의하는 거예요.",
    context: "인도적 지원과 협상의 시간을 만들 수 있지만 휴전 자체가 갈등 해결을 뜻하지는 않아요.",
    deep: "누가 무엇을 보장하고 어떤 조건에서 위반으로 판단하는지가 실제 지속 가능성을 좌우합니다."
  }
};

function relativeTime(date: string) {
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return "시간 확인 중";
  const mins = Math.max(1, Math.floor((Date.now() - time) / 60000));
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function findKnowledge(event: NewsEvent) {
  const text = `${event.title} ${event.summary} ${event.articles.map((article) => article.title).join(" ")}`.toLowerCase();
  return Object.entries(knowledge).filter(([term]) => text.includes(term.toLowerCase())).slice(0, 3);
}

function coverageLabel(event: NewsEvent) {
  if (event.sourceCount >= 3) return "여러 출처에서 보도 중";
  if (event.sourceCount === 2) return "2개 출처에서 보도 중";
  return "단일 출처 기준";
}

export default async function Home() {
  const events = await getEvents();
  const updatedAt = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top">맥락</a>
        <nav><a href="#events">오늘 이해할 사건</a><a href="#principles">검증 원칙</a></nav>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">NEWS, WITH CONTEXT</div>
        <h1>뉴스를 더 많이 말고,<br />오늘 이해할 것만.</h1>
        <p>기사를 나열하지 않습니다. 같은 사건의 보도를 묶고, 지금 확인되는 내용과 이해에 필요한 배경을 분리해 보여줍니다.</p>
        <div className="status"><span className="dot" /> 최근 갱신 {updatedAt} · 최대 15분 캐시</div>
      </section>

      <section className="levels">
        <div><span>01</span><strong>30초 이해</strong><p>무슨 일이 보도되고 있는지.</p></div>
        <div><span>02</span><strong>왜 봐야 하나</strong><p>어떤 배경을 알아야 오해하지 않는지.</p></div>
        <div><span>03</span><strong>근거 확인</strong><p>출처별 원문을 직접 비교합니다.</p></div>
      </section>

      <section className="section" id="events">
        <div className="sectionHead">
          <div><div className="eyebrow">TODAY&apos;S EVENTS</div><h2>오늘 이해해둘 사건</h2></div>
          <p>최신 기사 → 유사 보도 묶음 → 출처 다양성 순</p>
        </div>

        {events.length === 0 ? <div className="empty">현재 피드를 불러오지 못했습니다. 잠시 뒤 다시 확인해 주세요.</div> : (
          <div className="eventList">
            {events.map((event, index) => {
              const concepts = findKnowledge(event);
              return (
                <article className="eventCard" key={event.id}>
                  <div className="eventNumber">{String(index + 1).padStart(2, "0")}</div>
                  <div className="eventBody">
                    <div className="meta"><span>{event.category}</span><span>{coverageLabel(event)}</span><span>{relativeTime(event.publishedAt)}</span></div>
                    <h3>{event.title}</h3>
                    {event.summary && <p className="lead">{event.summary.slice(0, 220)}{event.summary.length > 220 ? "…" : ""}</p>}

                    <div className="evidenceBox">
                      <div className="boxLabel">현재 확인 가능한 보도</div>
                      <p>이 사건은 현재 <strong>{event.sourceCount}개 출처</strong>의 {event.articles.length}개 기사 묶음으로 보고 있습니다. 여러 매체의 보도는 비교에 도움이 되지만, 출처 수 자체가 사실의 독립적 검증을 뜻하지는 않습니다.</p>
                    </div>

                    <div className="contextSection">
                      <div className="boxLabel">이 사건을 이해하려면</div>
                      {concepts.length > 0 ? (
                        <div className="concepts">
                          {concepts.map(([term, info]) => (
                            <details className="concept" key={term}>
                              <summary><b>{term}</b><span>한눈에 → 맥락 → 깊이</span></summary>
                              <div className="depth"><div><small>30초</small><p>{info.simple}</p></div><div><small>맥락</small><p>{info.context}</p></div><div><small>깊이</small><p>{info.deep}</p></div></div>
                            </details>
                          ))}
                        </div>
                      ) : <p className="pending">자동 배경지식 연결을 준비 중입니다. 지금은 출처 원문을 우선 확인해 주세요.</p>}
                    </div>

                    <details className="sources">
                      <summary>출처 {event.articles.length}개 비교하기</summary>
                      <div className="sourceList">
                        {event.articles.map((article, articleIndex) => (
                          <a href={article.link} target="_blank" rel="noreferrer" key={`${article.link}-${articleIndex}`}>
                            <span><b>{article.source}</b>{article.sourceType === "aggregated" && <em>집계 피드</em>}</span>
                            <span>{article.title}</span>
                            <small>{relativeTime(article.publishedAt)} ↗</small>
                          </a>
                        ))}
                      </div>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="principles" id="principles">
        <div><div className="eyebrow">TRUST MODEL</div><h2>‘중립’을 약속하지 않고<br />근거를 공개합니다.</h2></div>
        <div className="principleGrid">
          <p><strong>사건과 기사를 구분합니다.</strong> 같은 사건을 다룬 여러 기사를 하나의 묶음으로 보여줍니다.</p>
          <p><strong>사실·주장·해석을 섞지 않습니다.</strong> 현재 확인 가능한 보도와 배경 설명을 화면에서 분리합니다.</p>
          <p><strong>출처 수를 진실의 점수로 쓰지 않습니다.</strong> 여러 매체가 같은 원천을 재인용할 수 있기 때문입니다.</p>
          <p><strong>집계 출처를 표시합니다.</strong> 직접 RSS와 Google News 기반 집계 피드를 사용자가 구분할 수 있게 합니다.</p>
          <p><strong>모르면 비워둡니다.</strong> 배경 연결이 충분하지 않으면 그럴듯한 설명을 생성하지 않습니다.</p>
          <p><strong>마지막 판단은 원문에서.</strong> 요약보다 원문 비교를 빠르게 할 수 있게 설계합니다.</p>
        </div>
      </section>

      <footer>맥락 · 뉴스를 소비하는 대신 이해하기</footer>
    </main>
  );
}
