# Saran dan Draf Revisi Bab I, II, III, serta Rencana Bab V

> Berkas ini terpisah dari `draf-revisi-bab4.md`. Isinya saran perbaikan dan
> teks pengganti yang bisa langsung disalin (Ctrl+Shift+V untuk pratinjau).
>
> Teks bertanda **[konfirmasi]** adalah hal yang tidak bisa saya pastikan dari
> kode. Anda yang tahu kondisi sebenarnya di BPS Kabupaten Bengkulu Selatan.
> Teks dalam **[kurung siku]** harus diisi sendiri.

---

## 0. Prinsip revisi (menjawab catatan seminar proposal)

Catatan penguji: terlalu banyak kata asing, penjelasan terlalu luas, tidak
langsung ke inti. Tiga aturan untuk seluruh bab:

1. **Tulis masalah sebagai kejadian yang bisa dibuktikan.** Hindari kata sifat
   umum seperti "belum optimal", "tinggi", "kurang", "kompleks".
   - Terlalu luas: "beban kerja administratif tinggi".
   - Langsung ke inti: "Ketua Tim dan Tim Keuangan mengerjakan ulang rekap
     honor, pengecekan batas SBM, dan pencocokan data secara manual setiap
     bulan."
2. **Satu masalah → satu tujuan → satu fitur → satu cara uji.** Setiap masalah
   di Bab I harus punya pasangannya di Bab II (teori), Bab III (tahap), Bab IV
   (kebutuhan fungsional), dan Bab V (pengujian). Lihat matriks di bagian 1.
3. **Pakai padanan bahasa Indonesia.** Istilah asing hanya untuk istilah teknis
   baku, dicetak miring, dan dijelaskan saat pertama muncul. Daftar padanan ada
   di bagian 7.

---

## 1. Benang merah seluruh bab (matriks keterlacakan)

Matriks ini adalah pusat revisi. Setiap baris harus bisa ditelusuri dari kiri ke
kanan. Bila ada masalah tanpa pengujian, atau fitur tanpa masalah, salah satunya
perlu ditambah atau dihapus.

Masalah di Bab I dikelompokkan menjadi **dua pokok masalah** agar sejalan dengan
dua tujuan khusus yang membangun sistem. Akar keduanya sama: belum ada basis data
terpusat yang menghubungkan kegiatan, honor, dokumen, dan penilaian mitra.

**Pokok Masalah 1 (M1) — Administrasi kontrak dan honor mitra masih dikerjakan
manual dan tidak terhubung.**

| Kode | Rincian masalah (Bab I) | Tujuan / fitur | Landasan teori (Bab II) | Kebutuhan (Bab IV) | Pengujian (Bab V) |
|---|---|---|---|---|---|
| M1.a | SPK dan BAST diketik dan dinomori satu per satu | Membuat SPK dan BAST otomatis dengan nomor surat yang tidak ganda | Tata kelola administrasi pemerintahan (SPBE), sistem informasi terintegrasi | KF-11, KF-12 | _Black box_: surat terbit, cetak ulang memakai nomor sama, nomor tidak ganda; efisiensi waktu |
| M1.b | Batas honor SBML dicek manual di spreadsheet dan tidak mencegah kelebihan; honor lintas bulan dibagi manual | Peringatan otomatis batas SBML, pembagian honor per bulan menurut muatan, rekap honor yang dapat diunduh | Standar Biaya Masukan (regulasi), pengendalian internal | KF-05, KF-06, KF-13 | _Black box_ dengan _Boundary Value Analysis_ pada batas SBML; efisiensi waktu |
| M1.c | Spreadsheet isian mitra tidak terhubung dengan kontrak dan honor, tautan dokumen tidak terkumpul per kegiatan, dan mitra di sekitar wilayah tugas dicari satu per satu | Basis data terpusat, penyimpanan tautan dokumen per kegiatan dengan alur verifikasi, pemilihan mitra yang dapat disaring menurut kecamatan dan desa | Basis data relasional (ERD), pengarsipan digital | KF-02 s.d. KF-05, KF-08, KF-09 | _Black box_: penyaringan wilayah, kelengkapan dokumen; efisiensi waktu |

