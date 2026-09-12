/**
 * Pembebanan honor mitra ke bulan-bulan yang dilalui periode honornya.
 *
 * MASALAH YANG DISELESAIKAN
 * Batas SBML berlaku per mitra per BULAN, sedangkan periode honor sebuah
 * kegiatan bisa melintasi beberapa bulan (mis. 15 Januari - 15 Februari).
 * Harus ada keputusan berapa yang jatuh di tiap bulan, dan keputusan itu
 * diambil PER ALOKASI PPL: mitra yang kuotanya masih longgar cukup dibebankan
 * ke satu bulan, sementara mitra yang hampir mentok perlu dipecah.
 *
 * YANG DIBAGI ADALAH MUATAN, BUKAN RUPIAH
 * Begitulah tim keuangan membuat Surat PK untuk honor lintas bulan: target
 * 10 responden dipecah menjadi SPK bulan pertama 5 responden dan SPK bulan
 * kedua 5 responden, masing-masing dengan jangka waktunya sendiri.
 *
 * Versi pertama modul ini membagi rupiah, dan hasilnya tidak bisa ditulis di
 * Surat PK — "volume 3, harga Rp 1.599.999, nilai Rp 2.595.000" tidak mungkin
 * benar. Sekarang yang dibagi adalah UNIT beban kerja (dokumen, responden),
 * dan rupiah setiap bulan mengikutinya: jumlah = volume x harga satuan. Karena
 * itu jumlah seluruh bulan selalu PERSIS sama dengan honor alokasinya —
 * tidak ada pembulatan rupiah yang bisa menguapkan atau menciptakan uang.
 *
 * MURNI. Hanya angka, string, dan `Date` — tanpa impor apa pun, supaya bisa
 * dipakai klien (untuk pratinjau di layar) DAN server (untuk hasil yang
 * disimpan), serta diuji tanpa membuka koneksi database.
 *
 * PENTING untuk kode server: impor lewat jalur relatif
 * (`../../shared/pembebananHonor`), BUKAN `@shared/...`. Alias itu tidak
 * tersedia saat `vite.config.ts` memuat kode server lewat Node.
 */

/** Cara membagi muatan satu alokasi ke bulan-bulan yang dilaluinya. */
export type MetodePembebanan =
  /** Seluruh muatan jatuh di satu bulan yang dipilih pengguna. Satu Surat PK. */
  | "bulan_tertentu"
  /** Muatan dibagi menurut jumlah hari periode yang jatuh di tiap bulan. */
  | "prorata"
  /** Bulan pertama diisi sebanyak muatan yang masih muat sebelum batas SBML, sisanya ke bulan berikutnya. */
  | "luber";

export const METODE_PEMBEBANAN: MetodePembebanan[] = [
  "bulan_tertentu",
  "prorata",
  "luber",
];

/** Label siap tampil. Ditaruh di sini supaya klien dan pesan galat server sama. */
export const LABEL_METODE: Record<MetodePembebanan, string> = {
  bulan_tertentu: "Bebankan ke satu bulan",
  prorata: "Bagi muatan menurut jumlah hari",
  luber: "Penuhi batas bulan pertama, sisa muatan ke bulan berikutnya",
};

export const PENJELASAN_METODE: Record<MetodePembebanan, string> = {
  bulan_tertentu:
    "Seluruh muatan dan honornya dihitung di satu bulan yang Anda pilih, dengan satu Surat PK. Dipakai bila kuota mitra di bulan itu masih longgar.",
  prorata:
    "Muatan dibagi menurut banyaknya hari periode yang jatuh di tiap bulan, dibulatkan ke unit utuh. Tiap bulan mendapat Surat PK sendiri.",
  luber:
    "Bulan pertama diisi sebanyak muatan yang masih muat sebelum batas SBML mitra tercapai; sisanya dipindah ke bulan berikutnya. Tiap bulan mendapat Surat PK sendiri.",
};

/** Kunci bulan 'MM-YYYY', sama dengan format kolom `bulanHonor*` di database. */
export type KunciBulan = string;

/** Bagian satu bulan: berapa unit muatan, dan berapa rupiahnya. */
export interface BagianBulan {
  volume: number;
  /** Selalu `volume x harga satuan`. */
  jumlah: number;
}

