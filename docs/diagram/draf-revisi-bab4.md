# Draf Revisi Bab IV — disesuaikan dengan aplikasi terbaru

> **Cara menyalin ke Word:** buka berkas ini di VS Code, tekan **Ctrl+Shift+V**
> (pratinjau), blok bagian yang diperlukan, salin, lalu tempel ke Word. Tabel
> ikut terbawa sebagai tabel Word. Setelah itu terapkan _Styles_ templat STIS
> (Isi Tabel, Judul Tabel, dan sebagainya).
>
> Teks dalam **[kurung siku]** harus Anda isi sendiri karena datanya tidak ada
> di kode (misalnya nama narasumber).
>
> Terakhir diselaraskan dengan kode dan database sampai migrasi
> `2026-09-24-kunci-nomor-dan-versi.sql`.

---

## 0. Ringkasan perubahan terhadap draf Revisi 10

| Bagian    | Yang diubah                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| 4.1       | Tambah paragraf narasumber dan cara wawancara (catatan dosen).                                             |
| Gambar 6  | Digambar ulang sebagai fishbone dengan 11 poin masalah yang konkret (`10-fishbone.drawio`, teks di 4.1.2). |
| 4.1.3     | KF menjadi 16 butir; KF-04, KF-05, KF-07, KF-08, dan KF-09 lama diperbaiki isinya. KNF diperbarui.         |
| Gambar 7  | Diganti `02-activity-proses-usulan`, ditambah 7 activity diagram rinci.                                    |
| Gambar 8  | Diganti `01-usecase`: 5 aktor, 34 use case.                                                                |
| Tabel 4–5 | Definisi aktor dan deskripsi use case diperbarui.                                                          |
| 4.2.3     | 13 tabel menjadi **18 tabel**; tabel lama ditambah kolom baru.                                             |
| Gambar 9  | ERD crow's foot, dipecah 4 (`09a`–`09d`).                                                                  |

**Hal yang bertentangan dengan aplikasi dan wajib dikoreksi:**

1. Batas SBML **tidak menolak mutlak**: sistem memberi peringatan dan meminta
   konfirmasi.
2. Penilai kinerja mitra adalah **PML**, bukan Ketua Tim.
3. Batas SBML adalah **satu nilai global per mitra per bulan** yang diatur
   **Tim Keuangan (atau Admin)**, bukan plafon per kegiatan, dan tidak mencakup
   transportasi.
4. Dokumen disimpan sebagai **tautan**, bukan berkas di _file system_ server.
5. Tidak ada fitur "setujui pencairan honor". Status "Selesai" ditentukan dari
   tanggal selesai tahap Diseminasi & Evaluasi.
6. SPK dibuat dalam format **PDF**, **satu surat per mitra per bulan**; aplikasi
   juga membuat **BAST**.
7. Honor yang melintasi beberapa bulan dipecah menurut **muatan** (unit beban
   kerja), bukan dibagi dalam rupiah; setiap bulan mendapat SPK sendiri.

**Konsistensi dengan bab lain yang ikut terdampak:**

- Nama sistem: seluruh diagram dan draf kini memakai **SIKAMI** mengikuti tujuan
  umum versi terbaru. Makalah seminar proposal memakai **OPTIMA**, dan aplikasinya
  sendiri (logo, sidebar, basis data) memakai **Kharisma**. Pastikan satu nama
  dipakai konsisten di seluruh naskah, dan sebutkan sekali di Bab I bila namanya
  berubah dari yang dipakai saat seminar proposal.
- Bab III (Tahap Implementation) menyebut "middleware otentikasi JWT".
  Sesuaikan dengan KNF-01 di bawah (token bertanda tangan HMAC-SHA256).
- Bab I Tujuan Khusus no. 2 dan Bab II Express.js menyebut "pembatas SBM
  otomatis ... memastikan tidak ada alokasi yang melanggar". Kalimat itu lebih
  tepat menjadi "peringatan otomatis yang mewajibkan konfirmasi".
- Bab I Batasan Masalah no. 3 menyebut data mitra "belum terintegrasi secara
  otomatis dengan Sobat BPS". Tetap benar (belum ada API), tetapi kini dapat
  ditambahkan bahwa daftar mitra **dapat diimpor dari berkas Excel SOBAT**.

---

## 4.1 Analisis Sistem Berjalan — paragraf tambahan (catatan dosen)

Analisis sistem berjalan dilakukan melalui wawancara mendalam dan observasi
selama pelaksanaan praktik kerja lapangan di BPS Kabupaten Bengkulu Selatan
pada [bulan–bulan, tahun]. Narasumber (_subject matter_) dipilih secara
_purposive_ berdasarkan keterlibatan langsung dalam pengelolaan mitra
statistik, yaitu: (1) [jabatan, mis. Kepala Subbagian Umum] selaku penanggung
jawab administrasi keuangan; (2) [jabatan] selaku Ketua Tim [nama tim];
(3) [jabatan] selaku Pengawas Mutu Lapangan (PML); dan (4) [jabatan lain bila
ada]. Wawancara dilakukan secara [tatap muka/daring] dengan pedoman wawancara
semi-terstruktur yang mencakup alur alokasi mitra, penerbitan kontrak,
pemantauan progres, kelengkapan dokumen, dan evaluasi kinerja mitra. Hasil
wawancara dikonfirmasi dengan pengamatan langsung terhadap dokumen kerja yang
digunakan, seperti _spreadsheet_ alokasi dan rekapitulasi progres.
[Pedoman dan ringkasan hasil wawancara dapat dilampirkan pada Lampiran X.]

---

## 4.1.2 Permasalahan Sistem Berjalan — teks pengganti (sesuai Gambar 6 baru)

Hasil analisis terhadap proses bisnis yang sedang berjalan di BPS Kabupaten
Bengkulu Selatan menunjukkan bahwa pengelolaan administrasi dan pemantauan
kegiatan mitra statistik masih dilakukan secara manual, dan data yang digunakan
tidak saling terhubung. Akibatnya, pekerjaan yang sama harus dikerjakan berulang
kali dan kesalahan pencatatan sulit dihindari. Penyebab masalah tersebut
dikelompokkan ke dalam empat faktor, yaitu manusia (_man_), metode (_method_),
teknologi (_machine_), dan data/dokumen (_material_), sebagai berikut.

1. Faktor Teknologi (_Machine_): Sarana yang digunakan saat ini belum mendukung
   pembatasan akses maupun pemantauan secara menyeluruh. Nilai kinerja mitra
   dicatat pada _spreadsheet_ penilaian yang dapat diubah oleh siapa pun yang
   memiliki akses ke berkas tersebut, termasuk nilai mitra yang tidak
   diawasinya. Belum ada pula pengingat otomatis untuk tenggat setiap tahap
   kegiatan maupun dokumen yang belum lengkap. Selain itu, progres kegiatan
   FASIH dipantau melalui aplikasi FASIH, sedangkan progres kegiatan Non-FASIH
   dicatat pada _spreadsheet_ masing-masing tim. Karena tersimpan di tempat yang
   berbeda, Kepala BPS tidak dapat memantau progres seluruh tim dalam satu
   tampilan.

2. Faktor Metode (_Method_): Sebagian besar pekerjaan administrasi masih
   dikerjakan satu per satu. Surat Perjanjian Kerja (SPK) dan Berita Acara Serah
   Terima (BAST) diketik dan dinomori satu per satu untuk setiap mitra.
   Pengecekan batas honor mitra memang sudah menggunakan _spreadsheet_
   pengecekan, tetapi _spreadsheet_ tersebut tidak otomatis mencegah honor
   seorang mitra melebihi batas SBML, sehingga kelebihan honor baru diketahui
   apabila data diperiksa satu per satu. Pada tahap evaluasi, peringkat kinerja
   mitra setiap triwulan juga masih dihitung secara manual.

3. Faktor Manusia (_Man_): Cara kerja tersebut membebani pegawai yang terlibat.
   Tim Keuangan harus mengerjakan ulang rekap honor, pengecekan batas SBML, dan
   pencocokan data mitra secara manual. Di sisi lain, Ketua Tim tidak mengetahui
   mitra yang sudah dialokasikan oleh tim lain pada bulan yang sama, sehingga
   seorang mitra dapat menerima pekerjaan dari beberapa tim sekaligus tanpa
   disadari. Ketua Tim juga harus menelusuri daftar mitra satu per satu untuk
   menemukan mitra yang tinggal di sekitar wilayah tugas kegiatan.

4. Faktor Data/Dokumen (_Material_): Data dan dokumen kegiatan belum dikelola
   dalam satu tempat. Tautan dokumen seperti Surat Keputusan (SK), Surat Tugas
   (ST), dan BAST tidak terkumpul per kegiatan, sehingga kelengkapannya sulit
   diperiksa saat pencairan honor. _Spreadsheet_ alokasi mitra juga tidak
   terhubung dengan data honor, progres, dan penilaian, sehingga data yang sama
   harus dipindahkan dan dicocokkan kembali setiap kali dibutuhkan.

Hubungan antara keempat faktor penyebab tersebut dengan masalah utama
digambarkan pada diagram sebab-akibat (_fishbone_) berikut.

---

## 4.1.3 Analisis Kebutuhan Sistem

### 1. Kebutuhan Fungsional

> **Bentuk penyajian mengikuti arahan pembimbing:** tabel tiga kolom berisi kode,
> nama modul, dan penjelasan. Penjelasannya diringkas agar mudah dibaca sekali
> lihat, tetapi seluruh aturan penting tetap disebut. Versi prosa yang lebih
> panjang disimpan di bawah tabel sebagai cadangan, bukan untuk dimasukkan ke buku.

**Tabel …: Kebutuhan Fungsional Sistem**

