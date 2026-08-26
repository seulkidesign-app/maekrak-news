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

const siteUrl = "https://maekrak-news-rrrb-gamma.vercel.app";
const title = "맥락 — 오늘 뉴스의 흐름과 배경을 한 번에";
const description = "여러 뉴스 채널을 돌아다니지 않아도 오늘의 3가지 흐름, 핵심 사건 5개, 출처, 한국과의 연결, 배경지식까지 한 번에 이해하는 데일리 뉴스 브리핑.";
const socialImage = `${siteUrl}/og-image`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: siteUrl },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "맥락",
    type: "website",
    locale: "ko_KR",
    images: [{ url: socialImage, width: 1200, height: 630, alt: "맥락 — 오늘 뉴스의 흐름, 출처, 배경을 한 번에" }],
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
      <body>{children}</body>
    </html>
  );
}
