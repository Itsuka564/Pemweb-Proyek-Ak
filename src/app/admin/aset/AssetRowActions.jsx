"use client";

import { useTransition } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { toggleAssetActiveAction } from "./actions";

export default function AssetRowActions({ assetId, isActive }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    if (confirm(`Yakin ingin ${isActive ? "menonaktifkan" : "mengaktifkan"} aset ini?`)) {
      startTransition(async () => {
        await toggleAssetActiveAction(assetId, isActive);
      });
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link href={`/admin/aset/${assetId}`}>
        <Button variant="outline" size="sm" className="text-xs py-1 px-2.5">
          Edit / Detail
        </Button>
      </Link>

      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
          isActive
            ? "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
            : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
        }`}
      >
        {isPending ? "..." : isActive ? "Nonaktifkan" : "Aktifkan"}
      </button>
    </div>
  );
}
