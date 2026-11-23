import { Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getPopularAssets } from "@/lib/db/assets";

function AssetPlaceholder({ category = "", name = "", className = "w-12 h-12 text-[#0e6b7a]/70" }) {
  const text = `${category} ${name}`.toLowerCase();

  // Parkir / Kendaraan / Otomotif
  if (text.includes("parkir") || text.includes("mobil") || text.includes("kendaraan")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="3" />
        <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
      </svg>
    );
  }

  // Tanah / Lahan Terbuka / Outdoor
  if (text.includes("tanah") || text.includes("lahan")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m2 20 7-8 4 5 3-4 6 7Z" />
        <path d="M17 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0" />
        <path d="M2 20h20" />
      </svg>
    );
  }

  // Auditorium / Panggung
  if (text.includes("auditorium") || text.includes("teater") || text.includes("panggung")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 19h20" />
        <path d="M5 19v-4a7 7 0 0 1 14 0v4" />
        <path d="M9 19v-2a3 3 0 0 1 6 0v2" />
        <circle cx="12" cy="7" r="2" />
      </svg>
    );
  }

  // Ruangan / Ruang Rapat
  if (text.includes("ruang") || text.includes("meeting") || text.includes("rapat")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
        <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
        <path d="M5 18v3" />
        <path d="M19 18v3" />
      </svg>
    );
  }

  // Default: Gedung Pertemuan / Bangunan
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
}

