import { createClient, createServiceClient } from "@/lib/supabase/server";

// Ambil daftar aset dengan filter pencarian, kategori, lokasi, dan harga
// Menggunakan service client agar RLS tidak memblokir query katalog publik.
export async function getAssets({
  search = "",
  categoryId = "",
  location = "",
  minPrice = 0,
  maxPrice = 0,
  operationalStatus = "siap",
} = {}) {
  const isLiveDb =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id");

  if (!isLiveDb) {
    return filterMockAssets({ search, categoryId, location, minPrice, maxPrice });
  }

  try {
    // Gunakan service client agar RLS tidak memblokir pembaca yang belum login.
    // Tabel katalog (assets, asset_rates, asset_photos) bersifat publik read-only.
    const supabase = createServiceClient();

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
        rates:asset_rates(id, amount, rate_period, is_active),
        photos:asset_photos(storage_path, is_primary, sort_order)
      `)
      .eq("operational_status", operationalStatus)
      .eq("is_active", true);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (location) {
      query = query.ilike("location", `%${location}%`);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,asset_code.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("getAssets error:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    let results = data.map(formatAssetRow);

    if (minPrice > 0) {
      results = results.filter((a) => a.dailyRate >= minPrice);
    }
    if (maxPrice > 0) {
      results = results.filter((a) => a.dailyRate <= maxPrice);
    }

    return results;
  } catch (err) {
    console.error("getAssets exception:", err);
    return [];
  }
}

// Ambil daftar aset populer untuk beranda
export async function getPopularAssets(limit = 3) {
  const assets = await getAssets();
  return assets.slice(0, limit);
}

// Ambil detail aset tunggal berdasarkan ID atau Kode
// Menggunakan service client agar halaman detail aset bisa diakses publik.
export async function getAssetById(id) {
  const isLiveDb =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id");

  if (!isLiveDb) {
    const mock = getMockAssetsList().find((a) => a.id === id || a.code === id);
    return mock || null;
  }

  try {
    const supabase = createServiceClient();

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
        category:asset_categories(id, name, description),
        rates:asset_rates(id, amount, rate_period, is_active, effective_from, effective_until),
        photos:asset_photos(id, storage_path, alt_text, is_primary, sort_order)
      `)
      .or(`id.eq.${id},asset_code.eq.${id}`)
      .maybeSingle();

    if (error || !data) {
      console.error("getAssetById error:", error?.message, "id:", id);
      return null;
    }

    return formatAssetDetailRow(data);
  } catch (err) {
    console.error("getAssetById exception:", err);
    return null;
  }
}

// Ambil semua kategori aset yang aktif
export async function getAssetCategories() {
  const isLiveDb =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id");

  if (!isLiveDb) {
    return getMockCategories();
  }

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("asset_categories")
      .select("id, name, description")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("getAssetCategories error:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("getAssetCategories exception:", err);
    return [];
  }
}

// Ambil blok jadwal yang sedang aktif untuk sebuah aset
export async function getAssetBookingBlocks(assetId) {
  const isLiveDb =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id");

  if (!isLiveDb) {
    return getMockBookingBlocks(assetId);
  }

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("asset_booking_blocks")
      .select("id, asset_id, blocked_period, status, expires_at, created_at")
      .eq("asset_id", assetId)
      .eq("status", "active");

    if (error) {
      console.error("getAssetBookingBlocks error:", error.message);
      return [];
    }

    if (!data) return [];

    // Format parse daterange PostgreSQL e.g. "[2026-11-10,2026-11-14)"
    return data.map((b) => {
      const periodStr = b.blocked_period || "";
      const matches = periodStr.match(/\[([0-9-]+),([0-9-]+)\)/);
      if (matches) {
        return {
          id: b.id,
          startDate: matches[1],
          endDateExclusive: matches[2],
          status: b.status,
        };
      }
      return {
        id: b.id,
        rawPeriod: b.blocked_period,
        status: b.status,
      };
    });
  } catch (err) {
    console.error("getAssetBookingBlocks exception:", err);
    return [];
  }
}

// Helpers
const SUPABASE_STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

/** Konversi storage_path dari asset_photos ke URL publik Supabase Storage */
function toPhotoUrl(storagePath) {
  if (!storagePath) return null;
  if (storagePath.startsWith("http")) return storagePath;
  return `${SUPABASE_STORAGE_URL}/asset-photos/${storagePath}`;
}

