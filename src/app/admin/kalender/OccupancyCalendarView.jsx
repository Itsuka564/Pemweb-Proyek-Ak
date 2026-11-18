"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function OccupancyCalendarView({
  initialMonth = 11,
  initialYear = 2026,
  assets = [],
  blocks = [],
}) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [activeBlockModal, setActiveBlockModal] = useState(null);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Jumlah hari dalam bulan terpilih
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = Minggu

  const filteredAssets = selectedAssetId
    ? assets.filter((a) => a.id === selectedAssetId)
    : assets;

  // Filter blokir yang relevan dengan aset terpilih
  const activeBlocks = selectedAssetId
    ? blocks.filter((b) => b.assetId === selectedAssetId)
    : blocks;

  // Helper untuk cek apakah tanggal tertentu terblokir untuk aset tertentu
  const getBlockForDate = (assetId, dayNumber) => {
    const dayStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
    const targetDate = new Date(dayStr);

    return activeBlocks.find((b) => {
      if (b.assetId !== assetId) return false;
      if (!b.startDate || !b.endDateExclusive) return false;
      const start = new Date(b.startDate);
      const end = new Date(b.endDateExclusive);
      return targetDate >= start && targetDate < end;
    });
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Bulan & Filter Aset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#d9e1e7]">
        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-lg border border-[#c7d2da] bg-white text-slate-700 hover:bg-slate-50 grid place-items-center font-bold cursor-pointer transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-extrabold text-[#0a4a56] min-w-[140px] text-center">
            {monthNames[currentMonth - 1]} {currentYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-lg border border-[#c7d2da] bg-white text-slate-700 hover:bg-slate-50 grid place-items-center font-bold cursor-pointer transition-colors"
          >
            ›
          </button>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[#5a6b78] whitespace-nowrap">
            Filter Aset:
          </label>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-[#c7d2da] rounded-lg focus:outline-none focus:border-[#0e6b7a]"
          >
            <option value="">Semua Aset ({assets.length})</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#5a6b78] bg-slate-50 p-3 rounded-xl border border-[#d9e1e7]">
        <span className="font-bold text-[#16222b]">Keterangan Kalender:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300"></span>
          <span>Tersedia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-[#f2a33a]/30 border border-[#f2a33a]"></span>
          <span>Buffer Persiapan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-rose-500 text-white font-bold text-[9px] grid place-items-center">
            ✕
          </span>
          <span>Tersewa / Diblokir Aktif</span>
        </div>
      </div>

      {/* Timeline Gantt / Grid Per Aset */}
      <div className="bg-white rounded-xl border border-[#d9e1e7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-[#0a4a56] text-white">
                <th className="px-4 py-3 font-bold sticky left-0 bg-[#0a4a56] z-10 w-56 shadow-sm">
                  Daftar Aset Pengelola
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                  <th
                    key={day}
                    className="p-1 text-center font-bold text-[11px] min-w-[28px] border-l border-white/10"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d9e1e7]">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-[#d9e1e7] shadow-xs">
                    <span className="font-mono text-[10px] font-bold text-[#0a4a56] block">
                      {asset.code}
                    </span>
                    <span className="font-bold text-[#16222b] block truncate max-w-[180px]">
                      {asset.name}
                    </span>
                    <span className="text-[10px] text-[#5a6b78]">{asset.category}</span>
                  </td>

                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const block = getBlockForDate(asset.id, day);
                    const isBlocked = Boolean(block);

                    return (
                      <td
                        key={day}
                        className={`p-1 text-center border-l border-[#d9e1e7] transition-all ${
                          isBlocked
                            ? "bg-rose-100 hover:bg-rose-200 cursor-pointer"
                            : "bg-white hover:bg-emerald-50"
                        }`}
                        onClick={() => {
                          if (block) setActiveBlockModal(block);
                        }}
                        title={
                          block
                            ? `Terblokir: ${block.transactionCode} (${block.renterName})`
                            : `Tanggal ${day} ${monthNames[currentMonth - 1]}: Tersedia`
                        }
                      >
                        {isBlocked ? (
                          <div className="w-full h-7 rounded bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow-2xs">
                            ✕
                          </div>
                        ) : (
                          <div className="w-full h-7 rounded text-[10px] text-slate-300 flex items-center justify-center">
                            •
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Blokir Ketika Diklik */}
      {activeBlockModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#d9e1e7] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#d9e1e7] pb-3">
              <h3 className="text-sm font-extrabold text-[#0a4a56]">
                Rincian Blokir Okupansi
              </h3>
              <button
                type="button"
                onClick={() => setActiveBlockModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <dl className="space-y-2.5 text-xs">
              <div>
                <dt className="text-[#5a6b78]">Kode Transaksi:</dt>
                <dd className="font-mono font-bold text-[#0a4a56] text-sm">
                  {activeBlockModal.transactionCode}
                </dd>
              </div>
              <div>
                <dt className="text-[#5a6b78]">Nama Penyewa:</dt>
                <dd className="font-bold text-[#16222b]">
                  {activeBlockModal.renterName}
                </dd>
              </div>
              <div>
                <dt className="text-[#5a6b78]">Status Transaksi:</dt>
                <dd className="mt-0.5">
                  <Badge status={activeBlockModal.transactionStatus} />
                </dd>
              </div>
              <div>
                <dt className="text-[#5a6b78]">Periode Sewa Pemohon:</dt>
                <dd className="font-medium text-[#16222b]">
                  {activeBlockModal.rentalStartDate || "-"} s/d {activeBlockModal.rentalEndDate || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-[#5a6b78]">Total Rentang Blokir Kalender (Termasuk Buffer):</dt>
                <dd className="font-bold text-rose-700">
                  {activeBlockModal.startDate} s/d {activeBlockModal.endDateExclusive} (eksklusif)
                </dd>
              </div>
            </dl>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveBlockModal(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
