import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Label menu yang tidak muat harus tetap bisa dibaca.
 *
 * Submenu digambar menjorok ke dalam (`pl-6 border-l ml-6`), sehingga ruang
 * untuk teksnya lebih sempit daripada menu tingkat atas. "Riwayat Penyuratan"
 * adalah label pertama yang melewati batas itu dan terpotong begitu saja —
 * tanpa elipsis, dan tanpa cara apa pun untuk melihat sisanya.
 *
 * Dua hal yang memperbaikinya, dan keduanya dikunci di sini:
 *
 * 1. ELIPSIS. `overflow-hidden whitespace-nowrap` saja memotong teks di tengah
 *    huruf, sehingga terlihat seperti label yang memang pendek dan aneh, bukan
 *    seperti teks yang terpotong.
 *
 * 2. TOOLTIP YANG TIDAK DIMATIKAN SAAT SIDEBAR TERBUKA. Dulu tooltip hanya
 *    muncul ketika sidebar tertutup, dengan alasan "kalau terbuka labelnya
 *    sudah tertulis". Alasan itu tepat untuk label pendek dan salah justru
 *    untuk label yang terpotong — keadaan yang paling membutuhkannya.
 *
 * Repo ini tidak merender komponen dalam pengujian, jadi yang diperiksa adalah
 * teks sumbernya setelah komentar dibuang, supaya penjelasan di atas tidak ikut
 * terhitung sebagai bukti.
 */

const sumber = (() => {
  const mentah = readFileSync(new URL("./Sidebar.tsx", import.meta.url), "utf-8");
  return mentah
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter(baris => !baris.trim().startsWith("//"))
    .join("\n");
})();

describe("label menu sidebar", () => {
  it("dipotong dengan elipsis, bukan terputus begitu saja", () => {
    expect(sumber).toContain("text-ellipsis");
    // min-w-0 diperlukan agar anak flex benar-benar mau menyusut; tanpa itu
    // elipsisnya tidak pernah muncul.
    expect(sumber).toContain("min-w-0");
  });

  it("tooltip muncul saat sidebar tertutup ATAU saat labelnya terpotong", () => {
    // Bukan "selalu": saat sidebar terbuka dan labelnya muat, tooltip hanya
    // menjadi gangguan. Yang dibutuhkan justru perkecualiannya — label yang
    // tidak muat, seperti "Riwayat Penyuratan" di dalam submenu.
    const mulai = sumber.indexOf("const SidebarLink");
    expect(mulai, "SidebarLink tidak ditemukan").toBeGreaterThan(-1);
    const badan = sumber.slice(mulai, sumber.indexOf("const SidebarDropdown"));

    expect(badan).toContain("tampil={!isExpanded || terpotong}");
  });

  it("terpotongnya DIUKUR dari elemennya, bukan ditebak dari panjang teks", () => {
    // Lebar tiap huruf berbeda dan lebar submenu berbeda dari menu utama, jadi
    // ambang berbasis jumlah karakter pasti meleset di salah satu sisi.
    expect(sumber).toContain("scrollWidth > el.clientWidth");
  });

  it("pengukuran diulang setelah animasi lebar selesai", () => {
    // Lebar label dianimasikan 300ms. Mengukur tepat setelah sidebar dibuka
    // membaca lebar setengah jalan dan mengunci vonis yang keliru, tanpa ada
    // render berikutnya yang membetulkannya.
    expect(sumber).toContain("addEventListener('transitionend'");
    expect(sumber).toContain("removeEventListener('transitionend'");
  });

  it("menu beranak juga bertooltip saat sidebar diminimalkan", () => {
    // "Daftar" dan "Keuangan" hanya menampilkan ikon saat tertutup; namanya
    // dulu cuma ada di aria-label, terbaca pembaca layar tapi tidak oleh mata.
    expect(sumber).toContain("<BungkusTooltip tampil label={item.label}>");
  });

  it("tooltip masih memakai label menu yang sama", () => {
    // Penjaga anti-hampa: kalau pembungkusnya hilang sama sekali, tes di atas
    // tetap hijau padahal tooltipnya sudah tidak ada.
    expect(sumber).toContain("const BungkusTooltip");
    expect(sumber).toMatch(/TooltipContent[^>]*>\{label\}<\/TooltipContent>/);
  });
});
