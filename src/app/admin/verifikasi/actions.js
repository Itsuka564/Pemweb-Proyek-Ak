"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { reviewUserVerification } from "@/lib/db/admin";

export async function reviewVerificationAction(prevState, formData) {
  const verificationId = formData.get("verificationId");
  const decision = formData.get("decision"); // 'disetujui' | 'ditolak' | 'perlu_dikirim_ulang'
  const rejectionReason = formData.get("rejectionReason") || "";

  if (!verificationId || !decision) {
    return { error: "Data permintaan verifikasi tidak lengkap." };
  }

  // Validasi sesi dan role admin server-side
  const supabase = await createClient();
  let adminId = null;

  const isLive =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id");

  if (isLive) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Sesi login Anda telah berakhir. Silakan masuk kembali." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { error: "Akses ditolak: Anda tidak memiliki wewenang Administrator." };
    }

    adminId = user.id;
  }

  try {
    await reviewUserVerification({
      verificationId,
      decision,
      rejectionReason,
      reviewerId: adminId,
    });

    revalidatePath("/admin/verifikasi");
    revalidatePath(`/admin/verifikasi/${verificationId}`);
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Status verifikasi berhasil diperbarui menjadi '${decision}'.`,
    };
  } catch (err) {
    return { error: err.message || "Gagal memperbarui status verifikasi." };
  }
}
