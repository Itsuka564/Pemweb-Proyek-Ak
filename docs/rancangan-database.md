# Rancangan Database
**Proyek:** Sistem Informasi Penyewaan Aset — Kelompok 10  
**Status:** Rancangan konseptual revisi; wajib dicocokkan dengan database Supabase aktual sebelum migration.

## 1. Tujuan dan prinsip
Database menggunakan PostgreSQL yang di-host di Supabase. Sistem mengelola aset milik satu entitas pengelola, bukan marketplace.

Dokumen ini adalah acuan logis, **bukan instruksi untuk membuat ulang database**. Sebelum perubahan:
1. Hubungkan aplikasi ke project Supabase yang benar.
2. Periksa tabel, kolom, tipe data, constraint, index, trigger, policy RLS, dan migration yang sudah ada.
3. Petakan tabel aktual ke entitas di dokumen ini.
4. Buat migration tambahan hanya untuk gap yang terbukti ada.
5. Jangan menjalankan reset, `DROP TABLE`, atau menghapus data tanpa persetujuan.

Gunakan UUID untuk primary key bila sesuai dengan skema yang sudah ada. Waktu disimpan konsisten (umumnya `timestamptz`), nominal uang menggunakan `numeric`, dan file disimpan di object storage; database hanya menyimpan metadata/path.

## 2. Entitas dan tabel logis

### 2.1 `profiles`
Profil aplikasi yang terkait dengan identitas Supabase Auth.
- `id` — UUID, PK, referensi ke `auth.users.id`.
- `full_name` — nama lengkap.
- `role` — `renter`, `officer`, `admin`.
- `phone` — nomor kontak, nullable.
- `created_at`, `updated_at`.

Role tidak boleh dipercaya dari input browser. Perubahan role hanya oleh proses Admin/backend yang berwenang.

### 2.2 `user_verifications`
Pengajuan verifikasi identitas/legalitas penyewa.
- `id` — UUID, PK.
- `user_id` — FK ke `profiles.id`.
- `document_type` — `KTP`, `NPWP`, atau `NIB`.
- `storage_path` — path file privat.
- `status` — `PENDING`, `APPROVED`, `REJECTED`, `RESUBMISSION_REQUIRED`.
- `reviewed_by` — FK ke `profiles.id`, nullable.
- `reviewed_at` — nullable.
- `rejection_reason` — nullable.
- `submitted_at`, `created_at`, `updated_at`.

Simpan metadata dokumen seperlunya. Jangan menyimpan file Base64 atau membuat bucket dokumen identitas menjadi publik.

### 2.3 `asset_categories`
- `id` — UUID, PK.
- `name` — nama kategori unik.
- `description` — nullable.
- `is_active` — boolean.
- `created_at`, `updated_at`.

Kategori awal: tanah, gedung pertemuan, ruangan. Admin dapat menambah kategori lain yang masih sesuai domain.

### 2.4 `assets`
- `id` — UUID, PK.
- `asset_code` — kode unik.
- `category_id` — FK ke `asset_categories.id`.
- `name`, `description`.
- `area_size` — ukuran/luas, nullable jika tidak relevan.
- `area_unit` — satuan luas, misalnya `m2`.
- `location` — alamat/lokasi atau deskripsi lokasi.
- `facilities` — JSON/relasi fasilitas sesuai kebutuhan.
- `physical_condition` — `GOOD`, `NEEDS_INSPECTION`, `DAMAGED`.
- `operational_status` — `READY`, `MAINTENANCE`, `UNAVAILABLE`.
- `created_at`, `updated_at`.

Jangan menjadikan `BOOKED` atau `RENTED` sebagai status manual permanen jika status tersebut dapat dihitung dari transaksi aktif. Status operasional manual memisahkan kesiapan aset dari okupansi jadwal.

### 2.5 `asset_photos`
- `id` — UUID, PK.
- `asset_id` — FK ke `assets.id`.
- `storage_path` — path foto di Storage.
- `alt_text` — nullable.
- `is_primary` — boolean.
- `sort_order` — integer.
- `created_at`.

Foto aset dapat disajikan publik sesuai kebijakan. File privat tidak boleh dicampur dalam bucket publik.

### 2.6 `asset_rates`
- `id` — UUID, PK.
- `asset_id` — FK ke `assets.id`.
- `rate_unit` — `DAY`, `MONTH`, `YEAR`.
- `amount` — numeric, tidak negatif.
- `effective_from` — tanggal mulai berlaku.
- `effective_until` — nullable.
- `is_active` — boolean.
- `created_at`, `updated_at`.

