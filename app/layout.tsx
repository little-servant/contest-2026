import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { KakaoSdkScript } from "@/components/KakaoSdkScript";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "혼자가도 괜찮아 — 아동 자립 귀가 지원",
  description: "맞벌이 가정 아이의 안전한 하교 귀가를 돕는 실시간 위치 공유·경로 안내 서비스",
  openGraph: {
    title: "혼자가도 괜찮아 (HonGa)",
    description: "아이는 안전하게, 부모는 안심하게 — 아동 자립 귀가 지원",
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
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full text-[color:var(--text)]">
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