async function PopularAssetsList() {
  const assets = await getPopularAssets(3);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {assets.map((asset) => (
        <Card key={asset.id} className="hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between border-slate-200">
          <div className="space-y-4">
            <div className="h-40 rounded-lg bg-[#d7edf0]/50 flex items-center justify-center overflow-hidden">
              {asset.photo && asset.photo.startsWith("http") ? (
                <img
                  src={asset.photo}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <AssetPlaceholder
                  category={asset.category}
                  name={asset.name}
                  className="w-14 h-14 text-[#0e6b7a]/70"
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-[#5a6b78] tracking-wider uppercase">
                  {asset.code} <span className="text-slate-300">•</span> {asset.category}
                </span>
                <Badge variant="tersedia">Siap Sewa</Badge>
              </div>
              <h3 className="text-base font-extrabold text-[#16222b] line-clamp-1">
                {asset.name}
              </h3>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-[#5a6b78]">Mulai dari</span>
                <p className="text-lg font-black text-[#0a4a56]">
                  {formatRupiah(asset.dailyRate)}
                  <span className="text-xs font-normal text-[#5a6b78]"> / hari</span>
                </p>
              </div>
              <Link href="/katalog">
                <Button variant="outline" size="sm">
                  Detail
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AssetsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="h-40 bg-slate-200 rounded-lg"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="h-6 bg-slate-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Section */}
        <section className="hero-gradient text-white rounded-2xl p-8 sm:p-12 shadow-lg relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Sewa aset, tanpa ribet.
            </h1>
            <p className="text-sm sm:text-base text-[#d7edf0] leading-relaxed max-w-lg">
              Temukan tanah, gedung pertemuan, dan ruangan yang sesuai kebutuhanmu. Periksa jadwal ketersediaan kalender secara transparan, ajukan penyewaan, dan pantau statusnya dari satu tempat.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/katalog">
                <Button variant="accent" size="lg">
                  Jelajahi Katalog →
                </Button>
              </Link>
              <Link href="/daftar">
                <Button variant="outline-white" size="lg">
                  Daftar Akun
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Section: Aset Populer */}
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0a4a56]">
                Aset Pilihan & Populer
              </h2>
              <p className="text-xs text-[#5a6b78] mt-1">
                Aset siap sewa dengan fasilitas lengkap dan lokasi strategis.
              </p>
            </div>
            <Link href="/katalog" className="text-xs font-bold text-[#0e6b7a] hover:underline">
              Lihat Semua Katalog →
            </Link>
          </div>

          <Suspense fallback={<AssetsSkeleton />}>
            <PopularAssetsList />
          </Suspense>
        </section>

        {/* Section: Mengapa SewaAset? */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0a4a56]">
              Mengapa Memilih SewaAset?
            </h2>
            <p className="text-xs text-[#5a6b78]">
              Dirancang khusus untuk keandalan pengelolaan aset instansi dan kenyamanan penyewa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center p-6 space-y-3 border-slate-200">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#d7edf0] text-[#0e6b7a] grid place-items-center">
                <svg className="w-6 h-6 text-[#0e6b7a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#16222b]">Mudah Dicari & Transparan</h3>
              <p className="text-xs text-[#5a6b78] leading-relaxed">
                Filter aset berdasarkan kategori tanah, gedung, atau ruangan. Spesifikasi lengkap, foto fisik, dan tarif harian/bulanan tertera jelas.
              </p>
            </Card>

            <Card className="text-center p-6 space-y-3 border-slate-200">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#fff0cc] text-[#7a5200] grid place-items-center">
                <svg className="w-6 h-6 text-[#7a5200]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" />
                  <path d="M16 2v4" />
                  <path d="M8 2v4" />
                  <path d="M3 10h18" />
                  <path d="m9 16 2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#16222b]">Jadwal Pasti Tanpa Benturan</h3>
              <p className="text-xs text-[#5a6b78] leading-relaxed">
                Sistem kalender inklusif memblokir hari kalender dan memperhitungkan buffer persiapan secara otomatis untuk mencegah double-booking.
              </p>
            </Card>

            <Card className="text-center p-6 space-y-3 border-slate-200">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#dff3e8] text-[#17633c] grid place-items-center">
                <svg className="w-6 h-6 text-[#17633c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#16222b]">Legalitas PKS & Pembayaran Aman</h3>
              <p className="text-xs text-[#5a6b78] leading-relaxed">
                Pembayaran digital terverifikasi. Dokumen Perjanjian Kerja Sama (PKS) resmi langsung terbit seketika pembayaran terkonfirmasi.
              </p>
            </Card>
          </div>
        </section>

        {/* Section: Alur Proses */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0a4a56]">
              4 Langkah Mudah Menyewa Aset
            </h2>
            <p className="text-xs text-[#5a6b78] mt-1">
              Alur terintegrasi dari verifikasi legalitas hingga serah terima aset.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#0a4a56] text-white grid place-items-center text-xs font-bold">
                1
              </div>
              <h4 className="text-sm font-bold text-[#16222b]">Registrasi & Verifikasi</h4>
              <p className="text-xs text-[#5a6b78] leading-relaxed">
                Daftar akun dan unggah dokumen KTP/NPWP/NIB untuk diverifikasi oleh Admin.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#0e6b7a] text-white grid place-items-center text-xs font-bold">
                2
              </div>
              <h4 className="text-sm font-bold text-[#16222b]">Pilih Aset & Periode</h4>
              <p className="text-xs text-[#5a6b78] leading-relaxed">
                Akses katalog setelah lolos verifikasi, periksa kalender ketersediaan, dan kirim pengajuan.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#f2a33a] text-[#16222b] grid place-items-center text-xs font-extrabold">
                3
              </div>
              <h4 className="text-sm font-bold text-[#16222b]">Persetujuan & Pembayaran</h4>
              <p className="text-xs text-[#5a6b78] leading-relaxed">
                Admin menyetujui pengajuan, lalu lakukan pembayaran digital terverifikasi yang aman.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#17633c] text-white grid place-items-center text-xs font-bold">
                4
              </div>
              <h4 className="text-sm font-bold text-[#16222b]">PKS & Serah Terima</h4>
              <p className="text-xs text-[#5a6b78] leading-relaxed">
                Unduh kontrak PKS digital dan berita acara serah terima aset dicatat oleh Petugas di lokasi.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
