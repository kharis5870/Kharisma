# -*- coding: utf-8 -*-
"""Membuat gambar lambang untuk Tabel 2 (Komponen Activity Diagram) di Bab II.

Dua baris pada Tabel 2 memakai lambang yang tidak tersedia di kumpulan ikon UML
mana pun, yaitu Activity Group dan Merge Node, sehingga keduanya digambar di
sini. Lambang lain pada tabel itu (initial node, action, fork, join, dan
seterusnya) bentuknya umum dan tidak perlu dibuat sendiri.

Warna, ketebalan garis, dan sudut tumpulnya disalin persis dari hasil ekspor
PlantUML pada docs/diagram/out/, supaya lambang di Tabel 2 sama benar dengan
bentuk yang muncul di gambar-gambar Bab IV. Nilai-nilai itu berasal dari
_gaya.iuml dan tidak boleh diubah sendiri di berkas ini.

Activity Group sengaja digambar BERISI dua kotak aktivitas. Bingkai kosong akan
tampak sama dengan lambang Action, sehingga pembaca tidak dapat membedakannya.

Keluarannya ditimpa di out/ dalam dua bentuk: .svg untuk disisipkan ke Word
versi baru, dan .png untuk versi Word yang belum mendukung SVG.

Pemakaian:
    python docs/diagram/alat/buat_lambang.py
"""

from __future__ import annotations

import io
import os
import shutil
import subprocess
import sys
import tempfile

# Disalin dari hasil ekspor PlantUML; lihat _gaya.iuml.
GARIS_BINGKAI = "#555555"
ISI_KOTAK = "#EEF4FB"
GARIS_KOTAK = "#2F4F75"
ISI_KEPUTUSAN = "#FFF6D9"
GARIS_KEPUTUSAN = "#8A6D00"
GARIS_PANAH = "#333333"

KELUARAN = os.path.join(os.path.dirname(__file__), "..", "out")

CHROME = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]


def _bungkus(lebar: int, tinggi: int, isi: str) -> str:
    return (
        f'<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" version="1.1" '
        f'width="{lebar}px" height="{tinggi}px" viewBox="0 0 {lebar} {tinggi}">\n'
        f'<rect width="{lebar}" height="{tinggi}" fill="#FFFFFF"/>\n'
        f'{isi}</svg>\n'
    )


def _panah(x: float, y1: float, y2: float) -> str:
    return (
        f'<line x1="{x}" x2="{x}" y1="{y1}" y2="{y2}" '
        f'style="stroke:{GARIS_PANAH};stroke-width:1.1;"/>\n'
        f'<polygon points="{x-4},{y2-10} {x},{y2} {x+4},{y2-10} {x},{y2-4}" '
        f'fill="{GARIS_PANAH}" style="stroke:{GARIS_PANAH};stroke-width:1.0;"/>\n'
    )


def activity_group() -> str:
    """Bingkai berjudul yang membungkus dua kotak aktivitas."""
    lebar, tinggi = 240, 150
    bx, by, bw, bh = 10, 10, 220, 130          # bingkai luar
    tw = 132                                    # lebar tab judul,
    # dilebihkan dari lebar tulisannya supaya huruf terakhir tidak
    # tertimpa garis serongnya.
    isi = (
        f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="5" ry="5" '
        f'fill="none" style="stroke:{GARIS_BINGKAI};stroke-width:1.5;"/>\n'
        # Tab judul: garis turun lalu menyerong, persis seperti gambar PlantUML.
        f'<path d="M{bx+tw},{by} L{bx+tw},{by+17} L{bx+tw-10},{by+27} L{bx},{by+27}" '
        f'fill="none" style="stroke:{GARIS_BINGKAI};stroke-width:1.5;"/>\n'
        f'<text x="{bx+8}" y="{by+21}" font-family="Arial" font-size="13" '
        f'fill="#000000">Nama kelompok</text>\n'
    )
    for i, y in enumerate((45, 100)):
        isi += (
            f'<rect x="40" y="{y}" width="160" height="35" rx="5" ry="5" '
            f'fill="{ISI_KOTAK}" style="stroke:{GARIS_KOTAK};stroke-width:0.8;"/>\n'
            f'<text x="120" y="{y+22}" font-family="Arial" font-size="13" '
            f'fill="#000000" text-anchor="middle">Aktivitas {i+1}</text>\n'
        )
    isi += _panah(120, 80, 100)
    return _bungkus(lebar, tinggi, isi)


def merge_node() -> str:
    """Belah ketupat kecil kosong, dengan dua garis masuk dan satu garis keluar."""
    lebar, tinggi = 160, 110
    cx, cy, r = 80, 55, 13
    isi = (
        f'<line x1="30" x2="30" y1="12" y2="42" '
        f'style="stroke:{GARIS_PANAH};stroke-width:1.1;"/>\n'
        f'<line x1="30" x2="{cx-r}" y1="42" y2="{cy}" '
        f'style="stroke:{GARIS_PANAH};stroke-width:1.1;"/>\n'
        f'<line x1="130" x2="130" y1="12" y2="42" '
        f'style="stroke:{GARIS_PANAH};stroke-width:1.1;"/>\n'
        f'<line x1="130" x2="{cx+r}" y1="42" y2="{cy}" '
        f'style="stroke:{GARIS_PANAH};stroke-width:1.1;"/>\n'
        f'<polygon points="{cx},{cy-r} {cx+r},{cy} {cx},{cy+r} {cx-r},{cy}" '
        f'fill="{ISI_KEPUTUSAN}" style="stroke:{GARIS_KEPUTUSAN};stroke-width:0.8;"/>\n'
    )
    isi += _panah(cx, cy + r, tinggi - 12)
    return _bungkus(lebar, tinggi, isi)


def ke_png(svg: str, tujuan: str, skala: int = 4) -> str:
    """Merender SVG menjadi PNG lewat peramban tanpa jendela."""
    peramban = next((p for p in CHROME if os.path.exists(p)), None)
    if peramban is None:
        return "peramban tidak ditemukan, PNG dilewati"

    import re
    m = re.search(r'width="(\d+)px" height="(\d+)px"', svg)
    w, h = int(m.group(1)), int(m.group(2))

    tmp = tempfile.mkdtemp()
    try:
        berkas = os.path.join(tmp, "l.svg")
        io.open(berkas, "w", encoding="utf-8").write(svg)
        subprocess.run(
            [peramban, "--headless", "--disable-gpu", "--hide-scrollbars",
             f"--screenshot={os.path.join(tmp, 'l.png')}",
             f"--window-size={w},{h}", f"--force-device-scale-factor={skala}",
             "file:///" + berkas.replace("\\", "/")],
            capture_output=True, timeout=90,
        )
        hasil = os.path.join(tmp, "l.png")
        if not os.path.exists(hasil):
            return "render gagal, PNG dilewati"
        shutil.move(hasil, tujuan)
        return f"{w*skala} x {h*skala} piksel"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    os.makedirs(KELUARAN, exist_ok=True)
    for nama, buat in (("lambang-activity-group", activity_group),
                       ("lambang-merge-node", merge_node)):
        svg = buat()
        jalur = os.path.join(KELUARAN, nama + ".svg")
        io.open(jalur, "w", encoding="utf-8", newline="\n").write(svg)
        png = ke_png(svg, os.path.join(KELUARAN, nama + ".png"))
        print(f"{nama}: svg ditulis, png {png}")
