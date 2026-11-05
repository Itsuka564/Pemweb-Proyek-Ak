# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# Sistem Informasi Penyewaan Aset

**Kelompok:** 10  
**Jenis Proyek:** Proyek Akhir  
**Platform:** Web Application  
**Status Dokumen:** Draft – Revisi  
**Versi:** 1.0  
**Tahun:** 2026

---

## 1. Informasi Proyek

| Informasi | Keterangan |
|---|---|
| Nama Proyek | Sistem Informasi Penyewaan Aset |
| Kelompok | 10 |
| Platform | Website |
| Pengguna Utama | Penyewa, Petugas, Admin |
| Frontend | Next.js, React, JavaScript |
| Backend | Next.js Route Handlers / Server Actions |
| Database | PostgreSQL |
| ORM | Prisma / Drizzle / pg |
| Validasi | Zod |
| Deployment Web | Vercel |
| Object Storage | Supabase Storage / Cloudflare R2 |
| Background Worker | BullMQ + Redis atau alternatif setara |
| Notifikasi | Web Push Notification dengan VAPID |

## 2. Latar Belakang

Pengelolaan penyewaan aset membutuhkan sistem yang dapat mengatur informasi inventaris, tarif, ketersediaan, pengajuan penyewaan, persetujuan, serta proses serah terima dan pengembalian aset.

Proses yang tidak terintegrasi berpotensi menimbulkan kesulitan dalam memeriksa ketersediaan aset, pencatatan transaksi, pengelolaan kondisi aset, dan pemantauan status penyewaan.

Oleh karena itu, dikembangkan Sistem Informasi Penyewaan Aset berbasis web untuk mengintegrasikan proses pengelolaan aset dan transaksi penyewaan melalui satu aplikasi.

## 3. Tujuan Produk

Sistem dikembangkan dengan tujuan:

1. Memudahkan pengguna melihat katalog dan informasi aset.
2. Memungkinkan penyewa mengajukan penyewaan berdasarkan periode yang diinginkan.
3. Membantu admin mengelola inventaris, kategori, tarif, persetujuan, dan laporan.
4. Membantu petugas mencatat serah terima dan pengembalian aset.
5. Mencegah penyewaan ganda pada unit aset dengan periode yang bertabrakan.
6. Menyimpan data transaksi dan riwayat perubahan status secara persisten.
7. Memberikan notifikasi kepada pengguna melalui Web Push pada kejadian bisnis penting.

## 4. Target Pengguna

Sistem memiliki tiga role utama.

### 4.1 Penyewa

Pengguna yang mencari aset dan melakukan pengajuan penyewaan.

Kebutuhan:
- Melihat katalog dan detail aset.
- Memeriksa ketersediaan aset.
- Mengajukan penyewaan.
- Melihat estimasi biaya.
- Melihat status dan riwayat transaksi.
- Menerima notifikasi persetujuan atau penolakan.

### 4.2 Petugas

Pengguna yang bertanggung jawab atas proses serah terima dan pengembalian aset.

Kebutuhan:
- Melihat transaksi yang ditugaskan.
- Melihat daftar tugas serah terima.
- Mencatat kondisi awal aset.
- Mencatat pengembalian aset.
- Mencatat kondisi akhir dan kerusakan.
- Memantau tindak lanjut kondisi aset.

### 4.3 Admin

Pengguna yang bertanggung jawab atas pengelolaan keseluruhan sistem.

Kebutuhan:
- Mengelola data aset dan kategori.
- Mengelola tarif penyewaan.
- Melihat seluruh transaksi.
- Menyetujui atau menolak pengajuan.
- Melihat laporan.
- Mengelola akun dan role pengguna.

## 5. Ruang Lingkup Produk

### 5.1 Fitur Utama

