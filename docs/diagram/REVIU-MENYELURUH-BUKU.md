# Reviu Menyeluruh Buku Skripsi

Berkas ini terpisah dari `PANDUAN-PENERAPAN-REVISI.md`. Panduan itu berisi
revisi yang Anda minta sebelumnya (dua pokok masalah, pustaka, KF tabel, dan
seterusnya). Berkas ini berisi **hasil pemeriksaan naskah utuh** yang Anda
kirim: konsistensi antarbab, kecocokan buku dengan aplikasi, keterbacaan
gambar, dan hal-hal yang berpotensi menyulitkan di sidang.

Acuan halaman, nomor tabel, dan nomor gambar di bawah ini diambil dari berkas
PDF naskah yang Anda kirim. Bila Anda sudah menyunting naskah sejak itu,
periksa dulu apakah temuannya masih ada.

Sesuai permintaan Anda, **evaluasi yang belum diisi** (hasil CSUQ, Lighthouse,
waktu proses) dan **rancangan antarmuka serta implementasi yang belum lengkap**
tidak saya persoalkan di sini.

---

## 0. Ringkasan: lima hal yang paling berisiko

Kalau waktu Anda tinggal sedikit, kerjakan lima ini lebih dulu. Sisanya bisa
menyusul.

| No  | Temuan                                                                                                                     | Kenapa berbahaya                                                                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Daftar Pustaka masih daftar contoh bawaan templat** (Agresti, Astuti, Bain, Cochran, Harel, Karyadi, Lodewijkx, Nugraha) | Tidak satu pun rujukan yang Anda pakai di dalam naskah ada di sana. Penguji yang membuka halaman ini langsung tahu, dan pertanyaannya tidak akan berhenti di situ                                                                        |
| 2   | **Sekitar 26 sitasi dipakai di dalam teks tetapi tidak punya pasangan di Daftar Pustaka**                                  | Sama beratnya dengan nomor 1, dan tetap ada walau nomor 1 sudah diperbaiki bila daftarnya tidak lengkap                                                                                                                                  |
| 3   | **Daftar Isi, Daftar Tabel, dan Daftar Gambar belum diperbarui**                                                           | Daftar Isi masih menyebut "BAB VI IMPLEMENTASI DAN EVALUASI" dan "BAB VII KESIMPULAN DAN SARAN" bawaan templat, ada "Error! Bookmark not defined.", Daftar Tabel berhenti di Tabel 13 padahal ada 46, Daftar Gambar berhenti di Gambar 9 |
| 4   | **Gambar use case masih bertuliskan "Sistem Informasi OPTIMA"**, dan Daftar Gambar menyebut OPTIMA di tiga tempat          | Nama sistem berbeda antara judul, isi, dan gambar. Pertanyaan pertama penguji biasanya justru soal ini                                                                                                                                   |
| 5   | **Interval kategori CSUQ di Bab V bertentangan dengan Bab II**                                                             | Tabel 3 (Bab II) memakai lebar kelas 1,2, Tabel 44 (Bab V) masih memakai 1,00–2,00. Dua tabel dalam satu buku memberi jawaban berbeda untuk skor yang sama                                                                               |

---

## A. Risiko tinggi — perbaiki lebih dulu

### A-1. Daftar Pustaka masih isi templat

> **Di naskah Anda:** halaman DAFTAR PUSTAKA, sesudah BAB VI.
> **Cari:** entri yang diawali "Agresti, A." dan diakhiri "Nugraha, ...".
> **Tindakan:** hapus seluruh daftar itu, ganti dengan daftar Anda sendiri.

Bahannya sudah ada di `draf-revisi-pustaka.md`: 28 rujukan seminar proposal yang
sudah saya ubah ke format APA 7, ditambah 12 rujukan baru pada bagian 3. Yang
perlu Anda lakukan hanya menyalinnya, lalu menambahkan rujukan pada daftar A-2
di bawah.

Satu peringatan yang sudah pernah saya sampaikan dan masih berlaku: pada bagian
3b berkas pustaka itu ada satu rujukan yang **belum saya periksa sendiri**, yaitu
Shneiderman dkk. (2018). Jangan memasukkannya sebelum Anda melihat bukunya.

### A-2. Sitasi yang dipakai di teks tetapi belum ada pasangannya

Rujukan berikut muncul di dalam naskah Anda tetapi tidak ada di daftar 28
rujukan seminar proposal, sehingga pasti tidak akan ada di Daftar Pustaka bila
Anda hanya menyalin daftar lama.

| Sitasi dalam teks              | Kira-kira di bab | Keterangan                      |
| ------------------------------ | ---------------- | ------------------------------- |
| Nuraini dkk. (2023)            | Bab I            | perlu dicari entri lengkapnya   |
| Laudon & Laudon (2021)         | Bab II           | buku sistem informasi manajemen |
| Stair & Reynolds (2018)        | Bab II           | buku dasar sistem informasi     |
| Asriani dkk. (2024)            | Bab I/II         |                                 |
| Hidayat & Tachjar (2024)       | Bab I/II         |                                 |
| Dunn (2012)                    | Bab II           |                                 |
| Lase & Lase (2024)             | Bab II           |                                 |
| Few (2006)                     | Bab II           | teori dasbor                    |
| Rizqy & Silmina (2025)         | Bab II           |                                 |
| Turban dkk. (2011)             | Bab II           |                                 |
| Armstrong (2009)               | Bab II           | manajemen kinerja               |
| Wathan (2017)                  | Bab II           |                                 |
| Tilkov & Vinoski (2010)        | Bab II           | Node.js                         |
| Oracle (2024)                  | Bab II           | MySQL/MariaDB                   |
| Pulungan dkk. (2023)           | Bab II           |                                 |
| Pressman & Maxim (2015)        | Bab II/III       | rekayasa perangkat lunak        |
| Febrianto dkk. (2025)          | Bab II/III       |                                 |
| Macefield (2009)               | Bab III          | jumlah responden uji            |
| Sugiyono (2020)                | Bab III          | metode penelitian               |
| ISO/IEC 25010:2023             | Bab II/III       | standar mutu perangkat lunak    |
| OWASP Top 10                   | Bab III          | acuan uji keamanan              |
| Peraturan BPS No. 4 Tahun 2020 | Bab II           | mitra statistik                 |
| Google (2024)                  | Bab III          | Lighthouse                      |
| Sauro & Lewis (2016)           | Bab III/V        | tolok ukur PSSUQ                |
| Muthmainnah dkk. (2025)        | Bab II           | penelitian terdahulu            |
| BPS (2021)                     | Bab I/II         |                                 |

**Yang harus Anda lakukan:** untuk setiap baris, buka sumbernya, salin entri
lengkapnya, lalu masukkan ke Daftar Pustaka. Bila ada satu saja yang tidak Anda
temukan sumber aslinya, **hapus sitasinya dari naskah**, jangan dibiarkan
menggantung. Kalimatnya hampir selalu tetap bisa berdiri tanpa sitasi itu.

Sebagian sudah saya verifikasi dan entri lengkapnya ada di
`draf-revisi-pustaka.md` bagian 3, yaitu Sauro & Lewis (2016), Muthmainnah dkk.
(2025), dan Google/Lighthouse. Sisanya perlu Anda periksa sendiri.

### A-3. Daftar Isi, Daftar Tabel, dan Daftar Gambar

Tiga hal yang harus diperbaiki:

1. **Daftar Isi masih memuat struktur templat.** Masih ada "BAB VI IMPLEMENTASI
   DAN EVALUASI" dan "BAB VII KESIMPULAN DAN SARAN", padahal buku Anda berakhir
   di BAB VI Kesimpulan dan Saran. Bagian BAB V juga masih tertulis "5.1 Analisis
   Sistem Berjalan" dan "5.2 Perancangan Sistem" dengan keterangan
   "Error! Bookmark not defined.".
2. **Daftar Tabel berhenti di Tabel 13**, padahal naskah Anda punya sampai
   Tabel 46.
3. **Daftar Gambar berhenti di Gambar 9**, padahal naskah Anda punya hampir 60
   gambar, dan tiga judul di dalamnya masih menyebut OPTIMA.

