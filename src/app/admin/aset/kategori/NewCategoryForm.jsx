"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormFields";
import { createCategoryAction } from "../actions";

export default function NewCategoryForm() {
  const [state, formAction, isPending] = useActionState(createCategoryAction, null);

  return (
    <form action={formAction} className="space-y-4">
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

      <Input
        label="Nama Kategori *"
        name="name"
        placeholder="Contoh: Gedung Olahraga / Kendaraan Operasional"
        required
      />

      <Textarea
        label="Deskripsi Kategori"
        name="description"
        rows={2}
        placeholder="Penjelasan ringkas peruntukan aset dalam kategori ini..."
      />

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          variant="accent"
          size="sm"
          loading={isPending}
          disabled={isPending}
        >
          {isPending ? "Menyimpan..." : "+ Tambah Kategori"}
        </Button>
      </div>
    </form>
  );
}
