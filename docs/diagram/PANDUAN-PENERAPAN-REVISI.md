# Panduan Penerapan Revisi ke Naskah Skripsi

Berkas ini menjawab keluhan Anda: draf revisi menyebut "bagian 3.4", "bagian 4.3",
tetapi tidak jelas **kalimat mana yang diganti, ditaruh setelah apa, dan jadi apa**.

Di sini setiap perubahan ditulis dengan pola tetap:

> **Di naskah Anda:** subbab berapa
> **Cari kalimat:** potongan kalimat lama yang harus Anda cari dengan Ctrl+F
> **Tindakan:** ganti / tambahkan setelah / hapus
> **Teks pengganti:** ada di berkas mana, bagian mana

Kerjakan berurutan dari atas ke bawah. Beri tanda centang di kolom terakhir setiap
selesai satu butir.

---

## Peta berkas draf

Semua berkas ada di folder `docs/diagram/`. Versi Word-nya ada di
`docs/diagram/word/`.

| Berkas markdown                       | Berkas Word                        | Isi                                                          |
| ------------------------------------- | ---------------------------------- | ------------------------------------------------------------ |
| `draf-revisi-bab1-2-3-5.md`           | `Bab1-2-3-Revisi.docx`             | Bab I, Bab II, Bab III                                       |
| `draf-revisi-bab4.md`                 | `Bab4-Rancangan.docx`              | Bab IV: masalah, KF/KNF, proses bisnis, use case, basis data |
| `draf-bab4-activity-diagram.md`       | `Bab4-ActivityDiagram.docx`        | Bab IV subbab activity diagram                               |
| `draf-bab4-rancangan-antarmuka.md`    | `Bab4-RancanganAntarmuka.docx`     | Bab IV subbab rancangan antarmuka                            |
| `draf-bab5-implementasi.md`           | `Bab5-Implementasi.docx`           | **Bab V subbab 5.1** Implementasi                            |
| `draf-bab5-evaluasi.md`               | `Bab5-Evaluasi.docx`               | **Bab V subbab 5.2** Evaluasi                                |
| `draf-bab5-penerapan-pemeliharaan.md` | `Bab5-Penerapan-Pemeliharaan.docx` | **Bab V subbab 5.3 dan 5.4** Penerapan dan Pemeliharaan      |
| `draf-revisi-pustaka.md`              | `Revisi-Pustaka.docx`              | Sitasi dan daftar pustaka                                    |

**Jawaban pertanyaan Anda "berkas Bab V yang mana, ada 3":** ketiganya dipakai,
berurutan. `implementasi` untuk 5.1, `evaluasi` untuk 5.2, `penerapan-pemeliharaan`
untuk 5.3 dan 5.4. Tidak ada yang menggantikan yang lain.

---

## HALAMAN ABSTRAK, KATA KUNCI, DAN METODE ANALISIS

### A-1. Ringkasan / Abstrak - ganti seluruhnya

> **Di naskah Anda:** bagian Ringkasan pada makalah seminar proposal, dan nantinya
> halaman Abstrak pada buku skripsi
> **Tindakan:** ganti seluruh paragrafnya

> **Penting - ada dua versi, pilih sesuai tempatnya.** Isi keduanya sama persis,
> kecuali kalimat terakhir:
>
> - **Versi proposal (Ringkasan)** - belum ada hasil, karena penelitiannya memang
>   belum dikerjakan. **Buang kalimat terakhir** yang menyebut hasil pengujian, dan
>   akhiri pada kalimat "Sistem diuji melalui ...".
> - **Versi buku skripsi (Abstrak)** - **wajib memuat hasil**. Pakai kalimat
>   terakhir itu dan isi angkanya setelah pengujian selesai.
>
> Kesalahan yang paling sering terjadi adalah menyalin ringkasan proposal apa adanya
> ke abstrak skripsi. Abstrak tanpa hasil hampir pasti ditanya penguji.

**Versi lama:**

> Fragmentasi data monitoring dan pengelolaan administrasi manual di BPS Kabupaten
> Bengkulu Selatan mengakibatkan blindspot informasi bagi pimpinan serta inefisiensi
> validasi keuangan. Penelitian ini bertujuan mengembangkan sistem informasi terpadu
> "OPTIMA" guna mengintegrasikan tata kelola kegiatan teknis dan administrasi dalam
> satu ekosistem digital. Menggunakan metode Modified Waterfall serta teknologi
> Node.js dan React.js, solusi ini menghadirkan Dashboard Monitoring Terpusat sebagai
> sumber data tunggal, Digital Repository Terintegrasi untuk sentralisasi arsip
> dokumen, algoritma Auto-Ranking untuk evaluasi kinerja objektif, serta SBM
> Gatekeeper untuk validasi anggaran otomatis. Pengujian sistem meliputi Black Box,
> Performance, Security, dan Usability Testing (CSUQ) untuk menjamin kualitas,
> keamanan, dan akuntabilitas sistem sesuai standar GSBPM.

**Versi pengganti:**

> Pengelolaan mitra statistik di BPS Kabupaten Bengkulu Selatan masih dikerjakan
> secara manual dan tersebar di beberapa berkas kerja yang tidak saling terhubung.
> Surat perjanjian kerja dan berita acara serah terima diketik serta dinomori satu
> per satu setiap bulan, batas honor mitra diperiksa secara manual sehingga
> kelebihannya baru diketahui setelah alokasi seluruh tim digabungkan, dan progres
> kegiatan tersimpan terpisah antara aplikasi FASIH dengan berkas kerja masing-masing
> tim sehingga pimpinan tidak dapat memantau seluruh tim dalam satu tampilan.
> Penelitian ini mengembangkan sistem informasi SIKAMI yang menyatukan administrasi
> kontrak dan honor mitra dengan pemantauan progres serta penilaian kinerjanya dalam
> satu basis data terpusat. Sistem dikembangkan menggunakan metode Modified Waterfall
> dengan React.js pada sisi peramban, Express.js pada sisi server, dan MySQL sebagai
> basis data. Sistem menyediakan pembuatan surat perjanjian kerja dan berita acara
> serah terima secara otomatis dengan penomoran yang tidak ganda, peringatan otomatis
> ketika akumulasi honor seorang mitra melampaui batas Standar Biaya Masukan Lainnya,
> dasbor pemantauan seluruh kegiatan, pengingat tenggat dan kelengkapan dokumen,
> serta pemeringkatan kinerja mitra per triwulan yang hanya dapat dinilai pengawas
> lapangan yang mengawasinya. Sistem diuji melalui pengujian fungsionalitas, keamanan
> hak akses, kinerja dan efisiensi proses kerja, serta kegunaan menggunakan kuesioner
> Computer System Usability Questionnaire. **[Untuk abstrak buku skripsi, lanjutkan:]**
> Hasil pengujian menunjukkan [lengkapi setelah pengujian selesai]. **[Untuk ringkasan
> proposal, berhenti di sini - jangan tulis kalimat hasil.]**

**Apa yang diubah dan mengapa:**

| Yang diubah | Alasan |
| --- | --- |
| "blindspot informasi", "ekosistem digital", "inefisiensi validasi keuangan" | Istilah yang terdengar mentereng tetapi tidak menjelaskan apa yang sebenarnya terjadi. Diganti dengan kejadian yang bisa dibayangkan pembaca |
| "Dashboard Monitoring Terpusat", "Digital Repository Terintegrasi", "Auto-Ranking", "SBM Gatekeeper" | Ini nama fitur karangan sendiri, bukan istilah baku. Pembaca di luar penelitian Anda tidak tahu artinya, dan penguji bisa menanyakan dasar penamaannya. Diganti dengan penyebutan fungsinya |
| **"SBM Gatekeeper"** khususnya | Kata _gatekeeper_ berarti penjaga gerbang yang **menolak**. Sistem Anda **tidak menolak**, hanya memperingatkan lalu meminta konfirmasi. Ini klaim yang tidak sesuai kenyataan dan mudah dipatahkan saat demo |
| "SBM" | Yang mengatur honor mitra adalah SBML (Standar Biaya Masukan **Lainnya**) |
| "OPTIMA" | Sesuaikan dengan nama final yang Anda pakai |
| "sesuai standar GSBPM" | Tidak ada pengujian kesesuaian GSBPM di penelitian ini, jadi ini klaim tanpa bukti |
| Ditambah kalimat hasil | Hanya untuk **abstrak buku skripsi**, yang wajib memuat hasil. Untuk **ringkasan proposal**, kalimat ini dibuang karena penelitiannya belum dikerjakan |

