# Kesiapan Integrasi FASIH

Dokumen ini menjelaskan **bagaimana Kharisma disiapkan agar dapat disambungkan
ke FASIH**, apa yang sudah ada, dan apa yang masih dibutuhkan dari pengelola
FASIH. Ditulis saat FASIH sedang dalam pemeliharaan sehingga spesifikasi API-nya
belum dapat diperiksa.

---

## 1. Mengapa belum tersambung

FASIH sedang dalam pemeliharaan, sehingga tiga hal berikut belum dapat
dipastikan dan **sengaja tidak ditebak**:

1. alamat endpoint yang menyediakan progres pendataan,
2. bentuk data yang dikembalikannya,
3. cara autentikasi yang diminta.

Menuliskan ketiganya berdasarkan dugaan akan menghasilkan kode yang tampak siap
tetapi hampir pasti keliru, dan harus dibongkar ulang begitu FASIH tersedia.
Yang dikerjakan sebagai gantinya adalah menyiapkan **titik sambung**: satu
tempat tertentu di dalam kode yang perlu diisi, sementara seluruh bagian lain
sudah selesai.

## 2. Yang sudah siap di aplikasi

| Sudah ada | Keterangan |
|---|---|
| Penanda kegiatan FASIH | Kolom `kegiatan.isFasih` sudah ada sejak awal dan dapat diisi lewat form kegiatan. Tidak perlu skema baru. |
| Bentuk data baku | `ProgresMitra` di `server/integrasi/sumberProgress.ts` — kontrak yang harus dihasilkan adaptor FASIH. |
| Pemilihan sumber | `pilihSumber()` menentukan FASIH atau manual per kegiatan, sudah diuji otomatis. |
| Konfigurasi | `FASIH_BASE_URL` dan `FASIH_TOKEN` di `.env` (lihat `.env.example`). |
| Endpoint status | `GET /kharisma/api/integrasi/fasih/status` melaporkan tersambung atau belum, beserta langkah yang kurang. |
| Lapisan API | Seluruh modul aplikasi sudah berkomunikasi lewat HTTP API, bukan pemanggilan langsung antar-modul, sehingga sumber data dapat diganti tanpa mengubah antarmuka. |

## 3. Yang dibutuhkan dari pengelola FASIH

Empat pertanyaan yang perlu dijawab sebelum penyambungan dapat dikerjakan:

1. **Endpoint mana** yang menyediakan kemajuan pendataan per petugas
   (bukan agregat per wilayah)?
2. **Autentikasi apa** yang dipakai — kunci API, OAuth, atau akun layanan?
   Apakah aksesnya perlu diajukan lebih dulu?
3. **Bagaimana petugas dikenali** di FASIH? Kharisma memakai `ppl_master.id`
   internal; perlu diketahui padanannya di FASIH (NIK, id petugas, atau
   lainnya). **Ini penentu terbesar** — bila tidak ada padanan yang pasti,
   dibutuhkan satu kolom pemetaan di `ppl_master`.
4. **Sampai tingkat apa angkanya tersedia** — per dokumen/ruta, atau sudah
   diringkas per petugas?

## 4. Pemetaan data

Kharisma menyimpan progres pada `ppl_progress` dengan delapan jenis, terbagi dua
tahap:

| Tahap | Jenis progres | Arti |
|---|---|---|
| Pendataan | `open` | belum dikerjakan |
| | `submit` | sudah dikirim petugas |
| | `diperiksa` | sedang diperiksa PML |
| | `approved` | disetujui PML |
| Pengolahan | `belum_entry` | belum dientri |
| | `sudah_entry` | sudah dientri |
| | `validasi` | sedang divalidasi |
| | `clean` | bersih |

Adaptor FASIH cukup menghasilkan `ProgresMitra[]`:

```ts
{
  pplMasterId: string,               // identitas mitra di Kharisma
  tahap: string,                     // 'listing' | 'pencacahan' | 'pengolahan-analisis'
  nilai: { submit: 12, approved: 8 } // hanya jenis yang relevan
}
```

Bila FASIH memakai istilah berbeda, penerjemahannya dilakukan **di dalam
adaptor** — bukan dengan mengubah enum di database, agar data lama tetap
terbaca.

## 5. Langkah penyambungan

1. Isi `FASIH_BASE_URL` dan `FASIH_TOKEN` di `.env` server.
2. Lengkapi `sumberFasih.ambilProgress()` di
   `server/integrasi/sumberProgress.ts`: panggil endpoint FASIH, terjemahkan
   jawabannya menjadi `ProgresMitra[]`.
3. Bila identitas petugas tidak sepadan, tambahkan kolom pemetaan pada
   `ppl_master` lewat satu migrasi.
4. Periksa `GET /kharisma/api/integrasi/fasih/status` → harus `tersambung: true`.
5. Uji pada satu kegiatan bertanda FASIH lebih dulu, sebelum diberlakukan luas.

**Tidak ada berkas lain yang perlu diubah.** Layar Update Progress, Dashboard,
dan perhitungan honor membaca `ppl_progress` seperti biasa.

## 6. Sifat peralihan

Peralihannya dirancang agar tidak berisiko:

- **Bertahap** — hanya kegiatan bertanda `isFasih` yang memakai FASIH; sisanya
  tetap manual.
- **Aman bila gagal** — selama `FASIH_BASE_URL` atau `FASIH_TOKEN` kosong,
  `pilihSumber()` mengembalikan sumber manual. Memasang integrasi tidak pernah
  menghentikan pekerjaan yang sedang berjalan.
- **Dapat dibatalkan** — mengosongkan kedua nilai di `.env` mengembalikan
  seluruhnya ke pengisian manual, tanpa menyunting kode dan tanpa mengubah
  penanda di tiap kegiatan.

Ketiga sifat itu diuji otomatis di `server/integrasi/sumberProgress.spec.ts`.
