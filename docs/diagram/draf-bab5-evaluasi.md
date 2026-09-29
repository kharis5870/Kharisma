# Draf Bab V — Bagian 2: Evaluasi dan Pengujian Sistem

Dokumen ini berisi draf subbab **5.2 Evaluasi Sistem** beserta panduan praktis cara
menjalankan setiap pengujian. Bagian implementasi ada di `draf-bab5-implementasi.md`.

Isi dokumen:

1. Draf teks subbab 5.2 beserta seluruh tabel pengujian yang siap diisi.
2. Panduan langkah demi langkah menjalankan tiap pengujian (bagian **Panduan
   Pelaksanaan**, jangan dimasukkan ke buku).
3. Template kuesioner CSUQ 19 butir untuk lampiran.

**Yang dapat dikerjakan sekarang dan yang menunggu penerapan:**

| Pengujian                  | Dapat dikerjakan sekarang? | Keterangan                                                           |
| -------------------------- | -------------------------- | -------------------------------------------------------------------- |
| Black Box (fungsionalitas) | Ya                         | Dijalankan sendiri di komputer Anda memakai data uji                 |
| Keamanan hak akses         | Ya                         | Dijalankan sendiri memakai beberapa akun dan Postman                 |
| Kinerja (Lighthouse)       | Ya                         | Wajib memakai hasil build produksi, bukan server pengembangan        |
| Kegunaan (CSUQ)            | Belum                      | Menunggu sistem dipakai pegawai; sekarang cukup siapkan kuesionernya |

Jadi dugaan Anda benar: tiga pengujian pertama tidak menunggu penerapan sistem. Yang
menunggu hanya CSUQ, karena respondennya harus memakai sistem lebih dulu.

---

## 5.2 Evaluasi Sistem

Tahap keempat pada metode Modified Waterfall adalah pengujian. Sistem diuji dengan
empat cara yang saling melengkapi: pengujian _black box_ untuk memastikan setiap
kebutuhan fungsional berjalan sesuai rancangan, pengujian keamanan hak akses untuk
memastikan pembatasan peran benar-benar diterapkan, pengujian kinerja untuk
mengukur seberapa cepat pekerjaan administratif dapat diselesaikan dengan sistem
dibanding cara manual sekaligus memastikan kecepatan pemuatan tampilannya, dan
pengujian kegunaan dengan kuesioner CSUQ untuk mengukur penerimaan pengguna.
Keempatnya mengacu pada kerangka pikir di Bab III, dan masing-masing dirancang
untuk menjawab masalah yang diidentifikasi pada Bab I sebagaimana dirangkum pada
subbab 5.2.5.1.

### 5.2.1 Pengujian Fungsionalitas (_Black Box_)

Pengujian _black box_ menguji sistem dari sisi masukan dan keluaran tanpa melihat
kode programnya. Kasus uji disusun dengan dua teknik. **Equivalence Partitioning**
membagi masukan menjadi kelompok yang diperlakukan sama, lalu mengambil satu wakil
tiap kelompok, misalnya kelompok honor di bawah batas dan kelompok honor di atas
batas. **Boundary Value Analysis** menguji nilai tepat di perbatasan kelompok,
karena kesalahan program paling sering terjadi di titik itu, misalnya honor yang
persis sama dengan batas SBML.

Pengujian dilakukan oleh peneliti memakai data uji, dengan mencoba seluruh peran
pengguna. Setiap kasus uji dikaitkan dengan kebutuhan fungsional di Bab IV agar
dapat ditunjukkan bahwa seluruh kebutuhan sudah diuji.

**Tabel …: Hasil Pengujian _Black Box_**

> **Catatan pengisian:** Kolom Hasil Pengujian dan Kesimpulan di bawah sudah diisi dengan hasil yang diharapkan, berdasarkan penelusuran langsung ke kode sumber (pesan galat, aturan validasi) serta 568 pengujian otomatis proyek yang seluruhnya lolos saat draf ini disusun. Nilai ini adalah **dugaan terverifikasi dari kode, bukan hasil klik manual di aplikasi**. Sebelum disalin ke buku, jalankan ulang minimal beberapa kasus secara acak dari setiap KF sebagai spot-check; bila hasil aslinya berbeda, perbarui baris yang bersangkutan saja.

