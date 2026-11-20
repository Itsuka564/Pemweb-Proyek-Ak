"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { z } from "zod";

// Validasi format email standar (menerima huruf, titik, angka, strip, tanda tambah, domain apa pun)
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

export async function loginAction(prevState, formData) {
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const password = formData.get("password") || "";
  const redirectTo = formData.get("redirectTo");

  const validation = loginSchema.safeParse({ email, password });
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Input tidak valid",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return {
        error:
          "Email akun Anda belum dikonfirmasi. Silakan buka kotak masuk atau folder spam email Anda untuk mengonfirmasi pendaftaran.",
      };
    }
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Email atau kata sandi salah. Silakan coba lagi."
          : error.message,
    };
  }

  // Cek profil dan role untuk menentukan tujuan redirect
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role = profile?.role || "penyewa";

  // Tangani tujuan pengalihan (redirectTo) yang aman
  if (
    redirectTo &&
    typeof redirectTo === "string" &&
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("//")
  ) {
    if (role === "admin") {
      redirect(redirectTo);
    } else if (
      role === "petugas" &&
      (redirectTo.startsWith("/petugas") || redirectTo.startsWith("/katalog"))
    ) {
      redirect(redirectTo);
    } else if (
      role === "penyewa" &&
      (redirectTo.startsWith("/penyewa") || redirectTo.startsWith("/katalog"))
    ) {
      redirect(redirectTo);
    }
  }

  // Pengalihan standar berbasis role
  if (role === "admin") {
    redirect("/admin/dashboard");
  } else if (role === "petugas") {
    redirect("/petugas/dashboard");
  } else {
    redirect("/penyewa/dashboard");
  }
}

export async function registerAction(prevState, formData) {
  const rawFullName = formData.get("fullName");
  const fullName = typeof rawFullName === "string" ? rawFullName.trim() : "";
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const rawPhone = formData.get("phone");
  const phone = typeof rawPhone === "string" ? rawPhone.trim() : "";
  const password = formData.get("password") || "";

  const validation = registerSchema.safeParse({ fullName, email, phone, password });
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Input tidak valid",
    };
  }

  const supabase = await createClient();

  let registeredUser = null;
  let activeSession = null;

  try {
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          role: "penyewa",
        },
      },
    });

    if (signUpErr) {
      if (
        signUpErr.message.includes("already registered") ||
        signUpErr.message.includes("already exists") ||
        signUpErr.status === 422
      ) {
        return { error: "Email ini sudah terdaftar. Silakan langsung masuk ke akun Anda." };
      }
      if (signUpErr.code === "over_email_send_rate_limit" || signUpErr.status === 429) {
        return {
          error:
            "Batas pengiriman email Supabase tercapai (rate limit). Silakan coba beberapa saat lagi atau hubungi administrator.",
        };
      }
      return { error: signUpErr.message || "Gagal melakukan pendaftaran akun." };
    }

    registeredUser = signUpData.user;
    activeSession = signUpData.session;

    // Simpan profil default penyewa ke tabel profiles
    if (registeredUser) {
      const adminClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
      await adminClient.from("profiles").upsert({
        id: registeredUser.id,
        full_name: fullName,
        phone: phone,
        role: "penyewa",
        is_active: true,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    if (err.message === "NEXT_REDIRECT" || err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    return { error: err.message || "Terjadi kesalahan saat pendaftaran akun." };
  }

  // Jika email confirmation dimatikan di Supabase, user langsung login (session aktif)
  if (activeSession) {
    redirect("/penyewa/verifikasi");
  } else {
    // Jika email confirmation aktif di Supabase, arahkan ke halaman masuk dengan pesan informatif
    redirect("/masuk?notice=email_confirmation_sent");
  }
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

