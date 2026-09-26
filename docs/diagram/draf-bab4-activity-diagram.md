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
| **4.2.3** | **Activity Diagram**        | **Sepuluh diagram, isi dokumen ini**                    |
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
honor, pemeriksaan batas SBML, dan penomoran surat.

**Istilah yang dipakai: partisi, bukan aktor.** Pada use case diagram (subbab
4.2.2), istilah *aktor* hanya dipakai untuk pihak di luar sistem yang berinteraksi
dengannya, yaitu Pegawai, Ketua Tim, PML, Tim Keuangan, dan Admin. Sistem itu
sendiri bukan aktor, melainkan pihak yang dikenai perbuatan aktor. Sebaliknya, pada
activity diagram, jalur pembagi disebut *partisi* (*partition*), dan partisi boleh
mewakili peran pengguna maupun sistem itu sendiri, karena yang dibagi adalah
tanggung jawab atas setiap langkah, bukan posisi terhadap batas sistem. Karena itu,
penyebutan "Sistem" sebagai salah satu partisi pada diagram berikut sudah tepat, dan
penulisannya sengaja dibedakan dari daftar aktor pada subbab 4.2.2 agar tidak
tertukar.

Alur keseluruhan sistem telah digambarkan pada subbab 4.2.1. Sepuluh activity
diagram berikut merincikan proses-proses utama yang ada di dalamnya. Setiap diagram
diawali satu paragraf yang menyebutkan partisi yang terlibat beserta kebutuhan
fungsional dan nonfungsional yang diwujudkannya, lalu diikuti penjelasan alurnya.

---

#### 1. Activity Diagram Otentikasi dan Penggantian Kata Sandi

**[GAMBAR]** Gambar …: Activity Diagram Otentikasi dan Penggantian Kata Sandi
_(berkas `out/activity-login.svg`)_

Partisi yang terlibat pada diagram ini adalah **Pengguna** dan **Sistem**. Diagram ini mewujudkan **KF-01 (Otentikasi dan Kata Sandi)** dan **KNF-01 (Keamanan Akses)**. KF-01 dipenuhi melalui langkah pemeriksaan nama pengguna dan kata sandi, pembentukan token sesi, serta penyediaan jalur penggantian kata sandi oleh pengguna sendiri. KNF-01 dipenuhi melalui tiga langkah yang tampak pada jalur Sistem, yaitu pembatasan percobaan masuk, penyimpanan kata sandi dalam bentuk tersandi, dan pencabutan seluruh sesi lama ketika kata sandi diganti.

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


---

#### 2. Activity Diagram Pembuatan Kegiatan, Alokasi Mitra, dan Validasi Batas SBML

**[GAMBAR]** Gambar …: Activity Diagram Pembuatan Kegiatan, Alokasi Mitra, dan
Validasi Batas SBML
_(berkas `out/activity-alokasi-sbm.svg`)_

Partisi yang terlibat pada diagram ini adalah **Ketua Tim** dan **Sistem**. Diagram ini mewujudkan **KF-04 (Pengelolaan Kegiatan)**, **KF-05 (Alokasi Mitra dan Honor)**, **KF-06 (Validasi Batas SBML)**, dan **KNF-04 (Integritas Data)**. KF-04 dipenuhi pada langkah pengisian identitas dan jadwal kegiatan beserta pemilihan tahap yang dipakai. KF-05 dipenuhi pada langkah pemilihan mitra yang dapat disaring menurut wilayah, penghitungan honor otomatis, dan pembagian muatan ke bulan pembebanan. KF-06 dipenuhi pada percabangan pemeriksaan batas honor bulanan yang memunculkan peringatan sebelum data disimpan. KNF-04 dipenuhi karena seluruh penyimpanan dijalankan sebagai satu kesatuan transaksi.

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


---

#### 3. Activity Diagram Input Progres Mitra

**[GAMBAR]** Gambar …: Activity Diagram Input Progres Mitra
_(berkas `out/activity-input-progres.svg`)_

