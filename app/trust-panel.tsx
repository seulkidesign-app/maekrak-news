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
  if (event.sourceCount >= 3) {
    return {
      tone: "strong",
      label: lang === "ko" ? "복수 출처 보도" : "Multiple-source coverage",
      note: lang === "ko" ? "서로 다른 출처 여러 곳에서 같은 사건을 보도 중입니다." : "Several different sources are reporting the same event.",
    };
  }
  if (event.sourceCount === 2) {
    return {
      tone: "medium",
      label: lang === "ko" ? "2개 출처 보도" : "Two-source coverage",
      note: lang === "ko" ? "두 출처에서 보도됐습니다. 추가 확인이 이어지는지 함께 보세요." : "Two sources are reporting it. Watch for further corroboration.",
    };
  }
  return {
    tone: "caution",
    label: lang === "ko" ? "단일 출처 주의" : "Single-source caution",
    note: lang === "ko" ? "현재 수집에서는 한 출처 중심입니다. 확정된 사실처럼 넓게 일반화하지 않는 편이 좋습니다." : "Current collection relies on one source. Avoid treating it as broadly corroborated yet.",
  };
}

export function TrustLegend({ lang }: { lang: Language }) {
  return (
    <aside className="trustLegend" aria-label={lang === "ko" ? "정보 읽는 법" : "How to read this briefing"}>
      <div>
        <span className="trustLegendTag source">SOURCE</span>
        <p><b>{lang === "ko" ? "보도 내용" : "Reporting"}</b>{lang === "ko" ? "은 원문 출처를 바로 확인할 수 있습니다." : " links directly to the original reporting."}</p>
      </div>
      <div>
        <span className="trustLegendTag context">CONTEXT</span>
        <p><b>{lang === "ko" ? "맥락 설명" : "Context"}</b>{lang === "ko" ? "은 원문 인용이 아니라 배경 이해를 돕는 별도 설명입니다." : " is separate explanatory material, not a quote from the source."}</p>
      </div>
      <div>
        <span className="trustLegendTag caution">CHECK</span>
        <p><b>{lang === "ko" ? "주장·추정" : "Claims and uncertainty"}</b>{lang === "ko" ? " 표현은 별도로 표시하고 출처 수를 함께 보여줍니다." : " are flagged separately alongside source coverage."}</p>
      </div>
    </aside>
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

  return (
    <div className={`sourceCheck sourceCheck-${state.tone}`}>
      <div className="sourceCheckMain">
        <div className="sourceCheckStatus">
          <span className="sourceCheckDot" />
          <div>
            <small>SOURCE CHECK</small>
            <b>{state.label}</b>
          </div>
        </div>

        <div className="sourceCheckFacts">
          <span><b>{event.sourceCount}</b>{lang === "ko" ? "개 출처" : " sources"}</span>
          <span>{roles.map((role) => roleLabel(role, lang)).join(" · ")}</span>
          {(claims > 0 || uncertain > 0) ? (
            <span className="sourceCheckCaution">
              {lang === "ko" ? `주장 ${claims} · 추정 ${uncertain}` : `Claims ${claims} · uncertainty ${uncertain}`}
            </span>
          ) : (
            <span>{lang === "ko" ? "주장·추정 표현 적음" : "Few claim/uncertainty signals"}</span>
          )}
        </div>

        <a className="primarySourceLink" href={representative.link} target="_blank" rel="noreferrer">
          {lang === "ko" ? `${representative.source} 원문 ↗` : `${representative.source} original ↗`}
        </a>
      </div>

      <details className="sourceCheckDetails">
        <summary>
          <span>{lang === "ko" ? "출처와 수집 경로 확인" : "Inspect sources and collection paths"}</span>
          <small>{state.note}</small>
        </summary>
        <div className="sourceCheckDetailBody">
          <div className="collectionPath">
            <div><b>{directCount}</b><span>{lang === "ko" ? "직접 피드 기사" : "direct-feed reports"}</span></div>
            <div><b>{aggregatedCount}</b><span>{lang === "ko" ? "집계 피드 기사" : "aggregated-feed reports"}</span></div>
          </div>
          <p className="sourceMethodNote">
            {lang === "ko"
              ? "‘복수 출처’는 사실 판정 점수가 아닙니다. 여러 매체가 같은 사건을 보도하고 있다는 신호일 뿐이며, 원문 간 내용이 완전히 일치한다는 뜻도 아닙니다. 공식기관 원문 여부는 현재 자동 판정하지 않습니다."
              : "‘Multiple sources’ is not a truth score. It only means several outlets are covering the same event, not that every detail agrees. Official-primary-source status is not automatically determined yet."}
          </p>
          <div className="sourceMiniList">
            {event.articles.slice(0, 8).map((article, index) => (
              <a href={article.link} target="_blank" rel="noreferrer" key={`${article.link}-${index}`}>
                <span><b>{article.source}</b><em>{roleLabel(article.sourceRole, lang)}</em></span>
                <small>{article.sourceType === "direct" ? (lang === "ko" ? "직접 피드" : "Direct feed") : (lang === "ko" ? "집계 피드" : "Aggregated feed")}</small>
              </a>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
