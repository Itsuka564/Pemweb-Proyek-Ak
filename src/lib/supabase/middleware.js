import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id")) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Proteksi rute Admin
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/masuk";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/masuk";
      return NextResponse.redirect(url);
    }
  }

  // Proteksi rute Petugas
  if (pathname.startsWith("/petugas")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/masuk";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "petugas" && profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/masuk";
      return NextResponse.redirect(url);
    }
  }

  // Proteksi rute Penyewa
  if (pathname.startsWith("/penyewa")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/masuk";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Proteksi rute Katalog (hanya untuk penyewa yang telah disetujui verifikasinya)
  if (pathname.startsWith("/katalog")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/masuk";
      url.searchParams.set("notice", "login_required");
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Admin dan Petugas bebas membuka katalog
    if (profile?.role !== "admin" && profile?.role !== "petugas") {
      const { data: verification } = await supabase
        .from("user_verifications")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "disetujui")
        .maybeSingle();

      if (!verification) {
        const url = request.nextUrl.clone();
        url.pathname = "/penyewa/verifikasi";
        url.searchParams.set("notice", "verification_required");
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

