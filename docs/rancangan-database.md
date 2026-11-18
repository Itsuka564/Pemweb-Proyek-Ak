# Rancangan Database
**Proyek:** Sistem Informasi Penyewaan Aset — Kelompok 10  
**Versi:** 2.0 — diselaraskan dengan model multi-aset dan migrasi Supabase  
**Status:** Rancangan target berdasarkan schema awal Supabase dan dua tahap migrasi SQL. Verifikasi akhir tetap harus dilakukan terhadap schema live setelah seluruh migrasi berhasil.

## 1. Tujuan dan prinsip

Database menggunakan PostgreSQL yang di-host di Supabase. Sistem mengelola aset milik satu entitas pengelola, bukan marketplace.

Model transaksi yang dipilih:
- Satu transaksi dapat memuat beberapa aset.
- Setiap aset dalam transaksi dicatat sebagai satu baris pada `rental_transaction_items`.
- Periode sewa menggunakan tanggal kalender dan bersifat inklusif.
- Jika satu aset telah diblokir pada tanggal tertentu, penyewa lain tidak dapat menyewa aset yang sama pada tanggal yang bertabrakan, termasuk buffer persiapan.

Dokumen ini menjelaskan rancangan target. Nama tabel dan kolom dipertahankan mengikuti schema Supabase yang sudah digunakan sejauh mungkin. Kolom legacy tetap dijelaskan karena masih ada untuk kompatibilitas aplikasi lama.

**Prinsip migrasi:**
1. Backup database sebelum perubahan.
2. Periksa schema live, enum, index, trigger, function, policy RLS, dan migration yang telah diterapkan.
3. Jalankan migration secara bertahap dan terkontrol.
4. Jangan menjalankan reset, `DROP TABLE`, atau menghapus kolom legacy sebelum aplikasi selesai dimigrasikan dan data telah diverifikasi.
5. File disimpan di Supabase Storage; database hanya menyimpan path/metadata, bukan Base64.

## 2. Entitas dan tabel

### 2.1 `profiles`
Profil aplikasi yang terkait dengan identitas Supabase Auth.
- `id` — UUID, PK, FK ke `auth.users.id`.
- `full_name` — nama lengkap.
- `phone`, `address` — informasi kontak.
- `role` — enum `user_role`: `penyewa`, `petugas`, `admin`.
- `is_active` — status akun.
- `created_at`, `updated_at`.

Role tidak boleh dipercaya dari input browser. Perubahan role hanya boleh dilakukan proses backend/Admin yang berwenang.

### 2.2 `user_verifications`
Pengajuan verifikasi identitas/legalitas penyewa.
- `id` — UUID, PK.
- `user_id` — FK ke `profiles.id`.
- `document_type` — `ktp`, `npwp`, atau `nib`.
- `document_number` — nullable; simpan hanya jika benar-benar diperlukan dan lindungi sebagai data sensitif.
- `file_path` — path file privat di Storage.
- `status` — `menunggu`, `disetujui`, `ditolak`, `perlu_dikirim_ulang`.
- `reviewed_by` — FK ke `profiles.id`, nullable.
- `reviewed_at`, `rejection_reason`, `submitted_at`, `created_at`, `updated_at`.

Dokumen identitas tidak boleh disimpan di bucket publik. Gunakan signed URL setelah pemeriksaan otorisasi.

### 2.3 `asset_categories`
- `id` — UUID, PK.
- `name` — nama kategori unik.
- `description` — nullable.
- `is_active` — boolean.
- `created_at`, `updated_at`.

Kategori awal meliputi tanah, gedung pertemuan, dan ruangan.

### 2.4 `assets`
- `id` — UUID, PK.
- `asset_code` — kode unik.
- `category_id` — FK ke `asset_categories.id`.
- `name`, `description`.
- `specifications` — JSONB untuk spesifikasi tambahan.
- `area_size` — ukuran/luas, nullable jika tidak relevan.
- `area_unit` — satuan luas, default `m2`.
- `location` — alamat/deskripsi lokasi.
- `photo_urls` — array URL/path legacy yang dipertahankan selama transisi.
- `condition` — enum legacy `asset_condition`.
- `availability` — enum legacy `asset_availability`.
- `physical_condition` — kondisi fisik baru: `baik`, `perlu_pemeriksaan`, `rusak`.
- `operational_status` — status operasional baru: `siap`, `perbaikan`, `tidak_tersedia`.
- `daily_rate` — tarif harian legacy; dipertahankan untuk kompatibilitas dan sumber backfill awal.
- `is_active`, `created_at`, `updated_at`.

