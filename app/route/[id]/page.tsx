import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { BusArrival } from "@/components/BusArrival";
import { TransitStatus } from "@/components/TransitStatus";
import { TransportSummary } from "@/components/TransportSummary";
import { loadFacilityById } from "@/lib/facilities";

export default async function RoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const facility = await loadFacilityById(id);

  if (!facility) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-950">기관을 찾을 수 없습니다.</p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium underline">
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const hasStdgCd = Boolean(facility.stdgCd?.trim());

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <BackButton />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Route detail
        </p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">{facility.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              선택 기관 기준으로 교통약자 차량 현황과 전국 초정밀 버스 위치 정보를 병렬로 보여줍니다.
            </p>
          </div>
          <Link href="/facilities" className="text-sm font-medium text-slate-700 underline">
            목록으로
          </Link>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">기관 정보</p>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p>{facility.address}</p>
            <p>{facility.phone ?? "연락처 미정"}</p>
            <p>{facility.hours ?? "운영시간 미정"}</p>
            <p>{facility.stdgCd || "지자체 코드 미확인"}</p>
          </div>
        </div>

        <div className="grid gap-4">
          {hasStdgCd ? (
            <>
              <TransportSummary stdgCd={facility.stdgCd} />
              <TransitStatus stdgCd={facility.stdgCd} />
              <BusArrival stdgCd={facility.stdgCd} />
            </>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">실시간 이동 정보 미지원 기관</p>
              <p className="mt-1">
                이 기관은 교통약자·버스 실시간 데이터가 연결되지 않습니다.
              </p>
              <Link href="/facilities" className="mt-3 block text-xs underline">
                다른 기관 보기 →
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
