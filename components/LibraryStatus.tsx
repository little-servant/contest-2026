"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { LoadingFallback } from "./LoadingFallback";
import { EmptyState } from "@/components/ui/EmptyState";
import type { LibraryApiResponse } from "@/lib/types";

const fetcher = async (url: string): Promise<LibraryApiResponse> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

export function LibraryStatus({ stdgCd }: { stdgCd: string }) {
  const { data, error, isLoading, isValidating } = useSWR(
    stdgCd ? `/api/library?stdgCd=${encodeURIComponent(stdgCd)}` : null,
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: true },
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!data || data.error || data.source === "no-key" || isValidating) return;
    setLastUpdatedAt(Date.now());
  }, [data, isValidating]);

  if (isLoading) return <LoadingFallback label="도서관 열람실 현황을 확인하는 중" />;
  if (data?.source === "no-key") return null;

  if (error || data?.error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        <p className="font-medium">도서관 API 오류</p>
        <p className="mt-2">{data?.message ?? "응답을 불러오지 못했습니다."}</p>
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <EmptyState
          title="열람실 정보 없음"
          description="선택한 지역의 도서관 열람실 현황 데이터가 없습니다."
          icon="📚"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">
            Library
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            공공도서관 열람실 현황
          </p>
        </div>
        <span className="text-xs text-slate-500">
          {isValidating
            ? <span className="animate-pulse font-medium text-violet-600">● 갱신 중</span>
            : lastUpdatedAt
              ? `${Math.max(0, Math.floor((now - lastUpdatedAt) / 1000))}초 전`
              : "갱신 대기 중"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {items.slice(0, 4).map((item, i) => {
          const avl = item.avlSeatCnt ?? 0;
          const tot = item.totSeatCnt ?? 0;
          const pct = tot > 0 ? Math.round(((tot - avl) / tot) * 100) : 0;
          const isAvailable = avl > 0;

          return (
            <div
              key={`${item.libNm}-${item.rdrmNm}-${i}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {item.libNm ?? "도서관"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {item.rdrmNm ?? "열람실"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isAvailable
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {isAvailable ? `${avl}석 가능` : "만석"}
                </span>
              </div>
              {tot > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-violet-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {tot}석 중 {item.useSeatCnt ?? tot - avl}석 사용 중
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {items.length > 4 && (
        <p className="mt-3 text-xs text-slate-400 text-center">
          외 {items.length - 4}개 열람실
        </p>
      )}

      <p className="mt-3 text-xs text-slate-500">
        {items[0]?.totDt ? `기준 시각 ${items[0].totDt}` : "실시간 응답"}
      </p>
    </div>
  );
}
