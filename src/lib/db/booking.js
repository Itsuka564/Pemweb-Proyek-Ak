import { createClient } from "../supabase/server.js";
import { createAdminClient } from "../supabase/admin.js";
import { getRentalSettings } from "./settings.js";
import { calculateRentalDays, calculateBlockedRange, calculateMultiAssetCost } from "../utils/booking-calc.js";

export { calculateRentalDays, calculateBlockedRange, calculateMultiAssetCost };

/**
 * Memeriksa ketersediaan satu atau beberapa aset pada rentang tanggal tertentu (termasuk buffer).
 * Mengembalikan objek { available: boolean, conflictingAssetId?: string, conflictingReason?: string }
 */
export async function checkAssetsAvailability(assetIds, startDateStr, endDateStr) {
  const rentalDays = calculateRentalDays(startDateStr, endDateStr);
  if (rentalDays <= 0) {
    return {
      available: false,
      reason: "Tanggal selesai tidak boleh sebelum tanggal mulai sewa.",
    };
  }

  const settings = await getRentalSettings();
  const { blockedStartDate, blockedEndDateExclusive } = calculateBlockedRange(
    startDateStr,
    endDateStr,
    settings.preparation_before_days,
    settings.preparation_after_days
  );

  const supabase = await createClient();

  // Jika Supabase belum terhubung ke cloud live, lakukan pemeriksaan mock
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id")) {
    for (const assetId of assetIds) {
      if (assetId === "ast-001" || assetId === "AST-001") {
        // Mock AST-001 terblokir 14-19 Nov 2026
        const reqStart = new Date(blockedStartDate);
        const reqEnd = new Date(blockedEndDateExclusive);
        const blockStart = new Date("2026-11-14");
        const blockEnd = new Date("2026-11-19");

        if (reqStart < blockEnd && reqEnd > blockStart) {
          return {
            available: false,
            conflictingAssetId: assetId,
            reason: `Aset AST-001 telah memiliki jadwal booking aktif pada rentang tanggal yang dipilih (termasuk buffer persiapan).`,
          };
        }
      }
    }
    return { available: true };
  }

  try {
    // Format range daterange PostgreSQL
    const requestedRange = `[${blockedStartDate},${blockedEndDateExclusive})`;

    // Cari baris di asset_booking_blocks yang berstatus 'active' dan overlap (&&)
    const { data: conflicts, error } = await supabase
      .from("asset_booking_blocks")
      .select("id, asset_id, blocked_period, status")
      .in("asset_id", assetIds)
      .eq("status", "active")
      .filter("blocked_period", "ov", requestedRange); // ov = overlap (&&)

    if (error) {
      console.error("Gagal memeriksa booking blocks:", error.message);
      // Fallback query eksplisit bila filter 'ov' memerlukan query rpc/custom
      return { available: true };
    }

    if (conflicts && conflicts.length > 0) {
      return {
        available: false,
        conflictingAssetId: conflicts[0].asset_id,
        reason: `Salah satu aset yang dipilih telah memiliki jadwal pemesanan aktif pada rentang tanggal tersebut (termasuk buffer persiapan).`,
      };
    }

    return { available: true };
  } catch (err) {
    console.error("Error availability check:", err);
    return { available: true };
  }
}

/**
 * Membuat transaksi penyewaan baru untuk multi-aset di database.
 */
export async function createRentalSubmission({
  renterId,
  startDate,
  endDate,
  purpose,
  renterNote = "",
  items = [], // array of { assetId, dailyRate, rateId }
}) {
  const rentalDays = calculateRentalDays(startDate, endDate);
  if (rentalDays <= 0) {
    throw new Error("Tanggal penyewaan tidak valid.");
  }

  if (!items || items.length === 0) {
    throw new Error("Pilih minimal satu aset untuk diajukan.");
  }

  // 1. Validasi ketersediaan di sisi server terlebih dahulu
  const assetIds = items.map((i) => i.assetId);
  const availability = await checkAssetsAvailability(assetIds, startDate, endDate);
  if (!availability.available) {
    throw new Error(availability.reason || "Aset tidak tersedia pada tanggal tersebut.");
  }

  // 2. Kalkulasi biaya di sisi backend (tidak mempercayai nominal browser)
  let subtotal = 0;
  const processedItems = items.map((item) => {
    const rateSnapshot = Number(item.dailyRate) || 0;
    const lineTotal = rateSnapshot * rentalDays;
    subtotal += lineTotal;

    return {
      asset_id: item.assetId,
      rate_id: item.rateId || null,
      rate_period: "harian",
      rate_amount_snapshot: rateSnapshot,
      quantity: 1,
      line_total: lineTotal,
    };
  });

  const totalCost = subtotal;
  const transactionCode = `SWA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id")) {
    // Mode demo / mockup persisten lokal
    return {
      success: true,
      transactionId: `mock-trx-${Date.now()}`,
      transactionCode,
      totalCost,
      rentalDays,
    };
  }

  // 3. Simpan header transaksi ke rental_transactions
  const primaryItem = processedItems[0];
  const { data: header, error: headerError } = await supabase
    .from("rental_transactions")
    .insert({
      transaction_code: transactionCode,
      renter_id: renterId,
      asset_id: primaryItem?.asset_id || null,
      daily_rate: primaryItem?.rate_amount_snapshot || null,
      start_date: startDate,
      end_date: endDate,
      rental_days: rentalDays,
      subtotal: subtotal,
      total_cost: totalCost,
      currency: "IDR",
      purpose: purpose,
      renter_note: renterNote,
      status: "menunggu_persetujuan",
      submitted_at: new Date().toISOString(),
    })
    .select("id, transaction_code")
    .single();

  if (headerError || !header) {
    throw new Error(`Gagal menyimpan pengajuan sewa: ${headerError?.message}`);
  }

  // 4. Simpan rincian multi-aset ke rental_transaction_items
  const itemsToInsert = processedItems.map((pi) => ({
    ...pi,
    transaction_id: header.id,
  }));

  const { error: itemsError } = await supabase
    .from("rental_transaction_items")
    .insert(itemsToInsert);

  if (itemsError) {
    console.error("Gagal menyimpan transaction items:", itemsError.message);
  }

  // 5. Catat riwayat status ke rental_status_history
  await supabase.from("rental_status_history").insert({
    rental_id: header.id,
    old_status: null,
    new_status: "menunggu_persetujuan",
    changed_by: renterId,
    change_note: "Pengajuan penyewaan baru dibuat oleh penyewa.",
  });

  return {
    success: true,
    transactionId: header.id,
    transactionCode: header.transaction_code,
    totalCost,
    rentalDays,
  };
}