**Cara memperbaikinya di Word:** ketiga daftar itu dibuat otomatis. Klik di
dalam daftarnya, lalu **References > Update Table > Update entire table**. Bila
daftarnya tidak ikut berubah, berarti daftar itu diketik manual — dalam hal itu
hapus, lalu buat ulang lewat **References > Insert Table of Figures** dengan
Caption label "Tabel" untuk Daftar Tabel dan "Gambar" untuk Daftar Gambar.
Syaratnya setiap judul tabel dan gambar di dalam naskah harus dipasang sebagai
_caption_, bukan paragraf biasa.

Keterangan "Error! Bookmark not defined." muncul karena judul yang ditunjuk
sudah dihapus. Setelah daftar diperbarui, keterangan itu hilang sendiri.

### A-4. Gambar dan judul yang masih menyebut OPTIMA

Berkas diagramnya sudah saya ganti menjadi SIKAMI, tetapi **gambar yang tertanam
di naskah masih hasil ekspor yang lama**. Mengganti berkas `.puml` tidak
mengubah gambar yang sudah terlanjur ditempel di Word.

| Letak                         | Yang masih salah                                     | Tindakan                                                                                                            |
| ----------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Gambar use case (Gambar 8)    | Bingkai sistem bertuliskan "Sistem Informasi OPTIMA" | Hapus gambarnya, sisipkan ulang dari `out/usecase.svg` yang sudah dirender ulang |
| Daftar Gambar, judul Gambar 5 | "...(Sebelum Adanya Sistem OPTIMA)"                  | Perbaiki _caption_-nya di naskah, lalu perbarui Daftar Gambar                                                       |
| Daftar Gambar, judul Gambar 7 | "...Sistem Usulan Pada OPTIMA"                       | sama                                                                                                                |
| Daftar Gambar, judul Gambar 8 | "Use Case Diagram dari Sistem Informasi OPTIMA"      | sama                                                                                                                |
| Gambar fishbone (Gambar 6)    | Kotak masalah masih menyebut SBM, bukan SBML         | Buka `10-fishbone.drawio`, perbaiki teksnya, ekspor ulang                                                           |

**Cara cepat memastikan tidak ada yang tertinggal:** di Word tekan Ctrl+H, cari
`OPTIMA`, ganti dengan `SIKAMI`, lalu **Replace All**. Ini hanya menangkap teks,
jadi gambar tetap harus diganti satu per satu.

### A-5. Interval kategori CSUQ bertentangan antara Bab II dan Bab V

> **Di naskah Anda:** Bab V, Tabel 44 (Kategori Interpretasi Skor CSUQ).
> **Yang tertulis:** 1,00–2,00 / 2,01–3,00 / 3,01–4,00 / 4,01–5,00 / 5,01–7,00.
> **Seharusnya:** sama persis dengan Tabel 3 di Bab II.

Interval yang benar memakai lebar kelas (7 − 1) ÷ 5 = 1,2:

| Rentang skor | Kategori          |
| ------------ | ----------------- |
| 1,00 – 2,20  | Sangat tidak baik |
| 2,21 – 3,40  | Tidak baik        |
| 3,41 – 4,60  | Cukup             |
| 4,61 – 5,80  | Baik              |
| 5,81 – 7,00  | Sangat baik       |

Cara paling aman: **hapus Tabel 44 sama sekali**, ganti dengan satu kalimat yang
menunjuk ke Bab II, misalnya "Kategori interpretasi skor mengikuti Tabel 3 pada
Bab II." Satu tabel yang sama tidak perlu muncul dua kali, dan dengan begitu
tidak mungkin lagi berbeda isinya. Hal yang sama berlaku untuk **Tabel 39
(Kategori Penilaian Lighthouse)** yang mengulang Tabel 4 di Bab II.

#### Di mana sebaiknya tabel-tabel itu dijelaskan?

Anda bertanya apakah penjelasan tabel cukup di Bab II saja sehingga Bab V
langsung membahas hasil. **Jawabannya ya, dan itu memang susunan yang baku.**
Pola yang berlaku untuk seluruh alat ukur Anda:

| Bab | Isinya | Contoh untuk CSUQ |
| --- | --- | --- |
| **Bab II** | Teorinya: apa alat ukurnya, siapa penyusunnya, terdiri atas apa, dan bagaimana skornya ditafsirkan | Pengertian CSUQ, 19 butir, tiga dimensi, nilai keandalannya, dan tabel kategori interpretasi skor |
| **Bab III** | Cara Anda memakainya: siapa respondennya, kapan disebarkan, arah skalanya, dan rumus perhitungannya | Responden seluruh pegawai pemakai sistem, arah skala dibalik, skor dihitung sebagai rata-rata per butir dan per dimensi |
| **Bab V** | **Hasilnya saja**, beserta pembahasannya | Tabel skor tiap butir, tabel skor tiap dimensi, kategorinya, dan penafsirannya |
| **Lampiran** | Wujud instrumennya | Lembar kuesioner 19 butir yang benar-benar disebarkan |

Dengan susunan ini, **butir pertanyaan tidak diulang di Bab V**, dan tabel
kategori tidak muncul dua kali. Bab V cukup memuat satu kalimat rujukan, misalnya
"Kategori interpretasi skor mengikuti Tabel 3 pada Bab II." Itu lazim dan tidak
akan dipersoalkan; yang dipersoalkan justru bila dua tabel yang sama memberi
jawaban berbeda, seperti yang terjadi sekarang.

**Berlaku sama untuk yang lain:**

| Alat ukur | Bab II | Bab III | Bab V |
| --- | --- | --- | --- |
| CSUQ | Pengertian, dimensi, tabel kategori skor | Responden, arah skala, cara hitung | Skor dan pembahasan |
| Lighthouse | Pengertian, empat kategori yang diukur, tabel ambang skor | Halaman mana yang diuji, dengan alat versi berapa | Skor tiap halaman dan pembahasan |
| Black box (EP dan BVA) | Pengertian kedua teknik | Cara menyusun kasus uji | Tabel hasil pengujian |
| Pengujian keamanan | Pengertian peningkatan hak akses vertikal dan horizontal | Peran apa menguji apa | Tabel hasil pengujian |
| Perbandingan waktu | — (tidak perlu teori khusus) | Cara pengambilan data waktu dan keterbatasannya | Tabel perbandingan dan pembahasan |

Satu hal yang **tidak** boleh dipindahkan ke Bab II: **keterbatasan data Anda**.
Misalnya keterangan bahwa waktu proses lama diperoleh dari perkiraan pengguna,
bukan pengukuran. Keterangan seperti itu milik Bab III dan Bab V, dan justru
memperkuat naskah karena menunjukkan Anda memahami batas kesimpulan sendiri.

Susunan ini sekaligus menyelesaikan tiga hal sekaligus: pertentangan pada butir
A-5 hilang, Bab V menjadi jauh lebih ringkas, dan urutan bab Anda menjadi sama
dengan yang diharapkan penguji.

#### Langkah konkretnya di naskah

Lima langkah berikut mengubah Bab V menjadi "hasil saja". Kerjakan berurutan.

**Langkah 1 — Bab V, subbab pengujian CSUQ.**

> **Hapus:** **Tabel 44 (Kategori Interpretasi Skor CSUQ)** beserta paragraf
> pengantarnya, dan paragraf mana pun di subbab itu yang menjelaskan *apa itu*
> CSUQ, siapa penyusunnya, berapa butirnya, atau apa saja dimensinya. Semua itu
> sudah ada di Bab II.
>
> **Ganti dengan satu kalimat pembuka:**
>
> > Pengujian kegunaan dilakukan dengan menyebarkan kuesioner CSUQ sebagaimana
> > dijelaskan pada Bab II dan Bab III. Lembar kuesionernya selengkapnya dapat
> > dilihat pada Lampiran, sedangkan kategori interpretasi skornya mengikuti
> > Tabel 3 pada Bab II.
>
> **Lalu langsung masuk ke hasil:** tabel skor tiap butir, tabel skor tiap
> dimensi, kategori yang diperoleh, dan pembahasannya.

