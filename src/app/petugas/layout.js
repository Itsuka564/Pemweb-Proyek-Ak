import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OfficerSidebar from "@/components/layout/OfficerSidebar";

export const metadata = {
  title: "Portal Petugas Lapangan — SewaAset Kelompok 10",
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
        <header className="h-14 bg-white border-b border-[#d9e1e7] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5a6b78] uppercase tracking-wider">
              Kelompok 10
            </span>
            <span className="text-[#5a6b78]">•</span>
            <span className="text-xs font-semibold text-[#0a4a56]">
              Portal Petugas Lapangan
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[#5a6b78]">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="hidden sm:inline">Status Modul:</span>
            <span className="font-bold text-[#16222b]">Operasional Serah Terima & Pengembalian</span>
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
