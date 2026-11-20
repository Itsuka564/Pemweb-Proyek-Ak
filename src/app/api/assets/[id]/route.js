
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET: Mengambil detail aset berdasarkan ID
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from("assets")
      .select(`
        *,
        asset_categories (
          name
        )
      `)
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            message: "Aset tidak ditemukan",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Detail aset berhasil diambil",
      data,
    });
  } catch (error) {
    console.error("ERROR API ASSET DETAIL:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}


// ============================================================
// PATCH: Mengedit data aset berdasarkan ID (khusus Admin)
// ============================================================
export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // ──────────────────────────────────────────────
    // Langkah 1: Cek apakah pengguna sudah login
    // ──────────────────────────────────────────────
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    // ──────────────────────────────────────────────
    // Langkah 2: Cek apakah pengguna adalah Admin aktif
    // ──────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile ||
      profile.role !== "admin" ||
      !profile.is_active
    ) {
      return NextResponse.json(
        { success: false, message: "Akses hanya untuk Admin" },
        { status: 403 }
      );
    }

    // ──────────────────────────────────────────────
    // Langkah 3: Ambil body request dan pastikan
    //            ada minimal 1 field yang diubah
    // ──────────────────────────────────────────────
    const body = await request.json();

    const {
      name,
      category_id,
      description,
      specifications,
      photo_urls,
      condition,
      availability,
      daily_rate,
    } = body;

    // Daftar field yang boleh diubah (asset_code TIDAK boleh)
    const allowedFields = [
      "name",
      "category_id",
      "description",
      "specifications",
      "photo_urls",
      "condition",
      "availability",
      "daily_rate",
    ];

    const hasUpdate = allowedFields.some((field) => body[field] !== undefined);

    if (!hasUpdate) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimal satu field harus diisi untuk update",
        },
        { status: 400 }
      );
    }

    // ──────────────────────────────────────────────
    // Langkah 4: Cek aset ada dan masih aktif
    // ──────────────────────────────────────────────
    const { data: existingAsset, error: assetError } = await supabase
      .from("assets")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (assetError || !existingAsset) {
      return NextResponse.json(
        {
          success: false,
          message: "Aset tidak ditemukan atau sudah nonaktif",
        },
        { status: 404 }
      );
    }

    // ──────────────────────────────────────────────
    // Langkah 5: Validasi category_id — kategori
    //            harus ada dan masih aktif
    // ──────────────────────────────────────────────
    if (category_id !== undefined) {
      if (typeof category_id !== "string" || !category_id.trim()) {
        return NextResponse.json(
          { success: false, message: "category_id harus berupa string yang valid" },
          { status: 400 }
        );
      }

      const { data: category, error: catError } = await supabase
        .from("asset_categories")
        .select("id, is_active")
        .eq("id", category_id)
        .single();

      if (catError || !category) {
        return NextResponse.json(
          { success: false, message: "Kategori tidak ditemukan" },
          { status: 400 }
        );
      }

      if (!category.is_active) {
        return NextResponse.json(
          { success: false, message: "Kategori sudah tidak aktif" },
          { status: 400 }
        );
      }
    }

    // ──────────────────────────────────────────────
    // Langkah 6: Validasi name (jika dikirim)
    // ──────────────────────────────────────────────
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { success: false, message: "Nama aset tidak boleh kosong" },
          { status: 400 }
        );
      }
    }

    // ──────────────────────────────────────────────
    // Langkah 7: Validasi daily_rate (jika dikirim)
    // ──────────────────────────────────────────────
    if (daily_rate !== undefined) {
      const rate = Number(daily_rate);

      if (!Number.isFinite(rate) || rate < 0) {
        return NextResponse.json(
          { success: false, message: "Tarif harian tidak valid" },
          { status: 400 }
        );
      }
    }

    // ──────────────────────────────────────────────
    // Langkah 8: Validasi condition & availability
    //            (sama persis dengan POST)
    // ──────────────────────────────────────────────
    const validConditions = ["baik", "perlu_pemeriksaan", "rusak"];
    const validAvailability = [
      "tersedia",
      "dipesan",
      "sedang_disewa",
      "dalam_perawatan",
    ];

    if (condition !== undefined && !validConditions.includes(condition)) {
      return NextResponse.json(
        { success: false, message: "Kondisi tidak valid" },
        { status: 400 }
      );
    }

    if (availability !== undefined && !validAvailability.includes(availability)) {
      return NextResponse.json(
        { success: false, message: "Ketersediaan tidak valid" },
        { status: 400 }
      );
    }

    // Gabungkan nilai baru dengan nilai lama untuk cek aturan bisnis:
    // Aset rusak/perlu_pemeriksaan TIDAK BOLEH berstatus tersedia/dipesan
    const finalCondition = condition ?? existingAsset.condition;
    const finalAvailability = availability ?? existingAsset.availability;

    if (
      ["rusak", "perlu_pemeriksaan"].includes(finalCondition) &&
      ["tersedia", "dipesan"].includes(finalAvailability)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Aset dengan kondisi tersebut tidak dapat berstatus tersedia atau dipesan",
        },
        { status: 400 }
      );
    }

    // ──────────────────────────────────────────────
    // Langkah 9: Cek transaksi penyewaan aktif
    //            sebelum mengubah condition/availability
    // ──────────────────────────────────────────────
    if (condition !== undefined || availability !== undefined) {
      const { data: activeRentals, error: rentalError } = await supabase
        .from("rental_transactions")
        .select("id, status")
        .eq("asset_id", id)
        .in("status", ["disetujui", "sedang_disewa"]);

      if (rentalError) {
        return NextResponse.json(
          { success: false, message: "Gagal memeriksa transaksi penyewaan" },
          { status: 500 }
        );
      }

      if (activeRentals && activeRentals.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Tidak dapat mengubah kondisi atau ketersediaan karena aset sedang dalam transaksi penyewaan aktif",
          },
          { status: 409 }
        );
      }
    }

    // ──────────────────────────────────────────────
    // Langkah 10: Validasi specifications (jika dikirim)
    // ──────────────────────────────────────────────
    if (
      specifications !== undefined &&
      (specifications === null ||
        typeof specifications !== "object" ||
        Array.isArray(specifications))
    ) {
      return NextResponse.json(
        { success: false, message: "Spesifikasi harus berupa object" },
        { status: 400 }
      );
    }

    // ──────────────────────────────────────────────
    // Langkah 11: Validasi photo_urls (jika dikirim)
    // ──────────────────────────────────────────────
    if (
      photo_urls !== undefined &&
      (!Array.isArray(photo_urls) ||
        !photo_urls.every((url) => typeof url === "string"))
    ) {
      return NextResponse.json(
        { success: false, message: "photo_urls harus berupa array teks" },
        { status: 400 }
      );
    }

    // ──────────────────────────────────────────────
    // Langkah 12: Bangun object update — hanya
    //             field yang dikirim yang dimasukkan
    // ──────────────────────────────────────────────
    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (category_id !== undefined) updateData.category_id = category_id;
    if (description !== undefined) updateData.description = description;
    if (specifications !== undefined) updateData.specifications = specifications;
    if (photo_urls !== undefined) updateData.photo_urls = photo_urls;
    if (condition !== undefined) updateData.condition = condition;
    if (availability !== undefined) updateData.availability = availability;
    if (daily_rate !== undefined) updateData.daily_rate = Number(daily_rate);

    // ──────────────────────────────────────────────
    // Langkah 13: Eksekusi update ke Supabase
    // ──────────────────────────────────────────────
    const { data, error } = await supabase
      .from("assets")
      .update(updateData)
      .eq("id", id)
      .eq("is_active", true)
      .select(
        `
        *,
        asset_categories (
          name
        )
      `
      )
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Aset berhasil diperbarui",
      data,
    });
  } catch (error) {
    console.error("ERROR API ASSET PATCH:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE: Menonaktifkan aset / soft delete (khusus Admin)
// ============================================================
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // ──────────────────────────────────────────────
    // Langkah 1: Cek apakah pengguna sudah login
    // ──────────────────────────────────────────────
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    // ──────────────────────────────────────────────
    // Langkah 2: Cek apakah pengguna adalah Admin aktif
    // ──────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile ||
      profile.role !== "admin" ||
      !profile.is_active
    ) {
      return NextResponse.json(
        { success: false, message: "Akses hanya untuk Admin" },
        { status: 403 }
      );
    }

    // ──────────────────────────────────────────────
    // Langkah 3: Cek aset ada dan masih aktif
    // ──────────────────────────────────────────────
    const { data: existingAsset, error: assetError } = await supabase
      .from("assets")
      .select("id, name, is_active")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (assetError || !existingAsset) {
      return NextResponse.json(
        {
          success: false,
          message: "Aset tidak ditemukan atau sudah nonaktif",
        },
        { status: 404 }
      );
    }

    // ──────────────────────────────────────────────
    // Langkah 4: Cek transaksi penyewaan aktif —
    //            aset yang sedang disewa tidak boleh
    //            dinonaktifkan
    // ──────────────────────────────────────────────
    const { data: activeRentals, error: rentalError } = await supabase
      .from("rental_transactions")
      .select("id, status")
      .eq("asset_id", id)
      .in("status", ["disetujui", "sedang_disewa"]);

    if (rentalError) {
      return NextResponse.json(
        { success: false, message: "Gagal memeriksa transaksi penyewaan" },
        { status: 500 }
      );
    }

    if (activeRentals && activeRentals.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tidak dapat menonaktifkan aset karena masih memiliki transaksi penyewaan aktif",
        },
        { status: 409 }
      );
    }

    // ──────────────────────────────────────────────
    // Langkah 5: Soft delete — set is_active = false
    //            Data TIDAK dihapus dari database
    // ──────────────────────────────────────────────
    const { data, error } = await supabase
      .from("assets")
      .update({ is_active: false })
      .eq("id", id)
      .select("id, name")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Aset "${data.name}" berhasil dinonaktifkan`,
      data,
    });
  } catch (error) {
    console.error("ERROR API ASSET DELETE:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