Simpan snapshot tarif pada transaksi agar perubahan tarif di kemudian hari tidak mengubah transaksi lama.

### 2.7 `rental_transactions`
Satu transaksi/pengajuan penyewaan.
- `id` — UUID, PK.
- `transaction_code` — kode unik.
- `renter_id` — FK ke `profiles.id`.
- `status` — status proses transaksi.
- `start_date`, `end_date` — tanggal kalender, inklusif.
- `purpose` — tujuan penyewaan.
- `subtotal`, `total_amount` — numeric, tidak negatif.
- `currency` — misalnya `IDR`.
- `submitted_at`, `created_at`, `updated_at`.

Jika satu pengajuan hanya boleh berisi satu aset, simpan `asset_id` dan snapshot tarif langsung di tabel ini. Jika satu pengajuan dapat memuat beberapa aset, gunakan tabel item berikut. Pilih satu model setelah memeriksa ERD/database aktual dan keputusan kelompok.

### 2.8 `rental_transaction_items` (jika satu pengajuan dapat memuat beberapa aset)
- `id` — UUID, PK.
- `transaction_id` — FK ke `rental_transactions.id`.
- `asset_id` — FK ke `assets.id`.
- `rate_id` — FK ke `asset_rates.id`, nullable bila snapshot cukup.
- `rate_unit_snapshot` — `DAY`, `MONTH`, `YEAR`.
- `rate_amount_snapshot` — numeric.
- `quantity` — integer; untuk aset unik biasanya `1`.
- `line_total` — numeric.
- `created_at`.

Jika desain memakai banyak item, aturan benturan jadwal diterapkan per `asset_id` pada setiap item. Jangan mengizinkan jumlah lebih dari satu untuk aset fisik unik kecuali model inventaris memang mendukung kuantitas.

### 2.9 `rental_reviews`
Riwayat keputusan Admin.
- `id` — UUID, PK.
- `transaction_id` — FK ke `rental_transactions.id`.
- `reviewer_id` — FK ke `profiles.id`.
- `decision` — `APPROVED` atau `REJECTED`.
- `notes` — alasan/catatan, wajib untuk penolakan.
- `reviewed_at`.

Gunakan tabel riwayat agar keputusan sebelumnya tidak tertimpa bila ada proses peninjauan ulang.

### 2.10 `rental_status_history`
- `id` — UUID, PK.
- `transaction_id` — FK ke `rental_transactions.id`.
- `old_status`, `new_status`.
- `changed_by` — FK ke `profiles.id`, nullable untuk perubahan sistem.
- `reason` — nullable.
- `created_at`.

### 2.11 `payments`
- `id` — UUID, PK.
- `transaction_id` — FK ke `rental_transactions.id`.
- `provider` — misalnya `MIDTRANS`.
- `order_id` — unik.
- `provider_transaction_id` — nullable/unik jika tersedia.
- `amount` — numeric.
- `status` — status pembayaran internal.
- `payment_type` — nullable.
- `paid_at` — nullable.
- `raw_notification` — simpan seperlunya dan dengan pembatasan akses; jangan simpan data sensitif yang tidak diperlukan.
- `created_at`, `updated_at`.

Webhook harus diverifikasi di backend dan diproses idempotent. Redirect browser tidak boleh menjadi bukti pembayaran berhasil.

### 2.12 `rental_contracts`
- `id` — UUID, PK.
- `transaction_id` — FK ke `rental_transactions.id`, unique jika satu PKS per transaksi.
- `contract_number` — unik.
- `storage_path` — lokasi PDF privat.
- `issued_at`.
- `created_at`.

PKS hanya diterbitkan setelah pembayaran terkonfirmasi. File PKS tidak boleh dapat diakses penyewa lain.

### 2.13 `officer_assignments`
- `id` — UUID, PK.
- `transaction_id` — FK ke `rental_transactions.id`.
- `officer_id` — FK ke `profiles.id`.
- `assigned_by` — FK ke `profiles.id`.
- `assigned_at`.
- `notes` — nullable.

### 2.14 `handover_records`
- `id` — UUID, PK.
- `transaction_id` — FK ke `rental_transactions.id`.
- `officer_id` — FK ke `profiles.id`.
- `handover_at`.
- `condition_before`.
- `handover_notes` — nullable.
- `evidence_path` — nullable.
- `created_at`.

