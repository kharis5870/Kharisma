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

| Kode | Rincian masalah (Bab I)                                                                                                                                                | Tujuan / fitur                                                                                                                                      | Landasan teori (Bab II)                                                     | Kebutuhan (Bab IV)             | Pengujian (Bab V)                                                                             |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------- |
| M1.a | SPK dan BAST diketik dan dinomori satu per satu                                                                                                                        | Membuat SPK dan BAST otomatis dengan nomor surat yang tidak ganda                                                                                   | Tata kelola administrasi pemerintahan (SPBE), sistem informasi terintegrasi | KF-11, KF-12                   | _Black box_: surat terbit, cetak ulang memakai nomor sama, nomor tidak ganda; efisiensi waktu |
| M1.b | Batas honor SBML dicek manual di spreadsheet dan tidak mencegah kelebihan; honor lintas bulan dibagi manual                                                            | Peringatan otomatis batas SBML, pembagian honor per bulan menurut muatan, rekap honor yang dapat diunduh                                            | Standar Biaya Masukan (regulasi), pengendalian internal                     | KF-05, KF-06, KF-13            | _Black box_ dengan _Boundary Value Analysis_ pada batas SBML; efisiensi waktu                 |
| M1.c | Spreadsheet isian mitra tidak terhubung dengan kontrak dan honor, tautan dokumen tidak terkumpul per kegiatan, dan mitra di sekitar wilayah tugas dicari satu per satu | Basis data terpusat, penyimpanan tautan dokumen per kegiatan dengan alur verifikasi, pemilihan mitra yang dapat disaring menurut kecamatan dan desa | Basis data relasional (ERD), pengarsipan digital                            | KF-02 s.d. KF-05, KF-08, KF-09 | _Black box_: penyaringan wilayah, kelengkapan dokumen; efisiensi waktu                        |

**Pokok Masalah 2 (M2) — Pemantauan progres dan penilaian kinerja mitra belum
terpusat.**

| Kode | Rincian masalah (Bab I)                                                                                                                               | Tujuan / fitur                                                                                     | Landasan teori (Bab II)                                           | Kebutuhan (Bab IV)  | Pengujian (Bab V)                                                                           |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------- |
| M2.a | Progres kegiatan FASIH dan Non-FASIH setiap tim tersimpan di tempat berbeda, sehingga Kepala BPS tidak dapat memantau seluruh tim dalam satu tampilan | Dasbor pemantauan seluruh kegiatan beserta grafik                                                  | Pemantauan dan evaluasi, dasbor eksekutif                         | KF-07, KF-13        | _Black box_; _Performance Testing_ (Lighthouse) pada dasbor; CSUQ aspek kualitas informasi  |
| M2.b | Tidak ada pengingat otomatis untuk tenggat tahap kegiatan maupun dokumen yang belum lengkap                                                           | Notifikasi otomatis tenggat, dokumen ditolak, dan progres yang tidak diperbarui                    | Sistem informasi manajemen                                        | KF-10               | _Black box_: notifikasi muncul dan hilang sesuai kondisinya                                 |
| M2.c | Penilaian mitra dapat diubah siapa pun yang memiliki akses, peringkat triwulan dihitung manual, dan beban mitra, PML, maupun tim tidak terlihat       | Penilaian hanya oleh PML mitra tersebut, pemeringkatan otomatis per triwulan, tampilan beban kerja | Manajemen kinerja; prinsip hak akses terendah (_least privilege_) | KF-13, KF-14, KF-15 | _Security Testing_ (eskalasi hak akses horizontal); _black box_ nilai 1–10; efisiensi waktu |

Pengujian CSUQ mengukur keseluruhan sistem, sehingga menjawab tujuan secara umum.

---

## 2. Bab I — Pendahuluan

### 2.1 Masalah yang perlu diperbaiki

| Lokasi                | Masalah                                                                                                                                                                                  | Saran                                                                                                                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Latar belakang hlm. 5 | Merujuk "Gambar 1.2", padahal penomoran buku "Gambar 2"                                                                                                                                  | Samakan dengan penomoran otomatis                                                                                                                                                                                              |
| 1.2.1 butir 1         | "ketiadaan data yang tersaji secara sangat menghambat" — ada kata yang hilang                                                                                                            | Perbaiki kalimat, mis. "data yang tidak tersaji secara terpadu sangat menghambat"                                                                                                                                              |
| 1.2.1                 | Dua kelompok masalah ditulis sebagai paragraf panjang yang luas, tanpa bukti konkret                                                                                                     | **Struktur dua kelompoknya dipertahankan** (sesuai arahan pembimbing), tetapi tiap kelompok diisi tiga rincian yang konkret dan dapat dibuktikan (2.2 di bawah). Yang diperbaiki keluasan kalimatnya, bukan jumlah kelompoknya |
| 1.2.1 butir 1         | Menyebut "sistem merit", "_Quality Management_ GSBPM", "profil mitra terbaik"                                                                                                            | Terlalu luas untuk skripsi sistem informasi; cukup sebut penilaian dan peringkat mitra                                                                                                                                         |
| Sistematika Bab I     | Menyebut "rumusan masalah", padahal tidak ada subbab rumusan masalah                                                                                                                     | Tambahkan subbab, atau hapus dari sistematika (cek Pedoman Skripsi KS)                                                                                                                                                         |
| Judul vs isi          | "Sistem Informasi Tata Kelola Administrasi dan Monitoring Kegiatan Mitra Statistik", "Sistem Informasi Kegiatan Administrasi Mitra Statistik", "OPTIMA", dan aplikasi bernama "Kharisma" | Pilih satu nama sistem dan satu judul, pakai konsisten                                                                                                                                                                         |
| Latar belakang        | Menyebut pemantauan "secara langsung/real-time"                                                                                                                                          | Aman bila maksudnya data tampil begitu PML menyimpan progres. Jangan klaim terhubung langsung dengan FASIH                                                                                                                     |
| Latar belakang        | Menyebut "alokasi ratusan mitra"                                                                                                                                                         | Sesuaikan angka dengan data nyata (database saat ini berisi sekitar 128 mitra)                                                                                                                                                 |
| 1.2.2 butir 3         | Belum menyebut bahwa progres kegiatan FASIH tetap diinput manual                                                                                                                         | Tambahkan ke batasan masalah (2.3 di bawah)                                                                                                                                                                                    |

### 2.2 Draf pengganti 1.2.1 Identifikasi Masalah

> **Bentuk penulisan:** paragraf mengalir, seperti versi seminar proposal Anda —
> menjelaskan dulu bagaimana pekerjaannya berjalan, baru menunjukkan di mana
> masalahnya, lalu diperkuat rujukan penelitian lain. Bedanya dengan versi lama:
> setiap masalah ditulis sebagai kejadian yang bisa dibuktikan, bukan kata sifat
> umum, dan fakta yang keliru sudah diperbaiki (spreadsheet mitra ternyata satu
> berkas bersama dari Tim Keuangan, bukan berkas terpisah tiap tim; progres FASIH
> masuk otomatis ke PML, tidak dicatat ulang).

Berdasarkan uraian latar belakang mengenai kompleksitas alur proses bisnis di atas,
dapat diidentifikasi dua kelompok permasalahan pokok yang menghambat efektivitas
tata kelola kegiatan dan administrasi mitra statistik di BPS Kabupaten Bengkulu
Selatan, yaitu:

**1. Administrasi kontrak dan honor mitra masih dikerjakan manual dan tidak
terhubung (Aspek Administrasi)**