> **Kalau "Ringkasan" di pedoman Anda berarti ringkasan panjang** (dua sampai tiga
> halaman, bukan satu paragraf seperti abstrak), maka versi di atas dipakai sebagai
> kerangkanya saja, lalu tiap bagian dikembangkan menjadi satu paragraf tersendiri:
> latar belakang dan masalah, tujuan, metode, rancangan sistem, pengujian, dan hasil.
> Periksa pedoman skripsi Anda untuk memastikan panjang yang diminta.

### A-2. Kata kunci - ganti

**Versi lama:** Sistem Informasi Terpadu, Monitoring Kegiatan, SBM Gatekeeper,
Evaluasi Kinerja, Digital Repository

**Versi pengganti:** Mitra Statistik, Sistem Informasi Administrasi, Pemantauan
Kegiatan, Standar Biaya Masukan Lainnya, Modified Waterfall

**Alasannya:** kata kunci berfungsi agar penelitian Anda ditemukan orang yang
mencari topik serupa. Dua kata kunci lama, yaitu "SBM Gatekeeper" dan "Digital
Repository", adalah istilah buatan sendiri - tidak ada yang mencarinya, sehingga
justru membuat skripsi Anda tidak ditemukan. Kata kunci pengganti memakai istilah
yang benar-benar dipakai orang saat mencari: objeknya (mitra statistik), bidangnya
(sistem informasi administrasi, pemantauan kegiatan), aturan yang jadi dasar (SBML),
dan metodenya (Modified Waterfall).

### A-3. Rencana metode analisis - perbaiki

**Versi lama:**

> Rencana metode analisis mengikuti metode SDLC Modified Waterfall yang menggunakan
> analisis deskriptif kualitatif untuk memetakan dan menganalisis kebutuhan sistem
> pada tahap awal, serta pengujian Black Box, Performance, Security, dan CSUQ untuk
> menganalisis fungsionalitas dan kesesuaian sistem pada tahap akhir.

**Versi pengganti:**

> Analisis pada penelitian ini mengikuti tahapan metode Modified Waterfall dan
> dilakukan dengan dua pendekatan sesuai jenis datanya. Pada tahap analisis
> kebutuhan, data hasil wawancara dan observasi dianalisis secara deskriptif
> kualitatif untuk memetakan alur kerja yang sedang berjalan, menemukan letak
> permasalahannya, dan merumuskan kebutuhan sistem. Pada tahap pengujian, analisis
> dilakukan terhadap empat jenis data. Hasil pengujian fungsionalitas dan pengujian
> keamanan hak akses dianalisis dengan membandingkan keluaran sistem terhadap hasil
> yang diharapkan pada setiap kasus uji, lalu dihitung persentase kasus yang
> berhasil. Hasil pengujian kinerja dan efisiensi dianalisis dengan membandingkan
> lama pengerjaan tugas administratif sebelum dan sesudah sistem digunakan, serta
> membandingkan skor pemuatan halaman terhadap ambang yang ditetapkan. Hasil
> kuesioner Computer System Usability Questionnaire dianalisis secara deskriptif
> kuantitatif dengan menghitung rata-rata skor tiap dimensi, lalu ditafsirkan
> menggunakan rentang kategori yang telah ditetapkan.

**Yang diperbaiki:**

| Masalah versi lama | Perbaikan |
| --- | --- |
| Menyebut "Performance" saja | Diganti "kinerja dan efisiensi proses", mengikuti perubahan nama pengujian ketiga |
| Tidak menyebut **cara** menganalisisnya, hanya menyebut nama pengujiannya | Tiap jenis data kini disebut cara analisisnya: perbandingan terhadap hasil yang diharapkan, perbandingan waktu, dan perhitungan rata-rata |
| CSUQ disamakan dengan pengujian lain | CSUQ menghasilkan angka skala 1-7, jadi analisisnya deskriptif **kuantitatif**, berbeda dari analisis kualitatif di tahap awal. Ini perlu dibedakan karena penguji metodologi biasanya menanyakannya |

### A-4. Sumber data - **ini yang perlu dikoreksi**

Pertanyaan Anda: apakah benar sumber datanya data primer?

**Jawabannya: belum lengkap.** Penelitian Anda memakai **keduanya**, dan menulis
hanya "primer" berisiko ditanya penguji, karena beberapa data yang Anda pakai jelas
bukan Anda yang mengumpulkan pertama kali.

**Data primer** - Anda yang mengumpulkan langsung:

| Data | Cara memperolehnya |
| --- | --- |
| Alur kerja pengelolaan mitra yang sedang berjalan | Wawancara dengan Ketua Tim, Tim Keuangan, dan PML |
| Letak permasalahan pada tiap tahap | Observasi selama praktik kerja lapangan |
| Kebutuhan sistem | Wawancara dan diskusi saat pengembangan berlangsung |
| Hasil pengujian fungsionalitas, keamanan, dan kinerja | Pengujian yang dijalankan peneliti sendiri |
| Penilaian kegunaan sistem | Kuesioner CSUQ yang diisi pegawai |
| Perkiraan lama pengerjaan dengan cara lama | Wawancara dengan pegawai pelaksana |

**Data sekunder** - sudah ada sebelumnya, Anda tinggal memakai:

| Data | Sumbernya |
| --- | --- |
| Daftar dan profil mitra statistik | Berkas dari aplikasi SOBAT/PALAPA |
| Data alokasi dan honor mitra yang sudah berjalan | Berkas kerja Tim Keuangan |
| Besaran dan batas honor mitra | Peraturan Kepala BPS Nomor 117 Tahun 2021 |
| Dokumen kegiatan (SK, Surat Tugas, KAK) | Arsip satuan kerja |

**Kalimat pengganti untuk Bab III:**

> Penelitian ini menggunakan data primer dan data sekunder. Data primer diperoleh
> melalui wawancara dan observasi terhadap alur kerja pengelolaan mitra statistik,
> serta melalui pengujian sistem dan penyebaran kuesioner kepada pegawai. Data
> sekunder diperoleh dari dokumen dan berkas kerja yang telah ada di BPS Kabupaten
> Bengkulu Selatan, meliputi daftar mitra statistik, data alokasi dan honor mitra,
> arsip dokumen kegiatan, serta peraturan yang mengatur standar biaya honor mitra.

Menyebut keduanya justru **memperkuat** skripsi Anda, karena menunjukkan sistem
dibangun di atas data nyata satuan kerja, bukan data karangan.

---

## BAB I

### I-1. Identifikasi Masalah - ganti seluruhnya

> **Di naskah Anda:** subbab 1.2.1 Identifikasi Masalah
> **Cari kalimat:** "dapat diidentifikasi dua kelompok permasalahan pokok"
> **Tindakan:** ganti seluruh isi subbab (dua kelompok masalah beserta uraiannya)
> **Teks pengganti:** `draf-revisi-bab1-2-3-5.md` -> bagian **2.2**
> **Catatan:** strukturnya tetap dua kelompok seperti punya Anda, tetapi fakta yang
> keliru sudah diperbaiki dan ditambah rujukan pendukung baru.

### I-2. Paragraf penutup identifikasi masalah

> **Di naskah Anda:** akhir subbab 1.2.1, paragraf yang diawali "Oleh karena itu"
> **Cari kalimat:** "penelitian ini mengusulkan"
> **Tindakan:** ganti satu paragraf
> **Teks pengganti:** `draf-revisi-bab1-2-3-5.md` -> bagian **2.2.1**, di bawah judul
> "Usulan perbaikan"

