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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">

      {/* 히어로 */}
      <section className="overflow-hidden rounded-3xl bg-slate-950 px-7 py-8 sm:px-10 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          CarePass · 케어패스
        </p>
        <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
          맞벌이 부모를 위한<br />
          <span className="text-emerald-400">아동 이동 지원</span> 통합 안내
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
          아이돌봄 기관을 찾고, 교통약자 차량 가용 현황·버스 위치·도서관 열람실 빈자리를 한 화면에서 실시간으로 확인합니다.
        </p>

        <div className="mt-7 flex flex-wrap gap-2">
          <Badge>교통약자 이동지원 실시간</Badge>
          <Badge>전국 버스 실시간</Badge>
          <Badge>도서관 열람실 현황</Badge>
          <Badge>아이돌봄 기관 97곳</Badge>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/facilities"
            className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            기관 지도 보기
          </Link>
          {nearestFacility ? (
            <Link
              href={`/route/${nearestFacility.id}`}
              className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40"
            >
              가까운 기관 바로 보기
            </Link>
          ) : null}
        </div>
      </section>

      {/* 위치 입력 + 가까운 기관 */}
      <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              내 위치
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">위치 설정</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="위도" value={lat} onChange={setLat} />
            <Field label="경도" value={lng} onChange={setLng} />
          </div>
          <button
            type="button"
            onClick={handleLocate}
            disabled={geoLoading}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {geoLoading ? "위치 확인 중…" : "현재 위치 사용"}
          </button>
          {geoNotice ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-700">{geoNotice}</p>
              <button
                type="button"
                onClick={handleLocate}
                className="mt-1 text-xs text-amber-800 underline"
              >
                다시 시도
              </button>
            </div>
          ) : null}
        </div>

        {/* 가까운 기관 카드 */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Nearby
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">가까운 돌봄 기관</h2>
            </div>
            <span className="text-xs text-slate-400">
              {userLat.toFixed(3)}, {userLng.toFixed(3)} 기준
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {geoLoading ? (
              <>
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </>
            ) : data.length === 0 ? (
              <EmptyState title="기관 데이터 없음" description="정적 기관 목록을 찾지 못했습니다." icon="🗂" />
            ) : (
              nearest.map(({ facility, distance }) => (
                <Link
                  key={facility.id}
                  href={`/route/${facility.id}`}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">{facility.name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{facility.address}</p>
                    {facility.phone ? (
                      <p className="mt-0.5 text-xs text-slate-400">{facility.phone}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {distance.toFixed(1)} km
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 서비스 소개 3칸 */}
      <section className="grid gap-4 sm:grid-cols-3">
        <InfoCard
          color="emerald"
          icon="🚐"
          title="교통약자 차량"
          desc="지역별 가용 차량 수·예약·대기 현황을 30초마다 갱신합니다."
        />
        <InfoCard
          color="violet"
          icon="📚"
          title="도서관 열람실"
          desc="인근 공공도서관 열람실 빈자리를 실시간으로 확인합니다."
        />
        <InfoCard
          color="sky"
          icon="🚌"
          title="전국 버스 위치"
          desc="전국 초정밀 버스 노선과 실시간 차량 위치를 제공합니다."
        />
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
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
        inputMode="decimal"
      />
    </label>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
      {children}
    </span>
  );
}

function InfoCard({
  color,
  icon,
  title,
  desc,
}: {
  color: "emerald" | "violet" | "sky";
  icon: string;
  title: string;
  desc: string;
}) {
  const accent = {
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    violet: "text-violet-600 bg-violet-50 border-violet-100",
    sky: "text-sky-600 bg-sky-50 border-sky-100",
  }[color];

  return (
    <div className={`rounded-3xl border p-5 ${accent}`}>
      <span className="text-2xl">{icon}</span>
      <p className="mt-3 font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{desc}</p>
    </div>
  );
}