Permasalahan pertama berpusat pada pekerjaan administrasi yang harus diulang untuk
setiap mitra dan setiap bulan. Alurnya dimulai ketika Ketua Tim menentukan mitra
yang akan bertugas pada kegiatannya, lalu mengisikan nama mitra beserta beban kerja
dan PML pengawasnya ke dalam satu berkas kerja bersama yang disediakan Tim
Keuangan. Berkas tersebut memang sudah dipakai bersama antartim, namun ia berdiri
sendiri dan tidak terhubung dengan dokumen kontrak maupun perhitungan honor. Karena
itu, untuk menerbitkan Surat Perjanjian Kerja (SPK), Tim Keuangan harus memindahkan
data setiap mitra dari berkas tersebut ke dokumen kontrak dan memeriksanya satu per
satu. Surat perjanjian kerja dan Berita Acara Serah Terima (BAST) diketik serta
dinomori satu per satu untuk setiap mitra pada setiap bulan, sehingga penyusunannya
memakan waktu dan nomor surat rawan ganda atau terlewat.

Kondisi serupa terjadi pada pengendalian honor. Seorang mitra statistik kerap
dialokasikan secara paralel oleh beberapa tim teknis dalam periode yang sama,
sehingga total honor yang diterimanya dalam satu bulan hanya dapat diketahui setelah
alokasi seluruh tim dijumlahkan. Tim Keuangan telah menggunakan berkas pengecekan
untuk memastikan akumulasi honor tidak melampaui batas Standar Biaya Masukan Lainnya
(SBML) sebagaimana diatur dalam Peraturan Kepala Badan Pusat Statistik Nomor 117
Tahun 2021 (Badan Pusat Statistik, 2021). Namun berkas tersebut tidak memberi
peringatan apa pun saat batas terlampaui; kelebihan honor baru diketahui apabila
data dicocokkan satu per satu oleh petugas. Kesulitan bertambah ketika periode kerja
sebuah kegiatan melintasi dua bulan, karena pembagian beban kerja beserta honornya
ke masing-masing bulan harus dihitung secara manual. Kerentanan semacam ini sejalan
dengan analisis Wahab dkk. (2025) yang menyatakan bahwa pengelolaan data honorarium
secara manual pada instansi pemerintah memiliki kerentanan tinggi terhadap kesalahan
hitung dan ketidakpatuhan regulasi akibat ketiadaan validasi sistematis.

Ketidakterhubungan data juga menyulitkan dua pekerjaan lain. Pertama, tautan dokumen
pendukung administrasi seperti Surat Keputusan, Surat Tugas, dan BAST tidak terkumpul
per kegiatan, melainkan tersebar di folder penyimpanan masing-masing Ketua Tim,
sehingga Tim Keuangan harus menagih ulang kelengkapan berkas secara manual menjelang
pencairan honor. Kedua, pada saat menentukan mitra, Ketua Tim harus menelusuri daftar
mitra satu per satu untuk menemukan mitra yang tinggal di sekitar wilayah tugas
kegiatan, tanpa dapat mengetahui berapa banyak kegiatan yang sedang ditanggung mitra
tersebut. Inefisiensi yang timbul dari pengelolaan arsip yang tidak terpusat ini
mengonfirmasi temuan Supriatmaja dkk. (2024), bahwa desentralisasi pengelolaan arsip
administrasi berdampak langsung pada lambatnya kinerja layanan keuangan dan rendahnya
akuntabilitas pencairan anggaran.

**2. Pemantauan progres dan penilaian kinerja mitra belum terpusat (Aspek
Pemantauan)**

Permasalahan kedua berpusat pada tidak tersedianya satu tempat untuk melihat
perkembangan pekerjaan seluruh kegiatan. Pada tahap pelaksanaan lapangan, cara
pemantauan terbelah mengikuti jenis kegiatannya. Kegiatan yang memakai aplikasi
nasional FASIH terpantau melalui aplikasi tersebut, karena pekerjaan mitra yang
selesai langsung masuk ke Pengawas Lapangan (PML) untuk diperiksa. Sebaliknya,
puluhan kegiatan rutin lain yang tidak memakai FASIH dipantau dengan cara PML
mencatat capaian mitra pada berkas kerja progres, yang kemudian diawasi Ketua Tim.
Akibat kedua sumber ini tersimpan di tempat yang berbeda dan terpisah menurut tim,
Kepala BPS tidak dapat melihat progres seluruh tim dalam satu tampilan, sehingga
kegiatan yang tertinggal atau belum berjalan terlambat diketahui. Keterbatasan
semacam ini sejalan dengan temuan Simpony dkk. (2024) yang menyebutkan bahwa
ketiadaan data yang tersaji seketika secara signifikan menghambat pengambilan
keputusan strategis pimpinan.

Keadaan tersebut diperberat oleh tidak adanya pengingat otomatis. Tenggat setiap
tahap kegiatan maupun dokumen yang belum lengkap tidak diingatkan oleh sistem apa
pun, sehingga keterlambatan baru disadari ketika tenggatnya sudah dekat atau bahkan
terlewat, dan penyampaian teguran bergantung pada inisiatif serta pesan pribadi
antarpegawai. Kondisi serupa ditemukan Muthmainnah dkk. (2025) pada Badan Pusat
Statistik Kota Lhokseumawe, yang menyimpulkan bahwa proses pemantauan kegiatan yang
masih dikerjakan secara manual menimbulkan keterlambatan pelaporan dan
ketidaktepatan informasi, dan bahwa penyediaan sistem pemantauan berbasis web
terbukti mempercepat pelaporan sekaligus mengurangi kesalahan pencatatan. Temuan itu
menunjukkan bahwa persoalan ini bukan kekhasan satu satuan kerja, melainkan pola
yang berulang pada satuan kerja BPS yang pemantauannya belum terbantu sistem.

Permasalahan berlanjut ke tahap evaluasi kinerja mitra. Setelah kewajiban lapangan
selesai, PML memberikan penilaian atas kinerja mitra yang diawasinya, dan hasil
penilaian tersebut dikombinasikan dengan intensitas keikutsertaan mitra dalam
kegiatan untuk menghasilkan pemeringkatan sebagai bahan evaluasi dan apresiasi
mitra. Secara teknis, penilaian dicatat pada berkas kerja yang dapat dibuka dan
diubah oleh siapa pun yang memiliki tautannya, termasuk mengubah nilai mitra yang
bukan diawasinya, sehingga tidak ada jaminan bahwa nilai yang tersimpan benar-benar
berasal dari pengawas yang berwenang. Pemeringkatannya sendiri dihitung ulang secara
manual oleh pegawai yang ditugasi, dengan menggabungkan data nilai dan rekapitulasi
riwayat kegiatan dari berkas yang berbeda. Proses manual ini membuat pemeringkatan
lambat tersedia dan rawan kesalahan hitung, sekaligus menyulitkan satuan kerja
mengetahui mitra, PML, atau tim mana yang sedang menanggung kegiatan paling banyak
pada suatu bulan. Padahal, sebagaimana ditekankan Fajar dan Maghfiroh (2024),
penerapan sistem evaluasi kinerja yang objektif, otomatis, dan terintegrasi
merupakan kunci dalam menjamin kualitas data statistik serta penegakan keadilan bagi
mitra.

### 2.2.1 Paragraf penutup identifikasi masalah

Paragraf penutup yang Anda tulis sudah baik: ia menyebut judul, lalu memasangkan
tiap masalah dengan fiturnya. Tiga hal kecil yang perlu diperbaiki.

**Versi Anda sekarang:**

> Oleh karena itu, berdasarkan permasalahan yang terjadi di lapangan, penelitian ini
> mengusulkan "Pengembangan Sistem Informasi Tata Kelola Administrasi dan Monitoring
> Kegiatan Mitra Statistik (Studi Kasus: BPS Kabupaten Bengkulu Selatan)". Solusi ini
> dirancang untuk menyelesaikan permasalahan tersebut dengan menyediakan satu aplikasi
> yang mampu menyajikan monitoring secara langsung dan auto-ranking peringkat evaluasi
> mitra, sekaligus mengendalikan batas SBML mitra melalui fitur peringatan otomatis,
> serta menyediakan penyimpanan arsip terpusat untuk mempercepat validasi administrasi
> kontrak, sehingga tercipta tata kelola mitra statistik yang tertib, efisien, dan
> akuntabel sesuai standar GSBPM.

**Usulan perbaikan:**

