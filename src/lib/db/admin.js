import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRentalSettings } from "./settings.js";
import { calculateBlockedRange, calculateRentalDays } from "@/lib/utils/booking-calc.js";

// Helper untuk memeriksa apakah Supabase URL terhubung atau dummy
function isLiveSupabase() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id")
  );
}

// Helper untuk membuat Supabase client dengan fallback aman ke Admin Client jika service role tersedia
async function getSupabaseForAdmin() {
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
// 1. DASHBOARD ADMIN
// =========================================================================

export async function getAdminDashboardStats() {
  if (!isLiveSupabase()) {
    return getMockDashboardStats();
  }

  try {
    const supabase = await getSupabaseForAdmin();

    // Query paralel untuk efisiensi
    const [
      { count: totalAssets },
      { count: activeAssets },
      { count: pendingVerifications },
      { count: pendingRentals },
      { count: activeRentals },
      { data: recentRentals },
      { data: recentVerifications },
      { data: recentHistory },
    ] = await Promise.all([
      supabase.from("assets").select("*", { count: "exact", head: true }),
      supabase.from("assets").select("*", { count: "exact", head: true }).eq("operational_status", "siap"),
      supabase.from("user_verifications").select("*", { count: "exact", head: true }).eq("status", "menunggu"),
      supabase.from("rental_transactions").select("*", { count: "exact", head: true }).eq("status", "menunggu_persetujuan"),
      supabase.from("rental_transactions").select("*", { count: "exact", head: true }).in("status", ["disetujui", "menunggu_pembayaran", "dibayar", "sedang_disewa"]),
      supabase
        .from("rental_transactions")
        .select(`
          id,
          transaction_code,
          status,
          total_cost,
          start_date,
          end_date,
          submitted_at,
          renter:profiles!rental_transactions_renter_id_fkey(full_name, phone)
        `)
        .order("submitted_at", { ascending: false })
        .limit(5),
      supabase
        .from("user_verifications")
        .select(`
          id,
          document_type,
          document_number,
          status,
          submitted_at,
          user:profiles!user_verifications_user_id_fkey(id, full_name, phone)
        `)
        .eq("status", "menunggu")
        .order("submitted_at", { ascending: false })
        .limit(5),
      supabase
        .from("rental_status_history")
        .select(`
          id,
          old_status,
          new_status,
          change_note,
          changed_at,
          rental:rental_transactions!rental_status_history_rental_id_fkey(transaction_code)
        `)
        .order("changed_at", { ascending: false })
        .limit(6),
    ]);

    return {
      totalAssets: totalAssets || 0,
      activeAssets: activeAssets || 0,
      pendingVerifications: pendingVerifications || 0,
      pendingRentals: pendingRentals || 0,
      activeRentals: activeRentals || 0,
      recentRentals: (recentRentals || []).map((r) => ({
        id: r.id,
        code: r.transaction_code,
        status: r.status,
        totalCost: Number(r.total_cost) || 0,
        startDate: r.start_date,
        endDate: r.end_date,
        renterName: r.renter?.full_name || "Penyewa",
        submittedAt: r.submitted_at,
      })),
      recentVerifications: (recentVerifications || []).map((v) => ({
        id: v.id,
        documentType: v.document_type?.toUpperCase(),
        documentNumber: v.document_number,
        status: v.status,
        renterName: v.user?.full_name || "Penyewa",
        submittedAt: v.submitted_at,
      })),
      recentActivity: (recentHistory || []).map((h) => ({
        id: h.id,
        trxCode: h.rental?.transaction_code || "Transaksi",
        oldStatus: h.old_status,
        newStatus: h.new_status,
        note: h.change_note,
        changedAt: h.changed_at,
      })),
    };
  } catch (err) {
    console.error("Error in getAdminDashboardStats:", err);
    return getMockDashboardStats();
  }
}

// =========================================================================
// 2. REVIEW VERIFIKASI PENGGUNA
// =========================================================================

export async function getAdminVerifications({ status = "semua", search = "" } = {}) {
  if (!isLiveSupabase()) {
    return filterMockVerifications({ status, search });
  }

  try {
    const supabase = await getSupabaseForAdmin();

    let query = supabase
      .from("user_verifications")
      .select(`
        id,
        user_id,
        document_type,
        document_number,
        file_path,
        status,
        rejection_reason,
        reviewed_at,
        submitted_at,
        user:profiles!user_verifications_user_id_fkey(id, full_name, phone, address, role)
      `)
      .order("submitted_at", { ascending: false });

    if (status && status !== "semua") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.warn("getAdminVerifications DB error:", error?.message);
      return filterMockVerifications({ status, search });
    }

    let results = data.map((v) => ({
      id: v.id,
      userId: v.user_id,
      renterName: v.user?.full_name || "Penyewa",
      phone: v.user?.phone || "-",
      address: v.user?.address || "-",
      documentType: v.document_type?.toUpperCase() || "KTP",
      documentNumber: v.document_number || "-",
      filePath: v.file_path,
      status: v.status,
      rejectionReason: v.rejection_reason,
      reviewedAt: v.reviewed_at,
      submittedAt: v.submitted_at,
    }));

    if (search) {
      const s = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.renterName.toLowerCase().includes(s) ||
          r.documentNumber.toLowerCase().includes(s)
      );
    }

    return results;
  } catch (err) {
    console.error("Error getAdminVerifications:", err);
    return filterMockVerifications({ status, search });
  }
}

