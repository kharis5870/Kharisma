-- db/migrations/2026-09-28-ketua-tim-ikut-akun.sql
--
-- TAHAP 2 dari dua. Jalankan HANYA SETELAH kode baru diunggah dan berjalan,
-- karena migrasi ini MEMBUANG kolom yang masih dibaca kode lama. Tahap 1
-- (2026-09-28-nip-di-akun.sql) harus sudah dijalankan lebih dulu.
--
-- PERIKSA DULU. Migrasi ini mewajibkan setiap ketua tim tertaut ke sebuah akun.
-- Jalankan ini lebih dahulu; kalau menghasilkan baris, tautkan dulu akunnya
-- lewat Manajemen Admin, atau hapus barisnya bila memang tidak terpakai:
--
--     SELECT id, nama_ketua, tahun, tim FROM ketua_tim WHERE user_id IS NULL;
--
-- KENAPA: `ketua_tim` menjadi tabel JABATAN murni — siapa memimpin tim apa
-- pada tahun berapa. Nama dan NIP orangnya dibaca dari `users` lewat sambungan
-- `user_id`, jadi koreksi nama cukup dilakukan di satu tempat dan langsung
-- berlaku untuk seluruh tahun kepengurusannya. Riwayat tetap utuh: yang
-- membekukan sejarah adalah pasangan (orang, tim, tahun) pada baris ini, bukan
-- salinan ejaan namanya.

-- Nama constraint di bawah diambil dari database pengembangan. Di database
-- lain namanya bisa berbeda; pastikan dulu dengan:
--
--     SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
--      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ketua_tim'
--        AND COLUMN_NAME = 'user_id' AND REFERENCED_TABLE_NAME = 'users';
--
-- Foreign key lama memakai ON DELETE SET NULL, yang mustahil dijalankan begitu
-- kolomnya tidak boleh kosong. Diganti RESTRICT, yang justru sesuai dengan
-- perilaku aplikasi: menghapus akun yang masih menjadi ketua tim memang sudah
-- ditolak dengan penjelasan, bukan dibiarkan memutus tautannya diam-diam.
ALTER TABLE ketua_tim DROP FOREIGN KEY fk_ketua_user;

ALTER TABLE ketua_tim MODIFY COLUMN user_id VARCHAR(50) NOT NULL;

ALTER TABLE ketua_tim
    ADD CONSTRAINT fk_ketua_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Nama dan NIP kini dibaca dari `users`.
ALTER TABLE ketua_tim DROP COLUMN nama_ketua, DROP COLUMN nip;
