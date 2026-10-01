# Panduan Menjalankan Uji Kinerja Google Lighthouse

Panduan ini melengkapi subbab **5.2.3.2 Kecepatan Tampilan (Google Lighthouse)**
pada draf Bab V. Isinya cara menjalankan pengukurannya sampai angkanya siap
disalin ke tabel.

---

## 1. Apa itu Lighthouse dan di mana letaknya

Lighthouse adalah alat pengukur kecepatan halaman web yang sudah ikut terpasang
di Google Chrome dan Microsoft Edge. Tidak perlu memasang apa pun.

Cara membukanya:

1. Buka halaman yang akan diukur di Chrome.
2. Tekan **F12** (atau Ctrl+Shift+I) untuk membuka DevTools.
3. Pilih tab **Lighthouse**. Bila tabnya tidak terlihat, klik tanda **»** di
   deretan tab.

---

## 2. Aplikasi harus dijalankan sebagai hasil bangunan produksi

Ini syarat yang tidak bisa ditawar, dan alasannya ada di dalam kode:

- `server/index.ts` hanya memasang kompresi gzip/brotli bila berjalan dalam mode
  produksi. Server pengembangan (`pnpm dev`) mengirim berkas mentah tanpa
  kompresi.
- `pnpm dev` menyajikan modul satu per satu lewat Vite dan menyertakan perkakas
  pengembangan. Berkasnya bisa berlipat-lipat lebih besar daripada hasil
  `pnpm build`.

Mengukur `pnpm dev` akan menghasilkan skor yang jauh lebih buruk daripada yang
sebenarnya dialami pengguna, dan angka itu tidak mewakili apa pun.

### Menjalankan hasil bangunan di komputer sendiri

```bash
pnpm build     # membangun klien dan server
pnpm start     # menjalankan dist/server/node-build.cjs
```

Setelah itu aplikasi terbuka di **http://localhost:3000/kharisma** (bukan
`localhost:3000` saja — aplikasi dipasang pada sub-jalur `/kharisma`, lihat
`server/node-build.ts`).

---

## 3. Pengaturan Lighthouse yang harus diubah

Sebelum menekan tombol **Analyze page load**, ada tiga pengaturan yang
menentukan apakah hasilnya berguna atau sampah.

### a. Categories: cukup centang **Performance**

Matikan Accessibility, Best Practices, dan SEO. Tabel di Bab V hanya melaporkan
skor kinerja dan lima metriknya. Mencentang semuanya membuat pengukuran tiga
kali lebih lama tanpa menambah satu angka pun ke tabel.

### b. Device: pilih **Desktop**, bukan Mobile

Lighthouse memakai **Mobile** sebagai pilihan bawaan, yang memperlambat CPU
empat kali dan meniru jaringan 4G lambat. Sistem ini adalah aplikasi kerja
kantor yang dipakai dari komputer meja lewat jaringan BPS, jadi mode **Desktop**
yang mewakili keadaan nyata. Pilihan mode ini WAJIB ditulis di Bab V, karena
angka Mobile dan Desktop untuk halaman yang sama bisa berbeda puluhan poin.

### c. Kotak **Clear storage** WAJIB DIKOSONGKAN

Ini kesalahan yang paling sering terjadi dan paling sulit disadari.

**Di mana kotaknya.** Panel Lighthouse hanya menampilkan Mode, Device, dan
Categories di muka. Pilihan lainnya bersembunyi di balik **ikon gerigi (⚙)** di
bagian atas panel — klik itu dulu, baru muncul *Clear storage*, *Enable JS
sampling*, dan *Throttling method*. Kotak ini juga hanya tampil bila **Mode**-nya
**Navigation**; pada mode Timespan dan Snapshot ia tidak berlaku sehingga
disembunyikan. Letak persisnya berpindah-pindah antar-versi Chrome, jadi kalau
tidak ketemu, pakai cara memeriksa di bawah.

**Mengapa penting.** Token sesi login disimpan di `localStorage` (lihat
`client/lib/tokenSesi.ts`). Bila **Clear storage** dicentang — dan itu keadaan
bawaannya — Lighthouse menghapus `localStorage` sebelum memuat halaman, sehingga
tokennya hilang, `ProtectedRoute` melempar ke halaman login, dan **yang terukur
adalah halaman Login**, bukan halaman yang Anda maksud.

