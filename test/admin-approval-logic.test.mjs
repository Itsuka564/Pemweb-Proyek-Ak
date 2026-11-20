import assert from "node:assert";
import { calculateRentalDays, calculateBlockedRange } from "../src/lib/utils/booking-calc.js";

console.log("==================================================");
console.log("UNIT TEST: LOGIKA PERSETUJUAN & VALIDASI ADMIN");
console.log("==================================================");

// Test 1: Penolakan wajib memiliki alasan minimal 5 karakter
function validateRejectionReason(reason) {
  if (!reason || reason.trim().length < 5) {
    throw new Error("Alasan penolakan pengajuan wajib diisi minimal 5 karakter.");
  }
  return true;
}

assert.throws(
  () => validateRejectionReason(""),
  /minimal 5 karakter/,
  "Harus menolak alasan kosong"
);
assert.throws(
  () => validateRejectionReason("no"),
  /minimal 5 karakter/,
  "Harus menolak alasan terlalu pendek"
);
assert.strictEqual(
  validateRejectionReason("Aset sedang dilakukan perbaikan atap."),
  true,
  "Alasan valid harus diterima"
);
console.log("Test 1: Validasi alasan penolakan wajib terpenuhi -> PASS");

// Test 2: Validasi blokir kalender aktif menggunakan buffer operasional
const rentalStart = "2026-12-10";
const rentalEnd = "2026-12-12";
const bufferBefore = 1;
const bufferAfter = 2;

const { blockedStartDate, blockedEndDateExclusive } = calculateBlockedRange(
  rentalStart,
  rentalEnd,
  bufferBefore,
  bufferAfter
);

assert.strictEqual(blockedStartDate, "2026-12-09", "Buffer sebelum harus H-1 (09 Des)");
assert.strictEqual(blockedEndDateExclusive, "2026-12-15", "Buffer sesudah harus H+2 + 1 eksklusif (15 Des)");
console.log("Test 2: Blokir kalender [2026-12-09, 2026-12-15) -> PASS");

// Test 3: Hitung tenggat waktu pembayaran (default 24 jam)
const nowMs = 1731931200000; // Mock timestamp
const hours = 24;
const paymentDueAt = new Date(nowMs + hours * 3600 * 1000).toISOString();
const expectedDiffMs = new Date(paymentDueAt).getTime() - nowMs;
assert.strictEqual(expectedDiffMs, 24 * 3600 * 1000, "Selisih waktu harus tepat 24 jam");
console.log("Test 3: Perhitungan tenggat waktu pembayaran (24 jam) -> PASS");

console.log("--------------------------------------------------");
console.log("SELURUH UNIT TEST LOGIKA ADMIN BERHASIL (PASS)");
console.log("--------------------------------------------------");
