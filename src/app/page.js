
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Placeholder Homepage */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-4xl">
          🏢
        </div>

        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-700">
          Kelompok 10
        </p>

        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
          Sistem Informasi
          <br />
          Penyewaan Aset
        </h1>

        <p className="mt-5 max-w-lg text-slate-500">
          Platform digital untuk mempermudah proses pencarian,
          pengajuan, dan pengelolaan penyewaan aset.
        </p>

        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-4">
          <p className="text-sm font-medium text-slate-500">
            Homepage dalam tahap pengembangan
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Coming Soon
          </p>
        </div>
      </section>
    </main>
  );
}
