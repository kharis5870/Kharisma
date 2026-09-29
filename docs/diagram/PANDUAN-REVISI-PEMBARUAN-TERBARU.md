# Panduan Revisi Naskah untuk Pembaruan Sistem Terbaru

Berkas ini melanjutkan `PANDUAN-PENERAPAN-REVISI.md`. Bedanya, berkas itu
merapikan naskah yang sudah ada, sedangkan berkas ini **hanya memuat yang
berubah karena fitur baru** yang dikerjakan setelah versi naskah terakhir Anda.

Polanya sama seperti panduan sebelumnya:

> **Di naskah Anda:** subbab berapa
> **Tindakan:** ganti / tambahkan setelah / hapus
> **Isi:** potongan siap tempel, ada di bagian ini juga

Kerjakan berurutan. Daftar periksa ada di bagian akhir.

---

## Delapan pembaruan yang dicakup

| No  | Pembaruan                                                            | Menyentuh basis data?  |
| --- | -------------------------------------------------------------------- | ---------------------- |
| 1   | Kepengurusan ketua tim dicatat per tahun                              | **Ya** — satu kolom    |
| 2   | Komentar wajib pada setiap penilaian mitra                            | **Ya** — satu kolom    |
| 3   | Bintang 1–5 pada penilaian, mengikuti form BPS Bengkulu Selatan       | Tidak                  |
| 4   | Nilai skala 1–5 saat mengekspor ke SOBAT                              | Tidak                  |
| 5   | Penyaring tahun pada Dashboard                                        | Tidak                  |
| 6   | Impor alokasi mitra satu kegiatan dari berkas Excel                   | Tidak                  |
| 7   | Ketua tim mengikuti akun; NIP pindah ke tabel `users`                 | **Ya** — penyederhanaan |
| 8   | Nama tim mengikuti data, dan dapat diganti dari layar                 | Tidak                  |

Pembaruan nomor 7 dan 8 berbeda sifatnya dari enam lainnya: keduanya tidak
menambah kemampuan baru, melainkan **membetulkan rancangan** — nomor 7 pada
basis data, nomor 8 pada cara sistem memperoleh daftar pilihan. Keduanya justru
berguna di sidang, karena memperlihatkan Anda mengevaluasi rancangan sendiri dan
memperbaikinya dengan alasan, bukan sekadar menambah fitur.

## Yang TIDAK perlu diubah

Jangan menyunting bagian-bagian ini, supaya revisi tidak melebar:

- **Rumusan masalah, tujuan, manfaat, dan batasan (Bab I).** Ketujuh pembaruan
  ini semuanya jatuh ke dalam pokok masalah yang sudah ada.
- **Landasan teori dan metode (Bab II dan III).**
- **Arsitektur sistem, diagram nomor 12.** Tidak ada komponen baru.
- **Kolom `kegiatan.versi` dan `users.tokenVersi`.** Keduanya sudah tergambar di
  ERD Anda dan tidak berubah.

---

# A. Basis data

**Seluruh berkas diagram di folder ini SUDAH diperbarui** — `08-erd.dbml`,
`09a-erd-kegiatan-alokasi.puml`, dan `09b-erd-honor-progres-penilaian.puml`.
Yang tersisa untuk Anda: **ekspor ulang gambarnya**, ganti gambar lama di
naskah, lalu salin narasi di bawah ini.

Ringkasan perubahan yang sudah masuk ke berkas diagram:

| Tabel             | Perubahan                                                           |
| ----------------- | ------------------------------------------------------------------- |
| `users`           | **+** `nip varchar(50)`, boleh kosong                                |
| `ketua_tim`       | **+** `tahun smallint not null`, **+** indeks unik `(tim, tahun)`    |
| `ketua_tim`       | **−** `nama_ketua`, **−** `nip`; `user_id` menjadi wajib             |
| `penilaian_mitra` | **+** `komentar text`                                                |
| `template_surat`  | **−** `isi_pasal`                                                    |

## A-1. Narasi tabel `ketua_tim`

> **Di naskah Anda:** Bab IV, subbab rancangan basis data, penjelasan tabel
> `ketua_tim`
> **Tindakan:** ganti seluruh penjelasan tabel ini

