"use client";

import { useActionState, useState } from "react";
import Button from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/FormFields";
import { recordHandoverAction } from "../../actions";

export default function HandoverActionForm({ transactionId }) {
  const [state, formAction, isPending] = useActionState(recordHandoverAction, null);
  const [initialCondition, setInitialCondition] = useState("baik");

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

      <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs text-emerald-950">
        <p className="font-bold">Formulir Berita Acara Serah Terima Aset:</p>
        <p className="mt-0.5">
          Pastikan Anda telah melakukan inspeksi fisik awal bersama penyewa sebelum menyerahkan kunci dan akses fasilitas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Kondisi Fisik Aset Saat Serah Terima *"
          name="initialCondition"
          value={initialCondition}
          onChange={(e) => setInitialCondition(e.target.value)}
          required
        >
          <option value="baik">Baik (Layak Pakai Penuh / Tanpa Cacat)</option>
          <option value="perlu_pemeriksaan">Perlu Pemeriksaan (Ada Catatan Ringan)</option>
          <option value="rusak">Rusak / Tidak Standar</option>
        </Select>

        <div>
          <label className="block text-xs font-bold text-[#16222b] mb-1.5">
            Unggah Foto Bukti Serah Terima (Opsional)
          </label>
          <input
            type="file"
            name="evidence"
            accept="image/jpeg,image/png,image/webp"
            className="w-full text-xs text-[#5a6b78] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0e6b7a] file:text-white hover:file:bg-[#0a4a56] cursor-pointer"
          />
          <p className="text-[10px] text-[#5a6b78] mt-1">
            Foto dokumentasi penyerahan kunci atau kondisi aset di lokasi.
          </p>
        </div>
      </div>

      <Textarea
        label="Catatan Serah Terima / Kondisi Awal Fasilitas *"
        name="handoverNote"
        rows={3}
        defaultValue="Kunci dan seluruh fasilitas aset diserahkan kepada penyewa dalam kondisi baik dan lengkap."
        placeholder="Tuliskan catatan kelengkapan fasilitas, meteran listrik awal, nomor kunci, dll..."
        required
      />

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isPending}
          disabled={isPending}
        >
          {isPending ? "Mencatat Berita Acara..." : "Konfirmasi & Catat Serah Terima Aset"}
        </Button>
      </div>
    </form>
  );
}
