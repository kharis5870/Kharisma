/**
 * Pembacaan berkas impor ALOKASI MITRA untuk satu kegiatan.
 *
 * Menyusun alokasi satu per satu lewat layar memakan waktu lama ketika satu
 * kegiatan memegang puluhan mitra: tiap baris menuntut memilih mitra, memilih
 * PML, dan mengetik beban kerjanya.
 *
 * Modul ini MURNI — hanya teks dan angka, tanpa database dan tanpa Excel —
 * sehingga layar (saat menyusun pratinjau) dan server (saat benar-benar
 * menulis) memakai aturan yang sama persis. Pola ini mengikuti impor mitra
 * (`shared/imporMitra.ts`) yang sudah terbukti dipakai bersama.
 *
 * YANG SENGAJA TIDAK ADA DI BERKAS
 *
 * - Harga satuan. Harga adalah setelan per TAHAP di kegiatannya, bukan milik
 *   tiap mitra; honor tiap baris dihitung dari beban kerja dikali harga satuan
 *   tahap itu. Memasukkannya ke berkas hanya membuka dua sumber kebenaran.
 *
 * - Metode pembebanan dan bulan pembebanan. Keduanya baru berarti kalau rentang
 *   honor tahapnya melintasi lebih dari satu bulan, dan itu jarang; selama
 *   rentangnya di dalam satu bulan, form tidak pernah menanyakannya sama sekali
 *   (lihat `pembebananBelumLengkap`). Untuk yang jarang itu, form sudah menagih
 *   pilihannya di tiap kartu alokasi sebelum kegiatan bisa disimpan. Menaruhnya
 *   di berkas berarti menambah dua kolom yang hampir selalu kosong, dan kolom
 *   kosong yang keliru terisi jauh lebih berbahaya daripada kolom yang tidak ada:
 *   ia menentukan di bulan mana honornya dihitung terhadap batas SBML.
 */

export type KolomAlokasi = 'sobatId' | 'nama' | 'tahap' | 'pml' | 'bebanKerja';

/**
 * Nama header yang dikenali, sudah dalam bentuk ternormalkan.
 *
 * Longgar dengan sengaja: menambah satu ejaan di sini jauh lebih murah
 * daripada menyuruh orang menyunting berkasnya.
 */
export const ALIAS_KOLOM_ALOKASI: Record<KolomAlokasi, string[]> = {
  sobatId: ['sobatid', 'idsobat', 'kodesobat', 'nomorsobat'],
  nama: ['nama', 'namamitra', 'namappl', 'namapetugas', 'namalengkap'],
  tahap: ['tahap', 'jenispekerjaan', 'pekerjaan'],
  pml: ['pml', 'namapml', 'pengawas', 'pendamping'],
  bebanKerja: ['bebankerja', 'beban', 'muatan', 'target', 'volume'],
};

/** Tanpa ini berkasnya tidak bisa dibaca sama sekali. */
export const KOLOM_WAJIB_ALOKASI: KolomAlokasi[] = ['tahap', 'bebanKerja'];