**Langkah 2 — Bab V, subbab pengujian Lighthouse.**

> **Hapus:** **Tabel 39 (Kategori Penilaian Lighthouse)** dan paragraf yang
> menjelaskan apa itu Lighthouse serta empat kategori yang diukurnya.
>
> **Ganti dengan:**
>
> > Pengukuran dilakukan dengan Lighthouse pada halaman-halaman utama sistem
> > sebagaimana dijelaskan pada Bab III, dan ambang kategori skornya mengikuti
> > Tabel 4 pada Bab II.

**Langkah 3 — Bab V, subbab pengujian kotak hitam.**

> **Hapus:** paragraf yang menjelaskan apa itu pengujian kotak hitam, apa itu
> kelas ekuivalensi, dan apa itu analisis nilai batas.
>
> **Ganti dengan:**
>
> > Kasus uji disusun dengan teknik kelas ekuivalensi dan analisis nilai batas
> > sebagaimana dijelaskan pada Bab II, dengan cakupan yang dirinci pada Bab III.
>
> Bila teori kedua teknik itu **belum ada** di Bab II, jangan dihapus dari Bab V
> sebelum Anda memindahkannya. Teksnya sudah disiapkan pada butir **D-2** berkas
> ini.

**Langkah 4 — Bab V, subbab pengujian keamanan.**

> **Hapus:** paragraf yang menjelaskan pengertian peningkatan hak akses vertikal
> dan horizontal, bila ada.
>
> **Ganti dengan:** satu kalimat yang menunjuk Bab II, dengan pola yang sama.

**Langkah 5 — pindahkan instrumennya ke Lampiran.**

> Lembar kuesioner CSUQ 19 butir dipindahkan seluruhnya ke **Lampiran**, bukan
> dibiarkan di dalam Bab V. Di Bab V cukup ada rujukannya, seperti pada Langkah 1.

**Yang justru harus TETAP di Bab V** — jangan ikut dipindahkan ke Bab II:

| Tetap di Bab V | Alasan |
| --- | --- |
| Jumlah responden yang benar-benar mengisi | Itu hasil, bukan teori |
| Keterangan bahwa waktu proses lama berasal dari perkiraan pengguna, bukan pengukuran | Itu keterbatasan data, dan tempatnya memang di sini |
| Keterangan bahwa arah skala dibalik sehingga tolok ukur Sauro & Lewis menjadi 5,18 | Perlu diulang singkat saat skornya ditafsirkan, agar pembaca tidak salah baca |
| Alasan sebuah kasus uji gagal beserta tindak lanjutnya | Itu temuan |

**Bila sebuah penjelasan ternyata hanya ada di Bab V dan tidak ada di Bab II**,
jangan langsung dihapus. Pindahkan dulu ke Bab II, baru hapus dari Bab V. Urutan
terbalik akan membuat naskah kehilangan landasan teorinya tanpa disadari.

**Perkiraan hasil:** Bab V berkurang sekitar empat sampai enam halaman, dan
pertentangan pada butir A-5 hilang dengan sendirinya karena tabelnya tinggal
satu.

### A-6. Rumus nilai akhir peringkat rusak

> **Di naskah Anda:** Bab V, bagian implementasi logika pemeringkatan.
> **Yang tertulis:** "nilai akhir = rata-rata seluruh nilai ... **•** (0,01 ×
> jumlah pasangan kegiatan-tahap ...)"
> **Seharusnya:** tanda **+**, bukan bulatan.

Tanda tambahnya berubah menjadi bulatan, kemungkinan karena penggantian jenis
huruf. Periksa juga apakah rumus yang sama di Bab IV (KF-15) masih utuh. Rumus
yang salah tanda adalah hal yang paling mudah ditangkap penguji dan paling sulit
dibela.

---

## B. Inkonsistensi antarbab

Semua yang ada di tabel ini berasal dari naskah yang sama, jadi penguji bisa
menemukannya hanya dengan membandingkan dua halaman.

| #    | Letak                                  | Yang tertulis                                                      | Seharusnya                                                                                                                                |
| ---- | -------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| B-1  | Bab I, latar belakang                  | "batas Standar Biaya Masukan (SBM)"                                | "batas Standar Biaya Masukan Lainnya (SBML)"                                                                                              |
| B-2  | Bab II, subbab honor mitra             | "Standar Biaya Masukan (SBML)"                                     | Kepanjangannya salah. SBML = Standar Biaya Masukan **Lainnya**                                                                            |
| B-3  | Bab II, Bab III, dan paragraf kebaruan | "SBM Gatekeeper"                                                   | Ganti menjadi "pemeriksaan batas SBML" atau "validasi batas honor". Istilah buatan sendiri dalam bahasa Inggris akan ditanya asal-usulnya |
| B-4  | Bab III, kerangka pikir dan metode     | "SBM" di enam tempat                                               | "SBML"                                                                                                                                    |
| B-5  | Gambar fishbone (Gambar 6)             | "cek batas SBM"                                                    | "cek batas SBML"                                                                                                                          |
| B-6  | Bab I 1.2.1 dan 1.4.1                  | "sesuai standar GSBPM"                                             | Hapus. Sistem Anda tidak mengacu GSBPM, dan klaim ini tidak Anda buktikan di mana pun                                                     |
| B-7  | Tabel 10 (Bab IV)                      | jendela urung "±5 detik"                                           | Pilih satu angka, lalu samakan. Di aplikasi nilainya 6 detik (`autoCloseDelay={6000}`)                                                    |
| B-8  | Bab V 5.1.5                            | "sekitar 5 detik"                                                  | sama seperti B-7                                                                                                                          |
| B-9  | Bab IV 4.2.3                           | "sekitar 6 detik"                                                  | sama seperti B-7                                                                                                                          |
| B-10 | Bab IV 4.2.3                           | "Delapan activity diagram berikut"                                 | "Sepuluh activity diagram berikut"                                                                                                        |
| B-11 | Tabel 11 (Ringkasan Activity Diagram)  | 8 baris, kolom "Pelaku"                                            | 10 baris, kolom "Partisi" (isi barunya ada di `draf-bab4-activity-diagram.md`)                                                            |
| B-12 | Bab V 5.1.4                            | "Empat bagian berikut"                                             | Hitung ulang. Setelah ditambah butir g, jumlahnya tujuh                                                                                   |
| B-13 | Bab IV, Rancangan Antarmuka            | subbab bernomor 4.2.4.1 dan 4.2.4.2 padahal induknya 4.2.5         | 4.2.5.1 dan 4.2.5.2                                                                                                                       |
| B-14 | Judul Gambar 5                         | "Activity Diagram Proses Bisnis **Proses Bisnis** Sistem Berjalan" | Kata "Proses Bisnis" tertulis dua kali                                                                                                    |
| B-15 | Bab IV 4.1, daftar narasumber          | penomoran (1)(2)(2)(3)(3)(4)(5)                                    | Nomornya kembar. Urutkan ulang                                                                                                            |
| B-16 | Bab IV 4.1, daftar narasumber          | "Penjabat Pembuat Komitmen"                                        | "Pejabat Pembuat Komitmen"                                                                                                                |
| B-17 | Bab IV 4.1, daftar narasumber          | ada potongan teks berwarna merah ("administrasi pengadaan;")       | Sisa penyuntingan. Kembalikan ke warna hitam                                                                                              |
| B-18 | Tabel 2 (Komponen Activity Diagram)    | tidak memuat _fork_ dan _join_                                     | Gambar 7 memakai batang percabangan serentak, tetapi lambangnya tidak dijelaskan. Lihat D-4                                               |
| B-19 | Bab IV 4.1.3                           | menyebut "Kepala BPS" sebagai pengguna                             | Tabel 9 Definisi Aktor dan use case diagram tidak memuat Kepala BPS. Lihat B-19b                                                          |
| B-20 | Bab IV, struktur tabel `kegiatan`      | memuat kolom `adaListing` dan `isFasih`                            | Keduanya tidak punya kendali di antarmuka. Jelaskan seperti pada KNF-07, atau penguji akan bertanya di mana menu-nya                      |
| B-21 | Bab V                                  | rujukan silang "Tabel 3" menunjuk tabel Lighthouse                 | Tabel 3 adalah kategori CSUQ. Perbaiki nomornya                                                                                           |
| B-22 | Tabel 31, 32, 34, 45                   | ada sel yang kosong                                                | Isi atau hapus barisnya                                                                                                                   |
| B-23 | Setelah Tabel 45                       | judul "Tabel 46." tanpa tabel                                      | Hapus                                                                                                                                     |
| B-24 | Bab II, penjelasan React Router | isinya menjelaskan Node.js | Tersalin dari paragraf sebelumnya. Teks penggantinya ada di bagian **B-24b** di bawah tabel ini |
| B-25 | Bab II dan bagian 2.2                  | klaim "26,85 %" dari Saputro & Novita                              | Angka ini belum saya temukan di sumbernya. Periksa sendiri; bila tidak ketemu, hapus angkanya dan cukup tulis "lebih cepat"               |
| B-26 | Bab I, Bab IV, abstrak                 | tiga kepanjangan berbeda untuk nama sistem                         | Pilih satu kepanjangan SIKAMI, lalu pakai di semua tempat                                                                                 |
| B-27 | Bab II, teori ERD                      | menjelaskan notasi Chen (persegi, belah ketupat, elips)            | Gambar 19–22 memakai notasi _crow's foot_. Lihat D-3                                                                                      |

