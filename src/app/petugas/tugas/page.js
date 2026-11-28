import { Suspense } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import OfficerTaskFilters from "./OfficerTaskFilters";
import { getOfficerTasks } from "@/lib/db/officer";

export const metadata = {
  title: "Daftar Tugas Operasional — Portal Petugas",
};

async function OfficerTaskList({ searchParamsPromise }) {
  const resolvedParams = (await searchParamsPromise) || {};
  const statusFilter = resolvedParams.status || "semua";
  const search = resolvedParams.search || "";

  const tasks = await getOfficerTasks({ statusFilter, search });

  return (
    <Card
      title="Daftar Penugasan Lapangan"
      subtitle="Serah terima aset sebelum penggunaan dan pemeriksaan pengembalian aset setelah selesai."
    >
      {tasks.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 grid place-items-center text-xl mx-auto">
            📋
          </div>
          <h4 className="text-sm font-bold text-[#16222b]">Tidak Ada Tugas</h4>
          <p className="text-xs text-[#5a6b78] max-w-sm mx-auto">
            Tidak ditemukan transaksi yang memerlukan tindakan pada kriteria filter saat ini.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f4f7f9] border-y border-[#d9e1e7] text-[#5a6b78]">
              <tr>
                <th className="px-5 py-3 font-bold uppercase">Kode Transaksi</th>
                <th className="px-5 py-3 font-bold uppercase">Penyewa & Kontak</th>
                <th className="px-5 py-3 font-bold uppercase">Aset yang Disewa</th>
                <th className="px-5 py-3 font-bold uppercase">Periode Sewa</th>
                <th className="px-5 py-3 font-bold uppercase">Status Transaksi</th>
                <th className="px-5 py-3 font-bold uppercase">Status Berkas</th>
                <th className="px-5 py-3 font-bold uppercase text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d9e1e7]">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-[#0a4a56]">
                    {task.code}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-[#16222b] block">{task.renterName}</span>
                    <span className="text-[11px] text-[#5a6b78]">{task.phone}</span>
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <span className="font-bold text-[#16222b] block truncate">{task.assetNames}</span>
                    <span className="text-[11px] text-[#5a6b78] block truncate">{task.location}</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-[#5a6b78]">
                    <div>{task.startDate} s/d {task.endDate}</div>
                    <span className="text-[11px] font-semibold text-[#16222b]">({task.rentalDays} hari)</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <Badge status={task.status} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-[11px] space-y-1">
                    <div>
                      {task.hasHandover ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          ✓ Serah Terima Selesai
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">
                          ○ Belum Serah Terima
                        </span>
                      )}
                    </div>
                    <div>
                      {task.hasReturn ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          ✓ Pengembalian Selesai
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">
                          ○ Belum Pengembalian
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <Link href={`/petugas/tugas/${task.id}`}>
                      <Button
                        variant={
                          task.status === "disetujui" || task.status === "dibayar"
                            ? "primary"
                            : task.status === "sedang_disewa"
                            ? "accent"
                            : "outline"
                        }
                        size="sm"
                        className="text-xs py-1 px-3"
                      >
                        {task.status === "disetujui" || task.status === "dibayar"
                          ? "🤝 Serah Terima"
                          : task.status === "sedang_disewa"
                          ? "🔄 Pengembalian"
                          : "Detail Berita Acara"}
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
  );
}

export default function OfficerTasksPage({ searchParams }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a4a56]">
          Daftar Tugas Operasional Lapangan
        </h1>
        <p className="text-xs text-[#5a6b78] mt-1">
          Kelola berita acara serah terima dan pengembalian aset sewa dengan validasi kondisi fisik aktual.
        </p>
      </div>

      <Suspense fallback={<div className="h-10 bg-white rounded-lg animate-pulse" />}>
        <OfficerTaskFilters />
      </Suspense>

      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl border border-[#d9e1e7]">
            Memuat daftar tugas operasional...
          </div>
        }
      >
        <OfficerTaskList searchParamsPromise={searchParams} />
      </Suspense>
    </div>
  );
}
