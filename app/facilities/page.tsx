"use client";

import Link from "next/link";
import useSWR from "swr";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FacilityMap } from "@/components/FacilityMap";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { FacilitiesApiResponse } from "@/lib/types";

type FacilitiesResponse = FacilitiesApiResponse & {
  error?: boolean;
  message?: string;
};

const fetcher = async (url: string): Promise<FacilitiesResponse> => {
  const response = await fetch(url);
  return response.json();
};

export default function FacilitiesPage() {
  const { data, error, isLoading } = useSWR<FacilitiesResponse>("/api/facilities", fetcher);
  const facilities = useMemo(() => data?.items ?? [], [data]);
  const [activeId, setActiveId] = useState<string | undefined>();

  useEffect(() => {
    if (!facilities.length) {
      return;
    }

    setActiveId((prev) => {
      const isKnown = prev ? facilities.some((facility) => facility.id === prev) : false;
      return isKnown ? prev : facilities[0].id;
    });
  }, [facilities]);

  const activeFacility =
    facilities.find((facility) => facility.id === activeId) ?? facilities[0];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Facilities
        </p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">기관 목록과 지도</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              아이돌봄 기관을 지도와 목록으로 연결합니다. 목록 선택은 지도 중심점을 바꾸고,
              마커 클릭은 상세 화면으로 이어집니다.
            </p>
          </div>
          <Link href="/" className="text-sm font-medium text-slate-700 underline">
            홈으로
          </Link>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <FacilityMap
            facilities={facilities}
            activeId={activeId}
            onSelectFacility={setActiveId}
          />

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Selected
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {activeFacility?.name ?? "기관을 선택하세요"}
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {data?.source ?? "loading"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {activeFacility?.address ?? "목록에서 기관을 선택하면 여기에 정보가 표시됩니다."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
              {activeFacility?.phone ? <Tag>{activeFacility.phone}</Tag> : null}
              {activeFacility?.hours ? <Tag>{activeFacility.hours}</Tag> : null}
              {activeFacility?.stdgCd ? <Tag>{activeFacility.stdgCd}</Tag> : null}
            </div>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Facilities
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">기관 목록</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {data?.totalCount ?? facilities.length}곳
            </span>
          </div>

          {isLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Skeleton className="h-28 rounded-3xl" />
              <Skeleton className="h-28 rounded-3xl" />
              <Skeleton className="h-28 rounded-3xl" />
            </div>
          ) : null}

          {error || data?.error ? (
            <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p className="font-medium">기관 데이터를 불러오지 못했습니다.</p>
              <p className="mt-2">
                {data?.message ?? "API 응답을 확인할 수 없습니다."}
              </p>
            </div>
          ) : null}

          {!isLoading && !error && !data?.error && facilities.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="등록된 기관이 없습니다."
                description="API 또는 정적 데이터에서 기관 목록을 찾지 못했습니다."
                icon="📭"
              />
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {facilities.map((facility) => {
              const isActive = facility.id === activeId;

              return (
                <div
                  key={facility.id}
                  className={`rounded-3xl border p-4 transition ${
                    isActive
                      ? "border-slate-950 bg-white"
                      : "border-slate-200 bg-white hover:border-slate-400"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(facility.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-950">{facility.name}</p>
                        <p className="mt-1 truncate text-xs text-slate-600">{facility.address}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {facility.phone ?? "전화번호 미등록"}
                        </p>
                      </div>
                      {isActive ? (
                        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
                          active
                        </span>
                      ) : null}
                    </div>
                  </button>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      {facility.stdgCd ? <Tag>{facility.stdgCd}</Tag> : null}
                    </div>
                    <Link
                      href={`/route/${facility.id}`}
                      className="text-sm font-medium text-slate-700 underline"
                    >
                      상세 보기
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </section>
    </main>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1">{children}</span>;
}
