/**
 * BACKGROUND WORKER - WEB PUSH NOTIFICATION & JOB QUEUE
 * Sistem Informasi Penyewaan Aset (Kelompok 10)
 *
 * Menjalankan proses antrean persisten secara terpisah:
 * node scripts/worker.mjs  atau  npm run worker
 */

import { createRequire } from "module";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const webpush = require("web-push");

// 1. Baca konfigurasi environment dari .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx > -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
      env[key] = val;
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || env.VAPID_SUBJECT || "mailto:admin@sewaaset.com";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Worker Error: SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan.");
  process.exit(1);
}

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.error("❌ Worker Error: VAPID keys belum dikonfigurasi di .env.local.");
  process.exit(1);
}

// 2. Inisialisasi web-push VAPID
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

// 3. Supabase Client dengan Service Role (untuk membaca antrean & subscription)
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

let isRunning = true;
let isProcessing = false;
const POLL_INTERVAL_MS = 3000;

console.log("==========================================================");
console.log("🚀 SewaAset Background Worker Started");
console.log(`📡 Connected to: ${SUPABASE_URL}`);
console.log(`✉️ VAPID Subject: ${VAPID_SUBJECT}`);
console.log(`⏱️ Polling Interval: ${POLL_INTERVAL_MS}ms`);
console.log("==========================================================");

/**
 * Memproses satu siklus antrean dari tabel notification_jobs
 */
async function processQueue() {
  if (isProcessing || !isRunning) return;
  isProcessing = true;

  try {
    const now = new Date().toISOString();

    // 1. Ambil job yang berstatus 'queued' dan sudah available_at <= now()
    const { data: jobs, error: fetchErr } = await supabase
      .from("notification_jobs")
      .select("*")
      .eq("status", "queued")
      .lte("available_at", now)
      .order("created_at", { ascending: true })
      .limit(5);

    if (fetchErr) {
      console.error(`[Worker] Error fetching jobs: ${fetchErr.message}`);
      isProcessing = false;
      return;
    }

    if (!jobs || jobs.length === 0) {
      isProcessing = false;
      return;
    }

    console.log(`[Worker] Menemukan ${jobs.length} pekerjaan antrean baru. Memproses...`);

    for (const job of jobs) {
      await processSingleJob(job);
    }
  } catch (err) {
    console.error("[Worker] Unhandled error during poll:", err);
  } finally {
    isProcessing = false;
  }
}

/**
 * Memproses satu pekerjaan Web Push notifikasi secara individual
 */