**Cara memeriksa tanpa bergantung menunya.** Setelah laporan keluar, lihat
**alamat yang tertulis di kepala laporan** dan **deretan tangkapan layar
(_filmstrip_)** di bagian atas laporan. Kalau yang tampak formulir login padahal
Anda mengukur Dasbor, penyimpanannya terhapus dan pengukuran itu harus diulang.
Pemeriksaan ini berlaku di semua versi Chrome. Tanda lain: skor semua halaman
mirip dan tinggi.

Jadi urutannya: **login dulu di tab itu**, lalu buka halaman yang mau diukur,
baru jalankan Lighthouse dengan **Clear storage** kosong.

**Konsekuensi yang harus disebut di Bab V:** karena penyimpanan tidak
dikosongkan, cache peramban dalam keadaan hangat saat pengukuran. Tulis apa
adanya, misalnya "pengukuran dilakukan pada sesi yang sudah aktif sehingga
penyimpanan peramban tidak dikosongkan". Itu keadaan yang justru mewakili
pemakaian sehari-hari, karena pegawai membuka aplikasi berkali-kali dalam sehari.

Pengecualian: khusus halaman Masuk, kotak ini justru boleh dicentang, karena
halaman itu memang dibuka orang yang belum punya sesi — sekaligus memberi satu
angka dengan cache benar-benar kosong.

---

## 4. Urutan kerja untuk satu halaman

1. Buka Chrome dalam **jendela Incognito** dan pasang satu tab saja. Ekstensi
   peramban menyuntikkan skrip ke halaman dan ikut terhitung sebagai beban
   halaman; Incognito mematikan ekstensi secara bawaan.
2. Login ke aplikasi memakai akun yang berhak membuka halaman itu.
3. Arahkan ke halaman yang diukur (daftar alamatnya di bagian 5).
4. Buka DevTools → tab **Lighthouse**.
5. Pastikan: Mode **Navigation**, Device **Desktop**, Categories hanya
   **Performance**, **Clear storage** kosong.
6. Klik **Analyze page load**. Tunggu sampai laporannya keluar (15–40 detik).
7. Catat enam angka: **Performance score**, **FCP**, **LCP**, **TBT**, **CLS**,
   **Speed Index**. Skor besar ada di lingkaran atas; kelima metriknya ada di
   blok **Metrics** di bawahnya.
8. Ulangi langkah 6–7 **tiga kali** untuk halaman yang sama, lalu tulis
   **nilai tengah (median)** dari tiga hasil itu ke tabel — bukan rata-ratanya,
   dan bukan yang terbaik. Median lebih tahan terhadap satu pengukuran
   yang kebetulan terganggu.
9. Simpan laporannya: ikon titik tiga di kanan atas panel Lighthouse →
   **Save as HTML**. Berkas ini bukti pengukuran dan bisa masuk lampiran.

Jangan menjalankan hal lain di komputer saat mengukur. Pemutar video, pencadangan
awan, atau pemindaian antivirus yang berjalan bersamaan akan menaikkan TBT secara
mencolok.

---

## 5. Alamat tujuh halaman pada tabel Bab V

Ganti `<akar>` dengan `http://localhost:3000/kharisma` (uji lokal) atau
`https://<domain-bps>/kharisma` (uji di cPanel).

| Halaman pada tabel | Alamat                         | Peran yang dipakai untuk login |
| ------------------ | ------------------------------ | ------------------------------ |
| Halaman Masuk      | `<akar>/login`                 | — (belum login)                |
| Dasbor Monitoring  | `<akar>/dashboard`             | Ketua Tim atau Admin           |
| Input Kegiatan     | `<akar>/input-kegiatan`        | Ketua Tim                      |
| Manajemen Honor    | `<akar>/manajemen-honor`       | Tim Keuangan (supervisor)      |
| Daftar PPL         | `<akar>/daftar-ppl`            | Admin                          |
| Generate Surat     | `<akar>/generate-kontrak`      | Tim Keuangan (supervisor)      |
| Riwayat Penyuratan | `<akar>/riwayat-surat`         | Tim Keuangan (supervisor)      |

