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

function AssetPlaceholder({ category = "", name = "", className = "w-24 h-24 text-[#0e6b7a]/60" }) {
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

export async function generateMetadata({ params }) {
  const { id } = await params;
  const asset = await getAssetById(id);
  if (!asset) return { title: "Aset Tidak Ditemukan" };
  return {
    title: `${asset.name} — SewaAset`,
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
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="h-72 sm:h-96 bg-[#d7edf0]/50 flex items-center justify-center relative overflow-hidden">
            {asset.photos?.[0]?.storage_path && asset.photos[0].storage_path.startsWith("http") ? (
              <img
                src={asset.photos[0].storage_path}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <AssetPlaceholder category={asset.category} name={asset.name} className="w-24 h-24 sm:w-28 sm:h-28 text-[#0e6b7a]/60" />
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge status={asset.status === "siap" ? "tersedia" : asset.status} />
              <Badge status={asset.condition === "baik" ? "baik" : asset.condition} />
            </div>
          </div>

          {asset.photos && asset.photos.length > 1 && (
            <div className="p-4 border-t border-slate-200 flex gap-3 overflow-x-auto">
              {asset.photos.map((p, idx) => (
                <div
                  key={idx}
                  className="w-20 h-16 rounded-lg bg-[#d7edf0]/40 border border-slate-200 shrink-0 overflow-hidden"
                >
                  {p.storage_path.startsWith("http") ? (
                    <img src={p.storage_path} alt={p.alt_text} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-slate-400">
                      <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
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

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
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
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#16222b] mt-0.5">
                <svg className="w-4 h-4 text-[#0e6b7a] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{asset.location}</span>
              </div>
            </div>
          </div>
        </Card>

        {asset.specifications && Object.keys(asset.specifications).length > 0 && (
          <Card title="Spesifikasi & Fasilitas">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(asset.specifications).map(([key, val]) => (
                <div key={key} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
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
        <Card className="sticky top-24 border-slate-200 shadow-md">
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
              <div className="p-3.5 rounded-xl bg-[#d7edf0]/40 border border-[#0e6b7a]/20 text-xs space-y-1.5">
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

            <div className="space-y-2.5 pt-3 border-t border-slate-200 text-xs text-[#5a6b78]">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#17633c] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Penyewaan inklusif hari kalender penuh</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#17633c] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Buffer persiapan {settings.preparation_before_days} hari sebelum sewa</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#17633c] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
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
          <Link href="/katalog" className="inline-flex items-center gap-1.5 font-semibold text-[#5a6b78] hover:text-[#0e6b7a] transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Kembali ke Katalog</span>
          </Link>
        </div>

        <Suspense fallback={<div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl border border-slate-200">Memuat detail aset...</div>}>
          <AssetDetailContent paramsPromise={params} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
