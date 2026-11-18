import { Suspense } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ApplicationFilters from "./ApplicationFilters";
import { getAdminRentalApplications } from "@/lib/db/admin";

export const metadata = {
  title: "Persetujuan Pengajuan Sewa — Admin Portal",
};

async function ApplicationList({ searchParamsPromise }) {
  const resolvedParams = (await searchParamsPromise) || {};
  const status = resolvedParams.status || "semua";
  const search = resolvedParams.search || "";

  const applications = await getAdminRentalApplications({ status, search });

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card
      title="Daftar Pengajuan Penyewaan Aset"
      subtitle="Tinjau ketersediaan kalender dan berikan persetujuan atau penolakan pengajuan sewa."
    >
      {applications.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 grid place-items-center text-xl mx-auto">
            📋
          </div>
          <h4 className="text-sm font-bold text-[#16222b]">Tidak Ada Pengajuan Sewa</h4>
          <p className="text-xs text-[#5a6b78] max-w-sm mx-auto">
            Tidak ditemukan pengajuan dengan kriteria status atau pencarian saat ini.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f4f7f9] border-y border-[#d9e1e7] text-[#5a6b78]">
              <tr>
                <th className="px-5 py-3 font-bold uppercase">Kode & Waktu</th>
                <th className="px-5 py-3 font-bold uppercase">Nama Pemohon</th>
                <th className="px-5 py-3 font-bold uppercase">Aset yang Disewa</th>
                <th className="px-5 py-3 font-bold uppercase">Periode Sewa</th>
                <th className="px-5 py-3 font-bold uppercase">Total Biaya</th>
                <th className="px-5 py-3 font-bold uppercase">Status</th>
                <th className="px-5 py-3 font-bold uppercase text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d9e1e7]">
              {applications.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="font-mono font-bold text-[#0a4a56] block">
                      {tx.code}
                    </span>
                    <span className="text-[11px] text-[#5a6b78]">
                      {formatDate(tx.submittedAt)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-[#16222b] block">{tx.renterName}</span>
                    <span className="text-[11px] text-[#5a6b78]">{tx.phone}</span>
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <span className="font-medium text-[#16222b] block truncate">{tx.assetNames}</span>
                    <span className="text-[11px] text-[#5a6b78]">{tx.itemCount} unit aset</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-[#5a6b78]">
                    <div>{tx.startDate} s/d {tx.endDate}</div>
                    <span className="text-[11px] font-semibold text-[#16222b]">({tx.rentalDays} hari)</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap font-extrabold text-[#16222b]">
                    {formatRupiah(tx.totalCost)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <Badge status={tx.status} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <Link href={`/admin/pengajuan/${tx.id}`}>
                      <Button
                        variant={tx.status === "menunggu_persetujuan" ? "accent" : "outline"}
                        size="sm"
                        className="text-xs py-1 px-3"
                      >
                        {tx.status === "menunggu_persetujuan" ? "Periksa & Setujui →" : "Detail"}
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

export default function AdminPengajuanPage({ searchParams }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a4a56]">
          Persetujuan Pengajuan Sewa
        </h1>
        <p className="text-xs text-[#5a6b78] mt-1">
          Validasi jadwal, cek potensi double booking, dan putuskan persetujuan pengajuan sewa multi-aset.
        </p>
      </div>

      <Suspense fallback={<div className="h-10 bg-white rounded-lg animate-pulse" />}>
        <ApplicationFilters />
      </Suspense>

      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl border border-[#d9e1e7]">
            Memuat daftar pengajuan sewa...
          </div>
        }
      >
        <ApplicationList searchParamsPromise={searchParams} />
      </Suspense>
    </div>
  );
}
