-- =====================================================================
-- Migrasi: Pengingat dokumen kosong dari tim keuangan
-- Tanggal : 2026-09-16
-- Database: kharisma_db
-- Jalankan SETELAH 2026-09-15-riwayat-surat.sql
--
-- LATAR BELAKANG
-- Tim keuangan memeriksa kelengkapan dokumen di halaman View Documents. Bila
-- sebuah dokumen belum ada link-nya sama sekali, satu-satunya yang bisa ia
-- lakukan selama ini adalah menegur di luar aplikasi. Kolom ini memberi tombol
-- "Kirim Notifikasi" yang memunculkan peringatan di lonceng notifikasi ketua
-- tim kegiatan itu DAN pembuat kegiatannya.
--
-- KENAPA PERLU KOLOM, PADAHAL NOTIFIKASI TIDAK DISIMPAN
-- Notifikasi di aplikasi ini DIHITUNG SAAT DIBACA (lihat notifikasiService),
-- bukan disimpan sebagai baris. Itu bagus: pengingatnya hilang sendiri begitu
-- link-nya diisi, tanpa perlu ada yang membersihkan. Tetapi justru karena tidak
-- ada barisnya, tidak ada apa pun yang mengingat bahwa pengingat sudah pernah
-- dikirim — dan tim keuangan bisa menekan tombolnya berkali-kali. Dua kolom di
-- bawah ini yang menyimpan fakta itu, sekaligus jadi syarat kemunculan
-- notifikasinya.
--
-- DIKOSONGKAN KEMBALI SAAT LINK DIISI
-- `pengingatDikirimPada` di-NULL-kan oleh kode setiap kali link dokumen terisi.
-- Dengan begitu, dokumen yang link-nya dihapus lagi di kemudian hari bisa
-- diingatkan sekali lagi — "cukup sekali" berlaku per kejadian kosong, bukan
-- seumur hidup dokumen.
--
-- KOLOM PELAKU MENYIMPAN USERNAME
-- Sama seperti `rejectedBy`, `lastApprovedBy`, dan `penanggungJawabDiubahOleh`
-- di tabel yang sama: isinya USERNAME, bukan users.id. Seluruh JOIN ke tabel
-- users di proyek ini memakai u.username.
--
-- TANPA BACKFILL
-- NULL berarti "belum pernah diingatkan", dan itu memang keadaan seluruh baris
-- lama.
-- =====================================================================

START TRANSACTION;

ALTER TABLE `dokumen`
  ADD COLUMN `pengingatDikirimPada` DATETIME    NULL AFTER `lastApprovedBy`,
  ADD COLUMN `pengingatDikirimOleh` VARCHAR(50) NULL AFTER `pengingatDikirimPada`;

COMMIT;

-- Verifikasi:
--   SHOW COLUMNS FROM dokumen LIKE 'pengingat%';
--   -- dua baris, keduanya NULL-able
--   SELECT COUNT(*) FROM dokumen WHERE pengingatDikirimPada IS NOT NULL;
--   -- harus 0
