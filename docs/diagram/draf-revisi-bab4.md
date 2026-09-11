# Draf Revisi Bab IV — disesuaikan dengan aplikasi terbaru

> **Cara menyalin ke Word:** buka berkas ini di VS Code, tekan **Ctrl+Shift+V**
> (pratinjau), blok bagian yang diperlukan, salin, lalu tempel ke Word. Tabel
> ikut terbawa sebagai tabel Word. Setelah itu terapkan *Styles* templat STIS
> (Isi Tabel, Judul Tabel, dan sebagainya).
>
> Teks dalam **[kurung siku]** harus Anda isi sendiri karena datanya tidak ada
> di kode (misalnya nama narasumber).

---

## 0. Ringkasan perubahan terhadap draf Revisi 10

| Bagian | Yang diubah |
|---|---|
| 4.1 | Tambah paragraf narasumber dan cara wawancara (catatan dosen). |
| Gambar 6 | Digambar ulang sebagai fishbone sungguhan (`10-fishbone.drawio`). |
| 4.1.3 | KF menjadi 15 butir; KF-04, KF-05, KF-07, KF-08, dan KF-09 lama diperbaiki isinya. KNF diperbarui. |
| Gambar 7 | Diganti `02-activity-proses-usulan`, ditambah 5 activity diagram rinci. |
| Gambar 8 | Diganti `01-usecase`: 5 aktor, 27 use case. |
| Tabel 4–5 | Definisi aktor dan deskripsi use case diperbarui. |
| 4.2.3 | 13 tabel menjadi **18 tabel**; tabel lama ditambah kolom baru. |
| Gambar 9 | ERD crow's foot, dipecah 4 (`09a`–`09d`). |

**Hal yang bertentangan dengan aplikasi dan wajib dikoreksi:**

1. Batas SBM **tidak menolak mutlak**: sistem memberi peringatan dan meminta
   konfirmasi.
2. Penilai kinerja mitra adalah **PML**, bukan Ketua Tim.
3. Batas SBM diatur **Admin** sebagai satu nilai global per bulan, bukan oleh
   Tim Keuangan per kegiatan, dan tidak mencakup transportasi.
4. Dokumen disimpan sebagai **tautan**, bukan berkas di *file system* server.
5. Tidak ada fitur "setujui pencairan honor". Status "Selesai" ditentukan dari
   tanggal selesai tahap Diseminasi & Evaluasi.
6. SPK dibuat dalam format **PDF** saja; aplikasi juga membuat **BAST**.

**Konsistensi dengan bab lain yang ikut terdampak:**

- Nama sistem: buku memakai **OPTIMA**, aplikasi (logo, sidebar, database)
  memakai **Kharisma**. Pilih satu, atau jelaskan satu kali bahwa OPTIMA adalah
  nama sistem dan Kharisma nama aplikasinya.
- Bab III (Tahap Implementation) menyebut "middleware otentikasi JWT".
  Sesuaikan dengan KNF-01 di bawah (token bertanda tangan HMAC-SHA256).
- Bab I Tujuan Khusus no. 2 dan Bab II Express.js menyebut "pembatas SBM
  otomatis ... memastikan tidak ada alokasi yang melanggar". Kalimat itu lebih
  tepat menjadi "peringatan otomatis yang mewajibkan konfirmasi".

---

## 4.1 Analisis Sistem Berjalan — paragraf tambahan (catatan dosen)

Analisis sistem berjalan dilakukan melalui wawancara mendalam dan observasi
selama pelaksanaan praktik kerja lapangan di BPS Kabupaten Bengkulu Selatan
pada [bulan–bulan, tahun]. Narasumber (*subject matter*) dipilih secara
*purposive* berdasarkan keterlibatan langsung dalam pengelolaan mitra
statistik, yaitu: (1) [jabatan, mis. Kepala Subbagian Umum] selaku penanggung
jawab administrasi keuangan; (2) [jabatan] selaku Ketua Tim [nama tim];
(3) [jabatan] selaku Pengawas Mutu Lapangan (PML); dan (4) [jabatan lain bila
ada]. Wawancara dilakukan secara [tatap muka/daring] dengan pedoman wawancara
semi-terstruktur yang mencakup alur alokasi mitra, penerbitan kontrak,
pemantauan progres, kelengkapan dokumen, dan evaluasi kinerja mitra. Hasil
wawancara dikonfirmasi dengan pengamatan langsung terhadap dokumen kerja yang
digunakan, seperti *spreadsheet* alokasi dan rekapitulasi progres.
[Pedoman dan ringkasan hasil wawancara dapat dilampirkan pada Lampiran X.]

---

## 4.1.3 Analisis Kebutuhan Sistem

### 1. Kebutuhan Fungsional

- **KF-01 (Otentikasi dan Profil):** Sistem harus menyediakan fitur *login*
  dengan nama pengguna dan kata sandi, membatasi akses setiap halaman sesuai
  peran pengguna, serta memungkinkan pengguna mengubah profil dan kata sandinya.
- **KF-02 (Data Master):** Sistem harus memungkinkan Admin mengelola akun
  pengguna beserta perannya, data Ketua Tim (termasuk tim dan akun yang
  ditautkan), serta basis data profil Mitra Statistik lengkap dengan wilayah
  kecamatan dan desanya.