> Oleh karena itu, berdasarkan permasalahan yang terjadi di lapangan, penelitian ini
> mengusulkan "Pengembangan Sistem Informasi Tata Kelola Administrasi dan Pemantauan
> Kegiatan Mitra Statistik (Studi Kasus: BPS Kabupaten Bengkulu Selatan)". Sistem ini
> dirancang untuk menjawab kedua pokok permasalahan tersebut dengan menyediakan satu
> aplikasi yang menyatukan administrasi dan pemantauan mitra. Pada sisi administrasi,
> sistem membuat surat perjanjian kerja beserta BAST secara otomatis dengan penomoran
> yang tidak ganda, memperingatkan Ketua Tim ketika akumulasi honor seorang mitra
> melampaui batas SBML, dan mengumpulkan tautan dokumen kegiatan dalam satu tempat
> sehingga kelengkapannya mudah diperiksa. Pada sisi pemantauan, sistem menampilkan
> progres seluruh kegiatan dalam satu dasbor, mengirim pengingat tenggat secara
> otomatis, serta menghitung peringkat kinerja mitra per triwulan yang hanya dapat
> dinilai oleh PML pengawasnya. Dengan demikian, pengelolaan mitra statistik dapat
> berjalan lebih tertib, efisien, dan dapat dipertanggungjawabkan.

**Apa yang diubah dan mengapa:**

| Yang diubah | Alasan |
| --- | --- |
| "monitoring" menjadi "pemantauan" | Menyesuaikan istilah yang dipakai sejak dua pokok masalah dan tujuan khusus |
| "monitoring secara langsung" dihapus | Frasa ini mendekati klaim _real-time_. Sistem menampilkan data begitu PML menyimpan progres, bukan tersambung langsung ke FASIH. Menyebut "progres seluruh kegiatan dalam satu dasbor" lebih tepat dan tetap kuat |
| "auto-ranking" diganti "menghitung peringkat kinerja mitra per triwulan" | Istilah asing yang tidak perlu, dan versi Indonesianya justru lebih informatif |
| Fitur dikelompokkan menjadi sisi administrasi dan sisi pemantauan | Supaya paragraf penutup ini persis mencerminkan dua pokok masalah di atasnya |
| "sesuai standar GSBPM" dihapus dari kalimat terakhir | Sistem ini tidak diuji kesesuaiannya terhadap GSBPM, sehingga klaim itu tidak dibuktikan di Bab V. GSBPM tetap boleh disebut di latar belakang sebagai kerangka kerja BPS, tetapi jangan dijadikan klaim hasil |

Butir terakhir yang paling penting. Setiap klaim pada paragraf penutup sebaiknya ada
pembuktiannya di Bab V. Ketertiban, efisiensi, dan akuntabilitas dibuktikan lewat
pengujian fungsional, efisiensi waktu, dan jejak audit; kesesuaian dengan GSBPM tidak
ada alat ujinya di penelitian ini.

### 2.2.2 "Pengembangan" atau "Pembangunan"?

**Pakai "Pengembangan"**, dan pertahankan judul Anda apa adanya.

Alasannya sederhana. Dalam penulisan skripsi sistem informasi, kedua kata itu
dibedakan seperti ini:

- **Pembangunan** (_development from scratch_) menyiratkan tidak ada sistem
  sebelumnya sama sekali, dan penelitian membuat yang benar-benar pertama.
- **Pengembangan** menyiratkan adanya proses atau sistem yang sudah berjalan, lalu
  diperbaiki atau digantikan dengan yang lebih baik.

Keadaan Anda adalah yang kedua: sudah ada cara kerja yang berjalan (berkas kerja
bersama, aplikasi FASIH, pengecekan SBML manual), dan sistem Anda menggantikan serta
menyatukannya. Selain itu, "pengembangan" juga istilah baku yang dipakai dalam
rekayasa perangkat lunak untuk keseluruhan siklus pengembangan sistem (_system
development life cycle_), yang persis dipakai sebagai metode Anda di Bab III.

Satu hal yang perlu konsisten: bila judul memakai "Pengembangan", maka tujuan umum
dan kalimat penutup sebaiknya juga memakai kata kerja yang sejalan. Draf tujuan umum
pada bagian 2.4 memakai kata "Membangun" - itu masih wajar dan lazim dipakai untuk
tujuan penelitian, tetapi bila ingin benar-benar seragam, ganti menjadi
"Mengembangkan sistem informasi ...".

### 2.2.3 Kesesuaian isi dengan judul besar

Judul Anda: "Pengembangan Sistem Informasi Tata Kelola Administrasi dan Monitoring
Kegiatan Mitra Statistik (Studi Kasus: BPS Kabupaten Bengkulu Selatan)".

Judul itu menjanjikan dua hal - **administrasi** dan **pemantauan** - pada objek
**kegiatan mitra statistik**. Berikut pemeriksaan kesesuaiannya terhadap isi skripsi
setelah revisi:

| Unsur judul | Terwakili di | Sesuai? |
| --- | --- | --- |
| Tata Kelola **Administrasi** | Pokok masalah 1, tujuan khusus 1, KF-01 s.d. KF-06 dan KF-08 s.d. KF-13 | Ya |
| **Monitoring**/Pemantauan | Pokok masalah 2, tujuan khusus 2, KF-07, KF-10, KF-14, KF-15 | Ya |
| Kegiatan **Mitra Statistik** | Seluruh alur sistem berpusat pada mitra: alokasi, honor, kontrak, progres, penilaian | Ya |
| Studi Kasus **BPS Kabupaten Bengkulu Selatan** | Batasan masalah butir 2; seluruh data dan aturan berasal dari satker ini | Ya |

Setelah masalah disusun menjadi dua pokok, **kesesuaiannya justru menjadi sangat
rapi**: judul menyebut dua hal, masalah ada dua, tujuan khusus yang membangun sistem
ada dua, dan keduanya berpasangan satu-satu. Ini termasuk yang paling mudah
dipertahankan saat sidang - Anda cukup menunjukkan bahwa struktur bab mengikuti
struktur judul.

Satu ketidaksesuaian kecil yang tersisa: judul memakai kata **"Monitoring"**,
sedangkan isi naskah setelah revisi memakai **"pemantauan"**. Dua pilihan:

1. **Biarkan judul apa adanya** (bila sudah terdaftar resmi), lalu di Bab I sebutkan
   sekali bahwa istilah pemantauan dipakai sebagai padanan monitoring pada judul.
2. **Ubah judul** menjadi "... Administrasi dan Pemantauan Kegiatan Mitra Statistik",
   bila perubahan judul masih diizinkan pembimbing.

### 2.2.4 Di mana SBML dijelaskan?

**Diperkenalkan dua kali, dengan kedalaman berbeda.**

**Pertama di Bab I**, saat istilahnya muncul pertama kali pada identifikasi masalah.
Cukup satu kalimat pengenal, jangan panjang, karena Bab I bukan tempat teori:

> ... memastikan akumulasi honor tidak melampaui batas Standar Biaya Masukan Lainnya
> (SBML), yaitu standar biaya honor petugas kegiatan statistik yang ditetapkan BPS
> sebagaimana diatur dalam Peraturan Kepala Badan Pusat Statistik Nomor 117 Tahun
> 2021 (Badan Pusat Statistik, 2021).

Sesudah kalimat ini, cukup tulis "SBML" saja di seluruh naskah.

**Kedua di Bab II**, sebagai subbab landasan teori tersendiri, misalnya "2.x Standar
Biaya Masukan Lainnya (SBML)". Isinya sekitar dua paragraf:

> Paragraf 1 - pengertian dan kedudukannya: bedanya SBM (ditetapkan Kementerian
> Keuangan, berlaku umum untuk seluruh kementerian/lembaga) dengan SBML (khusus satu
> kementerian/lembaga untuk pekerjaan yang tidak tercakup SBM umum, dan penetapannya
> memerlukan persetujuan tertulis Menteri Keuangan).
>
> Paragraf 2 - penerapannya pada penelitian ini: honor mitra statistik termasuk SBML
> sebagaimana diatur Perka BPS Nomor 117 Tahun 2021; batas honor bulanan inilah yang
> dijadikan dasar fitur peringatan pada sistem, dan nilainya disimpan sebagai
> pengaturan yang dapat diubah Tim Keuangan agar tidak perlu mengubah kode program
> setiap kali besarannya diperbarui.

Paragraf kedua itu penting karena menjadi jembatan antara teori di Bab II dan KF-06
di Bab IV. Tanpa jembatan itu, subbab SBML akan terlihat sebagai teori yang tidak
terpakai.

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

### 2.4 Draf pengganti 1.3.1 Tujuan Umum

**Versi lama:** "Membangun sistem informasi terpadu (OPTIMA) untuk mengatasi
fragmentasi monitoring dan disintegrasi evaluasi kinerja, serta memperkuat tata
kelola administrasi dan pengendalian keuangan (SBM) di BPS Kabupaten Bengkulu
Selatan dalam satu ekosistem digital."

Yang membuat kalimat itu terasa luas: "fragmentasi", "disintegrasi", dan "ekosistem
digital" adalah istilah yang menggambarkan keadaan secara abstrak, sehingga pembaca
tidak langsung tahu pekerjaan apa yang sebenarnya diperbaiki. Dua pilihan pengganti:

**Pilihan A (disarankan) — menyebut pekerjaannya secara langsung:**

> Membangun sistem informasi SIKAMI yang menyatukan administrasi kontrak dan honor
> mitra statistik dengan pemantauan progres dan penilaian kinerjanya dalam satu
> basis data terpusat di BPS Kabupaten Bengkulu Selatan, sehingga pekerjaan yang
> selama ini dikerjakan berulang secara manual pada berkas yang terpisah dapat
> dikerjakan pada satu sistem.

**Pilihan B — menyebut hasil yang diharapkan:**

> Membangun sistem informasi SIKAMI di BPS Kabupaten Bengkulu Selatan yang
> membuat penyusunan kontrak dan pengendalian honor mitra berjalan otomatis, serta
> progres dan penilaian kinerja seluruh mitra dapat dipantau dari satu tampilan.

Keduanya sudah mencakup dua pokok masalah, memakai kata yang dipahami pembaca di
luar bidang komputer, dan tidak mengandung klaim yang tidak diuji.

> **Perlu Anda pastikan — nama sistem.** Tujuan umum ini memakai **SIKAMI**,
> sedangkan makalah seminar proposal memakai **OPTIMA**, dan aplikasinya sendiri
> (logo, menu, nama basis data) memakai **Kharisma**. Tiga nama untuk satu sistem
> akan ditanya penguji. Pilih satu nama, pakai konsisten dari judul sampai lampiran,
> dan bila nama berubah dari yang dipakai saat seminar proposal, sebutkan sekali di
> Bab I bahwa sistem yang pada seminar proposal disebut OPTIMA kini bernama SIKAMI.
> Perubahan nama juga berarti judul skripsi, kerangka pikir, dan seluruh gambar yang
> memuat nama lama harus ikut diperbarui.

### 2.5 Draf pengganti 1.3.2 Tujuan Khusus

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
3. Mengevaluasi sistem melalui pengujian fungsionalitas (_black box_), keamanan
   hak akses, kinerja dan efisiensi proses kerja, serta kegunaan (CSUQ).

> **Mengapa nama alat dihapus dari tujuan.** Versi sebelumnya menulis "kinerja
> halaman (Google Lighthouse)". Tujuan penelitian sebaiknya menyebut **apa yang
> diukur**, bukan alat yang dipakai, karena alat dapat berganti tanpa mengubah
> tujuannya. Selain itu, "kinerja halaman" mempersempit pengujian ketiga menjadi
> sekadar kecepatan memuat layar, padahal yang menjawab masalah Anda adalah
> perbandingan waktu kerja sebelum dan sesudah sistem. Penamaan "kinerja dan
> efisiensi proses kerja" mencakup keduanya.

### 2.6 Saran 1.4 Manfaat Penelitian

- Hapus frasa yang terlalu luas seperti "instrumen strategis dalam penerapan
  standar GSBPM ... _overarching process_". Ganti dengan manfaat yang bisa
  dirasakan, mis. "Tim Keuangan tidak lagi menjumlahkan honor mitra dari beberapa
  spreadsheet untuk mengetahui kelebihan batas SBM."
- Tulis manfaat per pengguna sesuai aktor sistem: Kepala BPS/pimpinan, Ketua
  Tim, PML, Tim Keuangan, Admin.

---

## 3. Bab II — Tinjauan Pustaka

### 3.1 Masalah yang perlu diperbaiki

| Lokasi                          | Masalah                                                                              | Saran                                                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.3 "Terkait Penulisan Kutipan" | Sisa isi templat, bukan bagian skripsi                                               | **Hapus seluruh subbab**                                                                                                                                        |
| _Performance Testing_           | Judul ada, isinya kosong                                                             | Isi dengan teori Google Lighthouse (3.2 di bawah)                                                                                                               |
| React, Node.js, Express         | Mengklaim menangani "ribuan mitra", "puluhan PML secara simultan"                    | Sesuaikan dengan skala nyata: sekitar 128 mitra, dan pengguna bersamaan paling banyak sekitar 20 orang                                                          |
| Express.js                      | "memastikan tidak ada alokasi anggaran yang melanggar batas"                         | Sistem memberi peringatan dan meminta konfirmasi, bukan menolak. Ganti kalimatnya                                                                               |
| Tata Kelola Administrasi        | Menyebut aturan batas honor SBM tanpa rujukan regulasi                               | **Sudah ditemukan:** Peraturan Kepala BPS Nomor 117 Tahun 2021 tentang Standar Biaya Masukan Lainnya Kegiatan Statistik untuk Petugas Pendataan, Pemeriksaan, dan Pengolahan. Lihat `draf-revisi-pustaka.md` bagian 3.a |
| Istilah SBM/SBML                | Buku memakai "SBM", kode aplikasi memakai "SBML"                                     | **Pakai SBML.** Aturan yang mengatur honor mitra BPS memang berjudul Standar Biaya Masukan **Lainnya**. Lihat penjelasan lengkap di bagian 3.4 |
| Penilaian kinerja               | Rumus peringkat (rata-rata + 0,01 × jumlah kegiatan) belum punya dasar               | **Sudah dijawab: rumus berasal dari kebijakan BPS Kabupaten Bengkulu Selatan.** Tulis demikian di Bab IV, lihat bagian 3.5 |
| CSUQ                            | Menyebut kualitas antarmuka mencakup pernyataan 16–19                                | **Sudah diperiksa ke Lewis (1995): Anda benar.** Butir 16–18 kualitas antarmuka; butir 19 tidak masuk subskala mana pun. Perbaiki menjadi 16–18. Lihat bagian 3.6 |
| CSUQ                            | Ambang "di atas 5,0 berarti baik" belum punya rujukan                                | **Sudah disiapkan dua dasar yang bisa dirujuk** (rentang kelas interval dan nilai acuan Sauro & Lewis). Lihat bagian 3.6 |
| Tabel penelitian terkait        | Kebaruan disandarkan pada teknologi ("CodeIgniter konvensional" vs "Node.js modern") | Argumen teknologi mudah dipatahkan. Sandarkan kebaruan pada **keterhubungan alur** (kegiatan → alokasi → honor → surat → progres → penilaian dalam satu sistem) |

### 3.2 Draf isi Performance Testing

> **Cara membaca bagian ini.** Bagian A adalah **teks yang disalin apa adanya** ke
> subbab Performance Testing di Bab II. Bagian B adalah **catatan untuk Anda**,
> jangan disalin ke naskah.

#### A. Teks siap salin ke Bab II

Salin mulai dari sini sampai sebelum tulisan "Bagian B".

---

