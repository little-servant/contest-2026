import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
      {icon ? <div className="mb-3 text-2xl leading-none">{icon}</div> : null}
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="mt-2 text-xs leading-6 text-slate-500">{description}</p>
    </div>
  );
}