Partisi yang terlibat pada diagram ini adalah **PML** dan **Sistem**. Diagram ini mewujudkan **KF-07 (Pemantauan Progres)** dan **KF-10 (Notifikasi Otomatis)**. KF-07 dipenuhi melalui langkah penampilan seluruh mitra yang diawasi seorang PML dari berbagai kegiatan sekaligus, pengisian jumlah mitra pada tiap status, dan pemeriksaan agar totalnya tidak melebihi beban kerja. KF-10 dipenuhi pada langkah penandaan waktu pembaruan terakhir, karena waktu itulah yang dipakai sistem untuk memunculkan notifikasi ketika progres suatu kegiatan tidak diperbarui lebih dari dua hari, dan karena data yang sama dipakai untuk memperingatkan PML atas mitra yang belum berprogres sama sekali menjelang berakhirnya masa pendataan.

PML membuka panel pembaruan progres di dasbor, lalu memilih tahap pekerjaan yang
akan diperbarui. Sistem menampilkan seluruh mitra yang diawasi PML tersebut dari
berbagai kegiatan sekaligus, sehingga PML tidak perlu membuka halaman kegiatan satu
per satu. PML mengisi jumlah mitra pada tiap status: untuk tahap pendataan dipakai
status _open_, _submit_, diperiksa, dan _approved_; untuk tahap pengolahan dipakai
status belum _entry_, sudah _entry_, validasi, dan _clean_.

Percabangan pertama terjadi sebelum PML sempat mengisi apa pun. Sistem memeriksa
apakah masa pengumpulan data kegiatan tersebut sudah dimulai. Selama kegiatan masih
berada pada tahap Persiapan, pengisian ditolak, karena mitra belum bekerja sehingga
angka apa pun yang masuk pasti keliru dan akan langsung terbawa ke persentase
kegiatan, dasbor, dan rekapitulasi. Pemeriksaan ini tidak memiliki batas atas:
setelah masa pengumpulan data berakhir, pengisian tetap terbuka, karena pendataan
kerap berlangsung melewati jadwal dan pekerjaan yang benar-benar terjadi tetap perlu
dapat dicatat.

Percabangan kedua adalah pemeriksaan hak, yaitu memastikan pengisinya benar-benar PML
mitra tersebut. Percabangan ketiga terjadi pada pemeriksaan jumlah. Sistem memastikan
jumlah seluruh status tidak melebihi beban kerja mitra. Bila melebihi, penyimpanan ditolak dengan pesan
galat dan PML diminta memperbaiki angkanya. Pemeriksaan ini diperlukan karena angka
progres menjadi dasar pemantauan di dasbor; angka yang melebihi beban kerja akan
membuat persentase kemajuan tidak masuk akal.

Setelah tersimpan, sistem memperbarui perhitungan kemajuan kegiatan dan menandai
waktu pembaruan terakhir. Waktu itulah yang kemudian dipakai untuk menandai kegiatan
yang progresnya tidak diperbarui lebih dari dua hari.

Perlu dicatat bahwa progres diinput PML secara manual, termasuk untuk kegiatan yang
pendataannya memakai aplikasi FASIH, karena sambungan langsung ke FASIH berada di
luar ruang lingkup penelitian ini.


---

#### 4. Activity Diagram Pengelolaan dan Verifikasi Dokumen

**[GAMBAR]** Gambar …: Activity Diagram Pengelolaan dan Verifikasi Dokumen
_(berkas `out/activity-verifikasi-dokumen.svg`)_

Partisi yang terlibat pada diagram ini adalah **Ketua Tim**, **Tim Keuangan**, dan **Sistem**. Diagram ini mewujudkan **KF-08 (Repositori Dokumen)**, **KF-09 (Verifikasi Dokumen)**, **KF-10 (Notifikasi Otomatis)**, dan **KNF-06 (Arsip Dokumen berupa Tautan)**. KF-08 dipenuhi pada langkah penyiapan daftar dokumen wajib tiap tahap dan pengisian tautannya. KF-09 dipenuhi pada percabangan persetujuan dan penolakan dokumen yang mewajibkan catatan revisi. KF-10 dipenuhi karena catatan penolakan dan pengingat dokumen langsung muncul sebagai notifikasi. KNF-06 dipenuhi pada langkah pemeriksaan bentuk dan panjang tautan sebelum disimpan.

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