| ID | Fitur | Deskripsi | Pengguna |
|---|---|---|---|
| F-01 | Autentikasi | Login, logout, dan pengelolaan sesi pengguna | Semua role |
| F-02 | Manajemen kategori | Menambah, mengubah, dan menonaktifkan kategori | Admin |
| F-03 | Manajemen aset | Mengelola informasi dan kondisi unit aset | Admin |
| F-04 | Katalog aset | Menampilkan daftar dan detail aset | Semua role |
| F-05 | Pencarian dan filter | Mencari aset berdasarkan nama, kategori, kondisi, dan ketersediaan | Semua role |
| F-06 | Cek ketersediaan | Memeriksa ketersediaan aset berdasarkan periode | Sistem |
| F-07 | Pengajuan sewa | Membuat pengajuan penyewaan | Penyewa |
| F-08 | Kalkulasi biaya | Menghitung biaya berdasarkan tarif dan durasi | Sistem |
| F-09 | Persetujuan admin | Menyetujui atau menolak pengajuan | Admin |
| F-10 | Serah terima | Mencatat penyerahan dan kondisi awal aset | Petugas |
| F-11 | Pengembalian | Mencatat pengembalian dan kondisi akhir aset | Petugas |
| F-12 | Pembaruan ketersediaan | Memperbarui status ketersediaan setelah pengembalian | Sistem |
| F-13 | Riwayat transaksi | Menampilkan riwayat penyewaan | Penyewa, Admin |
| F-14 | Laporan | Menampilkan rekapitulasi aset dan transaksi | Admin |
| F-15 | Web Push Notification | Mengirim notifikasi browser melalui antrean dan worker | Semua role sesuai kejadian |

### 5.2 Batasan Produk

1. Pembayaran berupa pencatatan dan konfirmasi status di aplikasi. Payment gateway tidak diwajibkan.
2. Data dummy menggunakan identitas fiktif.
3. Minimal tersedia 5 unit aset dan 5 transaksi penyewaan dengan variasi status.
4. Foto aset disimpan di object storage, bukan dalam bentuk Base64 di database.
5. Fitur tambahan dikerjakan setelah seluruh alur wajib berjalan.

## 6. Matriks Hak Akses

| Aktivitas | Penyewa | Petugas | Admin |
|---|---|---|---|
| Melihat katalog | Ya | Ya | Ya |
| Melihat detail aset | Ya | Ya | Ya |
| Mengajukan sewa | Ya | Tidak | Tidak |
| Melihat transaksi | Milik sendiri | Yang ditugaskan | Semua |
| Menyetujui pengajuan | Tidak | Tidak | Ya |
| Menolak pengajuan | Tidak | Tidak | Ya |
| Mengelola aset | Tidak | Tidak | Ya |
| Mengelola kategori dan tarif | Tidak | Tidak | Ya |
| Mencatat serah terima | Tidak | Ya | Dapat melihat |
| Mencatat pengembalian | Tidak | Ya | Dapat melihat |
| Melihat laporan keseluruhan | Tidak | Tidak | Ya |
| Mengelola pengguna dan role | Tidak | Tidak | Ya |

**Ketentuan keamanan:** pemeriksaan role dan kepemilikan data wajib dilakukan pada server dan/atau database. Menyembunyikan menu pada frontend saja tidak dianggap sebagai pengamanan yang cukup.

## 7. Alur Bisnis Sistem

### 7.1 Alur Penyewaan

1. Penyewa membuka katalog aset.
2. Penyewa memilih aset yang diinginkan.
3. Penyewa menentukan tanggal mulai dan tanggal selesai.
4. Backend memeriksa kondisi aset, status, dan benturan periode.
5. Sistem menghitung estimasi biaya berdasarkan tarif yang tersimpan di database.
6. Penyewa mengirim pengajuan.
7. Sistem menyimpan transaksi dengan status Menunggu Persetujuan.
8. Admin menerima notifikasi pengajuan.
9. Admin menyetujui atau menolak pengajuan.
10. Penyewa menerima notifikasi hasil keputusan.
11. Jika disetujui, aset dijadwalkan untuk periode penyewaan.
12. Petugas melakukan serah terima dan mencatat kondisi awal.
13. Status transaksi menjadi Sedang Disewa.
14. Petugas mencatat pengembalian dan kondisi akhir.
15. Sistem memperbarui status transaksi menjadi Dikembalikan.
16. Aset kembali Tersedia jika kondisinya layak dan tidak terikat transaksi aktif.