Tabel `ketua_tim` menyimpan **jabatan**, bukan orang: satu baris menyatakan
seorang pegawai memimpin sebuah tim pada sebuah tahun kepengurusan. Kolom
`tahun` diperlukan karena susunan tim kerja BPS berubah setiap tahun. Tanpa
kolom itu, pergantian ketua tim hanya dapat dilakukan dengan mengubah baris
yang sudah ada, dan karena tabel `kegiatan` menyimpan `ketua_tim_id` sedangkan
nama ketuanya diambil saat ditampilkan, perubahan tersebut akan ikut mengubah
ketua tim pada seluruh kegiatan tahun-tahun sebelumnya. Dengan kolom `tahun`,
pergantian ketua tim dilakukan dengan menambah baris baru, sehingga kegiatan
lama tetap menunjuk baris lamanya dan terarsip apa adanya. Indeks unik pada
pasangan `(tim, tahun)` mencegah satu tim memiliki dua ketua pada tahun yang
sama.

Nama dan NIP pemegang jabatan **tidak disimpan pada tabel ini**, melainkan
dibaca dari tabel `users` melalui kolom `user_id` yang wajib diisi. Rancangan
awal menyimpan keduanya di tabel `ketua_tim`, dan itu menimbulkan dua persoalan.
Pertama, setiap kepengurusan tahun baru menghasilkan satu salinan nama dan NIP
orang yang sama, sehingga memperbaiki satu kesalahan ketik hanya memperbaiki
satu tahun sedangkan tahun-tahun lain tetap keliru. Kedua, petugas harus
mengetik ulang nama dan NIP yang sebenarnya sudah tersedia pada akun yang
ditautkan. Setelah dipisahkan, nama dan NIP hanya tersimpan di satu tempat dan
koreksinya berlaku untuk seluruh tahun kepengurusan orang tersebut, sementara
riwayat tetap utuh karena yang membekukan sejarah adalah pasangan orang, tim,
dan tahun pada baris jabatannya — bukan salinan ejaan namanya.

Perlu ditegaskan bahwa kolom `id` pada tabel ini adalah penanda **jabatan**,
bukan penanda orang. Seorang pegawai yang menjabat dua tahun berturut-turut akan
memiliki dua baris dengan `id` berbeda, dan yang menyatakan keduanya orang yang
sama adalah `user_id`.

## A-2. Narasi kolom `users.nip`

> **Di naskah Anda:** Bab IV, subbab rancangan basis data, penjelasan tabel
> `users`
> **Tindakan:** tambahkan paragraf berikut

Kolom `nip` pada tabel `users` menyimpan Nomor Induk Pegawai pemilik akun.
Kolom ini boleh dikosongkan, karena tidak setiap akun memiliki NIP tercatat pada
saat dibuat, dan menahan pembuatan akun hanya demi satu nomor yang dapat
dilengkapi kapan saja tidak memberi manfaat apa pun. Akun yang belum memiliki
NIP tetap dapat ditetapkan sebagai ketua tim; NIP-nya dilengkapi kemudian
melalui menu pengelolaan pengguna, dan begitu diisi langsung berlaku untuk
seluruh tahun kepengurusan pegawai tersebut.

## A-3. Narasi kolom `penilaian_mitra.komentar`

> **Di naskah Anda:** Bab IV, subbab rancangan basis data, penjelasan tabel
> `penilaian_mitra`
> **Tindakan:** tambahkan paragraf berikut

Kolom `komentar` menyimpan keterangan penilai atas nilai yang diberikannya.
Kolom ini mengikuti ketentuan penilaian mitra pada aplikasi SOBAT, dan gunanya
bukan sekadar memenuhi syarat: nilai berupa angka 1 sampai 10 tidak menjelaskan
apa pun ketika mitra mempertanyakan nilainya, atau ketika mitra yang sama
diusulkan kembali pada tahun berikutnya oleh PML yang berbeda. Kolom ini dibuat
boleh kosong sekalipun komentar wajib diisi mulai sekarang, karena penilaian
yang telah tersimpan sebelum kolom ini ada memang tidak memiliki komentar, dan
memaksa kolom ini tidak boleh kosong berarti mengarang isi untuk seluruh
penilaian lama. Kewajiban mengisinya ditegakkan pada saat penyimpanan, baik di
sisi peramban maupun di sisi server, bukan oleh struktur tabelnya.

## A-4. Kolom `ketua_tim.tim` — tidak berubah, tetapi maknanya perlu dijelaskan

> **Di naskah Anda:** Bab IV, subbab rancangan basis data, penjelasan tabel
> `ketua_tim`
> **Tindakan:** tambahkan paragraf berikut setelah narasi A-1

