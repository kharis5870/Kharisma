/**
 * Aturan password — satu sumber untuk layar dan server.
 *
 * Sebelumnya minimal 6 karakter, dan hanya layar yang memeriksanya saat admin
 * membuat atau mengubah akun: permintaan yang dikirim langsung ke API bisa
 * menyimpan password satu huruf. Sekarang server menegakkan aturan yang sama.
 *
 * Aturan ini hanya berlaku saat password DIBUAT atau DIGANTI. Akun yang
 * password-nya sudah tersimpan tetap bisa login seperti biasa.
 *
 * PENTING untuk kode server: impor lewat jalur relatif
 * (`../../shared/aturanPassword`), BUKAN `@shared/...`.
 */

export const PANJANG_MIN_PASSWORD = 8;

/**
 * bcrypt hanya membaca 72 byte pertama; sisanya diabaikan diam-diam. Password
 * yang lebih panjang terlihat diterima padahal ekornya tidak berarti apa-apa.
 */
export const PANJANG_MAKS_PASSWORD = 72;

/**
 * Mengembalikan kalimat galat bila password tidak memenuhi aturan, atau `null`
 * bila boleh dipakai.
 *
 * @param username bila diisi, password yang sama dengan username ditolak —
 *                 itu tebakan pertama siapa pun.
 */
export const periksaPassword = (password: unknown, username?: string | null): string | null => {
  if (typeof password !== 'string' || password.trim().length === 0) {
    return 'Password wajib diisi.';
  }
  if (password.length < PANJANG_MIN_PASSWORD) {
    return `Password minimal ${PANJANG_MIN_PASSWORD} karakter.`;
  }
  // Dihitung dalam byte (UTF-8), sama dengan cara bcrypt membacanya.
  if (new TextEncoder().encode(password).length > PANJANG_MAKS_PASSWORD) {
    return `Password maksimal ${PANJANG_MAKS_PASSWORD} karakter.`;
  }
  if (username && password.trim().toLowerCase() === username.trim().toLowerCase()) {
    return 'Password tidak boleh sama dengan username.';
  }
  return null;
};
