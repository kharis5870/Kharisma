/**
 * Pembuat ID berurutan yang mengisi lubang.
 *
 * ID di aplikasi ini (USR001, KT001, PPL001) murni pembeda, bukan penanda
 * urutan waktu. Karena itu ID yang ditinggalkan baris terhapus boleh — bahkan
 * sebaiknya — dipakai lagi, supaya penomorannya tidak berlubang selamanya.
 *
 * Aturannya: ambil nomor terkecil yang belum terpakai, mulai dari 1.
 * Kalau USR002 dihapus, akun berikutnya mendapat USR002; setelah semua lubang
 * terisi, penomoran melanjutkan dari yang tertinggi.
 */

/** Mengambil angka dari sebuah ID, mis. "USR012" -> 12. Null bila tidak cocok. */
export const nomorDariId = (id: string, prefiks: string): number | null => {
  const pola = new RegExp(`^${prefiks}(\\d+)$`, 'i');
  const cocok = String(id ?? '').trim().match(pola);
  if (!cocok) return null;
  const n = parseInt(cocok[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * ID berikutnya yang tersedia.
 *
 * @param idTerpakai daftar ID yang sudah ada (boleh bercampur format lain)
 * @param prefiks    mis. "USR"
 * @param lebar      jumlah digit, mis. 3 -> "USR007"
 *
 *   nextId(['USR001','USR003'], 'USR')  -> 'USR002'   (mengisi lubang)
 *   nextId(['USR001','USR002'], 'USR')  -> 'USR003'   (melanjutkan)
 *   nextId([], 'USR')                   -> 'USR001'
 */
export const nextId = (idTerpakai: string[], prefiks: string, lebar = 3): string => {
  const terpakai = new Set<number>();
  for (const id of idTerpakai) {
    const n = nomorDariId(id, prefiks);
    if (n !== null) terpakai.add(n);
  }

  let kandidat = 1;
  while (terpakai.has(kandidat)) kandidat++;

  // Kalau nomornya melampaui lebar yang diminta, biarkan memanjang daripada
  // memotong digit dan menghasilkan ID yang bertabrakan.
  return `${prefiks}${String(kandidat).padStart(lebar, '0')}`;
};
