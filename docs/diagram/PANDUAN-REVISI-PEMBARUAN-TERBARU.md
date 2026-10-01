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

## Di mana gambar diagram tersimpan

**Satu-satunya folder gambar yang dipakai naskah adalah `docs/diagram/out/`.**
Nama berkasnya diambil dari `@startuml <nama>` di dalam berkas `.puml`, bukan
dari nama berkasnya. Karena itu `09a-erd-kegiatan-alokasi.puml` menghasilkan
`docs/diagram/out/erd-kegiatan-alokasi.svg`.

| Berkas sumber                          | Gambar hasilnya                                  |
| -------------------------------------- | ------------------------------------------------ |
| `01-usecase.puml`                      | `docs/diagram/out/usecase.svg`                   |
| `07-activity-penilaian.puml`           | `docs/diagram/out/activity-penilaian.svg`        |
| `09a-erd-kegiatan-alokasi.puml`        | `docs/diagram/out/erd-kegiatan-alokasi.svg`      |
| `09b-erd-honor-progres-penilaian.puml` | `docs/diagram/out/erd-honor-progres-penilaian.svg` |
| `09c-erd-dokumen-riwayat.puml`         | `docs/diagram/out/erd-dokumen-riwayat.svg`       |
| `09d-erd-surat-pengaturan.puml`        | `docs/diagram/out/erd-surat-pengaturan.svg`      |

**Masalah yang pernah terjadi dan sudah diperbaiki.** Tombol Export bawaan
ekstensi PlantUML semula menulis ke `out/docs/diagram/<nama-berkas>/<nama-diagram>.svg`
di akar proyek — tempat yang berbeda dari folder yang dipakai naskah. Akibatnya
ekspor dilaporkan berhasil, tetapi gambar di `docs/diagram/out/` tetap yang lama,
sehingga diagram terlihat tidak pernah berubah.

Perbaikannya sudah dipasang di `.vscode/settings.json`:

```json
"plantuml.exportIncludeFolderHeirarchy": false,
"plantuml.exportSubFolder": false,
"plantuml.exportOutDir": "docs/diagram/out",
"plantuml.exportFormat": "svg"
```

Setelan pertama itu kuncinya: ia mematikan penyalinan struktur folder sumber ke
folder keluaran, sehingga hasilnya mendarat langsung di `exportOutDir` dan
menimpa berkas lama. Ejaan `Heirarchy` memang keliru di ekstensinya; tulis persis
seperti itu atau setelannya diabaikan diam-diam.

**Mengekspor ulang seluruh diagram sekaligus** — berguna setelah banyak berkas
`.puml` diubah, atau bila ragu gambar mana yang tertinggal:

```
cd docs/diagram
java -jar "%USERPROFILE%\.vscode\extensions\jebbs.plantuml-2.18.1\plantuml.jar" ^
     -tsvg -charset UTF-8 -o "%CD%\out" "*.puml"
```

Sesudahnya, `git status docs/diagram/out/` akan memperlihatkan gambar mana saja
yang benar-benar berubah isinya.

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

Susunannya mengikuti pola narasi diagram aktivitas lain di Bab IV: alinea
pembuka menyebut partisi yang terlibat dan kebutuhan fungsional mana yang
diwujudkan beserta langkah pemenuhnya, baru kemudian alur dan percabangannya.

> Partisi yang terlibat pada diagram ini adalah Ketua Tim dan Sistem. Diagram
> ini mewujudkan KF-05 (Alokasi Mitra dan Honor) dan KF-04 (Pengelolaan
> Kegiatan). KF-05 dipenuhi pada langkah pembacaan berkas, pencocokan setiap
> baris terhadap data mitra dan PML, pratinjau yang wajib dilalui sebelum data
> masuk ke formulir, serta penghitungan honor sebesar beban kerja dikali harga
> satuan tahap. KF-04 dipenuhi pada langkah terakhir, ketika baris yang lolos
> masuk ke formulir kegiatan dan tersimpan melalui alur penyimpanan kegiatan yang
> sudah ada beserta seluruh pemeriksaan haknya.
>
> Ketua Tim membuka tab Alokasi PPL pada formulir kegiatan, bila perlu mengunduh
> templat Excel yang disediakan, lalu mengisi berkas berisi ID SOBAT, nama mitra,
> tahap, PML, dan beban kerja. Harga satuan sengaja tidak diminta di berkas
> karena harga merupakan setelan per tahap pada kegiatannya, sehingga memasukkan
> ke berkas akan menimbulkan dua sumber kebenaran yang dapat berbeda. Setelah
> berkas diunggah, sistem memilih lembar kerja dengan kolom dikenali terbanyak,
> kemudian mencari baris judul kolomnya.
>
> Percabangan pertama adalah pengenalan judul kolom. Bila judulnya tidak
> dikenali, sistem tidak menolak berkas, melainkan meminta Ketua Tim menunjuk
> sendiri baris judul dan isi tiap kolom. Percabangan ini penting karena bentuk
> berkas yang beredar dapat berubah sewaktu-waktu, dan menolak berkas akan
> memaksa perubahan kode setiap kali bentuknya bergeser.
>
> Sistem kemudian mencocokkan setiap baris. Mitra dikenali melalui ID SOBAT
> terlebih dahulu, baru melalui nama. Urutan ini disengaja karena nama mitra
> dapat sama antara dua orang; bila ditemukan lebih dari satu mitra bernama sama,
> barisnya ditandai dan pengguna diminta mengisi ID SOBAT, bukan ditebak.
> Menebak akan menyebabkan honor dan penilaian tercatat atas nama orang yang
> keliru tanpa menimbulkan pesan kesalahan apa pun. PML dicocokkan melalui
> namanya dan menerima penulisan sebagian, karena pegawai lazim menuliskan nama
> awal saja. Sistem juga menandai baris kembar, yaitu dua baris dengan mitra dan
> tahap yang sama, serta mitra yang sudah dialokasikan pada tahap tersebut.
> Terakhir, honor setiap baris dihitung sebesar beban kerja dikali harga satuan
> tahapnya.
>
> Percabangan kedua adalah peninjauan hasil. Sistem menampilkan pratinjau yang
> menggolongkan baris menjadi siap dipakai, perlu diperiksa, dan tidak dapat
> dipakai. Bila hasilnya belum sesuai, Ketua Tim memperbaiki berkasnya lalu
> mengimpor ulang. Langkah ini wajib dilalui sehingga baris yang bermasalah
> terlihat lebih dahulu dan dapat diperbaiki tanpa membatalkan seluruh berkas.
>
> Bila hasilnya sudah sesuai, baris yang lolos dimasukkan ke formulir menurut
> tahapnya masing-masing, dan sistem membuka tab tahap dengan alokasi terbanyak
> agar hasilnya langsung terlihat. Ketua Tim melengkapi PML yang belum terisi,
> lalu menyimpan kegiatan. Perlu diperhatikan bahwa diagram ini tidak memiliki
> lajur "Server" pada bagian pembacaan dan pencocokan, karena keduanya dikerjakan
> di peramban dan hasilnya hanya masuk ke formulir yang sedang terbuka. Data baru
> benar-benar tersimpan ketika kegiatannya disimpan, melalui alur penyimpanan
> kegiatan yang sudah ada beserta seluruh pemeriksaan haknya.

Impor alokasi **tidak memerlukan nomor KF baru**: ia bagian dari KF-05, sesuai
rumusan pengganti pada bagian D-2. Lihat penjelasan di bagian D mengapa
kesembilan pembaruan dilebur, bukan ditambahkan sebagai baris baru.

## C-1c. Dua hitungan yang ikut berubah karena diagram baru ini

> **Di naskah Anda:** Bab IV 4.2.3, kalimat pembuka dan **Tabel 11 (Ringkasan
> Activity Diagram)**
> **Tindakan:** ubah satu kata, dan sisipkan satu baris

Menambah satu diagram berarti dua tempat lain ikut salah hitung. Keduanya mudah
terlewat karena letaknya jauh dari gambarnya.

**Pertama**, kalimat pembuka 4.2.3 berbunyi "Sepuluh activity diagram berikut".
Ubah menjadi **"Sebelas activity diagram berikut"**.

**Kedua**, Tabel 11 masih memuat sepuluh baris. Sisipkan satu baris pada
**urutan ketiga**, tepat setelah baris Pembuatan Kegiatan, lalu nomori ulang
baris di bawahnya menjadi 4 sampai 11:

| No | Activity Diagram      | Partisi          | Kebutuhan Fungsional Terkait |
| -- | --------------------- | ---------------- | ---------------------------- |
| 3  | Impor Alokasi Mitra   | Ketua Tim, Sistem | KF-05                       |

Letaknya harus urutan ketiga, bukan ditempel di bawah, supaya nomor di Tabel 11
sama persis dengan nomor urut gambarnya di naskah. Diagram ini memang kelanjutan
langsung dari pembuatan kegiatan dan alokasi mitra, jadi urutannya pun masuk akal
dibaca.

Kolomnya ditulis **Partisi**, bukan "Pelaku", sesuai butir B-11 pada reviu
terdahulu. Alasannya: kolom itu memuat "Sistem", padahal Sistem bukan pelaku —
ia tidak muncul sebagai aktor pada use case diagram. Yang sebenarnya didaftar di
kolom itu adalah lajur pada diagramnya, dan istilah bakunya partisi, sejalan
dengan baris Swimlanes pada Tabel 2.

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

### Narasi pendamping diagram penilaian

> **Tindakan:** ganti narasi lama diagram penilaian

Narasi lama disusun sebelum kolom komentar dan bintang ada, sehingga keduanya
belum disebut. Versi di bawah sudah memuatnya, dengan susunan yang sama seperti
narasi diagram lain: partisi, kebutuhan fungsional beserta langkah pemenuhnya,
baru alur dan percabangannya.

