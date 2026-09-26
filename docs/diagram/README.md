# Diagram Bab IV Skripsi

Semua diagram di folder ini ditulis sebagai **kode**, bukan digambar tangan,
supaya isinya selalu bisa dicocokkan dengan aplikasi dan diubah cukup dengan
menyunting teks. Isinya disusun dari kode dan struktur database yang sedang
berjalan (terakhir diselaraskan sampai migrasi `2026-09-24`).

| Berkas                                | Isi                                                                      | Pengganti di buku |
| ------------------------------------- | ------------------------------------------------------------------------ | ----------------- |
| `01-usecase.puml`                     | Use case diagram                                                         | Gambar 8          |
| `02-activity-proses-usulan.puml`      | Alur proses bisnis usulan, versi utuh (terlalu lebar untuk A4)           | -                 |
| `02a`/`02b-proses-usulan-*.puml`      | Alur proses bisnis usulan dipecah dua agar terbaca di A4                 | Gambar 7a, 7b     |
| `03-activity-alokasi-sbm.puml`        | Membuat kegiatan, alokasi mitra, validasi batas SBM                      | baru              |
| `04-activity-input-progres.puml`      | PML menginput progres mitra                                              | baru              |
| `05-activity-verifikasi-dokumen.puml` | Dokumen, verifikasi, tolak, pengingat                                    | baru              |
| `06-activity-surat-spk-bast.puml`     | Pembuatan SPK per bulan dan BAST                                         | baru              |
| `06b-activity-riwayat-surat.puml`     | Surat berubah, perbarui/batalkan surat, rapikan nomor                    | baru              |
| `07-activity-penilaian.puml`          | Penilaian kinerja dan peringkat triwulan                                 | baru              |
| `08-erd.dbml`                         | ERD lengkap 18 tabel (untuk dbdiagram.io)                                | Gambar 9          |
| `09a`–`09d-erd-*.puml`                | ERD yang sama, dipecah 4 bagian (bisa dirender di VS Code)               | Gambar 9          |
| `10-fishbone.drawio`                  | Diagram fishbone (draf, dirapikan manual)                                | Gambar 6          |
| `11-activity-impor-mitra.puml`        | Impor daftar mitra dari SOBAT dan penonaktifan mitra                     | baru              |
| `12-arsitektur-sistem.puml`           | Arsitektur sistem (klien, server, basis data, sistem luar)               | Bab V, baru       |
| `13-proses-bisnis-berjalan.puml`      | Proses bisnis sistem berjalan, versi utuh (terlalu lebar untuk A4)       | -                 |
| `13a`/`13b-proses-berjalan-*.puml`    | Proses bisnis sistem berjalan dipecah dua agar terbaca di A4             | Gambar 5a, 5b     |
| `14-alur-administrasi-mitra.puml`     | Alur administrasi mitra beserta masalahnya, versi ringkas                | Bab I, Gambar 2   |
| `15-wireframe.drawio`                 | 18 halaman wireframe rancangan antarmuka (W-01–W-17)                     | Bab IV, baru      |
| `16-activity-login.puml`              | Activity diagram otentikasi dan penggantian kata sandi                   | Bab IV, baru      |
| `17-activity-arsip-hapus.puml`        | Activity diagram pengarsipan dan penghapusan kegiatan                    | Bab IV, baru      |
| `18-activity-rekap-honor.puml`        | Activity diagram rekap honor mitra                                       | Bab IV, baru      |
| `alat/buat_wireframe.py`              | Pembangkit berkas wireframe di atas (hanya untuk membuat ulang dari nol) | —                 |
| `_gaya.iuml`                          | Gaya bersama semua diagram PlantUML                                      | —                 |
| `draf-revisi-bab4.md`                 | Draf teks revisi KF/KNF, tabel aktor, use case, dan basis data           | —                 |
| `draf-bab4-activity-diagram.md`       | Draf subbab activity diagram (10 diagram beserta narasinya)              | —                 |
| `draf-bab4-rancangan-antarmuka.md`    | Draf subbab rancangan antarmuka (wireframe W-01–W-17)                    | —                 |
| `draf-bab5-implementasi.md`           | Draf Bab V bagian implementasi (penanda tangkapan layar SS-01–SS-36)     | —                 |
| `draf-bab5-evaluasi.md`               | Draf Bab V bagian evaluasi, panduan pengujian, dan kuesioner CSUQ        | —                 |
| `draf-bab5-penerapan-pemeliharaan.md` | Draf Bab V bagian penerapan (deployment) dan pemeliharaan (maintenance)  | —                 |
| `draf-revisi-pustaka.md`              | Konversi 28 sitasi IEEE ke APA 7, rujukan yang perlu ditambah, dan koreksi pustaka | —                 |
| `out/`                                | Hasil ekspor SVG semua diagram PlantUML, siap dimasukkan ke Word         | —                 |

