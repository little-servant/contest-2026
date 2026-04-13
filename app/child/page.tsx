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
  { id: "home",    label: "우리 집", icon: "🏠", lat: 37.5045, lng: 127.0144, stdgCd: "1100000000" },
  { id: "library", label: "도서관",  icon: "📚", lat: 37.5172, lng: 127.0473, stdgCd: "1168000000" },
];

const DEMO_START = { lat: 37.5085, lng: 127.0245 };
const DEMO_MODE  = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

type Step     = "locate" | "select" | "navigate";
type MapState = "idle"   | "ready"  | "error";

export default function ChildPage() {
  const [step,        setStep]        = useState<Step>("locate");
  const [pos,         setPos]         = useState<{ lat: number; lng: number } | null>(null);
  const [dest,        setDest]        = useState<Destination | null>(null);
  const [sessionCode, setSessionCode] = useState<string>("");
  const [geoError,    setGeoError]    = useState<string | null>(null);
  const [mapState,    setMapState]    = useState<MapState>("idle");
  const [arrived,     setArrived]     = useState(false);
  const [voiceText,   setVoiceText]   = useState<string | null>(null);

  const speakVoiceGuide = useCallback(async (situation: string) => {
    try {
      const res  = await fetch("/api/voice-guide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ situation }) });
      if (!res.ok) return;
      const data = (await res.json()) as { text: string };
      setVoiceText(data.text);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utt = new SpeechSynthesisUtterance(data.text);
        utt.lang = "ko-KR"; utt.rate = 0.9;
        window.speechSynthesis.speak(utt);
      }
    } catch { /* silent */ }
  }, []);

  const mapRef    = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const posRef    = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => { setSessionCode(String(Math.floor(1000 + Math.random() * 9000))); }, []);

  const uploadPos = useCallback(async (p: { lat: number; lng: number; arrived?: boolean }, code: string) => {
    try {
      await fetch("/api/location/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, lat: p.lat, lng: p.lng, ts: Date.now(), arrived: p.arrived }) });
    } catch { /* silent */ }
  }, []);

  const startUpload = useCallback((code: string, startPos: { lat: number; lng: number }, destination: Destination) => {
    if (uploadRef.current) clearInterval(uploadRef.current);
    posRef.current = startPos;
    uploadPos(startPos, code);
    uploadRef.current = setInterval(() => {
      const cur = posRef.current;
      if (!cur) return;
      let next = cur;
      if (DEMO_MODE) {
        next = { lat: cur.lat + (destination.lat - cur.lat) * 0.05, lng: cur.lng + (destination.lng - cur.lng) * 0.05 };
        posRef.current = next;
        setPos(next);
        if (distanceKm(next, destination) < 0.05) {
          setArrived(true);
          void uploadPos({ ...next, arrived: true }, code);
          void speakVoiceGuide(`${destination.label}에 도착했습니다`);
          if (uploadRef.current) { clearInterval(uploadRef.current); uploadRef.current = null; }
          return;
        }
      }
      uploadPos(next, code);
    }, 10000);
  }, [uploadPos, speakVoiceGuide]);

  useEffect(() => () => { if (uploadRef.current) clearInterval(uploadRef.current); }, []);

  const locate = () => {
    if (DEMO_MODE) { setPos(DEMO_START); setStep("select"); return; }
    if (typeof window === "undefined" || !navigator.geolocation) { setGeoError("이 브라우저는 위치 정보를 지원하지 않습니다."); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setStep("select"); },
      ()  => setGeoError("위치 권한을 허용해주세요."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const selectDest = (d: Destination) => {
    setDest(d); setStep("navigate");
    if (pos && sessionCode) startUpload(sessionCode, pos, d);
  };

  useEffect(() => {
    if (step !== "navigate" || !pos || !dest || !mapRef.current) return;
    const kakao = (window as typeof window & { kakao?: { maps?: { load: (cb: () => void) => void; Map: new (el: HTMLDivElement, opts: Record<string, unknown>) => { setCenter: (c: unknown) => void; relayout: () => void }; LatLng: new (lat: number, lng: number) => unknown; Marker: new (opts: Record<string, unknown>) => { setMap: (m: unknown) => void }; Polyline: new (opts: Record<string, unknown>) => { setMap: (m: unknown) => void } } } }).kakao;
    if (!kakao?.maps) { setMapState("error"); return; }
    kakao.maps.load(() => {
      if (!mapRef.current || !kakao.maps) return;
      const startLatLng = new kakao.maps.LatLng(pos.lat, pos.lng);
      const endLatLng   = new kakao.maps.LatLng(dest.lat, dest.lng);
      const center      = new kakao.maps.LatLng((pos.lat + dest.lat) / 2, (pos.lng + dest.lng) / 2);
      const map = new kakao.maps.Map(mapRef.current, { center, level: 6 });
      new kakao.maps.Marker({ map, position: startLatLng });
      new kakao.maps.Marker({ map, position: endLatLng });
      new kakao.maps.Polyline({ map, path: [startLatLng, endLatLng], strokeWeight: 5, strokeColor: "#06b6a8", strokeOpacity: 0.9, strokeStyle: "solid" });
      setMapState("ready");
      void (async () => {
        try {
          if (!kakao.maps) return;
          const res  = await fetch("/api/facilities");
          if (!res.ok) return;
          const json = (await res.json()) as { items?: Array<{ lat: number; lng: number; name: string }> };
          for (const f of (json.items ?? []).slice(0, 20)) {
            if (!f.lat || !f.lng || !kakao.maps) continue;
            new kakao.maps.Marker({ map, position: new kakao.maps.LatLng(f.lat, f.lng) });
          }
        } catch { /* silent */ }
      })();
    });
  }, [step, dest]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col">

      {/* ── 헤더 ──────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 py-4">
        <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[color:var(--text-muted)] shadow-sm border border-[color:var(--border)] hover:bg-[color:var(--brand-bg)] transition-colors">
          ←
        </Link>
        <div>
          <p className="text-xs text-[color:var(--text-faint)]">아이 모드</p>
          <h1 className="text-base font-bold text-[color:var(--text)]">혼자가도 괜찮아 🧒</h1>
        </div>
        {step === "navigate" && sessionCode && (
          <div className="ml-auto card px-4 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--text-faint)]">부모님 코드</p>
            <p className="font-mono text-xl font-bold tracking-[0.2em] text-[color:var(--text)]">{sessionCode}</p>
          </div>
        )}
      </header>

      <div className="flex-1 px-5 pb-6">

        {/* ── Step 1: 위치 확인 ────────────────────── */}
        {step === "locate" && (
          <div className="flex flex-col items-center gap-7 pt-10 text-center">
            <div className="icon-circle-brand h-24 w-24 text-5xl shadow-[0_8px_32px_rgba(6,182,168,0.32)]">
              📍
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[color:var(--text)]">지금 어디 있어?</h2>
              <p className="mt-2 text-sm text-[color:var(--text-muted)]">현재 위치를 확인할게!</p>
            </div>
            {geoError && (
              <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                {geoError}
              </div>
            )}
            <button type="button" onClick={locate} className="btn-brand text-lg">
              {DEMO_MODE ? "🎮 데모 시작" : "📍 내 위치 찾기"}
            </button>
          </div>
        )}

        {/* ── Step 2: 목적지 선택 ──────────────────── */}
        {step === "select" && (
          <div className="flex flex-col gap-5 pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[color:var(--text)]">어디 갈 거야?</h2>
              <p className="mt-1 text-sm text-[color:var(--text-muted)]">목적지를 선택해줘!</p>
            </div>
            <div className="flex flex-col gap-3">
              {DESTINATIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => selectDest(d)}
                  className="card flex items-center gap-4 p-5 text-left transition-all hover:border-[color:var(--brand)]/40 hover:shadow-[0_4px_24px_rgba(6,182,168,0.14)] active:scale-[0.98]"
                >
                  <span className="icon-circle-brand flex-shrink-0 text-2xl">{d.icon}</span>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-[color:var(--text)]">{d.label}</p>
                    <p className="text-xs text-[color:var(--text-muted)]">여기로 갈게요</p>
                  </div>
                  <span className="text-[color:var(--brand)] font-bold">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: 이동 중 ───────────────────────── */}
        {step === "navigate" && dest && (
          <div className="flex flex-col gap-4 pt-3">

            {/* 이동 상태 배너 */}
            <div className="hero-gradient rounded-[20px] p-4 text-center text-white">
              <p className="text-sm font-bold">{dest.icon} {dest.label}(으)로 이동 중!</p>
              <p className="mt-0.5 text-xs text-white/75">부모님이 내 위치를 보고 있어요 👀</p>
            </div>

            {/* 지도 */}
            <div
              ref={mapRef}
              className="h-56 w-full overflow-hidden rounded-[20px] border border-[color:var(--border)] bg-[color:var(--brand-bg)]"
              style={{ minHeight: 224 }}
            >
              {mapState === "idle" && (
                <div className="flex h-full items-center justify-center text-sm text-[color:var(--text-muted)]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-5 w-5 rounded-full border-2 border-[color:var(--brand-light)] border-t-[color:var(--brand)] spin" />
                    지도 로딩 중...
                  </div>
                </div>
              )}
              {mapState === "error" && (
                <div className="flex h-full items-center justify-center text-sm text-[color:var(--text-faint)]">
                  지도를 표시할 수 없습니다
                </div>
              )}
            </div>

            {/* 안내 카드 */}
            <div className="card p-5">
              <p className="text-sm font-bold text-[color:var(--text)]">📢 안내</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-[color:var(--text-muted)]">
                <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[color:var(--brand)] mt-1.5" />지도를 보며 {dest.label} 방향으로 이동해요</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[color:var(--brand)] mt-1.5" />모르면 주변 어른께 물어봐요</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[color:var(--brand)] mt-1.5" />위험하면 아동안전지킴이집으로 가요 🏠</li>
              </ul>
            </div>

            {/* 도착 알림 */}
            {arrived && (
              <div className="hero-gradient rounded-[20px] p-6 text-center shadow-lg">
                <p className="text-4xl">🎉</p>
                <p className="mt-3 text-lg font-bold text-white">{dest.icon} {dest.label}에 도착했어요!</p>
                <p className="mt-1 text-sm text-white/80">잘했어요! 부모님께 알림이 전송됐어요.</p>
              </div>
            )}

            {/* 실시간 데이터 */}
            <SignalWarning stdgCd={dest.stdgCd} />
            {dest.id === "library" && <LibraryStatus stdgCd={dest.stdgCd} />}
            <BusArrival stdgCd={dest.stdgCd} />

            {/* AI 음성 안내 */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void speakVoiceGuide(`아이가 ${dest.label} 방향으로 이동 중입니다. 안전하게 귀가 중입니다.`)}
                className="card flex w-full items-center justify-center gap-2 py-4 text-sm font-semibold text-[color:var(--brand)] transition-all hover:shadow-[0_4px_20px_rgba(6,182,168,0.14)] active:scale-[0.98]"
              >
                🔊 AI 음성 안내 받기
              </button>
              {voiceText && (
                <div className="card-accent px-4 py-3 text-sm text-[color:var(--text-muted)]">
                  💬 {voiceText}
                </div>
              )}
            </div>

            {/* 위치 표시 */}
            {pos && (
              <div className="rounded-[14px] bg-[color:var(--brand-bg)] px-4 py-3 text-center text-xs text-[color:var(--text-faint)]">
                현재 위치: {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)} · 10초마다 갱신
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