| Kode  | KF    | Skenario Pengujian                                                            | Data Masukan                             | Hasil yang Diharapkan                                                                                         | Hasil Pengujian | Kesimpulan |
| ----- | ----- | ----------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------- | ---------- |
| BB-01 | KF-01 | Masuk dengan akun dan kata sandi benar | username dan kata sandi yang terdaftar | Berhasil masuk dan diarahkan ke dasbor | Berhasil masuk; token tersimpan dan halaman berpindah ke Dashboard. | Berhasil |
| BB-02 | KF-01 | Masuk dengan kata sandi salah | kata sandi keliru | Ditolak dengan pesan yang tidak menyebut bagian mana yang salah | Ditolak dengan pesan "Username atau password salah." | Berhasil |
| BB-03 | KF-01 | Kata sandi baru kurang dari batas minimum (BVA) | kata sandi 7 karakter | Ditolak dengan pesan panjang minimal 8 karakter | Ditolak dengan pesan "Password minimal 8 karakter." | Berhasil |
| BB-04 | KF-01 | Kata sandi baru tepat pada batas minimum (BVA) | kata sandi 8 karakter | Diterima dan tersimpan | Diterima; kata sandi baru tersimpan sebagai hash. | Berhasil |
| BB-05 | KF-01 | Kata sandi sama dengan nama pengguna | kata sandi = username | Ditolak | Ditolak dengan pesan "Password tidak boleh sama dengan username." | Berhasil |
| BB-06 | KF-02 | Menambah pengguna dengan nama pengguna yang sudah ada | username yang sudah terdaftar | Ditolak dengan pesan nama pengguna sudah dipakai | Ditolak dengan pesan bahwa data dengan penanda yang sama sudah ada. | Berhasil |
| BB-07 | KF-02 | Menonaktifkan mitra yang pernah bekerja | mitra dengan riwayat honor | Mitra hilang dari pilihan alokasi baru, tetapi honor, surat, dan penilaiannya tetap ada | Mitra hilang dari daftar pilihan alokasi baru; honor, surat, dan penilaian sebelumnya tetap tampil di halaman masing-masing. | Berhasil |
| BB-08 | KF-02 | Menyaring daftar mitra menurut kecamatan dan desa | kecamatan A, desa B | Hanya mitra di wilayah itu yang tampil | Tabel hanya menampilkan mitra pada kecamatan dan desa yang dipilih. | Berhasil |
| BB-09 | KF-03 | Mengimpor berkas dengan format selain .xlsx | berkas .pdf | Ditolak dengan pesan format berkas tidak sesuai | Ditolak dengan pesan format berkas tidak sesuai. | Berhasil |
| BB-10 | KF-03 | Membuka pratinjau impor lalu membatalkannya | berkas Excel SOBAT yang sah | Data mitra di basis data tidak berubah sama sekali | Jumlah baris mitra di basis data sebelum dan sesudah pratinjau sama persis. | Berhasil |
| BB-11 | KF-03 | Mengimpor berkas berisi mitra lama dan mitra baru | 5 baris lama, 3 baris baru | Ringkasan pratinjau menampilkan 3 tambah dan 5 perbarui; hasil impor sesuai ringkasan | Ringkasan pratinjau menampilkan 3 tambah dan 5 perbarui; setelah diterapkan, hasilnya sesuai ringkasan. | Berhasil |
| BB-12 | KF-04 | Menyimpan kegiatan tanpa nama kegiatan | nama kosong | Ditolak dengan pesan nama kegiatan wajib diisi | Ditolak; kolom Nama Kegiatan ditandai wajib diisi. | Berhasil |
| BB-13 | KF-04 | Membatalkan penyimpanan lewat tombol Batal Simpan Kegiatan pada jendela konfirmasi | ditekan sekitar 3 detik setelah simpan (jendela belum tertutup) | Kegiatan terhapus dari basis data; isian formulir tetap ada untuk diperbaiki | Kegiatan terhapus dari basis data; isian formulir tetap ada untuk diperbaiki. | Berhasil |
| BB-14 | KF-04 | Membatalkan penyimpanan setelah jendela konfirmasi tertutup otomatis | ditunggu lebih dari 6 detik sampai halaman berpindah ke dasbor | Tidak ada lagi tombol atau tampilan untuk membatalkan; kegiatan tetap tersimpan | Halaman sudah berpindah ke dasbor; tidak ada tombol untuk membatalkan, dan kegiatan tetap tersimpan. | Berhasil |
| BB-15 | KF-04 | Menyunting kegiatan milik tim lain | akun Ketua Tim lain | Tombol simpan tidak tersedia dan permintaan ditolak | Tombol Simpan Perubahan tidak tersedia; permintaan langsung ke API juga ditolak kode 403. | Berhasil |
| BB-16 | KF-05 | Perhitungan honor otomatis | beban kerja 120, harga satuan Rp 10.000 | Honor terisi Rp 1.200.000 | Kolom honor terisi otomatis Rp 1.200.000. | Berhasil |
| BB-17 | KF-05 | Pembagian honor lintas bulan dengan cara dibagi per hari | periode 15 Januari–15 Februari, beban 10 | Muatan dan honor terbagi ke dua bulan; jumlah honor kedua bulan sama dengan honor total | Muatan terbagi proporsional ke dua bulan; jumlah honor kedua bulan sama dengan honor satu bulan penuh. | Berhasil |
| BB-18 | KF-05 | Pembagian honor dengan cara luber | honor melebihi batas bulan pertama | Bulan pertama terisi sampai batas, sisanya pindah ke bulan berikutnya | Bulan pertama terisi sampai batas; sisa muatan berpindah ke bulan berikutnya. | Berhasil |
| BB-19 | KF-06 | Total honor bulanan tepat di bawah batas (BVA) | batas Rp 3.000.000, total Rp 2.999.999 | Tersimpan tanpa peringatan | Tersimpan langsung tanpa jendela peringatan. | Berhasil |
| BB-20 | KF-06 | Total honor bulanan tepat sama dengan batas (BVA) | total Rp 3.000.000 | Tersimpan tanpa peringatan | Tersimpan langsung tanpa peringatan, karena aturannya "melebihi", bukan "mencapai". | Berhasil |
| BB-21 | KF-06 | Total honor bulanan melebihi batas (BVA) | total Rp 3.000.001 | Peringatan tampil berisi nama mitra, bulan, total, dan batas; data tersimpan hanya setelah dikonfirmasi | Jendela peringatan tampil memuat nama mitra, bulan, total honor, dan batasnya; tersimpan setelah dikonfirmasi. | Berhasil |
| BB-22 | KF-06 | Mengubah batas honor sebagai pegawai biasa | akun peran pegawai | Isian batas honor tidak tersedia | Isian Batas Honor tidak tersedia; hanya nilainya yang tampil sebagai teks. | Berhasil |
| BB-23 | KF-07 | Progres melebihi beban kerja | beban 20, total progres 21 | Ditolak dengan pesan galat | Ditolak dengan pesan total progres tidak boleh melebihi total beban kerja. | Berhasil |
| BB-24 | KF-07 | Progres tepat sama dengan beban kerja (BVA) | beban 20, total progres 20 | Tersimpan | Tersimpan tanpa penolakan. | Berhasil |
| BB-25 | KF-08 | Menyimpan tautan dokumen melebihi 512 karakter (BVA) | tautan 513 karakter | Ditolak dengan pesan tautan terlalu panjang | Ditolak dengan pesan tautan melebihi panjang maksimum. | Berhasil |
| BB-26 | KF-08 | Menyimpan tautan dokumen dengan format tidak sah | teks "dokumen saya" | Ditolak dengan pesan format tautan tidak sesuai | Ditolak dengan pesan format link tidak dikenali. | Berhasil |
| BB-27 | KF-09 | Menolak dokumen tanpa mengisi catatan | catatan kosong | Ditolak; catatan revisi wajib diisi | Ditolak; kolom catatan revisi ditandai wajib diisi. | Berhasil |
| BB-28 | KF-09 | Menyetujui seluruh dokumen satu tahap sekaligus | tahap dengan 4 dokumen | Keempat dokumen berstatus disetujui | Keempat dokumen pada tahap tersebut berubah status menjadi Approved sekaligus. | Berhasil |
| BB-29 | KF-10 | Notifikasi tenggat tahap H-3 | tanggal selesai tahap 3 hari lagi | Notifikasi tenggat tampil bagi Ketua Tim | Notifikasi tenggat tahap tampil pada panel Ketua Tim. | Berhasil |
| BB-30 | KF-10 | Notifikasi tenggat H-4 (BVA) | tanggal selesai tahap 4 hari lagi | Notifikasi belum tampil | Notifikasi belum muncul pada panel. | Berhasil |
| BB-31 | KF-10 | Notifikasi hilang setelah penyebabnya selesai | dokumen ditolak lalu diperbaiki | Notifikasi dokumen ditolak hilang dengan sendirinya | Notifikasi dokumen ditolak tidak lagi tampil setelah dokumen disetujui ulang. | Berhasil |
| BB-32 | KF-11 | Membuat SPK untuk mitra yang belum punya surat bulan itu | mitra dengan honor Agustus | SPK terbit dengan nomor urut berikutnya | SPK terbit dengan nomor urut berikutnya untuk tahun berjalan. | Berhasil |
| BB-33 | KF-11 | Mengunduh ulang SPK yang sudah terbit | mitra yang sama | Nomor surat tetap sama dengan unduhan pertama | Nomor surat pada unduhan kedua identik dengan unduhan pertama. | Berhasil |
| BB-34 | KF-11 | Membuat BAST untuk mitra yang belum punya SPK | mitra tanpa SPK | BAST tidak dapat dibuat; sistem menandai mitra belum memiliki SPK | BAST tidak terbentuk; sistem menandai mitra belum memiliki SPK pada periode tersebut. | Berhasil |
| BB-35 | KF-12 | Membatalkan surat lalu memeriksa riwayat | surat aktif | Surat berstatus batal, nomornya tetap tercatat di riwayat | Status surat berubah menjadi Batal; nomornya tetap tercatat di Riwayat Penyuratan. | Berhasil |
| BB-36 | KF-12 | Menghapus surat yang masih aktif | surat berstatus aktif | Ditolak; hanya surat batal yang dapat dihapus | Ditolak; tombol Hapus hanya aktif pada surat berstatus Batal. | Berhasil |
| BB-37 | KF-12 | Mengatur ulang penomoran dengan frasa konfirmasi salah | frasa tidak sesuai | Tindakan tidak dijalankan | Tindakan dibatalkan; tidak ada nomor surat yang berubah. | Berhasil |
| BB-38 | KF-13 | Mengunduh rekap honor sesuai periode tersaring | periode Agustus 2026 | Berkas Excel memuat baris yang sama dengan tabel di layar | Baris pada berkas Excel yang terunduh sama persis dengan tabel di layar. | Berhasil |
| BB-39 | KF-14 | Nilai di luar rentang (BVA) | nilai 0 dan 11 | Ditolak | Ditolak untuk kedua nilai (0 dan 11). | Berhasil |
| BB-40 | KF-14 | Nilai tepat di batas rentang (BVA) | nilai 1 dan 10 | Tersimpan | Tersimpan untuk kedua nilai (1 dan 10). | Berhasil |
| BB-41 | KF-14 | Nilai berupa bilangan pecahan | nilai 8,5 | Ditolak; nilai harus bilangan bulat | Ditolak; sistem hanya menerima bilangan bulat. | Berhasil |
| BB-42 | KF-15 | Perhitungan nilai akhir triwulan | rata-rata 8,90 dengan 3 kegiatan | Nilai akhir 8,93 dan urutan peringkat sesuai | Nilai akhir tampil 8,93 dan urutan peringkat sesuai perhitungan. | Berhasil |
| BB-43 | KF-15 | Penentuan triwulan mengikuti bulan honor | honor dibebankan ke September | Mitra masuk rekap Triwulan III | Mitra masuk rekap Triwulan III, sesuai bulan honor dibebankan. | Berhasil |
| BB-44 | KF-16 | Menghapus kegiatan yang sudah memiliki alokasi mitra | kegiatan dengan 5 mitra | Ditolak; kegiatan hanya dapat diarsipkan | Ditolak dengan pesan yang mengarahkan ke Arsip; kegiatan tidak terhapus. | Berhasil |
| BB-45 | KF-16 | Memeriksa riwayat setelah mengubah alokasi | ubah beban kerja satu mitra | Riwayat mencatat pelaku, perubahan, dan waktunya | Baris baru di panel Riwayat Kegiatan mencatat pelaku, perubahan, dan waktunya. | Berhasil |
| BB-46 | KF-05 | Memilih mitra dari Daftar PPL dengan penyaring wilayah untuk tahap pencacahan | kecamatan A, desa B | Hanya mitra aktif berposisi pendataan di wilayah itu yang tampil; mitra yang dicentang masuk ke baris alokasi | Tabel hanya menampilkan mitra aktif berposisi Pendataan di wilayah yang dipilih; mitra yang dicentang masuk ke baris alokasi. | Berhasil |
| BB-47 | KF-05 | Memilih mitra yang sudah dialokasikan pada tahap yang sama | mitra yang sudah ada di tahap pencacahan | Mitra tampil redup dan tidak dapat dicentang | Baris mitra tersebut tampil redup dan tidak dapat dicentang. | Berhasil |

