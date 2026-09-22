"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Utensils,
  ClipboardList,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Orders", icon: Utensils },
  { href: "/menu", label: "Menu", icon: ClipboardList },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
];

const manageItems = [
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
        active
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          : "text-slate-400 hover:text-emerald-300 hover:bg-slate-800/60 border border-transparent"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  );
}

export default function SideBar() {
  return (
    <nav className="h-full flex flex-col p-4">
      <div className="mb-8 px-2">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Premium</p>
        <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
          Admin Panel
        </p>
      </div>

      <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Dashboard</p>
      <ul className="space-y-1 mb-6">
        {navItems.map((item) => (
          <li key={item.href}>
            <NavLink {...item} />
          </li>
        ))}
      </ul>

      <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Management</p>
      <ul className="space-y-1 mt-auto">
        {manageItems.map((item) => (
          <li key={item.href}>
            <NavLink {...item} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
