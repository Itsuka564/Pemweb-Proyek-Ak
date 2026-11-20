"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/auth/actions";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/FormFields";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const searchParams = useSearchParams();
  const notice = searchParams?.get("notice");
  const redirectParam = searchParams?.get("redirect");

  return (
    <form action={formAction} className="space-y-4">
      {notice === "email_confirmation_sent" && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
          ✉️ Pendaftaran berhasil! Silakan periksa email Anda (termasuk folder spam) untuk mengonfirmasi pendaftaran akun sebelum masuk.
        </div>
      )}

      {notice === "login_required" && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
          ℹ️ Silakan masuk ke akun Anda terlebih dahulu untuk mengakses layanan penyewaan.
        </div>
      )}

      {notice === "verification_required" && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
          ℹ️ Akses katalog memerlukan verifikasi identitas (KTP/NIB). Silakan masuk untuk melengkapi berkas Anda.
        </div>
      )}

      {!notice && redirectParam && (
        <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-900">
          ℹ️ Halaman yang Anda tuju memerlukan autentikasi akun. Silakan masuk terlebih dahulu.
        </div>
      )}

      {state?.error && (
        <div className="p-3 rounded-lg bg-[#fadcdc] border border-[#f5b8b8] text-xs font-semibold text-[#9c2222]">
          ⚠️ {state.error}
        </div>
      )}

      {redirectParam && (
        <input type="hidden" name="redirectTo" value={redirectParam} />
      )}

      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="nama@email.com"
        required
        autoComplete="email"
      />

      <Input
        label="Kata Sandi"
        name="password"
        type="password"
        placeholder="••••••••"
        required
        autoComplete="current-password"
      />

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          className="w-full py-2.5 font-bold"
          loading={isPending}
        >
          Masuk ke Akun
        </Button>
      </div>
    </form>
  );
}
