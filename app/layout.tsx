import type { Metadata } from "next";
import "./globals.css";
import "./signals.css";
import "./briefing.css";
import "./editorial.css";
import "./snapshot.css";
import "./world-flow.css";
import "./practical.css";
import "./trust.css";
import "./ux-polish.css";
import "./qa-fixes.css";

const siteUrl = "https://maekrak-news-rrrb-gamma.vercel.app";
const title = "맥락 — 오늘 뉴스, 3가지 흐름으로";
const description = "출근길 10분 안에 오늘의 흐름과 핵심 사건, 출처, 한국과의 연결, 배경지식까지 한 번에 이해하는 데일리 뉴스 브리핑.";
const socialImage = `${siteUrl}/og-image?v=10`;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "맥락",
      alternateName: "Maekrak",
      url: siteUrl,
      description,
      inLanguage: ["ko", "en"],
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#app`,
      name: "맥락",
      alternateName: "Maekrak",
      url: siteUrl,
      applicationCategory: "NewsApplication",
      operatingSystem: "Web",
      description,
      inLanguage: ["ko", "en"],
      audience: {
        "@type": "Audience",
        audienceType: "Korean-speaking readers who want a concise daily news briefing with visible sources and context",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "KRW",
        category: "Free public prototype",
      },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: siteUrl },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "맥락",
    type: "website",
    locale: "ko_KR",
    images: [{ url: socialImage, width: 1200, height: 630, alt: "오늘 뉴스, 3가지 흐름으로 — 맥락" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <noscript>
          <section style={{ maxWidth: 880, margin: "0 auto", padding: "28px 20px", lineHeight: 1.65 }}>
            <h1>맥락 — 오늘 뉴스를 이해하는 10분 브리핑</h1>
            <p>
              맥락은 여러 뉴스 앱을 돌아다니지 않아도 오늘 한국과 세계에서 중요한 사건을 빠르게 이해하도록 돕는 데일리 뉴스 브리핑 서비스입니다.
              기사를 많이 나열하기보다 오늘의 큰 흐름, 핵심 사건, 보도 출처, 한국과의 연결, 필요한 배경지식을 단계적으로 보여줍니다.
            </p>
            <p>
              주요 사용자는 출근길이나 짧은 시간에 오늘의 주요 뉴스를 파악하고 싶은 한국어 사용자, 특히 개별 기사마다 용어와 배경을 다시 검색하는 부담을 줄이고 싶은 사람입니다.
              현재는 무료 공개 프로토타입이며 유료 요금제는 없습니다. 뉴스의 사실 여부를 자체적으로 보증하는 서비스가 아니라, 출처와 불확실성을 투명하게 보여주고 원문 비교를 돕는 것을 목표로 합니다.
            </p>
            <p lang="en">
              Maekrak is a free public prototype for a 10-minute daily news briefing. It is designed for Korean-speaking readers who want to understand the major developments in Korea and the world without opening many news apps. Instead of maximizing article volume, it organizes the day into major currents and key events, then shows reporting sources, a Korea connection when a reviewed mechanism exists, and background concepts. It is not a fact-checking authority or a complete replacement for original reporting. Its product position is a context-first briefing with visible sourcing and uncertainty rather than a personalized infinite news feed. There is currently no paid plan.
            </p>
            <p>
              AI agents and text-only clients can also read a stable service description at <a href="/agent-info">/agent-info</a>, <a href="/agent-info.md">/agent-info.md</a>, and <a href="/llms.txt">/llms.txt</a>.
            </p>
          </section>
        </noscript>
        {children}
      </body>
    </html>
  );
}
