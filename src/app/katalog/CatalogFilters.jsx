"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";

export default function CatalogFilters({ categories = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("category") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");

  const handleFilter = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (categoryId) params.set("category", categoryId);
    if (location) params.set("location", location);

    startTransition(() => {
      router.push(`/katalog?${params.toString()}`);
    });
  };

  const handleReset = () => {
    setSearch("");
    setCategoryId("");
    setLocation("");
    startTransition(() => {
      router.push("/katalog");
    });
  };

  return (
    <form
      onSubmit={handleFilter}
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div>
          <label className="block text-[11px] font-bold text-[#16222b] uppercase mb-1">
            Cari Nama / Kode Aset
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari gedung, tanah..."
            className="w-full px-3 py-2 text-xs text-[#16222b] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0e6b7a] focus:ring-1 focus:ring-[#0e6b7a]"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-[11px] font-bold text-[#16222b] uppercase mb-1">
            Kategori Aset
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 text-xs text-[#16222b] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0e6b7a] focus:ring-1 focus:ring-[#0e6b7a]"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-[11px] font-bold text-[#16222b] uppercase mb-1">
            Lokasi
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Kawasan, jalan..."
            className="w-full px-3 py-2 text-xs text-[#16222b] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0e6b7a] focus:ring-1 focus:ring-[#0e6b7a]"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-end gap-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="flex-1 py-2 text-xs"
            loading={isPending}
          >
            Terapkan Filter
          </Button>
          {(search || categoryId || location) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="py-2 text-xs"
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

