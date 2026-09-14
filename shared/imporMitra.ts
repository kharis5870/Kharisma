/**
 * Membaca berkas mitra dari aplikasi SOBAT: mengenali kolom, dan memutuskan
 * baris mana yang orang baru dan baris mana yang orang yang sudah ada.
 *
 * Murni — hanya string, angka, dan array — supaya bisa diuji tanpa berkas Excel
 * dan tanpa database, dan supaya aturan yang sama dipakai layar (saat menyusun
 * pratinjau) maupun server (saat benar-benar menulis).
 *
 * TIGA KEPUTUSAN YANG MELANDASI SELURUH BERKAS INI
 *
 * 1. KOLOM DICOCOKKAN LEWAT NAMA HEADER, BUKAN URUTAN. Orang menggeser kolom,
 *    menambah kolom catatan sendiri, dan SOBAT bisa mengubah ekspornya. Importir
 *    yang menuntut urutan tetap akan gagal setiap tahun.
 *
 * 2. YANG MENGENALI ORANG ADALAH `sobatId`, BUKAN NAMA. Nama kembar di satu
 *    kabupaten itu biasa, dan salah gabung berarti honor serta riwayat orang
 *    lain menempel ke seseorang. Nama hanya dipakai sebagai DUGAAN yang wajib
 *    dikonfirmasi manusia — dan hanya pada impor pertama, ketika belum ada
 *    satu pun mitra yang punya sobatId.
 *
 * 3. TIDAK ADA YANG DIHAPUS. Modul ini tidak pernah mengusulkan penghapusan.
 *    Mitra yang tidak ada lagi di berkas SOBAT cukup DINONAKTIFKAN, karena
 *    menghapusnya akan menghanguskan surat kontraknya (kontrak_mitra
 *    ON DELETE CASCADE) dan memutus alokasi kegiatannya.
 */

export type KolomMitra =
  | 'sobatId' | 'nama' | 'posisi' | 'alamat' | 'telepon' | 'kecamatan' | 'desa';

/**
 * Nama header yang dikenali untuk tiap kolom, sudah dalam bentuk ternormalkan.
 *
 * Daftar ini sengaja longgar: menambah satu ejaan di sini jauh lebih murah
 * daripada menyuruh pengguna menyunting berkas ekspor.
 */
export const ALIAS_KOLOM: Record<KolomMitra, string[]> = {
  sobatId: ['sobatid', 'idsobat', 'idmitrasobat', 'kodesobat', 'nomorsobat'],
  nama: ['nama', 'namamitra', 'namappl', 'namalengkap', 'namapetugas'],
  posisi: ['posisi', 'jenispetugas', 'peran', 'jabatan'],
  alamat: ['alamat', 'alamatlengkap', 'alamatdomisili'],
  telepon: ['telepon', 'notelepon', 'nohp', 'hp', 'nomorhp', 'nomortelepon', 'kontak'],
  kecamatan: ['kecamatan', 'namakecamatan', 'kec'],
  desa: ['desa', 'namadesa', 'kelurahan', 'desakelurahan'],
};

/** Tanpa kolom ini berkas tidak bisa dibaca sama sekali. */
export const KOLOM_WAJIB: KolomMitra[] = ['nama'];

/**
 * Menyeragamkan teks header supaya beda penulisan tidak jadi beda kolom:
 * "ID SOBAT", "id_sobat", dan "Id. Sobat" semuanya menjadi "idsobat".
 */
