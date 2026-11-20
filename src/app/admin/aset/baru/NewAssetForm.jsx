"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Button from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/FormFields";
import { createAssetAction } from "../actions";

export default function NewAssetForm({ categories = [] }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createAssetAction, null);

  useEffect(() => {
    if (state?.success && state?.assetId) {
      setTimeout(() => {
        router.push(`/admin/aset/${state.assetId}`);
      }, 1000);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
          ⚠️ {state.error}
        </div>
      )}

      {state?.success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
          ✓ {state.message} Mengalihkan ke halaman detail aset...
        </div>
      )}

      {/* Identitas Aset */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Kode Aset *"
          name="assetCode"
          placeholder="Contoh: AST-006 / TNH-001"
          required
        />
        <div className="md:col-span-2">
          <Input
            label="Nama Aset *"
            name="name"
            placeholder="Contoh: Gedung Sasana Krida Graha Utama"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select label="Kategori Aset *" name="categoryId" required>
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
          placeholder="Contoh: 1500"
        />

        <Input
          label="Satuan Luas"
          name="areaUnit"
          defaultValue="m²"
          placeholder="Contoh: m² / Ha / Kursi"
        />
      </div>

      <Input
        label="Alamat / Deskripsi Lokasi *"
        name="location"
        placeholder="Contoh: Jl. Ahmad Yani No. 12, Sektor Bisnis Barat"
        required
      />

      <Textarea
        label="Deskripsi Lengkap Aset"
        name="description"
        rows={4}
        placeholder="Jelaskan fasilitas, karakteristik fisik, dan peruntukan aset secara mendalam..."
      />

      {/* Kondisi & Status Operasional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#d9e1e7]">
        <Select label="Kondisi Fisik Aset *" name="physicalCondition" defaultValue="baik">
          <option value="baik">Baik (Layak Pakai Penuh)</option>
          <option value="perlu_pemeriksaan">Perlu Pemeriksaan / Minor</option>
          <option value="rusak">Rusak (Membutuhkan Perbaikan)</option>
        </Select>

        <Select label="Status Operasional Aset *" name="operationalStatus" defaultValue="siap">
          <option value="siap">Siap Pakai (Tersedia untuk Disewa)</option>
          <option value="perbaikan">Dalam Masa Pemeliharaan / Perbaikan</option>
          <option value="tidak_tersedia">Tidak Tersedia untuk Umum</option>
        </Select>
      </div>

      {/* Tarif Awal */}
      <div className="space-y-3 pt-2 border-t border-[#d9e1e7]">
        <h4 className="text-xs font-bold text-[#0a4a56] uppercase tracking-wider">
          Pengaturan Tarif Awal (Rupiah)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Tarif Harian (Wajib Diisi) *"
            name="dailyRate"
            type="number"
            placeholder="Contoh: 2500000"
            required
          />
          <Input
            label="Tarif Bulanan (Opsional)"
            name="monthlyRate"
            type="number"
            placeholder="Contoh: 50000000"
          />
          <Input
            label="Tarif Tahunan (Opsional)"
            name="yearlyRate"
            type="number"
            placeholder="Contoh: 500000000"
          />
        </div>
      </div>

      {/* Spesifikasi Format JSON */}
      <div className="space-y-1.5 pt-2 border-t border-[#d9e1e7]">
        <Textarea
          label="Spesifikasi Tambahan (JSON atau Teks Ringkas)"
          name="specifications"
          rows={3}
          placeholder='{"kapasitas": "500 orang", "listrik": "30.000 VA", "parkir": "100 mobil"}'
        />
        <p className="text-[11px] text-[#5a6b78]">
          Gunakan format JSON sederhana atau teks rincian fasilitas aset.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#d9e1e7]">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-xs font-bold text-[#5a6b78] hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
        >
          Batal
        </button>

        <Button
          type="submit"
          variant="accent"
          size="md"
          loading={isPending}
          disabled={isPending}
        >
          {isPending ? "Menyimpan Data Aset..." : "Simpan & Lanjutkan ke Foto Aset →"}
        </Button>
      </div>
    </form>
  );
}
