"use server";

import { createClient } from "@/lib/supabase/server";
import { createRentalSubmission, checkAssetsAvailability } from "@/lib/db/booking";
import { getAssetById } from "@/lib/db/assets";
import { redirect } from "next/navigation";
import { z } from "zod";

const submissionSchema = z.object({
  startDate: z.string().min(10, "Pilih tanggal mulai"),
  endDate: z.string().min(10, "Pilih tanggal selesai"),
  purpose: z.string().min(5, "Jelaskan keperluan atau tujuan penyewaan minimal 5 karakter"),
  renterNote: z.string().optional(),
});

export async function submitRentalAction(prevState, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi telah berakhir. Silakan masuk terlebih dahulu." };
  }

  // Cek apakah pengguna terverifikasi
  const { data: verification } = await supabase
    .from("user_verifications")
    .select("status")
    .eq("user_id", user.id)
    .eq("status", "disetujui")
    .maybeSingle();

  // Jika DB live terhubung dan belum verifikasi disetujui, tolak pengajuan
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id") && !verification) {
    return {
      error: "Akun Anda belum disetujui verifikasinya oleh Admin. Lengkapi berkas di halaman verifikasi.",
    };
  }

  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");
  const purpose = formData.get("purpose");
  const renterNote = formData.get("renterNote") || "";
  const rawAssetIds = formData.getAll("assetIds");

  const validation = submissionSchema.safeParse({ startDate, endDate, purpose, renterNote });
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message || "Input tidak valid." };
  }

  if (!rawAssetIds || rawAssetIds.length === 0) {
    return { error: "Pilih minimal satu aset yang ingin diajukan untuk disewa." };
  }

  try {
    // Ambil data tarif snapshot dari database backend untuk setiap aset
    const items = [];
    for (const assetId of rawAssetIds) {
      const asset = await getAssetById(assetId);
      if (!asset) {
        return { error: `Aset dengan ID ${assetId} tidak ditemukan.` };
      }
      items.push({
        assetId: asset.id,
        dailyRate: asset.dailyRate,
        rateId: asset.rates?.[0]?.id || null,
      });
    }

    // Eksekusi penyimpanan transaksi & verifikasi benturan di server
    const result = await createRentalSubmission({
      renterId: user.id,
      startDate,
      endDate,
      purpose,
      renterNote,
      items,
    });

    if (!result?.success) {
      return { error: "Gagal membuat pengajuan penyewaan." };
    }

    // Redirect ke halaman detail transaksi penyewa
    redirect(`/penyewa/transaksi/${result.transactionId}?status=submitted`);
  } catch (err) {
    // Tangani redirect Next.js yang melempar NEXT_REDIRECT
    if (err.message === "NEXT_REDIRECT" || err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    return { error: err.message || "Terjadi kesalahan saat memproses pengajuan." };
  }
}

