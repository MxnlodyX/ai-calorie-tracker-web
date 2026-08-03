import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analyze", label: "Scan" },
  { href: "/history", label: "History" },
];

export function BottomNavbar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[#20342d] bg-white px-4 py-3 text-[#20342d]"
      aria-label="Primary"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full px-3 py-2 text-center text-xs font-black transition hover:bg-[#fff7df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
