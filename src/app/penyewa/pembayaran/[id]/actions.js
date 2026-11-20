"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPaymentForTransaction } from "@/lib/db/payments";

/**
 * Memulai sesi pembayaran resmi melalui Midtrans Snap.
 * Mewajibkan login dan hanya pemilik transaksi atau admin yang berhak membuat sesi pembayaran.
 */
export async function initiatePaymentAction(transactionId) {
  if (!transactionId) {
    return { error: "ID Transaksi tidak valid." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Silakan masuk (login) terlebih dahulu untuk memproses pembayaran." };
  }

  try {
    const payment = await createPaymentForTransaction(transactionId, user.id, user.email);

    revalidatePath(`/penyewa/transaksi/${transactionId}`);
    revalidatePath(`/penyewa/pembayaran/${transactionId}`);

    return {
      success: true,
      orderId: payment.orderId,
      token: payment.token,
      redirectUrl: payment.redirectUrl,
      amount: payment.amount,
    };
  } catch (err) {
    return { error: err.message || "Gagal memulai sesi pembayaran Midtrans." };
  }
}
