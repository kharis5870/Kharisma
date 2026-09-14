-- =====================================================================
-- Migrasi: Penanda identitas mitra dari aplikasi SOBAT
-- Tanggal : 2026-09-21
-- Database: kharisma_db
-- Jalankan SETELAH 2026-09-20-status-surat.sql
--
-- KENAPA PERLU KOLOM BARU, PADAHAL SUDAH ADA `id`
-- `ppl_master.id` (PPL117) adalah nomor kursi, bukan orang. Lihat
-- client/lib/idOtomatis.ts: ID bekas baris terhapus SENGAJA dipakai ulang,
-- jadi PPL009 hari ini dan PPL009 tahun depan bisa dua orang berbeda. Selain
-- itu berkas Excel dari SOBAT tidak memuat ID kita — ID itu kita sendiri yang
-- terbitkan — sehingga pada impor pertama tidak ada yang bisa dicocokkan.
--
-- `sobat_id` menjawab pertanyaan yang berbeda dari `id`:
--   `id`        dipakai DI DALAM aplikasi, tertulis di semua relasi, tetap.
--   `sobat_id`  dipakai untuk MENGENALI orang saat membaca Excel SOBAT.
-- Dipisah begini, penomoran SOBAT boleh berubah atau kosong tanpa menyentuh
-- satu pun foreign key.
--
-- NULLABLE, DAN ITU DISENGAJA
-- 128 mitra yang sudah ada belum punya nilainya. Mereka akan terisi sekali
-- saja, saat impor pertama mencocokkan nama lalu pengguna mengonfirmasi;
-- sesudah itu pencocokan tahun-tahun berikutnya berjalan otomatis.
--
-- UNIK, TAPI HANYA UNTUK YANG TERISI
-- Indeks unik di MySQL mengabaikan NULL, sehingga banyak baris boleh sama-sama
-- kosong sementara nilai yang terisi dijamin tidak kembar. Itu persis yang
-- dibutuhkan: dua mitra tidak boleh menunjuk orang SOBAT yang sama, tetapi
-- mitra yang belum dicocokkan tidak boleh saling menghalangi.
-- =====================================================================

ALTER TABLE `ppl_master`
  ADD COLUMN `sobat_id` VARCHAR(50) NULL AFTER `id`,
  ADD UNIQUE KEY `uq_ppl_master_sobat` (`sobat_id`);

-- Verifikasi:
--   DESCRIBE ppl_master;
--   -- kolom sobat_id ada, Null = YES
--   SELECT COUNT(*) FROM ppl_master WHERE sobat_id IS NOT NULL;
--   -- 0 untuk sekarang; terisi bertahap lewat impor
