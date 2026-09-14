-- =====================================================================
-- Migrasi: Penanda mitra masih aktif
-- Tanggal : 2026-09-22
-- Database: kharisma_db
-- Jalankan SETELAH 2026-09-21-sobat-id-mitra.sql
--
-- KENAPA PERLU
-- Setiap tahun daftar mitra berubah: ada yang berhenti, ada yang baru, ada yang
-- bertahan. Godaan yang wajar saat mengimpor daftar baru adalah menghapus mitra
-- yang sudah tidak ada di berkas. Itu berbahaya, dan bahayanya senyap:
--
--   kontrak_mitra.ppl_master_id  ON DELETE CASCADE  -> surat PK/BAST IKUT HILANG
--   ppl.ppl_master_id            ON DELETE SET NULL -> alokasi kegiatan jadi yatim
--
-- Artinya satu impor yang "merapikan" data bisa menghanguskan surat perjanjian
-- yang sudah ditandatangani, tanpa satu pun pesan galat.
--
-- Karena itu mitra yang berhenti DINONAKTIFKAN, bukan dihapus. Seluruh honor,
-- kontrak, penilaian, dan riwayatnya tetap utuh — dan kalau tahun depan ia
-- kembali menjadi mitra, cukup diaktifkan lagi dan sejarahnya tersambung
-- kembali dengan sendirinya. Ini pola yang sama dengan surat yang dibatalkan:
-- yang sudah terjadi tidak dihapus, hanya ditandai tidak berlaku.
--
-- BAWAANNYA AKTIF
-- 128 mitra yang sudah ada dianggap aktif, sehingga tidak ada layar yang
-- berubah perilakunya sampai penonaktifan benar-benar dipakai.
-- =====================================================================

ALTER TABLE `ppl_master`
  ADD COLUMN `aktif` TINYINT(1) NOT NULL DEFAULT 1 AFTER `noTelepon`,
  ADD COLUMN `nonaktifSejak` DATE NULL AFTER `aktif`,
  ADD KEY `idx_ppl_master_aktif` (`aktif`);

-- Verifikasi:
--   SELECT aktif, COUNT(*) FROM ppl_master GROUP BY aktif;
--   -- seluruhnya aktif = 1
