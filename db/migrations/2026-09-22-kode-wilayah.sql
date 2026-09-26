-- db/migrations/2026-09-22-kode-wilayah.sql
--
-- Kode wilayah BPS untuk kecamatan dan desa (kabupaten 1701, Bengkulu Selatan).
--
-- KENAPA PERLU: berkas mitra yang rutin dipakai (ekspor PALAPA) menuliskan
-- wilayah HANYA sebagai kode tanpa nama -- kolom "Alamat Kec" berisi 040 dan
-- "Alamat Desa" berisi 033. Tanpa kode di database, impor tidak punya apa pun
-- untuk dicocokkan, dan kodenya tidak bisa ditebak dari urutan baris: kecamatan
-- Manna punya 18 desa tetapi kodenya melompat dari 005 ke 030.
--
-- Yang disimpan hanya 3 digit terakhir dari kode BPS 10 digit; tiga digit
-- kabupaten (1701) dan tiga digit kecamatan sudah tetap untuk seluruh isi
-- tabel ini.
--
-- Indeks uniknya dipasang SESUDAH pengisian, supaya baris yang gagal terisi
-- ketahuan sebagai NULL yang tersisa, bukan sebagai galat indeks yang
-- membatalkan seluruh migrasi tanpa memberi tahu baris mana penyebabnya.
--
-- Penunjuk barisnya NAMA, bukan id: tidak ada nama desa kembar di dalam satu
-- kecamatan (sudah diperiksa), sedangkan id hanya berlaku di satu database.

ALTER TABLE kecamatan ADD COLUMN kode CHAR(3) NULL AFTER id;
ALTER TABLE desa ADD COLUMN kode CHAR(3) NULL AFTER kecamatan_id;

UPDATE kecamatan SET kode = '040' WHERE nama = 'Manna';
UPDATE kecamatan SET kode = '041' WHERE nama = 'Kota Manna';
UPDATE kecamatan SET kode = '042' WHERE nama = 'Kedurang';
UPDATE kecamatan SET kode = '043' WHERE nama = 'Bunga Mas';
UPDATE kecamatan SET kode = '044' WHERE nama = 'Pasar Manna';
UPDATE kecamatan SET kode = '045' WHERE nama = 'Kedurang Ilir';
UPDATE kecamatan SET kode = '050' WHERE nama = 'Seginim';
UPDATE kecamatan SET kode = '051' WHERE nama = 'Air Nipis';
UPDATE kecamatan SET kode = '060' WHERE nama = 'Pino';
UPDATE kecamatan SET kode = '061' WHERE nama = 'Pinoraya';
UPDATE kecamatan SET kode = '062' WHERE nama = 'Ulu Manna';

-- 040 Manna
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '002' WHERE k.kode = '040' AND d.nama = 'Ketaping';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '003' WHERE k.kode = '040' AND d.nama = 'Terulung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '004' WHERE k.kode = '040' AND d.nama = 'Manggul';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '005' WHERE k.kode = '040' AND d.nama = 'Tanjung Besar';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '030' WHERE k.kode = '040' AND d.nama = 'Lubuk Sirih Ulu';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '031' WHERE k.kode = '040' AND d.nama = 'Lubuk Sirih Ilir';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '032' WHERE k.kode = '040' AND d.nama = 'Tanjung Raman';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '033' WHERE k.kode = '040' AND d.nama = 'Kayu Kunyit';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '050' WHERE k.kode = '040' AND d.nama = 'Kota Padang';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '051' WHERE k.kode = '040' AND d.nama = 'Mela O';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '052' WHERE k.kode = '040' AND d.nama = 'Gunung Sakti';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '053' WHERE k.kode = '040' AND d.nama = 'Jeranglah Rendah';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '054' WHERE k.kode = '040' AND d.nama = 'Jeranglah Tinggi';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '055' WHERE k.kode = '040' AND d.nama = 'Kembang Ayun';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '056' WHERE k.kode = '040' AND d.nama = 'Tambangan';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '057' WHERE k.kode = '040' AND d.nama = 'Gunung Kembang';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '058' WHERE k.kode = '040' AND d.nama = 'Padang Manis';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '059' WHERE k.kode = '040' AND d.nama = 'Padang Pandan';

