import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import VerificationForm from "./VerificationForm";

async function VerificationContent({ searchParams }) {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let verification = null;

  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = p;

    const { data: v } = await supabase
      .from("user_verifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    verification = v;
  }

  const sp = await searchParams;
  const notice = sp?.notice;
  const submitted = sp?.submitted;

  return (
    <>
      {submitted === "true" && (
        <div className="p-4 rounded-xl bg-[#dff3e8] border border-[#b8e4cd] text-xs text-[#17633c] flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="font-bold">Berkas Identitas Berhasil Terkirim</p>
            <p>Dokumen Anda telah tersimpan dan sedang menunggu peninjauan serta verifikasi oleh Admin.</p>
          </div>
        </div>
      )}

      {notice === "verification_required" && (
        <div className="p-4 rounded-xl bg-[#fff0cc] border border-[#fde199] text-xs text-[#7a5200] flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold">Akses Katalog Terkunci</p>
            <p>Anda harus memiliki akun yang terverifikasi (disetujui Admin) sebelum dapat menjelajahi detail dan mengajukan sewa aset.</p>
          </div>
        </div>
      )}

      {/* Status Card */}
      {verification && (
        <Card className="border-l-4 border-l-[#0e6b7a]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#5a6b78] uppercase">
                  Status Dokumen:
                </span>
                <Badge status={verification.status} />
              </div>
              <h3 className="text-base font-bold text-[#16222b]">
                {verification.document_type?.toUpperCase()} — {verification.document_number || "Tidak ada nomor"}
              </h3>
              <p className="text-xs text-[#5a6b78] mt-1">
                Dikirim pada: {new Date(verification.submitted_at || verification.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            {verification.status === "disetujui" && (
              <Link
                href="/katalog"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg bg-[#f2a33a] text-[#16222b] hover:bg-[#e29329] transition-colors"
              >
                Buka Katalog Aset →
              </Link>
            )}
          </div>

          {verification.status === "ditolak" && (
            <div className="mt-4 p-3 rounded-lg bg-[#fadcdc] border border-[#f5b8b8] text-xs text-[#9c2222]">
              <p className="font-bold">Alasan Penolakan dari Admin:</p>
              <p className="mt-0.5">{verification.rejection_reason || "Dokumen tidak memenuhi persyaratan yang ditentukan."}</p>
            </div>
          )}

          {verification.status === "menunggu" && (
            <div className="mt-4 p-3 rounded-lg bg-[#fff0cc] border border-[#fde199] text-xs text-[#7a5200]">
              Dokumen Anda sedang dalam antrean review oleh Admin. Anda akan menerima notifikasi segera setelah keputusan dibuat.
            </div>
          )}
        </Card>
      )}

      {/* Form Upload jika belum disetujui */}
      {(!verification || verification.status === "ditolak" || verification.status === "perlu_dikirim_ulang") && (
        <Card
          title={verification ? "Unggah Ulang Dokumen Identitas" : "Formulir Verifikasi Identitas"}
          subtitle="Pastikan foto atau pindaian dokumen terbaca jelas dalam format JPG, PNG, atau PDF."
        >
          <VerificationForm />
        </Card>
      )}
    </>
  );
}

export default function VerificationPage({ searchParams }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9]">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a4a56]">
            Verifikasi Identitas & Dokumen
          </h1>
          <p className="text-xs text-[#5a6b78] mt-1">
            Demi keamanan transaksi aset, calon penyewa wajib mengunggah KTP (perorangan) atau NPWP/NIB (badan usaha/organisasi).
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-[#5a6b78] bg-white rounded-xl border border-[#d9e1e7]">Memuat status verifikasi...</div>}>
          <VerificationContent searchParams={searchParams} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
