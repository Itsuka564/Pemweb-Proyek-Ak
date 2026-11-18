"use client";

import { useState, useActionState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/FormFields";
import { submitRentalAction } from "./actions";

export default function BookingForm({ availableAssets = [], initialAssetId = "", settings = { preparation_before_days: 1, preparation_after_days: 1 } }) {
  const [selectedAssetIds, setSelectedAssetIds] = useState(
    initialAssetId ? [initialAssetId] : availableAssets.length > 0 ? [availableAssets[0].id] : []
  );

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [state, formAction, isPending] = useActionState(submitRentalAction, null);

  const toggleAsset = (assetId) => {
    setSelectedAssetIds((prev) => {
      if (prev.includes(assetId)) {
        if (prev.length === 1) return prev; // Minimal harus ada 1 aset terpilih
        return prev.filter((id) => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });
  };

  // Kalkulasi hari kalender inklusif
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
                     Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    if (diffTime < 0) return 0;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const rentalDays = calculateDays();

  // Hitung total estimasi dari aset terpilih
  const selectedAssets = availableAssets.filter((a) => selectedAssetIds.includes(a.id));
  const dailyTotal = selectedAssets.reduce((acc, curr) => acc + (curr.dailyRate || 0), 0);
  const grandTotal = dailyTotal * rentalDays;

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="p-4 rounded-xl bg-[#fadcdc] border border-[#f5b8b8] text-xs font-semibold text-[#9c2222]">
          ⚠️ {state.error}
        </div>
      )}

      {/* Hidden inputs untuk mengirim array assetIds ke server action */}
      {selectedAssetIds.map((id) => (
        <input key={id} type="hidden" name="assetIds" value={id} />
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Input Utama */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pilih Aset (Multi-Aset) */}
          <Card title="Pilih Aset yang Ingin Disewa" subtitle="Anda dapat memilih satu atau beberapa aset sekaligus dalam satu pengajuan.">
            <div className="space-y-3 pt-2">
              {availableAssets.map((asset) => {
                const isSelected = selectedAssetIds.includes(asset.id);
                return (
                  <div
                    key={asset.id}
                    onClick={() => toggleAsset(asset.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-[#d7edf0] border-[#0e6b7a] ring-1 ring-[#0e6b7a]"
                        : "bg-white border-[#d9e1e7] hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Controlled via card click
                        className="w-4 h-4 text-[#0e6b7a] rounded border-slate-300 focus:ring-[#0e6b7a]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[#5a6b78] uppercase">
                            {asset.code} • {asset.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#16222b]">{asset.name}</h4>
                        <p className="text-xs text-[#5a6b78]">📍 {asset.location}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-[#0a4a56] block">
                        {formatRupiah(asset.dailyRate)}
                      </span>
                      <span className="text-[10px] text-[#5a6b78]">/ hari</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Periode Sewa Inklusif */}
          <Card title="Periode Tanggal Sewa" subtitle="Dihitung penuh per hari kalender. Tanggal mulai dan selesai bersifat inklusif.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Tanggal Mulai Sewa"
                name="startDate"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <Input
                label="Tanggal Selesai Sewa"
                name="endDate"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {startDate && endDate && rentalDays <= 0 && (
              <p className="mt-3 text-xs text-[#9c2222] font-semibold">
                ⚠️ Tanggal selesai tidak boleh sebelum tanggal mulai sewa.
              </p>
            )}

            {rentalDays > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-[#f4f7f9] border border-[#d9e1e7] flex items-center justify-between text-xs">
                <span className="text-[#5a6b78]">Durasi Hari Kalender:</span>
                <span className="font-bold text-[#0a4a56]">{rentalDays} Hari Penuh (Inklusif)</span>
              </div>
            )}
          </Card>

          {/* Keperluan & Catatan */}
          <Card title="Tujuan & Keterangan Pengajuan">
            <div className="space-y-4 pt-2">
              <Input
                label="Tujuan / Keperluan Penggunaan Aset"
                name="purpose"
                placeholder="Contoh: Kegiatan Pameran Seni dan Rapat Kerja Asosiasi"
                required
              />

              <Textarea
                label="Catatan Tambahan untuk Admin (Opsional)"
                name="renterNote"
                rows={3}
                placeholder="Jelaskan kebutuhan teknis khusus atau waktu perkiraan serah terima..."
              />
            </div>
          </Card>
        </div>

        {/* Sidebar Rincian Biaya */}
        <div className="space-y-6">
          <Card className="sticky top-24 border-[#0e6b7a]/30 shadow-md">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#0a4a56] border-b border-[#d9e1e7] pb-3">
                Ringkasan Estimasi Biaya
              </h3>

              {/* Rincian per item */}
              <div className="space-y-2 text-xs">
                {selectedAssets.map((asset) => (
                  <div key={asset.id} className="flex justify-between items-baseline gap-2 pb-2 border-b border-dashed border-[#d9e1e7]">
                    <div>
                      <span className="font-bold text-[#16222b] block">{asset.name}</span>
                      <span className="text-[11px] text-[#5a6b78]">
                        {rentalDays > 0 ? `${rentalDays} hari × ${formatRupiah(asset.dailyRate)}` : `${formatRupiah(asset.dailyRate)} / hari`}
                      </span>
                    </div>
                    <span className="font-bold text-[#16222b]">
                      {rentalDays > 0 ? formatRupiah(asset.dailyRate * rentalDays) : "-"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Box */}
              <div className="pt-2">
                <span className="text-xs text-[#5a6b78] font-bold block uppercase">
                  Total Estimasi Biaya
                </span>
                <p className="text-2xl font-black text-[#0a4a56]">
                  {formatRupiah(grandTotal)}
                </p>
                <p className="text-[11px] text-[#5a6b78] mt-0.5">
                  * Nominal resmi dihitung oleh server backend dan tidak dapat dimanipulasi dari browser.
                </p>
              </div>

              {/* Buffer Information Alert */}
              <div className="p-3 rounded-lg bg-[#fff0cc] border border-[#fde199] text-[11px] text-[#7a5200] space-y-1">
                <p className="font-bold">Ketentuan Buffer Operasional:</p>
                <p>
                  Sistem otomatis menahan buffer persiapan <strong>{settings.preparation_before_days} hari sebelum</strong> dan <strong>{settings.preparation_after_days} hari sesudah</strong> sewa untuk pemeliharaan tempat.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="w-full text-base font-extrabold"
                  loading={isPending}
                  disabled={selectedAssetIds.length === 0 || rentalDays <= 0}
                >
                  Kirim Pengajuan Sewa →
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}