### I-3. Batasan Masalah

> **Di naskah Anda:** subbab 1.2.2 Batasan Masalah
> **Tindakan:** ganti kelima butirnya
> **Teks pengganti:** `draf-revisi-bab1-2-3-5.md` -> bagian **2.3**

### I-4. Tujuan Umum

> **Di naskah Anda:** subbab 1.3.1 Tujuan Umum
> **Cari kalimat:** "untuk mengatasi fragmentasi monitoring dan disintegrasi"
> **Tindakan:** ganti satu kalimat
> **Teks pengganti:** `draf-revisi-bab1-2-3-5.md` -> bagian **2.4**, pilih Pilihan A
> atau B

### I-5. Tujuan Khusus

> **Di naskah Anda:** subbab 1.3.2 Tujuan Khusus
> **Tindakan:** ganti ketiga butirnya
> **Teks pengganti:** `draf-revisi-bab1-2-3-5.md` -> bagian **2.5**

### I-6. Manfaat Penelitian

> **Di naskah Anda:** subbab 1.4 Manfaat Penelitian
> **Cari kalimat:** "instrumen strategis dalam penerapan standar GSBPM"
> **Tindakan:** hapus frasa itu, tulis ulang manfaat per pengguna
> **Panduan:** `draf-revisi-bab1-2-3-5.md` -> bagian **2.6**

---

## BAB II

### II-1. Hapus sisa templat

> **Di naskah Anda:** subbab 2.3 "Terkait Penulisan Kutipan"
> **Tindakan:** **hapus seluruh subbab.** Itu sisa templat, bukan bagian skripsi.

### II-2. Isi subbab Performance Testing yang masih kosong

> **Di naskah Anda:** subbab Performance Testing (judulnya ada, isinya kosong)
> **Tindakan:** isi seluruhnya
> **Teks pengganti:** `draf-revisi-bab1-2-3-5.md` -> bagian **3.2**
> **Isinya:** pengertian Lighthouse, lima metrik, tabel ambang "baik/perlu
> perbaikan/buruk", batas yang tidak diukur Lighthouse, dan satu paragraf yang
> menyebut uji perbandingan waktu.

### II-3. Tambah subbab baru tentang SBML

> **Di naskah Anda:** Bab II, letakkan **setelah** subbab Tata Kelola Administrasi
> **Tindakan:** tambahkan subbab baru berjudul "Standar Biaya Masukan Lainnya (SBML)"
> **Isi:** `draf-revisi-bab1-2-3-5.md` -> bagian **2.2.4** (ada kerangka dua
> paragraf) dan bagian **3.4** (penjelasan lengkap SBM vs SBML beserta dasar
> hukumnya)

### II-4. Perbaiki angka skala sistem

> **Di naskah Anda:** subbab React, Node.js, dan Express
> **Cari kalimat:** "ribuan mitra" dan "puluhan PML secara simultan"
> **Tindakan:** ganti angkanya
> **Jadi:** sekitar 128 mitra, dan pengguna bersamaan paling banyak sekitar 20 orang

### II-5. Perbaiki klaim SBM di subbab Express.js

> **Cari kalimat:** "memastikan tidak ada alokasi anggaran yang melanggar batas"
> **Tindakan:** ganti
> **Jadi:** "memberikan peringatan dan meminta konfirmasi ketika akumulasi honor
> seorang mitra melampaui batas SBML"

### II-6. Perbaiki pengelompokan butir CSUQ

> **Di naskah Anda:** subbab CSUQ
> **Cari kalimat:** "16-19" atau "pernyataan 16 sampai 19"
> **Tindakan:** ganti menjadi **16-18**, dan tambahkan keterangan bahwa butir 19
> tidak termasuk subskala mana pun
> **Teks pengganti:** `draf-revisi-bab1-2-3-5.md` -> bagian **3.6.a** (ada tabelnya)

### II-7. Tambah dasar penafsiran skor CSUQ

> **Di naskah Anda:** subbab CSUQ, setelah penjelasan butir
> **Cari kalimat:** "di atas 5,0" atau ambang serupa
> **Tindakan:** tambahkan tabel rentang kategori beserta dasarnya
> **Teks pengganti:** `draf-revisi-bab1-2-3-5.md` -> bagian **3.6.b**
> **Penting:** rentangnya 1,00-2,20 / 2,21-3,40 / 3,41-4,60 / 4,61-5,80 / 5,81-7,00,
> bukan kelipatan satu.

### II-8. Sebutkan arah skala kuesioner

> **Tindakan:** tambahkan satu paragraf di akhir subbab CSUQ
> **Teks pengganti:** `draf-revisi-bab1-2-3-5.md` -> bagian **3.6.c**

### II-9. Sebutkan sumber rumus pemeringkatan

> **Di naskah Anda:** subbab penilaian kinerja mitra
> **Tindakan:** tambahkan paragraf yang menyebut asal rumusnya
> **Teks pengganti:** `draf-revisi-bab1-2-3-5.md` -> bagian **3.5** (paragraf yang
> ada di dalam kutipan blok)

### II-10. Perbaiki dasar kebaruan di tabel penelitian terkait

> **Di naskah Anda:** tabel Penelitian Terdahulu, kolom **Research Gap**, baris
> Susi dkk. (2024)
> **Tindakan:** ganti isi selnya

**Isi sel sekarang:**

> Fokus penelitian ini hanya pada monitoring honor dengan teknologi konvensional
> (CI). Penulis mengembangkan sistem yang mengintegrasikan monitoring honor dengan
> validasi SBM otomatis menggunakan teknologi modern (Node.js & React).

**Masalahnya.** Kebaruan Anda disandarkan pada **pilihan teknologi** - CodeIgniter
disebut "konvensional", Node.js disebut "modern". Ini mudah dipatahkan penguji
dengan satu pertanyaan: *"Kalau penelitian itu ditulis ulang memakai Node.js, apakah
penelitian Anda jadi tidak baru lagi?"* Kalau jawabannya ya, berarti kebaruan Anda
sebenarnya kosong. Lagi pula CodeIgniter bukan teknologi usang; ia masih dipakai dan
masih diperbarui.

**Isi sel pengganti:**

> Penelitian tersebut memantau honor mitra pada sisi hilir, yaitu status sudah atau
> belum dibayar, sehingga kelebihan honor baru terlihat setelah alokasi terjadi.
> Penelitian ini bekerja pada sisi hulu dengan memeriksa akumulasi honor lintas tim
> saat alokasi disimpan, serta menghubungkan data honor tersebut dengan kontrak,
> progres, dan penilaian kinerja mitra dalam satu basis data.

**Mengapa versi ini lebih kuat.** Kebaruannya kini terletak pada **cakupan dan letak
intervensi**, bukan pada bahasa pemrograman. Perbedaan ini tidak hilang walau
penelitian pembanding berganti teknologi, karena yang dibandingkan adalah apa yang
dikerjakan sistemnya.

**Baris Yogantara dkk. (2025) - penajaman, bukan perbaikan kesalahan.**

Berbeda dengan baris Susi dkk., baris ini **sudah bersandar pada cakupan**, bukan
pada teknologi, sehingga tidak bermasalah. Yang masih dapat ditajamkan hanya dua
hal: istilah asing yang belum perlu, dan pembeda terkuat yang justru belum disebut.

**Isi sel sekarang:**

> Sistem ini fokus pada kontrak & beban kerja. Penulis melengkapinya dengan fitur
> Evaluasi Kinerja (Grading) dan Verifikasi Dokumen Digital dalam satu platform
> terpadu.

**Isi sel pengganti:**

> Penelitian tersebut berhenti pada pengelolaan kontrak dan beban kerja mitra.
> Penelitian ini melanjutkan alurnya sampai pemantauan progres pekerjaan dan
> penilaian kinerja mitra, serta menambahkan pemeriksaan akumulasi honor seorang
> mitra lintas tim terhadap batas SBML yang belum tercakup pada penelitian tersebut.

