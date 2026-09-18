# Draf Bab IV — Subbab Activity Diagram

Dokumen ini berisi draf lengkap subbab **Activity Diagram** beserta teks
penjelasannya. Diagramnya sendiri sudah tersedia dalam bentuk berkas PlantUML di
folder `docs/diagram/` dan hasil ekspornya di `docs/diagram/out/`.

---

## 1. Di mana subbab ini diletakkan

Activity diagram diletakkan pada **subbab 4.2.3**, yaitu setelah Use Case Diagram
dan sebelum Rancangan Basis Data. Urutannya mengikuti cara berpikir perancangan:
use case menjawab _siapa dapat melakukan apa_, activity diagram menjawab _bagaimana
urutan pekerjaannya_, rancangan basis data menjawab _data apa yang disimpan_, dan
rancangan antarmuka menjawab _seperti apa tampilannya_.

| Subbab    | Isi                         | Keterangan                                              |
| --------- | --------------------------- | ------------------------------------------------------- |
| 4.2.1     | Proses Bisnis Sistem Usulan | Memakai diagram alur umum (`02-activity-proses-usulan`) |
| 4.2.2     | Use Case Diagram            | Tabel definisi aktor dan deskripsi use case             |
| **4.2.3** | **Activity Diagram**        | **Delapan diagram, isi dokumen ini**                    |
| 4.2.4     | Rancangan Basis Data        | ERD dan struktur tabel                                  |
| 4.2.5     | Rancangan Antarmuka         | Wireframe W-01 sampai W-17                              |

Perlu diperhatikan bahwa diagram alur umum pada 4.2.1 juga berbentuk activity
diagram. Diagram itu **tidak diulang** di 4.2.3, karena fungsinya berbeda: pada
4.2.1 ia menggambarkan keseluruhan alur kerja dari pembuatan kegiatan sampai
penilaian mitra secara garis besar, sedangkan delapan diagram pada 4.2.3
merincikan tiap proses. Sebutkan hal ini pada kalimat pembuka 4.2.3 agar penguji
tidak menganggapnya terlewat.

---

## 2. Draf teks subbab

### 4.2.3 Activity Diagram

_Activity diagram_ menggambarkan urutan kegiatan yang dilakukan pengguna dan sistem
untuk menyelesaikan satu proses, termasuk percabangan yang terjadi bila suatu
syarat tidak terpenuhi. Diagram pada subbab ini disusun dengan _swimlane_, yaitu
jalur yang memisahkan kegiatan menurut pelakunya, sehingga terlihat jelas bagian
mana yang dikerjakan pengguna dan bagian mana yang dikerjakan sistem secara
otomatis. Jalur "Sistem" sengaja dipisahkan karena sebagian besar manfaat sistem ini
justru terletak pada pekerjaan yang diambil alih olehnya, misalnya perhitungan
honor, pemeriksaan batas SBM, dan penomoran surat.

Alur keseluruhan sistem telah digambarkan pada subbab 4.2.1. Delapan activity
diagram berikut merincikan proses-proses utama yang ada di dalamnya.

---

#### 1. Activity Diagram Otentikasi dan Penggantian Kata Sandi

**[GAMBAR]** Gambar …: Activity Diagram Otentikasi dan Penggantian Kata Sandi
_(berkas `out/activity-login.svg`)_

Pelaku: Pengguna dan Sistem.

Proses dimulai ketika pengguna membuka halaman masuk dan mengisi nama pengguna
beserta kata sandinya. Sebelum memeriksa kecocokan akun, sistem terlebih dahulu
memeriksa apakah percobaan masuk dari akun dan alamat jaringan tersebut masih dalam
batas yang diizinkan. Bila sudah terlalu sering gagal, sistem menolak sementara dan
meminta pengguna menunggu. Pemeriksaan ini diletakkan paling awal agar percobaan
menebak kata sandi secara berulang tidak dapat dilakukan tanpa henti.

