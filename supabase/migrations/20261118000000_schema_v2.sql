-- ============================================================
-- MIGRASI FINAL BERTAHAP - SISTEM INFORMASI PENYEWAAN ASET
-- Target: PostgreSQL / Supabase
--
-- Model transaksi: SATU TRANSAKSI DAPAT MEMUAT BEBERAPA ASET.
-- Basis: schema Supabase yang dikirim pengguna + rancangan-database.md.
--
-- PENTING:
-- 1. Backup database sebelum menjalankan.
-- 2. Jalankan di project Supabase yang benar.
-- 3. Jalankan di staging/test dahulu bila tersedia.
-- 4. Script ini mempertahankan tabel/kolom lama untuk kompatibilitas.
-- 5. Jangan menghapus assets.photo_urls, rental_transactions.asset_id,
--    daily_rate, atau kolom lama sebelum kode aplikasi selesai dimigrasikan.
-- 6. RLS/policy tidak diubah di sini karena policy aktif saat ini belum diaudit.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- A. ASET: informasi luas/lokasi dan pemisahan kondisi/status
-- ------------------------------------------------------------

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS area_size numeric,
  ADD COLUMN IF NOT EXISTS area_unit text NOT NULL DEFAULT 'm2',
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS physical_condition text,
  ADD COLUMN IF NOT EXISTS operational_status text;

-- Backfill dari enum lama tanpa mengubah enum/kolom lama.
UPDATE public.assets
SET
  physical_condition = COALESCE(
    physical_condition,
    CASE condition::text
      WHEN 'baik' THEN 'baik'
      WHEN 'rusak' THEN 'rusak'
      ELSE 'perlu_pemeriksaan'
    END
  ),
  operational_status = COALESCE(
    operational_status,
    CASE availability::text
      WHEN 'tersedia' THEN 'siap'
      WHEN 'perbaikan' THEN 'perbaikan'
      WHEN 'tidak_tersedia' THEN 'tidak_tersedia'
      ELSE 'tidak_tersedia'
    END
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.assets'::regclass
      AND conname = 'assets_physical_condition_check'
  ) THEN
    ALTER TABLE public.assets
      ADD CONSTRAINT assets_physical_condition_check
      CHECK (physical_condition IN ('baik', 'perlu_pemeriksaan', 'rusak'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.assets'::regclass
      AND conname = 'assets_operational_status_check'
  ) THEN
    ALTER TABLE public.assets
      ADD CONSTRAINT assets_operational_status_check
      CHECK (operational_status IN ('siap', 'perbaikan', 'tidak_tersedia'));
  END IF;
END $$;

-- ------------------------------------------------------------
-- B. FOTO ASET: tabel relasional, kolom photo_urls lama dipertahankan
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.asset_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  alt_text text,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT asset_photos_sort_order_check CHECK (sort_order >= 0),
  CONSTRAINT asset_photos_asset_storage_unique UNIQUE (asset_id, storage_path)
);

-- Salin URL/path foto lama ke tabel baru; aman dijalankan ulang.
INSERT INTO public.asset_photos (asset_id, storage_path, sort_order, is_primary)
SELECT
  a.id,
  p.photo_url,
  (p.ordinality - 1)::integer,
  (p.ordinality = 1)
FROM public.assets a
CROSS JOIN LATERAL unnest(COALESCE(a.photo_urls, ARRAY[]::text[]))
  WITH ORDINALITY AS p(photo_url, ordinality)
WHERE NULLIF(trim(p.photo_url), '') IS NOT NULL
ON CONFLICT (asset_id, storage_path) DO NOTHING;

-- ------------------------------------------------------------
-- C. TARIF: dukung tarif harian/bulanan/tahunan dan masa berlaku
-- ------------------------------------------------------------

ALTER TABLE public.asset_rates
  ADD COLUMN IF NOT EXISTS effective_from date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS effective_until date;

-- Validasi masa berlaku tarif.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.asset_rates'::regclass
      AND conname = 'asset_rates_effective_dates_check'
  ) THEN
    ALTER TABLE public.asset_rates
      ADD CONSTRAINT asset_rates_effective_dates_check
      CHECK (effective_until IS NULL OR effective_until >= effective_from);
  END IF;
END $$;

