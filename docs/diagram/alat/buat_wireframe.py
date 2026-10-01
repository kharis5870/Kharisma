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
    "judulbar": "text;html=1;fontFamily=Arial;align=left;verticalAlign=middle;fontSize=13;fontStyle=1;fontColor=#222222;",
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
    "judulbar": (None, None, "#222222", 12, True),
    "sub":     (None, None, "#777777", 10, False),
    "teks":    (None, None, "#444444", 10, False),
    "kecil":   (None, None, "#777777", 9, False),
    "nomor":   ("#333333", "#333333", "#FFFFFF", 10, True),
    "catatan": ("#FFFFFF", "#999999", "#444444", 9, False),
}

RATA_ATAS = {"panel", "modal"}
RATA_KIRI = {"bar", "panel", "field", "thead", "trow", "menu", "menuact",
             "modal", "judul", "judulbar", "sub", "teks", "kecil", "catatan"}


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

    def kerangka(self, menu_aktif, judul_rute, judul_isi="", ket_isi="",
                 tanpa_menu=False, footer=True):
        """Bilah sisi + bilah atas + judul isi. Mengembalikan (x, y) awal isi.

        Susunannya mengikuti client/components/Layout.tsx dan tidak boleh
        disederhanakan menjadi "satu bilah atas selebar layar":

        - Bilah sisi adalah kolom kiri SETINGGI layar dan memuat logo SIKAMI
          beserta tombol kuncup. Logonya ada di sini, bukan di bilah atas.
        - Bilah atas hanya selebar sisa layar di kanan bilah sisi.
        - Di dalam bilah atas ada JUDUL RUTE beserta sapaan "Selamat datang
          kembali, <pengguna>!". Ini berbeda dari JUDUL ISI yang berada di
          dalam area isi beserta keterangannya, dan keduanya memang tampil
          bersamaan: misalnya rute "Dashboard" dengan isi "Dashboard
          Monitoring".
        - Submenu "Daftar" dan "Keuangan" tertutup secara bawaan, ditandai
          tanda panah. Isinya tidak ikut tergambar.
        """
        sb = 0 if tanpa_menu else 200

        if not tanpa_menu:
            self.tambah("panel", 0, 0, sb, TINGGI, "")
            self.tambah("bar", 10, 12, 180, 30, "SIKAMI                        <")
            menu = ["Dashboard", "Daftar                     >", "Manajemen Honor",
                    "Penilaian Mitra", "Keuangan                 >", "Manajemen Admin"]
            for i, label in enumerate(menu):
                self.tambah("menuact" if i == menu_aktif else "menu",
                            10, 60 + i * 34, 180, 28, label)
            self.tambah("btnp", 10, 596, 180, 30, "+ Kegiatan Baru")
            self.tambah("btn", 10, 634, 180, 28, "Mode Gelap")
            self.tambah("btn", 10, 668, 180, 28, "Logout")

        # Bilah atas: hanya selebar sisa layar.
        self.tambah("bar", sb, 0, LEBAR - sb, 56, "")
        self.tambah("judulbar", sb + 14, 14, 330, 18, judul_rute)
        self.tambah("kecil", sb + 14, 34, 330, 16, "Selamat datang kembali, kharis11!")
        self.tambah("teks", sb + 360, 20, 250, 18, "Jumat, 2 Oktober 2026    ·    01.37")
        self.tambah("field", sb + 620, 15, 190, 26, "Cari...            Ctrl K")
        self.tambah("box", sb + 826, 15, 42, 26, "notif")
        self.tambah("box", sb + 874, 15, 40, 26, "atur")
        self.tambah("box", sb + 920, 15, 34, 26, "K")

        x = sb + 20
        y = 76
        if judul_isi:
            self.tambah("judul", x, y, 700, 26, judul_isi)
            y += 28
        if ket_isi:
            self.tambah("sub", x, y, 700, 16, ket_isi)
            y += 22
        if footer:
            self.tambah("bar", sb, TINGGI - 26, LEBAR - sb, 26,
                        "© 2025 BPS Kabupaten Bengkulu Selatan")
        return x, y + 8

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
    x, y = p.kerangka(0, "JUDUL RUTE", "Judul bagian", "Keterangan singkat bagian ini")
    p.tambah("dash", x, y, 1040, 470, "")

    # Penanda nomor ditaruh di ruang kosong tiap bagian supaya tidak menimpa
    # isinya, dan keterangannya dikumpulkan sebagai keterangan gambar di tengah
    # area isi. Hanya EMPAT bagian tetap yang dinomori: jendela sembul dan pesan
    # singkat tidak menempati ruang tetap, jadi keduanya dijelaskan terpisah.
    p.nomor(90, 430, 1)
    p.nomor(1232, 16, 2)
    p.nomor(1232, 86, 3)
    p.nomor(1232, 688, 4)

    lx, ly = x + 240, y + 120
    p.tambah("box", lx, ly, 560, 170, "")
    p.tambah("teks", lx + 16, ly + 14, 400, 20, "Empat bagian tetap:")
    for i, (nomor, nama, ket) in enumerate([
            ("1", "Bilah sisi", "logo, menu utama, dan tombol tetap di bawahnya"),
            ("2", "Bilah atas", "judul rute, sapaan, tanggal dan jam, pencarian, notifikasi, akun"),
            ("3", "Area isi", "judul bagian, keterangannya, penyaring, lalu isi utama"),
            ("4", "Footer", "identitas instansi")]):
        p.tambah("kecil", lx + 16, ly + 44 + i * 30, 24, 16, nomor + ".")
        p.tambah("kecil", lx + 40, ly + 44 + i * 30, 110, 16, nama)
        p.tambah("kecil", lx + 150, ly + 44 + i * 30, 396, 16, ket)

    p.tambah("catatan", lx, ly + 190, 560, 90,
             "Di luar keempat bagian tetap itu ada dua unsur yang muncul sesuai keadaan dan "
             "tidak menempati ruang tersendiri: jendela sembul (modal) muncul di TENGAH layar "
             "dengan latar halaman digelapkan, dan pesan singkat (toast) muncul di sudut kanan "
             "bawah lalu hilang sendiri.")
    return p


def w02():
    p = Halaman("W-02", "W-02 Halaman Masuk")
    p.bingkai("Gambar W-02. Rancangan Halaman Masuk")
    # Halaman masuk TIDAK terbagi dua kolom: satu kartu di tengah layar kosong.
    p.tambah("dash", 0, 0, LEBAR, TINGGI, "")
    kx, ky, kw = 450, 120, 380
    p.tambah("box", kx, ky, kw, 430, "")

    p.tambah("bar", kx, ky, kw, 110, "")
    p.tambah("judul", kx + 110, ky + 26, 220, 30, "SIKAMI")
    p.tambah("kecil", kx + 110, ky + 54, 240, 16, "Sistem Informasi Kegiatan dan Mitra")
    p.tambah("teks", kx + 96, ky + 86, 260, 18, "BPS Kabupaten Bengkulu Selatan")

    p.tambah("judul", kx + 112, ky + 140, 260, 24, "Masuk ke Sistem")
    p.tambah("kecil", kx + 60, ky + 166, 330, 16,
             "Silakan masuk dengan akun yang telah disediakan")

    p.tambah("teks", kx + 24, ky + 196, 120, 18, "Username")
    p.tambah("field", kx + 24, ky + 216, kw - 48, 28, "Masukkan username")
    p.tambah("teks", kx + 24, ky + 254, 120, 18, "Password")
    p.tambah("field", kx + 24, ky + 274, kw - 78, 28, "Masukkan password")
    p.tambah("box", kx + kw - 50, ky + 274, 26, 28, "lihat")
    p.tambah("btnp", kx + 24, ky + 320, kw - 48, 32, "Masuk")

    p.tambah("kecil", kx + 50, ky + 446, 300, 16,
             "SIKAMI — Sistem Informasi Kegiatan dan Mitra")
    p.tambah("kecil", kx + 20, ky + 462, 360, 16,
             "© 2025 BPS Kabupaten Bengkulu Selatan")
    p.tambah("catatan", 880, 160, 360, 120,
             "Pesan kesalahan untuk nama pengguna salah dan kata sandi salah dibuat SAMA, "
             "agar tidak memberi petunjuk kepada penebak akun. Percobaan berulang dibatasi "
             "per akun dan per alamat.")
    return p


