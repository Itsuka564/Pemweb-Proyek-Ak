import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSnapTransaction, verifyWebhookSignature, getMidtransConfig } from "@/lib/midtrans/client";

function isLiveSupabase() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id")
  );
}

async function getSupabaseForPayment() {
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && isLiveSupabase()) {
      return createAdminClient();
    }
  } catch {
    // fallback
  }
  return await createClient();
}

/**
 * Membuat transaksi pembayaran Midtrans untuk transaksi sewa yang berstatus 'menunggu_pembayaran'.
 * Mewajibkan autentikasi dan memvalidasi wewenang (pemilik transaksi atau admin).
 */
export async function createPaymentForTransaction(transactionId, userId, userEmail = null) {
  if (!transactionId) {
    throw new Error("ID Transaksi wajib disertakan.");
  }

  if (!userId) {
    throw new Error("Pengguna belum terautentikasi. Silakan masuk terlebih dahulu.");
  }

  const supabase = await getSupabaseForPayment();

  // 1. Ambil detail transaksi
  const { data: tx, error: txError } = await supabase
    .from("rental_transactions")
    .select(`
      id,
      transaction_code,
      renter_id,
      status,
      total_cost,
      payment_due_at,
      renter:profiles!rental_transactions_renter_id_fkey(id, full_name, phone, address),
      items:rental_transaction_items(
        id,
        line_total,
        quantity,
        asset:assets(id, name)
      )
    `)
    .eq("id", transactionId)
    .single();

  if (txError || !tx) {
    throw new Error("Transaksi sewa tidak ditemukan.");
  }

  // Otorisasi: Pastikan hanya pemohon sewa atau admin yang dapat membuat sesi pembayaran
  if (tx.renter_id !== userId) {
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (userProfile?.role !== "admin") {
      throw new Error("Akses ditolak: Anda tidak memiliki wewenang membayar transaksi ini.");
    }
  }

  if (tx.status !== "disetujui" && tx.status !== "menunggu_pembayaran") {
    throw new Error(`Transaksi tidak dapat dibayar karena berstatus '${tx.status}'.`);
  }

  const grossAmount = Math.round(Number(tx.total_cost));
  if (grossAmount <= 0) {
    throw new Error("Total tagihan transaksi harus lebih besar dari 0.");
  }

  // 2. Cek apakah sudah ada pembayaran aktif yang belum kedaluwarsa
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id, midtrans_order_id, midtrans_token, payment_url, status, expired_at")
    .eq("rental_id", transactionId)
    .eq("status", "menunggu")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPayment && existingPayment.payment_url) {
    const isExpired = existingPayment.expired_at && new Date(existingPayment.expired_at) < new Date();
    if (!isExpired) {
      return {
        success: true,
        paymentId: existingPayment.id,
        orderId: existingPayment.midtrans_order_id,
        token: existingPayment.midtrans_token,
        redirectUrl: existingPayment.payment_url,
        amount: grossAmount,
      };
    }
  }

  // 3. Buat order_id baru yang unik
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const orderId = `PAY-${tx.transaction_code}-${randomSuffix}`;

  // Siapkan item details untuk Midtrans dan pastikan jumlahnya persis sama dengan gross_amount
  let itemDetails = (tx.items || []).map((i) => ({
    id: String(i.id || "item"),
    name: String(i.asset?.name || "Sewa Aset").substring(0, 50),
    price: Math.round(Number(i.line_total || 0)),
    quantity: 1,
  }));

  const itemsSum = itemDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Jika item rincian kosong atau jumlahnya tidak sama persis dengan total_cost,
  // gunakan 1 entri konsolidasi resmi agar Midtrans menerima payload tanpa penolakan kalkulasi
  if (itemDetails.length === 0 || itemsSum !== grossAmount) {
    itemDetails = [
      {
        id: String(tx.id || "item-total"),
        name: `Sewa Aset (${tx.transaction_code})`.substring(0, 50),
        price: grossAmount,
        quantity: 1,
      },
    ];
  }

  // 4. Panggil Snap API Midtrans
  const snapResult = await createSnapTransaction({
    orderId,
    grossAmount,
    customerDetails: {
      fullName: tx.renter?.full_name,
      phone: tx.renter?.phone,
      email: userEmail || undefined,
    },
    itemDetails,
  });

  const now = new Date().toISOString();
  const expiredAt = tx.payment_due_at || new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  // 5. Simpan catatan ke tabel payments secara ketat
  const { data: paymentRecord, error: paymentError } = await supabase
    .from("payments")
    .insert({
      rental_id: tx.id,
      payer_id: tx.renter_id,
      amount: grossAmount,
      payment_provider: "midtrans",
      midtrans_order_id: orderId,
      midtrans_token: snapResult.token,
      payment_url: snapResult.redirect_url,
      status: "menunggu",
      expired_at: expiredAt,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (paymentError) {
    console.error("Gagal menyimpan ke tabel payments:", paymentError.message);
    throw new Error(`Gagal mencatat transaksi pembayaran ke database: ${paymentError.message}`);
  }

  return {
    success: true,
    paymentId: paymentRecord.id,
    orderId,
    token: snapResult.token,
    redirectUrl: snapResult.redirect_url,
    amount: grossAmount,
  };
}

/**
 * Memproses notifikasi webhook resmi dari Midtrans:
 * - Wajib verifikasi SHA512 signature key
 * - Tolak jika server key belum dikonfigurasi atau signature tidak valid
 * - Idempotensi via tabel payment_webhook_events
 * - Pencegahan perubahan status mundur (e.g. dari 'dibayar' kembali ke 'menunggu')
 * - Otomatis terbitkan rental_contracts HANYA jika pembayaran terverifikasi lunas
 * - Melepaskan blokir kalender jika kedaluwarsa/batal
 */
export async function processMidtransNotification(payload) {
  if (!payload || typeof payload !== "object") {
    const error = new Error("Payload webhook Midtrans tidak valid.");
    error.status = 400;
    throw error;
  }

  const {
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signatureKey,
    transaction_status: transactionStatus,
    fraud_status: fraudStatus,
    payment_type: paymentType,
    transaction_id: transactionId,
  } = payload;

  if (!orderId || !statusCode) {
    const error = new Error("order_id dan status_code wajib ada dalam notifikasi webhook.");
    error.status = 400;
    throw error;
  }

  // 1. Verifikasi konfigurasi Server Key & Signature SHA512
  const config = getMidtransConfig();
  if (!config.isConfigured || !config.serverKey) {
    const error = new Error(
      "MIDTRANS_SERVER_KEY belum dikonfigurasi di server. Notifikasi webhook ditolak demi keamanan."
    );
    error.status = 401;
    throw error;
  }

  if (!signatureKey) {
    const error = new Error(
      "signature_key tidak ditemukan dalam payload webhook Midtrans. Webhook ditolak."
    );
    error.status = 401;
    throw error;
  }

  const isSignatureValid = verifyWebhookSignature({
    orderId,
    statusCode,
    grossAmount,
    signatureKey,
    serverKey: config.serverKey,
  });

  if (!isSignatureValid) {
    const error = new Error(
      "Verifikasi signature SHA512 Midtrans gagal. Payload mencurigakan ditolak."
    );
    error.status = 401;
    throw error;
  }

  const supabase = await getSupabaseForPayment();
  const now = new Date().toISOString();
  const eventKey = `${orderId}-${transactionStatus}-${statusCode}`;

  // 2. Pemeriksaan Idempotensi melalui tabel payment_webhook_events
  const { data: existingEvent } = await supabase
    .from("payment_webhook_events")
    .select("id, processed_at")
    .eq("event_key", eventKey)
    .maybeSingle();

  if (existingEvent) {
    return {
      success: true,
      alreadyProcessed: true,
      message: "Event webhook ini telah diproses sebelumnya (idempotent).",
      orderId,
      transactionStatus,
    };
  }

  // 3. Cari pembayaran berdasarkan midtrans_order_id
  const { data: payment, error: paymentLookupError } = await supabase
    .from("payments")
    .select(`
      id,
      rental_id,
      status,
      amount,
      rental:rental_transactions(id, transaction_code, status, items:rental_transaction_items(id))
    `)
    .eq("midtrans_order_id", orderId)
    .maybeSingle();

  if (paymentLookupError || !payment) {
    const error = new Error(`Data pembayaran dengan order_id '${orderId}' tidak ditemukan di sistem.`);
    error.status = 404;
    throw error;
  }

  // 4. Tentukan status baru berdasarkan status transaksi Midtrans
  let newPaymentStatus = "menunggu";
  let newRentalStatus = null;
  let paidAt = null;

  const isSettled =
    transactionStatus === "settlement" ||
    (transactionStatus === "capture" && fraudStatus === "accept");

  if (isSettled) {
    newPaymentStatus = "dibayar";
    newRentalStatus = "dibayar";
    paidAt = payload.settlement_time || now;
  } else if (transactionStatus === "expire") {
    newPaymentStatus = "kedaluwarsa";
    newRentalStatus = "kedaluwarsa";
  } else if (transactionStatus === "cancel" || transactionStatus === "deny") {
    newPaymentStatus = "batal";
    newRentalStatus = "dibatalkan";
  } else if (transactionStatus === "pending") {
    newPaymentStatus = "menunggu";
  }

  const currentPaymentStatus = payment.status;
  const currentRentalStatus = payment.rental?.status;

  // 5. PENCEGAHAN PERUBAHAN STATUS MUNDUR / TIDAK VALID
  // 5a. Jika pembayaran sudah lunas ('dibayar'), jangan biarkan turun kembali ke 'menunggu', 'kedaluwarsa', atau 'batal'
  if (currentPaymentStatus === "dibayar" && newPaymentStatus !== "dibayar") {
    await supabase.from("payment_webhook_events").insert({
      payment_id: payment.id,
      event_key: eventKey,
      order_id: orderId,
      transaction_status: transactionStatus,
      payload,
      processed_at: now,
      created_at: now,
      processing_error: `Perubahan status diabaikan: status pembayaran sudah 'dibayar', tidak boleh mundur ke '${newPaymentStatus}'.`,
    });

    return {
      success: true,
      ignored: true,
      message: `Status pembayaran saat ini sudah 'dibayar'. Notifikasi mundur '${transactionStatus}' diabaikan.`,
      orderId,
      transactionStatus,
    };
  }

  // 5b. Jika transaksi sewa sudah pada tahap 'dibayar', 'sedang_disewa', atau 'selesai', cegah kemunduran ke kedaluwarsa/batal
  const FORWARD_RENTAL_STATUSES = ["dibayar", "sedang_disewa", "selesai"];
  if (
    FORWARD_RENTAL_STATUSES.includes(currentRentalStatus) &&
    (newRentalStatus === "kedaluwarsa" || newRentalStatus === "dibatalkan" || newRentalStatus === "menunggu_pembayaran")
  ) {
    await supabase.from("payment_webhook_events").insert({
      payment_id: payment.id,
      event_key: eventKey,
      order_id: orderId,
      transaction_status: transactionStatus,
      payload,
      processed_at: now,
      created_at: now,
      processing_error: `Perubahan status diabaikan: transaksi sewa sudah '${currentRentalStatus}', tidak boleh mundur ke '${newRentalStatus}'.`,
    });

    return {
      success: true,
      ignored: true,
      message: `Transaksi sewa telah berstatus '${currentRentalStatus}'. Notifikasi mundur '${transactionStatus}' diabaikan.`,
      orderId,
      transactionStatus,
    };
  }

  // 6. Eksekusi pembaruan basis data
  // 6a. Catat event webhook untuk audit & idempotensi
  await supabase.from("payment_webhook_events").insert({
    payment_id: payment.id,
    event_key: eventKey,
    order_id: orderId,
    transaction_status: transactionStatus,
    payload,
    processed_at: now,
    created_at: now,
  });

  // 6b. Update baris payments
  const paymentUpdatePayload = {
    gateway_transaction_status: transactionStatus,
    gateway_fraud_status: fraudStatus || null,
    payment_type: paymentType || null,
    midtrans_transaction_id: transactionId || null,
    status: newPaymentStatus,
    gateway_response: payload,
    updated_at: now,
  };
  if (paidAt) {
    paymentUpdatePayload.paid_at = paidAt;
  }

  await supabase
    .from("payments")
    .update(paymentUpdatePayload)
    .eq("id", payment.id);

  // 6c. Update status rental_transactions jika berubah
  if (newRentalStatus && newRentalStatus !== currentRentalStatus) {
    await supabase
      .from("rental_transactions")
      .update({
        status: newRentalStatus,
        updated_at: now,
      })
      .eq("id", payment.rental_id);

    // Catat jejak audit status di rental_status_history
    await supabase.from("rental_status_history").insert({
      rental_id: payment.rental_id,
      old_status: currentRentalStatus,
      new_status: newRentalStatus,
      changed_by: null, // otomatis via webhook sistem
      change_note: `Pembaruan otomatis webhook Midtrans: ${transactionStatus}. Metode: ${paymentType || "-"}.`,
      changed_at: now,
    });

    // 6d. HANYA terbitkan kontrak perjanjian sewa jika pembayaran terverifikasi LUNAS (settlement/capture accept)
    if (isSettled && newRentalStatus === "dibayar") {
      await generateContractForTransaction(payment.rental_id);
    }

    // 6e. Jika transaksi kedaluwarsa atau dibatalkan, lepaskan blokir kalender aktif
    if (newRentalStatus === "kedaluwarsa" || newRentalStatus === "dibatalkan") {
      const itemIds = (payment.rental?.items || []).map((i) => i.id);
      if (itemIds.length > 0) {
        await supabase
          .from("asset_booking_blocks")
          .update({ status: "released", released_at: now })
          .in("rental_item_id", itemIds)
          .eq("status", "active");
      }
    }
  }

  return {
    success: true,
    orderId,
    transactionStatus,
    newPaymentStatus,
    newRentalStatus,
  };
}

/**
 * Menghasilkan kontrak perjanjian sewa (PKS) sederhana di tabel rental_contracts.
 * Kontrak HANYA dapat diterbitkan jika transaksi sewa telah berstatus 'dibayar', 'sedang_disewa', atau 'selesai'.
 */
export async function generateContractForTransaction(transactionId, creatorId = null) {
  if (!transactionId) return null;

  const supabase = await getSupabaseForPayment();
  const now = new Date().toISOString();

  // Validasi status transaksi: harus sudah lunas
  const { data: tx, error: txErr } = await supabase
    .from("rental_transactions")
    .select("id, transaction_code, renter_id, status")
    .eq("id", transactionId)
    .single();

  if (txErr || !tx) {
    throw new Error("Transaksi sewa tidak ditemukan untuk pembuatan kontrak.");
  }

  const validContractStatuses = ["dibayar", "sedang_disewa", "selesai"];
  if (!validContractStatuses.includes(tx.status)) {
    throw new Error(
      `Kontrak tidak dapat diterbitkan untuk transaksi berstatus '${tx.status}'. Pembayaran harus diverifikasi lunas terlebih dahulu.`
    );
  }

  // Cek apakah kontrak sudah pernah diterbitkan sebelumnya
  const { data: existingContract } = await supabase
    .from("rental_contracts")
    .select("id, contract_number, status, generated_at")
    .eq("rental_id", transactionId)
    .maybeSingle();

  if (existingContract) {
    return existingContract;
  }

  // Format nomor kontrak resmi: PKS/{TAHUN}/{BULAN_ROMAWI}/{KODE_TRANSAKSI}
  const code = tx.transaction_code || "TRX";
  const year = new Date().getFullYear();
  const monthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][new Date().getMonth()];
  const contractNumber = `PKS/${year}/${monthRoman}/${code}`;

  const { data: contract, error: contractError } = await supabase
    .from("rental_contracts")
    .insert({
      rental_id: transactionId,
      contract_number: contractNumber,
      file_path: `contracts/${code}_PKS.pdf`,
      status: "terbit",
      generated_at: now,
      created_by: creatorId || tx.renter_id || null,
      created_at: now,
      updated_at: now,
    })
    .select("id, contract_number, status, generated_at")
    .single();

  if (contractError) {
    console.error("Gagal membuat rental_contracts:", contractError.message);
    throw new Error(`Gagal membuat entri kontrak sewa: ${contractError.message}`);
  }

  return contract;
}

