import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const cookiesMap = new Map();
const ssrClient = createServerClient(SUPABASE_URL, ANON_KEY, {
  cookies: {
    getAll: () => Array.from(cookiesMap.entries()).map(([name, value]) => ({ name, value })),
    setAll: (c) => c.forEach(x => cookiesMap.set(x.name, x.value))
  }
});

async function testHttpFlow() {
  const { data: auth, error: aErr } = await ssrClient.auth.signInWithPassword({
    email: "tomiadya123@gmail.com",
    password: "Password123!"
  });

  if (aErr) {
    console.error("Login failed:", aErr);
    return;
  }

  console.log("Logged in tenant via SSR client:", auth.user.email);
  const cookieHeader = Array.from(cookiesMap.entries())
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("; ");

  // Test GET /penyewa/verifikasi
  console.log("\nTesting GET http://localhost:3000/penyewa/verifikasi with real SSR cookies...");
  const resVerif = await fetch("http://localhost:3000/penyewa/verifikasi", {
    headers: { cookie: cookieHeader }
  });
  console.log("GET /penyewa/verifikasi status:", resVerif.status);
  const textVerif = await resVerif.text();
  console.log("Contains 'This page couldn't load'?", textVerif.includes("This page couldn't load"));
  console.log("Contains 'Verifikasi Identitas'?", textVerif.includes("Verifikasi Identitas"));

  // Test GET /penyewa/ajukan
  console.log("\nTesting GET http://localhost:3000/penyewa/ajukan with real SSR cookies...");
  const resAjukan = await fetch("http://localhost:3000/penyewa/ajukan", {
    headers: { cookie: cookieHeader }
  });
  console.log("GET /penyewa/ajukan status:", resAjukan.status);
  const textAjukan = await resAjukan.text();
  console.log("Contains 'This page couldn't load'?", textAjukan.includes("This page couldn't load"));
  console.log("Contains 'Pengajuan Penyewaan'?", textAjukan.includes("Pengajuan Penyewaan"));
}

testHttpFlow().catch(console.error);