## Melihat dan mengekspor diagram PlantUML (`.puml`)

1. Buka berkas `.puml`, lalu tekan **Alt+D** untuk pratinjau.
2. Untuk mengekspor: klik kanan di editor > **Export Current Diagram**, pilih
   **svg** (disarankan) atau **png**. Hasilnya masuk ke folder `out/`.
3. Di Word: **Insert > Pictures > This Device**, pilih berkas `.svg`. SVG tetap
   tajam saat diperbesar maupun saat dijadikan PDF.

Graphviz **tidak** diperlukan: `_gaya.iuml` memakai mesin tata letak bawaan
PlantUML (`!pragma layout smetana`). Ekstensi _Graphviz Interactive Preview_
hanya untuk berkas `.dot` dan tidak dipakai di sini.

Mengubah warna, huruf, atau ukuran cukup di `_gaya.iuml`; semua diagram ikut
berubah.

## Ukuran gambar dan keterbacaan di A4

Lebar teks A4 dengan batas tepi 4-3-3-3 cm hanya 529 titik pada 96 dpi, sedangkan
huruf diagram berukuran 9 pt. Jadi ukuran huruf di kertas = 9 pt x (529 / lebar
gambar). Patokannya:

- lebar <= 700 titik dan tinggi <= 1150 titik: terbaca pada halaman tegak;
- lebih lebar dari itu: pasang pada halaman lanskap (lebar berguna 896 titik);
- lebih dari 1200 x 700 titik: pecah menjadi dua gambar.

Dua hal yang paling melebarkan kanvas adalah panjang label terpanjang di tiap
lajur dan kotak `note` yang menggantung di samping. Karena itu catatan tidak lagi
dipasang di dalam diagram; isinya ditulis pada narasi di bawah gambar.

## ERD versi dbdiagram.io (`08-erd.dbml`)

1. Buka <https://dbdiagram.io/d>, hapus contoh bawaannya.
2. Tempel seluruh isi `08-erd.dbml`.
3. Geser tabel untuk merapikan tata letak, lalu **Export > PNG** atau **PDF**.

Versi ini memuat **seluruh kolom**, jadi cocok untuk lampiran atau satu gambar
besar. Untuk isi bab, versi PlantUML yang dipecah 4 (`09a`–`09d`) lebih mudah
dibaca di kertas A4.

## Fishbone (`10-fishbone.drawio`)

Buka langsung di VS Code (ekstensi Draw.io Integration). Posisi dan teks bisa
digeser dengan mouse. Ekspor lewat **File > Export** ke PNG/SVG.

## Bila aplikasi berubah lagi

Periksa migrasi baru di `db/migrations/` dan route baru di `server/routes/`.
Kolom baru masuk ke `08-erd.dbml`, `09*-erd-*.puml`, dan tabel rinci di
`draf-revisi-bab4.md`; fitur baru masuk ke `01-usecase.puml` dan, bila alurnya
bercabang, ke activity diagram tersendiri.
