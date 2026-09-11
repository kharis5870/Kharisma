/**
 * Pembebanan honor mitra ke bulan-bulan yang dilalui periode honornya.
 *
 * MASALAH YANG DISELESAIKAN
 * Batas SBML berlaku per mitra per BULAN, sedangkan periode honor sebuah
 * kegiatan bisa melintasi beberapa bulan (mis. 15 Februari - 15 Maret). Selama
 * ini honor sebuah alokasi dianggap utuh di setiap bulan yang beririsan,
 * sehingga satu honor 3 juta terbaca 3 juta di Februari DAN 3 juta di Maret:
 * rekap tahunan jadi dobel, dan batas bulanan terhitung dua kali.
 *
 * Modul ini memutuskan berapa rupiah yang jatuh di tiap bulan, dengan tiga cara
 * yang dipilih PER ALOKASI PPL — karena keputusannya memang per orang: mitra
 * yang kuotanya masih longgar cukup dibebankan ke satu bulan, sementara mitra
 * yang hampir mentok perlu dipecah.
 *
 * MURNI. Hanya angka, string, dan `Date` — tanpa impor apa pun, supaya bisa
 * dipakai klien (untuk pratinjau di layar) DAN server (untuk hasil yang
 * disimpan), serta diuji tanpa membuka koneksi database.
 *
 * PENTING untuk kode server: impor lewat jalur relatif
 * (`../../shared/pembebananHonor`), BUKAN `@shared/...`. Alias itu tidak
 * tersedia saat `vite.config.ts` memuat kode server lewat Node.
 */

/** Cara membagi honor satu alokasi ke bulan-bulan yang dilaluinya. */
export type MetodePembebanan =
  /** Seluruh honor jatuh di satu bulan yang dipilih pengguna. */
  | "bulan_tertentu"
  /** Dibagi menurut jumlah hari periode yang jatuh di tiap bulan. */
  | "prorata"
  /** Bulan pertama diisi sampai mentok batas SBML, sisanya melimpah ke bulan berikutnya. */
  | "luber";

export const METODE_PEMBEBANAN: MetodePembebanan[] = [
  "bulan_tertentu",
  "prorata",
  "luber",
];

/** Label siap tampil. Ditaruh di sini supaya klien dan pesan galat server sama. */
export const LABEL_METODE: Record<MetodePembebanan, string> = {
  bulan_tertentu: "Bebankan ke satu bulan",
  prorata: "Bagi menurut jumlah hari",
  luber: "Penuhi batas bulan pertama, sisanya ke bulan berikutnya",
};

export const PENJELASAN_METODE: Record<MetodePembebanan, string> = {
  bulan_tertentu:
    "Seluruh honor dihitung di satu bulan yang Anda pilih. Dipakai bila kuota mitra di bulan itu masih longgar.",
  prorata:
    "Honor dibagi menurut banyaknya hari periode yang jatuh di tiap bulan. Periode yang melintasi dua bulan dengan porsi hari seimbang praktis terbagi dua.",
  luber:
    "Bulan pertama diisi sampai batas SBML mitra tercapai, kelebihannya baru dilimpahkan ke bulan berikutnya, dan seterusnya.",
};

/** Kunci bulan 'MM-YYYY', sama dengan format kolom `bulanHonor*` di database. */
export type KunciBulan = string;

/** Rupiah yang dibebankan per bulan. Kuncinya 'MM-YYYY'. */
export type PembebananPerBulan = Record<KunciBulan, number>;

const duaDigit = (n: number): string => String(n).padStart(2, "0");

/** 'MM-YYYY' dari sebuah tanggal. */
export const kunciBulan = (tanggal: Date): KunciBulan =>
  `${duaDigit(tanggal.getMonth() + 1)}-${tanggal.getFullYear()}`;

/** Membaca 'YYYY-MM-DD' menjadi Date lokal tengah malam. Mengembalikan null bila tidak sah. */
export const bacaTanggal = (nilai: string | Date | null | undefined): Date | null => {
  if (!nilai) return null;
  if (nilai instanceof Date) return isNaN(nilai.getTime()) ? null : nilai;
  // Sengaja dipecah manual, bukan `new Date(teks)`: string 'YYYY-MM-DD'
  // ditafsirkan sebagai UTC oleh peramban, sehingga di zona WIB tanggal 1
  // menjadi tanggal 30 bulan sebelumnya — bulan pembebanannya ikut meleset.
  const cocok = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(nilai));
  if (!cocok) return null;
  const [, th, bl, tg] = cocok;
  const d = new Date(Number(th), Number(bl) - 1, Number(tg));
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Daftar bulan yang dilalui sebuah periode, berurutan.
 *
 * Periode 15 Feb - 15 Mar menghasilkan ['02-2026', '03-2026']. Periode dalam
 * satu bulan menghasilkan satu elemen — dan itu penanda bahwa layar TIDAK perlu
 * menawarkan pilihan metode apa pun.
 */
export const bulanDilalui = (
  mulai: string | Date | null | undefined,
  selesai: string | Date | null | undefined,
): KunciBulan[] => {
  const a = bacaTanggal(mulai);
  const b = bacaTanggal(selesai);
  if (!a || !b || b < a) return [];

  const hasil: KunciBulan[] = [];
  const jalan = new Date(a.getFullYear(), a.getMonth(), 1);
  const akhir = new Date(b.getFullYear(), b.getMonth(), 1);
  while (jalan <= akhir) {
    hasil.push(kunciBulan(jalan));
    jalan.setMonth(jalan.getMonth() + 1);
  }
  return hasil;
};

