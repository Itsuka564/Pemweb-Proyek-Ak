import { Suspense } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import NewCategoryForm from "./NewCategoryForm";
import { getAdminCategories } from "@/lib/db/admin";

export const metadata = {
  title: "Kelola Kategori Aset — Admin Portal",
};

async function CategoryListContent() {
  const categories = await getAdminCategories();

  return (
    <div className="divide-y divide-[#d9e1e7]">
      {categories.map((c) => (
        <div key={c.id} className="py-3 flex items-start justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-[#16222b]">{c.name}</h4>
            <p className="text-[11px] text-[#5a6b78] mt-0.5">
              {c.description || "Tidak ada deskripsi."}
            </p>
          </div>
          <Badge variant={c.is_active ? "tersedia" : "neutral"} className="text-[10px]">
            {c.is_active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      ))}
    </div>
  );
}

export default function AdminKategoriPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href="/admin/aset"
          className="text-xs font-bold text-[#0e6b7a] hover:underline flex items-center gap-1 mb-2"
        >
          ← Kembali ke Data Aset
        </Link>
        <h1 className="text-2xl font-extrabold text-[#0a4a56]">
          Kategori Aset
        </h1>
        <p className="text-xs text-[#5a6b78] mt-1">
          Kelola kategori aset utama (Tanah, Gedung Pertemuan, Ruangan, dll).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Tambah */}
        <div className="md:col-span-1">
          <Card title="Tambah Kategori">
            <NewCategoryForm />
          </Card>
        </div>

        {/* Tabel Kategori */}
        <div className="md:col-span-2">
          <Card title="Daftar Kategori Aktif">
            <Suspense fallback={<div className="p-8 text-center text-xs text-[#5a6b78]">Memuat kategori...</div>}>
              <CategoryListContent />
            </Suspense>
          </Card>
        </div>
      </div>
    </div>
  );
}