Bila masih dalam batas, sistem mencari akun tersebut lalu membandingkan kata sandi
yang diketik dengan kata sandi tersandi (_hash_) yang tersimpan di basis data. Kata
sandi asli tidak pernah disimpan, sehingga isi basis data yang bocor sekalipun tidak
langsung memperlihatkan kata sandi pengguna. Bila tidak cocok, sistem menampilkan
satu pesan yang sama untuk keadaan nama pengguna salah maupun kata sandi salah, agar
pihak yang mencoba menebak tidak memperoleh petunjuk akun mana yang benar-benar ada.

Bila cocok, sistem membuat token bertanda tangan yang memuat id pengguna, perannya,
dan nomor versi token, dengan masa berlaku dua belas jam. Token itu disimpan di
peramban dan disertakan pada setiap permintaan berikutnya. Sistem kemudian
menampilkan menu sesuai peran pengguna; menu Manajemen Admin, misalnya, hanya
tampil bagi Admin.

Bagian kedua diagram menggambarkan penggantian kata sandi. Pengguna membuka halaman
Profil dan mengisi kata sandi lama, kata sandi baru, dan ulangannya. Sistem
memeriksa apakah kata sandi baru memenuhi aturan, yaitu sepanjang 8 sampai 72
karakter dan tidak sama dengan nama pengguna. Bila memenuhi, sandi baru disimpan
dalam bentuk tersandi dan nomor versi token akun dinaikkan. Kenaikan nomor versi itu
membuat seluruh token lama akun tersebut ditolak, sehingga perangkat lain yang masih
membuka sistem harus masuk kembali. Langkah ini penting bila kata sandi diganti
karena diduga diketahui orang lain.

_Kebutuhan yang diwujudkan: KF-01 dan KNF-01._

---

#### 2. Activity Diagram Pembuatan Kegiatan, Alokasi Mitra, dan Validasi Batas SBM

**[GAMBAR]** Gambar …: Activity Diagram Pembuatan Kegiatan, Alokasi Mitra, dan
Validasi Batas SBM
_(berkas `out/activity-alokasi-sbm.svg`)_

Pelaku: Ketua Tim dan Sistem.

Proses dimulai ketika Ketua Tim membuat kegiatan baru, mengisi identitas kegiatan,
dan menentukan jadwal empat tahap. Tahap pengolahan dan diseminasi dapat
dimatikan karena tidak semua kegiatan memilikinya. Setelah itu Ketua Tim
memilih mitra untuk tiap tahap melalui tombol Pilih dari Daftar PPL. Sistem
menampilkan daftar mitra aktif yang posisinya sesuai tahap tersebut beserta jumlah
kegiatan yang sedang diikuti tiap mitra, dan Ketua Tim dapat menyaringnya menurut
kecamatan dan desa sehingga mitra yang tinggal di sekitar wilayah tugas cepat
ditemukan. Mitra yang sudah dialokasikan pada tahap itu tidak dapat dipilih lagi.
Ketua Tim kemudian melengkapi PML pengawas, beban kerja, dan harga satuannya. Sistem langsung menghitung honor setiap mitra sebesar beban kerja dikali
harga satuan, sehingga tidak ada perhitungan manual yang berpotensi keliru.

Percabangan pertama terjadi pada periode honor. Bila periode honor suatu tahap
berada di dalam satu bulan, honor langsung dibebankan ke bulan itu. Bila melintasi
lebih dari satu bulan, Ketua Tim memilih cara pembebanan: seluruhnya ke satu bulan,
dibagi menurut jumlah hari, atau luber, yaitu bulan pertama diisi sampai batas lalu
sisanya dipindahkan ke bulan berikutnya. Yang dibagi adalah muatan pekerjaannya,
sedangkan honor tiap bulan dihitung ulang sebesar muatan bulan itu dikali harga
satuan, agar angka honor selalu sepadan dengan pekerjaan yang tercantum di surat.

Percabangan kedua terjadi saat penyimpanan. Sistem menjumlahkan honor tiap mitra
pada tiap bulan dari seluruh kegiatan, termasuk kegiatan tim lain, lalu
membandingkannya dengan batas honor bulanan yang berlaku. Bila ada yang melebihi,
sistem menampilkan peringatan berisi nama mitra, bulan, total honor, dan batasnya,
lalu menunggu keputusan Ketua Tim. Bila Ketua Tim memperbaiki alokasi, alur kembali
ke pengisian alokasi; bila Ketua Tim menyatakan tetap menyimpan, data disimpan
beserta penandanya. Perlu ditegaskan bahwa sistem memperingatkan, bukan menolak,
karena terdapat keadaan tertentu yang memang harus dilewatkan dengan sepengetahuan
Tim Keuangan. Yang dicegah adalah kelebihan yang terjadi tanpa disadari.