-- 041 Kota Manna
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '006' WHERE k.kode = '041' AND d.nama = 'Kampung Baru';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '007' WHERE k.kode = '041' AND d.nama = 'Pagar Dewa';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '008' WHERE k.kode = '041' AND d.nama = 'Pasar Baru';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '013' WHERE k.kode = '041' AND d.nama = 'Kota Medan';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '014' WHERE k.kode = '041' AND d.nama = 'Gunung Ayu';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '015' WHERE k.kode = '041' AND d.nama = 'Padang Niur';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '016' WHERE k.kode = '041' AND d.nama = 'Tebat Kubu';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '017' WHERE k.kode = '041' AND d.nama = 'Gelumbang';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '018' WHERE k.kode = '041' AND d.nama = 'Padang Kapuk';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '019' WHERE k.kode = '041' AND d.nama = 'Ibul';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '020' WHERE k.kode = '041' AND d.nama = 'Padang Berangin';

-- 042 Kedurang
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '012' WHERE k.kode = '042' AND d.nama = 'Lawang Agung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '013' WHERE k.kode = '042' AND d.nama = 'Durian Sebatang';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '014' WHERE k.kode = '042' AND d.nama = 'Pajar Bulan';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '015' WHERE k.kode = '042' AND d.nama = 'Tanjung Besar';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '016' WHERE k.kode = '042' AND d.nama = 'Muara Tiga';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '017' WHERE k.kode = '042' AND d.nama = 'Suka Nanti';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '018' WHERE k.kode = '042' AND d.nama = 'Tanjung Negara';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '019' WHERE k.kode = '042' AND d.nama = 'Tanjung Alam';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '020' WHERE k.kode = '042' AND d.nama = 'Keban Agung Iii';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '021' WHERE k.kode = '042' AND d.nama = 'Keban Agung Ii';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '022' WHERE k.kode = '042' AND d.nama = 'Keban Agung I';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '023' WHERE k.kode = '042' AND d.nama = 'Palak Siring';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '024' WHERE k.kode = '042' AND d.nama = 'Bumi Agung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '025' WHERE k.kode = '042' AND d.nama = 'Rantau Sialang';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '026' WHERE k.kode = '042' AND d.nama = 'Batu Ampar';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '027' WHERE k.kode = '042' AND d.nama = 'Muara Tiga Ilir';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '028' WHERE k.kode = '042' AND d.nama = 'Nanti Agung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '029' WHERE k.kode = '042' AND d.nama = 'Karang Agung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '030' WHERE k.kode = '042' AND d.nama = 'Lubuk Resam';

-- 043 Bunga Mas
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '001' WHERE k.kode = '043' AND d.nama = 'Tumbuk Tebing';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '002' WHERE k.kode = '043' AND d.nama = 'Padang Burnai';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '003' WHERE k.kode = '043' AND d.nama = 'Gunung Kayo';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '004' WHERE k.kode = '043' AND d.nama = 'Gindo Suli';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '005' WHERE k.kode = '043' AND d.nama = 'Talang Indah';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '006' WHERE k.kode = '043' AND d.nama = 'Tanjung Tebat';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '007' WHERE k.kode = '043' AND d.nama = 'Padang Jawi';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '008' WHERE k.kode = '043' AND d.nama = 'Tanjung Aur';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '009' WHERE k.kode = '043' AND d.nama = 'Padang Nibung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '010' WHERE k.kode = '043' AND d.nama = 'Kuripan';

-- 044 Pasar Manna
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '001' WHERE k.kode = '044' AND d.nama = 'Pasar Bawah';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '002' WHERE k.kode = '044' AND d.nama = 'Gunung Mesir';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '003' WHERE k.kode = '044' AND d.nama = 'Ketapang Besar';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '004' WHERE k.kode = '044' AND d.nama = 'Padang Sialang';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '005' WHERE k.kode = '044' AND d.nama = 'Belakang Gedung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '006' WHERE k.kode = '044' AND d.nama = 'Pasar Mulia';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '007' WHERE k.kode = '044' AND d.nama = 'Batu Lambang';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '008' WHERE k.kode = '044' AND d.nama = 'Batu Kuning';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '009' WHERE k.kode = '044' AND d.nama = 'Tanjung Mulia';