function formatAssetRow(asset) {
  const activeRate = asset.rates?.find((r) => r.rate_period === "harian" && r.is_active)?.amount || 100000;
  const primaryStoragePath =
    asset.photos?.find((p) => p.is_primary)?.storage_path ||
    asset.photos?.[0]?.storage_path ||
    null;

  return {
    id: asset.id,
    code: asset.asset_code,
    name: asset.name,
    category: asset.category?.name || "Aset Umum",
    categoryId: asset.category?.id || "",
    areaSize: asset.area_size,
    areaUnit: asset.area_unit || "m²",
    location: asset.location || "Lokasi Pengelola",
    dailyRate: Number(activeRate),
    condition: asset.physical_condition || "baik",
    status: asset.operational_status || "siap",
    photo: toPhotoUrl(primaryStoragePath),
    photos: (asset.photos || []).map((p) => ({
      ...p,
      url: toPhotoUrl(p.storage_path),
    })),
  };
}

function formatAssetDetailRow(asset) {
  const rates = asset.rates || [];
  const dailyRate = rates.find((r) => r.rate_period === "harian" && r.is_active)?.amount || 100000;
  const monthlyRate = rates.find((r) => r.rate_period === "bulanan" && r.is_active)?.amount || null;
  const yearlyRate = rates.find((r) => r.rate_period === "tahunan" && r.is_active)?.amount || null;

  return {
    id: asset.id,
    code: asset.asset_code,
    name: asset.name,
    description: asset.description,
    category: asset.category?.name || "Aset Umum",
    categoryId: asset.category?.id || "",
    categoryDescription: asset.category?.description || "",
    areaSize: asset.area_size,
    areaUnit: asset.area_unit || "m²",
    location: asset.location || "Lokasi Pengelola",
    specifications: asset.specifications || {},
    condition: asset.physical_condition || "baik",
    status: asset.operational_status || "siap",
    dailyRate: Number(dailyRate),
    monthlyRate: monthlyRate ? Number(monthlyRate) : null,
    yearlyRate: yearlyRate ? Number(yearlyRate) : null,
    rates: rates,
    photos: (asset.photos || []).map((p) => ({
      ...p,
      url: toPhotoUrl(p.storage_path),
    })),
  };
}

// MOCK DATA DOMAIN TANAH, GEDUNG, RUANGAN (Untuk fallback bila DB live belum dihubungkan)
function getMockCategories() {
  return [
    { id: "cat-1", name: "Gedung Pertemuan", description: "Fasilitas auditorium, ballroom, dan gedung serbaguna" },
    { id: "cat-2", name: "Tanah", description: "Lahan terbuka, kavling komersial, dan area outdoor" },
    { id: "cat-3", name: "Ruangan", description: "Ruang rapat, seminar room, dan ruang kantor representatif" },
  ];
}