Gunakan `physical_condition` untuk kondisi fisik dan `operational_status` untuk kesiapan operasional. Jangan menjadikan status okupansi seperti “sedang disewa” sebagai status manual permanen; okupansi dihitung dari blok jadwal aktif.

### 2.5 `asset_photos`
Pengelolaan foto aset secara relasional.
- `id` — UUID, PK.
- `asset_id` — FK ke `assets.id`.
- `storage_path` — path foto.
- `alt_text` — nullable.
- `is_primary` — penanda foto utama.
- `sort_order` — urutan foto.
- `created_at`.

Foto lama dari `assets.photo_urls` disalin ke tabel ini oleh migration. Kolom lama tidak langsung dihapus.

### 2.6 `asset_rates`
Daftar tarif per aset dan periode.
- `id` — UUID, PK.
- `asset_id` — FK ke `assets.id`.
- `rate_period` — `harian`, `bulanan`, atau `tahunan`.
- `amount` — numeric, tidak negatif.
- `effective_from` — tanggal mulai berlaku.
- `effective_until` — tanggal akhir berlaku, nullable.
- `is_active` — status tarif.
- `created_at`, `updated_at`.

Tarif lama dari `assets.daily_rate` disalin sebagai tarif `harian`. Tarif bulanan dan tahunan harus diisi Admin berdasarkan harga yang disepakati. Snapshot tarif disimpan pada item transaksi agar perubahan tarif tidak mengubah transaksi lama.

### 2.7 `rental_transactions`
Header transaksi/pengajuan penyewaan. Satu header dapat memiliki beberapa item aset.
- `id` — UUID, PK.
- `transaction_code` — kode unik.
- `renter_id` — FK ke `profiles.id`.
- `start_date`, `end_date` — tanggal kalender; pada implementasi multi-aset, tanggal per item tetap perlu disimpan agar setiap aset dapat memiliki periode berbeda.
- `rental_days` — kolom legacy pada transaksi lama.
- `rate_period`, `rate_amount`, `daily_rate` — kolom legacy/snapshot lama; tidak lagi menjadi sumber tarif utama untuk transaksi multi-aset.
- `subtotal`, `total_cost` — nominal transaksi; `total_cost` dipertahankan sebagai kolom lama yang telah digunakan aplikasi.
- `currency` — default `IDR`.
- `purpose` — tujuan penyewaan.
- `status` — enum legacy `rental_status`; nilai aktual harus diperiksa dari definisi enum Supabase.
- `renter_note`, `decision_note`.
- `processed_by`, `processed_at` — Admin pemroses dan waktu keputusan.
- `payment_due_at`, `reservation_expires_at` — tenggat pembayaran/hold.
- `submitted_at`, `cancelled_at`, `created_at`, `updated_at`.

**Catatan penting:** migration multi-aset yang disiapkan mempertahankan `start_date` dan `end_date` pada header serta `asset_id` legacy yang dibuat nullable. Agar tiap aset dapat memiliki periode berbeda, tabel item perlu ditambah kolom tanggal pada migration berikutnya sebelum fitur tersebut digunakan. Jika semua aset dalam satu transaksi wajib memiliki periode sama, tanggal pada header dapat menjadi periode bersama.

### 2.8 `rental_transaction_items`
Detail aset yang disewa dalam satu transaksi.
- `id` — UUID, PK.
- `transaction_id` — FK ke `rental_transactions.id`.
- `asset_id` — FK ke `assets.id`.
- `rate_id` — FK ke `asset_rates.id`, nullable.
- `rate_period` — `harian`, `bulanan`, atau `tahunan`.
- `rate_amount_snapshot` — snapshot nominal tarif.
- `quantity` — integer positif; aset fisik unik umumnya `1`.
- `line_total` — total biaya item.
- `created_at`.