/**
 * Mengambil data riwayat pembayaran dan kontrak untuk detail transaksi.
 */
export async function getPaymentAndContractByRentalId(transactionId) {
  if (!transactionId) {
    return { payment: null, contract: null };
  }

  const supabase = await getSupabaseForPayment();

  const [
    { data: paymentData },
    { data: contractData },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select(`
        id,
        amount,
        payment_provider,
        midtrans_order_id,
        midtrans_token,
        payment_url,
        payment_type,
        status,
        paid_at,
        expired_at,
        created_at
      `)
      .eq("rental_id", transactionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("rental_contracts")
      .select("id, contract_number, file_path, status, generated_at")
      .eq("rental_id", transactionId)
      .maybeSingle(),
  ]);

  return {
    payment: paymentData
      ? {
          id: paymentData.id,
          amount: Number(paymentData.amount),
          provider: paymentData.payment_provider,
          orderId: paymentData.midtrans_order_id,
          token: paymentData.midtrans_token,
          paymentUrl: paymentData.payment_url,
          paymentType: paymentData.payment_type,
          status: paymentData.status,
          paidAt: paymentData.paid_at,
          expiredAt: paymentData.expired_at,
        }
      : null,
    contract: contractData
      ? {
          id: contractData.id,
          contractNumber: contractData.contract_number,
          filePath: contractData.file_path,
          status: contractData.status,
          generatedAt: contractData.generated_at,
        }
      : null,
  };
}
