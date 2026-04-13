"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { LoadingFallback } from "./LoadingFallback";
import { EmptyState } from "@/components/ui/EmptyState";
import type { BusApiResponse } from "@/lib/types";

const fetcher = async (url: string): Promise<BusApiResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

export function BusArrival({ stdgCd }: { stdgCd?: string }) {
  const query = stdgCd ? `/api/bus?stdgCd=${encodeURIComponent(stdgCd)}` : null;
  const { data, error, isLoading, isValidating } = useSWR(query, fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });
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

  if (!stdgCd) {
    return (
      <div className="rounded-[24px] border border-dashed border-black/10 bg-white/60 p-4 text-sm text-[color:var(--text-secondary)]">
        <p>이 기관은 버스 실시간 정보를 지원하지 않습니다.</p>
        <Link href="/facilities" className="mt-2 inline-block underline">
          다른 기관 보기 →
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingFallback label="전국 초정밀 버스 위치 정보를 확인하는 중" />;
  }

  if (data?.source === "no-key") {
    return null;
  }

  if (error || data?.error) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        <p className="font-medium">버스 API 오류</p>
        <p className="mt-2">{data?.message ?? "응답을 불러오지 못했습니다."}</p>
      </div>
    );
  }

  const route = data?.routes?.[0];
  const position = data?.positions?.[0];

  if (!route && !position) {
    return (
      <div className="panel-surface rounded-[20px] p-4">
        <EmptyState
          title="버스 실시간 정보 없음"
          description="선택한 지역의 초정밀 버스 노선/위치 응답이 비어 있습니다."
          icon="🚏"
        />
      </div>
    );
  }

  return (
    <div className="panel-surface rounded-[20px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-secondary)]">
            Bus
          </p>
          <p className="mt-2 text-base font-semibold text-[color:var(--text-primary)]">
            {route?.rteNo ?? position?.rteNo ?? "초정밀 버스 노선"}
          </p>
        </div>
        <RefreshIndicator
          isValidating={isValidating}
          lastUpdatedAt={lastUpdatedAt}
          now={now}
        />
      </div>
      <div className="mt-4 grid gap-3">
        <Info
          label="운행 구간"
          value={route?.stpnt && route?.edpnt ? `${route.stpnt} → ${route.edpnt}` : "-"}
        />
        <Info
          label="첫차 / 막차"
          value={
            route?.vhclFstTm && route?.vhclLstTm
              ? `${route.vhclFstTm} / ${route.vhclLstTm}`
              : "-"
          }
        />
        <Info
          label="실시간 위치"
          value={
            position?.vhclNo
              ? `${position.vhclNo} · ${formatCoordinates(position.lat, position.lot)}`
              : "-"
          }
        />
        <Info label="도착예정시간" value="현재 데이터셋 미제공" />
      </div>
      <p className="mt-3 text-xs text-[color:var(--text-secondary)]">
        수집 시각 {formatCollectedAt(position?.gthrDt, lastUpdatedAt)}
      </p>
    </div>
  );
}

function formatCoordinates(lat?: string, lot?: string) {
  if (!lat || !lot) {
    return "좌표 미확인";
  }

  return `${lat}, ${lot}`;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-line rounded-[20px] px-3 py-3">
      <p className="text-xs text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-base font-semibold text-[color:var(--text-primary)]">{value}</p>
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
      <span className="text-xs font-medium text-[color:var(--accent-primary)] animate-pulse">
        ● 갱신 중
      </span>
    );
  }

  return (
    <span className="text-xs text-[color:var(--text-secondary)]">
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

function formatCollectedAt(gthrDt?: string, fallbackTimestamp?: number | null) {
  if (typeof gthrDt === "string" && gthrDt.trim()) {
    const timeMatch = gthrDt.match(/(\d{2}:\d{2}:\d{2})/);
    if (timeMatch?.[1]) {
      return timeMatch[1];
    }

    const digits = gthrDt.replace(/\D/g, "");
    if (digits.length >= 14) {
      return `${digits.slice(8, 10)}:${digits.slice(10, 12)}:${digits.slice(12, 14)}`;
    }

    const parsed = new Date(gthrDt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    }
  }

  return new Date(fallbackTimestamp ?? Date.now()).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