-- 045 Kedurang Ilir
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '001' WHERE k.kode = '045' AND d.nama = 'Lubuk Ladung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '002' WHERE k.kode = '045' AND d.nama = 'Air Sulau';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '003' WHERE k.kode = '045' AND d.nama = 'Sukajaya';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '004' WHERE k.kode = '045' AND d.nama = 'Sukaraja';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '005' WHERE k.kode = '045' AND d.nama = 'Limus';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '006' WHERE k.kode = '045' AND d.nama = 'Penindaian';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '007' WHERE k.kode = '045' AND d.nama = 'Padang Bindu';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '008' WHERE k.kode = '045' AND d.nama = 'Nanjungan';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '009' WHERE k.kode = '045' AND d.nama = 'Pagar Banyu';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '010' WHERE k.kode = '045' AND d.nama = 'Sukarami';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '011' WHERE k.kode = '045' AND d.nama = 'Betungan';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '012' WHERE k.kode = '045' AND d.nama = 'Karang Caya';

-- 050 Seginim
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '001' WHERE k.kode = '050' AND d.nama = 'Muara Pulutan';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '002' WHERE k.kode = '050' AND d.nama = 'Muara Payang';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '003' WHERE k.kode = '050' AND d.nama = 'Durian Seginim';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '004' WHERE k.kode = '050' AND d.nama = 'Banding Agung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '005' WHERE k.kode = '050' AND d.nama = 'Pajar Bulan';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '006' WHERE k.kode = '050' AND d.nama = 'Padang Lebar';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '007' WHERE k.kode = '050' AND d.nama = 'Dusun Tengah';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '008' WHERE k.kode = '050' AND d.nama = 'Padang Siring';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '009' WHERE k.kode = '050' AND d.nama = 'Tanjung Menang';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '010' WHERE k.kode = '050' AND d.nama = 'Gunung Ayu';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '011' WHERE k.kode = '050' AND d.nama = 'Kota Bumi Baru';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '012' WHERE k.kode = '050' AND d.nama = 'Sindang Bulan';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '013' WHERE k.kode = '050' AND d.nama = 'Sukaraja';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '014' WHERE k.kode = '050' AND d.nama = 'Pasar Baru';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '015' WHERE k.kode = '050' AND d.nama = 'Darat Sawah';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '016' WHERE k.kode = '050' AND d.nama = 'Kota Agung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '017' WHERE k.kode = '050' AND d.nama = 'Muara Danau';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '018' WHERE k.kode = '050' AND d.nama = 'Babatan Ilir';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '019' WHERE k.kode = '050' AND d.nama = 'Babatan Ulu';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '020' WHERE k.kode = '050' AND d.nama = 'Tanjung Agung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '021' WHERE k.kode = '050' AND d.nama = 'Dusun Baru';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '022' WHERE k.kode = '050' AND d.nama = 'Darat Sawah Ulu';

-- 051 Air Nipis
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '001' WHERE k.kode = '051' AND d.nama = 'Suka Bandung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '002' WHERE k.kode = '051' AND d.nama = 'Penandingan';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '003' WHERE k.kode = '051' AND d.nama = 'Maras';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '004' WHERE k.kode = '051' AND d.nama = 'Keban Jati';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '005' WHERE k.kode = '051' AND d.nama = 'Tanjung Beringin';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '006' WHERE k.kode = '051' AND d.nama = 'Palak Bengkerung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '007' WHERE k.kode = '051' AND d.nama = 'Suka Negeri';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '008' WHERE k.kode = '051' AND d.nama = 'Pino Baru';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '009' WHERE k.kode = '051' AND d.nama = 'Suka Maju';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '010' WHERE k.kode = '051' AND d.nama = 'Sukarami';

