# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# Sistem Informasi Penyewaan Aset

**Kelompok:** 10  
**Jenis Proyek:** Proyek Akhir  
**Platform:** Web Application  
**Status:** Draft Revisi berdasarkan arahan dosen  
**Versi:** 1.1  
**Tahun:** 2026

---

## 1. Informasi Proyek

| Informasi | Keterangan |
|---|---|
| Nama Proyek | Sistem Informasi Penyewaan Aset |
| Kelompok | 10 |
| Platform | Website |
| Pengguna Utama | Penyewa, Petugas, Admin |
| Frontend | Next.js, React |
| Backend | Next.js Route Handlers / Server Actions |
| Database | PostgreSQL pada Supabase |
| Authentication | Supabase Auth |
| Akses database | Prisma / Drizzle / `pg`, disesuaikan hasil audit |
| Validasi | Zod atau setara |
| Object Storage | Supabase Storage / Cloudflare R2 |
| Payment Gateway | Midtrans Sandbox |
| Deployment web | Vercel |
| Background Worker | BullMQ + Redis atau alternatif setara |
| Notifikasi | Web Push dengan VAPID dan Service Worker |

Pilihan JavaScript atau TypeScript harus mengikuti ketentuan teknis dosen dan kondisi repository. Jangan mengubah bahasa proyek yang sudah berjalan tanpa keputusan kelompok.

## 2. Latar Belakang

Pengelolaan penyewaan aset membutuhkan sistem untuk mengatur informasi inventaris, tarif, ketersediaan, verifikasi calon penyewa, pengajuan penyewaan, persetujuan, pembayaran, dokumen kontrak, serah terima, dan pengembalian.

Sistem ditujukan untuk satu entitas pengelola aset, baik instansi maupun pihak swasta. Sistem bukan marketplace multi-pemilik dan bukan sistem reservasi kamar hotel.

Jenis aset yang dikelola meliputi tanah, gedung pertemuan, ruangan, dan aset sejenis yang dapat disewakan.

## 3. Tujuan Produk

1. Memudahkan pengelola mengelola inventaris, kondisi, tarif, dan status aset.
2. Memungkinkan calon penyewa mendaftar dan mengajukan verifikasi identitas/legalitas.
3. Memungkinkan penyewa terverifikasi melihat katalog dan mengajukan penyewaan.
4. Mencegah benturan penyewaan pada unit aset dan hari kalender yang sama.
5. Mengelola persetujuan dan pembayaran melalui Midtrans Sandbox.
6. Menyediakan bukti pembayaran dan dokumen PKS setelah pembayaran terkonfirmasi.
7. Membantu Petugas mencatat serah terima dan pengembalian.
8. Menyediakan riwayat transaksi, notifikasi, dan laporan.
9. Menyimpan data secara persisten dan menerapkan kontrol akses berdasarkan role.

## 4. Target Pengguna dan Hak Akses

### 4.1 Penyewa
- Registrasi, login, dan mengelola profil.
- Mengunggah dokumen KTP/NPWP/NIB sesuai kebutuhan.
- Melihat status verifikasi dan memperbaiki dokumen yang ditolak.
- Setelah verifikasi disetujui Admin, melihat katalog dan detail aset.
- Memeriksa ketersediaan, tarif, dan periode sewa.
- Mengajukan penyewaan.
- Melakukan pembayaran setelah pengajuan disetujui.
- Melihat bukti pembayaran dan PKS.
- Melihat aset yang sedang/pernah disewa, tanggal mulai/selesai, dan riwayat.
- Mengunduh atau mencetak ulang PKS.
- Menerima notifikasi.

Penyewa hanya boleh mengakses data miliknya sendiri.

### 4.2 Petugas
- Melihat transaksi yang ditugaskan.
- Melihat jadwal serah terima dan pengembalian.
- Mencatat waktu dan kondisi awal aset.
- Mencatat waktu dan kondisi akhir aset.
- Mencatat kerusakan, catatan, dan bukti pendukung.
- Melihat riwayat tugas.

Petugas hanya dapat mengakses transaksi sesuai penugasan. Petugas tidak menyetujui pengajuan atau mengelola tarif/aset dalam rancangan ini.

