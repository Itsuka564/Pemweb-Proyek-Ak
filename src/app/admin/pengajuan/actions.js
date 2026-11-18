"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { approveRentalApplication, rejectRentalApplication } from "@/lib/db/admin";

async function verifyAdminRole() {
  const isLive =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id");

  if (!isLive) return "mock-admin-id";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sesi login Anda telah berakhir.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Hanya Administrator yang memiliki wewenang memproses pengajuan sewa.");
  }

  return user.id;
}

export async function approveApplicationAction(prevState, formData) {
  try {
    const adminId = await verifyAdminRole();

    const transactionId = formData.get("transactionId");
    const paymentDueHours = formData.get("paymentDueHours") || 24;
    const note = formData.get("note") || "Pengajuan sewa telah disetujui. Silakan selesaikan pembayaran.";

    await approveRentalApplication({
      transactionId,
      adminId,
      paymentDueHours,
      note,
    });

    revalidatePath("/admin/pengajuan");
    revalidatePath(`/admin/pengajuan/${transactionId}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/kalender");
    revalidatePath(`/penyewa/transaksi/${transactionId}`);

    return {
      success: true,
      message: "Pengajuan sewa berhasil disetujui. Blokir jadwal kalender telah aktif dan waktu pembayaran telah dikirimkan ke penyewa.",
    };
  } catch (err) {
    return { error: err.message || "Gagal menyetujui pengajuan sewa." };
  }
}

export async function rejectApplicationAction(prevState, formData) {
  try {
    const adminId = await verifyAdminRole();

    const transactionId = formData.get("transactionId");
    const reason = formData.get("reason");

    await rejectRentalApplication({
      transactionId,
      adminId,
      reason,
    });

    revalidatePath("/admin/pengajuan");
    revalidatePath(`/admin/pengajuan/${transactionId}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/kalender");
    revalidatePath(`/penyewa/transaksi/${transactionId}`);

    return {
      success: true,
      message: "Pengajuan sewa telah ditolak dan alasan penolakan dicatat.",
    };
  } catch (err) {
    return { error: err.message || "Gagal menolak pengajuan sewa." };
  }
}
