/**
 * Penyimpanan token sesi di peramban.
 *
 * Dipisah ke modul sendiri supaya `apiClient` tidak perlu tahu-menahu soal
 * React maupun AuthContext — ia hanya butuh satu fungsi untuk membaca token,
 * dan itu tidak boleh menciptakan ketergantungan melingkar.
 *
 * Disimpan di localStorage, satu tempat dengan data pengguna yang memang sudah
 * disimpan di sana. Konsekuensinya token ikut terbaca oleh skrip mana pun yang
 * berhasil berjalan di halaman ini; perlindungan sesungguhnya terhadap itu
 * adalah tidak pernah merender masukan pengguna sebagai HTML — dan tautan
 * dokumen, satu-satunya tempat pengguna memasok URL, sudah disaring skemanya
 * di `shared/tautanDokumen.ts`.
 */

const KUNCI = 'token';

export const simpanToken = (token: string): void => {
  try { localStorage.setItem(KUNCI, token); } catch { /* mode privat */ }
};

export const ambilToken = (): string | null => {
  try { return localStorage.getItem(KUNCI); } catch { return null; }
};

export const hapusToken = (): void => {
  try { localStorage.removeItem(KUNCI); } catch { /* mode privat */ }
};
