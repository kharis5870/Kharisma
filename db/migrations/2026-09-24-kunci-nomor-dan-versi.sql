-- 2026-09-24-kunci-nomor-dan-versi.sql
--
-- 1) Nomor surat AKTIF unik per tahun.
--
--    Pemesanan nomor membaca MAX(nomor_urut) lalu menulis nomor berikutnya.
--    Saat dua tim keuangan menekan Generate bersamaan untuk periode berbeda,
--    keduanya membaca MAX yang sama dan menerbitkan nomor yang sama — terbukti
--    saat diuji: 15 nomor ganda dalam 5 kali percobaan. Kode kini memegang
--    kunci penomoran per tahun (GET_LOCK); indeks ini lapis kedua di database,
--    supaya nomor ganda tidak mungkin tersimpan walau ada jalur lain yang lupa
--    memegang kunci.
--
--    Surat BATAL bernilai NULL sehingga tidak ikut dibandingkan: nomornya boleh
--    dipakai ulang surat pengganti. Nomor sementara negatif saat "rapikan
--    nomor" tetap unik, jadi tidak bertabrakan.
--
-- 2) Versi kegiatan untuk penyuntingan bersamaan.
--
--    Dua orang yang membuka Edit Kegiatan yang sama lalu menyimpan bergantian
--    membuat simpanan kedua menimpa simpanan pertama tanpa pesan. Setiap simpan
--    dari Edit Kegiatan kini mensyaratkan versi yang sama dengan saat halaman
--    dibuka, lalu menaikkannya; bila berbeda, server menolak dengan 409.

ALTER TABLE kontrak_mitra
    ADD COLUMN kunci_nomor VARCHAR(24) AS (
        IF(status = 'aktif', CONCAT(YEAR(tanggal_surat), '|', nomor_urut), NULL)
    ) STORED,
    ADD UNIQUE KEY uq_kontrak_nomor_aktif (kunci_nomor);

ALTER TABLE kegiatan
    ADD COLUMN versi INT UNSIGNED NOT NULL DEFAULT 0;