Seluruh penyimpanan kegiatan beserta alokasinya dijalankan sebagai satu kesatuan,
sehingga kegagalan di tengah proses tidak meninggalkan kegiatan yang tersimpan tanpa
alokasi.

Setelah kegiatan tersimpan, pembuatnya diberi kesempatan singkat (sekitar 6 detik,
selama jendela konfirmasi masih terbuka) untuk membatalkan seluruh penyimpanan
tersebut, termasuk alokasi mitra yang baru saja ikut tersimpan. Jendela ini sengaja
dibuat singkat dan tidak memeriksa apakah alokasinya sudah dikerjakan pihak lain,
karena tujuannya membuang kegiatan yang baru salah disimpan sebelum sempat disentuh
siapa pun. Setelah jendela itu tertutup, pembatalan serupa hanya dapat dilakukan
Admin melalui penghapusan biasa, yang justru menolak permintaan bila kegiatan sudah
memiliki alokasi mitra atau penilaian dan mengarahkan penggunanya untuk
mengarsipkan kegiatan tersebut.

_Kebutuhan yang diwujudkan: KF-04, KF-05, KF-06, dan KNF-04._

---

#### 3. Activity Diagram Input Progres Mitra

**[GAMBAR]** Gambar …: Activity Diagram Input Progres Mitra
_(berkas `out/activity-input-progres.svg`)_

Pelaku: PML dan Sistem.

PML membuka panel pembaruan progres di dasbor, lalu memilih tahap pekerjaan yang
akan diperbarui. Sistem menampilkan seluruh mitra yang diawasi PML tersebut dari
berbagai kegiatan sekaligus, sehingga PML tidak perlu membuka halaman kegiatan satu
per satu. PML mengisi jumlah mitra pada tiap status: untuk tahap pendataan dipakai
status _open_, _submit_, diperiksa, dan _approved_; untuk tahap pengolahan dipakai
status belum _entry_, sudah _entry_, validasi, dan _clean_.

Percabangan terjadi pada pemeriksaan jumlah. Sistem memastikan jumlah seluruh status
tidak melebihi beban kerja mitra. Bila melebihi, penyimpanan ditolak dengan pesan
galat dan PML diminta memperbaiki angkanya. Pemeriksaan ini diperlukan karena angka
progres menjadi dasar pemantauan di dasbor; angka yang melebihi beban kerja akan
membuat persentase kemajuan tidak masuk akal.

Setelah tersimpan, sistem memperbarui perhitungan kemajuan kegiatan dan menandai
waktu pembaruan terakhir. Waktu itulah yang kemudian dipakai untuk menandai kegiatan
yang progresnya tidak diperbarui lebih dari dua hari.

Perlu dicatat bahwa progres diinput PML secara manual, termasuk untuk kegiatan yang
pendataannya memakai aplikasi FASIH, karena sambungan langsung ke FASIH berada di
luar ruang lingkup penelitian ini.

_Kebutuhan yang diwujudkan: KF-07 dan KF-10._

---

#### 4. Activity Diagram Pengelolaan dan Verifikasi Dokumen

**[GAMBAR]** Gambar …: Activity Diagram Pengelolaan dan Verifikasi Dokumen
_(berkas `out/activity-verifikasi-dokumen.svg`)_

Pelaku: Ketua Tim, Tim Keuangan, dan Sistem.

Saat kegiatan dibuat, sistem menyiapkan daftar dokumen wajib untuk tiap tahap,
misalnya SK, Surat Tugas, KAK, Visum, dan laporan tahap. Ketua Tim mengisi tautan
dokumen yang menjadi tanggung jawabnya, sedangkan dokumen yang menjadi tanggung
jawab Tim Keuangan diisi Tim Keuangan. Sistem memeriksa bentuk dan panjang tautan
sebelum menyimpannya, lalu menandai dokumen berstatus menunggu pemeriksaan.

