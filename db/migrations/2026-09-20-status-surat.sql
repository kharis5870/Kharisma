-- =====================================================================
-- Migrasi: Status surat (aktif/batal) dan kunci surat per bulan
-- Tanggal : 2026-09-20
-- Database: kharisma_db
-- Jalankan SETELAH 2026-09-19-volume-pembebanan.sql
--
-- MASALAH YANG DITUTUP
-- Nomor SPK disimpan dengan kunci unik (ppl_master_id, periode_mulai,
-- periode_selesai) — rentang PERSIS yang dipilih di layar. Setiap kali rentang
-- di Generate Surat diganti, aplikasi menganggapnya surat baru dan memesan
-- nomor baru. Data nyata membuktikannya: PPL117 memegang TIGA nomor (001 untuk
-- 1-30 Sep, 005 untuk 1 Sep-16 Okt, 007 untuk 1 Agt-31 Okt) atas pekerjaan
-- yang sama, dan nomor 005 "hilang" dari tampilan September.
--
-- Sejak migrasi ini surat diikat per mitra per BULAN — sesuai praktik tim
-- keuangan (satu SPK per mitra per bulan) — dan aplikasi selalu memakai batas
-- bulan kalender sebagai periode.
--
-- STATUS SURAT
-- Surat tidak lagi dihapus diam-diam. Surat yang tidak dipakai ditandai
-- 'batal' beserta catatannya, tetap tampil di Riwayat Surat, dan baru hilang
-- bila tim keuangan menghapusnya dengan sengaja (penghapusan itu sendiri
-- dicatat di `riwayat_surat`).
--
-- KUNCI UNIK HANYA UNTUK SURAT AKTIF
-- Satu mitra hanya boleh punya SATU surat aktif per periode, tetapi boleh punya
-- banyak surat batal. MySQL/MariaDB tidak punya indeks unik bersyarat, jadi
-- dipakai kolom turunan `kunci_aktif` yang bernilai NULL untuk surat batal —
-- NULL tidak pernah bentrok di indeks unik.
--
-- FOREIGN KEY
-- `fk_kontrak_ppl` membutuhkan indeks yang diawali ppl_master_id. Indeks
-- `unique_kontrak` lama memenuhinya, jadi indeks pengganti ditambahkan LEBIH
-- DULU sebelum `unique_kontrak` dilepas.
-- =====================================================================

ALTER TABLE `kontrak_mitra`
  ADD COLUMN `status` ENUM('aktif','batal') NOT NULL DEFAULT 'aktif' AFTER `nomor_bast`,
  ADD COLUMN `catatan` TEXT NULL AFTER `status`,
  ADD COLUMN `dibatalkanPada` DATETIME NULL AFTER `catatan`,
  ADD COLUMN `dibatalkanOleh` VARCHAR(50) NULL AFTER `dibatalkanPada`,
  -- Salinan isi surat SAAT TERBIT (JSON berisi baris lampiran), supaya layar
  -- bisa menunjukkan apa yang berubah sejak surat ditandatangani: honor,
  -- muatan, atau kegiatan baru. `total_volume` dan `jumlah_baris` disimpan
  -- terpisah agar notifikasi tim keuangan bisa dihitung dengan SQL biasa.
  -- Surat yang terbit sebelum migrasi ini hanya punya `total_honor`.
  ADD COLUMN `isi_terbit` LONGTEXT NULL AFTER `total_honor`,
  ADD COLUMN `total_volume` INT(11) NULL AFTER `isi_terbit`,
  ADD COLUMN `jumlah_baris` INT(11) NULL AFTER `total_volume`,
  ADD COLUMN `diperbaruiPada` DATETIME NULL AFTER `jumlah_baris`,
  ADD COLUMN `diperbaruiOleh` VARCHAR(50) NULL AFTER `diperbaruiPada`,
  ADD KEY `idx_kontrak_ppl` (`ppl_master_id`);

ALTER TABLE `kontrak_mitra`
  ADD COLUMN `kunci_aktif` VARCHAR(120) AS (
      IF(`status` = 'aktif',
         CONCAT(`ppl_master_id`, '|', CAST(`periode_mulai` AS CHAR), '|', CAST(`periode_selesai` AS CHAR)),
         NULL)
  ) STORED,
  DROP INDEX `unique_kontrak`,
  ADD UNIQUE KEY `uq_kontrak_aktif` (`kunci_aktif`);

-- ---------------------------------------------------------------------
-- Surat yang terbit dari periode BUKAN bulan kalender (akibat bug di atas)
-- ditandai batal. Surat berperiode bulan penuh tetap aktif.
-- ---------------------------------------------------------------------
START TRANSACTION;

INSERT INTO riwayat_surat (aksi, periode_mulai, periode_selesai, jumlah, jumlah_bast, nomor_surat, nomor_bast, aktorNama)
SELECT 'batal_migrasi_periode', MIN(periode_mulai), MAX(periode_selesai), COUNT(*),
       SUM(nomor_bast IS NOT NULL), GROUP_CONCAT(nomor_surat ORDER BY nomor_urut SEPARATOR ', '),
       GROUP_CONCAT(nomor_bast ORDER BY nomor_urut SEPARATOR ', '), 'sistem'
  FROM kontrak_mitra
 WHERE NOT (periode_mulai = DATE_FORMAT(periode_mulai, '%Y-%m-01') AND periode_selesai = LAST_DAY(periode_mulai))
HAVING COUNT(*) > 0;

UPDATE kontrak_mitra
   SET status = 'batal',
       dibatalkanPada = NOW(),
       dibatalkanOleh = 'sistem',
       catatan = CONCAT('Dibatalkan otomatis: terbit untuk periode ', DATE_FORMAT(periode_mulai, '%d-%m-%Y'),
                        ' s.d. ', DATE_FORMAT(periode_selesai, '%d-%m-%Y'),
                        ' yang bukan satu bulan penuh, sebelum surat diikat per bulan. Mitra ini sudah punya surat lain untuk pekerjaan yang sama.')
 WHERE NOT (periode_mulai = DATE_FORMAT(periode_mulai, '%Y-%m-01') AND periode_selesai = LAST_DAY(periode_mulai));

COMMIT;

-- Verifikasi:
--   SELECT nomor_urut, ppl_master_id, periode_mulai, periode_selesai, status FROM kontrak_mitra ORDER BY nomor_urut;
--   -- hanya surat berperiode bulan penuh yang 'aktif'
--   SELECT kunci_aktif, COUNT(*) FROM kontrak_mitra WHERE kunci_aktif IS NOT NULL GROUP BY kunci_aktif HAVING COUNT(*) > 1;
--   -- harus KOSONG
