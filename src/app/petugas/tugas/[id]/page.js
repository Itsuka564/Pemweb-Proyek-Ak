import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import HandoverActionForm from "./HandoverActionForm";
import ReturnActionForm from "./ReturnActionForm";
import { getOfficerTaskById } from "@/lib/db/officer";

export const metadata = {
  title: "Detail Tugas Lapangan — Portal Petugas",
};

function DetailIcon({ name, className = "w-4 h-4 shrink-0" }) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "arrow_left":
      return (
        <svg {...props}>
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
      );
    case "external":
      return (
        <svg {...props}>
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
      );
    case "serah_terima":
      return (
        <svg {...props}>
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      );
    case "pengembalian":
      return (
        <svg {...props}>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    default:
      return null;
  }
}

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

  const isHandoverReady = task.status === "disetujui" || task.status === "dibayar";
  const isReturnReady = task.status === "sedang_disewa";
  const isCompleted = task.status === "dikembalikan" || task.status === "selesai";

  return (
    <div className="space-y-6">
      {/* Header & Back */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Link
            href="/petugas/tugas"
            className="text-xs font-medium text-slate-500 hover:text-[#0e6b7a] inline-flex items-center gap-1.5 mb-2 transition-colors"
          >
            <DetailIcon name="arrow_left" className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Tugas</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
              Tugas: {task.code}
            </h1>
            <Badge status={task.status} className="text-[11px] font-medium px-2.5 py-0.5" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Periode Sewa:{" "}
            <strong className="font-medium text-slate-700">
              {task.startDate} s/d {task.endDate}
            </strong>{" "}
            ({task.rentalDays} hari)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isHandoverReady && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-600/20 px-3 py-1.5 rounded-lg">
              <DetailIcon name="serah_terima" className="w-4 h-4 shrink-0" />
              <span>Siap Dilakukan Serah Terima</span>
            </span>
          )}
          {isReturnReady && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 ring-1 ring-inset ring-amber-600/20 px-3 py-1.5 rounded-lg">
              <DetailIcon name="pengembalian" className="w-4 h-4 shrink-0" />
              <span>Siap Dilakukan Pemeriksaan Pengembalian</span>
            </span>
          )}
          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 ring-1 ring-inset ring-slate-500/20 px-3 py-1.5 rounded-lg">
              <DetailIcon name="check" className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Seluruh Siklus Operasional Selesai</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pemohon & Aset */}
        <div className="space-y-6 lg:col-span-1">
          <Card title="Data Penyewa & Kontak" className="border-slate-200/80">
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-slate-500 font-medium">Nama Penyewa</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">{task.renterName}</dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium">Nomor Telepon / WhatsApp</dt>
                <dd className="font-semibold text-slate-900 mt-0.5 flex items-center justify-between gap-2">
                  <span>{task.phone}</span>
                  {task.phone && task.phone !== "-" && (
                    <a
                      href={`https://wa.me/${task.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#0e6b7a] font-medium hover:underline shrink-0"
                    >
                      <span>Hubungi WA</span>
                      <DetailIcon name="external" className="w-3 h-3" />
                    </a>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium">Alamat</dt>
                <dd className="text-slate-700 mt-0.5 leading-relaxed">{task.address}</dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium">Tujuan Penyewaan</dt>
                <dd className="text-slate-700 mt-0.5 leading-relaxed">{task.purpose}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Daftar Aset yang Diserahkan" className="border-slate-200/80">
            <div className="space-y-3 text-xs">
              {task.items.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-lg">
                  <span className="font-mono text-[10px] font-medium text-slate-500 block">
                    {item.assetCode}
                  </span>
                  <span className="font-semibold text-slate-900 block mt-0.5">{item.assetName}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">{item.location}</span>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Kondisi Master</span>
                    <Badge status={item.physicalCondition} className="text-[10px]" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {task.assignments && task.assignments.length > 0 && (
            <Card title="Petugas yang Ditugaskan" className="border-slate-200/80">
              <div className="space-y-2 text-xs">
                {task.assignments.map((a) => (
                  <div key={a.id} className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-lg">
                    <span className="font-semibold text-slate-900 block">{a.staffName}</span>
                    {a.note && <p className="text-[11px] text-slate-600 mt-1">{a.note}</p>}
                    <span className="text-[10px] text-slate-500 block mt-1.5">
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
            className="border-slate-200/80"
          >
            {task.handover ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-900">
                    <DetailIcon name="check" className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">Serah Terima Telah Selesai Dilaksanakan</span>
                  </div>
                  <Badge status={task.handover.initialCondition} className="text-[10px]" />
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-lg">
                  <div>
                    <dt className="text-slate-500">Waktu Serah Terima</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      {formatDate(task.handover.handedOverAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Petugas Pelaksana</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      {task.handover.officerName}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">Catatan Serah Terima</dt>
                    <dd className="text-slate-800 mt-0.5 font-medium leading-relaxed">
                      {task.handover.note}
                    </dd>
                  </div>
                  {task.handover.evidencePath && (
                    <div className="sm:col-span-2 pt-1">
                      <dt className="text-slate-500">Bukti Dokumentasi</dt>
                      <dd className="font-mono text-[11px] text-[#0e6b7a] mt-0.5 break-all">
                        {task.handover.evidencePath}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            ) : isHandoverReady ? (
              <HandoverActionForm transactionId={task.id} />
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50/80 border border-slate-200/80 rounded-lg">
                Serah terima belum dapat dilakukan karena transaksi belum berstatus pembayaran lunas.
              </div>
            )}
          </Card>

          {/* SECTION 2: PENGEMBALIAN (RETURN) */}
          <Card
            title="2. Berita Acara Pengembalian Aset (Return)"
            subtitle="Pemeriksaan kondisi akhir, kelengkapan, dan kerusakan fasilitas saat diserahkan kembali."
            className="border-slate-200/80"
          >
            {task.returnRecord ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-900">
                    <DetailIcon name="check" className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">Pemeriksaan Pengembalian Telah Selesai</span>
                  </div>
                  <Badge status={task.returnRecord.finalCondition} className="text-[10px]" />
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-lg">
                  <div>
                    <dt className="text-slate-500">Waktu Pengembalian</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      {formatDate(task.returnRecord.returnedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Petugas Pemeriksa</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      {task.returnRecord.officerName}
                    </dd>
                  </div>
                  {task.returnRecord.damageNote && (
                    <div className="sm:col-span-2 p-2.5 bg-rose-50/80 border border-rose-200 rounded-md">
                      <dt className="text-rose-800 font-semibold">Catatan Kerusakan Fasilitas</dt>
                      <dd className="text-rose-900 mt-0.5 leading-relaxed">
                        {task.returnRecord.damageNote}
                      </dd>
                    </div>
                  )}
                  {task.returnRecord.followUpNote && (
                    <div className="sm:col-span-2">
                      <dt className="text-slate-500">Tindak Lanjut Petugas</dt>
                      <dd className="text-slate-800 mt-0.5 leading-relaxed">
                        {task.returnRecord.followUpNote}
                      </dd>
                    </div>
                  )}
                  {task.returnRecord.evidencePath && (
                    <div className="sm:col-span-2 pt-1">
                      <dt className="text-slate-500">Bukti Dokumentasi</dt>
                      <dd className="font-mono text-[11px] text-[#0e6b7a] mt-0.5 break-all">
                        {task.returnRecord.evidencePath}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            ) : isReturnReady ? (
              <ReturnActionForm transactionId={task.id} />
            ) : isHandoverReady ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50/80 border border-slate-200/80 rounded-lg">
                Pemeriksaan pengembalian baru dapat dilakukan setelah proses Serah Terima di atas selesai dilaksanakan.
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50/80 border border-slate-200/80 rounded-lg">
                Pengembalian belum aktif.
              </div>
            )}
          </Card>

          {/* History Timeline */}
          {task.history && task.history.length > 0 && (
            <Card title="Riwayat Status Transaksi" className="border-slate-200/80">
              <div className="space-y-3 text-xs">
                {task.history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 pb-3 border-b border-slate-200/80 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">
                          {h.newStatus ? h.newStatus.replace(/_/g, " ").toUpperCase() : "PERUBAHAN STATUS"}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0">{formatDate(h.changedAt)}</span>
                      </div>
                      {h.note && <p className="text-slate-600 mt-0.5">{h.note}</p>}
                      <span className="text-[10px] text-slate-400 block mt-0.5">Oleh: {h.changerName}</span>
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
    <div className="max-w-7xl mx-auto">
      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200/80">
            Memuat rincian tugas operasional...
          </div>
        }
      >
        <OfficerTaskDetailContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}
