"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

const OFFICER_NAV_ITEMS = [
  {
    label: "Dashboard Tugas",
    href: "/petugas/dashboard",
    icon: "📊",
    exact: true,
  },
  {
    label: "Semua Tugas Lapangan",
    href: "/petugas/tugas",
    icon: "📋",
  },
];

export default function OfficerSidebar({ userProfile, pendingCounts = {} }) {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 bg-[#0a4a56] text-white flex flex-col shrink-0 border-r border-[#0e6b7a]/30">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/10">
        <Link href="/petugas/dashboard" className="flex items-center gap-2.5 font-extrabold text-base tracking-tight">
          <span className="w-8 h-8 rounded-lg bg-[#f2a33a] text-[#16222b] grid place-items-center text-sm font-black shadow-xs">
            ▣
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-white text-base">SewaAset</span>
            <span className="text-[10px] text-[#f2a33a] font-semibold tracking-wider uppercase mt-0.5">Portal Petugas</span>
          </div>
        </Link>
      </div>

      {/* Profile Mini Card */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#0e6b7a] text-white font-bold grid place-items-center text-xs shrink-0 border border-white/20">
          {(userProfile?.full_name || "PT")[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white truncate">
            {userProfile?.full_name || "Petugas Lapangan"}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="info" className="text-[9px] px-1.5 py-0">
              {userProfile?.role === "admin" ? "Admin (Petugas)" : "Petugas Lapangan"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-[#d7edf0]/60 uppercase">
          Menu Operasional
        </p>

        {OFFICER_NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);

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
            </Link>
          );
        })}

        <div className="pt-2 pb-1">
          <p className="px-3 pb-1 text-[10px] font-bold tracking-wider text-[#d7edf0]/60 uppercase">
            Filter Cepat Antrean
          </p>

          <Link
            href="/petugas/tugas?status=serah_terima"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-[#d7edf0] hover:text-white hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>🤝</span>
              <span>Serah Terima</span>
            </div>
            {pendingCounts.handovers > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500 text-white">
                {pendingCounts.handovers}
              </span>
            )}
          </Link>

          <Link
            href="/petugas/tugas?status=pengembalian"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-[#d7edf0] hover:text-white hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>🔄</span>
              <span>Pengembalian</span>
            </div>
            {pendingCounts.returns > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-[#f2a33a] text-[#16222b]">
                {pendingCounts.returns}
              </span>
            )}
          </Link>

          <Link
            href="/petugas/tugas?status=selesai"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#d7edf0] hover:text-white hover:bg-white/10 transition-colors"
          >
            <span>📜</span>
            <span>Riwayat Selesai</span>
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
