import { Suspense } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getAdminDashboardStats } from "@/lib/db/admin";

export const metadata = {
  title: "Dashboard Admin — SewaAset",
  description: "Ringkasan metrik operasional pengelolaan aset, verifikasi pengguna, dan transaksi sewa.",
};

function DashboardIcon({ name, className = "w-4 h-4 shrink-0" }) {
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
    case "aset":
      return (
        <svg {...props}>
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" />
          <path d="M16 6h.01" />
          <path d="M12 6h.01" />
          <path d="M12 10h.01" />
          <path d="M12 14h.01" />
          <path d="M16 10h.01" />
          <path d="M16 14h.01" />
          <path d="M8 10h.01" />
          <path d="M8 14h.01" />
        </svg>
      );
    case "pengajuan":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" x2="8" y1="13" y2="13" />
          <line x1="16" x2="8" y1="17" y2="17" />
          <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
      );
    case "verifikasi":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      );
    case "aktif":
      return (
        <svg {...props}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case "kalender":
      return (
        <svg {...props}>
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      );
    case "plus":
      return (
        <svg {...props}>
          <line x1="12" x2="12" y1="5" y2="19" />
          <line x1="5" x2="19" y1="12" y2="12" />
        </svg>
      );
    default:
      return null;
  }
}

async function DashboardStatsContent() {
  const stats = await getAdminDashboardStats();

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 rounded-xl shadow-xs" bodyClassName="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-[#5a6b78] uppercase tracking-wider block">
                Total Aset Pengelola
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0a4a56]">
                  {String(stats.totalAssets).padStart(2, "0")}
                </span>
                <span className="text-xs text-[#5a6b78] truncate">
                  ({stats.activeAssets} siap pakai)
                </span>
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg text-slate-500 border border-slate-100 shrink-0">
              <DashboardIcon name="aset" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 rounded-xl shadow-xs" bodyClassName="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-[#5a6b78] uppercase tracking-wider block">
                Pengajuan Sewa Baru
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">
                  {String(stats.pendingRentals).padStart(2, "0")}
                </span>
                <span className="text-xs text-[#5a6b78] truncate">perlu review</span>
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg text-slate-500 border border-slate-100 shrink-0">
              <DashboardIcon name="pengajuan" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 rounded-xl shadow-xs" bodyClassName="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-[#5a6b78] uppercase tracking-wider block">
                Verifikasi Menunggu
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1f4f8f]">
                  {String(stats.pendingVerifications).padStart(2, "0")}
                </span>
                <span className="text-xs text-[#5a6b78] truncate">berkas KTP/NIB</span>
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg text-slate-500 border border-slate-100 shrink-0">
              <DashboardIcon name="verifikasi" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 rounded-xl shadow-xs" bodyClassName="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-[#5a6b78] uppercase tracking-wider block">
                Penyewaan Aktif
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                  {String(stats.activeRentals).padStart(2, "0")}
                </span>
                <span className="text-xs text-[#5a6b78] truncate">berjalan/dibayar</span>
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg text-slate-500 border border-slate-100 shrink-0">
              <DashboardIcon name="aktif" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tables Grid: Pengajuan & Verifikasi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pengajuan Sewa Terbaru */}
        <Card
          title="Pengajuan Sewa Terbaru"
          subtitle="Daftar penyewaan aset yang baru masuk."
          action={
            <Link href="/admin/pengajuan">
              <span className="text-xs font-bold text-[#0e6b7a] hover:underline">
                Lihat Semua →
              </span>
            </Link>
          }
        >
          {stats.recentRentals.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#5a6b78]">
              Belum ada pengajuan sewa yang masuk.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 -mx-5 -mb-5">
              {stats.recentRentals.map((r) => (
                <div key={r.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#0a4a56] text-xs">
                        {r.code}
                      </span>
                      <Badge status={r.status} className="text-[10px]" />
                    </div>
                    <p className="text-xs font-bold text-[#16222b] mt-0.5 truncate">
                      {r.renterName}
                    </p>
                    <p className="text-[11px] text-[#5a6b78]">
                      {r.startDate} s/d {r.endDate} • {formatRupiah(r.totalCost)}
                    </p>
                  </div>

                  <Link href={`/admin/pengajuan/${r.id}`}>
                    <Button variant="outline" size="sm" className="text-xs py-1 px-2.5">
                      Tinjau
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Verifikasi Menunggu Peninjauan */}
        <Card
          title="Verifikasi Menunggu Peninjauan"
          subtitle="Berkas KTP/NPWP/NIB yang perlu disetujui."
          action={
            <Link href="/admin/verifikasi">
              <span className="text-xs font-bold text-[#0e6b7a] hover:underline">
                Lihat Semua →
              </span>
            </Link>
          }
        >
          {stats.recentVerifications.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#5a6b78]">
              Tidak ada berkas verifikasi yang menunggu.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 -mx-5 -mb-5">
              {stats.recentVerifications.map((v) => (
                <div key={v.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                        {v.documentType}
                      </span>
                      <span className="font-mono text-xs text-[#16222b]">
                        {v.documentNumber}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#16222b] mt-0.5 truncate">
                      {v.renterName}
                    </p>
                    <p className="text-[11px] text-[#5a6b78]">
                      Diajukan: {formatDate(v.submittedAt)}
                    </p>
                  </div>

                  <Link href={`/admin/verifikasi/${v.id}`}>
                    <Button variant="accent" size="sm" className="text-xs py-1 px-2.5">
                      Tinjau Berkas
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity Log & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Aktivitas Perubahan Status Terbaru" subtitle="Audit jejak pemrosesan transaksi sewa secara kronologis.">
            {stats.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#5a6b78]">
                Belum ada aktivitas transaksi yang tercatat.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {stats.recentActivity.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-slate-200 last:border-0 last:pb-0">
                    <span className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-[#0a4a56]">{a.trxCode}</span>
                        <span className="text-[10px] text-[#5a6b78] shrink-0">{formatDate(a.changedAt)}</span>
                      </div>
                      <p className="text-[#16222b] mt-0.5 font-medium">{a.note}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Badge status={a.newStatus} className="text-[10px]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions Shortcuts */}
        <div>
          <Card title="Aksi Cepat Admin">
            <div className="space-y-2.5">
              <Link href="/admin/aset/baru" className="block">
                <Button variant="accent" size="md" className="w-full justify-start gap-2.5 text-xs">
                  <DashboardIcon name="plus" />
                  <span>Tambah Aset Baru</span>
                </Button>
              </Link>
              <Link href="/admin/kalender" className="block">
                <Button variant="outline" size="md" className="w-full justify-start gap-2.5 text-xs">
                  <DashboardIcon name="kalender" />
                  <span>Buka Kalender Okupansi</span>
                </Button>
              </Link>
              <Link href="/admin/verifikasi" className="block">
                <Button variant="outline" size="md" className="w-full justify-start gap-2.5 text-xs">
                  <DashboardIcon name="verifikasi" />
                  <span>Tinjau Verifikasi Dokumen</span>
                </Button>
              </Link>
              <Link href="/admin/pengajuan" className="block">
                <Button variant="outline" size="md" className="w-full justify-start gap-2.5 text-xs">
                  <DashboardIcon name="pengajuan" />
                  <span>Periksa Pengajuan Sewa</span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a4a56]">
            Dashboard Administrasi
          </h1>
          <p className="text-xs text-[#5a6b78] mt-1">
            Ringkasan ketersediaan aset, verifikasi penyewa, dan persetujuan transaksi sewa aset.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/admin/aset/baru">
            <Button variant="accent" size="sm" className="gap-1.5">
              <DashboardIcon name="plus" className="w-3.5 h-3.5 shrink-0" />
              <span>Tambah Aset Baru</span>
            </Button>
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl border border-slate-200">
            Memuat metrik dashboard admin...
          </div>
        }
      >
        <DashboardStatsContent />
      </Suspense>
    </div>
  );
}