- **KF-03 (Pengelolaan Kegiatan):** Sistem harus memungkinkan pegawai membuat
  kegiatan statistik (survei atau sensus) dengan jadwal empat tahap:
  Persiapan, Pengumpulan Data, Pengolahan & Analisis, serta Diseminasi &
  Evaluasi. Tahap *Listing*, Pengolahan & Analisis, dan Diseminasi & Evaluasi
  dapat diaktifkan atau dinonaktifkan per kegiatan. Kegiatan hanya dapat
  disunting oleh pembuatnya, Ketua Tim kegiatan tersebut, atau Admin.
- **KF-04 (Alokasi Mitra dan Honor):** Sistem harus memungkinkan pengguna
  mengalokasikan mitra ke setiap tahap kegiatan beserta PML pengawasnya, beban
  kerja, dan harga satuan, lalu menghitung honor secara otomatis (beban kerja
  × harga satuan). Honor dibebankan ke bulan tertentu dengan tiga metode:
  satu bulan tertentu, prorata, atau luber (bulan pertama dipenuhi sampai
  batas, sisanya ke bulan berikutnya).
- **KF-05 (Validasi Batas SBM):** Setiap kali kegiatan disimpan, sistem harus
  menjumlahkan honor setiap mitra per bulan dari seluruh kegiatan dan
  membandingkannya dengan batas honor bulanan (SBM). Bila melebihi, sistem
  menampilkan peringatan yang memuat nama mitra, bulan, total honor, dan
  batasnya, lalu meminta konfirmasi sebelum data disimpan. Nilai batas SBM
  diatur oleh Admin.
- **KF-06 (Monitoring Progres):** Sistem harus memungkinkan PML menginput
  progres pekerjaan mitra yang diawasinya. Tahap *listing*/pencacahan memakai
  status *open*, *submit*, diperiksa, dan *approved*; tahap pengolahan memakai
  belum *entry*, sudah *entry*, validasi, dan *clean*. Total progres tidak
  boleh melebihi beban kerja. Rekapitulasinya ditampilkan pada *dashboard*
  dalam bentuk grafik dan tabel, dilengkapi filter dan pencarian global.
- **KF-07 (Repositori Dokumen):** Sistem harus menyediakan daftar dokumen
  wajib bawaan untuk setiap tahap kegiatan (antara lain SK, Surat Tugas, KAK,
  Visum, BAST, dan laporan tiap tahap), memungkinkan penambahan dokumen lain,
  dan menyimpan setiap dokumen sebagai tautan ke penyimpanan instansi. Setiap
  dokumen memiliki penanggung jawab pengisian: Ketua Tim atau Tim Keuangan.
- **KF-08 (Verifikasi Dokumen):** Sistem harus memungkinkan Tim Keuangan
  menyetujui dokumen, satu per satu atau sekaligus satu tahap, serta menolak
  dokumen disertai catatan revisi. Tim Keuangan juga dapat mengirim
  pengingat untuk dokumen yang belum diisi.
- **KF-09 (Notifikasi Otomatis):** Sistem harus menampilkan notifikasi sesuai
  peran pengguna: tenggat tahap H-3 sampai H-1 dan keterlambatan, dokumen
  ditolak, dokumen menunggu persetujuan, dokumen diunggah ulang, dokumen
  tanggung jawab Tim Keuangan yang belum diisi, dan pengingat dari Tim
  Keuangan. Notifikasi hilang dengan sendirinya setelah penyebabnya
  diselesaikan.
- **KF-10 (Surat Perjanjian Kerja dan BAST):** Sistem harus memungkinkan Tim
  Keuangan membuat SPK dan BAST mitra dalam format PDF untuk suatu periode
  berdasarkan data alokasi. Surat disusun dari template yang dapat diatur
  (data PPK, satuan kerja, pola nomor, isi pasal), dilengkapi uraian tugas dan
  kode beban anggaran (MAK). Nomor surat diberikan otomatis dan tetap sama
  bila surat dicetak ulang. Nomor BAST mengikuti nomor urut SPK mitra yang
  sama. Pengaturan ulang nomor dicatat sebagai jejak audit.
- **KF-11 (Rekap Honor):** Sistem harus menyajikan rekapitulasi honor setiap
  mitra per bulan atau per rentang tanggal, lengkap dengan penanda mitra yang
  melebihi batas SBM.
- **KF-12 (Penilaian Kinerja):** Sistem harus memungkinkan PML menilai mitra
  yang diawasinya pada tiga aspek (Sikap & Perilaku, Kualitas Pekerjaan,
  Ketepatan Waktu) dengan skala bilangan bulat 1–10, lalu menghitung rata-
  ratanya secara otomatis. Hasil penilaian dapat diekspor ke PDF dan Excel.
- **KF-13 (*Auto-Ranking* Triwulanan):** Sistem harus menghitung peringkat mitra
  per triwulan dengan rumus *nilai akhir = rata-rata nilai + 0,01 × jumlah
  kegiatan* yang diikuti mitra pada triwulan tersebut, lalu mengurutkannya
  dari nilai tertinggi.
- **KF-14 (Riwayat Kegiatan):** Sistem harus mencatat setiap aksi pengguna pada
  suatu kegiatan (perubahan data, alokasi, progres, dokumen, penilaian)
  beserta pelaku dan waktunya, lalu menampilkannya sebagai riwayat kegiatan.