/** Jumlah hari periode yang jatuh di tiap bulan. */
export const hariPerBulan = (
  mulai: string | Date | null | undefined,
  selesai: string | Date | null | undefined,
): Record<KunciBulan, number> => {
  const a = bacaTanggal(mulai);
  const b = bacaTanggal(selesai);
  if (!a || !b || b < a) return {};

  const hasil: Record<KunciBulan, number> = {};
  const jalan = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  while (jalan <= b) {
    const k = kunciBulan(jalan);
    hasil[k] = (hasil[k] ?? 0) + 1;
    jalan.setDate(jalan.getDate() + 1);
  }
  return hasil;
};

/**
 * Membagi `total` menurut bobot, tanpa kehilangan atau menciptakan rupiah.
 *
 * Pembulatan ke bawah untuk semua bagian, lalu SISA pembagian ditambahkan satu
 * per satu ke bagian berbobot terbesar. Tanpa ini, honor 1.000.000 yang dibagi
 * ke tiga bulan menjadi 333.333 x 3 = 999.999 — satu rupiah menguap, dan rekap
 * tahunan tidak akan pernah cocok dengan jumlah yang dibayarkan.
 */
const bagiTanpaSisa = (
  total: number,
  bobot: Array<{ kunci: KunciBulan; nilai: number }>,
): PembebananPerBulan => {
  const totalBobot = bobot.reduce((j, b) => j + b.nilai, 0);
  if (totalBobot <= 0) return {};

  const hasil: PembebananPerBulan = {};
  let terbagi = 0;
  for (const b of bobot) {
    const bagian = Math.floor((total * b.nilai) / totalBobot);
    hasil[b.kunci] = bagian;
    terbagi += bagian;
  }

  let sisa = total - terbagi;
  const urutBobot = [...bobot].sort((x, y) => y.nilai - x.nilai);
  let i = 0;
  while (sisa > 0 && urutBobot.length > 0) {
    hasil[urutBobot[i % urutBobot.length].kunci] += 1;
    sisa -= 1;
    i += 1;
  }
  return hasil;
};

export interface OpsiPembebanan {
  metode: MetodePembebanan;
  /** Untuk 'bulan_tertentu'. Diabaikan metode lain. */
  bulanDipilih?: KunciBulan | null;
  /**
   * Untuk 'luber': sisa kuota SBML mitra di tiap bulan, SETELAH dikurangi honor
   * dari kegiatan lain. Bulan yang tidak disebut dianggap punya sisa 0.
   */
  sisaKuota?: Record<KunciBulan, number>;
}

/**
 * Membebankan honor satu alokasi ke bulan-bulannya.
 *
 * Selalu mengembalikan pembagian yang jumlahnya PERSIS `totalHonor` — termasuk
 * saat 'luber' kehabisan kuota di semua bulan. Kelebihan yang tidak tertampung
 * sengaja dijatuhkan ke bulan TERAKHIR, bukan dibuang: honornya tetap harus
 * dibayar dan tetap harus terlihat melanggar batas. Membuangnya justru akan
 * menyembunyikan pelanggaran yang ingin ditangkap.
 */
export const bebankanHonor = (
  totalHonor: number,
  mulai: string | Date | null | undefined,
  selesai: string | Date | null | undefined,
  opsi: OpsiPembebanan,
): PembebananPerBulan => {
  const bulan = bulanDilalui(mulai, selesai);
  if (bulan.length === 0) return {};
  if (totalHonor <= 0) return { [bulan[0]]: 0 };

  // Periode satu bulan: tidak ada yang perlu diputuskan.
  if (bulan.length === 1) return { [bulan[0]]: totalHonor };

  if (opsi.metode === "bulan_tertentu") {
    // Bulan yang dipilih harus benar-benar dilalui periode. Pilihan yang tidak
    // sah (mis. periodenya diubah setelah bulannya dipilih) jatuh ke bulan
    // pertama, bukan menghilangkan honornya dari rekap.
    const dipilih =
      opsi.bulanDipilih && bulan.includes(opsi.bulanDipilih)
        ? opsi.bulanDipilih
        : bulan[0];
    return { [dipilih]: totalHonor };
  }

  if (opsi.metode === "prorata") {
    const hari = hariPerBulan(mulai, selesai);
    return bagiTanpaSisa(
      totalHonor,
      bulan.map(k => ({ kunci: k, nilai: hari[k] ?? 0 })),
    );
  }

  // 'luber'
  const hasil: PembebananPerBulan = {};
  let tersisa = totalHonor;
  bulan.forEach((k, indeks) => {
    const terakhir = indeks === bulan.length - 1;
    if (terakhir) {
      hasil[k] = tersisa;
      tersisa = 0;
      return;
    }
    const kuota = Math.max(0, Math.floor(opsi.sisaKuota?.[k] ?? 0));
    const diambil = Math.min(tersisa, kuota);
    hasil[k] = diambil;
    tersisa -= diambil;
  });
  return hasil;
};

/**
 * Batas SBML untuk sebuah rentang filter di halaman Manajemen Honor.
 *
 * Angka ini HANYA konteks pembacaan gap — pelanggaran tetap dinilai per bulan.
 * Kalau total serentang dibandingkan dengan angka ini, mitra yang menerima
 * 4 juta di Januari saja (batas 3 juta/bulan) tidak akan tertandai pada filter
 * triwulan, karena 4 juta masih di bawah 9 juta.
 */
export const batasPeriode = (
  batasBulanan: number,
  mulai: string | Date | null | undefined,
  selesai: string | Date | null | undefined,
): number => batasBulanan * Math.max(1, bulanDilalui(mulai, selesai).length);
