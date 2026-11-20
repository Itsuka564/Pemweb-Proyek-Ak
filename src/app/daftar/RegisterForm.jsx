"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/auth/actions";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/FormFields";

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3 rounded-lg bg-[#fadcdc] border border-[#f5b8b8] text-xs font-semibold text-[#9c2222]">
          {state.error}
        </div>
      )}

      <Input
        label="Nama Lengkap"
        name="fullName"
        type="text"
        placeholder="Contoh: Budi Santoso"
        required
        autoComplete="name"
      />

      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="nama@email.com"
        required
        autoComplete="email"
      />

      <Input
        label="Nomor Telepon (WhatsApp)"
        name="phone"
        type="tel"
        placeholder="08xxxxxxxxxx"
        required
        autoComplete="tel"
      />

      <Input
        label="Kata Sandi"
        name="password"
        type="password"
        placeholder="Minimal 6 karakter"
        required
        autoComplete="new-password"
      />

      <div className="pt-2">
        <Button
          type="submit"
          variant="accent"
          className="w-full py-2.5"
          loading={isPending}
        >
          Daftar Sebagai Penyewa
        </Button>
      </div>
    </form>
  );
}

