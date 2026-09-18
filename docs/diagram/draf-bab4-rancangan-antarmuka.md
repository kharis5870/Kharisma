# Draf Bab IV — 4.2.4 Rancangan Antarmuka

Dokumen ini berisi draf lengkap subbab **4.2.4 Rancangan Antarmuka** untuk Bab IV.
Isinya dipisahkan dari `draf-revisi-bab4.md` agar mudah dikerjakan sendiri. Gambar
wireframe-nya sudah tersedia di `docs/diagram/15-wireframe.drawio` dan tinggal
diekspor.

**Cara memakai dokumen ini**

1. **Wireframe-nya sudah dibuatkan** di `docs/diagram/15-wireframe.drawio`, satu
   halaman draw.io untuk setiap kode W. Buka dengan ekstensi Draw.io Integration di
   VS Code, lalu ekspor tiap halaman ke PNG (File → Export as → PNG, centang
   _Selection Only_ tidak perlu, pakai zoom 200% agar tajam saat dicetak).
2. Setiap tempat gambar ditandai dengan blok `[WIREFRAME W-xx] …`. Ganti blok itu
   dengan gambar hasil ekspor beserta keterangan gambarnya. Sketsa teks di bawah
   tiap penanda adalah salinan susunan yang sama; ia tidak perlu dimasukkan ke buku
   dan hanya berguna bila Anda ingin mengubah susunannya sendiri.
3. Nomor gambar (Gambar 20, 21, …) menyesuaikan gambar terakhir di Bab IV Anda.
   Di dokumen ini dipakai kode W-01 sampai W-17 sebagai pengganti sementara;
   W-16 terdiri atas dua gambar (W-16a dan W-16b) sehingga jumlah gambarnya 18.
4. Bahasa sudah disesuaikan dengan catatan seminar proposal: langsung ke inti,
   istilah asing seperlunya, dan setiap elemen dijelaskan fungsinya, bukan sekadar
   disebut namanya.

---

## Catatan penempatan activity diagram

Pada skripsi rujukan, activity diagram diselipkan di dalam subbab rancangan
antarmuka. Untuk skripsi Anda, penempatan itu **tidak disarankan** karena dua hal.

Pertama, metode yang Anda pakai adalah Modified Waterfall dengan tahap analisis,
perancangan, implementasi, dan pengujian. Rancangan proses (activity diagram) dan
rancangan tampilan (wireframe) adalah dua keluaran yang berbeda pada tahap
perancangan: yang satu menggambarkan urutan kerja pengguna dan sistem, yang lain
menggambarkan susunan layar. Menggabungkannya membuat batas keduanya kabur.

Kedua, jumlah activity diagram Anda ada delapan dan beberapa di antaranya
melibatkan lebih dari satu halaman, misalnya alur pembuatan SPK dan BAST yang
menyentuh halaman Template Surat, Generate Surat, dan Riwayat Penyuratan. Bila
diselipkan per halaman, satu diagram harus dipotong atau diulang.

**Susunan yang disarankan untuk Bab IV:**

| Subbab | Isi                                                            |
| ------ | -------------------------------------------------------------- |
| 4.2.1  | Proses Bisnis Sistem Usulan                                    |
| 4.2.2  | Use Case Diagram + tabel definisi aktor dan deskripsi use case |
| 4.2.3  | **Activity Diagram** (delapan diagram, satu per proses utama)  |
| 4.2.4  | Rancangan Basis Data (ERD + struktur tabel)                    |
| 4.2.5  | **Rancangan Antarmuka** (isi dokumen ini)                      |

Bila penomoran subbab Anda sekarang sudah terlanjur 4.2.3 Rancangan Basis Data dan
4.2.4 Rancangan Antarmuka, cukup sisipkan Activity Diagram sebagai subbab baru
sebelum rancangan basis data dan geser nomornya. Sebagai jalan tengah, pada pembuka
setiap rancangan halaman ditambahkan satu kalimat rujukan silang, misalnya
"Rancangan alur kerja halaman ini telah dijelaskan pada Gambar 12 (Activity Diagram
Alokasi Mitra dan Validasi Batas SBM)". Dengan begitu pembaca tetap terbantu tanpa
mengulang gambar. Kalimat rujukan itu sudah disiapkan di tiap halaman di bawah ini.

---

## 4.2.4 Rancangan Antarmuka

Rancangan antarmuka disusun dalam bentuk _wireframe_, yaitu kerangka tampilan yang
hanya memuat susunan dan fungsi tiap bagian layar tanpa warna dan gambar
sebenarnya. Bentuk ini dipilih agar pembahasan pada tahap perancangan terfokus pada
kelengkapan informasi dan alur kerja pengguna, bukan pada pilihan warna atau jenis
huruf. Rancangan ini menjadi acuan saat implementasi pada Bab V, dan setiap
perubahan yang muncul dari umpan balik pegawai BPS Kabupaten Bengkulu Selatan
dikembalikan lagi ke rancangan ini sesuai sifat _feedback loop_ pada metode
Modified Waterfall.

Seluruh rancangan dibuat untuk tampilan layar komputer (lebar 1366 piksel ke atas),
karena sistem digunakan di lingkungan kantor. Meski demikian, susunan kolom dibuat
luwes sehingga tetap terbaca saat dibuka melalui layar yang lebih kecil.

Terdapat delapan belas gambar rancangan yang dikelompokkan menjadi lima bagian: halaman
masuk, halaman pemantauan, halaman pengelolaan kegiatan, halaman keuangan dan
penyuratan, serta halaman data master dan akun.

### 4.2.4.1 Kerangka Umum Tampilan

Seluruh halaman setelah pengguna masuk memakai satu kerangka yang sama, sehingga
pengguna tidak perlu menyesuaikan diri setiap berpindah halaman.

**[WIREFRAME W-01]** Gambar …: Rancangan Kerangka Umum Tampilan

```
+---------------------------------------------------------------------------+
| [=] OPTIMA      [ Pencarian global............ ]   [tema] [lonceng] [akun] |  <- Header
+--------+------------------------------------------------------------------+
| Dasbor |                                                                   |
| Daftar>|   JUDUL HALAMAN                                                   |
| Honor  |   Keterangan singkat halaman                                      |
| Nilai  |                                                                   |
| Surat >|   +-----------------------------------------------------------+   |
| Admin  |   |  Area isi halaman (kartu, tabel, formulir, grafik)        |   |
|        |   +-----------------------------------------------------------+   |
| [+ Input Kegiatan ]                                                        |
+--------+------------------------------------------------------------------+
|                    Footer: nama instansi dan tahun                         |
+---------------------------------------------------------------------------+
```