> Partisi yang terlibat pada diagram ini adalah PML dan Sistem. Diagram ini
> mewujudkan KF-14 (Penilaian Kinerja), KF-15 (Pemeringkatan Triwulanan), dan
> KNF-01 (Keamanan Akses). KF-14 dipenuhi pada langkah pengisian tiga aspek
> penilaian, penulisan komentar beserta percabangan pemeriksaan panjangnya,
> penghitungan rata-rata, dan penentuan bintang mutu dari rata-rata tersebut.
> KF-15 dipenuhi pada langkah pengelompokan penilaian menurut triwulan
> berdasarkan bulan pembebanan honor dan penghitungan nilai akhir beserta
> urutannya. KNF-01 dipenuhi pada percabangan pemeriksaan hak akses, yang
> memastikan hanya PML pengawas mitra tersebut atau Admin yang dapat menyimpan
> penilaian.
>
> PML membuka menu Penilaian Mitra dan memilih tahun serta triwulan. Sistem
> menampilkan alokasi mitra yang honornya dibebankan pada triwulan tersebut. PML
> memilih mitra yang diawasinya lalu mengisi nilai pada tiga aspek, yaitu sikap
> dan perilaku, kualitas pekerjaan, dan ketepatan waktu, dengan skala bilangan
> bulat 1 sampai 10, kemudian menuliskan komentar penilaian.
>
> Percabangan pertama adalah pemeriksaan hak akses. Sistem memastikan bahwa
> pengguna yang mengisi nilai memang PML yang mengawasi mitra tersebut, atau
> Admin. Bila bukan, penyimpanan ditolak. Pemeriksaan ini dilakukan di sisi
> server dan identitas penilai diambil dari token, bukan dari data yang dikirim
> peramban, sehingga pengguna tidak dapat mengaku sebagai PML lain. Pembatasan
> ini menggantikan keadaan sebelumnya ketika berkas penilaian dapat diubah siapa
> pun yang memiliki tautannya.
>
> Percabangan kedua adalah pemeriksaan nilai. Nilai harus berupa bilangan bulat 1
> sampai 10; di luar itu ditolak. Percabangan ketiga adalah pemeriksaan komentar,
> yang harus terisi minimal dua puluh karakter setelah spasi berlebih dibuang.
> Kewajiban ini bukan sekadar syarat kelengkapan: angka 1 sampai 10 tidak
> menjelaskan apa pun ketika mitra mempertanyakan nilainya, atau ketika mitra
> yang sama diusulkan kembali tahun berikutnya oleh PML yang berbeda.
>
> Bila keduanya sah, sistem menghitung rata-rata ketiga aspek, menentukan bintang
> mutu dari rata-rata tersebut, lalu menyimpannya. Bintang dihitung dengan
> membagi rata-rata dengan dua dan memotong pecahannya, mengikuti Form Penilaian
> Petugas yang dipakai BPS Kabupaten Bengkulu Selatan, sehingga tidak dikenal
> setengah bintang. Batas bawahnya satu bintang, karena kolom bintang menyatakan
> mutu terendah, bukan keadaan belum dinilai.
>
> Bagian akhir diagram menggambarkan penyusunan peringkat. Sistem mengelompokkan
> penilaian menurut triwulan berdasarkan bulan pembebanan honor mitra, bukan
> berdasarkan tanggal penilaian diisi, agar mitra masuk ke triwulan tempat
> pekerjaannya benar-benar dilakukan. Nilai akhir dihitung dari rata-rata seluruh
> nilai ditambah 0,01 dikali jumlah kegiatan yang diikuti mitra pada triwulan
> tersebut, lalu daftar diurutkan dari nilai tertinggi. Penambahan kecil itu
> dipakai untuk membedakan mitra yang nilainya sama dengan mengutamakan mitra
> yang lebih banyak mengerjakan kegiatan. Hasilnya dapat diunduh dalam bentuk PDF
> dan Excel, dan pada rekap unduhan nilai turut disajikan dalam skala 1 sampai 5
> untuk dilaporkan ke SOBAT.

Komentar wajib dan bintang mutu **tidak memerlukan nomor KF baru**: keduanya
bagian dari KF-14, sesuai rumusan pengganti pada bagian D-2. Daftar KF yang
disebut di alinea pembuka karena itu sama dengan sebelumnya — KF-14, KF-15, dan
KNF-01 — hanya langkah pemenuh KF-14 yang bertambah.

**Satu hal yang TIDAK boleh ditulis di narasi:** nilai yang tersimpan tetap skala
1 sampai 10. Skala 1 sampai 5 hanya dihitung saat mengekspor untuk SOBAT, dan
nilai akhir pemeringkatan tidak ikut dikonversi karena angka itu memuat bonus
0,01 per kegiatan sebagai pemecah seri, bukan nilai mutu.

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
> **Tindakan:** JANGAN menambah baris. Kesembilan pembaruan di bawah dilebur ke
> dalam enam KF yang sudah ada — rumusan penggantinya ada di bagian D-2.

**Kenapa tidak ditambahkan sebagai baris baru.** Tabel KF Anda disusun per
**modul**, bukan per fitur: KF-01 sampai KF-16 masing-masing adalah satu modul
dengan penjelasan berbentuk paragraf. Kesembilan butir di bawah adalah fitur
tunggal berupa satu kalimat. Menambahkannya sebagai KF-17 sampai KF-25 akan
membuat separuh tabel berisi modul dan separuh lagi berisi fitur, dan penguji
akan menanyakan mengapa "mengganti nama tim" setara kedudukannya dengan
"Pengelolaan Kegiatan".

Daftar di bawah karena itu berfungsi sebagai **daftar periksa**, bukan baris
naskah. Kolom paling kanan dipertahankan supaya terlihat setiap pembaruan
menempel pada manfaat inti; kolom "Dilebur ke" menunjukkan KF mana yang memuatnya
setelah diperbarui.

| Kebutuhan fungsional                                                                                                                                | Pengguna     | Manfaat inti yang didukung             | Dilebur ke |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------- | ---------- |
| Sistem dapat mencatat kepengurusan ketua tim per tahun, sehingga penggantian ketua tim tidak mengubah ketua tim pada kegiatan tahun sebelumnya           | Admin        | Pemusatan data                          | KF-02      |
| Sistem dapat menyalin seluruh kepengurusan ketua tim satu tahun menjadi kepengurusan tahun berikutnya                                                    | Admin        | Kemudahan administrasi                  | KF-02      |
| Sistem mengambil nama dan NIP ketua tim dari akun pegawai yang ditautkan, sehingga tidak perlu diketik ulang setiap tahun dan koreksinya cukup sekali    | Admin        | Pemusatan data                          | KF-02      |
| Sistem mewajibkan penilai menuliskan komentar pada setiap penilaian mitra                                                                                | PML          | Penilaian mitra                         | KF-14      |
| Sistem menampilkan mutu mitra sebagai bintang 1–5 dan menyediakan nilai skala 1–5 pada rekap unduhan untuk dilaporkan ke SOBAT                           | PML, Pegawai | Rekap unduhan, penilaian mitra          | KF-14      |
| Sistem dapat menyaring kegiatan pada dasbor menurut tahun                                                                                               | Pegawai      | Pemantauan kegiatan                     | KF-07      |
| Sistem dapat mengisi alokasi mitra satu kegiatan sekaligus dari berkas Excel, dengan peninjauan sebelum data masuk                                       | Ketua Tim    | Kemudahan administrasi, pemusatan data  | KF-05      |
| Sistem menyusun pilihan tim dari data yang ada dan memungkinkan penambahan tim baru tanpa penyuntingan kode                                              | Admin        | Pemusatan data                          | KF-02      |
| Sistem dapat mengganti nama sebuah tim pada seluruh kepengurusan sekaligus atau hanya pada satu tahun kepengurusan                                       | Admin        | Pemusatan data                          | KF-02      |

Perhatikan kolom terakhir: **kesembilan butir hanya menyentuh empat KF**, yaitu
KF-02, KF-05, KF-07, dan KF-14. Keempatnya sudah termuat dalam enam rumusan
pengganti di bagian D-2, jadi tidak ada yang tertinggal walaupun tabelnya tetap
enam belas baris.

**Perhatikan kolom paling kanan.** Semuanya menempel pada manfaat inti yang
sudah Anda tetapkan. Kalau ada satu pembaruan yang tidak bisa Anda tautkan ke
manfaat inti, itu tanda pembaruan tersebut tidak perlu masuk naskah sama sekali.

## D-2. Enam KF lama yang isinya harus diperbarui

> **Di naskah Anda:** Bab IV, tabel kebutuhan fungsional KF-01 sampai KF-16
> **Tindakan:** ganti kolom Penjelasan pada keenam baris berikut

Keenam baris ini dicocokkan langsung terhadap kelima berkas migrasi dan kode
sumbernya, bukan hanya terhadap daftar pembaruan. Sepuluh KF lain — KF-03,
KF-04, KF-08, KF-09, KF-10, KF-12, KF-13, KF-15, dan KF-16 — sudah sesuai dan
tidak perlu disentuh.

### KF-01 Otentikasi dan Kata Sandi

Yang berubah: NIP kini tersimpan di akun pengguna, sehingga ikut menjadi data
yang hanya dapat diubah Admin. Perhatikan bahwa halaman profil **tidak**
menampilkan NIP, jadi jangan menulis bahwa pengguna dapat melihatnya sendiri.

> Masuk dengan nama pengguna dan kata sandi; akses tiap halaman dibatasi menurut
> peran; pengguna dapat melihat identitas akunnya dan mengganti kata sandinya
> sendiri. Nama lengkap, NIP, dan peran hanya dapat diubah Admin.

### KF-02 Data Master

Baris yang paling banyak berubah, mencakup empat pembaruan sekaligus.

> Admin mengelola akun pengguna beserta peran dan NIP-nya, kepengurusan Ketua
> Tim, dan profil mitra lengkap dengan kecamatan serta desanya. Kepengurusan
> Ketua Tim dicatat per tahun, sehingga pergantian ketua tim dilakukan dengan
> menambah kepengurusan tahun baru dan kegiatan tahun-tahun sebelumnya tetap
> menunjuk ketua tim yang menjabat saat itu. Kepengurusan satu tahun dapat
> disalin sekaligus menjadi kepengurusan tahun berikutnya. Nama dan NIP ketua tim
> diambil dari akun pegawai yang ditautkan, tidak diketik ulang, sehingga koreksi
> ejaan cukup dilakukan sekali dan berlaku untuk seluruh tahun kepengurusannya.
> Daftar tim disusun dari data yang ada, dan nama sebuah tim dapat diganti pada
> seluruh tahun kepengurusan sekaligus atau hanya pada satu tahun. Mitra yang
> berhenti dinonaktifkan, bukan dihapus, agar honor, surat, dan penilaiannya
> tetap tersimpan; mitra nonaktif tetap tampil di Daftar PPL dengan penanda,
> tetapi tidak dapat dialokasikan ke kegiatan baru. Daftar mitra dapat dilihat,
> disaring per wilayah, dan diekspor ke Excel oleh seluruh pegawai.

### KF-05 Alokasi Mitra dan Honor

Dua perubahan: impor alokasi dari Excel, dan penegasan bahwa mitra nonaktif
tidak dapat dipilih di kedua pemilih mitra.

> Mitra aktif dialokasikan ke tiap tahap beserta PML pengawas, beban kerja, dan
> harga satuan; honor terisi otomatis sebesar beban kerja dikali harga satuan.
> Mitra dipilih dari daftar yang dapat disaring menurut kecamatan dan desa, hanya
> memuat mitra sesuai posisi tahap, serta menolak mitra yang sudah dialokasikan
> pada tahap itu maupun mitra yang sudah dinonaktifkan. Seluruh baris alokasi
> satu kegiatan juga dapat diisi sekaligus dari berkas Excel, dengan peninjauan
> yang menggolongkan baris menjadi siap dipakai, perlu diperiksa, dan tidak dapat
> dipakai sebelum data masuk ke formulir. Bila periode honor melintasi beberapa
> bulan, muatan dibagi dengan tiga cara: satu bulan penuh, dibagi menurut jumlah
> hari, atau luber.

### KF-06 Validasi Batas SBML

Satu koreksi fakta: jendela peringatan **tidak menyebutkan nama bulannya**. Yang
ditampilkan hanya nama mitra, total honor, dan batasnya, dengan keterangan
"di bulan terpilih". Kata "bulan" pada rumusan lama karena itu dihapus.