| Kode  | Modul                           | Penjelasan                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KF-01 | Otentikasi dan Kata Sandi       | Masuk dengan nama pengguna dan kata sandi; akses tiap halaman dibatasi menurut peran; pengguna dapat melihat identitas akunnya dan mengganti kata sandinya sendiri. Nama dan peran hanya dapat diubah Admin.                                                                                                                                                                                                                                                   |
| KF-02 | Data Master                     | Admin mengelola akun pengguna beserta perannya, data Ketua Tim, dan profil mitra lengkap dengan kecamatan serta desanya. Mitra yang berhenti dinonaktifkan, bukan dihapus, agar honor, surat, dan penilaiannya tetap tersimpan. Daftar mitra dapat dilihat, disaring per wilayah, dan diekspor ke Excel oleh seluruh pegawai.                                                                                                                                  |
| KF-03 | Impor Mitra dari SOBAT          | Admin mengimpor daftar mitra dari berkas Excel SOBAT. Tiap baris dicocokkan berdasarkan ID SOBAT atau nama, Admin menentukan tindakan per baris (tambah, perbarui, lewati, nonaktifkan), lalu pratinjau ringkasan ditampilkan sebelum perubahan diterapkan dalam satu transaksi.                                                                                                                                                                               |
| KF-04 | Pengelolaan Kegiatan            | Pegawai membuat kegiatan dengan jadwal empat tahap: Persiapan, Pengumpulan Data, Pengolahan & Analisis, serta Diseminasi & Evaluasi. Dua tahap terakhir dapat dinonaktifkan lewat kotak centang. Kegiatan hanya dapat disunting pembuatnya, Ketua Tim kegiatan itu, atau Admin. Penyimpanan dapat dibatalkan lewat jendela konfirmasi yang tampil sesaat setelah simpan.                                                                                       |
| KF-05 | Alokasi Mitra dan Honor         | Mitra aktif dialokasikan ke tiap tahap beserta PML pengawas, beban kerja, dan harga satuan; honor terisi otomatis sebesar beban kerja dikali harga satuan. Mitra dipilih dari daftar yang dapat disaring menurut kecamatan dan desa, hanya memuat mitra sesuai posisi tahap, dan menolak mitra yang sudah dialokasikan. Bila periode honor melintasi beberapa bulan, muatan dibagi dengan tiga cara: satu bulan penuh, dibagi menurut jumlah hari, atau luber. |
| KF-06 | Validasi Batas SBML             | Setiap penyimpanan kegiatan, sistem menjumlahkan honor tiap mitra per bulan dari seluruh kegiatan lalu membandingkannya dengan batas honor bulanan. Bila melebihi, sistem menampilkan peringatan berisi nama mitra, bulan, total honor, dan batasnya, lalu meminta konfirmasi sebelum menyimpan. Nilai batas diatur Tim Keuangan atau Admin.                                                                                                                   |
| KF-07 | Pemantauan Progres              | PML menginput progres mitra yang diawasinya. Tahap pendataan memakai status open, submit, diperiksa, dan approved; tahap pengolahan memakai belum entry, sudah entry, validasi, dan clean. Total progres tidak boleh melebihi beban kerja. Rekapitulasinya tampil pada dasbor dalam bentuk grafik dan tabel, dilengkapi penyaring dan pencarian global.                                                                                                        |
| KF-08 | Repositori Dokumen              | Sistem menyediakan daftar dokumen wajib tiap tahap (SK, Surat Tugas, KAK, Visum, BAST, laporan tahap), memungkinkan penambahan dokumen lain, dan menyimpan tiap dokumen sebagai tautan ke penyimpanan instansi. Tiap dokumen memiliki penanggung jawab: Ketua Tim atau Tim Keuangan. Dokumen wajib hanya dapat dihapus Tim Keuangan atau Admin.                                                                                                                |
| KF-09 | Verifikasi Dokumen              | Tim Keuangan menyetujui dokumen satu per satu atau sekaligus satu tahap, serta menolak dokumen disertai catatan revisi yang wajib diisi. Tim Keuangan juga dapat mengirim pengingat untuk dokumen yang belum diisi.                                                                                                                                                                                                                                            |
| KF-10 | Notifikasi Otomatis             | Notifikasi tampil sesuai peran. Ketua Tim: tenggat tahap H-3 sampai H-1 dan keterlambatan, dokumen ditolak, progres yang tidak diperbarui lebih dari dua hari, serta pengingat dari Tim Keuangan. Tim Keuangan: dokumen menunggu persetujuan, dokumen diunggah ulang, dokumen tanggung jawabnya yang belum diisi, dan surat yang isinya berubah setelah terbit. Notifikasi hilang sendiri setelah penyebabnya selesai.                                         |
| KF-11 | Surat Perjanjian Kerja dan BAST | Tim Keuangan membuat SPK dan BAST mitra dalam bentuk PDF untuk satu bulan honor, satu surat per mitra per bulan. Surat disusun dari template yang dapat diatur (data PPK, satuan kerja, pola nomor, isi pasal), dilengkapi uraian tugas dan kode beban anggaran. Nomor diberikan otomatis, tetap sama bila dicetak ulang, tidak kembar dalam satu tahun, dan nomor BAST mengikuti nomor urut SPK mitra yang sama.                                              |
| KF-12 | Riwayat Penyuratan              | Sistem menyajikan seluruh surat dalam satu tahun, termasuk surat batal dan nomor kosong. Tim Keuangan dapat memperbarui isi surat mengikuti data terkini tanpa mengganti nomornya, membatalkan surat disertai catatan, menghapus surat yang sudah batal, mengubah nomor, serta merapikan atau mengatur ulang penomoran dengan pratinjau dan frasa konfirmasi. Tindakan yang menggeser nomor dicatat sebagai jejak audit.                                       |
| KF-13 | Rekap Honor dan Beban Kerja     | Sistem menyajikan rekapitulasi honor tiap mitra per bulan atau per rentang tanggal, lengkap dengan penanda mitra yang melebihi batas, dan dapat diunduh ke PDF maupun Excel. Sistem juga menampilkan jumlah kegiatan tiap mitra, jumlah kegiatan serta muatan tiap PML, dan grafik kegiatan maupun honor per tim, sehingga pembagian beban kerja dapat dipantau.                                                                                               |
| KF-14 | Penilaian Kinerja               | PML menilai mitra yang diawasinya pada tiga aspek (sikap dan perilaku, kualitas pekerjaan, ketepatan waktu) dengan skala bilangan bulat 1-10, lalu rata-ratanya dihitung otomatis. Mitra yang diawasi PML lain tidak dapat dinilai, dan pembatasan ini ditegakkan di sisi server. Hasil penilaian dapat diekspor ke PDF dan Excel.                                                                                                                             |
| KF-15 | Pemeringkatan Triwulanan        | Sistem menghitung peringkat mitra per triwulan berdasarkan bulan pembebanan honornya, dengan rumus nilai akhir = rata-rata nilai + (0,01 x jumlah kegiatan) yang diikuti mitra pada triwulan tersebut, lalu mengurutkannya dari nilai tertinggi. Peringkat dapat dilihat dan diunduh seluruh pegawai sebagai bahan evaluasi dan apresiasi mitra.                                                                                                               |
| KF-16 | Riwayat dan Arsip Kegiatan      | Sistem mencatat tiap aksi pengguna pada suatu kegiatan (perubahan data, alokasi, progres, dokumen, penilaian) beserta pelaku dan waktunya. Admin dapat mengarsipkan kegiatan, dan hanya dapat menghapus kegiatan yang belum memiliki alokasi mitra maupun penilaian.                                                                                                                                                                                           |

<details>
<summary><b>Versi prosa lengkap (cadangan, jangan dimasukkan ke buku)</b></summary>

Disimpan kalau-kalau pembimbing meminta penjelasan yang lebih panjang untuk KF
tertentu, atau bila ada kalimat yang ingin Anda pindahkan kembali ke tabel.

- **KF-01 (Otentikasi dan Kata Sandi):** Sistem harus menyediakan fitur _login_
  dengan nama pengguna dan kata sandi, membatasi akses setiap halaman sesuai
  peran pengguna, serta memungkinkan pengguna melihat identitas akunnya dan
  mengganti kata sandinya sendiri. Nama dan peran akun hanya dapat diubah oleh
  Admin.
- **KF-02 (Data Master):** Sistem harus memungkinkan Admin mengelola akun
  pengguna beserta perannya, data Ketua Tim (termasuk tim dan akun yang
  ditautkan), serta basis data profil Mitra Statistik lengkap dengan wilayah
  kecamatan dan desanya. Mitra yang berhenti dinonaktifkan, bukan dihapus,
  sehingga honor, surat, dan penilaiannya tetap tersimpan dan mitra dapat
  diaktifkan kembali. Daftar mitra dapat dilihat, disaring per kecamatan dan desa, dan diekspor ke Excel oleh
  seluruh pegawai.
- **KF-03 (Impor Mitra dari SOBAT):** Sistem harus memungkinkan Admin
  mengimpor daftar mitra dari berkas Excel aplikasi SOBAT. Setiap baris
  dicocokkan dengan mitra yang sudah ada berdasarkan ID SOBAT atau nama, Admin
  menentukan tindakan per baris (tambah, perbarui, atau lewati) dan memilih
  mitra yang dinonaktifkan, lalu sistem menampilkan pratinjau ringkasan
  sebelum perubahan diterapkan dalam satu transaksi.
- **KF-04 (Pengelolaan Kegiatan):** Sistem harus memungkinkan pegawai membuat
  kegiatan statistik (survei atau sensus) dengan jadwal empat tahap:
  Persiapan, Pengumpulan Data, Pengolahan & Analisis, serta Diseminasi &
  Evaluasi. Tahap Pengolahan & Analisis dan Diseminasi & Evaluasi dapat
  diaktifkan atau dinonaktifkan per kegiatan melalui kotak centang, karena
  tidak semua kegiatan memiliki kedua tahap tersebut. Kegiatan hanya dapat
  disunting oleh pembuatnya, Ketua Tim kegiatan tersebut, atau Admin.
  Pembuat dapat membatalkan penyimpanan kegiatan yang baru saja disimpan
  melalui tombol pada jendela konfirmasi yang tampil sesaat (sekitar 6 detik)
  setelah simpan, sebelum jendela itu otomatis tertutup dan berpindah ke
  dasbor. Jendela ini sengaja singkat dan tidak memeriksa alokasi mitra yang
  sudah tersimpan, karena tujuannya membuang kegiatan yang baru salah
  disimpan sebelum sempat dikerjakan siapa pun. Kegiatan yang sudah memiliki
  alokasi mitra atau penilaian hanya dapat dihapus melalui Admin, dan
  permintaan itu ditolak bila keduanya sudah ada; kegiatan tersebut harus
  diarsipkan alih-alih dihapus.
