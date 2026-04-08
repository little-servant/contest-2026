"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { LibraryStatus } from "@/components/LibraryStatus";
import { BusArrival } from "@/components/BusArrival";
import { SignalWarning } from "@/components/SignalWarning";
import { distanceKm } from "@/lib/api";

type Destination = {
  id: string;
  label: string;
  icon: string;
  lat: number;
  lng: number;
  stdgCd: string;
};

const DESTINATIONS: Destination[] = [
  {
    id: "home",
    label: "우리 집",
    icon: "🏠",
    lat: 37.5045,
    lng: 127.0144,
    stdgCd: "1100000000",
  },
  {
    id: "library",
    label: "도서관",
    icon: "📚",
    lat: 37.5172,
    lng: 127.0473,
    stdgCd: "1100000000",
  },
];

// 데모 모드 출발 좌표 (강남구 학교)
const DEMO_START = { lat: 37.5085, lng: 127.0245 };
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

type Step = "locate" | "select" | "navigate";
type MapState = "idle" | "ready" | "error";

export default function ChildPage() {
  const [step, setStep] = useState<Step>("locate");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [dest, setDest] = useState<Destination | null>(null);
  const [sessionCode, setSessionCode] = useState<string>("");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapState, setMapState] = useState<MapState>("idle");
  const [arrived, setArrived] = useState(false);
  const [voiceText, setVoiceText] = useState<string | null>(null);

  const speakVoiceGuide = useCallback(async (situation: string) => {
    try {
      const res = await fetch("/api/voice-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { text: string };
      setVoiceText(data.text);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utt = new SpeechSynthesisUtterance(data.text);
        utt.lang = "ko-KR";
        utt.rate = 0.9;
        window.speechSynthesis.speak(utt);
      }
    } catch {
      // silent
    }
  }, []);

  const mapRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const posRef = useRef<{ lat: number; lng: number } | null>(null);

  // 세션 코드 생성
  useEffect(() => {
    setSessionCode(String(Math.floor(1000 + Math.random() * 9000)));
  }, []);

  // 위치 업로드
  const uploadPos = useCallback(
    async (p: { lat: number; lng: number; arrived?: boolean }, code: string) => {
      try {
        await fetch("/api/location/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, lat: p.lat, lng: p.lng, ts: Date.now(), arrived: p.arrived }),
        });
      } catch {
        // silent
      }
    },
    [],
  );

  const startUpload = useCallback(
    (code: string, startPos: { lat: number; lng: number }, destination: Destination) => {
      if (uploadRef.current) clearInterval(uploadRef.current);
      posRef.current = startPos;
      uploadPos(startPos, code);

      uploadRef.current = setInterval(() => {
        const cur = posRef.current;
        if (!cur) return;

        let next = cur;
        if (DEMO_MODE) {
          // 목적지 방향으로 5% 이동
          next = {
            lat: cur.lat + (destination.lat - cur.lat) * 0.05,
            lng: cur.lng + (destination.lng - cur.lng) * 0.05,
          };
          posRef.current = next;
          setPos(next);

          // 도착 감지: 목적지까지 50m 미만
          const dist = distanceKm(next, destination);
          if (dist < 0.05) {
            setArrived(true);
            void uploadPos({ ...next, arrived: true }, code);
            void speakVoiceGuide(`${destination.label}에 도착했습니다`);
            if (uploadRef.current) {
              clearInterval(uploadRef.current);
              uploadRef.current = null;
            }
            return;
          }
        }
        uploadPos(next, code);
      }, 10000);
    },
    [uploadPos, speakVoiceGuide],
  );

  useEffect(() => () => { if (uploadRef.current) clearInterval(uploadRef.current); }, []);

  const locate = () => {
    if (DEMO_MODE) {
      setPos(DEMO_START);
      setStep("select");
      return;
    }
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoError("이 브라우저는 위치 정보를 지원하지 않습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setStep("select");
      },
      () => setGeoError("위치 권한을 허용해주세요."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const selectDest = (d: Destination) => {
    setDest(d);
    setStep("navigate");
    if (pos && sessionCode) startUpload(sessionCode, pos, d);
  };

  // 카카오맵 + Polyline
  useEffect(() => {
    if (step !== "navigate" || !pos || !dest || !mapRef.current) return;

    const kakao = (window as typeof window & { kakao?: { maps?: { load: (cb: () => void) => void; Map: new (el: HTMLDivElement, opts: Record<string, unknown>) => { setCenter: (c: unknown) => void; relayout: () => void }; LatLng: new (lat: number, lng: number) => unknown; Marker: new (opts: Record<string, unknown>) => { setMap: (m: unknown) => void }; Polyline: new (opts: Record<string, unknown>) => { setMap: (m: unknown) => void } } } }).kakao;
    if (!kakao?.maps) { setMapState("error"); return; }

    kakao.maps.load(() => {
      if (!mapRef.current || !kakao.maps) return;

      const startLatLng = new kakao.maps.LatLng(pos.lat, pos.lng);
      const endLatLng = new kakao.maps.LatLng(dest.lat, dest.lng);

      // 중간 지점을 중심으로
      const centerLat = (pos.lat + dest.lat) / 2;
      const centerLng = (pos.lng + dest.lng) / 2;
      const center = new kakao.maps.LatLng(centerLat, centerLng);

      const map = new kakao.maps.Map(mapRef.current, { center, level: 6 });

      // 출발 마커
      new kakao.maps.Marker({ map, position: startLatLng });
      // 도착 마커
      new kakao.maps.Marker({ map, position: endLatLng });

      // 경로 Polyline
      new kakao.maps.Polyline({
        map,
        path: [startLatLng, endLatLng],
        strokeWeight: 5,
        strokeColor: "#10b981",
        strokeOpacity: 0.9,
        strokeStyle: "solid",
      });

      setMapState("ready");

      // 아동안전지킴이집 마커 오버레이 (비동기)
      void (async () => {
        try {
          if (!kakao.maps) return;
          const res = await fetch("/api/facilities");
          if (!res.ok) return;
          const json = (await res.json()) as {
            items?: Array<{ lat: number; lng: number; name: string }>;
          };
          const facilities = json.items ?? [];
          for (const f of facilities.slice(0, 20)) {
            if (!f.lat || !f.lng || !kakao.maps) continue;
            const fLatLng = new kakao.maps.LatLng(f.lat, f.lng);
            new kakao.maps.Marker({ map, position: fLatLng });
          }
        } catch {
          // 시설 마커 실패해도 지도는 정상 표시
        }
      })();
    });
  }, [step, dest]); // pos 제외: 초기 1회만 그림

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col">
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-5 py-4">
        <Link href="/" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
          ←
        </Link>
        <div>
          <p className="text-xs text-slate-400">아이 모드</p>
          <h1 className="text-base font-bold text-slate-900">혼자가도 괜찮아 🧒</h1>
        </div>
        {step === "navigate" && sessionCode && (
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
              <div className="w-full rounded-2xl bg-red-50 p-4 text-xs text-red-600">
                {geoError}
              </div>
            )}
            <button
              type="button"
              onClick={locate}
              className="w-full rounded-3xl bg-emerald-500 py-5 text-lg font-bold text-white shadow-lg transition active:scale-95"
            >
              {DEMO_MODE ? "🎮 데모 시작" : "📍 내 위치 찾기"}
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
        {step === "navigate" && dest && (
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
              className="h-56 w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100"
              style={{ minHeight: 224 }}
            >
              {mapState === "idle" && (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
                    지도 로딩 중...
                  </div>
                </div>
              )}
              {mapState === "error" && (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  지도를 표시할 수 없습니다
                </div>
              )}
            </div>

            {/* 안내 */}
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-700">📢 안내</p>
              <ul className="mt-2 flex flex-col gap-2 text-sm text-slate-600">
                <li>1. 지도를 보며 {dest.label} 방향으로 이동해요</li>
                <li>2. 모르면 주변 어른께 물어봐요</li>
                <li>3. 위험하면 아동안전지킴이집으로 가요 🏠</li>
              </ul>
            </div>

            {/* 도착 알림 */}
            {arrived && (
              <div className="rounded-3xl bg-emerald-500 p-5 text-center shadow-lg">
                <p className="text-3xl">🎉</p>
                <p className="mt-2 text-lg font-bold text-white">
                  {dest.icon} {dest.label}에 도착했어요!
                </p>
                <p className="mt-1 text-sm text-emerald-100">잘했어요! 부모님께 알림이 전송됐어요.</p>
              </div>
            )}

            {/* 교통안전 신호등 경보 */}
            <SignalWarning stdgCd={dest.stdgCd} />

            {/* 도서관 선택 시 열람실 현황 */}
            {dest.id === "library" && (
              <LibraryStatus stdgCd={dest.stdgCd} />
            )}

            {/* 버스 실시간 정보 */}
            <BusArrival stdgCd={dest.stdgCd} />

            {/* AI 음성 안내 (Gemini) */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() =>
                  void speakVoiceGuide(
                    `아이가 ${dest.label} 방향으로 이동 중입니다. 안전하게 귀가 중입니다.`,
                  )
                }
                className="w-full rounded-3xl border-2 border-emerald-200 bg-white py-4 text-sm font-semibold text-emerald-700 shadow-sm transition active:scale-95"
              >
                🔊 AI 음성 안내 받기
              </button>
              {voiceText && (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  💬 {voiceText}
                </div>
              )}
            </div>

            {pos && (
              <div className="rounded-2xl bg-slate-100 p-3 text-center text-xs text-slate-500">
                현재 위치: {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)} · 10초마다 갱신
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
