"use client";

import { useActionState, useState } from "react";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/FormFields";
import { reviewVerificationAction } from "../actions";

export default function ReviewActionForm({ verificationId, currentStatus }) {
  const [state, formAction, isPending] = useActionState(reviewVerificationAction, null);
  const [decision, setDecision] = useState("disetujui");
  const [reason, setReason] = useState("");

  const isRejectOrResubmit = decision === "ditolak" || decision === "perlu_dikirim_ulang";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="verificationId" value={verificationId} />
      <input type="hidden" name="decision" value={decision} />

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

      <div className="space-y-2">
        <label className="block text-xs font-bold text-[#16222b]">
          Keputusan Peninjauan:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setDecision("disetujui")}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
              decision === "disetujui"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-white text-slate-700 border-[#d9e1e7] hover:bg-slate-50"
            }`}
          >
            ✓ Setujui Dokumen
          </button>

          <button
            type="button"
            onClick={() => setDecision("ditolak")}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
              decision === "ditolak"
                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                : "bg-white text-slate-700 border-[#d9e1e7] hover:bg-slate-50"
            }`}
          >
            ✕ Tolak Pengajuan
          </button>

          <button
            type="button"
            onClick={() => setDecision("perlu_dikirim_ulang")}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
              decision === "perlu_dikirim_ulang"
                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                : "bg-white text-slate-700 border-[#d9e1e7] hover:bg-slate-50"
            }`}
          >
            ↺ Minta Kirim Ulang
          </button>
        </div>
      </div>

      {isRejectOrResubmit && (
        <div className="space-y-1.5 pt-1">
          <Textarea
            label="Alasan Penolakan / Catatan Perbaikan Dokumen (Wajib)"
            name="rejectionReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Contoh: Foto KTP terpotong pada bagian NIK atau gambar buram. Mohon unggah ulang dengan pencahayaan terang."
            required
          />
          <p className="text-[11px] text-[#5a6b78]">
            Catatan ini akan dikirimkan kepada penyewa agar dapat memperbaiki berkas.
          </p>
        </div>
      )}

      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          variant={decision === "disetujui" ? "primary" : decision === "ditolak" ? "danger" : "accent"}
          size="md"
          loading={isPending}
          disabled={isPending || (isRejectOrResubmit && reason.trim().length < 5)}
        >
          {isPending
            ? "Menyimpan Keputusan..."
            : decision === "disetujui"
            ? "Konfirmasi Persetujuan Berkas"
            : decision === "ditolak"
            ? "Konfirmasi Penolakan Berkas"
            : "Kirim Permintaan Revisi"}
        </Button>
      </div>
    </form>
  );
}
