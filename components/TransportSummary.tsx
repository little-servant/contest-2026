"use client";

import useSWR from "swr";
import type { BusApiResponse, TransitApiResponse } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

type Props = {
  stdgCd: string;
};

export function TransportSummary({ stdgCd }: Props) {
  const transitQuery = `/api/transit?stdgCd=${encodeURIComponent(stdgCd)}`;
  const busQuery = `/api/bus?stdgCd=${encodeURIComponent(stdgCd)}`;

  const transit = useSWR<TransitApiResponse>(transitQuery, fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });
  const bus = useSWR<BusApiResponse>(busQuery, fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });
  const isInitialLoading =
    (transit.isLoading && !transit.data && !transit.error) ||
    (bus.isLoading && !bus.data && !bus.error);

  if (isInitialLoading) {
    return (
      <section className="panel-surface rounded-[20px] p-4">
        <p className="text-sm font-semibold text-[color:var(--text-secondary)]">이동 수단 요약</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SummarySkeleton />
          <SummarySkeleton />
        </div>
      </section>
    );
  }

  if (transit.data?.source === "no-key") {
    return (
      <p className="text-sm text-amber-700 bg-amber-50 rounded-[14px] px-4 py-3 border border-amber-200">
        PUBLIC_DATA_API_KEY 미설정 — 실데이터 연동 전 상태입니다.
      </p>
    );
  }

  const isTransitEmpty =
    !transit.error && !transit.data?.error && (transit.data?.items?.length ?? 0) === 0;
  const isBusEmpty =
    !bus.error &&
    !bus.data?.error &&
    (bus.data?.routes?.length ?? 0) === 0 &&
    (bus.data?.positions?.length ?? 0) === 0;

  if (transit.data && bus.data && isTransitEmpty && isBusEmpty) {
    return (
      <section className="panel-surface rounded-[20px] p-4">
        <p className="text-sm font-semibold text-[color:var(--text-secondary)]">이동 수단 요약</p>
        <div className="mt-4">
          <EmptyState
            title="실시간 이동 데이터 없음"
            description="교통약자 차량과 버스 실시간 응답이 비어 있습니다. 잠시 후 다시 확인해 주세요."
            icon="🛰"
          />
        </div>
      </section>
    );
  }

  const vehicleCard = buildVehicleCard(transit.data, transit.error);
  const busCard = buildBusCard(bus.data, bus.error);

  return (
    <section className="panel-surface rounded-[20px] p-4">
      <p className="text-sm font-semibold text-[color:var(--text-secondary)]">이동 수단 요약</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <SummaryCard title="교통약자 차량" body={vehicleCard} />
        <SummaryCard title="버스 운행" body={busCard} />
      </div>
    </section>
  );
}

function SummarySkeleton() {
  return (
    <div className="panel-line rounded-[20px] p-4">
      <Skeleton className="h-3 w-24 rounded-full" />
      <Skeleton className="mt-3 h-6 w-3/4 rounded-full" />
      <Skeleton className="mt-2 h-4 w-full rounded-full" />
    </div>
  );
}

function buildVehicleCard(data?: TransitApiResponse, error?: unknown) {
  if (isServiceKeyMissing(error, data?.message)) {
    return {
      headline: "서비스키 미설정",
      detail: "교통약자 차량 상태를 불러오려면 PUBLIC_DATA_API_KEY가 필요합니다.",
    };
  }

  if (error || data?.error) {
    return {
      headline: "교통약자 차량 상태를 불러오지 못했습니다.",
      detail: data?.message ?? "다시 시도해 주세요.",
    };
  }

  if (!data?.items?.length) {
    return {
      headline: "교통약자 차량 정보 없음",
      detail: "응답이 비어 있습니다.",
    };
  }

  const item = data.items[0];
  const count = item?.avlVhclCntom ?? 0;

  return {
    headline: count > 0 ? "지금 예약 가능" : "현재 차량 없음",
    detail:
      count > 0
        ? `가용 차량 ${count}대 확인`
        : "가용 차량이 0대로 표시됩니다.",
  };
}

function buildBusCard(data?: BusApiResponse, error?: unknown) {
  if (isServiceKeyMissing(error, data?.message)) {
    return {
      headline: "서비스키 미설정",
      detail: "버스 노선 상태를 불러오려면 PUBLIC_DATA_API_KEY가 필요합니다.",
    };
  }

  if (error || data?.error) {
    return {
      headline: "버스 상태를 불러오지 못했습니다.",
      detail: data?.message ?? "다시 시도해 주세요.",
    };
  }

  const route = data?.routes?.[0];
  const position = data?.positions?.[0];

  if (!route && !position) {
    return {
      headline: "버스 정보 없음",
      detail: "노선 또는 실시간 위치 정보가 없습니다.",
    };
  }

  const routeText =
    route?.rteNo && route?.stpnt && route?.edpnt
      ? `${route.rteNo} · ${route.stpnt} → ${route.edpnt}`
      : route?.rteNo || "노선 정보 확인";

  return {
    headline: routeText,
    detail: position?.gthrDt
      ? `실시간 위치 갱신 ${position.gthrDt}`
      : "실시간 위치 정보 확인",
  };
}

function SummaryCard({
  title,
  body,
}: {
  title: string;
  body: { headline: string; detail: string };
}) {
  return (
    <div className="panel-line rounded-[20px] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--text-secondary)]">
        {title}
      </p>
      <h3 className="mt-2 text-base font-semibold text-[color:var(--text-primary)]">{body.headline}</h3>
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{body.detail}</p>
    </div>
  );
}

function isServiceKeyMissing(error: unknown, message?: string) {
  if (typeof message === "string" && message.includes("is not set")) {
    return true;
  }

  if (error instanceof Error && error.message.includes("is not set")) {
    return true;
  }

  return false;
}