Tim Keuangan memeriksa dokumen dan memutuskan: menyetujui atau menolak. Bila
ditolak, Tim Keuangan wajib mengisi catatan revisi, dan catatan itu muncul sebagai
notifikasi bagi Ketua Tim sehingga penyampaian revisi tidak lagi bergantung pada
pesan pribadi. Ketua Tim memperbaiki dokumen, mengisi tautan baru, lalu dokumen
kembali menunggu pemeriksaan. Perputaran ini berlangsung sampai dokumen disetujui.

Terdapat dua jalur tambahan. Pertama, Tim Keuangan dapat menyetujui seluruh dokumen
satu tahap sekaligus, karena dalam praktik pemeriksaan memang dilakukan per tahap.
Kedua, untuk dokumen yang belum diisi sama sekali, Tim Keuangan dapat mengirim
pengingat yang langsung tampil sebagai notifikasi bagi Ketua Tim.

Seluruh dokumen disimpan sebagai tautan ke penyimpanan resmi instansi, bukan sebagai
berkas yang diunggah ke sistem, sehingga berkas aslinya tetap berada di penyimpanan
yang dikelola instansi beserta pengaturan hak aksesnya.

_Kebutuhan yang diwujudkan: KF-08, KF-09, KF-10, dan KNF-06._

---

#### 5. Activity Diagram Pembuatan SPK dan BAST

**[GAMBAR]** Gambar …: Activity Diagram Pembuatan Surat Perjanjian Kerja dan BAST
_(berkas `out/activity-surat-spk-bast.svg`)_

Pelaku: Tim Keuangan dan Sistem.

Tim Keuangan memilih periode surat, lalu mengisi uraian tugas dan kode beban
anggaran untuk tiap kegiatan dan tahap. Kedua keterangan itu dibutuhkan di dalam
surat dan nilainya sama untuk semua mitra pada kegiatan yang sama, sehingga cukup
diisi satu kali. Sistem kemudian menampilkan daftar mitra yang memiliki honor pada
periode tersebut beserta keterangan apakah suratnya sudah terbit.

Percabangan pertama memeriksa apakah mitra sudah memiliki SPK aktif pada bulan itu.
Bila sudah, sistem tidak membuat surat baru melainkan mengeluarkan kembali surat
yang sama, sehingga nomor surat tidak berubah walau berkasnya diunduh berulang kali.
Bila belum, sistem mengambil nomor urut berikutnya untuk tahun berjalan. Pengambilan
nomor dilakukan di dalam kunci basis data agar dua orang yang membuat surat pada
saat bersamaan tidak memperoleh nomor yang sama, dan indeks unik pada basis data
menjadi pengaman terakhirnya.

Sistem lalu menyusun isi surat dari template yang telah diatur, yaitu data pihak
pertama, data satuan kerja, pola nomor, dan isi pasal, digabung dengan data mitra
dan rincian pekerjaannya pada bulan tersebut. Seluruh pekerjaan mitra dalam satu
bulan dirangkum ke dalam satu surat, walaupun mitra tersebut bekerja pada beberapa
kegiatan. Berkas PDF dibentuk di peramban lalu langsung terunduh.

Pembuatan BAST mengikuti alur yang sama dengan satu perbedaan penting: BAST hanya
dapat dibuat bila SPK mitra tersebut sudah ada, dan nomornya mengikuti nomor urut
SPK mitra yang sama sehingga kedua surat selalu sepadan.

_Kebutuhan yang diwujudkan: KF-11 dan KNF-04._

---

#### 6. Activity Diagram Pengelolaan Riwayat Penyuratan

**[GAMBAR]** Gambar …: Activity Diagram Pengelolaan Riwayat Penyuratan
_(berkas `out/activity-riwayat-surat.svg`)_

Pelaku: Tim Keuangan dan Sistem.

Diagram ini menggambarkan apa yang terjadi setelah surat terbit. Sistem
membandingkan isi surat yang tersimpan saat surat diterbitkan dengan data kegiatan
terkini. Bila terdapat perbedaan, misalnya beban kerja mitra berubah setelah surat
dicetak, sistem menandai surat tersebut dan memunculkan notifikasi bagi Tim
Keuangan.

