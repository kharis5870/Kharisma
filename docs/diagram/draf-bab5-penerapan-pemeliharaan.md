# Draf Bab V — Bagian 3: Penerapan dan Pemeliharaan

Dokumen ini berisi draf subbab **5.3 Penerapan (Deployment)** dan **5.4 Pemeliharaan
(Maintenance)** — dua tahap terakhir pada metode Modified Waterfall di Bab III Anda.
Ditambahkan supaya Bab V benar-benar mengikuti seluruh tahap yang dijanjikan
metodologi, bukan berhenti di pengujian saja.

**Penyesuaian nomor subbab:** naskah ini memakai 5.3 dan 5.4 dengan asumsi struktur
Bab V Anda adalah 5.1 Implementasi, 5.2 Evaluasi. Sesuaikan angkanya bila susunan
Anda berbeda, dan **samakan judul "Penerapan (Deployment)" dan "Pemeliharaan
(Maintenance)" persis dengan istilah yang dipakai di Bab III** Anda (draf revisi
Bab III menyebutnya "3.2 Deployment"; kalau Bab III memakai kata Indonesia saja,
ikuti itu di sini juga).

**Yang perlu ditegaskan sebelum menulis:** sistem ini **belum diterapkan** saat
naskah ini disusun. Karena itu kedua subbab di bawah ditulis sebagai **prosedur
dan rencana yang disiapkan**, bukan laporan hasil yang sudah terjadi. Ini tetap
sah secara metodologis — Modified Waterfall tetap "dijalankan" selama tahapnya
disiapkan dan didokumentasikan, walau pelaksanaan sebagian tahap terakhir jatuh
setelah masa penyusunan skripsi. Setelah sistem benar-benar dipasang, ganti
kalimat berpola "akan dilakukan" menjadi laporan yang sudah terjadi, dan
tambahkan tangkapan layar buktinya.

---

## 5.3 Penerapan (Deployment)

Tahap penerapan menerjemahkan sistem yang telah diuji pada subbab 5.2 ke
lingkungan yang sesungguhnya dipakai BPS Kabupaten Bengkulu Selatan, yaitu
layanan *hosting* cPanel milik BPS yang dapat diakses dari luar kantor melalui
koneksi FortiClient VPN BPS. Pada saat naskah ini disusun, penerapan tersebut
**direncanakan dan disiapkan prosedurnya**, sedangkan pelaksanaannya menyesuaikan
jadwal serah terima ke BPS Kabupaten Bengkulu Selatan.

### 5.3.1 Persiapan Sebelum Penerapan

Sebelum dipasang ke cPanel, tiga hal berikut disiapkan agar penerapan tidak
mengganggu data yang sudah ada di kantor.

1. **Membangun berkas produksi.** Kode sumber diringkas menjadi berkas siap
   pakai memakai perintah `pnpm build`, yang menjalankan dua proses:
   `build:client` membuat berkas antarmuka statis, dan `build:server` membuat
   berkas server Node.js. Hasilnya lebih kecil dan lebih cepat dimuat
   dibanding menjalankan kode sumber langsung, karena sudah dipadatkan dan
   pustaka yang tidak dipakai dibuang.
2. **Menyiapkan basis data cPanel.** Struktur 18 tabel dibuat di MySQL yang
   disediakan cPanel melalui phpMyAdmin, dengan menjalankan berkas skema dasar
   diikuti seluruh berkas migrasi di `db/migrations/` secara berurutan sesuai
   tanggalnya, supaya struktur akhirnya sama persis dengan yang dipakai saat
   pengembangan dan pengujian.
3. **Menyiapkan berkas pengaturan (`.env`).** Berkas ini memuat data yang
   berbeda antara komputer pengembangan dan server cPanel, dan tidak pernah
   ikut disalin sebagai kode karena berisi kredensial. Tiga isian yang wajib
   disesuaikan:
   - **Sambungan basis data** — di cPanel, nama pengguna dan nama basis data
     MySQL diberi awalan nama akun cPanel, berbeda dari pengaturan lokal.
   - **Rahasia sesi (`SESSION_SECRET`)** — nilai acak sepanjang minimal 16
     karakter yang menandatangani token *login*. Nilainya wajib diisi tetap
     (bukan dibiarkan kosong), karena Passenger di cPanel dapat memulai ulang
     aplikasi sewaktu-waktu; bila dibiarkan kosong, setiap kali server
     dimulai ulang seluruh pengguna akan otomatis keluar dari sesinya.
   - **Integrasi FASIH** — dikosongkan, karena penyambungan ke FASIH masih
     menunggu pihak pengelola FASIH menyediakan alamat dan spesifikasi
     datanya (lihat subbab 5.4.3).

