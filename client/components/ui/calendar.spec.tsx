import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { id as localeID } from "date-fns/locale";

const html = renderToStaticMarkup(
  React.createElement(Calendar, {
    mode: "range",
    selected: { from: new Date(2026, 5, 10), to: new Date(2026, 5, 20) },
    month: new Date(2026, 5, 1),
    captionLayout: "dropdown",
    startMonth: new Date(2021, 0),
    endMonth: new Date(2031, 11),
    locale: localeID,
  } as any),
);

/** Kelas pada elemen pertama yang cocok dengan sebuah pola. */
const kelasDari = (pola: RegExp): string => html.match(pola)?.[1] ?? "";

describe("Calendar (react-day-picker v9)", () => {
  it("menerapkan kelas kita pada elemen v9 yang benar", () => {
    // Kalau nama elemen v9 salah, kelas ini tidak akan muncul sama sekali.
    expect(html).toContain("border-collapse");
    expect(kelasDari(/<th[^>]*class="([^"]*)"/)).toContain("text-muted-foreground");
  });

  // Inti perbaikan perataan: sel nama hari dan sel tanggal harus memakai
  // ukuran yang PERSIS sama. Dulu hanya <th> yang punya lebar (w-9) sedangkan
  // <td> dibiarkan otomatis, sehingga kolomnya bergeser.
  it("sel nama hari dan sel tanggal memakai lebar yang sama", () => {
    const namaHari = kelasDari(/<th[^>]*class="([^"]*)"/);
    const selTanggal = kelasDari(/<td[^>]*class="([^"]*)"/);
    expect(namaHari).toContain("w-9");
    expect(selTanggal).toContain("w-9");
    // Kedua baris memakai mekanisme tata letak yang sama (flex), bukan satu
    // baris flex dan satunya tabel.
    expect(kelasDari(/<tr[^>]*class="([^"]*)"(?=[^>]*>\s*<th)/)).toContain("flex");
    expect(kelasDari(/<tr[^>]*class="([^"]*)"(?=[^>]*>\s*<td)/)).toContain("flex");
  });

  it("jumlah kolom nama hari sama dengan jumlah kolom tanggal per minggu", () => {
    const jumlahNamaHari = (html.match(/<th[^>]*scope="col"/g) || []).length;
    const barisMinggu = (html.match(/<tr/g) || []).length - 1;
    const jumlahSelTanggal = (html.match(/role="gridcell"/g) || []).length;
    expect(jumlahNamaHari).toBe(7);
    expect(barisMinggu).toBeGreaterThan(0);
    expect(jumlahSelTanggal).toBe(barisMinggu * 7);
  });

  // v9 merender <nav> sebagai anak `months`, bukan anak caption. Tanpa
  // `relative` di `months`, nav yang absolute melompat ke popover dan
  // menyeret lebar kalender jadi selebar layar.
  it("months menjadi jangkar posisi untuk nav", () => {
    const months = kelasDari(/<div class="((?:[^"]*\bflex\b[^"]*))"[^>]*>\s*<nav/);
    expect(months).toContain("relative");
    expect(kelasDari(/<nav[^>]*class="([^"]*)"/)).toContain("absolute");
  });

  it("menampilkan dropdown bulan dan tahun", () => {
    expect(html).toContain("rdp-months_dropdown");
    expect(html).toContain("rdp-years_dropdown");
  });

  // v9 merender <select> asli DAN <span> label. Select harus transparan
  // menutupi label, kalau tidak teks bulan tampil dobel.
  it("select dropdown ditumpuk transparan di atas labelnya", () => {
    const select = kelasDari(/<select[^>]*class="([^"]*)"/);
    expect(select).toContain("opacity-0");
    expect(select).toContain("absolute");
  });

  it("menandai awal, tengah, dan akhir rentang", () => {
    expect(html).toContain("rounded-l-md");
    expect(html).toContain("rounded-r-md");
    expect(html).toContain("bg-accent rounded-none");
  });

  it("memakai nama hari Bahasa Indonesia", () => {
    expect(html).toMatch(/Sen/);
    expect(html).toMatch(/Jun/i);
  });

  // Regresi: store zustand yang di-persist mengembalikan field Date sebagai
  // string ISO setelah rehydrate. `month`/`defaultMonth` string dulu membuat
  // date-fns melempar "Invalid time value" dan layar jadi putih total.
  it("tidak crash saat month/defaultMonth berupa string atau Invalid Date", () => {
    for (const bulan of [
      "2026-02-01T00:00:00.000Z" as unknown as Date,
      "2026-02-01" as unknown as Date,
      new Date("bukan tanggal"),
      undefined,
    ]) {
      expect(() =>
        renderToStaticMarkup(
          React.createElement(Calendar, { mode: "single", month: bulan, defaultMonth: bulan } as any),
        ),
      ).not.toThrow();
    }
  });
});
