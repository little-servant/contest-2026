"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length <= 1) {
          router.push("/facilities");
          return;
        }

        router.back();
      }}
      className="inline-flex min-h-12 items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400"
    >
      뒤로가기
    </button>
  );
}
