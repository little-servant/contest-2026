import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-4 px-5 py-8">

      {/* ── 브랜드 히어로 ───────────────────────────── */}
      <section className="hero-gradient animate-enter rounded-[28px] px-7 py-9 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/70">
          HonGa · 혼자가도 괜찮아
        </p>
        <h1 className="mt-3 text-[1.75rem] font-bold leading-snug tracking-[-0.02em]">
          아이는 안전하게<br />부모는 안심하게
        </h1>
        <p className="mt-3 text-sm leading-7 text-white/80">
          맞벌이 가정 아이의 하교 후 자립 귀가를 돕는<br />실시간 위치 공유 · 안전 경로 안내
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <HeroBadge>🚌 버스 실시간</HeroBadge>
          <HeroBadge>📚 도서관 열람실</HeroBadge>
          <HeroBadge>🚦 신호등 경보</HeroBadge>
        </div>
      </section>

      {/* ── 역할 선택 ───────────────────────────────── */}
      <section className="animate-enter-1">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
          누구로 시작할까요?
        </p>
        <div className="grid grid-cols-2 gap-3">

          {/* 아이 카드 */}
          <Link
            href="/child"
            className="flex flex-col items-center gap-4 rounded-[24px] border-2 border-[color:var(--brand)]/30 bg-[color:var(--brand-bg)] px-4 py-7 text-center transition-all active:scale-95 hover:border-[color:var(--brand)]/60 hover:shadow-[0_4px_20px_rgba(6,182,168,0.16)]"
          >
            <span className="icon-circle-brand text-2xl">🧒</span>
            <div>
              <p className="text-base font-bold text-[color:var(--text)]">아이로 시작</p>
              <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">목적지 선택하고<br />안내 받기</p>
            </div>
          </Link>

          {/* 부모 카드 */}
          <Link
            href="/parent"
            className="flex flex-col items-center gap-4 rounded-[24px] border-2 border-[color:var(--parent)]/30 bg-[color:var(--parent-bg)] px-4 py-7 text-center transition-all active:scale-95 hover:border-[color:var(--parent)]/60 hover:shadow-[0_4px_20px_rgba(59,130,246,0.16)]"
          >
            <span className="icon-circle-parent text-2xl">👨‍👩‍👧</span>
            <div>
              <p className="text-base font-bold text-[color:var(--text)]">부모 모니터링</p>
              <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">아이 위치<br />실시간 확인</p>
            </div>
          </Link>

        </div>
      </section>

      {/* ── 공공데이터 출처 ──────────────────────────── */}
      <section className="card animate-enter-2 px-5 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--text-faint)]">
          전국 통합개방데이터 활용
        </p>
        <div className="flex flex-col gap-3">
          <DataRow icon="🚌" label="전국 초정밀 버스 실시간 위치" source="행정안전부 한국지역정보개발원" />
          <DataRow icon="📚" label="공공도서관 열람실 현황" source="행정안전부 한국지역정보개발원" />
          <DataRow icon="🚦" label="교통안전 실시간 신호등 정보" source="행정안전부 한국지역정보개발원" />
        </div>
      </section>

    </main>
  );
}

function HeroBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
      {children}
    </span>
  );
}

function DataRow({ icon, label, source }: { icon: string; label: string; source: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-[color:var(--text)]">{label}</p>
        <p className="mt-0.5 text-xs text-[color:var(--text-faint)]">{source}</p>
      </div>
    </div>
  );
}