### 5.3.2 Prosedur Penerapan

**Tabel …: Prosedur Penerapan ke Hosting cPanel BPS**

| No | Langkah | Keterangan |
| --- | --- | --- |
| 1 | Menjalankan `pnpm build` di komputer pengembangan | Menghasilkan folder `dist/` berisi berkas antarmuka dan server yang siap diunggah |
| 2 | Mengunggah folder `dist/` beserta `package.json` ke cPanel | Melalui File Manager cPanel atau unggahan berkas terkompresi |
| 3 | Membuat basis data dan pengguna MySQL di cPanel | Menu *MySQL Databases*; namanya otomatis diberi awalan nama akun |
| 4 | Mengimpor struktur 18 tabel ke basis data tersebut | Melalui phpMyAdmin, urut sesuai tanggal berkas di `db/migrations/` |
| 5 | Mengatur aplikasi Node.js melalui menu *Setup Node.js App* | Menunjuk ke folder hasil unggahan dan berkas awal `dist/server/node-build.cjs` |
| 6 | Mengisi variabel lingkungan (`.env`) melalui menu yang sama | Sambungan basis data, `SESSION_SECRET`, dan pengaturan lain |
| 7 | Menjalankan aplikasi dan memeriksa halaman masuk dapat dibuka | Diakses dari jaringan BPS dan dari luar kantor melalui FortiClient VPN |
| 8 | Membuat akun Admin pertama langsung di basis data | Untuk masuk pertama kali sebelum akun pengguna lain dibuat lewat aplikasi |
| 9 | Menjalankan pemeriksaan asap (*smoke test*) | Lihat daftar pada 5.3.3 |

### 5.3.3 Pemeriksaan Asap (*Smoke Test*) Setelah Penerapan

Pemeriksaan singkat ini memastikan fungsi inti berjalan pada lingkungan
sesungguhnya sebelum sistem mulai dipakai sehari-hari. Berbeda dari pengujian
*black box* pada subbab 5.2.1 yang menguji setiap aturan secara rinci,
pemeriksaan ini hanya memastikan jalur utamanya tidak rusak akibat perbedaan
lingkungan (misalnya versi Node.js atau MySQL yang berbeda dari komputer
pengembangan).

**Tabel …: Daftar Pemeriksaan Asap**

| No | Yang Diperiksa | Hasil yang Diharapkan | Sudah Sesuai? |
| --- | --- | --- | --- |
| 1 | Masuk memakai akun Admin | Berhasil masuk dan dasbor tampil | |
| 2 | Membuat satu kegiatan uji beserta alokasi mitra | Tersimpan tanpa galat | |
| 3 | Mengunduh satu berkas PDF (SPK) | Berkas terbentuk dan terbaca | |
| 4 | Mengunduh satu berkas Excel (rekap honor) | Berkas terbentuk dan terbaca | |
| 5 | Membuka sistem dari luar jaringan BPS melalui FortiClient VPN | Sistem dapat diakses seperti dari dalam kantor | |
| 6 | Memuat ulang halaman setelah beberapa saat | Sesi tidak terputus (memastikan `SESSION_SECRET` sudah tetap) | |
| 7 | Menghapus data kegiatan uji pada langkah 2 | Basis data kembali bersih sebelum dipakai sesungguhnya | |

*(Isi kolom terakhir setelah penerapan sungguhan dilaksanakan.)*

### 5.3.4 Kesesuaian dengan Kebutuhan Nonfungsional

Prosedur di atas mewujudkan **KNF-02**, yaitu sistem berjalan pada layanan
*hosting* cPanel milik BPS dan hanya dapat diakses dari luar kantor melalui
FortiClient VPN BPS. Setelah penerapan sungguhan selesai, lengkapi subbab ini
dengan tangkapan layar alamat sistem yang sudah aktif, dan perbarui baris
KNF-02 pada tabel Ringkasan Pemenuhan Kebutuhan (subbab 5.2.5) dari kosong
menjadi "Terpenuhi".

---

## 5.4 Pemeliharaan (*Maintenance*)

Tahap pemeliharaan adalah tahap terakhir pada metode Modified Waterfall,
mencakup kegiatan yang berjalan setelah sistem diterapkan agar tetap berfungsi
benar dan dapat mengikuti perubahan kebutuhan di masa depan. Empat jenis
pemeliharaan berikut direncanakan, mengikuti pembagian yang umum dipakai dalam
rekayasa perangkat lunak.

### 5.4.1 Pemeliharaan Korektif

