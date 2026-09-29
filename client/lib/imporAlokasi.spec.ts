import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { bacaBerkasAlokasi, KOLOM_TEMPLATE_ALOKASI } from "./bacaBerkasAlokasi";
import {
  bacaBarisAlokasi, bacaBebanKerja, cariBarisHeaderAlokasi, cocokkanBarisAlokasi,
  cocokkanPml, kolomWajibAlokasiHilang, normalkanTahap,
  petakanKolomAlokasi, ringkasImporAlokasi, susunAlokasiImpor, tandaiBarisKembar,
  tandaiSudahDialokasikan,
  type MitraRef, type PmlRef,
} from "@shared/imporAlokasi";

/**
 * Pembacaan berkas impor alokasi mitra.
 *
 * Yang dikunci di sini adalah kesalahan yang TIDAK menimbulkan galat, hanya
 * data yang keliru: mitra yang salah orang, PML yang salah orang, tahap yang
 * salah, dan beban kerja yang terbaca sebagai angka lain.
 */

const HEADER = ["SOBAT ID", "Nama Mitra", "Tahap", "PML", "Beban Kerja"];

const MITRA: MitraRef[] = [
  { id: "PPL001", sobatId: "170122030011", nama: "Riwi Indarti", aktif: true },
  { id: "PPL002", sobatId: "170122090097", nama: "Muhammad Zain", aktif: true },
  { id: "PPL003", sobatId: null, nama: "Siti Aminah", aktif: true },
  { id: "PPL004", sobatId: null, nama: "Siti Aminah", aktif: true },   // nama kembar
  { id: "PPL005", sobatId: "170123110999", nama: "Mitra Berhenti", aktif: false },
];

/** Bergelar, seperti nama pegawai sebenarnya di aplikasi ini. */
const PML: PmlRef[] = [
  { id: "USR011", nama: "Edianto, S.E" },
  { id: "USR015", nama: "Rossi Bettega, S.E." },
  { id: "USR018", nama: "Yayuk Kurnia Ningsih, S.I.Kom." },
  { id: "USR021", nama: "Wilson, S.E." },
];

describe("pemetaan kolom", () => {
  it("kelima kolom templat dikenali", () => {
    const peta = petakanKolomAlokasi(HEADER);
    expect(peta.sobatId).toBe(0);
    expect(peta.nama).toBe(1);
    expect(peta.tahap).toBe(2);
    expect(peta.pml).toBe(3);
    expect(peta.bebanKerja).toBe(4);
  });

  it("cukup salah satu dari ID SOBAT atau nama", () => {
    expect(kolomWajibAlokasiHilang(petakanKolomAlokasi(["Nama", "Tahap", "Beban Kerja"])))
      .toHaveLength(0);
    expect(kolomWajibAlokasiHilang(petakanKolomAlokasi(["SOBAT ID", "Tahap", "Muatan"])))
      .toHaveLength(0);
    // Tanpa keduanya, tidak ada cara mengenali mitranya.
    expect(kolomWajibAlokasiHilang(petakanKolomAlokasi(["Tahap", "Beban Kerja"])))
      .toContain("nama");
  });

  it("kolom metode dan bulan pembebanan tidak lagi dikenali", () => {
    // Keduanya dipindahkan ke form: lihat alasannya di kepala shared/imporAlokasi.
    const peta = petakanKolomAlokasi(
      [...HEADER, "Metode Pembebanan", "Bulan"]) as Record<string, number | null>;
    expect(peta.metode).toBeUndefined();
    expect(peta.bulan).toBeUndefined();
  });

  it("baris judul di atas header tidak membuat berkas gagal dibaca", () => {
    const baris = [["Alokasi Mitra Survei X"], [], HEADER, ["170122030011"]];
    expect(cariBarisHeaderAlokasi(baris)).toBe(2);
  });
});

describe("normalkanTahap", () => {
  it("ejaan yang biasa dipakai dikenali", () => {
    expect(normalkanTahap("Listing")).toBe("listing");
    expect(normalkanTahap("PENCACAHAN")).toBe("pencacahan");
    expect(normalkanTahap("Pengolahan")).toBe("pengolahan-analisis");
    expect(normalkanTahap("pengolahan-analisis")).toBe("pengolahan-analisis");
    expect(normalkanTahap("entri")).toBe("pengolahan-analisis");
  });

  it("tidak dikenali menghasilkan null, bukan tebakan", () => {
    expect(normalkanTahap("Supervisi")).toBeNull();
    expect(normalkanTahap("")).toBeNull();
  });
});

