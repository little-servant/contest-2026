"use client";

import Script from "next/script";

export function KakaoSdkScript({ kakaoKey }: { kakaoKey: string }) {
  return (
    <Script
      src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`}
      strategy="afterInteractive"
      onError={(e) => {
        console.error("[CarePass] Kakao SDK script failed to load:", e);
      }}
    />
  );
}
