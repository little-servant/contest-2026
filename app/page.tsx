"use client";

import Link from "next/link";
import facilities from "../public/data/facilities.json";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { distanceKm } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Facility } from "@/lib/types";

const data = facilities as Facility[];

type NearestFacility = {
  facility: Facility;
  distance: number;
};

export default function HomePage() {
  const [lat, setLat] = useState("37.5665");
  const [lng, setLng] = useState("126.9780");
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const userLat = Number(lat) || 37.5665;
  const userLng = Number(lng) || 126.978;

  const nearest = useMemo<NearestFacility[]>(() => {
    return data
      .filter((facility) => facility.id.trim().length > 0)
      .map((facility) => ({
        facility,
        distance: distanceKm({ lat: userLat, lng: userLng }, facility),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [userLat, userLng]);
  const nearestFacility = nearest[0]?.facility;

  const handleLocate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoNotice("이 브라우저에서는 위치 정보를 사용할 수 없습니다.");
      return;
    }

    setGeoLoading(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        setGeoNotice(null);
        setGeoLoading(false);
      },
      (error: GeolocationPositionError) => {
        const message =
          error.code === 1
            ? "위치 권한이 거부되었습니다."
            : error.code === 2
              ? "현재 위치를 확인할 수 없습니다."
              : error.code === 3
                ? "위치 확인 시간이 초과되었습니다."
                : "위치 정보를 불러오지 못했습니다.";

        setGeoNotice(message);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="animate-enter overflow-hidden rounded-[2rem] border border-black/5 bg-[linear-gradient(135deg,#ffffff_0%,#f4f8ff_40%,#edf7f3_100%)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          CarePass / D8
        </p>
        <div className="mt-4 max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            위치를 넣으면 근처 돌봄 기관과 이동 지원 상태를 바로 이어붙입니다.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            D8에서는 모바일 제출 환경에 맞춰 현재 위치 진입, 기관 탐색, 실시간 이동 정보
            확인 흐름을 더 단단하게 정리했습니다.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Field label="위도" value={lat} onChange={setLat} />
          <Field label="경도" value={lng} onChange={setLng} />
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <button
                type="button"
                onClick={handleLocate}
                disabled={geoLoading}
                className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {geoLoading ? "현재 위치 확인 중..." : "현재 위치 사용"}
              </button>
              {geoNotice ? (
                <div className="mt-2">
                  <p className="text-sm text-slate-500">{geoNotice}</p>
                  <button
                    type="button"
                    onClick={handleLocate}
                    className="mt-2 text-xs text-slate-600 underline"
                  >
                    다시 시도
                  </button>
                </div>
              ) : null}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">바로 이동</p>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href="/facilities"
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-medium text-white"
                >
                  기관 목록과 지도 보기
                </Link>
                {nearestFacility ? (
                  <Link
                    href={`/route/${nearestFacility.id}`}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700"
                  >
                    첫 기관 상세 열기
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-400"
                  >
                    기관 데이터 없음
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="animate-enter-1 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Map Preview
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                기관 지도 폴백 미리보기
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              기준 좌표 {userLat.toFixed(4)}, {userLng.toFixed(4)}
            </p>
          </div>

          <div className="mt-5 h-[50dvh] min-h-[320px] rounded-[2rem] border border-slate-200 bg-slate-50 p-4">
            {geoLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            ) : data.length === 0 ? (
              <EmptyState
                title="기관 데이터 없음"
                description="홈에서는 정적 기관 목록을 기준으로 미리보기를 표시합니다."
                icon="🗂"
              />
            ) : (
              <div className="flex flex-col gap-3">
                {nearest.map(({ facility, distance }) => (
                  <Link
                    key={facility.id}
                    href={`/route/${facility.id}`}
                    className="rounded-3xl border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-slate-950">{facility.name}</p>
                        <p className="mt-1 truncate text-sm text-slate-600">{facility.address}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {distance.toFixed(1)} km
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      {facility.phone ? <Tag>{facility.phone}</Tag> : null}
                      {facility.hours ? <Tag>{facility.hours}</Tag> : null}
                      {facility.stdgCd ? <Tag>{facility.stdgCd}</Tag> : null}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/5 bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            API posture
          </p>
          <h2 className="mt-2 text-2xl font-semibold">D8은 제출 직전 UX 마감</h2>
          <div className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
            <p>교통약자 API: 문서상 실시간 가용 차량 수(`avlVhclCntom`) 제공 확인</p>
            <p>버스 API: 전국 초정밀 기준 노선 + 실시간 위치 가능, 도착예정시간은 미제공</p>
            <p>시설 데이터: 공식 아이돌봄 API 존재, 키 미설정 시 정적 JSON 폴백</p>
          </div>
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            기관 목록과 지도 연동, 기관 상세 진입, 교통약자·버스 패널 30초 폴링까지
            연결된 상태입니다. 실제 공공데이터 값 검증은 서비스키 입력 후 바로 이어집니다.
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="rounded-3xl border border-slate-200 bg-white p-4">
      <span className="text-sm font-medium text-slate-900">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
        inputMode="decimal"
      />
    </label>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1">{children}</span>;
}