### B-24b. Teks pengganti subbab React Router

> **Di naskah Anda:** Bab II, subbab **React Router**.
>
> **Cari:** paragraf di bawah judul React Router yang isinya menyebut Node.js,
> _runtime_ JavaScript, atau pemrosesan di sisi peladen. Ciri termudahnya,
> paragraf itu hampir sama bunyinya dengan paragraf pada subbab Node.js di
> atasnya.
>
> **Tindakan:** hapus seluruh paragraf itu, lalu ganti dengan dua paragraf di
> bawah ini. Judul subbabnya tetap.

**Teks siap salin:**

> React Router adalah pustaka pengatur perpindahan halaman pada aplikasi yang
> dibangun dengan React. Pada aplikasi satu halaman, perpindahan antarhalaman
> tidak dilakukan dengan meminta berkas halaman baru kepada peladen, melainkan
> dengan menukar komponen yang sedang ditampilkan sesuai alamat yang dibuka
> pengguna. React Router menyediakan pemetaan antara pola alamat dan komponen
> yang harus ditampilkan untuk alamat tersebut, sehingga alamat pada bilah
> peramban tetap berubah dan tombol maju serta mundur peramban tetap berfungsi
> seperti biasa meskipun halaman tidak dimuat ulang.
>
> Pada penelitian ini React Router dipakai untuk mengatur seluruh halaman sistem,
> termasuk membatasi halaman yang hanya boleh dibuka oleh pengguna yang sudah
> masuk. Karena perpindahan halaman tidak memuat ulang seluruh berkas aplikasi,
> tampilan berganti lebih cepat dan pemakaian jaringan berkurang. Hal ini penting
> karena sistem diakses dari luar kantor melalui jaringan pribadi maya, yang
> kecepatannya lebih terbatas daripada jaringan kantor.

**Perlukah sitasi?** Tidak wajib. Paragraf pertama menjelaskan kegunaan sebuah
pustaka, dan itu setara dengan menyebut nama perkakas. Tetapi bila subbab
teknologi lain di Bab II Anda semuanya bersitasi — Node.js dengan Tilkov dan
Vinoski (2010), React dengan Annaram (2024), Tailwind dengan Santoso (2025),
Express dengan Saputro dan Novita (2025) — maka subbab ini akan terlihat ganjil
bila sendirian tanpa sitasi. Dalam hal itu, pasang **(Annaram, 2024)** di akhir
paragraf pertama: rujukan itu membahas pemakaian komponen React pada aplikasi
proses bisnis, dan perpindahan halaman berbasis komponen termasuk di dalamnya.

**Sekalian periksa paragraf Node.js-nya.** Karena teks React Router tersalin dari
sana, ada kemungkinan paragraf Node.js sendiri ikut terpotong atau tertimpa saat
penyuntingan dulu. Baca ulang keduanya berurutan dan pastikan tidak ada kalimat
yang sama muncul dua kali.

### B-19b. Soal aktor Kepala BPS

Ini perlu Anda putuskan, bukan sekadar diperbaiki.

Di Bab I Anda menyebut bahwa Kepala BPS tidak dapat memantau progres seluruh tim
dalam satu tampilan. Itu bagian dari pokok masalah pemantauan. Tetapi di Bab IV,
Kepala BPS tidak ada di Tabel 9 maupun di use case diagram. Penguji yang teliti
akan bertanya: "Masalahnya Kepala BPS tidak bisa memantau, lalu di rancangan
Kepala BPS-nya ke mana?"

Di aplikasi, Kepala BPS masuk memakai akun biasa dengan peran `user`, jadi
secara teknis ia adalah **Pegawai**. Karena itu jawaban yang paling jujur dan
paling mudah dipertahankan adalah menambahkan satu kalimat pada definisi aktor
Pegawai, bukan menambah aktor baru:

> **Teks siap salin** — tambahkan pada Tabel 9, di dalam sel penjelasan aktor
> **Pegawai**, sesudah kalimat yang sudah ada:
>
> Kepala BPS termasuk dalam aktor ini. Kepala BPS tidak memiliki peran tersendiri
> di dalam sistem karena kebutuhannya adalah melihat dasbor pemantauan seluruh
> tim, dan kebutuhan itu sudah tercakup pada hak akses Pegawai.

Dengan begitu Bab I dan Bab IV tersambung, dan Anda tidak perlu menambah peran
baru di aplikasi.

---

## C. Tiga pembaruan aplikasi yang harus masuk buku

Ketiganya sudah berjalan di aplikasi, jadi bila tidak ditulis, buku Anda
tertinggal dari sistemnya.

Ringkasan kebutuhan yang diwujudkan tiap pembaruan:

| Pembaruan | KF/KNF yang diwujudkan | Subbab yang harus disunting |
| --- | --- | --- |
| Basis data kecamatan dan desa memakai kode wilayah BPS | **KF-03** (Impor Mitra dari SOBAT), menopang **KF-02** dan **KF-05** | 4.1.3 KF-03; 4.2.4 tabel kecamatan dan desa; ERD |
| Notifikasi untuk PML | **KF-10** (Notifikasi Otomatis), menopang **KF-07** | 4.1.3 KF-10; narasi activity diagram progres |
| Progres terkunci selama tahap Persiapan | **KF-07** (Pemantauan Progres), menopang **KNF-04** (Integritas Data) | 4.1.3 KF-07; activity diagram progres |

Kolom kedua itulah yang perlu Anda tuliskan di naskah, karena setiap perubahan
rancangan harus dapat ditelusuri ke kebutuhan yang mendasarinya. Tanpa itu,
penambahan fitur akan terlihat seperti keputusan sesaat. Kalau penguji membuka aplikasi dan menemukan perilaku
yang tidak ada di buku, itu justru lebih merugikan daripada fitur yang tidak
ada sama sekali.

### C-1. Basis data kecamatan dan desa memakai kode wilayah BPS

**Apa yang berubah di aplikasi.** Tabel `kecamatan` dan `desa` kini menyimpan
kode wilayah BPS tiga digit, di samping namanya. Kodenya dipakai untuk
mencocokkan wilayah mitra saat impor, karena berkas ekspor PALAPA yang rutin
dipakai hanya menuliskan kode wilayah tanpa nama — kolom Alamat Kecamatan berisi
angka seperti `040` dan Alamat Desa berisi `033`. Kode itu tidak bisa ditebak
dari urutan baris: kecamatan Manna punya 18 desa, tetapi kodenya melompat dari
`005` ke `030`.

