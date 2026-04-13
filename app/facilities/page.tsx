"use client";

import Link from "next/link";
import useSWR from "swr";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FacilityMap } from "@/components/FacilityMap";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { FacilitiesApiResponse } from "@/lib/types";

type FacilitiesResponse = FacilitiesApiResponse & { error?: boolean; message?: string };

const fetcher = async (url: string): Promise<FacilitiesResponse> => (await fetch(url)).json();

export default function FacilitiesPage() {
  const { data, error, isLoading } = useSWR<FacilitiesResponse>("/api/facilities", fetcher);
  const facilities = useMemo(() => data?.items ?? [], [data]);
  const [activeId, setActiveId] = useState<string | undefined>();

  useEffect(() => {
    if (!facilities.length) return;
    setActiveId(prev => {
      const known = prev ? facilities.some(f => f.id === prev) : false;
      return known ? prev : facilities[0].id;
    });
  }, [facilities]);

  const activeFacility = facilities.find(f => f.id === activeId) ?? facilities[0];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">

      {/* 헤더 */}
      <header className="card p-6">
        <p className="text-xs font-bold uppercase tracking-[0.34em] text-[color:var(--text-faint)]">Facilities</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.02em] text-[color:var(--text)]">기관 목록과 지도</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[color:var(--text-muted)]">
              아이돌봄 기관을 지도와 목록으로 연결합니다. 목록 선택은 지도 중심점을 바꾸고, 마커 클릭은 상세 화면으로 이어집니다.
            </p>
          </div>
          <Link href="/" className="text-sm font-semibold text-[color:var(--brand)] hover:underline">← 홈으로</Link>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <FacilityMap facilities={facilities} activeId={activeId} onSelectFacility={setActiveId} />

          {/* 선택 기관 정보 */}
          <div className="card-accent p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--brand)]">Selected</p>
                <h2 className="mt-2 text-xl font-bold text-[color:var(--text)]">{activeFacility?.name ?? "기관을 선택하세요"}</h2>
              </div>
              <span className="rounded-full bg-[color:var(--brand-bg)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-dark)]">{data?.source ?? "loading"}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">{activeFacility?.address ?? "목록에서 기관을 선택하면 여기에 정보가 표시됩니다."}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeFacility?.phone  ? <Tag>{activeFacility.phone}</Tag>  : null}
              {activeFacility?.hours  ? <Tag>{activeFacility.hours}</Tag>  : null}
              {activeFacility?.stdgCd ? <Tag>{activeFacility.stdgCd}</Tag> : null}
            </div>
          </div>
        </div>

        {/* 기관 목록 */}
        <aside className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--text-faint)]">Facilities</p>
              <h2 className="mt-2 text-xl font-bold text-[color:var(--text)]">기관 목록</h2>
            </div>
            <span className="rounded-full bg-[color:var(--brand-bg)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-dark)]">{data?.totalCount ?? facilities.length}곳</span>
          </div>

          {isLoading && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
            </div>
          )}
          {(error || data?.error) && (
            <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-bold">기관 데이터를 불러오지 못했습니다.</p>
              <p className="mt-1">{data?.message ?? "API 응답을 확인할 수 없습니다."}</p>
            </div>
          )}
          {!isLoading && !error && !data?.error && facilities.length === 0 && (
            <div className="mt-5"><EmptyState title="등록된 기관이 없습니다." description="API 또는 정적 데이터에서 기관 목록을 찾지 못했습니다." icon="📭" /></div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {facilities.map(facility => {
              const isActive = facility.id === activeId;
              return (
                <div key={facility.id} className={`rounded-[20px] border p-4 transition-all ${isActive ? "border-[color:var(--brand)]/40 bg-[color:var(--brand-bg)] shadow-[0_4px_20px_rgba(6,182,168,0.12)]" : "border-[color:var(--border)] bg-white hover:border-[color:var(--brand)]/20"}`}>
                  <button type="button" onClick={() => setActiveId(facility.id)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[color:var(--text)]">{facility.name}</p>
                        <p className="mt-0.5 truncate text-xs text-[color:var(--text-muted)]">{facility.address}</p>
                        <p className="mt-1 text-xs text-[color:var(--text-faint)]">{facility.phone ?? "전화번호 미등록"}</p>
                      </div>
                      {isActive && <span className="shrink-0 rounded-full bg-[color:var(--brand)] px-2.5 py-1 text-xs font-bold text-white">선택됨</span>}
                    </div>
                  </button>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">{facility.stdgCd ? <Tag>{facility.stdgCd}</Tag> : null}</div>
                    <Link href={`/route/${facility.id}`} className="text-xs font-semibold text-[color:var(--brand)] hover:underline">상세 보기 →</Link>
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
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-[color:var(--text-muted)]">{children}</span>;
}
