import { Suspense } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getAdminDashboardStats } from "@/lib/db/admin";

export const metadata = {
  title: "Dashboard Admin — SewaAset Kelompok 10",
  description: "Ringkasan metrik operasional pengelolaan aset, verifikasi pengguna, dan transaksi sewa.",
};

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-[#0e6b7a]">
          <div>
            <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">
              Total Aset Pengelola
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-[#0a4a56]">
                {String(stats.totalAssets).padStart(2, "0")}
              </span>
              <span className="text-xs text-[#5a6b78]">
                ({stats.activeAssets} siap pakai)
              </span>
            </div>
          </div>
          <span className="text-2xl">🏢</span>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">
              Pengajuan Sewa Baru
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-600">
                {String(stats.pendingRentals).padStart(2, "0")}
              </span>
              <span className="text-xs text-[#5a6b78]">perlu review</span>
            </div>
          </div>
          <span className="text-2xl">📋</span>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-[#1f4f8f]">
          <div>
            <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">
              Verifikasi Menunggu
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-[#1f4f8f]">
                {String(stats.pendingVerifications).padStart(2, "0")}
              </span>
              <span className="text-xs text-[#5a6b78]">berkas KTP/NIB</span>
            </div>
          </div>
          <span className="text-2xl">🪪</span>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-emerald-600">
          <div>
            <span className="text-[11px] font-bold text-[#5a6b78] uppercase block">
              Penyewaan Aktif
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                {String(stats.activeRentals).padStart(2, "0")}
              </span>
              <span className="text-xs text-[#5a6b78]">berjalan/dibayar</span>
            </div>
          </div>
          <span className="text-2xl">✓</span>
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
            <div className="divide-y divide-[#d9e1e7] -mx-5 -mb-5">
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
            <div className="divide-y divide-[#d9e1e7] -mx-5 -mb-5">
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
                  <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-[#d9e1e7] last:border-0">
                    <span className="text-sm">📌</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#0a4a56]">{a.trxCode}</span>
                        <span className="text-[10px] text-[#5a6b78]">{formatDate(a.changedAt)}</span>
                      </div>
                      <p className="text-[#16222b] mt-0.5 font-medium">{a.note}</p>
                      <div className="flex items-center gap-1.5 mt-1">
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
        <div className="space-y-4">
          <Card title="Aksi Cepat Admin">
            <div className="space-y-2">
              <Link href="/admin/aset/baru" className="block">
                <Button variant="accent" size="md" className="w-full justify-start text-xs">
                  <span>+</span> Tambah Aset Baru
                </Button>
              </Link>
              <Link href="/admin/kalender" className="block">
                <Button variant="outline" size="md" className="w-full justify-start text-xs">
                  <span>📅</span> Buka Kalender Okupansi
                </Button>
              </Link>
              <Link href="/admin/verifikasi" className="block">
                <Button variant="outline" size="md" className="w-full justify-start text-xs">
                  <span>🪪</span> Tinjau Verifikasi Dokumen
                </Button>
              </Link>
              <Link href="/admin/pengajuan" className="block">
                <Button variant="outline" size="md" className="w-full justify-start text-xs">
                  <span>📋</span> Periksa Pengajuan Sewa
                </Button>
              </Link>
            </div>
          </Card>

          <Card title="Status Operasional Sistem">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#5a6b78]">Entitas:</span>
                <span className="font-bold text-[#16222b]">Pengelola Tunggal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5a6b78]">Metode Booking:</span>
                <span className="font-bold text-[#0a4a56]">Multi-Aset Inklusif</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5a6b78]">Anti Double-Booking:</span>
                <span className="font-bold text-emerald-700">GiST Exclusion Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5a6b78]">Storage Berkas:</span>
                <span className="font-bold text-[#16222b]">Private Bucket Signed URL</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a4a56]">
            Dashboard Administrasi
          </h1>
          <p className="text-xs text-[#5a6b78] mt-1">
            Ringkasan ketersediaan aset, verifikasi penyewa, dan persetujuan transaksi sewa aset.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/aset/baru">
            <Button variant="accent" size="sm">
              + Tambah Aset Baru
            </Button>
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl border border-[#d9e1e7]">
            Memuat metrik dashboard admin...
          </div>
        }
      >
        <DashboardStatsContent />
      </Suspense>
    </div>
  );
}