### 7.2 Alur Penolakan

1. Admin membuka daftar pengajuan.
2. Admin memilih pengajuan berstatus Menunggu Persetujuan.
3. Admin memilih tindakan Tolak.
4. Admin memasukkan alasan penolakan.
5. Sistem menyimpan status Ditolak beserta waktu dan identitas admin.
6. Penyewa menerima notifikasi dan dapat melihat alasan penolakan.

### 7.3 Aturan Ketersediaan

Satu unit aset tidak boleh memiliki dua transaksi aktif dengan periode yang bertumpang tindih.

Transaksi yang memblokir periode:
- Disetujui.
- Sedang Disewa.

Transaksi Menunggu Persetujuan, Ditolak, dan Dibatalkan tidak memblokir periode.

Backend wajib memeriksa ulang ketersediaan saat admin menyetujui pengajuan. Pemeriksaan diperkuat dengan transaksi database dan mekanisme penguncian atau constraint untuk mencegah dua pengajuan bersamaan memperoleh alokasi yang sama.

### 7.4 Aturan Kondisi Aset

Kondisi fisik dan status ketersediaan merupakan dua informasi yang berbeda.

- Kondisi aset: Baik, Perlu Pemeriksaan, atau Rusak.
- Status ketersediaan: Tersedia, Dipesan, Sedang Disewa, atau Dalam Perawatan.

Aset dengan kondisi tidak layak atau status Dalam Perawatan tidak dapat diajukan untuk disewa.

Jika aset dikembalikan dalam kondisi tidak layak, aset harus masuk Dalam Perawatan dan tidak langsung tersedia kembali.

## 8. Rancangan Halaman

Halaman sistem dibagi berdasarkan area pengguna.

### 8.1 Halaman Publik

1. Beranda.
2. Katalog aset.
3. Detail aset.
4. Login.
5. Registrasi.

### 8.2 Halaman Penyewa

1. Dashboard penyewa.
2. Formulir pengajuan sewa.
3. Daftar transaksi.
4. Detail transaksi.
5. Informasi masa sewa.
6. Riwayat pengembalian.

### 8.3 Halaman Petugas

1. Dashboard petugas.
2. Daftar tugas serah terima.
3. Form serah terima.
4. Daftar pengembalian.
5. Form pemeriksaan kondisi.
6. Informasi ketersediaan aset.

### 8.4 Halaman Admin

1. Dashboard admin.
2. Data aset.
3. Tambah dan edit aset.
4. Manajemen kategori.
5. Manajemen tarif.
6. Daftar pengajuan.
7. Detail dan keputusan pengajuan.
8. Transaksi aktif.
9. Laporan.
10. Manajemen pengguna.

## 9. Kebutuhan Data dan Database

Database menggunakan PostgreSQL dengan relasi antartabel.

| Tabel | Fungsi |
|---|---|
| profiles | Profil pengguna dan role |
| asset_categories | Data kategori aset |
| assets | Data unit aset |
| rental_transactions | Data transaksi penyewaan |
| handover_records | Catatan serah terima |
| return_records | Catatan pengembalian |
| notifications | Notifikasi dalam aplikasi |
| push_subscriptions | Data subscription Web Push |
| notification_jobs | Antrean notifikasi dan pencatatan proses worker |

