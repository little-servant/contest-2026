"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { LoadingFallback } from "./LoadingFallback";
import { EmptyState } from "@/components/ui/EmptyState";
import type { TransitApiResponse } from "@/lib/types";

const fetcher = async (url: string): Promise<TransitApiResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

export function TransitStatus({ stdgCd }: { stdgCd: string }) {
  const { data, error, isLoading, isValidating } = useSWR(
    stdgCd ? `/api/transit?stdgCd=${encodeURIComponent(stdgCd)}` : null,
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
    },
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!data || data.error || data.source === "no-key" || isValidating) {
      return;
    }

    setLastUpdatedAt(Date.now());
  }, [data, isValidating]);

  if (isLoading) {
    return <LoadingFallback label="교통약자 차량 현황을 확인하는 중" />;
  }

  if (data?.source === "no-key") {
    return (
      <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
        PUBLIC_DATA_API_KEY 미설정 — 실데이터 연동 전 상태입니다.
      </p>
    );
  }

  if (error || data?.error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        <p className="font-medium">교통약자 API 오류</p>
        <p className="mt-2">{data?.message ?? "응답을 불러오지 못했습니다."}</p>
      </div>
    );
  }

  const item = data?.items?.[0];

  if (!item) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <EmptyState
          title="교통약자 차량 정보 없음"
          description="선택한 지역의 차량 현황 응답이 비어 있습니다. 잠시 후 다시 확인해 주세요."
          icon="🚌"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Transit
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {item?.cntrNm ?? "교통약자 이동지원센터"}
          </p>
        </div>
        <RefreshIndicator
          isValidating={isValidating}
          lastUpdatedAt={lastUpdatedAt}
          now={now}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Stat label="가용 차량" value={item?.avlVhclCntom ?? "-"} />
        <Stat label="운행 차량" value={item?.oprVhclCntom ?? "-"} />
        <Stat label="예약 건수" value={item?.rsvtNocs ?? "-"} />
        <Stat label="대기 건수" value={item?.wtngNocs ?? "-"} />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {item?.totDt ? `기준 시각 ${item.totDt}` : "실시간 응답"}
      </p>
      <p className="mt-3 text-xs text-slate-500">
        교통약자 차량 예약:{" "}
        <a href="tel:1588-4388" className="underline">
          1588-4388
        </a>{" "}
        (전국 교통약자 이동지원센터 공통 대표번호)
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function RefreshIndicator({
  isValidating,
  lastUpdatedAt,
  now,
}: {
  isValidating: boolean;
  lastUpdatedAt: number | null;
  now: number;
}) {
  if (isValidating) {
    return (
      <span className="text-xs font-medium text-emerald-600 animate-pulse">
        ● 갱신 중
      </span>
    );
  }

  return (
    <span className="text-xs text-slate-500">
      {formatRefreshTime(lastUpdatedAt, now)}
    </span>
  );
}

function formatRefreshTime(lastUpdatedAt: number | null, now: number) {
  if (!lastUpdatedAt) {
    return "갱신 대기 중";
  }

  const seconds = Math.max(0, Math.floor((now - lastUpdatedAt) / 1000));

  if (seconds < 5) {
    return "방금 갱신됨";
  }

  return `${seconds}초 전`;
}
