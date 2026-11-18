import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id")
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Helper untuk melakukan redirect sambil tetap meneruskan semua cookie session Supabase
  const createRedirect = (destination) => {
    const url = new URL(destination, request.url);
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  // Validasi sesi autentikasi menggunakan getUser() di sisi server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Jika pengguna sudah login dan mencoba mengakses halaman masuk atau daftar,
  // arahkan langsung ke dashboard sesuai dengan perannya
  if (user && (pathname === "/masuk" || pathname === "/daftar")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role || "penyewa";
    if (role === "admin") {
      return createRedirect("/admin/dashboard");
    } else if (role === "petugas") {
      return createRedirect("/petugas/dashboard");
    } else {
      return createRedirect("/penyewa/dashboard");
    }
  }

  // Proteksi rute Admin (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return createRedirect(`/masuk?redirect=${encodeURIComponent(pathname)}`);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      // Jika pengguna bukan admin, kembalikan ke dashboard yang sesuai (jangan paksa login ulang)
      if (profile?.role === "petugas") {
        return createRedirect("/petugas/dashboard");
      }
      return createRedirect("/penyewa/dashboard");
    }
  }

  // Proteksi rute Petugas (/petugas/*)
  if (pathname.startsWith("/petugas")) {
    if (!user) {
      return createRedirect(`/masuk?redirect=${encodeURIComponent(pathname)}`);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "petugas" && profile?.role !== "admin") {
      return createRedirect("/penyewa/dashboard");
    }
  }

  // Proteksi rute Penyewa (/penyewa/*)
  if (pathname.startsWith("/penyewa")) {
    if (!user) {
      return createRedirect(`/masuk?redirect=${encodeURIComponent(pathname)}`);
    }
  }

  // Catatan: Rute /katalog dan beranda (/) bersifat publik untuk penjelajahan aset.
  // Pengajuan sewa (/penyewa/ajukan) tetap terproteksi di rute /penyewa.

  return supabaseResponse;
}