/** Pembebanan per bulan. Kuncinya 'MM-YYYY'. */
export type PembebananPerBulan = Record<KunciBulan, BagianBulan>;

const duaDigit = (n: number): string => String(n).padStart(2, "0");

/** 'MM-YYYY' dari sebuah tanggal. */
export const kunciBulan = (tanggal: Date): KunciBulan =>
  `${duaDigit(tanggal.getMonth() + 1)}-${tanggal.getFullYear()}`;

/** 'YYYY-MM-DD' dari sebuah tanggal lokal. */
const keTeks = (d: Date): string =>
  `${d.getFullYear()}-${duaDigit(d.getMonth() + 1)}-${duaDigit(d.getDate())}`;

/** Membaca 'YYYY-MM-DD' menjadi Date lokal tengah malam. Mengembalikan null bila tidak sah. */
export const bacaTanggal = (nilai: string | Date | null | undefined): Date | null => {
  if (!nilai) return null;
  if (nilai instanceof Date) return isNaN(nilai.getTime()) ? null : nilai;
  // Sengaja dipecah manual, bukan `new Date(teks)`: string 'YYYY-MM-DD'
  // ditafsirkan sebagai UTC oleh peramban, sehingga di zona barat tanggal 1
  // menjadi tanggal terakhir bulan sebelumnya — bulan pembebanannya meleset.
  const cocok = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(nilai));
  if (!cocok) return null;
  const [, th, bl, tg] = cocok;
  const d = new Date(Number(th), Number(bl) - 1, Number(tg));
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Daftar bulan yang dilalui sebuah periode, berurutan.
 *
 * Periode 15 Jan - 15 Feb menghasilkan ['01-2026', '02-2026']. Periode dalam
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
 * Bagian sebuah periode yang jatuh di satu bulan — jangka waktu Surat PK bulan
 * itu. Periode 15 Jan - 15 Feb pada bulan '01-2026' menghasilkan 15-31 Jan,
 * pada '02-2026' menghasilkan 1-15 Feb. Mengembalikan null bila periodenya
 * tidak menyentuh bulan tersebut.
 */
export const rentangDalamBulan = (
  mulai: string | Date | null | undefined,
  selesai: string | Date | null | undefined,
  bulan: KunciBulan,
): { mulai: string; selesai: string } | null => {
  const a = bacaTanggal(mulai);
  const b = bacaTanggal(selesai);
  const cocok = /^(\d{2})-(\d{4})$/.exec(bulan);
  if (!a || !b || b < a || !cocok) return null;

  const awalBulan = new Date(Number(cocok[2]), Number(cocok[1]) - 1, 1);
  // Hari 0 bulan berikutnya = hari terakhir bulan ini, termasuk tahun kabisat.
  const akhirBulan = new Date(Number(cocok[2]), Number(cocok[1]), 0);
  const potongMulai = a > awalBulan ? a : awalBulan;
  const potongSelesai = b < akhirBulan ? b : akhirBulan;
  if (potongSelesai < potongMulai) return null;
  return { mulai: keTeks(potongMulai), selesai: keTeks(potongSelesai) };
};

/**
 * Membagi `total` unit menurut bobot, dalam bilangan bulat, tanpa kehilangan
 * atau menciptakan unit.
 *
 * Metode sisa terbesar: tiap bagian dibulatkan ke bawah, lalu sisa unit
 * diberikan satu per satu ke bagian yang PECAHANNYA paling besar (seri: bulan
 * yang lebih awal). Memberikannya ke bobot terbesar justru keliru: 10 responden
 * pada 15 Jan - 15 Feb (17 : 15 hari) akan jadi 6/4, padahal 5,31 : 4,69 jelas
 * lebih dekat ke 5/5 — dan 5/5 itulah yang dipraktikkan tim keuangan.
 */
const bagiUnitTanpaSisa = (
  total: number,
  bobot: Array<{ kunci: KunciBulan; nilai: number }>,
): Record<KunciBulan, number> => {
  const totalBobot = bobot.reduce((j, b) => j + b.nilai, 0);
  if (totalBobot <= 0) return {};

  const pecahan = bobot.map((b, urutan) => {
    const tepat = (total * b.nilai) / totalBobot;
    return { kunci: b.kunci, bawah: Math.floor(tepat), sisa: tepat - Math.floor(tepat), urutan };
  });

  const hasil: Record<KunciBulan, number> = {};
  let terbagi = 0;
  for (const p of pecahan) {
    hasil[p.kunci] = p.bawah;
    terbagi += p.bawah;
  }

  const urut = [...pecahan].sort((x, y) => y.sisa - x.sisa || x.urutan - y.urutan);
  for (let i = 0; i < total - terbagi; i++) {
    hasil[urut[i % urut.length].kunci] += 1;
  }
  return hasil;
};