> Setiap penyimpanan kegiatan, sistem menjumlahkan honor tiap mitra per bulan
> dari seluruh kegiatan lalu membandingkannya dengan batas honor bulanan. Bila
> melebihi, sistem menampilkan peringatan berisi nama mitra, total honor pada
> bulan pembebanan tersebut, dan batasnya, lalu meminta konfirmasi sebelum
> menyimpan. Nilai batas diatur Tim Keuangan atau Admin.

### KF-07 Pemantauan Progres

Satu tambahan di kalimat terakhir: penyaring tahun pada dasbor.

> PML menginput progres mitra yang diawasinya. Tahap pendataan memakai status
> open, submit, diperiksa, dan approved; tahap pengolahan memakai belum entry,
> sudah entry, validasi, dan clean. Total progres tidak boleh melebihi beban
> kerja. Pengisian progres hanya terbuka sejak hari pertama masa pengumpulan
> data. Rekapitulasinya tampil pada dasbor dalam bentuk grafik dan tabel,
> dilengkapi penyaring tahun kegiatan, penyaring lain, dan pencarian global.

### KF-11 Surat Perjanjian Kerja dan BAST

Koreksi fakta: kolom `isi_pasal` sudah dihapus, sehingga isi pasal **tidak dapat
diatur dari layar**. Yang dapat diatur tinggal data PPK, satuan kerja, kota,
domisili hukum, dan pola nomor.

> Tim Keuangan membuat SPK dan BAST mitra dalam bentuk PDF untuk satu bulan
> honor, satu surat per mitra per bulan. Surat disusun dari template yang dapat
> diatur, meliputi nama dan NIP PPK, satuan kerja, kota, domisili hukum, serta
> pola nomor SPK dan BAST, dilengkapi uraian tugas dan kode beban anggaran. Isi
> pasal perjanjian tidak dapat diubah dari layar karena merupakan bagian baku
> surat. Nomor diberikan otomatis, tetap sama bila dicetak ulang, tidak kembar
> dalam satu tahun, dan nomor BAST mengikuti nomor urut SPK mitra yang sama.

### KF-14 Penilaian Kinerja

Tiga tambahan: komentar wajib, bintang mutu, dan skala 1–5 untuk SOBAT.

> PML menilai mitra yang diawasinya pada tiga aspek (sikap dan perilaku, kualitas
> pekerjaan, ketepatan waktu) dengan skala bilangan bulat 1-10, disertai komentar
> penilaian yang wajib diisi minimal dua puluh karakter, lalu rata-ratanya
> dihitung otomatis dan ditampilkan sebagai bintang 1-5. Mitra yang diawasi PML
> lain tidak dapat dinilai, dan pembatasan ini ditegakkan di sisi server. Hasil
> penilaian dapat diekspor ke PDF dan Excel, dengan nilai turut disajikan dalam
> skala 1-5 untuk dilaporkan ke SOBAT, sedangkan nilai yang tersimpan tetap
> berskala 1-10.

## D-3. SOBAT dan FASIH disebut berulang tetapi tidak pernah dijelaskan

> **Di naskah Anda:** Bab I, pada penyebutan pertama masing-masing
> **Tindakan:** tambahkan keterangan singkat sekali saja

Penelusuran ke seluruh draf bab menemukan **SOBAT disebut 18 kali** (Bab I, IV,
dan V) dan **FASIH belasan kali**, tetapi tidak ada satu kalimat pun yang
menjelaskan keduanya itu apa. Tidak ada "SOBAT adalah…", tidak ada
kepanjangannya, dan keduanya tidak masuk daftar singkatan.

Ini celah yang mudah ditanya penguji, terutama karena SOBAT memikul beban
argumen yang berat di naskah Anda: ia alasan mengapa perekrutan mitra berada di
luar ruang lingkup, sumber berkas impor mitra, dan tujuan ekspor nilai skala 1–5.
Pembaca yang tidak bekerja di BPS tidak punya cara menebaknya.

Cukup satu kalimat pada penyebutan pertama di Bab I, misalnya berpola:

> …ditangani aplikasi SOBAT (kepanjangan resmi), yaitu aplikasi milik BPS yang
> dipakai untuk merekrut dan mengelola data mitra statistik secara nasional.

Hal yang sama berlaku untuk FASIH pada penyebutan pertamanya.

### Di kalimat mana persisnya

Draf buku sudah ditelusuri, dan inilah dua titik penyisipannya.

**FASIH — Bab I, Latar Belakang, halaman 9.** Kalimatnya berbunyi:

> "Pada pelaksanaannya, BPS RI sebenarnya telah menyediakan aplikasi pemantauan
> terpusat bernama FASIH untuk mendukung kegiatan survei berskala besar."

Sisipkan keterangannya di kalimat itu juga, karena di situlah FASIH muncul
pertama kali dan justru di situ pembaca butuh tahu apa yang sedang dibandingkan:

> "Pada pelaksanaannya, BPS RI sebenarnya telah menyediakan aplikasi pemantauan
> terpusat bernama FASIH, yaitu aplikasi pengumpulan dan pemantauan data lapangan
> milik BPS yang dipakai secara nasional, untuk mendukung kegiatan survei
> berskala besar."

**SOBAT — Bab I, Latar Belakang, halaman 7.** Penyebutan SOBAT yang ada
sekarang justru baru muncul di Batasan Masalah halaman 17, padahal perekrutan
mitra sudah dibahas sepuluh halaman sebelumnya tanpa menyebut aplikasinya.
Kalimat yang ada sekarang:

> "Berdasarkan prosedur yang berlaku, BPS Kabupaten Bengkulu Selatan mengadakan
> perekrutan mitra statistik secara massal setiap satu tahun sekali untuk
> menyusun basis daftar mitra yang memenuhi kualifikasi."

Tambahkan satu kalimat sesudahnya:

> "Perekrutan tersebut dijalankan melalui SOBAT, yaitu aplikasi milik BPS yang
> dipakai secara nasional untuk mendaftar, menyeleksi, dan menyimpan data mitra
> statistik, sehingga daftar mitra yang memenuhi kualifikasi terkumpul di sana."

Dengan begitu, ketika SOBAT disebut lagi pada Batasan Masalah butir 1 dan butir
3, pembaca sudah mengenalnya dan kalimat batasannya tidak perlu diubah sama
sekali.

### Dua rambu

**Jangan memaksakan kepanjangan.** Pola kalimat di atas sengaja tidak memuat
kepanjangan, melainkan menjelaskan aplikasinya itu apa dan dipakai untuk apa.
Alasannya: belum tentu SOBAT dan FASIH adalah akronim. Bila keduanya ternyata
nama produk, memaksakan kepanjangan justru menciptakan kesalahan baru. Bila Anda
memang menemukan kepanjangan resminya pada pedoman, surat edaran, atau halaman
resmi aplikasinya, silakan tambahkan beserta sitasinya; bila tidak, keterangan
deskriptif di atas sudah cukup dan tidak dapat disalahkan.

Kehati-hatian ini bukan berlebihan. Berkas `REVIU-MENYELURUH-BUKU.md` butir B-2
mencatat kepanjangan SBML pernah tertulis salah di naskah ini, dan butir B-26
mencatat nama sistem Anda sendiri sempat punya tiga kepanjangan berbeda di tiga
tempat.

**Jangan membuat daftar singkatan.** Saran sebelumnya di panduan ini menyebut
"masukkan ke daftar singkatan"; itu keliru dan sudah dicabut. Templat Pedoman
Skripsi KS Edisi Keenam yang Anda pakai hanya memuat Daftar Isi, Daftar Tabel,
Daftar Gambar, dan Daftar Lampiran — tidak ada Daftar Singkatan. Menambahkannya
justru menyimpang dari templat. Cukup jelaskan sekali pada penyebutan pertama.

### Catatan opsional untuk KF-03

Tidak wajib, tetapi bila ingin tepat: pembaca berkas impor mitra juga mengenali
judul kolom ekspor **PALAPA** (lihat `ALIAS_KOLOM` pada `shared/imporMitra.ts`,
misalnya `posisiditerima`) dan menerima wilayah berupa kode, bukan hanya nama.
Judul "Impor Mitra dari SOBAT" karena itu lebih sempit daripada kemampuan
sebenarnya. Bila diubah, sebut kedua sumber berkasnya.

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

## E-5. Subbab CSUQ — populasi, sampel, dan keterbatasannya

> **Di naskah Anda:** Bab V subbab CSUQ, tepat sebelum tabel karakteristik responden
> **Tindakan:** tambahkan paragraf berikut
> **Isi:** siap tempel

Naskah lama hanya menyebut bahwa responden adalah pegawai yang memakai sistem,
tanpa menyebut berapa jumlah seluruhnya. Tanpa angka itu, jumlah responden akan
terbaca sebagai angka yang dipilih sembarangan.

> Responden penelitian ini adalah pegawai BPS Kabupaten Bengkulu Selatan yang
> menggunakan sistem, yaitu Ketua Tim, PML, Tim Keuangan, dan Admin. Dari 28
> pegawai di satuan kerja tersebut, sebanyak 25 orang memiliki akun dan
> menggunakan sistem dalam pekerjaan sehari-hari, dan kepada merekalah kuesioner
> disebarkan. Kuesioner diisi oleh 12 responden, atau 48% dari pegawai yang
> menggunakan sistem.
>
> Jumlah tersebut dipandang memadai karena tiga alasan. Pertama, keempat peran
> dalam sistem seluruhnya terwakili, sehingga setiap sudut pandang pemakaian
> ikut dinilai; pada evaluasi kegunaan, keterwakilan jenis pengguna lebih
> menentukan daripada besarnya proporsi. Kedua, penilaian hanya bermakna bila
> diberikan oleh orang yang benar-benar pernah memakai sistem, sehingga
> pembatasan responden pada pengguna aktif merupakan keputusan mutu, bukan
> sekadar keterbatasan keadaan. Ketiga, CSUQ merupakan kuesioner baku yang telah
> diuji secara psikometrik dan memiliki keandalan internal tinggi (Lewis, 1995),
> sehingga skornya tetap stabil tanpa menuntut jumlah responden yang besar.

### Paragraf keterbatasan penelitian

> **Di naskah Anda:** subbab keterbatasan penelitian (Bab V atau Bab VI, ikuti susunan naskah Anda)
> **Tindakan:** tambahkan satu butir
> **Isi:** siap tempel

Butir ini **wajib ada**. Menyebutkan sendiri batas keberlakuan hasil jauh lebih
kuat daripada menunggu ditanya penguji, dan mencegah kesimpulan Bab VI terbaca
melebihi yang didukung data.

> Pengukuran kepuasan pengguna dengan CSUQ diisi oleh 12 dari 25 pegawai yang
> menggunakan sistem. Dengan jumlah tersebut, hasilnya menggambarkan kepuasan
> responden yang mengisi kuesioner dan tidak dimaksudkan sebagai pendugaan bagi
> seluruh pengguna. Selain itu, jumlah responden pada masing-masing peran
> berkisar antara dua sampai empat orang, sehingga perbandingan skor antar-peran
> tidak dilakukan; peran hanya disajikan sebagai keterangan responden.

**Tiga hal yang harus dijaga konsisten sesudah menambahkan bagian ini:**

1. **Jangan memakai rumus Slovin.** Dengan populasi 25, rumus itu menuntut 20
   responden pada taraf galat 10%, dan 12 responden setara dengan galat sekitar
   21%. Menyebut Slovin akan melemahkan naskah Anda sendiri, bukan menguatkannya.