function getMockAssetsList() {
  return [
    {
      id: "ast-001",
      code: "AST-001",
      name: "Gedung Pertemuan Graha Utama",
      description: "Gedung pertemuan representatif dengan kapasitas hingga 1.000 orang. Dilengkapi panggung utama, pendingin ruangan sentral, dan sistem akustik modern.",
      category: "Gedung Pertemuan",
      categoryId: "cat-1",
      areaSize: 1200,
      areaUnit: "m²",
      location: "Jl. Sudirman No. 45, Kompleks Pengelola Pusat",
      specifications: {
        kapasitas: "1.000 orang",
        dayaListrik: "50.000 Watt",
        fasilitas: ["Panggung 12x6m", "AC Sentral", "Ruang Rias VIP", "Sound System 10.000W", "Parkir 200 Mobil"],
      },
      condition: "baik",
      status: "siap",
      dailyRate: 15000000,
      monthlyRate: 350000000,
      yearlyRate: null,
      icon: "🏢",
      photos: [
        { id: "p1", storage_path: "/assets/gedung-1.jpg", alt_text: "Tampak Depan Graha Utama", is_primary: true },
        { id: "p2", storage_path: "/assets/gedung-2.jpg", alt_text: "Interior Ballroom", is_primary: false },
      ],
    },
    {
      id: "ast-002",
      code: "AST-002",
      name: "Lahan Tanah Komersial Timur",
      description: "Lahan tanah terbuka berkontur datar siap pakai untuk pameran outdoor, pasar rakyat, festival kuliner, atau penyimpanan logistik temporer.",
      category: "Tanah",
      categoryId: "cat-2",
      areaSize: 3500,
      areaUnit: "m²",
      location: "Kawasan Bisnis Sektor Timur Blok C",
      specifications: {
        aksesibilitas: "Jalan aspal lebar 8 meter (akses kontainer)",
        kondisiLahan: "Tanah padat dan rata",
        fasilitas: ["Akses air bersih", "Sambungan listrik sementara", "Pagar pengaman keliling"],
      },
      condition: "baik",
      status: "siap",
      dailyRate: 5000000,
      monthlyRate: 120000000,
      yearlyRate: 1200000000,
      icon: "🏞️",
      photos: [
        { id: "p3", storage_path: "/assets/tanah-1.jpg", alt_text: "Area Lahan Terbuka", is_primary: true },
      ],
    },
    {
      id: "ast-003",
      code: "AST-003",
      name: "Ruang Rapat VIP Adyatma",
      description: "Ruang rapat eksklusif dengan meja bundar kayu jati berkapasitas 25 orang. Dilengkapi proyektor 4K laser, layar interaktif, dan video conference terintegrasi.",
      category: "Ruangan",
      categoryId: "cat-3",
      areaSize: 85,
      areaUnit: "m²",
      location: "Gedung Pengelola Lantai 2, Sayap Barat",
      specifications: {
        kapasitas: "25 kursi VIP",
        teknologi: "Smart Conference System, Laser Projector 4K",
        fasilitas: ["Mini pantry", "High-speed Wi-Fi 200 Mbps", "Mic delegasi per kursi"],
      },
      condition: "baik",
      status: "siap",
      dailyRate: 1500000,
      monthlyRate: 35000000,
      yearlyRate: null,
      icon: "🛋️",
      photos: [
        { id: "p4", storage_path: "/assets/ruang-1.jpg", alt_text: "Ruang Rapat Adyatma", is_primary: true },
      ],
    },
    {
      id: "ast-004",
      code: "AST-004",
      name: "Auditorium Cendekia",
      description: "Ruangan teater berundak dengan kursi banquet untuk kapasitas 250 orang. Sangat ideal untuk seminar akademis, workshop, dan pelatihan perusahaan.",
      category: "Ruangan",
      categoryId: "cat-3",
      areaSize: 320,
      areaUnit: "m²",
      location: "Gedung Diklat Lantai 1",
      specifications: {
        kapasitas: "250 kursi berundak",
        audioVisual: "LED Videotron 5x3 meter, Sound System Dual Array",
        fasilitas: ["Ruang transit pembicara", "Lobby registrasi mandiri"],
      },
      condition: "baik",
      status: "siap",
      dailyRate: 4000000,
      monthlyRate: 85000000,
      yearlyRate: null,
      icon: "🎭",
      photos: [
        { id: "p5", storage_path: "/assets/auditorium-1.jpg", alt_text: "Auditorium Cendekia", is_primary: true },
      ],
    },
    {
      id: "ast-005",
      code: "AST-005",
      name: "Lahan Terbuka Parkir & Ekshibisi Selatan",
      description: "Area lahan beraspal seluas 2.000 m² yang dapat disewa untuk ajang otomotif, bazar akhir pekan, atau kantong parkir acara besar.",
      category: "Tanah",
      categoryId: "cat-2",
      areaSize: 2000,
      areaUnit: "m²",
      location: "Sisi Selatan Kompleks Graha Utama",
      specifications: {
        permukaan: "Aspal hotmix",
        penerangan: "4 titik lampu sorot LED 1.000W",
        fasilitas: ["Pintu gerbang terpisah", "Pos pengamanan terpadu"],
      },
      condition: "baik",
      status: "siap",
      dailyRate: 3500000,
      monthlyRate: 80000000,
      yearlyRate: null,
      icon: "🚗",
      photos: [
        { id: "p6", storage_path: "/assets/parkir-1.jpg", alt_text: "Area Parkir Ekshibisi", is_primary: true },
      ],
    },
  ];
}

function filterMockAssets({ search, categoryId, location, minPrice, maxPrice }) {
  let list = getMockAssetsList();

  if (categoryId) {
    list = list.filter((a) => a.categoryId === categoryId);
  }
  if (location) {
    list = list.filter((a) => a.location.toLowerCase().includes(location.toLowerCase()));
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter((a) => a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s));
  }
  if (minPrice > 0) {
    list = list.filter((a) => a.dailyRate >= minPrice);
  }
  if (maxPrice > 0) {
    list = list.filter((a) => a.dailyRate <= maxPrice);
  }

  return list;
}

function getMockBookingBlocks(assetId) {
  // Simulasi rentang tanggal yang diblokir untuk uji coba kalender
  // AST-001 diblokir tanggal 15 s/d 17 November (+ buffer 1 hari)
  if (assetId === "ast-001" || assetId === "AST-001") {
    return [
      {
        id: "block-1",
        startDate: "2026-11-14", // termasuk buffer sebelum
        endDateExclusive: "2026-11-19", // sewa selesai 17 + buffer sesudah 1 -> eksklusif 19
        status: "active",
      },
    ];
  }
  return [];
}