export interface OpsiPembebanan {
  metode: MetodePembebanan;
  /** Untuk 'bulan_tertentu'. Diabaikan metode lain. */
  bulanDipilih?: KunciBulan | null;
  /**
   * Untuk 'luber': sisa kuota SBML mitra di tiap bulan dalam RUPIAH, SETELAH
   * dikurangi honor dari kegiatan lain. Bulan yang tidak disebut dianggap
   * punya sisa 0.
   */
  sisaKuota?: Record<KunciBulan, number>;
}

/**
 * Membebankan muatan satu alokasi ke bulan-bulannya.
 *
 * Selalu mengembalikan pembagian yang volumenya menjumlah PERSIS `volume`,
 * dan setiap bagian bernilai `volume x hargaSatuan` — termasuk saat 'luber'
 * kehabisan kuota di semua bulan. Muatan yang tidak tertampung sengaja
 * dijatuhkan ke bulan TERAKHIR, bukan dibuang: pekerjaannya tetap dilakukan,
 * honornya tetap harus dibayar, dan pelanggaran batasnya tetap harus terlihat.
 */
export const bebankanVolume = (
  volume: number,
  hargaSatuan: number,
  mulai: string | Date | null | undefined,
  selesai: string | Date | null | undefined,
  opsi: OpsiPembebanan,
): PembebananPerBulan => {
  const bulan = bulanDilalui(mulai, selesai);
  if (bulan.length === 0) return {};

  const unit = Math.max(0, Math.floor(volume || 0));
  const harga = Math.max(0, hargaSatuan || 0);
  const jadi = (per: Record<KunciBulan, number>): PembebananPerBulan => {
    const hasil: PembebananPerBulan = {};
    for (const [k, v] of Object.entries(per)) hasil[k] = { volume: v, jumlah: v * harga };
    return hasil;
  };

  // Periode satu bulan, atau tidak ada muatan: tidak ada yang perlu diputuskan.
  if (bulan.length === 1 || unit === 0) return jadi({ [bulan[0]]: unit });

  if (opsi.metode === "bulan_tertentu") {
    // Bulan yang dipilih harus benar-benar dilalui periode. Pilihan yang tidak
    // sah (mis. periodenya dipersempit setelah bulannya dipilih) jatuh ke bulan
    // pertama, bukan menghilangkan honornya dari rekap.
    const dipilih =
      opsi.bulanDipilih && bulan.includes(opsi.bulanDipilih) ? opsi.bulanDipilih : bulan[0];
    return jadi({ [dipilih]: unit });
  }

  if (opsi.metode === "prorata") {
    const hari = hariPerBulan(mulai, selesai);
    return jadi(bagiUnitTanpaSisa(unit, bulan.map(k => ({ kunci: k, nilai: hari[k] ?? 0 }))));
  }

  // 'luber': isi bulan demi bulan dengan unit sebanyak yang masih muat.
  const per: Record<KunciBulan, number> = {};
  let tersisa = unit;
  bulan.forEach((k, indeks) => {
    if (indeks === bulan.length - 1) {
      per[k] = tersisa;
      tersisa = 0;
      return;
    }
    const kuota = Math.max(0, Math.floor(opsi.sisaKuota?.[k] ?? 0));
    // Harga nol berarti tidak ada rupiah yang bisa melewati batas: seluruh
    // muatan cukup di bulan pertama.
    const muat = harga > 0 ? Math.floor(kuota / harga) : tersisa;
    const diambil = Math.min(tersisa, muat);
    per[k] = diambil;
    tersisa -= diambil;
  });
  return jadi(per);
};

/** Jumlah volume dan rupiah seluruh bulan. */
export const totalPembebanan = (p: PembebananPerBulan): BagianBulan =>
  Object.values(p).reduce(
    (t, b) => ({ volume: t.volume + b.volume, jumlah: t.jumlah + b.jumlah }),
    { volume: 0, jumlah: 0 },
  );

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