Constraint unik `(transaction_id, asset_id)` mencegah aset yang sama dimasukkan dua kali ke transaksi yang sama. Transaksi lama di-backfill menjadi satu item per transaksi. Untuk model aset fisik unik, quantity sebaiknya tetap satu.

### 2.9 `rental_reviews`
Riwayat keputusan Admin.
- `id` — UUID, PK.
- `transaction_id` — FK ke `rental_transactions.id`.
- `reviewer_id` — FK ke `profiles.id`.
- `decision` — `disetujui` atau `ditolak`.
- `notes` — catatan/alasan.
- `reviewed_at`.

Keputusan lama dari `processed_by`, `processed_at`, dan `decision_note` disalin jika tersedia. Kolom keputusan di header tetap dipertahankan untuk kompatibilitas.

### 2.10 `rental_status_history`
Riwayat perubahan status transaksi.
- `id` — UUID, PK.
- `rental_id` — FK ke `rental_transactions.id` (nama kolom aktual).
- `old_status`, `new_status` — enum `rental_status`.
- `changed_by` — FK ke `profiles.id`, nullable untuk perubahan sistem.
- `change_note`.
- `changed_at`.

### 2.11 `payments`
Pembayaran untuk transaksi.
- `id` — UUID, PK.
- `rental_id` — FK ke `rental_transactions.id`.
- `payer_id` — FK ke `profiles.id`.
- `amount` — numeric positif.
- `payment_provider` — default `midtrans`.
- `midtrans_order_id` — unik jika terisi.
- `midtrans_transaction_id` — unik jika terisi.
- `midtrans_token`, `payment_url`, `payment_type`.
- `gateway_transaction_status`, `gateway_fraud_status`.
- `gateway_response` — JSONB untuk respons gateway yang diperlukan.
- `proof_url` — kolom legacy untuk bukti pembayaran manual bila masih digunakan.
- `status` — enum legacy `payment_status`.
- `verified_by`, `verified_at`, `rejection_reason` — kolom verifikasi legacy.
- `paid_at`, `expired_at`.
- `created_at`, `updated_at`.

Status pembayaran harus diperbarui oleh backend setelah webhook Midtrans diverifikasi. Redirect browser bukan bukti pembayaran berhasil.

### 2.12 `payment_webhook_events`
Pencatatan notifikasi webhook untuk audit dan idempotensi.
- `id` — UUID, PK.
- `payment_id` — FK ke `payments.id`, nullable.
- `event_key` — unik untuk mencegah pemrosesan event yang sama berulang.
- `order_id`, `transaction_status`.
- `payload` — JSONB.
- `processed_at`, `processing_error`, `created_at`.

Batasi akses payload webhook; simpan hanya data yang diperlukan.

### 2.13 `rental_contracts`
Dokumen kontrak/PKS.
- `id` — UUID, PK.
- `rental_id` — FK ke `rental_transactions.id`, unik (maksimal satu PKS per transaksi pada model saat ini).
- `contract_number` — unik.
- `file_path` — path PDF privat.
- `status` — `terbit` atau `dibatalkan`.
- `generated_at`, `created_by`, `created_at`, `updated_at`.

PKS diterbitkan setelah pembayaran terkonfirmasi. Penyewa hanya dapat mengakses PKS miliknya.

### 2.14 `rental_staff_assignments`
Penugasan Petugas (nama aktual tabel; secara konseptual setara `officer_assignments`).
- `id` — UUID, PK.
- `rental_id` — FK ke `rental_transactions.id`.
- `staff_id` — FK ke `profiles.id`.
- `assigned_by` — FK ke `profiles.id`, nullable.
- `assigned_at`, `ended_at`, `note`.

### 2.15 `handover_records`
- `id` — UUID, PK.
- `rental_id` — FK ke `rental_transactions.id`, unik.
- `handled_by` — FK ke `profiles.id`.
- `handed_over_at`.
- `initial_condition` — enum `asset_condition`.
- `handover_note`, `evidence_path`.
- `created_at`.