**Pokok Masalah 2 (M2) — Pemantauan progres dan penilaian kinerja mitra belum
terpusat.**

| Kode | Rincian masalah (Bab I) | Tujuan / fitur | Landasan teori (Bab II) | Kebutuhan (Bab IV) | Pengujian (Bab V) |
|---|---|---|---|---|---|
| M2.a | Progres kegiatan FASIH dan Non-FASIH setiap tim tersimpan di tempat berbeda, sehingga Kepala BPS tidak dapat memantau seluruh tim dalam satu tampilan | Dasbor pemantauan seluruh kegiatan beserta grafik | Pemantauan dan evaluasi, dasbor eksekutif | KF-07, KF-13 | _Black box_; _Performance Testing_ (Lighthouse) pada dasbor; CSUQ aspek kualitas informasi |
| M2.b | Tidak ada pengingat otomatis untuk tenggat tahap kegiatan maupun dokumen yang belum lengkap | Notifikasi otomatis tenggat, dokumen ditolak, dan progres yang tidak diperbarui | Sistem informasi manajemen | KF-10 | _Black box_: notifikasi muncul dan hilang sesuai kondisinya |
| M2.c | Penilaian mitra dapat diubah siapa pun yang memiliki akses, peringkat triwulan dihitung manual, dan beban mitra, PML, maupun tim tidak terlihat | Penilaian hanya oleh PML mitra tersebut, pemeringkatan otomatis per triwulan, tampilan beban kerja | Manajemen kinerja; prinsip hak akses terendah (_least privilege_) | KF-13, KF-14, KF-15 | _Security Testing_ (eskalasi hak akses horizontal); _black box_ nilai 1–10; efisiensi waktu |

Pengujian CSUQ mengukur keseluruhan sistem, sehingga menjawab tujuan secara umum.

---

## 2. Bab I — Pendahuluan

### 2.1 Masalah yang perlu diperbaiki

| Lokasi | Masalah | Saran |
|---|---|---|
| Latar belakang hlm. 5 | Merujuk "Gambar 1.2", padahal penomoran buku "Gambar 2" | Samakan dengan penomoran otomatis |
| 1.2.1 butir 1 | "ketiadaan data yang tersaji secara sangat menghambat" — ada kata yang hilang | Perbaiki kalimat, mis. "data yang tidak tersaji secara terpadu sangat menghambat" |
| 1.2.1 | Dua kelompok masalah ditulis sebagai paragraf panjang yang luas, tanpa bukti konkret | **Struktur dua kelompoknya dipertahankan** (sesuai arahan pembimbing), tetapi tiap kelompok diisi tiga rincian yang konkret dan dapat dibuktikan (2.2 di bawah). Yang diperbaiki keluasan kalimatnya, bukan jumlah kelompoknya |
| 1.2.1 butir 1 | Menyebut "sistem merit", "_Quality Management_ GSBPM", "profil mitra terbaik" | Terlalu luas untuk skripsi sistem informasi; cukup sebut penilaian dan peringkat mitra |
| Sistematika Bab I | Menyebut "rumusan masalah", padahal tidak ada subbab rumusan masalah | Tambahkan subbab, atau hapus dari sistematika (cek Pedoman Skripsi KS) |
| Judul vs isi | "Sistem Informasi Tata Kelola Administrasi dan Monitoring Kegiatan Mitra Statistik", "Sistem Informasi Kegiatan Administrasi Mitra Statistik", "OPTIMA", dan aplikasi bernama "Kharisma" | Pilih satu nama sistem dan satu judul, pakai konsisten |
| Latar belakang | Menyebut pemantauan "secara langsung/real-time" | Aman bila maksudnya data tampil begitu PML menyimpan progres. Jangan klaim terhubung langsung dengan FASIH |
| Latar belakang | Menyebut "alokasi ratusan mitra" | Sesuaikan angka dengan data nyata (database saat ini berisi sekitar 128 mitra) |
| 1.2.2 butir 3 | Belum menyebut bahwa progres kegiatan FASIH tetap diinput manual | Tambahkan ke batasan masalah (2.3 di bawah) |

