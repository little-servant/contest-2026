"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

type LocationData = {
  lat: number;
  lng: number;
  ts: number;
  stale: boolean;
  arrived?: boolean;
};

type AlertType = "stopped" | "deviated" | "disconnected" | "arrived" | null;

export default function ParentPage() {
  const [code, setCode] = useState("");
  const [connected, setConnected] = useState(false);
  const [loc, setLoc] = useState<LocationData | null>(null);
  const [alert, setAlert] = useState<AlertType>(null);
  const [lastUpdateAgo, setLastUpdateAgo] = useState<string>("");
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<unknown>(null);
  const mapInstanceRef = useRef<{
    setCenter: (c: unknown) => void;
    relayout: () => void;
  } | null>(null);
  const posHistoryRef = useRef<Array<{ lat: number; lng: number; ts: number }>>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // 경보 판단
  const checkAlerts = useCallback((data: LocationData) => {
    if (data.arrived) {
      setAlert("arrived");
      return;
    }

    if (data.stale) {
      setAlert("disconnected");
      return;
    }

    const history = posHistoryRef.current;
    if (history.length >= 6) {
      // 정지 감지: 60초간 반경 50m 미만 이동
      const oldest = history[history.length - 6];
      const dLat = (data.lat - oldest.lat) * 111000;
      const dLng = (data.lng - oldest.lng) * 88000;
      const dist = Math.sqrt(dLat ** 2 + dLng ** 2);
      if (dist < 50 && Date.now() - oldest.ts > 60000) {
        setAlert("stopped");
        return;
      }
    }

    // 경로 이탈: 첫 수신 위치 기준 반경 1km 초과 시
    const firstPos = posHistoryRef.current[0];
    if (firstPos && !data.stale && !data.arrived) {
      const dLat = (data.lat - firstPos.lat) * 111000;
      const dLng = (data.lng - firstPos.lng) * 88000;
      const straightDist = Math.sqrt(dLat ** 2 + dLng ** 2);
      // 출발점 기준 너무 먼 곳으로 이동 (1km+) — 이탈 가능성
      // 실제 경로 이탈보다는 '비정상 이동' 감지로 활용
      if (straightDist > 1500 && history.length > 3) {
        setAlert("deviated");
        return;
      }
    }

    setAlert(null);
  }, []);

  // 폴링 시작
  const startPolling = useCallback(
    (sessionCode: string) => {
      const poll = async () => {
        try {
          const res = await fetch(`/api/location/poll?code=${sessionCode}`);
          if (!res.ok) return;
          const data: LocationData = await res.json();
          if (data.lat && data.lng) {
            setLoc(data);
            posHistoryRef.current = [
              ...posHistoryRef.current.slice(-11),
              { lat: data.lat, lng: data.lng, ts: data.ts },
            ];
            checkAlerts(data);
            const ago = Math.round((Date.now() - data.ts) / 1000);
            setLastUpdateAgo(ago < 60 ? `${ago}초 전` : `${Math.round(ago / 60)}분 전`);
          }
        } catch {
          // silent
        }
      };

      poll();
      pollRef.current = setInterval(poll, 5000);
    },
    [checkAlerts],
  );

  const connect = () => {
    if (code.length !== 4) return;
    setConnected(true);
    startPolling(code);
  };

  useEffect(() => () => stopPoll(), []);

  // 카카오맵 초기화
  useEffect(() => {
    if (!connected || !mapRef.current) return;
    const kakao = window.kakao;
    if (!kakao?.maps) return;

    kakao.maps.load(() => {
      if (!mapRef.current || !kakao.maps) return;
      const center = new kakao.maps.LatLng(37.5085, 127.0245);
      const map = new kakao.maps.Map(mapRef.current, { center, level: 5 });
      mapInstanceRef.current = map;
      markerRef.current = new kakao.maps.Marker({ map, position: center });
    });
  }, [connected]);

  // 마커 이동
  useEffect(() => {
    if (!loc || !mapInstanceRef.current) return;
    const kakao = window.kakao;
    if (!kakao?.maps) return;

    const newPos = new kakao.maps.LatLng(loc.lat, loc.lng);
    (markerRef.current as { setMap: (m: unknown) => void; setPosition?: (p: unknown) => void })?.setPosition?.(newPos);
    mapInstanceRef.current.setCenter(newPos);
  }, [loc]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col">
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-5 py-4">
        <Link href="/" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">←</Link>
        <div>
          <p className="text-xs text-slate-400">부모 모드</p>
          <h1 className="text-base font-bold text-slate-900">아이 위치 확인 👨‍👩‍👧</h1>
        </div>
        {connected && loc && (
          <div className="ml-auto">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${loc.stale ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
              {loc.stale ? "연결 끊김" : "연결됨"}
            </span>
          </div>
        )}
      </header>

      <div className="flex-1 px-5 pb-8">
        {/* 코드 입력 */}
        {!connected && (
          <div className="flex flex-col items-center gap-6 pt-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-100">
              <span className="text-4xl">🔑</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">아이 코드 입력</h2>
              <p className="mt-2 text-sm text-slate-500">아이 앱에 표시된 4자리 숫자를 입력해주세요</p>
            </div>
            <input
              type="number"
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 4))}
              placeholder="0000"
              className="w-40 rounded-2xl border-2 border-slate-200 bg-white py-4 text-center text-3xl font-bold tracking-widest text-slate-900 outline-none focus:border-sky-400"
              inputMode="numeric"
            />
            <button
              type="button"
              onClick={connect}
              disabled={code.length !== 4}
              className="w-full rounded-3xl bg-sky-500 py-5 text-lg font-bold text-white shadow-lg transition disabled:opacity-40 active:scale-95"
            >
              연결하기
            </button>
          </div>
        )}

        {/* 모니터링 화면 */}
        {connected && (
          <div className="flex flex-col gap-4 pt-2">
            {/* 경보 배너 */}
            {alert === "stopped" && (
              <AlertBanner
                color="amber"
                icon="⚠️"
                title="아이가 멈춰있어요!"
                desc="60초 이상 이동이 감지되지 않았습니다. 아이에게 연락해보세요."
              />
            )}
            {alert === "disconnected" && (
              <AlertBanner
                color="red"
                icon="📵"
                title="연결이 끊겼어요"
                desc="아이 앱이 종료되었거나 네트워크가 불안정합니다."
              />
            )}
            {alert === "deviated" && (
              <AlertBanner
                color="amber"
                icon="🧭"
                title="이동 경로가 크게 벗어났어요"
                desc="출발 지점 대비 비정상적으로 먼 위치가 감지되었습니다."
              />
            )}
            {alert === "arrived" && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="font-semibold text-emerald-800">목적지에 도착했어요!</p>
                  <p className="mt-0.5 text-xs text-emerald-600">아이가 안전하게 도착했습니다.</p>
                </div>
              </div>
            )}
            {alert === null && loc && (
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
                <span className="text-xl">✅</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-700">정상 이동 중</p>
                  <p className="text-xs text-emerald-600">{lastUpdateAgo} 갱신 · 5초마다 확인</p>
                </div>
              </div>
            )}

            {/* 지도 */}
            <div
              ref={mapRef}
              className="h-72 w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100"
              style={{ minHeight: 288 }}
            >
              {!loc && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500" />
                  <p className="text-sm">아이 위치 수신 중...</p>
                </div>
              )}
            </div>

            {/* 위치 정보 */}
            {loc && (
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">최근 위치</p>
                <p className="mt-1 font-mono text-sm text-slate-700">
                  {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                </p>
                <p className="mt-1 text-xs text-slate-400">{lastUpdateAgo} 갱신</p>
              </div>
            )}

            {/* 데모 버튼 */}
            {true && (
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="mb-2 text-xs font-semibold text-amber-700">🎮 데모 시뮬레이션</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAlert("stopped")}
                    className="flex-1 rounded-xl bg-amber-200 py-2 text-xs font-semibold text-amber-800"
                  >
                    정지 경보
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlert("disconnected")}
                    className="flex-1 rounded-xl bg-red-200 py-2 text-xs font-semibold text-red-800"
                  >
                    연결 끊김
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlert("arrived")}
                    className="flex-1 rounded-xl bg-emerald-200 py-2 text-xs font-semibold text-emerald-800"
                  >
                    도착
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlert(null)}
                    className="flex-1 rounded-xl bg-teal-200 py-2 text-xs font-semibold text-teal-800"
                  >
                    정상
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function AlertBanner({
  color,
  icon,
  title,
  desc,
}: {
  color: "amber" | "red";
  icon: string;
  title: string;
  desc: string;
}) {
  const cls = color === "amber"
    ? "bg-amber-50 border-amber-200 text-amber-800"
    : "bg-red-50 border-red-200 text-red-800";
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${cls}`}>
      <span className="text-xl">{icon}</span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-xs opacity-80">{desc}</p>
      </div>
    </div>
  );
}