### 2.16 `return_records`
- `id` — UUID, PK.
- `rental_id` — FK ke `rental_transactions.id`, unik.
- `handled_by` — FK ke `profiles.id`.
- `returned_at`.
- `final_condition` — enum `asset_condition`.
- `damage_note`, `follow_up_note`, `evidence_path`.
- `created_at`.

Serah terima dan pengembalian dicatat terpisah. Petugas hanya boleh mengelola catatan sesuai penugasan.

### 2.17 `rental_settings`
Pengaturan operasional.
- `id` — smallint, PK, dibatasi satu baris konfigurasi (default `1`).
- `preparation_before_days` — buffer sebelum sewa, integer tidak negatif.
- `preparation_after_days` — buffer sesudah sewa, integer tidak negatif.
- `payment_expiry_minutes` — tenggat pembayaran dalam menit, integer positif.
- `updated_by` — FK ke `profiles.id`, nullable.
- `updated_at`.

Nilai default buffer perlu disepakati kelompok/pengelola. Nilai migration awal adalah default teknis, bukan keputusan kebijakan final.

### 2.18 `asset_booking_blocks`
Blok jadwal per aset untuk mencegah double booking.
- `id` — UUID, PK.
- `rental_item_id` — FK unik ke `rental_transaction_items.id`.
- `asset_id` — FK ke `assets.id`.
- `blocked_period` — PostgreSQL `daterange`, tidak kosong.
- `status` — `active`, `released`, atau `expired`.
- `expires_at`, `released_at`, `created_at`.

Exclusion constraint GiST pada `asset_id` dan `blocked_period` untuk baris berstatus `active` mencegah rentang aktif bertabrakan untuk aset yang sama. Rentang sewa tanggal inklusif harus dikonversi dengan batas akhir eksklusif, serta memasukkan buffer sebelum/sesudah. Proses membuat, memperpanjang, atau melepas block harus dilakukan secara konsisten dalam transaksi database.

### 2.19 `notifications`
- `id` — UUID, PK.
- `user_id` — FK ke `profiles.id`.
- `title`, `message`.
- `target_url`.
- `is_read`, `read_at`, `created_at`.

### 2.20 `push_subscriptions`
- `id` — UUID, PK.
- `user_id` — FK ke `profiles.id`.
- `endpoint` — unik.
- `p256dh_key`, `auth_key`.
- `is_active`, `created_at`, `updated_at`.

### 2.21 `notification_jobs`
- `id` — UUID, PK.
- `notification_id` — FK ke `notifications.id`, nullable.
- `user_id` — FK ke `profiles.id`.
- `payload` — JSONB.
- `dedupe_key` — unik.
- `status` — enum `job_status`.
- `attempts`, `max_attempts`.
- `available_at`, `locked_at`, `sent_at`, `last_error`.
- `created_at`, `updated_at`.

Antrean harus persisten dan worker berjalan sebagai proses terpisah. Kegagalan push tidak boleh membatalkan transaksi bisnis.

## 3. Relasi utama

- `auth.users` 1 — 1 `profiles`.
- `profiles` 1 — N `user_verifications`.
- `asset_categories` 1 — N `assets`.
- `assets` 1 — N `asset_photos`.
- `assets` 1 — N `asset_rates`.
- `profiles` 1 — N `rental_transactions` sebagai penyewa.
- `rental_transactions` 1 — N `rental_transaction_items`.
- `assets` 1 — N `rental_transaction_items`.
- `asset_rates` 1 — N `rental_transaction_items` (referensi tarif dapat nullable; snapshot tetap disimpan).
- `rental_transactions` 1 — N `rental_reviews`.
- `rental_transactions` 1 — N `rental_status_history`.
- `rental_transactions` 1 — N `payments`.
- `payments` 1 — N `payment_webhook_events`.
- `rental_transactions` 1 — 0..1 `rental_contracts`.
- `rental_transactions` 1 — N `rental_staff_assignments`.
- `rental_transactions` 1 — 0..1 `handover_records` dan 0..1 `return_records` pada schema sekarang.
- `rental_transaction_items` 1 — 0..1 `asset_booking_blocks`.
- `profiles` 1 — N notifikasi, push subscription, dan catatan operasional sesuai perannya.

## 4. Aturan penyewaan dan pencegahan bentrok