### 4.3 Admin
- Mengelola pengguna dan role.
- Memeriksa dan memutuskan verifikasi dokumen pengguna.
- Mengelola kategori, data aset, foto, tarif, dan status operasional.
- Melihat kalender penyewaan.
- Menyetujui atau menolak pengajuan.
- Melihat status pembayaran dan dokumen PKS.
- Menugaskan Petugas.
- Mengelola laporan dan pengaturan operasional.

## 5. Ruang Lingkup Produk

### 5.1 Fitur utama

| ID | Fitur | Deskripsi | Pengguna |
|---|---|---|---|
| F-01 | Autentikasi | Registrasi, login, logout, sesi | Semua role |
| F-02 | Profil pengguna | Pengelolaan data profil | Penyewa, Admin |
| F-03 | Verifikasi pengguna | Upload dan pemeriksaan KTP/NPWP/NIB | Penyewa, Admin |
| F-04 | Manajemen kategori | CRUD kategori aset | Admin |
| F-05 | Manajemen aset | Data aset, luas, lokasi, fasilitas, kondisi, status, foto | Admin |
| F-06 | Manajemen tarif | Tarif harian, bulanan, tahunan | Admin |
| F-07 | Katalog aset | Daftar dan detail aset setelah verifikasi disetujui | Penyewa terverifikasi |
| F-08 | Pencarian dan filter | Pencarian aset berdasarkan nama/kategori/lokasi/status | Penyewa terverifikasi |
| F-09 | Kalender ketersediaan | Pengecekan hari kalender dan buffer | Sistem, Penyewa, Admin |
| F-10 | Pengajuan sewa | Pengajuan periode dan tujuan penyewaan | Penyewa |
| F-11 | Kalkulasi biaya | Perhitungan berdasarkan tarif database | Sistem |
| F-12 | Persetujuan | Setujui/tolak pengajuan dan alasan | Admin |
| F-13 | Pembayaran | Integrasi Midtrans Sandbox | Penyewa, Sistem |
| F-14 | Bukti pembayaran | Rincian pembayaran yang terkonfirmasi | Penyewa, Admin |
| F-15 | Dokumen PKS | Penerbitan setelah pembayaran, preview, unduh, cetak ulang | Penyewa, Admin |
| F-16 | Serah terima | Pencatatan kondisi awal aset | Petugas |
| F-17 | Pengembalian | Pencatatan kondisi akhir dan kerusakan | Petugas |
| F-18 | Riwayat transaksi | Status, aset, periode, tanggal selesai | Penyewa, Admin |
| F-19 | Penugasan Petugas | Menugaskan Petugas ke transaksi | Admin |
| F-20 | Laporan | Rekap aset, transaksi, dan pembayaran | Admin |
| F-21 | Notifikasi | In-app dan Web Push | Semua role sesuai kejadian |
| F-22 | Pengaturan operasional | Buffer persiapan dan tenggat pembayaran | Admin |

### 5.2 Batasan
- Sistem hanya mengelola aset milik satu entitas.
- Domain aset utama adalah tanah, gedung pertemuan, dan ruangan.
- Penyewaan diblokir berdasarkan hari kalender, meskipun pemakaian hanya beberapa jam.
- Pembayaran menggunakan Midtrans Sandbox untuk simulasi.
- PKS diterbitkan setelah pembayaran terkonfirmasi.
- Dokumen identitas untuk demonstrasi harus fiktif.
- File disimpan di object storage, bukan Base64 dalam database.
- Fitur tambahan dikerjakan setelah alur inti berjalan.

## 6. Aturan Verifikasi Pengguna

1. Pengguna mendaftar dan melengkapi profil.
2. Pengguna mengunggah dokumen KTP/NPWP/NIB sesuai kebutuhan verifikasi.
3. Dokumen disimpan pada private object storage.
4. Status awal verifikasi `PENDING`.
5. Admin memeriksa dokumen dan menyetujui atau menolak.
6. Jika ditolak, Admin menyimpan alasan.
7. Pengguna dapat mengunggah ulang dokumen.
8. Jika disetujui, status menjadi `APPROVED`.
9. Penyewa baru dapat melihat katalog setelah verifikasi disetujui Admin.

Status: `PENDING`, `APPROVED`, `REJECTED`, `RESUBMISSION_REQUIRED`.