Bagian kerangka umum:

1. **Bilah sisi (menu kiri).** Memuat tautan Dasbor, Daftar (berisi Daftar PPL dan
   Daftar PML), Manajemen Honor, Penilaian Mitra, Keuangan (berisi Generate Surat,
   Template Surat, dan Riwayat Penyuratan), serta Manajemen Admin. Menu Manajemen
   Admin hanya muncul bagi Admin. Bilah sisi dapat dikuncupkan menjadi ikon saja
   agar area isi lebih lega. Di bagian bawah terdapat tombol **Input Kegiatan**
   yang sengaja dibedakan warnanya karena merupakan aksi yang paling sering
   dipakai.
2. **Bilah atas (header).** Memuat kotak pencarian global, penukar tema terang dan
   gelap, lonceng notifikasi beserta jumlah notifikasi yang belum dibaca, dan menu
   akun berisi tautan Profil dan Keluar.
3. **Area isi.** Diawali judul halaman dan keterangan singkat, lalu kartu ringkasan
   (bila ada), penyaring data, dan isi utama berupa tabel, formulir, atau grafik.
4. **Jendela sembul (modal).** Dipakai untuk aksi yang butuh ketelitian, misalnya
   konfirmasi penghapusan, pengisian tautan dokumen, dan penilaian mitra. Jendela
   sembul dipilih agar pengguna tidak kehilangan konteks halaman di belakangnya.
5. **Pesan singkat (toast).** Muncul di sudut layar untuk memberi tahu hasil suatu
   aksi, misalnya "Kegiatan berhasil disimpan", lalu hilang sendiri.

Tiga pola dipakai berulang pada hampir semua halaman dan tidak diulang
penjelasannya pada rancangan berikutnya:

- **Pola tabel data:** kotak pencarian di kanan atas tabel, judul kolom yang dapat
  diklik untuk mengurutkan data, dan penomoran halaman di bawah tabel.
- **Pola penyaring:** deretan kotak pilihan (periode, tim, status, wilayah) yang
  langsung mengubah isi tabel tanpa perlu menekan tombol cari.
- **Pola konfirmasi:** setiap aksi yang tidak dapat dibatalkan memunculkan jendela
  konfirmasi yang menyebutkan akibat tindakan secara jelas.

### 4.2.4.2 Rancangan Halaman Masuk

**[WIREFRAME W-02]** Gambar …: Rancangan Halaman Masuk

```
+------------------------------+-------------------------------+
|                              |                               |
|        Kharisma.             |   Masuk ke Sistem             |
|   Sistem administrasi dan    |   Username [................] |
|   pemantauan mitra statistik |   Password [..........] [mata]|
|                              |   ( pesan galat bila salah )  |
|        [ ilustrasi ]         |   [        Masuk        ]     |
|                              |                               |
+------------------------------+-------------------------------+
```

Halaman ini adalah satu-satunya halaman yang dapat dibuka tanpa masuk. Layar dibagi
dua: sisi kiri memuat identitas sistem, sisi kanan memuat formulir dengan isian
nama pengguna dan kata sandi. Ikon mata pada isian kata sandi dipakai untuk
menampilkan atau menyembunyikan karakter yang diketik, karena kesalahan ketik kata
sandi adalah penyebab gagal masuk yang paling sering.

Bila nama pengguna atau kata sandi salah, sistem menampilkan satu pesan yang sama
tanpa menyebut bagian mana yang salah, agar tidak memberi petunjuk kepada pihak
yang mencoba menebak akun. Bila percobaan masuk terlalu sering gagal, sistem
menampilkan pesan bahwa pengguna harus menunggu beberapa saat sebelum mencoba lagi.
_(Terkait KF-01 dan KNF-01.)_

### 4.2.4.3 Rancangan Halaman Dasbor Monitoring

Rancangan alur kerja halaman ini mengikuti Activity Diagram Proses Bisnis Sistem
Usulan dan Activity Diagram Input Progres Mitra.

**[WIREFRAME W-03]** Gambar …: Rancangan Halaman Dasbor Monitoring

```
+---------------------------------------------------------------------------+
| Dashboard Monitoring                                                       |
| Pantau progres dan kelola semua kegiatan                                   |
+---------------------------------------------------------------------------+
| [Cari kegiatan...] [Tipe Progres v] [Tahap v] [Status v] [Tim v]           |
+---------------------------------------------------------------------------+
| +------------------+ +------------------+ +------------------+            |
| | Nama Kegiatan    | | Nama Kegiatan    | | Nama Kegiatan    |            |
| | Ketua: ...       | | Ketua: ...       | | Ketua: ...       |            |
| | [====== 60% ]    | | [=== 25% ]       | | [======== 90%]   |            |
| | [Berjalan]       | | [Warning]        | | [Selesai]        |            |
| | [Detail][Dokumen]| | [Detail][Dokumen]| | [Detail][Dokumen]|            |
| +------------------+ +------------------+ +------------------+            |
+---------------------------------------------------------------------------+
| Panel Update Progres (hanya PML)                                           |
| [ Listing ] [ Pencacahan ] [ Pengolahan ]      [Cari nama mitra]           |
| Budi S.  target 120 | open [ ] submit [ ] diperiksa [ ] approved [ ]       |
|                                               [ Simpan Progress ]         |
+---------------------------------------------------------------------------+
| GRAFIK: Kegiatan per Status | Kegiatan per Tim | Corong Progres Pendataan  |
|         Corong Progres Pengolahan | Kegiatan Paling Tertinggal            |
|         Antrean Pemeriksaan | Honor per Tim | Beban Mitra per PML          |
+---------------------------------------------------------------------------+
```

Dasbor adalah halaman pertama setelah pengguna masuk dan berfungsi sebagai pusat
pemantauan. Susunannya dibagi empat lapis.