---

#### 5. Activity Diagram Pembuatan SPK dan BAST

**[GAMBAR]** Gambar …: Activity Diagram Pembuatan Surat Perjanjian Kerja dan BAST
_(berkas `out/activity-surat-spk-bast.svg`)_

Partisi yang terlibat pada diagram ini adalah **Tim Keuangan** dan **Sistem**. Diagram ini mewujudkan **KF-11 (Surat Perjanjian Kerja dan BAST)** dan **KNF-04 (Integritas Data)**. KF-11 dipenuhi melalui langkah pengisian uraian tugas dan kode beban anggaran, penyusunan isi surat dari template, serta pembentukan berkas PDF. KNF-04 dipenuhi pada percabangan pemeriksaan surat yang sudah terbit dan pada pengambilan nomor urut di dalam kunci basis data, sehingga nomor surat tidak mungkin kembar walaupun dua orang membuat surat pada saat bersamaan.

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


---

#### 6. Activity Diagram Pengelolaan Riwayat Penyuratan

**[GAMBAR]** Gambar …: Activity Diagram Pengelolaan Riwayat Penyuratan
_(berkas `out/activity-riwayat-surat.svg`)_

Partisi yang terlibat pada diagram ini adalah **Tim Keuangan** dan **Sistem**. Diagram ini mewujudkan **KF-12 (Riwayat Penyuratan)** dan **KNF-05 (Keterlacakan dan Jejak Audit)**. KF-12 dipenuhi melalui langkah pembandingan isi surat yang tersimpan dengan data terkini, serta empat pilihan tindakan atasnya, yaitu memperbarui isi surat, membatalkan, menghapus surat batal, dan mengubah penomoran. KNF-05 dipenuhi karena surat yang tidak dipakai dibatalkan disertai catatan alasan alih-alih dihapus, dan setiap perubahan nomor dicatat beserta pelaku serta waktunya.

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


---

#### 7. Activity Diagram Penilaian Mitra dan Peringkat Triwulan

**[GAMBAR]** Gambar …: Activity Diagram Penilaian Mitra dan Peringkat Triwulan
_(berkas `out/activity-penilaian.svg`)_

Partisi yang terlibat pada diagram ini adalah **PML** dan **Sistem**. Diagram ini mewujudkan **KF-14 (Penilaian Kinerja)**, **KF-15 (Pemeringkatan Triwulanan)**, dan **KNF-01 (Keamanan Akses)**. KF-14 dipenuhi pada langkah pengisian tiga aspek penilaian dan penghitungan rata-ratanya. KF-15 dipenuhi pada langkah pengelompokan penilaian menurut triwulan berdasarkan bulan pembebanan honor dan penghitungan nilai akhir beserta urutannya. KNF-01 dipenuhi pada percabangan pemeriksaan hak akses, yang memastikan hanya PML pengawas mitra tersebut atau Admin yang dapat menyimpan penilaian.

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


---

#### 8. Activity Diagram Impor Data Mitra dari SOBAT

**[GAMBAR]** Gambar …: Activity Diagram Impor Data Mitra dari SOBAT
_(berkas `out/activity-impor-mitra.svg`)_

Partisi yang terlibat pada diagram ini adalah **Admin** dan **Sistem**. Diagram ini mewujudkan **KF-02 (Data Master)**, **KF-03 (Impor Mitra dari SOBAT)**, **KNF-04 (Integritas Data)**, dan **KNF-05 (Keterlacakan)**. KF-03 dipenuhi melalui langkah pembacaan berkas Excel, pemetaan kolom, pencocokan tiap baris dengan data yang sudah ada, dan penampilan pratinjau sebelum perubahan diterapkan. KF-02 dipenuhi karena hasil impor memperbarui basis data profil mitra. KNF-04 dipenuhi karena seluruh perubahan dijalankan sebagai satu kesatuan. KNF-05 dipenuhi karena mitra yang berhenti dinonaktifkan, bukan dihapus, sehingga riwayat honor, surat, dan penilaiannya tetap tersimpan.

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


