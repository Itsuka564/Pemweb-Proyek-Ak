"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export default function AssetFilters({ categories = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const currentCategory = searchParams.get("categoryId") || "";
  const currentStatus = searchParams.get("status") || "";

  const updateParam = (key, val) => {
    const params = new URLSearchParams(searchParams);
    if (val) {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`/admin/aset?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam("search", search.trim());
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#d9e1e7]">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kode atau nama aset..."
          className="w-full px-3 py-1.5 text-xs bg-white border border-[#c7d2da] rounded-lg focus:outline-none focus:border-[#0e6b7a]"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-[#0e6b7a] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#0a4a56]"
        >
          Cari
        </button>
      </form>

      {/* Dropdown Filters */}
      <div className="flex items-center gap-2">
        <select
          value={currentCategory}
          onChange={(e) => updateParam("categoryId", e.target.value)}
          className="px-3 py-1.5 text-xs bg-white border border-[#c7d2da] rounded-lg focus:outline-none focus:border-[#0e6b7a]"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={currentStatus}
          onChange={(e) => updateParam("status", e.target.value)}
          className="px-3 py-1.5 text-xs bg-white border border-[#c7d2da] rounded-lg focus:outline-none focus:border-[#0e6b7a]"
        >
          <option value="">Semua Status Operasional</option>
          <option value="siap">Siap Pakai</option>
          <option value="perbaikan">Perbaikan / Perawatan</option>
          <option value="tidak_tersedia">Tidak Tersedia</option>
        </select>
      </div>
    </div>
  );
}