- **KF-15 (Arsip Kegiatan):** Sistem harus memungkinkan Admin mengarsipkan dan
  menghapus kegiatan.

### 2. Kebutuhan Non-Fungsional

- **KNF-01 (Keamanan Akses):** Kata sandi disimpan dalam bentuk *hash* bcrypt.
  Sesi pengguna menggunakan token bertanda tangan HMAC-SHA256 yang berlaku 12
  jam, dan percobaan *login* dibatasi (*rate limiting*). Otorisasi diterapkan
  berlapis: berdasarkan peran (Admin, Tim Keuangan, Pegawai) dan berdasarkan
  kepemilikan data (kegiatan hanya dapat disunting pemiliknya; progres dan
  penilaian hanya oleh PML mitra tersebut). Identitas pelaku selalu diambil
  dari token, bukan dari data yang dikirim peramban.
- **KNF-02 (Jaringan):** Sistem berjalan di jaringan intranet/privat BPS dan
  hanya dapat diakses dari luar kantor melalui koneksi FortiClient VPN.
- **KNF-03 (Kinerja dan Pengalaman Pengguna):** Sistem dikembangkan sebagai
  *Single Page Application* (SPA) dengan React.js, sehingga perpindahan halaman
  tidak memuat ulang seluruh halaman. Pustaka berukuran besar (pembuat PDF dan
  Excel) baru dimuat saat dibutuhkan. Tampilan responsif dan mendukung tema
  terang/gelap.
- **KNF-04 (Integritas Data):** Basis data MySQL menjaga keterhubungan data
  dengan *foreign key* dan *unique key*. Penyimpanan kegiatan beserta alokasinya
  berjalan dalam satu transaksi, sehingga pelanggaran validasi tidak
  meninggalkan data setengah tersimpan. Nilai penilaian divalidasi di server
  (bilangan bulat 1–10).
- **KNF-05 (Keterlacakan/Audit):** Setiap perubahan penting tercatat pada tabel
  riwayat (riwayat kegiatan dan riwayat nomor surat), termasuk pelaku dan
  waktunya, sebagai bukti dukung pemeriksaan.
- **KNF-06 (Arsip Dokumen):** Dokumen disimpan sebagai tautan (maksimal 512
  karakter) ke penyimpanan resmi instansi, dengan validasi format dan panjang
  tautan sebelum disimpan, sehingga berkas asli tetap berada di penyimpanan
  yang dikelola instansi.
- **KNF-07 (Kesiapan Integrasi):** Seluruh modul berkomunikasi melalui RESTful
  API, dan kegiatan dapat ditandai sebagai kegiatan FASIH, sehingga sumber data
  progres dapat disambungkan ke FASIH tanpa mengubah antarmuka.

---

## 4.2.1 Proses Bisnis Sistem Usulan — narasi pengganti

1. **Perencanaan dan Alokasi.** Ketua Tim atau pegawai pembuat kegiatan
   mengisi informasi kegiatan, jadwal tahap, dan tahap yang digunakan, lalu
   mengalokasikan mitra beserta PML, beban kerja, harga satuan, dan metode
   pembebanan honor. Sistem membagi honor ke bulan pembebanan dan
   menjumlahkannya dengan honor mitra tersebut di kegiatan lain. Bila total
   honor bulanan melebihi batas SBM, sistem menampilkan peringatan dan meminta
   Ketua Tim merevisi alokasi atau mengonfirmasi penyimpanan. Data kegiatan,
   alokasi, dan pembebanan honor kemudian tersimpan di basis data terpusat,
   dan sistem membuat daftar dokumen wajib setiap tahap.
2. **Kontrak Kerja.** Tim Keuangan memilih periode, melengkapi uraian tugas dan
   kode anggaran, lalu membuat SPK dalam format PDF dengan nomor yang
   diberikan otomatis oleh sistem.
3. **Pelaksanaan dan Monitoring.** PML menginput progres mitra yang
   diawasinya langsung ke sistem tanpa merekap *spreadsheet* terpisah. Sistem
   memperbarui *dashboard* monitoring sehingga perkembangan seluruh kegiatan
   dapat dipantau dari satu tempat.
4. **Administrasi Dokumen.** Ketua Tim mengisi tautan dokumen setiap tahap.
   Dokumen yang menjadi tanggung jawab Tim Keuangan diisi oleh Tim Keuangan
   sendiri. Untuk dokumen yang masih kosong, Tim Keuangan dapat mengirim
   pengingat yang muncul sebagai notifikasi bagi Ketua Tim.
5. **Verifikasi.** Tim Keuangan memeriksa dokumen dan menyetujuinya, per
   dokumen atau sekaligus satu tahap. Dokumen yang tidak valid ditolak
   dengan catatan; Ketua Tim menerima notifikasi, memperbaiki tautannya, dan
   dokumen kembali menunggu pemeriksaan. Setelah pekerjaan selesai, Tim
   Keuangan membuat BAST yang nomornya mengikuti nomor SPK.
