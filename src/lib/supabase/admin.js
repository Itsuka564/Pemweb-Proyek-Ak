import { createClient } from "@supabase/supabase-js";

// HANYA UNTUK DIGUNAKAN DI SERVER-SIDE (Server Actions / Route Handlers)
// JANGAN PERNAH IMPOR FILE INI KE CLIENT COMPONENT
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY atau NEXT_PUBLIC_SUPABASE_URL belum dikonfigurasi di server environment."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

