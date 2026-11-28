import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OfficerSidebar from "@/components/layout/OfficerSidebar";

export const metadata = {
  title: "Portal Petugas Lapangan — SewaAset",
  description: "Pencatatan serah terima dan pengembalian aset sewa oleh petugas lapangan.",
};

async function getOfficerSessionAndCounts() {
  await connection();

  const isLive =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id");

  if (!isLive) {
    return {
      profile: {
        id: "mock-officer-id",
        full_name: "Petugas Lapangan (Demo)",
        role: "petugas",
      },
      counts: {
        handovers: 1,
        returns: 1,
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/masuk?redirect=/petugas/dashboard");
  }

  // Verifikasi role langsung dari database profiles (petugas atau admin)
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (error || !profile || (profile.role !== "petugas" && profile.role !== "admin")) {
    redirect("/masuk");
  }

  // Ambil count pending tugas
  const [
    { count: pendingHandovers },
    { count: pendingReturns },
  ] = await Promise.all([
    supabase
      .from("rental_transactions")
      .select("*", { count: "exact", head: true })
      .eq("status", "disetujui"),
    supabase
      .from("rental_transactions")
      .select("*", { count: "exact", head: true })
      .eq("status", "sedang_disewa"),
  ]);

  return {
    profile,
    counts: {
      handovers: pendingHandovers || 0,
      returns: pendingReturns || 0,
    },
  };
}

async function OfficerSidebarAsync() {
  const { profile, counts } = await getOfficerSessionAndCounts();
  return <OfficerSidebar userProfile={profile} pendingCounts={counts} />;
}

function OfficerSidebarSkeleton() {
  return (
    <aside className="w-full md:w-64 bg-[#0a4a56] text-white flex flex-col shrink-0 border-r border-[#0e6b7a]/30 p-4 space-y-4">
      <div className="h-8 bg-white/10 rounded animate-pulse" />
      <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
      <div className="space-y-2 flex-1">
        <div className="h-8 bg-white/10 rounded animate-pulse" />
        <div className="h-8 bg-white/10 rounded animate-pulse" />
      </div>
    </aside>
  );
}

export default function OfficerLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f4f7f9]">
      <Suspense fallback={<OfficerSidebarSkeleton />}>
        <OfficerSidebarAsync />
      </Suspense>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-14 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center sticky top-0 z-30">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-800">Portal Petugas</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500">Operasional Lapangan</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Serah Terima &amp; Pengembalian</span>
              <span className="sm:hidden">Operasional Aktif</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