6. **Evaluasi.** PML menilai kinerja mitra yang diawasinya pada tiga aspek.
   Sistem menghitung rata-rata nilai dan menyusun peringkat mitra per
   triwulan secara otomatis sebagai dasar pertimbangan alokasi berikutnya.
   Status kegiatan berubah menjadi "Selesai" setelah tanggal selesai tahap
   Diseminasi & Evaluasi terlewati.

**Usulan keterangan gambar (disesuaikan penomoran otomatis Word):**

- Activity Diagram Alur Proses Bisnis Sistem Usulan pada OPTIMA (`02`)
- Activity Diagram Pembuatan Kegiatan dan Validasi Batas SBM (`03`)
- Activity Diagram Input Progres Mitra (`04`)
- Activity Diagram Verifikasi Dokumen Kegiatan (`05`)
- Activity Diagram Pembuatan SPK dan BAST (`06`)
- Activity Diagram Penilaian dan Peringkat Kinerja Mitra (`07`)

---

## 4.2.2 Use Case Diagram — teks pengantar dan tabel

Hak akses pada sistem dibedakan berdasarkan tiga peran akun, yaitu Admin, Tim
Keuangan (peran *supervisor*), dan Pegawai. Pegawai kemudian dapat berperan
sebagai Ketua Tim/Pembuat Kegiatan atau PML bergantung pada keterkaitannya
dengan suatu kegiatan. Karena itu, aktor Ketua Tim, PML, dan Tim Keuangan
digambarkan sebagai spesialisasi dari aktor Pegawai, dan setiap aktor mewarisi
seluruh use case aktor Pegawai.

### Tabel Definisi Aktor

| Aktor | Deskripsi |
|---|---|
| Pegawai | Setiap pengguna yang telah *login*. Dapat melihat *dashboard* monitoring, membuat kegiatan, melihat rekap honor dan penilaian, notifikasi, riwayat kegiatan, serta mengelola profilnya. |
| Ketua Tim / Pembuat Kegiatan | Pegawai yang menjadi ketua tim suatu kegiatan atau yang membuatnya. Berhak menyunting kegiatan beserta alokasi mitra dan mengelola dokumen kegiatannya. |
| PML | Pegawai yang ditugaskan sebagai pengawas mitra pada suatu alokasi. Berhak menginput progres dan menilai kinerja mitra yang diawasinya. |
| Tim Keuangan | Pengguna berperan *supervisor*. Memverifikasi dokumen, mengirim pengingat, mengatur penanggung jawab dokumen, mengelola template surat, serta membuat SPK dan BAST. |
| Admin | Pengguna dengan hak akses tertinggi. Mengelola data master (pengguna, ketua tim, mitra), mengatur batas honor bulanan (SBM), mengarsipkan/menghapus kegiatan, dan dapat menjalankan seluruh use case aktor lain. |

### Tabel Deskripsi Use Case

| Use Case | Aktor | Deskripsi |
|---|---|---|
| Login | Semua aktor | Memverifikasi nama pengguna dan kata sandi untuk mengakses sistem sesuai perannya. |
| Melihat Dashboard Monitoring | Pegawai | Melihat daftar kegiatan, status tahap, persentase progres, dan grafik capaian, dengan filter dan pencarian. |
| Membuat Kegiatan & Alokasi Mitra | Pegawai | Membuat kegiatan baru beserta jadwal tahap, dokumen wajib, dan alokasi mitra. Mencakup Validasi Batas Honor (SBM). |
| Menyunting Kegiatan & Alokasi Mitra | Ketua Tim / Pembuat Kegiatan | Mengubah data kegiatan dan alokasi mitranya. Mencakup Validasi Batas Honor (SBM). |
| Validasi Batas Honor (SBM) | Sistem (*include*) | Menjumlahkan honor mitra per bulan lintas kegiatan dan membandingkannya dengan batas SBM. |
| Konfirmasi Melebihi Batas SBM | Ketua Tim / Pembuat Kegiatan (*extend*) | Dijalankan hanya bila batas terlampaui: pengguna memilih merevisi alokasi atau tetap menyimpan. |
| Mengelola Dokumen Kegiatan | Ketua Tim / Pembuat Kegiatan | Mengisi, mengubah, menambah, dan menghapus tautan dokumen setiap tahap, termasuk memperbaiki dokumen yang ditolak. |
| Menginput Progres Mitra | PML | Mencatat jumlah dokumen per status pekerjaan mitra yang diawasinya. |
| Menilai Kinerja Mitra | PML | Memberi nilai tiga aspek (1–10) kepada mitra yang diawasinya. |
| Melihat Rekap & Peringkat Penilaian | Pegawai | Melihat peringkat mitra per triwulan berdasarkan nilai akhir. |
| Melihat Rekap Honor Mitra | Pegawai | Melihat total honor setiap mitra per bulan/rentang dan penanda yang melebihi batas SBM. |
| Melihat Notifikasi | Pegawai | Melihat notifikasi tenggat, penolakan, persetujuan, dan pengingat sesuai perannya. |
| Melihat Riwayat Kegiatan | Pegawai | Melihat urutan aksi yang pernah dilakukan pada suatu kegiatan beserta pelaku dan waktunya. |
| Mengelola Profil & Kata Sandi | Pegawai | Mengubah data profil dan kata sandi akun sendiri. |
| Memverifikasi Dokumen | Tim Keuangan | Memeriksa dan menyetujui dokumen, per dokumen atau sekaligus satu tahap. |
| Menolak Dokumen dengan Catatan | Tim Keuangan (*extend*) | Perluasan verifikasi: mengembalikan dokumen yang tidak valid kepada Ketua Tim disertai catatan revisi. |
| Mengirim Pengingat Dokumen | Tim Keuangan | Mengirim notifikasi kepada Ketua Tim dan pembuat kegiatan untuk dokumen yang belum diisi. |
| Mengatur Penanggung Jawab Dokumen | Tim Keuangan | Menentukan apakah suatu dokumen diisi oleh Ketua Tim atau oleh Tim Keuangan. |
| Mengelola Template Surat | Tim Keuangan | Mengatur data PPK, satuan kerja, pola nomor SPK/BAST, dan isi pasal perjanjian. |
| Membuat Surat Perjanjian Kerja (SPK) | Tim Keuangan | Membuat SPK mitra per periode dalam format PDF dengan nomor otomatis. |
| Membuat BAST | Tim Keuangan | Membuat BAST mitra dalam format PDF; nomornya mengikuti nomor SPK mitra yang sama. |
| Mengatur Ulang Nomor Surat | Tim Keuangan | Menghapus nomor surat suatu periode agar dapat diberi nomor ulang; tindakan ini dicatat pada riwayat surat. |
| Mengelola Pengguna | Admin | Menambah, mengubah, dan menghapus akun pegawai beserta perannya. |
| Mengelola Ketua Tim | Admin | Mengelola data ketua tim, timnya, dan akun pengguna yang ditautkan. |
| Mengelola Data Mitra | Admin | Mengelola (CRUD) profil induk mitra statistik beserta wilayahnya. |
| Mengatur Batas Honor Bulanan (SBM) | Admin | Menetapkan nilai batas honor maksimal seorang mitra per bulan. |
| Mengarsipkan / Menghapus Kegiatan | Admin | Memindahkan kegiatan ke arsip atau menghapusnya dari sistem. |