**Tiga hal yang ditajamkan:**

| Yang diubah | Alasan |
| --- | --- |
| "Grading" dan "Verifikasi Dokumen Digital" | Istilah asing yang ada padanannya dalam bahasa Indonesia, dan "verifikasi dokumen digital" terdengar lebih besar daripada yang sebenarnya dikerjakan sistem, yaitu memeriksa kelengkapan tautan dokumen |
| "dalam satu platform terpadu" | Frasa yang tidak menambah informasi. Pembaca tidak jadi tahu apa yang menyatu dengan apa |
| **Ditambah pemeriksaan honor lintas tim** | Inilah pembeda terkuat yang justru belum disebut. Penelitian Yogantara dkk. mengelola beban kerja mitra, tetapi tidak menjumlahkan honor seorang mitra dari beberapa tim sekaligus untuk dibandingkan dengan batas. Fitur inilah yang paling khas pada sistem Anda |

### II-12. Pindahkan rujukan Saputro & Novita dari tabel penelitian terdahulu

> **Di naskah Anda:** tabel Penelitian Terdahulu, baris Saputro & Novita (2025)
> **Tindakan:** **keluarkan dari tabel**, pindahkan ke Bab II subbab Node.js/Express

**Alasannya.** Anda sendiri menuliskan di kolom Research Gap bahwa penelitian itu
"murni uji teknis (performance testing)". Itu justru menunjukkan ia **bukan
penelitian sejenis**. Tabel penelitian terdahulu seharusnya memuat penelitian dengan
tujuan atau bidang serupa, yaitu pengembangan sistem informasi pengelolaan mitra.
Penelitian pembandingan kecepatan _framework_ tidak masuk kategori itu, sehingga
mencantumkannya justru melemahkan tabel: penguji dapat bertanya apa hubungan uji
kecepatan _framework_ dengan tata kelola mitra statistik.

**Tempat yang tepat:** Bab II, pada subbab yang membahas Node.js atau Express,
sebagai alasan teknis pemilihan teknologi. Contoh kalimatnya:

> Express.js dipilih sebagai kerangka kerja sisi server karena kinerjanya telah
> diuji pada penelitian terdahulu. Saputro dan Novita (2025) membandingkan kinerja
> Express dengan Hono pada aplikasi pendaftaran sederhana dan memperoleh selisih
> waktu eksekusi sebesar 26,85 persen.

**Dua hal yang wajib Anda periksa sebelum menulis kalimat itu:** (1) pastikan angka
26,85 persen memang benar, dan (2) pastikan **Express yang lebih cepat**, bukan
Hono. Judul artikelnya adalah perbandingan Express **dengan Hono** - hanya satu
pembanding, bukan "framework lain" secara umum seperti yang tertulis sekarang. Bila
ternyata Hono yang lebih unggul, jangan dipakai sebagai alasan pemilihan teknologi.

**Alasan pemilihan yang lebih aman dan tidak bergantung angka orang lain:** Node.js
memakai bahasa yang sama di sisi peramban dan sisi server, sehingga aturan yang
harus sama di kedua sisi - misalnya aturan pembagian honor dan pemeriksaan hak
akses - cukup ditulis satu kali dan dipakai bersama. Ini fakta tentang sistem Anda
sendiri dan tidak dapat dipatahkan.

### II-13. Teori diagram: dua yang belum ada

Pertanyaan Anda apakah semua jenis gambar sudah ada teorinya di Bab II. Hasil
pemeriksaan:

| Jenis gambar | Dipakai di | Teori di Bab II |
| --- | --- | --- |
| Use case diagram | Bab IV | **Ada** - Booch dkk. (2005), Suendri (2018) |
| Activity diagram | Bab IV (9 gambar) | **Ada** - sumber yang sama |
| ERD | Bab IV | **Ada** - Chen (1976) |
| Diagram tulang ikan (_fishbone_) | Bab IV subbab 4.1.2 | **Belum ada** |
| _Wireframe_ rancangan antarmuka | Bab IV, 18 gambar | **Belum ada** |
| Diagram arsitektur sistem | Bab V | Sebagian - tertutupi Fielding (2000) bila subbab RESTful API jadi ditambahkan |
| Kerangka pikir | Bab III | Tidak perlu teori, sifatnya ringkasan alur penelitian |

**Yang perlu ditambahkan:**

**1. Diagram tulang ikan.** Satu paragraf saja, diletakkan dekat subbab analisis
kebutuhan. Isinya: diagram sebab-akibat yang mengelompokkan penyebab suatu masalah
ke dalam beberapa kategori, umumnya manusia, metode, mesin, dan material, sehingga
akar masalah dapat ditelusuri secara terstruktur.

> **Rujukan:** konsep ini berasal dari Kaoru Ishikawa melalui buku *Guide to Quality
> Control* (1968). **Yang sudah saya pastikan hanya penulis, judul, dan tahunnya;
> penerbit dan edisinya belum saya periksa.** Jangan ditulis sebelum Anda melihat
> katalognya sendiri. Alternatif yang lebih mudah diverifikasi: cari satu artikel
> jurnal Indonesia terbaru yang memakai diagram tulang ikan untuk analisis kebutuhan
> sistem informasi, lalu rujuk artikel itu. Untuk skripsi, cara kedua ini sama
> sahnya dan lebih mudah dipertanggungjawabkan.

**2. Wireframe.** Satu paragraf, diletakkan dekat subbab perancangan antarmuka.
Isinya: wireframe adalah kerangka tampilan yang hanya memuat susunan dan fungsi tiap
bagian layar tanpa warna dan gambar sebenarnya, dipakai agar pembahasan perancangan
terfokus pada kelengkapan informasi dan alur kerja, bukan pada pilihan warna.
Rujukan opsional: Shneiderman dkk. (2018), yang **belum saya periksa** - lihat
catatan pada berkas pustaka bagian 3b.

### II-15. Draf tiga subbab teori yang belum ada (siap salin)

> **SUDAH DIPERBARUI — jangan pakai versi di bawah ini untuk fishbone dan
> wireframe.** Ketika bagian ini ditulis, rujukan keduanya belum dapat
> dipastikan. Sekarang sudah, dan teks barunya yang **sudah bersitasi** ada di
> `PANDUAN-SITASI-FINAL.md` butir **C-6** (diagram tulang ikan) dan **C-7**
> (wireframe). Pakai yang di sana.
>
> Butir **c (HMAC-SHA256)** di bawah ini tetap berlaku apa adanya, karena
> rujukannya memang sudah ada sejak awal, yaitu Stallings dan Brown (2018).

Ketiga teks berikut **disalin apa adanya** ke Bab II. Letak penempatannya disebut
pada tiap butir.

#### a. Diagram Tulang Ikan

> **Letakkan di:** Bab II, berdekatan dengan subbab analisis kebutuhan sistem atau
> sebelum subbab UML
> **Judul subbab:** Diagram Tulang Ikan (_Fishbone Diagram_)

**Teks siap salin:**

> Diagram tulang ikan, yang juga dikenal sebagai diagram sebab-akibat atau diagram
> Ishikawa, adalah alat bantu yang digunakan untuk menelusuri penyebab suatu masalah
> secara terstruktur. Diagram ini digambarkan menyerupai kerangka ikan: kepala ikan
> memuat masalah utama yang hendak diselesaikan, sedangkan tulang-tulang yang
> mengarah ke kepala memuat kelompok penyebabnya. Pengelompokan penyebab yang umum
> dipakai terdiri atas empat kategori, yaitu manusia (_man_), metode (_method_),
> mesin atau teknologi (_machine_), dan material atau data (_material_).
>
> Diagram tulang ikan digunakan pada penelitian ini untuk memetakan penyebab
> permasalahan pada proses bisnis yang sedang berjalan. Pemetaan tersebut membantu
> memastikan bahwa kebutuhan sistem yang dirumuskan pada tahap berikutnya benar-benar
> menjawab penyebab masalah, bukan sekadar menambahkan fitur yang tidak berkaitan
> dengan persoalan di lapangan.

