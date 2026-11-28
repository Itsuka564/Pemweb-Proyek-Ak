import { createServiceClient } from "@/lib/supabase/server";

/**
 * Memasukkan pekerjaan pengiriman Web Push ke antrean persisten (notification_jobs)
 * dan mencatat riwayat notifikasi ke tabel notifications.
 *
 * Sesuai ketentuan Technical Requirements:
 * - Persisten di database (tabel notification_jobs)
 * - Memiliki dedupe_key untuk mencegah duplikasi pengiriman
 * - Kegagalan antrean tidak membatalkan transaksi bisnis (non-blocking)
 */
export async function enqueueNotification({
  userId,
  title,
  message,
  targetUrl = "/penyewa/dashboard",
  dedupeKey,
}) {
  if (!userId || !title || !message) {
    console.warn("enqueueNotification skipped: data tidak lengkap (userId, title, atau message kosong).");
    return { success: false, reason: "Incomplete data" };
  }

  // Jika dedupeKey tidak diberikan, generate berdasarkan event & waktu
  const finalDedupeKey = dedupeKey || `notif-${userId}-${Date.now()}`;

  try {
    const supabase = createServiceClient();
    const now = new Date().toISOString();

    // 1. Simpan ke tabel notifications (arsip/inbox pengguna)
    let notificationId = null;
    try {
      const { data: notifData } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title,
          message,
          target_url: targetUrl,
          is_read: false,
          created_at: now,
        })
        .select("id")
        .maybeSingle();

      if (notifData) {
        notificationId = notifData.id;
      }
    } catch (notifErr) {
      console.warn("Gagal menyimpan ke tabel notifications:", notifErr.message);
    }

    // 2. Simpan ke tabel antrean persisten (notification_jobs)
    const payload = {
      title,
      body: message,
      url: targetUrl,
      tag: finalDedupeKey,
      timestamp: Date.now(),
    };

    const { data: job, error: jobErr } = await supabase
      .from("notification_jobs")
      .insert({
        notification_id: notificationId,
        user_id: userId,
        payload,
        dedupe_key: finalDedupeKey,
        status: "queued",
        attempts: 0,
        max_attempts: 5,
        available_at: now,
        created_at: now,
        updated_at: now,
      })
      .select("id, dedupe_key, status")
      .maybeSingle();

    if (jobErr) {
      // Jika error 23505 (unique violation pada dedupe_key), berarti job sudah ada (pencegahan duplikasi)
      if (jobErr.code === "23505") {
        console.log(`[Queue] Deduplication triggered for dedupe_key: ${finalDedupeKey}. Job dilewati.`);
        return { success: true, duplicated: true };
      }
      console.error("[Queue] Gagal memasukkan job ke notification_jobs:", jobErr.message);
      return { success: false, error: jobErr.message };
    }

    console.log(`[Queue] Job notifikasi berhasil di-enqueue: ID ${job?.id} (Dedupe: ${finalDedupeKey})`);
    return { success: true, jobId: job?.id };
  } catch (err) {
    // Non-blocking error handler: Jangan gagalkan transaksi bisnis pemanggil
    console.error("[Queue] Exception saat enqueueNotification:", err.message);
    return { success: false, error: err.message };
  }
}
