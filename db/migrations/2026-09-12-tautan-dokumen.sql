-- =====================================================================
-- Migrasi: Memperlebar kolom tautan dokumen
-- Tanggal : 2026-09-12
-- Database: kharisma_db
-- Jalankan SETELAH 2026-09-11-riwayat-kegiatan.sql
--
-- LATAR BELAKANG
-- Kolom `dokumen.link` selama ini VARCHAR(255). Tautan Google Docs dan Sheets
-- yang membawa jangkar isi (#gid=, #heading=) atau tautan SharePoint kantor
-- rutin melewati 255 karakter.
--
-- Bahayanya bukan penolakan, melainkan KEBALIKANNYA: pada MariaDB yang tidak
-- berjalan di mode STRICT — bawaan banyak hosting cPanel — kelebihan karakter
-- DIPOTONG tanpa pesan galat apa pun. Tautannya tampak tersimpan dengan sukses,
-- dan baru ketahuan rusak berbulan-bulan kemudian saat ada yang mengkliknya.
-- Tidak ada jejak yang bisa dipakai memulihkannya.
--
-- 512 x utf8mb4 = 2048 byte, jauh di bawah batas ukuran baris InnoDB, dan kolom
-- ini tidak diindeks sehingga tidak ada konsekuensi pada indeks.
--
-- ANGKA INI TERIKAT KE KODE: `BATAS_PANJANG_TAUTAN` di
-- `shared/tautanDokumen.ts` HARUS sama dengan 512. Validasi di aplikasi yang
-- lebih longgar daripada kolomnya akan mengembalikan bug pemotongan senyap ini.
--
-- Memperlebar VARCHAR adalah operasi yang aman: tidak ada data yang berubah,
-- tidak ada baris yang ditolak, dan tidak perlu backfill.
-- =====================================================================

START TRANSACTION;

ALTER TABLE `dokumen`
  MODIFY COLUMN `link` VARCHAR(512) NULL;

COMMIT;

-- Verifikasi:
--   SELECT CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS
--    WHERE TABLE_SCHEMA = 'kharisma_db' AND TABLE_NAME = 'dokumen'
--      AND COLUMN_NAME = 'link';
--   -- harus 512