### 2.2 Draf pengganti 1.2.1 Identifikasi Masalah

Berdasarkan hasil wawancara dan observasi pada proses pengelolaan mitra statistik
di BPS Kabupaten Bengkulu Selatan, seluruh pencatatan masih bergantung pada
spreadsheet dan dokumen yang tidak saling terhubung. Keadaan itu menimbulkan dua
pokok masalah berikut.

**1. Administrasi kontrak dan honor mitra masih dikerjakan manual dan tidak
terhubung.**

Pekerjaan administrasi mitra dikerjakan berulang untuk setiap mitra dan setiap
bulan, dengan data yang harus dipindahkan antar-berkas. Tiga hal berikut menjadi
buktinya.

a. **Surat perjanjian kerja disusun satu per satu.** SPK dan BAST untuk setiap
   mitra diketik dan dinomori satu per satu setiap bulan, sehingga penyusunannya
   memakan waktu dan nomor surat rawan ganda atau terlewat.
b. **Kelebihan honor tidak tercegah otomatis.** Tim Keuangan memeriksa batas
   Standar Biaya Masukan Lainnya (SBML) menggunakan spreadsheet pengecekan.
   Spreadsheet tersebut tidak memberi peringatan saat seorang mitra dialokasikan
   melebihi batas, sehingga kelebihan honor baru diketahui bila data dicocokkan
   satu per satu. Honor yang periodenya melintasi dua bulan juga harus dibagi
   secara manual.
c. **Data mitra dan dokumen kontrak tidak saling terhubung.** Nama mitra diisikan
   ke satu spreadsheet dari Tim Keuangan, tetapi spreadsheet itu tidak terhubung
   dengan kontrak dan honor, sehingga datanya harus dipindahkan dan dicocokkan
   satu per satu. Tautan dokumen SK, Surat Tugas, dan BAST juga tidak terkumpul
   per kegiatan, sehingga kelengkapannya sulit diperiksa saat pencairan honor.
   Saat memilih mitra, Ketua Tim harus menelusuri daftar mitra satu per satu
   untuk menemukan mitra yang tinggal di sekitar wilayah tugas.

**2. Pemantauan progres dan penilaian kinerja mitra belum terpusat.**

Perkembangan pekerjaan mitra dan hasil penilaiannya tersebar di beberapa tempat
sehingga tidak dapat dilihat sekaligus. Tiga hal berikut menjadi buktinya.

a. **Progres kegiatan tidak terlihat dalam satu tampilan.** Progres kegiatan
   FASIH dipantau melalui aplikasi FASIH, sedangkan progres kegiatan Non-FASIH
   dicatat PML pada spreadsheet progres yang dipantau Ketua Tim. Karena progres
   setiap tim tersimpan di tempat berbeda, Kepala BPS tidak dapat memantau
   progres seluruh tim dalam satu tampilan, sehingga kegiatan yang tertinggal
   atau belum berprogres terlambat diketahui.
b. **Tidak ada pengingat otomatis.** Belum ada pengingat untuk tenggat setiap
   tahap kegiatan maupun dokumen yang belum lengkap, sehingga keterlambatan baru
   disadari setelah tenggatnya dekat atau terlewat.
c. **Penilaian tidak terlindungi dan beban kerja tidak terlihat.** Nilai kinerja
   mitra dicatat di spreadsheet yang dapat diubah oleh siapa pun yang memiliki
   akses ke berkasnya, termasuk nilai mitra yang bukan diawasinya, dan peringkat
   mitra setiap triwulan dihitung manual. Selain itu, sulit mengetahui mitra,
   PML, atau tim mana yang sedang menanggung kegiatan paling banyak pada suatu
   bulan.

