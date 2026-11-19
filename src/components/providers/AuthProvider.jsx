"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const AuthContext = createContext({
  user: null,
  profile: null,
  role: null,
  loading: true,
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

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function fetchProfile(userId) {
      try {
        const { data: p } = await supabase
          .from("profiles")
          .select("id, full_name, role, phone")
          .eq("id", userId)
          .maybeSingle();

        if (p && isMounted) {
          setProfile(p);
          setRole(p.role);
        }
      } catch {
        // Abaikan error jaringan lokal
      }
    }

    // Ambil user jika belum tersedia dari initialUser
    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      const authUser = data?.user || null;
      if (authUser) {
        setUser(authUser);
        fetchProfile(authUser.id);
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
          fetchProfile(session.user.id);
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
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
