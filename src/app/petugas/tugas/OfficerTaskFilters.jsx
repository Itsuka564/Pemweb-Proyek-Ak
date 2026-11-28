"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const STATUS_OPTIONS = [
  { label: "Semua Tugas Operasional", value: "semua" },
  { label: "Perlu Serah Terima", value: "serah_terima" },
  { label: "Perlu Pengembalian (Sedang Disewa)", value: "pengembalian" },
  { label: "Riwayat Selesai", value: "selesai" },
];

export default function OfficerTaskFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") || "semua";
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const handleStatusChange = (status) => {
    const params = new URLSearchParams(searchParams);
    if (status && status !== "semua") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    startTransition(() => {
      router.push(`/petugas/tugas?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    startTransition(() => {
      router.push(`/petugas/tugas?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      {/* Segmented Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-100/90 p-1 rounded-lg border border-slate-200/70">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = currentStatus === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusChange(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-slate-900 font-medium shadow-2xs ring-1 ring-slate-200/80"
                  : "text-slate-600 font-normal hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full lg:w-auto lg:min-w-[300px]">
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode transaksi, penyewa, atau aset..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0e6b7a] focus:ring-1 focus:ring-[#0e6b7a]/20"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-3.5 py-1.5 bg-[#0e6b7a] hover:bg-[#0a4a56] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-60"
        >
          {isPending ? "..." : "Cari"}
        </button>
      </form>
    </div>
  );
}