async function processSingleJob(job) {
  const startTime = Date.now();
  const lockTime = new Date().toISOString();

  // 1. Lock job (status -> 'processing')
  const { error: lockErr } = await supabase
    .from("notification_jobs")
    .update({
      status: "processing",
      locked_at: lockTime,
      attempts: (job.attempts || 0) + 1,
      updated_at: lockTime,
    })
    .eq("id", job.id)
    .eq("status", "queued"); // Optimistic concurrency check

  if (lockErr) {
    console.warn(`[Worker] Gagal mengunci job #${job.id}: ${lockErr.message}`);
    return;
  }

  console.log(`\n----------------------------------------------------------`);
  console.log(`[Job #${job.id}] Memproses Notifikasi untuk User ID: ${job.user_id}`);
  console.log(`[Job #${job.id}] Dedupe Key: ${job.dedupe_key} | Percobaan ke-${(job.attempts || 0) + 1}/${job.max_attempts}`);

  try {
    // 2. Ambil subscription aktif milik pengguna
    const { data: subs, error: subErr } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh_key, auth_key")
      .eq("user_id", job.user_id)
      .eq("is_active", true);

    if (subErr) {
      throw new Error(`Gagal mengambil subscriptions: ${subErr.message}`);
    }

    // Jika user belum mendaftarkan browser (belum ada subscription aktif)
    if (!subs || subs.length === 0) {
      console.log(`[Job #${job.id}] ⚠️ Pengguna belum mengaktifkan Web Push di browser. Notifikasi tetap tersimpan di arsip inbox.`);
      await supabase
        .from("notification_jobs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          last_error: "User has no active push subscription; recorded in notifications table.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      return;
    }

    const payload = JSON.stringify(job.payload || {
      title: "Pemberitahuan SewaAset",
      body: "Ada pembaruan status transaksi Anda.",
      url: "/penyewa/dashboard",
    });

    let successCount = 0;
    const deadSubIds = [];

    // 3. Kirim ke seluruh endpoint browser yang terdaftar
    for (const sub of subs) {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key,
          auth: sub.auth_key,
        },
      };

      try {
        await webpush.sendNotification(pushConfig, payload, {
          TTL: 60 * 60 * 24, // 24 jam di relay server
          urgency: "high",
        });
        successCount++;
        console.log(`[Job #${job.id}] ✅ Berhasil dikirim ke endpoint: ${sub.endpoint.slice(0, 45)}...`);
      } catch (pushErr) {
        const statusCode = pushErr.statusCode;
        console.warn(`[Job #${job.id}] ⚠️ Gagal mengirim ke endpoint (${statusCode || pushErr.message}): ${sub.endpoint.slice(0, 45)}...`);

        // Sesuai ketentuan: bersihkan subscription yang sudah kedaluwarsa/invalid (404/410 Gone)
        if (statusCode === 404 || statusCode === 410) {
          deadSubIds.push(sub.id);
        }
      }
    }

    // 4. Hapus subscription mati jika ditemukan
    if (deadSubIds.length > 0) {
      console.log(`[Job #${job.id}] 🧹 Menghapus ${deadSubIds.length} subscription kedaluwarsa (404/410 Gone)...`);
      await supabase
        .from("push_subscriptions")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in("id", deadSubIds);
    }

    const finishTime = new Date().toISOString();
    const duration = Date.now() - startTime;

    // 5. Tandai pekerjaan sebagai 'sent'
    await supabase
      .from("notification_jobs")
      .update({
        status: "sent",
        sent_at: finishTime,
        last_error: successCount > 0 ? null : "Semua endpoint subscription gagal merespons.",
        updated_at: finishTime,
      })
      .eq("id", job.id);

    console.log(`[Job #${job.id}] 🎉 SENT (Sukses) dalam ${duration}ms (Terkirim: ${successCount}/${subs.length})`);
  } catch (err) {
    const failTime = new Date().toISOString();
    const attempts = (job.attempts || 0) + 1;
    const isExhausted = attempts >= job.max_attempts;

    console.error(`[Job #${job.id}] ❌ Gagal: ${err.message}`);

    // Hitung waktu retry dengan exponential backoff (15s, 60s, 300s, ...)
    const backoffSeconds = Math.min(Math.pow(2, attempts) * 5, 3600);
    const nextAvailable = new Date(Date.now() + backoffSeconds * 1000).toISOString();

    await supabase
      .from("notification_jobs")
      .update({
        status: isExhausted ? "failed" : "queued",
        available_at: nextAvailable,
        last_error: err.message,
        updated_at: failTime,
      })
      .eq("id", job.id);

    if (isExhausted) {
      console.error(`[Job #${job.id}] ⛔ Percobaan habis (${attempts}/${job.max_attempts}). Status: FAILED.`);
    } else {
      console.log(`[Job #${job.id}] 🔄 Dijadwalkan retry pada: ${nextAvailable} (Backoff: ${backoffSeconds}s)`);
    }
  }
}

// 4. Polling loop
const intervalTimer = setInterval(processQueue, POLL_INTERVAL_MS);

// 5. Graceful shutdown handler
function handleShutdown(signal) {
  console.log(`\n🛑 Menerima sinyal ${signal}. Menghentikan worker secara rapi...`);
  isRunning = false;
  clearInterval(intervalTimer);
  setTimeout(() => {
    console.log("👋 Worker dihentikan.");
    process.exit(0);
  }, 1000);
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
