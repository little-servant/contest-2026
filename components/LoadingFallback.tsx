export function LoadingFallback({ label }: { label: string }) {
  return (
    <div className="card p-5">
      <div className="h-3 w-28 animate-pulse rounded-full bg-slate-100" />
      <div className="mt-4 space-y-3">
        <div className="h-16 animate-pulse rounded-[14px] bg-slate-100" />
        <div className="h-16 animate-pulse rounded-[14px] bg-slate-100" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full border-2 border-[color:var(--brand-light)] border-t-[color:var(--brand)] spin" />
        <p className="text-xs text-[color:var(--text-faint)]">{label}</p>
      </div>
    </div>
  );
}