### 2.3 Draf pengganti 1.2.2 Batasan Masalah

1. Sistem mencakup alur pengelolaan mitra dari penginputan kegiatan, alokasi
   mitra, pembagian honor, pemantauan progres, pengelolaan dokumen, pembuatan
   SPK dan BAST, hingga penilaian mitra. Perekrutan dan seleksi mitra tidak
   termasuk karena ditangani aplikasi SOBAT; daftar mitra hanya diimpor dari
   berkas Excel SOBAT.
2. Studi kasus, pengumpulan kebutuhan, dan pengujian dilakukan di BPS Kabupaten
   Bengkulu Selatan.
3. Sistem belum terhubung melalui API dengan FASIH maupun SOBAT. Progres
   kegiatan, termasuk kegiatan FASIH, diinput oleh PML ke dalam sistem.
4. Dokumen kegiatan disimpan sebagai tautan ke penyimpanan resmi instansi,
   bukan berkas yang diunggah ke server sistem.
5. Aspek keuangan terbatas pada perhitungan, pembagian, peringatan batas, dan
   rekap honor mitra. Sistem tidak memproses pencairan dana (SPP, SPM, SP2D).

### 2.4 Draf pengganti 1.3.2 Tujuan Khusus

Tetap tiga butir seperti draf lama, tetapi kini setiap tujuan menjawab satu
pokok masalah secara utuh.

1. Membangun fitur administrasi dan pengendalian honor mitra **(menjawab pokok
   masalah 1)**, yaitu pembuatan SPK dan BAST otomatis dengan penomoran yang
   tidak ganda (M1.a), pembagian honor per bulan dengan peringatan otomatis bila
   melebihi batas SBML (M1.b), serta basis data terpusat yang dilengkapi
   penyimpanan tautan dokumen per kegiatan dan pemilihan mitra yang dapat
   disaring menurut kecamatan dan desa (M1.c).
2. Membangun fitur pemantauan dan penilaian mitra **(menjawab pokok masalah 2)**,
   yaitu dasbor progres seluruh kegiatan (M2.a), notifikasi tenggat dan dokumen
   (M2.b), serta penilaian mitra yang hanya dapat diisi PML mitra tersebut
   dengan peringkat otomatis per triwulan dan tampilan beban kerja (M2.c).
3. Mengevaluasi sistem melalui pengujian fungsionalitas (_black box_), kinerja
   halaman (Google Lighthouse), keamanan hak akses, dan kegunaan (CSUQ).

### 2.5 Saran 1.4 Manfaat Penelitian

- Hapus frasa yang terlalu luas seperti "instrumen strategis dalam penerapan
  standar GSBPM ... _overarching process_". Ganti dengan manfaat yang bisa
  dirasakan, mis. "Tim Keuangan tidak lagi menjumlahkan honor mitra dari beberapa
  spreadsheet untuk mengetahui kelebihan batas SBM."
- Tulis manfaat per pengguna sesuai aktor sistem: Kepala BPS/pimpinan, Ketua
  Tim, PML, Tim Keuangan, Admin.

---

## 3. Bab II — Tinjauan Pustaka

### 3.1 Masalah yang perlu diperbaiki