1. Tanggal sewa menggunakan tanggal kalender; tanggal mulai dan selesai inklusif.
2. Penggunaan hanya beberapa jam tetap memblokir tanggal kalender tersebut.
3. Buffer sebelum dan sesudah sewa ikut memblokir ketersediaan.
4. Setiap item aset mempunyai blok jadwal masing-masing.
5. Pengajuan `menunggu_persetujuan` tidak otomatis memblokir jadwal kecuali kebijakan pengelola menyatakan lain.
6. Setelah disetujui dan menunggu pembayaran, blok dapat ditahan sementara sampai `expires_at`.
7. Setelah pembayaran terkonfirmasi, blok tetap aktif sampai periode sewa dan buffer selesai.
8. Transaksi ditolak, dibatalkan, atau kedaluwarsa harus melepaskan blok.
9. Backend wajib mengecek ulang saat submit dan persetujuan.
10. Exclusion constraint database menjadi perlindungan terhadap dua proses booking bersamaan; pemeriksaan aplikasi saja tidak cukup.
11. Pekerjaan kedaluwarsa harus mengubah status block secara terkontrol; jangan mengandalkan `expires_at` saja untuk mengeluarkan baris dari exclusion constraint karena partial constraint tidak mengevaluasi waktu secara otomatis.

**Catatan implementasi multi-aset:** migration saat ini menempatkan `start_date` dan `end_date` di header transaksi. Karena itu, untuk versi awal semua item dalam satu transaksi menggunakan rentang tanggal yang sama. Jika setiap aset perlu tanggal berbeda, tambahkan `start_date` dan `end_date` ke `rental_transaction_items` dan ubah proses pembentukan booking block sebelum fitur tersebut dipakai.

## 5. Status data

Status enum aktual yang sudah ada di Supabase:
- `user_role`
- `asset_condition`
- `asset_availability`
- `rental_status`
- `payment_status`
- `job_status`

Definisi lengkap enum harus diambil dari Supabase sebelum mengubah nilai enum. Kolom tambahan yang dibuat sebagai `text` menggunakan nilai:
- Verifikasi: `menunggu`, `disetujui`, `ditolak`, `perlu_dikirim_ulang`.
- Kondisi fisik: `baik`, `perlu_pemeriksaan`, `rusak`.
- Status operasional: `siap`, `perbaikan`, `tidak_tersedia`.
- Review: `disetujui`, `ditolak`.
- Booking block: `active`, `released`, `expired`.
- Kontrak: `terbit`, `dibatalkan`.

Jangan mengasumsikan nilai enum transaksi/pembayaran tanpa membaca definisi enum live.

## 6. Keamanan, Auth, dan RLS

- Gunakan Supabase Auth untuk identitas dan sesi.
- `profiles.id` terkait dengan `auth.users.id`.
- Backend Next.js memverifikasi sesi dan role untuk setiap operasi bisnis.
- RLS harus diaudit dan diaktifkan pada tabel yang menyimpan data pengguna/transaksi.
- Penyewa hanya membaca data verifikasi, transaksi, pembayaran, dan PKS miliknya.
- Petugas hanya membaca transaksi yang ditugaskan kepadanya dan mengelola catatan operasional sesuai penugasan.
- Admin memiliki akses pengelolaan sesuai role.
- Storage dokumen identitas dan PKS bersifat privat; gunakan signed URL setelah pemeriksaan otorisasi.
- Jangan mengekspos service-role key atau database password di browser.
- Jangan percaya `user_id`, `role`, nominal, status, atau keputusan yang dikirim frontend.
- Audit policy RLS untuk seluruh tabel tambahan: `asset_photos`, `asset_rates`, `user_verifications`, `rental_transaction_items`, `rental_reviews`, `payment_webhook_events`, `rental_contracts`, `asset_booking_blocks`, dan `rental_settings`.

## 7. Index dan constraint penting