- **KF-05 (Alokasi Mitra dan Honor):** Sistem harus memungkinkan pengguna
  mengalokasikan mitra aktif ke setiap tahap kegiatan beserta PML
  pengawasnya, beban kerja, dan harga satuan, lalu menghitung honor secara
  otomatis (beban kerja × harga satuan). Mitra dipilih melalui daftar
  mitra yang dapat disaring menurut kecamatan dan desa; daftar itu hanya
  memuat mitra aktif yang posisinya sesuai tahap (pendataan atau pengolahan)
  dan tidak mengizinkan mitra yang sama dipilih dua kali pada satu tahap. Bila periode honor melintasi
  beberapa bulan, muatan (unit beban kerja) dibebankan ke bulan-bulan tersebut
  dengan tiga metode: seluruhnya ke satu bulan, dibagi menurut jumlah hari,
  atau luber (bulan pertama diisi sampai batas, sisanya ke bulan berikutnya).
  Honor setiap bulan selalu sebesar volume × harga satuan.
- **KF-06 (Validasi Batas SBML):** Setiap kali kegiatan disimpan, sistem harus
  menjumlahkan honor setiap mitra per bulan dari seluruh kegiatan dan
  membandingkannya dengan batas honor bulanan (SBML). Bila melebihi, sistem
  menampilkan peringatan yang memuat nama mitra, bulan, total honor, dan
  batasnya, lalu meminta konfirmasi sebelum data disimpan. Nilai batas SBML
  diatur oleh Tim Keuangan atau Admin.
- **KF-07 (Monitoring Progres):** Sistem harus memungkinkan PML menginput
  progres pekerjaan mitra yang diawasinya. Tahap _listing_/pencacahan memakai
  status _open_, _submit_, diperiksa, dan _approved_; tahap pengolahan memakai
  belum _entry_, sudah _entry_, validasi, dan _clean_. Total progres tidak
  boleh melebihi beban kerja. Rekapitulasinya ditampilkan pada _dashboard_
  dalam bentuk grafik dan tabel, dilengkapi filter dan pencarian global.
- **KF-08 (Repositori Dokumen):** Sistem harus menyediakan daftar dokumen
  wajib bawaan untuk setiap tahap kegiatan (antara lain SK, Surat Tugas, KAK,
  Visum, BAST, dan laporan tiap tahap), memungkinkan penambahan dokumen lain,
  dan menyimpan setiap dokumen sebagai tautan ke penyimpanan instansi. Setiap
  dokumen memiliki penanggung jawab pengisian: Ketua Tim atau Tim Keuangan.
  Dokumen wajib hanya dapat dihapus oleh Tim Keuangan atau Admin.
- **KF-09 (Verifikasi Dokumen):** Sistem harus memungkinkan Tim Keuangan
  menyetujui dokumen, satu per satu atau sekaligus satu tahap, serta menolak
  dokumen disertai catatan revisi. Tim Keuangan juga dapat mengirim
  pengingat untuk dokumen yang belum diisi.
- **KF-10 (Notifikasi Otomatis):** Sistem harus menampilkan notifikasi sesuai
  peran pengguna. Bagi Ketua Tim: tenggat tahap H-3 sampai H-1 dan
  keterlambatan, dokumen ditolak, progres kegiatan yang tidak diperbarui lebih
  dari dua hari, serta pengingat dari Tim Keuangan. Bagi Tim Keuangan: dokumen
  menunggu persetujuan, dokumen diunggah ulang, dokumen tanggung jawab Tim
  Keuangan yang belum diisi, dan surat yang isinya berubah setelah terbit.
  Notifikasi hilang dengan sendirinya setelah penyebabnya diselesaikan.
- **KF-11 (Surat Perjanjian Kerja dan BAST):** Sistem harus memungkinkan Tim
  Keuangan membuat SPK dan BAST mitra dalam format PDF untuk satu bulan honor,
  dengan satu surat per mitra per bulan. Surat disusun dari template yang dapat
  diatur (data PPK, satuan kerja, pola nomor, isi pasal), dilengkapi uraian
  tugas dan kode beban anggaran (MAK). Nomor surat diberikan otomatis, tetap
  sama bila surat dicetak ulang, dan tidak kembar dalam satu tahun. Nomor BAST
  mengikuti nomor urut SPK mitra yang sama.
- **KF-12 (Riwayat Penyuratan):** Sistem harus menyajikan seluruh surat dalam
  satu tahun, termasuk surat batal dan nomor yang kosong. Tim Keuangan dapat
  memperbarui isi surat mengikuti data terkini tanpa mengganti nomornya,
  membatalkan surat dengan catatan alasan, menghapus surat yang sudah batal,
  mengubah nomor surat, serta merapikan atau mengatur ulang penomoran dengan
  pratinjau dan frasa konfirmasi. Tindakan yang menghapus atau menggeser nomor
  dicatat sebagai jejak audit.
- **KF-13 (Rekap Honor):** Sistem harus menyajikan rekapitulasi honor setiap
  mitra per bulan atau per rentang tanggal, lengkap dengan penanda mitra yang
  melebihi batas SBML, yang dapat diunduh dalam format PDF dan Excel. Sistem
  juga menampilkan jumlah kegiatan setiap mitra, jumlah kegiatan, mitra, dan
  muatan setiap PML, serta grafik kegiatan dan honor per tim, sehingga
  pembagian beban kerja antar-mitra, PML, dan tim dapat dipantau.
- **KF-14 (Penilaian Kinerja):** Sistem harus memungkinkan PML menilai mitra
  yang diawasinya pada tiga aspek (Sikap & Perilaku, Kualitas Pekerjaan,
  Ketepatan Waktu) dengan skala bilangan bulat 1–10, lalu menghitung rata-
  ratanya secara otomatis. Hasil penilaian dapat diekspor ke PDF dan Excel.
- **KF-15 (_Auto-Ranking_ Triwulanan):** Sistem harus menghitung peringkat mitra
  per triwulan, berdasarkan bulan pembebanan honornya, dengan rumus
  _nilai akhir = rata-rata nilai + 0,01 × jumlah kegiatan_ yang diikuti mitra
  pada triwulan tersebut, lalu mengurutkannya dari nilai tertinggi. Peringkat
  dapat dilihat dan diunduh (PDF dan Excel) oleh seluruh pegawai sebagai bahan
  evaluasi dan apresiasi mitra.
- **KF-16 (Riwayat dan Arsip Kegiatan):** Sistem harus mencatat setiap aksi
  pengguna pada suatu kegiatan (perubahan data, alokasi, progres, dokumen,
  penilaian) beserta pelaku dan waktunya. Admin dapat mengarsipkan kegiatan,
  dan hanya dapat menghapus kegiatan yang belum memiliki alokasi mitra maupun
  penilaian.

</details>

### 2. Kebutuhan Non-Fungsional

> Bentuknya disamakan dengan tabel kebutuhan fungsional agar seragam. Versi prosa
> disimpan di bawah tabel sebagai cadangan.

**Tabel …: Kebutuhan Non-Fungsional Sistem**

| Kode | Aspek | Penjelasan |
| --- | --- | --- |
| KNF-01 | Keamanan Akses | Kata sandi disimpan dalam bentuk tersandi (_hash_) bcrypt, panjang 8-72 karakter, dan tidak boleh sama dengan nama pengguna. Sesi memakai token bertanda tangan HMAC-SHA256 yang berlaku 12 jam; mengganti kata sandi langsung mencabut seluruh sesi lama. Percobaan masuk dan ganti kata sandi dibatasi jumlahnya. Otorisasi berlapis: menurut peran (Admin, Tim Keuangan, Pegawai) dan menurut kepemilikan data (kegiatan hanya dapat disunting pemiliknya; progres dan penilaian hanya oleh PML mitra tersebut). Identitas pelaku selalu diambil dari token, bukan dari data yang dikirim peramban. |
| KNF-02 | Penerapan dan Jaringan | Sistem dipasang pada layanan _hosting_ cPanel milik BPS dan berada di dalam jaringan BPS, sehingga aksesnya terbatas pada pegawai BPS. Dari luar kantor, sistem hanya dapat dibuka melalui koneksi FortiClient VPN BPS. |
| KNF-03 | Kinerja dan Pengalaman Pengguna | Sistem dikembangkan sebagai _Single Page Application_ sehingga perpindahan halaman tidak memuat ulang seluruh halaman. Pustaka berukuran besar (pembuat PDF dan Excel) baru dimuat saat dibutuhkan. Tampilan responsif dan mendukung tema terang serta gelap. |
| KNF-04 | Integritas Data | Basis data menjaga keterhubungan data dengan kunci asing dan kunci unik. Penyimpanan kegiatan beserta alokasinya maupun impor mitra berjalan dalam satu transaksi, sehingga kegagalan tidak meninggalkan data setengah tersimpan. Penyuntingan bersamaan dijaga dengan nomor versi kegiatan: simpanan yang didasarkan pada data lama ditolak alih-alih menimpa perubahan orang lain. Penomoran surat dikunci per tahun dan dijaga indeks unik. Nilai penilaian divalidasi di server sebagai bilangan bulat 1-10. |
| KNF-05 | Keterlacakan dan Jejak Audit | Setiap perubahan penting tercatat pada tabel riwayat, termasuk pelaku dan waktunya. Surat yang tidak dipakai dibatalkan dengan catatan, bukan dihapus diam-diam, dan mitra yang berhenti dinonaktifkan, bukan dihapus. |
| KNF-06 | Arsip Dokumen | Dokumen disimpan sebagai tautan (maksimal 512 karakter) ke penyimpanan resmi instansi, dengan pemeriksaan bentuk dan panjang tautan sebelum disimpan, sehingga berkas aslinya tetap berada di penyimpanan yang dikelola instansi. |
| KNF-07 | Kesiapan Integrasi | Seluruh modul berkomunikasi melalui RESTful API. Tabel kegiatan sudah memiliki kolom penanda kegiatan FASIH dan pemilih sumber progres di sisi server, sehingga sumber data progres dapat disambungkan ke FASIH tanpa mengubah struktur basis data maupun antarmuka. Penanda tersebut belum disediakan di formulir kegiatan karena sambungan ke FASIH belum tersedia. |

