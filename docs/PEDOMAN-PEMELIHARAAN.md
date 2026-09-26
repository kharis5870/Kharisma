# Pedoman Pemeliharaan SIKAMI

Untuk pengelola teknologi informasi BPS Kabupaten Bengkulu Selatan

Sistem Informasi Administrasi dan Pemantauan Kegiatan Mitra Statistik (SIKAMI)

---

## Daftar Isi

1. [Gambaran Sistem](#1-gambaran-sistem)
2. [Berkas dan Lokasi Penting](#2-berkas-dan-lokasi-penting)
3. [Memasang Pertama Kali](#3-memasang-pertama-kali)
4. [Memperbarui Aplikasi](#4-memperbarui-aplikasi)
5. [Perubahan Struktur Basis Data](#5-perubahan-struktur-basis-data)
6. [Pencadangan dan Pemulihan](#6-pencadangan-dan-pemulihan)
7. [Pemantauan Rutin](#7-pemantauan-rutin)
8. [Jadwal Pemeliharaan](#8-jadwal-pemeliharaan)
9. [Penanganan Masalah](#9-penanganan-masalah)
10. [Keamanan](#10-keamanan)
11. [Pengembangan Lanjutan](#11-pengembangan-lanjutan)
12. [Serah Terima](#12-serah-terima)

---

## 1. Gambaran Sistem

### 1.1 Susunan teknologi

| Lapisan | Teknologi | Keterangan |
| --- | --- | --- |
| Antarmuka | React 18 + TypeScript, dibangun dengan Vite | Aplikasi satu halaman (SPA) |
| Server | Node.js + Express 4 | Menyajikan berkas statis sekaligus API |
| Basis data | MariaDB / MySQL | 18 tabel |
| Penempatan | Layanan _hosting_ cPanel milik BPS, dijalankan Passenger | Diakses dari jaringan BPS atau lewat FortiClient VPN |

Aplikasi berjalan pada satu proses Node.js. Tidak ada _worker_, antrean, maupun
layanan latar belakang. Tidak ada berkas yang diunggah ke server: dokumen
disimpan sebagai **tautan** ke penyimpanan instansi, sehingga tidak ada folder
unggahan yang perlu dipelihara.

### 1.2 Alamat

Aplikasi dipasang pada sub-jalur **`/kharisma`**, bukan pada akar domain.

| Bagian | Alamat |
| --- | --- |
| Halaman | `https://<domain-bps>/kharisma` |
| API | `https://<domain-bps>/kharisma/api` |
| Akar domain | Dialihkan otomatis ke `/kharisma` |

Sub-jalur ini tertulis di tiga tempat dan **harus sama ketiganya**:
`vite.config.ts` (`base`), `server/index.ts`, dan `server/node-build.ts`. Bila
suatu saat alamatnya dipindahkan, ubah ketiganya lalu bangun ulang.

### 1.3 Skala pemakaian

Sistem dipakai paling banyak sekitar **20 orang**, biasanya 1 sampai 8 orang
bersamaan. Ini penting diketahui sebelum menambah sumber daya server: bila
aplikasi terasa lambat, hampir pasti sebabnya bukan jumlah pemakai.

---

## 2. Berkas dan Lokasi Penting

### 2.1 Struktur kode

| Folder | Isi |
| --- | --- |
| `client/` | Antarmuka React. `pages/` berisi halaman, `components/` komponen bersama |
| `server/` | Express. `routes/` titik akhir API, `services/` logika bisnis, `auth/` otentikasi |
| `shared/` | Kode yang dipakai klien dan server, termasuk aturan hak akses |
| `db/migrations/` | Berkas SQL perubahan struktur, berurutan menurut tanggal |
| `db/backup/` | Cadangan basis data sebelum tiap perubahan struktur |
| `docs/` | Dokumentasi, termasuk berkas ini |
| `dist/` | Hasil bangunan. **Tidak disimpan di git**, dibuat oleh `pnpm build` |

### 2.2 Variabel lingkungan

Seluruhnya dibaca dari berkas `.env` di akar aplikasi, atau dari menu
**Setup Node.js App > Environment variables** di cPanel.

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DB_HOST` | Ya | `localhost` pada cPanel |
| `DB_USER` | Ya | Di cPanel berprefiks nama akun, misalnya `namaakun_kharisma` |
| `DB_PASSWORD` | Ya | Dibuat di menu MySQL Databases |
| `DB_DATABASE` | Ya | Juga berprefiks nama akun |
| `DB_PORT` | Ya | `3306` di cPanel |
| `SESSION_SECRET` | **Ya** | Lihat peringatan di bawah |
| `PORT` | Tidak | Diisi sendiri oleh Passenger |
| `NODE_ENV` | Tidak | Diisi `production` oleh Passenger |
| `FASIH_BASE_URL` | Tidak | Kosongkan selama belum tersambung ke FASIH |
| `FASIH_TOKEN` | Tidak | Kosongkan selama belum tersambung ke FASIH |

> **`SESSION_SECRET` wajib diisi dan minimal 16 karakter.** Bila dikosongkan,
> server membuat rahasia acak baru setiap kali menyala, sehingga **seluruh
> pengguna terlempar keluar setiap aplikasi dimulai ulang**. Passenger memulai
> ulang aplikasi cukup sering, jadi akibatnya akan sangat terasa.
>
> Membuat nilainya:
> ```
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```
>
> Nilainya harus **berbeda** antara server dan komputer pengembang, dan tidak
> boleh masuk git maupun dibagikan lewat pesan singkat.

Contoh lengkap beserta penjelasannya ada di `.env.example`. Berkas `.env` yang
sebenarnya **tidak boleh** masuk git.

### 2.3 Perintah

| Perintah | Kegunaan |
| --- | --- |
| `pnpm install` | Memasang dependensi |
| `pnpm dev` | Menjalankan di komputer pengembang (klien dan server sekaligus) |
| `pnpm build` | Membangun untuk produksi; hasilnya di `dist/` |
| `pnpm start` | Menjalankan hasil bangunan (`node dist/server/node-build.cjs`) |
| `pnpm test` | Menjalankan seluruh pengujian otomatis |
| `pnpm typecheck` | Memeriksa kesalahan tipe TypeScript |
| `pnpm lint` | Memeriksa gaya penulisan kode |

---

## 3. Memasang Pertama Kali

Perkiraan waktu: 1–2 jam.

### 3.1 Menyiapkan basis data

1. Di cPanel, buka **MySQL Databases**.
2. Buat basis data baru, misalnya `kharisma`. cPanel akan memberinya prefiks
   nama akun.
3. Buat pengguna basis data baru beserta kata sandinya.
4. Tambahkan pengguna itu ke basis data dengan hak **ALL PRIVILEGES**.
5. Catat nama basis data, nama pengguna, dan kata sandinya — semuanya lengkap
   dengan prefiksnya.

### 3.2 Mengunggah aplikasi

1. Bangun aplikasi di komputer pengembang dengan `pnpm build`.
2. Unggah ke server: folder `dist/`, `package.json`, `pnpm-lock.yaml`, dan
   folder `db/`.
3. Di cPanel, buka **Setup Node.js App**, lalu buat aplikasi baru:
   - **Application root**: folder tempat Anda mengunggah;
   - **Application URL**: domain beserta jalur `/kharisma`;
   - **Application startup file**: `dist/server/node-build.cjs`;
   - **Node.js version**: 18 atau lebih baru.
4. Isi seluruh variabel lingkungan pada bagian **Environment variables**.
5. Klik **Run NPM Install**.

### 3.3 Mengisi struktur basis data

Jalankan seluruh berkas di `db/migrations/` **berurutan menurut tanggal pada
nama berkasnya**, melalui phpMyAdmin atau baris perintah:

```
mysql -u <pengguna> -p <nama_basis_data> < db/migrations/<berkas>.sql
```

Urutannya penting. Berkas yang belakangan mengandaikan perubahan berkas
sebelumnya sudah dijalankan.

### 3.4 Memeriksa hasil pemasangan

Lakukan pemeriksaan singkat berikut sebelum menyerahkan alamatnya kepada
pengguna:

| # | Yang diperiksa | Hasil yang benar |
| --- | --- | --- |
| 1 | Membuka `/kharisma` | Halaman masuk tampil |
| 2 | Masuk dengan akun admin | Dasbor tampil |
| 3 | Membuka Manajemen Admin | Daftar akun tampil |
| 4 | Membuat satu kegiatan percobaan | Tersimpan dan muncul di dasbor |
| 5 | Mengalokasikan satu mitra | Honor terhitung sendiri |
| 6 | Mengunduh rekap honor ke Excel | Berkas terunduh dan dapat dibuka |
| 7 | Membuat satu SPK percobaan | PDF terbentuk dan bernomor |
| 8 | Keluar lalu masuk kembali | Berhasil |
| 9 | Membuka dari luar kantor tanpa VPN | **Tidak** dapat dibuka |

Hapus kegiatan percobaan setelah selesai.

---

## 4. Memperbarui Aplikasi

Lakukan pembaruan **di luar jam kerja**, dan jangan pada tanggal-tanggal sibuk
seperti awal bulan saat SPK dibuat.

### 4.1 Langkah baku

1. **Cadangkan basis data lebih dulu** (bagian 6.1). Jangan pernah dilewati.
2. Di komputer pengembang, jalankan `pnpm test` dan `pnpm typecheck`. Keduanya
   harus lulus sebelum melanjutkan.
3. Jalankan `pnpm build`.
4. Unggah folder `dist/` yang baru ke server, menimpa yang lama.
5. Bila ada perubahan dependensi, unggah juga `package.json` dan
   `pnpm-lock.yaml`, lalu klik **Run NPM Install** di cPanel.
6. Bila ada berkas migrasi baru, jalankan sesuai bagian 5.
7. Klik **Restart** pada Setup Node.js App.
8. Ulangi pemeriksaan singkat pada bagian 3.4, nomor 1 sampai 5.

### 4.2 Bila pembaruan gagal

Kembalikan folder `dist/` versi sebelumnya, lalu **Restart**. Karena itu
**simpanlah folder `dist/` yang lama** dengan nama berbeda sebelum menimpanya,
misalnya `dist-2026-09-24`. Menyimpan dua versi terakhir sudah memadai.

Bila migrasi basis data sudah terlanjur dijalankan, pengembalian tidak cukup
dengan mengembalikan `dist/`. Pulihkan juga basis datanya dari cadangan
(bagian 6.2).

---

## 5. Perubahan Struktur Basis Data

### 5.1 Aturan

1. **Setiap perubahan struktur ditulis sebagai berkas SQL** di `db/migrations/`
   dengan nama berawalan tanggal, misalnya `2026-09-22-kode-wilayah.sql`. Jangan
   pernah mengubah struktur langsung lewat phpMyAdmin tanpa mencatatnya —
   perubahan yang tidak tercatat akan hilang saat dipasang di tempat lain, dan
   tidak seorang pun akan tahu mengapa.
2. **Berkas migrasi yang sudah dijalankan tidak boleh diubah lagi.** Bila ada
   yang keliru, buat berkas baru yang memperbaikinya.
3. **Cadangkan lebih dulu**, dengan nama yang menyebut migrasi yang akan
   dijalankan. Lihat pola penamaan di `db/backup/`.
4. **Uji pada salinan basis data lebih dulu**, bukan langsung pada basis data
   yang dipakai.

### 5.2 Urutan pengerjaan

```
1. Cadangkan basis data       -> db/backup/kharisma_db-<tanggal>-sebelum-<nama>.sql
2. Buat salinan basis data    -> kharisma_uji
3. Jalankan migrasi di salinan
4. Periksa hasilnya           -> jumlah baris, kolom baru, nilai NULL yang tersisa
5. Bila benar, jalankan pada basis data yang sebenarnya
6. Restart aplikasi
```

### 5.3 Hal yang mudah keliru

Migrasi `2026-09-22-kode-wilayah.sql` dapat dijadikan contoh yang baik: indeks
uniknya sengaja dipasang **sesudah** pengisian data, supaya baris yang gagal
terisi terlihat sebagai NULL yang tersisa dan dapat ditelusuri, bukan sebagai
galat indeks yang membatalkan seluruh migrasi tanpa menyebutkan baris
penyebabnya. Tirulah pola ini untuk migrasi serupa.

Periksa selalu setelah migrasi yang mengisi data:

```sql
SELECT COUNT(*) FROM <tabel> WHERE <kolom_baru> IS NULL;
```

Hasilnya harus nol, kecuali bila memang ada baris yang sengaja dibiarkan kosong.

---

## 6. Pencadangan dan Pemulihan

### 6.1 Mencadangkan

**Otomatis.** cPanel biasanya sudah menyediakan cadangan harian. Pastikan
basis data SIKAMI termasuk di dalamnya, dan pastikan Anda tahu **berapa lama**
cadangan itu disimpan.

**Manual**, wajib dilakukan sebelum setiap pembaruan dan setiap migrasi:

```
mysqldump -u <pengguna> -p --single-transaction --routines \
  <nama_basis_data> > kharisma_db-<tanggal>-sebelum-<keterangan>.sql
```

Atau lewat phpMyAdmin: pilih basis datanya > **Export** > **Quick** > **SQL**
> **Go**.

**Simpan cadangan di luar server.** Cadangan yang hanya berada di server yang
sama tidak menolong bila servernya sendiri yang bermasalah.

### 6.2 Memulihkan

```
mysql -u <pengguna> -p <nama_basis_data> < <berkas_cadangan>.sql
```

Setelah pemulihan, **Restart** aplikasi, lalu periksa:

- jumlah kegiatan dan jumlah mitra sesuai perkiraan;
- rekap honor bulan berjalan tampil dengan benar;
- riwayat penyuratan masih memuat nomor-nomor terakhir.

### 6.3 Yang harus ikut dicadangkan

| Yang dicadangkan | Cara | Seberapa sering |
| --- | --- | --- |
| Basis data | `mysqldump` atau cPanel | Harian, dan sebelum tiap perubahan |
| Berkas `.env` | Salin manual ke tempat aman | Setiap kali berubah |
| Kode sumber | Repositori git | Setiap perubahan |
| Folder `dist/` versi berjalan | Salin sebelum menimpa | Setiap pembaruan |

Dokumen kegiatan **tidak** perlu dicadangkan dari sini, karena yang disimpan
hanya tautannya. Berkas aslinya berada di penyimpanan instansi dan dicadangkan
di sana.

---

## 7. Pemantauan Rutin

| Yang dipantau | Cara | Seberapa sering | Tanda bermasalah |
| --- | --- | --- | --- |
| Aplikasi hidup | Buka `/kharisma` | Harian | Halaman tidak terbuka atau galat 503 |
| Catatan galat | cPanel > Setup Node.js App > log, atau `stderr.log` | Mingguan | Galat yang berulang |
| Ukuran basis data | phpMyAdmin, kolom ukuran | Bulanan | Pertumbuhan yang tidak wajar |
| Ruang penyimpanan | cPanel > File Usage | Bulanan | Di atas 80 % |
| Percobaan masuk gagal | Catatan galat | Bulanan | Banyak kegagalan dari satu alamat |
| Cadangan berhasil | Periksa berkas cadangan terbaru | Mingguan | Cadangan terakhir lebih dari 2 hari |

Yang paling sering luput adalah **memastikan cadangan benar-benar terbentuk**.
Cadangan yang tidak pernah diperiksa hampir selalu ketahuan rusak justru ketika
dibutuhkan.

Ukuran basis datanya kecil. Dengan pemakaian normal satu satuan kerja,
pertumbuhannya di bawah 100 MB per tahun. Lonjakan mendadak berarti ada yang
tidak wajar dan perlu ditelusuri.

---

## 8. Jadwal Pemeliharaan

### 8.1 Pemeliharaan korektif — memperbaiki yang rusak

Dikerjakan saat ada laporan masalah. Urutannya: catat laporannya, tirukan
masalahnya, periksa catatan galat, perbaiki, uji, pasang.

Sasaran waktu tanggap yang wajar:

| Tingkat | Contoh | Ditangani dalam |
| --- | --- | --- |
| Berat | Aplikasi tidak dapat dibuka, data hilang, seluruh pengguna terkunci | Hari yang sama |
| Sedang | Satu menu tidak berfungsi, angka rekap keliru | 3 hari kerja |
| Ringan | Salah ketik, tata letak kurang rapi | Pembaruan berikutnya |

### 8.2 Pemeliharaan adaptif — mengikuti perubahan di luar sistem

Yang perlu diawasi:

| Perubahan | Akibat pada sistem | Tindakan |
| --- | --- | --- |
| Batas SBML berubah | Peringatan honor memakai angka lama | Tim Keuangan mengubahnya lewat pengaturan, tanpa perlu menyunting kode |
| Format ekspor SOBAT atau PALAPA berubah | Impor mitra gagal atau salah membaca kolom | Sesuaikan pembaca berkas impor |
| Pemekaran atau perubahan nama wilayah | Kode kecamatan atau desa tidak cocok | Tambahkan lewat berkas migrasi baru |
| Templat surat resmi berubah | Isi SPK atau BAST tidak sesuai | Tim Keuangan mengubahnya lewat menu Template Surat |
| FASIH sudah dapat disambungkan | Progres masih manual | Ikuti `docs/integrasi-fasih.md` |

Perhatikan bahwa tiga dari lima perubahan di atas **tidak memerlukan perubahan
kode**. Itu memang disengaja saat perancangan.

### 8.3 Pemeliharaan perfektif — menyempurnakan

Kumpulkan masukan pengguna sepanjang triwulan, lalu tinjau sekali tiap triwulan.
Dahulukan yang menyangkut pekerjaan yang paling sering dilakukan.

### 8.4 Pemeliharaan preventif — mencegah masalah

| Pekerjaan | Seberapa sering |
| --- | --- |
| Menjalankan `pnpm test` dan `pnpm typecheck` | Sebelum tiap pembaruan |
| Memeriksa dependensi yang punya celah keamanan (`pnpm audit`) | Triwulanan |
| Memperbarui dependensi versi kecil | Triwulanan |
| Memperbarui versi Node.js | Tahunan, atau bila versinya berhenti didukung |
| Mencoba memulihkan cadangan ke basis data uji | Semesteran |
| Memeriksa daftar akun dan menonaktifkan yang tidak dipakai | Semesteran |
| Mengarsipkan kegiatan tahun lalu | Tahunan |

**Percobaan pemulihan cadangan setiap semester sangat penting.** Inilah
satu-satunya cara memastikan cadangan Anda benar-benar dapat dipakai.

---

## 9. Penanganan Masalah

### 9.1 Aplikasi tidak dapat dibuka

1. Periksa Setup Node.js App di cPanel — apakah statusnya berjalan?
2. Buka catatan galat, perhatikan baris terakhir.
3. Klik **Restart**.
4. Bila tetap gagal, periksa apakah `dist/server/node-build.cjs` benar-benar ada.
5. Periksa apakah basis data dapat dihubungi dari phpMyAdmin.

Sebab tersering: variabel lingkungan berubah atau terhapus setelah penyuntingan
di cPanel.

### 9.2 Seluruh pengguna tiba-tiba diminta masuk lagi

Hampir pasti `SESSION_SECRET` kosong atau berubah. Periksa variabel
lingkungannya. Bila memang kosong, isi dengan nilai tetap, lalu **Restart**.
Setelah itu kejadian ini tidak akan terulang.

### 9.3 Galat "Too many connections" dari basis data

Kumpulan koneksi tidak tertutup dengan benar, biasanya karena aplikasi dimulai
ulang berkali-kali dalam waktu singkat. **Restart** satu kali, lalu amati. Bila
berulang, naikkan `max_connections` di cPanel atau hubungi penyedia layanan.

### 9.4 Berkas JavaScript tidak ditemukan setelah pembaruan

Peramban pengguna masih menyimpan halaman lama yang menunjuk berkas versi
sebelumnya. Minta pengguna memuat ulang dengan **Ctrl+F5**. Kejadian ini
seharusnya jarang, karena `index.html` sudah disetel agar tidak disimpan
peramban.

### 9.5 PDF atau Excel gagal dibentuk

Pembuatan berkas berlangsung **di peramban pengguna**, bukan di server. Periksa:

- peramban pengguna cukup baru;
- unduhan tidak diblokir;
- tidak ada pengaya peramban yang menghalangi.

Bila galatnya menyebut `unsafe-eval`, berarti kebijakan keamanan konten
(_Content-Security-Policy_) di `server/node-build.ts` telah diubah. Pustaka
pembuat PDF dan Excel memerlukan `'unsafe-eval'` dan `'wasm-unsafe-eval'`, dan
keduanya memang sengaja diizinkan di sana.

### 9.6 Pengguna melaporkan angka yang keliru

Sebelum mencurigai kerusakan program, periksa dulu tiga hal ini — ketiganya
adalah perilaku yang memang dirancang demikian:

| Laporan | Kemungkinan bukan kerusakan |
| --- | --- |
| "Honor mitra ini kelihatan dobel" | Honor dijumlahkan dari **seluruh tim**, bukan hanya tim pelapor |
| "Progres mitra 100 % padahal belum kerja" | Status pertama terisi sendiri sebesar beban kerja; yang dihitung sebagai progres adalah status sesudahnya |
| "Kegiatan hilang dari dasbor" | Kemungkinan sudah diarsipkan. Periksa di riwayat kegiatan |

Bila ternyata benar keliru, bukalah **riwayat kegiatan** untuk mengetahui siapa
yang terakhir mengubah data tersebut dan kapan.

---

## 10. Keamanan

### 10.1 Yang sudah ada di dalam sistem

| Perlindungan | Bentuknya |
| --- | --- |
| Kata sandi | Disimpan tersandi dengan bcrypt, panjang 8–72 karakter, tidak boleh sama dengan nama pengguna |
| Sesi | Token bertanda tangan HMAC-SHA256, berlaku 12 jam |
| Pencabutan sesi | Mengganti kata sandi menaikkan nomor versi token sehingga seluruh sesi lama gugur |
| Pembatasan percobaan masuk | 10 percobaan per akun per alamat tiap 15 menit, dan 100 percobaan per alamat |
| Otorisasi | Berlapis: menurut peran, dan menurut kepemilikan data. Ditegakkan di sisi server |
| Kebijakan konten | _Content-Security-Policy_ menolak skrip sisipan dan skrip dari luar |
| Keutuhan data | Kunci asing, kunci unik, transaksi, dan nomor versi kegiatan |

### 10.2 Yang menjadi tanggung jawab pengelola

- **Jangan membuka aplikasi ke internet umum.** Pembatasan pada jaringan BPS dan
  VPN adalah lapisan pertahanan pertama. Sistem ini memang dirancang dengan
  anggapan tersebut.
- **Jaga `SESSION_SECRET`.** Siapa pun yang mengetahuinya dapat membuat token
  palsu dan masuk sebagai siapa saja. Bila nilainya pernah bocor, gantilah
  segera; akibatnya hanya seluruh pengguna perlu masuk kembali.
- **Berikan peran Admin sesedikit mungkin.** Hanya peran Admin yang dapat
  menghapus data dan mengubah peran orang lain.
- **Nonaktifkan akun pegawai yang pindah atau pensiun.**
- **Gunakan HTTPS.** Pastikan sertifikatnya diperbarui sebelum kedaluwarsa.

### 10.3 Yang bukan celah, meskipun terlihat seperti celah

Agar tidak dilaporkan berulang kali sebagai temuan:

- **Seluruh pegawai yang sudah masuk dapat melihat honor semua mitra**, juga
  alamat dan nomor telepon mitra. Ini disengaja, karena data tersebut memang
  dipakai bersama dalam pekerjaan sehari-hari.
- **Peringatan batas SBML tidak menolak penyimpanan**, hanya meminta konfirmasi.
  Ada keadaan yang memang harus dilewatkan dengan sepengetahuan Tim Keuangan.
- **Nomor surat yang dibatalkan tidak dipakai ulang.** Ini memang dikehendaki,
  agar penomoran dapat ditelusuri.

---

## 11. Pengembangan Lanjutan

### 11.1 Menyiapkan komputer pengembang

```
pnpm install
cp .env.example .env      # lalu isi nilainya
pnpm dev                  # terbuka di http://localhost:8080
```

Pada komputer pengembang, basis datanya biasanya XAMPP: host `localhost`,
pengguna `root`, kata sandi kosong, port `3307`.

### 11.2 Aturan yang sebaiknya dipertahankan

1. **Jalankan `pnpm test` sebelum setiap perubahan dipasang.** Saat pedoman ini
   ditulis jumlahnya 608 pengujian dalam 66 berkas, dan seluruhnya selesai dalam
   sekitar 50 detik. Seluruhnya harus lulus.
2. **Aturan hak akses ditulis di `shared/`**, agar layar dan server memakai
   aturan yang sama persis. Aturan yang ditulis dua kali cepat atau lambat akan
   berbeda.
3. **Setiap pembatasan hak harus ditegakkan di server**, bukan sekadar
   disembunyikan dari layar.
4. **Setiap keputusan yang tidak biasa diberi komentar beserta alasannya.** Kode
   yang ada sudah mengikuti pola ini; teruskan, karena alasan itulah yang paling
   cepat terlupakan.
5. **Folder `netlify/`, berkas `netlify.toml`, dan dependensi `serverless-http`
   sengaja dipertahankan.** Jangan dihapus saat merapikan kode.

### 11.3 Menyambungkan FASIH

Titik sambungnya sudah disiapkan dan terpusat di satu tempat. Langkah-langkahnya
ada di `docs/integrasi-fasih.md`. Selama `FASIH_BASE_URL` dan `FASIH_TOKEN`
dikosongkan, seluruh kegiatan memakai progres yang diisi PML secara manual, dan
mengosongkannya kembali akan mengembalikan keadaan semula tanpa perlu menyunting
kode.

---

## 12. Serah Terima

Yang harus diterima pengelola baru:

- [ ] Akses repositori kode
- [ ] Akses cPanel beserta haknya
- [ ] Kata sandi basis data
- [ ] Nilai `SESSION_SECRET` yang sedang dipakai
- [ ] Akun Admin pada aplikasi
- [ ] Cadangan basis data terbaru
- [ ] Berkas `.env` yang sedang dipakai
- [ ] Berkas ini dan `docs/PEDOMAN-PENGGUNAAN.md`
- [ ] Penjelasan lisan mengenai perilaku yang disebut pada bagian 9.6 dan 10.3

Catatlah nama dan kontak pengelola yang sedang bertanggung jawab di tabel
berikut, dan perbarui setiap kali berganti.

| Peran | Nama | Kontak | Sejak |
| --- | --- | --- | --- |
| Pengelola sistem | | | |
| Cadangan pengelola | | | |
| Penanggung jawab data mitra | | | |
| Penanggung jawab keuangan | | | |
