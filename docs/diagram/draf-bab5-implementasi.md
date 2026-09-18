# Draf Bab V — Bagian 1: Implementasi Sistem

Dokumen ini berisi draf subbab **5.1 Implementasi** beserta seluruh penjelasannya.
Bagian evaluasi dan pengujian ada di dokumen terpisah, yaitu
`draf-bab5-evaluasi.md`.

**Cara memakai dokumen ini**

1. Setiap tempat tangkapan layar ditandai `[TANGKAPAN LAYAR SS-xx]` diikuti
   keterangan gambar dan petunjuk apa yang harus terlihat pada gambar itu.
   Petunjuk tersebut jangan ikut dimasukkan ke buku; ia hanya panduan Anda saat
   mengambil gambar.
2. Nomor gambar dan tabel menyesuaikan penomoran Bab IV Anda.
3. Gambar arsitektur sistem sudah dibuatkan: `docs/diagram/out/arsitektur.svg`
   (berkas sumbernya `12-arsitektur-sistem.puml`).
4. Sebelum mengambil tangkapan layar, siapkan data contoh yang wajar: minimal tiga
   kegiatan dengan status berbeda, sepuluh mitra, dua bulan honor, dan beberapa
   dokumen dengan status berbeda. **Samarkan nama mitra sebenarnya** (misalnya
   ganti dengan nama contoh) karena buku skripsi menjadi dokumen publik.

---

## 5.1 Implementasi Sistem

Tahap implementasi adalah tahap ketiga pada metode Modified Waterfall, yaitu
penerjemahan rancangan pada Bab IV menjadi program yang dapat dijalankan. Bagian
ini menjelaskan lingkungan yang dipakai, arsitektur sistem yang dibangun,
implementasi basis data, implementasi logika utama, dan implementasi antarmuka.

Sesuai sifat *feedback loop* pada metode yang dipakai, implementasi tidak berjalan
satu arah. Beberapa bagian rancangan berubah setelah program dicoba oleh pegawai
BPS Kabupaten Bengkulu Selatan, dan perubahan itu dikembalikan ke tahap perancangan
sebelum dikerjakan ulang. Perubahan yang paling besar dijelaskan pada akhir subbab
ini.

### 5.1.1 Lingkungan Implementasi

Sistem dibangun dan diuji pada perangkat dengan spesifikasi berikut.

**Tabel …: Spesifikasi Perangkat Keras yang Digunakan**

| Komponen | Spesifikasi |
| --- | --- |
| Prosesor | *(isi sesuai laptop Anda, contoh: Intel Core i5-1135G7 2.40 GHz)* |
| Memori (RAM) | *(contoh: 16 GB)* |
| Penyimpanan | *(contoh: SSD 512 GB)* |
| Sistem Operasi | Windows 11 Pro 64-bit |

**Tabel …: Perangkat Lunak yang Digunakan**

| Perangkat Lunak | Versi | Kegunaan |
| --- | --- | --- |
| Visual Studio Code | *(isi versi Anda)* | Penyunting kode |
| Node.js | 24.16.0 | Lingkungan jalan untuk server dan proses build |
| pnpm | *(isi versi Anda)* | Pengelola paket |
| MariaDB (XAMPP) | 10.4.32 | Sistem manajemen basis data |
| phpMyAdmin | *(isi versi Anda)* | Pengelolaan basis data melalui peramban |
| Google Chrome | *(isi versi Anda)* | Peramban untuk menjalankan dan menguji sistem |
| Git | *(isi versi Anda)* | Pengelolaan versi kode |

**Tabel …: Pustaka dan Kerangka Kerja Utama**

| Nama | Versi | Kegunaan |
| --- | --- | --- |
| React | 18.3.1 | Kerangka kerja antarmuka pengguna |
| React Router | 6.30.6 | Perpindahan halaman tanpa memuat ulang |
| TypeScript | 5.9.2 | Bahasa pemrograman dengan pemeriksaan tipe data |
| Vite | 7.3.6 | Perkakas build dan server pengembangan |
| Tailwind CSS | 3.4.17 | Penataan tampilan |
| TanStack Query | 5.84.2 | Pengambilan dan penyimpanan sementara data dari API |
| Zustand | 4.5.4 | Pengelolaan keadaan formulir kegiatan |
| Recharts | 2.12.7 | Grafik pada dasbor |
| Express | 4.22.3 | Kerangka kerja server dan RESTful API |
| mysql2 | 3.24.4 | Penghubung ke basis data MySQL/MariaDB |
| bcryptjs | 3.0.2 | Penyandian kata sandi |
| express-rate-limit | 8.7.0 | Pembatasan percobaan masuk |
| pdfmake | 0.3.11 | Pembuatan berkas PDF surat dan rekap |
| ExcelJS | 4.4.0 | Pembuatan berkas Excel rekap |
| Vitest | 3.2.4 | Pengujian unit |