<details>
<summary><b>Versi prosa lengkap (cadangan, jangan dimasukkan ke buku)</b></summary>


- **KNF-01 (Keamanan Akses):** Kata sandi disimpan dalam bentuk _hash_ bcrypt
  dan harus terdiri dari 8–72 karakter serta tidak sama dengan nama pengguna.
  Sesi pengguna menggunakan token bertanda tangan HMAC-SHA256 yang berlaku 12
  jam; mengganti kata sandi langsung mencabut seluruh sesi lama akun tersebut.
  Percobaan _login_ dan ganti kata sandi dibatasi (_rate limiting_). Otorisasi
  diterapkan berlapis: berdasarkan peran (Admin, Tim Keuangan, Pegawai) dan
  berdasarkan kepemilikan data (kegiatan hanya dapat disunting pemiliknya;
  progres dan penilaian hanya oleh PML mitra tersebut). Identitas pelaku
  selalu diambil dari token, bukan dari data yang dikirim peramban.
- **KNF-02 (Penerapan dan Jaringan):** Sistem dipasang pada layanan _hosting_
  cPanel milik BPS dan berada di dalam jaringan BPS, sehingga aksesnya terbatas
  pada pegawai BPS. Dari luar kantor, sistem hanya dapat dibuka melalui koneksi
  FortiClient VPN BPS.
- **KNF-03 (Kinerja dan Pengalaman Pengguna):** Sistem dikembangkan sebagai
  _Single Page Application_ (SPA) dengan React.js, sehingga perpindahan halaman
  tidak memuat ulang seluruh halaman. Pustaka berukuran besar (pembuat PDF dan
  Excel) baru dimuat saat dibutuhkan. Tampilan responsif dan mendukung tema
  terang/gelap.
- **KNF-04 (Integritas Data):** Basis data MySQL menjaga keterhubungan data
  dengan _foreign key_ dan _unique key_. Penyimpanan kegiatan beserta alokasinya
  maupun impor mitra berjalan dalam satu transaksi, sehingga kegagalan tidak
  meninggalkan data setengah tersimpan. Penyuntingan bersamaan dijaga dengan
  nomor versi kegiatan: simpanan yang didasarkan pada data lama ditolak alih-alih
  menimpa perubahan orang lain. Penomoran surat dikunci per tahun dan dijaga
  indeks unik, sehingga nomor surat aktif tidak mungkin kembar walau dibuat
  bersamaan. Nilai penilaian divalidasi di server (bilangan bulat 1–10).
- **KNF-05 (Keterlacakan/Audit):** Setiap perubahan penting tercatat pada tabel
  riwayat (riwayat kegiatan dan riwayat nomor surat), termasuk pelaku dan
  waktunya. Surat yang tidak dipakai dibatalkan dengan catatan, bukan dihapus
  diam-diam, dan mitra yang berhenti dinonaktifkan, bukan dihapus.
- **KNF-06 (Arsip Dokumen):** Dokumen disimpan sebagai tautan (maksimal 512
  karakter) ke penyimpanan resmi instansi, dengan validasi format dan panjang
  tautan sebelum disimpan, sehingga berkas asli tetap berada di penyimpanan
  yang dikelola instansi.
- **KNF-07 (Kesiapan Integrasi):** Seluruh modul berkomunikasi melalui RESTful
  API. Tabel kegiatan juga sudah memiliki kolom penanda kegiatan FASIH dan
  pemilih sumber progres di sisi server, sehingga sumber data progres dapat
  disambungkan ke FASIH tanpa mengubah struktur basis data maupun antarmuka.
  Penanda tersebut belum disediakan di formulir kegiatan karena sambungan ke
  FASIH belum tersedia.

</details>

---

## 4.2.1 Proses Bisnis Sistem Usulan - narasi pengganti

> **Menjawab catatan pembimbing** bahwa perbedaan dengan sistem berjalan belum
> terlihat. Perbaikannya ada tiga: (1) ditambahkan tabel perbandingan langsung
> sebelum narasi, (2) setiap tahap narasi menyebut apa yang dahulu dikerjakan
> manual dan apa yang sekarang diambil alih sistem, dan (3) istilah umum seperti
> "sentralisasi data" diganti dengan penyebutan data apa yang disatukan.

### Perbandingan sebelum dan sesudah

Tabel berikut diletakkan di awal subbab agar pembaca langsung melihat perubahannya.

**Tabel …: Perbandingan Proses Bisnis Sistem Berjalan dan Sistem Usulan**

| Tahap                   | Sistem berjalan                                                                                                                        | Sistem usulan                                                                                                                                       | Yang berubah                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Penentuan mitra         | Ketua Tim menelusuri daftar mitra satu per satu untuk mencari mitra di sekitar wilayah tugas, tanpa tahu beban kegiatan mitra tersebut | Daftar mitra disaring menurut kecamatan dan desa, hanya menampilkan mitra aktif sesuai posisi tahap, beserta jumlah kegiatan yang sedang diikutinya | Pencarian manual menjadi penyaringan; beban mitra terlihat saat memilih |
| Perhitungan honor       | Honor dihitung manual, dan honor yang melintasi dua bulan dibagi sendiri oleh petugas                                                  | Honor terisi otomatis sebesar beban kerja dikali harga satuan; pembagian lintas bulan dihitung sistem menurut muatan                                | Perhitungan berpindah dari petugas ke sistem                            |
| Pengecekan batas SBML   | Dicek manual di berkas pengecekan, tidak memberi peringatan apa pun saat batas terlampaui                                              | Saat kegiatan disimpan, sistem menjumlahkan honor mitra dari seluruh kegiatan semua tim lalu memperingatkan bila melebihi batas                     | Pengecekan yang pasif menjadi peringatan yang aktif muncul sendiri      |
| Penerbitan SPK dan BAST | Diketik dan dinomori satu per satu untuk tiap mitra tiap bulan                                                                         | Dibuat dari template, nomor diberikan otomatis dan tidak kembar, dapat dibuat sekaligus satu periode                                                | Pengetikan berulang menjadi sekali proses                               |
| Dokumen kegiatan        | Tautan dokumen tersebar di folder masing-masing Ketua Tim; kelengkapan ditagih satu per satu                                           | Tautan dokumen terkumpul per kegiatan dan per tahap, dilengkapi status pemeriksaan dan pengingat otomatis                                           | Dokumen tersebar menjadi terkumpul per kegiatan                         |
| Pemantauan progres      | Progres FASIH di aplikasinya sendiri, progres Non-FASIH di berkas kerja tiap tim                                                       | Seluruh progres tampil pada satu dasbor beserta grafik, penyaring, dan penanda kegiatan yang tertinggal                                             | Dua tempat terpisah menjadi satu tampilan                               |
| Pengingat               | Tidak ada; bergantung pada pesan antarpegawai                                                                                          | Notifikasi otomatis untuk tenggat tahap, dokumen ditolak, progres yang tidak diperbarui, dan surat yang isinya berubah                              | Pengingat manusia menjadi pengingat sistem                              |
| Penilaian mitra         | Dicatat di berkas yang dapat diubah siapa pun yang memiliki tautannya                                                                  | Hanya PML yang mengawasi mitra tersebut yang dapat menilai, dan pembatasan ditegakkan di sisi server                                                | Berkas terbuka menjadi berkas dengan hak akses                          |
| Pemeringkatan           | Dihitung ulang manual tiap triwulan dengan menggabungkan dua berkas                                                                    | Dihitung otomatis dari data penilaian dan jumlah kegiatan yang sudah tersimpan dalam satu basis data                                                | Perhitungan manual menjadi otomatis                                     |

### Apa yang dimaksud dengan data terpusat

Istilah "data terpusat" pada penelitian ini berarti sembilan jenis data yang
sebelumnya disimpan di berkas yang berbeda kini tersimpan dalam satu basis data dan
saling terhubung, yaitu: data kegiatan beserta jadwal tahapnya, profil mitra beserta
wilayahnya, alokasi mitra pada tiap tahap, pembebanan honor per bulan, progres
pekerjaan, dokumen kegiatan, surat perjanjian kerja dan BAST, penilaian kinerja, serta
riwayat perubahan. Keterhubungan itulah yang membuat pekerjaan yang dahulu memerlukan
pemindahan data antar-berkas kini dapat dilakukan sistem sendiri - misalnya
pemeringkatan mitra yang membutuhkan data penilaian sekaligus jumlah kegiatan, atau
pembuatan SPK yang membutuhkan data mitra sekaligus rincian honornya.

### Narasi alur sistem usulan

1. **Perencanaan dan Alokasi.** Ketua Tim atau pegawai pembuat kegiatan mengisi
   informasi kegiatan, jadwal tahap, dan tahap yang digunakan, lalu memilih mitra
   aktif melalui daftar yang dapat disaring menurut kecamatan dan desa, dan
   mengalokasikannya beserta PML, beban kerja, harga satuan, serta metode
   pembebanan. Berbeda dengan cara lama yang menghitung honor secara manual, sistem
   membagi muatan ke bulan pembebanan dan langsung menjumlahkan honor setiap bulan
   dengan honor mitra tersebut di kegiatan lain, termasuk kegiatan milik tim lain.
   Bila total honor bulanan melebihi batas SBML, sistem menampilkan peringatan dan
   meminta Ketua Tim merevisi alokasi atau mengonfirmasi penyimpanan - pemeriksaan
   yang pada sistem berjalan hanya terjadi bila petugas membuka berkas pengecekan.
   Data kegiatan, alokasi, dan pembebanan honor kemudian tersimpan di satu basis
   data, dan sistem membuat daftar dokumen wajib setiap tahap.
