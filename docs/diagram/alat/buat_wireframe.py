# -*- coding: utf-8 -*-
"""
Pembangkit berkas wireframe draw.io untuk subbab Rancangan Antarmuka (Bab IV).

Menghasilkan `docs/diagram/15-wireframe.drawio` berisi satu halaman draw.io untuk
setiap wireframe W-01 sampai W-17. Berkas itu dibuka dengan ekstensi "Draw.io
Integration" di VS Code, lalu tiap halaman diekspor ke PNG/SVG untuk dimasukkan ke
naskah.

Skrip ini hanya dipakai untuk MEMBUAT ULANG dari nol. Setelah berkas .drawio
disunting manual di draw.io, jangan jalankan skrip ini lagi karena akan menimpa
suntingan tersebut.

Pemakaian:
    python alat/buat_wireframe.py                 -> tulis 15-wireframe.drawio
    python alat/buat_wireframe.py --pratinjau DIR -> tambah PNG pratinjau ke DIR
"""

import os
import sys

LEBAR, TINGGI = 1280, 720

# --------------------------------------------------------------------------
# Gaya. Wireframe sengaja abu-abu saja: yang dinilai susunannya, bukan warnanya.
# --------------------------------------------------------------------------
DASAR = "rounded=0;whiteSpace=wrap;html=1;fontFamily=Arial;"

GAYA = {
    "frame":   DASAR + "fillColor=none;strokeColor=#333333;strokeWidth=2;",
    "bar":     DASAR + "fillColor=#F5F5F5;strokeColor=#999999;align=left;spacingLeft=10;fontSize=12;fontColor=#333333;",
    "panel":   DASAR + "fillColor=#FCFCFC;strokeColor=#999999;align=left;verticalAlign=top;spacingLeft=10;spacingTop=8;fontSize=11;fontColor=#333333;",
    "box":     DASAR + "fillColor=#FFFFFF;strokeColor=#999999;fontSize=11;fontColor=#333333;",
    "dash":    DASAR + "fillColor=#FFFFFF;strokeColor=#999999;dashed=1;fontSize=11;fontColor=#777777;",
    "field":   DASAR + "fillColor=#FFFFFF;strokeColor=#B3B3B3;align=left;spacingLeft=8;fontSize=11;fontColor=#8C8C8C;",
    "btn":     DASAR + "rounded=1;fillColor=#E8E8E8;strokeColor=#666666;fontSize=11;fontColor=#333333;",
    "btnp":    DASAR + "rounded=1;fillColor=#C4C4C4;strokeColor=#333333;fontSize=11;fontStyle=1;fontColor=#222222;",
    "tab":     DASAR + "fillColor=#F0F0F0;strokeColor=#999999;fontSize=11;fontColor=#555555;",
    "tabact":  DASAR + "fillColor=#FFFFFF;strokeColor=#333333;fontSize=11;fontStyle=1;fontColor=#222222;",
    "menu":    DASAR + "fillColor=#FFFFFF;strokeColor=#CCCCCC;align=left;spacingLeft=10;fontSize=11;fontColor=#444444;",
    "menuact": DASAR + "fillColor=#DDDDDD;strokeColor=#333333;align=left;spacingLeft=10;fontSize=11;fontStyle=1;fontColor=#222222;",
    "thead":   DASAR + "fillColor=#EDEDED;strokeColor=#999999;align=left;spacingLeft=6;fontSize=10;fontStyle=1;fontColor=#333333;",
    "trow":    DASAR + "fillColor=#FFFFFF;strokeColor=#CCCCCC;align=left;spacingLeft=6;fontSize=10;fontColor=#555555;",
    "chart":   DASAR + "fillColor=#FAFAFA;strokeColor=#999999;dashed=1;fontSize=11;fontColor=#777777;",
    "modal":   DASAR + "fillColor=#FFFFFF;strokeColor=#333333;strokeWidth=2;align=left;verticalAlign=top;spacingLeft=12;spacingTop=10;fontSize=12;fontStyle=1;fontColor=#222222;",
    "overlay": DASAR + "fillColor=#000000;strokeColor=none;opacity=12;",
    "judul":   "text;html=1;fontFamily=Arial;align=left;verticalAlign=middle;fontSize=18;fontStyle=1;fontColor=#222222;",
    "sub":     "text;html=1;fontFamily=Arial;align=left;verticalAlign=middle;fontSize=11;fontColor=#777777;",
    "teks":    "text;html=1;fontFamily=Arial;align=left;verticalAlign=middle;fontSize=11;fontColor=#444444;",
    "kecil":   "text;html=1;fontFamily=Arial;align=left;verticalAlign=middle;fontSize=10;fontColor=#777777;",
    "nomor":   DASAR + "ellipse;fillColor=#333333;strokeColor=#333333;fontSize=11;fontColor=#FFFFFF;fontStyle=1;",
    "catatan": "shape=note;whiteSpace=wrap;html=1;fontFamily=Arial;size=12;fillColor=#FFFFFF;strokeColor=#999999;align=left;verticalAlign=top;fontSize=10;fontColor=#444444;",
}

# Warna untuk pratinjau PIL: (isi, garis, warna teks, ukuran huruf, tebal)
PRATINJAU = {
    "frame":   (None, "#333333", "#333333", 11, False),
    "bar":     ("#F5F5F5", "#999999", "#333333", 11, False),
    "panel":   ("#FCFCFC", "#999999", "#333333", 10, False),
    "box":     ("#FFFFFF", "#999999", "#333333", 10, False),
    "dash":    ("#FFFFFF", "#AAAAAA", "#777777", 10, False),
    "field":   ("#FFFFFF", "#B3B3B3", "#8C8C8C", 10, False),
    "btn":     ("#E8E8E8", "#666666", "#333333", 10, False),
    "btnp":    ("#C4C4C4", "#333333", "#222222", 10, True),
    "tab":     ("#F0F0F0", "#999999", "#555555", 10, False),
    "tabact":  ("#FFFFFF", "#333333", "#222222", 10, True),
    "menu":    ("#FFFFFF", "#CCCCCC", "#444444", 10, False),
    "menuact": ("#DDDDDD", "#333333", "#222222", 10, True),
    "thead":   ("#EDEDED", "#999999", "#333333", 9, True),
    "trow":    ("#FFFFFF", "#CCCCCC", "#555555", 9, False),
    "chart":   ("#FAFAFA", "#AAAAAA", "#777777", 10, False),
    "modal":   ("#FFFFFF", "#333333", "#222222", 11, True),
    "overlay": ("#E5E5E5", None, "#000000", 10, False),
    "judul":   (None, None, "#222222", 16, True),
    "sub":     (None, None, "#777777", 10, False),
    "teks":    (None, None, "#444444", 10, False),
    "kecil":   (None, None, "#777777", 9, False),
    "nomor":   ("#333333", "#333333", "#FFFFFF", 10, True),
    "catatan": ("#FFFFFF", "#999999", "#444444", 9, False),
}

