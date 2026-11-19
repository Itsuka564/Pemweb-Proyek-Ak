import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ContractViewModal from "./ContractViewModal";
import { getTransactionById } from "@/lib/db/transactions";
import { getPaymentAndContractByRentalId } from "@/lib/db/payments";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/masuk?redirect=/penyewa/transaksi/${id}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";

  const [tx, paymentInfo] = await Promise.all([
    getTransactionById(id, isAdmin ? null : user.id),
    getPaymentAndContractByRentalId(id),
  ]);

  if (!tx || (!isAdmin && tx.renterId !== user.id)) {
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
        <div className="mt-4 pt-4 border-t border-[#d9e1e7] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#5a6b78]">
            {tx.status === "menunggu_persetujuan" && (
              <span>⏳ Menunggu verifikasi kelayakan & persetujuan dari Admin.</span>
            )}
            {(tx.status === "disetujui" || tx.status === "menunggu_pembayaran") && (
              <span>
                ⚠️ Disetujui! Segera selesaikan pembayaran sebelum{" "}
                <strong className="text-[#9c2222]">
                  {formatDate(tx.paymentDueAt)}
                </strong>.
              </span>
            )}
            {tx.status === "dibayar" && (
              <span>✅ Pembayaran lunas. Menunggu serah terima unit dari petugas.</span>
            )}
            {tx.status === "sedang_disewa" && (
              <span>🏢 Unit aset sedang dalam masa sewa aktif Anda.</span>
            )}
            {tx.status === "selesai" && (
              <span>📦 Periode sewa dan serah terima pengembalian telah selesai.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(tx.status === "disetujui" || tx.status === "menunggu_pembayaran") && (
              <Link href={`/penyewa/pembayaran/${tx.id}`}>
                <Button variant="accent" size="sm">
                  Bayar Sekarang →
                </Button>
              </Link>
            )}

            {contract && (
              <ContractViewModal
                contract={contract}
                transactionCode={tx.code}
                renterName={tx.renterName}
              />
            )}
          </div>
        </div>
      </Card>

      {/* Grid: Detail & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Rincian Item Aset yang Disewa">
            <div className="divide-y divide-[#d9e1e7] -mx-5 -my-2">
              {tx.items?.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#5a6b78] uppercase block">
                      {item.assetCode} • {item.category}
                    </span>
                    <h4 className="text-sm font-bold text-[#16222b]">{item.assetName}</h4>
                    <p className="text-xs text-[#5a6b78] mt-0.5">
                      📍 {item.location || "Lokasi belum dispesifikasikan"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#0a4a56] block">
                      {formatRupiah(item.lineTotal)}
                    </span>
                    <span className="text-[10px] text-[#5a6b78]">
                      {formatRupiah(item.rateSnapshot)} / hari × {tx.rentalDays} hari
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Informasi Sewa & Keperluan">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-[#5a6b78] font-bold">Periode Sewa:</dt>
                <dd className="text-[#16222b] font-semibold mt-0.5">
                  {tx.startDate} s/d {tx.endDate} ({tx.rentalDays} hari)
                </dd>
              </div>
              <div>
                <dt className="text-[#5a6b78] font-bold">Tujuan / Keperluan:</dt>
                <dd className="text-[#16222b] mt-0.5">{tx.purpose || "-"}</dd>
              </div>
              {tx.renterNote && (
                <div className="sm:col-span-2">
                  <dt className="text-[#5a6b78] font-bold">Catatan Tambahan Penyewa:</dt>
                  <dd className="text-[#16222b] mt-0.5 italic bg-[#f4f7f9] p-2.5 rounded-lg border border-[#d9e1e7]">
                    &quot;{tx.renterNote}&quot;
                  </dd>
                </div>
              )}
              {tx.decisionNote && (
                <div className="sm:col-span-2">
                  <dt className="text-[#5a6b78] font-bold">Catatan Keputusan Admin:</dt>
                  <dd className="text-[#16222b] mt-0.5 bg-[#d7edf0] p-2.5 rounded-lg border border-[#bce0e5]">
                    {tx.decisionNote}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        {/* Sidebar Info & Status Trail */}
        <div className="space-y-6">
          <Card title="Riwayat Pembayaran">
            {tx.payments?.length === 0 ? (
              <p className="text-xs text-[#5a6b78]">Belum ada riwayat transaksi pembayaran.</p>
            ) : (
              <div className="space-y-3">
                {tx.payments?.map((p) => (
                  <div key={p.id} className="p-3 bg-[#f4f7f9] rounded-lg border border-[#d9e1e7] text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>{formatRupiah(p.amount)}</span>
                      <Badge status={p.status} />
                    </div>
                    <p className="text-[10px] text-[#5a6b78]">Order: {p.midtrans_order_id}</p>
                    {p.paid_at && (
                      <p className="text-[10px] text-[#17633c]">
                        Lunas pada: {formatDate(p.paid_at)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
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