Lapis pertama adalah penyaring: pencarian nama kegiatan, tipe progres (pendataan
atau pengolahan), tahap progres (_listing_, pencacahan, atau pengolahan), status
kegiatan, dan tim penanggung jawab. Penyaring diletakkan paling atas karena jumlah
kegiatan dalam satu tahun cukup banyak sehingga pengguna hampir selalu menyaring
lebih dulu.

Lapis kedua adalah daftar kegiatan dalam bentuk kartu. Setiap kartu memuat nama
kegiatan, nama ketua tim, batang kemajuan, label status, dan tombol menuju rincian
kegiatan serta dokumen kegiatan. Kartu diberi label peringatan bila kegiatan
memiliki masalah, misalnya tenggat tahap yang terlewat atau progres yang tidak
diperbarui lebih dari dua hari. Bentuk kartu dipilih daripada tabel karena setiap
kegiatan perlu menampilkan batang kemajuan yang sulit dibaca dalam sel tabel.

Lapis ketiga adalah panel pembaruan progres yang hanya muncul bagi PML. Panel itu
berisi tab tahap, daftar mitra yang diawasi, isian jumlah setiap status, dan tombol
simpan. Panel diletakkan di dasbor agar PML dapat memperbarui progres seluruh
mitranya tanpa membuka halaman kegiatan satu per satu. Jumlah seluruh status tidak
boleh melebihi beban kerja mitra, dan sistem menolak simpanan yang melanggar
batasan itu.

Lapis keempat adalah delapan grafik ringkasan: sebaran kegiatan per status, jumlah
kegiatan per tim, corong progres pendataan, corong progres pengolahan (berganti
menjadi sebaran dokumen per status bila tidak ada kegiatan pengolahan), kegiatan
paling tertinggal, antrean dokumen yang menunggu pemeriksaan, honor per tim, dan
beban mitra per PML. Grafik diletakkan paling bawah agar pengguna yang hanya ingin
bekerja pada satu kegiatan tidak perlu melewatinya lebih dulu. _(Terkait KF-07 dan
KF-13.)_

### 4.2.4.4 Rancangan Halaman Input Kegiatan

Rancangan alur kerja halaman ini mengikuti Activity Diagram Alokasi Mitra dan
Validasi Batas SBM.

**[WIREFRAME W-04]** Gambar …: Rancangan Halaman Input Kegiatan, Tab Info Dasar dan
Jadwal

```
+---------------------------------------------------------------------------+
| Input Kegiatan                                                             |
| [ Info Dasar & Jadwal ] [ Alokasi PPL ] [ Dokumen ]                        |
+---------------------------------------------------------------------------+
| Informasi Kegiatan                                                         |
|  Nama Kegiatan *      [......................]                             |
|  Nama Ketua Tim *     [ pilih ketua tim    v ]                             |
|  Deskripsi Kegiatan   [......................]                             |
+---------------------------------------------------------------------------+
| Jadwal Kegiatan *        [ ] Ada Pengolahan    [ ] Ada Diseminasi          |
|  Persiapan              [ tgl mulai - tgl selesai ]                        |
|  Pengumpulan Data       [ tgl mulai - tgl selesai ]                        |
|  Pengolahan & Analisis  [ tgl mulai - tgl selesai ]                        |
|  Diseminasi & Evaluasi  [ tgl mulai - tgl selesai ]                        |
+---------------------------------------------------------------------------+
|                                   [ Batal ]  [ Simpan Kegiatan ]           |
+---------------------------------------------------------------------------+
```

Halaman ini dipakai seluruh pegawai untuk membuat kegiatan baru. Karena isian yang
dibutuhkan cukup banyak, formulir dipecah menjadi tiga tab agar tidak menjadi satu
halaman panjang yang melelahkan: **Info Dasar & Jadwal**, **Alokasi PPL**, dan
**Dokumen**. Pengguna dapat berpindah tab tanpa kehilangan isian yang sudah
dimasukkan.

Tab Info Dasar & Jadwal memuat nama kegiatan, ketua tim, deskripsi, dan jadwal
empat tahap. Tahap Pengolahan & Analisis serta Diseminasi & Evaluasi dapat dimatikan
melalui kotak centang, karena tidak semua kegiatan memiliki kedua tahap itu; tahap
yang dimatikan hilang dari jadwal maupun dari daftar dokumen wajibnya. Isian tanggal memakai pemilih
rentang tanggal, bukan dua isian terpisah, agar tanggal selesai tidak mungkin
mendahului tanggal mulai.

**[WIREFRAME W-05]** Gambar …: Rancangan Tab Alokasi Mitra dan Pembebanan Honor

```
+---------------------------------------------------------------------------+
| [ Listing ] [ Pencacahan ] [ Pengolahan ]                                  |
+---------------------------------------------------------------------------+
| Periode honor tahap ini: [ tgl mulai - tgl selesai ]                       |
| Harga satuan: [ Rp .......... ]                                            |
+---------------------------------------------------------------------------+
| Mitra 1  [ pilih mitra aktif     v ]  [ pilih PML  v ]                     |
|          Beban kerja [ 120 ]  Honor: Rp 1.200.000 (terisi otomatis)        |
|          Pembebanan Honor [ Seluruhnya Agustus / Dibagi per hari / Luber ] |
|          -> Agustus: 80 muatan (Rp 800.000) | September: 40 (Rp 400.000)   |
|          [ hapus baris ]                                                   |
| [ + Tambah Mitra ]   [ Pilih dari Daftar PPL ]                            |
+---------------------------------------------------------------------------+
| Ringkasan: 12 mitra, total honor Rp 14.400.000                             |
+---------------------------------------------------------------------------+
```

Tab Alokasi PPL dipecah lagi menurut tahap pekerjaan, karena harga satuan dan
periode honor tiap tahap berbeda. Setiap baris alokasi memuat nama mitra, PML
pengawas, beban kerja, dan honor yang terisi otomatis sebesar beban kerja dikali
harga satuan sehingga tidak perlu dihitung manual. Daftar pilihan mitra hanya memuat
mitra berstatus aktif, sehingga mitra yang sudah berhenti tidak dapat dialokasikan
lagi. Untuk memilih mitra, disediakan tombol **Pilih dari Daftar PPL** yang membuka
halaman Daftar PPL dalam mode pemilihan. Pada mode ini halaman tersebut hanya
menampilkan mitra yang posisinya sesuai tahap (pendataan atau pengolahan),
menyediakan penyaring kecamatan dan desa, menampilkan jumlah kegiatan yang sedang
diikuti tiap mitra, dan menonaktifkan mitra yang sudah dialokasikan pada tahap
itu. Ketua Tim dapat mencentang beberapa mitra sekaligus, lalu mitra terpilih
langsung masuk ke baris alokasi. Dengan rancangan ini, mitra yang tinggal di
sekitar wilayah tugas dan belum banyak menanggung kegiatan dapat ditemukan tanpa
menelusuri daftar mitra satu per satu.

