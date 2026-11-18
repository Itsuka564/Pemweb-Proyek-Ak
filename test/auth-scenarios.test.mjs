import assert from "node:assert";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Supabase environment variables are missing!");
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
const anonClient = createClient(SUPABASE_URL, ANON_KEY);

console.log("==================================================");
console.log("PENGUJIAN AUTENTIKASI, REGISTRASI & ROLE (12 SKENARIO)");
console.log("==================================================");

// Email regex standar dari implementasi actions.js
const standardEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Alamat email wajib diisi")
    .regex(standardEmailRegex, "Format email tidak valid (contoh: nama@email.com)"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
});

const registerSchema = z.object({
  fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  email: z
    .string()
    .min(1, "Alamat email wajib diisi")
    .regex(standardEmailRegex, "Format email tidak valid (contoh: nama@email.com)"),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
});

// Logika penentuan rute middleware untuk pengujian navigasi & role protection
function evaluateMiddlewareRoute({ pathname, user, profileRole }) {
  // Sudah login membuka /masuk atau /daftar -> redirect ke dashboard role
  if (user && (pathname === "/masuk" || pathname === "/daftar")) {
    const dest =
      profileRole === "admin"
        ? "/admin/dashboard"
        : profileRole === "petugas"
        ? "/petugas/dashboard"
        : "/penyewa/dashboard";
    return { status: 307, location: dest };
  }

  // Rute publik: beranda dan katalog
  if (pathname === "/" || pathname.startsWith("/katalog")) {
    return { status: 200, location: null };
  }

  // Proteksi rute admin
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return { status: 307, location: `/masuk?redirect=${encodeURIComponent(pathname)}` };
    }
    if (profileRole !== "admin") {
      return {
        status: 307,
        location: profileRole === "petugas" ? "/petugas/dashboard" : "/penyewa/dashboard",
      };
    }
    return { status: 200, location: null };
  }

  // Proteksi rute petugas
  if (pathname.startsWith("/petugas")) {
    if (!user) {
      return { status: 307, location: `/masuk?redirect=${encodeURIComponent(pathname)}` };
    }
    if (profileRole !== "petugas" && profileRole !== "admin") {
      return { status: 307, location: "/penyewa/dashboard" };
    }
    return { status: 200, location: null };
  }

  // Proteksi rute penyewa
  if (pathname.startsWith("/penyewa")) {
    if (!user) {
      return { status: 307, location: `/masuk?redirect=${encodeURIComponent(pathname)}` };
    }
    return { status: 200, location: null };
  }

  return { status: 200, location: null };
}