Pemeliharaan korektif adalah perbaikan atas kesalahan yang ditemukan setelah
sistem dipakai. Karena sistem sudah memiliki 568 pengujian otomatis (subbab
5.2.1) yang dijalankan setiap kali kode diubah, kesalahan baru dapat dideteksi
lebih awal sebelum sampai ke pengguna. Laporan kesalahan dari pegawai
disarankan disampaikan kepada Admin, dicatat, lalu diperbaiki mengikuti
prioritas: kesalahan yang menghambat pekerjaan (misalnya SPK gagal terbit)
didahulukan dari kesalahan tampilan yang tidak mengganggu pekerjaan.

### 5.4.2 Pemeliharaan Adaptif

Pemeliharaan adaptif adalah penyesuaian sistem terhadap perubahan di luar
sistem itu sendiri, misalnya perubahan aturan atau regulasi. Dua contoh yang
sudah diantisipasi sejak perancangan:

- **Perubahan nilai batas honor bulanan (SBM/SBML).** Nilai batas ini
  disimpan sebagai pengaturan yang dapat diubah Tim Keuangan atau Admin
  langsung dari halaman Manajemen Honor, bukan ditulis tetap di dalam kode.
  Akibatnya, penyesuaian nilai batas pada tahun anggaran berikutnya tidak
  memerlukan perubahan kode maupun keterlibatan pengembang.
- **Pergantian pihak yang menjabat PPK atau Kepala Satuan Kerja.** Data ini
  diatur melalui halaman Template Surat, sehingga pergantian pejabat cukup
  diperbarui satu kali di halaman tersebut dan langsung berlaku untuk surat
  berikutnya.

### 5.4.3 Pemeliharaan Perfektif

Pemeliharaan perfektif adalah penambahan atau penyempurnaan fitur berdasarkan
kebutuhan yang baru diketahui setelah sistem dipakai. Satu pekerjaan lanjutan
yang sudah disiapkan jalurnya sejak perancangan adalah **penyambungan ke
aplikasi FASIH**. Kolom penanda kegiatan FASIH dan titik sambung pengambilan
data progres (`server/integrasi/sumberProgress.ts`) sudah disiapkan di dalam
kode, tetapi alamat dan bentuk data FASIH belum dapat dipastikan karena FASIH
sedang dalam pemeliharaan pada pihaknya sendiri saat pengembangan berlangsung.
Penyambungan ini dapat dilanjutkan tanpa mengubah struktur basis data maupun
antarmuka yang sudah ada, begitu spesifikasinya tersedia dari pengelola FASIH.

### 5.4.4 Pemeliharaan Preventif

Pemeliharaan preventif adalah tindakan rutin untuk mencegah gangguan sebelum
terjadi. Dua kebiasaan berikut sudah diterapkan sejak pengembangan dan
disarankan diteruskan setelah sistem diterapkan:

- **Cadangan basis data sebelum perubahan struktur.** Setiap kali struktur
  tabel diubah (migrasi), basis data dicadangkan lebih dulu dan migrasinya
  diuji pada salinan sebelum diterapkan ke basis data yang sesungguhnya.
  Kebiasaan ini disarankan diteruskan Admin, ditambah cadangan rutin berkala
  (disarankan mingguan) di luar waktu perubahan struktur, sehingga data mitra
  tidak bergantung sepenuhnya pada satu salinan.
- **Pengelolaan versi kode sumber.** Seluruh perubahan kode tercatat riwayatnya
  melalui Git, sehingga perubahan yang keliru dapat ditelusuri dan
  dikembalikan ke versi sebelumnya bila diperlukan.

**Tabel …: Ringkasan Jadwal Pemeliharaan yang Disarankan**

| Jenis Pemeliharaan | Contoh Kegiatan | Frekuensi Disarankan | Penanggung Jawab |
| --- | --- | --- | --- |
| Preventif | Mencadangkan basis data | Mingguan, dan setiap sebelum migrasi | Admin |
| Korektif | Menindaklanjuti laporan kesalahan pengguna | Sesuai laporan masuk | Admin / pengembang |
| Adaptif | Menyesuaikan nilai batas honor tahun anggaran baru | Tahunan | Tim Keuangan / Admin |
| Perfektif | Melanjutkan penyambungan ke FASIH bila spesifikasinya tersedia | Menyesuaikan ketersediaan FASIH | Pengembang |

---

## Catatan penutup kedua subbab

Kalimat penutup Bab V (sebelum masuk kesimpulan Bab VI) dapat merangkai kelima
subbab yang sekarang lengkap: implementasi (5.1), evaluasi (5.2), penerapan
(5.3), dan pemeliharaan (5.4) — seluruhnya konsisten dengan tahap Modified
Waterfall yang dipilih sejak Bab III, termasuk sifat *feedback loop* metode
tersebut yang sudah dibuktikan lewat contoh nyata perubahan rancangan pada
subbab 5.1.6.