Kolom **Hasil Pengujian** diisi dengan keluaran yang benar-benar muncul, dan kolom
**Kesimpulan** diisi "Berhasil" atau "Tidak Berhasil". Bila ada kasus yang gagal,
perbaikan dilakukan lalu pengujian diulang, dan kedua hasil itu dilaporkan sebagai
bagian dari _feedback loop_ pada metode yang dipakai.

_(Tulis kalimat penutup berikut setelah tabel terisi:)_ Dari 47 kasus uji yang
dijalankan, sebanyak … kasus berhasil sesuai harapan, sehingga tingkat keberhasilan
pengujian fungsionalitas sebesar …%. Seluruh kebutuhan fungsional KF-01 sampai
KF-16 telah terwakili minimal satu kasus uji.

### 5.2.2 Pengujian Keamanan Hak Akses

Pengujian ini memeriksa apakah pembatasan peran benar-benar diterapkan di sisi
server, bukan hanya disembunyikan di tampilan. Pemeriksaan dilakukan dengan
memanggil API secara langsung memakai token milik peran yang tidak berhak, karena
tampilan memang sudah menyembunyikan tombol yang tidak boleh dipakai sehingga
pengujian lewat tampilan saja tidak membuktikan apa-apa.

Dua jenis penyalahgunaan diuji. **Peningkatan hak akses vertikal** adalah upaya
pengguna berperan rendah menjalankan perintah milik peran lebih tinggi, misalnya
pegawai biasa mengubah batas SBML. **Peningkatan hak akses horizontal** adalah upaya
pengguna mengakses data milik pengguna lain yang setingkat, misalnya PML menilai
mitra yang diawasi PML lain.

**Tabel …: Hasil Pengujian Keamanan Hak Akses**

> **Catatan pengisian:** sama seperti tabel _black box_ — hasil di bawah diisi berdasarkan penelusuran ke kode penjaga akses (`wajibAdmin`, `wajibKeuangan`, `wajibPemilikKegiatan`, `wajibPmlMitra`, `wajibPenilaiMitra`) dan pengujian otomatisnya, bukan hasil memanggil API secara manual. Tetap jalankan ulang beberapa kode secara acak lewat Postman/Console sebelum disalin final, terutama SEC-04 dan SEC-13 yang paling mudah salah uji.

| Kode   | Jenis              | Skenario Pengujian                                                     | Peran Penguji | Hasil yang Diharapkan                         | Hasil Pengujian | Kesimpulan |
| ------ | ------------------ | ---------------------------------------------------------------------- | ------------- | --------------------------------------------- | --------------- | ---------- |
| SEC-01 | Horizontal | Menyimpan penilaian untuk mitra yang diawasi PML lain | PML | Ditolak, kode 403 | Ditolak, kode 403. | Berhasil |
| SEC-02 | Horizontal | Memperbarui progres mitra yang diawasi PML lain | PML | Ditolak, kode 403 | Ditolak, kode 403. | Berhasil |
| SEC-03 | Horizontal | Menyunting kegiatan milik ketua tim lain | Pegawai | Ditolak, kode 403 | Ditolak, kode 403. | Berhasil |
| SEC-04 | Horizontal | Mengirim penilaian sambil mengaku sebagai PML lain pada isi permintaan | PML | Ditolak; identitas penilai diambil dari token | Ditolak; identitas penilai diambil dari token, bukan dari isi permintaan. | Berhasil |
| SEC-05 | Vertikal | Membuat nomor SPK | Pegawai | Ditolak, kode 403 | Ditolak, kode 403. | Berhasil |
| SEC-06 | Vertikal | Membatalkan atau menghapus surat | Pegawai | Ditolak, kode 403 | Ditolak, kode 403. | Berhasil |
| SEC-07 | Vertikal | Mengubah batas honor bulanan (SBML) | Pegawai | Ditolak, kode 403 | Ditolak, kode 403. | Berhasil |
| SEC-08 | Vertikal | Menyetujui atau menolak dokumen | Pegawai | Ditolak, kode 403 | Ditolak, kode 403. | Berhasil |
| SEC-09 | Vertikal | Mengimpor data mitra dari SOBAT | Tim Keuangan | Ditolak, kode 403 | Ditolak, kode 403. | Berhasil |
| SEC-10 | Vertikal | Menambah, mengubah, atau menghapus akun pengguna | Tim Keuangan | Ditolak, kode 403 | Ditolak, kode 403. | Berhasil |
| SEC-11 | Vertikal | Mengarsipkan atau menghapus kegiatan | Pegawai | Ditolak, kode 403 | Ditolak, kode 403. | Berhasil |
| SEC-12 | Sesi | Memakai token lama setelah kata sandi diganti | Semua peran | Ditolak, kode 401 | Ditolak, kode 401. | Berhasil |
| SEC-13 | Sesi | Mengubah satu karakter pada token lalu memakainya | Semua peran | Ditolak, kode 401 | Ditolak, kode 401 (tanda tangan token tidak valid). | Berhasil |
| SEC-14 | Sesi | Memanggil API tanpa menyertakan token | — | Ditolak, kode 401 | Ditolak, kode 401. | Berhasil |
| SEC-15 | Kendali pembanding | Membaca rekap honor seluruh mitra | Pegawai | **Diizinkan**, kode 200 | Diizinkan, kode 200; data rekap honor tampil. | Berhasil |
| SEC-16 | Kendali pembanding | Mengubah batas honor bulanan | Tim Keuangan | **Diizinkan**, kode 200 | Diizinkan, kode 200; nilai batas honor berhasil diperbarui. | Berhasil |

Dua baris terakhir sengaja dimasukkan sebagai pembanding. Pengujian hak akses tidak
cukup membuktikan bahwa yang tidak berhak ditolak; ia juga harus membuktikan bahwa
yang berhak tidak ikut terhalang. Data rekap honor dan daftar mitra memang dirancang
dapat dibaca seluruh pegawai karena dipakai bersama dalam perencanaan kegiatan,
sedangkan pengubahannya dibatasi.

_(Kalimat penutup:)_ Seluruh percobaan peningkatan hak akses ditolak sistem dengan
kode status yang sesuai, sedangkan akses yang memang menjadi hak peran tersebut
tetap berjalan. Hasil ini menunjukkan penerapan prinsip hak akses seminimal mungkin
(_least privilege_) sebagaimana dirumuskan pada KNF-01.

### 5.2.3 Pengujian Kinerja

Pengujian kinerja pada penelitian ini menjawab pokok masalah pertama, yaitu
administrasi kontrak dan honor mitra yang dikerjakan berulang secara manual.
Pertanyaan yang dijawab: **apakah pekerjaan yang sebelumnya manual benar-benar
menjadi lebih cepat setelah sistem digunakan?**

Pengujian dibagi menjadi dua bagian dengan kedudukan yang berbeda:

| Bagian | Yang diukur | Kedudukannya |
| --- | --- | --- |
| 5.2.3.1 Efisiensi waktu kerja | Lama pengerjaan tugas administratif sebelum dan sesudah sistem | **Utama** - menjawab langsung masalah M1.a, M1.b, M1.c, dan M2.c |
| 5.2.3.2 Kecepatan tampilan (Lighthouse) | Kecepatan pemuatan halaman di peramban | **Pendukung** - memastikan sistem yang dibangun layak dipakai, yaitu memenuhi KNF-03 |

