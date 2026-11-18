"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitVerificationAction(prevState, formData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi telah berakhir. Silakan masuk kembali." };
  }

  const documentType = formData.get("documentType");
  const documentNumber = formData.get("documentNumber") || null;
  const file = formData.get("file");

  if (!documentType) {
    return { error: "Pilih jenis dokumen (KTP, NPWP, atau NIB)." };
  }

  if (!file || file.size === 0) {
    return { error: "Pilih file dokumen identitas yang ingin diunggah." };
  }

  // Validasi tipe file (MIME type)
  const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      error: "Format file tidak didukung. Unggah file dalam format JPG, PNG, atau PDF.",
    };
  }

  // Validasi ukuran maks 5MB
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Ukuran file dokumen maksimal 5MB." };
  }

  try {
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${user.id}/${Date.now()}_${documentType}.${fileExt}`;

    // Upload ke private bucket 'user-verifications'
    const { error: uploadError } = await supabase.storage
      .from("user-verifications")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error (user-verifications):", uploadError.message);
      return { error: `Gagal mengunggah berkas dokumen ke storage: ${uploadError.message}` };
    }

    const storagePath = fileName;

    // Simpan ke tabel user_verifications
    const { error: dbError } = await supabase
      .from("user_verifications")
      .upsert({
        user_id: user.id,
        document_type: documentType,
        document_number: documentNumber,
        file_path: storagePath,
        status: "menunggu",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      return { error: `Gagal menyimpan data verifikasi: ${dbError.message}` };
    }

    revalidatePath("/penyewa/verifikasi");
    return { success: "Berkas berhasil dikirim dan sedang menunggu peninjauan Admin." };
  } catch (err) {
    return { error: err.message || "Terjadi kesalahan saat memproses berkas." };
  }
}