describe("bacaBebanKerja", () => {
  it("angka dengan pemisah ribuan tetap terbaca", () => {
    expect(bacaBebanKerja("1.250")).toBe(1250);
    expect(bacaBebanKerja(32)).toBe(32);
  });

  it("nol, negatif, dan pecahan ditolak", () => {
    // Beban kerja adalah unit utuh; 2,5 dokumen tidak ada artinya.
    expect(bacaBebanKerja("0")).toBeNull();
    expect(bacaBebanKerja("-5")).toBeNull();
    expect(bacaBebanKerja("2,5")).toBeNull();
    expect(bacaBebanKerja("dua")).toBeNull();
  });
});

describe("cocokkanPml", () => {
  it("nama panggilan saja sudah cukup", () => {
    // Inilah yang sebenarnya ditulis orang: nama depan, tanpa gelar.
    expect(cocokkanPml("Edianto", PML).pml?.id).toBe("USR011");
    expect(cocokkanPml("Rossi", PML).pml?.id).toBe("USR015");
    expect(cocokkanPml("Yayuk", PML).pml?.id).toBe("USR018");
  });

  it("nama belakang atau tengah juga menunjuk orang yang sama", () => {
    expect(cocokkanPml("Bettega", PML).pml?.id).toBe("USR015");
    expect(cocokkanPml("Ningsih", PML).pml?.id).toBe("USR018");
    expect(cocokkanPml("Kurnia", PML).pml?.id).toBe("USR018");
  });

  it("nama lengkap bergelar tetap cocok, apa pun tanda bacanya", () => {
    expect(cocokkanPml("Rossi Bettega, S.E.", PML).pml?.id).toBe("USR015");
    expect(cocokkanPml("rossi bettega se", PML).pml?.id).toBe("USR015");
    expect(cocokkanPml("Edianto, SE", PML).pml?.id).toBe("USR011");
  });

  it("gelar sendirian tidak pernah mencocokkan siapa pun", () => {
    // Tanpa penjaga ini, "S.E." akan cocok ke separuh kantor.
    expect(cocokkanPml("S.E.", PML).pml).toBeUndefined();
    expect(cocokkanPml("S.E.", PML).ganda).toBeUndefined();
  });

  it("cocok ke beberapa orang dilaporkan ganda, tidak ditebak", () => {
    const banyakRossi: PmlRef[] = [
      { id: "A", nama: "Rossi Bettega, S.E." },
      { id: "B", nama: "Rossi Andriani" },
    ];
    const hasil = cocokkanPml("Rossi", banyakRossi);
    expect(hasil.pml).toBeUndefined();
    expect(hasil.ganda?.map(p => p.id)).toEqual(["A", "B"]);
  });

  it("nama yang persis cocok menang atas nama lain yang mengandungnya", () => {
    // "Wilson" persis sama dengan satu orang; kalau lapisannya digabung, ia
    // akan bertabrakan dengan "Wilson Pratama" dan keduanya jadi ganda.
    const daftar: PmlRef[] = [
      { id: "A", nama: "Wilson" },
      { id: "B", nama: "Wilson Pratama" },
    ];
    expect(cocokkanPml("Wilson", daftar).pml?.id).toBe("A");
  });

  it("teks terlalu pendek tidak dicocokkan sebagian", () => {
    expect(cocokkanPml("Ed", PML).pml).toBeUndefined();
    expect(cocokkanPml("", PML).pml).toBeUndefined();
  });

  it("nama yang tidak ada tetap tidak dikenali", () => {
    expect(cocokkanPml("Entah Siapa", PML).pml).toBeUndefined();
  });
});