Kolom `tim` sengaja berupa `VARCHAR` biasa dan **tidak dibatasi oleh daftar
nilai tetap**, baik berupa `ENUM` di basis data maupun daftar tertulis di kode.
Susunan tim kerja BPS berubah: tim baru dapat dibentuk dan tim yang ada dapat
berganti nama, misalnya "IPDS" menjadi "IPDTI & Analisis". Bila daftarnya
dikunci, setiap perubahan susunan tim menuntut penyuntingan kode dan penerapan
ulang aplikasi, padahal perubahan itu murni urusan administrasi.

Sebagai gantinya, daftar pilihan tim pada layar disusun dari nilai yang
benar-benar tercatat di kolom ini, ditambah satu pilihan "Tim lainnya…" untuk
mengetik nama yang belum pernah ada. Agar kelonggaran itu tidak melahirkan tim
kembar, nama yang baru diketik dirapikan terlebih dahulu — spasi berlebih
dibuang — dan bila hanya berbeda huruf besar-kecil dari tim yang sudah ada,
ejaan yang sudah ada itulah yang dipakai. Tanpa penjagaan tersebut, "Pertanian",
"pertanian", dan "Pertanian " akan menjadi tiga tim berbeda yang masing-masing
mendapat potongan sendiri pada grafik komposisi kegiatan dan baris sendiri pada
penyaring di dasbor.

## A-5. Kolom `template_surat.isi_pasal` — dihapus

> **Tindakan:** pastikan kolom ini TIDAK muncul di ERD naskah Anda

Kolom ini pernah dirancang untuk menyimpan dua belas pasal Surat Perjanjian
Kerja sebagai JSON agar isinya dapat disunting dari layar. Rencana itu tidak
pernah dikerjakan: isi pasalnya tertulis langsung di kode pembuat dokumen, dan
tidak ada satu baris kode pun yang membaca kolom tersebut. Kolom itu kini
dihapus dari rancangan.

**Jangan menuliskan di naskah bahwa sistem dapat mengubah isi pasal dari layar.**
Kemampuan itu tidak ada dan akan langsung terlihat bila penguji meminta
demonstrasi. Yang dapat diatur dari layar hanyalah bagian yang berubah-ubah:
nama dan NIP PPK, satuan kerja, kota, dan domisili hukum.

---

# B. Use case diagram

> **Berkas:** `01-usecase.puml`
> **Di naskah Anda:** Bab IV, subbab use case diagram (Gambar 8)

Dua gelembung baru, tidak ada aktor baru.

## B-1. Use case impor alokasi mitra

Pada bagian `package` milik Ketua Tim, di bawah baris `UC_SUNTING`, tambahkan:

```
    usecase "Mengimpor Alokasi Mitra\ndari Excel" as UC_IMPORALOKASI
```

Lalu pada daftar relasi, di bawah `KT --> UC_DOK`, tambahkan:

```
KT --> UC_IMPORALOKASI
```

Dan pada kelompok relasi `<<include>>` / `<<extend>>` di bagian bawah berkas,
tambahkan dua baris:

```
UC_IMPORALOKASI ..> UC_BUAT : <<extend>>
UC_IMPORALOKASI ..> UC_SUNTING : <<extend>>
```

**Kenapa `<<extend>>` dan bukan `<<include>>`:** impor Excel adalah jalan
alternatif untuk mengisi alokasi, bukan langkah yang selalu dijalani. Membuat
kegiatan tetap bisa diselesaikan seluruhnya dengan mengisi alokasi satu per satu
di layar. Bila Anda menggunakan `<<include>>`, Anda menyatakan setiap pembuatan
kegiatan mengharuskan mengunggah berkas, dan itu tidak benar.

## B-2. Use case menyalin kepengurusan ketua tim

Pada `package` milik Admin, di bawah `UC_KT`, tambahkan:

```
    usecase "Menyalin Kepengurusan Ketua Tim\nke Tahun Berikutnya" as UC_SALINKT
```

Pada daftar relasi, di bawah `AD --> UC_KT`, tambahkan:

```
AD --> UC_SALINKT
```

Dan pada kelompok relasi bawah:

```
UC_SALINKT ..> UC_KT : <<extend>>
```

## B-3. Use case mengganti nama tim

Masih pada `package` milik Admin, tambahkan:

```
    usecase "Mengganti Nama Tim" as UC_GANTITIM
```

Pada daftar relasi:

```
AD --> UC_GANTITIM
```

Dan pada kelompok relasi bawah:

```
UC_GANTITIM ..> UC_KT : <<extend>>
```

## B-4. Empat use case yang keterangannya berubah, tanpa gelembung baru