Perangkat di atas adalah perangkat yang dipakai selama pengembangan dan pengujian.
Untuk penerapannya, sistem dipasang pada layanan *hosting* cPanel milik BPS. Berkas
antarmuka hasil *build* dan program server disalin ke sana, aplikasi Node.js
dijalankan melalui Passenger, dan basis datanya dibuat pada MySQL yang disediakan
cPanel. Alamat sistem hanya dapat dibuka dari dalam jaringan BPS; dari luar kantor
pegawai harus tersambung lebih dahulu melalui FortiClient VPN BPS.

Pemilihan React, Express, dan MySQL didasarkan pada dua pertimbangan. Pertama,
ketiganya berjalan di lingkungan Windows yang dipakai di kantor tanpa perangkat
tambahan. Kedua, keduanya memakai satu bahasa yang sama, yaitu TypeScript, untuk
sisi peramban dan sisi server, sehingga aturan yang harus sama di kedua sisi —
misalnya aturan hak akses dan aturan pembagian honor — cukup ditulis satu kali di
folder bersama dan dipakai oleh keduanya.

### 5.1.2 Arsitektur Sistem

Sistem dibangun dengan arsitektur *client-server* tiga lapis. Seluruh lapisannya
dipasang pada layanan *hosting* cPanel milik BPS dan berada di dalam jaringan BPS,
sehingga sistem hanya dapat dibuka oleh pegawai BPS, dan dari luar kantor hanya
melalui koneksi FortiClient VPN BPS.

**[TANGKAPAN LAYAR / GAMBAR]** Gambar …: Arsitektur Sistem
*(gunakan berkas `docs/diagram/out/arsitektur.svg`, ekspor ke PNG bila perlu)*

Penjelasan tiap bagian:

**1. Sisi klien (peramban pengguna).** Antarmuka dibangun sebagai *Single Page
Application*, yaitu seluruh halaman dimuat satu kali di awal, lalu perpindahan
antar halaman hanya menukar bagian isi tanpa memuat ulang seluruh halaman. Cara ini
membuat perpindahan halaman terasa cepat dan mengurangi permintaan ke server.
Peramban juga bertugas membentuk berkas PDF surat serta berkas Excel rekap, dan
pustaka pembentuk berkas itu baru dimuat saat tombol unduh ditekan, sehingga
pemuatan halaman pertama tidak terbebani. Token sesi disimpan di *localStorage*
peramban dan disertakan pada setiap permintaan ke server.

**2. Sisi server (Node.js dan Express).** Server menjalankan dua tugas. Pertama,
menyajikan berkas hasil build antarmuka. Kedua, melayani RESTful API di alamat
`/kharisma/api`. Setiap permintaan API melewati lapisan keamanan terlebih dahulu:
tanda tangan token diperiksa, masa berlakunya dicek, nomor versi token dicocokkan
dengan yang tersimpan di basis data, lalu peran dan kepemilikan data pengguna
diperiksa sesuai jenis permintaannya. Permintaan yang lolos diteruskan ke lapisan
layanan yang memuat seluruh logika pekerjaan: perhitungan honor, pemeriksaan batas
SBM, penomoran surat, penilaian, dan penyusunan notifikasi.

**3. Sisi basis data (MySQL/MariaDB).** Basis data menyimpan seluruh data dalam 18
tabel yang saling terhubung dengan kunci asing. Server terhubung melalui kumpulan
koneksi (*connection pool*) sehingga koneksi dipakai bergantian dan tidak dibuat
ulang setiap permintaan.

Di luar ketiga lapisan itu terdapat tiga komponen luar. Penyimpanan dokumen
instansi (Google Drive) menampung berkas dokumen kegiatan, dan sistem hanya
menyimpan tautannya. Berkas Excel dari aplikasi SOBAT dibaca langsung di peramban
saat impor mitra, sehingga berkas mentahnya tidak perlu dikirim dan disimpan di
server. Aplikasi FASIH belum tersambung; jalur integrasinya digambarkan dengan garis
putus-putus karena sudah disiapkan melalui RESTful API, tetapi progres masih diinput
PML secara manual.

Alur satu permintaan dapat diringkas sebagai berikut. Pengguna menekan tombol pada
antarmuka, peramban mengirim permintaan JSON beserta token, lapisan keamanan
memeriksa token dan hak akses, lapisan layanan memeriksa aturan pekerjaan dan
menjalankan kueri ke basis data, hasilnya dikembalikan sebagai JSON, lalu antarmuka
memperbarui tampilan tanpa memuat ulang halaman.

### 5.1.3 Implementasi Basis Data

