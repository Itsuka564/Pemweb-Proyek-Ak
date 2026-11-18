import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ContractViewModal from "./ContractViewModal";
import { getTransactionById } from "@/lib/db/transactions";
import { getPaymentAndContractByRentalId } from "@/lib/db/payments";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Transaksi ${id} — SewaAset Kelompok 10`,
    description: "Detail transaksi penyewaan aset.",
  };
}

async function TransactionDetailContent({ paramsPromise, searchParamsPromise }) {
  const { id } = await paramsPromise;
  const searchParams = await searchParamsPromise;
  const isSubmitted = searchParams?.status === "submitted";

  const [tx, paymentInfo] = await Promise.all([
    getTransactionById(id),
    getPaymentAndContractByRentalId(id),
  ]);

  if (!tx) {
    notFound();
  }

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
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

  const { payment, contract } = paymentInfo;

  return (
    <div className="space-y-6">
      {isSubmitted && (
        <div className="p-4 rounded-xl bg-[#dff3e8] border border-[#b8e4cd] text-xs text-[#17633c] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold text-sm">Pengajuan Berhasil Dikirim!</p>
              <p>Permohonan sewa aset Anda telah tercatat dan sedang menunggu peninjauan serta persetujuan Admin.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#5a6b78] uppercase">
                Kode Transaksi:
              </span>
              <span className="font-extrabold text-base text-[#0a4a56]">{tx.code}</span>
              <Badge status={tx.status} />
            </div>
            <p className="text-xs text-[#5a6b78]">
              Diajukan pada: {new Date(tx.submittedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })} WIB
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-[#5a6b78] block">Total Biaya Sewa</span>
            <span className="text-2xl font-black text-[#0a4a56]">
              {formatRupiah(tx.totalCost)}
            </span>
          </div>
        </div>

        {/* Action Button sesuai status */}
        {(tx.status === "disetujui" || tx.status === "menunggu_pembayaran") && (
          <div className="mt-6 p-4 rounded-xl bg-[#fff0cc] border border-[#fde199] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-[#7a5200]">
              <p className="font-bold">Pengajuan Disetujui — Menunggu Pembayaran</p>
              <p className="mt-0.5">
                Silakan selesaikan pembayaran sebelum batas waktu berakhir untuk mengonfirmasi jadwal sewa aset Anda.
              </p>
            </div>
            <Link href={`/penyewa/pembayaran/${tx.id}`}>
              <Button variant="accent" size="md" className="font-black">
                Bayar Sekarang (Midtrans) →
              </Button>
            </Link>
          </div>
        )}

        {tx.status === "ditolak" && (
          <div className="mt-6 p-4 rounded-xl bg-[#fadcdc] border border-[#f5b8b8] text-xs text-[#9c2222]">
            <p className="font-bold">Alasan Penolakan dari Admin:</p>
            <p className="mt-1">{tx.decisionNote || "Jadwal bertabrakan dengan kegiatan kedinasan pengelola aset."}</p>
          </div>
        )}

        {(tx.status === "dibayar" || tx.status === "sedang_disewa" || tx.status === "dikembalikan" || tx.status === "selesai") && (
          <div className="mt-6 p-4 rounded-xl bg-[#dff3e8] border border-[#b8e4cd] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-[#17633c]">
              <p className="font-bold">Pembayaran Terkonfirmasi Lunas</p>
              <p className="mt-0.5">Dokumen Perjanjian Kerja Sama (PKS) resmi telah diterbitkan secara digital.</p>
            </div>
            <div className="flex items-center gap-2">
              {contract && (
                <ContractViewModal
                  contract={contract}
                  transaction={tx}
                  renter={tx.renter}
                />
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Riwayat Pembayaran & Kontrak PKS */}
      {(payment || contract) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Info Pembayaran */}
          {payment && (
            <Card title="Riwayat Pembayaran Gateway (Midtrans)" subtitle="Data mutasi transaksi pembayaran resmi">
              <dl className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-[#5a6b78]">Status Pembayaran:</dt>
                  <dd><Badge status={payment.status} /></dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#5a6b78]">Nomor Order:</dt>
                  <dd className="font-mono font-bold text-[#0a4a56]">{payment.orderId}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#5a6b78]">Nominal Pembayaran:</dt>
                  <dd className="font-black text-[#16222b]">{formatRupiah(payment.amount)}</dd>
                </div>
                {payment.paymentType && (
                  <div className="flex items-center justify-between">
                    <dt className="text-[#5a6b78]">Metode Pembayaran:</dt>
                    <dd className="font-bold uppercase text-[#0a4a56]">{payment.paymentType}</dd>
                  </div>
                )}
                {payment.paidAt && (
                  <div className="flex items-center justify-between">
                    <dt className="text-[#5a6b78]">Waktu Pembayaran:</dt>
                    <dd className="font-medium text-[#16222b]">{formatDate(payment.paidAt)}</dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          {/* Card Info Kontrak PKS */}
          {contract && (
            <Card title="Dokumen Kontrak Perjanjian (PKS)" subtitle="Surat perjanjian sewa menyewa aset sah">
              <dl className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-[#5a6b78]">Nomor Kontrak PKS:</dt>
                  <dd className="font-mono font-bold text-[#0a4a56]">{contract.contractNumber}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#5a6b78]">Status Kontrak:</dt>
                  <dd><Badge status="aktif">Terbit</Badge></dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#5a6b78]">Tanggal Diterbitkan:</dt>
                  <dd className="font-medium text-[#16222b]">{formatDate(contract.generatedAt)}</dd>
                </div>
                <div className="pt-2">
                  <ContractViewModal
                    contract={contract}
                    transaction={tx}
                    renter={tx.renter}
                  />
                </div>
              </dl>
            </Card>
          )}
        </div>
      )}

      {/* Rincian Multi-Aset yang Disewa */}
      <Card title="Rincian Aset yang Disewa" subtitle={`Periode sewa: ${tx.startDate} s/d ${tx.endDate} (${tx.rentalDays} hari kalender inklusif)`}>
        <div className="overflow-x-auto -mx-5 pt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f4f7f9] border-y border-[#d9e1e7] text-[#5a6b78]">
              <tr>
                <th className="px-5 py-3 font-bold uppercase">Kode & Nama Aset</th>
                <th className="px-5 py-3 font-bold uppercase">Kategori & Lokasi</th>
                <th className="px-5 py-3 font-bold uppercase">Tarif Snapshot</th>
                <th className="px-5 py-3 font-bold uppercase">Durasi</th>
                <th className="px-5 py-3 font-bold uppercase text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d9e1e7]">
              {tx.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">
                      {item.assetCode}
                    </span>
                    <span className="font-bold text-[#16222b]">{item.assetName}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[#5a6b78]">
                    <span className="text-[#16222b] font-medium block">{item.category}</span>
                    <span className="text-[11px]">📍 {item.location}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[#16222b] font-semibold whitespace-nowrap">
                    {formatRupiah(item.rateSnapshot)} / hari
                  </td>
                  <td className="px-5 py-3.5 text-[#5a6b78] whitespace-nowrap">
                    {tx.rentalDays} hari
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-[#0a4a56] whitespace-nowrap">
                    {formatRupiah(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#f4f7f9] font-bold text-xs">
              <tr>
                <td colSpan={4} className="px-5 py-3 text-right text-[#5a6b78]">
                  Total Biaya Transaksi:
                </td>
                <td className="px-5 py-3 text-right text-base font-black text-[#0a4a56]">
                  {formatRupiah(tx.totalCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Tujuan & Riwayat Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Keterangan Pengajuan">
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-[#5a6b78] uppercase block text-[11px]">Tujuan Penyewaan</span>
              <p className="text-[#16222b] mt-0.5">{tx.purpose || "-"}</p>
            </div>
            <div>
              <span className="font-bold text-[#5a6b78] uppercase block text-[11px]">Catatan Pemohon</span>
              <p className="text-[#16222b] mt-0.5">{tx.renterNote || "Tidak ada catatan tambahan."}</p>
            </div>
          </div>
        </Card>

        <Card title="Riwayat Status Transaksi" subtitle="Audit trail perubahan status">
          <div className="space-y-3 pt-1">
            {tx.history?.length === 0 ? (
              <p className="text-xs text-[#5a6b78]">Belum ada catatan riwayat status.</p>
            ) : (
              tx.history?.map((h, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs border-l-2 border-[#0e6b7a] pl-3 py-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge status={h.new_status} />
                      <span className="text-[10px] text-[#5a6b78]">
                        {new Date(h.changed_at).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <p className="text-[#16222b] mt-1">{h.change_note}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function TransactionDetailPage({ params, searchParams }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-[#5a6b78]">
          <Link href="/penyewa/dashboard" className="hover:text-[#0e6b7a] font-semibold">
            ← Kembali ke Dashboard Penyewa
          </Link>
        </div>

        <Suspense fallback={<div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl">Memuat detail transaksi...</div>}>
          <TransactionDetailContent paramsPromise={params} searchParamsPromise={searchParams} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