-- Lepas unique lama (asset_id, rate_period) bila memang ada,
-- agar histori tarif dapat disimpan. Nama constraint dicari dari katalog.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.asset_rates'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) ILIKE '%(asset_id, rate_period)%'
  LOOP
    EXECUTE format('ALTER TABLE public.asset_rates DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

-- Hanya satu tarif aktif per aset dan periode.
CREATE UNIQUE INDEX IF NOT EXISTS asset_rates_one_active_per_period
ON public.asset_rates (asset_id, rate_period)
WHERE is_active = true AND effective_until IS NULL;

-- Migrasikan daily_rate lama ke asset_rates sebagai tarif harian.
INSERT INTO public.asset_rates
  (asset_id, rate_period, amount, is_active, effective_from)
SELECT
  a.id, 'harian', a.daily_rate, true, CURRENT_DATE
FROM public.assets a
WHERE NOT EXISTS (
  SELECT 1
  FROM public.asset_rates ar
  WHERE ar.asset_id = a.id
    AND ar.rate_period = 'harian'
    AND ar.is_active = true
    AND ar.effective_until IS NULL
);

-- ------------------------------------------------------------
-- D. TRANSAKSI: satu transaksi dapat memiliki banyak item aset
-- ------------------------------------------------------------

ALTER TABLE public.rental_transactions
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'IDR',
  ADD COLUMN IF NOT EXISTS subtotal numeric,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

UPDATE public.rental_transactions
SET
  subtotal = COALESCE(subtotal, total_cost),
  submitted_at = COALESCE(submitted_at, created_at);

-- Tabel detail item aset dalam satu transaksi.
CREATE TABLE IF NOT EXISTS public.rental_transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL
    REFERENCES public.rental_transactions(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL
    REFERENCES public.assets(id) ON DELETE RESTRICT,
  rate_id uuid REFERENCES public.asset_rates(id) ON DELETE SET NULL,
  rate_period text NOT NULL DEFAULT 'harian'
    CHECK (rate_period IN ('harian', 'bulanan', 'tahunan')),
  rate_amount_snapshot numeric NOT NULL CHECK (rate_amount_snapshot >= 0),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  line_total numeric NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rental_transaction_items_one_asset_per_transaction
    UNIQUE (transaction_id, asset_id)
);

-- Backfill transaksi lama: satu transaksi lama menjadi satu item.
INSERT INTO public.rental_transaction_items
  (transaction_id, asset_id, rate_period, rate_amount_snapshot, quantity, line_total)
SELECT
  rt.id,
  rt.asset_id,
  COALESCE(rt.rate_period, 'harian'),
  COALESCE(rt.rate_amount, rt.daily_rate, 0),
  1,
  rt.total_cost
FROM public.rental_transactions rt
WHERE rt.asset_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.rental_transaction_items i
    WHERE i.transaction_id = rt.id
      AND i.asset_id = rt.asset_id
  );

-- asset_id dan daily_rate lama menjadi nullable agar transaksi baru
-- dapat memakai rental_transaction_items sebagai sumber aset/tarif.
-- Pertahankan kolom lama selama aplikasi lama masih membacanya.
ALTER TABLE public.rental_transactions
  ALTER COLUMN asset_id DROP NOT NULL,
  ALTER COLUMN daily_rate DROP NOT NULL;

-- ------------------------------------------------------------
-- E. RIWAYAT REVIEW / KEPUTUSAN ADMIN
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.rental_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL
    REFERENCES public.rental_transactions(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id),
  decision text NOT NULL CHECK (decision IN ('disetujui', 'ditolak')),
  notes text,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rental_reviews_transaction_idx
ON public.rental_reviews(transaction_id);

-- Salin keputusan terakhir yang tersimpan di kolom transaksi lama.
INSERT INTO public.rental_reviews
  (transaction_id, reviewer_id, decision, notes, reviewed_at)
SELECT
  rt.id,
  rt.processed_by,
  CASE
    WHEN rt.status::text = 'ditolak' THEN 'ditolak'
    ELSE 'disetujui'
  END,
  rt.decision_note,
  COALESCE(rt.processed_at, rt.updated_at)
FROM public.rental_transactions rt
WHERE rt.processed_by IS NOT NULL
  AND rt.status::text IN ('disetujui', 'ditolak')
  AND NOT EXISTS (
    SELECT 1 FROM public.rental_reviews rr
    WHERE rr.transaction_id = rt.id
  );

-- ------------------------------------------------------------
-- F. VERIFIKASI IDENTITAS: dukung permintaan kirim ulang
-- ------------------------------------------------------------

ALTER TABLE public.user_verifications
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

UPDATE public.user_verifications
SET submitted_at = COALESCE(submitted_at, created_at);

-- Kolom status dibuat text oleh migrasi awal. Ganti CHECK agar status
-- kirim ulang tersedia, sambil mempertahankan nilai lama.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.user_verifications'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.user_verifications DROP CONSTRAINT %I', c.conname);
  END LOOP;

  ALTER TABLE public.user_verifications
    ADD CONSTRAINT user_verifications_status_check
    CHECK (status IN ('menunggu', 'disetujui', 'ditolak', 'perlu_dikirim_ulang'));
END $$;

-- ------------------------------------------------------------
-- G. PENGATURAN: tenggat pembayaran
-- ------------------------------------------------------------

ALTER TABLE public.rental_settings
  ADD COLUMN IF NOT EXISTS payment_expiry_minutes integer NOT NULL DEFAULT 1440,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.rental_settings'::regclass
      AND conname = 'rental_settings_payment_expiry_check'
  ) THEN
    ALTER TABLE public.rental_settings
      ADD CONSTRAINT rental_settings_payment_expiry_check
      CHECK (payment_expiry_minutes > 0);
  END IF;
END $$;