Endpoint katalog harus memeriksa status verifikasi di backend. Menyembunyikan halaman atau tombol di frontend saja tidak cukup.

## 7. Aturan Aset dan Tarif

Admin mengelola:
- Nama dan kode aset.
- Kategori/jenis aset.
- Luas atau ukuran area.
- Lokasi.
- Deskripsi dan fasilitas.
- Foto.
- Tarif harian, bulanan, tahunan.
- Kondisi fisik.
- Status operasional.

Kondisi fisik:
- `GOOD`
- `NEEDS_INSPECTION`
- `DAMAGED`

Status operasional:
- `READY`
- `MAINTENANCE`
- `UNAVAILABLE`

Status okupansi seperti dipesan atau sedang disewa ditentukan dari transaksi dan kalender. Aset yang sedang perawatan, tidak tersedia, atau tidak layak tidak dapat diajukan.

## 8. Aturan Penyewaan dan Ketersediaan

### 8.1 Penyewaan berdasarkan hari kalender
- Tanggal mulai dan tanggal selesai bersifat inklusif.
- Penggunaan beberapa jam tetap memblokir satu hari kalender penuh.
- Jika aset telah dipesan pada suatu tanggal, penyewa lain tidak boleh menyewa aset yang sama pada tanggal tersebut.
- Jam penggunaan, jika dicatat, hanya menjadi informasi tambahan dan bukan dasar ketersediaan.

Contoh: aset disewa pada 20 November untuk penggunaan pukul 10.00–13.00. Seluruh tanggal 20 November tetap terblokir.

### 8.2 Buffer persiapan
Sistem memperhitungkan waktu persiapan tempat sebelum dan/atau sesudah penyewaan. Durasi buffer harus dapat dikonfigurasi Admin. Angka final belum ditentukan sehingga tidak boleh di-hardcode sebagai keputusan bisnis.

### 8.3 Pengecekan benturan
Backend wajib:
1. Memeriksa status operasional dan kondisi aset.
2. Memeriksa transaksi yang memblokir periode.
3. Memeriksa seluruh tanggal inklusif.
4. Memperhitungkan buffer.
5. Memeriksa ulang saat pengajuan dan saat Admin menyetujui.
6. Mencegah double booking akibat request bersamaan menggunakan transaksi/locking/constraint PostgreSQL yang sesuai.

Rancangan status pemblokiran:
- `PENDING_APPROVAL`: tidak memblokir secara default.
- `APPROVED_PENDING_PAYMENT`: menahan slot sementara sampai tenggat pembayaran.
- `PAID` dan `RENTED`: memblokir sesuai periode.
- `REJECTED`, `CANCELLED`, `PAYMENT_EXPIRED`, `RETURNED`: tidak memblokir setelah masa blokir berakhir.

Tenggat pembayaran harus dapat dikonfigurasi. Jika pembayaran kedaluwarsa, slot harus dilepaskan.

## 9. Tarif dan Perhitungan Biaya

Setiap aset mendukung tarif:
- Harian.
- Bulanan.
- Tahunan.

Backend menghitung nominal berdasarkan tarif yang tersimpan di database. Backend tidak mempercayai nominal total dari browser.

Hal yang belum diputuskan:
- Bulanan berdasarkan bulan kalender atau periode 30 hari.
- Tahunan berdasarkan tahun kalender atau periode 12 bulan.
- Aturan prorata dan pembulatan.

Buat modul perhitungan terpisah dan dokumentasikan asumsi sementara. Keputusan final harus disepakati kelompok/dosen.

## 10. Alur Bisnis Penyewaan dan Pembayaran

1. Penyewa terverifikasi membuka katalog.
2. Penyewa memilih aset dan melihat detail.
3. Penyewa memilih tanggal mulai dan selesai.
4. Sistem memeriksa ketersediaan termasuk buffer.
5. Penyewa mengisi tujuan dan data pengajuan.
6. Backend menghitung estimasi biaya.
7. Pengajuan disimpan dengan status `PENDING_APPROVAL`.
8. Admin meninjau pengajuan dan memeriksa ulang ketersediaan.
9. Admin menyetujui atau menolak dengan alasan.
10. Jika ditolak, penyewa melihat alasan penolakan.
11. Jika disetujui, status menjadi `APPROVED_PENDING_PAYMENT` dan slot ditahan sampai tenggat pembayaran.
12. Penyewa melakukan pembayaran melalui Midtrans Sandbox.
13. Backend memverifikasi notifikasi/webhook Midtrans.
14. Setelah pembayaran terkonfirmasi, transaksi menjadi `PAID`.
15. Sistem menyimpan bukti pembayaran dan menerbitkan PKS.
16. Petugas melakukan serah terima.
17. Setelah masa sewa selesai, Petugas mencatat pengembalian.
18. Sistem memperbarui kondisi dan ketersediaan aset.