Jangan menambah gelembung untuk hal-hal ini; cukup perbarui keterangannya di
narasi dan di tabel deskripsi use case:

- **UC_NILAI "Menilai Kinerja Mitra"** — mencakup pengisian komentar yang wajib,
  dan menampilkan bintang 1–5 sebagai ringkasan nilainya.
- **UC_DASH "Melihat Dashboard Monitoring"** — mencakup penyaringan kegiatan
  menurut tahun.
- **UC_REKNILAI "Melihat Rekap & Peringkat Penilaian"** — rekap unduhannya
  memuat kolom nilai skala 1–5 untuk dilaporkan ke SOBAT.
- **UC_KT "Mengelola Ketua Tim"** — pendaftaran ketua tim kini dilakukan dengan
  memilih akun pegawai; nama dan NIP tidak lagi diketik, melainkan mengikuti
  akun yang dipilih. Timnya dipilih dari daftar yang disusun mengikuti data,
  dengan pilihan "Tim lainnya…" untuk tim yang belum pernah ada.

Alasan tidak menambah gelembung: keempatnya adalah **perubahan isi langkah**,
bukan tujuan baru yang ingin dicapai aktor. Use case diagram menggambarkan
tujuan, dan memecah tujuan yang sama menjadi banyak gelembung hanya karena
langkahnya bertambah akan membuat Gambar 8 ramai tanpa menambah keterangan.

## B-5. Tabel deskripsi use case

> **Di naskah Anda:** tabel deskripsi use case setelah Gambar 8
> **Tindakan:** tambahkan tiga baris

| Kode | Nama use case                      | Aktor     | Deskripsi singkat                                                                                                                                                       |
| ---- | ---------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| …    | Mengimpor Alokasi Mitra dari Excel | Ketua Tim | Mengisi alokasi mitra satu kegiatan sekaligus dari berkas Excel. Setiap baris dicocokkan ke data mitra dan PML yang ada, ditinjau di layar, lalu dimasukkan ke formulir. |
| …    | Menyalin Kepengurusan Ketua Tim    | Admin     | Menyalin seluruh ketua tim satu tahun kepengurusan menjadi kepengurusan tahun berikutnya, agar tidak perlu didaftarkan ulang satu per satu.                               |
| …    | Mengganti Nama Tim                 | Admin     | Mengubah nama sebuah tim pada seluruh kepengurusan sekaligus, atau hanya pada satu tahun kepengurusan, ketika susunan tim kerja BPS berganti nama.                        |

Nomor kodenya menyesuaikan penomoran yang sudah Anda pakai.

---

# C. Activity diagram

## C-1. Diagram baru: impor alokasi mitra

> **Berkas baru:** `19-activity-impor-alokasi.puml`
> **Di naskah Anda:** Bab IV, subbab activity diagram, setelah diagram impor
> data mitra

Buat berkas baru berisi seluruh isi berikut:

```plantuml
@startuml activity-impor-alokasi
' Rincian use case "Mengimpor Alokasi Mitra dari Excel".
' Aturan pencocokan sesuai shared/imporAlokasi.ts.
'
' Tidak ada lajur "Server": seluruh pembacaan dan pencocokan berkas terjadi di
' peramban, dan hasilnya masuk ke formulir yang sedang dibuka. Data baru
' tersimpan ketika kegiatannya disimpan, lewat alur simpan kegiatan yang sudah
' ada — itulah sebabnya impor ini tidak memiliki endpoint tersendiri.
!include _gaya.iuml

|Ketua Tim|
start
:Membuka tab Alokasi PPL pada
formulir kegiatan;
:Mengunduh templat Excel
(opsional);
:Mengisi berkas: ID SOBAT, nama mitra,
tahap, PML, dan beban kerja;
:Mengunggah berkas;

|Sistem|
:Memilih lembar kerja dengan
kolom dikenali terbanyak;
:Mencari baris judul kolom;
if (Judul kolom dikenali?) then (tidak)
  |Ketua Tim|
  :Menunjuk sendiri baris judul
  dan isi tiap kolom;
  |Sistem|
else (ya)
endif

partition "Pencocokan tiap baris" {
  :Mencocokkan mitra lewat ID SOBAT,
  lalu lewat nama;
  :Mencocokkan PML lewat nama,
  termasuk nama panggilan;
  :Menandai baris kembar dan mitra
  yang sudah dialokasikan;
  :Menghitung honor = beban kerja
  x harga satuan tahap;
}
:Menampilkan pratinjau: baris siap,
perlu diperiksa, dan tidak bisa dipakai;

|Ketua Tim|
if (Hasil pratinjau sesuai?) then (tidak)
  :Memperbaiki berkas,
  lalu mengimpor ulang;
  stop
else (ya)
endif
:Menekan "Masukkan Alokasi";

|Sistem|
:Menambahkan baris yang lolos ke
formulir, per tahapnya;
:Membuka tab tahap dengan alokasi
terbanyak;

|Ketua Tim|
:Melengkapi PML yang belum terisi,
lalu menyimpan kegiatan;
stop

@enduml
```

