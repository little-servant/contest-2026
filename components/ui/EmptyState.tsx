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
    <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-black/10 bg-black/3 px-5 py-8 text-center">
      {icon ? <div className="mb-3 text-2xl leading-none">{icon}</div> : null}
      <p className="text-sm font-medium text-[color:var(--text-primary)]">{title}</p>
      <p className="mt-2 text-xs leading-6 text-[color:var(--text-secondary)]">{description}</p>
    </div>
  );
}