## 11. Midtrans Sandbox dan Bukti Pembayaran

- Pembayaran hanya tersedia untuk pengajuan yang telah disetujui.
- Order ID harus unik.
- Nominal transaksi berasal dari backend.
- Server Key hanya berada di backend.
- Status `PAID` hanya boleh ditetapkan setelah webhook/notifikasi diverifikasi.
- Redirect browser ke halaman sukses bukan bukti pembayaran.
- Terapkan validasi signature, idempotency, dan pencegahan pembayaran ganda.
- Simpan referensi transaksi, nominal, status, metode, dan waktu pembayaran.
- Tangani status gagal, kedaluwarsa, dan notifikasi berulang.

Bukti pembayaran menampilkan nomor transaksi/order, penyewa, aset, periode, nominal, metode, waktu, dan status pembayaran.

Jika kredensial Midtrans belum tersedia, siapkan environment variable dan dokumentasi konfigurasi. Jangan membuat pembayaran sukses palsu.

## 12. Dokumen PKS

PKS diterbitkan hanya setelah pembayaran terkonfirmasi.

Informasi minimal:
- Nomor PKS.
- Identitas entitas pengelola.
- Identitas penyewa.
- Informasi aset.
- Periode penyewaan.
- Nilai sewa.
- Ketentuan perjanjian.
- Tanggal penerbitan.

PKS dapat ditampilkan, diunduh sebagai PDF, dan dicetak ulang. File disimpan privat. Penyewa hanya dapat mengakses PKS miliknya sendiri.

Identitas resmi entitas dan isi hukum final harus berasal dari pengelola/dosen; jangan mengarangnya. Gunakan placeholder pada template sampai data resmi tersedia.

## 13. Serah Terima dan Pengembalian

Petugas hanya dapat mengelola transaksi yang ditugaskan.

Serah terima mencatat:
- Waktu serah terima.
- Kondisi awal.
- Pihak yang menyerahkan/menerima.
- Catatan dan bukti pendukung.

Pengembalian mencatat:
- Waktu pengembalian.
- Kondisi akhir.
- Kerusakan/kekurangan.
- Catatan dan bukti pendukung.

Jika aset dikembalikan dalam kondisi rusak atau perlu pemeriksaan, status operasional harus diperbarui dan aset tidak langsung tersedia.

## 14. Status Transaksi

| Status | Makna |
|---|---|
| `PENDING_APPROVAL` | Menunggu persetujuan |
| `REJECTED` | Ditolak |
| `APPROVED_PENDING_PAYMENT` | Disetujui, menunggu pembayaran |
| `PAYMENT_EXPIRED` | Tenggat pembayaran berakhir |
| `PAID` | Pembayaran terkonfirmasi |
| `RENTED` | Sedang disewa |
| `RETURNED` | Sudah dikembalikan |
| `CANCELLED` | Dibatalkan |

Setiap perubahan status penting dicatat bersama status lama/baru, pelaku, waktu, dan alasan. Transisi status dibatasi oleh backend.

## 15. Rancangan Halaman

### Publik
- Beranda.
- Masuk.
- Daftar.

### Penyewa
- Dashboard.
- Profil dan verifikasi.
- Katalog dan detail aset.
- Kalender ketersediaan.
- Form pengajuan.
- Detail pengajuan/transaksi.
- Pembayaran.
- Bukti pembayaran.
- Preview/unduh PKS.
- Riwayat penyewaan dan tanggal selesai.

### Petugas
- Dashboard.
- Daftar tugas.
- Detail tugas.
- Serah terima.
- Pengembalian.
- Riwayat tugas.