Rancangan basis data pada Bab IV diterapkan menjadi 18 tabel pada MariaDB. Struktur
lengkap setiap tabel telah dijelaskan pada subbab rancangan basis data, sehingga
bagian ini hanya membahas penerapan yang tidak terlihat pada rancangan, yaitu cara
basis data ikut menjaga aturan pekerjaan.

**[TANGKAPAN LAYAR SS-01]** Gambar …: Daftar Tabel pada Basis Data
*(buka phpMyAdmin, pilih basis data sistem, tangkap daftar 18 tabel beserta jumlah
barisnya)*

**a. Menjaga satu surat aktif per mitra per bulan.** Aturan bahwa satu mitra hanya
boleh memiliki satu SPK aktif dalam satu bulan tidak cukup diperiksa di program,
karena dua permintaan yang datang bersamaan dapat lolos pemeriksaan pada saat yang
sama. Karena itu aturan tersebut ditegakkan langsung oleh basis data melalui kolom
turunan dan indeks unik:

```sql
ALTER TABLE kontrak_mitra
  ADD COLUMN kunci_aktif VARCHAR(120) AS (
      IF(status = 'aktif',
         CONCAT(ppl_master_id, '|', periode_mulai, '|', periode_selesai),
         NULL)
  ) STORED,
  ADD UNIQUE KEY uq_kontrak_aktif (kunci_aktif);
```

Kolom `kunci_aktif` bernilai kosong untuk surat yang dibatalkan, sehingga surat
batal tidak ikut dihitung sebagai kembar dan mitra yang suratnya dibatalkan dapat
dibuatkan surat baru pada bulan yang sama.

**b. Menjaga nomor surat tidak kembar.** Cara yang sama dipakai untuk penomoran:

```sql
ALTER TABLE kontrak_mitra
  ADD COLUMN kunci_nomor VARCHAR(24) AS (
      IF(status = 'aktif', CONCAT(YEAR(tanggal_surat), '|', nomor_urut), NULL)
  ) STORED,
  ADD UNIQUE KEY uq_kontrak_nomor_aktif (kunci_nomor);
```

**c. Menjaga penyuntingan bersamaan.** Tabel `kegiatan` diberi kolom `versi`.
Setiap penyimpanan menyertakan nomor versi yang dibaca saat halaman dibuka. Bila
nomor itu sudah berbeda, artinya orang lain menyimpan lebih dulu, sehingga
penyimpanan ditolak dengan kode 409 dan pengguna diminta memuat ulang. Tanpa ini,
perubahan yang disimpan belakangan akan menimpa perubahan sebelumnya tanpa pesan
apa pun.

**d. Menjaga keutuhan data.** Penyimpanan kegiatan beserta alokasi mitranya, dan
impor mitra dari SOBAT, dijalankan di dalam satu transaksi. Bila salah satu langkah
gagal, seluruh langkah dibatalkan sehingga tidak ada kegiatan yang tersimpan tanpa
alokasi atau impor yang berhenti di tengah jalan.

### 5.1.4 Implementasi Logika Utama

Tujuh bagian berikut adalah logika yang paling menentukan manfaat sistem dan paling
banyak menggantikan pekerjaan manual. Subbab 5.1.3 di atas membahas pengamanan pada
tingkat basis data, sedangkan subbab ini membahas aturan yang dijalankan program
sebelum data sampai ke basis data; keduanya saling melengkapi, bukan mengulang.

**a. Perhitungan honor dan pembagian lintas bulan.** Honor satu alokasi dihitung
sebesar beban kerja dikali harga satuan. Bila periode honor melintasi lebih dari
satu bulan, yang dibagi adalah muatan pekerjaannya, bukan rupiahnya, lalu honor tiap
bulan dihitung ulang sebesar muatan bulan itu dikali harga satuan. Tersedia tiga
cara pembagian: seluruhnya ke satu bulan, dibagi menurut jumlah hari, dan luber,
yaitu bulan pertama diisi sampai batas honor lalu sisanya dipindahkan ke bulan
berikutnya. Aturan pembagian ini ditulis di folder bersama (`shared/`) sehingga
angka yang ditampilkan di peramban dan angka yang disimpan di server pasti sama.

**b. Pemeriksaan batas honor bulanan (SBM).** Sebelum kegiatan disimpan, sistem
menjumlahkan honor setiap mitra pada tiap bulan dari seluruh kegiatan, termasuk
kegiatan tim lain, lalu membandingkannya dengan nilai batas yang tersimpan di tabel
pengaturan. Bila melebihi, server membalas dengan kode 409 beserta daftar mitra,
bulan, total honor, dan batasnya. Antarmuka menampilkan daftar itu sebagai
peringatan, dan penyimpanan baru dilanjutkan setelah pengguna menyatakan tetap
menyimpan. Perlu ditegaskan bahwa sistem **memperingatkan**, bukan menolak, karena
ada keadaan yang memang harus dilewatkan dengan sepengetahuan Tim Keuangan.