---

## 4.2.3 Rancangan Basis Data

### Teks pengantar (pengganti)

Rancangan basis data Sistem Informasi OPTIMA diimplementasikan menggunakan
MySQL sebagaimana dijelaskan pada Bab II, dengan tabel inti `ppl_master`,
`ppl`, `ppl_progress`, dan `ppl_honorarium` yang telah disebutkan sebelumnya.
Basis data terdiri dari **18 tabel** yang dikelompokkan menjadi lima bagian,
yaitu (1) pengguna dan wilayah, (2) kegiatan dan alokasi mitra, (3) honor,
progres, dan penilaian, (4) dokumen dan jejak audit, serta (5) surat dan
pengaturan. Relasi antartabel dijaga dengan *foreign key* sehingga setiap data
progres, honor, dan penilaian selalu terhubung dengan alokasi mitra dan
kegiatan yang bersangkutan.

### Ringkasan tabel

| No | Tabel | Kelompok | Fungsi |
|---|---|---|---|
| 1 | users | Pengguna | Akun pengguna dan perannya |
| 2 | ketua_tim | Pengguna | Data ketua tim dan akun yang ditautkan |
| 3 | kecamatan | Wilayah | Referensi kecamatan |
| 4 | desa | Wilayah | Referensi desa |
| 5 | ppl_master | Kegiatan & alokasi | Profil induk mitra statistik |
| 6 | kegiatan | Kegiatan & alokasi | Data kegiatan, jadwal tahap, periode honor |
| 7 | honorarium_kegiatan | Kegiatan & alokasi | Tarif satuan, uraian tugas, dan kode MAK per jenis pekerjaan |
| 8 | ppl | Kegiatan & alokasi | Alokasi mitra pada satu tahap kegiatan |
| 9 | ppl_honorarium | Honor & progres | Rincian honor per jenis pekerjaan |
| 10 | ppl_honor_bulan | Honor & progres | Pembebanan honor per bulan (dasar validasi SBM) |
| 11 | ppl_progress | Honor & progres | Progres pekerjaan mitra per status |
| 12 | penilaian_mitra | Honor & progres | Nilai kinerja mitra |
| 13 | dokumen | Dokumen & audit | Tautan dokumen kegiatan dan status verifikasinya |
| 14 | riwayat_kegiatan | Dokumen & audit | Jejak aksi pengguna per kegiatan |
| 15 | template_surat | Surat | Template SPK dan BAST |
| 16 | kontrak_mitra | Surat | Nomor dan data SPK/BAST yang telah dibuat |
| 17 | riwayat_surat | Surat | Jejak pengaturan ulang nomor surat |
| 18 | system_settings | Pengaturan | Pengaturan sistem, termasuk batas honor bulanan |

### Rincian struktur tabel

**Tabel users**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Varchar(50) | No | ID unik pengguna |
| 2 | username | Varchar(50) | No | Nama pengguna untuk *login* (unik) |
| 3 | password | Varchar(255) | No | Kata sandi ter-*hash* (bcrypt) |
| 4 | nama_lengkap | Varchar(255) | No | Nama lengkap pengguna |
| 5 | role | Enum | No | 'admin', 'user', 'supervisor' (supervisor = Tim Keuangan) |
| 6 | isPML | Tinyint(1) | No | Penanda pengguna dapat ditugaskan sebagai PML |

