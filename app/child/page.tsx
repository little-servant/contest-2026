"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

type Destination = {
  id: string;
  label: string;
  icon: string;
  lat: number;
  lng: number;
};

const DESTINATIONS: Destination[] = [
  { id: "home", label: "우리 집", icon: "🏠", lat: 37.5045, lng: 127.0144 },
  { id: "library", label: "도서관", icon: "📚", lat: 37.5172, lng: 127.0473 },
];

// 데모 모드: 학교 출발 좌표
const DEMO_START = { lat: 37.5085, lng: 127.0245 };

type Step = "locate" | "select" | "navigate";

export default function ChildPage() {
  const [step, setStep] = useState<Step>("locate");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [dest, setDest] = useState<Destination | null>(null);
  const [sessionCode, setSessionCode] = useState<string>("");
  const [geoError, setGeoError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // 세션 코드 생성
  useEffect(() => {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setSessionCode(code);
  }, []);

  const locate = useCallback(() => {
    if (isDemoMode) {
      setPos(DEMO_START);
      setStep("select");
      return;
    }
    if (!navigator.geolocation) {
      setGeoError("이 브라우저는 위치 정보를 지원하지 않습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setStep("select");
      },
      () => {
        setGeoError("위치 권한을 허용하거나 데모 모드를 사용해주세요.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [isDemoMode]);

  // 위치 업로드 (10초 주기)
  const startUpload = useCallback(
    (code: string, currentPos: { lat: number; lng: number }) => {
      if (uploadRef.current) clearInterval(uploadRef.current);

      const upload = async (p: { lat: number; lng: number }) => {
        try {
          await fetch("/api/location/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, lat: p.lat, lng: p.lng, ts: Date.now() }),
          });
        } catch {
          // silent
        }
      };

      upload(currentPos);
      uploadRef.current = setInterval(() => {
        // 데모 모드: 목적지 방향으로 조금씩 이동
        setPos((prev) => {
          if (!prev || !dest) return prev;
          if (!isDemoMode) return prev;
          const dLat = (dest.lat - prev.lat) * 0.05;
          const dLng = (dest.lng - prev.lng) * 0.05;
          const next = { lat: prev.lat + dLat, lng: prev.lng + dLng };
          upload(next);
          return next;
        });
      }, 10000);
    },
    [dest, isDemoMode],
  );

  useEffect(() => {
    return () => {
      if (uploadRef.current) clearInterval(uploadRef.current);
    };
  }, []);

  const selectDest = (d: Destination) => {
    setDest(d);
    setStep("navigate");
    if (pos && sessionCode) startUpload(sessionCode, pos);
  };

  // 카카오맵 그리기
  useEffect(() => {
    if (step !== "navigate" || !pos || !dest || !mapRef.current) return;
    const kakao = window.kakao;
    if (!kakao?.maps) return;

    kakao.maps.load(() => {
      if (!mapRef.current || !kakao.maps) return;
      const center = new kakao.maps.LatLng(pos.lat, pos.lng);
      const map = new kakao.maps.Map(mapRef.current, { center, level: 5 });

      // 출발 마커
      new kakao.maps.Marker({ map, position: new kakao.maps.LatLng(pos.lat, pos.lng) });
      // 도착 마커
      new kakao.maps.Marker({ map, position: new kakao.maps.LatLng(dest.lat, dest.lng) });
    });
  }, [step, pos, dest]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col">
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-5 py-4">
        <Link href="/" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">←</Link>
        <div>
          <p className="text-xs text-slate-400">아이 모드</p>
          <h1 className="text-base font-bold text-slate-900">혼자가도 괜찮아 🧒</h1>
        </div>
        {sessionCode && step === "navigate" && (
          <div className="ml-auto rounded-2xl bg-slate-100 px-3 py-1.5 text-center">
            <p className="text-xs text-slate-500">부모님 코드</p>
            <p className="text-lg font-bold tracking-widest text-slate-900">{sessionCode}</p>
          </div>
        )}
      </header>

      <div className="flex-1 px-5 pb-8">
        {/* Step 1: 위치 확인 */}
        {step === "locate" && (
          <div className="flex flex-col items-center gap-6 pt-12 text-center">
            <span className="text-8xl">📍</span>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">지금 어디 있어?</h2>
              <p className="mt-2 text-sm text-slate-500">현재 위치를 확인할게!</p>
            </div>
            {geoError && (
              <div className="w-full rounded-2xl bg-red-50 p-4 text-xs text-red-600">{geoError}</div>
            )}
            <button
              type="button"
              onClick={locate}
              className="w-full rounded-3xl bg-emerald-500 py-5 text-lg font-bold text-white shadow-lg transition active:scale-95"
            >
              {isDemoMode ? "🎮 데모 시작" : "📍 내 위치 찾기"}
            </button>
          </div>
        )}

        {/* Step 2: 목적지 선택 */}
        {step === "select" && (
          <div className="flex flex-col gap-6 pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">어디 갈 거야?</h2>
              <p className="mt-1 text-sm text-slate-500">목적지를 선택해줘!</p>
            </div>
            <div className="flex flex-col gap-4">
              {DESTINATIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => selectDest(d)}
                  className="flex items-center gap-5 rounded-3xl border-2 border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-emerald-400 active:scale-95"
                >
                  <span className="text-5xl">{d.icon}</span>
                  <div>
                    <p className="text-xl font-bold text-slate-900">{d.label}</p>
                    <p className="text-xs text-slate-400">여기로 갈게요</p>
                  </div>
                  <span className="ml-auto text-2xl text-slate-300">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: 이동 중 */}
        {step === "navigate" && dest && pos && (
          <div className="flex flex-col gap-4 pt-4">
            <div className="rounded-3xl bg-emerald-50 p-4 text-center">
              <p className="text-sm font-semibold text-emerald-700">
                {dest.icon} {dest.label}(으)로 이동 중!
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                부모님이 내 위치를 보고 있어요 👀
              </p>
            </div>

            {/* 지도 */}
            <div
              ref={mapRef}
              className="h-64 w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100"
              style={{ minHeight: 256 }}
            >
              {!window.kakao?.maps && (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  지도 로딩 중...
                </div>
              )}
            </div>

            {/* 안내 메시지 */}
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-700">📢 안내</p>
              <ul className="mt-2 flex flex-col gap-2 text-sm text-slate-600">
                <li>1. 지도를 보며 {dest.label} 방향으로 이동해요</li>
                <li>2. 모르면 주변 어른께 물어봐요</li>
                <li>3. 위험하면 아동안전지킴이집으로 가요 🏠</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-slate-100 p-3 text-center text-xs text-slate-500">
              현재 위치: {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)} · 10초마다 갱신
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
