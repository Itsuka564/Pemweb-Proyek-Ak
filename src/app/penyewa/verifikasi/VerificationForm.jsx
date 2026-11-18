"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormFields";
import { submitVerificationAction } from "./actions";

export default function VerificationForm() {
  const [state, formAction, isPending] = useActionState(submitVerificationAction, null);

  return (
    <form action={formAction} className="space-y-4 pt-2">
      {state?.error && (
        <div className="p-3 rounded-lg bg-[#fadcdc] border border-[#f5b8b8] text-xs font-semibold text-[#9c2222]">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="p-3 rounded-lg bg-[#dff3e8] border border-[#b8e4cd] text-xs font-semibold text-[#17633c]">
          {state.success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Jenis Dokumen Identitas" name="documentType" required>
          <option value="ktp">KTP (Kartu Tanda Penduduk — Perorangan)</option>
          <option value="npwp">NPWP (Nomor Pokok Wajib Pajak)</option>
          <option value="nib">NIB (Nomor Induk Berusaha — Badan Usaha)</option>
        </Select>

        <Input
          label="Nomor Dokumen (Opsional)"
          name="documentNumber"
          placeholder="Contoh: 3302xxxxxxxxxxxx"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-[#16222b] mb-1.5">
          Unggah File Dokumen (JPG, PNG, atau PDF maks 5MB)
        </label>
        <input
          type="file"
          name="file"
          accept=".jpg,.jpeg,.png,.pdf"
          required
          className="w-full text-xs text-[#5a6b78] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#d7edf0] file:text-[#0e6b7a] hover:file:bg-[#0e6b7a] hover:file:text-white file:cursor-pointer cursor-pointer border border-[#c7d2da] rounded-lg p-2 bg-white"
        />
        <p className="text-[11px] text-[#5a6b78] mt-1">
          * Dokumen akan disimpan pada penyimpanan terenkripsi private dan hanya diakses oleh Admin berwenang.
        </p>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="accent"
          loading={isPending}
          className="w-full sm:w-auto"
        >
          Kirim Berkas Verifikasi
        </Button>
      </div>
    </form>
  );
}