2. **Jangan memakai istilah _sampling jenuh_ atau _total sampling_.** Keduanya
   berarti seluruh populasi menjadi responden, sedangkan di sini 12 dari 25.
3. **Jangan membandingkan skor CSUQ antar-peran.** Kelompok Admin hanya 2 orang
   dan Tim Keuangan 3 orang. Laporkan skor keseluruhan beserta tiga dimensinya,
   yaitu kegunaan sistem, kualitas informasi, dan kualitas antarmuka.

**Rujukan:** tidak ada yang perlu ditambahkan. Lewis (1995) sudah ada di daftar
pustaka sebagai sumber instrumen CSUQ, dan Sauro & Lewis (2016) sudah ditetapkan
sebagai acuan penafsiran skornya. Rujukan metodologi penelitian baru hanya
diperlukan bila Anda memakai rumus Slovin — yang justru disarankan tidak dipakai.

## E-6. Subbab pengujian kinerja — temuan dan perbaikan CLS

> **Di naskah Anda:** Bab V subbab pengujian kinerja (Lighthouse)
> **Tindakan:** ganti kalimat penutup, dan pastikan tabelnya memuat sepuluh halaman
> **Isi:** siap tempel

Pengujian Lighthouse menemukan satu halaman yang metriknya di luar ambang, lalu
halaman itu diperbaiki dan diuji ulang. Inilah satu-satunya contoh nyata umpan
balik pada metode Modified Waterfall di seluruh naskah, sehingga layak disebut.

Tabel hasil pengujian memuat **sepuluh halaman**, bukan tujuh seperti draf lama:
Halaman Masuk, Dasbor Monitoring, Input Kegiatan, Manajemen Honor, Daftar PPL,
Penilaian Mitra, Generate Surat, Template Surat, Riwayat Penyuratan, dan
Manajemen Admin. Baris rata-ratanya: skor 99,1; FCP 0,44 detik; LCP 0,83 detik;
TBT 19,0 ms; CLS 0,020; Speed Index 0,73 detik.

> Rata-rata skor kinerja seluruh halaman sebesar 99,1 dan seluruhnya termasuk
> kategori Baik. Halaman Dasbor Monitoring memperoleh skor terendah, yaitu 97,
> karena memuat delapan grafik sekaligus; hal itu terlihat dari _Total Blocking
> Time_ 70 ms dan _Largest Contentful Paint_ 1,1 detik, keduanya tertinggi di
> antara seluruh halaman. Halaman Masuk, Daftar PPL, dan Template Surat
> memperoleh skor tertinggi karena memuat paling sedikit data. Hasil ini
> memenuhi KNF-03 yang mensyaratkan perpindahan halaman tanpa memuat ulang
> seluruh halaman dan pemuatan pustaka besar hanya saat dibutuhkan.

Bila ditanya penguji apa dampak pengujian ini, jawabannya — tidak perlu ditulis
di naskah — adalah bahwa pengujian menemukan halaman Riwayat Penyuratan dengan
CLS 0,325 dan skor 83. Penelusuran lewat pemeriksaan _Avoid large layout shifts_
menunjukkan penyebabnya adalah keterangan nomor surat kosong yang baru muncul
setelah data diterima, sehingga mendorong seluruh tabel di bawahnya turun.
Setelah keterangan itu dibuat selalu tampil dengan tinggi tetap, CLS-nya turun
menjadi 0,020 dan skornya naik menjadi 99. Rekaman lengkap penelusuran ini ada
di `PANDUAN-UJI-LIGHTHOUSE.md` bagian 9.

---

# F. Bab V — pengisian hasil evaluasi

Bagian ini mengisi titik-titik yang masih bertanda "…" pada Bab V naskah Anda,
memakai data yang sudah benar-benar terkumpul. Setiap angka di bawah dihitung
ulang dari berkas tanggapan kuesioner, bukan diperkirakan.

## F-1. Tabel Karakteristik Responden — sementara delapan orang

> **Di naskah Anda:** Bab V, Tabel 39
> **Tindakan:** ganti isi tabel, dan tambahkan satu kalimat di bawahnya

Ketua Tim belum ada yang mengisi, jadi angkanya belum 12. Ini harus dinyatakan
apa adanya, bukan disembunyikan.

| Peran | Jumlah Responden |
| --- | --- |
| Ketua Tim | 0 |
| PML | 3 |
| Tim Keuangan | 3 |
| Admin | 2 |
| **Total** | **8** |

Kalimat di bawah tabel:

> Sampai batas waktu pengumpulan data, delapan dari dua belas calon responden
> telah mengisi kuesioner. Tanggapan dari Ketua Tim belum masuk, sehingga hasil
> pada subbab ini merupakan hasil sementara dan akan dilengkapi setelah seluruh
> tanggapan terkumpul.

**Jangan dihapus kalimat itu walau nanti Ketua Tim sudah mengisi.** Ganti saja
menjadi keterangan bahwa seluruh dua belas responden telah mengisi. Penguji akan
membandingkan jumlah responden di Bab III dengan yang di Bab V, dan selisih yang
tidak dijelaskan lebih merugikan daripada jumlah yang belum lengkap.

### Kriteria responden di Bab II belum menyebut Admin

> **Di naskah Anda:** Bab II, subbab Mekanisme Pelaksanaan, Kriteria, dan
> Penarikan Sampel
> **Tindakan:** tambahkan satu peran pada kalimat kriteria inklusi

Kalimat kriteria inklusi di Bab II berbunyi peran yang dituju adalah "Ketua Tim,
Pengawas Mutu Lapangan (PML), dan Staf Keuangan/Subbagian Umum" — tiga peran.
Padahal Tabel 39 di Bab V memuat **empat** peran, karena dua responden berperan
Admin, dan Admin memang peran tersendiri di dalam sistem yang memegang seluruh
Data Master.

Tambahkan Admin pada kalimat itu, misalnya menjadi "…yaitu pegawai yang bertugas
sebagai Ketua Tim, Pengawas Mutu Lapangan (PML), Staf Keuangan/Subbagian Umum,
dan Admin sistem." Tanpa itu, penguji yang mencocokkan Bab II dengan Tabel 39
akan menemukan dua responden yang tidak masuk kriteria yang Anda tetapkan
sendiri.

**Rencana 10 sampai 15 responden itu sendiri tidak perlu diubah.** Dengan 12
responden, rencana tersebut terpenuhi, dan itulah sebabnya butir keterbatasan di
Bab VI dirumuskan sebagai keterbatasan cakupan tanggapan, bukan sebagai
kekurangan jumlah.

## F-2. Tabel Hasil Pengujian CSUQ — terisi

> **Di naskah Anda:** Bab V, Tabel 40
> **Tindakan:** isi kolom Rata-rata Skor dan Kategori

Dihitung dari delapan responden, skala 1–7 searah (makin tinggi makin baik),
dengan kategori mengikuti Tabel 3 di Bab II.

| Dimensi | Butir | Jumlah Butir | Rata-rata Skor | Kategori |
| --- | --- | --- | --- | --- |
| Kegunaan Sistem (_System Usefulness_) | 1–8 | 8 | 6,42 | Sangat puas |
| Kualitas Informasi (_Information Quality_) | 9–15 | 7 | 6,30 | Sangat puas |
| Kualitas Antarmuka (_Interface Quality_) | 16–18 | 3 | 6,33 | Sangat puas |
| **Keseluruhan (_Overall_)** | **1–19** | **19** | **6,36** | **Sangat puas** |

## F-3. Tabel Rata-rata Skor Tiap Butir — terisi

> **Di naskah Anda:** Bab V, Tabel 41
> **Tindakan:** isi kedua kolom Rata-rata

| Butir | Pernyataan (ringkas) | Rata-rata | Butir | Pernyataan (ringkas) | Rata-rata |
| --- | --- | --- | --- | --- | --- |
| 1 | Kemudahan pemakaian | 6,50 | 11 | Kejelasan informasi bantuan | 6,13 |
| 2 | Kesederhanaan pemakaian | 6,38 | 12 | Kemudahan menemukan informasi | 6,38 |
| 3 | Penyelesaian tugas secara efektif | 6,38 | 13 | Kemudahan memahami informasi | 6,50 |
| 4 | Kecepatan penyelesaian tugas | 6,38 | 14 | Kegunaan informasi bagi tugas | 6,13 |
| 5 | Efisiensi penyelesaian tugas | 6,38 | 15 | Kejelasan susunan informasi di layar | 6,50 |
| 6 | Kenyamanan pemakaian | 6,50 | 16 | Tampilan yang menyenangkan | 6,50 |
| 7 | Kemudahan dipelajari | 6,38 | 17 | Kesukaan pada tampilan | 6,50 |
| 8 | Kecepatan menjadi mahir | 6,50 | 18 | Kelengkapan fungsi | 6,00 |
| 9 | Kejelasan pesan kesalahan | 6,25 | 19 | Kepuasan keseluruhan | 6,38 |
| 10 | Kemudahan memperbaiki kesalahan | 6,25 | | | |

## F-4. Narasi penutup subbab CSUQ

> **Di naskah Anda:** Bab V, paragraf sesudah Tabel 41 yang masih berbunyi
> "Skor keseluruhan sebesar … menunjukkan…"
> **Tindakan:** ganti seluruh paragraf itu

> Skor keseluruhan sebesar 6,36 menempatkan sistem pada kategori sangat puas.
> Ketiga dimensi memperoleh skor yang berdekatan, yaitu kegunaan sistem 6,42,
> kualitas antarmuka 6,33, dan kualitas informasi 6,30, sehingga tidak ada
> dimensi yang tertinggal jauh dari yang lain. Sebagai pembanding, Sauro dan
> Lewis (2016) menghimpun 21 studi kegunaan dan memperoleh rata-rata skor
> keseluruhan yang setara dengan 5,18 pada skala searah; skor 6,36 berada 1,18
> poin di atas angka tersebut.
>
> Butir dengan skor terendah adalah butir 18, yaitu kelengkapan fungsi, sebesar
> 6,00, diikuti butir 11 tentang kejelasan informasi bantuan dan butir 14 tentang
> kegunaan informasi bagi tugas, keduanya 6,13. Ketiganya sejalan dengan saran
> terbuka yang dituliskan responden, yang sebagian besar meminta penambahan fungsi
> baru — misalnya pembuatan kelengkapan dokumen persiapan secara otomatis,
> penyaring kegiatan menurut tahun, dan penampilan bintang mutu mitra pada daftar
> mitra — bukan mengeluhkan fungsi yang sudah ada. Dengan kata lain, skor terendah
> pun menunjukkan permintaan perluasan, bukan kegagalan fungsi, sehingga ketiga
> butir tersebut menjadi bahan pengembangan lanjutan sebagaimana diuraikan pada
> Bab VI.

**Yang TIDAK boleh ditulis:** perbandingan skor antar-peran. Dengan dua sampai
tiga responden per peran, selisihnya tidak bermakna apa pun dan hanya mengundang
pertanyaan yang tidak bisa Anda jawab. Sajikan skor gabungan saja.

## F-5. Tabel Perbandingan Waktu Pengerjaan — terisi

