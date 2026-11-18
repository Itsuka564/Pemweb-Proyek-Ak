"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function ContractViewModal({ contract, transaction, renter }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!contract) return null;

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        className="font-bold"
        onClick={() => setIsOpen(true)}
      >
        📄 Lihat Surat Perjanjian (PKS)
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-[#d9e1e7]">
            {/* Header Surat */}
            <div className="text-center border-b-2 border-[#0a4a56] pb-5 space-y-1">
              <span className="w-10 h-10 rounded-xl bg-[#f2a33a] text-[#16222b] inline-grid place-items-center text-lg font-black mb-1 shadow-xs">
                ▣
              </span>
              <h2 className="text-lg font-black text-[#0a4a56] tracking-tight uppercase">
                SURAT PERJANJIAN KERJA SAMA (PKS) PENYEWAAN ASET
              </h2>
              <p className="text-xs font-mono font-bold text-[#5a6b78]">
                Nomor: {contract.contractNumber}
              </p>
            </div>

            {/* Isi Kontrak */}
            <div className="space-y-4 text-xs text-[#16222b] leading-relaxed">
              <p>
                Pada hari ini, tanggal <strong>{formatDate(contract.generatedAt)}</strong>, telah dibuat dan disepakati perjanjian sewa menyewa aset antara:
              </p>

              <div className="p-3 bg-slate-50 border border-[#d9e1e7] rounded-lg space-y-1">
                <p>
                  <strong>PIHAK PERTAMA (PENGELOLA ASET):</strong> Entitas Pengelola Aset Daerah / Perusahaan.
                </p>
                <p>
                  <strong>PIHAK KEDUA (PENYEWA):</strong> {renter?.full_name || "Penyewa Terdaftar"}.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[#0a4a56] uppercase text-[11px] border-b pb-1">
                  Pasal 1 — Objek dan Periode Penyewaan
                </h4>
                <p>
                  PIHAK PERTAMA menyetujui untuk menyewakan aset kepada PIHAK KEDUA dengan rincian:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Kode Transaksi: <strong>{transaction.code}</strong></li>
                  <li>Periode Sewa Inklusif: <strong>{transaction.startDate}</strong> s/d <strong>{transaction.endDate}</strong> ({transaction.rentalDays} hari kalender).</li>
                  <li>Total Biaya Sewa: <strong>{formatRupiah(transaction.totalCost)}</strong> (Lunas diverifikasi).</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[#0a4a56] uppercase text-[11px] border-b pb-1">
                  Pasal 2 — Hak dan Kewajiban Para Pihak
                </h4>
                <ol className="list-decimal list-inside space-y-1 pl-2">
                  <li>PIHAK KEDUA wajib memelihara kebersihan, ketertiban, dan keutuhan fasilitas selama masa sewa.</li>
                  <li>Serah terima kunci dan fasilitas aset dilakukan bersama Petugas Lapangan resmi yang ditugaskan.</li>
                  <li>Pemeriksaan akhir (pengembalian) akan mencatat kondisi fisik aset. Segala kerusakan atau kehilangan menjadi tanggung jawab PIHAK KEDUA.</li>
                </ol>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 text-[11px]">
                Surat perjanjian ini sah dan berkekuatan hukum penuh, diterbitkan secara elektronik oleh Sistem Informasi Penyewaan Aset Kelompok 10 setelah pembayaran terverifikasi otomatis oleh payment gateway.
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-between pt-4 border-t border-[#d9e1e7]">
              <span className="text-[11px] text-[#5a6b78]">
                Status PKS: <strong className="text-emerald-700 uppercase">{contract.status}</strong>
              </span>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                >
                  🖨️ Cetak / Simpan PDF
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