> **Letakkan di:** Bab IV, 4.1.3, pada sel penjelasan **KF-03 (Impor Mitra dari
> SOBAT)**, sesudah kalimat "Tiap baris dicocokkan berdasarkan ID SOBAT atau
> nama".
>
> **Teks siap salin:**
>
> Wilayah mitra pada berkas impor dituliskan sebagai kode, bukan nama, sehingga
> sistem menyimpan kode wilayah BPS tiga digit pada data kecamatan dan desa dan
> memakainya untuk mencocokkan wilayah setiap baris impor. Baris yang kodenya
> tidak dikenali tetap ditampilkan pada pratinjau dengan wilayah kosong agar
> dapat diperbaiki lebih dulu, bukan ditolak diam-diam.

> **Letakkan juga di:** Bab IV, 4.2.4 Rancangan Basis Data, pada tabel rinci
> **kecamatan** dan **desa**. Tambahkan satu baris pada masing-masing:
>
> | Kolom  | Tipe    | Keterangan                                               |
> | ------ | ------- | -------------------------------------------------------- |
> | `kode` | char(3) | Tiga digit kode kecamatan BPS, unik dalam satu kabupaten |
>
> | Kolom  | Tipe    | Keterangan                                          |
> | ------ | ------- | --------------------------------------------------- |
> | `kode` | char(3) | Tiga digit kode desa BPS, unik dalam satu kecamatan |

**Gambar yang harus diganti:** ERD bagian kegiatan dan alokasi. Berkasnya sudah
saya perbarui dan ekspor ulang ke `out/erd-kegiatan-alokasi.svg`.

### C-2. Notifikasi untuk PML

**Apa yang berubah di aplikasi.** Sebelumnya semua jenis notifikasi mensyaratkan
pemegang ketua tim atau Tim Keuangan, sehingga akun PML biasa praktis tidak
pernah menerima apa pun — padahal PML-lah yang mengisi progres. Kini PML
menerima peringatan bila mitra yang diawasinya belum berprogres sama sekali
sedangkan masa pendataan tinggal tujuh hari atau kurang.

Dua hal yang penting untuk ditulis dengan benar, karena keduanya adalah
keputusan rancangan, bukan kebetulan:

- Penerimanya ditentukan dari **siapa yang tercatat sebagai PML mitra tersebut**,
  bukan dari peran akunnya. Di kantor ini seorang pegawai Tim Keuangan pun bisa
  mengawasi mitra.
- Tahap pertama (status _open_ untuk pendataan dan _belum entry_ untuk
  pengolahan) **tidak dihitung sebagai progres**, karena tahap itu terisi
  otomatis sebesar beban kerja begitu mitra dialokasikan. Kalau dihitung, setiap
  mitra akan tampak sudah bekerja penuh sejak hari pertama dan peringatannya
  tidak akan pernah muncul.

> **Letakkan di:** Bab IV, 4.1.3, pada sel penjelasan **KF-10 (Notifikasi
> Otomatis)**, sesudah kalimat tentang notifikasi Tim Keuangan dan sebelum
> kalimat "Notifikasi hilang sendiri setelah penyebabnya selesai."
>
> **Teks siap salin:**
>
> PML menerima peringatan untuk mitra yang diawasinya yang belum memiliki progres
> sama sekali sedangkan masa pengumpulan data tinggal tujuh hari atau kurang.
> Penerima peringatan ini ditentukan dari catatan PML pada alokasi mitra, bukan
> dari peran akun, karena pegawai dengan peran apa pun dapat ditugaskan mengawasi
> mitra. Peringatan dikirim satu kali untuk setiap kegiatan dan tahap, bukan satu
> kali untuk setiap mitra, agar daftar notifikasi tidak dipenuhi baris yang
> hampir sama, dan tetap tampil sampai tujuh hari sesudah tenggat agar kegiatan
> yang telanjur terlewat tetap terlihat.

### C-3. Progres tidak dapat diisi selama tahap Persiapan

**Apa yang berubah di aplikasi.** Progres mitra baru dapat diisi sejak hari
pertama masa pengumpulan data. Selama kegiatan masih dalam tahap Persiapan,
pengisian ditolak. Batas atasnya sengaja tidak ada: pendataan sering molor dan
masih ada mitra yang menyelesaikan bagiannya sesudah tanggal selesai terlewat,
sehingga menutup pengisian tepat pada tanggal itu justru membuat pekerjaan yang
benar-benar terjadi tidak dapat dicatat.

> **Letakkan di:** Bab IV, 4.1.3, pada sel penjelasan **KF-07 (Pemantauan
> Progres)**, sesudah kalimat "Total progres tidak boleh melebihi beban kerja."
>
> **Teks siap salin:**
>
> Pengisian progres hanya terbuka sejak hari pertama masa pengumpulan data.
> Selama kegiatan masih berada pada tahap Persiapan, sistem menolak pengisian
> karena mitra belum bekerja sehingga angka apa pun yang masuk pasti keliru, dan
> angka keliru tersebut akan langsung terbawa ke persentase kegiatan, dasbor, dan
> rekapitulasi. Setelah masa pengumpulan data berakhir, pengisian tidak ditutup
> kembali, karena pendataan kerap berlangsung melewati jadwal dan pekerjaan yang
> benar-benar terjadi tetap perlu dapat dicatat.

**Gambar yang harus diganti:** activity diagram penginputan progres. Berkasnya
sudah saya perbarui dengan percabangan baru dan diekspor ke
`out/activity-input-progres.svg`.

**Tambahan untuk Bab V.** Ketiga pembaruan di atas juga sebaiknya punya kasus uji
di tabel Black Box, supaya pengujian Anda benar-benar menutupi seluruh
kebutuhan fungsional. Tambahkan tiga baris:

Kolomnya harus sama persis dengan tabel Black Box yang sudah ada di Bab V,
yaitu tujuh kolom dengan **KF** pada kolom kedua. Kolom Hasil Pengujian dan
Kesimpulan diisi setelah Anda benar-benar mengujinya.

| Kode  | KF     | Skenario Pengujian                            | Data Masukan                                                                 | Hasil yang Diharapkan                                                                                     | Hasil Pengujian | Kesimpulan |
| ----- | ------ | --------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------- | ---------- |
| BB-48 | KF-03  | Impor mitra dengan kode wilayah yang dikenali | Berkas PALAPA dengan Alamat Kec `040` dan Alamat Desa `002`                  | Pratinjau menampilkan kecamatan Manna dan desa Ketaping                                                   |                 |            |
| BB-49 | KF-03  | Impor mitra dengan kode wilayah tak dikenali (BVA) | Berkas PALAPA dengan Alamat Kec `999`                                    | Baris tetap tampil pada pratinjau dengan wilayah kosong, bukan ditolak diam-diam                          |                 |            |
| BB-50 | KF-10  | Notifikasi PML untuk mitra tanpa progres      | Kegiatan dengan tenggat pengumpulan data 5 hari lagi dan mitra tanpa progres | Akun PML mitra tersebut menerima satu notifikasi peringatan                                               |                 |            |
| BB-51 | KF-07  | Pengisian progres saat tahap Persiapan        | Kegiatan dengan tanggal mulai pengumpulan data masih di masa depan           | Sistem menolak dan menampilkan pesan bahwa progres baru dapat diisi setelah masa pengumpulan data dimulai |                 |            |
| BB-52 | KF-07  | Pengisian progres pada hari pertama pendataan (BVA) | Kegiatan dengan tanggal mulai pengumpulan data sama dengan hari ini     | Pengisian diterima                                                                                        |                 |            |

---

## D. Tinjauan pustaka yang masih kurang

Yang sudah pernah saya siapkan sebelumnya (diagram tulang ikan, _wireframe_, dan
HMAC-SHA256) ada di `PANDUAN-PENERAPAN-REVISI.md` butir II-15. Jangan dikerjakan
dua kali. Empat yang di bawah ini **belum pernah saya sebut** dan muncul dari
pembacaan naskah utuh.

### D-1. Pembuatan dokumen secara otomatis

> **Sudah diperbarui.** Rujukannya kini sudah ditemukan dan teks lengkapnya dipindahkan ke `PANDUAN-SITASI-FINAL.md` butir **C-8**. Pakai yang di sana, karena versi di bawah ini belum bersitasi.