Bila periode honor suatu tahap melintasi lebih dari satu bulan, muncul pilihan
**Pembebanan Honor** dengan tiga cara: seluruhnya dibebankan ke satu bulan, dibagi
menurut jumlah hari, atau luber, yaitu bulan pertama diisi sampai batas lalu
sisanya dipindahkan ke bulan berikutnya. Yang dibagi adalah muatan pekerjaannya,
dan honor tiap bulan tetap dihitung sebesar muatan dikali harga satuan. Rincian
pembagian per bulan ditampilkan langsung di bawah pilihan agar pengguna dapat
memastikan hasilnya sebelum menyimpan.

**[WIREFRAME W-06]** Gambar …: Rancangan Jendela Peringatan Batas Honor Bulanan

```
+-----------------------------------------------------+
|  Peringatan Batas Honor Bulanan                      |
|  Honor beberapa mitra melebihi batas SBM:            |
|   - Budi Santoso, Agustus 2026                       |
|     Total Rp 3.400.000 dari batas Rp 3.000.000       |
|   - Siti Aminah, Agustus 2026                        |
|     Total Rp 3.150.000 dari batas Rp 3.000.000       |
|  Simpan tetap dilanjutkan?                           |
|                    [ Periksa Lagi ]  [ Tetap Simpan ]|
+-----------------------------------------------------+
```

Saat tombol simpan ditekan, sistem menjumlahkan honor tiap mitra pada bulan yang
bersangkutan dari seluruh kegiatan, termasuk kegiatan tim lain, lalu
membandingkannya dengan batas honor bulanan. Bila ada yang melebihi, muncul jendela
peringatan yang menyebutkan nama mitra, bulan, total honor, dan batasnya.

Peringatan ini sengaja tidak menolak penyimpanan, karena dalam praktik ada keadaan
tertentu yang memang harus dilewatkan dengan sepengetahuan Tim Keuangan. Yang
dicegah adalah kelebihan yang terjadi tanpa disadari, yaitu keadaan yang sebelumnya
baru ketahuan setelah honor dihitung ulang secara manual. _(Terkait KF-04, KF-05,
dan KF-06.)_

### 4.2.4.5 Rancangan Halaman Sunting Kegiatan

**[WIREFRAME W-07]** Gambar …: Rancangan Halaman Sunting Kegiatan

```
+---------------------------------------------------------------------------+
| Sunting Kegiatan: Susenas Maret 2026            [ Riwayat Kegiatan ]       |
| [ Info Dasar & Jadwal ] [ Alokasi PPL ] [ Dokumen ]                        |
+---------------------------------------------------------------------------+
| ... isian sama dengan halaman Input Kegiatan, sudah terisi data lama ...   |
+---------------------------------------------------------------------------+
| Catatan Kegiatan                                    [ + Tambah Catatan ]   |
|  - 12 Agu 2026, Ketua Tim: "Mitra A diganti karena sakit"   [ubah][hapus]  |
+---------------------------------------------------------------------------+
|                          [ Batal ]  [ Simpan Perubahan ]                   |
+---------------------------------------------------------------------------+
```

Susunan halaman sunting sengaja dibuat sama persis dengan halaman input agar
pengguna tidak perlu mempelajari dua tata letak. Perbedaannya ada pada tiga hal.

Pertama, terdapat panel **Riwayat Kegiatan** yang menampilkan siapa mengubah apa dan
kapan, sehingga perubahan alokasi, progres, dan dokumen dapat ditelusuri. Kedua,
terdapat **Catatan Kegiatan** untuk mencatat keterangan yang tidak tertampung di
isian baku. Ketiga, halaman ini hanya dapat dibuka oleh pembuat kegiatan, ketua tim
kegiatan tersebut, dan Admin; pengguna lain tetap dapat melihat rincian kegiatan
tetapi tanpa tombol simpan.

Bila dua orang menyunting kegiatan yang sama, penyimpanan yang didasarkan pada data
lama ditolak dan sistem menampilkan pesan bahwa data telah diubah orang lain serta
meminta pengguna memuat ulang. Rancangan ini mencegah perubahan seseorang tertimpa
diam-diam. _(Terkait KF-04, KF-16, dan KNF-04.)_

### 4.2.4.6 Rancangan Halaman Dokumen Kegiatan

Rancangan alur kerja halaman ini mengikuti Activity Diagram Verifikasi Dokumen.

**[WIREFRAME W-08]** Gambar …: Rancangan Halaman Dokumen Kegiatan

```
+---------------------------------------------------------------------------+
| Dokumen Kegiatan: Susenas Maret 2026                                       |
| [ Persiapan (5) ] [ Pengumpulan Data (4) ] [ Pengolahan (3) ] [Diseminasi] |
+---------------------------------------------------------------------------+
| Nama Dokumen     | Penanggung Jawab | Tautan        | Status   | Aksi      |
|------------------|------------------|---------------|----------|-----------|
| SK Tim           | Tim Keuangan     | [buka tautan] | Approved | [catatan] |
| Surat Tugas      | Ketua Tim        | [isi tautan]  | Pending  | [setuju]  |
| KAK              | Ketua Tim        | [buka tautan] | Rejected | [alasan]  |
+---------------------------------------------------------------------------+
| [ + Tambah Dokumen ]               [ Setujui Seluruh Tahap Ini ]           |
+---------------------------------------------------------------------------+
```

Halaman ini mengumpulkan seluruh tautan dokumen satu kegiatan dalam satu tempat,
dipisahkan per tahap melalui tab yang masing-masing menampilkan jumlah dokumennya.
Setiap baris memuat nama dokumen, penanggung jawab pengisian (Ketua Tim atau Tim
Keuangan), tautan, status, dan tombol aksi yang berbeda menurut peran pengguna.

