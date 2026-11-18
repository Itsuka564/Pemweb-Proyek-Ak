import { Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getRenterTransactions } from "@/lib/db/transactions";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard Penyewa — SewaAset Kelompok 10",
  description: "Ringkasan pengajuan sewa, status pembayaran, dan riwayat penyewaan aset.",
};

async function RenterDashboardContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const transactions = await getRenterTransactions(user?.id || "mock-renter");

  const countMenunggu = transactions.filter((t) => t.status === "menunggu_persetujuan").length;
  const countDisetujui = transactions.filter((t) => t.status === "disetujui" || t.status === "menunggu_pembayaran").length;
  const countDisewa = transactions.filter((t) => t.status === "sedang_disewa" || t.status === "dibayar").length;
  const countSelesai = transactions.filter((t) => t.status === "dikembalikan" || t.status === "selesai").length;

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">Menunggu</span>
            <span className="text-2xl sm:text-3xl font-black text-[#7a5200]">{String(countMenunggu).padStart(2, "0")}</span>
          </div>
          <span className="text-2xl">⏳</span>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">Disetujui</span>
            <span className="text-2xl sm:text-3xl font-black text-[#0e6b7a]">{String(countDisetujui).padStart(2, "0")}</span>
          </div>
          <span className="text-2xl">✓</span>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">Sedang Disewa</span>
            <span className="text-2xl sm:text-3xl font-black text-[#1f4f8f]">{String(countDisewa).padStart(2, "0")}</span>
          </div>
          <span className="text-2xl">🏢</span>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">Selesai</span>
            <span className="text-2xl sm:text-3xl font-black text-[#17633c]">{String(countSelesai).padStart(2, "0")}</span>
          </div>
          <span className="text-2xl">📦</span>
        </Card>
      </div>

      {/* Action Bar & Transaction History Table */}
      <Card
        title="Riwayat Pengajuan & Transaksi"
        subtitle="Daftar penyewaan aset yang Anda ajukan beserta status terkini."
        action={
          <Link href="/penyewa/ajukan">
            <Button variant="accent" size="sm">
              + Ajukan Sewa Baru
            </Button>
          </Link>
        }
      >
        {transactions.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 grid place-items-center text-xl mx-auto">
              📋
            </div>
            <h4 className="text-sm font-bold text-[#16222b]">Belum Ada Riwayat Pengajuan</h4>
            <p className="text-xs text-[#5a6b78] max-w-sm mx-auto">
              Anda belum memiliki transaksi penyewaan aset. Jelajahi katalog dan ajukan sewa pertama Anda.
            </p>
            <div className="pt-2">
              <Link href="/katalog">
                <Button variant="outline" size="sm">
                  Jelajahi Katalog Aset →
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f4f7f9] border-y border-[#d9e1e7] text-[#5a6b78]">
                <tr>
                  <th className="px-5 py-3 font-bold uppercase">Kode</th>
                  <th className="px-5 py-3 font-bold uppercase">Aset yang Disewa</th>
                  <th className="px-5 py-3 font-bold uppercase">Periode</th>
                  <th className="px-5 py-3 font-bold uppercase">Total Biaya</th>
                  <th className="px-5 py-3 font-bold uppercase">Status</th>
                  <th className="px-5 py-3 font-bold uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9e1e7]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-[#0a4a56] whitespace-nowrap">
                      {tx.code}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <span className="font-bold text-[#16222b] block truncate">{tx.assetNames}</span>
                      <span className="text-[11px] text-[#5a6b78]">{tx.itemCount} unit aset</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-[#5a6b78]">
                      <div>{tx.startDate} s/d {tx.endDate}</div>
                      <span className="text-[11px] font-semibold text-[#16222b]">({tx.rentalDays} hari)</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-bold text-[#16222b]">
                      {formatRupiah(tx.totalCost)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge status={tx.status} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <Link href={`/penyewa/transaksi/${tx.id}`}>
                        <Button variant="outline" size="sm" className="text-xs py-1 px-3">
                          Detail
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
    </div>
  );
}

export default function RenterDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a4a56]">
            Dashboard Penyewa
          </h1>
          <p className="text-xs text-[#5a6b78] mt-1">
            Ringkasan seluruh pengajuan dan penyewaan aset Anda.
          </p>
        </div>

        <Suspense fallback={<div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl">Memuat data dashboard penyewa...</div>}>
          <RenterDashboardContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
