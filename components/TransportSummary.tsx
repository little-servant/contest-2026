"use client";

import useSWR from "swr";
import type { BusApiResponse, TransitApiResponse } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

const fetcher = async <T,>(url: string): Promise<T> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

export function TransportSummary({ stdgCd }: { stdgCd: string }) {
  const transit = useSWR<TransitApiResponse>(`/api/transit?stdgCd=${encodeURIComponent(stdgCd)}`, fetcher, { refreshInterval: 30_000, revalidateOnFocus: true });
  const bus     = useSWR<BusApiResponse>(`/api/bus?stdgCd=${encodeURIComponent(stdgCd)}`, fetcher, { refreshInterval: 30_000, revalidateOnFocus: true });

  const isLoading = (transit.isLoading && !transit.data && !transit.error) || (bus.isLoading && !bus.data && !bus.error);

  if (isLoading) return (
    <section className="card p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-faint)]">이동 수단 요약</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Skeleton className="h-24" /><Skeleton className="h-24" />
      </div>
    </section>
  );

  if (transit.data?.source === "no-key") return (
    <p className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
      PUBLIC_DATA_API_KEY 미설정 — 실데이터 연동 전 상태입니다.
    </p>
  );

  const isTransitEmpty = !transit.error && !transit.data?.error && (transit.data?.items?.length ?? 0) === 0;
  const isBusEmpty     = !bus.error && !bus.data?.error && (bus.data?.routes?.length ?? 0) === 0 && (bus.data?.positions?.length ?? 0) === 0;

  if (transit.data && bus.data && isTransitEmpty && isBusEmpty) return (
    <section className="card p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-faint)]">이동 수단 요약</p>
      <div className="mt-4"><EmptyState title="실시간 이동 데이터 없음" description="교통약자 차량과 버스 실시간 응답이 비어 있습니다." icon="🛰" /></div>
    </section>
  );

  const vehicleCard = buildVehicleCard(transit.data, transit.error);
  const busCard     = buildBusCard(bus.data, bus.error);

  return (
    <section className="card p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-faint)]">이동 수단 요약</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <SummaryCard title="교통약자 차량" body={vehicleCard} />
        <SummaryCard title="버스 운행"     body={busCard} />
      </div>
    </section>
  );
}

function SummaryCard({ title, body }: { title: string; body: { headline: string; detail: string } }) {
  return (
    <div className="card-inner p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--brand)]">{title}</p>
      <p className="mt-2 text-sm font-bold text-[color:var(--text)]">{body.headline}</p>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">{body.detail}</p>
    </div>
  );
}

function buildVehicleCard(data?: TransitApiResponse, error?: unknown) {
  if (isKeyMissing(error, data?.message)) return { headline: "서비스키 미설정", detail: "PUBLIC_DATA_API_KEY가 필요합니다." };
  if (error || data?.error)              return { headline: "불러오지 못했습니다.", detail: data?.message ?? "다시 시도해 주세요." };
  if (!data?.items?.length)             return { headline: "교통약자 차량 정보 없음", detail: "응답이 비어 있습니다." };
  const count = data.items[0]?.avlVhclCntom ?? 0;
  return { headline: count > 0 ? "지금 예약 가능" : "현재 차량 없음", detail: count > 0 ? `가용 차량 ${count}대 확인` : "가용 차량이 0대로 표시됩니다." };
}

function buildBusCard(data?: BusApiResponse, error?: unknown) {
  if (isKeyMissing(error, data?.message)) return { headline: "서비스키 미설정", detail: "PUBLIC_DATA_API_KEY가 필요합니다." };
  if (error || data?.error)              return { headline: "불러오지 못했습니다.", detail: data?.message ?? "다시 시도해 주세요." };
  const route    = data?.routes?.[0];
  const position = data?.positions?.[0];
  if (!route && !position)              return { headline: "버스 정보 없음", detail: "노선 또는 실시간 위치 정보가 없습니다." };
  const routeText = route?.rteNo && route?.stpnt && route?.edpnt ? `${route.rteNo} · ${route.stpnt} → ${route.edpnt}` : route?.rteNo || "노선 정보 확인";
  return { headline: routeText, detail: position?.gthrDt ? `실시간 위치 갱신 ${position.gthrDt}` : "실시간 위치 정보 확인" };
}

function isKeyMissing(error: unknown, message?: string) {
  if (typeof message === "string" && message.includes("is not set")) return true;
  if (error instanceof Error && error.message.includes("is not set")) return true;
  return false;
}