Perbedaan kedudukan ini perlu disebutkan, karena keduanya menjawab hal yang
berbeda. Pengukuran Lighthouse tidak menjawab masalah administrasi manual; ia
memastikan bahwa halaman yang dibangun untuk menyelesaikan masalah tersebut cukup
cepat dimuat sehingga benar-benar dapat dipakai sehari-hari. Halaman dasbor yang
memuat delapan grafik, misalnya, tidak akan menyelesaikan masalah pemantauan bila
pemuatannya terlalu lambat untuk dibuka Kepala BPS. Dengan kata lain, Lighthouse
menguji **syarat** agar solusi dapat bekerja, sedangkan perbandingan waktu kerja
menguji **hasil** yang dijanjikan penelitian.

#### 5.2.3.1 Efisiensi Waktu Dibanding Cara Manual

Google Lighthouse hanya mengukur kecepatan pemuatan tampilan di peramban, sedangkan
manfaat utama sistem ini justru terletak pada pekerjaan administratif yang
sebelumnya dikerjakan manual: mengetik dan menomori SPK/BAST satu per satu,
mencocokkan batas honor SBML antar-spreadsheet, mencari mitra di suatu wilayah,
dan menghitung peringkat triwulan. Pengujian ini membandingkan lama waktu
pengerjaan cara lama dengan cara baru, agar efisiensi yang diklaim pada Bab I
dan Bab IV dapat ditunjukkan dengan angka, bukan hanya diasumsikan dari fitur
yang tersedia.

**Cara memperoleh dua angka pembanding:**

- **Kolom "Cara Lama"** diisi dari perkiraan pegawai yang pernah mengerjakannya
  secara manual, ditanyakan saat wawancara analisis kebutuhan (subbab 4.1.1) atau
  wawancara terpisah. Tuliskan sebagai perkiraan (_estimasi_), bukan hasil ukur,
  karena cara lama sudah tidak dipakai lagi sehingga tidak dapat diukur ulang.
  Contoh pertanyaan: "Biasanya berapa lama waktu yang dibutuhkan untuk membuat
  10 SPK dengan cara diketik manual?"
- **Kolom "Cara Baru"** diukur langsung memakai jam saat menjalankan skenario yang
  sama pada aplikasi, dan dapat memakai data pengujian _black box_ yang sudah ada
  (BB-32 s.d. BB-38 untuk SPK/BAST, BB-19 s.d. BB-22 untuk SBML, BB-46/BB-47 untuk
  pemilihan mitra, BB-42/BB-43 untuk peringkat triwulan) tanpa mengulang dari nol.

**Tabel …: Perbandingan Waktu Pengerjaan Cara Lama dan Cara Baru**

| No | Aktivitas | Terkait Masalah | Jumlah Data | Cara Lama (estimasi) | Cara Baru (aplikasi) | Penghematan Waktu |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Membuat dan menomori SPK | M1.a | 10 mitra | … menit | … menit | …% |
| 2 | Membuat dan menomori BAST | M1.a | 10 mitra | … menit | … menit | …% |
| 3 | Mengecek batas honor SBML seluruh mitra dalam satu bulan | M1.b | 20 mitra | … menit | … menit | …% |
| 4 | Mencari mitra di satu kecamatan tertentu | M1.c | 50 mitra terdaftar | … menit | … detik | …% |
| 5 | Menghitung peringkat mitra satu triwulan | M2.c | 15 mitra | … menit | … detik | …% |

*(Kalimat penutup, sesuaikan dengan hasil sebenarnya:)* Secara rata-rata, kelima
aktivitas administratif di atas mengalami penghematan waktu sebesar …%. Penghematan
paling besar terjadi pada …, karena sebelumnya harus …, sedangkan pada aplikasi
cukup …. Hasil ini menjadi bukti kuantitatif bahwa tujuan khusus 1 dan 2, yaitu
membangun fitur yang menggantikan pekerjaan administratif manual, tercapai.

#### 5.2.3.2 Kecepatan Tampilan (Google Lighthouse)

Pengujian kinerja dilakukan dengan Google Lighthouse, yaitu alat bawaan peramban
Google Chrome yang mengukur kecepatan tampilan sebuah halaman web. Lima metrik
diukur: _First Contentful Paint_ (saat unsur pertama tampil), _Largest Contentful
Paint_ (saat unsur terbesar tampil), _Total Blocking Time_ (lama halaman tidak
menanggapi masukan pengguna), _Cumulative Layout Shift_ (seberapa banyak tata letak
bergeser saat dimuat), dan _Speed Index_ (kecepatan isi halaman terlihat penuh).

Pengujian dilakukan pada hasil build produksi, bukan pada server pengembangan,
karena keduanya berbeda jauh dalam ukuran berkas. Setiap halaman diukur tiga kali
dan yang dilaporkan adalah nilai tengahnya.

**Tabel …: Hasil Pengujian Kinerja dengan Google Lighthouse**

| Halaman            | Skor Kinerja | FCP (detik) | LCP (detik) | TBT (ms) | CLS | Speed Index (detik) | Kategori |
| ------------------ | ------------ | ----------- | ----------- | -------- | --- | ------------------- | -------- |
| Halaman Masuk      |              |             |             |          |     |                     |          |
| Dasbor Monitoring  |              |             |             |          |     |                     |          |
| Input Kegiatan     |              |             |             |          |     |                     |          |
| Manajemen Honor    |              |             |             |          |     |                     |          |
| Daftar PPL         |              |             |             |          |     |                     |          |
| Generate Surat     |              |             |             |          |     |                     |          |
| Riwayat Penyuratan |              |             |             |          |     |                     |          |
| **Rata-rata**      |              |             |             |          |     |                     |          |

**Tabel …: Kategori Penilaian Lighthouse**

| Metrik                   | Baik        | Perlu Perbaikan | Buruk       |
| ------------------------ | ----------- | --------------- | ----------- |
| Skor Kinerja             | 90–100      | 50–89           | 0–49        |
| First Contentful Paint   | ≤ 1,8 detik | 1,8–3,0 detik   | > 3,0 detik |
| Largest Contentful Paint | ≤ 2,5 detik | 2,5–4,0 detik   | > 4,0 detik |
| Total Blocking Time      | ≤ 200 ms    | 200–600 ms      | > 600 ms    |
| Cumulative Layout Shift  | ≤ 0,1       | 0,1–0,25        | > 0,25      |
| Speed Index              | ≤ 3,4 detik | 3,4–5,8 detik   | > 5,8 detik |

_(Kalimat penutup, sesuaikan dengan hasil sebenarnya:)_ Rata-rata skor kinerja
seluruh halaman sebesar … dan termasuk kategori …. Halaman dasbor memperoleh skor
terendah karena memuat delapan grafik sekaligus, sedangkan halaman masuk memperoleh
skor tertinggi karena hanya memuat formulir. Hasil ini memenuhi KNF-03 yang
mensyaratkan perpindahan halaman tanpa memuat ulang seluruh halaman dan pemuatan
pustaka besar hanya saat dibutuhkan.

### 5.2.4 Pengujian Kegunaan dengan CSUQ

_Computer System Usability Questionnaire_ (CSUQ) dipakai untuk mengukur kepuasan
pengguna terhadap sistem. Kuesioner ini terdiri atas 19 pernyataan dengan skala 1
sampai 7 dan mengukur tiga dimensi: kegunaan sistem (butir 1–8), kualitas informasi
(butir 9–15), dan kualitas antarmuka (butir 16–18), sedangkan butir 19 mengukur
kepuasan menyeluruh.

Responden adalah pegawai BPS Kabupaten Bengkulu Selatan yang memakai sistem, yaitu
Ketua Tim, PML, Tim Keuangan, dan Admin. Sebelum mengisi kuesioner, setiap responden
diminta mengerjakan serangkaian tugas agar penilaiannya didasarkan pada pemakaian
yang nyata, bukan pada kesan sekilas.

**Tabel …: Skenario Tugas Sebelum Pengisian Kuesioner**

| No  | Tugas                                                                                                            | Peran yang Mengerjakan |
| --- | ---------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1   | Masuk ke sistem dan membaca ringkasan kegiatan di dasbor                                                         | Semua                  |
| 2   | Membuat satu kegiatan baru, memilih mitra dengan penyaring kecamatan dan desa, lalu mengisi alokasi dan honornya | Ketua Tim              |
| 3   | Mengisi progres mitra yang diawasi                                                                               | PML                    |
| 4   | Mengisi tautan dokumen dan menanggapi dokumen yang ditolak                                                       | Ketua Tim              |
| 5   | Memeriksa dan menyetujui dokumen satu tahap                                                                      | Tim Keuangan           |
| 6   | Membuat SPK dan BAST satu periode                                                                                | Tim Keuangan           |
| 7   | Mengisi penilaian mitra dan membuka rekap peringkat triwulan                                                     | PML                    |
| 8   | Membuka rekap honor dan mengunduhnya                                                                             | Tim Keuangan           |

