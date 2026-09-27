-- =====================================================================
-- Skema dasar 18 tabel Kharisma/SIKAMI, LENGKAP dan SIAP PAKAI.
--
-- KENAPA BERKAS INI DIBUAT: berkas-berkas di db/migrations/ semuanya
-- bertipe ALTER TABLE, mengandaikan ke-18 tabel dasar SUDAH ADA. Skema
-- dasarnya sendiri sebelumnya tidak pernah tersimpan sebagai berkas di
-- repositori ini, sehingga memasang basis data dari nol (server baru,
-- laptop baru) sebelumnya harus menebak-nebak strukturnya.
--
-- ASALNYA: diekspor langsung dari database pengembangan lokal
-- (kharisma_db) dengan mysqldump --no-data, sehingga bentuknya PERSIS
-- sama dengan yang dipakai menjalankan 608 pengujian otomatis proyek
-- ini -- bukan hasil menyusun ulang secara manual.
--
-- TIGA PERBAIKAN ATAS GALAT NYATA yang terjadi saat pemasangan ke server
-- cPanel (server itu ternyata jauh lebih ketat daripada MariaDB lokal
-- yang dipakai mengembangkan proyek ini):
--
-- 1. Urutan tabel diurutkan menurut ketergantungan foreign key, bukan
--    alfabetis seperti keluaran mysqldump apa adanya, supaya tabel yang
--    dirujuk selalu terbentuk lebih dulu daripada yang merujuknya.
--
-- 2. Kolom generated pada kontrak_mitra (kunci_aktif dan kunci_nomor)
--    diubah dari STORED menjadi VIRTUAL. Versi STORED memerlukan InnoDB
--    membangun ulang seluruh tabel setiap kali ditambahkan, dan pada
--    server tujuan pembangunan ulang itu gagal ketika tabelnya sudah
--    memiliki foreign key -- baik FK ditulis bersamaan di CREATE TABLE
--    maupun ditambahkan belakangan lewat ALTER TABLE, keduanya sama-sama
--    gagal dengan pesan #1215. VIRTUAL dihitung saat dibaca, bukan
--    disimpan fisik, sehingga tidak memerlukan pembangunan ulang tabel.
--    Sudah dipastikan aman: tidak ada satu pun kode aplikasi yang
--    membaca atau menulis kedua kolom ini secara langsung; keduanya
--    murni penjaga UNIQUE KEY di level basis data, dan perilaku UNIQUE
--    KEY pada kolom VIRTUAL identik dengan STORED.
--
-- 3. Komentar panjang yang tadinya ditulis tepat sebelum sebuah
--    pernyataan ALTER TABLE dihapus, karena panel analisis SQL bawaan
--    phpMyAdmin sempat salah mengurai deretan komentar --  tersebut
--    sebagai bagian dari pernyataannya sendiri.
--
-- Sudah diuji: dijalankan dua kali berturut-turut dari basis data kosong
-- di MariaDB lokal, keduanya berhasil membentuk 18 tabel dan 18 foreign
-- key tanpa galat.
--
-- CARA PAKAI:
-- 1. Pastikan database tujuan KOSONG (belum ada satu pun tabel).
-- 2. Jalankan/impor SELURUH isi berkas ini sekali saja -- lewat tab SQL
--    phpMyAdmin (tempel semuanya), bukan tab Impor (unggah berkas).
-- 3. Sesudah itu, JANGAN jalankan migrasi di db/migrations/ lagi --
--    migrasi-migrasi itu sudah tercakup semuanya di dalam skema ini.
--
-- Berkas ini TIDAK BERISI DATA, hanya struktur tabel (CREATE TABLE).
-- =====================================================================


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `kecamatan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kecamatan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kode` char(3) DEFAULT NULL,
  `nama` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kecamatan_kode` (`kode`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `riwayat_surat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `riwayat_surat` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `aksi` varchar(50) NOT NULL COMMENT 'mis. atur_ulang_nomor',
  `periode_mulai` date NOT NULL,
  `periode_selesai` date NOT NULL,
  `jumlah` int(11) NOT NULL DEFAULT 0 COMMENT 'banyaknya nomor terdampak',
  `jumlah_bast` int(11) NOT NULL DEFAULT 0,
  `nomor_surat` text DEFAULT NULL COMMENT 'dipisah koma',
  `nomor_bast` text DEFAULT NULL COMMENT 'dipisah koma',
  `aktorNama` varchar(50) DEFAULT NULL COMMENT 'USERNAME, konsisten dengan kolom pelaku lain',
  `terjadiPada` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_riwayat_surat_waktu` (`terjadiPada`),
  KEY `idx_riwayat_surat_periode` (`periode_mulai`,`periode_selesai`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(255) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `template_surat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `template_surat` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_template` varchar(255) NOT NULL,
  `format_nomor` varchar(255) NOT NULL DEFAULT '{nomor}/SPK/{BULAN}/{ROMAWI}/{tahun}',
  `format_nomor_bast` varchar(255) NOT NULL DEFAULT '{nomor}/BAST/{BULAN}/{ROMAWI}/{tahun}',
  `ppk_nama` varchar(255) NOT NULL,
  `ppk_nip` varchar(50) NOT NULL,
  `ppk_jabatan` varchar(255) NOT NULL,
  `satker_nama` varchar(255) NOT NULL,
  `satker_alamat` text DEFAULT NULL,
  `kota` varchar(100) DEFAULT NULL,
  `pengadilan_negeri` varchar(255) DEFAULT NULL,
  `isi_pasal` longtext DEFAULT NULL COMMENT 'JSON array pasal berisi placeholder',
  `is_aktif` tinyint(1) NOT NULL DEFAULT 1,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updatedBy` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nama_lengkap` varchar(255) NOT NULL,
  `role` enum('admin','user','supervisor') NOT NULL DEFAULT 'user',
  `isPML` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Menandakan apakah user adalah PML',
  `tokenVersi` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_unique` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;DROP TABLE IF EXISTS `desa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `desa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kecamatan_id` int(11) NOT NULL,
  `kode` char(3) DEFAULT NULL,
  `nama` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_desa_kode` (`kecamatan_id`,`kode`),
  KEY `kecamatan_id` (`kecamatan_id`),
  CONSTRAINT `desa_ibfk_1` FOREIGN KEY (`kecamatan_id`) REFERENCES `kecamatan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=159 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ketua_tim`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ketua_tim` (
  `id` varchar(50) NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `nama_ketua` varchar(255) NOT NULL,
  `nip` varchar(50) DEFAULT NULL,
  `tim` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ketua_user` (`user_id`),
  CONSTRAINT `fk_ketua_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kegiatan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kegiatan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `namaKegiatan` varchar(255) NOT NULL,
  `ketua_tim_id` varchar(50) DEFAULT NULL,
  `createdBy_userId` varchar(50) DEFAULT NULL,
  `deskripsiKegiatan` text DEFAULT NULL,
  `adaListing` tinyint(1) NOT NULL DEFAULT 0,
  `adaPengolahan` tinyint(1) NOT NULL DEFAULT 1,
  `adaDiseminasi` tinyint(1) NOT NULL DEFAULT 1,
  `tanggalMulaiPersiapan` date DEFAULT NULL,
  `tanggalSelesaiPersiapan` date DEFAULT NULL,
  `tanggalMulaiPengumpulanData` date DEFAULT NULL,
  `tanggalSelesaiPengumpulanData` date DEFAULT NULL,
  `tanggalMulaiPengolahanAnalisis` date DEFAULT NULL,
  `tanggalSelesaiPengolahanAnalisis` date DEFAULT NULL,
  `tanggalMulaiDiseminasiEvaluasi` date DEFAULT NULL,
  `tanggalSelesaiDiseminasiEvaluasi` date DEFAULT NULL,
  `progressKeseluruhan` tinyint(3) DEFAULT 0,
  `progressPendataanApproved` tinyint(3) unsigned DEFAULT 0,
  `progressPengolahanApproved` tinyint(3) unsigned DEFAULT 0,
  `progressPendataanSubmit` tinyint(3) unsigned DEFAULT 0,
  `progressPengolahanSubmit` tinyint(3) unsigned DEFAULT 0,
  `progressListingApproved` tinyint(3) unsigned DEFAULT 0,
  `progressListingSubmit` tinyint(3) unsigned DEFAULT 0,
  `progressPencacahanApproved` tinyint(3) unsigned DEFAULT 0,
  `progressPencacahanSubmit` tinyint(3) unsigned DEFAULT 0,
  `status` enum('Persiapan','Pengumpulan Data','Pengolahan & Analisis','Diseminasi & Evaluasi','Selesai') DEFAULT 'Persiapan',
  `lastUpdated` timestamp NOT NULL DEFAULT current_timestamp(),
  `lastUpdatedBy` varchar(50) DEFAULT NULL,
  `lastEdited` datetime DEFAULT current_timestamp(),
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `isFasih` tinyint(1) DEFAULT 0,
  `bulanHonorListing` varchar(7) DEFAULT NULL,
  `tanggalMulaiHonorListing` date DEFAULT NULL,
  `tanggalSelesaiHonorListing` date DEFAULT NULL,
  `bulanHonorPencacahan` varchar(7) DEFAULT NULL,
  `tanggalMulaiHonorPencacahan` date DEFAULT NULL,
  `tanggalSelesaiHonorPencacahan` date DEFAULT NULL,
  `bulanHonorPengolahan` varchar(7) DEFAULT NULL,
  `tanggalMulaiHonorPengolahan` date DEFAULT NULL,
  `tanggalSelesaiHonorPengolahan` date DEFAULT NULL,
  `tipe_kegiatan` enum('survei','sensus') NOT NULL DEFAULT 'survei',
  `isArsip` tinyint(1) NOT NULL DEFAULT 0,
  `arsipAt` datetime DEFAULT NULL,
  `arsipBy` varchar(50) DEFAULT NULL,
  `versi` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_kegiatan_ketua_tim` (`ketua_tim_id`),
  KEY `fk_kegiatan_users_createdby` (`createdBy_userId`),
  KEY `idx_honor_listing` (`tanggalMulaiHonorListing`,`tanggalSelesaiHonorListing`),
  KEY `idx_honor_pencacahan` (`tanggalMulaiHonorPencacahan`,`tanggalSelesaiHonorPencacahan`),
  KEY `idx_honor_pengolahan` (`tanggalMulaiHonorPengolahan`,`tanggalSelesaiHonorPengolahan`),
  KEY `idx_is_arsip` (`isArsip`),
  CONSTRAINT `fk_kegiatan_ketua_tim` FOREIGN KEY (`ketua_tim_id`) REFERENCES `ketua_tim` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_kegiatan_users_createdby` FOREIGN KEY (`createdBy_userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ppl_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ppl_master` (
  `id` varchar(50) NOT NULL,
  `sobat_id` varchar(50) DEFAULT NULL,
  `namaPPL` varchar(255) NOT NULL,
  `posisi` enum('Pendataan','Pengolahan','Pendataan/Pengolahan') NOT NULL DEFAULT 'Pendataan',
  `kecamatan_id` int(11) DEFAULT NULL,
  `desa_id` int(11) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `noTelepon` varchar(20) DEFAULT NULL,
  `aktif` tinyint(1) NOT NULL DEFAULT 1,
  `nonaktifSejak` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ppl_master_sobat` (`sobat_id`),
  KEY `fk_ppl_master_kecamatan` (`kecamatan_id`),
  KEY `fk_ppl_master_desa` (`desa_id`),
  KEY `idx_ppl_master_aktif` (`aktif`),
  CONSTRAINT `fk_ppl_master_desa` FOREIGN KEY (`desa_id`) REFERENCES `desa` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ppl_master_kecamatan` FOREIGN KEY (`kecamatan_id`) REFERENCES `kecamatan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `dokumen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dokumen` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kegiatanId` int(11) NOT NULL,
  `diunggahOleh_userId` varchar(50) DEFAULT NULL,
  `lastEditedBy_userId` varchar(50) DEFAULT NULL,
  `nama` varchar(255) NOT NULL,
  `status` enum('Pending','Reviewed','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `rejectionNote` text DEFAULT NULL,
  `rejectedAt` datetime DEFAULT NULL,
  `rejectedBy` varchar(50) DEFAULT NULL,
  `resubmittedAt` datetime DEFAULT NULL,
  `uploadedAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `isWajib` tinyint(1) NOT NULL DEFAULT 0,
  `penanggungJawab` enum('ketua_tim','keuangan') NOT NULL DEFAULT 'ketua_tim',
  `penanggungJawabDiubahOleh` varchar(50) DEFAULT NULL,
  `penanggungJawabDiubahPada` datetime DEFAULT NULL,
  `link` varchar(512) DEFAULT NULL,
  `jenis` enum('file','link','catatan') NOT NULL DEFAULT 'link',
  `tipe` enum('persiapan','pengumpulan-data','pengolahan-analisis','diseminasi-evaluasi') NOT NULL DEFAULT 'persiapan',
  `lastApproved` datetime DEFAULT NULL,
  `lastApprovedBy` varchar(255) DEFAULT NULL,
  `pengingatDikirimPada` datetime DEFAULT NULL,
  `pengingatDikirimOleh` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `kegiatanId` (`kegiatanId`),
  KEY `idx_diunggahOleh` (`diunggahOleh_userId`),
  KEY `idx_dok_wajib` (`kegiatanId`,`tipe`,`isWajib`,`status`),
  KEY `idx_dok_status` (`status`,`uploadedAt`),
  KEY `idx_penanggung_jawab` (`kegiatanId`,`penanggungJawab`),
  CONSTRAINT `dokumen_ibfk_1` FOREIGN KEY (`kegiatanId`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2014 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `honorarium_kegiatan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `honorarium_kegiatan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kegiatanId` int(11) NOT NULL,
  `jenis_pekerjaan` enum('listing','pencacahan','pengolahan') NOT NULL,
  `satuan_beban_kerja` varchar(255) DEFAULT NULL,
  `harga_satuan` varchar(255) DEFAULT NULL,
  `uraian_tugas` varchar(255) DEFAULT NULL,
  `kode_anggaran` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `kegiatanId` (`kegiatanId`),
  CONSTRAINT `honorarium_kegiatan_ibfk_1` FOREIGN KEY (`kegiatanId`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=679 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kontrak_mitra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kontrak_mitra` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ppl_master_id` varchar(50) NOT NULL,
  `periode_mulai` date NOT NULL,
  `periode_selesai` date NOT NULL,
  `nomor_urut` int(11) NOT NULL,
  `nomor_surat` varchar(255) NOT NULL,
  `tanggal_surat` date NOT NULL,
  `tanggal_bast` date DEFAULT NULL,
  `nomor_bast` varchar(255) DEFAULT NULL,
  `status` enum('aktif','batal') NOT NULL DEFAULT 'aktif',
  `catatan` text DEFAULT NULL,
  `dibatalkanPada` datetime DEFAULT NULL,
  `dibatalkanOleh` varchar(50) DEFAULT NULL,
  `total_honor` bigint(20) NOT NULL DEFAULT 0,
  `isi_terbit` longtext DEFAULT NULL,
  `total_volume` int(11) DEFAULT NULL,
  `jumlah_baris` int(11) DEFAULT NULL,
  `diperbaruiPada` datetime DEFAULT NULL,
  `diperbaruiOleh` varchar(50) DEFAULT NULL,
  `template_id` int(11) DEFAULT NULL,
  `generatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `generatedBy` varchar(50) DEFAULT NULL,
  `bastGeneratedAt` timestamp NULL DEFAULT NULL,
  `bastGeneratedBy` varchar(50) DEFAULT NULL,
  `kunci_aktif` varchar(120) GENERATED ALWAYS AS (if(`status` = 'aktif',concat(`ppl_master_id`,'|',convert(cast(`periode_mulai` as char charset cp850) using utf8mb4),'|',convert(cast(`periode_selesai` as char charset cp850) using utf8mb4)),NULL)) VIRTUAL,
  `kunci_nomor` varchar(24) GENERATED ALWAYS AS (if(`status` = 'aktif',concat(year(`tanggal_surat`),'|',`nomor_urut`),NULL)) VIRTUAL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kontrak_aktif` (`kunci_aktif`),
  UNIQUE KEY `uq_kontrak_nomor_aktif` (`kunci_nomor`),
  KEY `idx_periode` (`periode_mulai`,`periode_selesai`),
  KEY `fk_kontrak_template` (`template_id`),
  KEY `idx_kontrak_ppl` (`ppl_master_id`),
  CONSTRAINT `fk_kontrak_ppl` FOREIGN KEY (`ppl_master_id`) REFERENCES `ppl_master` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_kontrak_template` FOREIGN KEY (`template_id`) REFERENCES `template_surat` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ppl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ppl` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kegiatanId` int(11) NOT NULL,
  `tahap` enum('listing','pencacahan','pengolahan-analisis') NOT NULL DEFAULT 'listing',
  `ppl_master_id` varchar(50) DEFAULT NULL,
  `pml_id` varchar(50) DEFAULT NULL,
  `bebanKerja` int(11) DEFAULT 0,
  `besaranHonor` int(11) DEFAULT 0,
  `metodePembebanan` enum('bulan_tertentu','prorata','luber') NOT NULL DEFAULT 'bulan_tertentu',
  `bulanPembebananDipilih` varchar(7) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `kegiatanId` (`kegiatanId`),
  KEY `fk_ppl_master` (`ppl_master_id`),
  CONSTRAINT `fk_ppl_master` FOREIGN KEY (`ppl_master_id`) REFERENCES `ppl_master` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ppl_ibfk_1` FOREIGN KEY (`kegiatanId`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=765 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `riwayat_kegiatan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `riwayat_kegiatan` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `kegiatanId` int(11) NOT NULL,
  `aksi` varchar(40) NOT NULL,
  `entitas` enum('kegiatan','dokumen','ppl','progress','honor','penilaian') NOT NULL,
  `entitasId` int(11) DEFAULT NULL,
  `jumlah` smallint(5) unsigned NOT NULL DEFAULT 1,
  `aktorUserId` varchar(50) DEFAULT NULL,
  `aktorNama` varchar(255) DEFAULT NULL,
  `ringkasan` varchar(255) DEFAULT NULL,
  `terjadiPada` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_riwayat_feed` (`kegiatanId`,`terjadiPada`),
  CONSTRAINT `fk_riwayat_kegiatan` FOREIGN KEY (`kegiatanId`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=140 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `penilaian_mitra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `penilaian_mitra` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pplId` int(11) DEFAULT NULL,
  `kegiatanId` int(11) NOT NULL,
  `pmlId` varchar(50) DEFAULT NULL,
  `sikap_perilaku` int(2) DEFAULT NULL,
  `kualitas_pekerjaan` int(2) DEFAULT NULL,
  `ketepatan_waktu` int(2) DEFAULT NULL,
  `rata_rata` decimal(4,2) DEFAULT NULL,
  `dinilai_oleh_userId` varchar(50) DEFAULT NULL,
  `tanggal_penilaian` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ppl_kegiatan` (`pplId`,`kegiatanId`),
  KEY `fk_penilaian_kegiatan` (`kegiatanId`),
  CONSTRAINT `fk_penilaian_kegiatan` FOREIGN KEY (`kegiatanId`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_penilaian_ppl` FOREIGN KEY (`pplId`) REFERENCES `ppl` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ppl_honor_bulan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ppl_honor_bulan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ppl_id` int(11) NOT NULL,
  `bulan` varchar(7) NOT NULL,
  `volume` int(11) NOT NULL DEFAULT 0,
  `jumlah` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ppl_bulan` (`ppl_id`,`bulan`),
  KEY `idx_bulan` (`bulan`),
  CONSTRAINT `fk_honor_bulan_ppl` FOREIGN KEY (`ppl_id`) REFERENCES `ppl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=146 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ppl_honorarium`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ppl_honorarium` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ppl_id` int(11) NOT NULL,
  `jenis_pekerjaan` enum('listing','pencacahan','pengolahan') NOT NULL,
  `bebanKerja` int(11) DEFAULT 0,
  `satuanBebanKerja` varchar(50) DEFAULT NULL,
  `hargaSatuan` int(11) DEFAULT 0,
  `besaranHonor` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_honor` (`ppl_id`,`jenis_pekerjaan`),
  CONSTRAINT `fk_ppl` FOREIGN KEY (`ppl_id`) REFERENCES `ppl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=698 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ppl_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ppl_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ppl_id` int(11) NOT NULL,
  `progress_type` enum('open','submit','diperiksa','approved','belum_entry','sudah_entry','validasi','clean') NOT NULL,
  `value` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_progress` (`ppl_id`,`progress_type`),
  CONSTRAINT `ppl_progress_ibfk_1` FOREIGN KEY (`ppl_id`) REFERENCES `ppl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1375 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

