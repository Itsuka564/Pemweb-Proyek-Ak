"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function AssetCard({ asset }) {
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div className="space-y-4">
        {/* Thumbnail / Photo */}
        <div className="h-44 rounded-lg bg-[#d7edf0] flex items-center justify-center text-5xl overflow-hidden relative">
          {asset.photo && asset.photo.startsWith("http") ? (
            <img
              src={asset.photo}
              alt={asset.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="select-none">{asset.icon || "🏢"}</span>
          )}
          <div className="absolute top-2 right-2">
            <Badge status={asset.status === "siap" ? "tersedia" : asset.status} />
          </div>
        </div>

        {/* Info Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#5a6b78] uppercase tracking-wider">
            <span>{asset.code}</span>
            <span>•</span>
            <span className="truncate max-w-[130px]">{asset.category}</span>
          </div>
          <h3 className="text-base font-extrabold text-[#16222b] group-hover:text-[#0e6b7a] transition-colors line-clamp-1">
            {asset.name}
          </h3>
          <p className="text-xs text-[#5a6b78] line-clamp-1">
            📍 {asset.location}
          </p>
        </div>

        {/* Specifications chip */}
        {asset.areaSize && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f4f7f9] text-[11px] font-semibold text-[#5a6b78]">
            <span>📐 Luas:</span>
            <span className="text-[#16222b] font-bold">
              {asset.areaSize} {asset.areaUnit || "m²"}
            </span>
          </div>
        )}
      </div>

      {/* Price & Action */}
      <div className="pt-4 mt-4 border-t border-[#d9e1e7] flex items-baseline justify-between gap-2">
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