---

---

#### 9. Activity Diagram Pengarsipan dan Penghapusan Kegiatan

**[GAMBAR]** Gambar …: Activity Diagram Pengarsipan dan Penghapusan Kegiatan
_(berkas `out/activity-arsip-hapus.svg`)_

Partisi yang terlibat pada diagram ini adalah **Admin** dan **Sistem**. Diagram ini
mewujudkan **KF-16 (Riwayat dan Arsip Kegiatan)** serta **KNF-05 (Keterlacakan dan
Jejak Audit)**. KF-16 dipenuhi melalui dua jalur tindakan atas kegiatan yang sudah
tidak berjalan, yaitu pengarsipan dan penghapusan, beserta aturan yang membatasi
kapan masing-masing boleh dilakukan. KNF-05 dipenuhi karena setiap tindakan dicatat
pada riwayat kegiatan beserta pelaku dan waktunya, dan karena kegiatan yang sudah
dikerjakan tidak dapat hilang tanpa jejak.

Proses dimulai ketika Admin membuka riwayat kegiatan dan memilih satu kegiatan yang
sudah tidak berjalan. Terdapat dua tindakan yang dapat dipilih, dan keduanya
diperlakukan berbeda.

Jalur pertama adalah pengarsipan. Sistem menandai kegiatan tersebut sebagai arsip
beserta pelaku dan waktunya, lalu menyembunyikannya dari daftar utama dasbor agar
tidak menumpuk bersama kegiatan yang sedang berjalan. Seluruh datanya tetap utuh dan
tetap ikut terhitung pada rekap honor maupun penilaian, sehingga laporan periode
sebelumnya tidak berubah. Kegiatan yang diarsipkan dapat dikembalikan sewaktu-waktu.

Jalur kedua adalah penghapusan, dan di sinilah percabangan terpenting diagram ini
terjadi. Sebelum menghapus, sistem lebih dahulu menghitung keterikatan kegiatan
tersebut, yaitu jumlah alokasi mitra dan jumlah penilaian yang sudah tersimpan
padanya. Bila salah satunya sudah ada, permintaan penghapusan **ditolak**, sistem
menjelaskan data apa saja yang akan ikut hilang bila dipaksakan, lalu mengarahkan
Admin untuk mengarsipkan kegiatan tersebut sebagai gantinya. Penghapusan permanen
hanya dijalankan bila kegiatan benar-benar belum memiliki alokasi mitra maupun
penilaian, yaitu kegiatan yang tersimpan tetapi belum sempat dikerjakan sama sekali.

Pembatasan ini penting karena seluruh data yang menempel pada sebuah kegiatan —
alokasi mitra, rincian honor, progres pekerjaan, dokumen, dan penilaian — akan ikut
terhapus bersama kegiatannya dan tidak dapat dikembalikan. Dengan aturan ini,
kehilangan data akibat kekeliruan maupun kesengajaan dapat dicegah tanpa menghalangi
Admin membersihkan kegiatan yang memang salah dibuat.

---

#### 10. Activity Diagram Rekap Honor Mitra

**[GAMBAR]** Gambar …: Activity Diagram Rekap Honor Mitra
_(berkas `out/activity-rekap-honor.svg`)_

Partisi yang terlibat pada diagram ini adalah **Pegawai** dan **Sistem**. Diagram ini
mewujudkan **KF-13 (Rekap Honor dan Beban Kerja)** dan berkaitan langsung dengan
**KF-06 (Validasi Batas SBML)**. KF-13 dipenuhi melalui langkah pemilihan periode,
penjumlahan honor seluruh mitra dari seluruh kegiatan, penandaan mitra yang melebihi
batas, serta penyediaan berkas unduhan. Keterkaitan dengan KF-06 terletak pada
langkah pembandingan honor puncak bulanan tiap mitra terhadap batas SBML, yang
membuat halaman ini berfungsi sebagai tempat pemeriksaan menyeluruh setelah
peringatan per kegiatan diberikan pada saat alokasi disimpan.