| Lokasi | Masalah | Saran |
|---|---|---|
| 2.3 "Terkait Penulisan Kutipan" | Sisa isi templat, bukan bagian skripsi | **Hapus seluruh subbab** |
| _Performance Testing_ | Judul ada, isinya kosong | Isi dengan teori Google Lighthouse (3.2 di bawah) |
| React, Node.js, Express | Mengklaim menangani "ribuan mitra", "puluhan PML secara simultan" | Sesuaikan dengan skala nyata: sekitar 128 mitra, dan pengguna bersamaan paling banyak sekitar 20 orang |
| Express.js | "memastikan tidak ada alokasi anggaran yang melanggar batas" | Sistem memberi peringatan dan meminta konfirmasi, bukan menolak. Ganti kalimatnya |
| Tata Kelola Administrasi | Menyebut aturan batas honor SBM tanpa rujukan regulasi | Tambahkan rujukan aturan SBM/SBML yang berlaku untuk honor mitra (PMK SBM tahun anggaran terkait atau ketentuan BPS). **[cari rujukannya]** |
| Istilah SBM/SBML | Buku memakai "SBM", kode aplikasi memakai "SBML" | Pakai istilah sesuai regulasi yang dirujuk, konsisten di seluruh buku |
| Penilaian kinerja | Rumus peringkat (rata-rata + 0,01 × jumlah kegiatan) belum punya dasar | Sebutkan sumbernya, mis. kebijakan satuan kerja atau pedoman penilaian mitra BPS. **[konfirmasi]** |
| CSUQ | Menyebut kualitas antarmuka mencakup pernyataan 16–19 | Setahu saya, pada CSUQ 19 butir, butir 16–18 adalah kualitas antarmuka dan butir 19 kepuasan keseluruhan. Periksa ulang di Lewis (1995) |
| CSUQ | Ambang "di atas 5,0 berarti baik" belum punya rujukan | Tambahkan sumber interpretasi skor |
| Tabel penelitian terkait | Kebaruan disandarkan pada teknologi ("CodeIgniter konvensional" vs "Node.js modern") | Argumen teknologi mudah dipatahkan. Sandarkan kebaruan pada **keterhubungan alur** (kegiatan → alokasi → honor → surat → progres → penilaian dalam satu sistem) |

### 3.2 Draf isi Performance Testing

Pengujian kinerja (_performance testing_) dilakukan untuk mengukur kecepatan
halaman sistem saat dimuat di peramban. Pengujian menggunakan Google Lighthouse,
alat audit terbuka yang tersedia pada peramban Google Chrome. Lighthouse
menghasilkan skor kinerja 0–100 berdasarkan beberapa metrik, yaitu:

1. _First Contentful Paint_ (FCP): waktu hingga konten pertama tampil.
2. _Largest Contentful Paint_ (LCP): waktu hingga elemen terbesar di layar
   tampil.
3. _Total Blocking Time_ (TBT): lama halaman tidak dapat merespons masukan
   pengguna selama dimuat.
4. _Cumulative Layout Shift_ (CLS): besar pergeseran tata letak saat halaman
   dimuat.
5. _Speed Index_: kecepatan isi halaman terlihat lengkap.

[Cantumkan ambang "baik" setiap metrik beserta rujukannya dari dokumentasi
resmi Lighthouse/web.dev. Pastikan angka yang dipakai sesuai versi Lighthouse
saat pengujian.]

Pengujian dilakukan pada halaman yang paling sering dipakai dan paling berat
datanya, yaitu dasbor, input kegiatan, manajemen honor, dan generate surat.

### 3.3 Teori yang sudah cukup, tinggal dikaitkan

- **Black Box Testing:** Bab II sudah menyebut _Equivalence Partitioning_ dan
  _Boundary Value Analysis_. Pakai keduanya sungguhan di Bab V (bagian 5).
- **Security Testing:** skenario eskalasi hak akses horizontal sudah sesuai
  dengan perbaikan penilaian mitra (hanya PML mitra tersebut yang dapat
  menilai). Jadikan ini salah satu kasus uji utama.
- **Modified Waterfall:** contoh "perubahan aturan di tengah pengembangan" di
  Bab II dan III masih hipotetis. Ganti dengan contoh nyata (bagian 4.1).

---

## 4. Bab III — Metode Penelitian

### 4.1 Masalah yang perlu diperbaiki