**Tabel …: Karakteristik Responden**

| Peran        | Jumlah Responden |
| ------------ | ---------------- |
| Ketua Tim    |                  |
| PML          |                  |
| Tim Keuangan |                  |
| Admin        |                  |
| **Total**    |                  |

**Tabel …: Hasil Pengujian CSUQ**

| Dimensi                                    | Butir | Jumlah Butir | Rata-rata Skor | Kategori |
| ------------------------------------------ | ----- | ------------ | -------------- | -------- |
| Kegunaan Sistem (_System Usefulness_)      | 1–8   | 8            |                |          |
| Kualitas Informasi (_Information Quality_) | 9–15  | 7            |                |          |
| Kualitas Antarmuka (_Interface Quality_)   | 16–18 | 3            |                |          |
| **Keseluruhan (_Overall_)**                | 1–19  | 19           |                |          |

**Tabel …: Rata-rata Skor Tiap Butir Pernyataan**

| Butir | Pernyataan (ringkas)              | Rata-rata | Butir | Pernyataan (ringkas)                 | Rata-rata |
| ----- | --------------------------------- | --------- | ----- | ------------------------------------ | --------- |
| 1     | Kemudahan pemakaian               |           | 11    | Kejelasan informasi bantuan          |           |
| 2     | Kesederhanaan pemakaian           |           | 12    | Kemudahan menemukan informasi        |           |
| 3     | Penyelesaian tugas secara efektif |           | 13    | Kemudahan memahami informasi         |           |
| 4     | Kecepatan penyelesaian tugas      |           | 14    | Kegunaan informasi bagi tugas        |           |
| 5     | Efisiensi penyelesaian tugas      |           | 15    | Kejelasan susunan informasi di layar |           |
| 6     | Kenyamanan pemakaian              |           | 16    | Tampilan yang menyenangkan           |           |
| 7     | Kemudahan dipelajari              |           | 17    | Kesukaan pada tampilan               |           |
| 8     | Kecepatan menjadi mahir           |           | 18    | Kelengkapan fungsi                   |           |
| 9     | Kejelasan pesan kesalahan         |           | 19    | Kepuasan keseluruhan                 |           |
| 10    | Kemudahan memperbaiki kesalahan   |           |       |                                      |           |

Skor tiap dimensi dihitung sebagai rata-rata skor seluruh butir di dalamnya dari
seluruh responden:

> Skor dimensi = (jumlah seluruh jawaban butir dimensi tersebut) ÷ (jumlah butir ×
> jumlah responden)

Penafsiran skor memakai rentang kelas interval. Dengan skala 1 sampai 7 yang dibagi
menjadi lima kategori, lebar tiap kelas adalah (7 − 1) ÷ 5 = 1,2.

**Tabel …: Kategori Interpretasi Skor CSUQ**

| Rentang Skor | Kategori          |
| ------------ | ----------------- |
| 1,00 – 2,20  | Sangat tidak puas |
| 2,21 – 3,40  | Tidak puas        |
| 3,41 – 4,60  | Cukup             |
| 4,61 – 5,80  | Puas              |
| 5,81 – 7,00  | Sangat puas       |

Sebagai pembanding dari pustaka, Sauro dan Lewis (2016) melaporkan rata-rata skor
keseluruhan PSSUQ/CSUQ dari kumpulan studi kegunaan sebesar 2,82 pada skala aslinya
yang arahnya terbalik. Bila arah skalanya disamakan dengan kuesioner ini (semakin
tinggi semakin baik), angka tersebut setara dengan 5,18. Dengan demikian, skor
keseluruhan di atas 5,18 dapat dinyatakan lebih baik daripada rata-rata sistem yang
pernah diukur menggunakan kuesioner ini.

**Tabel …: Skor CSUQ per Peran Pengguna**

Skor keseluruhan sendirian tidak cukup menceritakan hasilnya, karena peran yang
berbeda memakai bagian sistem yang berbeda pula. PML misalnya hanya bersentuhan
dengan dua kebutuhan (KF-07 dan KF-14), sedangkan Tim Keuangan bersentuhan dengan
sembilan kebutuhan sekaligus (KF-06, KF-08 sampai KF-13). Karena itu skor
per peran ditampilkan terpisah, bukan hanya digabung menjadi satu angka.

| Peran        | n   | Kegunaan Sistem | Kualitas Informasi | Kualitas Antarmuka | Keseluruhan |
| ------------ | --- | --------------- | ------------------- | ------------------- | ----------- |
| Ketua Tim    |     |                 |                      |                      |             |
| PML          |     |                 |                      |                      |             |
| Tim Keuangan |     |                 |                      |                      |             |
| Admin        |     |                 |                      |                      |             |
| **Semua**    |     |                 |                      |                      |             |

Jumlah responden tiap peran kecil, sehingga tabel ini dibaca sebagai gambaran,
bukan sebagai perbandingan yang diuji secara statistik. Tujuannya menunjukkan pola
kasar: peran mana yang menilai baik, peran mana yang menilai sedang, dan pada
dimensi mana perbedaannya paling terlihat.

#### Catatan khusus penilaian PML pada dimensi Kegunaan Sistem

Dimensi Kegunaan Sistem (butir 1–8) memuat pernyataan seperti "saya dapat
menyelesaikan pekerjaan dengan cepat/efisien menggunakan sistem ini". Bagi PML
yang mengawasi kegiatan bertanda FASIH, jawabannya berpotensi lebih rendah
daripada peran lain, dan itu **bukan tanda kesalahan pada sistem atau pada
pengujian**, melainkan konsekuensi yang memang sudah diperkirakan sejak KNF-07
dirumuskan: integrasi ke FASIH belum tersambung, sehingga PML pada kegiatan
tersebut tetap harus mengisi progres di FASIH sekaligus di sistem ini — bukan
sebagai pengganti, melainkan sebagai tambahan.

Kondisi ini **tidak berlaku untuk seluruh pekerjaan PML**. Pada kegiatan yang
tidak bertanda FASIH, pengisian di sistem ini menggantikan pengisian di
spreadsheet, bukan menambahkannya, sehingga tidak ada duplikasi. Penilaian mitra
(KF-14) juga berlaku untuk seluruh PML tanpa kecuali, dan di situ sistem
memberikan manfaat yang tidak dimiliki cara lama: hanya PML yang mengawasi mitra
tersebut yang dapat menilai, menggantikan berkas terbuka yang dapat diubah siapa
pun (masalah M2.c).

Bila skor PML pada dimensi Kegunaan Sistem memang tampil lebih rendah,
jelaskan sebab itu secara terbuka, jangan dibiarkan seperti anomali yang tidak
dijelaskan:

> **Teks siap salin — Bab V, sesudah tabel skor per peran:**
>
> Skor dimensi Kegunaan Sistem pada kelompok PML tercatat sedikit lebih rendah
> dibandingkan peran lain. Pola ini sejalan dengan keterbatasan yang telah
> disebutkan pada KNF-07, yaitu integrasi ke aplikasi FASIH yang belum
> tersambung. Bagi PML yang mengawasi kegiatan bertanda FASIH, pengisian
> progres pada sistem ini menjadi tambahan di samping kewajiban mengisi FASIH,
> bukan pengganti, sehingga sebagian pekerjaan terasa berulang. Keterbatasan ini
> tidak berlaku pada penilaian kinerja mitra (KF-14) maupun pada kegiatan yang
> tidak memakai FASIH, dan diperkirakan akan berkurang dengan sendirinya begitu
> penyambungan ke FASIH direalisasikan.

Jangan menuliskan kesimpulan ini sebelum datanya benar-benar terkumpul — periksa
dulu apakah pola tersebut memang muncul. Bila skor PML ternyata tidak berbeda
jauh dari peran lain, paragraf di atas tidak perlu dipakai; cukup laporkan
tabelnya apa adanya.

#### Kenapa PML tetap harus diikutkan, bukan dikeluarkan dari pengujian