Pengujian kinerja (_performance testing_) pada penelitian ini dilakukan untuk
mengukur dua hal. Pertama, kecepatan pemuatan tampilan sistem di peramban. Kedua,
lama pengerjaan tugas administratif sebelum dan sesudah sistem digunakan.
Pengukuran kedua diperlukan karena manfaat utama sistem terletak pada pekerjaan
berulang yang digantikan, dan hal itu tidak tercakup oleh metrik pemuatan halaman.

Pengukuran kecepatan pemuatan tampilan menggunakan Google Lighthouse, alat audit
terbuka yang tersedia pada peramban Google Chrome. Lighthouse menghasilkan skor
kinerja 0-100 berdasarkan lima metrik, yaitu:

1. _First Contentful Paint_ (FCP): waktu hingga konten pertama tampil.
2. _Largest Contentful Paint_ (LCP): waktu hingga elemen terbesar di layar tampil.
3. _Total Blocking Time_ (TBT): lama halaman tidak dapat merespons masukan pengguna
   selama dimuat.
4. _Cumulative Layout Shift_ (CLS): besar pergeseran tata letak saat halaman dimuat.
5. _Speed Index_: kecepatan isi halaman terlihat lengkap.

Ambang penilaian setiap metrik mengikuti dokumentasi resmi Lighthouse (Google,
2024) sebagaimana disajikan pada Tabel 2.x.

**Tabel 2.x Ambang Penilaian Metrik Google Lighthouse**

| Metrik | Baik | Perlu perbaikan | Buruk |
| --- | --- | --- | --- |
| Skor kinerja keseluruhan | 90-100 | 50-89 | 0-49 |
| _First Contentful Paint_ | <= 1,8 detik | 1,8-3,0 detik | > 3,0 detik |
| _Largest Contentful Paint_ | <= 2,5 detik | 2,5-4,0 detik | > 4,0 detik |
| _Total Blocking Time_ | <= 200 milidetik | 200-600 milidetik | > 600 milidetik |
| _Cumulative Layout Shift_ | <= 0,1 | 0,1-0,25 | > 0,25 |
| _Speed Index_ | <= 3,4 detik | 3,4-5,8 detik | > 5,8 detik |

Skor kinerja keseluruhan bukan rata-rata sederhana dari kelima metrik, melainkan
hasil pembobotan yang berbeda untuk tiap metrik dan dapat berubah antarversi
Lighthouse. Karena itu, versi Lighthouse yang dipakai saat pengujian perlu
dicantumkan pada laporan hasil pengujian.

Perlu ditegaskan bahwa Lighthouse mengukur kecepatan pemuatan tampilan di sisi
peramban, bukan kecepatan keseluruhan sistem. Waktu server menjawab permintaan,
kecepatan kueri basis data, dan lama pembentukan berkas PDF berada di luar
cakupannya. Karena itu, pengukuran Lighthouse dilengkapi dengan perbandingan lama
pengerjaan tugas administratif, sehingga kedua sisi kecepatan terwakili: kecepatan
sistem menampilkan halaman, dan kecepatan pengguna menyelesaikan pekerjaannya
dengan bantuan sistem.

---

#### B. Catatan untuk Anda (jangan disalin ke naskah)

**Jawaban pertanyaan "kalimat setelah tabel itu ditulis atau tidak".** Pada versi
sebelumnya, teks di bagian ini bercampur antara yang harus disalin dan catatan
saya, sehingga membingungkan. Sekarang sudah dipisah. **Seluruh isi Bagian A
disalin**, termasuk paragraf setelah tabel. Yang tidak disalin hanya Bagian B ini.

**Jawaban pertanyaan "kalimat tambahan itu ditaruh setelah apa".** Kalimat tentang
perbandingan waktu kerja sudah **tidak lagi berupa tambahan terpisah** - ia sudah
saya lebur ke dalam paragraf pembuka Bagian A (kalimat kedua dan ketiga) dan
paragraf penutup. Jadi Anda tidak perlu menyisipkannya di mana pun; cukup salin
Bagian A utuh.

**Halaman yang diuji.** Sebutkan di Bab V, bukan di Bab II: dasbor, input kegiatan,
manajemen honor, dan generate surat - yaitu halaman yang paling sering dipakai dan
paling berat datanya.

**Penomoran subbab di Bab V.** Pengujian kinerja di Bab V terdiri atas subbab
5.2.3.1 (efisiensi waktu kerja, sebagai bagian utama) dan 5.2.3.2 (kecepatan
tampilan dengan Lighthouse, sebagai pendukung). Urutan ini sengaja menempatkan
efisiensi lebih dahulu karena bagian itulah yang menjawab masalah penelitian.

### 3.3 Teori yang sudah cukup, tinggal dikaitkan

- **Black Box Testing:** Bab II sudah menyebut _Equivalence Partitioning_ dan
  _Boundary Value Analysis_. Pakai keduanya sungguhan di Bab V (bagian 5).
- **Security Testing:** skenario eskalasi hak akses horizontal sudah sesuai
  dengan perbaikan penilaian mitra (hanya PML mitra tersebut yang dapat
  menilai). Jadikan ini salah satu kasus uji utama.
- **Modified Waterfall:** contoh "perubahan aturan di tengah pengembangan" di
  Bab II dan III masih hipotetis. Ganti dengan contoh nyata (bagian 4.1).

### 3.4 Istilah dan dasar hukum batas honor: SBM atau SBML?

**Pakai SBML**, dan sebutkan dasar hukumnya. Alasannya:

- **SBM (Standar Biaya Masukan)** adalah standar biaya umum yang ditetapkan
  Kementerian Keuangan melalui Peraturan Menteri Keuangan untuk seluruh
  kementerian/lembaga setiap tahun anggaran, misalnya honorarium narasumber dan
  biaya perjalanan dinas. Honor mitra statistik tidak diatur di sana.
- **SBML (Standar Biaya Masukan Lainnya)** adalah standar biaya yang khusus berlaku
  pada satu kementerian/lembaga karena jenis pekerjaannya tidak tercakup SBM umum,
  dan penetapannya memerlukan persetujuan tertulis Menteri Keuangan. Honor mitra
  statistik BPS termasuk kelompok ini.

Rujukan yang tepat:

> Peraturan Kepala Badan Pusat Statistik Nomor 117 Tahun 2021 tentang Standar Biaya
> Masukan Lainnya Kegiatan Statistik untuk Petugas Pendataan, Pemeriksaan, dan
> Pengolahan di Lingkungan Badan Pusat Statistik.

Peraturan ini ditetapkan 31 Desember 2021 atas dasar persetujuan tertulis Menteri
Keuangan Nomor S-694/MK.02/2019 tanggal 23 September 2019, dan memuat satuan biaya
untuk petugas pendataan, pemeriksaan, dan pengolahan - persis peran yang dijalankan
mitra statistik dan PML pada sistem Anda.

**Yang perlu Anda konfirmasi ke Tim Keuangan:** apakah besaran yang mereka pakai
sehari-hari mengacu langsung ke Perka 117/2021, atau ke petunjuk pelaksanaan
kegiatan dan pengelolaan anggaran BPS tahun anggaran berjalan yang biasanya terbit
setiap awal tahun. Bila yang kedua, rujuk keduanya: Perka 117/2021 sebagai dasar,
dan petunjuk pelaksanaan tahun berjalan sebagai besaran yang dipakai.

**Konsekuensi penulisan:** ganti seluruh "SBM" menjadi "SBML" di Bab I sampai Bab V
bila yang dimaksud adalah batas honor mitra. Draf Bab IV dan Bab V sudah sebagian
memakai SBML; lakukan pemeriksaan menyeluruh dengan fitur _Find_ agar tidak
tercampur.

### 3.5 Dasar rumus pemeringkatan mitra

Rumus `nilai akhir = rata-rata nilai + (0,01 x jumlah kegiatan)` berasal dari
kebijakan BPS Kabupaten Bengkulu Selatan, bukan dari metode pengambilan keputusan
yang dikutip dari pustaka. Ini **bukan kelemahan**, asalkan ditulis apa adanya.
Kalimat yang disarankan untuk Bab II atau Bab IV:

> Pemeringkatan mitra pada sistem ini mengikuti kebijakan yang telah berjalan di
> BPS Kabupaten Bengkulu Selatan, yaitu menggabungkan nilai kualitas kerja mitra
> dengan intensitas keikutsertaannya dalam kegiatan. Nilai akhir dihitung sebagai
> rata-rata nilai ditambah 0,01 dikali jumlah kegiatan yang diikuti mitra pada
> triwulan tersebut. Penambahan kecil tersebut berfungsi sebagai pembeda ketika dua
> mitra memperoleh rata-rata nilai yang sama, dengan mengutamakan mitra yang lebih
> banyak mengerjakan kegiatan.

Sebutkan pula bahwa rumus itu diperoleh melalui wawancara dengan pihak satuan kerja
pada tahap analisis kebutuhan, sehingga jelas asalnya dan dapat ditelusuri.

Bila penguji bertanya mengapa tidak memakai metode seperti SMART, SAW, atau MOORA
(sebagaimana dikutip pada rujukan [22]), jawabannya: sistem ini bertugas menjalankan
kebijakan penilaian yang sudah berlaku di satuan kerja, bukan merancang metode
penilaian baru. Mengganti rumus satker dengan metode lain justru membuat hasilnya
tidak dapat dipakai.

### 3.6 Perbaikan bagian CSUQ

Ada tiga perbaikan. Masing-masing disebutkan kalimat lama yang dicari, tindakannya,
dan teks penggantinya.

#### a. Perbaiki pengelompokan butir - **ganti kalimat**

> **Cari di Bab II:** kalimat pada subbab CSUQ yang menyebut kualitas antarmuka
> mencakup butir **16-19**
> **Tindakan:** ganti angkanya, lalu tambahkan satu kalimat sesudahnya

**Teks pengganti (salin apa adanya):**

> Kuesioner CSUQ terdiri atas 19 pernyataan yang dikelompokkan menjadi tiga
> dimensi, yaitu kegunaan sistem (butir 1 sampai 8), kualitas informasi (butir 9
> sampai 15), dan kualitas antarmuka (butir 16 sampai 18). Butir ke-19 tidak
> termasuk salah satu dimensi tersebut, melainkan merupakan pernyataan kepuasan
> menyeluruh yang hanya diperhitungkan pada skor keseluruhan. Lewis (1995)
> melaporkan koefisien alfa Cronbach sebesar 0,93 untuk dimensi kegunaan sistem,
> 0,91 untuk kualitas informasi, 0,89 untuk kualitas antarmuka, dan 0,95 untuk skor
> keseluruhan, yang menunjukkan keandalan instrumen tergolong tinggi.

Dugaan Anda benar: butir 16-18 adalah kualitas antarmuka, bukan 16-19. Pada analisis
faktor Lewis, butir ke-19 memuat pada dua faktor sekaligus sehingga tidak
dimasukkan ke dimensi mana pun.

#### b. Tambah dasar penafsiran skor - **tambahkan paragraf baru**

> **Cari di Bab II:** kalimat yang menyebut ambang "di atas 5,0 berarti baik"
> **Tindakan:** **ganti kalimat itu** dengan paragraf dan tabel berikut. Letaknya
> **setelah** paragraf pengelompokan butir pada poin (a), dan **sebelum** paragraf
> arah skala pada poin (c).

**Teks pengganti (salin apa adanya):**

> Skor tiap dimensi dihitung sebagai rata-rata jawaban seluruh butir pada dimensi
> tersebut dari seluruh responden. Penafsiran skor menggunakan rentang kelas
> interval. Dengan skala 1 sampai 7 yang dibagi menjadi lima kategori, lebar tiap
> kelas adalah (7 - 1) dibagi 5, yaitu 1,2, sehingga diperoleh rentang kategori
> sebagaimana disajikan pada Tabel 2.x.
>
> **Tabel 2.x Kategori Penafsiran Skor CSUQ**
>
> | Rentang skor | Kategori |
> | --- | --- |
> | 1,00 - 2,20 | Sangat tidak puas |
> | 2,21 - 3,40 | Tidak puas |
> | 3,41 - 4,60 | Cukup |
> | 4,61 - 5,80 | Puas |
> | 5,81 - 7,00 | Sangat puas |
>
> Sebagai pembanding dari penelitian terdahulu, Sauro dan Lewis (2016) menghimpun
> hasil 21 studi kegunaan dan memperoleh rata-rata skor keseluruhan sebesar 2,82
> pada skala aslinya yang arahnya terbalik. Bila arah skalanya disamakan dengan
> kuesioner pada penelitian ini, angka tersebut setara dengan 5,18. Dengan
> demikian, skor keseluruhan di atas 5,18 dapat dinyatakan lebih baik daripada
> rata-rata sistem yang pernah diukur menggunakan kuesioner ini.

#### c. Sebutkan arah skala - **tambahkan paragraf penutup**

> **Tindakan:** tambahkan sebagai **paragraf terakhir** subbab CSUQ, setelah tabel
> kategori pada poin (b)

**Teks pengganti (salin apa adanya):**

> Kuesioner CSUQ dalam bentuk aslinya menggunakan skala dengan angka 1 berarti
> sangat setuju dan angka 7 berarti sangat tidak setuju, sehingga skor yang lebih
> kecil menunjukkan kegunaan yang lebih baik. Pada penelitian ini arah skala dibalik
> menjadi angka 1 berarti sangat tidak setuju dan angka 7 berarti sangat setuju,
> agar penafsirannya sejalan dengan kategori pada Tabel 2.x, yaitu semakin tinggi
> skor semakin baik. Pembalikan arah skala ini tidak mengubah isi pernyataan maupun
> keandalan instrumen, dan telah diperhitungkan saat membandingkan hasil dengan
> nilai acuan dari penelitian terdahulu.

---

## 4. Bab III — Metode Penelitian

### 4.1 Masalah yang perlu diperbaiki

| Lokasi                     | Masalah                                                                                        | Saran                                                                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.2 Tahapan Penelitian     | Sitasi bernomor [11], [18], [22]–[28], padahal pedoman memakai APA 7                           | **Tabel penggantinya sudah disiapkan** di `draf-revisi-pustaka.md` bagian 5                                                                                                                                 |
| 3.2                        | Frasa kabur: "strategi input data hibrida", "prinsip _Rapid Development_", "simulasi serangan" | Sudah dijabarkan satu per satu di bagian 4.3 |
| 3.2 Implementation         | Menyebut "middleware otentikasi JWT"                                                           | Sistem memakai token bertanda tangan HMAC-SHA256 buatan sendiri. Perbedaannya dengan JWT dijelaskan di bagian 4.4 |
| 3.2 Deployment             | Menyebut VPS, Nginx, dan FortiClient VPN                                                       | **Sudah dikonfirmasi:** hosting cPanel milik BPS, diakses dari luar kantor lewat FortiClient VPN BPS, bukan hosting umum. Ganti penyebutan VPS dan Nginx |
| 2.x Security Testing + 3.2 | Ruang lingkup keamanan dibatasi karena "hanya dapat diakses lewat intranet/VPN"                | **Sudah dikonfirmasi: alasan ini sah.** Sistem hanya dapat diakses dari jaringan BPS atau lewat FortiClient VPN, sehingga pembatasan ruang lingkup pada eskalasi hak akses antarperan dapat dipertahankan |
| Gambar 3 Kerangka Pikir    | Kolom permasalahan dan tujuan masih versi lama                                                 | Isi pengganti keempat kolomnya sudah disiapkan di bagian 4.5 |
| 3.1.3 Modified Waterfall   | Contoh umpan balik antar-tahap masih hipotetis                                                 | Pakai empat contoh nyata di bagian 4.2, beserta cara menuliskannya di bagian 4.2.1 |

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

### 4.2.1 Cara menuliskan contoh umpan balik di naskah