export async function getAdminVerificationById(id) {
  if (!isLiveSupabase()) {
    const list = getMockVerificationsList();
    const item = list.find((v) => v.id === id);
    if (!item) return null;
    return {
      ...item,
      signedFileUrl: item.filePath || "/placeholder-document.png",
    };
  }

  try {
    const supabase = await getSupabaseForAdmin();

    const { data, error } = await supabase
      .from("user_verifications")
      .select(`
        id,
        user_id,
        document_type,
        document_number,
        file_path,
        status,
        rejection_reason,
        reviewed_at,
        submitted_at,
        user:profiles!user_verifications_user_id_fkey(id, full_name, phone, address, role),
        reviewer:profiles!user_verifications_reviewed_by_fkey(full_name)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Buat signed URL aman untuk berkas privat (berlaku 60 menit)
    let signedFileUrl = null;
    if (data.file_path) {
      try {
        const { data: signData, error: signError } = await supabase.storage
          .from("user-verifications")
          .createSignedUrl(data.file_path, 3600);
        if (!signError && signData?.signedUrl) {
          signedFileUrl = signData.signedUrl;
        }
      } catch (e) {
        console.warn("Gagal membuat signed URL:", e.message);
      }
    }

    return {
      id: data.id,
      userId: data.user_id,
      renterName: data.user?.full_name || "Penyewa",
      phone: data.user?.phone || "-",
      address: data.user?.address || "-",
      documentType: data.document_type?.toUpperCase() || "KTP",
      documentNumber: data.document_number || "-",
      filePath: data.file_path,
      signedFileUrl,
      status: data.status,
      rejectionReason: data.rejection_reason,
      reviewerName: data.reviewer?.full_name,
      reviewedAt: data.reviewed_at,
      submittedAt: data.submitted_at,
    };
  } catch (err) {
    console.error("Error getAdminVerificationById:", err);
    return null;
  }
}

export async function reviewUserVerification({
  verificationId,
  decision, // 'disetujui' | 'ditolak' | 'perlu_dikirim_ulang'
  rejectionReason = null,
  reviewerId,
}) {
  if (decision === "ditolak" || decision === "perlu_dikirim_ulang") {
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      throw new Error("Alasan penolakan atau permintaan revisi wajib diisi minimal 5 karakter.");
    }
  }

  if (!isLiveSupabase()) {
    return { success: true, decision, verificationId };
  }

  const supabase = await getSupabaseForAdmin();
  const now = new Date().toISOString();

  const updatePayload = {
    status: decision,
    reviewed_by: reviewerId || null,
    reviewed_at: now,
    rejection_reason: decision === "disetujui" ? null : rejectionReason,
    updated_at: now,
  };

  const { error } = await supabase
    .from("user_verifications")
    .update(updatePayload)
    .eq("id", verificationId);

  if (error) {
    throw new Error(`Gagal memperbarui verifikasi: ${error.message}`);
  }

  return { success: true, decision, verificationId };
}

// =========================================================================
// 3. CRUD ASET, KATEGORI, FOTO, DAN TARIF
// =========================================================================

export async function getAdminAssets({ categoryId = "", operationalStatus = "", search = "" } = {}) {
  if (!isLiveSupabase()) {
    return filterMockAdminAssets({ categoryId, operationalStatus, search });
  }

  try {
    const supabase = await getSupabaseForAdmin();

    let query = supabase
      .from("assets")
      .select(`
        id,
        asset_code,
        name,
        description,
        area_size,
        area_unit,
        location,
        physical_condition,
        operational_status,
        is_active,
        category:asset_categories(id, name),
        rates:asset_rates(id, rate_period, amount, is_active),
        photos:asset_photos(id, storage_path, is_primary, sort_order)
      `)
      .order("created_at", { ascending: false });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }
    if (operationalStatus) {
      query = query.eq("operational_status", operationalStatus);
    }

    const { data, error } = await query;
    if (error || !data) {
      return filterMockAdminAssets({ categoryId, operationalStatus, search });
    }

    let results = data.map((asset) => {
      const dailyRate = asset.rates?.find((r) => r.rate_period === "harian" && r.is_active)?.amount || 0;
      const primaryPhoto = asset.photos?.find((p) => p.is_primary)?.storage_path || asset.photos?.[0]?.storage_path || null;

      return {
        id: asset.id,
        code: asset.asset_code,
        name: asset.name,
        categoryName: asset.category?.name || "Aset Umum",
        categoryId: asset.category?.id,
        areaSize: asset.area_size,
        areaUnit: asset.area_unit || "m²",
        location: asset.location || "-",
        physicalCondition: asset.physical_condition || "baik",
        operationalStatus: asset.operational_status || "siap",
        isActive: asset.is_active,
        dailyRate: Number(dailyRate),
        photoUrl: primaryPhoto,
        photoCount: asset.photos?.length || 0,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      results = results.filter(
        (a) => a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s)
      );
    }

    return results;
  } catch (err) {
    console.error("Error getAdminAssets:", err);
    return filterMockAdminAssets({ categoryId, operationalStatus, search });
  }
}

export async function getAdminAssetById(id) {
  if (!isLiveSupabase()) {
    const list = getMockAssetsWithDetail();
    return list.find((a) => a.id === id || a.code === id) || null;
  }

  try {
    const supabase = await getSupabaseForAdmin();

    const { data, error } = await supabase
      .from("assets")
      .select(`
        id,
        asset_code,
        name,
        description,
        area_size,
        area_unit,
        location,
        specifications,
        physical_condition,
        operational_status,
        is_active,
        category_id,
        category:asset_categories(id, name, description),
        rates:asset_rates(id, rate_period, amount, effective_from, effective_until, is_active),
        photos:asset_photos(id, storage_path, alt_text, is_primary, sort_order)
      `)
      .or(`id.eq.${id},asset_code.eq.${id}`)
      .maybeSingle();

    if (error || !data) return null;

    // Ambil signed url untuk tiap foto jika diperlukan
    const photosWithUrl = await Promise.all(
      (data.photos || []).map(async (p) => {
        let publicUrl = p.storage_path;
        if (p.storage_path && !p.storage_path.startsWith("http") && !p.storage_path.startsWith("/")) {
          const { data: urlData } = supabase.storage
            .from("asset-photos")
            .getPublicUrl(p.storage_path);
          if (urlData?.publicUrl) publicUrl = urlData.publicUrl;
        }
        return {
          id: p.id,
          storagePath: p.storage_path,
          url: publicUrl,
          altText: p.alt_text,
          isPrimary: p.is_primary,
          sortOrder: p.sort_order,
        };
      })
    );

    return {
      id: data.id,
      code: data.asset_code,
      name: data.name,
      description: data.description,
      categoryId: data.category_id,
      categoryName: data.category?.name,
      areaSize: data.area_size,
      areaUnit: data.area_unit || "m²",
      location: data.location,
      specifications: data.specifications || {},
      physicalCondition: data.physical_condition || "baik",
      operationalStatus: data.operational_status || "siap",
      isActive: data.is_active,
      rates: (data.rates || []).map((r) => ({
        id: r.id,
        ratePeriod: r.rate_period,
        amount: Number(r.amount),
        effectiveFrom: r.effective_from,
        effectiveUntil: r.effective_until,
        isActive: r.is_active,
      })),
      photos: photosWithUrl,
    };
  } catch (err) {
    console.error("Error getAdminAssetById:", err);
    return null;
  }
}

export async function createAsset({
  assetCode,
  categoryId,
  name,
  description = "",
  areaSize = null,
  areaUnit = "m²",
  location = "",
  physicalCondition = "baik",
  operationalStatus = "siap",
  specifications = {},
  initialRates = {}, // { harian: 0, bulanan: 0, tahunan: 0 }
}) {
  if (!name || !assetCode || !categoryId) {
    throw new Error("Kode aset, kategori, dan nama aset wajib diisi.");
  }

  if (!isLiveSupabase()) {
    return { success: true, id: `ast-mock-${Date.now()}` };
  }

  const supabase = await getSupabaseForAdmin();

  const dailyRateNumber = Number(initialRates?.harian || 0);

  // 1. Simpan ke tabel assets (wajib menyertakan daily_rate, condition, dan availability untuk kompatibilitas skema)
  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .insert({
      asset_code: assetCode.toUpperCase().trim(),
      category_id: categoryId,
      name: name.trim(),
      description: description.trim(),
      area_size: areaSize ? Number(areaSize) : null,
      area_unit: areaUnit,
      location: location.trim(),
      daily_rate: dailyRateNumber,
      condition: physicalCondition || "baik",
      availability: operationalStatus === "siap" ? "tersedia" : "tidak_tersedia",
      physical_condition: physicalCondition,
      operational_status: operationalStatus,
      specifications: typeof specifications === "string" ? JSON.parse(specifications || "{}") : specifications,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (assetError) {
    throw new Error(`Gagal menambahkan aset: ${assetError.message}`);
  }

  // 2. Simpan tarif awal ke tabel asset_rates
  const ratesToInsert = [];
  if (dailyRateNumber > 0) {
    ratesToInsert.push({
      asset_id: asset.id,
      rate_period: "harian",
      amount: dailyRateNumber,
      effective_from: new Date().toISOString().split("T")[0],
      is_active: true,
    });
  }
  if (initialRates.bulanan && Number(initialRates.bulanan) > 0) {
    ratesToInsert.push({
      asset_id: asset.id,
      rate_period: "bulanan",
      amount: Number(initialRates.bulanan),
      effective_from: new Date().toISOString().split("T")[0],
      is_active: true,
    });
  }
  if (initialRates.tahunan && Number(initialRates.tahunan) > 0) {
    ratesToInsert.push({
      asset_id: asset.id,
      rate_period: "tahunan",
      amount: Number(initialRates.tahunan),
      effective_from: new Date().toISOString().split("T")[0],
      is_active: true,
    });
  }

  if (ratesToInsert.length > 0) {
    await supabase.from("asset_rates").insert(ratesToInsert);
  }

  return { success: true, id: asset.id };
}

export async function updateAsset(
  id,
  {
    name,
    description,
    categoryId,
    areaSize,
    areaUnit,
    location,
    physicalCondition,
    operationalStatus,
    specifications,
    isActive,
    dailyRate,
  }
) {
  if (!isLiveSupabase()) {
    return { success: true, id };
  }

  const supabase = await getSupabaseForAdmin();

  const payload = {
    name,
    description,
    category_id: categoryId,
    area_size: areaSize ? Number(areaSize) : null,
    area_unit: areaUnit || "m²",
    location,
    physical_condition: physicalCondition,
    operational_status: operationalStatus,
    updated_at: new Date().toISOString(),
  };

  if (physicalCondition) {
    // Hanya perbarui kolom legacy 'condition' jika nilainya 'baik' agar tidak memicu constraint check lama
    if (physicalCondition === "baik") {
      payload.condition = "baik";
    }
  }
  if (operationalStatus) {
    // Enum asset_availability valid: 'tersedia', 'dalam_perawatan', 'sedang_disewa', 'dipesan'
    payload.availability = operationalStatus === "siap" ? "tersedia" : "dalam_perawatan";
  }
  if (dailyRate !== undefined && dailyRate !== null && !isNaN(Number(dailyRate))) {
    payload.daily_rate = Number(dailyRate);
  }

  if (specifications !== undefined) {
    payload.specifications = typeof specifications === "string" ? JSON.parse(specifications || "{}") : specifications;
  }
  if (isActive !== undefined) {
    payload.is_active = Boolean(isActive);
  }

  const { error } = await supabase
    .from("assets")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw new Error(`Gagal memperbarui aset: ${error.message}`);
  }

  // Sinkronisasi tarif harian ke tabel asset_rates jika ada perubahan nominal
  if (dailyRate !== undefined && dailyRate !== null && !isNaN(Number(dailyRate))) {
    try {
      await upsertAssetRate({
        assetId: id,
        ratePeriod: "harian",
        amount: Number(dailyRate),
        effectiveFrom: new Date().toISOString().slice(0, 10),
      });
    } catch (e) {
      console.warn("Catatan sinkronisasi asset_rates:", e?.message);
    }
  }

  return { success: true, id };
}

export async function toggleAssetActive(id, currentStatus) {
  if (!isLiveSupabase()) {
    return { success: true, newStatus: !currentStatus };
  }

  const supabase = await getSupabaseForAdmin();
  const newStatus = !currentStatus;

  const { error } = await supabase
    .from("assets")
    .update({ is_active: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`Gagal mengubah status aktif aset: ${error.message}`);
  }

  return { success: true, newStatus };
}

// Kelola Kategori Aset
export async function getAdminCategories() {
  if (!isLiveSupabase()) {
    return [
      { id: "cat-1", name: "Gedung Pertemuan", description: "Fasilitas auditorium, ballroom, dan serbaguna", is_active: true },
      { id: "cat-2", name: "Tanah", description: "Lahan terbuka dan komersial", is_active: true },
      { id: "cat-3", name: "Ruangan", description: "Ruang rapat dan kantor", is_active: true },
    ];
  }

  const supabase = await getSupabaseForAdmin();
  const { data, error } = await supabase
    .from("asset_categories")
    .select("id, name, description, is_active, created_at")
    .order("name");

  if (error || !data) return [];
  return data;
}

export async function createCategory({ name, description = "" }) {
  if (!name || name.trim().length === 0) {
    throw new Error("Nama kategori wajib diisi.");
  }

  if (!isLiveSupabase()) return { success: true, id: `cat-mock-${Date.now()}` };

  const supabase = await getSupabaseForAdmin();
  const { data, error } = await supabase
    .from("asset_categories")
    .insert({
      name: name.trim(),
      description: description.trim(),
      is_active: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Gagal menambahkan kategori: ${error.message}`);
  return { success: true, id: data.id };
}

// Kelola Tarif Aset
export async function upsertAssetRate({
  assetId,
  ratePeriod,
  amount,
  effectiveFrom,
  effectiveUntil = null,
}) {
  if (!assetId || !ratePeriod || Number(amount) < 0) {
    throw new Error("Data tarif tidak valid.");
  }

  if (!isLiveSupabase()) return { success: true, id: "rate-mock-1" };

  const supabase = await getSupabaseForAdmin();

  // Nonaktifkan tarif lama untuk periode ini jika ada tarif aktif baru
  await supabase
    .from("asset_rates")
    .update({ is_active: false })
    .eq("asset_id", assetId)
    .eq("rate_period", ratePeriod)
    .eq("is_active", true);

  const { data, error } = await supabase
    .from("asset_rates")
    .insert({
      asset_id: assetId,
      rate_period: ratePeriod,
      amount: Number(amount),
      effective_from: effectiveFrom || new Date().toISOString().split("T")[0],
      effective_until: effectiveUntil || null,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Gagal menyimpan tarif: ${error.message}`);

  // Sinkronkan ke kolom assets.daily_rate jika tarif yang diubah adalah tarif harian
  if (ratePeriod === "harian") {
    await supabase
      .from("assets")
      .update({ daily_rate: Number(amount), updated_at: new Date().toISOString() })
      .eq("id", assetId);
  }

  return { success: true, id: data.id };
}

// Kelola Foto Aset
export async function uploadAssetPhotoRecord({
  assetId,
  storagePath,
  altText = "",
  isPrimary = false,
  sortOrder = 0,
}) {
  if (!assetId || !storagePath) throw new Error("Data foto tidak valid.");

  if (!isLiveSupabase()) return { success: true, id: `photo-mock-${Date.now()}` };

  const supabase = await getSupabaseForAdmin();

  if (isPrimary) {
    // Reset foto utama lama
    await supabase
      .from("asset_photos")
      .update({ is_primary: false })
      .eq("asset_id", assetId);
  }

  const { data, error } = await supabase
    .from("asset_photos")
    .insert({
      asset_id: assetId,
      storage_path: storagePath,
      alt_text: altText,
      is_primary: isPrimary,
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Gagal mencatat foto aset: ${error.message}`);
  return { success: true, id: data.id };
}

export async function deleteAssetPhoto(photoId, storagePath) {
  if (!isLiveSupabase()) return { success: true };

  const supabase = await getSupabaseForAdmin();

  // Hapus dari Storage jika ada path
  if (storagePath) {
    try {
      await supabase.storage.from("asset-photos").remove([storagePath]);
    } catch (e) {
      console.warn("Storage photo delete note:", e.message);
    }
  }

  const { error } = await supabase.from("asset_photos").delete().eq("id", photoId);
  if (error) throw new Error(`Gagal menghapus foto aset: ${error.message}`);
  return { success: true };
}

export async function setPrimaryAssetPhoto(assetId, photoId) {
  if (!isLiveSupabase()) return { success: true };

  const supabase = await getSupabaseForAdmin();

  // Set semua foto aset jadi false
  await supabase
    .from("asset_photos")
    .update({ is_primary: false })
    .eq("asset_id", assetId);

  // Set foto target jadi true
  const { error } = await supabase
    .from("asset_photos")
    .update({ is_primary: true })
    .eq("id", photoId);

  if (error) throw new Error(`Gagal menjadikan foto utama: ${error.message}`);
  return { success: true };
}

// =========================================================================
// 4. PERSETUJUAN PENGAJUAN SEWA
// =========================================================================

export async function getAdminRentalApplications({ status = "semua", search = "" } = {}) {
  if (!isLiveSupabase()) {
    return filterMockApplications({ status, search });
  }

  try {
    const supabase = await getSupabaseForAdmin();

    let query = supabase
      .from("rental_transactions")
      .select(`
        id,
        transaction_code,
        status,
        start_date,
        end_date,
        rental_days,
        total_cost,
        purpose,
        submitted_at,
        renter:profiles!rental_transactions_renter_id_fkey(id, full_name, phone),
        items:rental_transaction_items(
          id,
          asset:assets(id, name, asset_code)
        )
      `)
      .order("submitted_at", { ascending: false });

    if (status && status !== "semua") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error || !data) {
      return filterMockApplications({ status, search });
    }

    let results = data.map((tx) => {
      const assetNames = tx.items?.map((i) => i.asset?.name).filter(Boolean).join(", ") || "Aset Pengelola";
      return {
        id: tx.id,
        code: tx.transaction_code,
        status: tx.status,
        renterName: tx.renter?.full_name || "Penyewa",
        phone: tx.renter?.phone || "-",
        assetNames,
        itemCount: tx.items?.length || 1,
        startDate: tx.start_date,
        endDate: tx.end_date,
        rentalDays: tx.rental_days || calculateRentalDays(tx.start_date, tx.end_date),
        totalCost: Number(tx.total_cost) || 0,
        purpose: tx.purpose || "-",
        submittedAt: tx.submitted_at,
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
    console.error("Error getAdminRentalApplications:", err);
    return filterMockApplications({ status, search });
  }
}

export async function getAdminRentalApplicationById(id) {
  if (!isLiveSupabase()) {
    const list = getMockApplicationDetails();
    return list.find((a) => a.id === id || a.code === id) || null;
  }

  try {
    const supabase = await getSupabaseForAdmin();

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
        currency,
        purpose,
        renter_note,
        decision_note,
        payment_due_at,
        submitted_at,
        processed_at,
        renter:profiles!rental_transactions_renter_id_fkey(
          id,
          full_name,
          phone,
          address,
          verifications:user_verifications!user_verifications_user_id_fkey(status, document_type)
        ),
        processor:profiles!rental_transactions_processed_by_fkey(full_name),
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
        history:rental_status_history(
          id,
          old_status,
          new_status,
          change_note,
          changed_at,
          changer:profiles!rental_status_history_changed_by_fkey(full_name)
        ),
        reviews:rental_reviews(
          id,
          decision,
          notes,
          reviewed_at,
          reviewer:profiles(full_name)
        )
      `)
      .or(`id.eq.${id},transaction_code.eq.${id}`)
      .maybeSingle();

    if (error || !data) return null;

    // Check verification status of renter
    const latestVerification = data.renter?.verifications?.[0];
    const isRenterVerified = latestVerification?.status === "disetujui";

    return {
      id: data.id,
      code: data.transaction_code,
      renterId: data.renter_id,
      renterName: data.renter?.full_name || "Penyewa",
      phone: data.renter?.phone || "-",
      address: data.renter?.address || "-",
      isRenterVerified,
      verificationStatus: latestVerification?.status || "belum_verifikasi",
      verificationDoc: latestVerification?.document_type?.toUpperCase() || "-",
      status: data.status,
      startDate: data.start_date,
      endDate: data.end_date,
      rentalDays: data.rental_days || calculateRentalDays(data.start_date, data.end_date),
      subtotal: Number(data.subtotal) || Number(data.total_cost) || 0,
      totalCost: Number(data.total_cost) || 0,
      currency: data.currency || "IDR",
      purpose: data.purpose || "-",
      renterNote: data.renter_note || "-",
      decisionNote: data.decision_note,
      paymentDueAt: data.payment_due_at,
      processorName: data.processor?.full_name,
      processedAt: data.processed_at,
      submittedAt: data.submitted_at,
      items: (data.items || []).map((i) => ({
        id: i.id,
        assetId: i.asset_id,
        assetName: i.asset?.name || "Aset",
        assetCode: i.asset?.asset_code || "-",
        assetCategory: i.asset?.category?.name || "Aset Umum",
        assetLocation: i.asset?.location || "-",
        rateAmount: Number(i.rate_amount_snapshot) || 0,
        ratePeriod: i.rate_period || "harian",
        quantity: i.quantity || 1,
        lineTotal: Number(i.line_total) || 0,
      })),
      history: (data.history || []).map((h) => ({
        id: h.id,
        oldStatus: h.old_status,
        newStatus: h.new_status,
        note: h.change_note,
        changedAt: h.changed_at,
        changerName: h.changer?.full_name || "Sistem",
      })),
      reviews: (data.reviews || []).map((r) => ({
        id: r.id,
        decision: r.decision,
        notes: r.notes,
        reviewedAt: r.reviewed_at,
        reviewerName: r.reviewer?.full_name || "Admin",
      })),
    };
  } catch (err) {
    console.error("Error getAdminRentalApplicationById:", err);
    return null;
  }
}

/**
 * Menyetujui pengajuan sewa:
 * 1. Validasi transaksi & ketersediaan aset (anti double booking).
 * 2. Hitung rentang buffer kalender dari rental_settings.
 * 3. Update rental_transactions -> 'menunggu_pembayaran', set payment_due_at, processed_by.
 * 4. Insert rental_reviews.
 * 5. Insert rental_status_history.
 * 6. Insert asset_booking_blocks untuk tiap aset dalam transaksi (PostgreSQL exclusion constraint aktif).
 */
export async function approveRentalApplication({
  transactionId,
  adminId,
  paymentDueHours = 24,
  note = "Pengajuan sewa telah disetujui. Silakan lanjutkan pembayaran.",
}) {
  if (!isLiveSupabase()) {
    return { success: true, transactionId, status: "disetujui" };
  }

  const supabase = await getSupabaseForAdmin();
  const settings = await getRentalSettings();

  // 1. Ambil detail transaksi & item
  const { data: tx, error: txError } = await supabase
    .from("rental_transactions")
    .select(`
      id,
      transaction_code,
      status,
      renter_id,
      start_date,
      end_date,
      items:rental_transaction_items(id, asset_id)
    `)
    .eq("id", transactionId)
    .single();

  if (txError || !tx) {
    throw new Error(`Transaksi tidak ditemukan: ${txError?.message}`);
  }

  if (tx.status !== "menunggu_persetujuan") {
    throw new Error(`Transaksi tidak dapat disetujui karena berstatus '${tx.status}'.`);
  }

  if (!tx.items || tx.items.length === 0) {
    throw new Error("Transaksi tidak memiliki item aset yang dapat disetujui.");
  }

  // 2. Hitung rentang blocked_period dengan buffer
  const { blockedStartDate, blockedEndDateExclusive } = calculateBlockedRange(
    tx.start_date,
    tx.end_date,
    settings.preparation_before_days,
    settings.preparation_after_days
  );
  const requestedRange = `[${blockedStartDate},${blockedEndDateExclusive})`;

  // 3. Periksa bentrokan blokir aktif (anti double-booking)
  const assetIds = tx.items.map((i) => i.asset_id);
  const { data: conflicts } = await supabase
    .from("asset_booking_blocks")
    .select("id, asset_id")
    .in("asset_id", assetIds)
    .eq("status", "active")
    .filter("blocked_period", "ov", requestedRange);

  if (conflicts && conflicts.length > 0) {
    throw new Error("Konflik jadwal: Salah satu aset telah memiliki blokir aktif pada tanggal tersebut.");
  }

  // 4. Hitung tenggat waktu pembayaran
  const hours = Number(paymentDueHours) > 0 ? Number(paymentDueHours) : Math.round(settings.payment_expiry_minutes / 60);
  const paymentDueAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  const now = new Date().toISOString();


  // 5. Update transaksi status
  const { error: updateError } = await supabase
    .from("rental_transactions")
    .update({
      status: "disetujui",
      decision_note: note,
      processed_by: adminId,
      processed_at: now,
      payment_due_at: paymentDueAt,
      updated_at: now,
    })
    .eq("id", transactionId);

  if (updateError) {
    throw new Error(`Gagal memperbarui transaksi: ${updateError.message}`);
  }

  // Helper: rollback status transaksi ke menunggu_persetujuan jika langkah pasca-update gagal.
  // Dipanggil sebelum throw agar status tidak terjebak di 'disetujui' tanpa data pendukung.
  const rollbackStatus = async (reason) => {
    const { error: rbError } = await supabase
      .from("rental_transactions")
      .update({
        status: "menunggu_persetujuan",
        decision_note: null,
        processed_by: null,
        processed_at: null,
        payment_due_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId);
    if (rbError) {
      console.error(
        `[approveRental] Rollback gagal untuk transaksi ${transactionId}:`,
        rbError.message
      );
    } else {
      console.warn(
        `[approveRental] Status transaksi ${transactionId} dikembalikan ke 'menunggu_persetujuan'. Penyebab: ${reason}`
      );
    }
  };

  // 6. Insert ke rental_reviews
  const { error: reviewError } = await supabase.from("rental_reviews").insert({
    transaction_id: transactionId,
    reviewer_id: adminId,
    decision: "disetujui",
    notes: note,
    reviewed_at: now,
  });

  if (reviewError) {
    await rollbackStatus(`Gagal insert rental_reviews: ${reviewError.message}`);
    throw new Error(`Gagal mencatat keputusan review: ${reviewError.message}`);
  }

  // 7. Insert ke rental_status_history
  const { error: historyError } = await supabase.from("rental_status_history").insert({
    rental_id: transactionId,
    old_status: "menunggu_persetujuan",
    new_status: "disetujui",
    changed_by: adminId,
    change_note: note,
    changed_at: now,
  });

  if (historyError) {
    await rollbackStatus(`Gagal insert rental_status_history: ${historyError.message}`);
    throw new Error(`Gagal mencatat riwayat status: ${historyError.message}`);
  }

  // 8. Buat blokir jadwal pada asset_booking_blocks untuk setiap item aset
  const blocksToInsert = tx.items.map((item) => ({
    rental_item_id: item.id,
    asset_id: item.asset_id,
    blocked_period: requestedRange,
    status: "active",
    expires_at: paymentDueAt,
    created_at: now,
  }));

  const { error: blockError } = await supabase
    .from("asset_booking_blocks")
    .insert(blocksToInsert);

  if (blockError) {
    console.error("Gagal membuat asset_booking_blocks:", blockError.message);
    if (blockError.message.includes("asset_booking_blocks_no_overlap")) {
      // Konflik terdeteksi oleh GiST exclusion constraint (double booking)
      await rollbackStatus(`Double booking terdeteksi oleh constraint: ${blockError.message}`);
      throw new Error("Persetujuan gagal: Terdeteksi double booking pada salah satu aset.");
    }
    // Error lain (RLS, FK, dsb.) — rollback status agar tidak menggantung
    await rollbackStatus(`Error non-overlap saat insert blocks: ${blockError.message}`);
    throw new Error(`Gagal membuat blokir jadwal aset: ${blockError.message}`);
  }

  // 9. Enqueue Web Push Notification ke background worker (asinkron & non-blocking)
  try {
    const { enqueueNotification } = await import("@/lib/push/queue");
    await enqueueNotification({
      userId: tx.renter_id,
      title: "Pengajuan Sewa Disetujui! 🎉",
      message: `Pengajuan sewa ${tx.transaction_code} telah disetujui Admin. Silakan selesaikan pembayaran.`,
      targetUrl: `/penyewa/transaksi/${transactionId}`,
      dedupeKey: `approve-${transactionId}`,
    });
  } catch (pushErr) {
    console.warn("Enqueue push notification error (non-blocking):", pushErr.message);
  }

  return { success: true, transactionId, status: "disetujui", paymentDueAt };
}

/**
 * Menolak pengajuan sewa:
 * 1. Alasan penolakan wajib diisi.
 * 2. Update status -> 'ditolak'.
 * 3. Catat di rental_reviews dan rental_status_history.
 * 4. Lepas booking block jika pernah ada.
 */
export async function rejectRentalApplication({
  transactionId,
  adminId,
  reason,
}) {
  if (!reason || reason.trim().length < 5) {
    throw new Error("Alasan penolakan pengajuan wajib diisi minimal 5 karakter.");
  }

  if (!isLiveSupabase()) {
    return { success: true, transactionId, status: "ditolak" };
  }

  const supabase = await getSupabaseForAdmin();
  const now = new Date().toISOString();

  // Ambil data lama
  const { data: tx } = await supabase
    .from("rental_transactions")
    .select("status, renter_id, transaction_code, items:rental_transaction_items(id)")
    .eq("id", transactionId)
    .single();

  const oldStatus = tx?.status || "menunggu_persetujuan";

  // 1. Update rental_transactions
  const { error: updateError } = await supabase
    .from("rental_transactions")
    .update({
      status: "ditolak",
      decision_note: reason.trim(),
      processed_by: adminId,
      processed_at: now,
      updated_at: now,
    })
    .eq("id", transactionId);

  if (updateError) {
    throw new Error(`Gagal menolak transaksi: ${updateError.message}`);
  }

  // 2. Insert rental_reviews
  await supabase.from("rental_reviews").insert({
    transaction_id: transactionId,
    reviewer_id: adminId,
    decision: "ditolak",
    notes: reason.trim(),
    reviewed_at: now,
  });

  // 3. Insert status history
  await supabase.from("rental_status_history").insert({
    rental_id: transactionId,
    old_status: oldStatus,
    new_status: "ditolak",
    changed_by: adminId,
    change_note: reason.trim(),
    changed_at: now,
  });

  // 4. Release booking blocks jika ada
  if (tx?.items && tx.items.length > 0) {
    const itemIds = tx.items.map((i) => i.id);
    await supabase
      .from("asset_booking_blocks")
      .update({ status: "released", released_at: now })
      .in("rental_item_id", itemIds)
      .eq("status", "active");
  }

  // 5. Enqueue Web Push Notification ke background worker (asinkron & non-blocking)
  if (tx?.renter_id) {
    try {
      const { enqueueNotification } = await import("@/lib/push/queue");
      await enqueueNotification({
        userId: tx.renter_id,
        title: "Pengajuan Sewa Ditolak ⚠️",
        message: `Pengajuan sewa ${tx.transaction_code || ""} ditolak: ${reason.trim()}`,
        targetUrl: `/penyewa/transaksi/${transactionId}`,
        dedupeKey: `reject-${transactionId}`,
      });
    } catch (pushErr) {
      console.warn("Enqueue push notification error (non-blocking):", pushErr.message);
    }
  }

  return { success: true, transactionId, status: "ditolak" };
}

// =========================================================================
// 5. KALENDER OKUPANSI
// =========================================================================

export async function getAdminOccupancyCalendar({ month = null, year = null, assetId = "" } = {}) {
  const currentYear = year ? Number(year) : new Date().getFullYear();
  const currentMonth = month ? Number(month) : new Date().getMonth() + 1; // 1-12

  if (!isLiveSupabase()) {
    return getMockOccupancyCalendar({ month: currentMonth, year: currentYear, assetId });
  }

  try {
    const supabase = await getSupabaseForAdmin();

    // 1. Ambil daftar aset
    let assetsQuery = supabase
      .from("assets")
      .select("id, asset_code, name, operational_status, category:asset_categories(name)")
      .eq("is_active", true);

    if (assetId) {
      assetsQuery = assetsQuery.eq("id", assetId);
    }
    const { data: assetsData } = await assetsQuery;

    // 2. Tentukan rentang tanggal bulan berjalan (inklusif margin)
    const monthStr = String(currentMonth).padStart(2, "0");
    const firstDay = `${currentYear}-${monthStr}-01`;
    const lastDayNum = new Date(currentYear, currentMonth, 0).getDate();
    const lastDay = `${currentYear}-${monthStr}-${String(lastDayNum).padStart(2, "0")}`;
    const searchRange = `[${firstDay},${lastDay}]`;

    // 3. Ambil booking blocks aktif
    let blocksQuery = supabase
      .from("asset_booking_blocks")
      .select(`
        id,
        asset_id,
        blocked_period,
        status,
        expires_at,
        created_at,
        item:rental_transaction_items(
          transaction:rental_transactions(
            id,
            transaction_code,
            status,
            start_date,
            end_date,
            renter:profiles!rental_transactions_renter_id_fkey(full_name)
          )
        )
      `)
      .eq("status", "active");

    if (assetId) {
      blocksQuery = blocksQuery.eq("asset_id", assetId);
    }

    const { data: blocksData, error: blocksError } = await blocksQuery;
    if (blocksError) {
      console.warn("Gagal mengambil occupancy calendar blocks:", blocksError.message);
    }

    // 4. Parse daterange PostgreSQL
    const blocks = (blocksData || []).map((b) => {
      const match = (b.blocked_period || "").match(/\[([0-9-]+),([0-9-]+)\)/);
      const trx = b.item?.transaction;
      return {
        id: b.id,
        assetId: b.asset_id,
        startDate: match ? match[1] : null,
        endDateExclusive: match ? match[2] : null,
        status: b.status,
        transactionCode: trx?.transaction_code || "-",
        transactionStatus: trx?.status || "aktif",
        renterName: trx?.renter?.full_name || "Penyewa",
        rentalStartDate: trx?.start_date,
        rentalEndDate: trx?.end_date,
      };
    });

    return {
      month: currentMonth,
      year: currentYear,
      assets: (assetsData || []).map((a) => ({
        id: a.id,
        code: a.asset_code,
        name: a.name,
        category: a.category?.name || "Aset",
        status: a.operational_status,
      })),
      blocks,
    };
  } catch (err) {
    console.error("Error in getAdminOccupancyCalendar:", err);
    return getMockOccupancyCalendar({ month: currentMonth, year: currentYear, assetId });
  }
}

// =========================================================================
// MOCK DATA FALLBACKS (Untuk ketahanan saat Supabase URL lokal belum aktif)
// =========================================================================

function getMockDashboardStats() {
  return {
    totalAssets: 5,
    activeAssets: 5,
    pendingVerifications: 2,
    pendingRentals: 1,
    activeRentals: 3,
    recentRentals: [
      {
        id: "mock-tx-1",
        code: "SWA-2026-9041",
        status: "menunggu_persetujuan",
        totalCost: 30000000,
        startDate: "2026-11-25",
        endDate: "2026-11-26",
        renterName: "Budi Pratama",
        submittedAt: "2026-11-18T10:15:00Z",
      },
      {
        id: "mock-tx-2",
        code: "SWA-2026-8712",
        status: "menunggu_pembayaran",
        totalCost: 15000000,
        startDate: "2026-11-28",
        endDate: "2026-11-28",
        renterName: "Siti Rahmawati",
        submittedAt: "2026-11-17T14:30:00Z",
      },
      {
        id: "mock-tx-3",
        code: "SWA-2026-7245",
        status: "sedang_disewa",
        totalCost: 45000000,
        startDate: "2026-11-15",
        endDate: "2026-11-17",
        renterName: "PT Sinar Gemilang",
        submittedAt: "2026-11-10T09:00:00Z",
      },
    ],
    recentVerifications: [
      {
        id: "vrf-1",
        documentType: "KTP",
        documentNumber: "3201234567890001",
        status: "menunggu",
        renterName: "Ahmad Fauzi",
        submittedAt: "2026-11-18T08:00:00Z",
      },
      {
        id: "vrf-2",
        documentType: "NIB",
        documentNumber: "9120001234567",
        status: "menunggu",
        renterName: "CV Maju Bersama Mandiri",
        submittedAt: "2026-11-17T16:20:00Z",
      },
    ],
    recentActivity: [
      {
        id: "act-1",
        trxCode: "SWA-2026-9041",
        oldStatus: null,
        newStatus: "menunggu_persetujuan",
        note: "Pengajuan sewa diajukan oleh penyewa.",
        changedAt: "2026-11-18T10:15:00Z",
      },
      {
        id: "act-2",
        trxCode: "SWA-2026-8712",
        oldStatus: "menunggu_persetujuan",
        newStatus: "menunggu_pembayaran",
        note: "Pengajuan disetujui admin.",
        changedAt: "2026-11-17T15:00:00Z",
      },
    ],
  };
}

function getMockVerificationsList() {
  return [
    {
      id: "vrf-1",
      userId: "usr-1",
      renterName: "Ahmad Fauzi",
      phone: "081234567890",
      address: "Jl. Merdeka No. 10, Jakarta Pusat",
      documentType: "KTP",
      documentNumber: "3201234567890001",
      filePath: "/placeholder-ktp.png",
      status: "menunggu",
      rejectionReason: null,
      reviewedAt: null,
      submittedAt: "2026-11-18T08:00:00Z",
    },
    {
      id: "vrf-2",
      userId: "usr-2",
      renterName: "CV Maju Bersama Mandiri (Wakil: Hendra Wijaya)",
      phone: "085678901234",
      address: "Kawasan Industri Pulo Gadung Blok B-4",
      documentType: "NIB",
      documentNumber: "9120001234567",
      filePath: "/placeholder-nib.png",
      status: "menunggu",
      rejectionReason: null,
      reviewedAt: null,
      submittedAt: "2026-11-17T16:20:00Z",
    },
    {
      id: "vrf-3",
      userId: "usr-3",
      renterName: "Budi Pratama",
      phone: "081987654321",
      address: "Jl. Diponegoro No. 25, Bandung",
      documentType: "KTP",
      documentNumber: "3273010203040002",
      filePath: "/placeholder-ktp.png",
      status: "disetujui",
      rejectionReason: null,
      reviewedAt: "2026-11-15T11:00:00Z",
      submittedAt: "2026-11-14T09:30:00Z",
    },
    {
      id: "vrf-4",
      userId: "usr-4",
      renterName: "Ratna Sari",
      phone: "082111223344",
      address: "Jl. Melati No. 8, Surabaya",
      documentType: "NPWP",
      documentNumber: "09.123.456.7-890.000",
      filePath: "/placeholder-npwp.png",
      status: "ditolak",
      rejectionReason: "Foto dokumen buram dan tidak terbaca jelas. Mohon unggah ulang.",
      reviewedAt: "2026-11-16T13:45:00Z",
      submittedAt: "2026-11-16T10:00:00Z",
    },
  ];
}

function filterMockVerifications({ status, search }) {
  let list = getMockVerificationsList();
  if (status && status !== "semua") {
    list = list.filter((v) => v.status === status);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(
      (v) =>
        v.renterName.toLowerCase().includes(s) ||
        v.documentNumber.toLowerCase().includes(s)
    );
  }
  return list;
}

function getMockAssetsWithDetail() {
  return [
    {
      id: "ast-001",
      code: "AST-001",
      name: "Gedung Pertemuan Graha Utama",
      description: "Gedung pertemuan representatif dengan kapasitas hingga 1.000 orang.",
      categoryId: "cat-1",
      categoryName: "Gedung Pertemuan",
      areaSize: 1200,
      areaUnit: "m²",
      location: "Jl. Sudirman No. 45, Kompleks Pengelola Pusat",
      specifications: {
        kapasitas: "1.000 orang",
        dayaListrik: "50.000 Watt",
        fasilitas: ["Panggung 12x6m", "AC Sentral", "Ruang Rias VIP"],
      },
      physicalCondition: "baik",
      operationalStatus: "siap",
      isActive: true,
      dailyRate: 15000000,
      rates: [
        { id: "r1", ratePeriod: "harian", amount: 15000000, effectiveFrom: "2026-01-01", effectiveUntil: null, isActive: true },
        { id: "r2", ratePeriod: "bulanan", amount: 350000000, effectiveFrom: "2026-01-01", effectiveUntil: null, isActive: true },
      ],
      photos: [
        { id: "p1", storagePath: "/assets/gedung-1.jpg", url: "/assets/gedung-1.jpg", altText: "Graha Utama", isPrimary: true, sortOrder: 0 },
      ],
    },
    {
      id: "ast-002",
      code: "AST-002",
      name: "Lahan Tanah Komersial Timur",
      description: "Lahan tanah terbuka berkontur datar siap pakai untuk pameran outdoor.",
      categoryId: "cat-2",
      categoryName: "Tanah",
      areaSize: 3500,
      areaUnit: "m²",
      location: "Kawasan Bisnis Sektor Timur Blok C",
      specifications: { aksesibilitas: "Jalan 8 meter", kondisiLahan: "Tanah padat" },
      physicalCondition: "baik",
      operationalStatus: "siap",
      isActive: true,
      dailyRate: 5000000,
      rates: [
        { id: "r3", ratePeriod: "harian", amount: 5000000, effectiveFrom: "2026-01-01", effectiveUntil: null, isActive: true },
      ],
      photos: [
        { id: "p2", storagePath: "/assets/tanah-1.jpg", url: "/assets/tanah-1.jpg", altText: "Tanah Timur", isPrimary: true, sortOrder: 0 },
      ],
    },
  ];
}

function filterMockAdminAssets({ categoryId, operationalStatus, search }) {
  let list = getMockAssetsWithDetail();
  if (categoryId) {
    list = list.filter((a) => a.categoryId === categoryId);
  }
  if (operationalStatus) {
    list = list.filter((a) => a.operationalStatus === operationalStatus);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter((a) => a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s));
  }
  return list;
}

function getMockApplicationDetails() {
  return [
    {
      id: "mock-tx-1",
      code: "SWA-2026-9041",
      renterId: "usr-3",
      renterName: "Budi Pratama",
      phone: "081987654321",
      address: "Jl. Diponegoro No. 25, Bandung",
      isRenterVerified: true,
      verificationStatus: "disetujui",
      verificationDoc: "KTP",
      status: "menunggu_persetujuan",
      startDate: "2026-11-25",
      endDate: "2026-11-26",
      rentalDays: 2,
      subtotal: 30000000,
      totalCost: 30000000,
      currency: "IDR",
      purpose: "Penyelenggaraan Expo UMKM Kreatif Tingkat Provinsi",
      renterNote: "Mohon izin loading barang 1 hari sebelum acara dimulai.",
      decisionNote: null,
      paymentDueAt: null,
      processorName: null,
      processedAt: null,
      submittedAt: "2026-11-18T10:15:00Z",
      items: [
        {
          id: "item-1",
          assetId: "ast-001",
          assetName: "Gedung Pertemuan Graha Utama",
          assetCode: "AST-001",
          assetCategory: "Gedung Pertemuan",
          assetLocation: "Jl. Sudirman No. 45, Kompleks Pengelola Pusat",
          rateAmount: 15000000,
          ratePeriod: "harian",
          quantity: 1,
          lineTotal: 30000000,
        },
      ],
      history: [
        {
          id: "h-1",
          oldStatus: null,
          newStatus: "menunggu_persetujuan",
          note: "Pengajuan sewa dibuat oleh penyewa.",
          changedAt: "2026-11-18T10:15:00Z",
          changerName: "Budi Pratama",
        },
      ],
      reviews: [],
    },
  ];
}

function filterMockApplications({ status, search }) {
  let list = getMockApplicationDetails();
  if (status && status !== "semua") {
    list = list.filter((a) => a.status === status);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter((a) => a.code.toLowerCase().includes(s) || a.renterName.toLowerCase().includes(s));
  }
  return list;
}

function getMockOccupancyCalendar({ month, year, assetId }) {
  const assets = [
    { id: "ast-001", code: "AST-001", name: "Gedung Pertemuan Graha Utama", category: "Gedung Pertemuan", status: "siap" },
    { id: "ast-002", code: "AST-002", name: "Lahan Tanah Komersial Timur", category: "Tanah", status: "siap" },
    { id: "ast-003", code: "AST-003", name: "Ruang Rapat VIP Adyatma", category: "Ruangan", status: "siap" },
    { id: "ast-004", code: "AST-004", name: "Auditorium Cendekia", category: "Ruangan", status: "siap" },
    { id: "ast-005", code: "AST-005", name: "Lahan Terbuka Parkir & Ekshibisi Selatan", category: "Tanah", status: "siap" },
  ];

  const filteredAssets = assetId ? assets.filter((a) => a.id === assetId) : assets;

  // Mock blokir kalender aktif
  const blocks = [
    {
      id: "blk-1",
      assetId: "ast-001",
      startDate: "2026-11-14",
      endDateExclusive: "2026-11-19",
      status: "active",
      transactionCode: "SWA-2026-7245",
      transactionStatus: "sedang_disewa",
      renterName: "PT Sinar Gemilang",
      rentalStartDate: "2026-11-15",
      rentalEndDate: "2026-11-17",
    },
    {
      id: "blk-2",
      assetId: "ast-003",
      startDate: "2026-11-20",
      endDateExclusive: "2026-11-23",
      status: "active",
      transactionCode: "SWA-2026-8712",
      transactionStatus: "menunggu_pembayaran",
      renterName: "Siti Rahmawati",
      rentalStartDate: "2026-11-21",
      rentalEndDate: "2026-11-21",
    },
  ];

  return {
    month,
    year,
    assets: filteredAssets,
    blocks: assetId ? blocks.filter((b) => b.assetId === assetId) : blocks,
  };
}