> **Di naskah Anda:** Bab V, Tabel 36
> **Tindakan:** ganti seluruh isi tabel

Angka di bawah adalah **median**, bukan rata-rata. Median dipilih karena ada satu
responden yang menuliskan 360 menit sedangkan responden lain pada tugas yang sama
menuliskan 60 menit; rata-rata akan tertarik oleh angka tunggal itu, sedangkan
median tidak. Bila Anda tetap ingin memakai rata-rata, penghematannya justru
sedikit lebih tinggi, yaitu 82,5 persen, sehingga pemakaian median adalah pilihan
yang lebih berhati-hati, bukan yang lebih menguntungkan.

| No | Aktivitas | n | Sebelum (median) | Sesudah (median) | Penghematan |
| --- | --- | --- | --- | --- | --- |
| 1 | Membuat Surat Perjanjian Kerja (SPK) | 5 | 60 menit | 10 menit | 83,3% |
| 2 | Membuat Berita Acara Serah Terima (BAST) | 5 | 60 menit | 10 menit | 83,3% |
| 3 | Memeriksa batas honor mitra (SBML) | 7 | 60 menit | 10 menit | 83,3% |
| 4 | Menyusun rekap honor satu bulan | 7 | 60 menit | 10 menit | 83,3% |
| 5 | Mengetahui progres seluruh kegiatan yang sedang berjalan | 8 | 75 menit | 10 menit | 86,7% |
| 6 | Memeriksa kelengkapan dokumen satu kegiatan | 8 | 65 menit | 20 menit | 69,2% |
| 7 | Merekap penilaian dan menyusun peringkat mitra satu triwulan | 8 | 72 menit | 20 menit | 72,4% |
| 8 | Mencari mitra menurut wilayah saat mengalokasikan kegiatan | 8 | 52 menit | 10 menit | 81,0% |
| | **Seluruh pekerjaan digabung** | | **5.355 menit** | **939 menit** | **82,5%** |

Kolom n berbeda-beda karena responden mengosongkan pekerjaan yang bukan
tugasnya. Itu wajar dan justru menunjukkan mereka menjawab dengan jujur, tetapi
jumlahnya perlu dicantumkan agar pembaca tahu tiap baris dihitung dari berapa
orang. Perhatikan bahwa nomor 1 dan 2 hanya diisi lima orang, dan kelimanya
Admin serta Tim Keuangan — sesuai kenyataan bahwa penyuratan memang bukan
pekerjaan PML.

## F-6. Narasi penutup subbab efisiensi waktu

> **Di naskah Anda:** Bab V, paragraf sesudah Tabel 36 yang masih berbunyi
> "Secara rata-rata, kelima aktivitas administratif di atas…"
> **Tindakan:** ganti seluruh paragraf itu

Kalimat lama menyebut "kelima aktivitas", padahal tabelnya kini berisi delapan.
Kalimat lama juga menyebut "tujuan khusus 1 dan 2" tanpa memerinci pekerjaan mana
masuk tujuan yang mana — itu yang diperbaiki di bawah.

> Bila seluruh pekerjaan digabung, waktu pengerjaan turun dari 5.355 menit menjadi
> 939 menit, yaitu penghematan sebesar 82,5 persen. Enam di antaranya, yaitu
> pekerjaan nomor 1, 2, 3, 4, 6, dan 8, termasuk lingkup tujuan khusus pertama
> karena menyangkut penyuratan, pengendalian dan rekapitulasi honor, kelengkapan
> dokumen, serta pemilihan mitra; penghematannya berkisar antara 69,2 sampai 83,3
> persen. Dua sisanya, yaitu pekerjaan nomor 5 dan 7, termasuk lingkup tujuan
> khusus kedua karena menyangkut pemantauan progres dan pemeringkatan penilaian
> mitra; penghematannya 86,7 dan 72,4 persen. Kedua tujuan karena itu sama-sama
> terbukti secara terukur, bukan hanya melalui ketersediaan fiturnya.
>
> Penghematan terbesar, yaitu 86,7 persen, terjadi pada pekerjaan mengetahui
> progres seluruh kegiatan yang sedang berjalan, dari 75 menit menjadi 10 menit.
> Hal itu masuk akal karena sebelumnya pekerjaan tersebut menuntut pembukaan dua
> sumber yang terpisah, yaitu aplikasi FASIH dan berkas kerja progres milik
> masing-masing tim, lalu menggabungkan keduanya secara manual; pada sistem,
> seluruh progres sudah tersaji pada satu dasbor.
>
> Penghematan terkecil, yaitu 69,2 persen, terjadi pada pekerjaan memeriksa
> kelengkapan dokumen satu kegiatan, dari 65 menit menjadi 20 menit. Hal ini juga
> masuk akal: sistem mengumpulkan seluruh tautan dokumen dalam satu tempat beserta
> status pemeriksaannya, tetapi penilaian atas isi tiap dokumen tetap harus
> dilakukan manusia. Yang digantikan sistem adalah pencarian dan penagihan
> berkasnya, bukan pemeriksaannya.
>
> Perlu ditegaskan bahwa angka sebelum merupakan perkiraan yang dituliskan sendiri
> oleh responden berdasarkan ingatan atas cara kerja lama, bukan hasil pengukuran
> dengan pencatat waktu. Angka tersebut karena itu menggambarkan besaran perubahan
> yang dirasakan pengguna, bukan pengukuran presisi. Angka sesudah lebih dapat
> dipercaya karena responden baru saja mengerjakan tugasnya pada sistem ketika
> mengisi kuesioner. Keterbatasan ini disebutkan agar pembacaan hasilnya
> proporsional.

**Alinea terakhir itu jangan dihapus.** Tanpa pengakuan bahwa angka sebelum
adalah ingatan, penguji berhak menganggap seluruh tabel ini tidak sahih. Dengan
pengakuan itu, tabelnya menjadi bukti persepsi pengguna yang sah dan tetap kuat.

## F-7. Black box — tiga koreksi dan sepuluh kasus yang belum ada

> **Di naskah Anda:** Bab V, Tabel 34
> **Tindakan:** betulkan tiga baris, lengkapi tiga baris kosong, tambah sepuluh baris

### Tiga baris yang hasilnya tidak sesuai kode

**BB-12** (Menyimpan kegiatan tanpa nama kegiatan). Naskah menulis "Ditolak
dengan pesan nama kegiatan wajib diisi" dan hasilnya "kolom Nama Kegiatan
ditandai wajib diisi". Keduanya tidak terjadi. Pada baris 671
`client/pages/InputKegiatan.tsx` tombol simpan diberi
`disabled={isFormIncomplete()}`, dan fungsi itu mengembalikan `true` bila nama
kegiatan kosong. Jadi sistem **tidak menampilkan pesan apa pun**; tombol
simpannya yang mati. Perbaiki menjadi:

> Hasil yang diharapkan: Tombol Simpan Kegiatan tidak dapat ditekan selama nama
> kegiatan belum diisi.
>
> Hasil pengujian: Tombol Simpan Kegiatan tampil nonaktif; kegiatan tidak
> tersimpan.

**BB-09** (Mengimpor berkas selain .xlsx). Pesannya bukan "format berkas tidak
sesuai". Pada baris 157 `client/components/ImporMitraDialog.tsx` pesan yang muncul
berjudul "Berkas Tidak Terbaca" dengan isi "Berkas ini tidak bisa dibaca sebagai
Excel." Ganti kutipan pada kolom hasil agar sama persis dengan yang tampil di
layar.

**BB-27** (Menolak dokumen tanpa catatan). Substansinya benar, tetapi hasilnya
perlu diperjelas karena penolakannya berlapis: tombol Tolak Dokumen nonaktif
selama catatan kosong (baris 772 `client/pages/ViewDocuments.tsx`), dan
seandainya permintaan tetap dikirim langsung ke API, server menolaknya di baris
211 `server/routes/kegiatan.ts`. Sebutkan keduanya — ini justru memperkuat,
karena menunjukkan validasinya tidak hanya di tampilan.

### Tiga baris yang kolom hasilnya masih kosong

BB-48, BB-49, dan BB-50 sudah punya skenario tetapi kolom "Hasil Pengujian" dan
"Kesimpulan" masih kosong. Jalankan ketiganya lalu isi, karena tabel dengan sel
kosong akan langsung terlihat.

### Sepuluh kasus uji yang belum ada sama sekali

Ditelusuri dengan mencocokkan kelima puluh kasus yang ada terhadap keenam belas
kebutuhan fungsional: **empat fitur baru sama sekali belum diuji.** Bila
dibiarkan, Tabel 42 akan mengklaim KF-02, KF-05, KF-07, dan KF-14 terpenuhi
dengan bukti yang tidak menyentuh fitur barunya.

| Kode | KF | Skenario Pengujian | Data Masukan | Hasil yang Diharapkan |
| --- | --- | --- | --- | --- |
| BB-51 | KF-05 | Mengimpor alokasi mitra dari berkas Excel yang seluruh barisnya dikenali | Berkas berisi 5 baris dengan ID SOBAT dan nama PML yang cocok | Pratinjau menggolongkan kelima baris sebagai siap dipakai; setelah ditekan Masukkan Alokasi, kelimanya masuk ke formulir sesuai tahapnya |
| BB-52 | KF-05 | Mengimpor alokasi dengan nama mitra kembar tanpa ID SOBAT | Satu baris bernama sama dengan dua mitra berbeda | Baris ditandai perlu diperiksa dan tidak dapat dipakai sebelum ID SOBAT diisi; sistem tidak menebak salah satu |
| BB-53 | KF-05 | Mengimpor alokasi dengan nama PML ditulis sebagian | Kolom PML berisi nama awal saja | Baris tetap cocok dengan PML yang dimaksud |
| BB-54 | KF-05 | Memilih mitra nonaktif dari Daftar PPL saat alokasi baru | Mitra berstatus nonaktif | Baris tampil dengan penanda "Nonaktif", kotak centangnya mati, dan keterangan alasannya muncul |
| BB-55 | KF-14 | Komentar penilaian kurang dari batas minimum (BVA) | Komentar 19 karakter | Ditolak; penyimpanan tidak dijalankan |
| BB-56 | KF-14 | Komentar penilaian tepat pada batas minimum (BVA) | Komentar 20 karakter | Diterima dan tersimpan |
| BB-57 | KF-14 | Penentuan bintang mutu dari rata-rata nilai | Nilai 7, 8, dan 8 (rata-rata 7,67) | Ditampilkan 3 bintang, tanpa setengah bintang |
| BB-58 | KF-02 | Menyalin kepengurusan ketua tim ke tahun berikutnya | Kepengurusan 2026 disalin ke 2027, satu tim sudah terisi di 2027 | Tim yang sudah ada dilewati, sisanya tersalin; proses tidak gagal seluruhnya |
| BB-59 | KF-02 | Mengganti nama tim yang menimbulkan bentrok | Nama baru sudah dipakai tim lain pada tahun yang sama | Ditolak disertai pesan yang menyebut tahun bentroknya |
| BB-60 | KF-07 | Menyaring kegiatan pada dasbor menurut tahun | Pilih tahun 2026 | Hanya kegiatan tahun 2026 yang tampil pada daftar dan grafik |