Halaman-halaman ini menampilkan data, jadi **basis datanya harus terisi** saat
diukur. Dasbor dengan nol kegiatan tidak menggambar delapan grafik, dan skornya
akan tinggi secara menyesatkan. Pakai `db/data-contoh-uji-coba.sql` atau salinan
data asli, dan sebutkan di Bab V berapa banyak kegiatan dan mitra yang ada saat
pengukuran.

---

## 6. Menulis lingkungan pengujian di Bab V

Angka Lighthouse tidak berarti tanpa keterangan lingkungannya, karena ia
bergantung pada CPU dan jaringan. Sertakan tabel singkat seperti ini:

| Butir              | Isi                                                      |
| ------------------ | -------------------------------------------------------- |
| Alat               | Google Lighthouse versi … (bawaan Chrome versi …)         |
| Mode perangkat     | Desktop                                                  |
| Kategori           | Performance                                              |
| Komputer penguji   | Prosesor …, RAM … GB, sistem operasi …                    |
| Sumber yang diukur | Hasil `pnpm build` … / alamat cPanel …                    |
| Jaringan           | …                                                        |
| Isi basis data     | … kegiatan, … mitra, … surat                             |
| Banyak pengulangan | 3 kali per halaman, dilaporkan nilai tengahnya           |

---

## 7. Kesalahan yang membuat hasil harus diulang

| Gejala                                                            | Penyebab yang paling mungkin                                     |
| ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| Semua halaman berskor mirip dan tinggi                            | **Clear storage** tercentang, jadi yang terukur halaman Login    |
| Kelima metrik bertuliskan **Error! … (NO_FCP)**                   | Jendela Chrome tidak di depan saat pengukuran — lihat bagian 7.1 |
| Skor jauh lebih rendah daripada dugaan, TBT ratusan milidetik     | Masih memakai `pnpm dev`, atau ada ekstensi peramban yang aktif  |
| Skor naik-turun jauh antar-pengulangan                            | Ada proses lain yang berat berjalan bersamaan                    |
| LCP besar padahal halaman terasa cepat                            | Diukur lewat VPN dari luar kantor; sebutkan atau ukur dari LAN   |
| Dasbor berskor hampir sempurna                                    | Basis datanya kosong, grafiknya tidak tergambar                  |

### 7.1 Galat NO_FCP: "The page did not paint any content"

Artinya Lighthouse tidak melihat satu piksel pun tergambar, jadi kelima metriknya
tidak punya titik awal untuk dihitung. Ada dua kemungkinan penyebab, dan
keduanya dibedakan dengan satu pemeriksaan sederhana: **buka halaman itu biasa
saja tanpa Lighthouse, dan lihat apakah isinya muncul.**

**Bila halamannya muncul normal** — ini penyebab yang jauh lebih sering, dan
persis seperti bunyi pesannya. Chrome tidak menggambar apa pun pada jendela yang
tidak sedang di depan, jadi Lighthouse mengukur halaman yang secara teknis tidak
pernah tampil. Pemicunya:

- Jendela Chrome diperkecil (_minimize_), atau tertutup jendela aplikasi lain.
- Berpindah ke aplikasi lain selama 15–40 detik pengukuran berjalan.
- DevTools dilepas menjadi jendela terpisah (_undock_), lalu jendela DevTools itu
  yang di depan sedangkan jendela halamannya di belakang.
- Halaman berada di monitor kedua yang mati atau tertidur.
- Dijalankan lewat Remote Desktop, atau layar masuk mode tidur di tengah jalan.

Perbaikannya: dok DevTools di **bawah atau samping** (jangan jendela terpisah)
supaya halaman dan panel tampil di satu jendela, pastikan jendelanya tidak
diperkecil, matikan mode tidur layar, tekan **Analyze page load**, lalu **jangan
sentuh apa pun** sampai laporannya keluar.

**Bila halamannya memang kosong putih** — barulah ini masalah aplikasi. Buka tab
**Console** di DevTools dan baca galat merahnya, lalu tab **Network** untuk
melihat berkas mana yang gagal diminta. Penyebab yang masuk akal di sini: berkas
JS di `dist/spa/assets/` tidak tersaji karena `pnpm build` belum dijalankan ulang
sesudah kode berubah, atau alamatnya salah — ingat aplikasinya ada di
`/kharisma`, bukan di akar.

### 7.2 Peringatan CSP soal font di Console

