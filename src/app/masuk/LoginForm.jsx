"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/auth/actions";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/FormFields";

function MailIcon({ className = "w-4 h-4 shrink-0 mt-0.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function InfoIcon({ className = "w-4 h-4 shrink-0 mt-0.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function AlertIcon({ className = "w-4 h-4 shrink-0 mt-0.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const searchParams = useSearchParams();
  const notice = searchParams?.get("notice");
  const redirectParam = searchParams?.get("redirect");

  return (
    <form action={formAction} className="space-y-4">
      {notice === "email_confirmation_sent" && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-start gap-2.5">
          <MailIcon />
          <span>Pendaftaran berhasil! Silakan periksa email Anda (termasuk folder spam) untuk mengonfirmasi pendaftaran akun sebelum masuk.</span>
        </div>
      )}

      {notice === "login_required" && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 flex items-start gap-2.5">
          <InfoIcon />
          <span>Silakan masuk ke akun Anda terlebih dahulu untuk mengakses layanan penyewaan.</span>
        </div>
      )}

      {notice === "verification_required" && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 flex items-start gap-2.5">
          <InfoIcon />
          <span>Akses katalog memerlukan verifikasi identitas (KTP/NIB). Silakan masuk untuk melengkapi berkas Anda.</span>
        </div>
      )}

      {!notice && redirectParam && (
        <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-900 flex items-start gap-2.5">
          <InfoIcon />
          <span>Halaman yang Anda tuju memerlukan autentikasi akun. Silakan masuk terlebih dahulu.</span>
        </div>
      )}

      {state?.error && (
        <div className="p-3 rounded-lg bg-[#fadcdc] border border-[#f5b8b8] text-xs font-semibold text-[#9c2222] flex items-start gap-2.5">
          <AlertIcon />
          <span>{state.error}</span>
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