**c. Penomoran surat.** Nomor surat diberikan berurutan per tahun. Agar dua orang
yang membuat surat pada saat bersamaan tidak memperoleh nomor yang sama, pengambilan
nomor dilakukan di dalam kunci basis data (`GET_LOCK`), dan indeks unik pada kolom
`kunci_nomor` menjadi pengaman terakhir. Nomor BAST tidak dihitung sendiri melainkan
mengikuti nomor urut SPK mitra yang sama, sehingga kedua surat satu mitra selalu
sepadan.

**d. Penilaian dan peringkat triwulan.** Nilai akhir seorang mitra pada satu
triwulan dihitung dengan rumus:

> nilai akhir = rata-rata seluruh nilai rata-rata pada triwulan tersebut
> + (0,01 × jumlah pasangan kegiatan-tahap yang diikuti mitra)

Triwulan ditentukan dari bulan pembebanan honor mitra, bukan dari tanggal penilaian
diisi. Penambahan 0,01 per kegiatan dipakai untuk membedakan mitra yang nilainya
sama, dengan mengutamakan mitra yang lebih banyak mengerjakan kegiatan.

**e. Notifikasi tanpa penjadwal.** Notifikasi tidak disimpan sebagai data, melainkan
dihitung saat panel notifikasi dibuka, dengan menjalankan beberapa kueri: dokumen
yang ditolak, tenggat tahap H-3 sampai H-1 dan yang sudah terlewat, progres yang
tidak diperbarui lebih dari dua hari, dokumen yang menunggu persetujuan, dokumen
yang diunggah ulang, dokumen tanggung jawab Tim Keuangan yang belum diisi,
pengingat dari Tim Keuangan, dan surat yang isinya berubah setelah terbit. Karena
dihitung saat dibaca, notifikasi hilang dengan sendirinya setelah penyebabnya
diselesaikan, dan sistem tidak membutuhkan proses latar yang harus dijalankan terus
menerus.

**f. Otorisasi berlapis.** Hak akses diperiksa pada dua tingkat. Tingkat pertama
adalah peran: Admin, Tim Keuangan, dan Pegawai. Tingkat kedua adalah kepemilikan
data: kegiatan hanya dapat disunting pembuat, ketua tim kegiatan itu, atau Admin;
progres dan penilaian mitra hanya dapat diisi PML yang mengawasi mitra tersebut.
Identitas pelaku selalu diambil dari token, bukan dari data yang dikirim peramban,
sehingga pengguna tidak dapat mengaku sebagai orang lain dengan mengubah isi
permintaan.

**g. Dua lapis pembatalan dan penghapusan kegiatan.** Sistem sengaja membedakan
dua cara membuang sebuah kegiatan, dengan tingkat kehati-hatian yang berbeda
sesuai risikonya. Cara pertama adalah pembatalan cepat oleh pembuatnya sendiri,
tersedia hanya beberapa detik setelah kegiatan disimpan (selama jendela
konfirmasi masih terbuka). Pembatalan ini **tidak memeriksa** apakah kegiatan
sudah memiliki alokasi mitra atau penilaian, karena keduanya memang ikut
tersimpan dalam satu kali penyimpanan yang sama; tujuannya adalah membuang
seluruh kegiatan yang baru saja salah disimpan, bukan hanya kerangkanya. Jendela
ini sengaja dibuat singkat, bukan diperpanjang, karena satu-satunya pengaman
cara ini adalah waktu: semakin lama jendelanya terbuka, semakin besar
kemungkinan PML sudah mulai mengisi progres atau Tim Keuangan sudah mulai
menyiapkan surat untuk kegiatan tersebut, sehingga penghapusan tanpa
pemeriksaan menjadi berisiko.

Cara kedua adalah penghapusan biasa, khusus Admin dan tanpa batas waktu, tetapi
**dengan pemeriksaan**: sistem menolak permintaan hapus bila kegiatan itu sudah
memiliki alokasi mitra atau penilaian, dan mengarahkan penggunanya untuk
mengarsipkan kegiatan tersebut alih-alih menghapusnya. Dengan susunan ini,
kegiatan yang sudah mulai dikerjakan tidak dapat hilang begitu saja baik lewat
pembatalan cepat (karena jendelanya sudah keburu tertutup) maupun lewat
penghapusan oleh Admin (karena tertahan pemeriksaan keterikatan data),
sehingga risiko kehilangan data akibat kesalahan maupun penyalahgunaan
ditekan tanpa mempersulit perbaikan salah klik yang wajar terjadi.

### 5.1.5 Implementasi Antarmuka

Bagian ini menampilkan hasil implementasi rancangan antarmuka pada Bab IV. Urutan
pembahasan mengikuti urutan rancangannya.

