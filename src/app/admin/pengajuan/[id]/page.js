import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ApplicationActionForm from "./ApplicationActionForm";
import { getAdminRentalApplicationById } from "@/lib/db/admin";
import { checkAssetsAvailability } from "@/lib/db/booking";
import { getRentalSettings } from "@/lib/db/settings";

export const metadata = {
  title: "Detail Pengajuan Sewa — Admin Portal",
};

async function ApplicationDetailContent({ paramsPromise }) {
  const resolvedParams = await paramsPromise;
  const [application, settings] = await Promise.all([
    getAdminRentalApplicationById(resolvedParams.id),
    getRentalSettings(),
  ]);

  if (!application) {
    notFound();
  }

  // Cek ketersediaan aset di sisi server
  const assetIds = application.items.map((i) => i.assetId);
  const availabilityCheck = await checkAssetsAvailability(
    assetIds,
    application.startDate,
    application.endDate
  );

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
    <div className="space-y-6">
      {/* Header & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/pengajuan"
            className="text-xs font-bold text-[#0e6b7a] hover:underline flex items-center gap-1 mb-2"
          >
            ← Kembali ke Daftar Pengajuan
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#0a4a56]">
              Pengajuan: {application.code}
            </h1>
            <Badge status={application.status} className="text-xs px-3 py-1" />
          </div>
          <p className="text-xs text-[#5a6b78] mt-1">
            Diajukan pada: {formatDate(application.submittedAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {application.status === "menunggu_persetujuan" && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <span>⏳</span> Menunggu Keputusan Admin
            </span>
          )}
        </div>
      </div>

      {/* Availability Notice Banner */}
      {availabilityCheck.available ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <span className="text-xl">✓</span>
          <div className="text-xs text-emerald-950">
            <p className="font-bold">Aset Siap & Kalender Tersedia</p>
            <p className="mt-0.5">
              Pemeriksaan server mengonfirmasi seluruh {application.items.length} aset yang diajukan tidak mengalami bentrokan jadwal dengan penyewa lain pada periode kalender dan buffer persiapan operasional.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div className="text-xs text-rose-950">
            <p className="font-bold">Peringatan Bentrokan Jadwal (Double Booking Terdeteksi)</p>
            <p className="mt-0.5">
              {availabilityCheck.reason || "Salah satu aset telah memiliki blokir jadwal aktif pada tanggal tersebut."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pemohon & Periode */}
        <div className="space-y-6 lg:col-span-1">
          <Card title="Data Pemohon">
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-[#5a6b78] font-medium">Nama Penyewa:</dt>
                <dd className="font-bold text-[#16222b] mt-0.5">{application.renterName}</dd>
              </div>
              <div>
                <dt className="text-[#5a6b78] font-medium">Nomor Kontak:</dt>
                <dd className="font-bold text-[#16222b] mt-0.5">{application.phone}</dd>
              </div>
              <div>
                <dt className="text-[#5a6b78] font-medium">Alamat:</dt>
                <dd className="text-[#16222b] mt-0.5">{application.address}</dd>
              </div>
              <div>
                <dt className="text-[#5a6b78] font-medium">Status Verifikasi Identitas:</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <Badge status={application.verificationStatus} className="text-[10px]" />
                  <span className="text-[11px] text-[#5a6b78]">
                    ({application.verificationDoc})
                  </span>
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Rincian Waktu & Biaya">
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-[#5a6b78] font-medium">Periode Sewa Inklusif:</dt>
                <dd className="font-bold text-[#0a4a56] mt-0.5">
                  {application.startDate} s/d {application.endDate}
                </dd>
                <dd className="text-[11px] text-[#5a6b78] mt-0.5">
                  Durasi: <strong>{application.rentalDays} hari kalender</strong>
                </dd>
              </div>

              <div>
                <dt className="text-[#5a6b78] font-medium">Buffer Persiapan Operasional:</dt>
                <dd className="text-[#16222b] mt-0.5">
                  Sebelum: {settings.preparation_before_days} hari • Sesudah: {settings.preparation_after_days} hari
                </dd>
              </div>

              <div className="pt-2 border-t border-[#d9e1e7]">
                <dt className="text-[#5a6b78] font-medium">Total Biaya Sewa:</dt>
                <dd className="text-lg font-black text-[#16222b] mt-0.5">
                  {formatRupiah(application.totalCost)}
                </dd>
              </div>

              {application.paymentDueAt && (
                <div>
                  <dt className="text-[#5a6b78] font-medium">Tenggat Pembayaran:</dt>
                  <dd className="font-bold text-amber-700 mt-0.5">
                    {formatDate(application.paymentDueAt)}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        {/* Right Column: Items & Decision Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items Aset Table */}
          <Card title="Daftar Aset yang Disewa" subtitle="Transaksi dapat mencakup beberapa aset sekaligus.">
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f4f7f9] border-y border-[#d9e1e7] text-[#5a6b78]">
                  <tr>
                    <th className="px-5 py-2.5 font-bold uppercase">Aset</th>
                    <th className="px-5 py-2.5 font-bold uppercase">Lokasi</th>
                    <th className="px-5 py-2.5 font-bold uppercase">Tarif / Hari</th>
                    <th className="px-5 py-2.5 font-bold uppercase text-right">Subtotal Item</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d9e1e7]">
                  {application.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-3">
                        <span className="font-bold text-[#16222b] block">{item.assetName}</span>
                        <span className="font-mono text-[11px] text-[#0a4a56]">{item.assetCode}</span>
                      </td>
                      <td className="px-5 py-3 text-[#5a6b78]">{item.assetLocation}</td>
                      <td className="px-5 py-3 font-semibold text-[#16222b]">
                        {formatRupiah(item.rateAmount)}
                      </td>
                      <td className="px-5 py-3 font-bold text-[#16222b] text-right">
                        {formatRupiah(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3.5 bg-slate-50 border border-[#d9e1e7] rounded-lg text-xs space-y-1.5">
              <p>
                <strong>Tujuan Penyewaan:</strong> {application.purpose}
              </p>
              {application.renterNote && (
                <p>
                  <strong>Catatan Tambahan Penyewa:</strong> {application.renterNote}
                </p>
              )}
            </div>
          </Card>

          {/* Decision Form or Status Card */}
          {application.status === "menunggu_persetujuan" ? (
            <Card
              title="Formulir Persetujuan / Penolakan Admin"
              subtitle="Tentukan keputusan persetujuan. Sistem akan memvalidasi jadwal di kalender secara otomatis."
            >
              <ApplicationActionForm
                transactionId={application.id}
                currentStatus={application.status}
              />
            </Card>
          ) : (
            <Card title="Keputusan Pemrosesan Transaksi">
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#5a6b78]">Status Saat Ini:</span>
                  <Badge status={application.status} />
                </div>
                {application.decisionNote && (
                  <div className="p-3 bg-slate-50 border border-[#d9e1e7] rounded-lg">
                    <p className="font-bold text-[#16222b]">Catatan Keputusan Admin:</p>
                    <p className="mt-1 text-[#5a6b78]">{application.decisionNote}</p>
                  </div>
                )}
                {application.processorName && (
                  <p className="text-[11px] text-[#5a6b78]">
                    Diproses oleh: <strong>{application.processorName}</strong> pada {formatDate(application.processedAt)}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* History Timeline */}
          {application.history.length > 0 && (
            <Card title="Riwayat Status Transaksi">
              <div className="space-y-3 text-xs">
                {application.history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 pb-3 border-b border-[#d9e1e7] last:border-0">
                    <div className="w-2 h-2 rounded-full bg-[#0e6b7a] mt-1.5 shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#16222b]">
                          {h.newStatus ? h.newStatus.replace(/_/g, " ").toUpperCase() : "PERUBAHAN STATUS"}
                        </span>
                        <span className="text-[10px] text-[#5a6b78]">{formatDate(h.changedAt)}</span>
                      </div>
                      {h.note && <p className="text-[#5a6b78] mt-0.5">{h.note}</p>}
                      <span className="text-[10px] text-[#5a6b78]">Oleh: {h.changerName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminApplicationDetailPage({ params }) {
  return (
    <div className="max-w-5xl">
      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl border border-[#d9e1e7]">
            Memuat rincian pengajuan sewa...
          </div>
        }
      >
        <ApplicationDetailContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}
