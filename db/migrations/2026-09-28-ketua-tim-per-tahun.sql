-- db/migrations/2026-09-28-ketua-tim-per-tahun.sql
--
-- Ketua tim dicatat PER TAHUN.
--
-- KENAPA PERLU: susunan tim kerja BPS berubah tiap tahun. Tanpa kolom tahun,
-- pergantian ketua tim hanya bisa dilakukan dengan MENYUNTING baris yang ada —
-- dan karena `kegiatan` menyimpan `ketua_tim_id` sedangkan namanya diambil saat
-- ditampilkan, menyunting baris itu ikut mengubah nama ketua tim pada seluruh
-- kegiatan tahun-tahun sebelumnya. Riwayatnya hilang tanpa ada yang tahu.
--
-- Dengan kolom ini, pergantian ketua tim = MENAMBAH baris baru untuk tahun
-- berikutnya. Kegiatan lama tetap menunjuk baris lamanya, jadi terarsip apa
-- adanya tanpa pekerjaan tambahan.
--
-- BARIS YANG SUDAH ADA diberi tahun 2026 (tahun berjalan saat migrasi ini
-- dibuat). Kegiatan 2025 tetap menunjuk baris yang sama: riwayat sebelum
-- pencatatan per tahun ada memang tidak bisa dipisahkan surut, dan memalsukan
-- pemisahan itu lebih buruk daripada mengakuinya.
--
-- Nilai bawaan sengaja TIDAK dipasang: tahun harus disebut secara sadar setiap
-- kali ketua tim ditambahkan, bukan diam-diam terisi tahun server.

ALTER TABLE ketua_tim ADD COLUMN tahun SMALLINT UNSIGNED NULL AFTER nama_ketua;

UPDATE ketua_tim SET tahun = 2026 WHERE tahun IS NULL;

ALTER TABLE ketua_tim MODIFY COLUMN tahun SMALLINT UNSIGNED NOT NULL;

-- Satu orang boleh memimpin tim yang sama di beberapa tahun, tetapi tidak boleh
-- ada dua baris untuk tim dan tahun yang sama — itu membuat dropdown
-- menampilkan dua pilihan yang tampak identik.
--
-- `tim` boleh kosong (ada ketua tim tanpa tim tercatat), dan MySQL
-- memperlakukan NULL sebagai selalu berbeda, jadi baris tanpa tim tidak saling
-- bentrok. Itu memang yang diinginkan.
ALTER TABLE ketua_tim ADD UNIQUE KEY uq_ketua_tim_tim_tahun (tim, tahun);

CREATE INDEX idx_ketua_tim_tahun ON ketua_tim (tahun);