def w03():
    p = Halaman("W-03", "W-03 Dasbor Monitoring")
    p.bingkai("Gambar W-03. Rancangan Halaman Dasbor Monitoring")
    x, y = p.kerangka(0, "Dashboard", "Dashboard Monitoring",
                      "Pantau progress dan kelola semua kegiatan")
    p.tambah("btn", x + 790, y - 42, 120, 26, "3 Peringatan")
    p.tambah("btn", x + 918, y - 42, 122, 26, "Tampilkan Grafik")

    # Baris penyaring: label di ATAS tiap isian, dan ada LIMA penyaring.
    p.tambah("panel", x, y, 1040, 74, "")
    kx = x + 14
    for label, isi, w in [("Cari Kegiatan", "Cari nama kegiatan...", 250),
                          ("Tahap Progress", "Keseluruhan", 180),
                          ("Filter Status", "Semua Status", 180),
                          ("Filter Tim", "Semua Tim", 180),
                          ("Filter Tahun", "Semua tahun", 180)]:
        p.tambah("kecil", kx, y + 10, w, 14, label)
        p.tambah("field", kx, y + 28, w, 28, isi)
        kx += w + 12

    ky = y + 90
    for i, (nama, persen) in enumerate([("Survei Tes", "0%"),
                                        ("Survei RUTI 2026", "0%"),
                                        ("SAKERNAS 2026", "1%")]):
        cx = x + i * 352
        p.tambah("box", cx, ky, 336, 250, "")
        p.tambah("teks", cx + 12, ky + 12, 230, 18, nama)
        p.tambah("box", cx + 256, ky + 10, 68, 20, "Warning")
        p.tambah("kecil", cx + 12, ky + 34, 240, 14, "Ketua: Edianto, S.E")
        p.tambah("teks", cx + 12, ky + 54, 200, 16, "Progress Keseluruhan")
        p.tambah("teks", cx + 288, ky + 54, 40, 16, persen)
        p.tambah("dash", cx + 12, ky + 74, 312, 8, "")
        p.tambah("kecil", cx + 12, ky + 92, 152, 14, "Mulai Pengumpulan Data")
        p.tambah("kecil", cx + 174, ky + 92, 152, 14, "Selesai Pengumpulan Data")
        p.tambah("teks", cx + 12, ky + 108, 150, 16, "21 Sep 2026")
        p.tambah("teks", cx + 174, ky + 108, 150, 16, "30 Sep 2026")
        p.tambah("kecil", cx + 12, ky + 130, 312, 14, "Tenggat: 14 hari yang lalu oleh edi")
        p.tambah("kecil", cx + 12, ky + 148, 312, 14, "Lihat 2 Peringatan")
        p.tambah("btn", cx + 12, ky + 168, 152, 24, "Lihat")
        p.tambah("btn", cx + 172, ky + 168, 152, 24, "Edit")
        p.tambah("btn", cx + 12, ky + 196, 152, 24, "Update")
        p.tambah("btn", cx + 172, ky + 196, 152, 24, "View Docs")
        p.tambah("btnp", cx + 12, ky + 224, 312, 18, "Hapus")

    ky += 254
    p.tambah("btn", x, ky, 1040, 22, "Arsipkan   (tombol terakhir pada tiap kartu)")
    p.tambah("dash", x, ky + 30, 420, 26, "Lihat kegiatan yang diarsipkan (4)")
    p.tambah("catatan", x + 440, ky + 26, 600, 96,
             "Tombol \"Tampilkan Grafik\" membuka panel berisi DELAPAN grafik di atas daftar "
             "kegiatan: Kegiatan per Status, Kegiatan per Tim, dua corong progres, Kegiatan "
             "Paling Tertinggal, Antrean Pemeriksaan, Honor per Tim, dan Beban Mitra per PML. "
             "Pembaruan progres mitra TIDAK berada di halaman ini, melainkan pada jendela "
             "sembul yang dibuka tombol Update tiap kartu.")
    return p