### Admin
- Dashboard.
- Verifikasi pengguna.
- Pengguna dan role.
- Kategori aset.
- Data aset dan foto.
- Tarif.
- Kalender penyewaan.
- Persetujuan pengajuan.
- Pembayaran dan PKS.
- Penugasan Petugas.
- Laporan.
- Pengaturan buffer dan tenggat pembayaran.

## 16. Kebutuhan Database

Database menggunakan PostgreSQL pada Supabase. Entitas logis yang perlu dipenuhi oleh skema aktual:

| Entitas/tabel logis | Fungsi |
|---|---|
| `profiles` | Profil dan role |
| `user_verifications` | Dokumen dan status verifikasi |
| `asset_categories` | Kategori aset |
| `assets` | Data aset |
| `asset_photos` | Foto aset |
| `asset_rates` | Tarif harian/bulanan/tahunan |
| `rental_transactions` | Pengajuan dan transaksi |
| `rental_transaction_items` | Item aset jika satu transaksi dapat memuat beberapa aset |
| `rental_reviews` | Riwayat keputusan Admin |
| `rental_status_history` | Riwayat status |
| `payments` | Pembayaran Midtrans |
| `rental_contracts` | Dokumen PKS |
| `officer_assignments` | Penugasan Petugas |
| `handover_records` | Serah terima |
| `return_records` | Pengembalian |
| `rental_settings` | Buffer dan tenggat pembayaran |
| `notifications` | Notifikasi aplikasi |
| `push_subscriptions` | Subscription Web Push |
| `notification_jobs` | Antrean worker |

Daftar tersebut adalah model logis, bukan instruksi membuat semua tabel baru. Audit skema Supabase aktual terlebih dahulu dan gunakan migration tambahan hanya untuk kebutuhan yang belum tersedia.

Ketentuan:
- Primary key, foreign key, unique/check constraint, dan index.
- Tarif/total tidak negatif.
- `end_date >= start_date`.
- Cegah benturan jadwal pada backend dan database.
- Simpan snapshot tarif pada transaksi.
- Dokumen identitas dan PKS menggunakan private storage.
- Jangan menyimpan file Base64 di database.
- Terapkan RLS dan otorisasi backend.

## 17. Notifikasi dan Background Worker

Alur:
**Kejadian bisnis → Database → Persistent Queue → Background Worker → Web Push → Service Worker → Browser**

Kejadian:
- Pengajuan baru ke Admin.
- Verifikasi disetujui/ditolak ke Penyewa.
- Pengajuan disetujui/ditolak ke Penyewa.
- Pembayaran terkonfirmasi.
- PKS tersedia.
- Pengingat serah terima/pengembalian.

Ketentuan:
- Service Worker dan VAPID.
- Izin notifikasi diminta melalui interaksi pengguna.
- Subscription disimpan di PostgreSQL.
- Worker berjalan sebagai proses terpisah.
- Queue mendukung retry dan idempotency.
- Kegagalan push tidak membatalkan transaksi.
- Worker di-host pada layanan yang mendukung proses background; jangan menganggap Vercel menjalankan worker permanen.

## 18. Kebutuhan Nonfungsional dan Keamanan

| Aspek | Kebutuhan |
|---|---|
| Keamanan | Auth, otorisasi server, RLS, perlindungan secret, rate limiting |
| Integritas | Pencegahan double booking dan transaksi tidak konsisten |
| Persistensi | Data bertahan setelah refresh dan login ulang |
| Responsivitas | Desktop, tablet, mobile |
| Umpan balik | Loading, empty, success, error |
| Kinerja | Pagination, indeks, query efisien |
| Observability | Logging terstruktur dan pemantauan worker |
| Aksesibilitas | Label, fokus keyboard, kontras memadai |

Jangan percaya `user_id`, `role`, harga, atau status dari browser. Service role key dan kredensial database tidak boleh terekspos ke frontend.

## 19. Data Dummy dan Pengujian

Minimal:
- 5 aset dengan variasi tanah, gedung pertemuan, dan ruangan.
- 5 transaksi dengan variasi status.
- Akun uji Penyewa, Petugas, dan Admin.
- Data identitas fiktif.

