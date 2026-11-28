"use client";

import { useActionState, useState } from "react";
import Button from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/FormFields";
import { recordHandoverAction } from "../../actions";

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

export default function HandoverActionForm({ transactionId }) {
  const [state, formAction, isPending] = useActionState(recordHandoverAction, null);
  const [initialCondition, setInitialCondition] = useState("baik");

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
          <p className="font-semibold text-slate-800">Formulir Berita Acara Serah Terima Aset</p>
          <p className="mt-0.5 leading-relaxed">
            Pastikan Anda telah melakukan inspeksi fisik awal bersama penyewa sebelum menyerahkan kunci dan akses fasilitas.
          </p>
        </div>
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
            className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-300 file:text-xs file:font-medium file:bg-white file:text-slate-700 hover:file:bg-slate-50 cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 mt-1">
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
