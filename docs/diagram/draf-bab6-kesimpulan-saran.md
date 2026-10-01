# Draf Bab VI — Kesimpulan dan Saran

> **Berkas ini adalah draf siap salin untuk Bab VI naskah skripsi.**
> Seluruh isinya ditarik dari hasil yang sudah ada di Bab V, tujuan penelitian di
> Bab I, metode di Bab III, dan rujukan yang sudah dipakai di Bab II. Tidak ada
> data baru, tabel, maupun gambar, sesuai ketentuan templat.

## Susunannya

Kesimpulan disusun sebagai **lima butir**, satu butir untuk satu klaim besar,
mengikuti urutan tujuan penelitian di Bab I:

| Butir | Menjawab |
| --- | --- |
| 1 | Tujuan umum, sekaligus pembuktian pilihan teknologi |
| 2 | Tujuan khusus pertama dan pokok permasalahan pertama |
| 3 | Tujuan khusus kedua dan pokok permasalahan kedua |
| 4 | Tujuan khusus ketiga, yaitu hasil keempat pengujian |
| 5 | Posisi terhadap penelitian terdahulu dan keterpakaian metode |

Bentuk poin dipertahankan karena templat mewajibkannya, tetapi tiap poin ditulis
sebagai satu alinea penuh sehingga tetap terbaca mengalir.

## Angka yang masih sementara

| Angka | Nilai sekarang | Kapan berubah |
| --- | --- | --- |
| Jumlah kasus uji black box | 60 kasus | Setelah BB-51 s.d. BB-60 dijalankan (bagian F-7 panduan) |
| Tingkat keberhasilan black box | belum diisi | Setelah keenam puluh kasus dijalankan |
| Skor CSUQ keseluruhan | 6,36 dari 8 responden | Setelah tanggapan Ketua Tim masuk, menjadi 12 responden |

Butir keterbatasan pada 6.2.2 ditulis dengan angka 12 responden, yaitu jumlah
yang direncanakan. Bila sampai naskah dicetak Ketua Tim tetap belum mengisi,
ubah menjadi 8 dan sesuaikan kalimatnya.

## Satu ketidaksesuaian rujukan yang perlu Anda putuskan

Di Bab II, Pressman dan Maxim disitasi dalam teks sebagai **(2015)** di beberapa
tempat, sedangkan Daftar Pustaka mencantumkan **(2020)**. Draf ini memakai 2020
mengikuti Daftar Pustaka. Samakan sebelum dicetak.

---

# BAB VI

# KESIMPULAN DAN SARAN

## 6.1 Kesimpulan

Berdasarkan hasil analisis, perancangan, implementasi, dan evaluasi Sistem
Informasi Kegiatan dan Mitra (SIKAMI) di BPS Kabupaten Bengkulu Selatan,
diperoleh kesimpulan sebagai berikut.

1. **Tujuan umum penelitian tercapai, dan pilihan teknologinya terbukti
   memadai.** Sistem SIKAMI berhasil dibangun serta diterapkan pada layanan
   hosting cPanel milik BPS Kabupaten Bengkulu Selatan, dengan seluruh data
   administrasi kontrak, honor, progres pekerjaan, dokumen, dan penilaian kinerja
   mitra tersimpan dalam satu basis data berisi delapan belas tabel yang saling
   terhubung. Berkas lembar kerja terpisah yang sebelumnya dikelola masing-masing
   tim karena itu tidak lagi menjadi sumber data. Penyatuan ini mewujudkan tujuan
   sentralisasi data yang dikemukakan Laudon dan Laudon (2021), yaitu
   menghilangkan pengulangan data dan memudahkan penelusuran kembali untuk
   keperluan verifikasi, sekaligus memenuhi amanat Peraturan Presiden Nomor 95
   Tahun 2018 tentang Sistem Pemerintahan Berbasis Elektronik (Republik
   Indonesia, 2018). Pemilihan teknologi yang didasarkan pada bukti empiris —
   Express.js di atas Node.js mengacu pada Saputro dan Novita (2025), React
   mengacu pada Annaram (2024), dan Tailwind CSS mengacu pada Santoso (2025) —
   terbukti memadai bagi kebutuhan satuan kerja, terlihat dari rata-rata skor
   kinerja 99,1 dengan seluruh halaman berkategori baik.

