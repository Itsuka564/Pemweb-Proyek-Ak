# Referensi Desain UI/UX
**Proyek:** Sistem Informasi Penyewaan Aset — Kelompok 10  
**Status:** Revisi berdasarkan arahan dosen dan PRD  
**Platform:** Web Application

## 1. Tujuan dan prinsip desain
Dokumen ini menjadi acuan implementasi UI/UX. Sistem mengelola aset milik **satu entitas pengelola**, bukan marketplace dan bukan sistem penyewaan kamar hotel. Jenis aset utama meliputi tanah, gedung pertemuan, dan ruangan.

Prinsip desain:
- Profesional, sederhana, konsisten, dan mudah digunakan.
- Mempertahankan desain Figma yang sudah dibuat selama masih sesuai kebutuhan.
- Navigasi dan halaman disesuaikan dengan role.
- Menggunakan komponen reusable; navbar/sidebar tidak diduplikasi pada setiap halaman.
- Data dashboard, katalog, transaksi, dan laporan berasal dari backend/database, bukan angka statis.
- Setiap halaman memiliki loading, empty, success, dan error state.
- Form menyediakan validasi dan pesan kesalahan yang jelas.
- Mendukung desktop, tablet, dan mobile.

## 2. Identitas visual

> [!IMPORTANT]
> **Penyelarasan Palet Figma & Prototipe:** Berdasarkan pemeriksaan dokumen prototipe interaktif `Desain UI Penyewaan Aset — Kelompok 10.html` dan `SewaAset_12_Halaman_Figma.html`, palet resmi yang digunakan pada antarmuka prototipe adalah skema **Teal & Amber (Komplementer 60-30-10)** dengan tipografi **Plus Jakarta Sans**. Palet Deep Navy/Warm Beige pada draf sebelumnya dicatat sebagai draf konseptual awal.

### 2.1 Palet Warna Utama (60-30-10)
1. **Warna Utama / Dominan (30%):**
   - **Teal 700 (`#0A4A56`):** Header bar atas (navbar), judul utama, hero banner gradient, hover state.
   - **Teal 600 (`#0E6B7A`):** Tombol utama (Primary Button), tautan, angka KPI dashboard, border fokus sekunder.
   - **Teal 100 (`#D7EDF0`):** Latar estimasi biaya, thumbnail aset, kontainer informatif.
2. **Aksen Komplementer (10%):**
   - **Amber 500 (`#F2A33A`):** Call-to-Action (CTA) krusial: "Jelajahi Katalog", "Ajukan Sewa", "Daftar Akun", "Simpan Pengembalian", "Setujui Pengajuan", logo badge. Warna teks di atas amber adalah `#16222B`.
3. **Netral (60%):**
   - **Latar Belakang Aplikasi (`#F4F7F9` / `#EEF2F5`):** Background utama seluruh halaman.
   - **Permukaan (`#FFFFFF`):** Background kartu (Card), tabel, formulir input, modal dialog.
   - **Garis Pembatas (`#D9E1E7`):** Border kartu, separator tabel, divider.
   - **Teks Utama (`#16222B`):** Heading, teks konten, label input (kontras tinggi WCAG AA > 7:1).
   - **Teks Samar (`#5A6B78`):** Subtitle, metadata, caption, keterangan bantuan.

### 2.2 Status Badges
Status tidak hanya mengandalkan warna, melainkan selalu disertai teks label eksplisit:
- **Tersedia / Disetujui / Dikembalikan / Baik (Sukses):** Latar `#DFF3E8`, teks `#17633C`.
- **Dipesan / Menunggu Persetujuan / Perlu Pemeriksaan (Peringatan):** Latar `#FFF0CC`, teks `#7A5200`.
- **Sedang Disewa / Serah Terima (Informasi):** Latar `#DCE9F8`, teks `#1F4F8F`.
- **Ditolak / Rusak (Bahaya):** Latar `#FADCDC`, teks `#9C2222`.
- **Dalam Perawatan (Netral):** Latar `#E6EAEE`, teks `#3F4C57`.

### 2.3 Tipografi & Logo
- **Font Family:** `Plus Jakarta Sans`, sans-serif (Weights: 400 Reguler, 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold).
- **Brand / Identitas Visual:** `▣ SewaAset` (Ikon kubus `▣` di dalam rounded box Amber `#F2A33A`).

## 3. Role dan aturan akses UI
### 3.1 Publik
- Dapat melihat Beranda, informasi layanan, dan halaman Masuk/Daftar.
- Katalog aset dan detail lengkap hanya dapat diakses penyewa yang verifikasinya telah disetujui Admin, mengikuti arahan dosen.
- Jika pengguna belum login atau belum terverifikasi mencoba membuka katalog, tampilkan arahan untuk masuk/daftar atau menyelesaikan verifikasi.

