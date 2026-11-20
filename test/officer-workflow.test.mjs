import assert from "node:assert";

console.log("==================================================");
console.log("UNIT TEST: LOGIKA OPERASIONAL PETUGAS LAPANGAN");
console.log("==================================================");

// Test 1: Serah terima hanya bisa dilakukan jika transaksi berstatus 'dibayar' / 'disetujui'
function validateHandoverEligibility(txStatus) {
  if (txStatus !== "dibayar" && txStatus !== "disetujui") {
    throw new Error(`Serah terima tidak dapat dilakukan untuk transaksi berstatus '${txStatus}'.`);
  }
  return true;
}

assert.throws(
  () => validateHandoverEligibility("menunggu_persetujuan"),
  /tidak dapat dilakukan/,
  "Harus menolak serah terima jika transaksi belum disetujui"
);
assert.throws(
  () => validateHandoverEligibility("menunggu_pembayaran"),
  /tidak dapat dilakukan/,
  "Harus menolak serah terima jika transaksi belum dibayar"
);
assert.strictEqual(
  validateHandoverEligibility("dibayar"),
  true,
  "Transaksi berstatus 'dibayar' harus boleh diserahterimakan"
);
console.log("Test 1: Validasi kelayakan serah terima (status: dibayar) -> PASS");

// Test 2: Pengembalian hanya bisa dilakukan jika transaksi berstatus 'sedang_disewa'
function validateReturnEligibility(txStatus) {
  if (txStatus !== "sedang_disewa") {
    throw new Error(`Pengembalian tidak dapat diproses untuk transaksi berstatus '${txStatus}'.`);
  }
  return true;
}

assert.throws(
  () => validateReturnEligibility("dibayar"),
  /tidak dapat diproses/,
  "Harus menolak pengembalian jika aset belum pernah diserahterimakan"
);
assert.strictEqual(
  validateReturnEligibility("sedang_disewa"),
  true,
  "Transaksi berstatus 'sedang_disewa' harus dapat diproses pengembaliannya"
);
console.log("Test 2: Validasi kelayakan pengembalian (status: sedang_disewa) -> PASS");

// Test 3: Wajib menyertakan catatan kerusakan jika kondisi akhir 'rusak' atau 'perlu_pemeriksaan'
function validateReturnCondition(finalCondition, damageNote) {
  if (
    (finalCondition === "rusak" || finalCondition === "perlu_pemeriksaan") &&
    (!damageNote || damageNote.trim().length === 0)
  ) {
    throw new Error("Catatan kerusakan wajib diisi jika kondisi aset dinyatakan rusak atau perlu pemeriksaan.");
  }
  return true;
}

assert.throws(
  () => validateReturnCondition("rusak", ""),
  /Catatan kerusakan wajib diisi/,
  "Harus menolak jika kondisi rusak tetapi catatan kerusakan kosong"
);
assert.strictEqual(
  validateReturnCondition("baik", ""),
  true,
  "Kondisi baik tidak mewajibkan catatan kerusakan"
);
assert.strictEqual(
  validateReturnCondition("rusak", "Kaca jendela retak dan remote AC hilang"),
  true,
  "Kondisi rusak dengan rincian harus valid"
);
console.log("Test 3: Validasi kewajiban catatan kerusakan aset -> PASS");

console.log("--------------------------------------------------");
console.log("SELURUH PENGUJIAN LOGIKA PETUGAS BERHASIL (PASS)");
console.log("--------------------------------------------------");
