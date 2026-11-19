"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const AuthContext = createContext({
  user: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({
  children,
  initialUser = null,
  initialProfile = null,
}) {
  const [user, setUser] = useState(initialUser);
  const [profile, setProfile] = useState(initialProfile);
  const [role, setRole] = useState(initialProfile?.role || null);
  const [loading, setLoading] = useState(!initialUser);

  const fetchProfile = useCallback(async (userId, supabaseClient) => {
    try {
      const client = supabaseClient || createClient();
      const { data: p } = await client
        .from("profiles")
        .select("id, full_name, role, phone")
        .eq("id", userId)
        .maybeSingle();

      if (p) {
        setProfile(p);
        if (p.role) {
          setRole(p.role);
        }
      }
    } catch {
      // Abaikan error jaringan lokal
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // 1. Sign out di sisi browser client Supabase (membersihkan cookies & storage lokal browser)
      await supabase.auth.signOut().catch(() => {});

      // 2. Bersihkan state memori secara instan
      setUser(null);
      setProfile(null);
      setRole(null);

      // 3. Panggil endpoint server route handler POST untuk memastikan cookie server dihapus tuntas
      await fetch("/auth/keluar", { method: "POST" }).catch(() => {});

      // 4. Arahkan pengguna ke beranda dengan hard reload untuk membersihkan semua router cache
      window.location.href = "/";
    } catch (err) {
      console.error("Gagal melakukan proses keluar:", err);
      setUser(null);
      setProfile(null);
      setRole(null);
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    // Ambil user dari browser client
    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      const authUser = data?.user || null;
      if (authUser) {
        setUser(authUser);
        // Segera pasang role awal dari user_metadata jika ada untuk menghindari race condition
        const initialRole = authUser.user_metadata?.role || "penyewa";
        setRole((prev) => prev || initialRole);
        fetchProfile(authUser.id, supabase);
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          setUser(session.user);
          const metaRole = session.user.user_metadata?.role || "penyewa";
          setRole((prev) => prev || metaRole);
          fetchProfile(session.user.id, supabase);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
