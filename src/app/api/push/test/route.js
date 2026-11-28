import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enqueueNotification } from "@/lib/push/queue";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sesi login tidak ditemukan. Masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    let title = "Uji Coba Web Push Notifikasi 🚀";
    let message = "Notifikasi ini diproses oleh Background Worker secara asynchronous.";
    let url = "/penyewa/dashboard";

    try {
      const body = await request.json();
      if (body.title) title = body.title;
      if (body.message) message = body.message;
      if (body.url) url = body.url;
    } catch {
      // payload kosong, gunakan default
    }

    const dedupeKey = `test-${user.id}-${Date.now()}`;
    const result = await enqueueNotification({
      userId: user.id,
      title,
      message,
      targetUrl: url,
      dedupeKey,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Gagal memasukkan pekerjaan ke antrean." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job berhasil dimasukkan ke antrean persisten (notification_jobs). Background worker akan segera memproses.",
      jobId: result.jobId,
      dedupeKey,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Gagal memproses uji coba notifikasi." },
      { status: 500 }
    );
  }
}
