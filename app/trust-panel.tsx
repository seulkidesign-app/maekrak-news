import type { NewsEvent, NewsItem } from "@/lib/news";
import type { EvidenceLabel } from "@/lib/signals";
import type { Language } from "@/lib/i18n";

type EvidenceCounts = Record<EvidenceLabel, number>;

function roleLabel(role: NewsItem["sourceRole"], lang: Language) {
  const ko = { wire: "통신사", broadcaster: "방송·종합", international: "국제매체" } as const;
  const en = { wire: "Wire", broadcaster: "Broadcaster", international: "International" } as const;
  return (lang === "ko" ? ko : en)[role];
}

function coverageState(event: NewsEvent, lang: Language) {
  if (event.sourceCount >= 3) return { tone: "strong", label: lang === "ko" ? "복수 출처" : "Multiple sources" };
  if (event.sourceCount === 2) return { tone: "medium", label: lang === "ko" ? "2개 출처" : "Two sources" };
  return { tone: "caution", label: lang === "ko" ? "단일 출처" : "Single source" };
}

export function TrustLegend({ lang }: { lang: Language }) {
  return (
    <details className="readingGuide">
      <summary>
        <span>{lang === "ko" ? "이 브리핑을 읽는 법" : "How to read this briefing"}</span>
        <small>{lang === "ko" ? "보도 · 맥락 · 불확실성을 분리합니다" : "Reporting, context and uncertainty are separated"}</small>
      </summary>
      <div className="readingGuideBody">
        <p><b>{lang === "ko" ? "보도" : "Reporting"}</b>{lang === "ko" ? " · 기사에서 직접 가져온 내용이며 원문으로 바로 이동할 수 있습니다." : " · Source-derived information with direct links to the reporting."}</p>
        <p><b>{lang === "ko" ? "맥락" : "Context"}</b>{lang === "ko" ? " · 원문 인용이 아니라 이해를 돕기 위한 별도 설명입니다. 특히 ‘왜 중요한가’와 흐름 묶기는 편집적 판단이 포함될 수 있습니다." : " · Separate explanatory material, not a quote. ‘Why it matters’ and story grouping can involve editorial judgment."}</p>
        <p><b>{lang === "ko" ? "정치·외교" : "Politics & diplomacy"}</b>{lang === "ko" ? " · 특정 진영을 평가하지 않고 제도·정책·경제·안보 영향 중심으로 설명하며, 원문 비교를 권장합니다." : " · We avoid judging political camps and focus on institutional, policy, economic and security effects; comparing originals is encouraged."}</p>
      </div>
    </details>
  );
}

export function SourceCheck({
  event,
  representative,
  evidence,
  lang,
}: {
  event: NewsEvent;
  representative: NewsItem;
  evidence: EvidenceCounts;
  lang: Language;
}) {
  const state = coverageState(event, lang);
  const roles = [...new Set(event.articles.map((article) => article.sourceRole))];
  const directCount = event.articles.filter((article) => article.sourceType === "direct").length;
  const aggregatedCount = event.articles.filter((article) => article.sourceType === "aggregated").length;
  const uncertain = evidence["전망·추정"];
  const claims = evidence["발언·주장"];
  const sourceNames = [...new Set(event.articles.map((article) => article.source))];
  const political = event.category === "정치" || event.briefWhy === "politics" || event.briefWhy === "security";

  return (
    <div className={`sourceCheck sourceCheck-${state.tone}`}>
      <div className="sourceCheckMain">
        <div className="sourceCheckStatus">
          <span className="sourceCheckDot" />
          <div>
            <small>{lang === "ko" ? "출처 확인" : "Source check"}</small>
            <b>{state.label}</b>
          </div>
        </div>

        <div className="sourceNamesInline">
          {sourceNames.slice(0, 3).map((source) => <span key={source}>{source}</span>)}
          {sourceNames.length > 3 && <span>+{sourceNames.length - 3}</span>}
        </div>

        {(claims > 0 || uncertain > 0) && (
          <span className="sourceCheckCaution">
            {lang === "ko" ? `주장 ${claims} · 추정 ${uncertain}` : `Claims ${claims} · uncertainty ${uncertain}`}
          </span>
        )}

        <a className="primarySourceLink" href={representative.link} target="_blank" rel="noreferrer">
          {lang === "ko" ? "대표 원문 ↗" : "Primary report ↗"}
        </a>
      </div>

      <details className="sourceCheckDetails">
        <summary>
          <span>{lang === "ko" ? "출처 비교" : "Compare sources"}</span>
          <small>{roles.map((role) => roleLabel(role, lang)).join(" · ")}</small>
        </summary>
        <div className="sourceCheckDetailBody">
          {political && (
            <p className="politicalSourceNote">
              {lang === "ko"
                ? "정치·외교 이슈는 같은 사실도 매체별 강조점과 표현이 달라질 수 있습니다. 아래 원문을 함께 비교해 판단하세요."
                : "Political and diplomatic stories can be framed differently even when reporting the same event. Compare the originals below."}
            </p>
          )}
          <div className="collectionPath">
            <div><b>{directCount}</b><span>{lang === "ko" ? "직접 피드" : "direct feed"}</span></div>
            <div><b>{aggregatedCount}</b><span>{lang === "ko" ? "집계 피드" : "aggregated feed"}</span></div>
          </div>
          <p className="sourceMethodNote">
            {lang === "ko"
              ? "출처 수는 ‘진실 점수’가 아닙니다. 여러 매체가 보도 중이라는 신호이며, 세부 내용은 서로 다를 수 있습니다."
              : "Source count is not a truth score. It indicates breadth of coverage; details can still differ between reports."}
          </p>
          <div className="sourceMiniList">
            {event.articles.slice(0, 8).map((article, index) => (
              <a href={article.link} target="_blank" rel="noreferrer" key={`${article.link}-${index}`}>
                <span><b>{article.source}</b><em>{roleLabel(article.sourceRole, lang)}</em></span>
                <small>{article.sourceType === "direct" ? (lang === "ko" ? "직접" : "Direct") : (lang === "ko" ? "집계" : "Aggregated")}</small>
              </a>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