Sesudah ditambahkan, jumlah kasus uji menjadi **60**, dan kalimat di bawah tabel
yang berbunyi "Dari 50 kasus uji…" harus ikut diubah.

### Kalimat penutup subbab black box

> **Tindakan:** ganti kalimat yang masih berbunyi "Dari 50 kasus uji yang
> dijalankan, sebanyak … kasus berhasil…"

Isi angkanya setelah keenam puluh kasus dijalankan. Bila seluruhnya berhasil,
tulis apa adanya; bila ada yang gagal, cantumkan beserta tindak lanjutnya. Tabel
pengujian yang seratus persen berhasil tanpa satu pun temuan justru sering
ditanya penguji, jadi jangan ragu mencantumkan kegagalan yang sudah diperbaiki.

## F-8. Tabel Ringkasan Pemenuhan Kebutuhan — kolom bukti

> **Di naskah Anda:** Bab V, Tabel 42
> **Tindakan:** perbarui kolom Bukti Pemenuhan pada empat baris

Setelah sepuluh kasus baru ditambahkan:

| Kode | Bukti Pemenuhan yang baru |
| --- | --- |
| KF-02 | BB-06 s.d. BB-08, BB-58, BB-59 |
| KF-05 | BB-16 s.d. BB-18, BB-46, BB-47, BB-51 s.d. BB-54 |
| KF-07 | BB-23, BB-24, BB-50, BB-60 |
| KF-14 | BB-39 s.d. BB-41, BB-55 s.d. BB-57 |

Perhatikan juga baris KNF-02 yang kolom statusnya masih kosong, serta "Tabel 43"
yang muncul tanpa judul maupun isi tepat sebelum Bab VI — keduanya perlu
dirapikan.

## F-9. Wireframe — sudah lengkap, tinggal dipasang

> **Di naskah Anda:** Bab IV subbab 4.2.5, mulai dari 4.2.5.2
> **Tindakan:** pasang gambar W-02 sampai W-17

Naskah Anda menyatakan "Terdapat delapan belas gambar rancangan", tetapi baru
W-01 (Kerangka Umum Tampilan) yang terpasang; subbab 4.2.5.2 Rancangan Halaman
Masuk masih kosong sampai bab berikutnya dimulai.

Kedelapan belas gambarnya sudah ada dan tinggal disisipkan:

| Keperluan | Berkas |
| --- | --- |
| Gambar siap pasang | `docs/diagram/out/wireframe-pratinjau/W01.png` sampai `W17.png`, termasuk `W16b.png` |
| Sumber yang dapat disunting | `docs/diagram/15-wireframe.drawio`, satu halaman per wireframe |
| Pembangkitnya | `docs/diagram/alat/buat_wireframe.py` |
| Narasi tiap gambar | `docs/diagram/draf-bab4-rancangan-antarmuka.md` |

Berkas `draf-bab4-rancangan-antarmuka.md` sudah memuat penomoran, penjelasan tiap
bagian layar, dan tabel pemetaan W-01 sampai W-17 ke kebutuhan fungsional yang
dilayaninya. Isinya tinggal disalin, dan penanda `[WIREFRAME W-xx]` diganti
dengan gambarnya.

Urutannya mengikuti kelima kelompok yang sudah Anda sebutkan di 4.2.5: halaman
masuk, halaman pemantauan, halaman pengelolaan kegiatan, halaman keuangan dan
penyuratan, serta halaman data master dan akun.

Satu hal yang perlu dijaga: wireframe adalah **rancangan**, sedangkan tangkapan
layar pada Bab V adalah **hasilnya**. Keduanya sengaja berbeda tingkat
kerinciannya, dan perbedaan itu bukan kesalahan. Bila ada rancangan yang berubah
saat implementasi, jelaskan perubahannya sebagai umpan balik ke tahap perancangan
sesuai sifat metode Modified Waterfall — justru itulah bukti bahwa metodenya
benar-benar dipakai, bukan sekadar digambar di Bab III.

## F-10. Gambar 5 dan Gambar 7 diperbesar, semua diberi garis penutup

> **Di naskah Anda:** Bab IV, Gambar 5 (Activity Diagram Proses Bisnis Sistem
> Berjalan) dan Gambar 7 (Activity Diagram Proses Bisnis Sistem Usulan), serta
> seluruh gambar diagram aktivitas lainnya
> **Tindakan:** ganti gambarnya dengan hasil ekspor terbaru

Dosen pembimbing menilai Gambar 5 terlalu kecil, terlihat menggantung karena
tidak tertutup di atas dan bawah, serta baris judul perannya tidak terpisah.
Ketiganya sudah dikerjakan.

### Ukurannya

Penyebab tulisannya kecil bukan tingginya, melainkan lebarnya. Terukur: huruf 12
pt di dalam gambar selebar 1277 piksel hanya setara **4,26 pt** ketika dipasang
selebar 16 cm.

Memperbesar huruf saja tidak menolong, karena kotaknya ikut melebar — dinaikkan
sampai 18 pt pun hanya menambah 10 persen. Yang menolong adalah mempersempit
lajurnya dengan memenggal label menjadi lebih banyak baris pendek.

| | Sebelum | Sesudah |
| --- | --- | --- |
| Ukuran gambar | 1277 x 1381 | 1235 x 1687 |
| Rasio lebar terhadap tinggi | 0,92 | 0,73 |
| Tinggi bila dipasang selebar 16 cm | 17,3 cm | **21,9 cm** |
| Huruf efektif pada lebar 16 cm | 4,26 pt | **5,51 pt** |

Tulisannya kini **29 persen lebih besar**, dan gambarnya memakai ruang ke bawah
yang memang masih tersedia, persis seperti yang diminta.

Perlu diperhatikan: pada lebar 16 cm tingginya menjadi 21,9 cm, sehingga
keterangan gambarnya mungkin terdorong ke halaman berikutnya. Bila itu terjadi,
pasang pada lebar 15 cm sehingga tingginya 20,5 cm.

**Bila masih dinilai kurang besar**, hanya dua jalan yang benar-benar menolong,
dan keduanya menuntut keputusan Anda: memasangnya pada halaman melintang
(*landscape*) tersendiri, atau memecahnya menjadi dua gambar. Berkas pecahannya
sudah tersedia, yaitu `13a-proses-berjalan-kontrak.puml` dan
`13b-proses-berjalan-progres.puml`.

### Gambar 7 diperlakukan sama

Gambar 7 (Activity Diagram Proses Bisnis Sistem Usulan, berkas
`02-activity-proses-usulan.puml`) punya masalah yang sama dan bahkan sedikit
lebih parah: hurufnya hanya setara 4,41 pt. Perlakuannya persis sama, yaitu
label dipenggal menjadi lebih banyak baris pendek dan ukuran hurufnya dinaikkan
ke 15 pt.

| | Sebelum | Sesudah |
| --- | --- | --- |
| Ukuran gambar | 1234 x 1312 | 1161 x 1641 |
| Rasio lebar terhadap tinggi | 0,94 | 0,71 |
| Tinggi bila dipasang selebar 16 cm | 17,0 cm | **22,6 cm** |
| Huruf efektif pada lebar 16 cm | 4,41 pt | **5,86 pt** |

Tulisannya **33 persen lebih besar**, sedikit lebih besar daripada Gambar 5,
sehingga kedua gambar itu terbaca setara ketika dibandingkan berdampingan.

Satu hal yang membedakannya dari Gambar 5: pada diagram ini lebar lajur tidak
hanya ditentukan panjang label, melainkan juga oleh percabangan. Lajur Tim
Keuangan memuat percabangan `Dokumen valid?`, yang menaruh kotak *Menyetujui
dokumen* dan *Menolak dokumen dengan catatan* berdampingan, sehingga lajur itu
tetap yang terlebar (384 piksel) meskipun kedua labelnya sudah dipendekkan.
Memangkas lebih jauh hanya mungkin dengan menghapus percabangannya, dan itu akan
menghilangkan informasi, jadi tidak dilakukan.

Tingginya 22,6 cm pada lebar 16 cm, sedikit lebih tinggi daripada Gambar 5. Bila
keterangan gambarnya terdorong ke halaman berikutnya, pasang pada lebar 15 cm
sehingga tingginya menjadi 21,2 cm.

### Garis penutupnya

PlantUML tidak menyediakan garis penutup atas, bawah, maupun pemisah judul pada
diagram ber-swimlane. Setelan `skinparam swimlaneTitleBackgroundColor` sudah dicoba
dan tidak dihormati versi yang dipakai. Ketiga garis itu karena itu ditambahkan
ke berkas SVG hasil ekspor oleh `docs/diagram/alat/tutup_swimlane.py`.

Garisnya dipasang pada **seluruh** diagram aktivitas ber-swimlane, bukan hanya
Gambar 5, karena menutup satu gambar saja akan membuat gambar-gambar lain di bab
yang sama terlihat tidak seragam.

### Satu langkah tambahan yang WAJIB diingat

Setiap kali diagram diekspor ulang, SVG-nya ditimpa dan garis penutupnya ikut
hilang. Karena itu urutannya selalu dua langkah:

```
java -jar plantuml.jar -tsvg -o docs/diagram/out -charset UTF-8 docs/diagram/*.puml
python docs/diagram/alat/tutup_swimlane.py docs/diagram/out/*.svg
```

Skripnya aman dijalankan berulang kali: berkas yang sudah tertutup dilewati,
berkas yang bukan diagram ber-swimlane juga dilewati.

## F-11. Penelusuran ulang seluruh 60 kasus black box

> **Di naskah Anda:** Bab V, tabel Pengujian Black Box
> **Tindakan:** perbaiki tiga baris, lalu jalankan BB-48 sampai BB-60

Seluruh 60 kasus ditelusuri ulang terhadap kode sumbernya, bukan terhadap
ingatan. Selain itu `pnpm vitest run` dijalankan utuh: **75 berkas, 745
pengujian, seluruhnya lolos**. Angka itu boleh dikutip di Bab V sebagai
pendamping black box, karena ia menguji aturan yang sama dari sisi kode.

### Tiga baris yang keliru dan harus diperbaiki

**BB-46 — klaim "mitra aktif" tidak benar.**
Hasil yang tertulis berbunyi "Tabel hanya menampilkan mitra **aktif** berposisi
Pendataan di wilayah yang dipilih". Daftar PPL justru **sengaja tidak** menyaring
mitra nonaktif. Aturan itu didokumentasikan dan dikunci pengujian di
`server/services/mitraNonaktif.spec.ts`: `getAllMasterPPL` menyaring `aktif = 1`,
sedangkan `getPplAdminData` **tidak**, supaya mantan mitra tetap terlihat beserta
penandanya. Penyaringnya dipasang di layar lewat `bolehDipilih`, yang mematikan
kotak centangnya — bukan menghilangkan barisnya.

Akibatnya BB-46 dan BB-54 saling bertentangan di naskah yang sama: yang satu
mengaku mitra nonaktif tidak tampil, yang lain menguji bahwa mitra nonaktif
tampil dengan penanda. Penguji yang membaca berurutan akan menemukannya.

Ada satu ketidaktepatan kedua pada baris ini. Penyaring tahap pencacahan
menerima posisi `Pendataan` **dan** `Pendataan/Pengolahan`, jadi menulis "hanya
berposisi Pendataan" tidak lengkap.