export const normalkanHeaderAlokasi = (teks: unknown): string =>
  String(teks ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const petakanKolomAlokasi = (
  header: unknown[],
): Record<KolomAlokasi, number | null> => {
  const hasil = {} as Record<KolomAlokasi, number | null>;
  const ternormal = header.map(normalkanHeaderAlokasi);
  for (const kolom of Object.keys(ALIAS_KOLOM_ALOKASI) as KolomAlokasi[]) {
    const alias = ALIAS_KOLOM_ALOKASI[kolom];
    const indeks = ternormal.findIndex(h => h !== '' && alias.includes(h));
    hasil[kolom] = indeks >= 0 ? indeks : null;
  }
  return hasil;
};

export const kolomWajibAlokasiHilang = (
  peta: Record<KolomAlokasi, number | null>,
): KolomAlokasi[] => {
  const hilang = KOLOM_WAJIB_ALOKASI.filter(k => peta[k] === null);
  // Mitra harus bisa dikenali dari SALAH SATU: ID SOBAT atau nama.
  if (peta.sobatId === null && peta.nama === null) hilang.push('nama');
  return hilang;
};

/** Baris header dicari, bukan diandaikan di baris pertama. */
export const cariBarisHeaderAlokasi = (baris: unknown[][], maksPeriksa = 10): number => {
  let terbaik = -1;
  let skorTerbaik = 0;
  for (let i = 0; i < Math.min(baris.length, maksPeriksa); i++) {
    const peta = petakanKolomAlokasi(baris[i] ?? []);
    if (kolomWajibAlokasiHilang(peta).length > 0) continue;
    const skor = (Object.keys(peta) as KolomAlokasi[]).filter(k => peta[k] !== null).length;
    if (skor > skorTerbaik) {
      skorTerbaik = skor;
      terbaik = i;
    }
  }
  return terbaik;
};

export type TahapAlokasi = 'listing' | 'pencacahan' | 'pengolahan-analisis';

/**
 * Menyeragamkan tulisan tahap.
 *
 * "Pengolahan" ditulis orang dengan banyak cara, dan yang dimaksud selalu
 * alokasi mitra pengolahan — yang bekerja pada masa pendataan, bukan tahap
 * Pengolahan & Analisis di jadwal kegiatan.
 */
export const normalkanTahap = (teks: unknown): TahapAlokasi | null => {
  const t = normalkanHeaderAlokasi(teks);
  if (t === '') return null;
  if (t.includes('listing')) return 'listing';
  if (t.includes('cacah')) return 'pencacahan';
  if (t.includes('olah') || t.includes('entri') || t.includes('analisis')) {
    return 'pengolahan-analisis';
  }
  return null;
};

/** Beban kerja: bilangan bulat lebih dari nol. Teks lain menghasilkan null. */
export const bacaBebanKerja = (nilai: unknown): number | null => {
  const teks = String(nilai ?? '').replace(/[.\s]/g, '').replace(',', '.');
  const n = Number(teks);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
};

export interface BarisAlokasi {
  /** Nomor baris di berkas, untuk ditunjuk saat melaporkan masalah. */
  nomorBaris: number;
  sobatId?: string;
  nama?: string;
  tahap: TahapAlokasi | null;
  /** Teks apa adanya; pencocokan ke PML dilakukan terhadap daftar pengguna. */
  pml?: string;
  bebanKerja: number | null;
  /** Benar bila seluruh selnya kosong — baris pemisah, bukan kesalahan. */
  kosong: boolean;
}

const teks = (nilai: unknown): string => String(nilai ?? '').trim();

export const bacaBarisAlokasi = (
  sel: unknown[],
  peta: Record<KolomAlokasi, number | null>,
  nomorBaris: number,
): BarisAlokasi => {
  const ambil = (kolom: KolomAlokasi): unknown =>
    peta[kolom] === null ? '' : sel[peta[kolom] as number];

  const sobatId = teks(ambil('sobatId'));
  const nama = teks(ambil('nama'));
  const tahapMentah = teks(ambil('tahap'));
  const pml = teks(ambil('pml'));
  const bebanMentah = teks(ambil('bebanKerja'));

  return {
    nomorBaris,
    sobatId: sobatId || undefined,
    nama: nama || undefined,
    tahap: normalkanTahap(tahapMentah),
    pml: pml || undefined,
    bebanKerja: bacaBebanKerja(bebanMentah),
    kosong: sobatId === '' && nama === '' && tahapMentah === '' && pml === '' && bebanMentah === '',
  };
};

// =====================================================================
// Pencocokan ke data yang sudah ada
// =====================================================================

/** Mitra sebagaimana tersimpan di master, untuk dicocokkan. */
export interface MitraRef {
  id: string;
  sobatId?: string | null;
  nama: string;
  aktif?: boolean;
}

/** PML sebagaimana tersimpan; `id` adalah users.id. */
export interface PmlRef {
  id: string;
  nama: string;
}

const kunciNama = (teks: unknown): string =>
  String(teks ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Potongan gelar yang tidak ikut dihitung sebagai kata nama.
 *
 * Nama pegawai di aplikasi ini hampir selalu bergelar — "Rossi Bettega, S.E.",
 * "Yayuk Kurnia Ningsih, S.I.Kom." — dan setelah tanda bacanya dibuang, gelar
 * itu berubah menjadi kata-kata pendek. Tanpa daftar ini, mengetik "S" di kolom
 * PML akan cocok ke separuh kantor.
 */
const GELAR = new Set([
  's', 'e', 'si', 'st', 'sst', 'ssi', 'sos', 'kom', 'ikom', 'mm', 'msi', 'm',
  'mt', 'ma', 'dr', 'drs', 'dra', 'ir', 'ap', 'se', 'sp', 'ss', 'a', 'md',
]);

/** Kata-kata nama, gelar dibuang. "Rossi Bettega, S.E." -> ["rossi","bettega"] */
const kataNama = (nama: unknown): string[] =>
  String(nama ?? '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(k => k.length > 0 && !GELAR.has(k));

/** Panjang minimum teks yang boleh dicocokkan sebagian. */
const MIN_COCOK_SEBAGIAN = 3;

export interface HasilCocokPml {
  /** Terisi hanya bila cocoknya tunggal dan tidak meragukan. */
  pml?: PmlRef;
  /** Terisi bila teksnya cocok ke lebih dari satu orang. */
  ganda?: PmlRef[];
}

/**
 * Mencari PML dari nama yang diketik di berkas, termasuk nama yang tidak utuh.
 *
 * KENAPA TIDAK HARUS PERSIS: pegawai menuliskan rekannya dengan nama panggilan
 * — "Edianto", bukan "Edianto, S.E" — dan menuntut nama lengkap bergelar akan
 * membuat hampir setiap baris ditandai bermasalah padahal orangnya jelas.
 *
 * Dicoba berlapis, dari yang paling pasti ke yang paling longgar, dan lapisan
 * pertama yang menghasilkan sesuatu itulah yang dipakai:
 *
 *   1. sama persis setelah tanda baca dibuang;
 *   2. awalan nama lengkapnya ("Rossi Bet" untuk "Rossi Bettega, S.E.");
 *   3. seluruh kata yang diketik ada di nama itu, di mana pun urutannya
 *      ("Bettega" atau "Ningsih" saja sudah cukup).
 *
 * Berlapis, bukan digabung, supaya nama yang PERSIS cocok tidak pernah kalah
 * oleh nama lain yang kebetulan juga mengandung kata itu.
 *
 * COCOK KE BANYAK ORANG TIDAK DITEBAK, melainkan dilaporkan sebagai ganda.
 * Menebak berarti beban pengawasan dan penilaian mitra jatuh ke pegawai lain,
 * dan tidak ada galat apa pun yang akan memberi tahu.
 */
export const cocokkanPml = (
  teksPml: unknown,
  daftar: readonly PmlRef[],
): HasilCocokPml => {
  const kunci = kunciNama(teksPml);
  if (kunci === '') return {};

  const persis = daftar.filter(p => kunciNama(p.nama) === kunci);
  if (persis.length === 1) return { pml: persis[0] };
  if (persis.length > 1) return { ganda: persis };

  if (kunci.length < MIN_COCOK_SEBAGIAN) return {};

  const awalan = daftar.filter(p => kunciNama(p.nama).startsWith(kunci));
  if (awalan.length === 1) return { pml: awalan[0] };
  if (awalan.length > 1) return { ganda: awalan };

  const diketik = kataNama(teksPml);
  if (diketik.length === 0) return {};
  const sebagian = daftar.filter(p => {
    const kata = kataNama(p.nama);
    return diketik.every(d => kata.some(k => k === d || k.startsWith(d)));
  });
  if (sebagian.length === 1) return { pml: sebagian[0] };
  if (sebagian.length > 1) return { ganda: sebagian };

  return {};
};

export type MasalahAlokasi =
  | 'mitra-tidak-dikenali'
  | 'mitra-ganda'
  | 'mitra-nonaktif'
  | 'pml-tidak-dikenali'
  | 'pml-ganda'
  | 'tahap-tidak-dikenali'
  | 'beban-tidak-sah'
  | 'baris-kembar'
  | 'sudah-dialokasikan';

export interface HasilCocokAlokasi {
  baris: BarisAlokasi;
  mitraId: string | null;
  namaMitra: string | null;
  pmlId: string | null;
  namaPml: string | null;
  /** Kosong berarti baris ini siap dipakai. */
  masalah: MasalahAlokasi[];
  /** Kalimat siap tampil, satu per masalah, berurutan sama. */
  pesan: string[];
}

/**
 * Mencocokkan satu baris berkas ke mitra dan PML yang ada.
 *
 * MITRA DICARI LEWAT ID SOBAT LEBIH DULU, baru nama. ID SOBAT adalah penanda
 * orang yang dipakai lintas tahun; nama bisa kembar dan bisa berubah ejaannya.
 * Nama yang cocok ke LEBIH DARI SATU mitra dilaporkan sebagai ganda — tidak
 * ditebak — karena menebak berarti honor dan penilaian jatuh ke orang lain.
 *
 * Nama mitra sengaja TIDAK dicocokkan sebagian seperti nama PML. Daftar mitra
 * memuat ratusan orang yang tidak saling kenal dengan pengisinya, sedangkan PML
 * adalah rekan sekantor yang jumlahnya belasan: di sana nama panggilan masih
 * menunjuk satu orang, di sini tidak.
 *
 * Mitra NONAKTIF dilaporkan tapi TIDAK ditolak: orang bisa saja kembali aktif,
 * dan keputusannya milik manusia yang melihat pratinjau.
 */
export const cocokkanBarisAlokasi = (
  baris: BarisAlokasi,
  mitra: readonly MitraRef[],
  pml: readonly PmlRef[],
): HasilCocokAlokasi => {
  const masalah: MasalahAlokasi[] = [];
  const pesan: string[] = [];
  const catat = (m: MasalahAlokasi, p: string) => { masalah.push(m); pesan.push(p); };

  let cocokMitra: MitraRef | undefined;
  const sobatId = (baris.sobatId ?? '').trim();
  if (sobatId !== '') {
    cocokMitra = mitra.find(m => String(m.sobatId ?? '').trim() === sobatId);
  }
  if (!cocokMitra && baris.nama) {
    const senama = mitra.filter(m => kunciNama(m.nama) === kunciNama(baris.nama));
    if (senama.length > 1) {
      catat('mitra-ganda',
        `Ada ${senama.length} mitra bernama "${baris.nama}". Isi kolom ID SOBAT untuk memastikan.`);
    } else {
      cocokMitra = senama[0];
    }
  }
  if (!cocokMitra && !masalah.includes('mitra-ganda')) {
    catat('mitra-tidak-dikenali',
      `Mitra "${baris.sobatId || baris.nama || '(kosong)'}" tidak ada di daftar mitra.`);
  }
  if (cocokMitra && cocokMitra.aktif === false) {
    catat('mitra-nonaktif', `${cocokMitra.nama} berstatus nonaktif.`);
  }

  let cocokPml: PmlRef | undefined;
  if (baris.pml) {
    const hasilPml = cocokkanPml(baris.pml, pml);
    if (hasilPml.ganda) {
      catat('pml-ganda',
        `Nama PML "${baris.pml}" cocok ke ${hasilPml.ganda.length} orang: ` +
        `${hasilPml.ganda.map(p => p.nama).join(', ')}. Tulis lebih lengkap.`);
    } else if (hasilPml.pml) {
      cocokPml = hasilPml.pml;
    } else {
      catat('pml-tidak-dikenali', `PML "${baris.pml}" tidak dikenali.`);
    }
  }

  if (baris.tahap === null) {
    catat('tahap-tidak-dikenali', 'Tahap harus listing, pencacahan, atau pengolahan.');
  }
  if (baris.bebanKerja === null) {
    catat('beban-tidak-sah', 'Beban kerja harus bilangan bulat lebih dari nol.');
  }

  return {
    baris,
    mitraId: cocokMitra?.id ?? null,
    namaMitra: cocokMitra?.nama ?? null,
    pmlId: cocokPml?.id ?? null,
    namaPml: cocokPml?.nama ?? null,
    masalah,
    pesan,
  };
};

/**
 * Menandai baris yang mitranya DAN tahapnya sama dengan baris lain di berkas.
 *
 * Satu mitra boleh muncul beberapa kali untuk tahap BERBEDA — itu wajar,
 * misalnya listing dan pencacahan sekaligus. Yang tidak bisa adalah dua baris
 * untuk mitra dan tahap yang sama: keduanya menjadi dua alokasi kembar yang
 * tidak bisa dibedakan siapa pun, dan honornya terhitung dua kali.
 */
export const tandaiBarisKembar = (
  hasil: HasilCocokAlokasi[],
): HasilCocokAlokasi[] => {
  const hitung = new Map<string, number>();
  for (const h of hasil) {
    if (!h.mitraId || !h.baris.tahap) continue;
    const kunci = `${h.mitraId}|${h.baris.tahap}`;
    hitung.set(kunci, (hitung.get(kunci) ?? 0) + 1);
  }
  return hasil.map(h => {
    if (!h.mitraId || !h.baris.tahap) return h;
    const kunci = `${h.mitraId}|${h.baris.tahap}`;
    if ((hitung.get(kunci) ?? 0) < 2) return h;
    return {
      ...h,
      masalah: [...h.masalah, 'baris-kembar' as MasalahAlokasi],
      pesan: [...h.pesan,
        `${h.namaMitra} muncul lebih dari sekali untuk tahap yang sama di berkas ini.`],
    };
  });
};

/**
 * Menandai baris yang mitranya SUDAH punya alokasi di tahap itu pada formnya.
 *
 * Dijalankan setelah `tandaiBarisKembar` dan dengan alasan yang sama, hanya
 * lawannya beda: kembar membandingkan berkas dengan dirinya sendiri, ini
 * membandingkan berkas dengan alokasi yang sudah tersusun di layar. Tanpa ini,
 * mengimpor berkas yang sama dua kali akan melipatgandakan honor tiap mitra
 * tanpa satu pun galat muncul.
 *
 * Menimpa alokasi lama TIDAK dilakukan: beban kerja di layar bisa saja sudah
 * disunting tangan setelah berkasnya dibuat, dan menimpanya diam-diam berarti
 * membuang suntingan itu.
 */
export const tandaiSudahDialokasikan = (
  hasil: readonly HasilCocokAlokasi[],
  sudahAda: readonly { mitraId: string; tahap: TahapAlokasi }[],
): HasilCocokAlokasi[] => {
  const kunci = new Set(sudahAda.map(a => `${a.mitraId}|${a.tahap}`));
  return hasil.map(h => {
    if (!h.mitraId || !h.baris.tahap) return h;
    if (!kunci.has(`${h.mitraId}|${h.baris.tahap}`)) return h;
    return {
      ...h,
      masalah: [...h.masalah, 'sudah-dialokasikan' as MasalahAlokasi],
      pesan: [...h.pesan,
        `${h.namaMitra} sudah punya alokasi di tahap ini. Baris ini dilewati agar honornya tidak terhitung dua kali.`],
    };
  });
};

/**
 * Masalah yang membuat baris TIDAK BISA dipakai sama sekali.
 *
 * Sisanya — mitra nonaktif, PML yang tidak dikenali, dan PML yang namanya cocok
 * ke beberapa orang — hanya peringatan: barisnya tetap bisa diimpor dengan PML
 * dikosongkan, lalu diisi belakangan lewat kartu alokasinya. Menolak seluruh
 * baris hanya karena satu nama PML kurang jelas memaksa orang menyunting Excel
 * demi hal yang di layar selesai dalam dua klik.
 */
export const MASALAH_MENGHALANGI: MasalahAlokasi[] = [
  'mitra-tidak-dikenali',
  'mitra-ganda',
  'tahap-tidak-dikenali',
  'beban-tidak-sah',
  'baris-kembar',
  'sudah-dialokasikan',
];

export const barisBisaDipakai = (h: HasilCocokAlokasi): boolean =>
  !h.masalah.some(m => MASALAH_MENGHALANGI.includes(m));

export interface RingkasanImporAlokasi {
  siap: number;
  perluDiperiksa: number;
  ditolak: number;
  /** Banyaknya baris siap pakai per tahap, untuk ditampilkan sebelum menulis. */
  perTahap: Record<TahapAlokasi, number>;
}

export const ringkasImporAlokasi = (
  hasil: readonly HasilCocokAlokasi[],
): RingkasanImporAlokasi => {
  const perTahap: Record<TahapAlokasi, number> = {
    listing: 0, pencacahan: 0, 'pengolahan-analisis': 0,
  };
  let siap = 0, perluDiperiksa = 0, ditolak = 0;
  for (const h of hasil) {
    if (!barisBisaDipakai(h)) { ditolak++; continue; }
    siap++;
    if (h.masalah.length > 0) perluDiperiksa++;
    if (h.baris.tahap) perTahap[h.baris.tahap]++;
  }
  return { siap, perluDiperiksa, ditolak, perTahap };
};

// =====================================================================
// Penyusunan alokasi siap pakai
// =====================================================================

/** Nama tahap sebagaimana disimpan di baris honorarium. */
export const JENIS_PEKERJAAN_TAHAP: Record<TahapAlokasi, 'listing' | 'pencacahan' | 'pengolahan'> = {
  listing: 'listing',
  pencacahan: 'pencacahan',
  'pengolahan-analisis': 'pengolahan',
};

/**
 * Satu alokasi hasil impor, dalam bentuk yang sama-sama dimengerti halaman
 * Input Kegiatan (store zustand) dan Edit Kegiatan (state form).
 */
export interface AlokasiTerimpor {
  nomorBaris: number;
  mitraId: string;
  namaMitra: string;
  pmlId: string | null;
  namaPml: string;
  tahap: TahapAlokasi;
  jenisPekerjaan: 'listing' | 'pencacahan' | 'pengolahan';
  bebanKerja: number;
  /** Beban kerja dikali harga satuan tahapnya, dalam rupiah penuh. */
  besaranHonor: number;
}

/**
 * Mengubah baris yang lolos menjadi alokasi siap dimasukkan ke form.
 *
 * HONOR DIHITUNG DI SINI, dari harga satuan tahap yang sedang berlaku di form
 * — bukan dari berkas. Dengan begitu mengubah harga satuan setelah impor tetap
 * menghitung ulang semuanya lewat jalur yang sudah ada, dan berkas impor tidak
 * pernah menjadi sumber harga kedua yang bisa berbeda.
 *
 * Harga satuan yang belum diisi menghasilkan honor nol, bukan penolakan:
 * urutan kerja yang wajar adalah menempelkan daftar mitranya dulu, harga
 * satuannya menyusul.
 */
export const susunAlokasiImpor = (
  hasil: readonly HasilCocokAlokasi[],
  hargaSatuan: Partial<Record<TahapAlokasi, number>>,
): AlokasiTerimpor[] =>
  hasil
    .filter(h => barisBisaDipakai(h) && h.mitraId && h.baris.tahap && h.baris.bebanKerja)
    .map(h => {
      const tahap = h.baris.tahap as TahapAlokasi;
      const beban = h.baris.bebanKerja as number;
      const harga = Number(hargaSatuan[tahap]) || 0;
      return {
        nomorBaris: h.baris.nomorBaris,
        mitraId: h.mitraId as string,
        namaMitra: h.namaMitra ?? '',
        pmlId: h.pmlId,
        namaPml: h.namaPml ?? '',
        tahap,
        jenisPekerjaan: JENIS_PEKERJAAN_TAHAP[tahap],
        bebanKerja: beban,
        besaranHonor: beban * harga,
      };
    });
