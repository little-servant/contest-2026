"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { LoadingFallback } from "./LoadingFallback";
import { EmptyState } from "@/components/ui/EmptyState";
import type { LibraryApiResponse } from "@/lib/types";

const fetcher = async (url: string): Promise<LibraryApiResponse> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

export function LibraryStatus({ stdgCd }: { stdgCd: string }) {
  const { data, error, isLoading, isValidating } = useSWR(
    stdgCd ? `/api/library?stdgCd=${encodeURIComponent(stdgCd)}` : null,
    fetcher, { refreshInterval: 30_000, revalidateOnFocus: true },
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  useEffect(() => { if (!data || data.error || data.source === "no-key" || isValidating) return; setLastUpdatedAt(Date.now()); }, [data, isValidating]);

  if (isLoading) return <LoadingFallback label="도서관 열람실 현황을 확인하는 중" />;
  if (data?.source === "no-key") return null;
  if (error || data?.error) return (
    <div className="rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p className="font-bold">도서관 API 오류</p>
      <p className="mt-1">{data?.message ?? "응답을 불러오지 못했습니다."}</p>
    </div>
  );

  const items = data?.items ?? [];
  if (items.length === 0) return <div className="card p-4"><EmptyState title="열람실 정보 없음" description="선택한 지역의 도서관 열람실 현황 데이터가 없습니다." icon="📚" /></div>;

  const s = lastUpdatedAt ? Math.max(0, Math.floor((now - lastUpdatedAt) / 1000)) : null;

  return (
    <div className="card-accent p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--brand)]">Library</p>
          <p className="mt-1.5 text-base font-bold text-[color:var(--text)]">공공도서관 열람실 현황</p>
        </div>
        {isValidating
          ? <span className="text-xs font-semibold text-[color:var(--brand)] animate-pulse">● 갱신 중</span>
          : <span className="text-xs text-[color:var(--text-faint)]">{s === null ? "갱신 대기 중" : s < 5 ? "방금 갱신됨" : `${s}초 전`}</span>
        }
      </div>
      <div className="mt-4 space-y-2">
        {items.slice(0, 4).map((item, i) => {
          const avl  = item.avlSeatCnt ?? 0;
          const tot  = item.totSeatCnt ?? 0;
          const pct  = tot > 0 ? Math.round(((tot - avl) / tot) * 100) : 0;
          const isOk = avl > 0;
          return (
            <div key={`${item.libNm}-${item.rdrmNm}-${i}`} className="card-inner px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[color:var(--text)]">{item.libNm ?? "도서관"}</p>
                  <p className="truncate text-xs text-[color:var(--text-faint)]">{item.rdrmNm ?? "열람실"}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${isOk ? "bg-[color:var(--brand-bg)] text-[color:var(--brand-dark)]" : "bg-red-50 text-red-600"}`}>
                  {isOk ? `${avl}석 가능` : "만석"}
                </span>
              </div>
              {tot > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[color:var(--brand)] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-[color:var(--text-faint)]">{tot}석 중 {item.useSeatCnt ?? tot - avl}석 사용 중</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {items.length > 4 && <p className="mt-3 text-center text-xs text-[color:var(--text-faint)]">외 {items.length - 4}개 열람실</p>}
      <p className="mt-3 text-xs text-[color:var(--text-faint)]">{items[0]?.totDt ? `기준 시각 ${items[0].totDt}` : "실시간 응답"}</p>
    </div>
  );
}
