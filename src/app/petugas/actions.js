"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recordHandover, recordReturn } from "@/lib/db/officer";

async function verifyOfficerRole() {
  const isLive =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id");

  if (!isLive) return "mock-officer-id";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sesi login Anda telah berakhir. Silakan masuk kembali.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "petugas" && profile?.role !== "admin") {
    throw new Error("Akses ditolak: Anda tidak memiliki wewenang Petugas Lapangan.");
  }

  return user.id;
}

export async function recordHandoverAction(prevState, formData) {
  try {
    const officerId = await verifyOfficerRole();

    const transactionId = formData.get("transactionId");
    const initialCondition = formData.get("initialCondition") || "baik";
    const handoverNote = formData.get("handoverNote") || "";
    const evidenceFile = formData.get("evidence");

    if (!transactionId) {
      return { error: "ID Transaksi tidak ditemukan." };
    }

    let evidencePath = null;
    if (evidenceFile && evidenceFile.size > 0) {
      try {
        const supabase = await createClient();
        const fileExt = evidenceFile.name.split(".").pop() || "jpg";
        const storageKey = `handovers/${transactionId}_${Date.now()}.${fileExt}`;

        // Upload bukti serah terima ke bucket storage resmi 'asset-photos'
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("asset-photos")
          .upload(storageKey, evidenceFile, {
            contentType: evidenceFile.type || "image/jpeg",
            upsert: true,
          });

        if (!uploadError && uploadData) {
          evidencePath = storageKey;
        } else {
          console.warn("Storage upload note (handover):", uploadError?.message);
        }
      } catch (e) {
        console.warn("Upload evidence error:", e.message);
      }
    }

    await recordHandover({
      transactionId,
      officerId,
      initialCondition,
      handoverNote,
      evidencePath,
    });

    revalidatePath("/petugas/dashboard");
    revalidatePath("/petugas/tugas");
    revalidatePath(`/petugas/tugas/${transactionId}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/pengajuan");
    revalidatePath(`/penyewa/transaksi/${transactionId}`);

    return {
      success: true,
      message: "Berita acara serah terima aset berhasil dicatat. Status transaksi kini 'Sedang Disewa'.",
    };
  } catch (err) {
    return { error: err.message || "Gagal memproses serah terima aset." };
  }
}

export async function recordReturnAction(prevState, formData) {
  try {
    const officerId = await verifyOfficerRole();

    const transactionId = formData.get("transactionId");
    const finalCondition = formData.get("finalCondition") || "baik";
    const damageNote = formData.get("damageNote") || "";
    const followUpNote = formData.get("followUpNote") || "";
    const evidenceFile = formData.get("evidence");

    if (!transactionId) {
      return { error: "ID Transaksi tidak ditemukan." };
    }

    if ((finalCondition === "rusak" || finalCondition === "perlu_pemeriksaan") && !damageNote.trim()) {
      return { error: "Catatan kerusakan wajib diisi jika kondisi aset akhir dinyatakan rusak atau perlu pemeriksaan." };
    }

    let evidencePath = null;
    if (evidenceFile && evidenceFile.size > 0) {
      try {
        const supabase = await createClient();
        const fileExt = evidenceFile.name.split(".").pop() || "jpg";
        const storageKey = `returns/${transactionId}_${Date.now()}.${fileExt}`;

        // Upload bukti pengembalian ke bucket storage resmi 'asset-photos'
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("asset-photos")
          .upload(storageKey, evidenceFile, {
            contentType: evidenceFile.type || "image/jpeg",
            upsert: true,
          });

        if (!uploadError && uploadData) {
          evidencePath = storageKey;
        } else {
          console.warn("Storage upload note (return):", uploadError?.message);
        }
      } catch (e) {
        console.warn("Upload evidence error:", e.message);
      }
    }

    await recordReturn({
      transactionId,
      officerId,
      finalCondition,
      damageNote,
      followUpNote,
      evidencePath,
    });

    revalidatePath("/petugas/dashboard");
    revalidatePath("/petugas/tugas");
    revalidatePath(`/petugas/tugas/${transactionId}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/pengajuan");
    revalidatePath("/admin/kalender");
    revalidatePath(`/penyewa/transaksi/${transactionId}`);

    return {
      success: true,
      message: "Berita acara pengembalian aset berhasil dicatat. Status transaksi kini 'Dikembalikan'.",
    };
  } catch (err) {
    return { error: err.message || "Gagal memproses pengembalian aset." };
  }
}