#### a. Halaman Masuk

**[TANGKAPAN LAYAR SS-02]** Gambar …: Halaman Masuk
*(tangkap seluruh layar halaman login dalam keadaan kosong)*

**[TANGKAPAN LAYAR SS-03]** Gambar …: Pesan Kesalahan pada Halaman Masuk
*(isi kata sandi yang salah, tangkap pesan galatnya)*

Halaman masuk diimplementasikan sesuai rancangan: sisi kiri memuat identitas
sistem, sisi kanan memuat isian nama pengguna dan kata sandi. Saat tombol Masuk
ditekan, kata sandi dikirim ke server, dibandingkan dengan sandi tersandi bcrypt
yang tersimpan, lalu server membalas token yang berlaku 12 jam. Bila nama pengguna
atau kata sandi salah, sistem menampilkan satu pesan yang sama untuk kedua keadaan
sehingga tidak memberi petunjuk kepada penebak akun. Percobaan masuk yang berulang
kali gagal dibatasi, baik menurut akun maupun menurut alamat jaringan pengaksesnya.

#### b. Dasbor Monitoring

**[TANGKAPAN LAYAR SS-04]** Gambar …: Dasbor Monitoring Bagian Penyaring dan Daftar
Kegiatan
*(masuk sebagai Ketua Tim, tangkap bagian atas dasbor: penyaring dan kartu kegiatan
dengan status berbeda-beda, usahakan ada satu kartu berlabel peringatan)*

**[TANGKAPAN LAYAR SS-05]** Gambar …: Grafik Ringkasan pada Dasbor
*(gulir ke bawah, tangkap empat sampai delapan grafik)*

**[TANGKAPAN LAYAR SS-06]** Gambar …: Panel Pembaruan Progres Mitra oleh PML
*(masuk sebagai PML, tangkap panel progres beserta isian tiap status)*

Dasbor menjadi halaman pertama setelah pengguna masuk. Daftar kegiatan ditampilkan
sebagai kartu yang memuat batang kemajuan dan label status. Kegiatan yang memiliki
masalah — tenggat tahap terlewat atau progres tidak diperbarui lebih dari dua hari —
diberi label peringatan sehingga terlihat tanpa perlu membuka rinciannya.

Delapan grafik ringkasan ditampilkan di bagian bawah: sebaran kegiatan per status,
jumlah kegiatan per tim, corong progres pendataan, corong progres pengolahan,
kegiatan paling tertinggal, antrean dokumen yang menunggu pemeriksaan, honor per
tim, dan beban mitra per PML. Dua grafik terakhir menjawab kebutuhan mengetahui tim
dan PML mana yang bebannya paling berat.

Panel pembaruan progres hanya muncul bagi PML. Panel itu menampilkan seluruh mitra
yang diawasi dari berbagai kegiatan sekaligus, sehingga PML tidak perlu membuka
halaman kegiatan satu per satu. Sistem menolak simpanan bila jumlah seluruh status
melebihi beban kerja mitra.

#### c. Halaman Input dan Sunting Kegiatan

**[TANGKAPAN LAYAR SS-07]** Gambar …: Halaman Input Kegiatan — Tab Info Dasar dan
Jadwal
*(tangkap formulir yang sudah terisi contoh, termasuk kotak centang tahap opsional)*

**[TANGKAPAN LAYAR SS-08]** Gambar …: Halaman Input Kegiatan — Tab Alokasi Mitra
*(tangkap beberapa baris alokasi lengkap dengan PML, beban kerja, dan honor yang
terisi otomatis)*

**[TANGKAPAN LAYAR SS-09]** Gambar …: Pembagian Honor Lintas Bulan
*(buat alokasi dengan periode honor melintasi dua bulan, tangkap pilihan pembebanan
beserta rincian muatan per bulannya)*

**[TANGKAPAN LAYAR SS-10]** Gambar …: Peringatan Batas Honor Bulanan
*(alokasikan mitra yang honornya melebihi batas, tangkap jendela peringatannya)*

**[TANGKAPAN LAYAR SS-11]** Gambar …: Halaman Sunting Kegiatan dan Panel Riwayat
*(buka kegiatan yang sudah pernah diubah, tangkap panel riwayat kegiatan)*

Formulir kegiatan diimplementasikan dalam tiga tab sesuai rancangan. Honor terisi
otomatis begitu beban kerja dan harga satuan diisi, sehingga tidak ada perhitungan
manual. Mitra dipilih melalui tombol Pilih dari Daftar PPL, yang
membuka daftar mitra aktif sesuai posisi tahapnya dan dapat disaring menurut
kecamatan dan desa, sehingga Ketua Tim tidak perlu menelusuri daftar mitra satu
per satu untuk menemukan mitra di sekitar wilayah tugas. Bila periode honor melintasi dua bulan, muncul pilihan pembebanan beserta
rincian muatan dan honor setiap bulan, sehingga pengguna dapat memastikan
pembagiannya sebelum menyimpan.

