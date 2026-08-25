import type { Metadata } from "next";
import "./globals.css";
import "./signals.css";
import "./briefing.css";
import "./editorial.css";

export const metadata: Metadata = {
  title: "맥락 — 알수록 보이는 뉴스",
  description: "뉴스를 요약하는 데서 끝나지 않고, 이해하는 데 필요한 배경지식까지 보여줍니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
