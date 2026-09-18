-- 2026-09-23-token-versi.sql
--
-- Versi token per pengguna, supaya sesi login bisa DICABUT.
--
-- Token sesi hanya berisi id pengguna dan waktu kedaluwarsa (12 jam). Tanpa
-- kolom ini, token yang sudah terbit tetap sah sampai kedaluwarsa walau
-- password akunnya sudah diganti — orang yang sempat mencuri token (atau
-- laptop yang lupa logout) tetap bisa masuk berjam-jam setelahnya.
--
-- Setiap token membawa angka versi saat diterbitkan. Mengganti password
-- menaikkan angka ini, sehingga semua token lama langsung ditolak.
--
-- Nilai bawaan 0 = versi token yang terbit sebelum migrasi ini; pengguna yang
-- sedang login TIDAK ikut terlempar keluar saat migrasi dijalankan.

ALTER TABLE users
    ADD COLUMN tokenVersi INT UNSIGNED NOT NULL DEFAULT 0 AFTER isPML;