Peringatan batas honor muncul setelah tombol simpan ditekan dan memuat nama mitra,
bulan, total honor, serta batasnya. Peringatan ini adalah wujud dari pencegahan
kelebihan SBM yang sebelumnya hanya dapat diketahui dengan memeriksa berkas
pengecekan secara manual.

Halaman sunting memakai susunan yang sama dengan halaman input, ditambah panel
riwayat kegiatan yang mencatat siapa mengubah apa dan kapan. Pembuat kegiatan masih
dapat membatalkan penyimpanan kegiatan yang baru saja dibuat, tetapi hanya
melalui tombol pada jendela konfirmasi yang tampil sesaat (sekitar 6 detik) sebelum
jendela itu otomatis tertutup dan berpindah ke dasbor. Setelah jendela tertutup,
tidak ada cara lain di tampilan untuk membatalkan penyimpanan tersebut.

#### d. Halaman Dokumen Kegiatan

**[TANGKAPAN LAYAR SS-12]** Gambar …: Halaman Dokumen Kegiatan
*(tangkap tabel dokumen dengan status berbeda: Approved, Pending, dan Rejected)*

**[TANGKAPAN LAYAR SS-13]** Gambar …: Jendela Pengisian Tautan Dokumen
*(tangkap jendela isi tautan)*

**[TANGKAPAN LAYAR SS-14]** Gambar …: Jendela Penolakan Dokumen dengan Catatan
*(masuk sebagai Tim Keuangan, tangkap jendela penolakan beserta catatan revisi)*

Dokumen kegiatan dikumpulkan per tahap dan disimpan sebagai tautan ke penyimpanan
instansi. Tim Keuangan dapat menyetujui dokumen satu per satu atau seluruh tahap
sekaligus, menolak dokumen disertai catatan revisi, serta mengirim pengingat untuk
dokumen yang belum diisi. Catatan penolakan langsung muncul sebagai notifikasi bagi
Ketua Tim, sehingga penyampaian revisi tidak lagi bergantung pada pesan pribadi.

#### e. Halaman Manajemen Honor

**[TANGKAPAN LAYAR SS-15]** Gambar …: Halaman Manajemen Honor
*(pilih satu bulan yang datanya ramai, tangkap kartu ringkasan dan tabel honor;
usahakan ada satu mitra berstatus melebihi batas)*

**[TANGKAPAN LAYAR SS-16]** Gambar …: Hasil Unduhan Rekap Honor
*(unduh rekap PDF, buka berkasnya, tangkap halaman pertamanya)*

Halaman ini menampilkan akumulasi honor tiap mitra pada periode terpilih dari
seluruh kegiatan. Sebelum ada sistem, angka ini harus dijumlahkan sendiri dari
beberapa berkas. Kolom puncak bulanan terhadap batas dan sisa pagu memudahkan Tim
Keuangan menilai apakah seorang mitra masih dapat diberi pekerjaan tambahan pada
bulan yang sama. Nilai batas honor hanya dapat diubah Tim Keuangan dan Admin.

#### f. Halaman Daftar PPL dan Daftar PML

**[TANGKAPAN LAYAR SS-17]** Gambar …: Halaman Daftar PPL dengan Penyaring Kecamatan
dan Desa
*(pilih satu kecamatan, tangkap tabel hasil penyaringannya)*

**[TANGKAPAN LAYAR SS-17b]** Gambar …: Halaman Daftar PPL dalam Mode Pemilihan Mitra
*(buka formulir alokasi, tekan Pilih dari Daftar PPL, pilih satu kecamatan dan
desa, centang dua mitra; usahakan terlihat satu mitra redup karena sudah
dialokasikan)*

**[TANGKAPAN LAYAR SS-18]** Gambar …: Halaman Daftar PML
*(tangkap tabel PML beserta jumlah mitra dan muatan yang diawasi)*

Penyaring kecamatan dan desa pada halaman Daftar PPL menjawab kebutuhan pemilihan
mitra berdasarkan wilayah. Halaman ini juga dapat dibuka dari formulir alokasi
melalui tombol Pilih dari Daftar PPL. Dalam mode pemilihan itu hanya mitra yang
posisinya sesuai tahap yang tampil, mitra yang sudah dialokasikan tidak dapat
dipilih lagi, dan beberapa mitra dapat dicentang sekaligus lalu langsung masuk ke
baris alokasi. Kolom jumlah kegiatan pada kedua halaman
memperlihatkan sebaran beban kerja antar-mitra dan antar-PML. Kedua daftar dapat
diekspor ke Excel.