| Lokasi | Masalah | Saran |
|---|---|---|
| 3.2 Tahapan Penelitian | Sitasi bernomor [11], [18], [22]–[28], padahal pedoman memakai APA 7 | Ganti menjadi (Penulis, Tahun) |
| 3.2 | Frasa kabur: "strategi input data hibrida", "prinsip _Rapid Development_", "simulasi serangan" | Jelaskan konkret atau hapus |
| 3.2 Implementation | Menyebut "middleware otentikasi JWT" | Sistem memakai token bertanda tangan HMAC-SHA256 buatan sendiri. Sesuaikan |
| 3.2 Deployment | Menyebut VPS, Nginx, dan FortiClient VPN | Kode aplikasi disiapkan untuk hosting cPanel. Pastikan tulisan sesuai lingkungan penerapan sebenarnya. **[konfirmasi]** |
| 2.x Security Testing + 3.2 | Ruang lingkup keamanan dibatasi karena "hanya dapat diakses lewat intranet/VPN" | Alasan ini hanya sah bila sistem memang diterapkan di jaringan tertutup. Bila di hosting umum, alasan pembatasan ruang lingkup perlu diganti. **[konfirmasi]** |
| Gambar 3 Kerangka Pikir | Kolom permasalahan dan tujuan masih versi lama | Samakan dengan dua pokok masalah (M1 dan M2) beserta rinciannya, dan tiga tujuan khusus baru |
| 3.1.3 Modified Waterfall | Contoh umpan balik antar-tahap masih hipotetis | Pakai contoh nyata di bawah |

### 4.2 Contoh nyata umpan balik Modified Waterfall

Selama pengembangan terjadi beberapa perubahan kebutuhan yang memaksa kembali
ke tahap analisis dan perancangan. Contoh ini memperkuat alasan pemilihan
metode:

1. **Pembagian honor lintas bulan.** Rancangan awal membagi honor dalam
   rupiah. Setelah dikonfirmasi ke Tim Keuangan, pembagian diubah menurut
   muatan (unit beban kerja) karena SPK ditulis per volume pekerjaan.
   Perubahan ini menambah kolom `volume` pada tabel `ppl_honor_bulan`.
2. **Surat per bulan.** Awalnya nomor surat diikat pada rentang tanggal bebas,
   sehingga seorang mitra bisa mendapat beberapa nomor untuk pekerjaan yang
   sama. Rancangan diubah menjadi satu surat per mitra per bulan, dengan status
   aktif/batal.
3. **Mitra berhenti.** Awalnya mitra dapat dihapus. Karena penghapusan ikut
   menghilangkan surat dan memutus alokasi, rancangan diubah menjadi
   penonaktifan mitra.
4. **Hak ubah batas SBM.** Awalnya hanya Admin; kemudian Tim Keuangan juga
   diberi hak karena batas SBM adalah urusan keuangan sehari-hari.

[Sesuaikan urutan dan waktunya dengan catatan pengembangan Anda.]

---

## 5. Rencana Bab V — Evaluasi yang sejalur

> **Bagian ini sudah dikembangkan menjadi dokumen tersendiri.** Pakai
> `draf-bab5-implementasi.md` (subbab implementasi) dan `draf-bab5-evaluasi.md`
> (subbab evaluasi, panduan pengujian, dan kuesioner CSUQ). Isi di bawah tetap
> disimpan sebagai rencana awal; bila berbeda, yang berlaku adalah kedua dokumen
> baru itu karena kasus ujinya sudah dilengkapi sampai mencakup seluruh KF.

### 5.1 Pengujian fungsionalitas (_black box_)

Setiap kasus uji merujuk ke satu KF di Bab IV. Contoh kasus yang memakai
_Boundary Value Analysis_ (BVA) dan _Equivalence Partitioning_ (EP):

