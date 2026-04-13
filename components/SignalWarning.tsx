"use client";

import useSWR from "swr";
import { LoadingFallback } from "./LoadingFallback";
import type { SignalApiResponse, SignalItem } from "@/lib/types";

const fetcher = async (url: string): Promise<SignalApiResponse> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

function SignalBadge({ stt }: { stt: string }) {
  const u = stt.toUpperCase();
  if (u === "RED")   return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />적색</span>;
  if (u === "GREEN") return <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--brand-bg)] px-2.5 py-1 text-xs font-bold text-[color:var(--brand-dark)]"><span className="h-2 w-2 rounded-full bg-[color:var(--brand)]" />녹색</span>;
  return                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700"><span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />황색</span>;
}

function SignalCard({ item }: { item: SignalItem }) {
  const isDanger = item.dangerYn === "Y" && item.sigStt?.toUpperCase() === "RED";
  return (
    <div className={`flex items-center justify-between rounded-[14px] border px-4 py-3 ${isDanger ? "border-red-200 bg-red-50" : "card-inner"}`}>
      <div>
        <p className={`text-sm font-semibold ${isDanger ? "text-red-800" : "text-[color:var(--text)]"}`}>
          {isDanger ? "⚠️ " : ""}{item.crossNm ?? "교차로"}
        </p>
        {item.remTime !== undefined && <p className="text-xs text-[color:var(--text-faint)]">잔여 {item.remTime}초</p>}
      </div>
      <SignalBadge stt={item.sigStt ?? "GREEN"} />
    </div>
  );
}

export function SignalWarning({ stdgCd }: { stdgCd: string }) {
  const { data, error, isLoading } = useSWR(
    stdgCd ? `/api/signal?stdgCd=${encodeURIComponent(stdgCd)}` : null,
    fetcher, { refreshInterval: 10_000, revalidateOnFocus: true },
  );

  if (isLoading) return <LoadingFallback label="교통안전 신호등 정보 확인 중" />;
  if (error || !data?.items?.length) return null;

  const dangerItems = data.items.filter(i => i.dangerYn === "Y" && i.sigStt?.toUpperCase() === "RED");
  const sorted      = [...dangerItems, ...data.items.filter(i => !(i.dangerYn === "Y" && i.sigStt?.toUpperCase() === "RED"))];

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">교통안전 신호등</p>
        <span className="rounded-full bg-[color:var(--brand-bg)] px-2 py-0.5 text-xs font-semibold text-[color:var(--brand-dark)]">
          {data.source === "public-data" ? "실시간" : "데모"}
        </span>
      </div>
      {dangerItems.length > 0 && (
        <div className="mb-3 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          ⚠️ 경로 상 위험 교차로 {dangerItems.length}곳 — 빨간불에 반드시 멈추세요!
        </div>
      )}
      <div className="flex flex-col gap-2">
        {sorted.slice(0, 3).map(item => <SignalCard key={item.sigId ?? item.crossNm} item={item} />)}
      </div>
    </div>
  );
}
