"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { LoadingFallback } from "./LoadingFallback";
import type { SignalApiResponse, SignalItem } from "@/lib/types";

const fetcher = async (url: string): Promise<SignalApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

function SignalBadge({ stt }: { stt: string }) {
  const upper = stt.toUpperCase();
  if (upper === "RED")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        적색
      </span>
    );
  if (upper === "GREEN")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        녹색
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700">
      <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
      황색
    </span>
  );
}

function SignalCard({ item }: { item: SignalItem }) {
  const isDanger = item.dangerYn === "Y" && item.sigStt?.toUpperCase() === "RED";
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
        isDanger
          ? "border-red-200 bg-red-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-0.5">
        <p className={`text-sm font-semibold ${isDanger ? "text-red-800" : "text-slate-800"}`}>
          {isDanger ? "⚠️ " : ""}
          {item.crossNm ?? "교차로"}
        </p>
        {item.remTime !== undefined && (
          <p className="text-xs text-slate-500">잔여 {item.remTime}초</p>
        )}
      </div>
      <SignalBadge stt={item.sigStt ?? "GREEN"} />
    </div>
  );
}

export function SignalWarning({ stdgCd }: { stdgCd: string }) {
  const { data, error, isLoading } = useSWR(
    stdgCd ? `/api/signal?stdgCd=${encodeURIComponent(stdgCd)}` : null,
    fetcher,
    { refreshInterval: 10_000, revalidateOnFocus: true },
  );

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  if (isLoading) return <LoadingFallback label="교통안전 신호등 정보 확인 중" />;
  if (error) return null;
  if (!data?.items?.length) return null;

  const dangerItems = data.items.filter(
    (i) => i.dangerYn === "Y" && i.sigStt?.toUpperCase() === "RED",
  );
  const safeItems = data.items.filter(
    (i) => !(i.dangerYn === "Y" && i.sigStt?.toUpperCase() === "RED"),
  );
  const sorted = [...dangerItems, ...safeItems];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          교통안전 신호등
        </p>
        <span className="text-xs text-slate-400">
          {data.source === "public-data" ? "실시간" : "데모"}
        </span>
      </div>
      {dangerItems.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          ⚠️ 경로 상 위험 교차로 {dangerItems.length}곳 — 빨간불에 반드시 멈추세요!
        </div>
      )}
      <div className="flex flex-col gap-2">
        {sorted.slice(0, 3).map((item) => (
          <SignalCard key={item.sigId ?? item.crossNm} item={item} />
        ))}
      </div>
    </div>
  );
}