> **Rujukannya belum dapat saya pastikan sepenuhnya.** Konsep ini berasal dari Kaoru
> Ishikawa melalui buku *Guide to Quality Control* (1968) - penulis, judul, dan
> tahunnya sudah saya periksa, tetapi penerbit dan edisinya belum. **Dua pilihan:**
> (1) cari sendiri katalog bukunya lalu tulis lengkap, atau (2) rujuk satu artikel
> jurnal Indonesia terbaru yang memakai diagram tulang ikan untuk analisis sistem
> informasi - cara ini lebih mudah diverifikasi dan sama sahnya untuk skripsi.
> Jangan menulis entri pustaka yang belum Anda lihat sendiri.

#### b. Wireframe

> **Letakkan di:** Bab II, berdekatan dengan subbab React.js atau subbab perancangan
> sistem
> **Judul subbab:** Wireframe

**Teks siap salin:**

> _Wireframe_ adalah kerangka tampilan antarmuka yang hanya memuat susunan dan fungsi
> setiap bagian layar, tanpa warna, gambar, maupun isi yang sebenarnya. Bentuk ini
> digunakan pada tahap perancangan agar pembahasan terfokus pada kelengkapan
> informasi yang ditampilkan dan kemudahan alur kerja pengguna, bukan pada pilihan
> warna atau jenis huruf yang baru ditentukan pada tahap implementasi.
>
> Penggunaan _wireframe_ juga memudahkan penyesuaian rancangan ketika terjadi
> perubahan kebutuhan, karena mengubah kerangka tampilan jauh lebih cepat daripada
> mengubah antarmuka yang telah selesai diprogram. Hal ini sejalan dengan sifat
> metode Modified Waterfall yang memungkinkan kembali ke tahap perancangan apabila
> ditemukan kebutuhan baru pada tahap implementasi. Pada penelitian ini, rancangan
> antarmuka disusun dalam bentuk _wireframe_ untuk seluruh halaman utama sistem, dan
> hasil implementasinya ditampilkan pada bab berikutnya sebagai pembanding.

> Paragraf ini sengaja tidak memerlukan rujukan khusus karena isinya menjelaskan
> istilah dan alasan pemilihan bentuk rancangan. Bila pembimbing meminta rujukan,
> barulah tambahkan buku perancangan antarmuka - lihat catatan pada berkas pustaka
> bagian 3b mengenai Shneiderman dkk. (2018) yang belum saya periksa.

#### c. HMAC-SHA256

> **Letakkan di:** Bab II, **di dalam subbab keamanan yang sudah ada**, berdampingan
> dengan penjelasan penyandian kata sandi. Tidak perlu subbab baru.

**Teks siap salin:**

> Keamanan sesi pengguna pada sistem ini dijaga menggunakan token yang ditandatangani
> secara kriptografis dengan _Hash-based Message Authentication Code_ (HMAC)
> beralgoritma SHA-256. HMAC bekerja dengan menggabungkan isi pesan dengan sebuah
> kunci rahasia yang hanya diketahui server, lalu menghasilkan tanda tangan berupa
> rangkaian karakter tetap. Ketika token dikirim kembali oleh peramban, server
> menghitung ulang tanda tangan tersebut dan membandingkannya. Perubahan sekecil apa
> pun pada isi token akan menghasilkan tanda tangan yang berbeda, sehingga token yang
> diubah maupun dipalsukan dapat langsung ditolak (Stallings & Brown, 2018).
>
> Berbeda dengan penyandian kata sandi yang bertujuan menyembunyikan isi, HMAC
> bertujuan membuktikan keaslian dan keutuhan data. Karena itu keduanya dipakai
> bersama pada sistem ini: kata sandi disimpan dalam bentuk tersandi agar tidak dapat
> dibaca meskipun basis data bocor, sedangkan token sesi ditandatangani agar identitas
> dan peran pengguna yang tercantum di dalamnya tidak dapat diubah dari sisi peramban.

> **Rujukannya sudah ada di daftar pustaka Anda**, yaitu Stallings dan Brown (2018),
> rujukan nomor [27] pada makalah seminar proposal. Tidak perlu menambah rujukan baru.

### II-16. Pengganti baris Saputro & Novita pada tabel penelitian terdahulu

Anda benar bahwa kesimpulan penelitian itu memang menyatakan Express lebih cepat.
Karena itu ada **dua pilihan**, dan keduanya sah:

**Pilihan 1 - tetap di tabel, tetapi kolom Research Gap diperbaiki.** Yang bermasalah
sebenarnya bukan penelitiannya, melainkan cara Anda merumuskan celahnya. Isi sel
penggantinya:

> Penelitian tersebut berhenti pada pengujian kecepatan kerangka kerja di lingkungan
> percobaan, tanpa penerapan pada proses kerja yang sesungguhnya. Penelitian ini
> memakai hasil tersebut sebagai dasar pemilihan teknologi, lalu menerapkannya pada
> pengelolaan mitra statistik di satuan kerja BPS yang melibatkan perhitungan honor
> lintas tim, penomoran surat, dan pembatasan hak akses antarperan.

Dengan rumusan ini, celahnya menjadi **jarak antara uji laboratorium dan penerapan
nyata**, bukan soal teknologi mana yang lebih modern. Ini rumusan yang lazim dan
tidak mudah dipatahkan.

**Pilihan 2 - keluarkan dari tabel, ganti dengan penelitian yang lebih sejenis.**
Kandidat terbaik yang sudah saya verifikasi:

> Muthmainnah, M., Syahputra, W. I., & Bintoro, A. (2025). Sistem informasi
> monitoring kegiatan berbasis web pada Badan Pusat Statistik Kota Lhokseumawe.
> *Sisfo: Jurnal Ilmiah Sistem Informasi, 9*(2).

Isi barisnya:

| Kolom | Isi |
| --- | --- |
| Penulis (Tahun) | Muthmainnah dkk. (2025) |
| Topik | Sistem informasi monitoring kegiatan pada BPS Kota Lhokseumawe |
| Metode & Teknologi | Waterfall; PHP Laravel, MySQL |
| Hasil | Pemantauan kegiatan yang semula manual menjadi berbasis web, mempercepat pelaporan dan mengurangi kesalahan pencatatan |
| Celah penelitian | Penelitian tersebut berfokus pada pemantauan kegiatan secara umum. Penelitian ini menyatukan pemantauan dengan administrasi kontrak dan pengendalian honor mitra, termasuk pemeriksaan batas honor lintas tim dan penilaian kinerja mitra dalam satu sistem |

**Saran saya: pakai Pilihan 2, lalu pindahkan Saputro & Novita ke Bab II** sebagai
alasan teknis pemilihan Express (lihat butir II-12). Dengan begitu tabel penelitian
terdahulu berisi penelitian sejenis semua, dan rujukan teknis tetap terpakai di
tempat yang sesuai. Penelitian Muthmainnah dkk. juga lebih kuat sebagai pembanding
karena studi kasusnya sama-sama satuan kerja BPS.

### II-14. HMAC-SHA256 - tidak perlu rujukan baru

Pertanyaan Anda apakah HMAC-SHA256 perlu tinjauan pustaka tersendiri.

**Jawabannya: tidak perlu rujukan baru, karena sumbernya sudah ada di daftar pustaka
Anda.** Stallings dan Brown (2018), *Computer Security: Principles and Practice*,
membahas perangkat kriptografi termasuk kode otentikasi pesan berbasis fungsi hash.
Buku itu sudah Anda cantumkan sebagai rujukan nomor [27].

Cukup tambahkan satu sampai dua kalimat pada subbab keamanan yang sudah ada:

> Keaslian dan keutuhan token sesi dijaga menggunakan kode otentikasi pesan berbasis
> fungsi hash (HMAC) dengan algoritma SHA-256. Mekanisme ini menggabungkan isi token
> dengan sebuah kunci rahasia yang hanya diketahui server, sehingga perubahan
> sekecil apa pun pada isi token dapat terdeteksi dan token yang dipalsukan akan
> ditolak (Stallings & Brown, 2018).

