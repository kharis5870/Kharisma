/**
 * Penyusunan nomor surat dari pola template.
 *
 * Logika ini sebelumnya ada di DUA tempat yang disalin manual: `susunNomorSurat`
 * di `server/services/kontrakService.ts` dan `contohNomorSurat` di
 * `client/lib/polaNomorSurat.ts`. Keduanya harus selalu sama, karena angka yang
 * diperlihatkan di layar sebelum menyimpan template adalah janji tentang apa
 * yang nanti tercetak di surat resmi. Surat BAST membutuhkan penyusun yang sama
 * dengan pola berbeda, jadi disatukan di sini sebelum tersalin ke tempat ketiga.
 *
 * PENTING untuk kode server: impor lewat jalur relatif
 * (`../../shared/nomorSurat`), BUKAN `@shared/...` — alias itu tidak tersedia
 * saat `vite.config.ts` memuat kode server lewat Node.
 */

const NAMA_BULAN = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];

const ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/** Penanda yang dikenali. Penanda lain dibiarkan apa adanya oleh penyusun. */
export const PENANDA_SAH = ['{nomor}', '{BULAN}', '{bulan}', '{ROMAWI}', '{tahun}'] as const;

/**
 * Penanda yang WAJIB ada.
 *
 * Tanpa `{nomor}`, pola menghasilkan teks yang sama untuk setiap mitra sehingga
 * seluruh surat pada satu periode terbit dengan nomor identik — persis yang
 * dicegah oleh seluruh mekanisme pemesanan nomor. Ini bukan kasus teoretis:
 * pola pernah terisi angka harfiah ("097/SPK/FEBRUARI/II/2026") dan lolos,
 * karena pemeriksaan yang lama hanya mencari penanda yang SALAH TULIS dan tidak
 * menyadari pola tanpa penanda sama sekali.
 */
export const PENANDA_WAJIB = '{nomor}';

/**
 * Mengisi penanda pola nomor surat.
 *
 * @param nomorUrut nomor urut mitra pada tahun berjalan
 * @param tanggal   tanggal surat; menentukan {BULAN}, {bulan}, {ROMAWI}, {tahun}
 */
export const susunNomorSurat = (pola: string, nomorUrut: number, tanggal: Date): string => {
  const bulanIndex = tanggal.getMonth();
  return String(pola ?? '')
    .replace(/\{nomor\}/g, String(nomorUrut).padStart(3, '0'))
    .replace(/\{BULAN\}/g, NAMA_BULAN[bulanIndex])
    .replace(/\{bulan\}/g, String(bulanIndex + 1).padStart(2, '0'))
    .replace(/\{ROMAWI\}/g, ROMAWI[bulanIndex])
    .replace(/\{tahun\}/g, String(tanggal.getFullYear()));
};

/** Penanda `{...}` yang dipakai di sebuah pola tapi tidak dikenali penyusun. */
export const penandaTidakDikenal = (pola: string): string[] => {
  const dipakai = String(pola ?? '').match(/\{[^{}]*\}/g) ?? [];
  const sah = new Set<string>(PENANDA_SAH);
  // Duplikat dibuang supaya pesan galatnya tidak mengulang penanda yang sama.
  return Array.from(new Set(dipakai.filter(p => !sah.has(p))));
};

/** Apakah pola kehilangan `{nomor}` sehingga semua surat akan bernomor sama? */
export const polaTanpaNomor = (pola: string): boolean =>
  !String(pola ?? '').includes(PENANDA_WAJIB);
