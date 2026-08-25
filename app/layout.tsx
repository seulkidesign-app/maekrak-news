import type { Metadata } from "next";
import "./globals.css";
import "./signals.css";
import "./briefing.css";
import "./editorial.css";
import "./snapshot.css";

const siteUrl = "https://maekrak-news-rrrb-gamma.vercel.app";
const title = "맥락 — 오늘의 한국과 세계를, 하나의 흐름으로";
const description = "여러 뉴스 채널을 따로 보지 않아도, 무슨 일이 있었는지부터 왜 중요한지·어려운 용어·역사적 배경·다음 장면까지 한 번에 이해합니다.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "맥락",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