Ini yang paling perlu, karena **manfaat pertama sistem Anda adalah pembuatan SPK
dan BAST otomatis**, tetapi di Bab II tidak ada satu pun teori yang menopangnya.
Penguji berhak bertanya, "Dasar teorinya apa?"

> **Letakkan di:** Bab II, sesudah subbab yang membahas sistem informasi
> manajemen atau otomatisasi proses bisnis, sebelum subbab teknologi
> (Node.js/React).
> **Judul subbab:** Pembuatan Dokumen Secara Otomatis
>
> **Teks siap salin:**
>
> Pembuatan dokumen secara otomatis adalah penyusunan berkas keluaran dari
> gabungan dua bagian, yaitu templat yang isinya tetap dan data yang diambil dari
> basis data. Bagian yang tetap memuat susunan naskah, kalimat baku, dan
> tata letaknya, sedangkan bagian yang berubah diisikan pada penanda tertentu di
> dalam templat ketika dokumen dibentuk. Cara ini membuat seluruh dokumen yang
> dihasilkan memiliki bentuk yang seragam, dan perubahan pada kalimat baku cukup
> dilakukan sekali di templat tanpa menyunting dokumen yang sudah ada satu per
> satu.
>
> Keuntungan utama cara ini bukan sekadar kecepatan, melainkan hilangnya
> kesalahan penyalinan. Pada penyusunan dokumen secara manual, setiap angka dan
> nama diketik ulang sehingga selisih antara isi dokumen dan isi basis data
> mungkin terjadi tanpa disadari. Pada pembuatan otomatis, angka pada dokumen
> berasal dari sumber yang sama dengan angka pada layar, sehingga keduanya tidak
> dapat berbeda.
>
> Pada penelitian ini, Surat Perjanjian Kerja dan Berita Acara Serah Terima
> dibentuk dengan cara tersebut dalam bentuk berkas PDF, dengan templat yang
> dapat diatur pengguna dan penomoran yang diberikan sistem.

> **Rujukannya perlu Anda cari sendiri.** Saya tidak memasukkan nama penulis di
> sini karena belum memeriksanya. Kata kunci yang mudah membuahkan hasil di
> Google Scholar: "otomatisasi pembuatan dokumen sistem informasi", "generate
> dokumen PDF berbasis template", "document generation web application". Cari
> satu artikel jurnal nasional terakreditasi terbitan tiga tahun terakhir, lalu
> pasang sitasinya di akhir paragraf pertama. Paragraf kedua dan ketiga adalah
> penalaran Anda sendiri sehingga tidak wajib bersitasi.

### D-2. Pengujian kotak hitam: kelas ekuivalensi dan nilai batas

Bab V Anda memakai dua teknik ini (tabel Black Box Anda memang disusun dengan
_Equivalence Partitioning_ dan _Boundary Value Analysis_), tetapi di Bab II
keduanya tidak dijelaskan. Menjelaskan teknik pengujian hanya di Bab III atau
Bab V biasanya ditegur karena landasan teori seharusnya berada di Bab II.

> **Letakkan di:** Bab II, di dalam subbab pengujian perangkat lunak yang sudah
> ada, sesudah paragraf yang menjelaskan pengujian kotak hitam secara umum.
>
> **Teks siap salin:**
>
> Pengujian kotak hitam dapat dilakukan dengan beberapa teknik, dan dua di
> antaranya dipakai pada penelitian ini. Teknik pertama adalah pembagian kelas
> ekuivalensi, yaitu mengelompokkan masukan yang diperlakukan sama oleh sistem ke
> dalam satu kelas, lalu menguji cukup satu wakil dari tiap kelas. Teknik ini
> menekan jumlah kasus uji tanpa mengurangi cakupannya, karena masukan dalam satu
> kelas yang sama akan menghasilkan perilaku yang sama pula.
>
> Teknik kedua adalah analisis nilai batas, yaitu menguji masukan yang berada
> tepat di tepi setiap kelas beserta satu nilai di luarnya. Teknik ini dipakai
> karena kesalahan program paling sering terjadi pada batas, misalnya pada
> perbandingan yang seharusnya memakai "lebih besar atau sama dengan" tetapi
> tertulis "lebih besar". Pada penelitian ini kedua teknik dipakai bersama:
> kelas ekuivalensi untuk menentukan kasus uji yang mewakili tiap jenis masukan,
> dan analisis nilai batas untuk menguji tepian aturan seperti batas honor
> bulanan, panjang kata sandi, dan rentang nilai penilaian mitra.

> **Rujukannya sudah ada di daftar Anda** bila Pressman & Maxim (2015) jadi
> dimasukkan ke Daftar Pustaka (lihat A-2). Pasang sitasinya di akhir paragraf
> pertama.

### D-3. Notasi ERD yang Anda pakai bukan notasi Chen

> **Sudah diperbarui.** Rujukannya kini sudah ditemukan, yaitu Everest (1976). Lihat `PANDUAN-SITASI-FINAL.md` butir **C-9** untuk tempat memasang sitasinya pada teks di bawah ini.

Bab II menjelaskan notasi Chen (entitas berbentuk persegi panjang, relasi
belah ketupat, atribut elips), tetapi Gambar 19–22 memakai notasi _crow's foot_
dengan atribut tertulis di dalam kotak entitas. Perbedaan ini akan terlihat
begitu penguji membalik halaman.

> **Letakkan di:** Bab II, di dalam subbab ERD, sebagai paragraf penutup subbab
> tersebut.
>
> **Teks siap salin:**
>
> Selain notasi Chen, terdapat notasi _crow's foot_ yang lebih banyak dipakai
> pada perancangan basis data relasional. Pada notasi ini setiap entitas
> digambarkan sebagai satu kotak yang memuat seluruh atributnya, sedangkan
> kardinalitas hubungan dinyatakan oleh bentuk ujung garis: satu garis tegak
> berarti tepat satu, lingkaran berarti boleh tidak ada, dan cabang tiga
> menyerupai kaki burung berarti banyak. Notasi inilah yang dipakai pada
> perancangan basis data penelitian ini, karena jumlah atribut tiap entitas cukup
> banyak sehingga penggambaran atribut sebagai elips terpisah akan membuat
> diagramnya sulit dibaca.

### D-4. Lambang percabangan serentak pada activity diagram

> **Letakkan di:** Bab II, **Tabel 2 (Komponen Activity Diagram)**. Tambahkan dua
> baris di bawah baris _decision_:

| Lambang                                                        | Nama   | Keterangan                                                                      |
| -------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| Batang tebal dengan satu garis masuk dan beberapa garis keluar | _Fork_ | Menandai beberapa aktivitas yang berjalan serentak dan tidak saling menunggu    |
| Batang tebal dengan beberapa garis masuk dan satu garis keluar | _Join_ | Menandai titik temu aktivitas serentak; alur berlanjut setelah semuanya selesai |

Kalau Tabel 2 juga belum memuat lambang **lajur (_swimlane_)**, tambahkan satu
baris lagi:

| Lambang                                          | Nama               | Keterangan                                                |
| ------------------------------------------------ | ------------------ | --------------------------------------------------------- |
| Kolom berjudul yang membagi diagram secara tegak | Lajur (_swimlane_) | Menunjukkan pihak yang melaksanakan aktivitas di dalamnya |

Ini bukan hal sepele. Anda sudah diingatkan sendiri bahwa setiap bentuk pada
gambar harus ada penjelasannya, dan _fork_/_join_ dipakai justru pada Gambar 7
yang merupakan gambar terpenting di Bab IV.

---

## E. Keterbacaan gambar

### E-1. Duduk perkaranya

Ini bukan perasaan Anda saja, dan angkanya bisa dihitung. Lebar teks pada
kertas A4 dengan batas tepi 4-3-3-3 cm adalah 14 cm, atau sekitar 529 titik
pada resolusi 96 titik per inci. Huruf pada diagram berukuran 12 titik, setara
9 pt.

Diagram proses bisnis sistem berjalan semula selebar 2118 titik. Agar muat, Word
memperkecilnya menjadi 25 %, sehingga hurufnya tinggal **2,3 pt**. Itulah sebab
tulisannya tidak terbaca — bukan karena gambarnya pecah, melainkan karena
diperkecil terlalu jauh.