Bila ingin lebih lengkap, letakkan kalimat itu berdampingan dengan penjelasan
penyandian kata sandi menggunakan bcrypt, karena keduanya sama-sama bagian dari
KNF-01.



### II-11. Tambah enam subbab teori yang belum ada

Hasil pemeriksaan: ada enam hal yang dipakai di Bab IV dan Bab V tetapi belum punya
dasar teori di Bab II. Yang paling mendesak butir pertama, karena satu dari empat
pengujian Anda dibangun di atasnya tanpa landasan.

| Prioritas        | Subbab baru yang ditambahkan                           | Menopang apa                                             | Rujukan                       | Panjang      |
| ---------------- | ------------------------------------------------------ | -------------------------------------------------------- | ----------------------------- | ------------ |
| **1. Wajib**     | Hak Akses Berbasis Peran (_Role-Based Access Control_) | KNF-01 dan seluruh pengujian keamanan SEC-01 s.d. SEC-16 | (Sandhu dkk., 1996)           | 2 paragraf   |
| **2. Wajib**     | Standar Biaya Masukan Lainnya (SBML)                   | KF-06, peringatan batas honor                            | (Badan Pusat Statistik, 2021) | 2 paragraf   |
| **3. Sebaiknya** | Penyandian Kata Sandi (_hashing_)                      | KF-01, KNF-01                                            | (Provos & Mazieres, 1999)     | 1 paragraf   |
| **4. Sebaiknya** | Arsitektur RESTful API                                 | Arsitektur sistem Bab V, KNF-07                          | (Fielding, 2000)              | 1-2 paragraf |
| **5. Sebaiknya** | Transaksi Basis Data                                   | KNF-04, integritas data                                  | (Haerder & Reuter, 1983)      | 1 paragraf   |
| **6. Opsional**  | Perancangan Antarmuka Pengguna                         | Subbab rancangan antarmuka (17 wireframe)                | (Shneiderman dkk., 2018)      | 1-2 paragraf |

**Mengapa butir 1 disebut wajib.** Bab II Anda memuat teori pengujian keamanan
(Stallings & Brown, 2018), tetapi tidak memuat teori tentang **cara membatasi akses
menurut peran** - padahal seluruh rancangan sistem Anda bertumpu pada tiga peran
(Admin, Tim Keuangan, Pegawai) ditambah pembatasan kepemilikan data. Tanpa subbab
ini, penguji dapat bertanya "dasar teori pembagian peran Anda apa?" dan jawabannya
tidak ada di naskah.

**Isi yang disarankan untuk subbab RBAC (butir 1):**

> Paragraf 1 - pengertian: hak akses tidak diberikan langsung kepada pengguna,
> melainkan kepada peran, lalu pengguna ditugaskan ke peran tersebut. Perubahan
> kewenangan cukup dilakukan pada perannya, bukan pada tiap pengguna satu per satu
> (Sandhu dkk., 1996).
>
> Paragraf 2 - penerapannya pada penelitian ini: sistem memakai tiga peran (Admin,
> Tim Keuangan, dan Pegawai), ditambah pembatasan berdasarkan kepemilikan data,
> yaitu kegiatan hanya dapat disunting pembuatnya atau Ketua Tim kegiatan tersebut,
> serta progres dan penilaian hanya dapat diisi PML yang mengawasi mitra
> bersangkutan. Pembatasan lapis kedua ini diperlukan karena peran saja tidak cukup:
> dua orang dengan peran yang sama tetap tidak boleh saling mengubah data.

Paragraf kedua penting agar teorinya tidak menggantung. Pola yang sama dipakai untuk
kelima subbab lain: satu paragraf pengertian, satu paragraf cara penerapannya di
sistem Anda.

> **Letakkan di mana:** subbab RBAC dan penyandian kata sandi diletakkan berdekatan
> dengan subbab Security Testing yang sudah ada. SBML diletakkan setelah Tata Kelola
> Administrasi. RESTful API dan Transaksi Basis Data diletakkan berdekatan dengan
> subbab Node.js/Express dan ERD. Perancangan Antarmuka diletakkan sebelum atau
> sesudah subbab React.js.

Entri daftar pustakanya sudah disiapkan di `draf-revisi-pustaka.md` bagian **3.a**
dan **3.f** sampai **3.j**.

> **Sebelum memakainya, baca bagian 3b pada berkas pustaka.** Di situ ada tabel
> status pemeriksaan tiap rujukan beserta tautan sumbernya, penjelasan mengapa
> sebagian rujukan memang bertahun lama, dan cara memasangkan sumber primer dengan
> penelitian terbaru. Satu rujukan (Shneiderman dkk., 2018) ditandai **belum
> diperiksa** dan sebaiknya Anda pastikan sendiri sebelum dicantumkan.

---

## BAB III

### III-1. Ganti sitasi bernomor

> **Di naskah Anda:** subbab 3.2 Tahapan Penelitian
> **Cari:** tanda `[` dengan Ctrl+F
> **Tindakan:** ganti tiap nomor menjadi (Penulis, Tahun)
> **Tabel penggantinya:** `draf-revisi-pustaka.md` -> bagian **5** (sudah dipetakan
> per kalimat)

### III-2. Perbaiki tiga frasa kabur

Ini yang Anda tanyakan. Ketiganya ada di subbab 3.2, dan penggantinya ada di
`draf-revisi-bab1-2-3-5.md` bagian **4.3**. Berikut ringkasnya:

| Cari kalimat yang memuat      | Tindakan    | Ganti menjadi                                                                                                                                                                                              |
| ----------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "strategi input data hibrida" | ganti frasa | "sumber progres kegiatan dibedakan menjadi dua: kegiatan yang memakai FASIH dan kegiatan yang progresnya diisi PML melalui sistem"                                                                         |
| "prinsip _Rapid Development_" | ganti frasa | "pengembangan dilakukan bertahap per modul dan setiap modul langsung diuji, agar kesalahan ditemukan lebih awal (McConnell, 1996)"                                                                         |
| "simulasi serangan"           | ganti frasa | "pengujian dilakukan dengan memanggil API sistem memakai token milik peran yang tidak berwenang, untuk memastikan pembatasan hak akses ditegakkan di sisi server, bukan hanya disembunyikan pada tampilan" |

Frasa ketiga paling penting: menulis "simulasi serangan" berarti Anda mengklaim
melakukan uji penetrasi, dan penguji berhak menanyakan alat serta metodologinya.

### III-3. Ganti penyebutan JWT

> **Di naskah Anda:** subbab 3.2, tahap Implementation
> **Cari kalimat:** "middleware otentikasi JWT"
> **Tindakan:** ganti seluruh kalimatnya
> **Teks pengganti:** `draf-revisi-bab1-2-3-5.md` -> bagian **4.4**, paragraf di
> dalam kutipan blok yang diawali "Keamanan sesi diterapkan menggunakan token
> bertanda tangan HMAC-SHA256"
> **Tambahan:** bagian 4.4 juga memuat tabel perbandingan JWT dengan token sistem
> Anda. Tabel itu **tidak perlu masuk naskah**; gunakan sebagai bekal menjawab
> pertanyaan penguji.

### III-4. Ganti lingkungan penerapan

> **Di naskah Anda:** subbab 3.2, tahap Deployment
> **Cari kalimat:** "VPS" dan "Nginx"
> **Tindakan:** ganti seluruh uraian teknisnya
> **Jadi:** sistem dipasang pada layanan hosting cPanel milik BPS; aplikasi Node.js
> dijalankan melalui Passenger; basis data dibuat pada MySQL yang disediakan cPanel;
> akses dari luar kantor melalui FortiClient VPN BPS
> **Uraian lengkapnya:** `draf-bab5-penerapan-pemeliharaan.md` -> subbab **5.3.1 dan
> 5.3.2** (boleh diringkas untuk Bab III, karena versi lengkapnya di Bab V)

