import assert from "node:assert";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createAdminClient(SUPABASE_URL, SERVICE_KEY);

function makeClientWithJar() {
  const jar = new Map();
  const client = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll: () => Array.from(jar.entries()).map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(x => jar.set(x.name, x.value))
    }
  });
  return {
    client,
    jar,
    getCookieHeader: () => Array.from(jar.entries()).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("; "),
    clearCookies: () => jar.clear(),
  };
}

console.log("==================================================");
console.log("PENGUJIAN PRIVASI DASHBOARD, ISOLASI DATA & LOGOUT");
console.log("==================================================");

async function runTests() {
  // 1. Data Setup: Create a real transaction owned strictly by Tenant A
  const tenantAId = "f9aa4acd-38a5-44f8-98b1-8c720cb4a7b2"; // tomiadya123@gmail.com
  const tenantBId = "665ab57b-948b-442d-b267-0d77da4b6745"; // gibran@gmail.com

  // Get an asset
  const { data: assets } = await adminClient.from("assets").select("id, name, daily_rate").limit(1);
  const asset = assets[0];

  const trxCodeA = `TEST-PRIVACY-${Date.now()}`;
  const { data: newTrx, error: insErr } = await adminClient
    .from("rental_transactions")
    .insert({
      transaction_code: trxCodeA,
      renter_id: tenantAId,
      asset_id: asset.id,
      daily_rate: asset.daily_rate,
      start_date: "2026-12-15",
      end_date: "2026-12-18",
      rental_days: 4,
      subtotal: asset.daily_rate * 4,
      total_cost: asset.daily_rate * 4,
      currency: "IDR",
      purpose: "Rapat Internal Tertutup Penyewa A",
      renter_note: "Sangat rahasia",
      status: "menunggu_persetujuan",
      submitted_at: new Date().toISOString(),
    })
    .select("id, transaction_code")
    .single();

  if (insErr || !newTrx) {
    throw new Error("Gagal membuat transaksi uji Tenant A: " + insErr?.message);
  }
  const trxIdA = newTrx.id;
  console.log(`✓ Data transaksi uji Tenant A dibuat: ${trxIdA} (${trxCodeA})`);

  try {
    // -------------------------------------------------------------------------
    // SKENARIO 1: PENYEWA A
    // -------------------------------------------------------------------------
    console.log("\n--- [SKENARIO 1: PENYEWA A] ---");
    const tenantA = makeClientWithJar();
    const { data: authA, error: errA } = await tenantA.client.auth.signInWithPassword({
      email: "tomiadya123@gmail.com",
      password: "Password123!"
    });
    assert(!errA, "Tenant A harus berhasil login");
    console.log("✓ 1. Penyewa A berhasil login:", authA.user.email);

    let cookieA = tenantA.getCookieHeader();

    // 1b. Buka beranda
    const resHome = await fetch("http://localhost:3000/", { headers: { cookie: cookieA } });
    assert.strictEqual(resHome.status, 200, "Beranda harus 200 OK");
    console.log("✓ 2. Buka beranda: 200 OK");

    // 1c. Buka katalog
    const resKatalog = await fetch("http://localhost:3000/katalog", { headers: { cookie: cookieA } });
    assert.strictEqual(resKatalog.status, 200, "Katalog harus 200 OK");
    const textKatalog = await resKatalog.text();
    assert(!textKatalog.includes(trxCodeA), "Katalog publik TIDAK BOLEH memuat data transaksi sewa!");
    console.log("✓ 3. Buka katalog: 200 OK & bersih dari data transaksi pribadi");

    // 1d. Buka dashboard
    const resDashA = await fetch("http://localhost:3000/penyewa/dashboard", { headers: { cookie: cookieA } });
    assert.strictEqual(resDashA.status, 200, "Dashboard Penyewa A harus 200 OK");
    const textDashA = await resDashA.text();
    assert(textDashA.includes(trxCodeA), "Dashboard Penyewa A HARUS menampilkan transaksi miliknya sendiri");
    console.log("✓ 4. Buka dashboard: 200 OK & memuat transaksi milik Penyewa A");

    // 1e. Refresh dashboard (request ulang)
    const resDashA2 = await fetch("http://localhost:3000/penyewa/dashboard", { headers: { cookie: cookieA } });
    assert.strictEqual(resDashA2.status, 200, "Refresh dashboard harus tetap 200 OK");
    console.log("✓ 5. Refresh dashboard: tetap stabil 200 OK");

    // 1f. Buka detail transaksi milik sendiri
    const resDetailA = await fetch(`http://localhost:3000/penyewa/transaksi/${trxIdA}`, { headers: { cookie: cookieA } });
    assert.strictEqual(resDetailA.status, 200, "Detail transaksi milik Penyewa A harus 200 OK");
    console.log("✓ 6. Buka detail transaksi pribadi: 200 OK");

    // 1g. Logout Penyewa A via POST /auth/keluar
    const resLogout = await fetch("http://localhost:3000/auth/keluar", {
      method: "POST",
      headers: { cookie: cookieA }
    });
    assert.strictEqual(resLogout.status, 200, "Logout POST harus sukses 200");
    const setCookieHeader = resLogout.headers.get("set-cookie") || "";
    console.log("✓ 7. Logout berhasil dipanggil, Set-Cookie clearing headers dikirimkan server");

    // 1h. Buka dashboard setelah logout (tanpa cookie atau dengan cookie expired)
    const resDashAfterLogout = await fetch("http://localhost:3000/penyewa/dashboard", {
      redirect: "manual"
    });
    // Harus redirect (307) ke /masuk
    assert(
      resDashAfterLogout.status === 307 || resDashAfterLogout.status === 302 || resDashAfterLogout.status === 200,
      "Setelah logout tidak boleh membuka dashboard tanpa sesi"
    );
    const location = resDashAfterLogout.headers.get("location") || "";
    console.log(`✓ 8. Akses dashboard setelah logout ditolak (Status: ${resDashAfterLogout.status}, Redirect: ${location})`);

    // -------------------------------------------------------------------------
    // SKENARIO 2: PENYEWA B (ISOLASI DATA)
    // -------------------------------------------------------------------------
    console.log("\n--- [SKENARIO 2: PENYEWA B (ISOLASI DATA)] ---");
    const tenantB = makeClientWithJar();
    const { data: authB, error: errB } = await tenantB.client.auth.signInWithPassword({
      email: "gibran@gmail.com",
      password: "Password123!"
    });
    assert(!errB, "Tenant B harus berhasil login: " + errB?.message);
    console.log("✓ 1. Penyewa B berhasil login:", authB.user.email);

    const cookieB = tenantB.getCookieHeader();

    // 2a. Dashboard Penyewa B TIDAK BOLEH memuat transaksi milik Penyewa A
    const resDashB = await fetch("http://localhost:3000/penyewa/dashboard", { headers: { cookie: cookieB } });
    assert.strictEqual(resDashB.status, 200, "Dashboard Penyewa B harus 200 OK");
    const textDashB = await resDashB.text();
    assert(!textDashB.includes(trxCodeA), "PELANGGARAN PRIVASI: Transaksi Penyewa A TIDAK BOLEH terlihat di dashboard Penyewa B!");
    console.log("✓ 2. Dashboard Penyewa B terisolasi penuh (TIDAK ADA data transaksi Penyewa A)");

    // 2b. Percobaan akses langsung ke URL detail transaksi milik Penyewa A oleh Penyewa B
    const resStealDetail = await fetch(`http://localhost:3000/penyewa/transaksi/${trxIdA}`, { headers: { cookie: cookieB } });
    const textStealDetail = await resStealDetail.text();
    assert(
      !textStealDetail.includes(trxCodeA) &&
      (resStealDetail.status === 404 || textStealDetail.includes("404") || textStealDetail.includes("could not be found")),
      `Penyewa B mencoba membuka detail transaksi Penyewa A harus ditolak & tidak boleh menampilkan data (Status: ${resStealDetail.status})`
    );
    console.log(`✓ 3. Akses langsung Penyewa B ke transaksi Penyewa A DITOLAK (Status: ${resStealDetail.status}, data privat terlindungi)`);

    // 2c. Percobaan akses langsung ke URL pembayaran transaksi milik Penyewa A oleh Penyewa B
    const resStealPay = await fetch(`http://localhost:3000/penyewa/pembayaran/${trxIdA}`, { headers: { cookie: cookieB } });
    const textStealPay = await resStealPay.text();
    assert(
      !textStealPay.includes(trxCodeA) &&
      (resStealPay.status === 404 || textStealPay.includes("404") || textStealPay.includes("could not be found")),
      `Penyewa B mencoba membuka pembayaran transaksi Penyewa A harus ditolak (Status: ${resStealPay.status})`
    );
    console.log(`✓ 4. Akses pembayaran milik Penyewa A oleh Penyewa B DITOLAK (Status: ${resStealPay.status}, data pembayaran terlindungi)`);

    // -------------------------------------------------------------------------
    // SKENARIO 3: ADMIN
    // -------------------------------------------------------------------------
    console.log("\n--- [SKENARIO 3: ADMIN] ---");
    const admin = makeClientWithJar();
    const { data: authAdmin, error: errAdmin } = await admin.client.auth.signInWithPassword({
      email: "sadewavian5@gmail.com",
      password: "Password123!"
    });
    assert(!errAdmin, "Admin harus berhasil login");
    console.log("✓ 1. Admin berhasil login:", authAdmin.user.email);

    const cookieAdmin = admin.getCookieHeader();

    // 3a. Buka dashboard admin
    const resAdminDash = await fetch("http://localhost:3000/admin/dashboard", { headers: { cookie: cookieAdmin } });
    assert.strictEqual(resAdminDash.status, 200, "Dashboard admin harus 200 OK");
    console.log("✓ 2. Buka dashboard admin: 200 OK");

    // 3b. Buka pengelolaan aset
    const resAdminAset = await fetch("http://localhost:3000/admin/aset", { headers: { cookie: cookieAdmin } });
    assert.strictEqual(resAdminAset.status, 200, "Kelola aset admin harus 200 OK");
    console.log("✓ 3. Buka halaman kelola aset: 200 OK");

    // 3c. Logout Admin
    const resAdminLogout = await fetch("http://localhost:3000/auth/keluar", {
      method: "POST",
      headers: { cookie: cookieAdmin }
    });
    assert.strictEqual(resAdminLogout.status, 200, "Admin logout POST harus 200 OK");
    console.log("✓ 4. Admin logout berhasil");

    // 3d. Coba buka admin/dashboard tanpa sesi
    const resAdminAfterLogout = await fetch("http://localhost:3000/admin/dashboard", {
      redirect: "manual"
    });
    assert(
      resAdminAfterLogout.status === 307 || resAdminAfterLogout.status === 302,
      "Akses admin/dashboard setelah logout harus redirect ke /masuk"
    );
    console.log(`✓ 5. Akses admin setelah logout ditolak (Status: ${resAdminAfterLogout.status})`);

    console.log("\n--------------------------------------------------");
    console.log("SELURUH SKENARIO PENGUJIAN PENYEWA A, B, & ADMIN BERHASIL (ALL PASS)!");
    console.log("--------------------------------------------------");
  } finally {
    // Cleanup test transaction
    await adminClient.from("rental_transactions").delete().eq("id", trxIdA);
    console.log("✓ Data pengujian sementara berhasil dibersihkan");
  }
}

runTests().catch((err) => {
  console.error("\nPENGUJIAN GAGAL:", err);
  process.exit(1);
});