### 3.2 Penyewa
- Dapat mengelola profil dan dokumen verifikasi.
- Setelah verifikasi `APPROVED`, dapat melihat katalog, detail aset, tarif, dan kalender ketersediaan.
- Dapat mengajukan sewa, membayar pengajuan yang disetujui, melihat bukti pembayaran, dan mengakses PKS setelah pembayaran terkonfirmasi.
- Hanya dapat melihat transaksi dan dokumen miliknya sendiri.

### 3.3 Petugas
- Dapat melihat dashboard, tugas yang ditugaskan, detail transaksi terkait, jadwal serah terima, dan pengembalian.
- Dapat mencatat kondisi awal dan akhir aset, waktu, catatan, serta bukti pendukung.
- Tidak memiliki kewenangan menyetujui pengajuan atau mengelola tarif/aset kecuali ada keputusan kelompok/dosen yang secara eksplisit mengubah kewenangan.

### 3.4 Admin
- Dapat mengelola pengguna, verifikasi, kategori, aset, foto, tarif, status operasional, pengajuan, pembayaran, PKS, penugasan Petugas, laporan, dan konfigurasi operasional.
- Keputusan verifikasi dan pengajuan harus menyimpan waktu, pelaku, dan alasan jika ditolak.

> Menyembunyikan menu di UI bukan pengamanan. Semua akses harus diperiksa kembali oleh backend dan database/RLS.

## 4. Daftar halaman dan tujuan

| No. | Area | Halaman | Tujuan dan elemen utama |
|---:|---|---|---|
| 1 | Publik | Beranda | Pengenalan layanan, cara kerja, informasi pengelola, tombol masuk/daftar |
| 2 | Publik | Masuk & Daftar | Autentikasi pengguna |
| 3 | Penyewa | Dashboard Penyewa | Ringkasan status verifikasi, pengajuan, pembayaran, penyewaan aktif, dan notifikasi |
| 4 | Penyewa | Verifikasi Identitas | Form profil dan unggah KTP/NPWP/NIB sesuai kebutuhan; status dan alasan penolakan |
| 5 | Penyewa | Katalog Aset | Daftar aset setelah verifikasi disetujui; pencarian dan filter |
| 6 | Penyewa | Detail Aset | Foto, jenis, luas, lokasi, fasilitas, deskripsi, tarif, status, dan kalender |
| 7 | Penyewa | Form Pengajuan Sewa | Pilih tanggal mulai/selesai, tujuan, ringkasan tarif dan estimasi biaya |
| 8 | Penyewa | Detail Pengajuan/Transaksi | Status pengajuan, keputusan Admin, tenggat pembayaran, dan riwayat status |
| 9 | Penyewa | Pembayaran | Informasi tagihan dan proses pembayaran Midtrans Sandbox |
| 10 | Penyewa | Bukti Pembayaran | Rincian transaksi dan akses cetak/unduh |
| 11 | Penyewa | Dokumen PKS | Preview, unduh PDF, dan cetak ulang setelah pembayaran terkonfirmasi |
| 12 | Penyewa | Riwayat Penyewaan | Aset yang pernah/sedang disewa, periode, tanggal selesai, dan status |
| 13 | Petugas | Dashboard Petugas | Ringkasan tugas serah terima/pengembalian |
| 14 | Petugas | Daftar Tugas | Transaksi yang ditugaskan kepada Petugas |
| 15 | Petugas | Serah Terima | Waktu, kondisi awal, pihak terkait, catatan, dan foto bila diperlukan |
| 16 | Petugas | Pengembalian | Waktu kembali, kondisi akhir, kerusakan, catatan, dan bukti |
| 17 | Admin | Dashboard Admin | Ringkasan aset, pengajuan, transaksi, verifikasi, dan pembayaran |
| 18 | Admin | Verifikasi Pengguna | Daftar dokumen, detail pemeriksaan, setujui/tolak, alasan |
| 19 | Admin | Pengguna & Role | Pengelolaan akun dan role |
| 20 | Admin | Kategori Aset | Tambah, ubah, dan nonaktifkan kategori |
| 21 | Admin | Kelola Data Aset | CRUD aset: nama, kategori, luas, lokasi, fasilitas, deskripsi, foto |
| 22 | Admin | Kelola Tarif | Tarif harian, bulanan, tahunan, dan masa berlaku |
| 23 | Admin | Kalender Penyewaan | Kalender okupansi dan periode yang terblokir termasuk buffer |
| 24 | Admin | Persetujuan Pengajuan | Detail pengajuan, cek ketersediaan ulang, setujui/tolak, alasan |
| 25 | Admin | Pembayaran & PKS | Status Midtrans, bukti pembayaran, dan dokumen kontrak |
| 26 | Admin | Penugasan Petugas | Menugaskan Petugas pada transaksi |
| 27 | Admin | Laporan | Rekap aset, transaksi, pendapatan/pembayaran, dan kondisi aset |
| 28 | Admin | Pengaturan | Buffer persiapan dan tenggat pembayaran sesuai keputusan kelompok |

