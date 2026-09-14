/**
 * Menerapkan hasil pembacaan berkas SOBAT: menerjemahkan nama wilayah menjadi
 * id, dan membagikan ID mitra untuk orang-orang baru.
 *
 * Terpisah dari `imporMitra.ts` karena menjawab pertanyaan yang berbeda.
 * `imporMitra` membaca BERKAS: kolom mana artinya apa, baris mana orang yang
 * mana. Modul ini menyiapkan PENULISAN: nilai apa yang akan masuk ke database.
 *
 * Murni, supaya keduanya bisa diuji tanpa berkas Excel dan tanpa database, dan
 * supaya layar (saat menyusun pratinjau) memakai aturan yang sama persis dengan
 * server (saat benar-benar menulis).
 */

/** Satu kecamatan atau desa sebagaimana tersimpan. */
export interface WilayahRef {
  id: number;
  nama: string;
  /** Hanya untuk desa: kecamatan induknya. */
  kecamatanId?: number;
}

export type MasalahWilayah =
  | 'kecamatan-tidak-dikenal'
  | 'desa-tidak-dikenal'
  | 'desa-ambigu';

export interface HasilWilayah {
  kecamatanId: number | null;
  desaId: number | null;
  /** Null berarti tidak ada masalah — termasuk ketika wilayahnya memang kosong. */
  masalah: MasalahWilayah | null;
  pesan?: string;
}

/**
 * Menyeragamkan nama wilayah supaya beda penulisan tidak menggagalkan
 * pencocokan: "Pasar Baru", "PASAR  BARU", dan "pasar-baru" sama saja.
 */
export const normalkanNamaWilayah = (teks: unknown): string =>
  String(teks ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Menerjemahkan nama kecamatan dan desa dari berkas menjadi id.
 *
 * KENAPA DESA HARUS DICARI DI DALAM KECAMATANNYA
 * Di kabupaten ini ada 158 desa tetapi hanya 147 nama yang berbeda: "Sukaraja",
 * "Pasar Baru", "Sukarami", dan delapan nama lain masing-masing dipakai dua
 * kecamatan. Mencocokkan desa dari namanya saja akan memasukkan mitra ke desa
 * yang keliru — tanpa galat, tanpa tanda apa pun, dan baru ketahuan ketika ada
 * yang menyadari alamatnya tidak masuk akal.
 *
 * Bila kecamatannya kosong sementara nama desanya kembar, modul ini MENOLAK
 * menebak dan melaporkannya sebagai 'desa-ambigu' agar manusia yang memilih.
 *
 * Wilayah yang kosong sama sekali bukan masalah: `kecamatan_id` dan `desa_id`
 * di `ppl_master` memang boleh kosong.
 */
export const cocokkanWilayah = (
  namaKecamatan: string | undefined,
  namaDesa: string | undefined,
  kecamatan: WilayahRef[],
  desa: WilayahRef[],
): HasilWilayah => {
  const kecCari = normalkanNamaWilayah(namaKecamatan);
  const desaCari = normalkanNamaWilayah(namaDesa);

  if (kecCari === '' && desaCari === '') {
    return { kecamatanId: null, desaId: null, masalah: null };
  }

  let kecamatanId: number | null = null;
  if (kecCari !== '') {
    const cocok = kecamatan.find(k => normalkanNamaWilayah(k.nama) === kecCari);
    if (!cocok) {
      return {
        kecamatanId: null, desaId: null,
        masalah: 'kecamatan-tidak-dikenal',
        pesan: `Kecamatan "${namaKecamatan}" tidak dikenali.`,
      };
    }
    kecamatanId = cocok.id;
  }

  if (desaCari === '') {
    return { kecamatanId, desaId: null, masalah: null };
  }

  const senama = desa.filter(d => normalkanNamaWilayah(d.nama) === desaCari);

  if (kecamatanId !== null) {
    const diKecamatan = senama.filter(d => d.kecamatanId === kecamatanId);
    if (diKecamatan.length === 0) {
      return {
        kecamatanId, desaId: null,
        masalah: 'desa-tidak-dikenal',
        pesan: `Desa "${namaDesa}" tidak ada di kecamatan "${namaKecamatan}".`,
      };
    }
    return { kecamatanId, desaId: diKecamatan[0].id, masalah: null };
  }

  // Kecamatan kosong: hanya boleh diterima bila namanya tidak kembar.
  if (senama.length === 0) {
    return {
      kecamatanId: null, desaId: null,
      masalah: 'desa-tidak-dikenal',
      pesan: `Desa "${namaDesa}" tidak dikenali.`,
    };
  }
  if (senama.length > 1) {
    return {
      kecamatanId: null, desaId: null,
      masalah: 'desa-ambigu',
      pesan: `Ada ${senama.length} desa bernama "${namaDesa}" di kecamatan berbeda. Isi kolom kecamatan untuk memastikan.`,
    };
  }
  return { kecamatanId: senama[0].kecamatanId ?? null, desaId: senama[0].id, masalah: null };
};

/**
 * Membagikan beberapa ID mitra sekaligus, tanpa saling bertabrakan.
 *
 * Aturan penomorannya sama dengan `client/lib/idOtomatis.ts`: ambil nomor
 * terkecil yang belum terpakai, isi lubang lebih dulu, lalu lanjutkan dari yang
 * tertinggi.
 *
 * KENAPA TIDAK MEMANGGIL nextId BERULANG KALI
 * `nextId` menghitung dari daftar yang diberikan, dan daftar itu tidak ikut
 * bertambah saat ia dipanggil lagi — memanggilnya sepuluh kali menghasilkan
 * SEPULUH ID YANG SAMA. Untuk satu mitra lewat form itu tidak pernah terlihat;
 * untuk impor yang menambah puluhan orang sekaligus, penulisannya gagal di
 * tengah jalan karena ID-nya primary key, setelah sebagian baris terlanjur
 * berubah. Karena itu pembagiannya dilakukan sekali untuk seluruh rombongan.
 */
export const alokasiIdMitra = (
  idTerpakai: string[],
  jumlah: number,
  prefiks = 'PPL',
  lebar = 3,
): string[] => {
  const pola = new RegExp(`^${prefiks}(\\d+)$`, 'i');
  const terpakai = new Set<number>();
  for (const id of idTerpakai) {
    const cocok = String(id ?? '').trim().match(pola);
    if (cocok) {
      const n = parseInt(cocok[1], 10);
      if (Number.isFinite(n) && n > 0) terpakai.add(n);
    }
  }

  const hasil: string[] = [];
  let kandidat = 1;
  for (let i = 0; i < jumlah; i++) {
    while (terpakai.has(kandidat)) kandidat++;
    terpakai.add(kandidat);
    hasil.push(`${prefiks}${String(kandidat).padStart(lebar, '0')}`);
  }
  return hasil;
};
