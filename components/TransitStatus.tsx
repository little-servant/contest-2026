"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { LoadingFallback } from "./LoadingFallback";
import { EmptyState } from "@/components/ui/EmptyState";
import type { TransitApiResponse } from "@/lib/types";

const fetcher = async (url: string): Promise<TransitApiResponse> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

export function TransitStatus({ stdgCd }: { stdgCd: string }) {
  const { data, error, isLoading, isValidating } = useSWR(
    stdgCd ? `/api/transit?stdgCd=${encodeURIComponent(stdgCd)}` : null,
    fetcher, { refreshInterval: 30_000, revalidateOnFocus: true },
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  useEffect(() => { if (!data || data.error || data.source === "no-key" || isValidating) return; setLastUpdatedAt(Date.now()); }, [data, isValidating]);

  if (isLoading) return <LoadingFallback label="교통약자 차량 현황을 확인하는 중" />;
  if (data?.source === "no-key") return null;
  if (error || data?.error) return (
    <div className="rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p className="font-bold">교통약자 API 오류</p>
      <p className="mt-1">{data?.message ?? "응답을 불러오지 못했습니다."}</p>
    </div>
  );

  const item = data?.items?.[0];
  if (!item) return <div className="card p-4"><EmptyState title="교통약자 차량 정보 없음" description="선택한 지역의 차량 현황 응답이 비어 있습니다. 잠시 후 다시 확인해 주세요." icon="🚌" /></div>;

  const s = lastUpdatedAt ? Math.max(0, Math.floor((now - lastUpdatedAt) / 1000)) : null;

  return (
    <div className="card-accent p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--brand)]">Transit</p>
          <p className="mt-1.5 text-base font-bold text-[color:var(--text)]">{item?.cntrNm ?? "교통약자 이동지원센터"}</p>
        </div>
        {isValidating
          ? <span className="text-xs font-semibold text-[color:var(--brand)] animate-pulse">● 갱신 중</span>
          : <span className="text-xs text-[color:var(--text-faint)]">{s === null ? "갱신 대기 중" : s < 5 ? "방금 갱신됨" : `${s}초 전`}</span>
        }
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { label: "가용 차량", value: item?.avlVhclCntom ?? "-" },
          { label: "운행 차량", value: item?.oprVhclCntom ?? "-" },
          { label: "예약 건수", value: item?.rsvtNocs      ?? "-" },
          { label: "대기 건수", value: item?.wtngNocs      ?? "-" },
        ].map(({ label, value }) => (
          <div key={label} className="card-inner px-3 py-2.5">
            <p className="text-xs text-[color:var(--text-faint)]">{label}</p>
            <p className="mt-0.5 text-base font-bold text-[color:var(--text)]">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[color:var(--text-faint)]">{item?.totDt ? `기준 시각 ${item.totDt}` : "실시간 응답"}</p>
      <p className="mt-1 text-xs text-[color:var(--text-faint)]">
        교통약자 차량 예약: <a href="tel:1588-4388" className="text-[color:var(--brand)] underline">1588-4388</a>
      </p>
    </div>
  );
}