def w04():
    p = Halaman("W-04", "W-04 Input Kegiatan (Info Dasar)")
    p.bingkai("Gambar W-04. Rancangan Halaman Input Kegiatan — Tab Info Dasar dan Jadwal")
    x, y = p.kerangka(-1, "Input Kegiatan Baru", "Input Kegiatan",
                      "Lengkapi semua informasi kegiatan dalam satu halaman")
    p.tambah("btn", x + 900, y - 42, 140, 26, "Ambil dari Historis")

    y = p.tab(x, y, ["Info Dasar & Jadwal", "Alokasi PPL", "Dokumen"], 0, [200, 160, 150])

    p.tambah("panel", x, y + 12, 1040, 196, "Informasi Kegiatan")
    p.tambah("kecil", x + 12, y + 32, 400, 14, "Masukkan detail dasar mengenai kegiatan.")
    p.tambah("teks", x + 16, y + 56, 200, 18, "Nama Kegiatan *")
    p.tambah("field", x + 16, y + 76, 490, 28, "Contoh: Sensus Penduduk 2020")
    p.tambah("teks", x + 528, y + 56, 200, 18, "Nama Ketua Tim *")
    p.tambah("field", x + 528, y + 76, 490, 28, "Rossi Bettega, S.E")
    p.tambah("kecil", x + 528, y + 108, 490, 26,
             "Ketua tim mengikuti tahun jadwal persiapan — sekarang 2026.\nTim: Produksi")
    p.tambah("teks", x + 16, y + 132, 200, 18, "Deskripsi Kegiatan")
    p.tambah("field", x + 16, y + 152, 1002, 44, "Deskripsikan kegiatan secara singkat...")

    y2 = y + 224
    p.tambah("panel", x, y2, 1040, 212, "Jadwal Kegiatan *")
    # Kedua kotak centang berada di ATAS kartu, bukan di sudut kanan.
    p.tambah("box", x + 16, y2 + 30, 236, 22, "[v] Ada tahap Pengolahan & Analisis")
    p.tambah("box", x + 262, y2 + 30, 236, 22, "[v] Ada tahap Diseminasi & Evaluasi")
    p.tambah("kecil", x + 16, y2 + 58, 1000, 28,
             "Matikan bila tahap itu dikerjakan provinsi atau pusat. Jadwal dan dokumen "
             "wajibnya tidak akan diminta. Alokasi mitra Pengolahan tetap ada — "
             "pekerjaannya (entri dan cleaning) berlangsung di masa pendataan.")
    # Empat rentang tanggal disusun DUA KOLOM, bukan empat baris bertumpuk.
    for i, label in enumerate(["Persiapan", "Pengumpulan Data",
                               "Pengolahan & Analisis", "Diseminasi & Evaluasi"]):
        cx = x + 16 + (i % 2) * 510
        cy = y2 + 96 + (i // 2) * 54
        p.tambah("teks", cx, cy, 240, 18, label)
        p.tambah("field", cx, cy + 20, 480, 28,
                 "27 Sep 2026 — 28 Sep 2026" if i == 0 else "Pilih rentang...")
    # Hanya SATU tombol, dan letaknya di tengah.
    p.tambah("btnp", x + 440, y2 + 224, 160, 30, "Simpan Kegiatan")
    p.tambah("catatan", x + 650, y2 + 218, 390, 72,
             "Hanya ada satu tombol di bawah formulir dan letaknya di tengah. Tombol itu "
             "mati selama Nama Kegiatan masih kosong.")
    return p


def w05():
    p = Halaman("W-05", "W-05 Alokasi Mitra")
    p.bingkai("Gambar W-05. Rancangan Tab Alokasi Mitra dan Pembebanan Honor")
    x, y = p.kerangka(-1, "Input Kegiatan Baru", "Input Kegiatan",
                      "Lengkapi semua informasi kegiatan dalam satu halaman")
    y = p.tab(x, y, ["Info Dasar & Jadwal", "Alokasi PPL", "Dokumen"], 1, [200, 160, 150])

    # Ajakan impor berada di ATAS, sebelum tab tahap.
    p.tambah("panel", x, y + 12, 1040, 72, "")
    p.tambah("kecil", x + 12, y + 24, 1010, 28,
             "Punya daftar alokasinya di Excel? Satu berkas mengisi Listing, Pencacahan, "
             "dan Pengolahan sekaligus — lengkap dengan PML dan beban kerjanya.")
    p.tambah("btn", x + 12, y + 52, 190, 26, "Impor Alokasi dari Excel")

    y = p.tab(x, y + 96, ["Listing", "Pencacahan", "Pengolahan"], 0,
              [346, 347, 347], h=28)

    p.tambah("panel", x, y + 10, 1040, 354, "")
    p.tambah("teks", x + 16, y + 24, 400, 20, "Alokasi PPL & PML (Listing)")
    p.tambah("kecil", x + 16, y + 44, 440, 14,
             "Atur honorarium, bulan pembayaran, lalu alokasikan PPL.")
    p.tambah("btnp", x + 756, y + 22, 110, 26, "Clear PPL")
    p.tambah("btn", x + 876, y + 22, 144, 26, "Pilih dari Daftar PPL")

    # Honorarium diatur SEKALI untuk satu tahap, bukan per mitra.
    p.tambah("box", x + 16, y + 66, 1004, 84, "")
    p.tambah("teks", x + 28, y + 76, 320, 18, "Pengaturan Honorarium & Pembayaran")
    for i, (label, isi, w) in enumerate(
            [("Satuan Beban Kerja", "Dokumen", 240),
             ("Harga per Satuan (Rp)", "50.000", 240),
             ("Rentang Tanggal Honor *", "01 Sep 2026 — 30 Sep 2026", 300)]):
        cx = x + 28 + i * 256
        p.tambah("kecil", cx, y + 100, w, 14, label)
        p.tambah("field", cx, y + 116, w, 26, isi)
    p.tambah("kecil", x + 28, y + 146, 400, 14,
             "Dibebankan pada bulan:   September 2026")

    ky = y + 160
    for i, (nama, beban, honor) in enumerate([("AFZUMARNI", "32", "1.600.000"),
                                              ("Jeni Rahmayanti", "45", "2.250.000")]):
        by = ky + i * 96
        p.tambah("box", x + 16, by, 1004, 90, "")
        p.tambah("teks", x + 28, by + 10, 300, 18, nama)
        p.tambah("btn", x + 972, by + 8, 34, 20, "hapus")
        p.tambah("kecil", x + 28, by + 32, 200, 14, "Pilih PPL *")
        p.tambah("field", x + 28, by + 48, 470, 26, nama)
        p.tambah("kecil", x + 518, by + 32, 200, 14, "Nama PML *")
        p.tambah("field", x + 518, by + 48, 470, 26, "Siman Tohadi")
        p.tambah("kecil", x + 28, by + 68, 160, 14, "Beban Kerja Listing")
        p.tambah("field", x + 190, by + 64, 150, 22, beban)
        p.tambah("kecil", x + 518, by + 68, 160, 14, "Total Honor (Rp)")
        p.tambah("dash", x + 680, by + 64, 150, 22, honor)

    ky += 196
    p.tambah("dash", x + 16, ky, 1004, 24, "+   Tambah Alokasi PPL Manual")
    p.tambah("btnp", x + 440, ky + 36, 160, 28, "Simpan Kegiatan")
    return p


def w06():
    p = Halaman("W-06", "W-06 Peringatan Sebelum Menyimpan")
    p.bingkai("Gambar W-06. Rancangan Jendela Peringatan Sebelum Menyimpan")
    x, y = p.kerangka(-1, "Input Kegiatan Baru", "", "", footer=False)
    p.tambah("dash", x, y, 1040, 560, "halaman alokasi mitra di belakang jendela")
    p.tambah("overlay", 0, 0, LEBAR, TINGGI, "")

    # Kedua peringatan memakai komponen jendela yang SAMA: ikon bulat di atas,
    # judul, satu paragraf keterangan, lalu dua tombol. Tidak ada tabel.
    my = 110
    mx = 220
    p.tambah("modal", mx, my, 420, 300, "")
    p.nomor(mx + 198, my + 22, 1)
    p.tambah("teks", mx + 52, my + 68, 330, 22, "Periksa Lagi Sebelum Menyimpan?")
    p.tambah("kecil", mx + 24, my + 96, 372, 116,
             "Tahap Pencacahan:\n"
             "• Beban kerja masih 0: Ina maryana.A, INSURNI, Jeksen bona parter.\n"
             "• Belum punya PML: Ina maryana.A, INSURNI, Jeksen bona parter.\n"
             "• Pengaturan honor belum diisi: harga per satuan.")
    p.tambah("btn", mx + 24, my + 240, 180, 34, "Periksa Lagi")
    p.tambah("btnp", mx + 216, my + 240, 180, 34, "Tetap Simpan")

    mx2 = 700
    p.tambah("modal", mx2, my, 420, 300, "")
    p.nomor(mx2 + 198, my + 22, 2)
    p.tambah("teks", mx2 + 110, my + 68, 300, 22, "Peringatan Batas Honor")
    p.tambah("kecil", mx2 + 24, my + 96, 372, 80,
             "Total honor untuk AFZUMARNI di bulan terpilih akan menjadi Rp 3.400.000, "
             "melebihi batas Rp 3.220.000. Lanjutkan?")
    p.tambah("btn", mx2 + 24, my + 240, 180, 34, "Batal")
    p.tambah("btnp", mx2 + 216, my + 240, 180, 34, "Ya, Lanjutkan")

    p.tambah("catatan", 220, 446, 900, 116,
             "Dua peringatan berbeda dapat muncul sebelum kegiatan tersimpan, dan keduanya "
             "memakai bentuk jendela yang sama. (1) Pemeriksaan KELENGKAPAN alokasi: beban "
             "kerja masih nol, PML belum dipilih, atau harga satuan kosong. (2) Pemeriksaan "
             "BATAS SBML, yang baru muncul setelah server menolak penyimpanan. Keduanya "
             "sama-sama dapat dilewati pengguna, karena kelebihan SBML kadang memang "
             "disengaja dan diketahui Tim Keuangan.")
    return p


def w07():
    p = Halaman("W-07", "W-07 Sunting Kegiatan")
    p.bingkai("Gambar W-07. Rancangan Halaman Sunting Kegiatan")
    x, y = p.kerangka(-1, "Edit Kegiatan", "", "")
    p.tambah("btn", x, y - 8, 180, 28, "← Kembali ke Dashboard")
    p.tambah("judul", x + 196, y - 10, 300, 28, "Edit Kegiatan")

    y = p.tab(x, y + 32, ["Info Dasar & Jadwal", "Alokasi PPL", "Dokumen"], 0,
              [200, 160, 150])
    p.tambah("panel", x, y + 12, 1040, 176, "Informasi Kegiatan")
    p.tambah("kecil", x + 12, y + 32, 400, 14, "Perbarui detail dasar mengenai kegiatan.")
    p.tambah("teks", x + 16, y + 56, 200, 18, "Nama Kegiatan *")
    p.tambah("field", x + 16, y + 76, 490, 28, "Survei Tes")
    p.tambah("teks", x + 528, y + 56, 200, 18, "Nama Ketua Tim *")
    p.tambah("field", x + 528, y + 76, 490, 28, "Edianto, S.E")
    p.tambah("kecil", x + 528, y + 108, 490, 26,
             "Ketua tim mengikuti tahun jadwal persiapan — sekarang 2026.\nTim: Sosial")
    p.tambah("teks", x + 16, y + 132, 200, 18, "Deskripsi Kegiatan")
    p.tambah("field", x + 16, y + 152, 1002, 34, "tes 2")

    y2 = y + 204
    p.tambah("panel", x, y2, 1040, 166, "Jadwal Kegiatan *")
    p.tambah("box", x + 16, y2 + 30, 236, 22, "[ ] Ada tahap Pengolahan & Analisis")
    p.tambah("box", x + 262, y2 + 30, 236, 22, "[ ] Ada tahap Diseminasi & Evaluasi")
    p.tambah("kecil", x + 16, y2 + 58, 1000, 14,
             "Kedua tahap dimatikan pada contoh ini, sehingga jadwalnya tidak diminta.")
    for i, (label, isi) in enumerate([("Persiapan", "18 Sep 2026 — 20 Sep 2026"),
                                      ("Pengumpulan Data", "21 Sep 2026 — 30 Sep 2026")]):
        cx = x + 16 + i * 510
        p.tambah("teks", cx, y2 + 80, 240, 18, label)
        p.tambah("field", cx, y2 + 100, 480, 28, isi)

    # DUA tombol berdampingan di tengah, berbeda dari halaman Input Kegiatan.
    p.tambah("btn", x + 320, y2 + 182, 180, 30, "Batalkan Perubahan")
    p.tambah("btnp", x + 512, y2 + 182, 180, 30, "Simpan Perubahan")
    p.tambah("catatan", x + 710, y2 + 176, 330, 92,
             "Bila kegiatan telah diubah orang lain sejak halaman dibuka, penyimpanan "
             "ditolak dan pengguna diminta memuat ulang. Panel Riwayat Kegiatan berada di "
             "bawah formulir, bukan di sampingnya.")
    return p


def w08():
    p = Halaman("W-08", "W-08 Dokumen Kegiatan")
    p.bingkai("Gambar W-08. Rancangan Halaman Dokumen Kegiatan")
    x, y = p.kerangka(-1, "Dokumen Kegiatan", "", "")
    p.tambah("btn", x, y - 8, 100, 28, "← Kembali")
    p.tambah("judul", x + 116, y - 12, 300, 26, "Survei Tes")
    p.tambah("sub", x + 116, y + 12, 440, 16, "Ringkasan dan daftar semua dokumen terkait.")

    ky = y + 44
    for i, (judul, isi) in enumerate([("Total Dokumen", "12"), ("Approved", "0"),
                                      ("Ketua Tim", "Edianto, S.E"),
                                      ("Status Kegiatan", "Persiapan")]):
        cx = x + i * 264
        p.tambah("box", cx, ky, 248, 60, "")
        p.tambah("kecil", cx + 12, ky + 12, 180, 14, judul)
        p.tambah("teks", cx + 12, ky + 32, 200, 20, isi)

    ky += 76
    ky = p.tab(x, ky, ["Persiapan   6", "Pengumpulan Data   6"], 0, [520, 520], h=28)

    p.tambah("panel", x, ky + 10, 1040, 44, "Dokumen Persiapan")
    p.tambah("btn", x + 756, ky + 18, 100, 26, "Catatan")
    p.tambah("btnp", x + 866, ky + 18, 154, 26, "Setujui Tahap Ini")
    p.tabel(x, ky + 62,
            [("Nama Dokumen", 180), ("Penanggung Jawab", 230), ("Status", 100),
             ("Tanggal", 150), ("Last Approved", 110), ("Aksi", 70),
             ("Persetujuan", 200)],
            [["SK", "Ketua Tim | Alihkan ke Tim Keuangan", "Pending",
              "18 September 2026", "-", "ubah", "Kirim Notifikasi"],
             ["Surat Tugas", "Ketua Tim | Alihkan ke Tim Keuangan", "Pending",
              "18 September 2026", "-", "ubah", "Kirim Notifikasi"],
             ["Undangan", "Ketua Tim | Alihkan ke Tim Keuangan", "Pending",
              "18 September 2026", "-", "ubah", "Kirim Notifikasi"],
             ["Daftar Hadir", "Ketua Tim | Alihkan ke Tim Keuangan", "Pending",
              "18 September 2026", "-", "ubah", "Kirim Notifikasi"],
             ["Notulensi", "Ketua Tim | Alihkan ke Tim Keuangan", "Pending",
              "18 September 2026", "-", "ubah", "Kirim Notifikasi"],
             ["Laporan Pelatihan", "Ketua Tim | Alihkan ke Tim Keuangan", "Pending",
              "18 September 2026", "-", "ubah", "Kirim Notifikasi"]],
            tinggi_baris=26)

    ky2 = ky + 62 + 26 + 6 * 26
    p.tambah("panel", x, ky2 + 14, 1040, 54, "Perlu Menambah atau Mengedit Dokumen?")
    p.tambah("kecil", x + 12, ky2 + 38, 620, 14,
             "Gunakan halaman Edit untuk mengelola semua dokumen dan laporan.")
    p.tambah("btnp", x + 876, ky2 + 28, 144, 28, "Ke Halaman Edit")
    p.tambah("catatan", x, ky2 + 80, 600, 68,
             "Kolom Persetujuan memuat keterangan \"Link dokumen belum diisi\" selama "
             "tautannya kosong. Dokumen disimpan sebagai TAUTAN ke penyimpanan instansi, "
             "bukan berkas yang diunggah.")
    return p


def w09():
    p = Halaman("W-09", "W-09 Manajemen Honor")
    p.bingkai("Gambar W-09. Rancangan Halaman Manajemen Honor")
    x, y = p.kerangka(2, "Manajemen Honor", "Manajemen Honor PPL",
                      "Kelola akumulasi honor bulanan dengan batas honor untuk semua PPL")

    # Kendali periode berada di SUDUT KANAN ATAS, bukan sebagai baris penyaring.
    p.tambah("kecil", x + 700, y - 44, 70, 14, "Periode:")
    p.tambah("field", x + 760, y - 48, 220, 26, "01 Okt 2026 — 31 Okt 2026")
    p.tambah("btn", x + 988, y - 48, 32, 26, "ubah")
    for i, label in enumerate(["Bulan Ini", "Bulan Depan", "Triwulan Ini", "Tahun Ini"]):
        p.tambah("kecil", x + 760 + i * 68, y - 18, 68, 14, label)
    p.tambah("kecil", x + 700, y + 2, 90, 14, "Batas Honor:")
    p.tambah("box", x + 790, y - 2, 120, 22, "Rp 3.220.000")

    ky = y + 28
    for i, (judul, isi) in enumerate([("Total PPL", "4"),
                                      ("PPL Melebihi Batas", "0"),
                                      ("Total Honor Periode Ini", "Rp 5.829.000"),
                                      ("Rata-rata Honor per PPL", "Rp 1.457.250")]):
        cx = x + i * 264
        p.tambah("box", cx, ky, 248, 68, "")
        p.tambah("kecil", cx + 12, ky + 14, 200, 14, judul)
        p.tambah("teks", cx + 12, ky + 36, 200, 20, isi)

    ky += 86
    p.tambah("panel", x, ky, 1040, 58, "Akumulasi Honor PPL — 01 Okt 2026 — 31 Okt 2026")
    p.tambah("kecil", x + 12, ky + 30, 460, 14,
             "Batas Honor: Rp 3.220.000 per PPL per bulan pembayaran")
    p.tambah("field", x + 600, ky + 16, 220, 28, "Cari nama PPL...")
    p.tambah("btn", x + 830, ky + 16, 90, 28, "PDF")
    p.tambah("btn", x + 930, ky + 16, 90, 28, "Excel")

    ky2 = p.tabel(x, ky + 68,
                  [("Nama PPL", 280), ("Honor Periode Ini", 190),
                   ("Jumlah Kegiatan", 180), ("Puncak Bulanan vs Batas", 230),
                   ("Status", 160)],
                  [["Diko idianto", "Rp 384.000", "1 Kegiatan", "-Rp 2.836.000", "Normal"],
                   ["Ega Rahayu", "Rp 1.311.000", "1 Kegiatan", "-Rp 1.909.000", "Normal"],
                   ["jemmy suhandi pratama", "Rp 2.166.000", "1 Kegiatan", "-Rp 1.054.000", "Normal"],
                   ["LIDIA PALINTIKA", "Rp 1.968.000", "1 Kegiatan", "-Rp 1.252.000", "Normal"]],
                  tinggi_baris=28)
    p.tambah("kecil", x + 12, ky2 + 14, 300, 16, "Menampilkan 4 dari 4 data")
    p.tambah("dash", x + 760, ky2 + 10, 280, 24, "Baris per halaman: 10      < 1/1 >")
    p.tambah("catatan", x, ky2 + 44, 560, 72,
             "Kendali Periode dan Batas Honor hanya dapat DIUBAH oleh Tim Keuangan dan "
             "Admin; peran lain tetap melihat nilainya sebagai teks. Status bernilai "
             "Normal atau Melebihi.")
    return p


def w10():
    p = Halaman("W-10", "W-10 Daftar PPL")
    p.bingkai("Gambar W-10. Rancangan Halaman Daftar PPL (susunan Daftar PML serupa)")
    x, y = p.kerangka(1, "Daftar PPL", "Daftar PPL", "Lihat dan kelola daftar PPL")

    ky = y
    for i, (judul, isi) in enumerate([("Total PPL", "128"), ("PPL Aktif", "26"),
                                      ("PPL Non Aktif", "102"),
                                      ("Persentase Aktif", "20.3%")]):
        cx = x + i * 264
        p.tambah("box", cx, ky, 248, 68, "")
        p.tambah("kecil", cx + 12, ky + 14, 200, 14, judul)
        p.tambah("teks", cx + 12, ky + 36, 200, 20, isi)

    ky += 86
    p.tambah("panel", x, ky, 1040, 56, "Daftar PPL")
    kx = x + 300
    for isi, w in [("Semua Periode", 130), ("Semua Posisi", 130),
                   ("Semua Kecamat...", 140), ("Semua Desa", 130),
                   ("Cari ID/Nama...", 160)]:
        p.tambah("field", kx, ky + 14, w, 28, isi)
        kx += w + 10

    ky2 = p.tabel(x, ky + 66,
                  [("No", 50), ("ID", 100), ("Nama", 230), ("Posisi", 180),
                   ("Kegiatan", 120), ("Bintang", 120), ("Informasi Detail", 120),
                   ("Status", 120)],
                  [["1", "PPL052", "Adelia Oktapriani", "Pendataan", "1 Kegiatan",
                    "—", "Lihat Info", "Aktif"],
                   ["2", "PPL117", "AFZUMARNI", "Pendataan/Pengolahan", "3 Kegiatan",
                    "**** (2)", "Lihat Info", "Aktif"],
                   ["3", "PPL089", "Agung Rahmat", "Pendataan", "3 Kegiatan",
                    "*** (3)", "Lihat Info", "Aktif"],
                   ["4", "PPL085", "Amran Alfian", "Pendataan/Pengolahan", "3 Kegiatan",
                    "** (1)", "Lihat Info", "Aktif"],
                   ["5", "PPL069", "Arief Gazali", "Pendataan", "0 Kegiatan",
                    "—", "Lihat Info", "Non Aktif"]],
                  tinggi_baris=28)
    p.tambah("kecil", x + 12, ky2 + 16, 220, 16, "Menampilkan 10 dari 128 data")
    p.tambah("btn", x + 240, ky2 + 12, 110, 24, "Export Excel")
    p.tambah("dash", x + 760, ky2 + 12, 280, 24, "Baris per halaman: 10      < 1/13 >")
    p.tambah("catatan", x, ky2 + 48, 600, 92,
             "Bila dibuka lewat tombol \"Pilih dari Daftar PPL\", tiap baris diberi kotak "
             "centang dan hanya mitra yang posisinya sesuai tahap yang tampil. Mitra yang "
             "SUDAH dialokasikan tampil redup dengan kotak tercentang dan terkunci; mitra "
             "NONAKTIF tetap tampil dengan penanda, kotaknya mati dan kosong.")
    return p


def w11():
    p = Halaman("W-11", "W-11 Penilaian Mitra")
    p.bingkai("Gambar W-11. Rancangan Halaman Penilaian Mitra")
    x, y = p.kerangka(3, "Penilaian Mitra", "Penilaian Kinerja Mitra",
                      "Kelola dan nilai performa mitra pada setiap kegiatan")
    p.tambah("btnp", x + 880, y - 42, 160, 26, "Lihat Rekap Penilaian")

    ky = y
    for i, (judul, isi) in enumerate([("Total Mitra", "18"), ("Sudah Dinilai", "4"),
                                      ("Belum Dinilai", "14"), ("Rata-rata Nilai", "7.6")]):
        cx = x + i * 264
        p.tambah("box", cx, ky, 248, 68, "")
        p.tambah("kecil", cx + 12, ky + 14, 200, 14, judul)
        p.tambah("teks", cx + 12, ky + 36, 200, 20, isi)

    ky += 86
    p.tambah("panel", x, ky, 1040, 78, "Filter dan Pencarian")
    kx = x + 14
    for label, isi, w in [("Cari Mitra/Kegiatan", "Cari nama PPL...", 200),
                          ("Tahun", "2026", 180),
                          ("Triwulan", "Triwulan 3 (Jul-Sep)", 220),
                          ("Status Penilaian", "Semua Status", 190),
                          ("Tampilkan Mitra", "Mitra saya di atas", 200)]:
        p.tambah("kecil", kx, ky + 26, w, 14, label)
        p.tambah("field", kx, ky + 42, w, 28, isi)
        kx += w + 8

    ky += 92
    p.tambah("panel", x, ky, 1040, 46, "Daftar Penilaian Mitra")
    p.tambah("btn", x + 830, ky + 10, 90, 26, "PDF")
    p.tambah("btn", x + 930, ky + 10, 90, 26, "Excel")
    ky2 = p.tabel(x, ky + 56,
                  [("No", 50), ("Kegiatan", 250), ("Nama PPL", 200),
                   ("Nama PML", 250), ("Nilai", 150), ("Rata-rata", 140)],
                  [["1", "Survei Tes (Listing)", "Adelia Oktapriani",
                    "Mohammad Fathan Romdhoni, S.S.T., M.Sc", "Beri Nilai", "Belum dinilai"],
                   ["2", "SAKERNAS 2026 (Listing)", "AFZUMARNI", "Kintan Karina Suu",
                    "Edit Nilai", "4.7"],
                   ["3", "Survei RUTI 2026 (Listing)", "AFZUMARNI", "Muhamma Pasya Fitra",
                    "Beri Nilai", "Belum dinilai"],
                   ["4", "Survei RUTI 2026 (Listing)", "Agung Rahmat", "Kintan Karina Suu",
                    "Edit Nilai", "8.3"]],
                  tinggi_baris=28)
    p.tambah("catatan", x, ky2 + 16, 1040, 76,
             "Kolom Nilai memuat tombol \"Beri Nilai\" bila mitra belum dinilai dan "
             "\"Edit Nilai\" bila sudah. Baris mitra yang diawasi PML lain tidak memiliki "
             "tombol itu, dan pembatasan yang sama juga ditegakkan di server. Pengisian "
             "nilainya sendiri terjadi pada jendela sembul berisi tiga aspek skala 1-10 "
             "beserta komentar minimal 20 karakter.")
    return p


def w12():
    p = Halaman("W-12", "W-12 Rekap Penilaian")
    p.bingkai("Gambar W-12. Rancangan Halaman Rekapitulasi Penilaian Mitra")
    x, y = p.kerangka(3, "Rekapitulasi Penilaian Mitra", "", "")
    p.tambah("btn", x, y - 8, 100, 28, "← Kembali")
    p.tambah("judul", x + 116, y - 12, 420, 26, "Rekapitulasi Penilaian Mitra")
    p.tambah("sub", x + 116, y + 12, 520, 16,
             "Peringkat performa PPL berdasarkan penilaian dan jumlah kegiatan.")

    ky = y + 44
    p.tambah("panel", x, ky, 1040, 56, "Filter Data")
    p.tambah("field", x + 600, ky + 14, 200, 28, "Triwulan 3 (Jul-Sep)")
    p.tambah("field", x + 810, ky + 14, 100, 28, "2026")
    p.tambah("btn", x + 920, ky + 14, 56, 28, "PDF")
    p.tambah("btn", x + 984, ky + 14, 56, 28, "Excel")

    ky2 = p.tabel(x, ky + 66,
                  [("No", 60), ("Nama PPL", 400), ("Total Kegiatan", 200),
                   ("Rata-rata Nilai", 190), ("Nilai Akhir", 190)],
                  [["1", "jemmy suhandi pratama", "1", "9.00", "9.01"],
                   ["2", "AFZUMARNI", "2", "8.67", "8.69"],
                   ["3", "Agung Rahmat", "1", "6.33", "6.34"],
                   ["4", "YUSNADI IRIANTO", "1", "6.33", "6.34"],
                   ["5", "Adelia Oktapriani", "1", "-", "-"],
                   ["6", "Amran Alfian", "1", "-", "-"]],
                  tinggi_baris=28)
    p.tambah("kecil", x + 12, ky2 + 16, 260, 16, "Menampilkan 10 dari 17 data")
    p.tambah("dash", x + 760, ky2 + 12, 280, 24, "Baris per halaman: 10      < 1/2 >")
    p.tambah("dash", x, ky2 + 48, 540, 34,
             "Nilai Akhir = Rata-rata Nilai + (0,01 x Total Kegiatan)")
    p.tambah("catatan", x + 560, ky2 + 44, 480, 86,
             "Judul kolom Nilai Akhir dapat diklik untuk mengurutkan. Mitra yang belum "
             "dinilai tetap tercantum dengan tanda hubung, bukan dihilangkan. Triwulan "
             "ditentukan dari bulan pembebanan honor, bukan tanggal penilaian diisi.")
    return p


def w13():
    p = Halaman("W-13", "W-13 Generate Surat")
    p.bingkai("Gambar W-13. Rancangan Halaman Generate Surat")
    x, y = p.kerangka(4, "Generate Kontrak Mitra", "Generate Surat Mitra",
                      "Membuat Surat Perjanjian Kerja dan Berita Acara Serah Terima per "
                      "mitra, otomatis dari data kegiatan pada suatu periode.")

    p.tambah("panel", x, y, 1040, 110, "Periode")
    p.tambah("kecil", x + 12, y + 24, 620, 14,
             "Mitra dan kegiatan yang honornya jatuh pada rentang ini yang akan dibuatkan surat.")
    for i, (label, isi, w) in enumerate([("Bulan Honor", "Oktober", 170),
                                         ("", "2026", 90),
                                         ("Tanggal Surat", "02 Oktober 2026", 190)]):
        cx = x + 14 + (0 if i == 0 else (184 if i == 1 else 284))
        if label:
            p.tambah("kecil", cx, y + 44, w, 14, label)
        p.tambah("field", cx, y + 60, w, 26, isi)
    p.tambah("kecil", x + 500, y + 44, 120, 14, "Penomoran")
    p.tambah("kecil", x + 500, y + 60, 520, 42,
             "Nomor melanjutkan nomor tertinggi tahun 2026 (sekarang 19). Nomor kosong bisa "
             "dialokasikan di halaman Riwayat Penyuratan.")
    p.tambah("kecil", x + 14, y + 90, 470, 14,
             "Satu surat per mitra per bulan; honor lintas bulan sudah dipecah per muatan.")

    y2 = p.tab(x, y + 122,
               ["1. Atur Uraian & Beban Anggaran", "2. Generate SPK", "3. Generate BAST"],
               1, [346, 347, 347], h=30)

    p.tambah("panel", x, y2 + 10, 1040, 52,
             "Daftar Mitra — 01 Okt 2026 — 31 Okt 2026")
    p.tambah("kecil", x + 12, y2 + 34, 600, 14,
             "Nomor surat dipesan saat pertama kali digenerate dan tidak berubah bila diulang.")
    p.tambah("btn", x + 740, y2 + 20, 120, 28, "Rekap Excel")
    p.tambah("btnp", x + 870, y2 + 20, 150, 28, "Generate Semua (239)")
    p.tambah("field", x, y2 + 72, 260, 28, "Cari nama mitra atau nomor surat...")

    ky = p.tabel(x, y2 + 110,
                 [("No. Surat", 140), ("Nama Mitra", 290), ("Baris", 110),
                  ("Jangka Waktu", 250), ("Total Honor", 150), ("Aksi", 100)],
                 [["belum", "Diko idianto", "1", "01 Okt 2026 — 17 Okt 2026",
                   "Rp384.000", "PDF"],
                  ["belum", "Ega Rahayu", "1", "17 Sep 2026 — 17 Okt 2026",
                   "Rp1.311.000", "PDF"],
                  ["belum", "jemmy suhandi pratama", "1", "01 Okt 2026 — 17 Okt 2026",
                   "Rp2.166.000", "PDF"]],
                 tinggi_baris=28)
    p.tambah("catatan", x, ky + 16, 1040, 62,
             "Tab 1 mengatur uraian tugas dan kode beban anggaran per kegiatan, tab 2 "
             "menerbitkan Surat PK, dan tab 3 menerbitkan BAST yang nomornya mengikuti "
             "Surat PK mitra yang sama.")
    return p


def w14():
    p = Halaman("W-14", "W-14 Template Surat")
    p.bingkai("Gambar W-14. Rancangan Halaman Template Surat")
    x, y = p.kerangka(4, "Template Surat", "Template Surat (PK & BAST)",
                      "Data tetap yang dipakai setiap Surat PK. Bagian yang berubah per "
                      "mitra diambil otomatis dari data kegiatan.")

    p.tambah("panel", x, y, 1040, 250, "Identitas Surat")
    p.tambah("kecil", x + 12, y + 24, 400, 14, "Nama template dan pola penomoran surat.")
    p.tambah("kecil", x + 16, y + 46, 200, 14, "Nama Template")
    p.tambah("field", x + 16, y + 62, 1004, 26, "Perjanjian Kerja Petugas Kegiatan Survei")
    p.tambah("kecil", x + 16, y + 96, 200, 14, "Pola Nomor Surat PK")
    p.tambah("field", x + 16, y + 112, 1004, 26, "{nomor}/SPK/{BULAN}/{ROMAWI}/{tahun}")
    p.tambah("kecil", x + 16, y + 142, 500, 14,
             "Contoh hasil hari ini:  007/SPK/OKTOBER/X/2026")
    p.tambah("kecil", x + 16, y + 162, 200, 14, "Pola Nomor Surat BAST")
    p.tambah("field", x + 16, y + 178, 1004, 26, "{nomor}/BAST/{BULAN}/{ROMAWI}/{tahun}")
    p.tambah("kecil", x + 16, y + 208, 500, 14,
             "Contoh hasil hari ini:  007/BAST/OKTOBER/X/2026")
    # Daftar penanda adalah bagian khas halaman ini dan tidak boleh dihilangkan.
    p.tambah("kecil", x + 540, y + 142, 480, 86,
             "Penanda yang tersedia:  {nomor} nomor urut 3 digit — 007 (wajib ada); "
             "{BULAN} nama bulan huruf besar — SEPTEMBER; {bulan} angka bulan 2 digit "
             "— 09; {ROMAWI} bulan angka Romawi — IX; {tahun} tahun 4 digit "
             "— 2026.")

    y2 = y + 266
    p.tambah("panel", x, y2, 1040, 108, "Pihak Pertama")
    p.tambah("kecil", x + 12, y2 + 24, 480, 14,
             "Pejabat Pembuat Komitmen yang menandatangani surat.")
    p.tambah("kecil", x + 16, y2 + 46, 200, 14, "Nama PPK *")
    p.tambah("field", x + 16, y2 + 62, 490, 26, "Defri Ariyanto, SST.,M.M")
    p.tambah("kecil", x + 528, y2 + 46, 200, 14, "NIP PPK *")
    p.tambah("field", x + 528, y2 + 62, 490, 26, "198703172009121002")

    y3 = y2 + 124
    p.tambah("panel", x, y3, 1040, 134, "Satuan Kerja")
    p.tambah("kecil", x + 12, y3 + 24, 520, 14,
             "Dipakai pada kepala surat, Pasal 1, Pasal 2, dan Pasal 12.")
    p.tambah("kecil", x + 16, y3 + 46, 220, 14, "Nama Satuan Kerja *")
    p.tambah("field", x + 16, y3 + 62, 490, 26, "BPS Kabupaten Bengkulu Selatan")
    p.tambah("kecil", x + 528, y3 + 46, 220, 14, "Alamat Kantor")
    p.tambah("field", x + 528, y3 + 62, 490, 26, "Jl. Affan Bachsin No. 108A, Kota Manna")
    p.tambah("kecil", x + 16, y3 + 94, 220, 14, "Kota")
    p.tambah("field", x + 16, y3 + 108, 220, 22, "Manna")
    p.tambah("kecil", x + 528, y3 + 94, 260, 14, "Domisili Hukum (Pasal 12)")
    p.tambah("field", x + 528, y3 + 108, 490, 22,
             "Panitera Pengadilan Negeri Manna")
    p.tambah("btnp", x + 890, y3 + 148, 130, 28, "Simpan Template")
    return p


def w15():
    p = Halaman("W-15", "W-15 Riwayat Penyuratan")
    p.bingkai("Gambar W-15. Rancangan Halaman Riwayat Penyuratan")
    x, y = p.kerangka(4, "Riwayat Penyuratan", "Riwayat Penyuratan",
                      "Seluruh Surat PK dan BAST yang pernah terbit, termasuk yang "
                      "dibatalkan, beserta alasannya.")

    p.tambah("panel", x, y, 1040, 74, "")
    for i, (label, isi, w) in enumerate([("Tahun Surat", "2026", 150),
                                         ("Bulan Surat", "Semua bulan", 170),
                                         ("Cari Surat",
                                          "Nama mitra, nomor surat, status, catatan", 330)]):
        cx = x + 14 + sum([0, 160, 340][:i + 1][-1:]) if False else x + 14 + (0 if i == 0 else (160 if i == 1 else 340))
        p.tambah("kecil", cx, y + 12, w, 14, label)
        p.tambah("field", cx, y + 28, w, 28, isi)
    p.tambah("btn", x + 760, y + 28, 130, 28, "Export Excel")
    p.tambah("btn", x + 900, y + 28, 130, 28, "Rapikan Nomor")

    ky = y + 86
    p.tambah("box", x, ky, 120, 22, "17 surat berlaku")
    p.tambah("box", x + 128, ky, 150, 22, "Nomor kosong: 2, 6")
    p.tambah("kecil", x, ky + 26, 1040, 14,
             "Nomor kosong adalah nomor yang suratnya sudah dihapus permanen. Jejaknya tetap "
             "tercatat, dan \"Rapikan Nomor\" dapat merapatkannya.")

    ky2 = p.tabel(x, ky + 48,
                  [("Nomor", 60), ("No. SPK", 150), ("No. BAST", 150), ("Mitra", 170),
                   ("Periode", 120), ("Kegiatan", 80), ("Total Honor", 110),
                   ("Status", 110), ("Aksi", 90)],
                  [["1", "001/SPK/SEPTEMB...", "001/BAST/SEPTEM...", "AFZUMARNI",
                    "1-30 September", "2", "Rp1.424.000", "Berlaku", "batal | nota"],
                   ["3", "003/SPK/SEPTEMB...", "003/BAST/SEPTEM...", "Azizah",
                    "1-30 September", "1", "Rp628.000", "Butuh Konfirmasi", "ubah"],
                   ["4", "004/SPK/SEPTEMB...", "004/BAST/SEPTEM...", "BELLA DESTA SARI",
                    "1-30 September", "1", "Rp675.000", "Berlaku", "batal"],
                   ["5", "005/SPK/SEPTEMB...", "—", "Agung Rahmat",
                    "1-30 September", "1", "Rp98.000", "Berlaku", "batal | ubah"]],
                  tinggi_baris=28)
    p.tambah("kecil", x + 12, ky2 + 16, 260, 16, "Menampilkan 10 dari 17 data")
    p.tambah("dash", x + 760, ky2 + 12, 280, 24, "Baris per halaman: 10      < 1/2 >")
    p.tambah("catatan", x, ky2 + 48, 1040, 70,
             "Surat berstatus Batal tetap tercantum beserta nomornya, dan hanya surat batal "
             "yang dapat dihapus. Pengaturan ulang penomoran dijalankan dari jendela "
             "tersendiri yang menuntut pengetikan frasa konfirmasi \"ATUR ULANG\".")
    return p


def w16():
    p = Halaman("W-16", "W-16 Manajemen Admin")
    p.bingkai("Gambar W-16a. Rancangan Halaman Manajemen Admin")
    x, y = p.kerangka(5, "Manajemen Admin", "Manajemen Admin",
                      "Kelola pengguna sistem, ketua tim, dan PPL.")

    y = p.tab(x, y, ["Manajemen Users", "Manajemen Ketua Tim", "Manajemen PPL"], 0,
              [346, 347, 347])

    ky = y + 14
    for i, (judul, isi) in enumerate([("Total Users", "15"), ("Admin", "2"),
                                      ("Supervisor", "2"), ("User Biasa", "11")]):
        cx = x + i * 264
        p.tambah("box", cx, ky, 248, 68, "")
        p.tambah("kecil", cx + 12, ky + 14, 200, 14, judul)
        p.tambah("teks", cx + 12, ky + 36, 200, 20, isi)

    ky += 86
    p.tambah("panel", x, ky, 1040, 48, "Daftar Users")
    p.tambah("field", x + 700, ky + 10, 200, 28, "Cari username atau nama...")
    p.tambah("btnp", x + 910, ky + 10, 110, 28, "+ Tambah User")
    ky2 = p.tabel(x, ky + 58,
                  [("ID User", 130), ("Username", 180), ("Nama Lengkap", 300),
                   ("Role", 150), ("PML", 120), ("Aksi", 160)],
                  [["USR001", "admin", "admin", "Admin", "Tidak", "ubah | hapus"],
                   ["USR010", "andi", "Andi Okta Fengki, S.Si, M.Si", "User", "Tidak", "ubah | hapus"],
                   ["USR011", "edi", "Edianto, S.E", "User", "Tidak", "ubah | hapus"],
                   ["USR012", "engky", "Engky Hendarmadi R, S.E", "User", "Tidak", "ubah | hapus"],
                   ["USR004", "kharis11", "Kharis Batubara", "Admin", "Tidak", "ubah | hapus"],
                   ["USR006", "kintan", "Kintan Karina Suu", "User", "Ya", "ubah | hapus"]],
                  tinggi_baris=26)
    p.tambah("catatan", x, ky2 + 20, 1040, 76,
             "Peran pengguna hanya dapat diubah Admin, dan kolom PML menandai akun yang "
             "mengawasi mitra. Tab Manajemen Ketua Tim memuat penyalinan kepengurusan antar "
             "tahun dan penggantian nama tim; tab Manajemen PPL memuat tombol Tambah Mitra "
             "dan Impor dari Excel.")
    return p


def w16b():
    p = Halaman("W-16b", "W-16b Jendela Impor Mitra")
    p.bingkai("Gambar W-16b. Rancangan Jendela Impor Mitra dari Berkas Excel")
    p.kerangka(5, "Manajemen Admin", "", "", footer=False)
    p.tambah("dash", 220, 76, 1040, 560, "halaman Manajemen Admin di belakang jendela")
    p.tambah("overlay", 0, 0, LEBAR, TINGGI, "")

    mx, my, mw = 300, 90, 680
    p.tambah("modal", mx, my, mw, 540, "")
    p.tambah("teks", mx + 16, my + 14, 400, 20, "Impor Mitra dari Excel SOBAT")
    p.tambah("btn", mx + mw - 40, my + 12, 26, 22, "x")
    p.tambah("kecil", mx + 16, my + 36, 600, 14,
             "Periksa dulu sebelum disimpan. Belum ada satu pun data yang berubah.")

    # Ringkasan berupa deretan lencana, dengan nama berkas di paling kiri.
    p.tambah("kecil", mx + 16, my + 62, 300, 16,
             "PALAPA (Pencatatan Aktivitas & Laporan Penilaian Mitra).xlsx")
    for i, (label, w) in enumerate([("3 baru", 70), ("0 cocok", 76),
                                    ("125 perlu dipastikan", 136), ("4 bermasalah", 100)]):
        p.tambah("box", mx + 330 + sum([0, 76, 158, 300][i:i + 1]), my + 60, w, 20, label)

    p.tambah("catatan", mx + 16, my + 90, mw - 32, 52,
             "Baris bertanda \"perlu dipastikan\" hanya cocok NAMANYA, dan nama kembar itu "
             "biasa. Bawaannya dilewati; ubah menjadi \"Perbarui\" hanya bila Anda yakin itu "
             "orang yang sama.")

    p.tabel(mx + 16, my + 156,
            [("Baris", 60), ("Nama", 260), ("ID SOBAT", 120), ("Status", 130),
             ("Tindakan", 78)],
            [["2", "AFZUMARNI", "17012116517", "Perlu dipastikan", "Lewati"],
             ["3", "Elen Falen Nadia", "17012898858", "Perlu dipastikan", "Lewati"],
             ["4", "ENITA AFRILIANI", "17012898819", "Perlu dipastikan", "Lewati"],
             ["5", "Ahmad Fauzi", "17012898820", "Baru", "Tambah"],
             ["6", "(kosong)", "—", "Bermasalah", "Lewati"]],
            tinggi_baris=30)
    p.tambah("kecil", mx + 16, my + 350, 420, 28,
             "Tiap baris memuat keterangan kecil di bawah namanya, misalnya \"Nama sama "
             "dengan PPL117. Pastikan orangnya sama.\"")

    p.tambah("catatan", mx + 16, my + 390, 310, 68,
             "Wilayah pada berkas PALAPA berupa KODE BPS tanpa nama. Sistem mencocokkannya "
             "sendiri lewat kode, dan nama dipakai hanya sebagai cadangan.")
    p.tambah("catatan", mx + 346, my + 390, 318, 68,
             "Peninjauan tidak mengubah apa pun. Setelah \"Lanjut\", masih ada langkah "
             "penonaktifan mitra yang tidak ada di berkas.")

    p.tambah("btn", mx + 240, my + 480, 90, 30, "Batal")
    p.tambah("btn", mx + 338, my + 480, 110, 30, "Atur Kolom")
    p.tambah("btn", mx + 456, my + 480, 110, 30, "Hitung Ulang")
    p.tambah("btnp", mx + 574, my + 480, 90, 30, "Lanjut")
    return p


def w17():
    p = Halaman("W-17", "W-17 Pengaturan Profil")
    p.bingkai("Gambar W-17. Rancangan Halaman Pengaturan Profil")
    x, y = p.kerangka(-1, "Pengaturan Profil", "", "")

    # Isi halaman ini satu kolom sempit, bukan dua kolom selebar layar.
    p.tambah("panel", x, y, 520, 200, "Identitas Akun")
    p.tambah("kecil", x + 12, y + 26, 400, 14, "Data ini hanya dapat diubah oleh administrator.")
    p.tambah("box", x + 16, y + 48, 36, 36, "K")
    p.tambah("teks", x + 62, y + 50, 240, 18, "Kharis Batubara")
    p.tambah("kecil", x + 62, y + 68, 120, 14, "Admin")
    p.tambah("kecil", x + 16, y + 96, 200, 14, "Username")
    p.tambah("dash", x + 16, y + 112, 230, 26, "kharis11")
    p.tambah("kecil", x + 264, y + 96, 200, 14, "Nama Lengkap")
    p.tambah("dash", x + 264, y + 112, 240, 26, "Kharis Batubara")
    p.tambah("kecil", x + 16, y + 148, 488, 40,
             "Username dan nama lengkap dikunci agar identitas pada riwayat kegiatan, "
             "dokumen, dan surat kontrak tetap dapat dilacak. Hubungi administrator bila "
             "ada yang perlu diperbaiki.")

    y2 = y + 216
    p.tambah("panel", x, y2, 520, 220, "Ganti Password")
    p.tambah("kecil", x + 12, y2 + 26, 420, 14,
             "Minimal 8 karakter dan harus berbeda dari password lama.")
    p.tambah("kecil", x + 16, y2 + 50, 200, 14, "Password Lama")
    p.tambah("field", x + 16, y2 + 66, 488, 26, "")
    p.tambah("kecil", x + 16, y2 + 100, 200, 14, "Password Baru")
    p.tambah("field", x + 16, y2 + 116, 230, 26, "")
    p.tambah("kecil", x + 264, y2 + 100, 200, 14, "Ulangi Password Baru")
    p.tambah("field", x + 264, y2 + 116, 240, 26, "")
    p.tambah("kecil", x + 16, y2 + 152, 200, 14, "[ ] Tampilkan password")
    p.tambah("btnp", x + 344, y2 + 178, 160, 30, "Simpan Password Baru")

    p.tambah("catatan", x + 560, y, 480, 120,
             "Panel notifikasi dan pencarian global BUKAN bagian halaman ini: keduanya "
             "adalah panel gantung yang dibuka dari lonceng dan kotak cari di bilah atas, "
             "sehingga dapat diakses dari halaman mana pun.")
    p.tambah("dash", x + 560, y + 136, 480, 300,
             "Panel notifikasi (dibuka dari lonceng)\n\n"
             "Dikelompokkan menurut kepentingan:\n"
             "Perlu diperbaiki  |  Tenggat mendekat  |\n"
             "Perlu diisi  |  Menunggu persetujuan  |  Informasi\n\n"
             "Isinya berbeda menurut peran, dan hilang\nsendiri setelah penyebabnya selesai.")
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
                # draw.io membungkus barisnya sendiri lewat whiteSpace=wrap,
                # tetapi PNG inilah yang dipasang ke naskah: tanpa pembungkusan
                # di sini, kalimat panjang pada kotak catatan terpotong di tepi.
                lebar_boleh = s["w"] - 12
                baris = []
                for paragraf in s["teks"].split("\n"):
                    sekarang = ""
                    for kata in paragraf.split(" "):
                        coba = kata if sekarang == "" else sekarang + " " + kata
                        if d.textlength(coba, font=f) <= lebar_boleh or sekarang == "":
                            sekarang = coba
                        else:
                            baris.append(sekarang)
                            sekarang = kata
                    baris.append(sekarang)
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