-- 060 Pino
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '013' WHERE k.kode = '060' AND d.nama = 'Padang Lebar';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '014' WHERE k.kode = '060' AND d.nama = 'Anggut';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '015' WHERE k.kode = '060' AND d.nama = 'Gedung Agung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '016' WHERE k.kode = '060' AND d.nama = 'Tanjung Eran';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '017' WHERE k.kode = '060' AND d.nama = 'Tanjung Aur I';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '018' WHERE k.kode = '060' AND d.nama = 'Puding';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '019' WHERE k.kode = '060' AND d.nama = 'Air Umban';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '020' WHERE k.kode = '060' AND d.nama = 'Masat';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '024' WHERE k.kode = '060' AND d.nama = 'Ulak Lebar';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '025' WHERE k.kode = '060' AND d.nama = 'Sebilo';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '026' WHERE k.kode = '060' AND d.nama = 'Ganjuh';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '027' WHERE k.kode = '060' AND d.nama = 'Kota Bumi';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '028' WHERE k.kode = '060' AND d.nama = 'Batu Bandung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '029' WHERE k.kode = '060' AND d.nama = 'Beringin Datar';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '030' WHERE k.kode = '060' AND d.nama = 'Padang Mumpo';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '031' WHERE k.kode = '060' AND d.nama = 'Padang Tambak';

-- 061 Pinoraya
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '001' WHERE k.kode = '061' AND d.nama = 'Tanggo Raso';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '002' WHERE k.kode = '061' AND d.nama = 'Air Kemang';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '003' WHERE k.kode = '061' AND d.nama = 'Bandung Ayu';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '004' WHERE k.kode = '061' AND d.nama = 'Tungkal I';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '005' WHERE k.kode = '061' AND d.nama = 'Talang Padang';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '006' WHERE k.kode = '061' AND d.nama = 'Pasar Pino';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '007' WHERE k.kode = '061' AND d.nama = 'Selali';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '008' WHERE k.kode = '061' AND d.nama = 'Nanjungan';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '009' WHERE k.kode = '061' AND d.nama = 'Tungkal Ii';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '010' WHERE k.kode = '061' AND d.nama = 'Napal Melintang';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '011' WHERE k.kode = '061' AND d.nama = 'Serang Bulan';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '012' WHERE k.kode = '061' AND d.nama = 'Kemang Manis';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '013' WHERE k.kode = '061' AND d.nama = 'Suka Bandung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '014' WHERE k.kode = '061' AND d.nama = 'Cinto Mandi';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '015' WHERE k.kode = '061' AND d.nama = 'Pagar Gading';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '016' WHERE k.kode = '061' AND d.nama = 'Kembang Seri';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '017' WHERE k.kode = '061' AND d.nama = 'Karang Cayo';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '018' WHERE k.kode = '061' AND d.nama = 'Tanjung Aur Ii';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '019' WHERE k.kode = '061' AND d.nama = 'Padang Beriang';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '020' WHERE k.kode = '061' AND d.nama = 'Padang Serasan';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '022' WHERE k.kode = '061' AND d.nama = 'Telaga Dalam';
-- TIDAK DIPAKAI: 023 UPT Tanjung Aur II / Karang Cayo -- tidak ada di tabel desa

-- 062 Ulu Manna
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '001' WHERE k.kode = '062' AND d.nama = 'Batu Panco';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '002' WHERE k.kode = '062' AND d.nama = 'Batu Kuning';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '003' WHERE k.kode = '062' AND d.nama = 'Bandar Agung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '004' WHERE k.kode = '062' AND d.nama = 'Merambung';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '005' WHERE k.kode = '062' AND d.nama = 'Simpang Pino';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '006' WHERE k.kode = '062' AND d.nama = 'Talang Tinggi';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '007' WHERE k.kode = '062' AND d.nama = 'Keban Jati';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '008' WHERE k.kode = '062' AND d.nama = 'Lubuk Tapi';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '009' WHERE k.kode = '062' AND d.nama = 'Kayu Ajaran';
UPDATE desa d JOIN kecamatan k ON k.id = d.kecamatan_id SET d.kode = '010' WHERE k.kode = '062' AND d.nama = 'Air Tenam';

ALTER TABLE kecamatan ADD UNIQUE KEY uq_kecamatan_kode (kode);
ALTER TABLE desa ADD UNIQUE KEY uq_desa_kode (kecamatan_id, kode);