- Unique: `profiles.id`, `asset_categories.name`, `assets.asset_code`, `rental_transactions.transaction_code`, `payments.midtrans_order_id` (jika terisi), `payments.midtrans_transaction_id` (jika terisi), `rental_contracts.contract_number`, `payment_webhook_events.event_key`, `notification_jobs.dedupe_key`.
- Unique item: `(transaction_id, asset_id)`.
- Unique relasi 1:0..1: `handover_records.rental_id`, `return_records.rental_id`, `rental_contracts.rental_id`, dan `asset_booking_blocks.rental_item_id`.
- Check: tanggal transaksi valid, nominal tidak negatif, quantity positif, buffer tidak negatif, periode tarif valid, booking range tidak kosong.
- Exclusion constraint: tidak boleh ada `asset_booking_blocks` berstatus `active` yang overlap untuk `asset_id` yang sama.
- Index untuk FK dan pencarian berdasarkan status/tanggal sesuai pola query aplikasi.

## 8. Catatan kesesuaian schema dan migration

Nama aktual yang perlu dipertahankan:
- `rental_staff_assignments` (bukan `officer_assignments`).
- `rental_status_history.rental_id` (bukan `transaction_id`).
- `payments.rental_id` (bukan `transaction_id`).
- `rental_contracts.rental_id` (bukan `transaction_id`).
- `rental_reviews.transaction_id` dan `rental_transaction_items.transaction_id`.

Kolom legacy yang masih dipertahankan:
- `assets.photo_urls`, `assets.daily_rate`, `assets.condition`, `assets.availability`.
- `rental_transactions.asset_id`, `daily_rate`, `rental_days`, `rate_period`, `rate_amount`.
- `payments.proof_url`, `verified_by`, `verified_at`, `rejection_reason`.

Jangan menghapus kolom legacy sampai:
1. Aplikasi sudah memakai tabel/kolom baru.
2. Data lama sudah berhasil di-backfill dan diverifikasi.
3. Tidak ada query, view, trigger, function, atau policy yang masih bergantung pada kolom lama.
4. Ada migration penghapusan terpisah yang telah ditinjau.

**Perhatian:** migration SQL adalah perubahan struktur, bukan implementasi seluruh proses bisnis. Backend masih harus mengimplementasikan webhook Midtrans, pembuatan PKS setelah pembayaran, pembuatan dan pelepasan booking block, otorisasi, RLS, dan worker notifikasi.

## 9. Data dummy dan seed

- Minimal 5 aset dan 5 transaksi dengan variasi status sesuai ketentuan tugas.
- Buat akun uji untuk Penyewa, Petugas, dan Admin melalui mekanisme aman.
- Gunakan data fiktif.
- Contoh aset hanya domain tanah, gedung pertemuan, dan ruangan.
- Jangan memakai KTP/NPWP/NIB asli.
- Setiap aset contoh perlu tarif harian; tarif bulanan/tahunan diisi sesuai data dummy yang disepakati.
- Seed harus aman dijalankan ulang tanpa duplikasi.
- Untuk transaksi multi-aset, seed harus memiliki transaksi dengan lebih dari satu item agar relasi dapat diuji.

## 10. Keputusan yang masih perlu disepakati

1. Apakah semua aset dalam satu transaksi wajib memakai tanggal mulai dan selesai yang sama? Migration saat ini mengasumsikan ya.
2. Definisi tarif bulanan/tahunan: bulan kalender atau periode 30/365 hari?
3. Aturan prorata dan pembulatan tarif?
4. Durasi buffer sebelum dan sesudah sewa?
5. Tenggat pembayaran setelah persetujuan?
6. Apakah pengajuan menunggu persetujuan menahan tanggal?
7. Kebijakan pembatalan setelah pembayaran?
8. Denda keterlambatan atau biaya kerusakan?
9. Field identitas yang wajib untuk tiap jenis penyewa dan kebijakan penyimpanan dokumen?
10. Format PKS dan identitas resmi entitas pengelola?
11. Apakah satu transaksi hanya memiliki satu PKS gabungan atau PKS per aset? Struktur sekarang menetapkan satu PKS per transaksi.

**Status akhir dokumen:** rancangan target v2.0 yang mengikuti model transaksi multi-aset dan nama tabel/kolom pada migration yang disiapkan. Sebelum disebut identik dengan database live, lakukan export schema terbaru setelah seluruh migration dijalankan dan audit RLS, enum, constraint, serta index.