Ganti kolom Hasil yang Diharapkan dan Hasil Pengujian menjadi:

> Tabel hanya menampilkan mitra berposisi Pendataan atau Pendataan/Pengolahan di
> wilayah yang dipilih; mitra yang dicentang masuk ke baris alokasi.

**BB-47 — kotak centangnya tidak kosong.**
Tertulis "Mitra tampil redup dan tidak dapat dicentang". Yang sebenarnya terjadi:
barisnya redup, dan kotak centangnya tampil **sudah tercentang lalu dikunci**,
disertai keterangan "PPL sudah ditambahkan ke kegiatan ini". Ini disengaja, dan
alasannya ditulis di kodenya: bentuk lamanya berupa kotak kosong yang mati tanpa
keterangan, dan itu terbaca seperti kegagalan memilih. Kalimat "tidak dapat
dicentang" mengesankan kotaknya kosong, jadi ganti menjadi:

> Baris mitra tampil redup; kotak centangnya tampil sudah tercentang dan
> terkunci, disertai keterangan bahwa mitra sudah ditambahkan ke kegiatan ini.

**BB-52 — "perlu diperiksa" dan "tidak dapat dipakai" tidak bisa keduanya.**
Pratinjau impor alokasi menggolongkan baris menjadi tiga, dan ketiganya saling
lepas. Pada `ringkasImporAlokasi`, baris yang tidak lolos `barisBisaDipakai`
langsung dihitung sebagai **ditolak** dan tidak pernah ikut dihitung sebagai
perlu diperiksa. Masalah `mitra-ganda` ada di dalam `MASALAH_MENGHALANGI`,
sehingga baris itu masuk golongan ditolak. Ganti menjadi:

> Baris digolongkan tidak dapat dipakai dan tidak ikut dimasukkan; sistem tidak
> menebak salah satu dari kedua mitra bernama sama.

### BB-48 sampai BB-60 — hasil penelusuran kode

Ketiga belas kasus ini **cocok dengan perilaku kodenya**. Kolom (6) dan (7) tetap
harus Anda isi setelah menjalankannya sendiri di aplikasi; yang dipastikan di
sini adalah bahwa kolom (5) sudah merumuskan perilaku yang benar, sehingga
pengujiannya tidak akan "gagal" karena harapannya yang salah.

| Kode | Yang memastikan | Catatan |
| ---- | ---------------- | ------- |
| BB-48 | `shared/terapkanImporMitra.ts` + data wilayah asli | Diperiksa ke cadangan basis data: kecamatan berkode `040` adalah **Manna**, dan desa berkode `002` di kecamatan itu adalah **Ketaping**. Cocok. |
| BB-49 | `qMitraTanpaProgres` | Ambangnya `DATEDIFF(...) <= 7`, jadi tenggat 5 hari memang memunculkan notifikasi. Tingkatnya **warning**, bukan critical, karena critical baru pada `<= 3`. Syarat lain: masa pengumpulan data harus sudah dimulai. |
| BB-50 | `PESAN_PROGRES_BELUM_DIBUKA` | Kalimatnya persis "Progres baru dapat diisi setelah masa pengumpulan data dimulai." |
| BB-51 | `ringkasImporAlokasi`, `perTahap` | Baris siap dihitung per tahap, lalu dimasukkan ke formulir menurut tahapnya. |
| BB-52 | `MASALAH_MENGHALANGI` | **Perlu koreksi**, lihat di atas. |
| BB-53 | `cocokkanPml` | Pencocokan sebagian berlaku mulai 3 huruf (`MIN_COCOK_SEBAGIAN`). Bila nama sebagian itu cocok ke lebih dari satu orang, sistem melaporkannya ganda dan tidak menebak. |
| BB-54 | `client/pages/DaftarPPL.tsx` | Penanda `Nonaktif`, kotak centang mati, dan keterangan alasannya ada ketiganya. |
| BB-55 | `PANJANG_MIN_KOMENTAR = 20` | Pesannya "Komentar wajib diisi, minimal 20 karakter." Boleh dikutip di kolom (5). |
| BB-56 | sama | 20 karakter diterima. |
| BB-57 | `bintangPenilaian` | Rata-rata 7,67 menghasilkan `floor(7,67 / 2) = 3`. Tidak ada setengah bintang. |
| BB-58 | `salinKetuaTim` | Mengembalikan `{ disalin, dilewati }`; tim yang sudah terisi disaring lebih dulu, jadi prosesnya tidak gagal seluruhnya. |
| BB-59 | `gantiNamaTim` | Pesannya menyebut tahunnya: `Tahun <tahun> sudah punya tim bernama "<nama>".` Status 409. |
| BB-60 | `client/pages/Dashboard.tsx` | Daftar dan grafik sama-sama memakai `filteredActivities`, jadi penyaring tahun berlaku pada keduanya. |

### Draf kolom (6) untuk BB-48 sampai BB-60

Kalimat di bawah ini disusun dari teks yang benar-benar ada di kode, bukan
karangan: pesan galat, label tombol, dan penanda layarnya dikutip apa adanya.
Tetapi kalimat ini **draf**, bukan catatan pengamatan. Jalankan dulu kasusnya,
ganti bagian dalam kurung siku dengan angka dan nama yang benar-benar muncul,
lalu baru isikan ke kolom (6) dan (7).

| Kode | Draf Hasil Pengujian |
| ---- | --------------------- |
| BB-48 | Pratinjau impor tidak memuat kolom wilayah; setelah impor diterapkan, rincian mitra di Daftar PPL menampilkan Kecamatan "Manna" dan Desa "Ketaping", sesuai kode 040 dan 002. |
| BB-49 | Akun PML menerima satu notifikasi bertingkat peringatan pada kelompok "Tenggat mendekat", berbunyi "[n] mitra pencacahan belum ada progres - pendataan tinggal 5 hari." |
| BB-50 | Ditolak dengan pesan "Progres baru dapat diisi setelah masa pengumpulan data dimulai." |
| BB-51 | Pratinjau menampilkan "5 siap" tanpa baris perlu diperiksa maupun tidak bisa dipakai; setelah tombol "Masukkan 5 Alokasi" ditekan, kelimanya masuk ke formulir sesuai tahapnya. |
| BB-52 | Baris digolongkan "tidak bisa dipakai" disertai keterangan "Ada 2 mitra bernama [nama]. Isi kolom ID SOBAT untuk memastikan."; baris itu tidak ikut dimasukkan dan sistem tidak memilih salah satu. |
| BB-53 | Baris cocok dengan PML yang dimaksud dan masuk sebagai baris siap, tanpa keterangan masalah. |
| BB-54 | Baris tampil redup dengan penanda "Nonaktif" di sebelah nama; kotak centangnya mati, dan keterangannya menyebut mitra sudah nonaktif sehingga tidak dapat dialokasikan ke kegiatan baru sedangkan alokasi lamanya tetap tersimpan. |
| BB-55 | Ditolak dengan pesan "Komentar wajib diisi, minimal 20 karakter."; penilaian tidak tersimpan. |
| BB-56 | Diterima; penilaian tersimpan beserta komentarnya. |
| BB-57 | Ditampilkan tiga bintang, tanpa setengah bintang. |
| BB-58 | Pesan berbunyi "[n] ketua tim disalin ke tahun 2027. 1 tim dilewati karena sudah ada: [nama tim]."; tim lainnya tersalin dan proses tidak gagal seluruhnya. |
| BB-59 | Ditolak dengan pesan "Tahun [tahun] sudah punya tim bernama [nama]. Dua tim dengan nama sama di satu tahun tidak dapat dibedakan." |
| BB-60 | Daftar kegiatan dan panel grafik sama-sama hanya menampilkan kegiatan tahun 2026. |

**BB-48 perlu satu koreksi lagi pada kolom (5).** Harapan yang tertulis sekarang
berbunyi "Pratinjau menampilkan kecamatan Manna dan desa Ketaping", padahal
tabel pratinjau impor mitra hanya punya lima kolom: Baris, Nama, ID SOBAT,
Status, dan Tindakan. Wilayahnya tidak ditampilkan di sana sama sekali -
pencocokan kode wilayah baru dikerjakan ketika impornya diterapkan. Jadi kasus
ini akan selalu terlihat gagal kalau diperiksa di layar pratinjau. Ganti kolom
(5) menjadi:

> Setelah impor diterapkan, mitra tersebut tercatat berkecamatan Manna dan
> berdesa Ketaping pada rincian mitra di Daftar PPL.

### Yang sudah benar dan tidak perlu diapa-apakan

BB-01 sampai BB-45 ditelusuri ulang dan cocok. Beberapa yang angkanya paling
spesifik sengaja diperiksa sampai ke rumusnya, dan semuanya tepat:

- **BB-19, BB-20, BB-21** — pembandingnya `total > batas`, benar-benar "melebihi"
  dan bukan "mencapai", sehingga nilai yang tepat sama dengan batas memang
  tersimpan tanpa peringatan.
- **BB-42** — rumusnya `ROUND(AVG(rata_rata), 2) + 0,01 x jumlah kegiatan-tahap`,
  sehingga 8,90 dengan tiga kegiatan menghasilkan tepat 8,93.
- **BB-13 dan BB-14** — jendela konfirmasinya `autoCloseDelay = 6000`, jadi
  ditekan pada detik ketiga masih sempat dan ditunggu lewat enam detik memang
  sudah tidak bisa.
- **BB-25** (512 karakter), **BB-29 dan BB-30** (ambang `daysLeft <= 3`), serta
  **BB-37** (frasa `ATUR ULANG`, tidak toleran salah ketik) semuanya cocok.

## F-12. Wireframe disamakan dengan tangkapan layar aplikasi

> **Di naskah Anda:** Bab IV subbab 4.2.5
> **Tindakan:** pakai ulang berkas gambar di `out/wireframe-pratinjau/`, dan
> perbaiki narasi W-01

Seluruh delapan belas wireframe ditelusuri terhadap tangkapan layar aplikasi yang
sebenarnya, lalu digambar ulang. Pembangkitnya tetap
`docs/diagram/alat/buat_wireframe.py`, berkas suntingannya tetap
`15-wireframe.drawio`, dan gambar siap pasangnya tetap menimpa berkas lama di
`out/wireframe-pratinjau/W01.png` sampai `W17.png`.

### Yang paling besar: susunan kerangka

Kerangka lama menggambar satu bilah atas SELEBAR layar yang memuat logo, dengan
bilah sisi menggantung di bawahnya, dan judul halaman diletakkan di area isi.
Susunan aplikasinya berbeda, dan perbedaan ini terbawa ke seluruh delapan belas
gambar:

- Bilah sisi adalah kolom kiri SETINGGI layar, dan logo SIKAMI ada di dalamnya.
- Bilah atas hanya selebar sisa layar di kanan bilah sisi.
- Judul rute beserta sapaan "Selamat datang kembali, ..." berada di dalam bilah
  atas, sedangkan judul bagian beserta keterangannya berada di area isi. Keduanya
  tampil bersamaan, misalnya rute "Dashboard" dengan bagian "Dashboard
  Monitoring".
- Menu hanya memuat enam butir; submenu "Daftar" dan "Keuangan" tertutup secara
  bawaan dan ditandai tanda panah, bukan dibentangkan.