RATA_ATAS = {"panel", "modal"}
RATA_KIRI = {"bar", "panel", "field", "thead", "trow", "menu", "menuact",
             "modal", "judul", "sub", "teks", "kecil", "catatan"}


def lolos(teks):
    return (teks.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;"))


class Halaman:
    """Satu halaman draw.io berisi satu wireframe."""

    def __init__(self, kode, nama):
        self.kode = kode
        self.nama = nama
        self.sel = []

    def tambah(self, jenis, x, y, w, h, teks=""):
        self.sel.append({"jenis": jenis, "x": x, "y": y, "w": w, "h": h, "teks": teks})
        return self.sel[-1]

    # ---------------- bagian yang dipakai berulang ----------------

    def bingkai(self, judul_gambar):
        self.tambah("frame", 0, 0, LEBAR, TINGGI)
        self.tambah("kecil", 0, TINGGI + 8, LEBAR, 20, judul_gambar)

    def kerangka(self, menu_aktif, judul, subjudul="", tanpa_menu=False):
        """Header + bilah sisi + judul halaman. Mengembalikan (x, y) awal isi."""
        self.tambah("bar", 0, 0, LEBAR, 44, "OPTIMA")
        self.tambah("field", 300, 9, 360, 26, "Cari kegiatan, mitra, atau halaman")
        self.tambah("box", 1080, 9, 56, 26, "tema")
        self.tambah("box", 1144, 9, 56, 26, "notif")
        self.tambah("box", 1208, 9, 62, 26, "akun")

        if not tanpa_menu:
            self.tambah("panel", 0, 44, 200, TINGGI - 44, "")
            # Urutan menu mengikuti Sidebar.tsx. "Rekap Penilaian" sengaja tidak ada
            # di sini karena di aplikasi ia dibuka dari halaman Penilaian Mitra.
            menu = ["Dashboard", "Daftar  >", "   Daftar PPL", "   Daftar PML",
                    "Manajemen Honor", "Penilaian Mitra",
                    "Keuangan  >", "   Generate Surat", "   Template Surat",
                    "   Riwayat Penyuratan", "Manajemen Admin"]
            for i, label in enumerate(menu):
                aktif = (i == menu_aktif)
                self.tambah("menuact" if aktif else "menu",
                            10, 60 + i * 32, 180, 26, label)
            self.tambah("btnp", 10, 660, 180, 30, "+ Input Kegiatan")

        self.tambah("judul", 220, 58, 700, 28, judul)
        if subjudul:
            self.tambah("sub", 220, 86, 700, 18, subjudul)
        return 220, 116 if subjudul else 104

    def tab(self, x, y, label_tab, aktif, lebar=None, h=30):
        lebar = lebar or [150] * len(label_tab)
        kx = x
        for i, label in enumerate(label_tab):
            self.tambah("tabact" if i == aktif else "tab", kx, y, lebar[i], h, label)
            kx += lebar[i]
        return y + h

    def tabel(self, x, y, kolom, baris, tinggi_baris=24, tinggi_judul=26):
        """kolom = [(judul, lebar)], baris = [[sel, ...], ...]"""
        kx = x
        for judul, w in kolom:
            self.tambah("thead", kx, y, w, tinggi_judul, judul)
            kx += w
        ky = y + tinggi_judul
        for isi in baris:
            kx = x
            for i, (_, w) in enumerate(kolom):
                self.tambah("trow", kx, ky, w, tinggi_baris, isi[i] if i < len(isi) else "")
                kx += w
            ky += tinggi_baris
        return ky

    def isian(self, x, y, label, lebar_label, lebar_isi, contoh="", h=26):
        self.tambah("teks", x, y, lebar_label, h, label)
        self.tambah("field", x + lebar_label, y, lebar_isi, h, contoh)
        return y + h + 10

    def nomor(self, x, y, angka):
        self.tambah("nomor", x, y, 22, 22, str(angka))


# ==========================================================================
# Definisi tiap wireframe
# ==========================================================================

def w01():
    p = Halaman("W-01", "W-01 Kerangka Umum Tampilan")
    p.bingkai("Gambar W-01. Rancangan Kerangka Umum Tampilan")
    p.kerangka(0, "JUDUL HALAMAN", "Keterangan singkat halaman")
    p.tambah("dash", 220, 120, 1040, 420, "Area isi halaman\n(kartu ringkasan, penyaring, tabel, formulir, atau grafik)")
    p.tambah("bar", 200, 660, 1080, 60, "Footer: BPS Kabupaten Bengkulu Selatan \u2014 2026")

    # penomoran bagian
    p.nomor(210, 300, 1); p.tambah("teks", 236, 300, 200, 22, "Bilah sisi (menu)")
    p.nomor(690, 12, 2); p.tambah("teks", 716, 12, 240, 22, "Bilah atas")
    p.nomor(1230, 128, 3); p.tambah("teks", 1100, 152, 160, 22, "Area isi")
    p.nomor(1230, 668, 4); p.tambah("teks", 1090, 692, 170, 22, "Footer")
    p.tambah("catatan", 860, 560, 400, 84,
             "Jendela sembul (modal) dipakai untuk aksi yang butuh ketelitian, dan pesan singkat (toast) muncul di sudut layar setelah suatu aksi selesai.")
    return p


def w02():
    p = Halaman("W-02", "W-02 Halaman Masuk")
    p.bingkai("Gambar W-02. Rancangan Halaman Masuk")
    p.tambah("panel", 0, 0, 640, TINGGI, "")
    p.tambah("judul", 120, 280, 420, 40, "Kharisma.")
    p.tambah("teks", 120, 324, 420, 40, "Sistem administrasi dan pemantauan kegiatan mitra statistik")
    p.tambah("dash", 120, 380, 400, 180, "ilustrasi / logo BPS")

    p.tambah("box", 760, 200, 420, 320, "")
    p.tambah("judul", 790, 236, 360, 28, "Masuk ke Sistem")
    y = p.isian(790, 290, "Username", 0, 360, "Masukkan username")
    p.tambah("teks", 790, 282, 200, 16, "")
    p.tambah("field", 790, 356, 320, 26, "Masukkan password")
    p.tambah("box", 1118, 356, 32, 26, "lihat")
    p.tambah("teks", 790, 320, 360, 18, "Password")
    p.tambah("kecil", 790, 396, 360, 18, "Pesan kesalahan tampil di sini bila gagal masuk")
    p.tambah("btnp", 790, 424, 360, 34, "Masuk")
    p.tambah("catatan", 760, 552, 420, 96,
             "Pesan kesalahan untuk nama pengguna salah dan kata sandi salah dibuat sama, agar tidak memberi petunjuk kepada penebak akun. Percobaan berulang dibatasi.")
    return p


def w03():
    p = Halaman("W-03", "W-03 Dasbor Monitoring")
    p.bingkai("Gambar W-03. Rancangan Halaman Dasbor Monitoring")
    x, y = p.kerangka(0, "Dashboard Monitoring", "Pantau progres dan kelola semua kegiatan")

    p.tambah("panel", x, y, 1040, 62, "")
    kx = x + 12
    for label, w in [("Cari kegiatan...", 240), ("Tipe Progres v", 150),
                     ("Tahap v", 150), ("Status v", 150), ("Tim v", 150)]:
        p.tambah("field", kx, y + 18, w, 28, label)
        kx += w + 14

    ky = y + 78
    for i, (nama, persen, status) in enumerate(
            [("Susenas Maret 2026", "60%", "Berjalan"),
             ("Sakernas Agustus 2026", "25%", "Warning"),
             ("Podes 2026", "90%", "Selesai")]):
        cx = x + i * 350
        p.tambah("box", cx, ky, 330, 120, "")
        p.tambah("teks", cx + 12, ky + 14, 240, 18, nama)
        p.tambah("kecil", cx + 12, ky + 34, 240, 16, "Ketua Tim: ...")
        p.tambah("dash", cx + 12, ky + 58, 220, 16, "batang kemajuan " + persen)
        p.tambah("box", cx + 244, ky + 12, 74, 22, status)
        p.tambah("btn", cx + 12, ky + 84, 100, 24, "Detail")
        p.tambah("btn", cx + 120, ky + 84, 100, 24, "Dokumen")

    ky += 138
    p.tambah("panel", x, ky, 1040, 150, "Panel Pembaruan Progres Mitra (hanya tampil bagi PML)")
    p.tab(x + 12, ky + 30, ["Listing", "Pencacahan", "Pengolahan"], 1, [120, 120, 120])
    p.tabel(x + 12, ky + 64, [("Nama Mitra", 220), ("Target", 80), ("Open", 100),
                              ("Submit", 100), ("Diperiksa", 100), ("Approved", 100)],
            [["Budi S.", "120", "20", "40", "30", "30"],
             ["Siti A.", "100", "10", "30", "30", "30"]])
    p.tambah("btnp", x + 900, ky + 110, 128, 28, "Simpan Progress")

    ky += 164
    judul_grafik = ["Kegiatan per Status", "Kegiatan per Tim", "Corong Progres Pendataan",
                    "Corong Progres Pengolahan", "Kegiatan Paling Tertinggal",
                    "Antrean Pemeriksaan", "Honor per Tim", "Beban Mitra per PML"]
    for i, judul in enumerate(judul_grafik):
        gx = x + (i % 4) * 262
        gy = ky + (i // 4) * 88
        p.tambah("chart", gx, gy, 246, 76, judul)
    return p


def w04():
    p = Halaman("W-04", "W-04 Input Kegiatan (Info Dasar)")
    p.bingkai("Gambar W-04. Rancangan Halaman Input Kegiatan \u2014 Tab Info Dasar dan Jadwal")
    x, y = p.kerangka(-1, "Input Kegiatan", "Isi data kegiatan, alokasi mitra, dan dokumennya")

    y = p.tab(x, y, ["Info Dasar & Jadwal", "Alokasi PPL", "Dokumen"], 0, [190, 150, 130])
    p.tambah("panel", x, y, 1040, 200, "Informasi Kegiatan")
    yy = y + 40
    yy = p.isian(x + 16, yy, "Nama Kegiatan *", 160, 400, "Contoh: Susenas Maret 2026")
    yy = p.isian(x + 16, yy, "Nama Ketua Tim *", 160, 400, "pilih ketua tim v")
    p.tambah("teks", x + 16, yy, 160, 26, "Deskripsi Kegiatan")
    p.tambah("field", x + 176, yy, 844, 42, "Deskripsikan kegiatan secara singkat...")

    y2 = y + 216
    p.tambah("panel", x, y2, 1040, 234, "Jadwal Kegiatan *")
    p.tambah("box", x + 668, y2 + 8, 180, 24, "[ ] Ada Pengolahan")
    p.tambah("box", x + 856, y2 + 8, 172, 24, "[ ] Ada Diseminasi")
    yy = y2 + 44
    for label in ["Persiapan", "Pengumpulan Data", "Pengolahan & Analisis", "Diseminasi & Evaluasi"]:
        yy = p.isian(x + 16, yy, label, 200, 380, "tgl mulai  \u2014  tgl selesai")
    p.tambah("btn", x + 800, y2 + 250, 100, 30, "Batal")
    p.tambah("btnp", x + 910, y2 + 250, 130, 30, "Simpan Kegiatan")
    return p


def w05():
    p = Halaman("W-05", "W-05 Alokasi Mitra")
    p.bingkai("Gambar W-05. Rancangan Tab Alokasi Mitra dan Pembebanan Honor")
    x, y = p.kerangka(-1, "Input Kegiatan", "Alokasi mitra, PML pengawas, dan honor per tahap")

    y = p.tab(x, y, ["Info Dasar & Jadwal", "Alokasi PPL", "Dokumen"], 1, [190, 150, 130])
    y = p.tab(x, y + 10, ["Listing", "Pencacahan", "Pengolahan"], 1, [130, 130, 130])

    p.tambah("panel", x, y + 10, 1040, 66, "")
    p.isian(x + 16, y + 34, "Periode honor tahap ini", 180, 300, "tgl mulai \u2014 tgl selesai")
    p.tambah("teks", x + 540, y + 34, 110, 26, "Harga satuan")
    p.tambah("field", x + 650, y + 34, 200, 26, "Rp 10.000")

    ky = y + 88
    for i in range(2):
        by = ky + i * 128
        p.tambah("box", x, by, 1040, 118, "")
        p.tambah("teks", x + 14, by + 12, 70, 24, "Mitra %d" % (i + 1))
        p.tambah("field", x + 90, by + 12, 300, 24, "pilih mitra aktif v")
        p.tambah("field", x + 402, by + 12, 220, 24, "pilih PML pengawas v")
        p.tambah("btn", x + 940, by + 12, 86, 24, "hapus")
        p.tambah("teks", x + 14, by + 46, 90, 24, "Beban kerja")
        p.tambah("field", x + 108, by + 46, 90, 24, "120")
        p.tambah("teks", x + 210, by + 46, 300, 24, "Honor: Rp 1.200.000  (terisi otomatis)")
        p.tambah("teks", x + 14, by + 80, 130, 24, "Pembebanan Honor")
        p.tambah("field", x + 148, by + 80, 250, 24, "Dibagi menurut jumlah hari v")
        p.tambah("dash", x + 410, by + 80, 616, 24,
                 "Agustus: 80 muatan (Rp 800.000)   |   September: 40 muatan (Rp 400.000)")

    ky += 264
    p.tambah("btn", x, ky, 150, 30, "+ Tambah Mitra")
    p.tambah("btn", x + 160, ky, 220, 30, "Pilih dari Daftar PPL")
    p.tambah("panel", x + 620, ky, 420, 30, "Ringkasan: 12 mitra \u2014 total honor Rp 14.400.000")
    p.tambah("catatan", x, ky + 44, 520, 76,
             "Pilih dari Daftar PPL membuka daftar mitra aktif sesuai posisi tahap, dengan penyaring kecamatan dan desa. Mitra yang sudah dialokasikan tidak dapat dipilih lagi.")
    p.tambah("btnp", x + 910, ky + 60, 130, 30, "Simpan Kegiatan")
    return p


def w06():
    p = Halaman("W-06", "W-06 Peringatan Batas SBM")
    p.bingkai("Gambar W-06. Rancangan Jendela Peringatan Batas Honor Bulanan")
    x, y = p.kerangka(-1, "Input Kegiatan", "Alokasi mitra, PML pengawas, dan honor per tahap")
    p.tambah("dash", x, y, 1040, 520, "halaman alokasi mitra di belakang jendela")
    p.tambah("overlay", 0, 0, LEBAR, TINGGI, "")

    mx, my = 400, 190
    p.tambah("modal", mx, my, 520, 330, "Peringatan Batas Honor Bulanan")
    p.tambah("teks", mx + 16, my + 46, 480, 20, "Honor beberapa mitra melebihi batas SBM:")
    p.tabel(mx + 16, my + 74, [("Nama Mitra", 170), ("Bulan", 110),
                               ("Total Honor", 120), ("Batas", 100)],
            [["Budi Santoso", "Agustus 2026", "Rp 3.400.000", "Rp 3.000.000"],
             ["Siti Aminah", "Agustus 2026", "Rp 3.150.000", "Rp 3.000.000"]])
    p.tambah("teks", mx + 16, my + 186, 480, 40,
             "Data tetap dapat disimpan bila kelebihan ini memang disengaja dan diketahui Tim Keuangan.")
    p.tambah("btn", mx + 200, my + 260, 140, 32, "Periksa Lagi")
    p.tambah("btnp", mx + 350, my + 260, 150, 32, "Tetap Simpan")
    return p


def w07():
    p = Halaman("W-07", "W-07 Sunting Kegiatan")
    p.bingkai("Gambar W-07. Rancangan Halaman Sunting Kegiatan")
    x, y = p.kerangka(-1, "Sunting Kegiatan: Susenas Maret 2026", "Perbarui data kegiatan, alokasi, dan dokumennya")
    p.tambah("btn", x + 880, 58, 160, 30, "Riwayat Kegiatan")

    y = p.tab(x, y, ["Info Dasar & Jadwal", "Alokasi PPL", "Dokumen"], 0, [190, 150, 130])
    p.tambah("dash", x, y + 10, 620, 250,
             "Isian sama dengan halaman Input Kegiatan,\nsudah terisi data kegiatan yang disunting")

    p.tambah("panel", x + 640, y + 10, 400, 250, "Riwayat Kegiatan")
    p.tabel(x + 652, y + 44, [("Waktu", 110), ("Pelaku", 100), ("Perubahan", 166)],
            [["12 Agu 09:14", "Ketua Tim", "Ubah beban kerja mitra"],
             ["12 Agu 10:02", "PML", "Input progres pencacahan"],
             ["13 Agu 08:30", "Tim Keuangan", "Setujui dokumen KAK"],
             ["13 Agu 11:15", "Ketua Tim", "Tambah alokasi mitra"]])

    y2 = y + 276
    p.tambah("panel", x, y2, 1040, 150, "Catatan Kegiatan")
    p.tambah("btn", x + 880, y2 + 8, 148, 26, "+ Tambah Catatan")
    p.tabel(x + 12, y2 + 44, [("Tanggal", 120), ("Penulis", 120), ("Isi Catatan", 600), ("Aksi", 176)],
            [["12 Agu 2026", "Ketua Tim", "Mitra A diganti karena sakit", "ubah | hapus"],
             ["14 Agu 2026", "Ketua Tim", "Jadwal pencacahan mundur 2 hari", "ubah | hapus"]])
    p.tambah("btn", x + 800, y2 + 166, 100, 30, "Batal")
    p.tambah("btnp", x + 910, y2 + 166, 130, 30, "Simpan Perubahan")
    p.tambah("catatan", x, y2 + 166, 560, 72,
             "Bila kegiatan telah diubah orang lain sejak halaman dibuka, penyimpanan ditolak dan pengguna diminta memuat ulang.")
    return p


def w08():
    p = Halaman("W-08", "W-08 Dokumen Kegiatan")
    p.bingkai("Gambar W-08. Rancangan Halaman Dokumen Kegiatan")
    x, y = p.kerangka(-1, "Dokumen Kegiatan: Susenas Maret 2026", "Tautan dokumen setiap tahap beserta status pemeriksaannya")

    y = p.tab(x, y, ["Persiapan (5)", "Pengumpulan Data (4)", "Pengolahan (3)", "Diseminasi (2)"],
              0, [150, 200, 160, 160])
    ky = p.tabel(x, y + 12,
                 [("Nama Dokumen", 260), ("Penanggung Jawab", 180), ("Tautan", 240),
                  ("Status", 130), ("Aksi", 230)],
                 [["SK Tim", "Tim Keuangan", "buka tautan", "Approved", "catatan"],
                  ["Surat Tugas", "Ketua Tim", "isi tautan", "Pending", "setujui | tolak"],
                  ["KAK", "Ketua Tim", "buka tautan", "Rejected", "lihat alasan"],
                  ["Visum", "Ketua Tim", "belum diisi", "\u2014", "kirim pengingat"],
                  ["Laporan Persiapan", "Ketua Tim", "buka tautan", "Pending", "setujui | tolak"]],
                 tinggi_baris=30)
    p.tambah("btn", x, ky + 16, 170, 30, "+ Tambah Dokumen")
    p.tambah("btnp", x + 790, ky + 16, 250, 30, "Setujui Seluruh Tahap Ini")
    p.tambah("catatan", x, ky + 62, 520, 76,
             "Dokumen disimpan sebagai tautan ke penyimpanan instansi, bukan berkas yang diunggah, sehingga berkas asli tetap dikelola instansi.")
    p.tambah("modal", x + 560, ky + 62, 480, 190, "Jendela Isi Link Dokumen")
    p.tambah("teks", x + 576, ky + 100, 440, 20, "Nama dokumen: Surat Tugas")
    p.tambah("field", x + 576, ky + 126, 440, 28, "https://drive.google.com/...")
    p.tambah("kecil", x + 576, ky + 158, 440, 18, "Tautan maksimal 512 karakter dan wajib berupa alamat yang sah.")
    p.tambah("btn", x + 780, ky + 188, 100, 28, "Batal")
    p.tambah("btnp", x + 890, ky + 188, 126, 28, "Simpan")
    return p


def w09():
    p = Halaman("W-09", "W-09 Manajemen Honor")
    p.bingkai("Gambar W-09. Rancangan Halaman Manajemen Honor")
    x, y = p.kerangka(4, "Manajemen Honor", "Akumulasi honor mitra dari seluruh kegiatan")

    p.tambah("panel", x, y, 1040, 62, "")
    p.tambah("teks", x + 16, y + 18, 70, 28, "Periode")
    p.tambah("field", x + 90, y + 18, 190, 28, "Agustus 2026 v")
    p.tambah("teks", x + 292, y + 18, 40, 28, "atau")
    p.tambah("field", x + 336, y + 18, 250, 28, "rentang tanggal")
    p.tambah("teks", x + 610, y + 18, 90, 28, "Batas Honor")
    p.tambah("field", x + 704, y + 18, 170, 28, "Rp 3.000.000")
    p.tambah("btn", x + 884, y + 18, 90, 28, "Simpan")
    p.tambah("kecil", x + 610, y + 46, 420, 14, "Isian batas hanya muncul bagi Tim Keuangan dan Admin")

    ky = y + 78
    p.tambah("box", x, ky, 510, 70, "Total Honor Periode Ini\nRp 45.600.000")
    p.tambah("box", x + 530, ky, 510, 70, "Mitra Melebihi Batas\n2 mitra")

    ky += 88
    p.tambah("panel", x, ky, 1040, 44, "Akumulasi Honor PPL \u2014 Agustus 2026")
    p.tambah("field", x + 560, ky + 8, 240, 28, "Cari nama PPL...")
    p.tambah("btn", x + 810, ky + 8, 100, 28, "Unduh PDF")
    p.tambah("btn", x + 920, ky + 8, 108, 28, "Unduh Excel")
    p.tabel(x, ky + 52,
            [("Nama PPL", 240), ("Honor Periode Ini", 180), ("Jumlah Kegiatan", 150),
             ("Puncak Bulanan vs Batas", 220), ("Sisa Pagu", 130), ("Status", 120)],
            [["Budi Santoso", "Rp 3.400.000", "3", "+ Rp 400.000", "\u2014", "Melebihi"],
             ["Siti Aminah", "Rp 2.100.000", "2", "- Rp 900.000", "Rp 900.000", "Aman"],
             ["Rudi Hartono", "Rp 1.500.000", "1", "- Rp 1.500.000", "Rp 1.500.000", "Aman"],
             ["Dewi Lestari", "Rp 2.950.000", "4", "- Rp 50.000", "Rp 50.000", "Aman"]],
            tinggi_baris=28)
    return p


def w10():
    p = Halaman("W-10", "W-10 Daftar PPL")
    p.bingkai("Gambar W-10. Rancangan Halaman Daftar PPL (susunan Daftar PML serupa)")
    x, y = p.kerangka(2, "Daftar PPL", "Data mitra statistik beserta wilayah dan kegiatannya")

    p.tambah("panel", x, y, 1040, 62, "")
    p.tambah("field", x + 16, y + 18, 240, 28, "Cari nama mitra...")
    p.tambah("field", x + 270, y + 18, 190, 28, "Kecamatan v")
    p.tambah("field", x + 474, y + 18, 190, 28, "Desa v")
    p.tambah("field", x + 678, y + 18, 150, 28, "Status v")
    p.tambah("btn", x + 900, y + 18, 128, 28, "Ekspor Excel")

    p.tabel(x, y + 78,
            [("No", 60), ("ID", 100), ("Nama PPL", 250), ("Posisi", 180),
             ("Total Kegiatan", 150), ("Informasi Detail", 160), ("Status", 140)],
            [["1", "1234", "Budi Santoso", "Pendataan", "3", "lihat detail", "Aktif"],
             ["2", "1235", "Siti Aminah", "Pendataan/Pengolahan", "2", "lihat detail", "Aktif"],
             ["3", "1236", "Rudi Hartono", "Pengolahan", "1", "lihat detail", "Aktif"],
             ["4", "1237", "Dewi Lestari", "Pendataan", "4", "lihat detail", "Aktif"],
             ["5", "1238", "Ahmad Fauzi", "Pendataan", "0", "lihat detail", "Nonaktif"]],
            tinggi_baris=28)
    p.tambah("catatan", x, y + 250, 520, 80,
             "Bila dibuka dari tombol Pilih dari Daftar PPL, tiap baris diberi kotak centang, hanya mitra sesuai posisi tahap yang tampil, dan mitra yang sudah dialokasikan tampil redup.")
    p.tambah("dash", x + 560, y + 250, 480, 80, "Penomoran halaman: 1  2  3  ...  >")
    return p


def w11():
    p = Halaman("W-11", "W-11 Penilaian Mitra")
    p.bingkai("Gambar W-11. Rancangan Halaman Penilaian Mitra dan Jendela Pengisian Nilai")
    x, y = p.kerangka(5, "Penilaian Mitra", "Penilaian kinerja mitra oleh PML pengawasnya")

    p.tambah("panel", x, y, 1040, 62, "Filter dan Pencarian")
    p.tambah("field", x + 180, y + 18, 220, 28, "Kegiatan v")
    p.tambah("field", x + 414, y + 18, 190, 28, "Tahap v")
    p.tambah("field", x + 618, y + 18, 240, 28, "Cari nama mitra...")
    p.tambah("btn", x + 880, y + 18, 148, 28, "Rekap Penilaian")

    p.tabel(x, y + 78,
            [("No", 60), ("Kegiatan", 220), ("Nama PPL", 200), ("Nama PML", 180),
             ("Nilai (3 aspek)", 200), ("Rata-rata", 180)],
            [["1", "Susenas Maret 2026", "Budi Santoso", "Andi (Anda)", "[ Beri Nilai ]", "\u2014"],
             ["2", "Susenas Maret 2026", "Siti Aminah", "Andi (Anda)", "9 / 8 / 8", "8,33  [ Ubah ]"],
             ["3", "Sakernas 2026", "Rudi Hartono", "Dewi", "8 / 9 / 9", "8,67"]],
            tinggi_baris=30)
    p.tambah("catatan", x, y + 216, 520, 76,
             "Baris mitra yang diawasi PML lain tidak memiliki tombol penilaian, dan pembatasan yang sama juga diterapkan di server.")

    mx, my = x + 560, y + 216
    p.tambah("modal", mx, my, 480, 270, "Penilaian Mitra: Budi Santoso")
    yy = my + 48
    for label in ["Sikap dan Perilaku", "Kualitas Pekerjaan", "Ketepatan Waktu"]:
        p.tambah("teks", mx + 16, yy, 200, 26, label)
        p.tambah("field", mx + 230, yy, 100, 26, "1 \u2013 10")
        yy += 34
    p.tambah("teks", mx + 16, yy + 6, 300, 24, "Rata-rata: 8,33  (terhitung otomatis)")
    p.tambah("btn", mx + 200, my + 220, 120, 30, "Batal")
    p.tambah("btnp", mx + 330, my + 220, 134, 30, "Simpan Nilai")
    return p


def w12():
    p = Halaman("W-12", "W-12 Rekap Penilaian")
    p.bingkai("Gambar W-12. Rancangan Halaman Rekap Penilaian Triwulanan")
    x, y = p.kerangka(5, "Rekap Penilaian", "Peringkat mitra per triwulan berdasarkan bulan pembebanan honor")

    p.tambah("panel", x, y, 1040, 62, "Filter Data")
    p.tambah("field", x + 120, y + 18, 170, 28, "Tahun 2026 v")
    p.tambah("field", x + 302, y + 18, 190, 28, "Triwulan III v")
    p.tambah("btn", x + 810, y + 18, 100, 28, "Unduh PDF")
    p.tambah("btn", x + 920, y + 18, 108, 28, "Unduh Excel")

    ky = p.tabel(x, y + 78,
                 [("Peringkat", 110), ("Nama PPL", 280), ("Total Kegiatan", 200),
                  ("Rata-rata Nilai", 200), ("Nilai Akhir", 250)],
                 [["1", "Siti Aminah", "4", "9,00", "9,04"],
                  ["2", "Dewi Lestari", "3", "8,90", "8,93"],
                  ["3", "Budi Santoso", "3", "8,67", "8,70"],
                  ["4", "Rudi Hartono", "1", "8,33", "8,34"]],
                 tinggi_baris=30)
    p.tambah("dash", x, ky + 16, 1040, 40,
             "Keterangan: Nilai Akhir = Rata-rata Nilai + (0,01 \u00d7 Total Kegiatan)")
    p.tambah("catatan", x, ky + 72, 560, 76,
             "Judul kolom dapat diklik untuk mengurutkan data. Triwulan ditentukan dari bulan pembebanan honor, bukan tanggal penilaian diisi.")
    return p


def w13():
    p = Halaman("W-13", "W-13 Generate Surat")
    p.bingkai("Gambar W-13. Rancangan Halaman Generate Surat")
    x, y = p.kerangka(7, "Generate Surat", "Pembuatan Surat Perjanjian Kerja dan BAST mitra per periode")
    p.tambah("field", x + 830, 60, 210, 28, "Periode: Agustus 2026 v")

    y = p.tab(x, y, ["1. Atur Uraian & Beban Anggaran", "2. Generate SPK", "3. Generate BAST"],
              1, [280, 200, 200])
    p.tambah("panel", x, y + 10, 1040, 116, "Uraian Tugas dan Kode Beban Anggaran (tab 1)")
    p.tabel(x + 12, y + 44, [("Kegiatan", 220), ("Tahap", 150), ("Mitra", 90),
                             ("Uraian Tugas", 300), ("Kode MAK", 256)],
            [["Susenas Maret 2026", "Pencacahan", "12", "Melakukan pencacahan ruta", "054.01.GG..."],
             ["Sakernas 2026", "Listing", "8", "Melakukan pendaftaran bangunan", "054.01.GG..."]])

    ky = y + 142
    p.tambah("panel", x, ky, 1040, 44, "Daftar Mitra \u2014 Agustus 2026 (tab 2)")
    p.tambah("field", x + 700, ky + 8, 200, 28, "Cari nama mitra...")
    ky = p.tabel(x, ky + 52,
                 [("No. SPK", 200), ("Nama Mitra", 230), ("Jumlah Kegiatan", 150),
                  ("Jangka Waktu", 200), ("Total Honor", 150), ("Aksi", 110)],
                 [["015/SPK/.../2026", "Budi Santoso", "2", "1 \u2013 31 Agustus 2026", "Rp 2.400.000", "Unduh PDF"],
                  ["016/SPK/.../2026", "Siti Aminah", "1", "1 \u2013 31 Agustus 2026", "Rp 1.200.000", "Unduh PDF"],
                  ["(belum terbit)", "Rudi Hartono", "1", "1 \u2013 31 Agustus 2026", "Rp 900.000", "Buat SPK"]],
                 tinggi_baris=30)
    p.tambah("btnp", x, ky + 18, 250, 32, "Buat Seluruh SPK Periode Ini")
    p.tambah("catatan", x + 520, ky + 18, 520, 76,
             "Satu mitra memperoleh satu SPK per bulan walau bekerja pada beberapa kegiatan. Nomor surat tetap sama bila diunduh ulang.")
    return p


def w14():
    p = Halaman("W-14", "W-14 Template Surat")
    p.bingkai("Gambar W-14. Rancangan Halaman Template Surat")
    x, y = p.kerangka(8, "Template Surat", "Bagian surat yang jarang berubah, diatur satu kali")

    p.tambah("panel", x, y, 510, 150, "Identitas Surat")
    yy = y + 40
    yy = p.isian(x + 16, yy, "Pola nomor SPK", 150, 300, "{no}/SPK/{kode}/{bulan}/{tahun}")
    p.isian(x + 16, yy, "Pola nomor BAST", 150, 300, "{no}/BAST/{kode}/{bulan}/{tahun}")

    p.tambah("panel", x + 530, y, 510, 150, "Pihak Pertama (PPK)")
    yy = y + 40
    yy = p.isian(x + 546, yy, "Nama PPK", 120, 330, "")
    p.isian(x + 546, yy, "NIP / Jabatan", 120, 330, "")

    y2 = y + 166
    p.tambah("panel", x, y2, 510, 150, "Satuan Kerja")
    yy = y2 + 40
    yy = p.isian(x + 16, yy, "Nama satker", 120, 330, "BPS Kabupaten Bengkulu Selatan")
    p.isian(x + 16, yy, "Alamat / kode", 120, 330, "")

    p.tambah("panel", x + 530, y2, 510, 150, "Ketentuan Lain")
    p.tambah("field", x + 546, y2 + 44, 478, 90, "Ketentuan tambahan yang dicetak pada surat...")

    y3 = y2 + 166
    p.tambah("panel", x, y3, 1040, 190, "Isi Pasal Surat")
    p.tambah("field", x + 16, y3 + 40, 1008, 130, "Pasal 1 ... Pasal 2 ... (kotak teks panjang)")
    p.tambah("btnp", x + 910, y3 + 200, 130, 30, "Simpan Template")
    return p


def w15():
    p = Halaman("W-15", "W-15 Riwayat Penyuratan")
    p.bingkai("Gambar W-15. Rancangan Halaman Riwayat Penyuratan")
    x, y = p.kerangka(9, "Riwayat Penyuratan", "Seluruh surat dalam satu tahun, termasuk surat batal dan nomor kosong")

    p.tambah("panel", x, y, 1040, 56, "")
    p.tambah("field", x + 16, y + 14, 170, 28, "Tahun 2026 v")
    p.tambah("field", x + 200, y + 14, 240, 28, "Cari nomor atau nama mitra...")
    p.tambah("btn", x + 760, y + 14, 130, 28, "Rapikan Nomor")
    p.tambah("btn", x + 900, y + 14, 128, 28, "Atur Ulang Nomor")

    ky = p.tabel(x, y + 72,
                 [("Nomor", 90), ("No. SPK", 190), ("No. BAST", 190), ("Mitra", 200),
                  ("Periode", 130), ("Total Honor", 140), ("Status", 100)],
                 [["015", "015/SPK/.../2026", "015/BAST/.../2026", "Budi Santoso", "Agustus 2026", "Rp 2.400.000", "Aktif"],
                  ["016", "016/SPK/.../2026", "\u2014", "Siti Aminah", "Agustus 2026", "Rp 1.200.000", "Batal"],
                  ["017", "(nomor kosong)", "\u2014", "\u2014", "\u2014", "\u2014", "Kosong"],
                  ["018", "018/SPK/.../2026", "018/BAST/.../2026", "Dewi Lestari", "Agustus 2026", "Rp 1.800.000", "Isi berubah"]],
                 tinggi_baris=30)
    p.tambah("dash", x, ky + 12, 1040, 30,
             "Aksi per baris: Ubah Nomor  |  Perbarui Isi  |  Batalkan  |  Hapus (hanya surat batal)")

    mx, my = x + 300, ky + 58
    p.tambah("modal", mx, my, 520, 210, "Pratinjau Pengaturan Ulang Nomor")
    p.tabel(mx + 16, my + 44, [("Mitra", 200), ("Nomor Lama", 140), ("Nomor Baru", 140)],
            [["Budi Santoso", "015", "013"], ["Dewi Lestari", "018", "014"]])
    p.tambah("field", mx + 16, my + 140, 300, 28, "ketik: ATUR ULANG NOMOR")
    p.tambah("btnp", mx + 340, my + 140, 160, 28, "Jalankan")
    return p


def w16():
    p = Halaman("W-16", "W-16 Manajemen Admin")
    p.bingkai("Gambar W-16a. Rancangan Halaman Manajemen Admin")
    x, y = p.kerangka(10, "Manajemen Admin", "Pengelolaan akun pengguna, ketua tim, dan data mitra")

    y = p.tab(x, y, ["Manajemen Users", "Manajemen Ketua Tim", "Manajemen PPL"], 0, [190, 210, 180])
    p.tambah("panel", x, y + 10, 1040, 44, "Daftar Users")
    p.tambah("field", x + 620, y + 18, 240, 28, "Cari pengguna...")
    p.tambah("btnp", x + 880, y + 18, 148, 28, "+ Tambah User")
    ky = p.tabel(x, y + 66,
                 [("ID User", 150), ("Username", 200), ("Nama Lengkap", 300),
                  ("Role", 180), ("PML", 90), ("Aksi", 120)],
                 [["U001", "andi", "Andi Saputra", "user", "ya", "ubah | hapus"],
                  ["U002", "rina", "Rina Marlina", "supervisor", "\u2014", "ubah | hapus"],
                  ["U003", "admin", "Administrator", "admin", "\u2014", "ubah | hapus"],
                  ["U004", "dewi", "Dewi Lestari", "user", "ya", "ubah | hapus"]],
                 tinggi_baris=28)
    p.tambah("catatan", x, ky + 20, 520, 76,
             "Peran pengguna hanya dapat diubah Admin. Tab Manajemen PPL memuat tombol Tambah Mitra dan Impor dari SOBAT.")
    p.tambah("dash", x + 560, ky + 20, 480, 76,
             "Tab Manajemen PPL:\n[ + Tambah Mitra ]   [ Impor dari SOBAT ]")
    return p


def w16b():
    p = Halaman("W-16b", "W-16b Jendela Impor Mitra")
    p.bingkai("Gambar W-16b. Rancangan Jendela Impor Mitra dari Excel SOBAT")
    p.kerangka(10, "Manajemen Admin", "Tab Manajemen PPL")
    p.tambah("dash", 220, 116, 1040, 500, "halaman manajemen admin di belakang jendela")
    p.tambah("overlay", 0, 0, LEBAR, TINGGI, "")

    mx, my = 280, 120
    p.tambah("modal", mx, my, 720, 560, "Impor Mitra dari Excel SOBAT")
    yy = my + 50
    p.tambah("teks", mx + 16, yy, 180, 28, "Berkas Excel (.xlsx)")
    p.tambah("field", mx + 200, yy, 350, 28, "belum ada berkas dipilih")
    p.tambah("btn", mx + 562, yy, 130, 28, "Pilih Berkas")
    yy += 42
    p.tambah("teks", mx + 16, yy, 260, 28, "Baris judul kolom")
    p.tambah("field", mx + 200, yy, 120, 28, "3 v")
    yy += 46
    p.tambah("panel", mx + 16, yy, 676, 96, "Pemetaan Kolom")
    p.tambah("field", mx + 30, yy + 36, 200, 26, "Nama Mitra  \u2190  kolom B v")
    p.tambah("field", mx + 244, yy + 36, 200, 26, "ID SOBAT  \u2190  kolom A v")
    p.tambah("field", mx + 458, yy + 36, 220, 26, "Kecamatan / Desa  \u2190  kolom D v")
    yy += 112
    p.tambah("panel", mx + 16, yy, 676, 44,
             "Pratinjau:  Tambah 12   |   Perbarui 30   |   Lewati 4   |   Nonaktifkan 2")
    p.tabel(mx + 16, yy + 56,
            [("Nama Mitra", 220), ("ID SOBAT", 120), ("Keadaan", 150), ("Tindakan", 186)],
            [["Budi Santoso", "1234", "sudah ada", "perbarui v"],
             ["Ahmad Fauzi", "1290", "baru", "tambah v"],
             ["Siti Aminah", "1235", "sudah ada", "lewati v"],
             ["Rudi Hartono", "1236", "tidak ada di berkas", "nonaktifkan v"]],
            tinggi_baris=26)
    p.tambah("kecil", mx + 16, my + 484, 500, 18,
             "Pratinjau tidak mengubah data. Impor dijalankan sebagai satu kesatuan.")
    p.tambah("btn", mx + 400, my + 508, 130, 32, "Batal")
    p.tambah("btnp", mx + 540, my + 508, 152, 32, "Terapkan Impor")
    return p


def w17():
    p = Halaman("W-17", "W-17 Profil, Notifikasi, Pencarian")
    p.bingkai("Gambar W-17. Rancangan Halaman Profil, Panel Notifikasi, dan Pencarian Global")
    x, y = p.kerangka(-1, "Profil Saya", "Identitas akun dan penggantian kata sandi")

    p.tambah("panel", x, y, 500, 190, "Identitas Akun")
    yy = y + 44
    for label, isi in [("Username", "andi"), ("Nama Lengkap", "Andi Saputra"), ("Peran", "Pegawai / PML")]:
        p.tambah("teks", x + 16, yy, 150, 26, label)
        p.tambah("dash", x + 170, yy, 300, 26, isi)
        yy += 36
    p.tambah("kecil", x + 16, y + 158, 460, 18, "Nama dan peran hanya dapat diubah Admin.")

    p.tambah("panel", x, y + 206, 500, 230, "Ganti Kata Sandi")
    yy = y + 250
    for label in ["Password Lama", "Password Baru", "Ulangi Password Baru"]:
        p.tambah("teks", x + 16, yy, 180, 26, label)
        p.tambah("field", x + 200, yy, 270, 26, "")
        yy += 38
    p.tambah("kecil", x + 16, yy + 2, 460, 18, "Panjang 8\u201372 karakter dan tidak sama dengan username.")
    p.tambah("btnp", x + 340, yy + 26, 130, 30, "Simpan")

    p.tambah("modal", x + 530, y, 510, 250, "Panel Notifikasi (5 baru)")
    p.tabel(x + 546, y + 44, [("Jenis", 130), ("Isi Notifikasi", 350)],
            [["Dokumen", "Dokumen ditolak: KAK Susenas"],
             ["Tenggat", "Tahap Pencacahan berakhir 2 hari lagi"],
             ["Progres", "Progres belum diperbarui 3 hari"],
             ["Pemeriksaan", "4 dokumen menunggu persetujuan"],
             ["Surat", "Isi surat berubah setelah terbit"]],
            tinggi_baris=26)
    p.tambah("kecil", x + 546, y + 214, 460, 18, "Notifikasi hilang sendiri setelah penyebabnya diselesaikan.")

    p.tambah("modal", x + 530, y + 266, 510, 182, "Pencarian Global")
    p.tambah("field", x + 546, y + 306, 478, 28, "Cari kegiatan, mitra, atau halaman...")
    p.tabel(x + 546, y + 342, [("Jenis", 130), ("Hasil", 348)],
            [["Kegiatan", "Susenas Maret 2026"],
             ["Mitra", "Budi Santoso"],
             ["Halaman", "Manajemen Honor"]])
    return p


HALAMAN = [w01, w02, w03, w04, w05, w06, w07, w08, w09, w10,
           w11, w12, w13, w14, w15, w16, w16b, w17]


# ==========================================================================
# Keluaran
# ==========================================================================

def tulis_drawio(halaman, tujuan):
    bagian = ['<mxfile host="65bd71144e">']
    for p in halaman:
        pid = p.kode.lower().replace("-", "")
        bagian.append('  <diagram name="%s" id="%s">' % (lolos(p.nama), pid))
        bagian.append(
            '    <mxGraphModel dx="900" dy="700" grid="1" gridSize="10" guides="1" '
            'tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" '
            'pageWidth="%d" pageHeight="%d" math="0" shadow="0">' % (LEBAR + 80, TINGGI + 100))
        bagian.append("      <root>")
        bagian.append('        <mxCell id="0" />')
        bagian.append('        <mxCell id="1" parent="0" />')
        for i, s in enumerate(p.sel):
            bagian.append(
                '        <mxCell id="%s-%d" value="%s" style="%s" vertex="1" parent="1">'
                % (pid, i + 1, lolos(s["teks"]).replace("\n", "&#10;"), GAYA[s["jenis"]]))
            bagian.append(
                '          <mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry" />'
                % (s["x"] + 40, s["y"] + 40, s["w"], s["h"]))
            bagian.append("        </mxCell>")
        bagian.append("      </root>")
        bagian.append("    </mxGraphModel>")
        bagian.append("  </diagram>")
    bagian.append("</mxfile>")
    with open(tujuan, "w", encoding="utf-8") as f:
        f.write("\n".join(bagian) + "\n")


def tulis_pratinjau(halaman, direktori):
    from PIL import Image, ImageDraw, ImageFont

    def huruf(ukuran, tebal):
        nama = "arialbd.ttf" if tebal else "arial.ttf"
        try:
            return ImageFont.truetype("C:/Windows/Fonts/" + nama, ukuran)
        except OSError:
            return ImageFont.load_default()

    os.makedirs(direktori, exist_ok=True)
    for p in halaman:
        gbr = Image.new("RGB", (LEBAR + 80, TINGGI + 100), "white")
        d = ImageDraw.Draw(gbr)
        for s in p.sel:
            isi, garis, warna, ukuran, tebal = PRATINJAU[s["jenis"]]
            x, y = s["x"] + 40, s["y"] + 40
            kotak = [x, y, x + s["w"], y + s["h"]]
            if isi or garis:
                d.rectangle(kotak, fill=isi, outline=garis)
            if s["teks"]:
                f = huruf(ukuran, tebal)
                baris = s["teks"].split("\n")
                th = ukuran + 3
                if s["jenis"] in RATA_ATAS:
                    ty = y + 6
                else:
                    ty = y + max(2, (s["h"] - th * len(baris)) // 2)
                for b in baris:
                    if s["jenis"] in RATA_KIRI:
                        tx = x + 6
                    else:
                        lebar_teks = d.textlength(b, font=f)
                        tx = x + max(2, (s["w"] - lebar_teks) / 2)
                    d.text((tx, ty), b, fill=warna, font=f)
                    ty += th
        gbr.save(os.path.join(direktori, p.kode.replace("-", "") + ".png"))


if __name__ == "__main__":
    di_sini = os.path.dirname(os.path.abspath(__file__))
    keluaran = os.path.join(os.path.dirname(di_sini), "15-wireframe.drawio")
    halaman = [f() for f in HALAMAN]
    tulis_drawio(halaman, keluaran)
    print("ditulis:", keluaran, "-", len(halaman), "halaman")
    if "--pratinjau" in sys.argv:
        dir_pratinjau = sys.argv[sys.argv.index("--pratinjau") + 1]
        tulis_pratinjau(halaman, dir_pratinjau)
        print("pratinjau:", dir_pratinjau)
