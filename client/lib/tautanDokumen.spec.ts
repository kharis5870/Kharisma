import { describe, it, expect } from "vitest";
import {
  rapikanTautan,
  normalkanTautanDrive,
  periksaTautan,
  hrefAman,
  BATAS_PANJANG_TAUTAN,
} from "@shared/tautanDokumen";

const DRIVE = "https://drive.google.com/file/d/1AbCdEf/view";

describe("rapikanTautan", () => {
  it("membuang spasi dan baris baru dari hasil tempel", () => {
    expect(rapikanTautan(`  ${DRIVE}\n`)).toBe(DRIVE);
  });

  // Karakter ini tidak terlihat di kotak isian tapi membuat URL gagal diurai,
  // jadi pengguna melihat "format tidak dikenali" pada tautan yang tampak benar.
  it("membuang karakter zero-width yang ikut tertempel", () => {
    expect(rapikanTautan(`\u200B${DRIVE}\uFEFF`)).toBe(DRIVE);
  });

  it("membuang tanda kutip dan kurung sudut pembungkus", () => {
    expect(rapikanTautan(`"${DRIVE}"`)).toBe(DRIVE);
    expect(rapikanTautan(`<${DRIVE}>`)).toBe(DRIVE);
  });
});

describe("normalkanTautanDrive", () => {
  it("membuang parameter berbagi yang tidak bermakna", () => {
    expect(normalkanTautanDrive(`${DRIVE}?usp=sharing`)).toBe(DRIVE);
    expect(normalkanTautanDrive(`${DRIVE}?usp=drive_link&pli=1`)).toBe(DRIVE);
  });

  // authuser mengunci tautan ke satu akun dan justru memicu "Anda perlu akses".
  it("membuang authuser", () => {
    expect(normalkanTautanDrive(`${DRIVE}?authuser=2`)).toBe(DRIVE);
  });

  it("mempertahankan parameter dan fragment yang bermakna", () => {
    const sheet = "https://docs.google.com/spreadsheets/d/XYZ/edit";
    expect(normalkanTautanDrive(`${sheet}?gid=123`)).toBe(`${sheet}?gid=123`);
    expect(normalkanTautanDrive(`${sheet}#gid=0`)).toBe(`${sheet}#gid=0`);
    expect(normalkanTautanDrive(`${sheet}?usp=sharing#gid=0`)).toBe(`${sheet}#gid=0`);
  });

  it("tidak menyentuh host selain Google", () => {
    const lain = "https://bps.sharepoint.com/berkas.pdf?usp=sharing";
    expect(normalkanTautanDrive(lain)).toBe(lain);
  });

  it("idempoten", () => {
    const sekali = normalkanTautanDrive(`${DRIVE}?usp=sharing&authuser=0#hal=2`);
    expect(normalkanTautanDrive(sekali)).toBe(sekali);
  });
});

describe("periksaTautan", () => {
  it("menolong tempelan tanpa skema", () => {
    const hasil = periksaTautan("drive.google.com/file/d/1AbCdEf/view");
    expect(hasil.sah).toBe(true);
    expect(hasil.tautan).toBe(DRIVE);
  });

  it("merapikan dan menormalkan sekaligus", () => {
    const hasil = periksaTautan(`  ${DRIVE}?usp=sharing  `);
    expect(hasil.sah).toBe(true);
    expect(hasil.tautan).toBe(DRIVE);
  });

  // Inti keamanannya: ViewDocuments merender nilai ini sebagai href, jadi
  // skema javascript: yang tersimpan akan dieksekusi saat diklik orang lain.
  it("menolak skema yang berbahaya bila diklik", () => {
    for (const jahat of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "file:///c:/rahasia.txt",
    ]) {
      const hasil = periksaTautan(jahat);
      expect(hasil.sah, jahat).toBe(false);
      expect(hasil.galat, jahat).toBeTruthy();
    }
  });

  it("menolak yang bukan alamat sama sekali", () => {
    expect(periksaTautan("bukan url").sah).toBe(false);
    expect(periksaTautan("https://drive").sah).toBe(false);
  });

  it("menerima kosong bila tidak wajib, menolak bila wajib", () => {
    expect(periksaTautan("").sah).toBe(true);
    expect(periksaTautan(null).sah).toBe(true);
    expect(periksaTautan(undefined).sah).toBe(true);
    expect(periksaTautan("   ", { wajib: true }).sah).toBe(false);
  });

  // Host lain sengaja TIDAK ditolak — sebagian dokumen sah ada di SharePoint
  // kantor — tapi harus diberi catatan agar salah tempel tetap terlihat.
  it("memberi peringatan lunak untuk host non-Google tanpa menolaknya", () => {
    const hasil = periksaTautan("https://bps.sharepoint.com/berkas.pdf");
    expect(hasil.sah).toBe(true);
    expect(hasil.peringatan).toBeTruthy();
  });

  it("tidak memberi peringatan untuk Google", () => {
    expect(periksaTautan(DRIVE).peringatan).toBeUndefined();
  });

  // Menolak lebih baik daripada dipotong diam-diam oleh MariaDB non-strict.
  it("menolak yang melebihi lebar kolom database", () => {
    const panjang = `https://drive.google.com/file/d/${"x".repeat(BATAS_PANJANG_TAUTAN)}/view`;
    const hasil = periksaTautan(panjang);
    expect(hasil.sah).toBe(false);
    expect(hasil.galat).toContain(String(BATAS_PANJANG_TAUTAN));
  });

  it("menerima tepat pada batas panjang", () => {
    const awalan = "https://drive.google.com/file/d/";
    const akhiran = "/view";
    const isi = "x".repeat(BATAS_PANJANG_TAUTAN - awalan.length - akhiran.length);
    expect(periksaTautan(`${awalan}${isi}${akhiran}`).sah).toBe(true);
  });
});

describe("hrefAman", () => {
  it("meneruskan tautan http dan https apa adanya", () => {
    expect(hrefAman(DRIVE)).toBe(DRIVE);
    expect(hrefAman("http://contoh.test/a")).toBe("http://contoh.test/a");
  });

  it("mengembalikan null untuk yang tidak boleh dijadikan href", () => {
    expect(hrefAman("javascript:alert(1)")).toBeNull();
    expect(hrefAman("bukan url")).toBeNull();
    expect(hrefAman("")).toBeNull();
    expect(hrefAman(null)).toBeNull();
  });

  // Data lama disimpan sebelum validasi ada; ia harus tetap bisa dibuka.
  it("tidak mengubah tautan lama yang aneh tapi tetap http(s)", () => {
    const lama = "https://drive.google.com/open?id=1Ab&authuser=3";
    expect(hrefAman(lama)).toBe(lama);
  });
});
