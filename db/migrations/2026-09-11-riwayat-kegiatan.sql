-- =====================================================================
-- Migrasi: Riwayat kegiatan (audit trail)
-- Tanggal : 2026-09-11
-- Database: kharisma_db
-- Jalankan SETELAH 2026-09-10-perbaikan-relasi-penilaian.sql
--
-- LATAR BELAKANG
-- Kolom audit yang ada sekarang semuanya bertipe "terakhir": lastEdited,
-- lastUpdated, lastApproved — satu baris, ditimpa setiap kali berubah. Dari
-- data itu hanya bisa disusun KEJADIAN TERAKHIR per entitas, bukan urutan
-- kejadian. Tabel `ppl_progress` bahkan sama sekali tidak punya kolom waktu
-- maupun pelaku, sehingga "siapa mengubah progress kapan" mustahil dijawab.
-- Tabel `kegiatan` juga tidak punya createdAt.
--
-- Tabel ini mencatat satu baris per AKSI PENGGUNA, bukan per baris tersentuh.
-- Kolom `jumlah` meringkas operasi massal, sehingga 12 dokumen yang diunggah
-- sekaligus tercatat sebagai satu baris "menambahkan 12 dokumen".
--
-- BEBAN
-- ~800 baris/tahun pada pemakaian sekarang (5 kegiatan), ~15.000 baris/tahun
-- untuk 100 kegiatan — sekitar 4 MB/tahun. Daftar Dashboard TIDAK menyentuh
-- tabel ini; feed hanya diambil saat dialog detail dibuka.
-- =====================================================================

START TRANSACTION;

CREATE TABLE IF NOT EXISTS `riwayat_kegiatan` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kegiatanId`  INT(11) NOT NULL,

  -- Jenis aksi. Sengaja VARCHAR, bukan ENUM: menambah jenis baru tidak boleh
  -- memerlukan ALTER TABLE pada tabel yang terus bertumbuh.
  `aksi`        VARCHAR(40) NOT NULL,

  `entitas`     ENUM('kegiatan','dokumen','ppl','progress','honor','penilaian') NOT NULL,

  -- Sengaja INT biasa, BUKAN foreign key. Baris ppl dan dokumen bisa terhapus
  -- dalam pemakaian normal, dan riwayat tidak boleh ikut hilang bersamanya.
  `entitasId`   INT(11) NULL,

  -- Meringkas operasi massal: "menambahkan 12 dokumen" jadi SATU baris.
  `jumlah`      SMALLINT UNSIGNED NOT NULL DEFAULT 1,

  `aktorUserId` VARCHAR(50) NULL,
  -- Nama disimpan sebagai salinan, bukan hasil JOIN: riwayat harus tetap
  -- terbaca meski akun pelakunya kelak dihapus.
  `aktorNama`   VARCHAR(255) NULL,

  `ringkasan`   VARCHAR(255) NULL,
  `terjadiPada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  -- Indeks ini yang membuat feed konstan biayanya berapa pun besar tabelnya.
  KEY `idx_riwayat_feed` (`kegiatanId`, `terjadiPada`),
  CONSTRAINT `fk_riwayat_kegiatan` FOREIGN KEY (`kegiatanId`)
      REFERENCES `kegiatan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------
-- Isi mundur dari stempel waktu dokumen yang sudah ada, supaya kegiatan
-- yang sudah berjalan tidak menampilkan panel riwayat yang kosong.
--
-- Dokumen adalah satu-satunya sumber yang punya beberapa stempel waktu
-- independen per baris, jadi hanya dari sanalah urutan kejadian bisa
-- direkonstruksi. Kolom `kegiatan` yang lain bertipe "terakhir" dan tidak
-- bisa memberi lebih dari satu titik waktu.
-- ---------------------------------------------------------------------

-- Dokumen ditambahkan (dikelompokkan per stempel waktu supaya unggahan
-- massal saat kegiatan dibuat tercatat sebagai satu baris).
INSERT INTO `riwayat_kegiatan`
    (kegiatanId, aksi, entitas, entitasId, jumlah, aktorUserId, aktorNama, ringkasan, terjadiPada)
SELECT d.kegiatanId, 'dokumen_ditambah', 'dokumen', NULL, COUNT(*),
       NULL, COALESCE(u.nama_lengkap, d.diunggahOleh_userId),
       CONCAT(COUNT(*), ' dokumen'), d.uploadedAt
  FROM dokumen d
  LEFT JOIN users u ON u.username = d.diunggahOleh_userId
 WHERE d.uploadedAt IS NOT NULL
 GROUP BY d.kegiatanId, d.uploadedAt, d.diunggahOleh_userId, u.nama_lengkap;

-- Dokumen disetujui
INSERT INTO `riwayat_kegiatan`
    (kegiatanId, aksi, entitas, entitasId, jumlah, aktorUserId, aktorNama, ringkasan, terjadiPada)
SELECT d.kegiatanId, 'dokumen_disetujui', 'dokumen', d.id, 1,
       NULL, COALESCE(u.nama_lengkap, d.lastApprovedBy), d.nama, d.lastApproved
  FROM dokumen d
  LEFT JOIN users u ON u.username = d.lastApprovedBy
 WHERE d.lastApproved IS NOT NULL;

-- Dokumen ditolak
INSERT INTO `riwayat_kegiatan`
    (kegiatanId, aksi, entitas, entitasId, jumlah, aktorUserId, aktorNama, ringkasan, terjadiPada)
SELECT d.kegiatanId, 'dokumen_ditolak', 'dokumen', d.id, 1,
       NULL, COALESCE(u.nama_lengkap, d.rejectedBy), d.nama, d.rejectedAt
  FROM dokumen d
  LEFT JOIN users u ON u.username = d.rejectedBy
 WHERE d.rejectedAt IS NOT NULL;

-- Dokumen diunggah ulang
INSERT INTO `riwayat_kegiatan`
    (kegiatanId, aksi, entitas, entitasId, jumlah, aktorUserId, aktorNama, ringkasan, terjadiPada)
SELECT d.kegiatanId, 'dokumen_diunggah_ulang', 'dokumen', d.id, 1,
       NULL, NULL, d.nama, d.resubmittedAt
  FROM dokumen d
 WHERE d.resubmittedAt IS NOT NULL;

-- Penyuntingan terakhir kegiatan (hanya satu titik yang tersedia)
INSERT INTO `riwayat_kegiatan`
    (kegiatanId, aksi, entitas, entitasId, jumlah, aktorUserId, aktorNama, ringkasan, terjadiPada)
SELECT k.id, 'kegiatan_disunting', 'kegiatan', k.id, 1,
       NULL, COALESCE(u.nama_lengkap, k.lastEditedBy), NULL, k.lastEdited
  FROM kegiatan k
  LEFT JOIN users u ON u.username = k.lastEditedBy
 WHERE k.lastEdited IS NOT NULL AND k.lastEditedBy IS NOT NULL;

COMMIT;

-- ---------------------------------------------------------------------
-- Verifikasi
-- ---------------------------------------------------------------------
-- SELECT kegiatanId, aksi, jumlah, aktorNama, terjadiPada
--   FROM riwayat_kegiatan ORDER BY kegiatanId, terjadiPada DESC;
-- SELECT COUNT(*) FROM riwayat_kegiatan;