- Bilah atas memuat satu ikon pengaturan yang sebelumnya tidak tergambar.

### Perbaikan per halaman

| Gambar | Yang diperbaiki |
| ------ | ---------------- |
| W-01 | Butir bernomor dikembalikan menjadi EMPAT bagian tetap, dan footer yang sebelumnya hilang dari narasi dimasukkan sebagai butir 4. Jendela sembul dan pesan singkat dipindah ke paragraf tersendiri. |
| W-02 | Halaman masuk BUKAN dua kolom dengan ilustrasi. Bentuknya satu kartu di tengah layar kosong, dengan kepala kartu berisi logo, lalu dua isian dan satu tombol selebar kartu. |
| W-03 | Penyaring menjadi lima dengan label di atasnya, termasuk Filter Tahun yang sebelumnya tidak ada. Kartu kegiatan memuat enam tombol (Lihat, Edit, Update, View Docs, Hapus, Arsipkan), tanggal mulai dan selesai pengumpulan data, tenggat, dan tautan peringatan. Panel pembaruan progres mitra DIHAPUS dari halaman ini karena di aplikasi ia jendela sembul yang dibuka tombol Update. Ditambahkan tombol Peringatan dan Tampilkan Grafik serta penyingkap kegiatan terarsip. |
| W-04 | Ditambah tombol "Ambil dari Historis". Kedua kotak centang tahap dipindah ke atas kartu jadwal beserta kalimat penjelasnya, dan keempat rentang tanggal disusun dua kolom. Tombol "Batal" dihapus: di aplikasi hanya ada satu tombol di tengah. |
| W-05 | Ditambah ajakan "Impor Alokasi dari Excel" di atas tab tahap, tombol "Clear PPL" dan "Pilih dari Daftar PPL" dipindah ke kepala kartu, dan pengaturan honorarium dijadikan SATU untuk seluruh tahap. Pilihan metode pembebanan per mitra dihapus karena tidak ada di layar itu. |
| W-06 | Jendela peringatan TIDAK memuat tabel. Keduanya memakai bentuk yang sama: ikon, judul, satu paragraf, dua tombol. Digambar dua-duanya, karena yang muncul lebih dulu adalah peringatan kelengkapan alokasi, bukan peringatan batas SBML. |
| W-07 | Panel riwayat dan tabel catatan di samping formulir dihapus. Ditambah tombol "Kembali ke Dashboard" dan dua tombol di bawah formulir. |
| W-08 | Ditambah empat kartu ringkasan dan panel "Perlu Menambah atau Mengedit Dokumen?". Tab menjadi dua, bukan empat. Kolom tabel disamakan: Nama Dokumen, Penanggung Jawab, Status, Tanggal, Last Approved, Aksi, Persetujuan. |
| W-09 | Ditambah empat kartu ringkasan. Kendali periode dan batas honor dipindah ke sudut kanan atas beserta empat pintasan. Kolom "Sisa Pagu" dihapus karena tidak ada, dan status ditulis Normal, bukan Aman. |
| W-10 | Ditambah empat kartu ringkasan dan kolom Bintang. Tombol Export Excel dipindah ke bawah tabel. |
| W-11 | Ditambah empat kartu ringkasan, tombol "Lihat Rekap Penilaian", serta tombol PDF dan Excel. Penyaring diganti menjadi Tahun, Triwulan, Status Penilaian, dan Tampilkan Mitra. |
| W-12 | Kolom pertama adalah No, bukan Peringkat. Mitra yang belum dinilai tetap tercantum dengan tanda hubung. |
| W-13 | Kartu Periode digambar lengkap beserta keterangan penomorannya. Tombol menjadi "Rekap Excel" dan "Generate Semua (N)". |
| W-14 | Kartu "Ketentuan Lain" dan "Isi Pasal Surat" DIHAPUS karena tidak ada. Ditambah nama template, contoh hasil penomoran, dan daftar penanda pola. |
| W-15 | Ditambah penyaring bulan, lencana jumlah surat dan nomor kosong, serta kolom Kegiatan. Tombol "Atur Ulang Nomor" dihapus dari baris itu. |
| W-16 | Ditambah empat kartu ringkasan, dan isi tabel disamakan dengan data yang tampil. |
| W-16b | Disamakan dengan jendela yang sebenarnya: judul "Impor Mitra dari Excel SOBAT", deretan lencana beserta nama berkas, dan empat tombol Batal, Atur Kolom, Hitung Ulang, Lanjut. |
| W-17 | Panel notifikasi dan pencarian global bukan bagian halaman ini, jadi digambar sebagai keterangan. Ditambah kartu identitas beserta kalimat penguncian dan pilihan "Tampilkan password". |

### Satu perbaikan pada alat gambarnya

Pembangkit pratinjau sebelumnya tidak membungkus baris, sehingga kalimat panjang
pada kotak catatan terpotong di tepi kanan gambar. draw.io membungkusnya sendiri,
tetapi PNG inilah yang dipasang ke naskah. Pembungkusan baris kini dikerjakan di
dalam pembangkit, dan seluruh gambar diperiksa agar tidak ada unsur yang keluar
dari bingkai.

# G. Batasan yang harus tetap dijaga

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
11. **Mitra nonaktif tidak dapat dipilih untuk alokasi baru, tetapi tetap
    tampil.** Keduanya berlaku bersamaan dan jangan disederhanakan jadi salah
    satu saja. Di Daftar PPL ia tetap muncul dengan penanda "Nonaktif" supaya
    riwayatnya terlihat, tetapi kotak centangnya mati disertai keterangan.
    Alokasi, honor, surat, dan penilaian lamanya TIDAK terpengaruh sama sekali —
    kegiatan lama yang memuat mitra nonaktif tetap tampil utuh, karena penyaring
    keaktifan hanya dipasang pada pemilihan mitra baru, bukan pada pembacaan data
    yang sudah ada.
12. **Mengganti nama tim hanya pada satu tahun memang menyisakan nama lamanya**
    pada tahun-tahun lain, dan itu disengaja: kepengurusan tahun sebelumnya
    memang masih memakai nama itu. Jangan menggambarkannya sebagai kekeliruan.

---

# H. Daftar periksa

| No   | Butir                                                                    | Berkas                                 | ✓   |
| ---- | ------------------------------------------------------------------------ | -------------------------------------- | --- |
| A-0  | Ekspor ulang ketiga berkas ERD dan ganti gambarnya di naskah             | `08-erd.dbml`, `09a…`, `09b…`          |     |
| A-0b | Gambar diambil dari `docs/diagram/out/`, bukan dari `out/` di akar        | lihat bagian "Di mana gambar disimpan" |     |
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
| C-2b | Narasi diagram penilaian diganti (memuat komentar dan bintang)           | Naskah Bab IV                          |     |
| C-1b | Narasi diagram impor alokasi ditulis                                     | Naskah Bab IV                          |     |
| C-1c | "Sepuluh activity diagram" menjadi sebelas; Tabel 11 disisipi baris Impor Alokasi Mitra pada urutan ketiga | Naskah Bab IV |     |
| C-4  | Keterangan "10 diagram" pada draf subbab activity diagram menjadi 11     | `draf-bab4-activity-diagram.md`        |     |
| D-1  | Sembilan baris kebutuhan fungsional                                      | Naskah Bab IV                          |     |
| D-2  | Enam KF lama diperbarui (KF-01, 02, 05, 06, 07, 11, 14)                  | Naskah Bab IV                          |     |
| D-3  | Keterangan SOBAT (Bab I hal. 7) dan FASIH (Bab I hal. 9) pada penyebutan pertama | Naskah Bab I                  |     |
| D-4  | Tiga rancangan antarmuka baru + satu diperbarui                          | Naskah Bab IV                          |     |
| E-1  | Enam tangkapan layar                                                     | Naskah Bab V                           |     |
| E-2  | Angka pengujian dimasukkan                                               | Naskah Bab V                           |     |
| E-3  | Empat butir evaluasi                                                     | Naskah Bab V                           |     |
| E-4  | Daftar lima migrasi pada subbab penerapan                                | Naskah Bab V                           |     |
| E-5a | Paragraf populasi dan sampel sebelum tabel karakteristik responden       | Naskah Bab V                           |     |
| E-5b | Butir keterbatasan jumlah responden CSUQ                                 | Naskah Bab V / VI                      |     |
| E-5c | Slovin dan istilah *sampling jenuh* dipastikan tidak dipakai             | Naskah Bab III dan V                   |     |
| E-6a | Tabel Lighthouse dilengkapi menjadi sepuluh halaman + baris rata-rata    | Naskah Bab V                           |     |
| E-6b | Kalimat penutup subbab pengujian kinerja diganti                         | Naskah Bab V                           |     |
| F-1  | Tabel karakteristik responden (8 sementara) + kalimat keterangannya       | Naskah Bab V                           |     |
| F-2  | Tabel hasil CSUQ diisi (6,42 / 6,30 / 6,33 / 6,36)                       | Naskah Bab V                           |     |
| F-3  | Tabel rata-rata tiap butir diisi                                         | Naskah Bab V                           |     |
| F-4  | Narasi penutup subbab CSUQ diganti                                       | Naskah Bab V                           |     |
| F-5  | Tabel perbandingan waktu diisi + nama tugas T1–T8 disalin dari formulir   | Naskah Bab V                           |     |
| F-6  | Narasi penutup subbab efisiensi waktu diganti (termasuk keterbatasannya) | Naskah Bab V                           |     |
| F-7a | BB-12, BB-09, dan BB-27 dibetulkan                                       | Naskah Bab V                           |     |
| F-7b | BB-48, BB-49, BB-50 dijalankan dan kolom hasilnya diisi                  | Naskah Bab V                           |     |
| F-7c | Sepuluh kasus uji baru (BB-51 s.d. BB-60) ditambahkan dan dijalankan     | Naskah Bab V                           |     |
| F-7d | Kalimat "Dari 50 kasus uji" diubah menjadi 60 beserta angka keberhasilan | Naskah Bab V                           |     |
| F-8  | Kolom bukti KF-02, KF-05, KF-07, KF-14 diperbarui; KNF-02 dan Tabel 43   | Naskah Bab V                           |     |
| F-9  | Wireframe W-02 s.d. W-17 dipasang pada subbab 4.2.5                      | Naskah Bab IV                          |     |
| F-12 | Wireframe digambar ulang agar sesuai aplikasi; narasi W-01 diperbaiki | `out/wireframe-pratinjau/`, Naskah Bab IV |     |
| F-10 | Gambar 5 dan Gambar 7 diganti dengan ekspor terbaru; garis penutup pada semua diagram aktivitas | Naskah Bab IV |     |
| F-11 | BB-46, BB-47, BB-48, dan BB-52 diperbaiki; BB-48 s.d. BB-60 dijalankan dan kolom hasilnya diisi | Naskah Bab V |     |
| I-1  | Bab VI disusun dari draf `draf-bab6-kesimpulan-saran.md`                 | Naskah Bab VI                          |     |

Setelah seluruh berkas `.puml` dan `.dbml` diubah, jangan lupa mengekspor ulang
gambarnya dan mengganti gambar lama di naskah — ini langkah yang paling sering
terlewat, karena berkas sumbernya sudah benar tetapi gambar di dalam dokumen
masih yang lama.
