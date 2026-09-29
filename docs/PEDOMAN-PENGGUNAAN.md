# Pedoman Penggunaan SIKAMI

Sistem Informasi Administrasi dan Pemantauan Kegiatan Mitra Statistik
BPS Kabupaten Bengkulu Selatan

---

> **Catatan penyusunan (hapus bagian ini sebelum dicetak).**
>
> Pedoman ini disusun **per peran**, bukan per menu. Alasannya: seorang pegawai
> membuka pedoman ketika ia ingin mengerjakan sesuatu, bukan ketika ingin tahu
> ada menu apa saja. Pegawai juga hanya memegang satu peran, sehingga menyusun
> per peran membuat setiap orang cukup membaca dua bagian: Bagian 1 yang berlaku
> untuk semua, dan satu bagian sesuai perannya.
>
> **Kotak bergaris berkode SS-xx adalah tempat tangkapan layar.** Cara
> mengisinya di Word: klik di dalam kotak, blok tulisan "Tempel tangkapan layar
> di sini" lalu hapus, kemudian tempel gambarnya (Ctrl+V). Kotak yang masih
> kosong akan tetap terlihat bergaris, sehingga mudah memastikan tidak ada yang
> terlewat.
>
> Teks pedoman ini sudah lengkap dan dapat dibaca tanpa gambar sama sekali;
> gambar sifatnya melengkapi. Daftar seluruh tangkapan layar yang dibutuhkan,
> beserta apa saja yang harus terlihat pada masing-masing, ada di Lampiran A.

---

## Daftar Isi