Keempat contoh di atas jangan ditulis sebagai daftar mentah di Bab III. Susun
sebagai paragraf yang menerangkan mengapa metode ini dipilih, misalnya:

> Pemilihan Modified Waterfall terbukti sesuai dengan keadaan di lapangan. Selama
> pengembangan berlangsung, ditemukan empat perubahan kebutuhan yang mengharuskan
> peneliti kembali ke tahap perancangan tanpa mengulang seluruh siklus. Perubahan
> pertama menyangkut pembagian honor mitra yang periode kerjanya melintasi dua
> bulan. Rancangan awal membagi honor dalam satuan rupiah, namun setelah
> dikonfirmasi kepada Tim Keuangan, pembagian diubah mengikuti muatan pekerjaan
> karena surat perjanjian kerja ditulis berdasarkan volume pekerjaan, bukan nilai
> rupiahnya. Perubahan ini berdampak pada rancangan basis data, yaitu penambahan
> kolom volume pada tabel pembebanan honor.
>
> Perubahan kedua menyangkut penomoran surat. Rancangan awal mengikat nomor surat
> pada rentang tanggal bebas, sehingga seorang mitra berpotensi memperoleh beberapa
> nomor surat untuk pekerjaan pada bulan yang sama. Rancangan kemudian diubah
> menjadi satu surat per mitra per bulan yang dilengkapi status aktif dan batal.
>
> Perubahan ketiga menyangkut penghapusan data mitra. Rancangan awal mengizinkan
> mitra dihapus, namun penghapusan tersebut ikut menghilangkan surat dan memutus
> riwayat alokasi mitra, sehingga rancangan diubah menjadi penonaktifan mitra.
> Perubahan keempat menyangkut kewenangan mengubah batas honor bulanan, yang
> semula hanya dimiliki Admin, kemudian diberikan pula kepada Tim Keuangan karena
> pengendalian batas honor merupakan pekerjaan mereka sehari-hari.
>
> Keempat perubahan tersebut berasal dari umpan balik pengguna pada tahap
> implementasi dan pengujian, dan seluruhnya dapat diakomodasi tanpa mengulang
> tahap analisis dari awal. Hal ini menunjukkan bahwa mekanisme umpan balik
> antartahap pada Modified Waterfall sesuai dengan karakteristik sistem
> administrasi pemerintahan yang aturannya dapat berubah selama pengembangan
> berlangsung.

Perhatikan pola tiap paragraf: **apa rancangan awalnya, apa yang ditemukan, apa
perubahannya, dan tahap mana yang terdampak.** Pola itu yang membuktikan adanya
umpan balik antartahap, bukan sekadar menyebut bahwa metodenya fleksibel.

### 4.3 Frasa kabur pada subbab 3.2 dan gantinya

Tiga frasa berikut tidak dapat dibuktikan atau tidak menggambarkan apa yang
sebenarnya dikerjakan. Penguji biasanya menanyakan justru frasa semacam ini karena
terdengar canggih tetapi tidak jelas isinya.

| Frasa lama | Masalahnya | Ganti menjadi |
| --- | --- | --- |
| "strategi input data hibrida" | Tidak ada istilah baku semacam ini, dan tidak jelas apa yang hibrida | "sumber progres kegiatan dibedakan menjadi dua: kegiatan yang memakai FASIH dan kegiatan yang progresnya diisi PML melalui sistem" |
| "prinsip _Rapid Development_" | Merujuk buku McConnell (1996) yang isinya kumpulan praktik, bukan satu prinsip tunggal; pemakaiannya di sini tidak dijelaskan | Sebut praktik yang benar-benar dipakai, misalnya "pengembangan dilakukan bertahap per modul dan setiap modul langsung diuji, agar kesalahan ditemukan lebih awal (McConnell, 1996)" |
| "simulasi serangan" | Terdengar seperti uji penetrasi menyeluruh, padahal yang dilakukan adalah pemanggilan API memakai token peran lain | "pengujian dilakukan dengan memanggil API sistem memakai token milik peran yang tidak berwenang, untuk memastikan pembatasan hak akses ditegakkan di sisi server, bukan hanya disembunyikan pada tampilan" |

Frasa ketiga penting diperbaiki karena berkaitan dengan ruang lingkup. Menulis
"simulasi serangan" berarti Anda mengklaim melakukan uji penetrasi, dan penguji
berhak menanyakan alat serta metodologinya (OWASP, misalnya). Menulis apa adanya
justru lebih aman dan tetap sesuai dengan yang Anda kerjakan.

### 4.4 Perbedaan token HMAC-SHA256 dengan JWT

Naskah Bab III menyebut "middleware otentikasi JWT", padahal sistem tidak memakai
JWT. Perbedaannya perlu Anda pahami karena kemungkinan besar ditanya.

**Persamaannya:** keduanya sama-sama token yang dititipkan ke peramban, dikirim
kembali pada setiap permintaan, dan ditandatangani secara kriptografis sehingga
isinya tidak dapat diubah pengguna tanpa ketahuan. Keduanya juga sama-sama tidak
menyimpan sesi di server (_stateless_).

**Perbedaannya:**

| Aspek | JWT (JSON Web Token) | Token sistem ini |
| --- | --- | --- |
| Bentuk | Standar baku (RFC 7519): header, payload, dan signature dalam format JSON yang dikodekan Base64 | Bentuk sederhana buatan sendiri: data sesi digabung dengan tanda tangannya |
| Cara menandatangani | Beberapa pilihan algoritma (HS256, RS256, ES256, dan lain-lain) | Satu cara saja, yaitu HMAC-SHA256 |
| Pustaka | Umumnya memakai pustaka pihak ketiga, misalnya `jsonwebtoken` | Memakai modul `crypto` bawaan Node.js, tanpa pustaka tambahan |
| Pencabutan sesi | Tidak ada mekanisme bawaan; token yang sudah terbit berlaku sampai kedaluwarsa | Token memuat nomor versi yang dicocokkan dengan basis data, sehingga seluruh sesi lama dapat dicabut seketika saat kata sandi diganti |

Perlu ditegaskan: **HMAC-SHA256 bukan lawan dari JWT.** HMAC-SHA256 adalah cara
menandatanganinya, dan JWT dengan algoritma HS256 sebenarnya juga memakai
HMAC-SHA256. Yang berbeda adalah pembungkusnya: sistem ini tidak mengikuti format
baku JWT, melainkan memakai format sendiri yang lebih sederhana.

Kalimat pengganti untuk Bab III:

> Keamanan sesi diterapkan menggunakan token bertanda tangan HMAC-SHA256 yang
> dibangkitkan memakai modul kriptografi bawaan Node.js. Token memuat identitas
> pengguna, perannya, masa berlaku, dan nomor versi sesi. Nomor versi tersebut
> dicocokkan dengan data pengguna pada setiap permintaan, sehingga penggantian kata
> sandi otomatis mencabut seluruh sesi lama pada perangkat mana pun.

Bila ditanya mengapa tidak memakai JWT, jawaban yang jujur dan kuat: kebutuhan
sistem ini hanya menandatangani sedikit data untuk satu aplikasi, sehingga format
baku JWT yang dirancang untuk pertukaran antarlayanan tidak diperlukan, sementara
pencabutan sesi yang dibutuhkan justru tidak disediakan JWT secara bawaan.

### 4.5 Isi pengganti Gambar 3 Kerangka Pikir

Susun ulang keempat kolom kerangka pikir mengikuti struktur dua pokok masalah.

**Kolom 1 - Permasalahan**

1. Administrasi kontrak dan honor mitra masih dikerjakan manual dan tidak terhubung:
   SPK dan BAST diketik satu per satu, batas honor SBML dicek manual dan tidak
   mencegah kelebihan, serta data mitra dan dokumen tersebar.
2. Pemantauan progres dan penilaian kinerja mitra belum terpusat: progres FASIH dan
   Non-FASIH tersimpan terpisah, tidak ada pengingat tenggat, penilaian dapat diubah
   siapa pun, dan peringkat triwulan dihitung manual.