### Narasi pendamping diagram

> **Tindakan:** tulis sebagai paragraf pengantar sebelum gambarnya

Diagram ini menggambarkan pengisian alokasi mitra satu kegiatan dari berkas
Excel. Tiga hal pada diagram ini perlu diperhatikan. Pertama, tidak ada lajur
"Server": seluruh pembacaan dan pencocokan berkas dilakukan di peramban, dan
hasilnya masuk ke formulir yang sedang terbuka, sehingga data baru benar-benar
tersimpan ketika kegiatannya disimpan melalui alur penyimpanan kegiatan yang
sudah ada. Kedua, terdapat langkah pratinjau yang wajib dilalui sebelum data
masuk, sehingga baris yang bermasalah terlihat lebih dahulu dan dapat diperbaiki
tanpa membatalkan seluruh berkas. Ketiga, mitra dikenali melalui ID SOBAT
terlebih dahulu dan baru melalui nama, karena nama mitra dapat sama antar dua
orang, sedangkan menebak akan menyebabkan honor dan penilaian tercatat atas nama
orang yang keliru tanpa menimbulkan pesan kesalahan apa pun.

## C-2. Sisipan pada diagram penilaian

> **Berkas:** `07-activity-penilaian.puml`
> **Tindakan:** ganti dua bagian

**Pertama**, cari baris ini:

```
:Mengisi nilai Sikap & Perilaku, Kualitas
Pekerjaan, dan Ketepatan Waktu (1–10);
```

Ganti menjadi:

```
:Mengisi nilai Sikap & Perilaku, Kualitas
Pekerjaan, dan Ketepatan Waktu (1–10);
:Menulis komentar penilaian;
```

**Kedua**, cari blok pemeriksaan ini:

```
if (Setiap nilai bilangan bulat 1–10?) then (tidak)
  :Menampilkan pesan galat;
  stop
else (ya)
endif
:Menghitung rata-rata tiga aspek;
```

Ganti menjadi:

```
if (Setiap nilai bilangan bulat 1–10?) then (tidak)
  :Menampilkan pesan galat;
  stop
else (ya)
endif
if (Komentar minimal 20 karakter?) then (tidak)
  :Menampilkan pesan galat;
  stop
else (ya)
endif
:Menghitung rata-rata tiga aspek;
:Menentukan bintang 1–5 dari rata-rata;
```

## C-3. Empat hal yang TIDAK perlu diagram baru

Tuliskan alasannya di naskah bila ditanya, jangan sekadar menghilangkannya:

- **Penyaring tahun pada Dashboard.** Penyaringan tampilan bukan proses bisnis;
  ia tidak mengubah keadaan data apa pun.
- **Menyalin kepengurusan ketua tim.** Alurnya lurus tanpa percabangan yang
  berarti: pilih tahun asal, pilih tahun tujuan, sistem melewati tim yang sudah
  terisi. Cukup dijelaskan satu paragraf.
- **Ekspor nilai skala 1–5.** Satu kolom tambahan pada berkas unduhan yang sudah
  ada, bukan alur tersendiri.
- **Pendaftaran ketua tim lewat pemilihan akun.** Langkahnya justru berkurang
  dari sebelumnya; tidak ada percabangan baru yang perlu digambar.
- **Mengganti nama tim.** Hanya satu percabangan, yaitu apakah penggantian
  berlaku untuk semua tahun atau satu tahun saja, dan itu lebih jelas
  dijelaskan satu paragraf daripada digambar sebagai diagram tersendiri.

---

# D. Bab IV — kebutuhan fungsional

> **Di naskah Anda:** Bab IV, tabel kebutuhan fungsional
> **Tindakan:** tambahkan sembilan baris

Nomor KF menyesuaikan penomoran Anda.

