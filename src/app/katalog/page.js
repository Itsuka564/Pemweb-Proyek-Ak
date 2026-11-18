import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AssetCard from "@/components/ui/AssetCard";
import CatalogFilters from "./CatalogFilters";
import { getAssets, getAssetCategories } from "@/lib/db/assets";

export const metadata = {
  title: "Katalog Aset — SewaAset Kelompok 10",
  description: "Daftar inventaris aset tanah, gedung pertemuan, dan ruangan yang dapat disewa.",
};

async function CatalogContent({ searchParams }) {
  const params = await searchParams;
  const search = params?.search || "";
  const categoryId = params?.category || "";
  const location = params?.location || "";

  const [assets, categories] = await Promise.all([
    getAssets({ search, categoryId, location }),
    getAssetCategories(),
  ]);

  return (
    <div className="space-y-6">
      <CatalogFilters categories={categories} />

      <div className="flex items-center justify-between text-xs text-[#5a6b78] px-1">
        <span>
          Menampilkan <strong className="text-[#16222b]">{assets.length}</strong> unit aset tersedia
        </span>
        {(search || categoryId || location) && (
          <span className="text-[#0e6b7a] font-semibold">Filter aktif</span>
        )}
      </div>

      {assets.length === 0 ? (
        <div className="bg-white border border-[#d9e1e7] rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 grid place-items-center text-xl mx-auto">
            🔍
          </div>
          <h3 className="text-base font-bold text-[#16222b]">
            Tidak Ada Aset yang Sesuai Kriteria
          </h3>
          <p className="text-xs text-[#5a6b78] max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau reset filter kategori dan lokasi untuk melihat aset lainnya.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-white border border-[#d9e1e7] rounded-xl"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-[#d9e1e7] rounded-xl p-5 space-y-4">
            <div className="h-44 bg-slate-200 rounded-lg"></div>
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-6 bg-slate-200 rounded w-3/4"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CatalogPage({ searchParams }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a4a56]">
            Katalog Aset
          </h1>
          <p className="text-xs text-[#5a6b78] mt-1">
            Jelajahi dan pilih aset tanah, gedung pertemuan, atau ruangan yang siap disewa.
          </p>
        </div>

        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogContent searchParams={searchParams} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