| Kode | KF | Skenario | Masukan | Hasil yang diharapkan |
|---|---|---|---|---|
| BB-01 | KF-06 | Honor bulanan tepat di bawah batas (BVA) | Batas Rp3.000.000; total mitra Rp2.999.999 | Tersimpan tanpa peringatan |
| BB-02 | KF-06 | Honor bulanan tepat sama dengan batas (BVA) | Total Rp3.000.000 | Tersimpan tanpa peringatan |
| BB-03 | KF-06 | Honor bulanan melebihi batas (BVA) | Total Rp3.000.001 | Peringatan tampil; data tersimpan hanya bila dikonfirmasi |
| BB-04 | KF-05 | Honor lintas dua bulan dibagi menurut jumlah hari | Periode 15 Jan–15 Feb, beban 10 | Muatan dan honor terbagi dua bulan; jumlahnya sama dengan total honor |
| BB-05 | KF-11 | SPK dicetak ulang | Mitra yang sudah punya SPK bulan itu | Nomor surat sama dengan cetakan pertama |
| BB-06 | KF-11 | BAST sebelum SPK | Mitra tanpa SPK | BAST tidak dibuat; mitra ditandai belum memiliki SPK |
| BB-07 | KF-14 | Nilai di luar rentang (BVA) | Nilai 0 dan 11 | Ditolak |
| BB-08 | KF-14 | Nilai di batas rentang (BVA) | Nilai 1 dan 10 | Tersimpan |
| BB-09 | KF-07 | Progres melebihi beban kerja | Beban 20, total progres 21 | Ditolak dengan pesan galat |
| BB-10 | KF-10 | Pengingat tenggat | Tanggal selesai tahap 3 hari lagi | Notifikasi tenggat tampil untuk Ketua Tim |

[Lengkapi hingga setiap KF punya minimal satu kasus uji.]

> Catatan: aturan batas di aplikasi adalah "melebihi", artinya honor yang
> **sama dengan** batas tidak memicu peringatan (BB-02). Tulis aturan ini
> dengan jelas di Bab IV agar hasil uji tidak dianggap salah.

### 5.2 Pengujian keamanan hak akses

| Kode | Jenis | Skenario | Hasil yang diharapkan |
|---|---|---|---|
| SEC-01 | Horizontal | PML A menyimpan penilaian untuk mitra yang diawasi PML B | Ditolak (HTTP 403) |
| SEC-02 | Horizontal | PML A memperbarui progres mitra PML B | Ditolak (HTTP 403) |
| SEC-03 | Horizontal | Ketua Tim A menyunting kegiatan milik Ketua Tim B | Ditolak (HTTP 403) |
| SEC-04 | Vertikal | Pegawai biasa membuat nomor SPK atau membatalkan surat | Ditolak (HTTP 403) |
| SEC-05 | Vertikal | Pegawai biasa mengubah batas SBM | Ditolak (HTTP 403) |
| SEC-06 | Vertikal | Pegawai biasa atau Tim Keuangan mengimpor data mitra | Ditolak (HTTP 403) |
| SEC-07 | Sesi | Memakai token lama setelah kata sandi diganti | Ditolak (HTTP 401) |

Pengujian dilakukan dengan memanggil API secara langsung (mis. lewat Postman atau
alat pengembang peramban), bukan hanya lewat tampilan, karena tampilan memang
menyembunyikan tombol yang tidak berhak.

### 5.3 Pengujian kinerja (Lighthouse)

Uji halaman dasbor, input kegiatan, manajemen honor, dan generate surat. Catat
skor kinerja serta nilai FCP, LCP, TBT, CLS, dan _Speed Index_, lalu bandingkan
dengan ambang yang dirujuk di Bab II.

### 5.4 Pengujian kegunaan (CSUQ)

- Responden sesuai Bab II: Ketua Tim, PML, Tim Keuangan, dan Admin (10–15 orang).
- Skenario tugas yang dikerjakan sebelum mengisi kuesioner sebaiknya mencakup
  kedua pokok masalah: membuat kegiatan dan alokasi, menginput progres, memverifikasi
  dokumen, membuat SPK, dan menilai mitra.
- Laporkan skor per dimensi (kegunaan sistem, kualitas informasi, kualitas
  antarmuka) dan skor keseluruhan.

### 5.5 Kesimpulan Bab VI harus menjawab tujuan

