"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => { if (window.history.length <= 1) { router.push("/facilities"); return; } router.back(); }}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--text-muted)] shadow-sm transition hover:bg-[color:var(--brand-bg)] hover:text-[color:var(--brand-dark)] hover:border-[color:var(--brand)]/30"
    >
      ← 뒤로가기
    </button>
  );
}