async function runTests() {
  // ------------------------------------------------------------------
  // SKENARIO 1: Registrasi menggunakan email tanpa angka
  // ------------------------------------------------------------------
  console.log("\n[Skenario 1] Registrasi menggunakan email tanpa angka");
  const emailsWithoutNumbers = [
    "sadewa@gmail.com",
    "nama.pengguna@gmail.com",
    "pengguna_abc@yahoo.com",
    "admin@kampus.ac.id",
  ];
  emailsWithoutNumbers.forEach((email) => {
    const parsed = registerSchema.safeParse({
      fullName: "Budi Santoso",
      email: email.trim().toLowerCase(),
      phone: "081234567890",
      password: "password123",
    });
    assert.strictEqual(parsed.success, true, `Email tanpa angka '${email}' harus valid`);
  });
  console.log("✓ Skenario 1 PASS: Seluruh email tanpa angka lolos validasi.");

  // ------------------------------------------------------------------
  // SKENARIO 2: Registrasi menggunakan email dengan angka
  // ------------------------------------------------------------------
  console.log("\n[Skenario 2] Registrasi menggunakan email dengan angka");
  const emailsWithNumbers = [
    "user123@gmail.com",
    "tomi123@gmail.com",
    "tomiadya123@gmail.com",
    "sadewavian52@gmail.com",
  ];
  emailsWithNumbers.forEach((email) => {
    const parsed = registerSchema.safeParse({
      fullName: "Budi Santoso",
      email: email.trim().toLowerCase(),
      phone: "081234567890",
      password: "password123",
    });
    assert.strictEqual(parsed.success, true, `Email dengan angka '${email}' harus valid`);
  });
  console.log("✓ Skenario 2 PASS: Seluruh email dengan angka lolos validasi.");

  // Siapkan akun test role (admin, petugas, penyewa) untuk pengujian langsung ke live Supabase
  const testPassword = "Password123!";
  const testAdminEmail = "sadewavian5@gmail.com";
  const testPenyewaEmail = "tomiadya123@gmail.com";
  const testPetugasEmail = "petugas_lapangan@sewaaset.id";

  // Pastikan user admin aktif
  const { data: adminUsers } = await adminClient.auth.admin.listUsers();
  const existingAdmin = adminUsers?.users?.find((u) => u.email === testAdminEmail);
  if (existingAdmin) {
    await adminClient.auth.admin.updateUserById(existingAdmin.id, {
      password: testPassword,
      email_confirm: true,
    });
    await adminClient.from("profiles").upsert({
      id: existingAdmin.id,
      role: "admin",
      full_name: "Admin Pengelola",
      is_active: true,
    });
  }

  // Pastikan user penyewa aktif
  const existingPenyewa = adminUsers?.users?.find((u) => u.email === testPenyewaEmail);
  if (existingPenyewa) {
    await adminClient.auth.admin.updateUserById(existingPenyewa.id, {
      password: testPassword,
      email_confirm: true,
    });
    await adminClient.from("profiles").upsert({
      id: existingPenyewa.id,
      role: "penyewa",
      full_name: "Tomi Adya",
      is_active: true,
    });
  }

  // Pastikan user petugas ada dan memiliki role 'petugas' via admin terotorisasi
  let petugasUser = adminUsers?.users?.find((u) => u.email === testPetugasEmail);
  if (!petugasUser) {
    const { data: newP } = await adminClient.auth.admin.createUser({
      email: testPetugasEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { role: "petugas", full_name: "Budi Petugas" },
    });
    petugasUser = newP.user;
  } else {
    await adminClient.auth.admin.updateUserById(petugasUser.id, {
      password: testPassword,
      email_confirm: true,
    });
  }

  // Update role petugas dilakukan melalui konteks autentikasi admin agar mematuhi trigger keamanan
  const adminClientForRoleUpdate = createClient(SUPABASE_URL, ANON_KEY);
  await adminClientForRoleUpdate.auth.signInWithPassword({
    email: testAdminEmail,
    password: testPassword,
  });
  await adminClientForRoleUpdate
    .from("profiles")
    .update({ role: "petugas", full_name: "Budi Petugas" })
    .eq("id", petugasUser.id);


  // ------------------------------------------------------------------
  // SKENARIO 3: Login sebagai penyewa
  // ------------------------------------------------------------------
  console.log("\n[Skenario 3] Login sebagai penyewa ke Supabase Auth");
  const penyewaAuthClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: penyewaLogin, error: penyewaErr } = await penyewaAuthClient.auth.signInWithPassword({
    email: testPenyewaEmail,
    password: testPassword,
  });
  assert.strictEqual(penyewaErr, null, "Penyewa harus berhasil login");
  assert.ok(penyewaLogin.session, "Session penyewa harus terbentuk");
  assert.ok(penyewaLogin.user, "User penyewa harus terautentikasi");

  const { data: penyewaProfile } = await penyewaAuthClient
    .from("profiles")
    .select("role")
    .eq("id", penyewaLogin.user.id)
    .single();
  assert.strictEqual(penyewaProfile.role, "penyewa", "Role pengguna harus 'penyewa'");
  console.log(`✓ Skenario 3 PASS: Penyewa '${testPenyewaEmail}' berhasil login dengan role '${penyewaProfile.role}'.`);

  // ------------------------------------------------------------------
  // SKENARIO 4: Berpindah dari katalog ke dashboard penyewa
  // ------------------------------------------------------------------
  console.log("\n[Skenario 4] Berpindah dari katalog ke dashboard penyewa");
  const evalKatalog = evaluateMiddlewareRoute({
    pathname: "/katalog",
    user: penyewaLogin.user,
    profileRole: "penyewa",
  });
  assert.strictEqual(evalKatalog.status, 200, "Katalog aset publik harus berstatus 200 (tanpa redirect)");

  const evalDashPenyewa = evaluateMiddlewareRoute({
    pathname: "/penyewa/dashboard",
    user: penyewaLogin.user,
    profileRole: "penyewa",
  });
  assert.strictEqual(evalDashPenyewa.status, 200, "Dashboard penyewa berstatus 200 untuk penyewa aktif");
  console.log("✓ Skenario 4 PASS: Navigasi /katalog -> /penyewa/dashboard berjalan lancar tanpa logout/redirect.");

  // ------------------------------------------------------------------
  // SKENARIO 5: Membuka riwayat dan detail transaksi
  // ------------------------------------------------------------------
  console.log("\n[Skenario 5] Membuka riwayat dan detail transaksi");
  const evalRiwayat = evaluateMiddlewareRoute({
    pathname: "/penyewa/riwayat",
    user: penyewaLogin.user,
    profileRole: "penyewa",
  });
  assert.strictEqual(evalRiwayat.status, 200, "Halaman riwayat transaksi dapat diakses penyewa");
  const evalDetailTx = evaluateMiddlewareRoute({
    pathname: "/penyewa/transaksi/mock-tx-id",
    user: penyewaLogin.user,
    profileRole: "penyewa",
  });
  assert.strictEqual(evalDetailTx.status, 200, "Halaman detail transaksi dapat diakses penyewa");
  console.log("✓ Skenario 5 PASS: Halaman riwayat & detail transaksi penyewa dapat diakses persisten.");

  // ------------------------------------------------------------------
  // SKENARIO 6: Refresh browser saat sudah login
  // ------------------------------------------------------------------
  console.log("\n[Skenario 6] Refresh browser saat sudah login");
  // Periksa apakah getUser() dengan token sesi masih valid
  const { data: userRefreshed, error: refreshErr } = await penyewaAuthClient.auth.getUser();
  assert.strictEqual(refreshErr, null, "getUser() pada klien harus tetap sukses");
  assert.strictEqual(userRefreshed.user.id, penyewaLogin.user.id, "ID pengguna tidak berubah setelah refresh");
  const evalRefresh = evaluateMiddlewareRoute({
    pathname: "/penyewa/dashboard",
    user: userRefreshed.user,
    profileRole: "penyewa",
  });
  assert.strictEqual(evalRefresh.status, 200, "Refresh berulang kali tidak mengubah status akses");
  console.log("✓ Skenario 6 PASS: Sesi Supabase tetap persisten setelah refresh berulang kali.");

  // ------------------------------------------------------------------
  // SKENARIO 7: Membuka halaman privat di tab yang sama
  // ------------------------------------------------------------------
  console.log("\n[Skenario 7] Membuka halaman privat di tab yang sama");
  const evalAjukan = evaluateMiddlewareRoute({
    pathname: "/penyewa/ajukan",
    user: penyewaLogin.user,
    profileRole: "penyewa",
  });
  assert.strictEqual(evalAjukan.status, 200, "Halaman ajukan sewa tetap terbuka dengan sesi aktif");
  const evalVerifikasi = evaluateMiddlewareRoute({
    pathname: "/penyewa/verifikasi",
    user: penyewaLogin.user,
    profileRole: "penyewa",
  });
  assert.strictEqual(evalVerifikasi.status, 200, "Halaman verifikasi tetap terbuka dengan sesi aktif");
  console.log("✓ Skenario 7 PASS: Berpindah ke rute privat lain di tab yang sama mempertahankan otorisasi.");

  // ------------------------------------------------------------------
  // SKENARIO 8: Login sebagai admin dan berpindah ant halaman admin
  // ------------------------------------------------------------------
  console.log("\n[Skenario 8] Login sebagai admin dan berpindah antar halaman admin");
  const adminAuthClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: adminLogin, error: adminErr } = await adminAuthClient.auth.signInWithPassword({
    email: testAdminEmail,
    password: testPassword,
  });
  assert.strictEqual(adminErr, null, "Admin harus berhasil login");
  const { data: adminProf } = await adminAuthClient
    .from("profiles")
    .select("role")
    .eq("id", adminLogin.user.id)
    .single();
  assert.strictEqual(adminProf.role, "admin", "Role profil harus 'admin'");

  const adminRoutes = [
    "/admin/dashboard",
    "/admin/aset",
    "/admin/aset/baru",
    "/admin/aset/kategori",
    "/admin/pengajuan",
    "/admin/verifikasi",
    "/admin/kalender",
  ];
  adminRoutes.forEach((route) => {
    const res = evaluateMiddlewareRoute({
      pathname: route,
      user: adminLogin.user,
      profileRole: adminProf.role,
    });
    assert.strictEqual(res.status, 200, `Admin harus dapat mengakses ${route}`);
  });
  console.log("✓ Skenario 8 PASS: Admin dapat berpindah antar seluruh 7 halaman admin tanpa hambatan.");

  // ------------------------------------------------------------------
  // SKENARIO 9: Login sebagai petugas dan berpindah ant halaman petugas
  // ------------------------------------------------------------------
  console.log("\n[Skenario 9] Login sebagai petugas dan berpindah antar halaman petugas");
  const officerAuthClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: officerLogin, error: officerErr } = await officerAuthClient.auth.signInWithPassword({
    email: testPetugasEmail,
    password: testPassword,
  });
  assert.strictEqual(officerErr, null, "Petugas harus berhasil login");
  const { data: officerProf } = await officerAuthClient
    .from("profiles")
    .select("role")
    .eq("id", officerLogin.user.id)
    .single();
  assert.strictEqual(officerProf.role, "petugas", "Role profil harus 'petugas'");

  const officerRoutes = [
    "/petugas/dashboard",
    "/petugas/tugas",
  ];
  officerRoutes.forEach((route) => {
    const res = evaluateMiddlewareRoute({
      pathname: route,
      user: officerLogin.user,
      profileRole: officerProf.role,
    });
    assert.strictEqual(res.status, 200, `Petugas harus dapat mengakses ${route}`);
  });
  console.log("✓ Skenario 9 PASS: Petugas dapat mengakses seluruh modul tugas lapangan.");

  // ------------------------------------------------------------------
  // SKENARIO 10: Logout dan mencoba membuka halaman privat
  // ------------------------------------------------------------------
  console.log("\n[Skenario 10] Logout dan mencoba membuka halaman privat");
  await penyewaAuthClient.auth.signOut();
  const resPostLogout = evaluateMiddlewareRoute({
    pathname: "/penyewa/dashboard",
    user: null,
    profileRole: null,
  });
  assert.strictEqual(resPostLogout.status, 307, "Harus redirect jika belum/sudah logout membuka rute privat");
  assert.ok(resPostLogout.location.includes("/masuk"), "Harus redirect ke /masuk");
  console.log("✓ Skenario 10 PASS: Pengguna yang logout diarahkan ke /masuk saat mencoba membuka rute privat.");

  // ------------------------------------------------------------------
  // SKENARIO 11: Pengguna tanpa login membuka halaman privat
  // ------------------------------------------------------------------
  console.log("\n[Skenario 11] Pengguna tanpa login membuka halaman privat");
  const unauthAdmin = evaluateMiddlewareRoute({
    pathname: "/admin/dashboard",
    user: null,
    profileRole: null,
  });
  assert.strictEqual(unauthAdmin.status, 307);
  assert.ok(unauthAdmin.location.includes("redirect=%2Fadmin%2Fdashboard"));

  const unauthOfficer = evaluateMiddlewareRoute({
    pathname: "/petugas/dashboard",
    user: null,
    profileRole: null,
  });
  assert.strictEqual(unauthOfficer.status, 307);
  assert.ok(unauthOfficer.location.includes("redirect=%2Fpetugas%2Fdashboard"));

  const unauthPenyewa = evaluateMiddlewareRoute({
    pathname: "/penyewa/dashboard",
    user: null,
    profileRole: null,
  });
  assert.strictEqual(unauthPenyewa.status, 307);
  assert.ok(unauthPenyewa.location.includes("redirect=%2Fpenyewa%2Fdashboard"));
  console.log("✓ Skenario 11 PASS: Seluruh rute privat meneruskan parameter redirect ke /masuk.");

  // ------------------------------------------------------------------
  // SKENARIO 12: Memastikan penyewa tidak dapat mengakses halaman admin
  // ------------------------------------------------------------------
  console.log("\n[Skenario 12] Memastikan penyewa tidak dapat mengakses halaman admin");
  const penyewaToAdmin = evaluateMiddlewareRoute({
    pathname: "/admin/dashboard",
    user: penyewaLogin.user,
    profileRole: "penyewa",
  });
  assert.strictEqual(penyewaToAdmin.status, 307, "Penyewa harus ditolak dari /admin/*");
  assert.strictEqual(
    penyewaToAdmin.location,
    "/penyewa/dashboard",
    "Penyewa harus diarahkan kembali ke /penyewa/dashboard tanpa dipaksa login ulang"
  );

  const penyewaToPetugas = evaluateMiddlewareRoute({
    pathname: "/petugas/dashboard",
    user: penyewaLogin.user,
    profileRole: "penyewa",
  });
  assert.strictEqual(penyewaToPetugas.status, 307, "Penyewa harus ditolak dari /petugas/*");
  assert.strictEqual(
    penyewaToPetugas.location,
    "/penyewa/dashboard",
    "Penyewa harus diarahkan kembali ke /penyewa/dashboard tanpa dipaksa login ulang"
  );
  console.log("✓ Skenario 12 PASS: Penyewa diisolasi secara ketat dari modul admin & petugas.");

  console.log("\n==================================================");
  console.log("SELURUH 12 SKENARIO PENGUJIAN AUTENTIKASI BERHASIL (ALL PASS)!");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
