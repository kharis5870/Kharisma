-- =====================================================================
-- Migrasi: Jaring pengaman relasi penilaian mitra
-- Tanggal : 2026-09-10
-- Database: kharisma_db
-- Jalankan SETELAH 2026-09-09-notifikasi-personal.sql
--
-- LATAR BELAKANG
-- `updateKegiatan` dulu menjalankan `DELETE FROM ppl WHERE kegiatanId = ?`
-- lalu membuat ulang barisnya. Karena `penilaian_mitra.pplId` memakai
-- ON DELETE CASCADE, setiap penyuntingan kegiatan menghapus permanen
-- SELURUH penilaian mitra kegiatan tersebut. Terbukti di data: dari 16
-- penilaian yang pernah dibuat, hanya 4 yang tersisa (id 9-12), dan
-- satu-satunya kegiatan yang penilaiannya utuh adalah kegiatan 66 —
-- satu-satunya yang belum pernah disunting ulang.
--
-- Penyebab utamanya sudah diperbaiki di kode (alokasi PPL kini dicocokkan,
-- bukan dihapus-lalu-dibuat-ulang, sehingga ppl.id dipertahankan).
-- Migrasi ini adalah lapis kedua: kalaupun suatu saat ada baris ppl
-- terhapus tanpa sengaja, penilaiannya TIDAK ikut hangus.
--
-- CATATAN: penilaian yang sudah hilang tidak bisa dipulihkan.
-- =====================================================================

START TRANSACTION;

-- ---------------------------------------------------------------------
-- 1. pplId harus boleh NULL agar SET NULL bisa dipakai
-- ---------------------------------------------------------------------
ALTER TABLE `penilaian_mitra`
  MODIFY COLUMN `pplId` INT(11) NULL;

-- ---------------------------------------------------------------------
-- 2. Ganti CASCADE menjadi SET NULL
--
--    Penilaian tetap tersimpan (nilai, tanggal, penilainya) meski baris
--    alokasi PPL-nya hilang. `kegiatanId` dan `pplMasterId` tetap ada,
--    jadi penilaiannya masih bisa ditelusuri ke mitra dan kegiatannya.
-- ---------------------------------------------------------------------
ALTER TABLE `penilaian_mitra`
  DROP FOREIGN KEY `fk_penilaian_ppl`;

ALTER TABLE `penilaian_mitra`
  ADD CONSTRAINT `fk_penilaian_ppl` FOREIGN KEY (`pplId`)
      REFERENCES `ppl` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;

-- ---------------------------------------------------------------------
-- Verifikasi
-- ---------------------------------------------------------------------
-- SELECT CONSTRAINT_NAME, DELETE_RULE FROM information_schema.REFERENTIAL_CONSTRAINTS
--  WHERE CONSTRAINT_SCHEMA = 'kharisma_db' AND TABLE_NAME = 'penilaian_mitra';
--   -> fk_penilaian_ppl harus SET NULL, fk_penilaian_kegiatan tetap CASCADE
--      (menghapus kegiatan memang seharusnya menghapus penilaiannya).
