"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const STATUS_OPTIONS = [
  { label: "Semua Tugas Operasional", value: "semua" },
  { label: "🤝 Perlu Serah Terima (Dibayar)", value: "serah_terima" },
  { label: "🔄 Perlu Pengembalian (Sedang Disewa)", value: "pengembalian" },
  { label: "📜 Riwayat Selesai", value: "selesai" },
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
    <div className="space-y-4">
      {/* Tabs Filter */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#d9e1e7] pb-3">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = currentStatus === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#0a4a56] text-white shadow-xs"
                  : "bg-white text-[#5a6b78] hover:bg-slate-100 border border-[#d9e1e7]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kode transaksi, nama penyewa, atau aset..."
          className="flex-1 px-3.5 py-2 text-xs bg-white border border-[#c7d2da] rounded-lg focus:outline-none focus:border-[#0e6b7a]"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-[#0e6b7a] hover:bg-[#0a4a56] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          {isPending ? "..." : "Cari"}
        </button>
      </form>
    </div>
  );
}