Tim Keuangan kemudian memilih salah satu tindakan. Memperbarui isi surat membuat
surat mengikuti data terkini tanpa mengganti nomornya, karena nomor surat yang sudah
beredar tidak boleh berubah. Membatalkan surat dilakukan disertai catatan alasan;
surat batal tetap tercatat di riwayat beserta nomornya, sehingga urutan penomoran
tetap dapat dipertanggungjawabkan. Menghapus surat hanya dapat dilakukan pada surat
yang sudah dibatalkan.

Dua tindakan terakhir berdampak luas, yaitu merapikan penomoran dan mengatur ulang
seluruh penomoran. Untuk keduanya sistem lebih dahulu menampilkan pratinjau berisi
nomor lama dan nomor baru tiap surat, lalu meminta Tim Keuangan mengetik frasa
konfirmasi. Bila frasa tidak sesuai, tindakan dibatalkan. Seluruh perubahan nomor
dicatat sebagai jejak audit beserta pelakunya dan waktunya.

_Kebutuhan yang diwujudkan: KF-12 dan KNF-05._

---

#### 7. Activity Diagram Penilaian Mitra dan Peringkat Triwulan

**[GAMBAR]** Gambar …: Activity Diagram Penilaian Mitra dan Peringkat Triwulan
_(berkas `out/activity-penilaian.svg`)_

Pelaku: PML dan Sistem.

PML membuka menu Penilaian Mitra dan memilih tahun serta triwulan. Sistem
menampilkan alokasi mitra yang honornya dibebankan pada triwulan tersebut. PML
memilih mitra yang diawasinya lalu mengisi nilai pada tiga aspek, yaitu sikap dan
perilaku, kualitas pekerjaan, dan ketepatan waktu, dengan skala bilangan bulat 1
sampai 10.

Percabangan pertama adalah pemeriksaan hak akses. Sistem memastikan bahwa pengguna
yang mengisi nilai memang PML yang mengawasi mitra tersebut, atau Admin. Bila bukan,
penyimpanan ditolak. Pemeriksaan ini dilakukan di sisi server dan identitas penilai
diambil dari token, bukan dari data yang dikirim peramban, sehingga pengguna tidak
dapat mengaku sebagai PML lain. Pembatasan ini menggantikan keadaan sebelumnya
ketika berkas penilaian dapat diubah siapa pun yang memiliki tautannya.

Percabangan kedua adalah pemeriksaan nilai. Nilai harus berupa bilangan bulat 1
sampai 10; di luar itu ditolak. Bila sah, sistem menghitung rata-rata ketiga aspek
dan menyimpannya.

Bagian akhir diagram menggambarkan penyusunan peringkat. Sistem mengelompokkan
penilaian menurut triwulan berdasarkan bulan pembebanan honor mitra, bukan
berdasarkan tanggal penilaian diisi, agar mitra masuk ke triwulan tempat
pekerjaannya benar-benar dilakukan. Nilai akhir dihitung dari rata-rata seluruh
nilai ditambah 0,01 dikali jumlah kegiatan yang diikuti mitra pada triwulan
tersebut, lalu daftar diurutkan dari nilai tertinggi. Penambahan kecil itu dipakai
untuk membedakan mitra yang nilainya sama dengan mengutamakan mitra yang lebih
banyak mengerjakan kegiatan. Hasilnya dapat diunduh dalam bentuk PDF dan Excel.

_Kebutuhan yang diwujudkan: KF-14, KF-15, dan KNF-01._

---

#### 8. Activity Diagram Impor Data Mitra dari SOBAT

**[GAMBAR]** Gambar …: Activity Diagram Impor Data Mitra dari SOBAT
_(berkas `out/activity-impor-mitra.svg`)_

Pelaku: Admin dan Sistem.

Admin mengunduh berkas Excel daftar mitra dari aplikasi SOBAT, lalu mengunggahnya
melalui jendela impor. Berkas dibaca langsung di peramban, sehingga berkas mentahnya
tidak perlu dikirim dan disimpan di server. Admin menentukan baris yang memuat judul
kolom dan memetakan kolom berkas ke kolom data mitra, karena susunan kolom berkas
SOBAT dapat berbeda antar unduhan.