**Tabel ketua_tim**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Varchar(50) | No | ID unik ketua tim |
| 2 | user_id (FK) | Varchar(50) | Yes | Merujuk ke akun di tabel users |
| 3 | nama_ketua | Varchar(255) | No | Nama ketua tim |
| 4 | nip | Varchar(50) | Yes | NIP ketua tim |
| 5 | tim | Varchar(100) | Yes | Nama tim kerja |

**Tabel kecamatan**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Int(11) | No | *Auto increment* |
| 2 | nama | Varchar(255) | No | Nama kecamatan |

**Tabel desa**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Int(11) | No | *Auto increment* |
| 2 | kecamatan_id (FK) | Int(11) | No | Merujuk ke tabel kecamatan |
| 3 | nama | Varchar(255) | No | Nama desa |

**Tabel ppl_master**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Varchar(50) | No | ID unik mitra statistik |
| 2 | namaPPL | Varchar(255) | No | Nama lengkap mitra |
| 3 | posisi | Enum | No | 'Pendataan', 'Pengolahan', 'Pendataan/Pengolahan' |
| 4 | kecamatan_id (FK) | Int(11) | Yes | Merujuk ke tabel kecamatan |
| 5 | desa_id (FK) | Int(11) | Yes | Merujuk ke tabel desa |
| 6 | alamat | Text | Yes | Alamat lengkap mitra |
| 7 | noTelepon | Varchar(20) | Yes | Nomor telepon aktif |