Dua hal yang melebarkan kanvas: **panjang label terpanjang di setiap lajur** dan
**kotak catatan yang menggantung di samping diagram**. Keduanya sudah saya
pangkas.

### E-2. Yang sudah saya kerjakan

Seluruh label aksi dipendekkan, kotak catatan di dalam diagram dihapus (isinya
memang sudah ada di narasi bawah gambar), dan dua diagram terlebar dipecah dua.
Hasilnya:

| Gambar                        | Semula      | Sekarang                          | Ukuran huruf di kertas  |
| ----------------------------- | ----------- | --------------------------------- | ----------------------- |
| Proses bisnis sistem berjalan | 2118 × 1442 | dipecah: 741 × 620 dan 942 × 866  | 2,3 pt → 8,2 dan 5,9 pt |
| Alur proses bisnis usulan     | 1327 × 1326 | dipecah: 887 × 672 dan 944 × 745  | 3,6 pt → 7,6 dan 6,8 pt |
| Use case                      | 1118 × 2010 | 1000 × 2010 (label SBML diperbaiki, catatan dihapus) | 4,0 pt → 4,0 pt |
| Pengarsipan dan penghapusan   | 1442 × 689  | 938 × 669                         | 3,3 pt → 7,6 pt         |
| Verifikasi dokumen            | 1266 × 1198 | 1035 × 1198                       | 3,8 pt → 4,6 pt         |
| Alokasi dan batas SBML        | 775 × 1789  | 554 × 1586                        | 4,5 pt → 5,1 pt         |
| Penginputan progres           | 660 × 911   | 478 × 1074                        | 7,2 pt → 7,5 pt         |
| Otentikasi                    | 780 × 1471  | 516 × 1470                        | 5,5 pt → 5,5 pt         |
| Riwayat penyuratan            | 1013 × 1374 | 727 × 1374                        | 4,7 pt → 5,9 pt         |

Berkas hasil ekspornya sudah ada di folder `out/`. Yang baru:

- `out/proses-berjalan-a.svg` dan `out/proses-berjalan-b.svg` (pengganti Gambar 5)
- `out/activity-usulan-a.svg` dan `out/activity-usulan-b.svg` (pengganti Gambar 7)
- `out/usecase.svg` (Gambar 8, dirender ulang dengan istilah SBML yang benar)

### E-3. Yang harus Anda kerjakan di Word

**Pertama, pakai halaman lanskap untuk gambar yang lebar.** Pada halaman
melintang, lebar teks menjadi 23,7 cm dan gambar bisa dipasang jauh lebih besar.
Caranya: letakkan kursor sebelum gambar, **Layout > Breaks > Next Page**, ulangi
sesudah gambar, lalu dengan kursor di halaman gambar pilih **Layout >
Orientation > Landscape**. Halaman lain tidak ikut berubah.

Gambar yang sebaiknya dipasang melintang: proses bisnis sistem berjalan (kedua
bagian), alur proses bisnis usulan (kedua bagian), verifikasi dokumen,
pengarsipan dan penghapusan, dan arsitektur sistem.

**Kedua, pecah dua gambar menjadi dua bagian.** Gambar 5 dan Gambar 7
masing-masing menjadi dua gambar. Supaya penomoran gambar sesudahnya tidak
ikut bergeser, beri nomor **5a dan 5b** serta **7a dan 7b**, bukan nomor baru.
Judulnya, misalnya:

> Gambar 5a. Activity Diagram Proses Bisnis Sistem Berjalan (Bagian 1:
> Penugasan sampai Penandatanganan SPK)
>
> Gambar 5b. Activity Diagram Proses Bisnis Sistem Berjalan (Bagian 2:
> Pemantauan Progres sampai Penilaian Mitra)

Tambahkan juga satu kalimat pengantar di narasinya, misalnya "Karena alurnya
panjang, diagram disajikan dalam dua bagian yang berurutan."

**Ketiga, satu hal yang melegakan:** seluruh gambar diekspor dalam bentuk SVG,
yaitu gambar vektor. Artinya gambarnya tetap tajam berapa pun perbesarannya.
Penguji yang membaca PDF di layar bisa memperbesar tanpa gambarnya pecah. Yang
terbatas hanyalah naskah tercetak. Jadi jangan sampai gambar SVG-nya Anda ganti
dengan tangkapan layar PNG, karena PNG akan buram saat diperbesar.

### E-4. Gambar yang masih di bawah 6 pt setelah semua perbaikan

Tiga gambar berikut tetap kecil bila dipasang tegak dan tidak bisa saya perbaiki
lagi tanpa membuang isinya:

| Gambar                               | Ukuran       | Saran                                                                                                                   |
| ------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Verifikasi dokumen (1035 × 1198)     | 4,6 pt tegak | Pasang melintang, jadi 4,3 pt — tetap kurang. Pecah dua pada titik "dokumen ditolak", sehingga tiap bagian sekitar 7 pt |
| Use case (1000 × 2010) | 4,0 pt | **Anda memutuskan tetap satu gambar.** Lihat catatan di bawah tabel |
| Alokasi dan batas SBML (554 × 1586)  | 5,1 pt       | Diagram ini tinggi, bukan lebar. Bila mau lebih besar, pecah dua pada titik penyimpanan                                 |

#### Catatan khusus use case diagram

Anda memutuskan Gambar 8 tetap satu gambar. Itu keputusan yang sah, tetapi Anda
perlu tahu akibatnya: dengan 34 use case yang tersusun menurun, tingginya 2010
titik dan hurufnya menjadi sekitar **4 pt** di kertas. Saya sudah mencoba
memperkecilnya tanpa memecah — memendekkan label, menghapus kotak catatan,
mengubah arah tata letak, merapatkan jarak antarsimpul, dan membuang kotak
pengelompokan — dan tidak satu pun berpengaruh berarti. Tingginya ditentukan
oleh banyaknya use case, bukan oleh panjang tulisannya.

Tiga hal yang membuat keputusan ini tetap aman:

1. **Beri gambar itu satu halaman penuh untuk dirinya sendiri**, tanpa teks lain.
   Itu ukuran terbesar yang mungkin.
2. **Gambarnya SVG**, jadi tetap tajam berapa pun perbesarannya. Penguji yang
   membaca PDF di layar dapat memperbesarnya tanpa pecah. Jangan sekali-kali
   menggantinya dengan tangkapan layar PNG.
3. **Rincian sebenarnya tidak dibaca dari gambar, melainkan dari tabel.**
   Pastikan Tabel 9 (Definisi Aktor) dan tabel deskripsi use case benar-benar
   lengkap. Gambar use case cukup menunjukkan susunan dan hubungannya; isinya
   dibaca dari tabel. Inilah alasan paling kuat bila penguji menyinggung
   ukurannya.

Bila kelak Anda berubah pikiran, pemecahannya dapat dibuatkan kembali kapan
saja — cukup minta.


---

## F. Saran peringkasan buku

Naskah Anda 213 halaman. Itu tidak salah, tetapi ada bagian yang memang dapat
dipangkas tanpa kehilangan isi, dan justru membuat bagian pentingnya lebih
menonjol.

**F-1. Hapus tabel yang muncul dua kali.** Tabel 39 (Kategori Penilaian
Lighthouse) mengulang Tabel 4, dan Tabel 44 (Kategori CSUQ) mengulang Tabel 3.
Ganti keduanya dengan satu kalimat rujukan ke Bab II. Hemat sekitar satu
halaman, sekaligus menutup risiko A-5.

**F-2. Ringkas tabel struktur basis data.** Delapan belas tabel yang masing-masing
dijabarkan kolom demi kolom memakan belasan halaman. Pertimbangkan menyisakan
tabel inti di dalam bab (`kegiatan`, `ppl`, `ppl_master`, `kontrak_mitra`,
`penilaian_mitra`) dan memindahkan tiga belas sisanya ke **Lampiran**. Isi bab
tetap lengkap karena ERD-nya sudah menampilkan semuanya.

