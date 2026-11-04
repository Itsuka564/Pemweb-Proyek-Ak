# Analisis Kebutuhan — Sistem Informasi Penyewaan Aset

> Draft awal untuk divalidasi oleh seluruh anggota dan dosen. Ini belum berarti fitur sudah diimplementasikan.

## Tujuan
- Menyediakan katalog dan informasi aset.
- Memfasilitasi pengajuan penyewaan.
- Membantu petugas/admin memproses persetujuan.
- Mencatat serah terima dan pengembalian.
- Menyediakan status transaksi dan laporan sederhana.

## Pengguna
1. **Penyewa:** melihat aset, mengajukan penyewaan, memantau status.
2. **Petugas:** meninjau pengajuan serta mencatat serah terima/pengembalian sesuai kewenangan.
3. **Admin:** mengelola aset, tarif, pengguna, dan laporan.

## Kebutuhan fungsional awal
| ID | Kebutuhan |
|---|---|
| KF-01 | Pengguna dapat masuk dan keluar dari sistem. |
| KF-02 | Sistem membatasi akses berdasarkan role. |
| KF-03 | Penyewa dapat melihat katalog dan detail aset. |
| KF-04 | Penyewa dapat mengirim pengajuan penyewaan. |
| KF-05 | Penyewa dapat memantau status pengajuan. |
| KF-06 | Petugas/admin berwenang dapat menyetujui atau menolak pengajuan. |
| KF-07 | Petugas dapat mencatat serah terima dan pengembalian. |
| KF-08 | Admin dapat mengelola data aset dan tarif. |
| KF-09 | Admin dapat melihat data pengguna dan laporan. |

## Kebutuhan nonfungsional awal
- Aplikasi berbasis web dan responsif.
- Validasi dilakukan di frontend dan server.
- Data dibatasi berdasarkan hak akses.
- Rahasia aplikasi tidak boleh di-commit ke GitHub.
- Operasi penting divalidasi di server.

## Hal yang perlu dikonfirmasi
- Apakah ada pembayaran atau hanya pencatatan tarif?
- Tarif dihitung per jam, hari, atau periode lain?
- Siapa yang berhak menyetujui pengajuan?
- Apakah perlu unggah identitas/dokumen?
- Bagaimana aturan pembatalan, keterlambatan, denda, dan kerusakan?
- Format laporan apa yang diminta?

## Kriteria penerimaan awal
Pengguna dapat login sesuai role; penyewa dapat melihat aset dan mengajukan sewa; petugas/admin dapat memproses pengajuan; serah terima/pengembalian tercatat; admin dapat mengelola aset dan melihat laporan dasar.

**Status:** rancangan awal, perlu disepakati. Bukan bukti implementasi.