### 2.15 `return_records`
- `id` — UUID, PK.
- `transaction_id` — FK ke `rental_transactions.id`.
- `officer_id` — FK ke `profiles.id`.
- `returned_at`.
- `condition_after`.
- `damage_notes` — nullable.
- `evidence_path` — nullable.
- `created_at`.

Serah terima dan pengembalian dipisah agar masing-masing dapat memiliki waktu, kondisi, dan bukti sendiri. Pastikan hanya petugas yang berwenang yang dapat mencatatnya.

### 2.16 `rental_settings`
Pengaturan operasional yang dapat diubah Admin.
- `id` — UUID, PK.
- `preparation_buffer_days` — integer, default sesuai keputusan kelompok.
- `post_rental_buffer_days` — integer, default sesuai keputusan kelompok.
- `payment_expiry_minutes` — integer, default sesuai keputusan kelompok.
- `updated_by`, `updated_at`.

Nilai default operasional harus disepakati; jangan mengarang durasi final. Validasi agar nilai tidak negatif.

### 2.17 Notifikasi
`notifications`
- `id`, `user_id`, `title`, `body`, `target_url`, `read_at`, `created_at`.

`push_subscriptions`
- `id`, `user_id`, `endpoint`, `p256dh`, `auth`, `is_active`, `created_at`, `updated_at`.

`notification_jobs`
- `id`, `notification_id`, `status`, `attempts`, `available_at`, `processed_at`, `last_error`, `created_at`.

Antrean harus persisten dan worker berjalan sebagai proses terpisah. Kegagalan push tidak boleh membatalkan transaksi bisnis.

## 3. Relasi konseptual
- Satu `profiles` dapat memiliki banyak verifikasi.
- Satu kategori memiliki banyak aset.
- Satu aset memiliki banyak foto dan riwayat tarif.
- Satu penyewa memiliki banyak transaksi.
- Satu transaksi memiliki satu atau beberapa item aset sesuai keputusan model.
- Satu transaksi memiliki riwayat review dan perubahan status.
- Satu transaksi memiliki pembayaran dan PKS sesuai aturan bisnis.
- Satu transaksi dapat memiliki penugasan Petugas, catatan serah terima, dan catatan pengembalian.
- Satu pengguna memiliki banyak notifikasi dan push subscription.

## 4. Aturan penyewaan dan pencegahan bentrok
- Periode sewa memakai `start_date` dan `end_date` bertipe tanggal.
- Tanggal mulai dan selesai bersifat inklusif.
- Penggunaan beberapa jam tetap memblokir satu hari kalender.
- Buffer sebelum/sesudah sewa ikut memblokir ketersediaan.
- Pengajuan `PENDING_APPROVAL` tidak memblokir secara default.
- Pengajuan yang disetujui dan menunggu pembayaran memblokir sementara sampai tenggat pembayaran.
- Transaksi `PAID` dan `RENTED` memblokir periode sesuai siklus penyewaan.
- `REJECTED`, `CANCELLED`, dan `PAYMENT_EXPIRED` tidak memblokir.
- Backend wajib mengecek ulang saat submit dan saat Admin menyetujui.
- Gunakan transaksi PostgreSQL dan mekanisme concurrency-safe (misalnya exclusion constraint/range bila cocok, locking, atau strategi setara). Pemeriksaan aplikasi saja tidak cukup.
- Setelah pembayaran kedaluwarsa, lepaskan hold secara konsisten.

Jangan menyimpan status okupansi yang bisa menjadi stale sebagai satu-satunya sumber kebenaran. Status operasional manual (`MAINTENANCE`, `UNAVAILABLE`) digabungkan dengan hasil perhitungan jadwal untuk menentukan ketersediaan.

## 5. Status yang disarankan
### Verifikasi
`PENDING`, `APPROVED`, `REJECTED`, `RESUBMISSION_REQUIRED`.

### Transaksi
`PENDING_APPROVAL`, `REJECTED`, `APPROVED_PENDING_PAYMENT`, `PAYMENT_EXPIRED`, `PAID`, `RENTED`, `RETURNED`, `CANCELLED`.

### Kondisi fisik
`GOOD`, `NEEDS_INSPECTION`, `DAMAGED`.

