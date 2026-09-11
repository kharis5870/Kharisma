-- =====================================================================
-- Migrasi: 6 Fitur Baru Sistem Kharisma
-- Tanggal : 2026-09-08
-- Database: kharisma_db
--
-- CARA PAKAI (phpMyAdmin):
--   1. BACKUP dulu database kharisma_db (Export -> Go).
--   2. Pilih database kharisma_db.
--   3. Tab "SQL" -> tempel seluruh isi berkas ini -> Go.
--
-- Migrasi ini aman dijalankan sekali. Menjalankan dua kali akan error
-- pada ALTER TABLE (kolom sudah ada) - itu wajar, abaikan.
-- =====================================================================

START TRANSACTION;

-- ---------------------------------------------------------------------
-- FITUR 1: Rentang tanggal honor per tahap
--
-- Kolom `bulanHonor*` yang lama TIDAK dihapus. Kolom itu tetap dipakai
-- sebagai "bulan pembebanan honor" untuk validasi HONOR_LIMIT (batas
-- honor tetap dihitung per PPL per bulan). Kolom tanggal di bawah ini
-- dipakai untuk filter rekap berbasis rentang dan untuk kolom
-- "Jangka Waktu" di Surat Perjanjian Kerja.
-- ---------------------------------------------------------------------
ALTER TABLE `kegiatan`
  ADD COLUMN `tanggalMulaiHonorListing`      DATE NULL AFTER `bulanHonorListing`,
  ADD COLUMN `tanggalSelesaiHonorListing`    DATE NULL AFTER `tanggalMulaiHonorListing`,
  ADD COLUMN `tanggalMulaiHonorPencacahan`   DATE NULL AFTER `bulanHonorPencacahan`,
  ADD COLUMN `tanggalSelesaiHonorPencacahan` DATE NULL AFTER `tanggalMulaiHonorPencacahan`,
  ADD COLUMN `tanggalMulaiHonorPengolahan`   DATE NULL AFTER `bulanHonorPengolahan`,
  ADD COLUMN `tanggalSelesaiHonorPengolahan` DATE NULL AFTER `tanggalMulaiHonorPengolahan`;

-- Backfill data lama: rentang = tanggal 1 s.d. akhir bulan pembebanan.
UPDATE `kegiatan`
   SET `tanggalMulaiHonorListing`   = STR_TO_DATE(CONCAT('01-', `bulanHonorListing`), '%d-%m-%Y'),
       `tanggalSelesaiHonorListing` = LAST_DAY(STR_TO_DATE(CONCAT('01-', `bulanHonorListing`), '%d-%m-%Y'))
 WHERE `bulanHonorListing` IS NOT NULL AND `bulanHonorListing` <> '';

UPDATE `kegiatan`
   SET `tanggalMulaiHonorPencacahan`   = STR_TO_DATE(CONCAT('01-', `bulanHonorPencacahan`), '%d-%m-%Y'),
       `tanggalSelesaiHonorPencacahan` = LAST_DAY(STR_TO_DATE(CONCAT('01-', `bulanHonorPencacahan`), '%d-%m-%Y'))
 WHERE `bulanHonorPencacahan` IS NOT NULL AND `bulanHonorPencacahan` <> '';

UPDATE `kegiatan`
   SET `tanggalMulaiHonorPengolahan`   = STR_TO_DATE(CONCAT('01-', `bulanHonorPengolahan`), '%d-%m-%Y'),
       `tanggalSelesaiHonorPengolahan` = LAST_DAY(STR_TO_DATE(CONCAT('01-', `bulanHonorPengolahan`), '%d-%m-%Y'))
 WHERE `bulanHonorPengolahan` IS NOT NULL AND `bulanHonorPengolahan` <> '';

-- Index untuk mempercepat filter overlap rentang di rekap honor.
ALTER TABLE `kegiatan`
  ADD KEY `idx_honor_listing`    (`tanggalMulaiHonorListing`, `tanggalSelesaiHonorListing`),
  ADD KEY `idx_honor_pencacahan` (`tanggalMulaiHonorPencacahan`, `tanggalSelesaiHonorPencacahan`),
  ADD KEY `idx_honor_pengolahan` (`tanggalMulaiHonorPengolahan`, `tanggalSelesaiHonorPengolahan`);


-- ---------------------------------------------------------------------
-- FITUR 6: Arsip kegiatan
-- ---------------------------------------------------------------------
ALTER TABLE `kegiatan`
  ADD COLUMN `isArsip` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `arsipAt` DATETIME NULL,
  ADD COLUMN `arsipBy` VARCHAR(50) NULL,
  ADD KEY `idx_is_arsip` (`isArsip`);


-- ---------------------------------------------------------------------
-- FITUR 5: Tim pada master Ketua Tim
--
-- Sengaja VARCHAR, bukan ENUM, supaya daftar tim bisa ditambah lewat
-- Manajemen Admin tanpa perlu migrasi database lagi.
-- ---------------------------------------------------------------------
ALTER TABLE `ketua_tim`
  ADD COLUMN `tim` VARCHAR(100) NULL AFTER `nip`;


-- ---------------------------------------------------------------------
-- FITUR 3: Uraian tugas + kode beban anggaran (MAK) per kegiatan x tahap
--
-- Diisi lewat menu Generate Kontrak, bukan Input Kegiatan.
-- Nilai NULL berarti "pakai default" (namaKegiatan + tahap).
-- ---------------------------------------------------------------------
ALTER TABLE `honorarium_kegiatan`
  ADD COLUMN `uraian_tugas`  VARCHAR(255) NULL,
  ADD COLUMN `kode_anggaran` VARCHAR(100) NULL;


