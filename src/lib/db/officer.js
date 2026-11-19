import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isLiveSupabase() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id")
  );
}

async function getSupabaseForOfficer() {
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && isLiveSupabase()) {
      return createAdminClient();
    }
  } catch {
    // Abaikan jika service role tidak dapat diakses
  }
  return await createClient();
}

// =========================================================================
// 1. DASHBOARD PETUGAS
// =========================================================================

export async function getOfficerDashboardStats(officerId = null) {
  if (!isLiveSupabase()) {
    return getMockOfficerStats();
  }

  try {
    const supabase = await getSupabaseForOfficer();

    // Query antrean serah terima (status: disetujui)
    const { count: pendingHandovers } = await supabase
      .from("rental_transactions")
      .select("*", { count: "exact", head: true })
      .eq("status", "disetujui");

    // Query antrean pengembalian (status: sedang_disewa)
    const { count: pendingReturns } = await supabase
      .from("rental_transactions")
      .select("*", { count: "exact", head: true })
      .eq("status", "sedang_disewa");

    // Query tugas selesai (status: dikembalikan)
    const { count: completedTasks } = await supabase
      .from("rental_transactions")
      .select("*", { count: "exact", head: true })
      .eq("status", "dikembalikan");

    // Ambil tugas mendesak terbaru
    const { data: urgentTasks } = await supabase
      .from("rental_transactions")
      .select(`
        id,
        transaction_code,
        status,
        start_date,
        end_date,
        rental_days,
        renter:profiles!rental_transactions_renter_id_fkey(full_name, phone),
        items:rental_transaction_items(
          id,
          asset:assets(id, name, asset_code, location)
        ),
        assignments:rental_staff_assignments(staff_id)
      `)
      .in("status", ["disetujui", "sedang_disewa"])
      .order("start_date", { ascending: true })
      .limit(6);

    const formattedUrgent = (urgentTasks || []).map((t) => {
      const assetNames = t.items?.map((i) => i.asset?.name).filter(Boolean).join(", ") || "Aset Pengelola";
      const location = t.items?.[0]?.asset?.location || "Lokasi Pengelola";
      return {
        id: t.id,
        code: t.transaction_code,
        status: t.status,
        renterName: t.renter?.full_name || "Penyewa",
        phone: t.renter?.phone || "-",
        assetNames,
        location,
        startDate: t.start_date,
        endDate: t.end_date,
        rentalDays: t.rental_days || 1,
        isHandoverPending: t.status === "disetujui" || t.status === "dibayar",
        isReturnPending: t.status === "sedang_disewa",
      };
    });

    return {
      pendingHandovers: pendingHandovers || 0,
      pendingReturns: pendingReturns || 0,
      completedTasks: completedTasks || 0,
      urgentTasks: formattedUrgent,
    };
  } catch (err) {
    console.error("Error getOfficerDashboardStats:", err);
    return getMockOfficerStats();
  }
}

// =========================================================================
// 2. DAFTAR TUGAS PETUGAS DENGAN FILTER
// =========================================================================

