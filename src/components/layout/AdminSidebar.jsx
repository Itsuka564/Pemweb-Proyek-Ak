"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/components/providers/AuthProvider";

function NavIcon({ name, className = "w-4 h-4 shrink-0" }) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...props}>
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      );
    case "verifikasi":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      );
    case "aset":
      return (
        <svg {...props}>
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" />
          <path d="M16 6h.01" />
          <path d="M12 6h.01" />
          <path d="M12 10h.01" />
          <path d="M12 14h.01" />
          <path d="M16 10h.01" />
          <path d="M16 14h.01" />
          <path d="M8 10h.01" />
          <path d="M8 14h.01" />
        </svg>
      );
    case "pengajuan":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" x2="8" y1="13" y2="13" />
          <line x1="16" x2="8" y1="17" y2="17" />
          <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
      );
    case "kalender":
      return (
        <svg {...props}>
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      );
    case "publik":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" x2="22" y1="12" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "katalog":
      return (
        <svg {...props}>
          <path d="m7.5 4.27 9 5.15" />
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      );
    case "keluar":
      return (
        <svg {...props}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
      );
    default:
      return null;
  }
}

const ADMIN_NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: "dashboard",
    exact: true,
  },
  {
    label: "Verifikasi Pengguna",
    href: "/admin/verifikasi",
    icon: "verifikasi",
  },
  {
    label: "Data Aset & Tarif",
    href: "/admin/aset",
    icon: "aset",
  },
  {
    label: "Pengajuan Sewa",
    href: "/admin/pengajuan",
    icon: "pengajuan",
  },
  {
    label: "Kalender Okupansi",
    href: "/admin/kalender",
    icon: "kalender",
  },
];

export default function AdminSidebar({ userProfile, pendingCounts = {} }) {
  const pathname = usePathname();
  const auth = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      if (auth?.signOut) {
        await auth.signOut();
      } else {
        window.location.href = "/auth/keluar";
      }
    } catch {
      window.location.href = "/";
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-full md:w-64 bg-[#0a4a56] text-white flex flex-col shrink-0 border-r border-[#0e6b7a]/30">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/10">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 font-extrabold text-base tracking-tight">
          <span className="w-8 h-8 rounded-lg bg-[#f2a33a] text-[#16222b] grid place-items-center shadow-xs">
            <svg
              className="w-4 h-4 text-[#16222b]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="3" />
              <rect width="8" height="8" x="8" y="8" rx="1" fill="currentColor" />
            </svg>
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
        <p className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-white/50 uppercase">
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
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors ${
                isActive
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/75 font-normal hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <NavIcon
                  name={item.icon}
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-white/70"}`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {count > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#f2a33a] text-[#16222b]">
                  {count}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4 pb-1 space-y-1">
          <p className="px-3 pb-1 text-[10px] font-bold tracking-wider text-white/50 uppercase">
            Tautan Luar
          </p>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-normal text-white/75 hover:text-white hover:bg-white/5 transition-colors"
          >
            <NavIcon name="publik" className="w-4 h-4 shrink-0 text-white/70" />
            <span>Halaman Publik</span>
          </Link>
          <Link
            href="/katalog"
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-normal text-white/75 hover:text-white hover:bg-white/5 transition-colors"
          >
            <NavIcon name="katalog" className="w-4 h-4 shrink-0 text-white/70" />
            <span>Katalog Aset</span>
          </Link>
        </div>
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-medium text-red-200 hover:text-white bg-red-950/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
        >
          <NavIcon name="keluar" className="w-4 h-4 shrink-0" />
          <span>{isLoggingOut ? "Mengeluarkan..." : "Keluar Sesi"}</span>
        </button>
      </div>
    </aside>
  );
}
