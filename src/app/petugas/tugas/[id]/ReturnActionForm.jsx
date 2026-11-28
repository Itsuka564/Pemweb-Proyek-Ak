"use client";

import { useActionState, useState } from "react";
import Button from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/FormFields";
import { recordReturnAction } from "../../actions";

function FormIcon({ name, className = "w-4 h-4 shrink-0" }) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "alert") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
    );
  }
  if (name === "check") {
    return (
      <svg {...props}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export default function ReturnActionForm({ transactionId }) {
  const [state, formAction, isPending] = useActionState(recordReturnAction, null);
  const [finalCondition, setFinalCondition] = useState("baik");
  const [damageNote, setDamageNote] = useState("");

  const hasIssues = finalCondition === "rusak" || finalCondition === "perlu_pemeriksaan";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="transactionId" value={transactionId} />

      {state?.error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-start gap-2.5">
          <FormIcon name="alert" className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-start gap-2.5">
          <FormIcon name="check" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{state.message}</span>
        </div>
      )}

      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-600 flex items-start gap-2.5">
        <FormIcon name="info" className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-800">Formulir Pemeriksaan Pengembalian Aset</p>
          <p className="mt-0.5 leading-relaxed">
            Periksa seluruh kondisi fasilitas, kebersihan, dan kelengkapan aset sebelum menyelesaikan transaksi sewa.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Kondisi Fisik Aset Saat Dikembalikan *"
          name="finalCondition"
          value={finalCondition}
          onChange={(e) => setFinalCondition(e.target.value)}
          required
        >
          <option value="baik">Baik (Lengkap, Bersih &amp; Tanpa Kerusakan)</option>
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
            className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-300 file:text-xs file:font-medium file:bg-white file:text-slate-700 hover:file:bg-slate-50 cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Foto bukti kondisi akhir atau titik kerusakan jika ada.
          </p>
        </div>
      </div>

      {hasIssues && (
        <div className="space-y-1.5 p-3.5 bg-rose-50/70 border border-rose-200 rounded-lg">
          <Textarea
            label="Rincian Kerusakan / Masalah Fasilitas (Wajib) *"
            name="damageNote"
            value={damageNote}
            onChange={(e) => setDamageNote(e.target.value)}
            rows={3}
            placeholder="Jelaskan titik kerusakan, barang yang rusak/hilang, dan perkiraan penyebabnya..."
            required={hasIssues}
          />
          <p className="text-[11px] text-rose-800">
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