### Status operasional
`READY`, `MAINTENANCE`, `UNAVAILABLE`.

Status `BOOKED`/`RENTED` dapat ditampilkan sebagai hasil perhitungan transaksi aktif, bukan status manual yang mengalahkan data jadwal.

## 6. Keamanan, Auth, dan RLS
- Gunakan Supabase Auth untuk identitas dan sesi sesuai konfigurasi proyek.
- `profiles.id` terkait dengan `auth.users.id`.
- Backend Next.js memverifikasi sesi dan role untuk setiap operasi bisnis.
- RLS diaktifkan pada tabel yang menyimpan data pengguna/transaksi.
- Penyewa hanya membaca data verifikasi, transaksi, pembayaran, dan PKS miliknya.
- Petugas hanya membaca transaksi yang ditugaskan kepadanya dan mengelola catatan operasional sesuai penugasan.
- Admin memiliki akses pengelolaan sesuai role.
- Storage dokumen identitas dan PKS bersifat privat; gunakan signed URL setelah pemeriksaan otorisasi.
- Jangan mengekspos service-role key atau database password di browser.
- Jangan percaya `user_id`, `role`, nominal, atau status yang dikirim frontend.
- Simpan secret dalam environment variable.

## 7. Index dan constraint minimum
- Unique: `profiles.id`, `assets.asset_code`, `rental_transactions.transaction_code`, `payments.order_id`, `rental_contracts.contract_number`.
- Foreign key untuk seluruh relasi.
- Check: nominal tidak negatif; `end_date >= start_date`; buffer dan quantity tidak negatif/positif sesuai aturan.
- Index untuk `assets.category_id`, status aset, `rental_transactions.renter_id`, status, tanggal, `rental_transaction_items.asset_id`, pembayaran, penugasan Petugas, dan notifikasi.
- Constraint/strategi khusus untuk mencegah overlap per aset harus dirancang berdasarkan model item dan rentang tanggal aktual.

## 8. Migration dan integrasi Supabase
Sebelum membuat migration:
1. Periksa skema project Supabase aktual.
2. Cocokkan nama tabel/kolom yang sudah ada.
3. Buat tabel pemetaan: entitas rancangan ↔ tabel aktual ↔ gap.
4. Usulkan migration minimal.
5. Tampilkan SQL/migration dan dampaknya.
6. Minta persetujuan sebelum migration yang berpotensi mengubah atau menghapus data.

Gunakan migration versioned yang dapat ditinjau di Git. Jangan menjalankan reset database untuk menyamakan skema.

Environment variable disimpan di `.env.local` dan dicantumkan sebagai nama tanpa nilai pada `.env.example`, sesuai metode koneksi:
- `DATABASE_URL`
- `DIRECT_URL` (jika ORM memerlukannya)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` atau publishable key yang sesuai
- `SUPABASE_SERVICE_ROLE_KEY` hanya jika diperlukan di backend

Jangan menuliskan secret di dokumentasi atau commit `.env.local`.

## 9. Data dummy dan seed
- Minimal 5 aset dan 5 transaksi dengan variasi status.
- Buat akun uji untuk Penyewa, Petugas, Admin melalui mekanisme aman.
- Data harus fiktif.
- Aset contoh hanya domain tanah, gedung pertemuan, dan ruangan.
- Jangan memakai KTP/NPWP/NIB asli.
- Seed harus idempotent atau aman dijalankan ulang tanpa duplikasi.

## 10. Hal yang perlu diputuskan sebelum implementasi final
1. Satu pengajuan berisi satu aset atau beberapa aset?
2. Definisi tarif bulanan/tahunan: bulan kalender atau periode 30/365 hari?
3. Aturan prorata dan pembulatan?
4. Durasi buffer sebelum dan sesudah sewa?
5. Tenggat pembayaran setelah persetujuan?
6. Apakah pengajuan pending approval menahan tanggal? Rancangan ini mengusulkan tidak.
7. Apakah perlu pembatalan setelah pembayaran dan bagaimana kebijakannya?
8. Apakah ada denda keterlambatan atau biaya kerusakan?
9. Detail field identitas dan kebijakan dokumen KTP/NPWP/NIB?
10. Format PKS dan identitas resmi entitas pengelola?

**Status:** Rancangan konseptual revisi. Bukan representasi otomatis dari skema Supabase yang sudah ada. Skema aktual harus diaudit sebelum perubahan database.