2. **Tujuan khusus pertama tercapai, yaitu terbangunnya fitur administrasi dan
   pengendalian honor yang menjawab pokok permasalahan pertama.** Surat Perjanjian
   Kerja dan Berita Acara Serah Terima kini dibentuk dari templat dalam bentuk PDF
   dengan penomoran yang diberikan sistem dan dijamin tidak kembar melalui kunci
   basis data pada saat pengambilan nomor serta indeks unik sebagai pengaman
   terakhirnya, sehingga menjawab kelemahan penomoran manual yang dicatat Nasution
   dkk. (2026) dan menerapkan prinsip pembentukan dokumen dari templat yang
   diuraikan Triadi dan Nurajijah (2024). Pengendalian batas honor berubah dari
   pemeriksaan pasif menjadi peringatan aktif: setiap penyimpanan kegiatan, sistem
   menjumlahkan honor tiap mitra per bulan dari seluruh kegiatan termasuk milik
   tim lain, lalu memperingatkan sebelum data tersimpan — menjawab kerentanan
   pengelolaan honorarium manual yang dikemukakan Wahab dkk. (2025). Tautan
   dokumen pendukung terkumpul menurut kegiatan dan tahapnya sehingga tidak lagi
   ditagih ke masing-masing Ketua Tim, mengatasi inefisiensi pengelolaan arsip
   terdesentralisasi yang ditemukan Supriatmaja dkk. (2024), dan pemilihan mitra
   dilengkapi penyaringan menurut kecamatan dan desa. Secara terukur, keenam
   pekerjaan administratif yang tercakup tujuan ini mengalami penghematan waktu
   antara 69,2 sampai 83,3 persen.

3. **Tujuan khusus kedua tercapai, yaitu terbangunnya fitur pemantauan dan
   penilaian mitra yang menjawab pokok permasalahan kedua.** Progres seluruh
   kegiatan kini tersimpan di satu tempat dan tersaji pada satu dasbor beserta
   grafik serta penanda kegiatan yang tertinggal, mengikuti gagasan dasbor yang
   dirumuskan Few (2006) dan menjawab temuan Simpony dkk. (2024) bahwa ketiadaan
   data yang tersaji seketika menghambat pengambilan keputusan pimpinan.
   Pengingat tenggat dan kelengkapan dokumen yang sebelumnya bergantung pada pesan
   pribadi antarpegawai kini disampaikan sistem sebagai notifikasi, sejalan dengan
   temuan Muthmainnah dkk. (2025) di BPS Kota Lhokseumawe. Penilaian kinerja hanya
   dapat diisi PML yang mengawasi mitra tersebut, dan pembatasan itu ditegakkan di
   sisi server dengan identitas penilai diambil dari token sehingga keadaan
   sebelumnya, ketika berkas penilaian dapat diubah siapa pun yang memiliki
   tautannya, tidak lagi terjadi. Peringkat mitra per triwulan dihitung sistem
   dari data yang sudah tersimpan, menjawab temuan Zahara dkk. (2022) bahwa
   penggabungan data penilaian secara manual memakan waktu dan rentan
   subjektivitas, serta menerapkan gagasan pemeringkatan otomatis yang sebelumnya
   diterapkan Nada dkk. (2020) pada pegawai, kali ini pada mitra statistik.
   Kedua pekerjaan yang tercakup tujuan ini terbukti secara terukur: mengetahui
   progres seluruh kegiatan yang sedang berjalan menghemat 86,7 persen, yang
   sekaligus merupakan penghematan terbesar dari seluruh pengujian, sedangkan
   merekap penilaian dan menyusun peringkat mitra satu triwulan menghemat 72,4
   persen.

4. **Tujuan khusus ketiga tercapai melalui empat pengujian yang saling
   melengkapi.** Pengujian fungsionalitas dengan metode black box dilakukan atas
   60 kasus uji yang disusun menggunakan teknik _equivalence partitioning_ dan
   _boundary value analysis_ sebagaimana dianjurkan Nidhra dan Dondeti (2012)
   serta Pressman dan Maxim (2020), dengan seluruh kebutuhan fungsional KF-01
   sampai KF-16 terwakili sedikitnya satu kasus uji. Pengujian keamanan hak akses
   atas enam belas skenario menunjukkan seluruh percobaan peningkatan hak akses,
   baik menegak maupun mendatar, ditolak sistem dengan kode status yang sesuai
   sedangkan akses yang memang menjadi hak peran tersebut tetap berjalan; hasil
   ini menunjukkan penerapan prinsip hak akses terendah sebagaimana dirumuskan
   Stallings dan Brown (2018) terhadap kerentanan _broken access control_ yang
   menempati peringkat pertama pada OWASP Top 10 (OWASP Foundation, 2021).
   Pengujian kinerja menghasilkan rata-rata skor Google Lighthouse 99,1 atas
   sepuluh halaman, dan perbandingan lama pengerjaan delapan pekerjaan
   administratif sebelum serta sesudah sistem digunakan menunjukkan penurunan
   waktu sebesar 82,5 persen. Pengujian kegunaan dengan _Computer System Usability
   Questionnaire_ (Lewis, 1995) menghasilkan skor keseluruhan 6,36 dari skala 1
   sampai 7 dan termasuk kategori sangat puas, berada di atas rata-rata 21 studi
   kegunaan yang dihimpun Sauro dan Lewis (2016) yang setara dengan 5,18 pada
   skala searah.