**Kolom 2 - Tujuan Penelitian**

1. Membangun fitur administrasi dan pengendalian honor mitra: pembuatan SPK dan BAST
   otomatis dengan penomoran yang tidak ganda, peringatan otomatis batas SBML, serta
   basis data terpusat beserta penyimpanan dokumen dan pemilihan mitra per wilayah.
2. Membangun fitur pemantauan dan penilaian mitra: dasbor progres seluruh kegiatan,
   notifikasi tenggat dan dokumen, serta penilaian yang hanya dapat diisi PML mitra
   tersebut dengan pemeringkatan otomatis per triwulan.

**Kolom 3 - Solusi yang Diajukan**

Pengembangan Sistem Informasi SIKAMI menggunakan metode Modified Waterfall, dengan
React.js pada sisi peramban, Express.js (Node.js) pada sisi server, dan MySQL
sebagai basis data.

**Kolom 4 - Kriteria Evaluasi**

1. Pengujian fungsionalitas (_Black Box_) dengan teknik _Equivalence Partitioning_
   dan _Boundary Value Analysis_.
2. Pengujian keamanan hak akses (eskalasi hak akses vertikal dan horizontal).
3. Pengujian kinerja dan efisiensi proses: perbandingan waktu pengerjaan tugas
   administratif sebelum dan sesudah sistem digunakan (utama), dilengkapi
   pengukuran kecepatan tampilan dengan Google Lighthouse (pendukung).
4. Pengujian kegunaan dengan kuesioner CSUQ.

> Perhatikan bahwa kriteria evaluasi nomor 3 kini memuat **dua** hal, menyesuaikan
> subbab 5.2.3 yang sudah dipecah menjadi kecepatan tampilan dan efisiensi waktu.
> Bila kotak pada gambar terlalu sempit, cukup tulis "Pengujian kinerja (Lighthouse
> dan perbandingan waktu kerja)".

---

## 5. Rencana Bab V — Evaluasi yang sejalur

> **Bagian ini sudah dikembangkan menjadi dokumen tersendiri.** Pakai tiga berkas
> berikut, bukan rencana ringkas di bawah:
>
> - `draf-bab5-implementasi.md` — subbab 5.1 Implementasi
> - `draf-bab5-evaluasi.md` — subbab 5.2 Evaluasi, panduan pengujian, kuesioner CSUQ
> - `draf-bab5-penerapan-pemeliharaan.md` — subbab 5.3 Penerapan dan 5.4 Pemeliharaan
>
> Isi di bawah tetap disimpan sebagai rencana awal. Bila berbeda, yang berlaku
> adalah ketiga dokumen itu, karena kasus ujinya sudah dilengkapi sampai mencakup
> seluruh KF (47 kasus _black box_ dan 16 kasus keamanan) dan sudah ditambah dua
> hal yang belum ada di rencana awal: **perbandingan waktu kerja sebelum dan
> sesudah sistem** (subbab 5.2.3.2) serta **tabel rantai masalah–tujuan–bukti
> pengujian** (subbab 5.2.5.1).

### 5.1 Pengujian fungsionalitas (_black box_)

Setiap kasus uji merujuk ke satu KF di Bab IV. Contoh kasus yang memakai
_Boundary Value Analysis_ (BVA) dan _Equivalence Partitioning_ (EP):

| Kode  | KF    | Skenario                                          | Masukan                                    | Hasil yang diharapkan                                                 |
| ----- | ----- | ------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| BB-01 | KF-06 | Honor bulanan tepat di bawah batas (BVA)          | Batas Rp3.000.000; total mitra Rp2.999.999 | Tersimpan tanpa peringatan                                            |
| BB-02 | KF-06 | Honor bulanan tepat sama dengan batas (BVA)       | Total Rp3.000.000                          | Tersimpan tanpa peringatan                                            |
| BB-03 | KF-06 | Honor bulanan melebihi batas (BVA)                | Total Rp3.000.001                          | Peringatan tampil; data tersimpan hanya bila dikonfirmasi             |
| BB-04 | KF-05 | Honor lintas dua bulan dibagi menurut jumlah hari | Periode 15 Jan–15 Feb, beban 10            | Muatan dan honor terbagi dua bulan; jumlahnya sama dengan total honor |
| BB-05 | KF-11 | SPK dicetak ulang                                 | Mitra yang sudah punya SPK bulan itu       | Nomor surat sama dengan cetakan pertama                               |
| BB-06 | KF-11 | BAST sebelum SPK                                  | Mitra tanpa SPK                            | BAST tidak dibuat; mitra ditandai belum memiliki SPK                  |
| BB-07 | KF-14 | Nilai di luar rentang (BVA)                       | Nilai 0 dan 11                             | Ditolak                                                               |
| BB-08 | KF-14 | Nilai di batas rentang (BVA)                      | Nilai 1 dan 10                             | Tersimpan                                                             |
| BB-09 | KF-07 | Progres melebihi beban kerja                      | Beban 20, total progres 21                 | Ditolak dengan pesan galat                                            |
| BB-10 | KF-10 | Pengingat tenggat                                 | Tanggal selesai tahap 3 hari lagi          | Notifikasi tenggat tampil untuk Ketua Tim                             |

[Lengkapi hingga setiap KF punya minimal satu kasus uji.]

> Catatan: aturan batas di aplikasi adalah "melebihi", artinya honor yang
> **sama dengan** batas tidak memicu peringatan (BB-02). Tulis aturan ini
> dengan jelas di Bab IV agar hasil uji tidak dianggap salah.

### 5.2 Pengujian keamanan hak akses

| Kode   | Jenis      | Skenario                                                 | Hasil yang diharapkan |
| ------ | ---------- | -------------------------------------------------------- | --------------------- |
| SEC-01 | Horizontal | PML A menyimpan penilaian untuk mitra yang diawasi PML B | Ditolak (HTTP 403)    |
| SEC-02 | Horizontal | PML A memperbarui progres mitra PML B                    | Ditolak (HTTP 403)    |
| SEC-03 | Horizontal | Ketua Tim A menyunting kegiatan milik Ketua Tim B        | Ditolak (HTTP 403)    |
| SEC-04 | Vertikal   | Pegawai biasa membuat nomor SPK atau membatalkan surat   | Ditolak (HTTP 403)    |
| SEC-05 | Vertikal   | Pegawai biasa mengubah batas SBM                         | Ditolak (HTTP 403)    |
| SEC-06 | Vertikal   | Pegawai biasa atau Tim Keuangan mengimpor data mitra     | Ditolak (HTTP 403)    |
| SEC-07 | Sesi       | Memakai token lama setelah kata sandi diganti            | Ditolak (HTTP 401)    |

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

| Kata di draf lama     | Padanan yang disarankan              |
| --------------------- | ------------------------------------ |
| _monitoring_          | pemantauan                           |
| _dashboard_           | dasbor                               |
| _auto-ranking_        | pemeringkatan otomatis               |
| _gatekeeper_ SBM      | peringatan batas SBML                |
| repositori digital    | penyimpanan tautan dokumen           |
| _real-time_           | langsung (hanya bila benar)          |
| silo data             | data tersimpan terpisah              |
| visibilitas informasi | (tulis konkret siapa tidak tahu apa) |
| _feedback loop_       | umpan balik                          |
| _overlapping_         | tumpang tindih                       |
| _research gap_        | celah penelitian                     |
| _novelty_             | kebaruan                             |
| _insider threats_     | ancaman dari pengguna internal       |
| _end-user_            | pengguna akhir                       |
| _Modern Tech Stack_   | teknologi yang digunakan             |
| _cutover_             | tahap akhir sebelum digunakan        |

Istilah teknis baku yang boleh tetap asing (cetak miring, jelaskan sekali):
_black box testing_, _boundary value analysis_, _use case_, _activity diagram_,
_Entity Relationship Diagram_, _RESTful API_, _hash_, _least privilege_.
