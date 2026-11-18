import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import HandoverActionForm from "./HandoverActionForm";
import ReturnActionForm from "./ReturnActionForm";
import { getOfficerTaskById } from "@/lib/db/officer";

export const metadata = {
  title: "Detail Tugas Lapangan — Portal Petugas",
};

async function OfficerTaskDetailContent({ paramsPromise }) {
  const resolvedParams = await paramsPromise;
  const task = await getOfficerTaskById(resolvedParams.id);

  if (!task) {
    notFound();
  }

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isHandoverReady = task.status === "dibayar";
  const isReturnReady = task.status === "sedang_disewa";
  const isCompleted = task.status === "dikembalikan" || task.status === "selesai";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/petugas/tugas"
            className="text-xs font-bold text-[#0e6b7a] hover:underline flex items-center gap-1 mb-2"
          >
            ← Kembali ke Daftar Tugas
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#0a4a56]">
              Tugas: {task.code}
            </h1>
            <Badge status={task.status} className="text-xs px-3 py-1" />
          </div>
          <p className="text-xs text-[#5a6b78] mt-1">
            Periode Sewa: <strong>{task.startDate} s/d {task.endDate}</strong> ({task.rentalDays} hari)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isHandoverReady && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              🤝 Siap Dilakukan Serah Terima
            </span>
          )}
          {isReturnReady && (
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              🔄 Siap Dilakukan Pemeriksaan Pengembalian
            </span>
          )}
          {isCompleted && (
            <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
              ✓ Seluruh Siklus Operasional Selesai
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pemohon & Aset */}
        <div className="space-y-6 lg:col-span-1">
          <Card title="Data Penyewa & Kontak">
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-[#5a6b78] font-medium">Nama Penyewa:</dt>
                <dd className="font-bold text-[#16222b] mt-0.5">{task.renterName}</dd>
              </div>
              <div>
                <dt className="text-[#5a6b78] font-medium">Nomor Telepon / WhatsApp:</dt>
                <dd className="font-bold text-[#16222b] mt-0.5 flex items-center justify-between">
                  <span>{task.phone}</span>
                  {task.phone && task.phone !== "-" && (
                    <a
                      href={`https://wa.me/${task.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-700 font-bold hover:underline"
                    >
                      Hubungi WA ↗
                    </a>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[#5a6b78] font-medium">Alamat:</dt>
                <dd className="text-[#16222b] mt-0.5">{task.address}</dd>
              </div>
              <div>
                <dt className="text-[#5a6b78] font-medium">Tujuan Penyewaan:</dt>
                <dd className="text-[#16222b] mt-0.5">{task.purpose}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Daftar Aset yang Diserahkan">
            <div className="space-y-3 text-xs">
              {task.items.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 border border-[#d9e1e7] rounded-lg">
                  <span className="font-mono text-[10px] font-bold text-[#0a4a56] block">
                    {item.assetCode}
                  </span>
                  <span className="font-bold text-[#16222b] block">{item.assetName}</span>
                  <span className="text-[11px] text-[#5a6b78] mt-0.5 block">{item.location}</span>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-[#5a6b78]">Kondisi Master:</span>
                    <Badge status={item.physicalCondition} className="text-[10px]" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {task.assignments && task.assignments.length > 0 && (
            <Card title="Petugas yang Ditugaskan">
              <div className="space-y-2 text-xs">
                {task.assignments.map((a) => (
                  <div key={a.id} className="p-2.5 bg-slate-50 border border-[#d9e1e7] rounded-lg">
                    <span className="font-bold text-[#16222b] block">{a.staffName}</span>
                    {a.note && <p className="text-[11px] text-[#5a6b78] mt-1">{a.note}</p>}
                    <span className="text-[10px] text-[#5a6b78] block mt-1">
                      Ditugaskan: {formatDate(a.assignedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Handover & Return Sections */}
        <div className="space-y-6 lg:col-span-2">
          {/* SECTION 1: SERAH TERIMA (HANDOVER) */}
          <Card
            title="1. Berita Acara Serah Terima Aset (Handover)"
            subtitle="Pencatatan kondisi awal dan penyerahan fasilitas aset kepada penyewa."
          >
            {task.handover ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">✓</span>
                    <span className="font-bold text-emerald-950">Serah Terima Telah Selesai Dilaksanakan</span>
                  </div>
                  <Badge status={task.handover.initialCondition} className="text-[10px]" />
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-[#d9e1e7] rounded-lg">
                  <div>
                    <dt className="text-[#5a6b78]">Waktu Serah Terima:</dt>
                    <dd className="font-bold text-[#16222b] mt-0.5">
                      {formatDate(task.handover.handedOverAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#5a6b78]">Petugas Pelaksana:</dt>
                    <dd className="font-bold text-[#16222b] mt-0.5">
                      {task.handover.officerName}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[#5a6b78]">Catatan Serah Terima:</dt>
                    <dd className="text-[#16222b] mt-0.5 font-medium">
                      {task.handover.note}
                    </dd>
                  </div>
                  {task.handover.evidencePath && (
                    <div className="sm:col-span-2 pt-1">
                      <dt className="text-[#5a6b78]">Bukti Dokumentasi:</dt>
                      <dd className="font-mono text-[11px] text-[#0e6b7a] mt-0.5">
                        {task.handover.evidencePath}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            ) : isHandoverReady ? (
              <HandoverActionForm transactionId={task.id} />
            ) : (
              <div className="p-6 text-center text-xs text-[#5a6b78] bg-slate-50 border border-[#d9e1e7] rounded-lg">
                Serah terima belum dapat dilakukan karena transaksi belum berstatus pembayaran lunas.
              </div>
            )}
          </Card>

          {/* SECTION 2: PENGEMBALIAN (RETURN) */}
          <Card
            title="2. Berita Acara Pengembalian Aset (Return)"
            subtitle="Pemeriksaan kondisi akhir, kelengkapan, dan kerusakan fasilitas saat diserahkan kembali."
          >
            {task.returnRecord ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">✓</span>
                    <span className="font-bold text-emerald-950">Pemeriksaan Pengembalian Telah Selesai</span>
                  </div>
                  <Badge status={task.returnRecord.finalCondition} className="text-[10px]" />
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-[#d9e1e7] rounded-lg">
                  <div>
                    <dt className="text-[#5a6b78]">Waktu Pengembalian:</dt>
                    <dd className="font-bold text-[#16222b] mt-0.5">
                      {formatDate(task.returnRecord.returnedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#5a6b78]">Petugas Pemeriksa:</dt>
                    <dd className="font-bold text-[#16222b] mt-0.5">
                      {task.returnRecord.officerName}
                    </dd>
                  </div>
                  {task.returnRecord.damageNote && (
                    <div className="sm:col-span-2 p-2.5 bg-red-50 border border-red-200 rounded">
                      <dt className="text-red-800 font-bold">Catatan Kerusakan Fasilitas:</dt>
                      <dd className="text-red-900 mt-0.5">
                        {task.returnRecord.damageNote}
                      </dd>
                    </div>
                  )}
                  {task.returnRecord.followUpNote && (
                    <div className="sm:col-span-2">
                      <dt className="text-[#5a6b78]">Tindak Lanjut Petugas:</dt>
                      <dd className="text-[#16222b] mt-0.5">
                        {task.returnRecord.followUpNote}
                      </dd>
                    </div>
                  )}
                  {task.returnRecord.evidencePath && (
                    <div className="sm:col-span-2 pt-1">
                      <dt className="text-[#5a6b78]">Bukti Dokumentasi:</dt>
                      <dd className="font-mono text-[11px] text-[#0e6b7a] mt-0.5">
                        {task.returnRecord.evidencePath}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            ) : isReturnReady ? (
              <ReturnActionForm transactionId={task.id} />
            ) : isHandoverReady ? (
              <div className="p-6 text-center text-xs text-[#5a6b78] bg-slate-50 border border-[#d9e1e7] rounded-lg">
                Pemeriksaan pengembalian baru dapat dilakukan setelah proses Serah Terima di atas selesai dilaksanakan.
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#5a6b78] bg-slate-50 border border-[#d9e1e7] rounded-lg">
                Pengembalian belum aktif.
              </div>
            )}
          </Card>

          {/* History Timeline */}
          {task.history && task.history.length > 0 && (
            <Card title="Riwayat Status Transaksi">
              <div className="space-y-3 text-xs">
                {task.history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 pb-3 border-b border-[#d9e1e7] last:border-0">
                    <div className="w-2 h-2 rounded-full bg-[#0e6b7a] mt-1.5 shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#16222b]">
                          {h.newStatus ? h.newStatus.replace(/_/g, " ").toUpperCase() : "PERUBAHAN STATUS"}
                        </span>
                        <span className="text-[10px] text-[#5a6b78]">{formatDate(h.changedAt)}</span>
                      </div>
                      {h.note && <p className="text-[#5a6b78] mt-0.5">{h.note}</p>}
                      <span className="text-[10px] text-[#5a6b78]">Oleh: {h.changerName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OfficerTaskDetailPage({ params }) {
  return (
    <div className="max-w-5xl">
      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl border border-[#d9e1e7]">
            Memuat rincian tugas operasional...
          </div>
        }
      >
        <OfficerTaskDetailContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}
