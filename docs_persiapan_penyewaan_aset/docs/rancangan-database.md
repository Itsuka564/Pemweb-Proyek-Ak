# Rancangan Database Awal

> Draft konseptual untuk ditinjau BE. Belum diterapkan sebagai skema database.

## Entitas yang diusulkan

### `profiles`
- `id` — UUID, primary key, terkait identitas Auth.
- `full_name` — nama pengguna.
- `role` — `renter`, `officer`, atau `admin`.
- `phone` — nomor kontak bila diperlukan.
- `created_at` — waktu pembuatan.

### `assets`
- `id` — UUID, primary key.
- `name`, `description`, `category` — informasi aset.
- `condition` — kondisi aset.
- `availability_status` — status ketersediaan.
- `image_path` — lokasi gambar di Storage bila digunakan.
- `created_at`, `updated_at`.

### `rental_rates`
- `id` — UUID, primary key.
- `asset_id` — foreign key ke `assets.id`.
- `rate_amount` — nilai tarif.
- `rate_unit` — satuan tarif, misalnya jam/hari.
- `effective_from`, `effective_until` — masa berlaku bila diperlukan.

### `rental_requests`
- `id` — UUID, primary key.
- `renter_id` — foreign key ke `profiles.id`.
- `status` — status pengajuan.
- `start_at`, `end_at` — periode yang diminta.
- `purpose` — tujuan bila diperlukan.
- `submitted_at` — waktu pengajuan.

### `rental_request_items`
- `id` — UUID, primary key.
- `request_id` — foreign key ke `rental_requests.id`.
- `asset_id` — foreign key ke `assets.id`.
- `quantity` — jumlah aset.
- `rate_snapshot` — tarif saat pengajuan bila diperlukan.

### `rental_reviews`
- `id` — UUID, primary key.
- `request_id` — foreign key ke `rental_requests.id`.
- `reviewer_id` — foreign key ke `profiles.id`.
- `decision`, `notes`, `reviewed_at` — keputusan, catatan, waktu.

### `handover_returns`
- `id` — UUID, primary key.
- `request_id` — foreign key ke `rental_requests.id`.
- `officer_id` — foreign key ke `profiles.id`.
- `handover_at`, `returned_at` — waktu serah terima/pengembalian.
- `condition_before`, `condition_after`, `notes` — kondisi dan catatan.

## Relasi konseptual
- Satu penyewa dapat memiliki banyak pengajuan.
- Satu pengajuan dapat memiliki banyak item aset.
- Satu aset dapat muncul pada banyak item pengajuan.
- Satu aset dapat memiliki beberapa catatan tarif.
- Pengajuan dapat memiliki catatan review dan serah terima/pengembalian.

## Hal yang harus diputuskan BE
- Satu pengajuan boleh berisi beberapa jenis aset atau tidak?
- Bagaimana mencegah bentrok jadwal aset?
- Status ketersediaan disimpan atau dihitung dari jadwal?
- Apakah review dapat dilakukan lebih dari sekali?
- Apakah serah terima dan pengembalian dipisah?
- Bagaimana aturan pembatalan, denda, keterlambatan, dan kerusakan?

## Catatan teknis
Gunakan foreign key dan constraint; terapkan otorisasi di server/database; jangan percaya role atau kepemilikan yang dikirim browser; simpan secret dalam environment variable dan jangan commit `.env`.

**Status:** draft awal yang perlu divalidasi BE dan PM.
