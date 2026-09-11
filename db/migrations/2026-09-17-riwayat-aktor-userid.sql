-- =====================================================================
-- Migrasi: Mengisi riwayat_kegiatan.aktorUserId yang selama ini NULL
-- Tanggal : 2026-09-17
-- Database: kharisma_db
-- Jalankan SETELAH 2026-09-16-pengingat-dokumen.sql
--
-- LATAR BELAKANG
-- `riwayat_kegiatan.aktorUserId` sejak awal dirancang menaut ke `users.id`:
-- `getRiwayatKegiatan` sudah LEFT JOIN ke sana. Tetapi hampir semua pemanggil
-- `catatRiwayat` hanya menerima `username` dari route, bukan id-nya, sehingga
-- kolom itu NULL di SELURUH baris yang pernah ditulis. JOIN-nya tidak pernah
-- menemukan apa pun, dan feed riwayat menampilkan campuran username mentah
-- ("edi") dengan nama lengkap ("Edianto, S.E") tergantung apa yang kebetulan
-- dikirim pemanggilnya.
--
-- Sejak `catatRiwayat` mencari sendiri id pelaku dari `aktorNama`, baris BARU
-- sudah terisi. Migrasi ini menutup baris LAMA dengan aturan yang sama persis.
--
-- KENAPA DUA UPDATE, BUKAN SATU DENGAN OR
-- `username` unik, `nama_lengkap` tidak. Mencocokkan username lebih dulu
-- memastikan baris yang cocok di kedua kolom mengambil pasangan yang benar.
-- UPDATE kedua hanya menyentuh sisa yang masih NULL.
--
-- AMAN DIULANG
-- Keduanya bersyarat `aktorUserId IS NULL`, jadi menjalankan berkas ini dua
-- kali tidak mengubah apa pun pada percobaan kedua. Tidak ada baris yang
-- dihapus dan tidak ada kolom yang berubah bentuk; `aktorNama` sengaja
-- DIBIARKAN sebagai cadangan bila akun pelakunya kelak dihapus.
-- =====================================================================

START TRANSACTION;

UPDATE riwayat_kegiatan r
  JOIN users u ON u.username = r.aktorNama
   SET r.aktorUserId = u.id
 WHERE r.aktorUserId IS NULL
   AND r.aktorNama IS NOT NULL;

UPDATE riwayat_kegiatan r
  JOIN users u ON u.nama_lengkap = r.aktorNama
   SET r.aktorUserId = u.id
 WHERE r.aktorUserId IS NULL
   AND r.aktorNama IS NOT NULL;

COMMIT;

-- Verifikasi:
--   SELECT COUNT(*) total,
--          SUM(aktorUserId IS NULL) masihKosong,
--          SUM(aktorNama IS NULL)   tanpaNama
--     FROM riwayat_kegiatan;
--   -- `masihKosong` hanya boleh menyisakan baris yang `aktorNama`-nya memang
--   -- NULL, atau yang namanya sudah tidak ada lagi di tabel users.
