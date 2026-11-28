import { Suspense } from "react";
import Link from "next/link";
import OfficerTaskFilters from "./OfficerTaskFilters";
import { getOfficerTasks } from "@/lib/db/officer";

export const metadata = {
  title: "Daftar Tugas Operasional — Portal Petugas",
};

function TaskIcon({ name, className = "w-4 h-4 shrink-0" }) {
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
    case "tugas":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" x2="8" y1="13" y2="13" />
          <line x1="16" x2="8" y1="17" y2="17" />
          <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
      );
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
    case "check":
      return (
        <svg {...props}>
          <polyline points="20 6 9 17 4 12" />
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

async function OfficerTaskList({ searchParamsPromise }) {
  const resolvedParams = (await searchParamsPromise) || {};
  const statusFilter = resolvedParams.status || "semua";
  const search = resolvedParams.search || "";

  const tasks = await getOfficerTasks({ statusFilter, search });

  if (tasks.length === 0) {
    return (
      <div className="py-12 px-6 text-center space-y-2.5">
        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 text-slate-400 grid place-items-center mx-auto">
          <TaskIcon name="tugas" className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">Tidak Ada Tugas</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Tidak ditemukan transaksi yang memerlukan tindakan pada kriteria filter saat ini.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500">
          <tr>
            <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider">Kode Transaksi</th>
            <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider">Penyewa &amp; Kontak</th>
            <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider">Aset yang Disewa</th>
            <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider">Periode Sewa</th>
            <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider">Status Transaksi</th>
            <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider">Status Berkas</th>
            <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-right">Tindakan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/80">
          {tasks.map((task) => {
            const isHandover = task.status === "disetujui" || task.status === "dibayar";
            const isReturn = task.status === "sedang_disewa";

            return (
              <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-3.5 whitespace-nowrap font-mono font-medium text-slate-900">
                  {task.code}
                </td>
                <td className="px-5 py-3.5">
                  <span className="font-medium text-slate-900 block">{task.renterName}</span>
                  <span className="text-xs text-slate-500 mt-0.5 block">{task.phone}</span>
                </td>
                <td className="px-5 py-3.5 max-w-xs">
                  <span className="font-medium text-slate-900 block truncate">{task.assetNames}</span>
                  <span className="text-xs text-slate-500 mt-0.5 block truncate">{task.location}</span>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                  <div>{task.startDate} s/d {task.endDate}</div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">({task.rentalDays} hari)</span>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <StatusPill status={task.status} />
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-[11px] space-y-1.5">
                  <div>
                    {task.hasHandover ? (
                      <span className="text-emerald-700 font-medium inline-flex items-center gap-1.5">
                        <TaskIcon name="check" className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Serah Terima Selesai</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mx-1" aria-hidden="true" />
                        <span>Belum Serah Terima</span>
                      </span>
                    )}
                  </div>
                  <div>
                    {task.hasReturn ? (
                      <span className="text-emerald-700 font-medium inline-flex items-center gap-1.5">
                        <TaskIcon name="check" className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Pengembalian Selesai</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mx-1" aria-hidden="true" />
                        <span>Belum Pengembalian</span>
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-right">
                  <Link
                    href={`/petugas/tugas/${task.id}`}
                    className={
                      isHandover
                        ? "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0e6b7a] hover:bg-[#0a4a56] text-white transition-colors"
                        : isReturn
                        ? "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#f2a33a] hover:bg-[#e29329] text-[#16222b] transition-colors"
                        : "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                    }
                  >
                    {isHandover ? (
                      <>
                        <TaskIcon name="serah_terima" className="w-4 h-4 shrink-0" />
                        <span>Serah Terima</span>
                      </>
                    ) : isReturn ? (
                      <>
                        <TaskIcon name="pengembalian" className="w-4 h-4 shrink-0" />
                        <span>Pengembalian</span>
                      </>
                    ) : (
                      <span>Detail Berita Acara</span>
                    )}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function OfficerTasksPage({ searchParams }) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Daftar Tugas Operasional Lapangan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kelola berita acara serah terima dan pengembalian aset sewa dengan validasi kondisi fisik aktual.
        </p>
      </div>

      {/* Unified Table Container with Integrated Toolbar */}
      <section className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">
            Daftar Penugasan Lapangan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Serah terima aset sebelum penggunaan dan pemeriksaan pengembalian aset setelah selesai.
          </p>
        </div>

        <div className="px-5 py-3 bg-slate-50/40 border-b border-slate-200/80">
          <Suspense fallback={<div className="h-9 bg-slate-100 rounded-lg animate-pulse" />}>
            <OfficerTaskFilters />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <div className="p-12 text-center text-xs text-slate-500">
              Memuat daftar tugas operasional...
            </div>
          }
        >
          <OfficerTaskList searchParamsPromise={searchParams} />
        </Suspense>
      </section>
    </div>
  );
}