Proses dimulai ketika pegawai membuka halaman Manajemen Honor dan menentukan periode
yang ingin dilihat. Periode dapat ditentukan dengan dua cara: memilih satu bulan
tertentu, atau menentukan rentang tanggal secara bebas. Dua cara ini disediakan
karena kebutuhan pemeriksaan tidak selalu mengikuti batas bulan kalender, misalnya
ketika Tim Keuangan memeriksa honor sepanjang satu kegiatan yang periodenya
melintasi dua bulan.

Sistem kemudian memeriksa kelengkapan dan kewajaran periode yang dipilih, misalnya
memastikan tanggal mulai tidak berada setelah tanggal selesai. Bila periode tidak
sah, permintaan ditolak disertai pesan galat, dan alur berhenti.

Bila periode sah, sistem menjumlahkan honor setiap mitra pada periode tersebut dari
seluruh kegiatan dan seluruh tim, bukan hanya dari kegiatan tim yang sedang membuka
halaman. Penjumlahan lintas tim inilah yang dahulu harus dikerjakan manual dengan
menggabungkan beberapa berkas. Sistem lalu membandingkan honor puncak bulanan tiap
mitra dengan batas SBML dan menampilkan tabel rekap beserta penanda bagi mitra yang
melebihi batas, sehingga mitra yang perlu diperiksa langsung terlihat tanpa membaca
seluruh angka satu per satu.

Tahap terakhir bersifat pilihan. Bila rekap tersebut diperlukan sebagai lampiran
atau bahan pembayaran, pegawai dapat mengunduhnya dalam bentuk PDF atau Excel.
Berkas dibentuk di peramban berdasarkan data yang sedang tampil, sehingga isinya
selalu sama dengan baris yang terlihat di layar, mengikuti periode dan pencarian
yang sedang dipakai.

### Tabel Ringkasan Activity Diagram

Tabel berikut dapat dipakai sebagai penutup subbab 4.2.3.

| No  | Activity Diagram                                          | Partisi                         | Kebutuhan Fungsional Terkait |
| --- | --------------------------------------------------------- | ------------------------------- | ---------------------------- |
| 1   | Otentikasi dan Penggantian Kata Sandi                     | Pengguna, Sistem                | KF-01                        |
| 2   | Pembuatan Kegiatan, Alokasi Mitra, dan Validasi Batas SBML | Ketua Tim, Sistem               | KF-04, KF-05, KF-06          |
| 3   | Input Progres Mitra                                       | PML, Sistem                     | KF-07                        |
| 4   | Pengelolaan dan Verifikasi Dokumen                        | Ketua Tim, Tim Keuangan, Sistem | KF-08, KF-09, KF-10          |
| 5   | Pembuatan SPK dan BAST                                    | Tim Keuangan, Sistem            | KF-11                        |
| 6   | Pengelolaan Riwayat Penyuratan                            | Tim Keuangan, Sistem            | KF-12                        |
| 7   | Penilaian Mitra dan Peringkat Triwulan                    | PML, Sistem                     | KF-14, KF-15                 |
| 8   | Impor Data Mitra dari SOBAT                               | Admin, Sistem                   | KF-02, KF-03                 |
| 9   | Pengarsipan dan Penghapusan Kegiatan                      | Admin, Sistem                   | KF-16                        |
| 10  | Rekap Honor Mitra                                         | Pegawai, Sistem                 | KF-13                        |

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
4. **Seluruh kebutuhan fungsional utama kini sudah memiliki activity diagram.**
   KF-13 dan KF-16 yang semula tidak dibuatkan kini masing-masing memiliki diagram
   tersendiri, yaitu diagram nomor 10 dan nomor 9. Satu-satunya kebutuhan yang tidak
   dibuatkan diagram adalah yang sifatnya menampilkan data tanpa percabangan sama
   sekali, dan hal itu sudah tercakup pada rancangan antarmuka.
