import { Suspense } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import AssetFilters from "./AssetFilters";
import AssetRowActions from "./AssetRowActions";
import { getAdminAssets, getAdminCategories } from "@/lib/db/admin";

export const metadata = {
  title: "Kelola Aset & Tarif — Admin Portal",
};

async function AssetFiltersWrapper() {
  const categories = await getAdminCategories();
  return <AssetFilters categories={categories} />;
}

async function AssetList({ searchParamsPromise }) {
  const resolvedParams = (await searchParamsPromise) || {};
  const categoryId = resolvedParams.categoryId || "";
  const operationalStatus = resolvedParams.status || "";
  const search = resolvedParams.search || "";

  const assets = await getAdminAssets({ categoryId, operationalStatus, search });

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <Card title="Daftar Master Aset Pengelola" subtitle="Semua tanah, gedung pertemuan, dan ruangan milik pengelola.">
      {assets.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 grid place-items-center text-xl mx-auto">
            🏢
          </div>
          <h4 className="text-sm font-bold text-[#16222b]">Belum Ada Data Aset</h4>
          <p className="text-xs text-[#5a6b78] max-w-sm mx-auto">
            Tidak ada aset yang sesuai kriteria pencarian atau filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f4f7f9] border-y border-[#d9e1e7] text-[#5a6b78]">
              <tr>
                <th className="px-5 py-3 font-bold uppercase">Kode & Aset</th>
                <th className="px-5 py-3 font-bold uppercase">Kategori</th>
                <th className="px-5 py-3 font-bold uppercase">Lokasi & Luas</th>
                <th className="px-5 py-3 font-bold uppercase">Tarif Harian</th>
                <th className="px-5 py-3 font-bold uppercase">Kondisi & Status</th>
                <th className="px-5 py-3 font-bold uppercase text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d9e1e7]">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {asset.photoUrl ? (
                          <img
                            src={asset.photoUrl}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-slate-400 text-base">
                            🏢
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-[#0a4a56] block text-[11px]">
                          {asset.code}
                        </span>
                        <span className="font-bold text-[#16222b] block truncate max-w-[200px]">
                          {asset.name}
                        </span>
                        {!asset.isActive && (
                          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="font-medium text-[#16222b]">{asset.categoryName}</span>
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <span className="text-[#16222b] block truncate">{asset.location}</span>
                    <span className="text-[11px] text-[#5a6b78]">
                      Luas: {asset.areaSize ? `${asset.areaSize} ${asset.areaUnit}` : "-"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap font-bold text-[#16222b]">
                    {formatRupiah(asset.dailyRate)}
                    <span className="text-[10px] font-normal text-[#5a6b78] block">/ hari</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap space-y-1">
                    <div>
                      <Badge status={asset.operationalStatus} className="text-[10px]" />
                    </div>
                    <span className="text-[11px] text-[#5a6b78] block">
                      Fisik: <strong className="text-[#16222b]">{asset.physicalCondition}</strong>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <AssetRowActions assetId={asset.id} isActive={asset.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function AdminAsetPage({ searchParams }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a4a56]">
            Pengelolaan Data Aset & Tarif
          </h1>
          <p className="text-xs text-[#5a6b78] mt-1">
            Tambah, perbarui, atur spesifikasi, foto, dan tarif multi-periode aset.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/aset/kategori">
            <Button variant="outline" size="sm">
              🏷️ Kategori Aset
            </Button>
          </Link>
          <Link href="/admin/aset/baru">
            <Button variant="accent" size="sm">
              + Tambah Aset Baru
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="h-12 bg-white rounded-xl animate-pulse" />}>
        <AssetFiltersWrapper />
      </Suspense>

      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl border border-[#d9e1e7]">
            Memuat daftar data aset...
          </div>
        }
      >
        <AssetList searchParamsPromise={searchParams} />
      </Suspense>
    </div>
  );
}
