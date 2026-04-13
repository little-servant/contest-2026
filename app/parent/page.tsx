"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

type LocationData = { lat: number; lng: number; ts: number; stale: boolean; arrived?: boolean };
type AlertType    = "stopped" | "deviated" | "disconnected" | "arrived" | null;

export default function ParentPage() {
  const [code,          setCode]          = useState("");
  const [connected,     setConnected]     = useState(false);
  const [loc,           setLoc]           = useState<LocationData | null>(null);
  const [alert,         setAlert]         = useState<AlertType>(null);
  const [lastUpdateAgo, setLastUpdateAgo] = useState<string>("");

  const mapRef         = useRef<HTMLDivElement>(null);
  const markerRef      = useRef<unknown>(null);
  const mapInstanceRef = useRef<{ setCenter: (c: unknown) => void; relayout: () => void } | null>(null);
  const posHistoryRef  = useRef<Array<{ lat: number; lng: number; ts: number }>>([]);
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };

  const checkAlerts = useCallback((data: LocationData) => {
    if (data.arrived)   { setAlert("arrived");      return; }
    if (data.stale)     { setAlert("disconnected"); return; }
    const history = posHistoryRef.current;
    if (history.length >= 6) {
      const oldest = history[history.length - 6];
      const dist   = Math.sqrt(((data.lat - oldest.lat) * 111000) ** 2 + ((data.lng - oldest.lng) * 88000) ** 2);
      if (dist < 50 && Date.now() - oldest.ts > 60000) { setAlert("stopped"); return; }
    }
    const firstPos = posHistoryRef.current[0];
    if (firstPos && !data.stale && !data.arrived) {
      const straight = Math.sqrt(((data.lat - firstPos.lat) * 111000) ** 2 + ((data.lng - firstPos.lng) * 88000) ** 2);
      if (straight > 1500 && history.length > 3) { setAlert("deviated"); return; }
    }
    setAlert(null);
  }, []);

  const startPolling = useCallback((sessionCode: string) => {
    const poll = async () => {
      try {
        const res  = await fetch(`/api/location/poll?code=${sessionCode}`);
        if (!res.ok) return;
        const data: LocationData = await res.json();
        if (data.lat && data.lng) {
          setLoc(data);
          posHistoryRef.current = [...posHistoryRef.current.slice(-11), { lat: data.lat, lng: data.lng, ts: data.ts }];
          checkAlerts(data);
          const ago = Math.round((Date.now() - data.ts) / 1000);
          setLastUpdateAgo(ago < 60 ? `${ago}초 전` : `${Math.round(ago / 60)}분 전`);
        }
      } catch { /* silent */ }
    };
    poll();
    pollRef.current = setInterval(poll, 5000);
  }, [checkAlerts]);

  const connect = () => { if (code.length !== 4) return; setConnected(true); startPolling(code); };
  useEffect(() => () => stopPoll(), []);

  useEffect(() => {
    if (!connected || !mapRef.current) return;
    const kakao = window.kakao;
    if (!kakao?.maps) return;
    kakao.maps.load(() => {
      if (!mapRef.current || !kakao.maps) return;
      const center = new kakao.maps.LatLng(37.5085, 127.0245);
      const map    = new kakao.maps.Map(mapRef.current, { center, level: 5 });
      mapInstanceRef.current = map;
      markerRef.current      = new kakao.maps.Marker({ map, position: center });
    });
  }, [connected]);

  useEffect(() => {
    if (!loc || !mapInstanceRef.current) return;
    const kakao = window.kakao;
    if (!kakao?.maps) return;
    const newPos = new kakao.maps.LatLng(loc.lat, loc.lng);
    (markerRef.current as { setPosition?: (p: unknown) => void })?.setPosition?.(newPos);
    mapInstanceRef.current.setCenter(newPos);
  }, [loc]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col">

      {/* ── 헤더 ──────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 py-4">
        <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[color:var(--text-muted)] shadow-sm border border-[color:var(--border)] hover:bg-[color:var(--parent-bg)] transition-colors">
          ←
        </Link>
        <div>
          <p className="text-xs text-[color:var(--text-faint)]">부모 모드</p>
          <h1 className="text-base font-bold text-[color:var(--text)]">아이 위치 확인 👨‍👩‍👧</h1>
        </div>
        {connected && loc && (
          <div className="ml-auto">
            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${loc.stale ? "bg-red-100 text-red-700" : "bg-[color:var(--brand-bg)] text-[color:var(--brand-dark)]"}`}>
              {loc.stale ? "● 연결 끊김" : "● 연결됨"}
            </span>
          </div>
        )}
      </header>

      <div className="flex-1 px-5 pb-6">

        {/* ── 코드 입력 ────────────────────────────── */}
        {!connected && (
          <div className="flex flex-col items-center gap-7 pt-10 text-center">
            <div className="icon-circle-parent h-24 w-24 text-5xl shadow-[0_8px_32px_rgba(59,130,246,0.3)]">
              🔑
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[color:var(--text)]">아이 코드 입력</h2>
              <p className="mt-2 text-sm text-[color:var(--text-muted)]">아이 앱에 표시된 4자리 숫자를 입력해주세요</p>
            </div>
            <input
              type="number"
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 4))}
              placeholder="0000"
              className="w-44 rounded-2xl border-2 border-[color:var(--border)] bg-white py-4 text-center font-mono text-4xl font-bold tracking-[0.2em] text-[color:var(--text)] outline-none focus:border-[color:var(--parent)]/60 transition-colors"
              inputMode="numeric"
            />
            <button type="button" onClick={connect} disabled={code.length !== 4} className="btn-parent disabled:opacity-40">
              연결하기
            </button>
          </div>
        )}

        {/* ── 모니터링 ─────────────────────────────── */}
        {connected && (
          <div className="flex flex-col gap-4 pt-2">

            {/* 경보 배너 */}
            {alert === "stopped" && (
              <AlertBanner color="amber" icon="⚠️" title="아이가 멈춰있어요!" desc="60초 이상 이동이 감지되지 않았습니다. 아이에게 연락해보세요." />
            )}
            {alert === "disconnected" && (
              <AlertBanner color="red" icon="📵" title="연결이 끊겼어요" desc="아이 앱이 종료되었거나 네트워크가 불안정합니다." />
            )}
            {alert === "deviated" && (
              <AlertBanner color="amber" icon="🧭" title="이동 경로가 크게 벗어났어요" desc="출발 지점 대비 비정상적인 위치가 감지되었습니다." />
            )}
            {alert === "arrived" && (
              <div className="hero-gradient flex items-center gap-3 rounded-[20px] p-4 text-white">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="font-bold">목적지에 도착했어요!</p>
                  <p className="mt-0.5 text-xs text-white/80">아이가 안전하게 도착했습니다.</p>
                </div>
              </div>
            )}
            {alert === null && loc && (
              <div className="card-accent flex items-center gap-3 p-4">
                <span className="text-xl">✅</span>
                <div>
                  <p className="text-sm font-bold text-[color:var(--text)]">정상 이동 중</p>
                  <p className="text-xs text-[color:var(--text-muted)]">{lastUpdateAgo} 갱신 · 5초마다 확인</p>
                </div>
              </div>
            )}

            {/* 지도 */}
            <div
              ref={mapRef}
              className="h-72 w-full overflow-hidden rounded-[20px] border border-[color:var(--border)] bg-[color:var(--parent-bg)]"
              style={{ minHeight: 288 }}
            >
              {!loc && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-[color:var(--text-muted)]">
                  <div className="h-6 w-6 rounded-full border-2 border-[color:var(--parent-light)] border-t-[color:var(--parent)] spin" />
                  <p className="text-sm">아이 위치 수신 중...</p>
                </div>
              )}
            </div>

            {/* 위치 정보 카드 */}
            {loc && (
              <div className="card-accent-parent p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--text-faint)]">최근 위치</p>
                <p className="mt-1 font-mono text-sm font-semibold text-[color:var(--text)]">
                  {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                </p>
                <p className="mt-1 text-xs text-[color:var(--text-faint)]">{lastUpdateAgo} 갱신</p>
              </div>
            )}

            {/* 데모 버튼 */}
            {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
              <div className="card p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-600">🎮 데모 시뮬레이션</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "정지 경보", action: () => setAlert("stopped"),      cls: "bg-amber-100 text-amber-800" },
                    { label: "연결 끊김", action: () => setAlert("disconnected"), cls: "bg-red-100 text-red-800" },
                    { label: "도착",      action: () => setAlert("arrived"),      cls: "bg-[color:var(--brand-bg)] text-[color:var(--brand-dark)]" },
                    { label: "정상",      action: () => setAlert(null),           cls: "bg-slate-100 text-slate-700" },
                  ].map(({ label, action, cls }) => (
                    <button key={label} type="button" onClick={action} className={`rounded-[14px] py-2 text-xs font-bold transition active:scale-95 ${cls}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function AlertBanner({ color, icon, title, desc }: { color: "amber" | "red"; icon: string; title: string; desc: string }) {
  const cls = color === "amber"
    ? "bg-amber-50 border-l-4 border-amber-400 text-amber-900"
    : "bg-red-50 border-l-4 border-red-400 text-red-900";
  return (
    <div className={`flex items-start gap-3 rounded-[20px] border border-[color:var(--border)] p-4 ${cls}`}>
      <span className="mt-0.5 text-xl">{icon}</span>
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-0.5 text-xs opacity-80">{desc}</p>
      </div>
    </div>
  );
}
