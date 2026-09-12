-- =====================================================================
-- Migrasi: Volume beban kerja per bulan pembebanan
-- Tanggal : 2026-09-19
-- Database: kharisma_db
-- Jalankan SETELAH 2026-09-18-pembebanan-honor-dan-tahap-opsional.sql
--
-- LATAR BELAKANG
-- Migrasi 2026-09-18 membagi honor lintas bulan dalam RUPIAH. Praktik tim
-- keuangan ternyata lain: Surat PK dipecah per bulan menurut MUATAN — target
-- 10 responden dibagi jadi SPK bulan pertama 5 responden dan SPK bulan kedua
-- 5 responden, masing-masing dengan jangka waktunya sendiri (mis. 15-31 Jan
-- dan 1-15 Feb).
--
-- Konsekuensinya, satuan yang dibagi adalah UNIT beban kerja (dokumen,
-- responden), dan rupiah tiap bulan mengikutinya: jumlah = volume x harga
-- satuan. Membagi rupiah seperti sebelumnya menghasilkan angka yang tidak
-- bisa ditulis di Surat PK — "volume 3, harga Rp 1.599.999, nilai
-- Rp 2.595.000" tidak mungkin benar.
--
-- Kolom `volume` menyimpan berapa unit beban kerja yang jatuh di bulan itu.
-- `jumlah` tetap disimpan (bukan dihitung saat dibaca) karena rekap honor,
-- batas SBML, dan penilaian semuanya sudah membaca kolom itu.
--
-- BACKFILL
-- Saat migrasi ini ditulis, tidak ada satu pun alokasi yang honornya terpecah
-- ke lebih dari satu bulan: setiap alokasi punya tepat satu baris. Jadi volume
-- bulan itu = seluruh beban kerja alokasinya. Alokasi yang (kelak) punya lebih
-- dari satu baris SENGAJA tidak ditebak di sini — pembagiannya dihitung ulang
-- oleh aplikasi saat kegiatannya disimpan.
-- =====================================================================

START TRANSACTION;

ALTER TABLE `ppl_honor_bulan`
  ADD COLUMN `volume` INT(11) NOT NULL DEFAULT 0 AFTER `bulan`;

UPDATE ppl_honor_bulan b
  JOIN ppl p ON p.id = b.ppl_id
   SET b.volume = COALESCE(p.bebanKerja, 0)
 WHERE (SELECT COUNT(*) FROM (SELECT ppl_id FROM ppl_honor_bulan) x WHERE x.ppl_id = b.ppl_id) = 1;

COMMIT;

-- Verifikasi:
--   SELECT COUNT(*) FROM ppl_honor_bulan WHERE volume = 0 AND jumlah <> 0;
--   -- harus 0: setiap baris berhonor punya volume
--   SELECT p.id FROM ppl p JOIN ppl_honor_bulan b ON b.ppl_id = p.id
--    GROUP BY p.id, p.bebanKerja HAVING SUM(b.volume) <> p.bebanKerja;
--   -- harus KOSONG: volume per bulan menjumlah persis beban kerja alokasinya
