import { createClient } from "@/lib/supabase/server";

export async function getRentalSettings() {
  try {
    const supabase = await createClient();
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id")) {
      return {
        id: 1,
        preparation_before_days: 1,
        preparation_after_days: 1,
        payment_expiry_minutes: 1440, // 24 jam
      };
    }

    const { data, error } = await supabase
      .from("rental_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return {
        id: 1,
        preparation_before_days: 1,
        preparation_after_days: 1,
        payment_expiry_minutes: 1440,
      };
    }

    return {
      id: data.id,
      preparation_before_days: Number(data.preparation_before_days) || 0,
      preparation_after_days: Number(data.preparation_after_days) || 0,
      payment_expiry_minutes: Number(data.payment_expiry_minutes) || 1440,
    };
  } catch {
    return {
      id: 1,
      preparation_before_days: 1,
      preparation_after_days: 1,
      payment_expiry_minutes: 1440,
    };
  }
}