#### g. Halaman Penilaian Mitra dan Rekap Penilaian

**[TANGKAPAN LAYAR SS-19]** Gambar …: Halaman Penilaian Mitra
*(masuk sebagai PML, tangkap daftar penilaian; usahakan terlihat baris mitra sendiri
yang bertombol Beri Nilai dan baris mitra PML lain yang tidak bertombol)*

**[TANGKAPAN LAYAR SS-20]** Gambar …: Jendela Pengisian Nilai Mitra
*(tangkap jendela penilaian dengan tiga aspek dan rata-rata otomatis)*

**[TANGKAPAN LAYAR SS-21]** Gambar …: Halaman Rekap Penilaian Triwulanan
*(pilih satu triwulan, tangkap tabel peringkat mitra)*

Penilaian mitra hanya dapat diisi PML yang mengawasi mitra tersebut. Pembatasan itu
diterapkan di antarmuka dan di server sekaligus, sehingga tidak dapat ditembus
dengan mengubah tampilan di peramban. Rekap penilaian menyusun peringkat mitra per
triwulan secara otomatis, menggantikan perhitungan manual yang sebelumnya dilakukan
tiap akhir triwulan.

#### h. Halaman Generate Surat, Template Surat, dan Riwayat Penyuratan

**[TANGKAPAN LAYAR SS-22]** Gambar …: Halaman Generate Surat — Tab Uraian Tugas dan
Kode Beban Anggaran

**[TANGKAPAN LAYAR SS-23]** Gambar …: Halaman Generate Surat — Tab Pembuatan SPK
*(tangkap daftar mitra beserta nomor SPK yang sudah terbit dan yang belum)*

**[TANGKAPAN LAYAR SS-24]** Gambar …: Hasil Surat Perjanjian Kerja dalam Bentuk PDF
*(unduh satu SPK, buka berkasnya, tangkap halaman pertama; samarkan nama dan NIK
mitra)*

**[TANGKAPAN LAYAR SS-25]** Gambar …: Hasil BAST dalam Bentuk PDF
*(sama seperti di atas untuk BAST)*

**[TANGKAPAN LAYAR SS-26]** Gambar …: Halaman Template Surat

**[TANGKAPAN LAYAR SS-27]** Gambar …: Halaman Riwayat Penyuratan
*(tangkap tabel yang memuat surat aktif, surat batal, dan nomor kosong sekaligus)*

**[TANGKAPAN LAYAR SS-28]** Gambar …: Jendela Pratinjau Pengaturan Ulang Nomor Surat
*(tangkap jendela yang menampilkan nomor lama dan nomor baru beserta isian frasa
konfirmasi)*

Modul penyuratan adalah bagian yang paling banyak menggantikan pekerjaan manual.
Sebelum ada sistem, SPK dan BAST diketik dan dinomori satu per satu. Pada sistem
ini, Tim Keuangan cukup memilih periode, mengisi uraian tugas dan kode beban
anggaran per kegiatan, lalu seluruh SPK satu periode dapat dibuat sekaligus.

Satu mitra memperoleh satu SPK per bulan meskipun bekerja pada beberapa kegiatan,
dan nomor BAST mengikuti nomor urut SPK mitra yang sama. Halaman riwayat penyuratan
menampilkan seluruh surat satu tahun beserta surat batal dan nomor kosong, sehingga
urutan penomoran dapat dipertanggungjawabkan. Surat yang datanya berubah setelah
terbit dapat diperbarui isinya tanpa mengganti nomornya.

#### i. Halaman Manajemen Admin dan Impor Mitra

**[TANGKAPAN LAYAR SS-29]** Gambar …: Halaman Manajemen Admin — Tab Pengguna
*(samarkan nama pegawai bila perlu)*

**[TANGKAPAN LAYAR SS-30]** Gambar …: Jendela Impor Mitra — Pemetaan Kolom Excel
SOBAT

**[TANGKAPAN LAYAR SS-31]** Gambar …: Jendela Impor Mitra — Pratinjau Hasil Impor
*(tangkap ringkasan jumlah baris yang akan ditambah, diperbarui, dilewati, dan
dinonaktifkan)*

Halaman Manajemen Admin memuat pengelolaan akun pengguna, ketua tim, dan mitra.
Impor mitra dari berkas Excel SOBAT dikerjakan bertahap dengan pratinjau sebelum
diterapkan. Pratinjau tidak mengubah apa pun di basis data, dan impor dijalankan
dalam satu transaksi. Mitra yang sudah tidak aktif dinonaktifkan, bukan dihapus,
sehingga honor, surat, dan penilaian lamanya tetap tersimpan.

#### j. Halaman Profil, Notifikasi, dan Pencarian Global

