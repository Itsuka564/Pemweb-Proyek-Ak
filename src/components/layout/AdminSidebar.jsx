"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

const ADMIN_NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: "📊",
    exact: true,
  },
  {
    label: "Verifikasi Pengguna",
    href: "/admin/verifikasi",
    icon: "🪪",
  },
  {
    label: "Data Aset & Tarif",
    href: "/admin/aset",
    icon: "🏢",
  },
  {
    label: "Pengajuan Sewa",
    href: "/admin/pengajuan",
    icon: "📋",
  },
  {
    label: "Kalender Okupansi",
    href: "/admin/kalender",
    icon: "📅",
  },
];

export default function AdminSidebar({ userProfile, pendingCounts = {} }) {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 bg-[#0a4a56] text-white flex flex-col shrink-0 border-r border-[#0e6b7a]/30">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/10">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 font-extrabold text-base tracking-tight">
          <span className="w-8 h-8 rounded-lg bg-[#f2a33a] text-[#16222b] grid place-items-center text-sm font-black shadow-xs">
            ▣
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-white text-base">SewaAset</span>
            <span className="text-[10px] text-[#f2a33a] font-semibold tracking-wider uppercase mt-0.5">Admin Portal</span>
          </div>
        </Link>
      </div>

      {/* Admin Profile Mini */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#0e6b7a] text-white font-bold grid place-items-center text-xs shrink-0 border border-white/20">
          {(userProfile?.full_name || "AD")[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white truncate">
            {userProfile?.full_name || "Administrator"}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="bad" className="text-[9px] px-1.5 py-0">
              Admin
            </Badge>
            <span className="text-[10px] text-white/60 truncate">Sistem Pengelola</span>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-[#d7edf0]/60 uppercase">
          Menu Utama
        </p>

        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);

          const count =
            item.href === "/admin/verifikasi"
              ? pendingCounts.verifications
              : item.href === "/admin/pengajuan"
              ? pendingCounts.rentals
              : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                isActive
                  ? "bg-[#0e6b7a] text-white shadow-xs"
                  : "text-[#d7edf0] hover:text-white hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </div>
              {count > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-[#f2a33a] text-[#16222b]">
                  {count}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4 pb-1">
          <p className="px-3 pb-1 text-[10px] font-bold tracking-wider text-[#d7edf0]/60 uppercase">
            Tautan Luar
          </p>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#d7edf0] hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="text-sm">🌐</span>
            <span>Halaman Publik</span>
          </Link>
          <Link
            href="/katalog"
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#d7edf0] hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="text-sm">📦</span>
            <span>Katalog Aset</span>
          </Link>
        </div>
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-white/10">
        <Link
          href="/auth/keluar"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-bold text-red-200 hover:text-white bg-red-950/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg transition-colors"
        >
          <span>🚪</span>
          <span>Keluar Sesi</span>
        </Link>
      </div>
    </aside>
  );
}
