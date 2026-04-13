export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[14px] bg-slate-100 ${className ?? ""}`} />;
}
