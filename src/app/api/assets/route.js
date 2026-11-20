
console.log(
  "SUPABASE URL:",
  !!process.env.NEXT_PUBLIC_SUPABASE_URL
);

console.log(
  "SUPABASE KEY:",
  !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET: Mengambil daftar aset
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("assets")
      .select(`
        *,
        asset_categories (
          name
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Data aset berhasil diambil",
      data,
    });
  } catch (error) {
  console.error("ERROR API ASSETS:", error);

  return NextResponse.json(
    {
      success: false,
      message: error.message,
    },
    { status: 500 }
  );
 }
}

// POST: Menambahkan aset baru (khusus Admin)
export async function POST(request) {
  try {
    const supabase = await createClient();

    // Periksa identitas pengguna
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

    // Periksa role pengguna
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

    const body = await request.json();

    const {
      asset_code,
      category_id,
      name,
      description,
      specifications,
      photo_urls,
      condition,
      availability,
      daily_rate,
    } = body;

    // Validasi input wajib
    if (
      typeof asset_code !== "string" ||
      !asset_code.trim() ||
      typeof name !== "string" ||
      !name.trim() ||
      typeof category_id !== "string" ||
      !category_id.trim() ||
      daily_rate === undefined ||
      daily_rate === null ||
      daily_rate === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Kode, kategori, nama, dan tarif harian wajib diisi",
        },
        { status: 400 }
      );
    }

    const rate = Number(daily_rate);

    if (!Number.isFinite(rate) || rate < 0) {
      return NextResponse.json(
        { success: false, message: "Tarif harian tidak valid" },
        { status: 400 }
      );
    }

    const validConditions = ["baik", "perlu_pemeriksaan", "rusak"];
    const validAvailability = [
      "tersedia",
      "dipesan",
      "sedang_disewa",
      "dalam_perawatan",
    ];

    const assetCondition = condition ?? "baik";
    const assetAvailability = availability ?? "tersedia";

    if (
      !validConditions.includes(assetCondition) ||
      !validAvailability.includes(assetAvailability)
    ) {
      return NextResponse.json(
        { success: false, message: "Kondisi atau ketersediaan tidak valid" },
        { status: 400 }
      );
    }

    if (
      ["rusak", "perlu_pemeriksaan"].includes(assetCondition) &&
      ["tersedia", "dipesan"].includes(assetAvailability)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Aset dengan kondisi tersebut tidak dapat berstatus tersedia atau dipesan",
        },
        { status: 400 }
      );
    }

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

    // Simpan aset ke database
    const { data, error } = await supabase
      .from("assets")
      .insert({
        asset_code: asset_code.trim(),
        category_id,
        name: name.trim(),
        description: description ?? null,
        specifications: specifications ?? {},
        photo_urls: photo_urls ?? [],
        condition: assetCondition,
        availability: assetAvailability,
        daily_rate: rate,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Aset berhasil ditambahkan",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
  console.error("ERROR API ASSETS:", error);

  return NextResponse.json(
    {
      success: false,
      message: error.message,
    },
    { status: 500 }
  );
 }
}
