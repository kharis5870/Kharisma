-- =====================================================================
-- Migrasi: Surat BAST (Berita Acara Serah Terima)
-- Tanggal : 2026-09-13
-- Database: kharisma_db
-- Jalankan SETELAH 2026-09-12-tautan-dokumen.sql
--
-- SATU TEMPLATE, DUA POLA NOMOR
-- PPK, satuan kerja, dan alamatnya sama persis antara Surat PK dan BAST, jadi
-- yang ditambahkan hanya polanya. Menyimpan template terpisah berarti data yang
-- sama diisi dua kali dan bisa menyimpang begitu salah satunya lupa diperbarui.
--
-- BAST TIDAK PUNYA PENOMORAN SENDIRI
-- Nomor BAST mengikuti `nomor_urut` SPK milik mitra yang sama — pada contoh
-- surat yang ada, BAST 03 berpasangan dengan SPK 03. Karena itu tidak ada tabel
-- pemesanan nomor baru dan tidak ada UNIQUE KEY baru: keunikannya sudah dijamin
-- `unique_kontrak (ppl_master_id, periode_mulai, periode_selesai)` yang ada.
-- Konsekuensinya BAST tidak bisa dibuat sebelum SPK-nya digenerate.
--
-- KENAPA `nomor_bast` TETAP DISIMPAN PADAHAL BISA DIHITUNG ULANG
-- Alasan yang sama seperti `nomor_surat` SPK: surat yang sudah terbit harus
-- bisa dicetak ulang persis sama. Kalau nomornya dihitung saat cetak, mengubah
-- pola di Template Surat akan diam-diam mengubah nomor surat yang sudah
-- ditandatangani.
--
-- `tanggal_bast` disimpan karena ia menentukan penanda bulan pada nomor BAST
-- ({BULAN}/{ROMAWI}/{tahun}); tanpa disimpan, cetak ulang di bulan berikutnya
-- akan menghasilkan nomor yang berbeda.
-- =====================================================================

START TRANSACTION;

ALTER TABLE `template_surat`
  ADD COLUMN `format_nomor_bast` VARCHAR(255) NOT NULL
      DEFAULT '{nomor}/BAST/{BULAN}/{ROMAWI}/{tahun}' AFTER `format_nomor`;

ALTER TABLE `kontrak_mitra`
  ADD COLUMN `tanggal_bast`    DATE         NULL AFTER `tanggal_surat`,
  ADD COLUMN `nomor_bast`      VARCHAR(255) NULL AFTER `tanggal_bast`,
  ADD COLUMN `bastGeneratedAt` TIMESTAMP    NULL,
  ADD COLUMN `bastGeneratedBy` VARCHAR(50)  NULL;

COMMIT;

-- Verifikasi:
--   SELECT format_nomor, format_nomor_bast FROM template_surat;
--   -- baris seed harus otomatis terisi '{nomor}/BAST/{BULAN}/{ROMAWI}/{tahun}'
--
--   SELECT COUNT(*) AS totalKontrak, COUNT(nomor_bast) AS sudahAdaBast
--     FROM kontrak_mitra;
--   -- sudahAdaBast harus 0; BAST belum pernah dibuat