1. [Sebelum Mulai](#1-sebelum-mulai)
2. [Bagian 1 — Untuk Semua Pengguna](#bagian-1--untuk-semua-pengguna)
3. [Bagian 2 — Ketua Tim dan Pembuat Kegiatan](#bagian-2--ketua-tim-dan-pembuat-kegiatan)
4. [Bagian 3 — PML](#bagian-3--pml)
5. [Bagian 4 — Tim Keuangan](#bagian-4--tim-keuangan)
6. [Bagian 5 — Admin](#bagian-5--admin)
7. [Bagian 6 — Bila Terjadi Masalah](#bagian-6--bila-terjadi-masalah)
8. [Lampiran A — Daftar Tangkapan Layar](#lampiran-a--daftar-tangkapan-layar)

---

## 1. Sebelum Mulai

### 1.1 Cara membuka sistem

SIKAMI dibuka melalui peramban (Chrome, Edge, atau Firefox) pada alamat yang
diberikan pengelola sistem.

**Dari dalam kantor**, sistem langsung dapat dibuka.

**Dari luar kantor**, Anda harus lebih dulu tersambung ke jaringan BPS melalui
**FortiClient VPN BPS**. Selama VPN belum tersambung, halaman tidak akan terbuka
sama sekali. Ini bukan kerusakan, melainkan memang disengaja agar data mitra
tidak dapat diakses dari luar jaringan BPS.

### 1.2 Peran pengguna

Apa yang Anda lihat di dalam sistem bergantung pada peran akun Anda.

| Peran | Yang dapat dikerjakan |
| --- | --- |
| **Pegawai** | Membuat kegiatan, mengalokasikan mitra, melihat dasbor, rekap honor, dan rekap penilaian |
| **Ketua Tim** | Semua yang dapat dikerjakan Pegawai, ditambah menyunting kegiatan yang dipimpinnya dan mengelola dokumennya |
| **PML** | Semua yang dapat dikerjakan Pegawai, ditambah mengisi progres dan menilai mitra yang diawasinya |
| **Tim Keuangan** | Semua yang dapat dikerjakan Pegawai, ditambah memverifikasi dokumen, mengatur batas honor, serta membuat dan memelihara surat |
| **Admin** | Seluruhnya, ditambah pengelolaan akun, data mitra, dan pengarsipan kegiatan |

Satu hal yang sering membingungkan: **PML bukan peran akun**. Siapa pun dapat
menjadi PML, dan seseorang menjadi PML hanya untuk mitra yang namanya dicatat
sebagai mitra binaannya pada suatu kegiatan. Karena itu seorang pegawai Tim
Keuangan pun bisa sekaligus menjadi PML.

### 1.3 Istilah yang dipakai

| Istilah | Artinya |
| --- | --- |
| **Mitra / PPL** | Petugas lapangan bukan pegawai yang dikontrak untuk satu kegiatan |
| **PML** | Pegawai yang mengawasi mitra pada suatu kegiatan |
| **Beban kerja** | Jumlah pekerjaan yang diberikan kepada satu mitra, misalnya jumlah dokumen |
| **Muatan** | Satuan beban kerja yang dipakai untuk membagi honor ke tiap bulan |
| **SBML** | Standar Biaya Masukan Lainnya, yaitu batas honor yang boleh diterima seorang mitra dalam satu bulan |
| **SPK** | Surat Perjanjian Kerja mitra |
| **BAST** | Berita Acara Serah Terima, dibuat setelah pekerjaan selesai |

---

## Bagian 1 — Untuk Semua Pengguna

### 1.1 Masuk ke sistem

| **SS-01 — Halaman masuk** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

1. Buka alamat SIKAMI.
2. Isi **nama pengguna** dan **kata sandi** yang diberikan Admin.
3. Klik **Masuk**.

Bila nama pengguna atau kata sandi salah, sistem hanya menampilkan satu pesan
yang sama untuk keduanya. Ini disengaja, agar orang yang mencoba menebak tidak
dapat mengetahui nama pengguna mana yang benar-benar ada.

Bila Anda salah memasukkan kata sandi berkali-kali, sistem akan menolak
sementara dan meminta Anda menunggu beberapa saat. Tunggu saja, lalu coba lagi.

Sesi Anda berlaku **12 jam**. Setelah itu Anda diminta masuk kembali.

### 1.2 Mengenal tampilan utama

| **SS-02 — Tampilan dasbor beserta menu di sebelah kiri** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

Susunan layarnya tetap sama di seluruh halaman:

- **Menu di sebelah kiri** — daftar halaman. Menu yang tidak menjadi hak Anda
  tidak ditampilkan sama sekali. Menu ini dapat dilebarkan atau disempitkan
  dengan tombol di bagian atasnya.
- **Kotak pencarian di bagian atas** — mencari kegiatan, mitra, atau nomor surat
  dari halaman mana pun.
- **Ikon lonceng** — notifikasi.
- **Ikon bulan/matahari** — mengganti tampilan terang atau gelap.
- **Nama akun di pojok kanan atas** — menuju halaman profil dan tombol keluar.

Menu yang tersedia:

| Menu | Isinya | Siapa yang melihatnya |
| --- | --- | --- |
| Dashboard | Ringkasan seluruh kegiatan dan grafik progres | Semua |
| Daftar > Daftar PPL | Daftar seluruh mitra | Semua |
| Daftar > Daftar PML | Daftar PML beserta jumlah mitra binaannya | Semua |
| Manajemen Honor | Rekap honor mitra per bulan atau rentang tanggal | Semua |
| Penilaian Mitra | Pengisian nilai dan rekap peringkat | Semua |
| Keuangan > Generate Surat | Pembuatan SPK dan BAST | Tim Keuangan, Admin |
| Keuangan > Template Surat | Pengaturan isi dan penomoran surat | Tim Keuangan, Admin |
| Keuangan > Riwayat Penyuratan | Seluruh surat yang pernah dibuat | Tim Keuangan, Admin |
| Manajemen Admin | Akun, ketua tim, dan data mitra | Admin |

### 1.3 Membaca dasbor

| **SS-03 — Kartu ringkasan dan grafik pada dasbor** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

Dasbor menampilkan seluruh kegiatan yang sedang berjalan dari **semua tim**,
bukan hanya tim Anda. Inilah yang membuat progres seluruh kantor dapat dilihat
dalam satu layar.

Yang perlu diperhatikan:

- **Kartu ringkasan** di bagian atas: jumlah kegiatan, jumlah mitra, dan
  ringkasan honor.
- **Grafik progres** per tahap pekerjaan: Listing, Pencacahan, dan Pengolahan.
- **Daftar kegiatan** di bagian bawah, lengkap dengan persentase kemajuan tiap
  tahap. Klik satu kegiatan untuk melihat rinciannya.
- **Penyaring** di atas daftar: menurut tim, tahap, bulan, atau **tahun**.

Penyaring tahun memakai tanggal mulai persiapan kegiatan. Gunanya terasa setelah
sistem dipakai beberapa tahun: tanpa penyaring itu, daftar kegiatan memuat semua
angkatan sekaligus, padahal yang dicari sehari-hari hanya tahun berjalan.

Kegiatan yang sudah diarsipkan tidak tampil di sini. Untuk melihatnya, buka
riwayat kegiatan.

### 1.4 Notifikasi

| **SS-04 — Daftar notifikasi ketika ikon lonceng diklik** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

Klik ikon lonceng untuk melihat hal-hal yang memerlukan perhatian Anda.
Notifikasi yang Anda terima bergantung pada peran dan tugas Anda:

| Bila Anda | Notifikasi yang Anda terima |
| --- | --- |
| Ketua Tim | Tenggat tahap yang sudah dekat atau terlewat, dokumen yang ditolak, progres yang tidak diperbarui lebih dari dua hari, dan pengingat dari Tim Keuangan |
| Tim Keuangan | Dokumen yang menunggu persetujuan, dokumen yang diunggah ulang, dokumen yang menjadi tanggung jawabnya tetapi belum diisi, dan surat yang isinya berubah setelah terbit |
| PML | Peringatan bila mitra binaan Anda belum berprogres sama sekali sedangkan masa pendataan tinggal tujuh hari atau kurang |
| Pembuat kegiatan | Pengingat dokumen dari Tim Keuangan |

Notifikasi **tidak perlu dihapus**. Begitu penyebabnya selesai — dokumen sudah
disetujui, progres sudah diisi — notifikasinya hilang sendiri.

Warna merah berarti mendesak, kuning berarti perlu diperhatikan.

### 1.5 Pencarian

Kotak pencarian di bagian atas mencari **kegiatan, mitra, dan nomor surat**
sekaligus. Ketik sebagian nama saja sudah cukup. Klik salah satu hasilnya untuk
langsung menuju halamannya.

### 1.6 Mengganti kata sandi

| **SS-05 — Halaman profil** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

1. Klik nama akun Anda di pojok kanan atas, lalu pilih **Profil**.
2. Isi kata sandi lama, kata sandi baru, dan ulangan kata sandi baru.
3. Klik **Simpan**.

Ketentuan kata sandi baru:

- panjangnya antara **8 dan 72 karakter**;
- **tidak boleh sama** dengan nama pengguna Anda.

**Perhatian:** begitu kata sandi berhasil diganti, seluruh perangkat lain yang
sedang masuk dengan akun Anda akan dikeluarkan. Ini disengaja, agar kata sandi
lama yang mungkin sudah diketahui orang lain benar-benar tidak berlaku lagi.

Nama dan peran akun **hanya dapat diubah Admin**. Bila keduanya keliru, hubungi
Admin.

### 1.7 Keluar

Klik nama akun di pojok kanan atas, lalu **Keluar**. Selalu keluar bila Anda
memakai komputer bersama.

---

## Bagian 2 — Ketua Tim dan Pembuat Kegiatan

### 2.1 Membuat kegiatan baru

| **SS-06 — Formulir kegiatan baru, bagian informasi umum** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

1. Buka **Dashboard**, lalu klik **Tambah Kegiatan**.
2. Isi nama kegiatan, tim penanggung jawab, dan Ketua Tim-nya.
3. Isi jadwal keempat tahap:
   - **Persiapan**
   - **Pengumpulan Data**
   - **Pengolahan dan Analisis**
   - **Diseminasi dan Evaluasi**
4. Bila kegiatan Anda tidak memiliki tahap pengolahan atau diseminasi, **hapus
   centang** pada tahap tersebut. Tahap yang tidak dicentang tidak akan muncul di
   dasbor maupun pada dokumen wajib.
5. Isi satuan beban kerja dan harga satuan untuk tiap jenis pekerjaan.

**Isilah tanggal dengan benar sejak awal.** Tanggal mulai pengumpulan data
menentukan kapan PML boleh mulai mengisi progres — sebelum tanggal itu, pengisian
progres ditolak sistem.

**Pilihan Ketua Tim mengikuti tahun jadwal persiapan.** Kepengurusan ketua tim
dicatat per tahun, jadi daftar yang muncul hanya ketua tim tahun itu. Selama
jadwal persiapan belum diisi, yang dipakai tahun berjalan.

Bila daftarnya kosong, berarti kepengurusan tahun tersebut belum didaftarkan
Admin. Sistem menawarkan memakai kepengurusan tahun sebelumnya; pakai tawaran itu
bila susunan timnya memang belum berganti, atau minta Admin mendaftarkan
kepengurusan tahun baru lebih dulu.

Bila Anda mengubah jadwal persiapan ke tahun yang berbeda, pilihan ketua tim
dikosongkan dan harus dipilih ulang. Ini disengaja: orang yang tadi dipilih belum
tentu pengurus tahun yang baru.

### 2.2 Mengalokasikan mitra

| **SS-07 — Jendela pemilihan mitra beserta penyaring kecamatan dan desa** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

1. Pada tahap yang ingin diisi, klik **Pilih dari Daftar PPL**.
2. Sistem menampilkan mitra yang **aktif** dan **posisinya sesuai tahap
   tersebut**. Mitra yang sudah dialokasikan pada kegiatan yang sama tidak akan
   muncul lagi.
3. Persempit daftarnya dengan penyaring **kecamatan** dan **desa** bila Anda
   mencari mitra dari wilayah tertentu.
4. Centang mitra yang dipilih, lalu klik **Tambahkan**.
5. Untuk setiap mitra, isi **PML pengawas** dan **beban kerja**. Honornya terisi
   sendiri sebesar beban kerja dikali harga satuan.

| **SS-08 — Daftar mitra yang sudah dialokasikan beserta kolom honornya** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

### 2.3 Mengisi alokasi dari berkas Excel

Bila daftar alokasinya sudah ada dalam bentuk tabel di komputer Anda, seluruh
barisnya dapat dimasukkan sekaligus tanpa mengisi satu per satu di layar. Ini
menolong pada kegiatan besar yang memegang puluhan mitra.

| **SS-23 — Dialog Impor Alokasi Mitra pada langkah peninjauan** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

1. Buka tab **Alokasi PPL**, lalu klik **Impor Alokasi dari Excel** di atas
   ketiga tab tahap.
2. Klik **Unduh Template Excel** bila Anda belum punya berkasnya.
3. Isi berkasnya, lalu unggah.
4. Periksa pratinjaunya, lalu klik **Masukkan Alokasi**.

Berkasnya memuat lima kolom:

| Kolom | Diisi apa |
| --- | --- |
| SOBAT ID | Penanda mitra di aplikasi SOBAT. Paling andal, dipakai lebih dulu bila diisi |
| Nama Mitra | Dipakai bila SOBAT ID kosong |
| Tahap | Listing, Pencacahan, atau Pengolahan |
| PML | Nama PML pengawas. Nama panggilan sudah cukup |
| Beban Kerja | Bilangan bulat lebih dari nol |

**Satu berkas mengisi ketiga tahap sekaligus.** Kolom Tahap yang menentukan
setiap baris masuk ke tab mana, jadi Anda tidak perlu mengunggah berkas yang sama
tiga kali. Urutan kolomnya boleh berbeda dan berkasnya boleh punya kolom
tambahan — yang dicocokkan judulnya, bukan urutannya.

**Nama PML tidak harus lengkap.** "Edianto" sudah cukup untuk "Edianto, S.E".
Bila nama yang Anda tulis cocok ke lebih dari satu pegawai, sistem menyebut siapa
saja yang cocok dan mengosongkan PML baris itu — Anda tinggal memilihnya di kartu
alokasinya. Sistem tidak pernah menebak, karena menebak berarti pengawasan dan
penilaian mitra jatuh ke pegawai yang keliru tanpa ada pesan kesalahan.

Tiga hal **tidak** diisi di berkas:

- **Harga satuan**, karena harga adalah setelan per tahap di kegiatan ini. Honor
  tiap baris dihitung dari beban kerja dikali harga satuan tahapnya. Bila harga
  satuannya belum diisi, barisnya tetap masuk dengan honor Rp 0 dan akan terhitung
  sendiri begitu harganya diketik.
- **Bulan dan cara pembebanan honor**, karena keduanya hanya ditanyakan bila
  rentang honor tahapnya melewati lebih dari satu bulan. Aturlah di kartu
  alokasinya, seperti dijelaskan pada bagian 2.4.

Pada langkah peninjauan, tiap baris digolongkan menjadi **siap**, **perlu
diperiksa**, atau **tidak bisa dipakai**. Baris yang tidak bisa dipakai dilewati,
bukan menggagalkan seluruh berkas: perbaiki barisnya di Excel lalu impor lagi.
Mitra yang sudah masuk tidak akan terisi dua kali, jadi mengimpor berkas yang
sama dua kali tidak melipatgandakan honornya.

**Data belum tersimpan setelah impor.** Hasilnya masuk ke formulir yang sedang
terbuka, persis seperti Anda mengetiknya sendiri, dan baru tersimpan ketika Anda
menekan Simpan Kegiatan.

### 2.4 Bila honor melintasi beberapa bulan

Bila masa kerja mitra melewati batas bulan, sistem menanyakan cara membagi
muatannya:

| Pilihan | Artinya | Dipakai bila |
| --- | --- | --- |
| **Satu bulan penuh** | Seluruh muatan dibebankan ke satu bulan | Pekerjaannya memang selesai di satu bulan |
| **Menurut jumlah hari** | Muatan dibagi sebanding dengan jumlah hari kerja di tiap bulan | Pekerjaannya merata sepanjang periode |
| **Luber** | Bulan pertama diisi sampai batas, sisanya melimpah ke bulan berikutnya | Anda ingin menekan honor bulan pertama agar tidak melebihi batas |

Pembagian ini menentukan **berapa banyak SPK** yang nanti dibuat: satu SPK untuk
setiap bulan pembebanan.

### 2.5 Bila muncul peringatan batas SBML

| **SS-09 — Jendela peringatan batas honor** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

Saat kegiatan disimpan, sistem menjumlahkan honor tiap mitra pada bulan yang sama
**dari seluruh kegiatan dan seluruh tim**, lalu membandingkannya dengan batas
SBML. Bila ada yang melebihi, muncul peringatan berisi nama mitra, bulan, total
honor, dan batasnya.

Anda punya dua pilihan:

- **Perbaiki** — kembali mengubah beban kerja atau cara pembebanannya. Ini
  pilihan yang dianjurkan.
- **Tetap simpan** — bila memang ada alasan yang sudah disepakati dengan Tim
  Keuangan.

Sistem **tidak menolak** penyimpanan, hanya memperingatkan lalu meminta
konfirmasi. Keputusannya tetap di tangan Anda, tetapi keputusannya tercatat.

### 2.6 Membatalkan kegiatan yang baru saja dibuat

Sesaat setelah kegiatan tersimpan, muncul jendela konfirmasi berisi tombol
**Batalkan** selama sekitar enam detik. Klik tombol itu bila Anda keliru
menyimpan.

Setelah jendela tertutup, kegiatan **tidak dapat lagi dibatalkan sendiri**.
Jendelanya sengaja dibuat singkat karena kegiatan yang baru tersimpan bisa
langsung dipakai orang lain — mitranya dikontrak atau progresnya diisi — dan
pembatalan yang terlambat akan ikut menghapus pekerjaan orang lain. Bila memang
perlu dihapus, hubungi Admin.

### 2.7 Menyunting kegiatan

Buka kegiatannya dari dasbor, lalu klik **Edit**. Anda hanya dapat menyunting
kegiatan yang **Anda buat sendiri** atau yang **Anda pimpin sebagai Ketua Tim**.

Bila muncul pesan bahwa kegiatan telah diubah orang lain, berarti ada yang
menyimpan kegiatan yang sama saat halaman Anda terbuka. **Muat ulang halaman**,
lalu ulangi perubahan Anda. Sistem sengaja menolak menyimpan agar perubahan orang
lain tidak tertimpa tanpa diketahui.

### 2.8 Mengisi dokumen kegiatan

| **SS-10 — Halaman dokumen kegiatan** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

1. Buka kegiatannya, lalu pilih **Lihat Dokumen**.
2. Sistem sudah menyiapkan daftar dokumen wajib tiap tahap (SK, Surat Tugas, KAK,
   Visum, BAST, laporan tahap). Dokumen lain dapat ditambahkan sendiri.
3. Untuk setiap dokumen, tempelkan **tautan** ke berkasnya di penyimpanan
   instansi, lalu simpan.

Berkasnya sendiri **tidak diunggah ke SIKAMI**, hanya tautannya yang disimpan.
Berkas aslinya tetap berada di penyimpanan resmi kantor.

Setelah tautan diisi, dokumen berstatus **Menunggu** sampai diperiksa Tim
Keuangan. Bila ditolak, Anda menerima notifikasi berisi catatan revisinya.
Perbaiki tautannya, dan statusnya kembali menjadi Menunggu.

---

## Bagian 3 — PML

### 3.1 Mengisi progres mitra

| **SS-11 — Panel pembaruan progres** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

1. Buka **Dashboard**.
2. Pada panel pembaruan progres, pilih kegiatan dan tahap yang ingin diperbarui.
3. Sistem menampilkan **seluruh mitra yang Anda awasi**, dari kegiatan mana pun,
   sehingga Anda tidak perlu membuka kegiatan satu per satu.
4. Isi jumlah dokumen pada tiap status, lalu simpan.

Status yang dipakai berbeda menurut tahapnya:

| Tahap | Status |
| --- | --- |
| Listing dan Pencacahan | _open_, _submit_, diperiksa, _approved_ |
| Pengolahan | belum _entry_, sudah _entry_, validasi, _clean_ |

Status pertama (_open_ dan belum _entry_) **terisi sendiri** sebesar beban kerja
mitra, dan berkurang seiring Anda mengisi status berikutnya. Anda tidak perlu
mengisinya sendiri.

### 3.2 Bila pengisian progres ditolak

Ada tiga sebab yang paling sering:

| Pesan | Sebabnya | Yang harus dilakukan |
| --- | --- | --- |
| Progres baru dapat diisi setelah masa pengumpulan data dimulai | Kegiatan masih dalam tahap Persiapan | Tunggu sampai tanggal mulai pengumpulan data. Bila tanggalnya keliru, minta Ketua Tim memperbaikinya |
| Progres hanya dapat diperbarui oleh PML-nya | Mitra tersebut diawasi PML lain | Minta PML yang bersangkutan yang mengisinya |
| Total melebihi beban kerja | Jumlah seluruh status lebih besar daripada beban kerja mitra | Periksa kembali angkanya |

Pengisian **tidak ditutup** setelah masa pengumpulan data berakhir. Pendataan
sering berlangsung melewati jadwal, dan pekerjaan yang benar-benar terjadi tetap
harus dapat dicatat.

> **Catatan:** progres diisi secara manual oleh PML, termasuk untuk kegiatan yang
> pendataannya memakai aplikasi FASIH. SIKAMI belum tersambung ke FASIH.

### 3.3 Menilai mitra

| **SS-12 — Halaman Penilaian Mitra** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

1. Buka menu **Penilaian Mitra**.
2. Pilih kegiatan dan tahapnya. Sistem hanya menampilkan mitra yang **Anda
   awasi**.
3. Beri nilai pada tiga aspek, masing-masing berupa bilangan bulat **1 sampai
   10**:
   - sikap dan perilaku;
   - kualitas pekerjaan;
   - ketepatan waktu.
4. Tulis **komentar** penilaian Anda, minimal 20 karakter.
5. Simpan. Rata-ratanya dihitung sendiri oleh sistem.

**Komentar wajib diisi.** Tombol Simpan tetap mati sampai komentarnya cukup
panjang, dan penghitung karakter di bawah kotaknya menunjukkan kekurangannya.
Ketentuan ini mengikuti penilaian mitra pada aplikasi SOBAT, dan gunanya bukan
sekadar memenuhi syarat: angka 1 sampai 10 tidak menjelaskan apa pun ketika mitra
mempertanyakan nilainya, atau ketika mitra yang sama diusulkan lagi tahun depan
oleh PML yang berbeda. Tulislah yang konkret, misalnya "Teliti mengisi kuesioner
dan selalu tepat waktu", bukan "bagus".

Penilaian yang sudah tersimpan sebelum ketentuan ini berlaku tetap ada dan tidak
perlu diisi ulang komentarnya.

Setelah tersimpan, sistem menampilkan **bintang 1 sampai 5** sebagai ringkasan
rata-ratanya. Bintangnya mengikuti Form Penilaian Petugas yang dipakai BPS
Kabupaten Bengkulu Selatan, dan tidak mengenal setengah bintang — rata-rata 8,67
menjadi empat bintang, bukan empat setengah.

Mitra yang diawasi PML lain **tidak dapat Anda nilai**, dan batasan ini
ditegakkan di sisi server — bukan sekadar disembunyikan dari layar.

### 3.4 Melihat peringkat mitra

Buka **Penilaian Mitra > Rekap Penilaian**, lalu pilih triwulannya.

Peringkat dihitung dengan rumus:

> nilai akhir = rata-rata nilai mitra pada triwulan tersebut + (0,01 × jumlah
> kegiatan yang diikutinya pada triwulan itu)

Tambahan kecil berdasarkan jumlah kegiatan dipakai sebagai pemisah bila ada dua
mitra dengan rata-rata yang sama: mitra yang lebih banyak membantu didahulukan.

Rekapnya dapat diunduh ke PDF atau Excel. Seluruh pegawai dapat melihatnya,
karena hasilnya dipakai sebagai bahan evaluasi dan apresiasi mitra.

Berkas unduhannya memuat rata-rata dalam **dua skala sekaligus**: skala 1–10
seperti yang Anda isi, dan skala 1–5 beserta bintangnya untuk dilaporkan ke
SOBAT. Nilai yang tersimpan di sistem tetap skala 1–10; skala 1–5 hanya dihitung
saat mengunduh, supaya penilaian lama tidak berubah artinya dan peringkat antar
mitra tetap sebanding.

---

## Bagian 4 — Tim Keuangan

### 4.1 Mengatur batas honor bulanan (SBML)

| **SS-13 — Pengaturan batas honor** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

Buka pengaturan batas honor, lalu isi nilai batas honor maksimal seorang mitra
dalam satu bulan. Nilai ini dipakai untuk **seluruh mitra** dan menjadi dasar
peringatan yang muncul saat kegiatan disimpan.

Perubahan batas berlaku untuk pemeriksaan berikutnya, dan tidak mengubah
kegiatan yang sudah terlanjur disimpan.

### 4.2 Memverifikasi dokumen

| **SS-14 — Daftar dokumen yang menunggu persetujuan** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

1. Buka notifikasi, lalu klik dokumen yang menunggu persetujuan.
2. Buka tautan dokumennya dan periksa isinya.
3. Pilih salah satu:
   - **Setujui** — satu dokumen, atau sekaligus satu tahap dengan tombol
     persetujuan tahap;
   - **Tolak** — sistem **mewajibkan** Anda menulis catatan revisi. Catatan inilah
     yang dibaca Ketua Tim, jadi tulislah yang jelas, misalnya "tautan mengarah ke
     folder, bukan ke berkasnya".

### 4.3 Mengirim pengingat dokumen

Bila ada dokumen yang tautannya masih kosong, klik **Kirim Pengingat**.
Notifikasi akan masuk ke Ketua Tim dan pembuat kegiatannya.

Bila dokumen itu menjadi tanggung jawab Tim Keuangan sendiri, isilah langsung
tanpa perlu mengirim pengingat.

### 4.4 Mengatur template surat

| **SS-15 — Halaman Template Surat** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

Buka **Keuangan > Template Surat**. Yang dapat diatur:

- nama, NIP, dan jabatan Pejabat Pembuat Komitmen;
- nama, alamat, dan kota satuan kerja, serta domisili hukum yang dipakai Pasal 12;
- pola penomoran SPK dan BAST.

**Isi pasal-pasal SPK dan BAST tidak dapat diubah dari layar.** Rumusan pasalnya
tetap, dan yang berubah-ubah hanyalah data pada daftar di atas, yang lalu
disisipkan ke kepala surat, Pasal 1, Pasal 2, dan Pasal 12. Bila rumusan pasalnya
memang perlu berubah, sampaikan kepada pengelola sistem.

**Uraian tugas dan kode beban anggaran juga tidak diatur di sini**, melainkan di
**Keuangan > Generate Surat** pada langkah pertama, karena keduanya berbeda untuk
tiap kegiatan dan tiap tahap.

**Aturlah template sebelum membuat surat pertama.** Surat yang sudah terbit tidak
ikut berubah ketika template diubah, karena isinya sudah disalin ke dalam surat
tersebut.

### 4.5 Membuat SPK dan BAST

| **SS-16 — Halaman Generate Surat** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

1. Buka **Keuangan > Generate Surat**.
2. Pilih kegiatan dan bulan honornya.
3. Sistem menampilkan daftar mitra beserta honornya pada bulan tersebut.
4. Klik **Buat SPK**. Berkas PDF dibentuk untuk setiap mitra.
5. Setelah pekerjaan selesai, buat **BAST** dengan cara yang sama.

Ketentuan penomoran yang perlu Anda ketahui:

- **Satu SPK untuk satu mitra pada satu bulan.** Bila honor mitra melintasi dua
  bulan, ia menerima dua SPK dengan jangka waktu masing-masing.
- Nomor diberikan sistem, **tetap sama** bila surat dicetak ulang, dan **tidak
  kembar** dalam satu tahun.
- Nomor BAST mengikuti nomor urut SPK mitra yang sama, sehingga pasangannya mudah
  ditelusuri.

### 4.6 Riwayat penyuratan

| **SS-17 — Halaman Riwayat Penyuratan** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

Buka **Keuangan > Riwayat Penyuratan**, lalu pilih tahun. Halaman ini menampilkan
seluruh surat dalam satu tahun, termasuk surat yang dibatalkan dan nomor yang
kosong.

| Bila | Lakukan |
| --- | --- |
| Isi surat berubah karena honor direvisi | **Perbarui Isi Surat** — isinya disegarkan mengikuti data terkini, nomornya tetap |
| Mitra sudah tidak punya honor pada bulan itu | **Batalkan Surat** disertai catatan alasan. Nomornya tetap tercatat agar penomoran tidak bolong tanpa keterangan |
| Surat batal benar-benar tidak diperlukan | **Hapus Surat** — hanya untuk surat yang sudah berstatus batal |
| Penomoran perlu dirapikan | **Rapikan Nomor** — sistem menampilkan pratinjau rencana pergeseran lebih dulu; perubahan baru dijalankan setelah Anda mengetik frasa konfirmasi |

Bila ada surat yang isinya sudah berbeda dari data terkini, Anda akan menerima
notifikasi **surat berubah**. Jangan diabaikan: surat yang sudah ditandatangani
tetapi isinya tidak lagi sesuai data adalah masalah administrasi.

### 4.7 Rekap honor mitra

| **SS-18 — Halaman Manajemen Honor** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

Buka **Manajemen Honor**, lalu tentukan periodenya:

- **satu bulan tertentu**, atau
- **rentang tanggal bebas**, bila pemeriksaan Anda tidak mengikuti batas bulan.

Sistem menjumlahkan honor tiap mitra pada periode tersebut **dari seluruh
kegiatan dan seluruh tim**, lalu menandai mitra yang melebihi batas SBML.
Penjumlahan lintas tim inilah yang sebelumnya harus dikerjakan dengan
menggabungkan beberapa berkas.

Rekapnya dapat diunduh ke **PDF** atau **Excel**. Isi berkasnya selalu sama
dengan baris yang sedang tampil di layar, mengikuti periode dan pencarian yang
sedang dipakai — jadi pastikan penyaringnya sudah benar sebelum mengunduh.

---

## Bagian 5 — Admin

### 5.1 Mengelola akun pengguna

| **SS-19 — Manajemen Admin, tab Manajemen Users** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

Buka **Manajemen Admin > Manajemen Users**. Di sini Anda dapat menambah akun,
mengubah nama, NIP, dan perannya, serta mengatur ulang kata sandinya.

**NIP boleh dikosongkan** dan dilengkapi kapan saja. NIP inilah yang dipakai bila
akun tersebut ditetapkan sebagai ketua tim, dan begitu diisi langsung berlaku
untuk seluruh tahun kepengurusan orang itu — tidak perlu diketik ulang tiap
tahun.

Peran yang tersedia:

| Peran di layar | Artinya |
| --- | --- |
| Admin | Seluruh hak |
| Supervisor | Tim Keuangan |
| User | Pegawai biasa |

**Berikan peran sekecil mungkin yang masih memungkinkan orang bekerja.** Peran
Admin cukup dipegang satu atau dua orang.

### 5.2 Mengelola Ketua Tim

| **SS-24 — Manajemen Admin, tab Manajemen Ketua Tim beserta penyaring tahun** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

Buka **Manajemen Admin > Manajemen Ketua Tim**. Satu baris di sini menyatakan
**siapa memimpin tim apa pada tahun berapa**. Tautan ke akun penggunanya itulah
yang menentukan siapa yang berhak menyunting suatu kegiatan dan siapa yang
menerima notifikasi tenggat.

#### Menambah ketua tim

Isiannya hanya tiga: **tahun kepengurusan**, **akun pengguna**, dan **tim**.

Nama dan NIP tidak diketik, melainkan mengikuti akun yang Anda pilih. NIP akun
itu ditampilkan sebagai keterangan di bawah pilihannya; bila masih kosong,
kepengurusannya tetap dapat disimpan dan NIP-nya dilengkapi kapan saja di tab
Manajemen Users.

Karena nama diambil dari akun, **setiap ketua tim wajib punya akun**. Bila orang
yang bersangkutan belum punya, buatkan akunnya lebih dulu.

#### Pergantian tahun

Kepengurusan dicatat per tahun karena susunan tim kerja BPS berubah setiap tahun.
**Untuk pergantian tahun, tambahkan baris baru — jangan menyunting yang lama.**
Menyunting baris lama akan ikut mengubah ketua tim pada kegiatan tahun-tahun
sebelumnya, dan riwayatnya berubah tanpa ada yang tahu.

Agar tidak mendaftarkan ulang satu per satu, pakai tombol **Salin Kepengurusan**:
pilih tahun asal dan tahun tujuan, lalu seluruh pasangan orang-dan-tim disalin
sekaligus. Tim yang di tahun tujuan sudah terisi akan dilewati, bukan
menggagalkan penyalinan, dan sistem menyebutkan berapa yang disalin dan berapa
yang dilewati.

Satu tim hanya boleh punya satu ketua pada tahun yang sama. Bila Anda mencoba
menambah yang kedua, sistem menolaknya — dua baris serupa tidak dapat dibedakan
siapa pun yang melihat daftar pilihan di formulir kegiatan.

Gunakan **penyaring tahun** di atas daftar untuk melihat satu angkatan saja.
Kepengurusan tahun-tahun lama sengaja tidak dihapus, karena kegiatan lama masih
menunjuk kepadanya.

#### Mengganti nama tim

Bila sebuah tim berganti nama — misalnya "IPDS" menjadi "IPDTI & Analisis" —
gunakan tombol **Ganti Nama Tim**. Pilih tim lama, ketik nama barunya, lalu
tentukan cakupannya:

| Centang "ubah semua tahun" | Akibatnya |
| --- | --- |
| Menyala | Seluruh kepengurusan tim itu ikut berganti nama, termasuk tahun-tahun sebelumnya |
| Padam | Hanya kepengurusan tahun yang sedang disaring yang berganti nama; tahun lain tetap memakai nama lamanya |

Pilihan kedua dipakai bila nama lama memang benar untuk tahun-tahun sebelumnya.
Bila Anda memakainya, wajar bila nama lama masih muncul sebagai pilihan tim —
kepengurusan tahun lalu memang masih memakai nama itu, dan itu bukan kekeliruan.

Daftar pilihan tim disusun dari tim yang benar-benar tercatat di data, bukan dari
daftar tetap. Tim yang benar-benar baru ditambahkan lewat pilihan terakhir
**"+ Tim lainnya…"** pada kotak pemilih tim, tanpa perlu meminta perubahan kode
kepada pengelola sistem.

### 5.3 Mengelola data mitra

| **SS-20 — Manajemen Admin, tab Manajemen PPL** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

Buka **Manajemen Admin > Manajemen PPL**. Data yang disimpan: nama, ID SOBAT,
posisi (Pendataan atau Pengolahan), kecamatan, desa, alamat, dan nomor telepon.

**Mitra yang berhenti dinonaktifkan, bukan dihapus.** Mitra yang dihapus akan
ikut menghilangkan honor, surat, dan penilaiannya dari seluruh laporan periode
sebelumnya. Mitra yang dinonaktifkan tidak lagi muncul saat pemilihan mitra,
tetapi seluruh riwayatnya tetap utuh.

### 5.4 Mengimpor data mitra dari SOBAT

| **SS-21 — Jendela impor mitra beserta pratinjaunya** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

1. Buka **Manajemen PPL**, lalu klik **Impor**.
2. Pilih berkas Excel hasil ekspor SOBAT atau PALAPA.
3. Sistem mencocokkan tiap baris berdasarkan **ID SOBAT**, atau berdasarkan nama
   bila ID-nya belum ada.
4. Tentukan tindakan untuk tiap baris: **tambah**, **perbarui**, **lewati**, atau
   **nonaktifkan**.
5. Periksa **pratinjau ringkasannya**, lalu klik **Terapkan**.

Seluruh perubahan dijalankan sekaligus. Bila ada satu baris yang gagal, tidak ada
satu pun perubahan yang tersimpan — jadi data tidak akan pernah setengah masuk.

Wilayah pada berkas ekspor PALAPA ditulis sebagai **kode**, bukan nama. Sistem
sudah menyimpan kode kecamatan dan desa BPS sehingga dapat mencocokkannya
sendiri. Baris yang kodenya tidak dikenali tetap ditampilkan dengan wilayah
kosong agar dapat Anda perbaiki lebih dulu.

### 5.5 Mengarsipkan dan menghapus kegiatan

| **SS-22 — Riwayat kegiatan beserta tombol arsip** |
| :--- |
| _Tempel tangkapan layar di sini, lalu hapus baris ini._ |

| Tindakan | Akibatnya |
| --- | --- |
| **Arsipkan** | Kegiatan disembunyikan dari daftar utama dasbor. Seluruh datanya tetap utuh dan tetap terhitung pada rekap honor serta penilaian. Dapat dikembalikan sewaktu-waktu |
| **Hapus** | Kegiatan beserta alokasi mitra, rincian honor, progres, dokumen, dan penilaiannya hilang permanen |

Sistem **menolak penghapusan** bila kegiatan sudah memiliki alokasi mitra atau
penilaian, lalu menyarankan pengarsipan. Penghapusan permanen hanya mungkin untuk
kegiatan yang tersimpan tetapi belum sempat dikerjakan sama sekali.

**Bila ragu, arsipkan.** Pengarsipan dapat dibatalkan; penghapusan tidak.

### 5.6 Riwayat kegiatan

Setiap perubahan pada sebuah kegiatan tercatat beserta pelaku dan waktunya:
perubahan data, alokasi mitra, progres, dokumen, dan penilaian. Bukalah catatan
ini bila ada data yang berubah tanpa diketahui siapa yang mengubahnya.

---

## Bagian 6 — Bila Terjadi Masalah

| Gejala | Kemungkinan sebab | Yang harus dilakukan |
| --- | --- | --- |
| Halaman tidak terbuka sama sekali dari luar kantor | VPN belum tersambung | Sambungkan FortiClient VPN BPS lebih dulu |
| Diminta masuk kembali padahal baru saja masuk | Sesi 12 jam sudah habis, atau kata sandi baru saja diganti di perangkat lain | Masuk kembali |
| Menu yang biasa dipakai tidak ada | Peran akun berubah | Hubungi Admin |
| Tidak bisa menyunting kegiatan sendiri | Kegiatan dibuat orang lain dan Anda bukan ketua timnya | Minta pembuatnya atau ketua timnya yang menyunting |
| Muncul pesan bahwa kegiatan telah diubah orang lain | Ada yang menyimpan kegiatan yang sama bersamaan | Muat ulang halaman, lalu ulangi perubahan |
| Progres tidak bisa diisi | Kegiatan masih tahap Persiapan, atau mitra diawasi PML lain | Lihat bagian 3.2 |
| Mitra tidak muncul saat dialokasikan | Sudah dinonaktifkan, posisinya tidak sesuai tahap, atau sudah dialokasikan di kegiatan yang sama | Periksa di Manajemen PPL |
| Berkas PDF atau Excel tidak jadi terunduh | Unduhan diblokir peramban | Izinkan unduhan untuk alamat SIKAMI, lalu coba lagi |
| Angka di dasbor terasa keliru | Progres belum diperbarui PML | Periksa lewat riwayat kegiatan siapa yang terakhir memperbaruinya |
| Surat sudah terbit tetapi isinya tidak sesuai | Honor direvisi setelah surat dibuat | Tim Keuangan membuka Riwayat Penyuratan, lalu Perbarui Isi Surat |
| Pilihan Ketua Tim kosong saat membuat kegiatan | Kepengurusan tahun jadwal persiapan belum didaftarkan | Pakai tawaran kepengurusan tahun sebelumnya, atau minta Admin mendaftarkannya |
| Tombol Simpan pada penilaian mitra tetap mati | Komentar belum diisi atau kurang dari 20 karakter | Lihat penghitung karakter di bawah kotak komentar |
| Baris impor alokasi ditandai tidak bisa dipakai | Mitra tidak dikenali, nama mitra kembar, tahap keliru, beban kerja bukan bilangan bulat, atau mitranya sudah dialokasikan di tahap itu | Baca alasannya pada baris tersebut, perbaiki di Excel, lalu impor lagi |
| Honor hasil impor alokasi tertulis Rp 0 | Harga satuan tahap itu belum diisi | Isi harga satuannya di kartu tahap; seluruh honor terhitung ulang sendiri |
| Nama tim lama masih muncul sebagai pilihan | Penggantian nama hanya dilakukan untuk satu tahun | Ganti Nama Tim dengan centang "ubah semua tahun" dinyalakan |

Bila masalahnya tidak ada dalam daftar ini, catat **apa yang Anda lakukan**,
**pesan yang muncul**, dan **jam kejadiannya**, lalu sampaikan kepada pengelola
sistem. Tangkapan layar sangat membantu.

---

## Lampiran A — Daftar Tangkapan Layar

Tangkapan layar diambil dengan data contoh, bukan data mitra yang sebenarnya.
**Tutup atau kaburkan nomor telepon dan alamat mitra** sebelum gambarnya
dimasukkan ke pedoman ini.

| Kode | Halaman | Yang harus terlihat |
| --- | --- | --- |
| SS-01 | Halaman masuk | Kolom nama pengguna, kata sandi, tombol Masuk |
| SS-02 | Dasbor | Menu kiri dalam keadaan terbuka, kotak pencarian, lonceng, akun |
| SS-03 | Dasbor | Kartu ringkasan dan grafik progres per tahap |
| SS-04 | Notifikasi | Daftar notifikasi dengan setidaknya satu merah dan satu kuning |
| SS-05 | Profil | Formulir penggantian kata sandi |
| SS-06 | Kegiatan baru | Bagian informasi umum dan jadwal keempat tahap |
| SS-07 | Pemilihan mitra | Penyaring kecamatan dan desa dalam keadaan terpakai |
| SS-08 | Kegiatan baru | Daftar mitra terpilih beserta PML, beban kerja, dan honor |
| SS-09 | Peringatan SBML | Jendela peringatan beserta nama mitra, bulan, dan batasnya |
| SS-10 | Dokumen kegiatan | Daftar dokumen wajib dengan status beragam |
| SS-11 | Pembaruan progres | Panel progres dengan beberapa mitra terisi |
| SS-12 | Penilaian Mitra | Tiga aspek penilaian, kotak komentar terisi, dan bintangnya |
| SS-13 | Pengaturan batas honor | Kolom nilai batas SBML |
| SS-14 | Verifikasi dokumen | Tombol setujui dan tolak, beserta kolom catatan revisi |
| SS-15 | Template Surat | Bagian data PPK dan pola penomoran |
| SS-16 | Generate Surat | Daftar mitra beserta honor bulan terpilih |
| SS-17 | Riwayat Penyuratan | Surat aktif, surat batal, dan nomor kosong dalam satu layar |
| SS-18 | Manajemen Honor | Rekap honor dengan setidaknya satu mitra bertanda melebihi batas |
| SS-19 | Manajemen Users | Daftar akun beserta perannya |
| SS-20 | Manajemen PPL | Daftar mitra beserta kecamatan dan desanya |
| SS-21 | Impor mitra | Pratinjau ringkasan sebelum diterapkan |
| SS-22 | Riwayat kegiatan | Tombol arsipkan, dan pesan penolakan penghapusan |
| SS-23 | Impor alokasi | Langkah peninjauan, dengan baris siap dan baris bermasalah beserta alasannya |
| SS-24 | Manajemen Ketua Tim | Daftar kepengurusan, penyaring tahun, dan tombol Salin Kepengurusan |
| SS-25 | Tambah Ketua Tim | Modal berisi tahun, pemilih akun beserta keterangan NIP, dan pemilih tim |
| SS-26 | Ganti Nama Tim | Modal beserta centang "ubah semua tahun kepengurusan" |
| SS-27 | Tambah User | Formulir akun yang memperlihatkan isian NIP opsional |