Sistem kemudian mencocokkan tiap baris dengan data mitra yang sudah ada,
berdasarkan ID SOBAT terlebih dahulu, dan bila tidak ada berdasarkan namanya. Dari
pencocokan itu sistem mengusulkan tindakan untuk tiap baris: menambah mitra baru,
memperbarui data mitra yang sudah ada, atau melewatinya. Mitra yang ada di basis data
tetapi tidak ada di berkas dapat ditandai untuk dinonaktifkan.

Sebelum apa pun berubah, sistem menampilkan pratinjau berisi ringkasan jumlah baris
untuk tiap tindakan beserta rinciannya, dan Admin masih dapat mengubah tindakan tiap
baris. Pratinjau ini tidak menyentuh basis data sama sekali. Setelah Admin menyetujui,
seluruh perubahan dijalankan sebagai satu kesatuan sehingga kegagalan di tengah
proses tidak meninggalkan data setengah tersimpan.

Satu hal yang dijaga sepanjang alur ini: mitra yang berhenti **dinonaktifkan, bukan
dihapus**. Dengan begitu honor, surat, dan penilaian lamanya tetap tersimpan, dan
mitra dapat diaktifkan kembali bila kelak bekerja lagi. Mitra yang tidak aktif hanya
disembunyikan dari pilihan alokasi baru.

_Kebutuhan yang diwujudkan: KF-02, KF-03, KNF-04, dan KNF-05._

---

### Tabel Ringkasan Activity Diagram

Tabel berikut dapat dipakai sebagai penutup subbab 4.2.3.

| No  | Activity Diagram                                          | Pelaku                          | Kebutuhan Fungsional Terkait |
| --- | --------------------------------------------------------- | ------------------------------- | ---------------------------- |
| 1   | Otentikasi dan Penggantian Kata Sandi                     | Pengguna, Sistem                | KF-01                        |
| 2   | Pembuatan Kegiatan, Alokasi Mitra, dan Validasi Batas SBM | Ketua Tim, Sistem               | KF-04, KF-05, KF-06          |
| 3   | Input Progres Mitra                                       | PML, Sistem                     | KF-07                        |
| 4   | Pengelolaan dan Verifikasi Dokumen                        | Ketua Tim, Tim Keuangan, Sistem | KF-08, KF-09, KF-10          |
| 5   | Pembuatan SPK dan BAST                                    | Tim Keuangan, Sistem            | KF-11                        |
| 6   | Pengelolaan Riwayat Penyuratan                            | Tim Keuangan, Sistem            | KF-12                        |
| 7   | Penilaian Mitra dan Peringkat Triwulan                    | PML, Sistem                     | KF-14, KF-15                 |
| 8   | Impor Data Mitra dari SOBAT                               | Admin, Sistem                   | KF-02, KF-03                 |

---

## 3. Catatan pengerjaan

1. **Berkas gambar.** Seluruh diagram sudah tersedia sebagai SVG di
   `docs/diagram/out/`. Untuk Word, buka berkas SVG di peramban lalu ekspor ke PNG,
   atau gunakan perintah ekspor pada ekstensi PlantUML di VS Code.
2. **Ukuran gambar di buku.** Diagram nomor 2, 4, dan 5 cukup panjang ke bawah.
   Bila terlalu kecil saat dicetak, putar halaman menjadi _landscape_ untuk gambar
   tersebut, jangan mengecilkan gambarnya sampai tulisannya tidak terbaca.
3. **Konsistensi istilah.** Nama jalur pada seluruh diagram memakai istilah yang sama
   dengan tabel aktor di subbab use case: Ketua Tim, PML, Tim Keuangan, Admin, dan
   Sistem. Jangan mengganti salah satunya di naskah tanpa mengganti di diagram.
4. **Kebutuhan yang belum punya activity diagram.** KF-13 (rekap honor) dan KF-16
   (riwayat dan arsip kegiatan) sengaja tidak dibuatkan activity diagram karena
   alurnya lurus tanpa percabangan yang berarti: pengguna memilih penyaring, sistem
   menampilkan data, lalu pengguna mengunduhnya. Keduanya cukup dijelaskan pada
   rancangan antarmuka dan pengujian. Sebutkan alasan ini bila ditanya penguji.
