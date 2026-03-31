import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "J-SheepFold — 교회 통합 관리 시스템",
  description: "교회 교인, 헌금, 재정을 한 곳에서 관리하는 스마트 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

