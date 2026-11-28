import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white text-[#5a6b78]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-[#f2a33a] text-[#16222b] grid place-items-center shadow-xs">
                <svg
                  className="w-3.5 h-3.5 text-[#16222b]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="3" />
                  <rect width="8" height="8" x="8" y="8" rx="1" fill="currentColor" />
                </svg>
              </span>
              <span className="font-extrabold text-base text-[#0a4a56]">SewaAset</span>
            </div>
            <p className="text-xs text-[#5a6b78] max-w-sm leading-relaxed">
              Platform penyewaan aset terpadu untuk instansi dan perusahaan. Kelola pemesanan aset tanah, gedung pertemuan, dan ruangan secara efisien, aman, dan transparan.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-[#16222b] uppercase tracking-wider">Layanan</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/katalog" className="hover:text-[#0e6b7a] transition-colors">
                  Katalog Aset
                </Link>
              </li>
              <li>
                <Link href="/masuk" className="hover:text-[#0e6b7a] transition-colors">
                  Verifikasi Berkas
                </Link>
              </li>
              <li>
                <Link href="/panduan" className="hover:text-[#0e6b7a] transition-colors">
                  Panduan Penyewaan
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-[#16222b] uppercase tracking-wider">
              Bantuan &amp; Kontak
            </h4>
            <div className="text-xs space-y-1.5 text-[#5a6b78]">
              <p>Email: layanan@sewaaset.id</p>
              <p>Jam Layanan: Senin – Jumat, 08.00 – 16.00 WIB</p>
              <p>Pusat Layanan Pengelolaan Aset</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 SewaAset. Hak cipta dilindungi undang-undang.</p>
          <p className="text-slate-400">Layanan Pengelolaan &amp; Penyewaan Aset Resmi</p>
        </div>
      </div>
    </footer>
  );
}
