import { Suspense } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getOfficerDashboardStats } from "@/lib/db/officer";

export const metadata = {
  title: "Dashboard Petugas — SewaAset Kelompok 10",
  description: "Daftar penugasan serah terima dan pengembalian aset sewa.",
};

async function OfficerDashboardContent() {
  const stats = await getOfficerDashboardStats();

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-emerald-600">
          <div>
            <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">
              Antrean Serah Terima
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                {String(stats.pendingHandovers).padStart(2, "0")}
              </span>
              <span className="text-xs text-[#5a6b78]">siap diserahkan</span>
            </div>
          </div>
          <span className="text-2xl">🤝</span>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">
              Antrean Pengembalian
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-600">
                {String(stats.pendingReturns).padStart(2, "0")}
              </span>
              <span className="text-xs text-[#5a6b78]">perlu pemeriksaan</span>
            </div>
          </div>
          <span className="text-2xl">🔄</span>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-[#0e6b7a]">
          <div>
            <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">
              Tugas Selesai
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-[#0a4a56]">
                {String(stats.completedTasks).padStart(2, "0")}
              </span>
              <span className="text-xs text-[#5a6b78]">aset dikembalikan</span>
            </div>
          </div>
          <span className="text-2xl">📦</span>
        </Card>
      </div>

      {/* Urgent Tasks Queue Table */}
      <Card
        title="Antrean Tugas Lapangan Mendesak"
        subtitle="Transaksi aktif yang memerlukan serah terima kunci/fasilitas atau pengecekan pengembalian aset."
        action={
          <Link href="/petugas/tugas">
            <span className="text-xs font-bold text-[#0e6b7a] hover:underline">
              Lihat Semua Tugas →
            </span>
          </Link>
        }
      >
        {stats.urgentTasks.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 grid place-items-center text-xl mx-auto">
              ✓
            </div>
            <h4 className="text-sm font-bold text-[#16222b]">Tidak Ada Antrean Mendesak</h4>
            <p className="text-xs text-[#5a6b78] max-w-sm mx-auto">
              Seluruh serah terima dan pengembalian aset saat ini sudah tertangani dengan baik.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f4f7f9] border-y border-[#d9e1e7] text-[#5a6b78]">
                <tr>
                  <th className="px-5 py-3 font-bold uppercase">Kode Transaksi</th>
                  <th className="px-5 py-3 font-bold uppercase">Penyewa & Kontak</th>
                  <th className="px-5 py-3 font-bold uppercase">Aset & Lokasi</th>
                  <th className="px-5 py-3 font-bold uppercase">Periode Sewa</th>
                  <th className="px-5 py-3 font-bold uppercase">Status Saat Ini</th>
                  <th className="px-5 py-3 font-bold uppercase text-right">Tindakan Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9e1e7]">
                {stats.urgentTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-[#0a4a56]">
                      {t.code}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-[#16222b] block">{t.renterName}</span>
                      <span className="text-[11px] text-[#5a6b78]">{t.phone}</span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <span className="font-bold text-[#16222b] block truncate">{t.assetNames}</span>
                      <span className="text-[11px] text-[#5a6b78] block truncate">{t.location}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-[#5a6b78]">
                      <div>{t.startDate} s/d {t.endDate}</div>
                      <span className="text-[11px] font-semibold text-[#16222b]">({t.rentalDays} hari)</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge status={t.status} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <Link href={`/petugas/tugas/${t.id}`}>
                        <Button
                          variant={t.isHandoverPending ? "primary" : "accent"}
                          size="sm"
                          className="text-xs py-1 px-3"
                        >
                          {t.isHandoverPending ? "🤝 Catat Serah Terima" : "🔄 Cek Pengembalian"}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SOP Panduan Operasional Petugas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-950">
          <h4 className="font-bold text-sm flex items-center gap-1.5 text-emerald-900">
            <span>🤝</span> Prosedur Serah Terima (Handover)
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-emerald-900/80">
            <li>Pastikan transaksi berstatus <strong>Sudah Dibayar (Lunas)</strong>.</li>
            <li>Periksa kondisi fisik fasilitas bersama penyewa sebelum menyerahkan kunci/akses.</li>
            <li>Catat kondisi awal (Baik, Perlu Pemeriksaan, atau Rusak) dan dokumentasikan via foto.</li>
            <li>Konfirmasi serah terima di sistem untuk mengubah status transaksi menjadi <em>Sedang Disewa</em>.</li>
          </ol>
        </div>

        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-950">
          <h4 className="font-bold text-sm flex items-center gap-1.5 text-amber-900">
            <span>🔄</span> Prosedur Pengembalian (Return)
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-amber-900/80">
            <li>Inspeksi seluruh fasilitas aset (kebersihan, instalasi listrik, kunci, fisik).</li>
            <li>Jika ada kerusakan atau kelalaian, wajib catat deskripsi kerusakan pada form.</li>
            <li>Unggah bukti foto kondisi aset saat dikembalikan.</li>
            <li>Konfirmasi pengembalian untuk menutup siklus sewa dan melepaskan blokir kalender.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function OfficerDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a4a56]">
          Dashboard Petugas Lapangan
        </h1>
        <p className="text-xs text-[#5a6b78] mt-1">
          Pantau jadwal operasional, serah terima aset awal, dan pengecekan kondisi pengembalian aset.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl border border-[#d9e1e7]">
            Memuat dashboard tugas petugas...
          </div>
        }
      >
        <OfficerDashboardContent />
      </Suspense>
    </div>
  );
}
