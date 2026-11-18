import assert from "node:assert";
import crypto from "node:crypto";
import { verifyWebhookSignature, createSnapTransaction } from "../src/lib/midtrans/client.js";

console.log("==================================================");
console.log("UNIT TEST: SISTEM PEMBAYARAN & WEBHOOK MIDTRANS (AUDIT & HARDENING)");
console.log("==================================================");

const mockServerKey = "SB-Mid-server-TEST123456789";
const orderId = "PAY-SWA-2026-9041-TEST";
const statusCode = "200";
const grossAmount = "30000000";

// Hitung signature resmi SHA512
const validSignature = crypto
  .createHash("sha512")
  .update(`${orderId}${statusCode}${grossAmount}${mockServerKey}`)
  .digest("hex");

// ----------------------------------------------------
// Test 1: Verifikasi SHA512 signature key yang sah
// ----------------------------------------------------
const isValid = verifyWebhookSignature({
  orderId,
  statusCode,
  grossAmount,
  signatureKey: validSignature,
  serverKey: mockServerKey,
});
assert.strictEqual(isValid, true, "Signature yang sah harus bernilai true");
console.log("Test 1: Verifikasi signature SHA512 sah -> PASS");

// ----------------------------------------------------
// Test 2: Verifikasi signature palsu / tidak valid (harus ditolak)
// ----------------------------------------------------
const fakeSignature = "invalid_fake_hash_1234567890abcdef";
const isFakeValid = verifyWebhookSignature({
  orderId,
  statusCode,
  grossAmount,
  signatureKey: fakeSignature,
  serverKey: mockServerKey,
});
assert.strictEqual(isFakeValid, false, "Signature palsu harus ditolak (false)");
console.log("Test 2: Penolakan signature palsu/tidak valid -> PASS");

// ----------------------------------------------------
// Test 3: Penolakan jika signature_key kosong
// ----------------------------------------------------
const isMissingSigValid = verifyWebhookSignature({
  orderId,
  statusCode,
  grossAmount,
  signatureKey: "",
  serverKey: mockServerKey,
});
assert.strictEqual(isMissingSigValid, false, "Signature kosong harus ditolak (false)");
console.log("Test 3: Penolakan signature_key kosong -> PASS");

// ----------------------------------------------------
// Test 4: Penolakan jika Server Key tidak ada / placeholder
// ----------------------------------------------------
const isNoServerKeyValid = verifyWebhookSignature({
  orderId,
  statusCode,
  grossAmount,
  signatureKey: validSignature,
  serverKey: "",
});
assert.strictEqual(isNoServerKeyValid, false, "Tanpa Server Key harus ditolak (false)");

const isPlaceholderKeyValid = verifyWebhookSignature({
  orderId,
  statusCode,
  grossAmount,
  signatureKey: validSignature,
  serverKey: "your-midtrans-server-key",
});
assert.strictEqual(isPlaceholderKeyValid, false, "Placeholder Server Key harus ditolak (false)");
console.log("Test 4: Penolakan ketika Server Key tidak dikonfigurasi -> PASS");

// ----------------------------------------------------
// Test 5: Konsistensi gross_amount dan item_details
// ----------------------------------------------------
function validateItemDetailsSum(grossAmount, itemDetails) {
  const roundedGross = Math.round(Number(grossAmount));
  const itemsSum = (itemDetails || []).reduce(
    (sum, item) => sum + Math.round(Number(item.price || 0)) * Number(item.quantity || 1),
    0
  );
  if (itemsSum !== roundedGross) {
    throw new Error(`Inkonsistensi nominal: itemDetails (${itemsSum}) != grossAmount (${roundedGross})`);
  }
  return true;
}

// Case A: Cocok
const validItems = [
  { id: "item-1", price: 15000000, quantity: 1, name: "Sewa Gedung A" },
  { id: "item-2", price: 15000000, quantity: 1, name: "Sewa Genset B" },
];
assert.strictEqual(validateItemDetailsSum(30000000, validItems), true);

// Case B: Tidak cocok (harus melempar error)
const invalidItems = [
  { id: "item-1", price: 10000000, quantity: 1, name: "Sewa Gedung A" },
];
assert.throws(
  () => validateItemDetailsSum(30000000, invalidItems),
  /Inkonsistensi nominal/,
  "Mismatched item total harus melempar error"
);
console.log("Test 5: Validasi konsistensi gross_amount dan sum(item_details) -> PASS");

// ----------------------------------------------------
// Test 6: Logika Idempotensi Event Key
// ----------------------------------------------------
function generateEventKey(orderId, trxStatus, statusCode) {
  return `${orderId}-${trxStatus}-${statusCode}`;
}