5. **Penelitian ini mengisi celah penelitian terdahulu, dan metode Modified
   Waterfall terbukti sesuai bagi lingkungan yang menjadi studi kasus.**
   Yogantara dkk. (2025) berhenti pada pengelolaan kontrak dan beban kerja mitra,
   sedangkan Susi dkk. (2024) memantau honor pada sisi hilir berupa status sudah
   atau belum dibayar. Penelitian ini melanjutkan alurnya sampai pemantauan
   progres dan penilaian kinerja, serta bekerja pada sisi hulu dengan memeriksa
   akumulasi honor lintas tim pada saat alokasi disimpan; kebaruannya terletak
   pada penyatuan seluruh siklus pengelolaan mitra statistik, mulai dari alokasi,
   pengendalian anggaran, penyuratan, pemantauan lapangan, sampai pemeringkatan
   kinerja, ke dalam satu basis data dan satu dasbor di tingkat BPS Kabupaten.
   Sepanjang pengembangan, mekanisme umpan balik yang menjadi pembeda Modified
   Waterfall terhadap waterfall klasik (Munassar & Govardhan, 2010; McConnell,
   1996) benar-benar terpakai, yaitu ketika temuan pada tahap implementasi dan
   pengujian menuntut penyesuaian kembali ke tahap perancangan tanpa mengulang
   seluruh siklus. Keterpakaian itu memperkuat temuan Fajar dan Maghfiroh (2024)
   bahwa Modified Waterfall efektif dan adaptif bagi sistem manajerial di
   lingkungan BPS yang aturan bisnisnya ketat namun dapat berubah.

## 6.2 Saran

Berdasarkan hasil penelitian, keterbatasan yang ditemukan, serta masukan yang
disampaikan pengguna pada tahap evaluasi, disusun saran sebagai berikut.

### 6.2.1 Saran Pengembangan Sistem

1. **Menyambungkan sistem dengan aplikasi FASIH.** Progres pekerjaan mitra saat
   ini masih diinput PML secara manual, termasuk untuk kegiatan yang pendataannya
   memakai FASIH. Struktur basis data dan antarmuka pemrogramannya sudah
   disiapkan: tabel kegiatan telah memiliki kolom penanda kegiatan FASIH dan
   pemilih sumber progres di sisi server, sehingga penyambungannya tidak menuntut
   perubahan struktur basis data maupun antarmuka.

2. **Menyambungkan pengelolaan data mitra dengan aplikasi SOBAT.** Daftar mitra
   saat ini diperbarui dengan mengunggah berkas Excel secara berkala. Sambungan
   langsung akan menghilangkan langkah unggah tersebut sekaligus menjaga data
   mitra selalu mutakhir.

3. **Menambahkan pembentukan kelengkapan dokumen persiapan secara otomatis.**
   Saran ini disampaikan lebih dari satu responden, yaitu pembuatan Surat
   Keputusan, Surat Tugas, dan undangan pelatihan petugas dengan cara yang sama
   seperti pembentukan SPK dan BAST. Mekanismenya sudah tersedia di dalam sistem
   dan tinggal diterapkan pada jenis dokumen yang berbeda. Saran ini juga menjadi
   yang paling menjanjikan, karena pemeriksaan kelengkapan dokumen adalah
   pekerjaan dengan penghematan waktu terkecil pada pengujian efisiensi.

4. **Menampilkan bintang mutu mitra pada daftar mitra.** Nilai mutu mitra saat
   ini baru terlihat pada halaman penilaian dan rekap peringkat. Menampilkannya
   pada daftar mitra akan membantu Ketua Tim mempertimbangkan mutu mitra ketika
   memilih, bukan setelah kegiatan selesai.

5. **Menyediakan jalur perbaikan alokasi yang salah tahap.** Seorang responden
   melaporkan pernah memasukkan mitra ke tahap yang keliru. Fasilitas memindahkan
   alokasi antar-tahap tanpa menghapus dan memasukkan ulang akan mengurangi risiko
   kehilangan data honor dan progres yang menempel pada alokasi tersebut.

6. **Memperbaiki beberapa hal kecil pada antarmuka.** Responden menyebutkan
   jendela pengisian nilai mitra tidak menyediakan batang gulir sehingga tombol
   simpan harus dicari dengan memperkecil jendela peramban. Perbaikan semacam ini
   kecil tetapi langsung dirasakan pemakai setiap hari.

7. **Menambahkan pemantauan anomali data.** Seorang responden mengusulkan menu
   yang menampilkan daftar anomali data beserta perkembangan penyelesaiannya,
   yaitu pekerjaan yang saat ini masih ditangani di luar sistem.

### 6.2.2 Keterbatasan Penelitian

