-- =====================================================================
-- Migrasi: Menghapus kolom termin honor yang tidak pernah dipakai
-- Tanggal : 2026-09-19
-- Database: kharisma_db
-- Jalankan SETELAH 2026-09-18-pembebanan-honor-dan-tahap-opsional.sql
--
-- LATAR BELAKANG
-- Tabel `ppl` membawa empat kolom sisa rancangan awal pembayaran honor dua
-- termin: `honor_termin_1`, `tanggal_termin_1`, `honor_termin_2`,
-- `tanggal_termin_2`. Tidak ada satu baris kode pun di server, klien, maupun
-- shared yang membaca atau menulisnya. Pembagian honor ke beberapa periode kini
-- ditangani `ppl_honor_bulan` (lihat migrasi 2026-09-18), sehingga kolom ini
-- bukan sekadar menganggur, tetapi menyesatkan: pembaca skema bisa mengira
-- honor dibayar per termin.
--
-- AMAN TERHADAP DATA
-- Diperiksa sebelum migrasi: di seluruh baris `ppl`, keempat kolom bernilai
-- NULL atau 0. Tidak ada index, trigger, maupun view yang merujuknya.
--
-- TIDAK DAPAT DIULANG
-- Menjalankan berkas ini dua kali akan galat "Can't DROP ... check that column
-- exists" — wajar, abaikan. Mengembalikannya memerlukan cadangan sebelum
-- migrasi (db/backup/kharisma_db-sebelum-hapus-termin-*.sql).
--
-- Catatan: ALTER TABLE di MySQL/MariaDB selalu auto-commit, jadi tidak
-- dibungkus START TRANSACTION.
-- =====================================================================

ALTER TABLE `ppl`
  DROP COLUMN `honor_termin_1`,
  DROP COLUMN `tanggal_termin_1`,
  DROP COLUMN `honor_termin_2`,
  DROP COLUMN `tanggal_termin_2`;

-- Verifikasi:
--   SHOW COLUMNS FROM ppl LIKE '%termin%';
--   -- harus kosong
--   SELECT COUNT(*) FROM ppl;
--   -- jumlah baris harus sama dengan sebelum migrasi
