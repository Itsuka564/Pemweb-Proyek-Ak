"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

function AssetPlaceholder({ category = "", name = "", className = "w-12 h-12 text-[#0e6b7a]/70" }) {
  const text = `${category} ${name}`.toLowerCase();

  // Parkir / Kendaraan / Otomotif
  if (text.includes("parkir") || text.includes("mobil") || text.includes("kendaraan")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="3" />
        <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
      </svg>
    );
  }

  // Tanah / Lahan Terbuka / Outdoor
  if (text.includes("tanah") || text.includes("lahan")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m2 20 7-8 4 5 3-4 6 7Z" />
        <path d="M17 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0" />
        <path d="M2 20h20" />
      </svg>
    );
  }

  // Auditorium / Panggung
  if (text.includes("auditorium") || text.includes("teater") || text.includes("panggung")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 19h20" />
        <path d="M5 19v-4a7 7 0 0 1 14 0v4" />
        <path d="M9 19v-2a3 3 0 0 1 6 0v2" />
        <circle cx="12" cy="7" r="2" />
      </svg>
    );
  }

  // Ruangan / Ruang Rapat
  if (text.includes("ruang") || text.includes("meeting") || text.includes("rapat")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
        <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
        <path d="M5 18v3" />
        <path d="M19 18v3" />
      </svg>
    );
  }

  // Default: Gedung Pertemuan / Bangunan
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
}

export default function AssetCard({ asset }) {
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  return (
    <Card className="hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group border-slate-200">
      <div className="space-y-4">
        {/* Thumbnail / Photo */}
        <div className="h-44 rounded-lg bg-[#d7edf0]/50 flex items-center justify-center overflow-hidden relative">
          {asset.photo && asset.photo.startsWith("http") ? (
            <img
              src={asset.photo}
              alt={asset.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <AssetPlaceholder
              category={asset.category}
              name={asset.name}
              className="w-14 h-14 text-[#0e6b7a]/70 group-hover:scale-105 transition-transform duration-300"
            />
          )}
          <div className="absolute top-2.5 right-2.5">
            <Badge status={asset.status === "siap" ? "tersedia" : asset.status} />
          </div>
        </div>

        {/* Info Header */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#5a6b78] uppercase tracking-wider">
            <span>{asset.code}</span>
            <span className="text-slate-300">•</span>
            <span className="truncate">{asset.category}</span>
          </div>
          <h3 className="text-base font-extrabold text-[#16222b] group-hover:text-[#0e6b7a] transition-colors line-clamp-1">
            {asset.name}
          </h3>
          <p className="text-xs text-[#5a6b78] line-clamp-1 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{asset.location}</span>
          </p>
        </div>

        {/* Specifications chip */}
        {asset.areaSize && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/60 text-[11px] font-semibold text-[#5a6b78]">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
              <path d="M7 7v4" />
              <path d="M11 7v6" />
              <path d="M15 7v4" />
              <path d="M19 7v6" />
            </svg>
            <span>Luas:</span>
            <span className="text-[#16222b] font-bold">
              {asset.areaSize} {asset.areaUnit || "m²"}
            </span>
          </div>
        )}
      </div>

      {/* Price & Action */}
      <div className="pt-4 mt-4 border-t border-slate-200 flex items-baseline justify-between gap-2">
        <div>
          <span className="text-[11px] text-[#5a6b78] block">Tarif Sewa</span>
          <p className="text-base font-black text-[#0a4a56] leading-tight">
            {formatRupiah(asset.dailyRate)}
            <span className="text-xs font-normal text-[#5a6b78]"> / hari</span>
          </p>
        </div>
        <Link href={`/katalog/${asset.id}`}>
          <Button variant="outline" size="sm">
            Lihat Detail →
          </Button>
        </Link>
      </div>
    </Card>
  );
}
