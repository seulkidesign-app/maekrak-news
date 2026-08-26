import { getDisplayArticle, type NewsEvent } from "@/lib/news";
import type { Language } from "@/lib/i18n";
import type { WorldFlow } from "@/lib/world-briefing";

export function WorldFlowBoard({ flows, events, lang }: { flows: WorldFlow[]; events: NewsEvent[]; lang: Language }) {
  const byId = new Map(events.map((event) => [event.id, event]));

  return (
    <section className="worldFlowSection" id="world-flow">
      <div className="worldFlowHead">
        <div>
          <div className="eyebrow">TODAY'S WORLD FLOW</div>
          <h2>{lang === "ko" ? "오늘 세계는 이렇게 움직이고 있습니다" : "How the world is moving today"}</h2>
        </div>
        <p>{lang === "ko" ? "기사 목록이 아니라, 오늘 함께 봐야 할 큰 흐름입니다." : "Not another article list — the major currents worth seeing together today."}</p>
      </div>

      <div className="worldFlowGrid">
        {flows.map((flow, index) => (
          <article className="worldFlowCard" key={flow.code}>
            <div className="flowIndex">0{index + 1}</div>
            <div className="flowBody">
              <h3>{flow.title}</h3>
              <p>{flow.summary}</p>
              <div className="flowEvents">
                {flow.eventIds.map((id, eventIndex) => {
                  const event = byId.get(id);
                  if (!event) return null;
                  const article = getDisplayArticle(event, lang);
                  return (
                    <a href="#events" key={id}>
                      <span>{eventIndex + 1}</span>
                      <b>{article.title || event.title}</b>
                    </a>
                  );
                })}
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="flowCaveat">{lang === "ko" ? "같은 흐름으로 묶었다고 해서 사건 사이의 인과관계를 뜻하지는 않습니다." : "Grouping stories in the same current does not imply that one caused another."}</p>
    </section>
  );
}

export function BriefingComplete({ memoryLine, flows, lang }: { memoryLine: string; flows: WorldFlow[]; lang: Language }) {
  return (
    <section className="briefingComplete">
      <div className="completeCheck">✓</div>
      <div>
        <div className="eyebrow">TODAY IN ONE SENTENCE</div>
        <h2>{lang === "ko" ? "여기까지 읽었다면, 오늘의 큰 흐름은 잡았습니다." : "If you've read this far, you have today's big picture."}</h2>
        <p className="memoryLine">{memoryLine}</p>
        <div className="memoryTags">
          {flows.map((flow) => <span key={flow.code}>{flow.title}</span>)}
        </div>
      </div>
    </section>
  );
}
