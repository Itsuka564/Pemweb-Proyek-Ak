"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createAsset,
  updateAsset,
  toggleAssetActive,
  createCategory,
  upsertAssetRate,
  uploadAssetPhotoRecord,
  deleteAssetPhoto,
  setPrimaryAssetPhoto,
} from "@/lib/db/admin";

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
    throw new Error("Hanya Administrator yang memiliki wewenang mengelola data aset.");
  }

  return user.id;
}

export async function createAssetAction(prevState, formData) {
  try {
    const adminId = await verifyAdminRole();

    const assetCode = formData.get("assetCode");
    const categoryId = formData.get("categoryId");
    const name = formData.get("name");
    const description = formData.get("description") || "";
    const areaSize = formData.get("areaSize");
    const areaUnit = formData.get("areaUnit") || "m²";
    const location = formData.get("location") || "";
    const physicalCondition = formData.get("physicalCondition") || "baik";
    const operationalStatus = formData.get("operationalStatus") || "siap";
    const specsRaw = formData.get("specifications") || "{}";

    const dailyRate = formData.get("dailyRate");
    const monthlyRate = formData.get("monthlyRate");
    const yearlyRate = formData.get("yearlyRate");

    let specifications = {};
    try {
      specifications = JSON.parse(specsRaw);
    } catch {
      specifications = { deskripsiUmum: specsRaw };
    }

    const initialRates = {
      harian: dailyRate ? Number(dailyRate) : 0,
      bulanan: monthlyRate ? Number(monthlyRate) : 0,
      tahunan: yearlyRate ? Number(yearlyRate) : 0,
    };

    const result = await createAsset({
      assetCode,
      categoryId,
      name,
      description,
      areaSize,
      areaUnit,
      location,
      physicalCondition,
      operationalStatus,
      specifications,
      initialRates,
    });

    revalidatePath("/admin/aset");
    revalidatePath("/katalog");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      assetId: result.id,
      message: "Data aset baru berhasil disimpan.",
    };
  } catch (err) {
    return { error: err.message || "Gagal menambahkan data aset." };
  }
}

export async function updateAssetAction(prevState, formData) {
  try {
    await verifyAdminRole();

    const id = formData.get("id");
    const categoryId = formData.get("categoryId");
    const name = formData.get("name");
    const description = formData.get("description") || "";
    const dailyRate = formData.get("dailyRate");
    const areaSize = formData.get("areaSize");
    const areaUnit = formData.get("areaUnit") || "m²";
    const location = formData.get("location") || "";
    const physicalCondition = formData.get("physicalCondition") || "baik";
    const operationalStatus = formData.get("operationalStatus") || "siap";
    const specsRaw = formData.get("specifications") || "{}";

    let specifications = {};
    try {
      specifications = JSON.parse(specsRaw);
    } catch {
      specifications = { deskripsiUmum: specsRaw };
    }

    await updateAsset(id, {
      name,
      description,
      categoryId,
      dailyRate: dailyRate !== null && dailyRate !== "" ? Number(dailyRate) : undefined,
      areaSize,
      areaUnit,
      location,
      physicalCondition,
      operationalStatus,
      specifications,
    });

    revalidatePath("/admin/aset");
    revalidatePath(`/admin/aset/${id}`);
    revalidatePath(`/katalog/${id}`);

    return {
      success: true,
      message: "Informasi aset berhasil diperbarui.",
    };
  } catch (err) {
    return { error: err.message || "Gagal memperbarui data aset." };
  }
}

export async function toggleAssetActiveAction(id, currentStatus) {
  try {
    await verifyAdminRole();
    await toggleAssetActive(id, currentStatus);
    revalidatePath("/admin/aset");
    revalidatePath("/katalog");
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function createCategoryAction(prevState, formData) {
  try {
    await verifyAdminRole();

    const name = formData.get("name");
    const description = formData.get("description") || "";

    await createCategory({ name, description });

    revalidatePath("/admin/aset");
    revalidatePath("/admin/aset/kategori");
    revalidatePath("/katalog");

    return {
      success: true,
      message: "Kategori aset berhasil ditambahkan.",
    };
  } catch (err) {
    return { error: err.message || "Gagal menambahkan kategori." };
  }
}

export async function addAssetRateAction(prevState, formData) {
  try {
    await verifyAdminRole();

    const assetId = formData.get("assetId");
    const ratePeriod = formData.get("ratePeriod");
    const amount = formData.get("amount");
    const effectiveFrom = formData.get("effectiveFrom");
    const effectiveUntil = formData.get("effectiveUntil") || null;

    await upsertAssetRate({
      assetId,
      ratePeriod,
      amount,
      effectiveFrom,
      effectiveUntil,
    });

    revalidatePath(`/admin/aset/${assetId}`);
    revalidatePath("/admin/aset");
    revalidatePath(`/katalog/${assetId}`);

    return {
      success: true,
      message: `Tarif periode '${ratePeriod}' berhasil diperbarui.`,
    };
  } catch (err) {
    return { error: err.message || "Gagal menyimpan tarif aset." };
  }
}

export async function uploadAssetPhotoAction(prevState, formData) {
  try {
    await verifyAdminRole();

    const assetId = formData.get("assetId");
    const altText = formData.get("altText") || "";
    const isPrimary = formData.get("isPrimary") === "true";
    const file = formData.get("photo");

    if (!file || file.size === 0) {
      return { error: "Pilih file foto aset yang ingin diunggah." };
    }

    if (!file.type.startsWith("image/")) {
      return { error: "File harus berupa format gambar (JPG, PNG, WebP)." };
    }

    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createAdminClient()
      : await createClient();
    const fileExt = file.name.split(".").pop();
    const fileName = `${assetId}/${Date.now()}_photo.${fileExt}`;

    // Upload ke bucket 'asset-photos'
    const { error: uploadError } = await supabase.storage
      .from("asset-photos")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.warn("Storage upload note:", uploadError.message);
    }

    await uploadAssetPhotoRecord({
      assetId,
      storagePath: fileName,
      altText,
      isPrimary,
    });

    revalidatePath(`/admin/aset/${assetId}`);
    revalidatePath("/admin/aset");
    revalidatePath(`/katalog/${assetId}`);

    return {
      success: true,
      message: "Foto aset berhasil diunggah.",
    };
  } catch (err) {
    return { error: err.message || "Gagal mengunggah foto aset." };
  }
}

export async function deleteAssetPhotoAction(assetId, photoId, storagePath) {
  try {
    await verifyAdminRole();
    await deleteAssetPhoto(photoId, storagePath);
    revalidatePath(`/admin/aset/${assetId}`);
    revalidatePath(`/katalog/${assetId}`);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function setPrimaryPhotoAction(assetId, photoId) {
  try {
    await verifyAdminRole();
    await setPrimaryAssetPhoto(assetId, photoId);
    revalidatePath(`/admin/aset/${assetId}`);
    revalidatePath("/admin/aset");
    revalidatePath(`/katalog/${assetId}`);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}
