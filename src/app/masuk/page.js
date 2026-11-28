import { Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Masuk — SewaAset",
  description: "Masuk ke akun SewaAset untuk mengelola penyewaan aset.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          <Card className="border-slate-200 shadow-sm" bodyClassName="p-6 sm:p-8">
            <div className="space-y-1.5 mb-6">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a4a56] tracking-tight">
                Selamat Datang Kembali
              </h1>
              <p className="text-xs text-[#5a6b78] leading-relaxed">
                Masuk ke akun SewaAset untuk mengelola dan memantau penyewaan aset Anda.
              </p>
            </div>

            <Suspense fallback={<div className="text-center py-6 text-xs text-[#5a6b78]">Memuat formulir masuk...</div>}>
              <LoginForm />
            </Suspense>

            <div className="mt-6 pt-5 border-t border-slate-200 text-center text-xs text-[#5a6b78]">
              Belum memiliki akun penyewa?{" "}
              <Link href="/daftar" className="font-bold text-[#0e6b7a] hover:underline">
                Daftar sekarang
              </Link>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
