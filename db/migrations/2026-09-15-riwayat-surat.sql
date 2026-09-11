-- =====================================================================
-- Migrasi: Riwayat nomor surat (audit pengaturan ulang)
-- Tanggal : 2026-09-15
-- Database: kharisma_db
-- Jalankan SETELAH 2026-09-14-penanggung-jawab-dokumen.sql
--
-- LATAR BELAKANG
-- Tombol "Atur Ulang Nomor" menghapus baris `kontrak_mitra` sebuah periode
-- secara permanen. Bersama baris itu ikut hilang `nomor_surat`, `nomor_bast`,
-- dan yang paling penting `generatedBy`/`generatedAt` — jadi setelah dihapus,
-- tidak ada apa pun di dalam database yang bisa menjawab "siapa menghapus nomor
-- 003, kapan, dan nomor berapa saja yang ikut hilang".
--
-- Sampai sekarang jejaknya hanya satu baris console.warn di log server. Di
-- hosting cPanel log itu jarang tersimpan lama dan tidak bisa dibuka pengguna,
-- padahal penomoran surat dinas justru hal yang diperiksa saat SPJ.
--
-- KENAPA TABEL SENDIRI, BUKAN `riwayat_kegiatan`
-- `riwayat_kegiatan.kegiatanId` NOT NULL dengan foreign key ke `kegiatan`,
-- sedangkan satu periode kontrak membentang lintas banyak kegiatan. Memilih
-- salah satu kegiatan sebagai "pemilik" akan memalsukan feed riwayat kegiatan
-- itu, dan menulis ke semuanya akan membanjirinya.
--
-- TIDAK ADA FOREIGN KEY di tabel ini, disengaja. Isinya justru catatan tentang
-- baris yang SUDAH DIHAPUS; menautkannya ke tabel mana pun berarti catatannya
-- ikut terhapus persis saat ia paling dibutuhkan.
-- =====================================================================

START TRANSACTION;

CREATE TABLE IF NOT EXISTS `riwayat_surat` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `aksi`            VARCHAR(50)  NOT NULL COMMENT 'mis. atur_ulang_nomor',
  `periode_mulai`   DATE         NOT NULL,
  `periode_selesai` DATE         NOT NULL,
  `jumlah`          INT(11)      NOT NULL DEFAULT 0 COMMENT 'banyaknya nomor terdampak',
  `jumlah_bast`     INT(11)      NOT NULL DEFAULT 0,
  -- Daftar nomor disimpan sebagai teks, bukan tabel anak: ia hanya perlu
  -- dibaca manusia saat ditanya, tidak pernah di-JOIN atau diagregasi.
  `nomor_surat`     TEXT         NULL COMMENT 'dipisah koma',
  `nomor_bast`      TEXT         NULL COMMENT 'dipisah koma',
  `aktorNama`       VARCHAR(50)  NULL COMMENT 'USERNAME, konsisten dengan kolom pelaku lain',
  `terjadiPada`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_riwayat_surat_waktu` (`terjadiPada`),
  KEY `idx_riwayat_surat_periode` (`periode_mulai`, `periode_selesai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;

-- Verifikasi:
--   SELECT COUNT(*) FROM riwayat_surat;   -- 0; belum ada yang dicatat