export const normalkanHeader = (teks: unknown): string =>
  String(teks ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Memetakan tiap kolom yang dikenali ke INDEKS kolomnya di berkas.
 *
 * Kolom yang tidak dikenali diabaikan, tidak membatalkan pembacaan — berkas
 * ekspor hampir selalu membawa kolom lain yang tidak kita perlukan.
 * Bila satu kolom muncul dua kali, yang pertama yang dipakai.
 */
export const petakanKolom = (header: unknown[]): Record<KolomMitra, number | null> => {
  const hasil = {} as Record<KolomMitra, number | null>;
  const ternormal = header.map(normalkanHeader);

  for (const kolom of Object.keys(ALIAS_KOLOM) as KolomMitra[]) {
    const alias = ALIAS_KOLOM[kolom];
    const indeks = ternormal.findIndex(h => h !== '' && alias.includes(h));
    hasil[kolom] = indeks >= 0 ? indeks : null;
  }
  return hasil;
};

/** Kolom wajib yang tidak ditemukan; kosong berarti berkas bisa dibaca. */
export const kolomWajibHilang = (peta: Record<KolomMitra, number | null>): KolomMitra[] =>
  KOLOM_WAJIB.filter(k => peta[k] === null);

/**
 * Mencari baris mana yang berisi header, bukan mengandaikan baris pertama.
 *
 * Berkas ekspor sering diawali baris judul, baris periode, dan baris kosong —
 * termasuk berkas yang diekspor aplikasi ini sendiri. Kalau header dianggap
 * selalu di baris pertama, template buatan kita sendiri pun gagal diimpor, dan
 * pesan galatnya ("kolom nama tidak ditemukan") justru menyesatkan karena
 * kolomnya jelas-jelas ada.
 *
 * Yang dipilih adalah baris dengan kolom dikenali TERBANYAK di antara beberapa
 * baris pertama, dan hanya bila kolom wajibnya lengkap. Mengembalikan -1 bila
 * tidak ada baris yang memenuhi — pemanggilnya lalu menawarkan pemetaan manual.
 */
export const cariBarisHeader = (baris: unknown[][], maksPeriksa = 10): number => {
  let terbaik = -1;
  let skorTerbaik = 0;

  for (let i = 0; i < Math.min(baris.length, maksPeriksa); i++) {
    const peta = petakanKolom(baris[i] ?? []);
    if (kolomWajibHilang(peta).length > 0) continue;
    const skor = (Object.keys(peta) as KolomMitra[]).filter(k => peta[k] !== null).length;
    if (skor > skorTerbaik) {
      skorTerbaik = skor;
      terbaik = i;
    }
  }
  return terbaik;
};

export type PosisiMitra = 'Pendataan' | 'Pengolahan' | 'Pendataan/Pengolahan';

/**
 * Menyeragamkan tulisan posisi. Tidak dikenali menghasilkan null supaya
 * pemanggilnya bisa melaporkannya, bukan diam-diam menebak.
 */
export const normalkanPosisi = (teks: unknown): PosisiMitra | null => {
  const t = normalkanHeader(teks);
  if (t === '') return null;
  const adaData = t.includes('pendataan') || t.includes('cacah') || t.includes('listing');
  const adaOlah = t.includes('pengolahan') || t.includes('olah') || t.includes('entri');
  if (adaData && adaOlah) return 'Pendataan/Pengolahan';
  if (adaOlah) return 'Pengolahan';
  if (adaData) return 'Pendataan';
  return null;
};

export interface BarisImpor {
  /** Nomor baris di berkas, untuk ditunjuk saat melaporkan masalah. */
  nomorBaris: number;
  sobatId?: string;
  nama: string;
  posisi?: PosisiMitra | null;
  alamat?: string;
  telepon?: string;
  kecamatan?: string;
  desa?: string;
}

const teks = (nilai: unknown): string => String(nilai ?? '').trim();

/** Menyusun satu baris berkas menjadi data mitra, menurut peta kolom. */
export const bacaBaris = (
  sel: unknown[],
  peta: Record<KolomMitra, number | null>,
  nomorBaris: number,
): BarisImpor => {
  const ambil = (kolom: KolomMitra): string =>
    peta[kolom] === null ? '' : teks(sel[peta[kolom] as number]);

  return {
    nomorBaris,
    sobatId: ambil('sobatId') || undefined,
    nama: ambil('nama'),
    posisi: normalkanPosisi(ambil('posisi')),
    alamat: ambil('alamat') || undefined,
    // Angka telepon sering terbaca sebagai bilangan sehingga nol di depannya
    // hilang; yang bukan angka dibuang supaya "0812-3456" dan "0812 3456" sama.
    telepon: ambil('telepon').replace(/[^0-9]/g, '') || undefined,
    kecamatan: ambil('kecamatan') || undefined,
    desa: ambil('desa') || undefined,
  };
};

export interface MitraTersimpan {
  id: string;
  sobatId?: string | null;
  nama: string;
}

export type JenisTemuan =
  /** Belum ada padanannya; akan ditambahkan sebagai mitra baru. */
  | 'baru'
  /** Cocok pasti lewat sobatId; datanya akan diperbarui. */
  | 'cocok'
  /** Namanya sama dengan mitra yang ada, tapi belum tentu orang yang sama. */
  | 'mirip'
  /** Muncul lebih dari sekali DI DALAM berkas yang sama. */
  | 'ganda'
  /** Tidak bisa dipakai, mis. namanya kosong. */
  | 'tidak-sah';

export interface Temuan {
  baris: BarisImpor;
  jenis: JenisTemuan;
  /** Mitra tersimpan yang dianggap padanannya, untuk 'cocok' dan 'mirip'. */
  mitraId?: string;
  pesan?: string;
}

const kunciNama = (nama: string): string =>
  nama.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Menggolongkan setiap baris berkas terhadap mitra yang sudah tersimpan.
 *
 * Tidak menulis apa pun dan tidak memutuskan apa pun: hasilnya menjadi bahan
 * pratinjau, dan baris 'mirip' harus dikonfirmasi manusia sebelum digabungkan.
 *
 * Urutan pemeriksaannya menentukan dan disengaja:
 *   tidak-sah -> ganda -> cocok (sobatId) -> mirip (nama) -> baru
 * Baris ganda diperiksa SEBELUM pencocokan karena menulis dua baris dengan
 * sobatId sama akan ditolak database di tengah jalan — lebih baik ketahuan di
 * pratinjau daripada menggagalkan impor yang sudah berjalan separuh.
 */
export const periksaImpor = (
  baris: BarisImpor[],
  tersimpan: MitraTersimpan[],
): Temuan[] => {
  const perSobatId = new Map<string, MitraTersimpan>();
  const perNama = new Map<string, MitraTersimpan[]>();
  for (const m of tersimpan) {
    if (m.sobatId) perSobatId.set(m.sobatId.trim(), m);
    const kunci = kunciNama(m.nama);
    const daftar = perNama.get(kunci);
    if (daftar) daftar.push(m); else perNama.set(kunci, [m]);
  }

  const hitungSobatId = new Map<string, number>();
  for (const b of baris) {
    if (!b.sobatId) continue;
    hitungSobatId.set(b.sobatId, (hitungSobatId.get(b.sobatId) ?? 0) + 1);
  }

  return baris.map<Temuan>(b => {
    if (b.nama.trim() === '') {
      return { baris: b, jenis: 'tidak-sah', pesan: 'Nama kosong.' };
    }
    if (b.sobatId && (hitungSobatId.get(b.sobatId) ?? 0) > 1) {
      return { baris: b, jenis: 'ganda', pesan: `ID SOBAT ${b.sobatId} muncul lebih dari sekali di berkas ini.` };
    }

    const pasti = b.sobatId ? perSobatId.get(b.sobatId.trim()) : undefined;
    if (pasti) {
      return { baris: b, jenis: 'cocok', mitraId: pasti.id };
    }

    const senama = perNama.get(kunciNama(b.nama)) ?? [];
    if (senama.length > 0) {
      return {
        baris: b,
        jenis: 'mirip',
        mitraId: senama[0].id,
        pesan: senama.length > 1
          ? `Ada ${senama.length} mitra bernama sama. Pastikan yang mana.`
          : `Nama sama dengan ${senama[0].id}. Pastikan orangnya sama.`,
      };
    }

    return { baris: b, jenis: 'baru' };
  });
};

/**
 * Mitra tersimpan yang TIDAK muncul di berkas impor.
 *
 * Mereka bukan untuk dihapus, melainkan calon untuk dinonaktifkan — dan itu
 * pun keputusan pengguna, bukan otomatis: berkas yang diimpor bisa saja hanya
 * memuat sebagian mitra (mis. satu kecamatan).
 */
export const tidakAdaDiBerkas = (
  baris: BarisImpor[],
  tersimpan: MitraTersimpan[],
): MitraTersimpan[] => {
  const sobatIdBerkas = new Set(baris.map(b => b.sobatId).filter(Boolean) as string[]);
  const namaBerkas = new Set(baris.map(b => kunciNama(b.nama)));
  return tersimpan.filter(m => {
    if (m.sobatId && sobatIdBerkas.has(m.sobatId.trim())) return false;
    return !namaBerkas.has(kunciNama(m.nama));
  });
};

export interface RingkasanImpor {
  baru: number;
  cocok: number;
  mirip: number;
  ganda: number;
  tidakSah: number;
}

/** Angka untuk layar pratinjau sebelum apa pun ditulis. */
export const ringkasTemuan = (temuan: Temuan[]): RingkasanImpor => ({
  baru: temuan.filter(t => t.jenis === 'baru').length,
  cocok: temuan.filter(t => t.jenis === 'cocok').length,
  mirip: temuan.filter(t => t.jenis === 'mirip').length,
  ganda: temuan.filter(t => t.jenis === 'ganda').length,
  tidakSah: temuan.filter(t => t.jenis === 'tidak-sah').length,
});