Dokumen disimpan sebagai tautan ke penyimpanan resmi instansi, bukan sebagai berkas
yang diunggah, agar berkas aslinya tetap berada di penyimpanan yang dikelola
instansi dan hak aksesnya tetap diatur di sana. Status dokumen ada empat: _Pending_
(sudah diisi dan menunggu diperiksa), _Reviewed_ (sedang diperiksa), _Approved_
(disetujui), dan _Rejected_ (ditolak). Dokumen yang ditolak wajib disertai catatan
revisi, dan catatan itu muncul sebagai notifikasi bagi Ketua Tim.

Empat jendela sembul dirancang untuk halaman ini: pengisian tautan dokumen,
penolakan dokumen beserta catatannya, penambahan dokumen di luar daftar bawaan, dan
pengelolaan nama dokumen. Tombol **Setujui Seluruh Tahap Ini** disediakan karena
dalam praktik Tim Keuangan memeriksa dokumen satu tahap sekaligus. _(Terkait KF-08
dan KF-09.)_

### 4.2.4.7 Rancangan Halaman Manajemen Honor

**[WIREFRAME W-09]** Gambar …: Rancangan Halaman Manajemen Honor

```
+---------------------------------------------------------------------------+
| Manajemen Honor                                                            |
| Periode: [ Agustus 2026 v ] atau [ rentang tanggal ]                       |
| Batas Honor: [ Rp 3.000.000 ] [Simpan]   <- hanya Tim Keuangan & Admin     |
+---------------------------------------------------------------------------+
| [Total Honor Periode Ini: Rp 45.600.000]  [Mitra Melebihi Batas: 2]        |
+---------------------------------------------------------------------------+
| Akumulasi Honor PPL — Agustus 2026      [Cari nama PPL] [PDF] [Excel]      |
| Nama PPL | Honor Periode | Jml Kegiatan | Puncak vs Batas | Sisa | Status  |
| Budi     | Rp 3.400.000  | 3            | +Rp 400.000     | -    | Melebihi|
| Siti     | Rp 2.100.000  | 2            | -Rp 900.000     | 900rb| Aman    |
+---------------------------------------------------------------------------+
```

Halaman ini menjawab pertanyaan yang paling sering muncul sebelum ada sistem:
berapa total honor seorang mitra pada satu bulan dari seluruh kegiatan. Pengguna
memilih periode berupa satu bulan atau rentang tanggal bebas, lalu tabel
menampilkan honor tiap mitra, jumlah kegiatannya, selisih honor puncak bulanannya
terhadap batas, sisa pagu, dan status aman atau melebihi. Baris mitra yang melebihi
batas diberi penanda agar langsung terlihat tanpa perlu membaca angkanya satu per
satu.

Nilai batas honor bulanan ditampilkan di bagian atas halaman. Isian untuk
mengubahnya hanya muncul bagi Tim Keuangan dan Admin; peran lain hanya melihat
nilainya. Tabel dapat diunduh dalam bentuk PDF dan Excel sebagai bahan rekap
pembayaran. _(Terkait KF-06 dan KF-13.)_

### 4.2.4.8 Rancangan Halaman Daftar PPL dan Daftar PML

**[WIREFRAME W-10]** Gambar …: Rancangan Halaman Daftar PPL

```
+---------------------------------------------------------------------------+
| Daftar PPL                                     [Cari nama] [Ekspor Excel]  |
| Kecamatan [ semua v ]  Desa [ semua v ]  Status [ aktif v ]                |
+---------------------------------------------------------------------------+
| No | ID   | Nama PPL   | Posisi     | Total Kegiatan | Detail  | Status   |
| 1  | 1234 | Budi S.    | Pendataan  | 3              | [lihat] | Aktif    |
+---------------------------------------------------------------------------+
```

Halaman Daftar PPL menampilkan seluruh mitra statistik beserta posisi, jumlah
kegiatan, dan statusnya. Penyaring kecamatan dan desa diletakkan sejajar dengan
kotak pencarian karena pemilihan mitra hampir selalu mempertimbangkan kedekatan
wilayah. Kolom **Total Kegiatan** menampilkan jumlah kegiatan yang sedang diikuti
mitra dan dapat diklik untuk menampilkan rincian kegiatan, tahap, beban kerja,
serta honornya, sedangkan kolom **Informasi Detail** menampilkan profil mitra
termasuk kecamatan dan desanya.

Halaman yang sama dipakai dalam dua keadaan. Bila dibuka dari menu, halaman ini
berfungsi sebagai daftar mitra biasa. Bila dibuka dari tombol Pilih dari Daftar
PPL pada formulir alokasi, halaman ini berubah menjadi mode pemilihan: setiap
baris diberi kotak centang, hanya mitra yang posisinya sesuai tahap yang tampil,
dan mitra yang sudah dialokasikan ditampilkan redup serta tidak dapat dipilih.
Pemakaian satu halaman untuk dua keadaan dipilih agar penyaring wilayah yang sama
tersedia saat Ketua Tim memilih mitra.

Halaman Daftar PML memakai susunan yang sama, tetapi barisnya adalah pegawai yang
bertugas sebagai PML, dengan kolom jumlah mitra yang diawasi, jumlah kegiatan, dan
total muatan pekerjaan. Halaman itu dipakai untuk melihat sebaran beban pengawasan
antar-PML. Kedua halaman dapat diekspor ke Excel. _(Terkait KF-02 dan KF-13.)_

### 4.2.4.9 Rancangan Halaman Penilaian Mitra

Rancangan alur kerja halaman ini mengikuti Activity Diagram Penilaian Mitra.

**[WIREFRAME W-11]** Gambar …: Rancangan Halaman Penilaian Mitra dan Jendela
Pengisian Nilai

```
+---------------------------------------------------------------------------+
| Penilaian Mitra                                                            |
| Filter dan Pencarian: [Kegiatan v] [Tahap v] [Cari nama mitra]             |
+---------------------------------------------------------------------------+
| No | Kegiatan | Nama PPL | Nama PML | Nilai        | Rata-rata             |
| 1  | Susenas  | Budi S.  | Andi     | [ Beri Nilai]| -                     |
| 2  | Susenas  | Siti A.  | Andi     | 9 / 8 / 8    | 8,33      [ Ubah ]    |
| 3  | Sakernas | Rudi H.  | Dewi     | 8 / 9 / 9    | 8,67   (tanpa tombol) |
+---------------------------------------------------------------------------+

        +---------------------------------------------+
        |  Penilaian Mitra: Budi Santoso              |
        |  Sikap dan Perilaku      [ 1 - 10 ]         |
        |  Kualitas Pekerjaan      [ 1 - 10 ]         |
        |  Ketepatan Waktu         [ 1 - 10 ]         |
        |  Rata-rata: 8,33 (terhitung otomatis)       |
        |                  [ Batal ]  [ Simpan Nilai ]|
        +---------------------------------------------+
```

