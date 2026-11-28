# Sistem Informasi Penyewaan Aset

## Deskripsi Proyek

Sistem Informasi Penyewaan Aset merupakan aplikasi berbasis web yang dirancang untuk membantu proses pengelolaan aset dan penyewaan aset secara terstruktur, mulai dari pengelolaan data aset, pengajuan penyewaan, persetujuan, hingga pengembalian aset.

## Tujuan
- Mempermudah pengelolaan data aset.
- Mempermudah proses pengajuan penyewaan.
- Membantu petugas dalam mengelola persetujuan penyewaan.
- Mempermudah pemantauan status penyewaan dan pengembalian aset.

## Teknologi yang Digunakan
- Frontend: Next.js, React, JavaScript, Tailwind CSS
- Backend: Next.js Route Handlers & Server Actions
- Database: PostgreSQL (Supabase)
- Authentication: Supabase Auth
- Storage: Supabase Storage
- Web Push & Worker: Service Worker (`public/sw.js`), VAPID (`web-push`), Background Worker (`scripts/worker.mjs`)
- Deployment: Vercel

## Cara Menjalankan Aplikasi

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local` dan sesuaikan kredensial Supabase, Midtrans, serta VAPID Web Push:
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:...
```

### 3. Menjalankan Server Aplikasi Next.js
```bash
npm run dev
```
Aplikasi berjalan pada `http://localhost:3000`.

### 4. Menjalankan Background Worker (Web Push & Antrean)
Buka terminal terpisah, lalu jalankan:
```bash
npm run worker
```
Worker akan memproses antrean notifikasi persisten (`notification_jobs`) secara asinkron setiap ada kejadian bisnis (persetujuan sewa, serah terima, pengembalian aset).

## Role Pengguna
1. Admin
2. Petugas
3. Penyewa

## Pembagian Tim
| Role | Tanggung Jawab |
|---|---|
| Project Manager | Analisis, koordinasi, timeline, dokumentasi, dan testing |
| Frontend Developer | Implementasi UI dan integrasi frontend |
| Backend Developer | Database, API, autentikasi, dan logika bisnis |

## Status Proyek

Tahap: Persiapan dan perencanaan.

## Struktur Dokumentasi
- Analisis kebutuhan
- Pembagian tugas
- Timeline pengerjaan
- Rancangan database
- Desain UI/UX

## Anggota Kelompok
Arvian Poetra Sadewa          2404140026
Erlang Aquila Dinar Dewangga  2404140050
Tomi Adyatma                  2404140069
