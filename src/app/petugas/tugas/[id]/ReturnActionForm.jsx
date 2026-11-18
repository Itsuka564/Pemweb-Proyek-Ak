"use client";

import { useActionState, useState } from "react";
import Button from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/FormFields";
import { recordReturnAction } from "../../actions";

export default function ReturnActionForm({ transactionId }) {
  const [state, formAction, isPending] = useActionState(recordReturnAction, null);
  const [finalCondition, setFinalCondition] = useState("baik");
  const [damageNote, setDamageNote] = useState("");

  const hasIssues = finalCondition === "rusak" || finalCondition === "perlu_pemeriksaan";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="transactionId" value={transactionId} />

      {state?.error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
          ⚠️ {state.error}
        </div>
      )}

      {state?.success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
          ✓ {state.message}
        </div>
      )}

      <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-950">
        <p className="font-bold">Formulir Pemeriksaan Pengembalian Aset:</p>
        <p className="mt-0.5">
          Periksa seluruh kondisi fasilitas, kebersihan, dan kelengkapan aset sebelum menyelesaikan transaksi sewa.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Kondisi Fisik Aset Saat Dikembalikan *"
          name="finalCondition"
          value={finalCondition}
          onChange={(e) => setFinalCondition(e.target.value)}
          required
        >
          <option value="baik">Baik (Lengkap, Bersih & Tanpa Kerusakan)</option>
          <option value="perlu_pemeriksaan">Perlu Pemeriksaan / Pembersihan Khusus</option>
          <option value="rusak">Ada Kerusakan / Fasilitas Hilang</option>
        </Select>

        <div>
          <label className="block text-xs font-bold text-[#16222b] mb-1.5">
            Unggah Foto Bukti Pengembalian / Kerusakan
          </label>
          <input
            type="file"
            name="evidence"
            accept="image/jpeg,image/png,image/webp"
            className="w-full text-xs text-[#5a6b78] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0e6b7a] file:text-white hover:file:bg-[#0a4a56] cursor-pointer"
          />
          <p className="text-[10px] text-[#5a6b78] mt-1">
            Foto bukti kondisi akhir atau titik kerusakan jika ada.
          </p>
        </div>
      </div>

      {hasIssues && (
        <div className="space-y-1.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
          <Textarea
            label="Rincian Kerusakan / Masalah Fasilitas (Wajib) *"
            name="damageNote"
            value={damageNote}
            onChange={(e) => setDamageNote(e.target.value)}
            rows={3}
            placeholder="Jelaskan titik kerusakan, barang yang rusak/hilang, dan perkiraan penyebabnya..."
            required={hasIssues}
          />
          <p className="text-[11px] text-red-800">
            Sistem akan otomatis menandai aset master sebagai butuh perbaikan di database pengelola.
          </p>
        </div>
      )}

      <Textarea
        label="Catatan Tambahan / Tindak Lanjut Petugas"
        name="followUpNote"
        rows={2}
        defaultValue="Penyewa telah menyerahkan kembali aset tepat waktu."
        placeholder="Catatan kebersihan, serah terima kunci kembali, atau rekomendasi perbaikan..."
      />

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant={hasIssues ? "danger" : "accent"}
          size="md"
          loading={isPending}
          disabled={isPending || (hasIssues && !damageNote.trim())}
        >
          {isPending ? "Mencatat Pengembalian..." : "Konfirmasi Pengembalian Aset"}
        </Button>
      </div>
    </form>
  );
}
