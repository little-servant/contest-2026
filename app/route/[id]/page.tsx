import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { BusArrival } from "@/components/BusArrival";
import { LibraryStatus } from "@/components/LibraryStatus";
import { TransitStatus } from "@/components/TransitStatus";
import { TransportSummary } from "@/components/TransportSummary";
import { loadFacilityById } from "@/lib/facilities";

export default async function RoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const facility = await loadFacilityById(id);
  if (!facility) notFound();

  const hasStdgCd = Boolean(facility.stdgCd?.trim());

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">

      {/* 헤더 */}
      <header className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <BackButton />
          <Link href="/facilities" className="text-xs font-semibold text-[color:var(--brand)] hover:underline">목록으로 →</Link>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.34em] text-[color:var(--text-faint)]">Route detail</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[color:var(--text)]">{facility.name}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[color:var(--text-muted)]">
          교통약자 차량 현황과 전국 초정밀 버스 위치 정보를 병렬로 보여줍니다.
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">

        {/* 기관 정보 */}
        <div className="card-accent p-6">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--brand)]">기관 정보</p>
          <div className="mt-4 space-y-3">
            {[facility.address, facility.phone ?? "연락처 미정", facility.hours ?? "운영시간 미정", facility.stdgCd || "지자체 코드 미확인"].map((v, i) => (
              <p key={i} className="text-sm leading-relaxed text-[color:var(--text-muted)]">{v}</p>
            ))}
          </div>
        </div>

        {/* 실시간 데이터 */}
        <div className="grid gap-4 content-start">
          {hasStdgCd ? (
            <>
              <TransportSummary stdgCd={facility.stdgCd} />
              <TransitStatus    stdgCd={facility.stdgCd} />
              <LibraryStatus    stdgCd={facility.stdgCd} />
              <BusArrival       stdgCd={facility.stdgCd} />
            </>
          ) : (
            <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-bold">실시간 이동 정보 미지원 기관</p>
              <p className="mt-1">이 기관은 교통약자·버스 실시간 데이터가 연결되지 않습니다.</p>
              <Link href="/facilities" className="mt-3 block text-xs font-semibold text-amber-700 underline">다른 기관 보기 →</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
