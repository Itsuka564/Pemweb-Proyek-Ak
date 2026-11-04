# Referensi Desain UI/UX

> Daftar halaman rancangan sebagai acuan implementasi. Periksa kembali kesesuaiannya dengan kebutuhan proyek.

| No. | Halaman | Tujuan |
|---:|---|---|
| 1 | Beranda | Pengenalan layanan dan akses ke katalog |
| 2 | Katalog Aset | Daftar aset, pencarian, dan filter |
| 3 | Detail Aset | Informasi, tarif, dan ketersediaan aset |
| 4 | Masuk & Daftar | Autentikasi pengguna |
| 5 | Dashboard Penyewa | Ringkasan dan status penyewaan |
| 6 | Form Pengajuan Sewa | Pengumpulan data pengajuan |
| 7 | Dashboard Petugas | Ringkasan pekerjaan petugas |
| 8 | Serah Terima & Pengembalian | Pencatatan penyerahan dan pengembalian |
| 9 | Dashboard Admin | Ringkasan pengelolaan sistem |
| 10 | Kelola Data Aset & Tarif | Pengelolaan aset dan tarif |
| 11 | Persetujuan Pengajuan | Peninjauan, persetujuan, atau penolakan |
| 12 | Laporan & Pengguna | Laporan dan pengelolaan pengguna |

## Panduan implementasi
- Gunakan komponen konsisten untuk tombol, input, tabel, badge status, dan navigasi.
- Bedakan navigasi berdasarkan role.
- Sediakan kondisi loading, kosong, berhasil, dan gagal.
- Tampilkan validasi form dan pesan kesalahan yang jelas.
- Berikan konfirmasi dan umpan balik untuk aksi penting.
- Uji tampilan pada ukuran layar yang ditargetkan.

## Pemetaan role (usulan)
- Penyewa/publik: Beranda, Katalog, Detail, Masuk/Daftar, Dashboard Penyewa, Form Pengajuan.
- Petugas: Dashboard Petugas, Serah Terima/Pengembalian, Persetujuan jika diberi kewenangan.
- Admin: Dashboard Admin, Kelola Aset/Tarif, Laporan/Pengguna.

**Catatan:** kewenangan final harus dikonfirmasi sebelum implementasi.
