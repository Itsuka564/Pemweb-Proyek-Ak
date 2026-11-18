import { Suspense } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import VerificationFilters from "./VerificationFilters";
import { getAdminVerifications } from "@/lib/db/admin";

export const metadata = {
  title: "Verifikasi Berkas Pengguna — Admin Portal",
  description: "Peninjauan dan validasi dokumen identitas KTP, NPWP, dan NIB penyewa aset.",
};

async function VerificationList({ searchParamsPromise }) {
  const resolvedParams = (await searchParamsPromise) || {};
  const status = resolvedParams.status || "semua";
  const search = resolvedParams.search || "";

  const verifications = await getAdminVerifications({ status, search });

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
      title="Daftar Pengajuan Verifikasi Identitas"
      subtitle="Verifikasi diperlukan agar penyewa dapat menjelajahi katalog dan mengajukan sewa aset."
    >
      {verifications.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 grid place-items-center text-xl mx-auto">
            🪪
          </div>
          <h4 className="text-sm font-bold text-[#16222b]">Tidak Ada Pengajuan Verifikasi</h4>
          <p className="text-xs text-[#5a6b78] max-w-sm mx-auto">
            Tidak ditemukan berkas verifikasi dengan kriteria filter saat ini.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f4f7f9] border-y border-[#d9e1e7] text-[#5a6b78]">
              <tr>
                <th className="px-5 py-3 font-bold uppercase">Nama Pemohon</th>
                <th className="px-5 py-3 font-bold uppercase">Jenis Dokumen</th>
                <th className="px-5 py-3 font-bold uppercase">Nomor Dokumen</th>
                <th className="px-5 py-3 font-bold uppercase">Waktu Pengajuan</th>
                <th className="px-5 py-3 font-bold uppercase">Status</th>
                <th className="px-5 py-3 font-bold uppercase text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d9e1e7]">
              {verifications.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-[#16222b] block">{item.renterName}</span>
                    <span className="text-[11px] text-[#5a6b78]">{item.phone}</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                      {item.documentType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[#16222b]">
                    {item.documentNumber}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-[#5a6b78]">
                    {formatDate(item.submittedAt)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <Badge status={item.status} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <Link href={`/admin/verifikasi/${item.id}`}>
                      <Button
                        variant={item.status === "menunggu" ? "accent" : "outline"}
                        size="sm"
                        className="text-xs py-1 px-3"
                      >
                        {item.status === "menunggu" ? "Tinjau Berkas →" : "Detail"}
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

export default function AdminVerifikasiPage({ searchParams }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a4a56]">
          Verifikasi Identitas Penyewa
        </h1>
        <p className="text-xs text-[#5a6b78] mt-1">
          Tinjau keabsahan identitas (KTP, NPWP, atau NIB) sebelum penyewa dapat menyewa aset.
        </p>
      </div>

      <Suspense fallback={<div className="h-10 bg-white rounded-lg animate-pulse" />}>
        <VerificationFilters />
      </Suspense>

      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl border border-[#d9e1e7]">
            Memuat daftar berkas verifikasi...
          </div>
        }
      >
        <VerificationList searchParamsPromise={searchParams} />
      </Suspense>
    </div>
  );
}
