# Hasil Konversi ke Word

Berkas `.docx` di folder ini dibuat otomatis dari draf markdown memakai Pandoc,
supaya seluruh tabel (termasuk rincian struktur tabel ERD dan tabel pengujian di
Bab V) langsung menjadi tabel Word asli tanpa disalin satu per satu.

**Bukan pengganti buku jadi** — ini bahan mentah. Tetap perlu:
- Menerapkan Styles templat STIS (Judul Bab, Isi, Judul Tabel, dsb).
- Menghapus bagian instruksi yang ditandai bukan untuk buku (mis. `Bab5-Evaluasi-PANDUAN-KERJA.docx`
  seluruhnya panduan kerja, bukan isi skripsi).
- Menyisipkan gambar (wireframe, activity diagram, arsitektur, ERD, tangkapan layar)
  di tempat yang ditandai `[WIREFRAME ...]` / `[TANGKAPAN LAYAR ...]` / `[GAMBAR]`.
- Memperbaiki style tabel BB-xx/SEC-xx di `Bab5-Evaluasi.docx` yang lebar (banyak
  kolom) — di Word: pilih tabel > Layout > AutoFit > AutoFit Window, atau kecilkan
  ukuran huruf tabel ke 9pt.

## Cara mengonversi ulang setelah draf markdown direvisi

Pandoc portabel sudah ada di:
`C:\Users\Lenovo\AppData\Local\pandoc-portable\pandoc-3.11\pandoc.exe`
(tidak perlu dipasang ulang, tidak butuh hak admin, tidak butuh internet lagi).

Jalankan dari folder `docs/diagram` (Git Bash / terminal VS Code):

```bash
PANDOC="/c/Users/Lenovo/AppData/Local/pandoc-portable/pandoc-3.11/pandoc.exe"
"$PANDOC" draf-revisi-bab4.md -f gfm -o word/Bab4-Rancangan.docx
"$PANDOC" draf-bab4-activity-diagram.md -f gfm -o word/Bab4-ActivityDiagram.docx
"$PANDOC" draf-bab4-rancangan-antarmuka.md -f gfm -o word/Bab4-RancanganAntarmuka.docx
"$PANDOC" draf-revisi-bab1-2-3-5.md -f gfm -o word/Bab1-2-3-Revisi.docx
"$PANDOC" draf-bab5-implementasi.md -f gfm -o word/Bab5-Implementasi.docx
```

`draf-bab5-evaluasi.md` memuat tiga bagian berbeda (isi buku, panduan kerja untuk
Anda, dan lampiran CSUQ) dipisah tanda `---` ganda, jadi dipotong dulu sebelum
dikonversi. Cari baris pemisahnya lalu jalankan:

```bash
grep -n "^# Panduan Pelaksanaan Pengujian\|^# Lampiran: Kuesioner CSUQ" draf-bab5-evaluasi.md
# misal hasilnya baris 390 dan 579 — sesuaikan angka di bawah bila berbeda
sed -n '1,385p'   draf-bab5-evaluasi.md > /tmp/_a.md
sed -n '390,576p' draf-bab5-evaluasi.md > /tmp/_b.md
sed -n '579,647p' draf-bab5-evaluasi.md > /tmp/_c.md
"$PANDOC" /tmp/_a.md -f gfm -o word/Bab5-Evaluasi.docx
"$PANDOC" /tmp/_b.md -f gfm -o word/Bab5-Evaluasi-PANDUAN-KERJA.docx
"$PANDOC" /tmp/_c.md -f gfm -o word/Lampiran-CSUQ.docx
```

## Untuk berkas markdown lain di luar daftar ini

```bash
"$PANDOC" NAMA_BERKAS.md -f gfm -o word/NAMA_HASIL.docx
```

Satu perintah, langsung jadi satu `.docx` utuh dengan semua tabel di dalamnya.