Tulis kesimpulan per tujuan khusus: fitur apa yang dibangun (tujuan 1 dan 2)
dan hasil pengujian apa yang membuktikannya (tujuan 3). Jangan menambah data
baru di kesimpulan.

---

## 6. Hal yang perlu Anda konfirmasi

1. ~~Apakah sebelum sistem, SPK dan BAST memang disusun dan dinomori satu per
   satu? (M1.a)~~ **Sudah dijawab: ya, diketik dan dinomori satu per satu.** Kalimat
   M1.a dan poin fishbone "SPK dan BAST disusun dan dinomori satu per satu" boleh
   dipakai tanpa catatan ragu.
2. ~~Apakah spreadsheet data honor/alokasi antar-tim benar-benar terpisah, atau
   sudah satu spreadsheet bersama?~~ **Sudah dijawab: penentuan mitra memakai satu
   spreadsheet bersama.** Karena itu M1.b dan M1.c tidak boleh menuduh "spreadsheet
   antar-tim terpisah". Kalimat yang dipakai: spreadsheet alokasi itu tidak
   terhubung dengan data honor, progres, dan penilaian, dan ia tidak memberi tahu
   siapa pun bahwa seorang mitra sudah dialokasikan tim lain pada bulan yang sama.
   Poin fishbone sudah diperbaiki mengikuti ini.
3. ~~Di mana sistem diterapkan: jaringan tertutup BPS dengan VPN, atau hosting
   cPanel?~~ **Sudah dijawab: hosting cPanel milik BPS, dan diakses dari luar
   kantor melalui FortiClient VPN BPS.** KNF-02 di draf Bab IV, subbab arsitektur
   sistem di Bab V, dan gambar arsitektur sudah disesuaikan. Di Bab III, tahap
   penerapan ditulis sebagai pemasangan pada hosting cPanel BPS (berkas hasil
   build disalin, aplikasi Node.js dijalankan lewat Passenger, basis data dibuat
   di MySQL cPanel).
4. Dari mana rumus peringkat mitra (rata-rata + 0,01 × jumlah kegiatan)?
5. Rujukan regulasi batas honor mitra: SBM atau SBML, dan nomor aturannya.
6. ~~Penyaringan kecamatan/desa hanya ada di Daftar PPL.~~ **Sudah jelas:**
   penyaring itu dipakai juga saat alokasi, karena tombol **Pilih dari Daftar
   PPL** pada formulir alokasi membuka halaman Daftar PPL dalam mode pemilihan.
   Dalam mode itu hanya mitra aktif yang posisinya sesuai tahap yang tampil,
   mitra yang sudah dialokasikan tidak dapat dipilih lagi, dan beberapa mitra
   dapat dicentang sekaligus. Fitur ini sudah dimasukkan ke M1.c, tujuan
   khusus 1, KF-05, dan pengujian BB-46 serta BB-47.

---

## 7. Daftar kata asing dan padanannya

| Kata di draf lama | Padanan yang disarankan |
|---|---|
| _monitoring_ | pemantauan |
| _dashboard_ | dasbor |
| _auto-ranking_ | pemeringkatan otomatis |
| _gatekeeper_ SBM | peringatan batas SBM |
| repositori digital | penyimpanan tautan dokumen |
| _real-time_ | langsung (hanya bila benar) |
| silo data | data tersimpan terpisah |
| visibilitas informasi | (tulis konkret siapa tidak tahu apa) |
| _feedback loop_ | umpan balik |
| _overlapping_ | tumpang tindih |
| _research gap_ | celah penelitian |
| _novelty_ | kebaruan |
| _insider threats_ | ancaman dari pengguna internal |
| _end-user_ | pengguna akhir |
| _Modern Tech Stack_ | teknologi yang digunakan |
| _cutover_ | tahap akhir sebelum digunakan |

Istilah teknis baku yang boleh tetap asing (cetak miring, jelaskan sekali):
_black box testing_, _boundary value analysis_, _use case_, _activity diagram_,
_Entity Relationship Diagram_, _RESTful API_, _hash_, _least privilege_.
