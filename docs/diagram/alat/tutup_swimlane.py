# -*- coding: utf-8 -*-
"""Menambahkan garis penutup pada diagram aktivitas ber-swimlane.

PlantUML menggambar lajur swimlane hanya sebagai garis tegak: tidak ada garis
mendatar di atas maupun di bawah, dan tidak ada pemisah di bawah baris judul
peran. Akibatnya diagramnya terlihat menggantung saat dicetak di naskah.

Setelan bawaan PlantUML tidak menyediakannya. `skinparam swimlaneTitleBackgroundColor`
sudah dicoba dan tidak dihormati versi yang dipakai di sini (plantuml.jar pada
ekstensi jebbs.plantuml-2.18.1), sehingga ketiga garis itu ditambahkan langsung
ke berkas SVG hasil ekspor.

Cara kerjanya: garis lajur dikenali dari warnanya (#555555 pada _gaya.iuml) dan
dari panjangnya yang hampir setinggi gambar. Dari kumpulan garis itu diperoleh
tepi kiri, tepi kanan, tepi atas, dan tepi bawah, lalu tiga garis mendatar
disisipkan. Letak pemisah judul dihitung di tengah antara garis dasar teks judul
dan unsur gambar pertama.

PENTING: skrip ini WAJIB dijalankan ulang setiap kali diagram diekspor ulang,
karena ekspor menimpa SVG-nya dan garis tambahan ini ikut hilang. Berkas hasilnya
ditimpa di tempat yang sama, bukan disalin ke nama baru.

Pemakaian:
    python docs/diagram/alat/tutup_swimlane.py docs/diagram/out/proses-berjalan.svg
    python docs/diagram/alat/tutup_swimlane.py docs/diagram/out/*.svg
"""

from __future__ import annotations

import io
import re
import sys

WARNA_LAJUR = "#555555"
PENANDA = "tutup-swimlane"


def _angka(pola: str, teks: str) -> float | None:
    m = re.search(pola, teks)
    return float(m.group(1)) if m else None


def tutup(berkas: str) -> str:
    # Satu berkas di folder keluaran berekstensi .svg tetapi isinya PNG
    # (10-fishbone.svg, dibuat di luar PlantUML), jadi isinya diperiksa dulu
    # alih-alih mempercayai ekstensinya.
    try:
        isi = io.open(berkas, encoding="utf-8").read()
    except UnicodeDecodeError:
        return "bukan berkas teks SVG, dilewati"

    if "<svg" not in isi:
        return "bukan berkas SVG, dilewati"

    if PENANDA in isi:
        return "sudah ditutup sebelumnya, dilewati"

    # 1. Kumpulkan garis tegak berwarna lajur.
    lajur = []
    for g in re.findall(r"<line[^>]*/>", isi):
        if WARNA_LAJUR not in g:
            continue
        x1, x2 = _angka(r'x1="([\d.]+)"', g), _angka(r'x2="([\d.]+)"', g)
        y1, y2 = _angka(r'y1="([\d.]+)"', g), _angka(r'y2="([\d.]+)"', g)
        if None in (x1, x2, y1, y2) or abs(x1 - x2) > 0.01:
            continue
        lajur.append((x1, min(y1, y2), max(y1, y2)))

    if len(lajur) < 3:
        return "bukan diagram ber-swimlane, dilewati"

    # Garis lajur adalah yang terpanjang; garis tegak pendek adalah panah.
    tertinggi = max(b - a for _, a, b in lajur)
    lajur = [l for l in lajur if (l[2] - l[1]) > tertinggi * 0.9]

    kiri = min(l[0] for l in lajur)
    kanan = max(l[0] for l in lajur)
    atas = min(l[1] for l in lajur)
    bawah = max(l[2] for l in lajur)

    # Dua penjaga terhadap salah sasaran. Diagram arsitektur, misalnya, memuat
    # satu garis tegak berwarna sama yang bukan pembatas lajur: tanpa kedua
    # syarat ini, garis sepanjang nol akan disisipkan ke berkas yang keliru.
    if len({round(l[0], 1) for l in lajur}) < 3 or (kanan - kiri) < 100:
        return "bukan diagram ber-swimlane, dilewati"

    # 2. Cari garis dasar teks judul peran, yaitu teks paling atas.
    teks_y = [float(y) for y in re.findall(r"<text[^>]*\by=\"([\d.]+)\"", isi)]
    judul_y = min(teks_y) if teks_y else atas + 20
    judul_y = max(y for y in teks_y if y < judul_y + 1.5) if teks_y else judul_y

    # 3. Cari unsur gambar pertama di bawah judul.
    bentuk_y = []
    for pola in (r"<rect[^>]*\by=\"([\d.]+)\"",
                 r"<ellipse[^>]*\bcy=\"([\d.]+)\"[^>]*\bry=\"([\d.]+)\""):
        for m in re.finditer(pola, isi):
            if m.lastindex == 2:
                bentuk_y.append(float(m.group(1)) - float(m.group(2)))
            else:
                bentuk_y.append(float(m.group(1)))
    sesudah_judul = [y for y in bentuk_y if y > judul_y]
    pemisah_y = (judul_y + min(sesudah_judul)) / 2 if sesudah_judul else judul_y + 10

    gaya = f'style="stroke:{WARNA_LAJUR};stroke-width:1.0;"'
    tambahan = (
        f'<!-- {PENANDA}: garis penutup atas, bawah, dan pemisah judul -->\n'
        f'<line {gaya} x1="{kiri}" x2="{kanan}" y1="{atas}" y2="{atas}"/>\n'
        f'<line {gaya} x1="{kiri}" x2="{kanan}" y1="{pemisah_y:.4f}" y2="{pemisah_y:.4f}"/>\n'
        f'<line {gaya} x1="{kiri}" x2="{kanan}" y1="{bawah}" y2="{bawah}"/>\n'
    )

    isi = isi.replace("</svg>", tambahan + "</svg>")
    io.open(berkas, "w", encoding="utf-8", newline="\n").write(isi)
    return (f"{len(lajur)} lajur; atas y={atas:.1f}, pemisah judul y={pemisah_y:.1f}, "
            f"bawah y={bawah:.1f}, lebar {kiri:.0f}–{kanan:.0f}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("pemakaian: tutup_swimlane.py <berkas.svg> [berkas lain...]")
    for berkas in sys.argv[1:]:
        print(f"{berkas}: {tutup(berkas)}")
