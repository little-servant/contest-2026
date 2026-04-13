import type { ReactNode } from "react";

export function EmptyState({ title, description, icon }: { title: string; description: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-[color:var(--border)] bg-slate-50 px-5 py-10 text-center">
      {icon ? <div className="mb-3 text-3xl leading-none">{icon}</div> : null}
      <p className="text-sm font-semibold text-[color:var(--text)]">{title}</p>
      <p className="mt-2 text-xs leading-6 text-[color:var(--text-muted)]">{description}</p>
    </div>
  );
}
