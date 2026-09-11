-- =====================================================================
-- Migrasi: Penanggung jawab dokumen (Ketua Tim vs Tim Keuangan)
-- Tanggal : 2026-09-14
-- Database: kharisma_db
-- Jalankan SETELAH 2026-09-13-surat-bast.sql
--
-- LATAR BELAKANG
-- Sebagian dokumen kegiatan — Surat PK dan BAST — sebenarnya diunggah tim
-- keuangan, bukan ketua tim. Padahal satu-satunya jalur pengisian link ada di
-- halaman Edit Kegiatan yang hanya bisa diakses ketua tim. Akibatnya dokumen
-- itu menggantung: ketua tim tidak punya berkasnya, tim keuangan tidak punya
-- tempat mengunggahnya, dan tenggatnya tetap menghitung mundur ke ketua tim.
--
-- Kolom ini menandai siapa yang bertanggung jawab MENGISI dokumen tersebut.
-- 'keuangan' berarti tim keuangan (role supervisor, plus admin) mengisinya
-- langsung dari View Documents, dan dokumen itu berhenti membebani ketua tim:
-- tidak lagi memunculkan peringatan tenggat maupun sorotan merah di dashboard-
-- nya. Sebagai gantinya muncul notifikasi baru untuk tim keuangan sendiri bila
-- dokumennya belum diisi, supaya pengalihan tanggung jawab tidak berubah
-- menjadi cara menghilangkan dokumen dari pantauan siapa pun.
--
-- KOLOM PELAKU MENYIMPAN USERNAME
-- Konsisten dengan seluruh kolom pelaku lain di tabel ini —
-- `diunggahOleh_userId`, `lastEditedBy_userId`, `rejectedBy`, `lastApprovedBy` —
-- yang meski berakhiran `_userId` sebenarnya berisi USERNAME, bukan users.id.
-- Jangan diisi users.id; seluruh JOIN ke tabel users memakai u.username.
--
-- TANPA BACKFILL
-- DEFAULT 'ketua_tim' sudah menutup seluruh baris lama, dan itu memang keadaan
-- sebenarnya hari ini. Dokumen bernama 'BAST' SENGAJA tidak ditandai otomatis:
-- itu keputusan kebijakan, bukan teknis, jadi biarkan pengguna yang mengalihkan
-- lewat layar.
-- =====================================================================

START TRANSACTION;

ALTER TABLE `dokumen`
  ADD COLUMN `penanggungJawab`           ENUM('ketua_tim','keuangan') NOT NULL DEFAULT 'ketua_tim' AFTER `isWajib`,
  ADD COLUMN `penanggungJawabDiubahOleh` VARCHAR(50) NULL AFTER `penanggungJawab`,
  ADD COLUMN `penanggungJawabDiubahPada` DATETIME    NULL AFTER `penanggungJawabDiubahOleh`,
  ADD KEY `idx_penanggung_jawab` (`kegiatanId`, `penanggungJawab`);

COMMIT;

-- Verifikasi:
--   SELECT penanggungJawab, COUNT(*) FROM dokumen GROUP BY penanggungJawab;
--   -- semuanya harus 'ketua_tim'