-- ---------------------------------------------------------------------
-- FITUR 3: Template Surat Perjanjian Kerja
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `template_surat` (
  `id`                INT(11)      NOT NULL AUTO_INCREMENT,
  `nama_template`     VARCHAR(255) NOT NULL,
  `format_nomor`      VARCHAR(255) NOT NULL DEFAULT '{nomor}/SPK/{BULAN}/{ROMAWI}/{tahun}',
  `ppk_nama`          VARCHAR(255) NOT NULL,
  `ppk_nip`           VARCHAR(50)  NOT NULL,
  `ppk_jabatan`       VARCHAR(255) NOT NULL,
  `satker_nama`       VARCHAR(255) NOT NULL,
  `satker_alamat`     TEXT         NULL,
  `kota`              VARCHAR(100) NULL,
  `pengadilan_negeri` VARCHAR(255) NULL,
  `isi_pasal`         LONGTEXT     NULL COMMENT 'JSON array pasal berisi placeholder',
  `is_aktif`          TINYINT(1)   NOT NULL DEFAULT 1,
  `updatedAt`         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedBy`         VARCHAR(50)  NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Template awal, sesuai contoh Surat PK BPS Kabupaten Bengkulu Selatan.
INSERT INTO `template_surat`
  (`nama_template`, `format_nomor`, `ppk_nama`, `ppk_nip`, `ppk_jabatan`,
   `satker_nama`, `satker_alamat`, `kota`, `pengadilan_negeri`, `is_aktif`)
SELECT
  'Perjanjian Kerja Petugas Kegiatan Survei',
  '{nomor}/SPK/{BULAN}/{ROMAWI}/{tahun}',
  'Defri Ariyanto, SST.,M.M',
  '198701272009121002',
  'Pejabat Pembuat Komitmen',
  'Badan Pusat Statistik Kabupaten Bengkulu Selatan',
  'Jl. Affan Bachsin No. 108A RT. 07 Kelurahan Pasar Baru Kecamatan Kota Manna',
  'Manna',
  'Panitera Pengadilan Negeri Manna, Kabupaten Bengkulu Selatan',
  1
WHERE NOT EXISTS (SELECT 1 FROM `template_surat`);


-- ---------------------------------------------------------------------
-- FITUR 3: Riwayat kontrak yang sudah di-generate
--
-- UNIQUE KEY membuat nomor urut STABIL: sekali seorang mitra mendapat
-- nomor untuk suatu periode, generate ulang memakai nomor yang sama.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kontrak_mitra` (
  `id`              INT(11)      NOT NULL AUTO_INCREMENT,
  `ppl_master_id`   VARCHAR(50)  NOT NULL,
  `periode_mulai`   DATE         NOT NULL,
  `periode_selesai` DATE         NOT NULL,
  `nomor_urut`      INT(11)      NOT NULL,
  `nomor_surat`     VARCHAR(255) NOT NULL,
  `tanggal_surat`   DATE         NOT NULL,
  `total_honor`     BIGINT       NOT NULL DEFAULT 0,
  `template_id`     INT(11)      NULL,
  `generatedAt`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `generatedBy`     VARCHAR(50)  NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_kontrak` (`ppl_master_id`, `periode_mulai`, `periode_selesai`),
  KEY `idx_periode` (`periode_mulai`, `periode_selesai`),
  CONSTRAINT `fk_kontrak_ppl`      FOREIGN KEY (`ppl_master_id`) REFERENCES `ppl_master` (`id`)     ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_kontrak_template` FOREIGN KEY (`template_id`)   REFERENCES `template_surat` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ---------------------------------------------------------------------
-- PERBAIKAN DATA: hargaSatuan yang rusak
--
-- Halaman Edit Kegiatan mengirim harga satuan sebagai string ter-format
-- dengan titik ribuan ("1.2002"), lalu parseInt() di server memotongnya
-- jadi 1. Akibatnya ppl_honorarium.hargaSatuan berisi 1 atau 2, padahal
-- seharusnya 12002 dan 24000. Kolom ini jadi sumber kolom "Harga Satuan"
-- di Surat PK, jadi harus benar.
--
-- Nilai yang benar direkonstruksi dari besaranHonor / bebanKerja, yang
-- keduanya tersimpan utuh.
-- ---------------------------------------------------------------------
UPDATE `ppl_honorarium`
   SET `hargaSatuan` = ROUND(`besaranHonor` / `bebanKerja`)
 WHERE `bebanKerja`   > 0
   AND `besaranHonor` > 0
   AND `hargaSatuan`  > 0
   AND ABS(`hargaSatuan` * `bebanKerja` - `besaranHonor`) > 1;

-- Rapikan juga honorarium_kegiatan.harga_satuan yang masih menyimpan
-- string ber-titik, disamakan dengan hasil rekonstruksi di atas.
UPDATE `honorarium_kegiatan` hk
  JOIN (
        SELECT p.kegiatanId,
               CASE p.tahap WHEN 'pengolahan-analisis' THEN 'pengolahan' ELSE p.tahap END AS jenis,
               MAX(ph.hargaSatuan) AS harga
          FROM `ppl` p
          JOIN `ppl_honorarium` ph ON ph.ppl_id = p.id
         WHERE ph.hargaSatuan > 0
         GROUP BY p.kegiatanId, jenis
       ) src
    ON src.kegiatanId = hk.kegiatanId
   AND src.jenis      = hk.jenis_pekerjaan
   SET hk.`harga_satuan` = CAST(src.harga AS CHAR)
 WHERE hk.`harga_satuan` LIKE '%.%';

COMMIT;