Relasi utama:
- Satu profil dapat memiliki banyak transaksi.
- Satu kategori memiliki banyak aset.
- Satu aset dapat muncul dalam banyak transaksi pada periode berbeda.
- Satu transaksi memiliki maksimal satu catatan serah terima.
- Satu transaksi memiliki maksimal satu catatan pengembalian.
- Satu pengguna dapat memiliki banyak notifikasi dan push subscription.

Ketentuan integritas:
- Primary key dan foreign key pada tabel terkait.
- Kode aset dan kode transaksi bersifat unik.
- Tarif dan total biaya tidak boleh negatif.
- Tanggal selesai tidak boleh lebih awal dari tanggal mulai.
- Benturan periode dicegah di backend dan database.
- Perubahan transaksi yang saling terkait dilakukan secara konsisten.

## 10. Web Push Notification

Web Push Notification merupakan kebutuhan wajib sistem.

Alur notifikasi:

**Kejadian bisnis → Database → Persistent Queue → Background Worker → Web Push → Service Worker → Browser**

Kejadian yang memicu notifikasi:

| Kejadian | Penerima |
|---|---|
| Pengajuan sewa terkirim | Admin |
| Pengajuan disetujui | Penyewa |
| Pengajuan ditolak | Penyewa |
| Aset siap diserahkan | Penyewa/Petugas |
| Pengingat pengembalian | Penyewa/Petugas |

Ketentuan:
1. Menggunakan Service Worker dan VAPID.
2. Izin notifikasi diminta melalui interaksi pengguna.
3. Subscription disimpan dalam PostgreSQL.
4. Background worker berjalan sebagai proses terpisah.
5. Antrean persisten mendukung retry dan pencegahan pengiriman ganda.
6. Subscription yang tidak valid dinonaktifkan.
7. Kegagalan notifikasi tidak boleh membatalkan transaksi bisnis yang telah tersimpan.
8. Klik notifikasi mengarahkan pengguna ke halaman yang relevan.

## 11. Kebutuhan Nonfungsional

| Aspek | Kebutuhan |
|---|---|
| Keamanan | Autentikasi, otorisasi server, perlindungan secret, dan rate limiting |
| Integritas | Mencegah penyewaan ganda dan transaksi tidak konsisten |
| Persistensi | Data tetap tersedia setelah refresh dan login ulang |
| Responsivitas | Tampilan dapat digunakan melalui desktop dan ponsel |
| Umpan balik | Loading, empty, success, dan error state |
| Kinerja | Pagination, pencarian database, indeks, dan penghindaran N+1 query |
| Observability | Logging terstruktur dan pemantauan job worker |
| Aksesibilitas | Alur utama dapat digunakan dengan keyboard |

## 12. Kriteria Keberhasilan Produk

Produk dianggap memenuhi kebutuhan utama apabila:

1. Pengguna dapat login dan mengakses halaman sesuai role.
2. Katalog dan detail aset tampil berdasarkan data database.
3. Penyewa dapat mengajukan penyewaan.
4. Sistem menghitung biaya berdasarkan tarif database.
5. Admin dapat menyetujui dan menolak pengajuan.
6. Sistem mencegah benturan periode penyewaan.
7. Petugas dapat mencatat serah terima dan pengembalian.
8. Kondisi dan ketersediaan aset diperbarui secara konsisten.
9. Admin dapat melihat laporan transaksi.
10. Web Push Notification berjalan melalui background worker.
11. Data tersimpan secara persisten.
12. Aplikasi dapat diakses melalui URL deployment.

## 13. Data Dummy dan Pengujian

Minimal data untuk demonstrasi:

- 5 unit aset.
- 5 transaksi penyewaan.
- Minimal satu akun penyewa.
- Minimal satu akun petugas.
- Minimal satu akun admin.

Variasi status transaksi:
- Menunggu Persetujuan.
- Disetujui.
- Ditolak.
- Sedang Disewa.
- Dikembalikan.