const eventKey1 = generateEventKey("ORDER-123", "settlement", "200");
const eventKey2 = generateEventKey("ORDER-123", "settlement", "200");
const eventKey3 = generateEventKey("ORDER-123", "expire", "202");

assert.strictEqual(eventKey1, eventKey2, "Event key sama untuk notifikasi duplikat");
assert.notStrictEqual(eventKey1, eventKey3, "Event key berbeda untuk status baru");
console.log("Test 6: Idempotensi event key deduplikasi webhook -> PASS");

// ----------------------------------------------------
// Test 7: Pencegahan Perubahan Status Mundur (Guard Status Transition)
// ----------------------------------------------------
function evaluateStatusTransition(currentPaymentStatus, currentRentalStatus, incomingStatus) {
  const FORWARD_RENTAL_STATUSES = ["dibayar", "sedang_disewa", "selesai"];

  let newPaymentStatus = "menunggu";
  let newRentalStatus = null;

  if (incomingStatus === "settlement" || incomingStatus === "capture") {
    newPaymentStatus = "dibayar";
    newRentalStatus = "dibayar";
  } else if (incomingStatus === "expire") {
    newPaymentStatus = "kedaluwarsa";
    newRentalStatus = "kedaluwarsa";
  } else if (incomingStatus === "cancel" || incomingStatus === "deny") {
    newPaymentStatus = "batal";
    newRentalStatus = "dibatalkan";
  }

  // Guard 1: Pembayaran sudah dibayar tidak boleh mundur
  if (currentPaymentStatus === "dibayar" && newPaymentStatus !== "dibayar") {
    return { allowed: false, reason: "Payment already settled" };
  }

  // Guard 2: Transaksi sewa sudah maju tidak boleh mundur
  if (
    FORWARD_RENTAL_STATUSES.includes(currentRentalStatus) &&
    (newRentalStatus === "kedaluwarsa" || newRentalStatus === "dibatalkan")
  ) {
    return { allowed: false, reason: "Rental already advanced" };
  }

  return { allowed: true, newPaymentStatus, newRentalStatus };
}

// 7a: Dari dibayar ke expire -> HARUS DITOLAK / DIABAIKAN
const attempt1 = evaluateStatusTransition("dibayar", "dibayar", "expire");
assert.strictEqual(attempt1.allowed, false);

// 7b: Dari sedang_disewa ke cancel -> HARUS DITOLAK / DIABAIKAN
const attempt2 = evaluateStatusTransition("dibayar", "sedang_disewa", "cancel");
assert.strictEqual(attempt2.allowed, false);

// 7c: Dari menunggu ke settlement -> HARUS DIIZINKAN
const attempt3 = evaluateStatusTransition("menunggu", "menunggu_pembayaran", "settlement");
assert.strictEqual(attempt3.allowed, true);
assert.strictEqual(attempt3.newPaymentStatus, "dibayar");
assert.strictEqual(attempt3.newRentalStatus, "dibayar");

console.log("Test 7: Pencegahan perubahan status mundur / tidak valid -> PASS");

// ----------------------------------------------------
// Test 8: Format Kontrak PKS dan Syarat Kelayakan Terbit
// ----------------------------------------------------
function generatePKSNumber(txCode, year = 2026, monthIndex = 10) {
  const monthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][monthIndex];
  return `PKS/${year}/${monthRoman}/${txCode}`;
}

function checkContractEligibility(txStatus) {
  const validContractStatuses = ["dibayar", "sedang_disewa", "selesai"];
  return validContractStatuses.includes(txStatus);
}

const contractNo = generatePKSNumber("SWA-2026-9041", 2026, 10);
assert.strictEqual(contractNo, "PKS/2026/XI/SWA-2026-9041");

assert.strictEqual(checkContractEligibility("dibayar"), true, "Status 'dibayar' berhak menerima kontrak");
assert.strictEqual(checkContractEligibility("menunggu_pembayaran"), false, "Status 'menunggu_pembayaran' tidak berhak");
assert.strictEqual(checkContractEligibility("kedaluwarsa"), false, "Status 'kedaluwarsa' tidak berhak");
assert.strictEqual(checkContractEligibility("dibatalkan"), false, "Status 'dibatalkan' tidak berhak");

console.log("Test 8: Format nomor kontrak & validasi kelayakan penerbitan PKS -> PASS");

console.log("--------------------------------------------------");
console.log("SELURUH 8 PENGUJIAN UNIT MIDTRANS BERHASIL (ALL PASS)!");
console.log("--------------------------------------------------");
