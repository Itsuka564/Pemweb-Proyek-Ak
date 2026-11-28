import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sesi login berakhir. Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Data subscription tidak lengkap (endpoint / keys hilang)." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();
    const now = new Date().toISOString();

    const { data, error } = await serviceClient
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh_key: subscription.keys.p256dh,
          auth_key: subscription.keys.auth,
          is_active: true,
          updated_at: now,
        },
        { onConflict: "endpoint" }
      )
      .select("id, endpoint, is_active")
      .single();

    if (error) {
      console.error("Gagal menyimpan push subscription:", error.message);
      return NextResponse.json(
        { error: "Gagal menyimpan subscription ke database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription Web Push berhasil didaftarkan.",
      data,
    });
  } catch (err) {
    console.error("API /api/push/subscribe error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sesi login berakhir." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint subscription wajib disertakan." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();
    await serviceClient
      .from("push_subscriptions")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("endpoint", endpoint)
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      message: "Subscription berhasil dinonaktifkan.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Gagal menghapus subscription." },
      { status: 500 }
    );
  }
}