**F-3. Pindahkan tabel pengujian yang panjang ke Lampiran.** Tabel Black Box
berisi 47 baris dan tabel keamanan 16 baris. Di dalam Bab V cukup ditampilkan
rekapitulasinya (jumlah kasus uji per modul dan jumlah yang berhasil), lalu
tabel rinciannya masuk Lampiran. Cara ini lazim dan membuat Bab V jauh lebih
enak dibaca.

**F-4. Potong pengulangan di Bab II.** Beberapa subbab teknologi (Node.js,
Express, React, React Router, MySQL) masing-masing punya dua sampai tiga
paragraf yang isinya mirip: apa itu, kelebihannya, alasan dipilih. Bagian
"alasan dipilih" sebaiknya dikumpulkan menjadi satu paragraf di akhir subbab
teknologi, bukan diulang di tiap alat.

**F-5. Jangan dipotong.** Bagian yang justru sebaiknya tetap panjang: identifikasi
masalah di Bab I, penjelasan tiap activity diagram di Bab IV, dan alasan
rancangan di Bab V. Itulah yang menunjukkan bahwa Anda memahami sistemnya
sendiri, dan itu yang paling sering ditanyakan.

**Perkiraan hasil:** F-1 sampai F-4 memangkas sekitar 25–35 halaman dari bab
utama, dan sebagian besar berpindah ke Lampiran, bukan hilang.

---

## G. Analisis risiko sidang

Bagian ini menjawab pertanyaan Anda secara langsung: apa yang bisa menyulitkan
Anda saat sidang.

### G-1. Risiko besar

| Risiko                          | Sebab                                                                                                               | Cara menutup                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Daftar Pustaka templat**      | A-1                                                                                                                 | Kerjakan A-1 dan A-2 sebelum apa pun yang lain           |
| **Buku dan aplikasi berbeda**   | Tiga pembaruan di bagian C belum ada di buku; `adaListing` dan `isFasih` ada di basis data tetapi tidak ada menunya | Kerjakan bagian C, dan jelaskan B-20 seperti pada KNF-07 |
| **Nama sistem tidak seragam**   | A-4 dan B-26                                                                                                        | Ctrl+H, lalu ganti gambar                                |
| **Istilah buatan sendiri**      | "SBM Gatekeeper"                                                                                                    | B-3                                                      |
| **Klaim yang tidak dibuktikan** | "sesuai standar GSBPM", angka "26,85 %"                                                                             | B-6 dan B-25                                             |

### G-2. Pertanyaan yang kemungkinan besar muncul, dan jawabannya

**"Kenapa perekrutan mitra tidak masuk sistem Anda?"**
Karena perekrutan sudah ditangani aplikasi SOBAT milik BPS pusat. Sistem ini
mengambil alih sejak mitra sudah terdaftar, yaitu dari penginputan kegiatan
sampai penilaian. Pastikan kalimat ini ada di batasan penelitian Bab I.

**"Sistem Anda mengurangi pekerjaan manual apa saja? Progres masih diinput
manual, kan?"**
Betul, dan itu memang harus Anda akui lebih dulu. Integrasi FASIH belum
tersambung, jadi progres tetap diinput PML. Yang berkurang adalah penyalinan
data mitra ke spreadsheet honor, pengetikan dan penomoran SPK serta BAST satu per
satu, penggabungan berkas honor antartim, dan perhitungan peringkat triwulan.
**Jangan mengklaim sistem mengurangi rekap progres manual.**

**"Dulu sudah ada spreadsheet pengecekan SBML. Apa bedanya?"**
Bedanya bukan ada atau tidak adanya alat, melainkan spreadsheet itu tidak
mencegah dan tidak mendeteksi sendiri. Kelebihan honor baru ketahuan bila
seseorang mencocokkan data satu per satu, dan datanya harus dipindahkan lebih
dulu dari berkas tim lain. Sistem ini menjumlahkan honor tiap mitra dari seluruh
kegiatan dan seluruh tim pada saat penyimpanan, lalu menolak melanjutkan sebelum
ada konfirmasi. **Jangan menjawab "dulu tidak ada spreadsheet".**

**"Kenapa Lighthouse? Bukankah itu hanya mengukur kecepatan muat halaman?"**
Jawabannya sudah disiapkan di `PANDUAN-PENERAPAN-REVISI.md`: pengujian kinerja
Anda punya dua bagian, dan yang utama adalah perbandingan waktu pengerjaan
proses bisnis lama dan baru, karena itulah yang menjawab tujuan penelitian.
Lighthouse hanya penunjang. Pastikan urutan subbabnya memang begitu di naskah.

**"Mana aktor Kepala BPS?"**
Lihat B-19b.

**"Kenapa jendela pembatalan hanya beberapa detik?"**
Karena kegiatan yang baru dibuat bisa langsung dipakai orang lain — dikontrak
atau diisi PPL-nya — sehingga jendela pembatalan yang lama justru membuka
peluang kehilangan data karena kekeliruan maupun kesengajaan. Untuk keadaan
mendesak, penghapusan dilakukan Admin, dan Admin pun ditolak bila kegiatannya
sudah punya alokasi mitra atau penilaian. Pastikan angka detiknya seragam
(B-7 sampai B-9).

### G-3. Risiko kecil yang tetap sebaiknya ditutup

- Sel kosong di Tabel 31, 32, 34, dan 45 (B-22).
- Judul "Tabel 46." tanpa tabel (B-23).
- Penjelasan React Router yang tersalin dari Node.js (B-24).
- Penomoran narasumber yang kembar (B-15).
- Teks berwarna merah yang tertinggal (B-17).

Semuanya kecil, tetapi kesan yang ditimbulkan sama: naskah belum dibaca ulang.
Penguji yang menemukan tiga hal seperti ini di awal cenderung membaca sisanya
dengan lebih curiga.

---

## H. Daftar periksa sebelum cetak

Centang satu per satu.

**Wajib**

- [ ] Daftar Pustaka diganti, seluruh sitasi di naskah punya pasangan (A-1, A-2)
- [ ] Daftar Isi, Daftar Tabel, dan Daftar Gambar diperbarui (A-3)
- [ ] Tidak ada lagi kata "OPTIMA", termasuk di dalam gambar (A-4)
- [ ] Tabel 44 dan Tabel 39 dihapus, diganti rujukan ke Bab II (A-5, F-1)
- [ ] Rumus nilai akhir peringkat memakai tanda tambah (A-6)
- [ ] Seluruh "SBM" menjadi "SBML", "SBM Gatekeeper" dihapus (B-1 s.d. B-5)
- [ ] Klaim GSBPM dihapus (B-6)
- [ ] Angka detik jendela pembatalan seragam (B-7 s.d. B-9)
- [ ] "Delapan activity diagram" menjadi sepuluh, Tabel 11 menjadi 10 baris (B-10, B-11)
- [ ] Tiga pembaruan aplikasi masuk KF-03, KF-07, dan KF-10 (bagian C)

**Sangat dianjurkan**

- [ ] Penomoran subbab 4.2.5.1 diperbaiki (B-13)
- [ ] Judul Gambar 5 tidak berulang kata (B-14)
- [ ] Kepala BPS dijelaskan di Tabel 9 (B-19b)
- [ ] Tabel 2 memuat fork, join, dan lajur (D-4)
- [ ] Subbab pembuatan dokumen otomatis ditambahkan ke Bab II (D-1)
- [ ] Subbab kelas ekuivalensi dan nilai batas ditambahkan ke Bab II (D-2)
- [ ] Paragraf notasi crow's foot ditambahkan ke Bab II (D-3)
- [ ] Gambar 5, 7, dan 8 diganti dengan versi yang sudah dipecah (E-2, E-3)
- [ ] Gambar lebar dipasang di halaman lanskap (E-3)

**Bila sempat**

- [ ] Tabel struktur basis data dan tabel pengujian dipindahkan ke Lampiran (F-2, F-3)
- [ ] Pengulangan di Bab II dipangkas (F-4)
- [ ] Sel kosong dan judul tabel yatim dibereskan (B-22, B-23)
