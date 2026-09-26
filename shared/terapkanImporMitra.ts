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
  /**
   * Kode BPS tiga digit, mis. '040' untuk kecamatan Manna dan '033' untuk desa
   * Kayu Kunyit di dalamnya. Boleh kosong untuk data lama yang belum berkode.
   */
  kode?: string | null;
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
 * Memisahkan satu sel wilayah menjadi kode dan nama.
 *
 * Ada tiga bentuk yang beredar, dan ketiganya harus bisa dibaca:
 *   '040'              ekspor PALAPA — kode saja, TANPA nama
 *   '(041) KOTA MANNA' ekspor mitra sensus — kode dan nama sekaligus
 *   'Kota Manna'       isian manusia dan templat buatan aplikasi ini
 *
 * Kodenya dibaca sebagai teks tiga digit, bukan angka: Excel membaca sel '040'
 * sebagai bilangan 40 kalau selnya bertipe angka, dan '40' tidak akan pernah
 * sama dengan '040' yang tersimpan di database.
 */
export const pisahKodeWilayah = (teks: unknown): { kode: string; nama: string } => {
  const isi = String(teks ?? '').trim();
  if (isi === '') return { kode: '', nama: '' };

  const kodeSaja = isi.match(/^\(?\s*(\d{1,3})\s*\)?$/);
  if (kodeSaja) return { kode: kodeSaja[1].padStart(3, '0'), nama: '' };

  const kodeDanNama = isi.match(/^\(\s*(\d{1,3})\s*\)\s*(.*)$/);
  if (kodeDanNama) {
    return { kode: kodeDanNama[1].padStart(3, '0'), nama: kodeDanNama[2].trim() };
  }
  return { kode: '', nama: isi };
};

/** Satu wilayah dicari lewat kodenya dulu, baru namanya. */
const cariWilayah = (
  kode: string,
  nama: string,
  daftar: WilayahRef[],
): WilayahRef | undefined => {
  if (kode !== '') {
    const lewatKode = daftar.find(w => w.kode === kode);
    if (lewatKode) return lewatKode;
  }
  if (nama === '') return undefined;
  const cari = normalkanNamaWilayah(nama);
  return daftar.find(w => normalkanNamaWilayah(w.nama) === cari);
};

/**
 * Menerjemahkan kecamatan dan desa dari berkas menjadi id.
 *
 * KENAPA KODE DIDAHULUKAN
 * Berkas mitra yang rutin dipakai (ekspor PALAPA) menuliskan wilayah HANYA
 * sebagai kode: '040' dan '033', tanpa satu pun nama. Kalau pencocokan hanya
 * mengandalkan nama, seluruh mitra masuk tanpa wilayah. Kode juga lebih tahan
 * terhadap beda ejaan daripada nama.
 *
 * Namanya tetap dipakai sebagai cadangan supaya berkas yang hanya memuat nama —
 * templat aplikasi ini sendiri dan ekspor mitra sensus — tidak ikut rusak.
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
  selKecamatan: string | undefined,
  selDesa: string | undefined,
  kecamatan: WilayahRef[],
  desa: WilayahRef[],
): HasilWilayah => {
  const kec = pisahKodeWilayah(selKecamatan);
  const des = pisahKodeWilayah(selDesa);
  const tulisKec = String(selKecamatan ?? '').trim();
  const tulisDesa = String(selDesa ?? '').trim();

  const adaKec = kec.kode !== '' || kec.nama !== '';
  const adaDesa = des.kode !== '' || des.nama !== '';

  if (!adaKec && !adaDesa) {
    return { kecamatanId: null, desaId: null, masalah: null };
  }

  let kecamatanId: number | null = null;
  if (adaKec) {
    const cocok = cariWilayah(kec.kode, kec.nama, kecamatan);
    if (!cocok) {
      return {
        kecamatanId: null, desaId: null,
        masalah: 'kecamatan-tidak-dikenal',
        pesan: `Kecamatan "${tulisKec}" tidak dikenali.`,
      };
    }
    kecamatanId = cocok.id;
  }

  if (!adaDesa) {
    return { kecamatanId, desaId: null, masalah: null };
  }

  if (kecamatanId !== null) {
    const cocok = cariWilayah(des.kode, des.nama, desa.filter(d => d.kecamatanId === kecamatanId));
    if (!cocok) {
      return {
        kecamatanId, desaId: null,
        masalah: 'desa-tidak-dikenal',
        pesan: `Desa "${tulisDesa}" tidak ada di kecamatan "${tulisKec}".`,
      };
    }
    return { kecamatanId, desaId: cocok.id, masalah: null };
  }

  // Kecamatan kosong. Kode desa saja TIDAK cukup: nomor urut desa dimulai lagi
  // dari awal di tiap kecamatan, jadi '008' menunjuk delapan desa berbeda.
  // Sama seperti nama kembar, ini dilaporkan sebagai ambigu, bukan ditebak.
  const senada = des.kode !== ''
    ? desa.filter(d => d.kode === des.kode)
    : desa.filter(d => normalkanNamaWilayah(d.nama) === normalkanNamaWilayah(des.nama));

  if (senada.length === 0) {
    return {
      kecamatanId: null, desaId: null,
      masalah: 'desa-tidak-dikenal',
      pesan: `Desa "${tulisDesa}" tidak dikenali.`,
    };
  }
  if (senada.length > 1) {
    const sebutan = des.kode !== '' ? `berkode "${des.kode}"` : `bernama "${tulisDesa}"`;
    return {
      kecamatanId: null, desaId: null,
      masalah: 'desa-ambigu',
      pesan: `Ada ${senada.length} desa ${sebutan} di kecamatan berbeda. Isi kolom kecamatan untuk memastikan.`,
    };
  }
  return { kecamatanId: senada[0].kecamatanId ?? null, desaId: senada[0].id, masalah: null };
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