| Kebutuhan fungsional                                                                                                                                | Pengguna     | Manfaat inti yang didukung             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------- |
| Sistem dapat mencatat kepengurusan ketua tim per tahun, sehingga penggantian ketua tim tidak mengubah ketua tim pada kegiatan tahun sebelumnya           | Admin        | Pemusatan data                          |
| Sistem dapat menyalin seluruh kepengurusan ketua tim satu tahun menjadi kepengurusan tahun berikutnya                                                    | Admin        | Kemudahan administrasi                  |
| Sistem mengambil nama dan NIP ketua tim dari akun pegawai yang ditautkan, sehingga tidak perlu diketik ulang setiap tahun dan koreksinya cukup sekali    | Admin        | Pemusatan data                          |
| Sistem mewajibkan penilai menuliskan komentar pada setiap penilaian mitra                                                                                | PML          | Penilaian mitra                         |
| Sistem menampilkan mutu mitra sebagai bintang 1–5 dan menyediakan nilai skala 1–5 pada rekap unduhan untuk dilaporkan ke SOBAT                           | PML, Pegawai | Rekap unduhan, penilaian mitra          |
| Sistem dapat menyaring kegiatan pada dasbor menurut tahun                                                                                               | Pegawai      | Pemantauan kegiatan                     |
| Sistem dapat mengisi alokasi mitra satu kegiatan sekaligus dari berkas Excel, dengan peninjauan sebelum data masuk                                       | Ketua Tim    | Kemudahan administrasi, pemusatan data  |
| Sistem menyusun pilihan tim dari data yang ada dan memungkinkan penambahan tim baru tanpa penyuntingan kode                                              | Admin        | Pemusatan data                          |
| Sistem dapat mengganti nama sebuah tim pada seluruh kepengurusan sekaligus atau hanya pada satu tahun kepengurusan                                       | Admin        | Pemusatan data                          |

**Perhatikan kolom paling kanan.** Semuanya menempel pada manfaat inti yang
sudah Anda tetapkan. Kalau ada satu pembaruan yang tidak bisa Anda tautkan ke
manfaat inti, itu tanda pembaruan tersebut tidak perlu masuk naskah sama sekali.

## Catatan untuk rancangan antarmuka

> **Di naskah Anda:** Bab IV, subbab rancangan antarmuka
> **Tindakan:** tambahkan dua rancangan layar dan perbarui satu

1. **Dialog Impor Alokasi Mitra**, tiga langkah: pilih berkas, penyesuaian kolom
   bila judulnya tidak dikenali, dan peninjauan. Yang perlu terlihat pada
   gambarnya adalah tabel pratinjau beserta penggolongan baris siap, perlu
   diperiksa, dan tidak bisa dipakai.
2. **Kolom komentar pada formulir Penilaian Mitra**, beserta tampilan bintangnya.
3. **Perbarui rancangan modal Tambah/Edit Ketua Tim:** isiannya kini tinggal
   tahun kepengurusan, akun pegawai, dan tim. Isian nama dan NIP dihapus, dan
   sebagai gantinya NIP akun yang dipilih ditampilkan sebagai keterangan.
   Tabel ketua tim juga kehilangan kolom "Akun", karena kolom Nama sudah
   menampilkan nama akun itu sendiri. Pemilih timnya menampilkan daftar tim
   yang ada ditambah pilihan terakhir "+ Tim lainnya…" yang membuka kotak
   isian bebas.
4. **Modal Ganti Nama Tim**, berisi pilihan tim yang akan diganti, kotak isian
   nama baru, dan satu centang "ubah semua tahun kepengurusan". Yang perlu
   terlihat pada gambarnya adalah centang itu beserta keterangannya, karena di
   situlah letak keputusan yang menentukan riwayat tahun-tahun sebelumnya.

---

# E. Bab V — implementasi, pengujian, evaluasi, dan penerapan

## E-1. Subbab implementasi

Tangkapan layar yang perlu ditambahkan:

- Dialog Impor Alokasi Mitra pada langkah peninjauan, memperlihatkan baris yang
  ditandai bermasalah beserta alasannya.
- Formulir Penilaian Mitra dengan kolom komentar terisi dan bintangnya.
- Halaman Manajemen Admin bagian ketua tim, memperlihatkan penyaring tahun,
  tombol salin kepengurusan, dan modal tambah ketua tim yang baru.
- Formulir Tambah User yang memperlihatkan isian NIP opsional.
- Modal Ganti Nama Tim beserta centang "ubah semua tahun kepengurusan".
- Dashboard dengan penyaring tahun aktif.

## E-2. Subbab pengujian

Angka yang dapat Anda tuliskan, sudah terverifikasi:

- Jumlah pengujian otomatis seluruhnya: **742 pengujian pada 75 berkas uji**,
  seluruhnya lulus.
