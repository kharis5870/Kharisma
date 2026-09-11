-- =====================================================================
-- Migrasi: Notifikasi personal + status Tolak pada dokumen
-- Tanggal : 2026-09-09
-- Database: kharisma_db
-- Jalankan SETELAH 2026-09-08-fitur-baru.sql
--
-- CATATAN SEBELUM MENJALANKAN
-- 1. Backup dulu, lalu uji di salinan database sebelum kena yang asli.
-- 2. Blok FOREIGN KEY sengaja DIPISAH dari ALTER TABLE utamanya. Kalau tipe
--    atau collation `users`.`id` ternyata tidak sama persis dengan
--    VARCHAR(50) di bawah, MySQL menolak dengan errno 150 — dengan
--    dipisah, sisa migrasi tetap berhasil. Periksa dengan:
--       SHOW CREATE TABLE users;
-- =====================================================================

START TRANSACTION;

-- ---------------------------------------------------------------------
-- 1. Hubungkan master Ketua Tim ke akun users
--
--    Sebelum ini kedua tabel sama sekali tidak terhubung: tanpa foreign key,
--    tidak pernah di-JOIN. Padahal Dashboard sudah menentukan hak edit dengan
--    MENGANGGAP users.id === ketua_tim.id — konvensi yang tidak dijamin apa
--    pun. Kolom ini membuat hubungannya eksplisit.
-- ---------------------------------------------------------------------
ALTER TABLE `ketua_tim`
  ADD COLUMN `user_id` VARCHAR(50) NULL AFTER `id`,
  ADD KEY `idx_ketua_user` (`user_id`);

-- Backfill: banyak baris memang sudah memakai ID yang sama.
UPDATE `ketua_tim` kt
  JOIN `users` u ON u.id = kt.id
   SET kt.`user_id` = u.id;

-- ---------------------------------------------------------------------
-- 2. Status 'Rejected' + jejak penolakan pada dokumen
--
--    Sebelumnya hanya ada Pending | Reviewed | Approved, dan "Batal setujui"
--    menulis Pending — tidak bisa dibedakan dari dokumen yang baru diunggah.
-- ---------------------------------------------------------------------
ALTER TABLE `dokumen`
  MODIFY COLUMN `status` ENUM('Pending','Reviewed','Approved','Rejected')
         NOT NULL DEFAULT 'Pending';

ALTER TABLE `dokumen`
  ADD COLUMN `rejectionNote` TEXT        NULL AFTER `status`,
  ADD COLUMN `rejectedAt`    DATETIME    NULL AFTER `rejectionNote`,
  ADD COLUMN `rejectedBy`    VARCHAR(50) NULL AFTER `rejectedAt`,
  ADD COLUMN `resubmittedAt` DATETIME    NULL AFTER `rejectedBy`;

-- Kenapa `resubmittedAt` perlu, bukan cukup membandingkan `updatedAt`:
-- `updatedAt` tidak dipelihara konsisten. `updateSingleDocument` menulisnya,
-- tapi jalur simpan massal di `updateActivity` menimpa nama/link/status TANPA
-- menyentuhnya. Ketua tim yang memperbaiki dokumen lewat halaman Edit Kegiatan
-- karenanya tidak akan pernah memicu notifikasi supervisor.

-- ---------------------------------------------------------------------
-- 3. Index pendukung query notifikasi
-- ---------------------------------------------------------------------
ALTER TABLE `dokumen`
  ADD KEY `idx_dok_wajib`  (`kegiatanId`, `tipe`, `isWajib`, `status`),
  ADD KEY `idx_dok_status` (`status`, `uploadedAt`);

COMMIT;

-- ---------------------------------------------------------------------
-- 4. Foreign key — dijalankan TERPISAH (lihat catatan di atas).
--    Sudah diperiksa: users.id dan kolom ini sama-sama
--    varchar(50) utf8mb4_general_ci, jadi aman.
-- ---------------------------------------------------------------------
ALTER TABLE `ketua_tim`
  ADD CONSTRAINT `fk_ketua_user` FOREIGN KEY (`user_id`)
      REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Opsional, setelah dipastikan tidak ada akun ganda:
-- ALTER TABLE `ketua_tim` ADD UNIQUE KEY `uniq_ketua_user` (`user_id`);

-- ---------------------------------------------------------------------
-- Verifikasi
-- ---------------------------------------------------------------------
-- SELECT id, nama_ketua, user_id FROM ketua_tim ORDER BY user_id IS NULL, id;
-- SHOW COLUMNS FROM dokumen LIKE 'reject%';
-- SHOW COLUMNS FROM dokumen LIKE 'status';