2. **Kontrak Kerja.** Tim Keuangan memilih bulan honor, melengkapi uraian tugas dan
   kode anggaran, lalu membuat SPK dalam format PDF. Setiap mitra mendapat satu SPK
   per bulan dengan nomor yang diberikan otomatis dan dijamin tidak kembar,
   menggantikan pengetikan dan penomoran satu per satu pada cara lama. Seluruh SPK
   satu periode dapat dibuat sekaligus.
3. **Pelaksanaan dan Pemantauan.** PML menginput progres mitra yang diawasinya ke
   sistem. Karena progres seluruh kegiatan tersimpan di tempat yang sama, dasbor
   dapat menampilkan perkembangan seluruh tim dalam satu tampilan beserta grafik dan
   penanda kegiatan yang tertinggal - hal yang tidak mungkin dilakukan pada sistem
   berjalan karena progres FASIH dan Non-FASIH berada di tempat berbeda.
4. **Administrasi Dokumen.** Ketua Tim mengisi tautan dokumen setiap tahap, dan
   dokumen yang menjadi tanggung jawab Tim Keuangan diisi Tim Keuangan sendiri.
   Seluruh tautan terkumpul per kegiatan dan per tahap, bukan tersebar di folder
   masing-masing. Untuk dokumen yang masih kosong, Tim Keuangan dapat mengirim
   pengingat yang muncul sebagai notifikasi bagi Ketua Tim, menggantikan penagihan
   lewat pesan pribadi.
5. **Verifikasi dan Pemeliharaan Surat.** Tim Keuangan memeriksa dokumen dan
   menyetujuinya, per dokumen atau sekaligus satu tahap. Dokumen yang tidak valid
   ditolak dengan catatan; Ketua Tim menerima notifikasi, memperbaiki tautannya, dan
   dokumen kembali menunggu pemeriksaan. Bila honor atau muatan berubah setelah SPK
   terbit, sistem memberi notifikasi kepada Tim Keuangan untuk memperbarui isi surat
   dengan nomor yang sama atau membatalkannya - perubahan semacam ini pada cara lama
   tidak terdeteksi sama sekali. Setelah pekerjaan selesai, Tim Keuangan membuat BAST
   yang nomornya mengikuti nomor SPK.
6. **Evaluasi.** PML menilai kinerja mitra yang diawasinya pada tiga aspek, dan hanya
   mitra yang diawasinya sendiri yang dapat dinilai. Sistem menghitung rata-rata nilai
   dan menyusun peringkat mitra per triwulan secara otomatis, tanpa perlu menggabungkan
   dua berkas seperti pada cara lama. Peringkat itu dapat dilihat dan diunduh seluruh
   pegawai, termasuk pegawai yang ditugasi merekap penilaian, sebagai bahan evaluasi
   dan apresiasi mitra serta pertimbangan alokasi berikutnya. Status kegiatan berubah
   menjadi "Selesai" setelah tanggal selesai tahap Diseminasi & Evaluasi terlewati.

**Gambar untuk subbab ini:**

- Activity Diagram Alur Proses Bisnis Sistem Usulan pada SIKAMI (`02`) -
  satu-satunya gambar di 4.2.1. Diagram ini menggambarkan garis besar satu siklus
  kegiatan; percabangan dan aturan rincinya (validasi SBML, verifikasi dokumen,
  penomoran surat, hak akses penilaian, dan seterusnya) tidak digambar di sini agar
  diagramnya tetap ringkas.

> **Catatan penempatan:** Diagram `03` s.d. `11` (rincian tiap proses pada narasi
> poin 1-6 di atas) **tidak diulang di 4.2.1**. Ketujuhnya sudah dipindahkan ke
> subbab tersendiri, 4.2.3 Activity Diagram (lihat `draf-bab4-activity-diagram.md`),
> lengkap dengan narasinya masing-masing. Bila pembimbing lebih menyukai gaya lama
> (satu diagram rinci menyertai setiap poin narasi di 4.2.1), pindahkan isi 4.2.3 ke
> sini dan hapus subbab itu - jangan menaruhnya di kedua tempat.

---

## 4.2.2 Use Case Diagram — teks pengantar dan tabel

Hak akses pada sistem dibedakan berdasarkan tiga peran akun, yaitu Admin, Tim
Keuangan (peran _supervisor_), dan Pegawai. Pegawai kemudian dapat berperan
sebagai Ketua Tim/Pembuat Kegiatan atau PML bergantung pada keterkaitannya
dengan suatu kegiatan. Karena itu, aktor Ketua Tim, PML, dan Tim Keuangan
digambarkan sebagai spesialisasi dari aktor Pegawai, dan setiap aktor mewarisi
seluruh use case aktor Pegawai.

### Tabel Definisi Aktor

| Aktor                        | Deskripsi                                                                                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pegawai                      | Setiap pengguna yang telah _login_. Dapat melihat _dashboard_ monitoring, membuat kegiatan, melihat dan mengekspor daftar mitra, melihat rekap honor dan penilaian, notifikasi, riwayat kegiatan, serta mengganti kata sandinya.                  |
| Ketua Tim / Pembuat Kegiatan | Pegawai yang menjadi ketua tim suatu kegiatan atau yang membuatnya. Berhak menyunting kegiatan beserta alokasi mitra dan mengelola dokumen kegiatannya.                                                                                           |
| PML                          | Pegawai yang ditugaskan sebagai pengawas mitra pada suatu alokasi. Berhak menginput progres dan menilai kinerja mitra yang diawasinya.                                                                                                            |
| Tim Keuangan                 | Pengguna berperan _supervisor_. Mengatur batas honor bulanan (SBML), memverifikasi dokumen, mengirim pengingat, mengatur penanggung jawab dokumen, mengelola template surat, membuat SPK dan BAST, serta memelihara surat pada Riwayat Penyuratan. |
| Admin                        | Pengguna dengan hak akses tertinggi. Mengelola data master (pengguna, ketua tim, mitra), mengimpor dan menonaktifkan mitra, mengarsipkan/menghapus kegiatan, dan dapat menjalankan seluruh use case aktor lain.                                   |

### Tabel Deskripsi Use Case

| Use Case                                             | Aktor                                   | Deskripsi                                                                                                                                                               |
| ---------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login                                                | Semua aktor                             | Memverifikasi nama pengguna dan kata sandi untuk mengakses sistem sesuai perannya.                                                                                      |
| Melihat Dashboard Monitoring                         | Pegawai                                 | Melihat daftar kegiatan, status tahap, persentase progres, dan grafik capaian, dengan filter dan pencarian.                                                             |
| Membuat Kegiatan & Alokasi Mitra                     | Pegawai                                 | Membuat kegiatan baru beserta jadwal tahap, dokumen wajib, dan alokasi mitra. Mencakup Validasi Batas Honor (SBML).                                                      |
| Mengurungkan Pembuatan Kegiatan                      | Pegawai (_extend_)                      | Perluasan pembuatan kegiatan: pembuat membatalkan kegiatan yang baru disimpan melalui tombol pada jendela konfirmasi yang tampil sesaat (±6 detik) setelah penyimpanan. |
| Melihat & Mengekspor Daftar Mitra                    | Pegawai                                 | Melihat daftar mitra beserta status dan jumlah kegiatannya, menyaringnya menurut kecamatan dan desa, serta mengekspor daftar yang sedang tersaring ke Excel.            |
| Menyunting Kegiatan & Alokasi Mitra                  | Ketua Tim / Pembuat Kegiatan            | Mengubah data kegiatan dan alokasi mitranya. Mencakup Validasi Batas Honor (SBML). Simpanan ditolak bila kegiatan telah diubah orang lain sejak halaman dibuka.          |
| Validasi Batas Honor (SBML)                           | Sistem (_include_)                      | Menjumlahkan honor mitra per bulan lintas kegiatan dan membandingkannya dengan batas SBML.                                                                               |
| Konfirmasi Melebihi Batas SBML                        | Ketua Tim / Pembuat Kegiatan (_extend_) | Dijalankan hanya bila batas terlampaui: pengguna memilih merevisi alokasi atau tetap menyimpan.                                                                         |
| Mengelola Dokumen Kegiatan                           | Ketua Tim / Pembuat Kegiatan            | Mengisi, mengubah, dan menambah tautan dokumen setiap tahap, termasuk memperbaiki dokumen yang ditolak.                                                                 |
| Menginput Progres Mitra                              | PML                                     | Mencatat jumlah dokumen per status pekerjaan mitra yang diawasinya.                                                                                                     |
| Menilai Kinerja Mitra                                | PML                                     | Memberi nilai tiga aspek (1–10) kepada mitra yang diawasinya.                                                                                                           |
| Melihat Rekap & Peringkat Penilaian                  | Pegawai                                 | Melihat peringkat mitra per triwulan berdasarkan nilai akhir dan mengunduhnya ke PDF atau Excel sebagai bahan evaluasi dan apresiasi mitra.                             |
| Melihat Rekap Honor Mitra                            | Pegawai                                 | Melihat total honor setiap mitra per bulan/rentang dan penanda yang melebihi batas SBML.                                                                                 |
| Melihat Notifikasi                                   | Pegawai                                 | Melihat notifikasi tenggat, progres mandek, penolakan, persetujuan, pengingat, dan surat berubah sesuai perannya.                                                       |
| Melihat Riwayat Kegiatan                             | Pegawai                                 | Melihat urutan aksi yang pernah dilakukan pada suatu kegiatan beserta pelaku dan waktunya.                                                                              |
| Mengganti Kata Sandi                                 | Pegawai                                 | Melihat identitas akun dan mengganti kata sandi sendiri; mengganti kata sandi mencabut sesi lama.                                                                       |
| Mengatur Batas Honor Bulanan (SBML)                   | Tim Keuangan                            | Menetapkan nilai batas honor maksimal seorang mitra per bulan.                                                                                                          |
| Memverifikasi Dokumen                                | Tim Keuangan                            | Memeriksa dan menyetujui dokumen, per dokumen atau sekaligus satu tahap.                                                                                                |
| Menolak Dokumen dengan Catatan                       | Tim Keuangan (_extend_)                 | Perluasan verifikasi: mengembalikan dokumen yang tidak valid kepada Ketua Tim disertai catatan revisi.                                                                  |
| Mengirim Pengingat Dokumen                           | Tim Keuangan                            | Mengirim notifikasi kepada Ketua Tim dan pembuat kegiatan untuk dokumen yang belum diisi.                                                                               |
| Mengatur Penanggung Jawab Dokumen                    | Tim Keuangan                            | Menentukan apakah suatu dokumen diisi oleh Ketua Tim atau oleh Tim Keuangan.                                                                                            |
| Mengelola Template Surat                             | Tim Keuangan                            | Mengatur data PPK, satuan kerja, pola nomor SPK/BAST, dan isi pasal perjanjian.                                                                                         |
| Membuat Surat Perjanjian Kerja (SPK) per Bulan       | Tim Keuangan                            | Membuat SPK mitra untuk satu bulan honor dalam format PDF dengan nomor otomatis; satu surat aktif per mitra per bulan.                                                  |
| Membuat BAST                                         | Tim Keuangan                            | Membuat BAST mitra dalam format PDF; nomornya mengikuti nomor SPK mitra yang sama.                                                                                      |
| Melihat Riwayat Penyuratan                           | Tim Keuangan                            | Melihat seluruh surat dalam satu tahun, termasuk surat batal dan nomor yang kosong.                                                                                     |
| Memperbarui Isi Surat                                | Tim Keuangan                            | Menyegarkan isi surat yang sudah terbit mengikuti data honor dan muatan terkini, dengan nomor yang sama.                                                                |
| Membatalkan / Menghapus Surat                        | Tim Keuangan                            | Menandai surat sebagai batal dengan catatan alasan, dan menghapus permanen surat yang sudah batal.                                                                      |
| Mengubah, Merapikan, atau Mengatur Ulang Nomor Surat | Tim Keuangan                            | Mengganti nomor sebuah surat, merapikan urutan nomor satu tahun dengan pratinjau, atau mengatur ulang nomor satu periode; tindakan dicatat pada riwayat surat.          |
| Mengelola Pengguna                                   | Admin                                   | Menambah, mengubah, dan menghapus akun pegawai beserta perannya.                                                                                                        |
| Mengelola Ketua Tim                                  | Admin                                   | Mengelola data ketua tim, timnya, dan akun pengguna yang ditautkan.                                                                                                     |
| Mengelola Data Mitra                                 | Admin                                   | Mengelola (CRUD) profil induk mitra statistik beserta wilayahnya.                                                                                                       |
| Mengimpor Data Mitra dari SOBAT                      | Admin                                   | Membaca berkas Excel SOBAT, menentukan tindakan per baris, melihat pratinjau, lalu menerapkan impor dalam satu transaksi.                                               |
| Menonaktifkan / Mengaktifkan Mitra                   | Admin                                   | Menandai mitra yang berhenti sebagai nonaktif tanpa menghapus riwayatnya, atau mengaktifkannya kembali.                                                                 |
| Mengarsipkan / Menghapus Kegiatan                    | Admin                                   | Memindahkan kegiatan ke arsip, atau menghapus kegiatan yang belum memiliki alokasi mitra dan penilaian.                                                                 |