Pesan seperti:

```
Loading the font '<URL>' violates the following Content Security Policy
directive: "font-src 'self' data:". The action has been blocked.
```

**Bukan masalah aplikasi, dan bukan penyebab NO_FCP.** Font yang gagal dimuat
hanya membuat tulisan memakai font pengganti; ia tidak pernah membuat halaman
gagal tergambar.

Yang perlu diketahui: halaman hasil build **tidak memuat satu pun berkas dari
luar**. Satu-satunya rujukan di `dist/spa/index.html` adalah favicon dan CSS
miliknya sendiri, dan CSS itu hanya memakai font sistem (`ui-sans-serif`,
`system-ui`). Keempat berkas font Bookman Old Style untuk PDF surat pun dilayani
dari `public/fonts/`, yaitu asal yang sama, sehingga diizinkan `font-src 'self'`.

Jadi URL font yang diblokir itu datang dari **ekstensi peramban** yang menyisipkan
gaya ke halaman. Dua kesimpulannya:

1. CSP di `server/node-build.ts` bekerja sebagaimana dirancang — ini justru bukti
   baik, dan boleh disebut di Bab V sebagai catatan pengujian keamanan.
2. Anda belum memakai jendela Incognito. Pakailah, karena ekstensi yang sama juga
   menyuntikkan skrip yang ikut terhitung sebagai beban halaman dan mengacaukan
   angka TBT.

---

## 7.3 Warna di panel Lighthouse berbeda dengan tabel ambang di Bab V

Contoh nyata: LCP 1,5 detik dan Speed Index 1,5 detik diwarnai **oranye** oleh
panel Lighthouse mode Desktop, padahal menurut tabel "Kategori Penilaian
Lighthouse" pada subbab 5.2.3.2 keduanya masuk kategori **Baik** (ambangnya
≤ 2,5 detik dan ≤ 3,4 detik).

Keduanya tidak salah, sumbernya yang berbeda. Tabel di Bab V memakai ambang
_Core Web Vitals_ terbitan Google, sedangkan pewarnaan panel memakai kurva
penilaian internal Lighthouse yang untuk mode Desktop memang jauh lebih ketat
(LCP hijau baru di bawah ±1,2 detik).

Pilih satu rujukan dan konsisten. Saran: **pertahankan tabel ambang yang sudah
ada** karena itu ambang resmi yang mudah disitasi, lalu **salin angkanya saja**
dari panel — jangan menyalin warnanya. Kategori Baik/Perlu Perbaikan/Buruk
ditentukan sendiri dari tabel ambang Anda. Kalau warna panel ikut masuk ke
lampiran, siapkan jawaban mengapa angka yang disebut "Baik" tampak oranye di
tangkapan layar.

Sebagai pegangan, bobot skor kinerja Lighthouse tidak rata:

| Metrik                   | Bobot |
| ------------------------ | ----- |
| Total Blocking Time      | 30%   |
| Largest Contentful Paint | 25%   |
| Cumulative Layout Shift  | 25%   |
| First Contentful Paint   | 10%   |
| Speed Index              | 10%   |

TBT berbobot terbesar dan **satu-satunya yang murni bergantung pada CPU**, yaitu
lama utas utama sibuk sehingga halaman tidak menanggapi klik. Karena itu aplikasi
berat yang terbuka bersamaan — VSCode, WhatsApp Desktop, Word, banyak tab — paling
terasa merusak metrik ini, dan pengukuran dalam keadaan begitu tidak boleh dipakai.

---

## 8. Catatan tentang KNF-03

Kalimat penutup subbab 5.2.3.2 pada draf menyimpulkan bahwa hasil Lighthouse
memenuhi KNF-03, yaitu perpindahan halaman tanpa memuat ulang seluruh halaman
dan pemuatan pustaka besar hanya saat dibutuhkan. Perlu disadari bahwa
Lighthouse mengukur **pemuatan pertama** sebuah halaman, bukan perpindahan
antar-halaman sesudahnya. Jadi untuk bagian KNF-03 yang berbicara tentang
perpindahan halaman, buktinya bukan skor Lighthouse, melainkan:

- **Tab Network di DevTools.** Pindah dari Dasbor ke Manajemen Honor, lalu
  perhatikan bahwa yang diminta hanya berkas JSON dari `/api/…`, bukan `index.html`
  beserta seluruh berkas JS dan CSS. Itulah bukti halaman tidak dimuat ulang.