describe("cocokkanBarisAlokasi", () => {
  const peta = petakanKolomAlokasi(HEADER);
  const baca = (sel: unknown[]) => bacaBarisAlokasi(sel, peta, 2);

  it("ID SOBAT didahulukan atas nama", () => {
    // Nama sengaja ditulis keliru; ID SOBAT yang menentukan.
    const hasil = cocokkanBarisAlokasi(
      baca(["170122030011", "Nama Salah Ketik", "Listing", "Edianto", "32"]),
      MITRA, PML);
    expect(hasil.mitraId).toBe("PPL001");
    expect(hasil.pmlId).toBe("USR011");
    expect(hasil.masalah).toHaveLength(0);
  });

  it("nama mitra kembar ditolak, tidak ditebak", () => {
    const hasil = cocokkanBarisAlokasi(
      baca(["", "Siti Aminah", "Listing", "Edianto", "10"]), MITRA, PML);
    expect(hasil.masalah).toContain("mitra-ganda");
    expect(hasil.mitraId).toBeNull();
  });

  it("mitra nonaktif dilaporkan tetapi tetap dikenali", () => {
    const hasil = cocokkanBarisAlokasi(
      baca(["170123110999", "", "Listing", "Edianto", "10"]), MITRA, PML);
    expect(hasil.mitraId).toBe("PPL005");
    expect(hasil.masalah).toEqual(["mitra-nonaktif"]);
  });

  it("PML yang tidak dikenali dilaporkan", () => {
    const hasil = cocokkanBarisAlokasi(
      baca(["170122030011", "", "Listing", "Entah Siapa", "10"]), MITRA, PML);
    expect(hasil.masalah).toContain("pml-tidak-dikenali");
    expect(hasil.pmlId).toBeNull();
  });

  it("PML yang cocok ke beberapa orang menyebut siapa saja mereka", () => {
    const banyak: PmlRef[] = [
      { id: "A", nama: "Rossi Bettega, S.E." },
      { id: "B", nama: "Rossi Andriani" },
    ];
    const hasil = cocokkanBarisAlokasi(
      baca(["170122030011", "", "Listing", "Rossi", "10"]), MITRA, banyak);
    expect(hasil.masalah).toContain("pml-ganda");
    expect(hasil.pesan.join(" ")).toContain("Rossi Andriani");
  });

  it("tahap dan beban kerja yang tidak sah dilaporkan", () => {
    const hasil = cocokkanBarisAlokasi(
      baca(["170122030011", "", "Supervisi", "Edianto", "0"]), MITRA, PML);
    expect(hasil.masalah).toContain("tahap-tidak-dikenali");
    expect(hasil.masalah).toContain("beban-tidak-sah");
  });
});

describe("tandaiBarisKembar", () => {
  const peta = petakanKolomAlokasi(HEADER);
  const cocok = (sel: unknown[], nomor: number) =>
    cocokkanBarisAlokasi(bacaBarisAlokasi(sel, peta, nomor), MITRA, PML);

  it("mitra sama pada tahap BERBEDA bukan kembar", () => {
    const hasil = tandaiBarisKembar([
      cocok(["170122030011", "", "Listing", "Edianto", "10"], 2),
      cocok(["170122030011", "", "Pencacahan", "Edianto", "10"], 3),
    ]);
    expect(hasil.every(h => !h.masalah.includes("baris-kembar"))).toBe(true);
  });

  it("mitra sama pada tahap sama ditandai keduanya", () => {
    const hasil = tandaiBarisKembar([
      cocok(["170122030011", "", "Listing", "Edianto", "10"], 2),
      cocok(["170122030011", "", "Listing", "Edianto", "20"], 3),
    ]);
    expect(hasil.every(h => h.masalah.includes("baris-kembar"))).toBe(true);
  });
});

describe("tandaiSudahDialokasikan", () => {
  const peta = petakanKolomAlokasi(HEADER);
  const cocok = (sel: unknown[], nomor: number) =>
    cocokkanBarisAlokasi(bacaBarisAlokasi(sel, peta, nomor), MITRA, PML);

  it("mitra yang sudah dialokasikan di tahap itu dilewati", () => {
    // Mengimpor berkas yang sama dua kali tidak boleh melipatgandakan honor.
    const hasil = tandaiSudahDialokasikan(
      [cocok(["170122030011", "", "Listing", "Edianto", "10"], 2)],
      [{ mitraId: "PPL001", tahap: "listing" }]);
    expect(hasil[0].masalah).toContain("sudah-dialokasikan");
  });

  it("alokasi di tahap lain tidak menghalangi", () => {
    const hasil = tandaiSudahDialokasikan(
      [cocok(["170122030011", "", "Pencacahan", "Edianto", "10"], 2)],
      [{ mitraId: "PPL001", tahap: "listing" }]);
    expect(hasil[0].masalah).toHaveLength(0);
  });
});