---

## 4.2.3 Rancangan Basis Data

### Teks pengantar (pengganti)

Rancangan basis data Sistem Informasi SIKAMI diimplementasikan menggunakan
MySQL sebagaimana dijelaskan pada Bab II, dengan tabel inti `ppl_master`,
`ppl`, `ppl_progress`, dan `ppl_honorarium` yang telah disebutkan sebelumnya.
Basis data terdiri dari **18 tabel** yang dikelompokkan menjadi lima bagian,
yaitu (1) pengguna dan wilayah, (2) kegiatan dan alokasi mitra, (3) honor,
progres, dan penilaian, (4) dokumen dan jejak audit, serta (5) surat dan
pengaturan. Relasi antartabel dijaga dengan _foreign key_ sehingga setiap data
progres, honor, dan penilaian selalu terhubung dengan alokasi mitra dan
kegiatan yang bersangkutan.

### Ringkasan tabel

| No  | Tabel               | Kelompok           | Fungsi                                                             |
| --- | ------------------- | ------------------ | ------------------------------------------------------------------ |
| 1   | users               | Pengguna           | Akun pengguna dan perannya                                         |
| 2   | ketua_tim           | Pengguna           | Data ketua tim dan akun yang ditautkan                             |
| 3   | kecamatan           | Wilayah            | Referensi kecamatan                                                |
| 4   | desa                | Wilayah            | Referensi desa                                                     |
| 5   | ppl_master          | Kegiatan & alokasi | Profil induk mitra statistik beserta status aktifnya               |
| 6   | kegiatan            | Kegiatan & alokasi | Data kegiatan, jadwal tahap, periode honor                         |
| 7   | honorarium_kegiatan | Kegiatan & alokasi | Tarif satuan, uraian tugas, dan kode MAK per jenis pekerjaan       |
| 8   | ppl                 | Kegiatan & alokasi | Alokasi mitra pada satu tahap kegiatan                             |
| 9   | ppl_honorarium      | Honor & progres    | Rincian honor per jenis pekerjaan                                  |
| 10  | ppl_honor_bulan     | Honor & progres    | Pembebanan muatan dan honor per bulan (dasar validasi SBML dan SPK) |
| 11  | ppl_progress        | Honor & progres    | Progres pekerjaan mitra per status                                 |
| 12  | penilaian_mitra     | Honor & progres    | Nilai kinerja mitra                                                |
| 13  | dokumen             | Dokumen & audit    | Tautan dokumen kegiatan dan status verifikasinya                   |
| 14  | riwayat_kegiatan    | Dokumen & audit    | Jejak aksi pengguna per kegiatan                                   |
| 15  | template_surat      | Surat              | Template SPK dan BAST                                              |
| 16  | kontrak_mitra       | Surat              | SPK/BAST per mitra per bulan beserta nomor dan statusnya           |
| 17  | riwayat_surat       | Surat              | Jejak penghapusan dan pengaturan ulang nomor surat                 |
| 18  | system_settings     | Pengaturan         | Pengaturan sistem, termasuk batas honor bulanan                    |

### Rincian struktur tabel

**Tabel users**

| No  | Atribut      | Tipe Data    | Null | Keterangan                                                                     |
| --- | ------------ | ------------ | ---- | ------------------------------------------------------------------------------ |
| 1   | id (PK)      | Varchar(50)  | No   | ID unik pengguna                                                               |
| 2   | username     | Varchar(50)  | No   | Nama pengguna untuk _login_ (unik)                                             |
| 3   | password     | Varchar(255) | No   | Kata sandi ter-_hash_ (bcrypt)                                                 |
| 4   | nama_lengkap | Varchar(255) | No   | Nama lengkap pengguna                                                          |
| 5   | role         | Enum         | No   | 'admin', 'user', 'supervisor' (supervisor = Tim Keuangan)                      |
| 6   | isPML        | Tinyint(1)   | No   | Penanda pengguna dapat ditugaskan sebagai PML                                  |
| 7   | tokenVersi   | Int(10)      | No   | Versi sesi; dinaikkan saat kata sandi diganti sehingga sesi lama tidak berlaku |

**Tabel ketua_tim**

| No  | Atribut      | Tipe Data    | Null | Keterangan                     |
| --- | ------------ | ------------ | ---- | ------------------------------ |
| 1   | id (PK)      | Varchar(50)  | No   | ID unik ketua tim              |
| 2   | user_id (FK) | Varchar(50)  | Yes  | Merujuk ke akun di tabel users |
| 3   | nama_ketua   | Varchar(255) | No   | Nama ketua tim                 |
| 4   | nip          | Varchar(50)  | Yes  | NIP ketua tim                  |
| 5   | tim          | Varchar(100) | Yes  | Nama tim kerja                 |

**Tabel kecamatan**

| No  | Atribut | Tipe Data    | Null | Keterangan                                              |
| --- | ------- | ------------ | ---- | ------------------------------------------------------- |
| 1   | id (PK) | Int(11)      | No   | _Auto increment_                                        |
| 2   | kode    | Char(3)      | Yes  | Tiga digit kode kecamatan BPS, unik dalam satu kabupaten |
| 3   | nama    | Varchar(255) | No   | Nama kecamatan                                          |

**Tabel desa**

| No  | Atribut           | Tipe Data    | Null | Keterangan                                            |
| --- | ----------------- | ------------ | ---- | ----------------------------------------------------- |
| 1   | id (PK)           | Int(11)      | No   | _Auto increment_                                      |
| 2   | kecamatan_id (FK) | Int(11)      | No   | Merujuk ke tabel kecamatan                            |
| 3   | kode              | Char(3)      | Yes  | Tiga digit kode desa BPS, unik dalam satu kecamatan    |
| 4   | nama              | Varchar(255) | No   | Nama desa                                             |

**Tabel ppl_master**

| No  | Atribut           | Tipe Data    | Null | Keterangan                                                                      |
| --- | ----------------- | ------------ | ---- | ------------------------------------------------------------------------------- |
| 1   | id (PK)           | Varchar(50)  | No   | ID unik mitra statistik di aplikasi                                             |
| 2   | sobat_id          | Varchar(50)  | Yes  | ID mitra pada aplikasi SOBAT (unik bila terisi), dipakai mencocokkan saat impor |
| 3   | namaPPL           | Varchar(255) | No   | Nama lengkap mitra                                                              |
| 4   | posisi            | Enum         | No   | 'Pendataan', 'Pengolahan', 'Pendataan/Pengolahan'                               |
| 5   | kecamatan_id (FK) | Int(11)      | Yes  | Merujuk ke tabel kecamatan                                                      |
| 6   | desa_id (FK)      | Int(11)      | Yes  | Merujuk ke tabel desa                                                           |
| 7   | alamat            | Text         | Yes  | Alamat lengkap mitra                                                            |
| 8   | noTelepon         | Varchar(20)  | Yes  | Nomor telepon aktif                                                             |
| 9   | aktif             | Tinyint(1)   | No   | 1 = aktif; mitra yang berhenti dinonaktifkan, tidak dihapus                     |
| 10  | nonaktifSejak     | Date         | Yes  | Tanggal mitra dinonaktifkan                                                     |

