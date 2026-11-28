import { Suspense } from "react";
import { connection } from "next/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BookingForm from "./BookingForm";
import { getAssets } from "@/lib/db/assets";
import { getRentalSettings } from "@/lib/db/settings";
import Link from "next/link";

export const metadata = {
  title: "Formulir Pengajuan Sewa — SewaAset Kelompok 10",
  description: "Formulir pengajuan penyewaan multi-aset tanah, gedung, dan ruangan.",
};

async function BookingPageContent({ searchParamsPromise }) {
  await connection();
  const params = await searchParamsPromise;
  const initialAssetId = params?.assetId || "";

  const [availableAssets, settings] = await Promise.all([
    getAssets(),
    getRentalSettings(),
  ]);

  return (
    <BookingForm
      availableAssets={availableAssets}
      initialAssetId={initialAssetId}
      settings={settings}
    />
  );
}

export default function BookingPage({ searchParams }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a4a56]">
              Pengajuan Penyewaan Aset
            </h1>
            <p className="text-xs text-[#5a6b78] mt-1">
              Pilih aset, tentukan tanggal hari kalender, dan kirimkan pengajuan ke Admin pengelola.
            </p>
          </div>
          <Link href="/katalog" className="text-xs font-bold text-[#0e6b7a] hover:underline">
            ← Kembali ke Katalog
          </Link>
        </div>

        <Suspense fallback={<div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl">Memuat data pengajuan sewa...</div>}>
          <BookingPageContent searchParamsPromise={searchParams} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
