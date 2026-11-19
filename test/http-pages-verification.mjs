import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
    getCookieHeader: () => Array.from(jar.entries()).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("; ")
  };
}

async function verifyAllRoutes() {
  console.log("==================================================");
  console.log("PENGUJIAN KELAYAKAN HALAMAN WEB (HTTP INTEGRATION)");
  console.log("==================================================");

  // 1. Tenant session
  const tenant = makeClientWithJar();
  const { data: tAuth, error: tErr } = await tenant.client.auth.signInWithPassword({
    email: "tomiadya123@gmail.com",
    password: "Password123!"
  });
  if (tErr) throw new Error("Tenant login failed: " + tErr.message);
  console.log("✓ Login Penyewa berhasil:", tAuth.user.email);

  const tenantCookie = tenant.getCookieHeader();

  const tenantRoutes = [
    { url: "http://localhost:3000/", title: "Beranda", expect: "SewaAset" },
    { url: "http://localhost:3000/katalog", title: "Katalog Aset", expect: "Katalog" },
    { url: "http://localhost:3000/penyewa/dashboard", title: "Dashboard Penyewa", expect: "Dashboard Penyewa" },
    { url: "http://localhost:3000/penyewa/riwayat", title: "Riwayat Transaksi", expect: "Riwayat" },
    { url: "http://localhost:3000/penyewa/verifikasi", title: "Verifikasi Identitas", expect: "Verifikasi Identitas" },
    { url: "http://localhost:3000/penyewa/ajukan", title: "Pengajuan Sewa", expect: "Pengajuan" }
  ];

  for (const r of tenantRoutes) {
    const res = await fetch(r.url, { headers: { cookie: tenantCookie } });
    const text = await res.text();
    const hasError = text.includes("This page couldn't load") || text.includes("Application error");
    const hasContent = text.includes(r.expect);

    if (res.status !== 200 || hasError || !hasContent) {
      throw new Error(`Gagal memuat ${r.title} (${r.url}): Status=${res.status}, hasError=${hasError}, hasContent=${hasContent}`);
    }
    console.log(`✓ [200 OK] ${r.title} dimuat dengan benar (tanpa error).`);
  }

  // 2. Admin session
  const admin = makeClientWithJar();
  const { data: aAuth, error: aErr } = await admin.client.auth.signInWithPassword({
    email: "sadewavian5@gmail.com",
    password: "Password123!"
  });
  if (aErr) throw new Error("Admin login failed: " + aErr.message);
  console.log("✓ Login Admin berhasil:", aAuth.user.email);

  const adminCookie = admin.getCookieHeader();

  const adminRoutes = [
    { url: "http://localhost:3000/admin/dashboard", title: "Dashboard Admin", expect: "Dashboard" },
    { url: "http://localhost:3000/admin/aset", title: "Kelola Aset", expect: "Aset" },
    { url: "http://localhost:3000/admin/pengajuan", title: "Pengajuan Sewa Admin", expect: "Pengajuan" },
    { url: "http://localhost:3000/admin/kalender", title: "Kalender Sewa Admin", expect: "Kalender" },
    { url: "http://localhost:3000/admin/verifikasi", title: "Verifikasi Berkas Admin", expect: "Verifikasi" }
  ];

  for (const r of adminRoutes) {
    const res = await fetch(r.url, { headers: { cookie: adminCookie } });
    const text = await res.text();
    const hasError = text.includes("This page couldn't load") || text.includes("Application error");
    const hasContent = text.includes(r.expect);

    if (res.status !== 200 || hasError || !hasContent) {
      throw new Error(`Gagal memuat ${r.title} (${r.url}): Status=${res.status}, hasError=${hasError}, hasContent=${hasContent}`);
    }
    console.log(`✓ [200 OK] ${r.title} dimuat dengan benar (tanpa error).`);
  }

  // 3. Officer session
  const officer = makeClientWithJar();
  const { data: oAuth, error: oErr } = await officer.client.auth.signInWithPassword({
    email: "petugas_lapangan@sewaaset.id",
    password: "Password123!"
  });
  if (oErr) throw new Error("Officer login failed: " + oErr.message);
  console.log("✓ Login Petugas berhasil:", oAuth.user.email);

  const officerCookie = officer.getCookieHeader();

  const officerRoutes = [
    { url: "http://localhost:3000/petugas/dashboard", title: "Dashboard Petugas", expect: "Petugas" },
    { url: "http://localhost:3000/petugas/tugas", title: "Daftar Tugas Petugas", expect: "Tugas" }
  ];

  for (const r of officerRoutes) {
    const res = await fetch(r.url, { headers: { cookie: officerCookie } });
    const text = await res.text();
    const hasError = text.includes("This page couldn't load") || text.includes("Application error");
    const hasContent = text.includes(r.expect);

    if (res.status !== 200 || hasError || !hasContent) {
      throw new Error(`Gagal memuat ${r.title} (${r.url}): Status=${res.status}, hasError=${hasError}, hasContent=${hasContent}`);
    }
    console.log(`✓ [200 OK] ${r.title} dimuat dengan benar (tanpa error).`);
  }

  console.log("--------------------------------------------------");
  console.log("SEMUA RUTE DARI PENYEWA, ADMIN, DAN PETUGAS LOLOS DENGAN STATUS 200 OK!");
  console.log("--------------------------------------------------");
}

verifyAllRoutes().catch(err => {
  console.error("HTTP Verification Error:", err);
  process.exit(1);
});
