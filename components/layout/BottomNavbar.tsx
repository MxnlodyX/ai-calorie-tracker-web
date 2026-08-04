"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartNoAxesColumnIncreasing, House, ScanLine } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", Icon: House },
  { href: "/analyze", label: "Scan", Icon: ScanLine },
  { href: "/history", label: "History", Icon: ChartNoAxesColumnIncreasing },
];

export function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 z-40 px-3 text-[#253025] [bottom:max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
      aria-label="Primary"
    >
      <div className="mx-auto grid max-w-[420px] grid-cols-3 gap-1 rounded-[20px] border border-white/90 bg-white/90 p-1 shadow-[0_14px_38px_rgba(56,103,43,0.2)] backdrop-blur-xl sm:rounded-[22px] sm:p-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.Icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-[16px] px-3 text-[0.65rem] font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65b741] sm:min-h-14 sm:gap-1 sm:rounded-[17px] sm:text-[0.68rem] ${
                isActive
                  ? "bg-gradient-to-br from-[#65b741] to-[#22945f] text-white shadow-[0_10px_22px_rgba(34,148,95,0.25)]"
                  : "text-[#687566] hover:bg-[#f1f8ec] hover:text-[#235b30]"
              }`}
            >
              <Icon className="size-5" strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