Halaman ini menampilkan daftar mitra yang perlu dinilai beserta PML pengawasnya.
Tombol **Beri Nilai** hanya muncul pada baris mitra yang diawasi pengguna yang
sedang masuk; pada baris mitra milik PML lain tombol itu tidak ada, dan pembatasan
yang sama juga diterapkan di sisi server sehingga tidak dapat ditembus dengan
mengubah tampilan di peramban. Rancangan ini menggantikan keadaan lama ketika
berkas penilaian dapat diubah siapa pun yang memiliki tautannya.

Penilaian memakai tiga aspek dengan skala bilangan bulat 1 sampai 10, yaitu sikap
dan perilaku, kualitas pekerjaan, serta ketepatan waktu. Rata-rata dihitung otomatis
saat nilai diisi sehingga penilai langsung melihat hasilnya sebelum menyimpan.
_(Terkait KF-14 dan KNF-01.)_

### 4.2.4.10 Rancangan Halaman Rekap Penilaian

**[WIREFRAME W-12]** Gambar …: Rancangan Halaman Rekap Penilaian

```
+---------------------------------------------------------------------------+
| Rekap Penilaian                                                            |
| Filter Data: [ Tahun 2026 v ] [ Triwulan III v ]      [ PDF ] [ Excel ]    |
+---------------------------------------------------------------------------+
| No | Nama PPL | Total Kegiatan | Rata-rata Nilai | Nilai Akhir | Peringkat |
| 1  | Siti A.  | 4              | 9,00            | 9,04        | 1         |
| 2  | Budi S.  | 3              | 8,90            | 8,93        | 2         |
+---------------------------------------------------------------------------+
| Keterangan: Nilai Akhir = Rata-rata Nilai + (0,01 x Total Kegiatan)        |
+---------------------------------------------------------------------------+
```

Halaman ini dibuka melalui tautan pada halaman Penilaian Mitra, bukan dari menu sisi,
karena isinya adalah ringkasan dari penilaian yang diisi di halaman tersebut.

Halaman ini menyajikan peringkat mitra per triwulan. Triwulan ditentukan dari bulan
pembebanan honor mitra, bukan dari tanggal penilaian diisi, agar mitra masuk ke
triwulan tempat pekerjaannya benar-benar dilakukan. Nilai akhir dihitung dari
rata-rata nilai ditambah 0,01 dikali jumlah kegiatan yang diikuti mitra pada
triwulan tersebut, sehingga mitra yang nilainya sama dibedakan oleh keaktifannya.
Rumus itu dicantumkan sebagai keterangan di bawah tabel agar pembaca laporan
mengetahui asal angkanya.

Judul kolom dapat diklik untuk mengurutkan data, dan seluruh tabel dapat diunduh
dalam bentuk PDF dan Excel sebagai lampiran evaluasi mitra. _(Terkait KF-15.)_

### 4.2.4.11 Rancangan Halaman Generate Surat

Rancangan alur kerja halaman ini mengikuti Activity Diagram Pembuatan SPK dan BAST.

**[WIREFRAME W-13]** Gambar …: Rancangan Halaman Generate Surat

```
+---------------------------------------------------------------------------+
| Generate Surat        Periode: [ Agustus 2026 v ]                          |
| [1. Atur Uraian & Beban Anggaran] [2. Generate SPK] [3. Generate BAST]     |
+---------------------------------------------------------------------------+
| Kegiatan   | Tahap      | Mitra | Uraian Tugas           | Kode MAK        |
| Susenas    | Pencacahan | 12    | [Melakukan pencacahan.]| [054.01.GG....] |
| Sakernas   | Listing    | 8     | [Melakukan pendaftaran]| [054.01.GG....] |
+---------------------------------------------------------------------------+
| Daftar Mitra — Agustus 2026                                                |
| No. SPK      | Nama Mitra | Kegiatan | Jangka Waktu | Honor  | Aksi        |
| 015/SPK/...  | Budi S.    | 2        | 1-31 Agu     | 2,4 jt | [Unduh PDF] |
| (belum ada)  | Siti A.    | 1        | 1-31 Agu     | 1,2 jt | [Buat SPK]  |
+---------------------------------------------------------------------------+
| [ Buat Seluruh SPK Periode Ini ]                                           |
+---------------------------------------------------------------------------+
```

Halaman ini dirancang mengikuti urutan kerja Tim Keuangan, sehingga dibagi menjadi
tiga tab bernomor. Tab pertama berisi pengisian uraian tugas dan kode beban anggaran
per kegiatan dan tahap, karena kedua keterangan itu dibutuhkan di dalam surat dan
nilainya sama untuk semua mitra pada kegiatan yang sama. Tab kedua menampilkan
daftar mitra yang memiliki honor pada periode terpilih beserta tombol pembuatan SPK,
baik satu per satu maupun sekaligus satu periode. Tab ketiga menampilkan pembuatan
BAST dengan susunan serupa, dengan tambahan kolom nomor SPK yang menjadi rujukannya.

Satu mitra hanya memiliki satu SPK aktif per bulan meskipun ia bekerja pada beberapa
kegiatan, sehingga seluruh pekerjaannya dalam bulan itu dirangkum dalam satu surat.
Nomor surat diberikan otomatis, tetap sama bila surat diunduh ulang, dan nomor BAST
mengikuti nomor urut SPK mitra yang sama. Berkas PDF dibentuk di peramban dan
langsung terunduh, sehingga surat dapat dicetak tanpa menunggu proses di server.
_(Terkait KF-11.)_

### 4.2.4.12 Rancangan Halaman Template Surat

**[WIREFRAME W-14]** Gambar …: Rancangan Halaman Template Surat

