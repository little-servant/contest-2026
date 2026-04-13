export function LoadingFallback({ label }: { label: string }) {
  return (
    <div className="panel-surface rounded-[24px] p-4">
      <div className="h-3 w-32 animate-pulse rounded-full bg-black/8" />
      <div className="mt-4 space-y-3">
        <div className="h-20 animate-pulse rounded-[20px] bg-black/5" />
        <div className="h-20 animate-pulse rounded-[20px] bg-black/5" />
      </div>
      <p className="mt-4 text-sm text-[color:var(--text-secondary)]">{label}</p>
    </div>
  );
}
