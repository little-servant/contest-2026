import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col items-center justify-center gap-8 px-6 py-12">
      {/* 헤더 */}
      <section className="w-full overflow-hidden rounded-3xl bg-slate-950 px-8 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          HonGa · 혼자가도 괜찮아
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white">
          아이는 <span className="text-emerald-400">안전하게</span><br />
          부모는 <span className="text-sky-400">안심하게</span>
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-400">
          맞벌이 가정 아이의 하교 후 자립 귀가를 돕는<br />실시간 위치 공유 · 안전 경로 안내 서비스
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Badge>전국 초정밀 버스 실시간</Badge>
          <Badge>공공도서관 열람실 현황</Badge>
          <Badge>전국 통합개방데이터 활용</Badge>
        </div>
      </section>

      {/* 역할 선택 */}
      <section className="w-full">
        <p className="mb-4 text-center text-sm font-medium text-slate-500">누구로 시작할까요?</p>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/child"
            className="flex flex-col items-center gap-3 rounded-3xl border-2 border-emerald-200 bg-emerald-50 px-4 py-8 text-center transition hover:border-emerald-400 hover:bg-emerald-100 active:scale-95"
          >
            <span className="text-5xl">🧒</span>
            <div>
              <p className="text-lg font-bold text-emerald-800">아이로 시작</p>
              <p className="mt-1 text-xs text-emerald-600">목적지 선택하고<br />안내 받기</p>
            </div>
          </Link>

          <Link
            href="/parent"
            className="flex flex-col items-center gap-3 rounded-3xl border-2 border-sky-200 bg-sky-50 px-4 py-8 text-center transition hover:border-sky-400 hover:bg-sky-100 active:scale-95"
          >
            <span className="text-5xl">👨‍👩‍👧</span>
            <div>
              <p className="text-lg font-bold text-sky-800">부모로 모니터링</p>
              <p className="mt-1 text-xs text-sky-600">아이 위치<br />실시간 확인</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 공공데이터 배지 */}
      <section className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          전국 통합개방데이터 활용
        </p>
        <div className="flex flex-col gap-2">
          <DataBadge icon="🚌" label="전국 초정밀 버스 실시간 위치" source="행정안전부 한국지역정보개발원" />
          <DataBadge icon="📚" label="공공도서관 열람실 현황" source="행정안전부 한국지역정보개발원" />
        </div>
      </section>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
      {children}
    </span>
  );
}

function DataBadge({ icon, label, source }: { icon: string; label: string; source: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-xs font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{source}</p>
      </div>
    </div>
  );
}
