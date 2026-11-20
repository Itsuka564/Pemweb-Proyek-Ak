"use client";

import { useActionState, useState } from "react";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormFields";
import { approveApplicationAction, rejectApplicationAction } from "../actions";

export default function ApplicationActionForm({ transactionId, currentStatus }) {
  const [activeTab, setActiveTab] = useState("approve"); // 'approve' | 'reject'
  const [reason, setReason] = useState("");

  const [approveState, approveAction, isApproving] = useActionState(approveApplicationAction, null);
  const [rejectState, rejectAction, isRejecting] = useActionState(rejectApplicationAction, null);

  const isPending = isApproving || isRejecting;

  return (
    <div className="space-y-4">
      {/* Switch Tab Buttons */}
      <div className="flex items-center gap-2 border-b border-[#d9e1e7] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("approve")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "approve"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-[#d9e1e7] hover:bg-slate-50"
          }`}
        >
          ✓ Setujui Pengajuan Sewa
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reject")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "reject"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-[#d9e1e7] hover:bg-slate-50"
          }`}
        >
          ✕ Tolak Pengajuan Sewa
        </button>
      </div>

      {/* Approve Form */}
      {activeTab === "approve" && (
        <form action={approveAction} className="space-y-4">
          <input type="hidden" name="transactionId" value={transactionId} />

          {approveState?.error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
              ⚠️ {approveState.error}
            </div>
          )}

          {approveState?.success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
              ✓ {approveState.message}
            </div>
          )}

          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs text-emerald-950 space-y-1">
            <p className="font-bold">Informasi Persetujuan:</p>
            <p>
              Dengan menyetujui, sistem akan membuat <strong>Blokir Kalender Aktif (asset_booking_blocks)</strong> untuk setiap item aset beserta buffer persiapan, serta memperbarui status transaksi menjadi <em>Menunggu Pembayaran</em>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Batas Waktu Pembayaran (Jam) *"
              name="paymentDueHours"
              type="number"
              defaultValue={24}
              min={1}
              helperText="Tenggat waktu penyewa untuk menyelesaikan pembayaran sewa."
              required
            />

            <Input
              label="Catatan Persetujuan (Opsional)"
              name="note"
              defaultValue="Pengajuan sewa telah disetujui. Silakan selesaikan pembayaran."
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isPending}
              disabled={isPending}
            >
              {isApproving ? "Menyetujui & Memblokir Kalender..." : "Konfirmasi Persetujuan Sewa"}
            </Button>
          </div>
        </form>
      )}

      {/* Reject Form */}
      {activeTab === "reject" && (
        <form action={rejectAction} className="space-y-4">
          <input type="hidden" name="transactionId" value={transactionId} />

          {rejectState?.error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
              ⚠️ {rejectState.error}
            </div>
          )}

          {rejectState?.success && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold">
              ✓ {rejectState.message}
            </div>
          )}

          <div className="space-y-1.5">
            <Textarea
              label="Alasan Penolakan Pengajuan (Wajib Diisi) *"
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Contoh: Aset sedang dijadwalkan untuk pemeliharaan fasilitas mendadak pada periode tersebut."
              required
            />
            <p className="text-[11px] text-[#5a6b78]">
              Alasan penolakan akan dicatat pada riwayat transaksi dan dapat dilihat oleh penyewa.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="danger"
              size="md"
              loading={isPending}
              disabled={isPending || reason.trim().length < 5}
            >
              {isRejecting ? "Menolak Pengajuan..." : "Konfirmasi Penolakan Pengajuan"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
