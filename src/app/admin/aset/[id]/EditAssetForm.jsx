"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/FormFields";
import { updateAssetAction } from "../actions";

export default function EditAssetForm({ asset, categories = [] }) {
  const [state, formAction, isPending] = useActionState(updateAssetAction, null);

  const specString =
    typeof asset.specifications === "object"
      ? JSON.stringify(asset.specifications, null, 2)
      : String(asset.specifications || "{}");

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={asset.id} />

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#16222b] mb-1.5">
            Kode Aset (Permanen)
          </label>
          <input
            type="text"
            value={asset.code}
            disabled
            className="w-full px-3.5 py-2 text-sm font-mono font-bold text-[#5a6b78] bg-slate-100 border border-[#c7d2da] rounded-lg cursor-not-allowed"
          />
        </div>
        <div className="md:col-span-2">
          <Input
            label="Nama Aset *"
            name="name"
            defaultValue={asset.name}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Kategori Aset *"
          name="categoryId"
          defaultValue={asset.categoryId || ""}
          required
        >
          <option value="">-- Pilih Kategori --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Input
          label="Luas / Kapasitas"
          name="areaSize"
          type="number"
          defaultValue={asset.areaSize || ""}
        />

        <Input
          label="Satuan Luas"
          name="areaUnit"
          defaultValue={asset.areaUnit || "m²"}
        />
      </div>

      <Input
        label="Alamat / Lokasi Aset *"
        name="location"
        defaultValue={asset.location || ""}
        required
      />

      <Textarea
        label="Deskripsi Aset"
        name="description"
        defaultValue={asset.description || ""}
        rows={4}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#d9e1e7]">
        <Select
          label="Kondisi Fisik *"
          name="physicalCondition"
          defaultValue={asset.physicalCondition || "baik"}
        >
          <option value="baik">Baik (Layak Pakai Penuh)</option>
          <option value="perlu_pemeriksaan">Perlu Pemeriksaan / Minor</option>
          <option value="rusak">Rusak (Membutuhkan Perbaikan)</option>
        </Select>

        <Select
          label="Status Operasional *"
          name="operationalStatus"
          defaultValue={asset.operationalStatus || "siap"}
        >
          <option value="siap">Siap Pakai (Tersedia untuk Disewa)</option>
          <option value="perbaikan">Dalam Masa Pemeliharaan</option>
          <option value="tidak_tersedia">Tidak Tersedia untuk Umum</option>
        </Select>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-[#d9e1e7]">
        <Textarea
          label="Spesifikasi & Fasilitas (JSON)"
          name="specifications"
          defaultValue={specString}
          rows={3}
        />
      </div>

      <div className="flex justify-end pt-2 border-t border-[#d9e1e7]">
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isPending}
          disabled={isPending}
        >
          {isPending ? "Menyimpan Perubahan..." : "Simpan Perubahan Aset"}
        </Button>
      </div>
    </form>
  );
}
