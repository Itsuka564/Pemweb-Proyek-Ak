"use client";

import { Suspense, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

function OfficerNavIcon({ name, className = "w-4 h-4 shrink-0" }) {
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
    case "tugas":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" x2="8" y1="13" y2="13" />
          <line x1="16" x2="8" y1="17" y2="17" />
          <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
      );
    case "serah_terima":
      return (
        <svg {...props}>
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      );
    case "pengembalian":
      return (
        <svg {...props}>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      );
    case "riwayat":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
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

function SidebarNavLink({ href, icon, label, isActive, badgeCount = 0, badgeTone = "neutral" }) {
  const badgeClasses =
    badgeTone === "emerald"
      ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-inset ring-emerald-400/30"
      : badgeTone === "amber"
      ? "bg-[#f2a33a]/20 text-[#fcd18d] ring-1 ring-inset ring-[#f2a33a]/30"
      : "bg-white/15 text-white";

  return (
    <Link
      href={href}
      className={`relative flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
        isActive
          ? "bg-white/10 text-white font-medium"
          : "text-white/70 font-normal hover:text-white hover:bg-white/5"
      }`}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#f2a33a]"
          aria-hidden="true"
        />
      )}
      <div className="flex items-center gap-2.5 min-w-0">
        <OfficerNavIcon
          name={icon}
          className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-white/60"}`}
        />
        <span className="truncate">{label}</span>
      </div>
      {badgeCount > 0 && (
        <span className={`ml-2 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums rounded-full ${badgeClasses}`}>
          {badgeCount}
        </span>
      )}
    </Link>
  );
}

function OfficerSidebarNav({ pendingCounts = {} }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusParam = searchParams?.get("status") || "";

  const isDashboardActive = pathname === "/petugas/dashboard";
  const isTasksBase = pathname === "/petugas/tugas";
  const isTaskDetail = pathname?.startsWith("/petugas/tugas/");

  const activeQuickFilter =
    isTasksBase && ["serah_terima", "pengembalian", "selesai"].includes(statusParam)
      ? statusParam
      : null;

  const isAllTasksActive = (isTasksBase && !activeQuickFilter) || isTaskDetail;

  return (
    <nav className="flex-1 px-3 py-2 space-y-5 overflow-y-auto">
      <div className="space-y-1">
        <p className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-white/45 uppercase">
          Menu Operasional
        </p>

        <SidebarNavLink
          href="/petugas/dashboard"
          icon="dashboard"
          label="Dashboard Tugas"
          isActive={isDashboardActive}
        />
        <SidebarNavLink
          href="/petugas/tugas"
          icon="tugas"
          label="Semua Tugas Lapangan"
          isActive={isAllTasksActive}
        />
      </div>

      <div className="space-y-1">
        <p className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-white/45 uppercase">
          Filter Cepat Antrean
        </p>

        <SidebarNavLink
          href="/petugas/tugas?status=serah_terima"
          icon="serah_terima"
          label="Serah Terima"
          isActive={activeQuickFilter === "serah_terima"}
          badgeCount={pendingCounts.handovers || 0}
          badgeTone="emerald"
        />
        <SidebarNavLink
          href="/petugas/tugas?status=pengembalian"
          icon="pengembalian"
          label="Pengembalian"
          isActive={activeQuickFilter === "pengembalian"}
          badgeCount={pendingCounts.returns || 0}
          badgeTone="amber"
        />
        <SidebarNavLink
          href="/petugas/tugas?status=selesai"
          icon="riwayat"
          label="Riwayat Selesai"
          isActive={activeQuickFilter === "selesai"}
        />
      </div>
    </nav>
  );
}

function OfficerSidebarNavFallback() {
  return (
    <nav className="flex-1 px-3 py-2 space-y-2">
      <div className="h-8 bg-white/5 rounded-lg animate-pulse" />
      <div className="h-8 bg-white/5 rounded-lg animate-pulse" />
    </nav>
  );
}

export default function OfficerSidebar({ userProfile, pendingCounts = {} }) {
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

  const fullName = userProfile?.full_name || "Petugas Lapangan";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "PT";

  return (
    <aside className="w-full md:w-64 bg-[#0a4a56] text-white flex flex-col shrink-0 border-r border-white/10">
      {/* Brand Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-white/10">
        <Link href="/petugas/dashboard" className="flex items-center gap-2.5 tracking-tight">
          <span className="w-7 h-7 rounded-lg bg-[#f2a33a] text-[#16222b] grid place-items-center shrink-0">
            <svg
              className="w-4 h-4 text-[#16222b]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="3" />
              <rect width="8" height="8" x="8" y="8" rx="1" fill="currentColor" />
            </svg>
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-white text-sm font-bold tracking-tight">SewaAset</span>
            <span className="text-[10px] text-[#f2a33a]/90 font-medium tracking-wider uppercase mt-0.5">
              Portal Petugas
            </span>
          </div>
        </Link>
      </div>

      {/* Profile Mini Card */}
      <div className="p-3 mx-3 my-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-white/10 text-white font-medium grid place-items-center text-xs shrink-0 border border-white/15">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white truncate">{fullName}</p>
          <p className="text-[11px] text-white/55 truncate mt-0.5">
            {userProfile?.role === "admin" ? "Admin (Petugas)" : "Petugas Lapangan"}
          </p>
        </div>
      </div>

      {/* Nav Menu */}
      <Suspense fallback={<OfficerSidebarNavFallback />}>
        <OfficerSidebarNav pendingCounts={pendingCounts} />
      </Suspense>

      {/* Logout Footer */}
      <div className="p-3 border-t border-white/10">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-medium text-white/80 hover:text-white bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-400/30 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
        >
          <OfficerNavIcon name="keluar" className="w-4 h-4 shrink-0" />
          <span>{isLoggingOut ? "Mengeluarkan..." : "Keluar Sesi"}</span>
        </button>
      </div>
    </aside>
  );
}
