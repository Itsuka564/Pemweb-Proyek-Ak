import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#d9e1e7] bg-white text-[#5a6b78]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#f2a33a] text-[#16222b] grid place-items-center text-xs font-black">
                ▣
              </span>
              <span className="font-extrabold text-base text-[#0a4a56]">SewaAset</span>
            </div>
            <p className="text-xs text-[#5a6b78] max-w-sm leading-relaxed">
              Sistem Informasi Penyewaan Aset terpadu untuk instansi dan perusahaan. Kelola aset tanah, gedung pertemuan, dan ruangan secara efisien, aman, dan akuntabel.
            </p>
          </div>

          <div className="space-y-2">
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

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#16222b] uppercase tracking-wider">Pengembang</h4>
            <div className="text-xs space-y-1 text-[#5a6b78]">
              <p className="font-semibold text-[#16222b]">Kelompok 10 — Pemweb Proyek Akhir</p>
              <p>Arvian Poetra Sadewa (2404140026)</p>
              <p>Erlang Aquila Dinar Dewangga (2404140050)</p>
              <p>Tomi Adyatma (2404140069)</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#d9e1e7] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 SewaAset Kelompok 10. Hak cipta dilindungi undang-undang.</p>
          <div className="flex gap-4">
            <span className="text-slate-400">PostgreSQL Supabase</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">Next.js App Router</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">Midtrans Sandbox</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
