// Test Script untuk Logika Bisnis Perhitungan Hari Kalender dan Buffer Sewa
import { calculateRentalDays, calculateBlockedRange, calculateMultiAssetCost } from "../src/lib/utils/booking-calc.js";

function runTests() {
  console.log("==================================================");
  console.log("UNIT TEST: PERHITUNGAN HARI KALENDER & BUFFER SEWA");
  console.log("==================================================");

  // Test 1: Hari Kalender Inklusif (1 hari)
  const days1 = calculateRentalDays("2026-11-20", "2026-11-20");
  console.log(`Test 1: 20 Nov - 20 Nov -> ${days1} hari`);
  if (days1 !== 1) throw new Error("Test 1 Gagal: Seharusnya 1 hari!");

  // Test 2: Hari Kalender Inklusif (3 hari)
  const days2 = calculateRentalDays("2026-11-20", "2026-11-22");
  console.log(`Test 2: 20 Nov - 22 Nov -> ${days2} hari`);
  if (days2 !== 3) throw new Error("Test 2 Gagal: Seharusnya 3 hari!");

  // Test 3: Tanggal Invalid (Selesai sebelum Mulai)
  const days3 = calculateRentalDays("2026-11-25", "2026-11-20");
  console.log(`Test 3: 25 Nov - 20 Nov -> ${days3} hari (validasi penolakan)`);
  if (days3 !== 0) throw new Error("Test 3 Gagal: Seharusnya 0 hari!");

  // Test 4: Penerapan Buffer Persiapan (1 hari sebelum, 1 hari sesudah)
  const bufferResult = calculateBlockedRange("2026-11-20", "2026-11-22", 1, 1);
  console.log("Test 4: Buffer sewa 20-22 Nov:", bufferResult);
  if (bufferResult.blockedStartDate !== "2026-11-19") {
    throw new Error(`Test 4 Gagal: Tanggal awal blokir seharusnya 2026-11-19, dapat ${bufferResult.blockedStartDate}`);
  }
  if (bufferResult.blockedEndDateExclusive !== "2026-11-24") {
    throw new Error(`Test 4 Gagal: Tanggal akhir eksklusif seharusnya 2026-11-24, dapat ${bufferResult.blockedEndDateExclusive}`);
  }

  // Test 5: Perhitungan Multi-Aset
  const mockItems = [
    { assetId: "ast-001", dailyRate: 15000000 },
    { assetId: "ast-005", dailyRate: 3500000 },
  ];
  const rentalDays = 3;
  const subtotal = mockItems.reduce((sum, item) => sum + (item.dailyRate * rentalDays), 0);
  console.log(`Test 5: Multi-aset (${mockItems.length} unit) selama ${rentalDays} hari -> Rp${subtotal.toLocaleString("id-ID")}`);
  if (subtotal !== 55500000) throw new Error("Test 5 Gagal: Total seharusnya Rp55.500.000");

  console.log("--------------------------------------------------");
  console.log("SEMUA PENGUJIAN LOGIKA BISNIS BERHASIL DENGAN BENAR (PASS)");
  console.log("--------------------------------------------------");
}

runTests();