describe("susunAlokasiImpor", () => {
  const peta = petakanKolomAlokasi(HEADER);
  const cocok = (sel: unknown[], nomor = 2) =>
    cocokkanBarisAlokasi(bacaBarisAlokasi(sel, peta, nomor), MITRA, PML);

  it("honor dihitung dari harga satuan form, bukan dari berkas", () => {
    const hasil = susunAlokasiImpor(
      [cocok(["170122030011", "", "Listing", "Edianto", "32"])],
      { listing: 15000 });
    expect(hasil).toHaveLength(1);
    expect(hasil[0].mitraId).toBe("PPL001");
    expect(hasil[0].pmlId).toBe("USR011");
    expect(hasil[0].bebanKerja).toBe(32);
    expect(hasil[0].besaranHonor).toBe(480000);
    expect(hasil[0].jenisPekerjaan).toBe("listing");
  });

  it("harga satuan yang belum diisi menghasilkan honor nol, bukan penolakan", () => {
    // Urutan kerja yang wajar: tempel dulu daftar mitranya, harga menyusul.
    const hasil = susunAlokasiImpor(
      [cocok(["170122030011", "", "Pengolahan", "Edianto", "120"])], {});
    expect(hasil).toHaveLength(1);
    expect(hasil[0].besaranHonor).toBe(0);
    expect(hasil[0].jenisPekerjaan).toBe("pengolahan");
  });

  it("PML tidak dikenali hanya peringatan; barisnya tetap terpakai tanpa PML", () => {
    const hasil = susunAlokasiImpor(
      [cocok(["170122030011", "", "Listing", "Entah Siapa", "10"])],
      { listing: 1000 });
    expect(hasil).toHaveLength(1);
    expect(hasil[0].pmlId).toBeNull();
  });

  it("baris bermasalah berat tidak ikut tersusun", () => {
    const hasil = susunAlokasiImpor([
      cocok(["", "Siti Aminah", "Listing", "Edianto", "10"], 2),      // ganda
      cocok(["170122030011", "", "Supervisi", "Edianto", "10"], 3),   // tahap salah
      cocok(["170122030011", "", "Listing", "Edianto", "0"], 4),      // beban salah
    ], { listing: 1000 });
    expect(hasil).toHaveLength(0);
  });
});

describe("ringkasImporAlokasi", () => {
  const peta = petakanKolomAlokasi(HEADER);
  const cocok = (sel: unknown[], nomor: number) =>
    cocokkanBarisAlokasi(bacaBarisAlokasi(sel, peta, nomor), MITRA, PML);

  it("memisahkan siap, perlu diperiksa, dan ditolak", () => {
    const r = ringkasImporAlokasi([
      cocok(["170122030011", "", "Listing", "Edianto", "10"], 2),        // siap
      cocok(["170123110999", "", "Pencacahan", "Edianto", "10"], 3),     // nonaktif
      cocok(["", "Siti Aminah", "Listing", "Edianto", "10"], 4),         // ditolak
    ]);
    expect(r.siap).toBe(2);
    expect(r.perluDiperiksa).toBe(1);
    expect(r.ditolak).toBe(1);
    expect(r.perTahap.listing).toBe(1);
    expect(r.perTahap.pencacahan).toBe(1);
  });
});

describe("pembacaan berkas", () => {
  const buatBerkas = async (lembar: { nama: string; baris: unknown[][] }[]): Promise<File> => {
    const wb = new ExcelJS.Workbook();
    for (const l of lembar) {
      const ws = wb.addWorksheet(l.nama);
      l.baris.forEach(b => ws.addRow(b));
    }
    const isi = await wb.xlsx.writeBuffer();
    return new File([isi], "uji.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  };

  it("menemukan lembar alokasi walau bukan lembar pertama", async () => {
    const berkas = await buatBerkas([
      { nama: "Catatan", baris: [["Jangan hapus rumus"], ["baris lain"]] },
      { nama: "Alokasi", baris: [HEADER, ["170122030011", "Riwi Indarti", "Listing", "Edianto", 32]] },
    ]);
    const baris = await bacaBerkasAlokasi(berkas);
    expect(cariBarisHeaderAlokasi(baris)).toBe(0);
    expect(baris[1][1]).toBe("Riwi Indarti");
  });

  it("berkas dengan kolom lama tetap terbaca, kolom berlebihnya diabaikan", async () => {
    // Berkas yang terlanjur disusun dengan templat versi sebelumnya tidak boleh
    // mendadak gagal hanya karena dua kolomnya sudah tidak dipakai.
    const berkas = await buatBerkas([
      { nama: "Alokasi", baris: [
        [...HEADER, "Metode Pembebanan", "Bulan"],
        ["170122030011", "Riwi Indarti", "Listing", "Edianto", 32, "Prorata", "10-2026"]] },
    ]);
    const baris = await bacaBerkasAlokasi(berkas);
    const peta = petakanKolomAlokasi(baris[0]);
    const dibaca = bacaBarisAlokasi(baris[1], peta, 2);
    expect(dibaca.tahap).toBe("listing");
    expect(dibaca.bebanKerja).toBe(32);
  });

  it("templat yang diunduh bisa dibaca kembali oleh pembacanya sendiri", async () => {
    // Berkas ekspor aplikasi ini sendiri pernah gagal diimpor kembali; itu
    // kesalahan yang hanya ketahuan dengan menguji bolak-balik.
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Alokasi");
    ws.addRow(KOLOM_TEMPLATE_ALOKASI.map(k => k.judul));
    const peta = petakanKolomAlokasi((ws.getRow(1).values as unknown[]).slice(1));
    expect(kolomWajibAlokasiHilang(peta)).toHaveLength(0);
    expect(KOLOM_TEMPLATE_ALOKASI).toHaveLength(5);
  });
});