**Tabel kegiatan**

| No  | Atribut                                   | Tipe Data               | Null | Keterangan                                                                                                               |
| --- | ----------------------------------------- | ----------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | id (PK)                                   | Int(11)                 | No   | _Auto increment_                                                                                                         |
| 2   | namaKegiatan                              | Varchar(255)            | No   | Nama kegiatan                                                                                                            |
| 3   | ketua_tim_id (FK)                         | Varchar(50)             | Yes  | Merujuk ke tabel ketua_tim                                                                                               |
| 4   | createdBy_userId (FK)                     | Varchar(50)             | Yes  | Merujuk ke pembuat kegiatan (users)                                                                                      |
| 5   | deskripsiKegiatan                         | Text                    | Yes  | Deskripsi kegiatan                                                                                                       |
| 6   | tipe_kegiatan                             | Enum                    | No   | 'survei', 'sensus'                                                                                                       |
| 7   | isFasih                                   | Tinyint(1)              | Yes  | Penanda kegiatan yang dipantau melalui FASIH                                                                             |
| 8   | adaListing                                | Tinyint(1)              | No   | Penanda kegiatan memiliki tahap _listing_                                                                                |
| 9   | adaPengolahan                             | Tinyint(1)              | No   | Penanda tahap Pengolahan & Analisis digunakan                                                                            |
| 10  | adaDiseminasi                             | Tinyint(1)              | No   | Penanda tahap Diseminasi & Evaluasi digunakan                                                                            |
| 11  | tanggalMulai…                             | Date                    | Yes  | 4 kolom tanggal mulai: Persiapan, Pengumpulan Data, Pengolahan & Analisis, Diseminasi & Evaluasi                         |
| 12  | tanggalSelesai…                           | Date                    | Yes  | 4 kolom tanggal selesai tahap di atas                                                                                    |
| 13  | progress…                                 | Tinyint(3)              | Yes  | 9 kolom persentase progres: keseluruhan serta _submit_/_approved_ untuk _listing_, pencacahan, pendataan, dan pengolahan |
| 14  | status                                    | Enum                    | Yes  | 'Persiapan', 'Pengumpulan Data', 'Pengolahan & Analisis', 'Diseminasi & Evaluasi', 'Selesai'                             |
| 15  | bulanHonor…                               | Varchar(7)              | Yes  | 3 kolom bulan honor bawaan (format MM-YYYY): _listing_, pencacahan, pengolahan                                           |
| 16  | tanggalMulaiHonor… / tanggalSelesaiHonor… | Date                    | Yes  | 6 kolom rentang periode honor per jenis pekerjaan                                                                        |
| 17  | isArsip                                   | Tinyint(1)              | No   | Penanda kegiatan diarsipkan                                                                                              |
| 18  | arsipAt / arsipBy                         | Datetime / Varchar(50)  | Yes  | Waktu dan pelaku pengarsipan                                                                                             |
| 19  | lastUpdated / lastUpdatedBy               | Timestamp / Varchar(50) | Yes  | Waktu dan pelaku pembaruan progres terakhir                                                                              |
| 20  | lastEdited / lastEditedBy                 | Datetime / Varchar(255) | Yes  | Waktu dan pelaku penyuntingan terakhir                                                                                   |
| 21  | versi                                     | Int(10)                 | No   | Nomor versi; naik setiap kali disimpan, untuk menolak simpanan berdasarkan data lama                                     |

**Tabel honorarium_kegiatan**

| No  | Atribut            | Tipe Data    | Null | Keterangan                                 |
| --- | ------------------ | ------------ | ---- | ------------------------------------------ |
| 1   | id (PK)            | Int(11)      | No   | _Auto increment_                           |
| 2   | kegiatanId (FK)    | Int(11)      | No   | Merujuk ke tabel kegiatan                  |
| 3   | jenis_pekerjaan    | Enum         | No   | 'listing', 'pencacahan', 'pengolahan'      |
| 4   | satuan_beban_kerja | Varchar(255) | Yes  | Satuan beban (dokumen, BS, dan sebagainya) |
| 5   | harga_satuan       | Varchar(255) | Yes  | Harga per satuan beban                     |
| 6   | uraian_tugas       | Varchar(255) | Yes  | Uraian tugas yang dicantumkan pada SPK     |
| 7   | kode_anggaran      | Varchar(100) | Yes  | Kode beban anggaran (MAK) pada SPK         |

**Tabel ppl (Alokasi Mitra)**

| No  | Atribut                | Tipe Data   | Null | Keterangan                                           |
| --- | ---------------------- | ----------- | ---- | ---------------------------------------------------- |
| 1   | id (PK)                | Int(11)     | No   | _Auto increment_                                     |
| 2   | kegiatanId (FK)        | Int(11)     | No   | Merujuk ke tabel kegiatan                            |
| 3   | tahap                  | Enum        | No   | 'listing', 'pencacahan', 'pengolahan-analisis'       |
| 4   | ppl_master_id (FK)     | Varchar(50) | Yes  | Merujuk ke tabel ppl_master                          |
| 5   | pml_id                 | Varchar(50) | Yes  | ID pengguna (users) yang menjadi PML mitra ini       |
| 6   | bebanKerja             | Int(11)     | Yes  | Volume tugas yang diberikan                          |
| 7   | besaranHonor           | Int(11)     | Yes  | Total honor alokasi ini                              |
| 8   | metodePembebanan       | Enum        | No   | 'bulan_tertentu', 'prorata', 'luber'                 |
| 9   | bulanPembebananDipilih | Varchar(7)  | Yes  | Bulan yang dipilih untuk metode satu bulan (MM-YYYY) |

**Tabel ppl_honorarium**

| No  | Atribut          | Tipe Data   | Null | Keterangan                                               |
| --- | ---------------- | ----------- | ---- | -------------------------------------------------------- |
| 1   | id (PK)          | Int(11)     | No   | _Auto increment_                                         |
| 2   | ppl_id (FK)      | Int(11)     | No   | Merujuk ke tabel ppl                                     |
| 3   | jenis_pekerjaan  | Enum        | No   | 'listing', 'pencacahan', 'pengolahan' (unik per alokasi) |
| 4   | bebanKerja       | Int(11)     | Yes  | Volume beban aktual                                      |
| 5   | satuanBebanKerja | Varchar(50) | Yes  | Satuan beban                                             |
| 6   | hargaSatuan      | Int(11)     | Yes  | Harga per satuan beban                                   |
| 7   | besaranHonor     | Int(11)     | Yes  | Beban kerja × harga satuan                               |

**Tabel ppl_honor_bulan**

| No  | Atribut     | Tipe Data  | Null | Keterangan                                             |
| --- | ----------- | ---------- | ---- | ------------------------------------------------------ |
| 1   | id (PK)     | Int(11)    | No   | _Auto increment_                                       |
| 2   | ppl_id (FK) | Int(11)    | No   | Merujuk ke tabel ppl                                   |
| 3   | bulan       | Varchar(7) | No   | Bulan pembebanan (MM-YYYY); unik per alokasi           |
| 4   | volume      | Int(11)    | No   | Unit beban kerja (muatan) yang jatuh di bulan tersebut |
| 5   | jumlah      | Int(11)    | No   | Honor bulan tersebut (volume × harga satuan)           |

**Tabel ppl_progress**

| No  | Atribut       | Tipe Data | Null | Keterangan                                                                                                      |
| --- | ------------- | --------- | ---- | --------------------------------------------------------------------------------------------------------------- |
| 1   | id (PK)       | Int(11)   | No   | _Auto increment_                                                                                                |
| 2   | ppl_id (FK)   | Int(11)   | No   | Merujuk ke tabel ppl                                                                                            |
| 3   | progress_type | Enum      | No   | 'open', 'submit', 'diperiksa', 'approved', 'belum_entry', 'sudah_entry', 'validasi', 'clean' (unik per alokasi) |
| 4   | value         | Int(11)   | No   | Jumlah dokumen pada status tersebut                                                                             |

**Tabel penilaian_mitra**

| No  | Atribut             | Tipe Data    | Null | Keterangan                                                                                   |
| --- | ------------------- | ------------ | ---- | -------------------------------------------------------------------------------------------- |
| 1   | id (PK)             | Int(11)      | No   | _Auto increment_                                                                             |
| 2   | pplId (FK)          | Int(11)      | Yes  | Merujuk ke tabel ppl (menjadi NULL bila alokasinya terhapus, sehingga nilai tetap tersimpan) |
| 3   | kegiatanId (FK)     | Int(11)      | No   | Merujuk ke tabel kegiatan                                                                    |
| 4   | pmlId               | Varchar(50)  | Yes  | ID PML mitra tersebut                                                                        |
| 5   | sikap_perilaku      | Int(2)       | Yes  | Nilai aspek 1 (1–10)                                                                         |
| 6   | kualitas_pekerjaan  | Int(2)       | Yes  | Nilai aspek 2 (1–10)                                                                         |
| 7   | ketepatan_waktu     | Int(2)       | Yes  | Nilai aspek 3 (1–10)                                                                         |
| 8   | rata_rata           | Decimal(4,2) | Yes  | Rata-rata tiga aspek                                                                         |
| 9   | dinilai_oleh_userId | Varchar(50)  | Yes  | ID pengguna yang menilai                                                                     |
| 10  | tanggal_penilaian   | Timestamp    | Yes  | Waktu penilaian terakhir                                                                     |

**Tabel dokumen**

