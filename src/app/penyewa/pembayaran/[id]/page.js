import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import PaymentCheckoutCard from "./PaymentCheckoutCard";
import { getTransactionById } from "@/lib/db/transactions";
import { getPaymentAndContractByRentalId } from "@/lib/db/payments";

export const metadata = {
  title: "Pembayaran Sewa Aset (Midtrans) — Kelompok 10",
  description: "Gerbang pembayaran sewa aset resmi dengan Midtrans Payment Gateway.",
};

async function PaymentContent({ paramsPromise }) {
  const { id } = await paramsPromise;
  const [tx, paymentInfo] = await Promise.all([
    getTransactionById(id),
    getPaymentAndContractByRentalId(id),
  ]);

  if (!tx) {
    notFound();
  }

  // Jika transaksi sudah lunas, alihkan kembali ke halaman detail
  if (tx.status === "dibayar" || tx.status === "sedang_disewa" || tx.status === "selesai") {
    redirect(`/penyewa/transaksi/${tx.id}`);
  }

  return (
    <Card
      title="Selesaikan Pembayaran Penyewaan Aset"
      subtitle={`Transaksi: ${tx.code} • Periode sewa ${tx.startDate} s/d ${tx.endDate} (${tx.rentalDays} hari)`}
    >
      <PaymentCheckoutCard
        transactionId={tx.id}
        transactionCode={tx.code}
        totalCost={tx.totalCost}
        existingPayment={paymentInfo.payment}
        paymentDueAt={tx.paymentDueAt}
      />
    </Card>
  );
}

export default function PaymentPage({ params }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9]">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <Link
            href="/penyewa/dashboard"
            className="text-xs font-bold text-[#0e6b7a] hover:underline flex items-center gap-1 mb-2"
          >
            ← Kembali ke Dashboard Penyewa
          </Link>
          <h1 className="text-2xl font-extrabold text-[#0a4a56]">
            Pembayaran Sewa Aset
          </h1>
          <p className="text-xs text-[#5a6b78] mt-1">
            Pembayaran terenkripsi dan diverifikasi otomatis melalui Midtrans Sandbox.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl border border-[#d9e1e7]">
              Memuat sesi pembayaran...
            </div>
          }
        >
          <PaymentContent paramsPromise={params} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