export async function getOfficerTasks({
  officerId = null,
  statusFilter = "semua", // 'semua' | 'serah_terima' | 'pengembalian' | 'selesai'
  search = "",
} = {}) {
  if (!isLiveSupabase()) {
    return filterMockOfficerTasks({ statusFilter, search });
  }

  try {
    const supabase = await getSupabaseForOfficer();

    let query = supabase
      .from("rental_transactions")
      .select(`
        id,
        transaction_code,
        status,
        start_date,
        end_date,
        rental_days,
        purpose,
        submitted_at,
        renter:profiles!rental_transactions_renter_id_fkey(id, full_name, phone),
        items:rental_transaction_items(
          id,
          asset:assets(id, name, asset_code, location)
        ),
        handover:handover_records(id, handed_over_at, initial_condition, handled_by),
        returnRecord:return_records(id, returned_at, final_condition, handled_by),
        assignments:rental_staff_assignments(id, staff_id, note)
      `)
      .order("start_date", { ascending: false });

    // Filter status operasional petugas
    if (statusFilter === "serah_terima") {
      query = query.in("status", ["disetujui", "dibayar"]);
    } else if (statusFilter === "pengembalian") {
      query = query.eq("status", "sedang_disewa");
    } else if (statusFilter === "selesai") {
      query = query.in("status", ["dikembalikan"]);
    } else {
      // Semua tugas operasional
      query = query.in("status", ["disetujui", "sedang_disewa", "dikembalikan"]);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.warn("getOfficerTasks error:", error?.message);
      return filterMockOfficerTasks({ statusFilter, search });
    }

    let results = data.map((t) => {
      const assetNames = t.items?.map((i) => i.asset?.name).filter(Boolean).join(", ") || "Aset Pengelola";
      const location = t.items?.[0]?.asset?.location || "Lokasi Pengelola";
      const isAssignedToCurrent = officerId
        ? t.assignments?.some((a) => a.staff_id === officerId)
        : true;

      return {
        id: t.id,
        code: t.transaction_code,
        status: t.status,
        renterName: t.renter?.full_name || "Penyewa",
        phone: t.renter?.phone || "-",
        assetNames,
        location,
        itemCount: t.items?.length || 1,
        startDate: t.start_date,
        endDate: t.end_date,
        rentalDays: t.rental_days || 1,
        purpose: t.purpose || "-",
        hasHandover: Boolean(t.handover && t.handover.length > 0),
        hasReturn: Boolean(t.returnRecord && t.returnRecord.length > 0),
        isAssignedToCurrent,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.code.toLowerCase().includes(s) ||
          r.renterName.toLowerCase().includes(s) ||
          r.assetNames.toLowerCase().includes(s)
      );
    }

    return results;
  } catch (err) {
    console.error("Error getOfficerTasks:", err);
    return filterMockOfficerTasks({ statusFilter, search });
  }
}

// =========================================================================
// 3. DETAIL TUGAS OPERASIONAL PETUGAS
// =========================================================================

export async function getOfficerTaskById(transactionId, officerId = null) {
  if (!isLiveSupabase()) {
    const list = getMockOfficerTaskDetails();
    return list.find((t) => t.id === transactionId || t.code === transactionId) || null;
  }

  try {
    const supabase = await getSupabaseForOfficer();

    const { data, error } = await supabase
      .from("rental_transactions")
      .select(`
        id,
        transaction_code,
        renter_id,
        status,
        start_date,
        end_date,
        rental_days,
        subtotal,
        total_cost,
        purpose,
        renter_note,
        decision_note,
        submitted_at,
        renter:profiles!rental_transactions_renter_id_fkey(
          id,
          full_name,
          phone,
          address
        ),
        items:rental_transaction_items(
          id,
          asset_id,
          rate_period,
          rate_amount_snapshot,
          quantity,
          line_total,
          asset:assets(
            id,
            name,
            asset_code,
            location,
            physical_condition,
            operational_status,
            category:asset_categories(name)
          )
        ),
        handover:handover_records(
          id,
          rental_id,
          handled_by,
          handed_over_at,
          initial_condition,
          handover_note,
          evidence_path,
          officer:profiles!handover_records_handled_by_fkey(full_name)
        ),
        returnRecord:return_records(
          id,
          rental_id,
          handled_by,
          returned_at,
          final_condition,
          damage_note,
          follow_up_note,
          evidence_path,
          officer:profiles!return_records_handled_by_fkey(full_name)
        ),
        assignments:rental_staff_assignments(
          id,
          staff_id,
          assigned_at,
          note,
          staff:profiles!rental_staff_assignments_staff_id_fkey(full_name)
        ),
        history:rental_status_history(
          id,
          old_status,
          new_status,
          change_note,
          changed_at,
          changer:profiles!rental_status_history_changed_by_fkey(full_name)
        )
      `)
      .or(`id.eq.${transactionId},transaction_code.eq.${transactionId}`)
      .maybeSingle();

    if (error || !data) {
      console.warn("getOfficerTaskById not found:", error?.message);
      return null;
    }

    const handover = Array.isArray(data.handover) ? data.handover[0] : data.handover;
    const returnRecord = Array.isArray(data.returnRecord) ? data.returnRecord[0] : data.returnRecord;

    return {
      id: data.id,
      code: data.transaction_code,
      status: data.status,
      renterName: data.renter?.full_name || "Penyewa",
      phone: data.renter?.phone || "-",
      address: data.renter?.address || "-",
      startDate: data.start_date,
      endDate: data.end_date,
      rentalDays: data.rental_days || 1,
      totalCost: Number(data.total_cost) || 0,
      purpose: data.purpose || "-",
      renterNote: data.renter_note || "-",
      items: (data.items || []).map((i) => ({
        id: i.id,
        assetId: i.asset_id,
        assetName: i.asset?.name || "Aset",
        assetCode: i.asset?.asset_code || "-",
        assetCategory: i.asset?.category?.name || "Aset",
        location: i.asset?.location || "-",
        physicalCondition: i.asset?.physical_condition || "baik",
        operationalStatus: i.asset?.operational_status || "siap",
      })),
      handover: handover
        ? {
            id: handover.id,
            handedOverAt: handover.handed_over_at,
            initialCondition: handover.initial_condition,
            note: handover.handover_note,
            evidencePath: handover.evidence_path,
            officerName: handover.officer?.full_name || "Petugas Lapangan",
          }
        : null,
      returnRecord: returnRecord
        ? {
            id: returnRecord.id,
            returnedAt: returnRecord.returned_at,
            finalCondition: returnRecord.final_condition,
            damageNote: returnRecord.damage_note,
            followUpNote: returnRecord.follow_up_note,
            evidencePath: returnRecord.evidence_path,
            officerName: returnRecord.officer?.full_name || "Petugas Lapangan",
          }
        : null,
      assignments: (data.assignments || []).map((a) => ({
        id: a.id,
        staffId: a.staff_id,
        staffName: a.staff?.full_name || "Petugas",
        note: a.note,
        assignedAt: a.assigned_at,
      })),
      history: (data.history || []).map((h) => ({
        id: h.id,
        oldStatus: h.old_status,
        newStatus: h.new_status,
        note: h.change_note,
        changedAt: h.changed_at,
        changerName: h.changer?.full_name || "Sistem",
      })),
    };
  } catch (err) {
    console.error("Error getOfficerTaskById:", err);
    return null;
  }
}

// =========================================================================
// 4. PENCATATAN SERAH TERIMA BARANG (HANDOVER)
// =========================================================================

export async function recordHandover({
  transactionId,
  officerId,
  initialCondition = "baik",
  handoverNote = "",
  evidencePath = null,
}) {
  if (!transactionId || !officerId) {
    throw new Error("Data transaksi dan identitas petugas wajib disertakan.");
  }

  if (!isLiveSupabase()) {
    return { success: true, transactionId, newStatus: "sedang_disewa" };
  }

  const supabase = await getSupabaseForOfficer();
  const now = new Date().toISOString();

  // 1. Validasi status transaksi saat ini (harus 'dibayar' atau 'disetujui')
  const { data: tx, error: txError } = await supabase
    .from("rental_transactions")
    .select("id, status, transaction_code")
    .eq("id", transactionId)
    .single();

  if (txError || !tx) {
    throw new Error("Transaksi penyewaan tidak ditemukan.");
  }

  if (tx.status !== "dibayar" && tx.status !== "disetujui") {
    throw new Error(`Serah terima tidak dapat dilakukan untuk transaksi berstatus '${tx.status}'.`);
  }

  // 2. Simpan catatan ke tabel handover_records
  const { error: handoverError } = await supabase
    .from("handover_records")
    .insert({
      rental_id: transactionId,
      handled_by: officerId,
      handed_over_at: now,
      initial_condition: initialCondition,
      handover_note: handoverNote.trim() || "Serah terima aset dilakukan dengan baik dan sesuai kesepakatan.",
      evidence_path: evidencePath,
      created_at: now,
    });

  if (handoverError) {
    throw new Error(`Gagal mencatat serah terima: ${handoverError.message}`);
  }

  // 3. Perbarui status transaksi -> sedang_disewa
  const { error: updateTxError } = await supabase
    .from("rental_transactions")
    .update({
      status: "sedang_disewa",
      updated_at: now,
    })
    .eq("id", transactionId);

  if (updateTxError) {
    throw new Error(`Gagal memperbarui status transaksi: ${updateTxError.message}`);
  }

  // 4. Catat riwayat status di rental_status_history
  await supabase.from("rental_status_history").insert({
    rental_id: transactionId,
    old_status: tx.status,
    new_status: "sedang_disewa",
    changed_by: officerId,
    change_note: `Serah terima aset selesai dilaksanakan oleh petugas. Kondisi awal: ${initialCondition}. ${handoverNote}`.trim(),
    changed_at: now,
  });

  return { success: true, transactionId, newStatus: "sedang_disewa" };
}

// =========================================================================
// 5. PENCATATAN PENGEMBALIAN BARANG (RETURN)
// =========================================================================

export async function recordReturn({
  transactionId,
  officerId,
  finalCondition = "baik",
  damageNote = "",
  followUpNote = "",
  evidencePath = null,
}) {
  if (!transactionId || !officerId) {
    throw new Error("Data transaksi dan identitas petugas wajib disertakan.");
  }

  if (!isLiveSupabase()) {
    return { success: true, transactionId, newStatus: "dikembalikan" };
  }

  const supabase = await getSupabaseForOfficer();
  const now = new Date().toISOString();

  // 1. Validasi status transaksi (harus 'sedang_disewa')
  const { data: tx, error: txError } = await supabase
    .from("rental_transactions")
    .select(`
      id,
      status,
      transaction_code,
      items:rental_transaction_items(id, asset_id)
    `)
    .eq("id", transactionId)
    .single();

  if (txError || !tx) {
    throw new Error("Transaksi penyewaan tidak ditemukan.");
  }

  if (tx.status !== "sedang_disewa") {
    throw new Error(`Pengembalian tidak dapat diproses untuk transaksi berstatus '${tx.status}'.`);
  }

  // 2. Simpan ke tabel return_records
  const { error: returnError } = await supabase
    .from("return_records")
    .insert({
      rental_id: transactionId,
      handled_by: officerId,
      returned_at: now,
      final_condition: finalCondition,
      damage_note: damageNote.trim() || null,
      follow_up_note: followUpNote.trim() || null,
      evidence_path: evidencePath,
      created_at: now,
    });

  if (returnError) {
    throw new Error(`Gagal mencatat pengembalian aset: ${returnError.message}`);
  }

  // 3. Perbarui status transaksi -> dikembalikan
  const { error: updateTxError } = await supabase
    .from("rental_transactions")
    .update({
      status: "dikembalikan",
      updated_at: now,
    })
    .eq("id", transactionId);

  if (updateTxError) {
    throw new Error(`Gagal memperbarui status transaksi: ${updateTxError.message}`);
  }

  // 4. Catat riwayat status di rental_status_history
  const noteLog = `Pemeriksaan pengembalian aset selesai. Kondisi akhir: ${finalCondition}.${
    damageNote ? ` Catatan kerusakan: ${damageNote}.` : ""
  }`.trim();

  await supabase.from("rental_status_history").insert({
    rental_id: transactionId,
    old_status: "sedang_disewa",
    new_status: "dikembalikan",
    changed_by: officerId,
    change_note: noteLog,
    changed_at: now,
  });

  // 5. Jika kondisi akhir rusak / perlu pemeriksaan, perbarui kondisi fisik aset di tabel assets
  if (finalCondition === "rusak" || finalCondition === "perlu_pemeriksaan") {
    const assetIds = (tx.items || []).map((i) => i.asset_id);
    if (assetIds.length > 0) {
      await supabase
        .from("assets")
        .update({
          physical_condition: finalCondition,
          operational_status: finalCondition === "rusak" ? "perbaikan" : "siap",
          updated_at: now,
        })
        .in("id", assetIds);
    }
  }

  // 6. Lepas blokir kalender aktif (status -> released)
  if (tx.items && tx.items.length > 0) {
    const itemIds = tx.items.map((i) => i.id);
    await supabase
      .from("asset_booking_blocks")
      .update({
        status: "released",
        released_at: now,
      })
      .in("rental_item_id", itemIds)
      .eq("status", "active");
  }

  return { success: true, transactionId, newStatus: "dikembalikan" };
}

// =========================================================================
// MOCK DATA FALLBACKS (Untuk demo lokal jika offline)
// =========================================================================

function getMockOfficerStats() {
  return {
    pendingHandovers: 1,
    pendingReturns: 1,
    completedTasks: 3,
    urgentTasks: [
      {
        id: "mock-tx-2",
        code: "SWA-2026-8712",
        status: "dibayar",
        renterName: "Siti Rahmawati",
        phone: "081234567890",
        assetNames: "Ruang Rapat VIP Adyatma",
        location: "Gedung Pengelola Lantai 2, Sayap Barat",
        startDate: "2026-11-20",
        endDate: "2026-11-21",
        rentalDays: 2,
        isHandoverPending: true,
        isReturnPending: false,
      },
      {
        id: "mock-tx-3",
        code: "SWA-2026-7245",
        status: "sedang_disewa",
        renterName: "PT Sinar Gemilang",
        phone: "085678901234",
        assetNames: "Gedung Pertemuan Graha Utama",
        location: "Jl. Sudirman No. 45, Kompleks Pengelola Pusat",
        startDate: "2026-11-15",
        endDate: "2026-11-17",
        rentalDays: 3,
        isHandoverPending: false,
        isReturnPending: true,
      },
    ],
  };
}

function getMockOfficerTaskDetails() {
  return [
    {
      id: "mock-tx-2",
      code: "SWA-2026-8712",
      status: "dibayar",
      renterName: "Siti Rahmawati",
      phone: "081234567890",
      address: "Jl. Cisangkuy No. 14, Bandung",
      startDate: "2026-11-20",
      endDate: "2026-11-21",
      rentalDays: 2,
      totalCost: 3000000,
      purpose: "Rapat Koordinasi Dewan Direksi Perusahaan",
      renterNote: "Mohon siapkan proyektor laser dan koneksi internet stabil.",
      items: [
        {
          id: "item-2",
          assetId: "ast-003",
          assetName: "Ruang Rapat VIP Adyatma",
          assetCode: "AST-003",
          assetCategory: "Ruangan",
          location: "Gedung Pengelola Lantai 2, Sayap Barat",
          physicalCondition: "baik",
          operationalStatus: "siap",
        },
      ],
      handover: null,
      returnRecord: null,
      assignments: [
        {
          id: "asg-1",
          staffId: "stf-1",
          staffName: "Petugas Lapangan Utama",
          note: "Tangani serah terima ruangan VIP dan pastikan AC menyala 1 jam sebelumnya.",
          assignedAt: "2026-11-18T09:00:00Z",
        },
      ],
      history: [
        {
          id: "h-1",
          oldStatus: "menunggu_persetujuan",
          newStatus: "menunggu_pembayaran",
          note: "Pengajuan disetujui admin.",
          changedAt: "2026-11-17T15:00:00Z",
          changerName: "Admin",
        },
        {
          id: "h-2",
          oldStatus: "menunggu_pembayaran",
          newStatus: "dibayar",
          note: "Pembayaran sewa terkonfirmasi lunas.",
          changedAt: "2026-11-18T08:30:00Z",
          changerName: "Sistem Payment Gateway",
        },
      ],
    },
    {
      id: "mock-tx-3",
      code: "SWA-2026-7245",
      status: "sedang_disewa",
      renterName: "PT Sinar Gemilang",
      phone: "085678901234",
      address: "Kawasan Industri Pulo Gadung Blok B-4",
      startDate: "2026-11-15",
      endDate: "2026-11-17",
      rentalDays: 3,
      totalCost: 45000000,
      purpose: "Ekshibisi Inovasi Produk Tahunan",
      renterNote: "Membutuhkan daya listrik ekstra 50.000W.",
      items: [
        {
          id: "item-3",
          assetId: "ast-001",
          assetName: "Gedung Pertemuan Graha Utama",
          assetCode: "AST-001",
          assetCategory: "Gedung Pertemuan",
          location: "Jl. Sudirman No. 45, Kompleks Pengelola Pusat",
          physicalCondition: "baik",
          operationalStatus: "siap",
        },
      ],
      handover: {
        id: "hnd-1",
        handedOverAt: "2026-11-15T08:00:00Z",
        initialCondition: "baik",
        note: "Kunci gedung dan sound system diserahkan kepada panitia dalam kondisi prima.",
        evidencePath: null,
        officerName: "Petugas Lapangan Utama",
      },
      returnRecord: null,
      assignments: [],
      history: [],
    },
  ];
}

function filterMockOfficerTasks({ statusFilter, search }) {
  let list = getMockOfficerTaskDetails();

  if (statusFilter === "serah_terima") {
    list = list.filter((t) => t.status === "dibayar");
  } else if (statusFilter === "pengembalian") {
    list = list.filter((t) => t.status === "sedang_disewa");
  } else if (statusFilter === "selesai") {
    list = list.filter((t) => t.status === "dikembalikan" || t.status === "selesai");
  }

  if (search) {
    const s = search.toLowerCase();
    list = list.filter(
      (t) =>
        t.code.toLowerCase().includes(s) ||
        t.renterName.toLowerCase().includes(s)
    );
  }

  return list.map((t) => ({
    id: t.id,
    code: t.code,
    status: t.status,
    renterName: t.renterName,
    phone: t.phone,
    assetNames: t.items.map((i) => i.assetName).join(", "),
    location: t.items[0]?.location || "-",
    itemCount: t.items.length,
    startDate: t.startDate,
    endDate: t.endDate,
    rentalDays: t.rentalDays,
    purpose: t.purpose,
    hasHandover: Boolean(t.handover),
    hasReturn: Boolean(t.returnRecord),
    isAssignedToCurrent: true,
  }));
}