-- ------------------------------------------------------------
-- H. SERAH TERIMA / PENGEMBALIAN: bukti dokumentasi opsional
-- ------------------------------------------------------------

ALTER TABLE public.handover_records
  ADD COLUMN IF NOT EXISTS evidence_path text;

ALTER TABLE public.return_records
  ADD COLUMN IF NOT EXISTS evidence_path text;

-- ------------------------------------------------------------
-- I. MIDTRANS: pastikan metadata transaksi gateway tersedia
-- ------------------------------------------------------------

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_provider text NOT NULL DEFAULT 'midtrans',
  ADD COLUMN IF NOT EXISTS midtrans_order_id text,
  ADD COLUMN IF NOT EXISTS midtrans_transaction_id text,
  ADD COLUMN IF NOT EXISTS midtrans_token text,
  ADD COLUMN IF NOT EXISTS payment_url text,
  ADD COLUMN IF NOT EXISTS payment_type text,
  ADD COLUMN IF NOT EXISTS gateway_transaction_status text,
  ADD COLUMN IF NOT EXISTS gateway_fraud_status text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS expired_at timestamptz,
  ADD COLUMN IF NOT EXISTS gateway_response jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS payments_midtrans_order_id_unique
ON public.payments(midtrans_order_id)
WHERE midtrans_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payments_midtrans_transaction_id_unique
ON public.payments(midtrans_transaction_id)
WHERE midtrans_transaction_id IS NOT NULL;

-- Tabel event webhook untuk idempotensi dan audit.
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  event_key text NOT NULL UNIQUE,
  order_id text,
  transaction_status text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- J. PEMBLOKIRAN JADWAL ASET (anti double-booking)
-- ------------------------------------------------------------
-- Backend harus membuat satu block per item aset dalam transaksi DB.
-- blocked_period memakai daterange [awal, akhir-eksklusif).
-- Untuk tanggal sewa inklusif, contoh rentang:
-- daterange(start_date - buffer_before,
--           end_date + buffer_after + 1, '[)')
--
-- Saat transaksi disetujui/hold pembayaran, buat block status 'active'.
-- Saat ditolak/dibatalkan/kedaluwarsa, ubah status menjadi 'released'
-- atau 'expired'. Proses ini wajib dilakukan dalam transaksi DB.
-- Nilai buffer diambil dari rental_settings.
--
-- Exclusion constraint mencegah dua block aktif bertabrakan untuk aset sama.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS public.asset_booking_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_item_id uuid NOT NULL UNIQUE
    REFERENCES public.rental_transaction_items(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE RESTRICT,
  blocked_period daterange NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'released', 'expired')),
  expires_at timestamptz,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT asset_booking_blocks_valid_period
    CHECK (NOT isempty(blocked_period))
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.asset_booking_blocks'::regclass
      AND conname = 'asset_booking_blocks_no_overlap'
  ) THEN
    ALTER TABLE public.asset_booking_blocks
      ADD CONSTRAINT asset_booking_blocks_no_overlap
      EXCLUDE USING gist (
        asset_id WITH =,
        blocked_period WITH &&
      )
      WHERE (status = 'active');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS asset_booking_blocks_asset_idx
ON public.asset_booking_blocks(asset_id);

CREATE INDEX IF NOT EXISTS asset_booking_blocks_expiry_idx
ON public.asset_booking_blocks(expires_at)
WHERE status = 'active' AND expires_at IS NOT NULL;

-- ------------------------------------------------------------
-- K. INDEX PENDUKUNG
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS rental_items_transaction_idx
ON public.rental_transaction_items(transaction_id);

CREATE INDEX IF NOT EXISTS rental_items_asset_idx
ON public.rental_transaction_items(asset_id);

CREATE INDEX IF NOT EXISTS asset_rates_asset_period_idx
ON public.asset_rates(asset_id, rate_period);

CREATE INDEX IF NOT EXISTS user_verifications_user_status_idx
ON public.user_verifications(user_id, status);

CREATE INDEX IF NOT EXISTS payments_rental_idx
ON public.payments(rental_id);

CREATE INDEX IF NOT EXISTS contracts_rental_idx
ON public.rental_contracts(rental_id);

COMMIT;

-- ============================================================
-- SELESAI
--
-- TINDAKAN SETELAH MIGRASI:
-- 1. Verifikasi semua tabel/kolom dan jumlah item hasil backfill.
-- 2. Isi tarif bulanan/tahunan melalui admin; jangan mengarang harga.
-- 3. Perbarui aplikasi agar membaca rental_transaction_items.
-- 4. Buat asset_booking_blocks secara atomik ketika menyetujui/menahan
--    penyewaan; lepaskan saat ditolak/dibatalkan/expired.
-- 5. Audit dan buat RLS policies untuk seluruh tabel baru.
-- 6. Uji transaksi multi-aset, pembayaran Midtrans, PKS, dan bentrok tanggal.
-- 7. Setelah aplikasi stabil, baru rencanakan penghapusan kolom legacy.
-- ============================================================