### III-5. Contoh umpan balik Modified Waterfall

> **Di naskah Anda:** subbab 3.1.3 Modified Waterfall
> **Cari kalimat:** contoh perubahan aturan yang masih berupa pengandaian
> **Tindakan:** ganti dengan empat contoh nyata
> **Teks pengganti:** `draf-revisi-bab1-2-3-5.md` -> bagian **4.2.1**, seluruh isi
> kutipan blok (empat paragraf, siap salin)
> **Catatan:** bagian **4.2** berisi daftar mentah keempat contoh itu; yang disalin
> ke naskah adalah versi paragraf di **4.2.1**, bukan daftarnya.

### III-6. Perbarui Gambar Kerangka Pikir

> **Di naskah Anda:** Gambar 3 Kerangka Pikir
> **Tindakan:** gambar ulang keempat kolomnya
> **Isi pengganti tiap kolom:** `draf-revisi-bab1-2-3-5.md` -> bagian **4.5**
> **Perhatikan:** kolom kriteria evaluasi kini memuat empat butir, dan butir
> pengujian kinerja mencakup dua hal (Lighthouse dan perbandingan waktu kerja).

---

## BAB IV

### IV-1. Permasalahan sistem berjalan

> **Di naskah Anda:** subbab 4.1.2
> **Tindakan:** ganti seluruh isinya
> **Teks pengganti:** `draf-revisi-bab4.md` -> bagian **4.1.2** (sudah berbentuk
> paragraf, bukan poin)

### IV-2. Kebutuhan Fungsional menjadi tabel

> **Di naskah Anda:** subbab 4.1.3, bagian Kebutuhan Fungsional
> **Tindakan:** ganti daftar berpoin menjadi tabel tiga kolom
> **Teks pengganti:** `draf-revisi-bab4.md` -> **Tabel Kebutuhan Fungsional Sistem**
> **Catatan:** ini menjawab arahan pembimbing. Versi prosa panjangnya tetap
> disimpan di bawah tabel (dalam blok yang bisa dibuka-tutup) kalau sewaktu-waktu
> ada KF yang perlu dijelaskan lebih panjang.

### IV-3. Proses Bisnis Sistem Usulan

> **Di naskah Anda:** subbab 4.2.1
> **Tindakan:** ganti seluruh isinya
> **Teks pengganti:** `draf-revisi-bab4.md` -> bagian **4.2.1**
> **Ini menjawab arahan pembimbing** bahwa bedanya dengan sistem berjalan belum
> terlihat. Yang ditambahkan: tabel perbandingan sembilan tahap sebelum dan sesudah,
> penjelasan konkret apa saja yang dimaksud "data terpusat", dan tiap poin narasi
> kini menyebut apa yang dahulu manual.

### IV-4. Activity Diagram

> **Di naskah Anda:** subbab activity diagram
> **Tindakan:** ganti seluruh isinya
> **Teks pengganti:** `draf-bab4-activity-diagram.md` -> bagian **2**
> **Ini menjawab arahan pembimbing.** Yang berubah: paragraf pelaku dan pemenuhan KF
> kini digabung menjadi **satu paragraf pembuka di atas** tiap diagram, dan istilah
> "pelaku" diganti **"partisi"**.

**Soal pertanyaan pembimbing "sistem itu aktor atau bukan":** pembimbing Anda benar
mempertanyakannya. Jawabannya ada di pengantar subbab tersebut:

- Pada **use case diagram**, istilah _aktor_ hanya untuk pihak **di luar** sistem.
  Sistem itu sendiri **bukan aktor**.
- Pada **activity diagram**, jalur pembaginya disebut **partisi** (_partition_), dan
  partisi **boleh** mewakili sistem, karena yang dibagi adalah tanggung jawab atas
  tiap langkah.

Jadi menyebut "Sistem" sebagai partisi sudah tepat, asalkan tidak disebut aktor.

### IV-6. Activity diagram untuk KF-13 dan KF-16

Pertanyaan Anda: apakah KF-13 (rekap honor) dan KF-16 (riwayat dan arsip kegiatan)
tetap perlu activity diagram, karena walaupun alurnya lurus tetap ada interaksi
dengan sistem.

**Setelah saya periksa ulang ke kode, penilaian saya sebelumnya kurang tepat untuk
salah satunya.**

| Kebutuhan | Ada percabangan? | Saran |
| --- | --- | --- |
| KF-13 rekap honor | Tidak. Pengguna memilih periode, sistem menghitung dan menampilkan, pengguna mengunduh | **Tidak perlu diagram.** Alurnya benar-benar lurus |
| KF-16 arsip dan hapus kegiatan | **Ada, dan cukup penting** | **Sebaiknya dibuatkan diagram** |

**Mengapa KF-16 sebaiknya dibuatkan.** Penghapusan kegiatan memiliki percabangan
yang bukan sekadar formalitas: sistem memeriksa apakah kegiatan sudah memiliki
alokasi mitra atau penilaian. Bila sudah ada, permintaan hapus **ditolak** dan
pengguna diarahkan untuk mengarsipkan. Percabangan ini justru salah satu pengaman
data terpenting pada sistem Anda, dan sudah diuji pada kasus BB-44. Menggambarkannya
membuat aturan itu terlihat, bukan tersembunyi di dalam narasi.

**Kalau Anda setuju, beri tahu saya** - diagramnya saya buatkan beserta narasinya,
sehingga jumlah activity diagram menjadi sembilan. Kalau tidak, alasan yang sekarang
tertulis di draf tetap dapat dipertahankan, hanya saja sebutkan bahwa aturan
penolakan hapus itu dijelaskan pada subbab rancangan basis data.

### IV-5. Rancangan Basis Data dan Rancangan Antarmuka

> Tidak ada perubahan baru. Pakai `draf-revisi-bab4.md` (basis data) dan
> `draf-bab4-rancangan-antarmuka.md` (wireframe) seperti sebelumnya.

---

## BAB V

Bab V memakai tiga berkas berurutan:

| Subbab                             | Berkas                                |
| ---------------------------------- | ------------------------------------- |
| 5.1 Implementasi                   | `draf-bab5-implementasi.md`           |
| 5.2 Evaluasi                       | `draf-bab5-evaluasi.md`               |
| 5.3 Penerapan dan 5.4 Pemeliharaan | `draf-bab5-penerapan-pemeliharaan.md` |

### III-8. Ganti paragraf tahap Deployment

> **Di naskah Anda:** Bab III, subbab 3.2, paragraf tahap Deployment
> **Tindakan:** ganti satu paragraf utuh

**Paragraf sekarang** menyebut VPS, Nginx, dan pemasangan SSL - ketiganya tidak
sesuai dengan lingkungan penerapan yang sebenarnya.

**Paragraf pengganti:**

> Tahap kelima adalah _deployment_, yang bertujuan memasang sistem pada lingkungan
> yang sesungguhnya digunakan BPS Kabupaten Bengkulu Selatan agar dapat diakses
> pengguna. Sistem dipasang pada layanan _hosting_ cPanel milik BPS. Kegiatan
> teknisnya meliputi pembangunan berkas produksi dari kode sumber, pengunggahan
> berkas hasil pembangunan ke cPanel, pembuatan basis data MySQL beserta
> penerapan struktur tabelnya, serta pengaturan aplikasi Node.js melalui fasilitas
> _Setup Node.js App_ yang menjalankan aplikasi menggunakan Passenger. Data
> kredensial basis data dan kunci penandatangan sesi diisikan sebagai variabel
> lingkungan, bukan ditulis di dalam kode. Karena sistem berada di dalam jaringan
> BPS, aksesnya terbatas pada pegawai BPS, dan dari luar kantor sistem hanya dapat
> dibuka melalui koneksi FortiClient VPN BPS. Setelah pemasangan selesai, dilakukan
> pemeriksaan singkat terhadap fungsi inti sistem untuk memastikan perbedaan
> lingkungan tidak menimbulkan gangguan. Tahapan ini menandai peralihan dari
> lingkungan pengembangan ke lingkungan operasional.