- **Pustaka besar yang dimuat saat dibutuhkan.** ExcelJS diimpor secara dinamis
  (`await import("exceljs")` di `client/lib/bacaBerkasMitra.ts`), jadi berkasnya
  baru diminta ketika pengguna benar-benar mengimpor atau mengekspor. Di tab
  Network, berkas itu tidak muncul saat halaman dibuka, dan baru muncul setelah
  tombol impor ditekan.

Kedua pengamatan itu bisa direkam sebagai tangkapan layar dan dijadikan lampiran,
lebih kuat daripada menyandarkan KNF-03 hanya pada satu angka skor.

---

## 9. Catatan pengujian: CLS halaman Riwayat Penyuratan

Bagian ini merekam satu temuan pengujian kinerja beserta penelusuran dan
perbaikannya, untuk dipakai sebagai contoh nyata _feedback loop_ pada metode
Modified Waterfall di Bab III dan Bab V.

### Temuan

Dari sepuluh halaman yang diukur, seluruh metrik memenuhi kategori Baik kecuali
_Cumulative Layout Shift_ halaman Riwayat Penyuratan. Metrik lain halaman ini
justru bagus (LCP 0,8–0,9 detik; TBT 0–30 ms; Speed Index 0,7–0,8 detik),
sehingga penurunan skornya sepenuhnya berasal dari CLS, yang berbobot 25% dalam
penilaian Lighthouse.

### Pengukuran sebelum perbaikan

| Pengukuran | CLS   | Skor Kinerja | Kategori CLS    |
| ---------- | ----- | ------------ | --------------- |
| Ke-1       | 0,142 | 94           | Perlu Perbaikan |
| Ke-2       | 0,325 | —            | Buruk           |

Kedua angka ini diperoleh dari **kode yang sama persis** (nama bundel
`RiwayatSurat-C-bMBaLS.js` pada kedua pengukuran). Selisih sebesar itu
menunjukkan CLS halaman ini sangat peka terhadap waktu datangnya data, sehingga
**satu kali pengukuran tidak boleh dipakai**; ambil nilai tengah dari tiga kali
pengukuran, baik untuk angka sebelum maupun sesudah perbaikan.

### Penyebab

Audit **"Avoid large layout shifts"** pada laporan Lighthouse menunjuk satu
elemen saja, yaitu `<div class="overflow-x-auto">` pembungkus tabel riwayat,
dengan sumbangan sebesar seluruh nilai CLS.

Yang perlu dipahami: elemen yang **baru lahir** tidak dihitung bergeser; yang
dihitung adalah elemen yang **terdorong** olehnya. Jadi temuan ini berarti ada
sesuatu yang muncul di ATAS tabel dan mendorongnya turun — bukan isi tabel yang
bertambah.

Pelakunya adalah paragraf keterangan nomor kosong, yang sebelumnya hanya
dirender bila `data.celah` berisi, yaitu baru sesudah data satu tahun diterima.
Paragraf dua baris itu mendorong seluruh wilayah tabel — yang mengisi hampir
seluruh layar — turun sekitar 48 piksel.

Percobaan perbaikan pertama menyasar isi tabel (baris kerangka dan penguncian
tinggi minimum) dan hanya menurunkan CLS dari 0,142 menjadi 0,122. Hasil itu
yang mengarahkan penelusuran ke luar tabel.

### Perbaikan yang diterapkan

Paragraf keterangan dijadikan **selalu dirender dengan tinggi dikunci dua baris**
(`min-h-[2rem]`), dengan isi yang menyesuaikan keadaan: sedang memeriksa, ada
celah nomor, atau tidak ada celah. Tepi atas tabel karena itu tidak pernah
berpindah. Keadaan "tidak ada celah" pun ikut terjawab, yang sebelumnya
didiamkan.

Berkas: `client/pages/RiwayatSurat.tsx`.

### Pengukuran sesudah perbaikan

| Pengukuran | CLS | Skor Kinerja |
| ---------- | --- | ------------ |
| Ke-1       | …   | …            |
| Ke-2       | …   | …            |
| Ke-3       | …   | …            |
| **Median** | …   | …            |
