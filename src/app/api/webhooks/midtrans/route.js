import { NextResponse } from "next/server";
import { processMidtransNotification } from "@/lib/db/payments";

/**
 * Route Handler Webhook Midtrans HTTP POST
 * Menerima notifikasi status transaksi dari server Midtrans.
 * Wajib melalui verifikasi signature SHA512 dan idempotensi.
 */
export async function POST(request) {
  try {
    let payload;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format payload notifikasi tidak valid (bukan JSON yang sah)." },
        { status: 400 }
      );
    }

    if (!payload || typeof payload !== "object" || !payload.order_id) {
      return NextResponse.json(
        { error: "Payload webhook tidak valid atau parameter 'order_id' tidak ditemukan." },
        { status: 400 }
      );
    }

    const result = await processMidtransNotification(payload);

    return NextResponse.json({
      status: "ok",
      received: true,
      order_id: result.orderId,
      transaction_status: result.transactionStatus,
      already_processed: Boolean(result.alreadyProcessed),
      ignored: Boolean(result.ignored),
    });
  } catch (err) {
    console.error("Error Midtrans Webhook Handler:", err.message);

    const isAuthError =
      err.status === 401 ||
      err.message.includes("signature") ||
      err.message.includes("Server Key") ||
      err.message.includes("SERVER_KEY");

    const statusCode = isAuthError ? 401 : err.status || 500;

    return NextResponse.json(
      {
        error: err.message || "Gagal memproses notifikasi webhook Midtrans.",
      },
      { status: statusCode }
    );
  }
}
