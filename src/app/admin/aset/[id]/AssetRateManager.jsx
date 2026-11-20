"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormFields";
import Badge from "@/components/ui/Badge";
import { addAssetRateAction } from "../actions";

export default function AssetRateManager({ assetId, rates = [] }) {
  const [state, formAction, isPending] = useActionState(addAssetRateAction, null);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Existing Rates Table */}
      <div>
        <h4 className="text-xs font-bold text-[#16222b] uppercase tracking-wider mb-3">
          Daftar Tarif Aset ({rates.length})
        </h4>

        {rates.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 border border-[#d9e1e7] rounded-xl text-xs text-[#5a6b78]">
            Belum ada tarif terdaftar untuk aset ini.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#d9e1e7] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f4f7f9] border-b border-[#d9e1e7] text-[#5a6b78]">
                <tr>
                  <th className="px-4 py-2.5 font-bold uppercase">Periode</th>
                  <th className="px-4 py-2.5 font-bold uppercase">Nominal Tarif</th>
                  <th className="px-4 py-2.5 font-bold uppercase">Mulai Berlaku</th>
                  <th className="px-4 py-2.5 font-bold uppercase">Berlaku Sampai</th>
                  <th className="px-4 py-2.5 font-bold uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9e1e7] bg-white">
                {rates.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-bold text-[#0a4a56] uppercase">
                      {r.ratePeriod}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-[#16222b]">
                      {formatRupiah(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-[#5a6b78]">
                      {r.effectiveFrom || "-"}
                    </td>
                    <td className="px-4 py-3 text-[#5a6b78]">
                      {r.effectiveUntil || "Seterusnya"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge
                        variant={r.isActive ? "tersedia" : "neutral"}
                        className="text-[10px]"
                      >
                        {r.isActive ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Update Rate Form */}
      <div className="p-4 bg-slate-50 border border-[#d9e1e7] rounded-xl space-y-4">
        <h4 className="text-xs font-bold text-[#0a4a56] uppercase tracking-wider">
          + Atur / Perbarui Tarif Periode
        </h4>

        {state?.error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
            ⚠️ {state.error}
          </div>
        )}

        {state?.success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
            ✓ {state.message}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="assetId" value={assetId} />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Select label="Periode Tarif *" name="ratePeriod" required>
              <option value="harian">Harian</option>
              <option value="bulanan">Bulanan</option>
              <option value="tahunan">Tahunan</option>
            </Select>

            <Input
              label="Nominal (Rupiah) *"
              name="amount"
              type="number"
              placeholder="Contoh: 15000000"
              required
            />

            <Input
              label="Mulai Berlaku *"
              name="effectiveFrom"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />

            <Input
              label="Berlaku Sampai (Opsional)"
              name="effectiveUntil"
              type="date"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="accent"
              size="sm"
              loading={isPending}
              disabled={isPending}
            >
              {isPending ? "Menyimpan Tarif..." : "Simpan Tarif Periode"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
