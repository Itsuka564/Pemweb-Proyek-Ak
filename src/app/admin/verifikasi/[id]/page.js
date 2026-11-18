import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ReviewActionForm from "./ReviewActionForm";
import { getAdminVerificationById } from "@/lib/db/admin";

export const metadata = {
  title: "Tinjau Berkas Verifikasi — Admin Portal",
};

async function VerificationDetailContent({ paramsPromise }) {
  const resolvedParams = await paramsPromise;
  const verification = await getAdminVerificationById(resolvedParams.id);

  if (!verification) {
    notFound();
  }

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isPdf = verification.filePath?.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-6">
      {/* Header & Back */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/verifikasi"
            className="text-xs font-bold text-[#0e6b7a] hover:underline flex items-center gap-1 mb-2"
          >
            ← Kembali ke Daftar Verifikasi
          </Link>
          <h1 className="text-2xl font-extrabold text-[#0a4a56]">
            Tinjau Berkas: {verification.renterName}
          </h1>
          <p className="text-xs text-[#5a6b78] mt-1">
            ID Pengajuan: <span className="font-mono">{verification.id}</span>
          </p>
        </div>

        <Badge status={verification.status} className="text-xs px-3 py-1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Applicant & Document Info */}
        <div className="space-y-6 lg:col-span-1">
          <Card title="Data Pemohon">
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-[#5a6b78] font-medium">Nama Lengkap:</dt>
                <dd className="font-bold text-[#16222b] mt-0.5">{verification.renterName}</dd>
              </div>
              <div>
                <dt className="text-[#5a6b78] font-medium">Nomor Telepon / WhatsApp:</dt>
                <dd className="font-bold text-[#16222b] mt-0.5">{verification.phone}</dd>
              </div>
              <div>
                <dt className="text-[#5a6b78] font-medium">Alamat:</dt>
                <dd className="font-medium text-[#16222b] mt-0.5">{verification.address}</dd>
              </div>
              <div>
                <dt className="text-[#5a6b78] font-medium">Waktu Pengajuan:</dt>
                <dd className="font-medium text-[#16222b] mt-0.5">
                  {formatDate(verification.submittedAt)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Metadata Dokumen">
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-[#5a6b78] font-medium">Jenis Identitas:</dt>
                <dd className="font-bold text-[#0a4a56] text-sm mt-0.5">
                  {verification.documentType}
                </dd>
              </div>
              <div>
                <dt className="text-[#5a6b78] font-medium">Nomor Identitas (NIK/NPWP/NIB):</dt>
                <dd className="font-mono font-bold text-[#16222b] mt-0.5">
                  {verification.documentNumber}
                </dd>
              </div>
              <div>
                <dt className="text-[#5a6b78] font-medium">Storage Path Privat:</dt>
                <dd className="font-mono text-[11px] text-[#5a6b78] break-all mt-0.5">
                  {verification.filePath || "Simulasi Berkas"}
                </dd>
              </div>

              {verification.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <dt className="text-red-800 font-bold">Catatan Penolakan / Revisi Terakhir:</dt>
                  <dd className="text-red-700 mt-1">{verification.rejectionReason}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        {/* Right: Document Preview & Action Form */}
        <div className="space-y-6 lg:col-span-2">
          <Card title="Pratinjau Berkas Identitas" subtitle="Akses file aman melalui URL bertanda tangan (Signed URL).">
            <div className="border border-[#d9e1e7] rounded-xl overflow-hidden bg-slate-50 min-h-[350px] flex flex-col items-center justify-center p-4">
              {verification.signedFileUrl ? (
                isPdf ? (
                  <div className="w-full text-center space-y-4 py-8">
                    <div className="text-4xl">📄</div>
                    <p className="text-xs font-bold text-[#16222b]">Dokumen PDF: {verification.documentType}</p>
                    <a
                      href={verification.signedFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button variant="primary" size="sm">
                        Buka / Unduh Dokumen PDF ↗
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center">
                    <img
                      src={verification.signedFileUrl}
                      alt={`Dokumen ${verification.documentType}`}
                      className="max-h-[500px] w-auto object-contain rounded-lg shadow-sm border border-slate-200"
                    />
                    <div className="mt-3">
                      <a
                        href={verification.signedFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#0e6b7a] hover:underline"
                      >
                        Buka Gambar Ukuran Penuh ↗
                      </a>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center p-8 space-y-2">
                  <div className="text-4xl text-slate-400">🪪</div>
                  <p className="text-xs font-bold text-[#16222b]">
                    Dokumen Disimpan di Private Storage
                  </p>
                  <p className="text-[11px] text-[#5a6b78] max-w-sm">
                    Path: <span className="font-mono">{verification.filePath}</span>
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Review Decision Form */}
          <Card
            title="Formulir Keputusan Admin"
            subtitle="Pilih status persetujuan. Penolakan atau permintaan revisi wajib disertai catatan penjelas."
          >
            <ReviewActionForm
              verificationId={verification.id}
              currentStatus={verification.status}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function VerificationDetailPage({ params }) {
  return (
    <div className="max-w-5xl">
      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl border border-[#d9e1e7]">
            Memuat berkas verifikasi...
          </div>
        }
      >
        <VerificationDetailContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}
