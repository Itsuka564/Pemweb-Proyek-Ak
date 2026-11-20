import { Suspense } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import NewAssetForm from "./NewAssetForm";
import { getAdminCategories } from "@/lib/db/admin";

export const metadata = {
  title: "Tambah Aset Baru — Admin Portal",
};

async function NewAssetFormWrapper() {
  const categories = await getAdminCategories();
  return <NewAssetForm categories={categories} />;
}

export default function NewAssetPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href="/admin/aset"
          className="text-xs font-bold text-[#0e6b7a] hover:underline flex items-center gap-1 mb-2"
        >
          ← Kembali ke Daftar Aset
        </Link>
        <h1 className="text-2xl font-extrabold text-[#0a4a56]">
          Tambah Data Aset Baru
        </h1>
        <p className="text-xs text-[#5a6b78] mt-1">
          Daftarkan tanah, gedung pertemuan, atau ruangan baru ke dalam sistem pengelola aset.
        </p>
      </div>

      <Card title="Formulir Pendaftaran Aset Baru">
        <Suspense fallback={<div className="p-8 text-center text-xs text-[#5a6b78]">Memuat formulir...</div>}>
          <NewAssetFormWrapper />
        </Suspense>
      </Card>
    </div>
  );
}
