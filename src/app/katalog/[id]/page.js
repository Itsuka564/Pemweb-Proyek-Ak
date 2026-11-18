import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import AvailabilityCalendar from "./AvailabilityCalendar";
import { getAssetById, getAssetBookingBlocks } from "@/lib/db/assets";
import { getRentalSettings } from "@/lib/db/settings";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const asset = await getAssetById(id);
  if (!asset) return { title: "Aset Tidak Ditemukan" };
  return {
    title: `${asset.name} — SewaAset Kelompok 10`,
    description: asset.description,
  };
}

async function AssetDetailContent({ paramsPromise }) {
  const { id } = await paramsPromise;
  const [asset, blocks, settings] = await Promise.all([
    getAssetById(id),
    getAssetBookingBlocks(id),
    getRentalSettings(),
  ]);

  if (!asset) {
    notFound();
  }

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Gallery & Description */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-[#d9e1e7] rounded-2xl overflow-hidden shadow-xs">
          <div className="h-72 sm:h-96 bg-[#d7edf0] flex items-center justify-center text-8xl relative overflow-hidden">
            {asset.photos?.[0]?.storage_path && asset.photos[0].storage_path.startsWith("http") ? (
              <img
                src={asset.photos[0].storage_path}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{asset.icon || "🏢"}</span>
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge status={asset.status === "siap" ? "tersedia" : asset.status} />
              <Badge status={asset.condition === "baik" ? "baik" : asset.condition} />
            </div>
          </div>

          {asset.photos && asset.photos.length > 1 && (
            <div className="p-4 border-t border-[#d9e1e7] flex gap-3 overflow-x-auto">
              {asset.photos.map((p, idx) => (
                <div
                  key={idx}
                  className="w-20 h-16 rounded-lg bg-[#d7edf0] border border-[#d9e1e7] shrink-0 overflow-hidden"
                >
                  {p.storage_path.startsWith("http") ? (
                    <img src={p.storage_path} alt={p.alt_text} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xl">🖼️</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Card title="Deskripsi & Informasi Aset">
          <p className="text-sm text-[#16222b] leading-relaxed">
            {asset.description || "Tidak ada deskripsi detail untuk aset ini."}
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[#d9e1e7]">
            <div>
              <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">Kode Aset</span>
              <span className="text-sm font-bold text-[#16222b]">{asset.code}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">Kategori</span>
              <span className="text-sm font-bold text-[#16222b]">{asset.category}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">Luas Area</span>
              <span className="text-sm font-bold text-[#16222b]">
                {asset.areaSize ? `${asset.areaSize} ${asset.areaUnit}` : "-"}
              </span>
            </div>
            <div className="sm:col-span-3">
              <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">Lokasi Aset</span>
              <span className="text-sm font-semibold text-[#16222b]">📍 {asset.location}</span>
            </div>
          </div>
        </Card>

        {asset.specifications && Object.keys(asset.specifications).length > 0 && (
          <Card title="Spesifikasi & Fasilitas">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(asset.specifications).map(([key, val]) => (
                <div key={key} className="p-3 rounded-lg bg-[#f4f7f9] border border-[#d9e1e7]">
                  <span className="text-[11px] font-bold text-[#5a6b78] uppercase block capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                  <div className="text-xs font-semibold text-[#16222b] mt-1">
                    {Array.isArray(val) ? (
                      <ul className="list-disc list-inside space-y-0.5">
                        {val.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <span>{String(val)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <AvailabilityCalendar blocks={blocks} settings={settings} />
      </div>

      {/* Right Column: Pricing & Booking Action */}
      <div className="space-y-6">
        <Card className="sticky top-24 border-[#0e6b7a]/30 shadow-md">
          <div className="space-y-4">
            <div>
              <span className="text-xs text-[#5a6b78] font-bold uppercase tracking-wider block">
                Tarif Penyewaan Resmi
              </span>
              <div className="mt-1">
                <span className="text-2xl sm:text-3xl font-black text-[#0a4a56]">
                  {formatRupiah(asset.dailyRate)}
                </span>
                <span className="text-xs font-normal text-[#5a6b78]"> / hari kalender</span>
              </div>
            </div>

            {(asset.monthlyRate || asset.yearlyRate) && (
              <div className="p-3 rounded-lg bg-[#d7edf0] text-xs space-y-1">
                <span className="font-bold text-[#0a4a56] block">Opsi Tarif Lainnya:</span>
                {asset.monthlyRate && (
                  <p className="text-[#16222b]">
                    • Bulanan: <strong>{formatRupiah(asset.monthlyRate)}</strong> / bulan
                  </p>
                )}
                {asset.yearlyRate && (
                  <p className="text-[#16222b]">
                    • Tahunan: <strong>{formatRupiah(asset.yearlyRate)}</strong> / tahun
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-[#d9e1e7] text-xs text-[#5a6b78]">
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Penyewaan inklusif hari kalender penuh</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Buffer persiapan {settings.preparation_before_days} hari sebelum sewa</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Dokumen PKS sah terbit pasca-pembayaran</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href={`/penyewa/ajukan?assetId=${asset.id}`} className="block">
                <Button variant="accent" size="lg" className="w-full text-base">
                  Ajukan Sewa Aset Ini →
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AssetDetailPage({ params }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-[#5a6b78]">
          <Link href="/katalog" className="hover:text-[#0e6b7a] font-semibold">
            ← Kembali ke Katalog
          </Link>
        </div>

        <Suspense fallback={<div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl">Memuat detail aset...</div>}>
          <AssetDetailContent paramsPromise={params} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
