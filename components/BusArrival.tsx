"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { LoadingFallback } from "./LoadingFallback";
import { EmptyState } from "@/components/ui/EmptyState";
import type { BusApiResponse } from "@/lib/types";

const fetcher = async (url: string): Promise<BusApiResponse> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

export function BusArrival({ stdgCd }: { stdgCd?: string }) {
  const query = stdgCd ? `/api/bus?stdgCd=${encodeURIComponent(stdgCd)}` : null;
  const { data, error, isLoading, isValidating } = useSWR(query, fetcher, { refreshInterval: 30_000, revalidateOnFocus: true });
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  useEffect(() => { if (!data || data.error || data.source === "no-key" || isValidating) return; setLastUpdatedAt(Date.now()); }, [data, isValidating]);

  if (!stdgCd) return (
    <div className="rounded-[20px] border border-dashed border-[color:var(--border)] bg-slate-50 p-4 text-sm text-[color:var(--text-muted)]">
      <p>이 기관은 버스 실시간 정보를 지원하지 않습니다.</p>
      <Link href="/facilities" className="mt-2 inline-block text-[color:var(--brand)] underline">다른 기관 보기 →</Link>
    </div>
  );
  if (isLoading) return <LoadingFallback label="전국 초정밀 버스 위치 정보를 확인하는 중" />;
  if (data?.source === "no-key") return null;
  if (error || data?.error) return (
    <div className="rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p className="font-bold">버스 API 오류</p>
      <p className="mt-1">{data?.message ?? "응답을 불러오지 못했습니다."}</p>
    </div>
  );

  const route    = data?.routes?.[0];
  const position = data?.positions?.[0];
  if (!route && !position) return <div className="card p-4"><EmptyState title="버스 실시간 정보 없음" description="선택한 지역의 초정밀 버스 노선/위치 응답이 비어 있습니다." icon="🚏" /></div>;

  return (
    <div className="card-accent p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--brand)]">Bus</p>
          <p className="mt-1.5 text-base font-bold text-[color:var(--text)]">{route?.rteNo ?? position?.rteNo ?? "초정밀 버스 노선"}</p>
        </div>
        <Refresh isValidating={isValidating} lastUpdatedAt={lastUpdatedAt} now={now} />
      </div>
      <div className="mt-4 grid gap-2">
        <InfoRow label="운행 구간"   value={route?.stpnt && route?.edpnt ? `${route.stpnt} → ${route.edpnt}` : "-"} />
        <InfoRow label="첫차 / 막차" value={route?.vhclFstTm && route?.vhclLstTm ? `${route.vhclFstTm} / ${route.vhclLstTm}` : "-"} />
        <InfoRow label="실시간 위치" value={position?.vhclNo ? `${position.vhclNo} · ${position.lat ?? ""}, ${position.lot ?? ""}` : "-"} />
        <InfoRow label="도착예정시간" value="현재 데이터셋 미제공" />
      </div>
      <p className="mt-3 text-xs text-[color:var(--text-faint)]">수집 시각 {formatCollectedAt(position?.gthrDt, lastUpdatedAt)}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-inner px-3 py-2.5">
      <p className="text-xs text-[color:var(--text-faint)]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-[color:var(--text)]">{value}</p>
    </div>
  );
}

function Refresh({ isValidating, lastUpdatedAt, now }: { isValidating: boolean; lastUpdatedAt: number | null; now: number }) {
  if (isValidating) return <span className="text-xs font-semibold text-[color:var(--brand)] animate-pulse">● 갱신 중</span>;
  const s = lastUpdatedAt ? Math.max(0, Math.floor((now - lastUpdatedAt) / 1000)) : null;
  return <span className="text-xs text-[color:var(--text-faint)]">{s === null ? "갱신 대기 중" : s < 5 ? "방금 갱신됨" : `${s}초 전`}</span>;
}

function formatCollectedAt(gthrDt?: string, fallback?: number | null) {
  if (typeof gthrDt === "string" && gthrDt.trim()) {
    const m = gthrDt.match(/(\d{2}:\d{2}:\d{2})/);
    if (m?.[1]) return m[1];
    const d = gthrDt.replace(/\D/g, "");
    if (d.length >= 14) return `${d.slice(8,10)}:${d.slice(10,12)}:${d.slice(12,14)}`;
    const p = new Date(gthrDt);
    if (!Number.isNaN(p.getTime())) return p.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  }
  return new Date(fallback ?? Date.now()).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}