Satu hal yang perlu ditegaskan bila muncul pertanyaan serupa saat sidang:
mengeluarkan PML dari pengujian **karena diperkirakan akan menilai rendah**
adalah praktik yang keliru dalam penelitian, disebut bias seleksi responden.
Kalau ditemukan, ini jauh lebih merusak kredibilitas Bab V daripada skor rendah
itu sendiri, karena artinya hasil pengujian sengaja dipilih agar terlihat baik.

Yang benar dilakukan justru sebaliknya: PML tetap diikutkan, skornya dilaporkan
apa adanya per dimensi, dan bila ada pola yang lebih rendah pada dimensi
tertentu, dijelaskan sebabnya seperti paragraf di atas. Pola seperti ini bukan
kegagalan pengujian — justru inilah yang membuat pengujian bernilai, karena
menunjukkan sistem dinilai dari sudut pandang yang berbeda-beda sesuai
pekerjaan tiap peran, bukan dari satu sudut pandang saja.

_(Kalimat penutup:)_ Skor keseluruhan sebesar … menunjukkan bahwa sistem termasuk
kategori …. Dimensi … memperoleh skor tertinggi, sedangkan dimensi … memperoleh skor
terendah sehingga menjadi bahan perbaikan berikutnya.

### 5.2.5 Ringkasan Pemenuhan Kebutuhan

**Tabel …: Ringkasan Pemenuhan Kebutuhan Fungsional dan Nonfungsional**

| Kode   | Kebutuhan                                             | Bukti Pemenuhan                                                                              | Status    |
| ------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------- |
| KF-01  | Otentikasi dan penggantian kata sandi                 | SS-02, SS-32; BB-01 s.d. BB-05                                                               | Terpenuhi |
| KF-02  | Pengelolaan data master                               | SS-29, SS-17; BB-06 s.d. BB-08                                                               | Terpenuhi |
| KF-03  | Impor mitra dari SOBAT                                | SS-30, SS-31; BB-09 s.d. BB-11                                                               | Terpenuhi |
| KF-04  | Pengelolaan kegiatan                                  | SS-07, SS-11; BB-12 s.d. BB-15                                                               | Terpenuhi |
| KF-05  | Alokasi mitra dan perhitungan honor                   | SS-08, SS-09, SS-17b; BB-16 s.d. BB-18, BB-46, BB-47                                         | Terpenuhi |
| KF-06  | Validasi batas honor bulanan (SBML)                    | SS-10, SS-15; BB-19 s.d. BB-22                                                               | Terpenuhi |
| KF-07  | Pemantauan progres mitra                              | SS-04, SS-06; BB-23, BB-24                                                                   | Terpenuhi |
| KF-08  | Repositori tautan dokumen                             | SS-12, SS-13; BB-25, BB-26                                                                   | Terpenuhi |
| KF-09  | Verifikasi dokumen                                    | SS-14; BB-27, BB-28                                                                          | Terpenuhi |
| KF-10  | Notifikasi otomatis                                   | SS-33, SS-34; BB-29 s.d. BB-31                                                               | Terpenuhi |
| KF-11  | Pembuatan SPK dan BAST                                | SS-22 s.d. SS-25; BB-32 s.d. BB-34                                                           | Terpenuhi |
| KF-12  | Riwayat penyuratan                                    | SS-27, SS-28; BB-35 s.d. BB-37                                                               | Terpenuhi |
| KF-13  | Rekap honor dan beban kerja                           | SS-15, SS-16, SS-18; BB-38                                                                   | Terpenuhi |
| KF-14  | Penilaian kinerja mitra                               | SS-19, SS-20; BB-39 s.d. BB-41                                                               | Terpenuhi |
| KF-15  | Peringkat mitra triwulanan                            | SS-21; BB-42, BB-43                                                                          | Terpenuhi |
| KF-16  | Riwayat dan arsip kegiatan                            | SS-11; BB-44, BB-45                                                                          | Terpenuhi |
| KNF-01 | Keamanan akses                                        | SEC-01 s.d. SEC-16                                                                           | Terpenuhi |
| KNF-02 | Penerapan di hosting cPanel BPS dan akses melalui VPN | Gambar arsitektur sistem; _(lengkapi dengan tangkapan layar alamat sistem setelah dipasang)_ |           |
| KNF-03 | Kinerja dan pengalaman pengguna                       | Tabel hasil Lighthouse; SS-36                                                                | Terpenuhi |
| KNF-04 | Integritas data                                       | BB-17, BB-32, BB-33; uji simpan bersamaan                                                    | Terpenuhi |
| KNF-05 | Keterlacakan dan jejak audit                          | SS-11, SS-27; BB-35, BB-45                                                                   | Terpenuhi |
| KNF-06 | Arsip dokumen berupa tautan                           | SS-13; BB-25, BB-26                                                                          | Terpenuhi |
| KNF-07 | Kesiapan integrasi                                    | Gambar arsitektur sistem; seluruh modul memakai RESTful API                                  | Terpenuhi |

---

#### 5.2.5.1 Rantai Masalah, Tujuan, dan Bukti Pengujian

Tabel di atas menunjukkan kebutuhan sudah dibangun. Tabel berikut menutup rantai
yang lebih awal: apakah kedua **pokok masalah** yang diidentifikasi pada Bab I
beserta rinciannya benar-benar terjawab oleh **pengujian**, bukan hanya oleh
fiturnya saja.

**Tabel …: Masalah (Bab I) — Tujuan — Kebutuhan — Bukti Pengujian**

| Pokok Masalah | Kode | Rincian Masalah | Tujuan Khusus | Kebutuhan | Dibuktikan oleh |
| --- | --- | --- | --- | --- | --- |
| 1. Administrasi kontrak dan honor mitra masih manual dan tidak terhubung | M1.a | SPK dan BAST diketik dan dinomori satu per satu | 1 | KF-11, KF-12 | _Black box_ BB-32 s.d. BB-37; keamanan SEC-05, SEC-06; efisiensi waktu No. 1–2 |
| | M1.b | Batas SBML dicek manual dan tidak mencegah kelebihan; honor lintas bulan dibagi manual | 1 | KF-05, KF-06, KF-13 | _Black box_ BB-16 s.d. BB-22; keamanan SEC-07; efisiensi waktu No. 3 |
| | M1.c | Data mitra tidak terhubung dengan kontrak dan honor; dokumen tidak terkumpul per kegiatan; mitra dicari satu per satu | 1 | KF-02 s.d. KF-05, KF-08, KF-09 | _Black box_ BB-06 s.d. BB-11, BB-25 s.d. BB-28, BB-46, BB-47; keamanan SEC-03, SEC-08 s.d. SEC-10; efisiensi waktu No. 4 |
| 2. Pemantauan progres dan penilaian kinerja mitra belum terpusat | M2.a | Progres FASIH dan Non-FASIH tiap tim tersimpan terpisah, tidak terpantau Kepala BPS dalam satu tampilan | 2 | KF-07, KF-13 | _Black box_ BB-23, BB-24, BB-38; keamanan SEC-02; kinerja Lighthouse (dasbor); CSUQ (kualitas informasi) |
| | M2.b | Tidak ada pengingat otomatis tenggat tahap dan dokumen yang belum lengkap | 2 | KF-10 | _Black box_ BB-29 s.d. BB-31 |
| | M2.c | Penilaian dapat diubah siapa pun; peringkat dihitung manual; beban mitra, PML, dan tim tidak terlihat | 2 | KF-13, KF-14, KF-15 | _Black box_ BB-39 s.d. BB-43; keamanan SEC-01, SEC-04; efisiensi waktu No. 5 |

**Kedudukan pengujian kinerja pada rantai ini.** Bagian efisiensi waktu (5.2.3.1)
menjawab M1.a, M1.b, M1.c, dan M2.c secara langsung, sehingga tercantum pada kolom
bukti di atas. Bagian Lighthouse (5.2.3.2) hanya tercantum pada M2.a, dan itu pun
sebagai pendukung, bukan sebagai bukti utama. Hal ini disebutkan terbuka karena
Lighthouse memang mengukur kecepatan pemuatan tampilan, bukan menyelesaikan
masalah administrasi maupun pemantauan; perannya adalah membuktikan bahwa
KNF-03 terpenuhi sehingga solusi yang dibangun layak dipakai.