- Khusus impor alokasi mitra: **34 pengujian**, mencakup pencocokan mitra lewat
  ID SOBAT dan nama, pencocokan nama PML yang tidak lengkap, penolakan baris
  kembar, dan pencegahan alokasi ganda ketika berkas yang sama diimpor dua kali.
- Pemetaan bintang diuji terhadap **27 pasangan nilai dan bintang yang diambil
  dari Form Penilaian Petugas SE2026 BPS Bengkulu Selatan yang sudah terisi** —
  bukan dari rumusnya. Ini layak disebut karena berarti hasil sistem dicocokkan
  dengan keluaran yang selama ini benar-benar dipakai, bukan dengan tafsiran
  rumus.

## E-3. Subbab evaluasi

**Pengisian alokasi mitra.** Sebelumnya setiap baris alokasi menuntut empat
tindakan terpisah di layar: memilih mitra dari daftar panjang, memilih PML,
mengetik beban kerja, dan memeriksa honornya. Untuk kegiatan dengan puluhan
mitra, jumlah tindakan itu berlipat sebanyak jumlah mitranya. Dengan impor
berkas, seluruh baris masuk dalam satu kali unggah. Bila Anda ingin angka yang
dapat dibandingkan, ukur waktu pengisian satu kegiatan berisi 30 mitra dengan
kedua cara.

**Pendaftaran kepengurusan tahun baru.** Sebelumnya mendaftarkan enam ketua tim
untuk tahun berikutnya berarti mengetik ulang enam nama dan enam NIP yang
sebenarnya sudah tersimpan di akun masing-masing. Sekarang cukup memilih akun,
atau sekali menekan tombol salin kepengurusan.

**Penilaian mitra.** Kewajiban menulis komentar membuat setiap nilai memiliki
keterangan yang dapat ditelusuri, yang pada cara lama tidak ada sama sekali.

**Perubahan susunan tim.** Pergantian nama tim — yang benar-benar terjadi
selama penelitian ini, ketika "IPDS" berganti menjadi "IPDTI & Analisis" —
semula menuntut penyuntingan kode dan penerapan ulang aplikasi karena daftar
timnya tertulis di dalam kode. Setelah daftarnya disusun dari data, perubahan
serupa cukup dikerjakan dari layar oleh admin dalam hitungan detik. Kejadian
nyata ini layak disebut di Bab V karena ia menguji sifat yang biasanya hanya
diklaim di atas kertas: kemampuan sistem bertahan terhadap perubahan
organisasi.

## E-4. Subbab penerapan — daftar migrasi basis data

> **Di naskah Anda:** Bab V subbab penerapan
> **Tindakan:** bila Anda mencantumkan daftar migrasi, tambahkan lima baris ini

| Berkas migrasi                          | Isi                                                                  |
| --------------------------------------- | --------------------------------------------------------------------- |
| `2026-09-28-ketua-tim-per-tahun.sql`    | Menambah kolom `tahun` dan indeks unik `(tim, tahun)` pada `ketua_tim` |
| `2026-09-28-komentar-penilaian.sql`     | Menambah kolom `komentar` pada `penilaian_mitra`                      |
| `2026-09-28-nip-di-akun.sql`            | Menambah kolom `nip` pada `users` dan memindahkan NIP yang sudah ada  |
| `2026-09-28-ketua-tim-ikut-akun.sql`    | Mewajibkan `user_id` dan membuang `nama_ketua` serta `nip`            |
| `2026-09-28-hapus-isi-pasal.sql`        | Membuang kolom `isi_pasal` pada `template_surat`                      |

Dua migrasi terakhir dikerjakan dalam **dua tahap terpisah** dan itu layak
disebut sebagai bagian dari cara penerapan: tahap yang hanya menambah kolom
dijalankan sebelum kode baru diunggah sehingga aplikasi yang sedang berjalan
tidak terganggu, sedangkan tahap yang membuang kolom dijalankan setelah kode
baru berjalan — karena kode lama masih membaca kolom tersebut.

---

# F. Batasan yang harus tetap dijaga

Bagian ini bukan untuk ditulis di naskah, melainkan untuk Anda pegang agar tidak
ada kalimat yang melebihi kenyataan sistem.

1. **Impor alokasi bukan perekrutan mitra.** Ia mengisi alokasi untuk mitra yang
   sudah ada di basis data. Perekrutan tetap di SOBAT.
2. **Impor alokasi tidak mengurangi pencatatan progres secara manual.** Integrasi
   FASIH belum tersambung; progres tetap diinput PML.
