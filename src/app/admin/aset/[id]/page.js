import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EditAssetForm from "./EditAssetForm";
import AssetPhotoManager from "./AssetPhotoManager";
import AssetRateManager from "./AssetRateManager";
import { getAdminAssetById, getAdminCategories } from "@/lib/db/admin";

export const metadata = {
  title: "Kelola Detail Aset — Admin Portal",
};

async function AssetDetailContent({ paramsPromise }) {
  const resolvedParams = await paramsPromise;
  const [asset, categories] = await Promise.all([
    getAdminAssetById(resolvedParams.id),
    getAdminCategories(),
  ]);

  if (!asset) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/aset"
            className="text-xs font-bold text-[#0e6b7a] hover:underline flex items-center gap-1 mb-2"
          >
            ← Kembali ke Daftar Aset
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#0a4a56]">
              {asset.name}
            </h1>
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#0e6b7a]/10 text-[#0e6b7a] border border-[#0e6b7a]/20">
              {asset.code}
            </span>
          </div>
          <p className="text-xs text-[#5a6b78] mt-1">
            Kategori: <strong className="text-[#16222b]">{asset.categoryName}</strong> • Lokasi: {asset.location}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status={asset.operationalStatus} className="text-xs px-3 py-1" />
          <Link href={`/katalog/${asset.id}`} target="_blank">
            <button className="px-3 py-1.5 bg-white border border-[#d9e1e7] hover:bg-slate-50 text-xs font-bold text-[#0a4a56] rounded-lg transition-colors cursor-pointer">
              Lihat di Publik ↗
            </button>
          </Link>
        </div>
      </div>

      {/* Section 1: Informasi Dasar */}
      <Card
        title="Informasi Utama & Spesifikasi"
        subtitle="Ubah informasi nama, kategori, luas, lokasi, dan kondisi fisik aset."
      >
        <EditAssetForm asset={asset} categories={categories} />
      </Card>

      {/* Section 2: Galeri & Upload Foto */}
      <Card
        title="Manajemen Foto Aset"
        subtitle="Foto disimpan di Supabase Storage (bucket 'asset-photos') dan terhubung secara relasional ke aset."
      >
        <AssetPhotoManager assetId={asset.id} photos={asset.photos} />
      </Card>

      {/* Section 3: Tarif Multi-Periode */}
      <Card
        title="Pengaturan Tarif (Harian, Bulanan, Tahunan)"
        subtitle="Sistem mendukung struktur tarif per periode dengan tanggal efektif berlakunya."
      >
        <AssetRateManager assetId={asset.id} rates={asset.rates} />
      </Card>
    </div>
  );
}

export default function AdminAssetDetailPage({ params }) {
  return (
    <div className="max-w-5xl">
      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl border border-[#d9e1e7]">
            Memuat data detail aset...
          </div>
        }
      >
        <AssetDetailContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}