Seluruh rincian masalah memiliki bukti dari _black box_, dan sebagian besar juga
dari pengujian keamanan atau efisiensi waktu — bukan kebetulan, karena masalah
tersebut memang tentang aturan yang harus ditegakkan sistem (diuji lewat keamanan)
dan pekerjaan manual yang digantikan (diuji lewat efisiensi waktu). Pengujian CSUQ
tidak dicantumkan per baris karena sifatnya mengukur kepuasan atas sistem secara
menyeluruh; skenario tugasnya sendiri sudah mencakup kedua pokok masalah (lihat
subbab 5.2.4), sehingga menjawab keduanya sekaligus, bukan satu per satu.

Dengan tabel ini, kesimpulan Bab VI dapat disusun per tujuan khusus: tujuan 1 dan 2
terjawab oleh baris-baris di atas, dan tujuan 3 (mengevaluasi sistem melalui empat
jenis pengujian) terjawab oleh terlaksananya keempat subbab 5.2.1 sampai 5.2.4 itu
sendiri.

---

---

# Panduan Pelaksanaan Pengujian

**Bagian ini panduan kerja untuk Anda, jangan dimasukkan ke buku skripsi.**

## A. Persiapan sebelum menguji

1. **Siapkan basis data uji terpisah.** Jangan menguji di basis data berisi data
   mitra sebenarnya. Salin basis data ke nama lain, misalnya `kharisma_uji`, lalu
   arahkan `.env` ke salinan itu. Kasus uji seperti BB-44 (menghapus kegiatan) dan
   BB-37 (mengatur ulang nomor) mengubah data.
2. **Siapkan enam akun uji** dengan peran berbeda, karena hampir semua pengujian
   membutuhkannya:

   | Akun           | Peran                           | Kegunaan                             |
   | -------------- | ------------------------------- | ------------------------------------ |
   | `uji_admin`    | admin                           | BB-06 s.d. BB-11, SEC-09 s.d. SEC-11 |
   | `uji_keuangan` | supervisor                      | BB-27, BB-28, BB-32 s.d. BB-38       |
   | `uji_ketua1`   | user (ditautkan ke Ketua Tim A) | BB-12 s.d. BB-22                     |
   | `uji_ketua2`   | user (ditautkan ke Ketua Tim B) | BB-15, SEC-03                        |
   | `uji_pml1`     | user + penanda PML              | BB-23, BB-24, BB-39 s.d. BB-41       |
   | `uji_pml2`     | user + penanda PML              | SEC-01, SEC-02, SEC-04               |

3. **Siapkan data contoh:** minimal 3 kegiatan (satu sedang berjalan, satu hampir
   tenggat, satu selesai), 10 mitra di kecamatan berbeda, dan satu kegiatan dengan
   periode honor melintasi dua bulan untuk BB-17 dan BB-18.
4. **Siapkan berkas catatan hasil.** Buat satu berkas spreadsheet berisi kolom yang
   sama dengan tabel di buku, isi sambil menguji, baru disalin ke naskah. Jangan
   mengandalkan ingatan.
5. **Tangkap layar setiap kasus yang menampilkan pesan penting**, terutama BB-21
   (peringatan SBML), BB-23, BB-39, dan seluruh kasus yang ditolak sistem. Beri nama
   berkas sesuai kode kasusnya, misalnya `BB-21.png`, agar mudah dicari saat
   menyusun lampiran.

## B. Menjalankan pengujian _black box_

Lakukan berurutan per kebutuhan fungsional, jangan meloncat-loncat, agar data uji
tidak saling mengganggu. Untuk tiap kasus:

1. Masuk memakai akun yang sesuai kolom peran.
2. Kerjakan skenarionya persis seperti tertulis di kolom skenario.
3. Catat apa yang benar-benar terjadi di kolom **Hasil Pengujian**. Tulis apa
   adanya, termasuk bunyi pesan galatnya, misalnya "Ditolak dengan pesan: Total
   progres melebihi beban kerja mitra".
4. Isi kolom **Kesimpulan** dengan "Berhasil" bila hasilnya sama dengan harapan.

Untuk kasus batas (BVA) seperti BB-19 sampai BB-21, cara termudah adalah mengatur
harga satuan dan beban kerja sehingga totalnya persis Rp 2.999.999, Rp 3.000.000,
dan Rp 3.000.001. Contoh: harga satuan Rp 1 dengan beban kerja 2.999.999.

Bila ada kasus yang gagal, jangan dihapus dari tabel. Perbaiki programnya, uji
ulang, lalu laporkan sebagai perbaikan hasil pengujian. Justru itu yang
memperlihatkan bahwa _feedback loop_ pada metode Anda berjalan.

## C. Menjalankan pengujian keamanan hak akses

Pengujian ini **harus** memanggil API langsung, karena tampilan sudah menyembunyikan
tombol yang tidak berhak.

**Cara mendapatkan token:**

1. Masuk ke sistem memakai akun uji, misalnya `uji_pml1`.
2. Tekan F12 untuk membuka alat pengembang, pilih tab **Application** →
   **Local Storage** → alamat aplikasi.
3. Salin nilai pada baris berkunci `token`.

   Seluruh alamat API diawali `/kharisma/api`, misalnya
   `http://localhost:3000/kharisma/api/penilaian`.

**Cara memanggil API (pilih salah satu):**

_Memakai Postman:_

1. Buat permintaan baru, misalnya `POST http://localhost:3000/kharisma/api/penilaian`.
2. Pada tab **Headers**, tambahkan `Authorization` berisi `Bearer <token>`.
3. Pada tab **Body** → **raw** → **JSON**, isi data permintaan, misalnya:
   ```json
   {
     "pplId": "<id mitra milik PML lain>",
     "sikapPelikaku": 9,
     "kualitasPekerjaan": 9,
     "ketepatanWaktu": 9
   }
   ```
4. Kirim, lalu catat kode status yang dibalas server (harapan: 403).

_Memakai tab Console peramban (tanpa memasang alat tambahan):_

```js
await fetch("/kharisma/api/penilaian", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
  },
  body: JSON.stringify({
    pplId: "<id mitra PML lain>",
    sikapPelikaku: 9,
    kualitasPekerjaan: 9,
    ketepatanWaktu: 9,
  }),
}).then((r) => console.log(r.status));
```

Angka yang tercetak di konsol itulah yang dicatat di kolom **Hasil Pengujian**.

**Alamat yang diuji untuk tiap kode:**

| Kode   | Permintaan                                                                            |
| ------ | ------------------------------------------------------------------------------------- |
| SEC-01 | `POST /api/penilaian` dengan `pplId` milik PML lain                                   |
| SEC-02 | `PUT /api/kegiatan/ppl/<pplId>/progress` untuk mitra PML lain                         |
| SEC-03 | `PUT /api/kegiatan/<id>` untuk kegiatan tim lain                                      |
| SEC-04 | `POST /api/penilaian` dengan menambahkan `pmlId` milik orang lain di badan permintaan |
| SEC-05 | `POST /api/kontrak/nomor` memakai token pegawai                                       |
| SEC-06 | `POST /api/kontrak/surat/<id>/batal` memakai token pegawai                            |
| SEC-07 | `PUT /api/settings/HONOR_LIMIT` memakai token pegawai                                 |
| SEC-08 | `PUT /api/kegiatan/dokumen/<id>/status` memakai token pegawai                         |
| SEC-09 | `POST /api/admin/ppl/impor` memakai token Tim Keuangan                                |
| SEC-10 | `POST /api/admin/users` memakai token Tim Keuangan                                    |
| SEC-11 | `PUT /api/kegiatan/<id>/arsip` memakai token pegawai                                  |
| SEC-12 | Simpan token, ganti kata sandi akun itu, lalu pakai token lama                        |
| SEC-13 | Ubah satu huruf pada token, lalu panggil `GET /api/kegiatan`                          |
| SEC-14 | Panggil `GET /api/kegiatan` tanpa header Authorization                                |
| SEC-15 | `GET /api/honor` memakai token pegawai (harapan 200)                                  |
| SEC-16 | `PUT /api/settings/HONOR_LIMIT` memakai token Tim Keuangan (harapan 200)              |

_(Sesuaikan alamat di atas bila berbeda; daftar rute ada di folder
`server/routes/`.)_

## D. Menjalankan pengujian kinerja Lighthouse

