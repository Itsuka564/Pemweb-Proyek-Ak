"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
});

const registerSchema = z.object({
  fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
});

export async function loginAction(prevState, formData) {
  const email = formData.get("email");
  const password = formData.get("password");
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
    .single();

  const role = profile?.role || "penyewa";

  // Tangani tujuan pengalihan (redirectTo) yang aman
  if (redirectTo && typeof redirectTo === "string" && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    if (role === "admin") {
      redirect(redirectTo);
    } else if (role === "petugas" && (redirectTo.startsWith("/petugas") || redirectTo.startsWith("/katalog"))) {
      redirect(redirectTo);
    } else if (role === "penyewa" && (redirectTo.startsWith("/penyewa") || redirectTo.startsWith("/katalog"))) {
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
  const fullName = formData.get("fullName");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const password = formData.get("password");

  const validation = registerSchema.safeParse({ fullName, email, phone, password });
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Input tidak valid",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role: "penyewa", // Role default adalah penyewa
      },
    },
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  // Jika signup berhasil, simpan/upsert ke tabel profiles
  if (data?.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      phone,
      role: "penyewa",
      is_active: true,
      updated_at: new Date().toISOString(),
    });
  }

  redirect("/penyewa/verifikasi");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/masuk");
}
