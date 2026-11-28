import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/layout/AdminSidebar";

export const metadata = {
  title: "Admin Portal — SewaAset",
  description: "Panel kendali administrasi pengelolaan aset, verifikasi pengguna, dan persetujuan sewa.",
};

async function getAdminSessionAndCounts() {
  await connection();

  const isLive =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id");

  if (!isLive) {
    return {
      profile: {
        id: "mock-admin-id",
        full_name: "Admin Pengelola (Demo)",
        role: "admin",
      },
      counts: {
        verifications: 2,
        rentals: 1,
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/masuk?redirect=/admin/dashboard");
  }

  // Verifikasi role langsung dari database profiles
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    redirect("/masuk");
  }

  // Ambil count pending untuk badge sidebar
  const [
    { count: pendingVerifications },
    { count: pendingRentals },
  ] = await Promise.all([
    supabase
      .from("user_verifications")
      .select("*", { count: "exact", head: true })
      .eq("status", "menunggu"),
    supabase
      .from("rental_transactions")
      .select("*", { count: "exact", head: true })
      .eq("status", "menunggu_persetujuan"),
  ]);

  return {
    profile,
    counts: {
      verifications: pendingVerifications || 0,
      rentals: pendingRentals || 0,
    },
  };
}

async function AdminSidebarAsync() {
  const { profile, counts } = await getAdminSessionAndCounts();
  return <AdminSidebar userProfile={profile} pendingCounts={counts} />;
}

function AdminSidebarSkeleton() {
  return (
    <aside className="w-full md:w-64 bg-[#0a4a56] text-white flex flex-col shrink-0 border-r border-[#0e6b7a]/30 p-4 space-y-4">
      <div className="h-8 bg-white/10 rounded animate-pulse" />
      <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
      <div className="space-y-2 flex-1">
        <div className="h-8 bg-white/10 rounded animate-pulse" />
        <div className="h-8 bg-white/10 rounded animate-pulse" />
        <div className="h-8 bg-white/10 rounded animate-pulse" />
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f4f7f9]">
      <Suspense fallback={<AdminSidebarSkeleton />}>
        <AdminSidebarAsync />
      </Suspense>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Admin Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center sticky top-0 z-30">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Portal Administrasi</span>
              <span className="text-slate-300">/</span>
              <span>Manajemen Aset</span>
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