**Yang dihapus dan mengapa:**

| Dihapus | Alasan |
| --- | --- |
| VPS dan Nginx | Tidak dipakai. cPanel memakai Passenger, dan servernya dikelola BPS, bukan disiapkan sendiri |
| Pemasangan SSL | Pengelolaan sertifikat pada cPanel BPS bukan pekerjaan Anda. Bila ternyata Anda memang mengurusnya, boleh ditambahkan kembali |
| Sitasi (Fajar & Maghfiroh, 2024) di akhir | Kalimat itu menjelaskan pekerjaan teknis Anda sendiri, bukan mengutip temuan penelitian lain. Sitasi di situ tidak pada tempatnya |

Uraian yang lebih lengkap ada di `draf-bab5-penerapan-pemeliharaan.md` subbab 5.3.
Untuk Bab III cukup ringkas seperti paragraf di atas, karena rincian langkahnya
memang porsi Bab V.

### III-9. Persingkat kolom Kriteria Evaluasi pada Kerangka Pikir

Usulan Anda tepat - kotak pada gambar memang tidak muat kalimat panjang. Pakai label
pendek saja:

| Kotak | Tulisan yang disarankan |
| --- | --- |
| 1 | **Black Box Testing** (uji fungsionalitas) |
| 2 | **Security Testing** (uji hak akses) |
| 3 | **Performance Testing** (uji kinerja dan efisiensi) |
| 4 | **Usability Testing** (CSUQ) |

Bentuk ini punya tiga keuntungan. Pertama, seragam - keempatnya memakai pola yang
sama, yaitu nama baku diikuti keterangan singkat dalam bahasa Indonesia. Kedua,
tetap sejalan dengan Bab II dan Bab V yang memakai nama-nama itu. Ketiga, usulan
Anda "Performance Testing (uji kinerja dan efisiensi progres)" sudah benar arahnya;
saya hanya mengganti "progres" menjadi "efisiensi" saja agar tidak tertukar dengan
progres kegiatan mitra yang artinya berbeda di skripsi ini.

Rincian isi tiap pengujian tidak perlu masuk gambar - cukup dijelaskan pada narasi
kerangka pikir di bawah gambarnya.

### III-7. Ganti nama pengujian ketiga (keputusan baru)

> **Di naskah Anda:** Bab III tahap Testing, dan Gambar Kerangka Pikir kolom
> Kriteria Evaluasi, serta Tujuan Khusus butir 3 di Bab I
> **Cari kalimat:** "Performance Testing" atau "kinerja halaman (Google Lighthouse)"
> **Tindakan:** ganti nama pengujian ketiganya
> **Jadi:** "Pengujian Kinerja dan Efisiensi Proses"

Alasannya: nama lama menyebut alat (Lighthouse) dan mempersempit pengujian menjadi
sekadar kecepatan memuat layar. Nama baru mencakup dua hal sekaligus, dan yang
utama di dalamnya - perbandingan waktu kerja - menjawab langsung masalah M1.

Teks penggantinya:

- Tujuan Khusus butir 3: `draf-revisi-bab1-2-3-5.md` -> bagian **2.5**
- Kerangka pikir kolom Kriteria Evaluasi: `draf-revisi-bab1-2-3-5.md` -> bagian
  **4.5**, butir 3

### V-1. Kedudukan pengujian kinerja perlu ditulis terbuka

> **Di naskah Anda:** Bab V, subbab Pengujian Kinerja
> **Tindakan:** tambahkan pengantar sebelum bagian Lighthouse
> **Teks pengganti:** `draf-bab5-evaluasi.md` -> subbab **5.2.3**, paragraf pengantar
> beserta tabel dua baris di bawahnya

**Urutannya sudah dibalik.** Subbab 5.2.3.1 kini berisi efisiensi waktu kerja
(yang menjawab masalah), dan 5.2.3.2 berisi Lighthouse (yang membuktikan KNF-03).
Sebelumnya urutannya terbalik.

Pengantar itu menyatakan secara terbuka bahwa Lighthouse berkedudukan sebagai
**pendukung** (membuktikan KNF-03 terpenuhi), sedangkan yang menjawab masalah
administrasi manual adalah **perbandingan waktu kerja**. Penjelasannya ada pada
jawaban di bawah judul "Kedudukan Lighthouse" pada berkas ini.

Yang perlu Anda kerjakan sendiri di Bab V:

1. Mengambil tangkapan layar sesuai penanda SS-01 sampai SS-36.
2. Menjalankan pengujian dan mengoreksi baris yang hasilnya berbeda.
3. Mengisi tabel Lighthouse dan tabel perbandingan waktu.
4. Menyebar kuesioner CSUQ setelah sistem dipasang.

---

## DAFTAR PUSTAKA

### P-1. Rujukan [20] dan [21] yang tidak Anda temukan

Pertanyaan Anda: sitasi (Liou & Duclervil, 2020; Hossain, 2023) untuk efektivitas
model SDLC tidak ditemukan di buku skripsi Anda.

**Keduanya memang ada, tetapi di makalah seminar proposal, bukan di buku skripsi.**
Letaknya pada bagian Metode Penelitian, di kalimat berikut:

> "... tanpa harus mengulang siklus dari awal, sehingga jadwal pengembangan dapat
> dikelola dengan lebih efisien [20], [21]."

Jadi ada dua kemungkinan, dan Anda perlu memastikan yang mana:

| Keadaan | Tindakan |
| --- | --- |
| Kalimat itu **ikut disalin** ke buku skripsi | Ganti `[20], [21]` menjadi (Liou & Duclervil, 2020; Hossain, 2023), dan pertahankan keduanya di daftar pustaka |
| Kalimat itu **tidak ada** di buku skripsi | **Hapus kedua rujukan dari daftar pustaka.** Rujukan yang tidak pernah disitir dalam naskah tidak boleh dicantumkan |

Yang kedua ini penting diperiksa. Daftar pustaka hanya boleh memuat sumber yang
benar-benar dikutip di dalam naskah. Bila Anda menyalin daftar pustaka dari makalah
seminar proposal apa adanya, kemungkinan ada beberapa rujukan lain yang bernasib
sama.

**Cara memeriksanya dengan cepat:** buka buku skripsi, gunakan Ctrl+F, lalu cari
nama belakang penulis tiap rujukan satu per satu. Yang tidak muncul sama sekali di
badan naskah, keluarkan dari daftar pustaka. Kerjakan ini setelah seluruh isi bab
selesai, bersamaan dengan konversi sitasi.

---

> **Tindakan:** konversi 28 sitasi bernomor menjadi APA, susun ulang menurut abjad,
> tambahkan tujuh rujukan baru
> **Panduan lengkap:** `draf-revisi-pustaka.md`
> **Kerjakan paling akhir**, setelah seluruh isi bab selesai, agar tidak ada sitasi
> yang terlewat.

---

## Perubahan nama sistem

Seluruh diagram yang tadinya menyebut **OPTIMA** kini memakai **SIKAMI**:

| Berkas                      | Jumlah                            |
| --------------------------- | --------------------------------- |
| `01-usecase.puml`           | 1                                 |
| `12-arsitektur-sistem.puml` | 1                                 |
| `15-wireframe.drawio`       | 17 (judul tiap halaman wireframe) |
| `alat/buat_wireframe.py`    | 1                                 |

Diagram use case dan arsitektur sudah dirender ulang. Wireframe tinggal diekspor
ulang dari draw.io.

> **Bila nama finalnya ternyata bukan SIKAMI**, beri tahu saya - penggantiannya satu
> perintah untuk seluruh berkas. Yang perlu Anda putuskan: judul skripsi memakai
> "Sistem Informasi Tata Kelola Administrasi dan Monitoring Kegiatan Mitra
> Statistik" tanpa menyebut nama sistem, sedangkan tujuan umum menyebut SIKAMI dan
> aplikasinya sendiri bernama Kharisma. Pilih satu nama untuk dipakai di seluruh
> naskah.