Pengujian mencakup:
1. Registrasi, login, dan proteksi halaman.
2. Pengguna belum terverifikasi tidak dapat mengakses katalog.
3. Upload dan keputusan verifikasi.
4. CRUD aset, kategori, foto, dan tarif.
5. Perhitungan tarif.
6. Tanggal inklusif dan pemblokiran satu hari kalender.
7. Buffer persiapan.
8. Benturan jadwal dan request bersamaan.
9. Persetujuan/penolakan.
10. Webhook Midtrans valid, invalid, dan berulang.
11. PKS hanya setelah pembayaran terkonfirmasi.
12. Pembatasan akses transaksi/dokumen berdasarkan role dan ownership.
13. Serah terima dan pengembalian.
14. Kondisi aset rusak.
15. Notifikasi dan worker.
16. Rate limiting, persistensi, dan deployment.

Bukti pengujian tidak hanya screenshot UI, tetapi juga pengujian backend, database, otorisasi, webhook, dan log worker.

## 20. Teknologi dan Deployment

| Komponen | Teknologi |
|---|---|
| Version Control | Git/GitHub |
| Frontend | Next.js, React |
| Backend | Next.js Route Handlers / Server Actions |
| Database | PostgreSQL pada Supabase |
| Authentication | Supabase Auth |
| Database access | Prisma / Drizzle / pg |
| Validation | Zod |
| Object Storage | Supabase Storage / Cloudflare R2 |
| Payment | Midtrans Sandbox |
| Queue | Redis + BullMQ atau alternatif |
| Notification | Web Push, VAPID, Service Worker |
| Web deployment | Vercel |
| Worker deployment | Hosting terpisah yang mendukung background process |

Gunakan `.env.local` untuk secret dan sediakan `.env.example` tanpa nilai rahasia. Integrasi GitHub dengan Supabase tidak menggantikan kebutuhan mengatur koneksi database dan environment variable aplikasi.

## 21. Prioritas Pengembangan

1. Audit repository dan skema Supabase.
2. Koneksi Supabase PostgreSQL dan Auth.
3. Proteksi role dan RLS.
4. Profil dan verifikasi pengguna.
5. Manajemen aset, kategori, foto, dan tarif.
6. Katalog dan kalender.
7. Pengajuan, kalkulasi, dan persetujuan.
8. Midtrans Sandbox, bukti pembayaran, dan PKS.
9. Penugasan Petugas, serah terima, dan pengembalian.
10. Dashboard, laporan, dan notifikasi.
11. Pengujian keamanan, integrasi, dan deployment.

## 22. Hal yang Perlu Dikonfirmasi

1. Apakah satu pengajuan hanya memuat satu aset atau dapat beberapa aset?
2. Tarif bulanan/tahunan dihitung berdasarkan bulan/tahun kalender atau periode 30/365 hari?
3. Bagaimana prorata dan pembulatan?
4. Berapa lama buffer persiapan sebelum dan sesudah penyewaan?
5. Berapa lama tenggat pembayaran setelah persetujuan?
6. Apakah pengajuan yang menunggu persetujuan menahan tanggal? Rancangan ini mengusulkan tidak.
7. Bagaimana aturan pembatalan setelah pembayaran, denda, dan kerusakan?
8. Apakah katalog sepenuhnya tertutup sampai verifikasi disetujui? Rancangan ini mengikuti arahan dosen: akses katalog setelah verifikasi Admin.
9. Apa identitas resmi entitas dan template PKS yang harus digunakan?
10. Apakah JavaScript atau TypeScript yang diwajibkan?
11. Apakah Supabase Auth, ORM/driver PostgreSQL, dan worker eksternal sesuai ketentuan teknis dosen?

Keputusan final dicatat oleh PM dan disepakati kelompok/dosen sebelum diterapkan.

## 23. Referensi Dokumen
- Arahan dosen mengenai Sistem Informasi Penyewaan Aset.
- Dokumen ketentuan proyek Tim 10.
- `Technical_Requirements.md` (perlu dicocokkan kembali dengan versi aktual).
- `desain-ui.md`.
- `rancangan-database.md`.
- ERD dan desain Figma.

**Status PRD:** Draft revisi untuk validasi internal kelompok. Skema database aktual Supabase tetap menjadi sumber pemeriksaan sebelum migration; PRD tidak menginstruksikan reset atau pembuatan ulang database.