Pengujian harus mencakup:
- Pengajuan dengan tanggal valid dan tidak valid.
- Perhitungan biaya.
- Benturan jadwal.
- Persetujuan dan penolakan.
- Pengujian hak akses dan kepemilikan transaksi.
- Serah terima dan pengembalian.
- Pengembalian aset rusak.
- Web Push dan background worker.
- Rate limiting dan idempotency.
- Deployment dan persistensi data.

Bukti pengujian tidak hanya berupa screenshot UI, tetapi juga demonstrasi backend, pemeriksaan database, pengujian otorisasi, dan log worker.

## 14. Teknologi dan Deployment

| Komponen | Teknologi |
|---|---|
| Code Editor | Visual Studio Code / editor sejenis |
| Version Control | Git |
| Repository | GitHub |
| Frontend | Next.js, React |
| Backend | Next.js Route Handlers / Server Actions |
| Database | PostgreSQL |
| ORM | Prisma / Drizzle / pg |
| Validation | Zod |
| Authentication | Mengikuti keputusan integrasi autentikasi proyek |
| Object Storage | Supabase Storage / Cloudflare R2 |
| Queue | Redis dengan BullMQ atau alternatif setara |
| Notification | Web Push, VAPID, Service Worker |
| Web Deployment | Vercel |
| Worker Deployment | Host terpisah, misalnya Railway, Render, atau VPS |

Catatan: penggunaan Supabase Auth, Supabase sebagai PostgreSQL host, pilihan JavaScript atau TypeScript, dan hosting worker perlu mengikuti klarifikasi ketentuan teknis kepada dosen.

## 15. Prioritas Pengembangan

| Prioritas | Fitur |
|---|---|
| Tinggi | Autentikasi dan hak akses |
| Tinggi | Katalog dan detail aset |
| Tinggi | Manajemen aset dan kategori |
| Tinggi | Pengajuan penyewaan dan perhitungan biaya |
| Tinggi | Persetujuan dan penolakan |
| Tinggi | Pemeriksaan benturan jadwal |
| Tinggi | Serah terima dan pengembalian |
| Tinggi | Integritas dan persistensi database |
| Wajib | Web Push dan background worker |
| Menengah | Dashboard dan laporan |
| Menengah | Pencarian, filter, dan pagination |
| Menengah | Penyempurnaan tampilan dan pengalaman pengguna |

Prioritas tidak mengubah status Web Push dan background worker sebagai persyaratan wajib.

## 16. Batasan dan Hal yang Perlu Dikonfirmasi

Beberapa ketentuan teknis perlu dikonfirmasi kepada dosen:

1. Apakah Supabase Auth tetap boleh digunakan jika otorisasi dan business logic dilakukan melalui backend Next.js?
2. Apakah PostgreSQL Supabase boleh diakses menggunakan Prisma, Drizzle, atau pg?
3. Apakah implementasi harus menggunakan JavaScript atau TypeScript?
4. Apakah background worker boleh di-host di luar Vercel?
5. Apakah Supabase Storage menjadi pilihan utama untuk penyimpanan foto aset?

Keputusan akhir mengikuti ketentuan dosen dan hasil koordinasi kelompok.

## 17. Referensi Dokumen

PRD ini disusun berdasarkan:
- Dokumen Kelengkapan Proyek Akhir Sistem Informasi Penyewaan Aset – Kelompok 10 (Revisi).
- Project_Akhir_Web_16_Tim.xlsx, khususnya ketentuan Tim 10.
- Technical_Requirements.md.

Dokumen pendukung:
- `analisis-kebutuhan.md`
- `pembagian-tugas.md`
- `timeline.md`
- `rancangan-database.md`
- `desain-ui.md`
- ERD database
- Desain UI/UX Figma

---

**Status PRD:** Draft untuk validasi dan persetujuan internal kelompok. Perubahan kebutuhan harus disepakati oleh PM, FE, dan BE sebelum diterapkan pada implementasi sistem.