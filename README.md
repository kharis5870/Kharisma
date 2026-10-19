# SIKAMI (Kharisma)

Sistem Informasi Kegiatan dan Mitra untuk administrasi dan pemantauan kegiatan mitra statistik di BPS Kabupaten Bengkulu Selatan. "Kharisma" adalah nama kerja selama pengembangan, sebelum nama SIKAMI ditetapkan.

## Identitas

|                  |                                                      |
| ---------------- | ---------------------------------------------------- |
| Nama aplikasi    | SIKAMI (Sistem Informasi Kegiatan dan Mitra)         |
| Nama kerja       | Kharisma                                             |
| Pengembang       | Reykhan Kharis Alexandro Batubara (NIM 222212844)    |
| Program studi    | D-IV Komputasi Statistik, Politeknik Statistika STIS |
| Dosen pembimbing | Avi Rudianita Widya, SST., M.Si.                     |
| Instansi mitra   | BPS Kabupaten Bengkulu Selatan                       |
| Konteks          | Proyek magang dan skripsi                            |
| Antarmuka        | React 18, TypeScript, Vite, Tailwind CSS             |
| Peladen          | Express.js (Node.js), RESTful API                    |
| Basis data       | MySQL 8 (skema 18 tabel)                             |
| Pengelola paket  | pnpm                                                 |
| Pengujian        | Vitest                                               |
| Alamat penerapan | Sub-direktori `/kharisma`; API di `/kharisma/api`    |

## Struktur File

```
Kharisma
├── AGENTS.md                      # Panduan untuk agen pengodean AI
├── HASIL-PENGUJIAN-UNIT.txt       # Catatan hasil pengujian unit
├── README.md                      # Identitas dan struktur file (berkas ini)
├── client/                        # Sisi antarmuka (React + TypeScript)
│   ├── App.tsx                    # Komponen utama dan perutean halaman
│   ├── components/                # Komponen antarmuka yang dipakai ulang
│   ├── contexts/                  # React context (state lintas komponen)
│   ├── global.css                 # Gaya global dan token Tailwind
│   ├── hooks/                     # Custom hook
│   ├── lib/                       # Fungsi bantu sisi klien
│   ├── pages/                     # Halaman aplikasi
│   ├── stores/                    # Penyimpanan state
│   └── vite-env.d.ts              # Deklarasi tipe Vite
├── components.json                # Konfigurasi komponen shadcn/ui
├── db/                            # Basis data
│   ├── data-contoh-uji-coba.sql   # Data contoh untuk uji coba
│   ├── migrations/                # Migrasi perubahan skema
│   └── skema-dasar-18-tabel.sql   # Skema dasar 18 tabel
├── docs/                          # Dokumentasi proyek
├── eslint.config.mjs              # Konfigurasi ESLint
├── index.html                     # Berkas HTML utama SPA
├── netlify/
│   └── functions/                 # Fungsi serverless untuk Netlify
├── netlify.toml                   # Konfigurasi penerapan Netlify
├── out/
│   └── docs/                      # Keluaran dokumentasi
├── package.json                   # Dependensi dan skrip proyek
├── pnpm-lock.yaml                 # Kunci versi dependensi (pnpm)
├── postcss.config.mjs             # Konfigurasi PostCSS
├── public/                        # Aset statis
│   ├── LOGO FULL.jpg
│   ├── LOGO K.jpg
│   ├── favicon.ico
│   ├── fonts/
│   ├── logo-k.png
│   ├── logo-sikami.png
│   ├── placeholder.svg
│   └── robots.txt
├── server/                        # Sisi peladen (Express + Node.js)
│   ├── auth/                      # Otentikasi dan otorisasi (token, peran)
│   ├── db.ts                      # Koneksi dan kumpulan koneksi MySQL
│   ├── index.ts                   # Titik masuk peladen dan pendaftaran rute
│   ├── integrasi/                 # Sambungan ke sistem lain (mis. progres FASIH)
│   ├── node-build.ts              # Titik masuk build produksi
│   ├── pengirimanProduksi.spec.ts # Pengujian pengiriman ke produksi
│   ├── routes/                    # Rute RESTful API
│   └── services/                  # Lapisan layanan (honor, SBML, penomoran, penilaian, notifikasi)
├── shared/                        # Kode bersama klien dan peladen
│   ├── api.ts                     # Kontrak dan tipe API
│   ├── aturUlangNomor.ts          # Pengaturan ulang nomor surat
│   ├── aturanPassword.ts          # Aturan kata sandi
│   ├── hakKegiatan.ts             # Hak akses atas kegiatan
│   ├── imporAlokasi.ts            # Impor alokasi dari Excel
│   ├── imporMitra.ts              # Impor daftar mitra dari Excel
│   ├── ketuaTim.ts                # Aturan kepengurusan Ketua Tim
│   ├── mutuPenilaian.ts           # Aturan penilaian dan peringkat
│   ├── nomorAwal.ts               # Penentuan nomor awal surat
│   ├── nomorSurat.ts              # Format nomor surat
│   ├── pembebananHonor.ts         # Pembagian honor per bulan
│   ├── penomoranSurat.ts          # Penomoran otomatis SPK dan BAST
│   ├── pesanGalatSql.ts           # Pemetaan galat SQL ke pesan pengguna
│   ├── tautanDokumen.ts           # Validasi tautan dokumen
│   └── terapkanImporMitra.ts      # Penerapan hasil impor mitra
├── tailwind.config.ts             # Konfigurasi Tailwind CSS
├── tsconfig.json                  # Konfigurasi TypeScript
├── vite.config.server.ts          # Konfigurasi build peladen
└── vite.config.ts                 # Konfigurasi build dan server pengembangan klien
```
