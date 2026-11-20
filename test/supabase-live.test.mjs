import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("==================================================");
console.log("TEST KONEKSI & SKEMA LIVE SUPABASE");
console.log("==================================================");
console.log("URL:", supabaseUrl);
console.log("Anon Key:", supabaseAnonKey ? "Tersedia" : "TIDAK ADA");
console.log("Service Key:", supabaseServiceKey ? "Tersedia" : "TIDAK ADA");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Kredensial Supabase tidak ditemukan!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

async function testConnection() {
  const tables = [
    "profiles",
    "asset_categories",
    "assets",
    "asset_rates",
    "asset_photos",
    "rental_transactions",
    "rental_transaction_items",
    "rental_status_history",
    "asset_booking_blocks",
    "user_verifications",
    "payments",
    "payment_webhook_events",
    "rental_contracts",
    "handover_records",
    "return_records",
  ];

  let successCount = 0;

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.log(`❌ Tabel '${table}': GAGAL (${error.message})`);
      } else {
        console.log(`✓ Tabel '${table}': TERHUBUNG (Total baris: ${count ?? 0})`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Tabel '${table}': ERROR (${err.message})`);
    }
  }

  // Storage buckets check
  try {
    const { data: buckets, error: bError } = await supabase.storage.listBuckets();
    if (bError) {
      console.log(`⚠️ Storage buckets: Gagal listing (${bError.message})`);
    } else {
      console.log(`✓ Storage buckets (${buckets.length}):`, buckets.map((b) => b.name).join(", "));
    }
  } catch (err) {
    console.log(`⚠️ Storage buckets error:`, err?.message);
  }

  console.log("--------------------------------------------------");
  console.log(`HASIL: ${successCount} dari ${tables.length} tabel terhubung sempurna.`);
  console.log("--------------------------------------------------");
}

testConnection();
