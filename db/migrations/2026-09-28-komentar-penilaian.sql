-- db/migrations/2026-09-28-komentar-penilaian.sql
--
-- Komentar penilai terhadap mitra yang dinilai.
--
-- KENAPA PERLU: SOBAT meminta setiap penilaian mitra disertai komentar, dan
-- angka 1-10 saja tidak menjelaskan apa pun ketika mitra mempertanyakan
-- nilainya atau ketika mitra yang sama diusulkan lagi tahun depan.
--
-- KOLOMNYA NULLABLE, sekalipun komentar WAJIB diisi mulai sekarang. Penilaian
-- yang sudah tersimpan sebelum kolom ini ada memang tidak punya komentar, dan
-- memaksa NOT NULL berarti mengarang isi untuk semuanya — data buatan yang
-- tidak bisa dibedakan dari komentar sungguhan. Kewajibannya ditegakkan saat
-- MENYIMPAN (di layar dan di server), bukan oleh skema.

ALTER TABLE penilaian_mitra ADD COLUMN komentar TEXT NULL AFTER ketepatan_waktu;
