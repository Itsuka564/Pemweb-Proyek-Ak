# Timeline Pengerjaan

> Total durasi proyek 3 minggu. Sekitar 1 minggu telah berlalu dan tersisa kurang lebih 2 minggu. Tabel ini adalah rencana percepatan 14 hari ke depan, bukan catatan pekerjaan yang sudah selesai.

| Periode | Frontend (FE) | Backend (BE) | Project Manager (PM) |
|---|---|---|---|
| Hari 1–2 | Setup Next.js, struktur halaman, komponen dasar | Setup Supabase/PostgreSQL, skema awal, struktur API | Finalisasi kebutuhan, prioritas, issue, koordinasi |
| Hari 3–5 | Login, katalog, detail aset, kerangka dashboard | Auth/role, API katalog dan CRUD aset | Review progres dan uji awal |
| Hari 6–8 | Form pengajuan dan tampilan status | API pengajuan dan validasi aturan bisnis | Validasi alur dan kriteria penerimaan |
| Hari 9–10 | UI persetujuan, serah terima, pengembalian | API persetujuan dan pengembalian | Uji alur transaksi, catat bug |
| Hari 11–12 | Integrasi, responsivitas, perbaikan UI | Integrasi, keamanan dasar, perbaikan API | Pengujian end-to-end dan dokumentasi |
| Hari 13–14 | Finalisasi dan bug fixing | Finalisasi dan dukungan deployment | Uji akhir, laporan, persiapan demo |

## Prioritas fitur
**Prioritas utama:** login dan role, katalog/detail aset, pengajuan, persetujuan, pengelolaan aset, serah terima/pengembalian.

**Jika waktu memungkinkan:** laporan lanjutan, ekspor laporan, notifikasi tambahan.

## Ritme koordinasi
- Check-in harian: selesai, sedang dikerjakan, kendala, target berikutnya.
- Review hasil setiap 2–3 hari.
- Integrasi dilakukan bertahap.
- Catat pekerjaan sebagai issue/project item.

## Risiko dan mitigasi
| Risiko | Mitigasi |
|---|---|
| Waktu terbatas | Fokus pada alur inti |
| FE menunggu API | BE membagikan kontrak API lebih awal; FE memakai mock data |
| Integrasi terlambat | Integrasi bertahap per fitur |
| Bug di akhir | Uji sejak awal dan lakukan regression test |

PM perlu memperbarui status aktual setiap hari. Jangan menyebut rencana sebagai pekerjaan yang sudah selesai.
