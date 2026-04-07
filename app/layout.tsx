import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { KakaoSdkScript } from "@/components/KakaoSdkScript";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "케어패스 — 맞벌이 가족 아동 이동 지원 안내",
  description: "아이돌봄 기관 찾기 + 교통약자 차량·버스·도서관 열람실 실시간 현황",
  openGraph: {
    title: "케어패스 (CarePass)",
    description: "맞벌이 가족을 위한 아동 이동·돌봄 통합 안내",
    url: "https://carepass-eight.vercel.app",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY?.trim();

  return (
    <html
      lang="ko"
      className={`${notoSansKR.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[color:var(--background)] text-[color:var(--foreground)]">
        {kakaoKey ? (
          <KakaoSdkScript kakaoKey={kakaoKey} />
        ) : null}
        <div className="mx-auto flex min-h-full w-full max-w-screen-sm flex-col">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