## 5. Komponen reusable
- Public layout, authenticated layout, navbar, sidebar, footer.
- Button, input, textarea, select, date picker, upload field.
- Modal/dialog konfirmasi.
- Table, pagination, search bar, filter.
- Card, status badge, alert, toast.
- Asset card, asset photo gallery.
- Calendar availability.
- Form section dan form validation summary.
- Payment summary dan receipt view.
- Contract preview/download action.
- Notification list.

## 6. Aturan tampilan kalender dan ketersediaan
- Penyewaan dihitung berdasarkan **hari kalender**, bukan jumlah jam penggunaan.
- Tanggal mulai dan selesai bersifat inklusif.
- Jika aset dipesan pada suatu tanggal, penyewa lain tidak dapat memesan aset yang sama pada tanggal itu.
- Tampilkan tanggal terblokir dan tanggal yang tidak dapat dipilih.
- Buffer persiapan sebelum/sesudah sewa harus diperhitungkan pada kalender.
- Jangan menampilkan slot jam sebagai dasar ketersediaan. Jam penggunaan, jika diperlukan, hanya menjadi informasi tambahan.
- Ketersediaan yang tampil di UI merupakan hasil pemeriksaan backend; backend tetap memeriksa ulang saat pengajuan dan persetujuan.

## 7. Aturan status yang ditampilkan
### Verifikasi pengguna
`PENDING`, `APPROVED`, `REJECTED`, `RESUBMISSION_REQUIRED`.

### Pengajuan/transaksi
`PENDING_APPROVAL`, `REJECTED`, `APPROVED_PENDING_PAYMENT`, `PAYMENT_EXPIRED`, `PAID`, `RENTED`, `RETURNED`, `CANCELLED`.

### Status operasional aset
`READY`, `BOOKED`, `RENTED`, `MAINTENANCE`, `UNAVAILABLE`.

### Kondisi fisik aset
`GOOD`, `NEEDS_INSPECTION`, `DAMAGED`.

Label UI menggunakan bahasa Indonesia, sedangkan nilai enum internal boleh menggunakan kode di atas.

## 8. Panduan formulir
- Tampilkan field wajib dengan jelas.
- Validasi format dan ukuran file dokumen.
- Beri preview nama file dan status unggah.
- Tampilkan ringkasan tanggal, tarif, dan estimasi total sebelum pengajuan.
- Harga final harus berasal dari backend; nilai yang ditampilkan browser hanya ringkasan.
- Tampilkan alasan penolakan verifikasi/pengajuan.
- Minta konfirmasi sebelum tindakan penting seperti menyetujui, menolak, membatalkan, atau mencatat pengembalian.

## 9. Responsivitas dan aksesibilitas
- Navigasi desktop dapat menggunakan sidebar; pada mobile gunakan drawer/menu ringkas.
- Tabel besar harus memiliki strategi tampilan mobile (scroll horizontal atau kartu).
- Form dapat digunakan pada layar kecil.
- Fokus keyboard terlihat, label input jelas, dan kontras teks memadai.
- Status tidak boleh hanya dibedakan dengan warna.

## 10. Catatan implementasi
- Gunakan route protection dan authorization di backend, bukan UI saja.
- Dokumen KTP/NPWP/NIB dan PKS privat tidak boleh menggunakan URL publik permanen.
- Tombol pembayaran hanya muncul pada transaksi yang memenuhi status.
- PKS hanya dapat diakses setelah pembayaran terkonfirmasi oleh webhook Midtrans.
- Data laporan dan dashboard harus bersumber dari database.
- Pertahankan halaman Figma yang sudah tersedia; petakan ke daftar halaman di atas dan tandai gap sebelum mengubah desain.

## 11. Hal yang masih perlu diputuskan
1. Apakah katalog sepenuhnya tertutup bagi publik atau boleh menampilkan ringkasan tanpa detail? Arahan dosen menyebut katalog dapat dilihat setelah verifikasi Admin; ikuti aturan tertutup sampai ada klarifikasi.
2. Apakah satu pengajuan dapat memuat lebih dari satu aset? Jangan mengasumsikan dari UI; selaraskan dengan skema dan keputusan BE/PM.
3. Apakah jam penggunaan perlu dicatat sebagai informasi tambahan?
4. Berapa lama tenggat pembayaran dan berapa lama buffer persiapan? Jadikan konfigurasi, jangan hardcode.
5. Format final dan isi hukum PKS harus dikonfirmasi kepada entitas pengelola/dosen.

**Status:** Acuan UI/UX revisi. Perubahan implementasi harus konsisten dengan PRD dan skema database aktual.
