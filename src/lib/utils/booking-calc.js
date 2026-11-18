/**
 * Menghitung selisih hari kalender secara inklusif.
 * Tanggal mulai dan selesai dihitung penuh per hari kalender.
 * Contoh: 20 Nov s/d 20 Nov = 1 hari; 20 Nov s/d 22 Nov = 3 hari.
 */
export function calculateRentalDays(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  const diffTime = endUTC - startUTC;
  if (diffTime < 0) return 0;

  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

/**
 * Menghitung rentang tanggal terblokir termasuk buffer persiapan.
 * Buffer sebelum dan sesudah diambil dari pengaturan operasional.
 */
export function calculateBlockedRange(startDateStr, endDateStr, bufferBefore = 1, bufferAfter = 1) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const blockedStart = new Date(start);
  blockedStart.setDate(blockedStart.getDate() - bufferBefore);

  // Batas akhir eksklusif PostgreSQL daterange [start, end)
  const blockedEndExclusive = new Date(end);
  blockedEndExclusive.setDate(blockedEndExclusive.getDate() + bufferAfter + 1);

  return {
    blockedStartDate: blockedStart.toISOString().split("T")[0],
    blockedEndDateExclusive: blockedEndExclusive.toISOString().split("T")[0],
  };
}

/**
 * Menghitung total biaya multi-aset berdasarkan snapshot tarif harian dan durasi hari inklusif.
 */
export function calculateMultiAssetCost(items, rentalDays) {
  if (!items || items.length === 0 || rentalDays <= 0) return 0;
  return items.reduce((total, item) => {
    const rate = Number(item.dailyRate) || 0;
    return total + (rate * rentalDays);
  }, 0);
}