**[TANGKAPAN LAYAR SS-32]** Gambar …: Halaman Profil dan Penggantian Kata Sandi

**[TANGKAPAN LAYAR SS-33]** Gambar …: Panel Notifikasi Ketua Tim
*(usahakan terlihat beberapa jenis notifikasi sekaligus: tenggat, dokumen ditolak,
dan progres mandek)*

**[TANGKAPAN LAYAR SS-34]** Gambar …: Panel Notifikasi Tim Keuangan
*(tangkap notifikasi dokumen menunggu persetujuan dan surat yang isinya berubah)*

**[TANGKAPAN LAYAR SS-35]** Gambar …: Pencarian Global

**[TANGKAPAN LAYAR SS-36]** Gambar …: Tampilan Tema Gelap
*(opsional; tangkap satu halaman yang sama dalam tema gelap sebagai bukti KNF-03)*

Halaman profil hanya menyediakan penggantian kata sandi; nama dan peran hanya dapat
diubah Admin. Setelah kata sandi diganti, seluruh sesi lama akun tersebut dicabut
sehingga perangkat lain yang masih terbuka harus masuk kembali.

Panel notifikasi menampilkan pemberitahuan yang berbeda menurut peran pengguna dan
hilang sendiri setelah penyebabnya diselesaikan. Fitur ini menggantikan penyampaian
pengingat melalui pesan pribadi, sekaligus menjadi jalur komunikasi Tim Keuangan
kepada Ketua Tim mengenai dokumen yang belum lengkap.

### 5.1.6 Perubahan Rancangan Selama Implementasi

Sesuai *feedback loop* pada Modified Waterfall, terdapat beberapa perubahan
rancangan yang muncul setelah sistem dicoba oleh pegawai. *(Sesuaikan daftar ini
dengan catatan magang Anda; empat contoh di bawah adalah perubahan yang benar-benar
terjadi pada sistem.)*

**Tabel …: Perubahan Rancangan Berdasarkan Umpan Balik Pengguna**

| No | Rancangan Awal | Umpan Balik | Hasil Perubahan |
| --- | --- | --- | --- |
| 1 | Sistem menolak penyimpanan bila honor mitra melebihi batas SBM | Ada keadaan tertentu yang memang harus dilewatkan dengan sepengetahuan Tim Keuangan | Sistem menampilkan peringatan berisi rincian mitra dan bulannya, lalu meminta konfirmasi, bukan menolak |
| 2 | Honor lintas bulan dibagi dalam rupiah | Pembagian harus mengikuti muatan pekerjaan agar sesuai isi surat | Yang dibagi adalah muatan, dan honor tiap bulan dihitung ulang sebesar muatan dikali harga satuan |
| 3 | Nilai batas honor bulanan hanya dapat diubah Admin | Yang memantau batas honor sehari-hari adalah Tim Keuangan | Hak mengubah batas honor diberikan kepada Tim Keuangan dan Admin |
| 4 | Progres mitra diperbarui dari halaman kegiatan | PML mengawasi mitra pada beberapa kegiatan sekaligus | Ditambahkan panel pembaruan progres di dasbor yang memuat seluruh mitra yang diawasi |

---

## Daftar Tangkapan Layar yang Harus Disiapkan

| Kode | Isi | Peran yang Dipakai |
| --- | --- | --- |
| SS-01 | Daftar 18 tabel di phpMyAdmin | — |
| SS-02, SS-03 | Halaman masuk dan pesan galat | — |
| SS-04, SS-05 | Dasbor: kegiatan dan grafik | Ketua Tim |
| SS-06 | Panel pembaruan progres | PML |
| SS-07 – SS-10 | Input kegiatan, alokasi, pembebanan lintas bulan, peringatan SBM | Ketua Tim |
| SS-11 | Sunting kegiatan dan riwayat | Ketua Tim |
| SS-12 – SS-14 | Dokumen kegiatan dan verifikasinya | Ketua Tim dan Tim Keuangan |
| SS-15, SS-16 | Manajemen honor dan hasil unduhannya | Tim Keuangan |
| SS-17, SS-17b, SS-18 | Daftar PPL, mode pemilihan mitra, dan Daftar PML | Pegawai / Ketua Tim |
| SS-19 – SS-21 | Penilaian mitra dan rekap triwulan | PML |
| SS-22 – SS-28 | Generate surat, hasil PDF, template, dan riwayat penyuratan | Tim Keuangan |
| SS-29 – SS-31 | Manajemen admin dan impor mitra | Admin |
| SS-32 – SS-36 | Profil, notifikasi, pencarian global, tema gelap | Beberapa peran |

**Catatan penting sebelum mengambil gambar:** ganti nama mitra, NIK, dan nomor
telepon dengan data contoh. Buku skripsi akan dibaca banyak orang, sedangkan data
mitra adalah data pribadi.
