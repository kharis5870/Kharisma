-- =====================================================================
-- Migrasi: Pembebanan honor per bulan + tahap Pengolahan/Diseminasi opsional
-- Tanggal : 2026-09-18
-- Database: kharisma_db
-- Jalankan SETELAH 2026-09-17-riwayat-aktor-userid.sql
--
-- =====================================================================
-- BAGIAN 1 - TAHAP PENGOLAHAN & DISEMINASI JADI OPSIONAL
-- =====================================================================
-- Di BPS Kabupaten Bengkulu Selatan, pengolahan dan diseminasi umumnya
-- ditangani provinsi atau pusat; kabupaten fokus pada pendataan. Sebagian
-- kegiatan tetap ditangani kabupaten, jadi ini pilihan per kegiatan, bukan
-- aturan tetap. Polanya mengikuti `adaListing` yang sudah ada.
--
-- DEFAULT 1, BUKAN 0. Kelima kegiatan yang sudah ada memang punya jadwal dan
-- dokumen untuk kedua tahap itu. Default 0 akan membuat semuanya seketika
-- kehilangan tahap tersebut begitu migrasi jalan.
--
-- JANGAN DIKELIRUKAN DENGAN ALOKASI MITRA "PENGOLAHAN".
-- Mitra pengolahan bekerja pada masa PENDATAAN — entri ke komputer dan
-- cleaning. Penyebutan "pengolahan" di situ warisan istilah, bukan penanda
-- bahwa ia bekerja pada tahap Pengolahan & Analisis. Karena itu mematikan
-- `adaPengolahan` TIDAK boleh menghapus alokasi PPL bertahap
-- 'pengolahan-analisis' maupun honornya.
--
-- =====================================================================
-- BAGIAN 2 - PEMBEBANAN HONOR KE BULAN
-- =====================================================================
-- Batas SBML berlaku per mitra per BULAN, sedangkan periode honor bisa
-- melintasi beberapa bulan. Selama ini honor sebuah alokasi dianggap utuh di
-- setiap bulan yang beririsan: honor 3 juta terbaca 3 juta di Februari DAN
-- 3 juta di Maret.
--
-- `metodePembebanan` menyimpan keputusan itu PER ALOKASI PPL, karena memang
-- per orang: mitra yang kuotanya longgar cukup dibebankan ke satu bulan,
-- yang hampir mentok perlu dipecah.
--
-- KENAPA HASILNYA DISIMPAN, BUKAN DIHITUNG ULANG SAAT DIBACA
-- Metode 'luber' bergantung pada honor mitra itu di kegiatan LAIN. Kalau
-- dihitung ulang setiap kali halaman honor dibuka, pembagian yang sudah
-- diputuskan bisa berubah sendiri hanya karena orang lain menambah kegiatan
-- baru — dan SPJ yang sudah dicetak jadi tidak cocok. Tabel `ppl_honor_bulan`
-- membekukan hasilnya saat kegiatan disimpan.
--
-- Konsekuensinya, dan ini disengaja: mengubah batas SBML tidak otomatis
-- membagi ulang kegiatan lama. Pembagiannya baru diperbarui saat kegiatan itu
-- disimpan ulang.
--
-- ON DELETE CASCADE mengikuti `ppl_honorarium` dan `ppl_progress`: baris ini
-- tidak punya arti tanpa alokasi PPL-nya.
-- =====================================================================

START TRANSACTION;

ALTER TABLE `kegiatan`
  ADD COLUMN `adaPengolahan` TINYINT(1) NOT NULL DEFAULT 1 AFTER `adaListing`,
  ADD COLUMN `adaDiseminasi` TINYINT(1) NOT NULL DEFAULT 1 AFTER `adaPengolahan`;

ALTER TABLE `ppl`
  ADD COLUMN `metodePembebanan` ENUM('bulan_tertentu','prorata','luber')
      NOT NULL DEFAULT 'bulan_tertentu' AFTER `besaranHonor`,
  ADD COLUMN `bulanPembebananDipilih` VARCHAR(7) NULL AFTER `metodePembebanan`;

CREATE TABLE IF NOT EXISTS `ppl_honor_bulan` (
  `id`      INT(11)     NOT NULL AUTO_INCREMENT,
  `ppl_id`  INT(11)     NOT NULL,
  -- Format 'MM-YYYY', sama dengan kolom `bulanHonor*` di tabel kegiatan.
  `bulan`   VARCHAR(7)  NOT NULL,
  `jumlah`  INT(11)     NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ppl_bulan` (`ppl_id`, `bulan`),
  KEY `idx_bulan` (`bulan`),
  CONSTRAINT `fk_honor_bulan_ppl` FOREIGN KEY (`ppl_id`)
    REFERENCES `ppl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;

-- ---------------------------------------------------------------------
-- BACKFILL: satu baris per alokasi, seluruh honor di bulan pembebanannya.
--
-- Itu memang keadaan sebenarnya sekarang — belum ada kegiatan yang honornya
-- dipecah. Bulannya diambil dari `bulanHonor*` sesuai tahap alokasinya, dengan
-- cadangan dari `tanggalMulaiHonor*` bila kolom bulannya kosong. Alokasi yang
-- tidak punya keduanya dilewati: menebak bulan untuk data yang tidak
-- menyebutkannya justru memasukkan honor ke bulan yang salah.
-- ---------------------------------------------------------------------

INSERT INTO `ppl_honor_bulan` (`ppl_id`, `bulan`, `jumlah`)
SELECT p.id,
       COALESCE(
         CASE p.tahap
           WHEN 'listing'             THEN k.bulanHonorListing
           WHEN 'pencacahan'          THEN k.bulanHonorPencacahan
           WHEN 'pengolahan-analisis' THEN k.bulanHonorPengolahan
         END,
         DATE_FORMAT(
           CASE p.tahap
             WHEN 'listing'             THEN k.tanggalMulaiHonorListing
             WHEN 'pencacahan'          THEN k.tanggalMulaiHonorPencacahan
             WHEN 'pengolahan-analisis' THEN k.tanggalMulaiHonorPengolahan
           END, '%m-%Y')
       ) AS bulan,
       COALESCE(p.besaranHonor, 0)
  FROM ppl p
  JOIN kegiatan k ON k.id = p.kegiatanId
 HAVING bulan IS NOT NULL
ON DUPLICATE KEY UPDATE `jumlah` = VALUES(`jumlah`);

-- Bulan yang dipilih disamakan dengan hasil backfill, supaya layar menampilkan
-- pilihan yang konsisten dengan angka yang sudah tersimpan.
UPDATE ppl p
  JOIN ppl_honor_bulan b ON b.ppl_id = p.id
   SET p.bulanPembebananDipilih = b.bulan
 WHERE p.bulanPembebananDipilih IS NULL;

-- Verifikasi:
--   SELECT COUNT(*) FROM ppl_honor_bulan;
--   -- harus sama dengan jumlah alokasi PPL yang punya bulan honor
--   SELECT p.id, p.besaranHonor, SUM(b.jumlah) AS terbebankan
--     FROM ppl p JOIN ppl_honor_bulan b ON b.ppl_id = p.id
--    GROUP BY p.id HAVING terbebankan <> p.besaranHonor;
--   -- harus KOSONG: tiap alokasi terbebankan persis sebesar honornya
--   SELECT adaPengolahan, adaDiseminasi, COUNT(*) FROM kegiatan
--    GROUP BY adaPengolahan, adaDiseminasi;
--   -- semuanya harus 1/1