3. **Berkas impor tidak memuat harga satuan.** Honor dihitung dari harga satuan
   per tahap di kegiatannya.
4. **Berkas impor tidak memuat metode dan bulan pembebanan honor.** Keduanya
   diatur di formulir, dan hanya ditanyakan bila rentang honor tahapnya melewati
   lebih dari satu bulan.
5. **Impor tidak langsung menulis ke basis data.** Hasilnya masuk ke formulir,
   dan tersimpan ketika kegiatannya disimpan.
6. **Nilai yang tersimpan tetap skala 1–10.** Skala 1–5 hanya dihitung saat
   mengekspor untuk SOBAT.
7. **Bintang tidak mengenal setengah bintang**, mengikuti form aslinya yang
   memakai `REPT` di Excel sehingga pecahannya terpotong.
8. **Sistem tidak dapat mengubah isi pasal Surat Perjanjian Kerja dari layar.**
   Yang dapat diatur hanya nama dan NIP PPK, satuan kerja, kota, dan domisili
   hukum.
9. **Setiap ketua tim wajib memiliki akun.** Sejak nama dan NIP dibaca dari
   akun, kepengurusan tanpa akun tidak dimungkinkan lagi.
10. **Daftar tim tidak dibatasi nilai tetap.** Jangan menuliskan enam nama tim
    sebagai daftar baku sistem; yang benar adalah daftarnya mengikuti data.
    Enam nama yang ada di kode hanya benih untuk basis data yang masih kosong.
11. **Mengganti nama tim hanya pada satu tahun memang menyisakan nama lamanya**
    pada tahun-tahun lain, dan itu disengaja: kepengurusan tahun sebelumnya
    memang masih memakai nama itu. Jangan menggambarkannya sebagai kekeliruan.

---

# G. Daftar periksa

| No   | Butir                                                                    | Berkas                                 | ✓   |
| ---- | ------------------------------------------------------------------------ | -------------------------------------- | --- |
| A-0  | Ekspor ulang ketiga berkas ERD dan ganti gambarnya di naskah             | `08-erd.dbml`, `09a…`, `09b…`          |     |
| A-1  | Narasi tabel `ketua_tim` diganti                                         | Naskah Bab IV                          |     |
| A-2  | Paragraf kolom `users.nip`                                               | Naskah Bab IV                          |     |
| A-3  | Paragraf kolom `penilaian_mitra.komentar`                                | Naskah Bab IV                          |     |
| A-4  | Paragraf kolom `ketua_tim.tim` yang tidak dibatasi nilai tetap           | Naskah Bab IV                          |     |
| A-5  | `isi_pasal` dipastikan tidak ada di ERD naskah                           | Naskah Bab IV                          |     |
| B-1  | Use case impor alokasi + dua relasi extend                               | `01-usecase.puml`                      |     |
| B-2  | Use case salin kepengurusan + relasi extend                              | `01-usecase.puml`                      |     |
| B-3  | Use case ganti nama tim + relasi extend                                  | `01-usecase.puml`                      |     |
| B-4  | Keterangan empat use case lama diperbarui                                | Naskah Bab IV                          |     |
| B-5  | Tiga baris tabel deskripsi use case                                      | Naskah Bab IV                          |     |
| C-1  | Diagram aktivitas impor alokasi dibuat dan diekspor gambarnya            | `19-activity-impor-alokasi.puml`       |     |
| C-2  | Dua sisipan pada diagram penilaian                                       | `07-activity-penilaian.puml`           |     |
| C-4  | Keterangan "10 diagram" pada draf subbab activity diagram menjadi 11     | `draf-bab4-activity-diagram.md`        |     |
| D-1  | Sembilan baris kebutuhan fungsional                                      | Naskah Bab IV                          |     |
| D-2  | Tiga rancangan antarmuka baru + satu diperbarui                          | Naskah Bab IV                          |     |
| E-1  | Enam tangkapan layar                                                     | Naskah Bab V                           |     |
| E-2  | Angka pengujian dimasukkan                                               | Naskah Bab V                           |     |
| E-3  | Empat butir evaluasi                                                     | Naskah Bab V                           |     |
| E-4  | Daftar lima migrasi pada subbab penerapan                                | Naskah Bab V                           |     |

Setelah seluruh berkas `.puml` dan `.dbml` diubah, jangan lupa mengekspor ulang
gambarnya dan mengganti gambar lama di naskah — ini langkah yang paling sering
terlewat, karena berkas sumbernya sudah benar tetapi gambar di dalam dokumen
masih yang lama.