```
+---------------------------------------------------------------------------+
| Template Surat                                                             |
| Identitas Surat: pola nomor SPK  [ {no}/SPK/{kode}/{bulan}/{tahun} ]       |
|                  pola nomor BAST [ {no}/BAST/{kode}/{bulan}/{tahun} ]      |
| Pihak Pertama  : nama PPK [....] NIP [....] jabatan [....]                 |
| Satuan Kerja   : nama satker [....] alamat [....] kode satker [....]       |
| Isi Pasal      : [ kotak teks panjang berisi pasal-pasal surat ]           |
|                                            [ Simpan Template ]             |
+---------------------------------------------------------------------------+
```

Halaman ini memisahkan bagian surat yang jarang berubah dari proses pembuatan surat
sehari-hari. Isinya dikelompokkan menjadi identitas surat (pola penomoran), data
pihak pertama (PPK), data satuan kerja, dan isi pasal. Dengan pemisahan ini,
pergantian PPK atau perubahan susunan pasal cukup dilakukan satu kali di halaman ini
dan langsung berlaku untuk surat berikutnya, tanpa mengubah kode program. Halaman
ini hanya dapat diakses Tim Keuangan dan Admin. _(Terkait KF-11.)_

### 4.2.4.13 Rancangan Halaman Riwayat Penyuratan

Rancangan alur kerja halaman ini mengikuti Activity Diagram Riwayat Penyuratan.

**[WIREFRAME W-15]** Gambar …: Rancangan Halaman Riwayat Penyuratan

```
+---------------------------------------------------------------------------+
| Riwayat Penyuratan     Tahun: [ 2026 v ]   [ Rapikan Nomor ] [Atur Ulang]  |
+---------------------------------------------------------------------------+
| Nomor | No. SPK    | No. BAST    | Mitra   | Periode | Total  | Status     |
| 015   | 015/SPK/.. | 015/BAST/.. | Budi S. | Agu 26  | 2,4 jt | Aktif      |
| 016   | 016/SPK/.. | -           | Siti A. | Agu 26  | 1,2 jt | Batal      |
| 017   | (kosong)   | -           | -       | -       | -      | Kosong     |
| Aksi per baris: [Ubah Nomor] [Perbarui Isi] [Batalkan] [Hapus]             |
+---------------------------------------------------------------------------+
```

Halaman ini menampilkan seluruh surat dalam satu tahun, termasuk surat yang
dibatalkan dan nomor yang kosong, sehingga urutan penomoran dapat diperiksa
sewaktu-waktu. Surat yang datanya sudah berubah setelah terbit diberi penanda dan
dapat diperbarui isinya tanpa mengganti nomornya, karena nomor surat yang sudah
beredar tidak boleh berubah. Surat yang tidak jadi dipakai dibatalkan disertai
catatan alasan, bukan dihapus diam-diam.

Tindakan yang menggeser banyak nomor sekaligus, yaitu merapikan dan mengatur ulang
penomoran, dirancang memakai jendela pratinjau yang menampilkan nomor lama beserta
nomor barunya, serta meminta pengguna mengetik frasa konfirmasi sebelum dijalankan.
Rancangan ini dipilih karena tindakan tersebut berdampak luas dan tidak dapat
dibatalkan. Seluruh perubahan nomor dicatat sebagai jejak audit. _(Terkait KF-12 dan
KNF-05.)_

### 4.2.4.14 Rancangan Halaman Manajemen Admin

Rancangan alur kerja impor mitra mengikuti Activity Diagram Impor Data Mitra dari
SOBAT.

**[WIREFRAME W-16a]** Gambar …: Rancangan Halaman Manajemen Admin
**[WIREFRAME W-16b]** Gambar …: Rancangan Jendela Impor Mitra dari Excel SOBAT
_(dua gambar terpisah; jendela impor terlalu padat bila digabung ke satu gambar)_

```
+---------------------------------------------------------------------------+
| Manajemen Admin                                                            |
| [ Manajemen Users ] [ Manajemen Ketua Tim ] [ Manajemen PPL ]              |
+---------------------------------------------------------------------------+
| Daftar Users                                   [ + Tambah User ]           |
| ID User | Username | Nama Lengkap | Role       | PML | Aksi                 |
| U001    | andi     | Andi Saputra | user       | ya  | [ubah] [hapus]       |
| U002    | keuangan | Rina         | supervisor | -   | [ubah] [hapus]       |
+---------------------------------------------------------------------------+
| (Tab Manajemen PPL)  [ + Tambah Mitra ] [ Impor dari SOBAT ]               |
+---------------------------------------------------------------------------+

        +-------------------------------------------------------+
        |  Impor Mitra dari Excel SOBAT                         |
        |  Berkas Excel (.xlsx) [ pilih berkas ]                |
        |  Baris judul kolom: [ 3 v ]                           |
        |  Pemetaan kolom: Nama [B v] ID SOBAT [A v] ...        |
        |  ------------------ Pratinjau -----------------       |
        |  Tambah 12 | Perbarui 30 | Lewati 4 | Nonaktifkan 2   |
        |  Budi S. (ID 1234)   -> [ tambah / perbarui / lewati ]|
        |                      [ Batal ]  [ Terapkan Impor ]    |
        +-------------------------------------------------------+
```

Halaman ini hanya dapat diakses Admin dan dibagi menjadi tiga tab: pengguna, ketua
tim, dan mitra. Tab pengguna memuat pengelolaan akun beserta perannya dan penanda
PML. Tab ketua tim memuat penautan nama ketua tim dengan akun penggunanya. Tab mitra
memuat profil mitra beserta wilayahnya.

Bagian yang paling banyak dirancang adalah jendela **Impor Mitra dari Excel SOBAT**.
Rancangannya dibuat bertahap: memilih berkas, menentukan baris judul kolom dan
pemetaan kolom, lalu menampilkan pratinjau berisi ringkasan jumlah baris yang akan
ditambah, diperbarui, dilewati, dan dinonaktifkan. Admin dapat mengubah tindakan
setiap baris sebelum impor dijalankan.

Pratinjau tidak mengubah apa pun di basis data, dan impor dijalankan sebagai satu
kesatuan sehingga kegagalan di tengah jalan tidak meninggalkan data setengah
tersimpan. Mitra yang sudah tidak aktif dinonaktifkan, bukan dihapus, agar honor,
surat, dan penilaian lamanya tetap tersimpan dan mitra dapat diaktifkan kembali.
_(Terkait KF-02 dan KF-03.)_

