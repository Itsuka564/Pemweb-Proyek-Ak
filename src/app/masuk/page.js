import { Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Masuk — SewaAset Kelompok 10",
  description: "Masuk ke akun SewaAset untuk mengelola penyewaan aset.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#f2a33a] text-[#16222b] grid place-items-center text-xl font-black mx-auto shadow-sm">
              ▣
            </div>
            <h1 className="text-2xl font-extrabold text-[#0a4a56]">
              Selamat Datang Kembali
            </h1>
            <p className="text-xs text-[#5a6b78]">
              Masuk ke akun SewaAset untuk mengelola dan memantau penyewaan asetmu.
            </p>
          </div>

          <Card className="p-6 sm:p-8 shadow-sm">
            <Suspense fallback={<div className="text-center py-6 text-xs text-[#5a6b78]">Memuat formulir masuk...</div>}>
              <LoginForm />
            </Suspense>

            <div className="mt-6 pt-5 border-t border-[#d9e1e7] text-center text-xs text-[#5a6b78]">
              Belum memiliki akun penyewa?{" "}
              <Link href="/daftar" className="font-bold text-[#0e6b7a] hover:underline">
                Daftar sekarang →
              </Link>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
