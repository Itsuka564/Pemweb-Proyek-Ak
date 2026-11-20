"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import { initiatePaymentAction } from "./actions";

export default function PaymentCheckoutCard({
  transactionId,
  transactionCode,
  totalCost,
  existingPayment,
  paymentDueAt,
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentData, setPaymentData] = useState(existingPayment || null);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleInitiatePayment = () => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await initiatePaymentAction(transactionId);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setPaymentData(res);
        if (res.redirectUrl) {
          // Buka gateway Midtrans di tab baru
          window.open(res.redirectUrl, "_blank");
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Rincian Tagihan */}
      <div className="p-5 bg-slate-50 border border-[#d9e1e7] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">
            Total Tagihan Sewa Aset
          </span>
          <span className="text-3xl font-black text-[#0a4a56] block mt-0.5">
            {formatRupiah(totalCost)}
          </span>
          <span className="text-xs text-[#5a6b78] mt-1 block">
            Kode Transaksi: <strong className="font-mono text-[#16222b]">{transactionCode}</strong>
          </span>
        </div>

        {paymentDueAt && (
          <div className="sm:text-right bg-amber-50 sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-0 border-amber-200">
            <span className="text-[11px] font-bold text-amber-800 sm:text-[#5a6b78] uppercase block">
              Batas Waktu Pembayaran
            </span>
            <span className="text-xs font-bold text-amber-900 sm:text-[#16222b] block mt-0.5">
              {new Date(paymentDueAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })} WIB
            </span>
          </div>
        )}
      </div>

      {/* Tombol Eksekusi Pembayaran */}
      {!paymentData ? (
        <div className="space-y-3">
          <p className="text-xs text-[#5a6b78]">
            Klik tombol di bawah ini untuk membuat sesi pembayaran Midtrans Snap resmi (mendukung QRIS, GoPay, Transfer Bank BCA/Mandiri/BNI/BRI, atau Kartu Kredit).
          </p>
          <Button
            type="button"
            variant="accent"
            size="lg"
            className="w-full font-black text-sm"
            onClick={handleInitiatePayment}
            loading={isPending}
            disabled={isPending}
          >
            {isPending ? "Menghubungkan ke Midtrans..." : "Bayar Sekarang via Midtrans Gateway →"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 p-5 bg-white border border-[#0e6b7a]/30 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0a4a56]">Sesi Pembayaran Aktif</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
              Menunggu Pembayaran
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-[#5a6b78]">
            <p>
              Order ID: <strong className="font-mono text-[#16222b]">{paymentData.orderId}</strong>
            </p>
            {paymentData.redirectUrl && (
              <p>
                Link Gateway:{" "}
                <a
                  href={paymentData.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0e6b7a] font-bold hover:underline"
                >
                  Buka Jendela Pembayaran Midtrans ↗
                </a>
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {paymentData.redirectUrl && (
              <a
                href={paymentData.redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button variant="accent" size="md" className="w-full font-bold">
                  Buka Jendela Pembayaran Midtrans Snap ↗
                </Button>
              </a>
            )}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-[#5a6b78] space-y-1">
            <p className="font-semibold text-[#16222b]">ℹ️ Catatan Verifikasi:</p>
            <p>
              Setelah Anda menyelesaikan pembayaran pada jendela Midtrans, sistem akan secara otomatis memverifikasi signature dan memperbarui status transaksi menjadi <strong>Dibayar</strong> serta menerbitkan dokumen <strong>Perjanjian Kerja Sama (PKS)</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
