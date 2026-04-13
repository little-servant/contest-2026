"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

function ChildIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="7" r="3" />
      <path d="M9 14c-3 1-4 3-4 5h14c0-2-1-4-4-5" />
    </svg>
  );
}

function ParentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 21s6-5.58 6-11a6 6 0 10-12 0c0 5.42 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

const TABS = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/child", label: "아이", icon: ChildIcon },
  { href: "/parent", label: "부모", icon: ParentIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-black/6 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);

        return (
          <Link key={tab.href} href={tab.href} className="flex flex-1 flex-col items-center py-2">
            <span className={`flex flex-col items-center gap-1 rounded-[14px] px-4 py-1.5 text-xs font-medium transition-colors duration-200 ${isActive ? "bg-[color:var(--accent-primary)]/12 text-[color:var(--accent-primary)]" : "bg-transparent text-[color:var(--text-secondary)]"}`}>
              <Icon className="h-5 w-5" />
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
