export function LoadingFallback({ label }: { label: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="h-3 w-32 animate-pulse rounded-full bg-slate-200" />
      <div className="mt-4 space-y-3">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
    </div>
  );
}
