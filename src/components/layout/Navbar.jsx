"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

function NavLinksList({ role, user }) {
  const pathname = usePathname();

  const getDashboardHref = () => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "petugas") return "/petugas/dashboard";
    return "/penyewa/dashboard";
  };

  const navLinks = [
    { label: "Beranda", href: "/" },
    { label: "Katalog Aset", href: "/katalog" },
  ];

  if (user) {
    navLinks.push({ label: "Dashboard", href: getDashboardHref() });
  }

  return (
    <nav className="hidden md:flex items-center gap-1.5">
      {navLinks.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/" && pathname?.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              isActive
                ? "bg-[#0e6b7a] text-white"
                : "text-[#d7edf0] hover:text-white hover:bg-white/10"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavLinksFallback() {
  return (
    <nav className="hidden md:flex items-center gap-1.5 text-xs text-[#d7edf0]">
      <Link href="/" className="px-3.5 py-1.5">Beranda</Link>
      <Link href="/katalog" className="px-3.5 py-1.5">Katalog Aset</Link>
    </nav>
  );
}

export default function Navbar({
  user = null,
  role = null,
  profile = null,
  onSignOut,
}) {
  const [currentUser, setCurrentUser] = useState(user);
  const [currentRole, setCurrentRole] = useState(role);
  const [currentProfile, setCurrentProfile] = useState(profile);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      setCurrentRole(role);
      setCurrentProfile(profile);
      return;
    }

    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        const authUser = data?.user;
        if (authUser) {
          setCurrentUser(authUser);
          supabase
            .from("profiles")
            .select("id, full_name, role, phone")
            .eq("id", authUser.id)
            .maybeSingle()
            .then(({ data: p }) => {
              if (p) {
                setCurrentProfile(p);
                setCurrentRole(p.role);
              }
            });
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user) {
            setCurrentUser(session.user);
          } else {
            setCurrentUser(null);
            setCurrentRole(null);
            setCurrentProfile(null);
          }
        }
      );

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    } catch {
      // fallback jika client offline
    }
  }, [user, role, profile]);

  return (
    <header className="sticky top-0 z-40 bg-[#0a4a56] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-extrabold text-lg tracking-tight group"
            >
              <span className="w-8 h-8 rounded-lg bg-[#f2a33a] text-[#16222b] grid place-items-center text-sm font-black shadow-xs transition-transform group-hover:scale-105">
                ▣
              </span>
              <span className="text-white text-xl">SewaAset</span>
            </Link>

            {/* Main Nav */}
            <Suspense fallback={<NavLinksFallback />}>
              <NavLinksList role={currentRole} user={currentUser} />
            </Suspense>
          </div>

          {/* Right Area: Auth & Profile */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-white truncate max-w-[150px]">
                    {currentProfile?.full_name || currentUser.email?.split("@")[0] || "Pengguna"}
                  </span>
                  <Badge
                    variant={
                      currentRole === "admin" ? "bad" : currentRole === "petugas" ? "info" : "tersedia"
                    }
                    className="mt-0.5 text-[10px] px-2 py-0"
                  >
                    {currentRole ? currentRole.toUpperCase() : "PENYEWA"}
                  </Badge>
                </div>
                {onSignOut ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSignOut}
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                  >
                    Keluar
                  </Button>
                ) : (
                  <Link href="/auth/keluar">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                    >
                      Keluar
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/masuk">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent text-white border-white/30 hover:bg-white/15"
                  >
                    Masuk
                  </Button>
                </Link>
                <Link href="/daftar">
                  <Button variant="accent" size="sm">
                    Daftar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