### 4.2.4.15 Rancangan Halaman Profil serta Notifikasi dan Pencarian Global

**[WIREFRAME W-17]** Gambar …: Rancangan Halaman Profil, Panel Notifikasi, dan
Pencarian Global

```
+-------------------------------+     +--------------------------------------+
| Identitas Akun                |     | Notifikasi                      (5)  |
|  Username     : andi          |     | [!] Dokumen ditolak: KAK Susenas     |
|  Nama Lengkap : Andi Saputra  |     | [!] Tenggat Pencacahan H-2           |
|  Peran        : PML           |     | [i] Progres belum diperbarui 3 hari  |
|  (hanya dapat dibaca)         |     | [i] 4 dokumen menunggu persetujuan   |
+-------------------------------+     +--------------------------------------+
| Ganti Kata Sandi              |
|  Password Lama        [......]|     +--------------------------------------+
|  Password Baru        [......]|     | Cari kegiatan, mitra, atau halaman   |
|  Ulangi Password Baru [......]|     |  > Susenas Maret 2026 (kegiatan)     |
|             [ Simpan ]        |     |  > Budi Santoso (mitra)              |
+-------------------------------+     |  > Manajemen Honor (halaman)         |
                                      +--------------------------------------+
```

Halaman Profil dirancang hanya untuk melihat identitas akun dan mengganti kata
sandi. Nama lengkap dan peran ditampilkan sebagai teks yang tidak dapat disunting,
karena keduanya hanya boleh diubah Admin agar peran pengguna tidak dapat dinaikkan
sendiri. Setelah kata sandi berhasil diganti, seluruh sesi lama akun tersebut
dicabut sehingga pengguna harus masuk kembali.

Panel notifikasi muncul dari lonceng di bilah atas. Isinya berbeda menurut peran:
Ketua Tim menerima pemberitahuan tenggat tahap, dokumen yang ditolak, progres yang
tidak diperbarui, dan pengingat dari Tim Keuangan; Tim Keuangan menerima
pemberitahuan dokumen yang menunggu persetujuan, dokumen yang diunggah ulang,
dokumen yang menjadi tanggung jawabnya tetapi belum diisi, serta surat yang isinya
berubah setelah terbit. Notifikasi dirancang hilang dengan sendirinya setelah
penyebabnya diselesaikan, sehingga tidak ada daftar yang harus dibersihkan manual.

Pencarian global di bilah atas dirancang mencakup tiga jenis hasil sekaligus, yaitu
kegiatan, mitra, dan halaman, agar pengguna dapat berpindah tanpa menelusuri menu
satu per satu. _(Terkait KF-01 dan KF-10.)_

---

## Tabel Ringkasan Rancangan Antarmuka

Tabel berikut dapat dipakai sebagai penutup subbab 4.2.4.

| Kode  | Rancangan                                | Pengguna                                                | Kebutuhan yang Diwujudkan |
| ----- | ---------------------------------------- | ------------------------------------------------------- | ------------------------- |
| W-01  | Kerangka Umum Tampilan                   | Seluruh pengguna                                        | KNF-03                    |
| W-02  | Halaman Masuk                            | Seluruh pengguna                                        | KF-01, KNF-01             |
| W-03  | Dasbor Monitoring                        | Seluruh pengguna; panel progres khusus PML              | KF-07, KF-13              |
| W-04  | Input Kegiatan — Info Dasar dan Jadwal   | Seluruh pegawai                                         | KF-04                     |
| W-05  | Input Kegiatan — Alokasi Mitra           | Seluruh pegawai                                         | KF-05                     |
| W-06  | Peringatan Batas Honor Bulanan           | Seluruh pegawai                                         | KF-06                     |
| W-07  | Sunting Kegiatan                         | Pembuat, Ketua Tim, Admin                               | KF-04, KF-16              |
| W-08  | Dokumen Kegiatan                         | Ketua Tim, Tim Keuangan, Admin                          | KF-08, KF-09              |
| W-09  | Manajemen Honor                          | Seluruh pegawai; ubah batas oleh Tim Keuangan dan Admin | KF-06, KF-13              |
| W-10  | Daftar PPL dan Daftar PML                | Seluruh pegawai                                         | KF-02, KF-13              |
| W-11  | Penilaian Mitra                          | PML, Admin                                              | KF-14                     |
| W-12  | Rekap Penilaian                          | Seluruh pegawai                                         | KF-15                     |
| W-13  | Generate Surat                           | Tim Keuangan, Admin                                     | KF-11                     |
| W-14  | Template Surat                           | Tim Keuangan, Admin                                     | KF-11                     |
| W-15  | Riwayat Penyuratan                       | Tim Keuangan, Admin                                     | KF-12, KNF-05             |
| W-16a | Manajemen Admin                          | Admin                                                   | KF-02                     |
| W-16b | Jendela Impor Mitra dari SOBAT           | Admin                                                   | KF-03                     |
| W-17  | Profil, Notifikasi, dan Pencarian Global | Seluruh pengguna                                        | KF-01, KF-10              |

---

## Catatan pengerjaan wireframe

1. **Jumlah gambar.** Delapan belas gambar sudah memadai untuk satu subbab. Bila
   pembimbing meminta lebih ringkas, gambar W-05, W-06, dan W-17 dapat digabungkan
   ke gambar induknya dengan menghapus halamannya di berkas draw.io.
2. **Konsistensi ukuran.** Pakai satu ukuran bingkai yang sama, misalnya 1366 × 768
   piksel, untuk seluruh wireframe agar tampilannya seragam saat dicetak.
3. **Jangan berwarna.** Wireframe cukup memakai abu-abu, hitam, dan putih. Warna
   sebenarnya baru ditampilkan pada tangkapan layar di Bab V, sehingga perbedaan
   antara rancangan dan hasil implementasi terlihat jelas.
4. **Isi contoh.** Isi tabel pada wireframe cukup memakai data contoh seperti pada
   sketsa di atas. Jangan memakai nama mitra sebenarnya di buku skripsi.
5. **Bila ingin mengubah susunan.** Sunting langsung di draw.io. Berkas
   `alat/buat_wireframe.py` hanya dipakai untuk membangkitkan berkas .drawio dari
   nol; menjalankannya lagi akan menimpa suntingan manual Anda.