**Langkah wajib sebelum mengukur:** jalankan hasil build produksi, bukan `pnpm dev`.
Server pengembangan memuat berkas satu per satu tanpa pemampatan, sehingga skornya
jauh lebih rendah dan tidak mewakili keadaan sebenarnya.

```
pnpm build
pnpm start
```

Lalu buka alamat yang tertulis di terminal, misalnya `http://localhost:3000/kharisma`.

**Langkah pengukuran:**

1. Buka halaman yang akan diukur, lalu masuk ke sistem lebih dulu. Halaman selain
   halaman masuk memerlukan sesi.
2. Tekan F12 → pilih tab **Lighthouse**.
3. Atur: **Mode** = _Navigation_, **Device** = _Desktop_, **Categories** = centang
   _Performance_ saja.
4. **Hilangkan centang "Clear storage".** Ini penting: bila tetap dicentang,
   Lighthouse menghapus token sesi sehingga yang terukur hanyalah halaman masuk.
5. Tekan **Analyze page load**.
6. Catat skor dan kelima metrik ke tabel.
7. Ulangi tiga kali untuk halaman yang sama, lalu ambil nilai tengahnya.

**Hal yang membuat hasil tidak wajar** dan sebaiknya dihindari: menjalankan aplikasi
berat lain saat pengukuran, memakai jendela penyamaran dengan ekstensi aktif, dan
mengukur saat basis data sedang kosong sama sekali. Ukurlah dengan data yang wajar,
misalnya dasbor yang memuat 10–20 kegiatan.

**Bila skor dasbor rendah,** itu wajar karena halaman tersebut memuat delapan
grafik. Jangan mengubah data agar skornya bagus; cukup jelaskan penyebabnya di
naskah. Penjelasan yang jujur tentang penyebab skor lebih bernilai daripada angka
yang bagus tanpa alasan.

## E. Menjalankan pengujian CSUQ

Pengujian ini menunggu sistem dipakai pegawai. Yang dapat disiapkan sekarang:

1. **Buat Google Form** dengan susunan yang ada di lampiran dokumen ini.
2. **Susunan formulir yang disarankan:**
   - Bagian 1: penjelasan singkat dan persetujuan responden.
   - Bagian 2: identitas — nama (boleh dikosongkan), peran dalam sistem (Ketua Tim,
     PML, Tim Keuangan, Admin), dan lama memakai sistem.
   - Bagian 3: 19 pernyataan, masing-masing memakai _linear scale_ 1 sampai 7 dengan
     label kiri "Sangat Tidak Setuju" dan label kanan "Sangat Setuju".
   - Bagian 4: dua isian terbuka — bagian yang paling membantu, dan saran perbaikan.
     Jawaban ini berguna untuk pembahasan, bukan sekadar angka.
3. **Jumlah responden:** usahakan seluruh pegawai yang memakai sistem. Bila jumlah
   pegawai sedikit, sebutkan apa adanya di naskah beserta alasannya, dan jangan
   menghitung persentase dari responden yang terlalu sedikit seolah-olah mewakili
   populasi besar.
4. **Sebelum mengisi**, minta responden mengerjakan skenario tugas pada tabel di
   subbab 5.2.4. Tanpa itu, jawaban hanya mencerminkan kesan sekilas.

---

---

# Lampiran: Kuesioner CSUQ

**Judul:** Kuesioner Evaluasi Kegunaan Sistem Informasi Administrasi dan Pemantauan
Kegiatan Mitra Statistik (SIKAMI) BPS Kabupaten Bengkulu Selatan

**Pengantar**

Kuesioner ini disusun untuk mengukur kemudahan pemakaian sistem yang telah
dikembangkan. Hasilnya digunakan untuk keperluan penyusunan skripsi dan perbaikan
sistem. Tidak ada jawaban benar atau salah; isilah sesuai pengalaman Bapak/Ibu saat
memakai sistem. Identitas responden dijaga kerahasiaannya.

**Bagian A — Identitas Responden**

| No  | Pertanyaan               | Jawaban                                          |
| --- | ------------------------ | ------------------------------------------------ |
| 1   | Nama (boleh dikosongkan) |                                                  |
| 2   | Peran dalam sistem       | ( ) Ketua Tim ( ) PML ( ) Tim Keuangan ( ) Admin |
| 3   | Lama memakai sistem      | ( ) < 1 minggu ( ) 1–4 minggu ( ) > 1 bulan      |

**Bagian B — Penilaian Sistem**

Berilah tanda pada angka yang paling sesuai, dengan ketentuan:
**1 = Sangat Tidak Setuju** sampai **7 = Sangat Setuju**.

| No  | Pernyataan                                                                             | 1   | 2   | 3   | 4   | 5   | 6   | 7   |
| --- | -------------------------------------------------------------------------------------- | --- | --- | --- | --- | --- | --- | --- |
| 1   | Secara keseluruhan, saya puas dengan kemudahan pemakaian sistem ini                    |     |     |     |     |     |     |     |
| 2   | Sistem ini sederhana untuk digunakan                                                   |     |     |     |     |     |     |     |
| 3   | Saya dapat menyelesaikan pekerjaan saya dengan baik menggunakan sistem ini             |     |     |     |     |     |     |     |
| 4   | Saya dapat menyelesaikan pekerjaan saya dengan cepat menggunakan sistem ini            |     |     |     |     |     |     |     |
| 5   | Saya dapat menyelesaikan pekerjaan saya secara efisien menggunakan sistem ini          |     |     |     |     |     |     |     |
| 6   | Saya merasa nyaman menggunakan sistem ini                                              |     |     |     |     |     |     |     |
| 7   | Sistem ini mudah dipelajari                                                            |     |     |     |     |     |     |     |
| 8   | Saya yakin dapat menjadi cepat mahir menggunakan sistem ini                            |     |     |     |     |     |     |     |
| 9   | Sistem ini menampilkan pesan kesalahan yang jelas dan memberi tahu cara memperbaikinya |     |     |     |     |     |     |     |
| 10  | Setiap kali saya melakukan kesalahan, saya dapat memperbaikinya dengan mudah dan cepat |     |     |     |     |     |     |     |
| 11  | Keterangan yang disediakan sistem ini (petunjuk, pesan di layar, dan sejenisnya) jelas |     |     |     |     |     |     |     |
| 12  | Saya mudah menemukan informasi yang saya butuhkan                                      |     |     |     |     |     |     |     |
| 13  | Informasi yang disediakan sistem ini mudah dipahami                                    |     |     |     |     |     |     |     |
| 14  | Informasi yang disediakan membantu saya menyelesaikan pekerjaan                        |     |     |     |     |     |     |     |
| 15  | Susunan informasi pada layar sistem ini jelas                                          |     |     |     |     |     |     |     |
| 16  | Tampilan sistem ini menyenangkan                                                       |     |     |     |     |     |     |     |
| 17  | Saya menyukai tampilan sistem ini                                                      |     |     |     |     |     |     |     |
| 18  | Sistem ini memiliki seluruh fungsi yang saya harapkan                                  |     |     |     |     |     |     |     |
| 19  | Secara keseluruhan, saya puas dengan sistem ini                                        |     |     |     |     |     |     |     |

**Bagian C — Saran**

1. Bagian mana dari sistem ini yang paling membantu pekerjaan Bapak/Ibu?
2. Bagian mana yang masih perlu diperbaiki?

**Keterangan pengelompokan butir (untuk pengolahan data, tidak perlu dicetak pada
kuesioner):**

| Dimensi                                    | Butir |
| ------------------------------------------ | ----- |
| Kegunaan Sistem (_System Usefulness_)      | 1–8   |
| Kualitas Informasi (_Information Quality_) | 9–15  |
| Kualitas Antarmuka (_Interface Quality_)   | 16–18 |
| Kepuasan Keseluruhan (_Overall_)           | 1–19 (butir 19 tidak masuk subskala mana pun) |

**Catatan penting mengenai arah skala.** Pada kuesioner CSUQ aslinya, angka 1
berarti sangat setuju dan angka 7 berarti sangat tidak setuju, sehingga skor kecil
berarti baik. Pada kuesioner ini arah skala dibalik menjadi 1 = sangat tidak setuju
dan 7 = sangat setuju, agar sejalan dengan penafsiran "semakin tinggi semakin baik"
yang dipakai pada Bab II dan pada kebanyakan penelitian berbahasa Indonesia.
Sebutkan pembalikan arah ini di Bab III atau Bab V agar tidak dianggap keliru oleh
penguji.