| No  | Atribut                           | Tipe Data               | Null | Keterangan                                                                           |
| --- | --------------------------------- | ----------------------- | ---- | ------------------------------------------------------------------------------------ |
| 1   | id (PK)                           | Int(11)                 | No   | _Auto increment_                                                                     |
| 2   | kegiatanId (FK)                   | Int(11)                 | No   | Merujuk ke tabel kegiatan                                                            |
| 3   | nama                              | Varchar(255)            | No   | Nama dokumen                                                                         |
| 4   | tipe                              | Enum                    | No   | Tahap: 'persiapan', 'pengumpulan-data', 'pengolahan-analisis', 'diseminasi-evaluasi' |
| 5   | jenis                             | Enum                    | No   | 'file', 'link', 'catatan'                                                            |
| 6   | link                              | Varchar(512)            | Yes  | Tautan penyimpanan dokumen                                                           |
| 7   | isWajib                           | Tinyint(1)              | No   | Penanda dokumen wajib                                                                |
| 8   | penanggungJawab                   | Enum                    | No   | 'ketua_tim', 'keuangan'                                                              |
| 9   | penanggungJawabDiubahOleh / …Pada | Varchar(50) / Datetime  | Yes  | Pelaku dan waktu perubahan penanggung jawab                                          |
| 10  | status                            | Enum                    | No   | 'Pending', 'Reviewed', 'Approved', 'Rejected'                                        |
| 11  | rejectionNote                     | Text                    | Yes  | Catatan revisi saat ditolak                                                          |
| 12  | rejectedAt / rejectedBy           | Datetime / Varchar(50)  | Yes  | Waktu dan pelaku penolakan                                                           |
| 13  | resubmittedAt                     | Datetime                | Yes  | Waktu dokumen diperbaiki setelah ditolak                                             |
| 14  | lastApproved / lastApprovedBy     | Datetime / Varchar(255) | Yes  | Waktu dan pelaku persetujuan                                                         |
| 15  | pengingatDikirimPada / …Oleh      | Datetime / Varchar(50)  | Yes  | Waktu dan pengirim pengingat dokumen kosong                                          |
| 16  | diunggahOleh_userId               | Varchar(50)             | Yes  | Pengguna yang pertama kali mengisi                                                   |
| 17  | lastEditedBy_userId               | Varchar(50)             | Yes  | Pengguna yang terakhir mengubah                                                      |
| 18  | uploadedAt / updatedAt            | Timestamp               | Yes  | Waktu diisi dan waktu diperbarui                                                     |

**Tabel riwayat_kegiatan**

| No  | Atribut         | Tipe Data    | Null | Keterangan                                                     |
| --- | --------------- | ------------ | ---- | -------------------------------------------------------------- |
| 1   | id (PK)         | Bigint       | No   | _Auto increment_                                               |
| 2   | kegiatanId (FK) | Int(11)      | No   | Merujuk ke tabel kegiatan                                      |
| 3   | aksi            | Varchar(40)  | No   | Jenis aksi, mis. dokumen_disetujui                             |
| 4   | entitas         | Enum         | No   | 'kegiatan', 'dokumen', 'ppl', 'progress', 'honor', 'penilaian' |
| 5   | entitasId       | Int(11)      | Yes  | ID data yang dikenai aksi                                      |
| 6   | jumlah          | Smallint     | No   | Banyaknya data pada aksi massal                                |
| 7   | aktorUserId     | Varchar(50)  | Yes  | ID pengguna pelaku                                             |
| 8   | aktorNama       | Varchar(255) | Yes  | Nama pelaku (salinan)                                          |
| 9   | ringkasan       | Varchar(255) | Yes  | Ringkasan aksi                                                 |
| 10  | terjadiPada     | Datetime     | No   | Waktu kejadian                                                 |

**Tabel template_surat**

| No  | Atribut                          | Tipe Data               | Null | Keterangan                                                |
| --- | -------------------------------- | ----------------------- | ---- | --------------------------------------------------------- |
| 1   | id (PK)                          | Int(11)                 | No   | _Auto increment_                                          |
| 2   | nama_template                    | Varchar(255)            | No   | Nama template                                             |
| 3   | format_nomor                     | Varchar(255)            | No   | Pola nomor SPK, mis. {nomor}/SPK/{BULAN}/{ROMAWI}/{tahun} |
| 4   | format_nomor_bast                | Varchar(255)            | No   | Pola nomor BAST                                           |
| 5   | ppk_nama / ppk_nip / ppk_jabatan | Varchar                 | No   | Data Pejabat Pembuat Komitmen                             |
| 6   | satker_nama                      | Varchar(255)            | No   | Nama satuan kerja                                         |
| 7   | satker_alamat                    | Text                    | Yes  | Alamat satuan kerja                                       |
| 8   | kota                             | Varchar(100)            | Yes  | Kota penandatanganan                                      |
| 9   | pengadilan_negeri                | Varchar(255)            | Yes  | Pengadilan tempat penyelesaian sengketa                   |
| 10  | isi_pasal                        | Longtext                | Yes  | Daftar pasal perjanjian (JSON)                            |
| 11  | is_aktif                         | Tinyint(1)              | No   | Penanda template yang dipakai                             |
| 12  | updatedAt / updatedBy            | Timestamp / Varchar(50) | Yes  | Waktu dan pelaku perubahan terakhir                       |

**Tabel kontrak_mitra**

| No  | Atribut                           | Tipe Data               | Null | Keterangan                                                                                     |
| --- | --------------------------------- | ----------------------- | ---- | ---------------------------------------------------------------------------------------------- |
| 1   | id (PK)                           | Int(11)                 | No   | _Auto increment_                                                                               |
| 2   | ppl_master_id (FK)                | Varchar(50)             | No   | Merujuk ke tabel ppl_master                                                                    |
| 3   | periode_mulai / periode_selesai   | Date                    | No   | Satu bulan kalender penuh (satu surat per mitra per bulan)                                     |
| 4   | nomor_urut                        | Int(11)                 | No   | Nomor urut surat dalam satu tahun                                                              |
| 5   | nomor_surat                       | Varchar(255)            | No   | Nomor SPK lengkap                                                                              |
| 6   | tanggal_surat                     | Date                    | No   | Tanggal SPK                                                                                    |
| 7   | nomor_bast / tanggal_bast         | Varchar(255) / Date     | Yes  | Nomor dan tanggal BAST                                                                         |
| 8   | status                            | Enum                    | No   | 'aktif', 'batal'                                                                               |
| 9   | catatan                           | Text                    | Yes  | Catatan surat; wajib diisi alasan saat dibatalkan                                              |
| 10  | dibatalkanPada / dibatalkanOleh   | Datetime / Varchar(50)  | Yes  | Waktu dan pelaku pembatalan                                                                    |
| 11  | total_honor                       | Bigint                  | No   | Total honor mitra pada bulan tersebut                                                          |
| 12  | isi_terbit                        | Longtext                | Yes  | Salinan isi surat (JSON) saat terbit atau diperbarui, pembanding notifikasi surat berubah      |
| 13  | total_volume / jumlah_baris       | Int(11)                 | Yes  | Total muatan dan banyaknya baris rincian pada salinan isi                                      |
| 14  | diperbaruiPada / diperbaruiOleh   | Datetime / Varchar(50)  | Yes  | Waktu dan pelaku pembaruan isi surat                                                           |
| 15  | template_id (FK)                  | Int(11)                 | Yes  | Merujuk ke tabel template_surat                                                                |
| 16  | generatedAt / generatedBy         | Timestamp / Varchar(50) | Yes  | Waktu dan pembuat SPK                                                                          |
| 17  | bastGeneratedAt / bastGeneratedBy | Timestamp / Varchar(50) | Yes  | Waktu dan pembuat BAST                                                                         |
| 18  | kunci_aktif                       | Varchar(120)            | Yes  | Kolom turunan unik: menjamin satu surat aktif per mitra per periode (NULL bila batal)          |
| 19  | kunci_nomor                       | Varchar(24)             | Yes  | Kolom turunan unik: menjamin nomor surat aktif tidak kembar dalam satu tahun (NULL bila batal) |

**Tabel riwayat_surat**

| No  | Atribut                         | Tipe Data   | Null | Keterangan                              |
| --- | ------------------------------- | ----------- | ---- | --------------------------------------- |
| 1   | id (PK)                         | Bigint      | No   | _Auto increment_                        |
| 2   | aksi                            | Varchar(50) | No   | Jenis aksi, mis. atur_ulang_nomor       |
| 3   | periode_mulai / periode_selesai | Date        | No   | Periode surat yang terdampak            |
| 4   | jumlah / jumlah_bast            | Int(11)     | No   | Banyaknya nomor SPK/BAST yang terdampak |
| 5   | nomor_surat / nomor_bast        | Text        | Yes  | Daftar nomor yang terdampak             |
| 6   | aktorNama                       | Varchar(50) | Yes  | Pelaku                                  |
| 7   | terjadiPada                     | Timestamp   | No   | Waktu kejadian                          |

**Tabel system_settings**

| No  | Atribut       | Tipe Data    | Null | Keterangan                                 |
| --- | ------------- | ------------ | ---- | ------------------------------------------ |
| 1   | id (PK)       | Int(11)      | No   | _Auto increment_                           |
| 2   | setting_key   | Varchar(255) | No   | Kunci pengaturan (unik), mis. HONOR_LIMIT  |
| 3   | setting_value | Varchar(255) | No   | Nilai pengaturan, mis. batas honor bulanan |
| 4   | description   | Text         | Yes  | Keterangan pengaturan                      |

### Teks pengantar ERD

Hubungan antartabel digambarkan dalam _Entity Relationship Diagram_ (ERD)
dengan notasi _crow's foot_. Agar tetap terbaca, ERD dibagi menjadi empat
bagian: (1) kegiatan dan alokasi mitra, (2) honor, progres, dan penilaian,
(3) dokumen dan riwayat kegiatan, serta (4) surat dan pengaturan. Garis
putus-putus menunjukkan relasi logis yang tidak dikunci dengan _foreign key_
di basis data, misalnya PML pada tabel `ppl` yang merujuk ke tabel `users`.