**Tabel kegiatan**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Int(11) | No | *Auto increment* |
| 2 | namaKegiatan | Varchar(255) | No | Nama kegiatan |
| 3 | ketua_tim_id (FK) | Varchar(50) | Yes | Merujuk ke tabel ketua_tim |
| 4 | createdBy_userId (FK) | Varchar(50) | Yes | Merujuk ke pembuat kegiatan (users) |
| 5 | deskripsiKegiatan | Text | Yes | Deskripsi kegiatan |
| 6 | tipe_kegiatan | Enum | No | 'survei', 'sensus' |
| 7 | isFasih | Tinyint(1) | Yes | Penanda kegiatan yang dipantau melalui FASIH |
| 8 | adaListing | Tinyint(1) | No | Penanda kegiatan memiliki tahap *listing* |
| 9 | adaPengolahan | Tinyint(1) | No | Penanda tahap Pengolahan & Analisis digunakan |
| 10 | adaDiseminasi | Tinyint(1) | No | Penanda tahap Diseminasi & Evaluasi digunakan |
| 11 | tanggalMulai… | Date | Yes | 4 kolom tanggal mulai: Persiapan, Pengumpulan Data, Pengolahan & Analisis, Diseminasi & Evaluasi |
| 12 | tanggalSelesai… | Date | Yes | 4 kolom tanggal selesai tahap di atas |
| 13 | progress… | Tinyint(3) | Yes | 9 kolom persentase progres: keseluruhan serta *submit*/*approved* untuk *listing*, pencacahan, pendataan, dan pengolahan |
| 14 | status | Enum | Yes | 'Persiapan', 'Pengumpulan Data', 'Pengolahan & Analisis', 'Diseminasi & Evaluasi', 'Selesai' |
| 15 | bulanHonor… | Varchar(7) | Yes | 3 kolom bulan pembebanan honor (format MM-YYYY): *listing*, pencacahan, pengolahan |
| 16 | tanggalMulaiHonor… / tanggalSelesaiHonor… | Date | Yes | 6 kolom rentang periode honor per jenis pekerjaan (dipakai sebagai jangka waktu pada SPK) |
| 17 | isArsip | Tinyint(1) | No | Penanda kegiatan diarsipkan |
| 18 | arsipAt / arsipBy | Datetime / Varchar(50) | Yes | Waktu dan pelaku pengarsipan |
| 19 | lastUpdated / lastUpdatedBy | Timestamp / Varchar(50) | Yes | Waktu dan pelaku pembaruan progres terakhir |
| 20 | lastEdited / lastEditedBy | Datetime / Varchar(255) | Yes | Waktu dan pelaku penyuntingan terakhir |

**Tabel honorarium_kegiatan**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Int(11) | No | *Auto increment* |
| 2 | kegiatanId (FK) | Int(11) | No | Merujuk ke tabel kegiatan |
| 3 | jenis_pekerjaan | Enum | No | 'listing', 'pencacahan', 'pengolahan' |
| 4 | satuan_beban_kerja | Varchar(255) | Yes | Satuan beban (dokumen, BS, dan sebagainya) |
| 5 | harga_satuan | Varchar(255) | Yes | Harga per satuan beban |
| 6 | uraian_tugas | Varchar(255) | Yes | Uraian tugas yang dicantumkan pada SPK |
| 7 | kode_anggaran | Varchar(100) | Yes | Kode beban anggaran (MAK) pada SPK |

**Tabel ppl (Alokasi Mitra)**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Int(11) | No | *Auto increment* |
| 2 | kegiatanId (FK) | Int(11) | No | Merujuk ke tabel kegiatan |
| 3 | tahap | Enum | No | 'listing', 'pencacahan', 'pengolahan-analisis' |
| 4 | ppl_master_id (FK) | Varchar(50) | Yes | Merujuk ke tabel ppl_master |
| 5 | pml_id | Varchar(50) | Yes | ID pengguna (users) yang menjadi PML mitra ini |
| 6 | bebanKerja | Int(11) | Yes | Volume tugas yang diberikan |
| 7 | besaranHonor | Int(11) | Yes | Total honor alokasi ini |
| 8 | metodePembebanan | Enum | No | 'bulan_tertentu', 'prorata', 'luber' |
| 9 | bulanPembebananDipilih | Varchar(7) | Yes | Bulan yang dipilih untuk metode bulan tertentu (MM-YYYY) |

> Catatan: kolom lama `honor_termin_1`, `tanggal_termin_1`, `honor_termin_2`,
> dan `tanggal_termin_2` yang tidak pernah dipakai aplikasi telah dihapus dari
> database (migrasi `2026-09-19-hapus-kolom-termin.sql`), sehingga tabel di
> atas sudah sama persis dengan struktur database.

**Tabel ppl_honorarium**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Int(11) | No | *Auto increment* |
| 2 | ppl_id (FK) | Int(11) | No | Merujuk ke tabel ppl |
| 3 | jenis_pekerjaan | Enum | No | 'listing', 'pencacahan', 'pengolahan' (unik per alokasi) |
| 4 | bebanKerja | Int(11) | Yes | Volume beban aktual |
| 5 | satuanBebanKerja | Varchar(50) | Yes | Satuan beban |
| 6 | hargaSatuan | Int(11) | Yes | Harga per satuan beban |
| 7 | besaranHonor | Int(11) | Yes | Beban kerja × harga satuan |

**Tabel ppl_honor_bulan**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Int(11) | No | *Auto increment* |
| 2 | ppl_id (FK) | Int(11) | No | Merujuk ke tabel ppl |
| 3 | bulan | Varchar(7) | No | Bulan pembebanan (MM-YYYY); unik per alokasi |
| 4 | jumlah | Int(11) | No | Besar honor yang dibebankan ke bulan tersebut |

**Tabel ppl_progress**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Int(11) | No | *Auto increment* |
| 2 | ppl_id (FK) | Int(11) | No | Merujuk ke tabel ppl |
| 3 | progress_type | Enum | No | 'open', 'submit', 'diperiksa', 'approved', 'belum_entry', 'sudah_entry', 'validasi', 'clean' (unik per alokasi) |
| 4 | value | Int(11) | No | Jumlah dokumen pada status tersebut |

**Tabel penilaian_mitra**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Int(11) | No | *Auto increment* |
| 2 | pplId (FK) | Int(11) | Yes | Merujuk ke tabel ppl (menjadi NULL bila alokasinya terhapus, sehingga nilai tetap tersimpan) |
| 3 | kegiatanId (FK) | Int(11) | No | Merujuk ke tabel kegiatan |
| 4 | pmlId | Varchar(50) | Yes | ID PML mitra tersebut |
| 5 | sikap_perilaku | Int(2) | Yes | Nilai aspek 1 (1–10) |
| 6 | kualitas_pekerjaan | Int(2) | Yes | Nilai aspek 2 (1–10) |
| 7 | ketepatan_waktu | Int(2) | Yes | Nilai aspek 3 (1–10) |
| 8 | rata_rata | Decimal(4,2) | Yes | Rata-rata tiga aspek |
| 9 | dinilai_oleh_userId | Varchar(50) | Yes | ID pengguna yang menilai |
| 10 | tanggal_penilaian | Timestamp | Yes | Waktu penilaian terakhir |

**Tabel dokumen**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Int(11) | No | *Auto increment* |
| 2 | kegiatanId (FK) | Int(11) | No | Merujuk ke tabel kegiatan |
| 3 | nama | Varchar(255) | No | Nama dokumen |
| 4 | tipe | Enum | No | Tahap: 'persiapan', 'pengumpulan-data', 'pengolahan-analisis', 'diseminasi-evaluasi' |
| 5 | jenis | Enum | No | 'file', 'link', 'catatan' |
| 6 | link | Varchar(512) | Yes | Tautan penyimpanan dokumen |
| 7 | isWajib | Tinyint(1) | No | Penanda dokumen wajib |
| 8 | penanggungJawab | Enum | No | 'ketua_tim', 'keuangan' |
| 9 | penanggungJawabDiubahOleh / …Pada | Varchar(50) / Datetime | Yes | Pelaku dan waktu perubahan penanggung jawab |
| 10 | status | Enum | No | 'Pending', 'Reviewed', 'Approved', 'Rejected' |
| 11 | rejectionNote | Text | Yes | Catatan revisi saat ditolak |
| 12 | rejectedAt / rejectedBy | Datetime / Varchar(50) | Yes | Waktu dan pelaku penolakan |
| 13 | resubmittedAt | Datetime | Yes | Waktu dokumen diperbaiki setelah ditolak |
| 14 | lastApproved / lastApprovedBy | Datetime / Varchar(255) | Yes | Waktu dan pelaku persetujuan |
| 15 | pengingatDikirimPada / …Oleh | Datetime / Varchar(50) | Yes | Waktu dan pengirim pengingat dokumen kosong |
| 16 | diunggahOleh_userId | Varchar(50) | Yes | Pengguna yang pertama kali mengisi |
| 17 | lastEditedBy_userId | Varchar(50) | Yes | Pengguna yang terakhir mengubah |
| 18 | uploadedAt / updatedAt | Timestamp | Yes | Waktu diisi dan waktu diperbarui |

**Tabel riwayat_kegiatan**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Bigint | No | *Auto increment* |
| 2 | kegiatanId (FK) | Int(11) | No | Merujuk ke tabel kegiatan |
| 3 | aksi | Varchar(40) | No | Jenis aksi, mis. dokumen_disetujui |
| 4 | entitas | Enum | No | 'kegiatan', 'dokumen', 'ppl', 'progress', 'honor', 'penilaian' |
| 5 | entitasId | Int(11) | Yes | ID data yang dikenai aksi |
| 6 | jumlah | Smallint | No | Banyaknya data pada aksi massal |
| 7 | aktorUserId | Varchar(50) | Yes | ID pengguna pelaku |
| 8 | aktorNama | Varchar(255) | Yes | Nama pelaku (salinan) |
| 9 | ringkasan | Varchar(255) | Yes | Ringkasan aksi |
| 10 | terjadiPada | Datetime | No | Waktu kejadian |

**Tabel template_surat**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Int(11) | No | *Auto increment* |
| 2 | nama_template | Varchar(255) | No | Nama template |
| 3 | format_nomor | Varchar(255) | No | Pola nomor SPK, mis. {nomor}/SPK/{BULAN}/{ROMAWI}/{tahun} |
| 4 | format_nomor_bast | Varchar(255) | No | Pola nomor BAST |
| 5 | ppk_nama / ppk_nip / ppk_jabatan | Varchar | No | Data Pejabat Pembuat Komitmen |
| 6 | satker_nama | Varchar(255) | No | Nama satuan kerja |
| 7 | satker_alamat | Text | Yes | Alamat satuan kerja |
| 8 | kota | Varchar(100) | Yes | Kota penandatanganan |
| 9 | pengadilan_negeri | Varchar(255) | Yes | Pengadilan tempat penyelesaian sengketa |
| 10 | isi_pasal | Longtext | Yes | Daftar pasal perjanjian (JSON) |
| 11 | is_aktif | Tinyint(1) | No | Penanda template yang dipakai |
| 12 | updatedAt / updatedBy | Timestamp / Varchar(50) | Yes | Waktu dan pelaku perubahan terakhir |

**Tabel kontrak_mitra**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Int(11) | No | *Auto increment* |
| 2 | ppl_master_id (FK) | Varchar(50) | No | Merujuk ke tabel ppl_master |
| 3 | periode_mulai / periode_selesai | Date | No | Periode kontrak (unik bersama ppl_master_id) |
| 4 | nomor_urut | Int(11) | No | Nomor urut surat |
| 5 | nomor_surat | Varchar(255) | No | Nomor SPK lengkap |
| 6 | tanggal_surat | Date | No | Tanggal SPK |
| 7 | nomor_bast / tanggal_bast | Varchar(255) / Date | Yes | Nomor dan tanggal BAST |
| 8 | total_honor | Bigint | No | Total honor mitra dalam periode |
| 9 | template_id (FK) | Int(11) | Yes | Merujuk ke tabel template_surat |
| 10 | generatedAt / generatedBy | Timestamp / Varchar(50) | Yes | Waktu dan pembuat SPK |
| 11 | bastGeneratedAt / bastGeneratedBy | Timestamp / Varchar(50) | Yes | Waktu dan pembuat BAST |

**Tabel riwayat_surat**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Bigint | No | *Auto increment* |
| 2 | aksi | Varchar(50) | No | Jenis aksi, mis. atur_ulang_nomor |
| 3 | periode_mulai / periode_selesai | Date | No | Periode surat yang terdampak |
| 4 | jumlah / jumlah_bast | Int(11) | No | Banyaknya nomor SPK/BAST yang terdampak |
| 5 | nomor_surat / nomor_bast | Text | Yes | Daftar nomor yang dihapus |
| 6 | aktorNama | Varchar(50) | Yes | Pelaku |
| 7 | terjadiPada | Timestamp | No | Waktu kejadian |

**Tabel system_settings**

| No | Atribut | Tipe Data | Null | Keterangan |
|---|---|---|---|---|
| 1 | id (PK) | Int(11) | No | *Auto increment* |
| 2 | setting_key | Varchar(255) | No | Kunci pengaturan (unik), mis. HONOR_LIMIT |
| 3 | setting_value | Varchar(255) | No | Nilai pengaturan, mis. batas honor bulanan |
| 4 | description | Text | Yes | Keterangan pengaturan |

### Teks pengantar ERD

Hubungan antartabel digambarkan dalam *Entity Relationship Diagram* (ERD)
dengan notasi *crow's foot*. Agar tetap terbaca, ERD dibagi menjadi empat
bagian: (1) kegiatan dan alokasi mitra, (2) honor, progres, dan penilaian,
(3) dokumen dan riwayat kegiatan, serta (4) surat dan pengaturan. Garis
putus-putus menunjukkan relasi logis yang tidak dikunci dengan *foreign key*
di basis data, misalnya PML pada tabel `ppl` yang merujuk ke tabel `users`.
