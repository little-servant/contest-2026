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
      className="inline-flex min-h-12 items-center rounded-[20px] border border-black/8 bg-white/80 px-4 py-3 text-sm font-medium text-[color:var(--text-primary)] shadow-sm transition hover:border-black/16 hover:bg-white"
    >
      뒤로가기
    </button>
  );
}