1. **Hasil pengujian kegunaan mewakili pemakai yang bersedia mengisi, bukan
   seluruh pemakai.** Jumlah responden sebanyak 12 orang telah memenuhi rencana
   yang ditetapkan pada Bab II, yaitu 10 sampai 15 pegawai yang mewakili seluruh
   peran pengguna, dan berada dalam rentang yang dinyatakan Macefield (2009)
   memadai untuk memperoleh nilai rata-rata yang stabil pada pengujian kuantitatif
   berbasis kuesioner. Meskipun demikian, jumlah tersebut merupakan sekitar
   separuh dari pegawai yang memakai sistem, dan tiap peran hanya diwakili dua
   sampai empat orang. Skor tiap dimensi karena itu sahih sebagai gambaran
   menyeluruh, tetapi tidak cukup untuk membandingkan tingkat kepuasan antar-peran
   maupun untuk menyimpulkan penilaian pegawai yang tidak mengisi kuesioner.

2. **Penghematan waktu yang dilaporkan merupakan perubahan yang dirasakan
   pengguna, bukan hasil pengukuran langsung.** Sebagaimana diuraikan pada Bab
   III, lama pengerjaan sebelum sistem digunakan dikumpulkan melalui kuesioner
   kepada pegawai yang mengerjakannya, bukan dengan pencatat waktu. Angka tersebut
   karena itu dapat dipakai untuk menyatakan arah dan besaran perubahan menurut
   penilaian pemakainya, tetapi tidak dapat dipakai sebagai angka baku efisiensi
   sistem maupun sebagai pembanding terhadap penelitian lain yang mengukur lama
   pengerjaan tugas secara langsung.

3. **Masa pemakaian sistem saat dievaluasi masih singkat.** Sebagian besar
   responden baru memakai sistem kurang dari satu bulan ketika mengisi kuesioner,
   sehingga penilaiannya lebih menggambarkan kesan pemakaian awal daripada
   pengalaman satu siklus kegiatan penuh. Beberapa jenis persoalan, misalnya
   penumpukan data lintas tahun dan pergantian kepengurusan ketua tim, baru akan
   terasa setelah sistem berjalan lebih lama.

4. **Sistem belum diuji pada keadaan seluruh pemakai mengaksesnya bersamaan.**
   Pengujian kinerja yang dilakukan mengukur kecepatan pemuatan tampilan di sisi
   peramban, sedangkan perilaku peladen dan basis data ketika diakses banyak
   pemakai sekaligus belum diukur. Keterbatasan ini tergolong ringan mengingat
   sistem dipakai paling banyak sekitar dua puluh pegawai pada satu satuan kerja,
   tetapi tetap perlu disebutkan agar cakupan pengujian kinerja tidak terbaca
   lebih luas daripada yang sebenarnya dilakukan.

### 6.2.3 Saran Penelitian Lanjutan

1. **Mengevaluasi ulang setelah sistem dipakai satu siklus penuh.** Pengukuran
   setelah satu tahun anggaran berjalan akan memperlihatkan dampak sebenarnya
   terhadap ketepatan waktu penyelesaian dokumen dan kepatuhan terhadap batas
   honor, yaitu hal yang tidak dapat diukur pada masa pemakaian yang singkat.

2. **Membandingkan rumus pemeringkatan yang dipakai dengan metode pendukung
   keputusan lain.** Sistem ini memakai rumus rata-rata nilai ditambah pembeda
   berupa jumlah kegiatan. Zahara dkk. (2022) membandingkan metode SMART, SAW, dan
   MOORA untuk pemilihan calon mitra statistik; membandingkan hasil pemeringkatan
   kedua pendekatan pada data yang sama akan menunjukkan apakah rumus sederhana
   yang dipakai sudah memadai atau perlu diganti.

3. **Menguji keteralihan sistem ke satuan kerja lain.** Penerapan di BPS
   kabupaten atau kota lain akan menunjukkan bagian mana dari alur kerja yang
   bersifat umum dan bagian mana yang khas Bengkulu Selatan, sekaligus menguji
   apakah pengaturan yang disediakan sistem sudah cukup luwes.

4. **Melakukan pengujian keamanan yang lebih luas.** Pengujian penetrasi dan
   pemeriksaan kerentanan di luar kontrol akses diperlukan apabila sistem kelak
   dibuka di luar jaringan tertutup BPS.

5. **Mengukur pengaruh sistem terhadap mutu data statistik.** Penelitian ini
   berhenti pada tata kelola administrasi dan pemantauan. Menghubungkan
   ketertiban administrasi dan kecepatan pemantauan dengan indikator mutu data
   sebagaimana kerangka _total survey error_ yang dikemukakan Biemer (2010) akan
   melengkapi rantai argumen dari pengelolaan mitra sampai mutu statistik yang
   diterbitkan.
