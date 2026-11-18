"use client";

import { useActionState, useTransition } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/FormFields";
import { uploadAssetPhotoAction, deleteAssetPhotoAction, setPrimaryPhotoAction } from "../actions";

export default function AssetPhotoManager({ assetId, photos = [] }) {
  const [uploadState, formAction, isUploading] = useActionState(uploadAssetPhotoAction, null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (photoId, storagePath) => {
    if (confirm("Hapus foto ini dari galeri aset?")) {
      startTransition(async () => {
        await deleteAssetPhotoAction(assetId, photoId, storagePath);
      });
    }
  };

  const handleSetPrimary = (photoId) => {
    startTransition(async () => {
      await setPrimaryPhotoAction(assetId, photoId);
    });
  };

  return (
    <div className="space-y-6">
      {/* Existing Photos Grid */}
      <div>
        <h4 className="text-xs font-bold text-[#16222b] uppercase tracking-wider mb-3">
          Galeri Foto Aset ({photos.length})
        </h4>

        {photos.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-[#d9e1e7] rounded-xl text-xs text-[#5a6b78]">
            Belum ada foto aset yang diunggah. Unggah foto utama di bawah ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((p) => (
              <div
                key={p.id}
                className="relative bg-white border border-[#d9e1e7] rounded-xl overflow-hidden shadow-xs group"
              >
                <div className="aspect-video bg-slate-100 overflow-hidden relative">
                  <img
                    src={p.url || p.storagePath}
                    alt={p.altText || "Foto aset"}
                    className="w-full h-full object-cover"
                  />
                  {p.isPrimary && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#f2a33a] text-[#16222b] shadow-xs">
                      ★ Foto Utama
                    </span>
                  )}
                </div>

                <div className="p-2.5 flex items-center justify-between gap-2 bg-white">
                  <span className="text-[11px] text-[#5a6b78] truncate">
                    {p.altText || "Foto Aset"}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    {!p.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(p.id)}
                        disabled={isPending}
                        className="px-2 py-1 text-[10px] font-bold text-[#0e6b7a] hover:bg-[#0e6b7a]/10 rounded border border-[#0e6b7a]/20 cursor-pointer"
                        title="Jadikan Foto Utama"
                      >
                        Set Utama
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id, p.storagePath)}
                      disabled={isPending}
                      className="px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded border border-red-200 cursor-pointer"
                      title="Hapus Foto"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Form */}
      <div className="p-4 bg-slate-50 border border-[#d9e1e7] rounded-xl space-y-4">
        <h4 className="text-xs font-bold text-[#0a4a56] uppercase tracking-wider">
          + Unggah Foto Baru ke Supabase Storage
        </h4>

        {uploadState?.error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
            ⚠️ {uploadState.error}
          </div>
        )}

        {uploadState?.success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
            ✓ {uploadState.message}
          </div>
        )}

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="assetId" value={assetId} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#16222b] mb-1">
                Pilih File Gambar (JPG / PNG / WebP) *
              </label>
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                required
                className="w-full text-xs text-[#5a6b78] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0e6b7a] file:text-white hover:file:bg-[#0a4a56] cursor-pointer"
              />
            </div>

            <Input
              label="Keterangan / Alt Teks"
              name="altText"
              placeholder="Contoh: Tampak samping atau interior ballroom"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimary"
              name="isPrimary"
              value="true"
              className="rounded text-[#0e6b7a] focus:ring-[#0e6b7a]"
            />
            <label htmlFor="isPrimary" className="text-xs font-semibold text-[#16222b]">
              Jadikan sebagai foto utama (thumbnail katalog)
            </label>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="accent"
              size="sm"
              loading={isUploading}
              disabled={isUploading}
            >
              {isUploading ? "Mengunggah..." : "Unggah Foto Aset"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
