import { Suspense } from "react";
import Link from "next/link";
import { getOfficerDashboardStats } from "@/lib/db/officer";

export const metadata = {
  title: "Dashboard Petugas — SewaAset",
  description: "Daftar penugasan serah terima dan pengembalian aset sewa.",
};

function OfficerIcon({ name, className = "w-4 h-4 shrink-0" }) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "serah_terima":
      return (
        <svg {...props}>
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      );
    case "pengembalian":
      return (
        <svg {...props}>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      );
    case "selesai":
      return (
        <svg {...props}>
          <path d="m7.5 4.27 9 5.15" />
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "arrow_right":
      return (
        <svg {...props}>
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      );
    default:
      return null;
  }
}

function StatusPill({ status }) {
  const key = (status || "").toString().toLowerCase().replace(/\s+/g, "_");
  const styles = {
    disetujui: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    dibayar: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    dikembalikan: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    selesai: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    sedang_disewa: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20",
    perlu_pemeriksaan: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
    menunggu: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
    rusak: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
    batal: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
  };
  const label = (status || "-")
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
        styles[key] || "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20"
      }`}
    >
      {label}
    </span>
  );
}

async function OfficerDashboardContent() {
  const stats = await getOfficerDashboardStats();

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Antrean Serah Terima
              </span>
              <p className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-slate-900 mt-2">
                {String(stats.pendingHandovers).padStart(2, "0")}
              </p>
              <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                <span>Siap diserahkan ke penyewa</span>
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200/70 p-2 rounded-lg text-slate-500 shrink-0">
              <OfficerIcon name="serah_terima" className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Antrean Pengembalian
              </span>
              <p className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-slate-900 mt-2">
                {String(stats.pendingReturns).padStart(2, "0")}
              </p>
              <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                <span>Perlu pemeriksaan kondisi</span>
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200/70 p-2 rounded-lg text-slate-500 shrink-0">
              <OfficerIcon name="pengembalian" className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Tugas Selesai
              </span>
              <p className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-slate-900 mt-2">
                {String(stats.completedTasks).padStart(2, "0")}
              </p>
              <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0e6b7a] shrink-0" aria-hidden="true" />
                <span>Aset selesai dikembalikan</span>
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200/70 p-2 rounded-lg text-slate-500 shrink-0">
              <OfficerIcon name="selesai" className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Tasks Queue Table */}
      <section className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              Antrean Tugas Lapangan Mendesak
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Transaksi aktif yang memerlukan serah terima kunci/fasilitas atau pengecekan pengembalian aset.
            </p>
          </div>
          <Link
            href="/petugas/tugas"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0e6b7a] hover:text-[#0a4a56] transition-colors shrink-0"
          >
            <span>Lihat Semua Tugas</span>
            <OfficerIcon name="arrow_right" className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.urgentTasks.length === 0 ? (
          <div className="py-10 px-6 text-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 text-slate-400 grid place-items-center mx-auto">
              <OfficerIcon name="check" className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Tidak Ada Antrean Mendesak</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Seluruh serah terima dan pengembalian aset saat ini sudah tertangani dengan baik.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider">Kode Transaksi</th>
                  <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider">Penyewa &amp; Kontak</th>
                  <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider">Aset &amp; Lokasi</th>
                  <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider">Periode Sewa</th>
                  <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider">Status Saat Ini</th>
                  <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-right">Tindakan Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {stats.urgentTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono font-medium text-slate-900">
                      {t.code}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-900 block">{t.renterName}</span>
                      <span className="text-xs text-slate-500 mt-0.5 block">{t.phone}</span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <span className="font-medium text-slate-900 block truncate">{t.assetNames}</span>
                      <span className="text-xs text-slate-500 mt-0.5 block truncate">{t.location}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                      <div>{t.startDate} s/d {t.endDate}</div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">({t.rentalDays} hari)</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusPill status={t.status} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <Link
                        href={`/petugas/tugas/${t.id}`}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          t.isHandoverPending
                            ? "bg-[#0e6b7a] hover:bg-[#0a4a56] text-white"
                            : "bg-[#f2a33a] hover:bg-[#e29329] text-[#16222b] font-semibold"
                        }`}
                      >
                        <OfficerIcon
                          name={t.isHandoverPending ? "serah_terima" : "pengembalian"}
                          className="w-4 h-4 shrink-0"
                        />
                        <span>{t.isHandoverPending ? "Catat Serah Terima" : "Cek Pengembalian"}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SOP Panduan Operasional Petugas */}
      <section className="bg-white border border-slate-200/80 rounded-xl grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
        <div className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <OfficerIcon name="serah_terima" className="w-4 h-4 text-slate-500" />
            <span>Prosedur Serah Terima (Handover)</span>
          </h3>
          <ol className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-600 grid place-items-center shrink-0 mt-0.5">
                1
              </span>
              <span>
                Pastikan transaksi berstatus <strong className="font-medium text-slate-800">Disetujui / Lunas</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-600 grid place-items-center shrink-0 mt-0.5">
                2
              </span>
              <span>
                Periksa kondisi fisik fasilitas bersama penyewa sebelum menyerahkan kunci/akses.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-600 grid place-items-center shrink-0 mt-0.5">
                3
              </span>
              <span>
                Catat kondisi awal (Baik, Perlu Pemeriksaan, atau Rusak) dan dokumentasikan via foto.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-600 grid place-items-center shrink-0 mt-0.5">
                4
              </span>
              <span>
                Konfirmasi serah terima di sistem untuk mengubah status transaksi menjadi <em>Sedang Disewa</em>.
              </span>
            </li>
          </ol>
        </div>

        <div className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <OfficerIcon name="pengembalian" className="w-4 h-4 text-slate-500" />
            <span>Prosedur Pengembalian (Return)</span>
          </h3>
          <ol className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-600 grid place-items-center shrink-0 mt-0.5">
                1
              </span>
              <span>
                Inspeksi seluruh fasilitas aset (kebersihan, instalasi listrik, kunci, fisik).
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-600 grid place-items-center shrink-0 mt-0.5">
                2
              </span>
              <span>
                Jika ada kerusakan atau kelalaian, wajib catat deskripsi kerusakan pada form.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-600 grid place-items-center shrink-0 mt-0.5">
                3
              </span>
              <span>
                Unggah bukti foto kondisi aset saat dikembalikan.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-600 grid place-items-center shrink-0 mt-0.5">
                4
              </span>
              <span>
                Konfirmasi pengembalian untuk menutup siklus sewa dan melepaskan blokir kalender.
              </span>
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}

export default function OfficerDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Dashboard Petugas Lapangan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Pantau jadwal operasional, serah terima aset awal, dan pengecekan kondisi pengembalian aset.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="p-10 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200/80">
            Memuat dashboard tugas petugas...
          </div>
        }
      >
        <OfficerDashboardContent />
      </Suspense>
    </div>
  );
}
