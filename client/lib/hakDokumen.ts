/**
 * Aturan seputar penanggung jawab dokumen.
 *
 * Dikumpulkan di sini karena aturannya dipakai di tiga halaman sekaligus
 * (View Documents, Edit Kegiatan, Dashboard) dan sebagiannya punya kembaran di
 * SQL. Kalau kondisinya disalin di tiap tempat, cepat atau lambat salah satunya
 * akan menyimpang — dan gejalanya berupa dokumen yang bisa disunting orang yang
 * salah, atau peringatan tenggat yang muncul pada orang yang tidak bisa
 * berbuat apa-apa.
 */

import type { Dokumen, UserData } from "@shared/api";

type DokumenPenanggungJawab = Pick<Dokumen, "penanggungJawab">;

/**
 * Apakah dokumen ini tanggung jawab tim keuangan?
 *
 * `undefined` diperlakukan sebagai 'ketua_tim'. Ini bukan sekadar kehati-hatian:
 * respons yang masih tersimpan di cache React Query dari sebelum kolom ini ada
 * memang tidak memuat field tersebut.
 */
export const dikelolaKeuangan = (dok?: DokumenPenanggungJawab | null): boolean =>
  dok?.penanggungJawab === "keuangan";

/**
 * Siapa yang boleh mengubah penanda dan mengisi link dokumen keuangan.
 *
 * Sama persis dengan gerbang persetujuan dokumen (`bolehMenyetujui`): tim
 * keuangan di aplikasi ini diwakili role supervisor, ditambah admin.
 */
export const bolehMengelolaDokumenKeuangan = (role?: UserData["role"]): boolean =>
  role === "admin" || role === "supervisor";

/** Boleh mengisi link dokumen ini dari View Documents? */
export const bolehMengisiLinkKeuangan = (
  dok: DokumenPenanggungJawab | null | undefined,
  role?: UserData["role"],
): boolean => dikelolaKeuangan(dok) && bolehMengelolaDokumenKeuangan(role);

/**
 * Boleh disunting lewat jalur ketua tim (Edit Kegiatan)?
 *
 * Dokumen keuangan dikunci di sana bahkan untuk admin: satu dokumen sebaiknya
 * hanya punya satu jalur pengisian, supaya tidak ada dua tempat yang bisa saling
 * menimpa.
 */
export const bolehKetuaTimMenyunting = (
  dok: DokumenPenanggungJawab | null | undefined,
  bolehMengedit: boolean,
): boolean => bolehMengedit && !dikelolaKeuangan(dok);

/**
 * Apakah dokumen ini ikut menahan tenggat dan peringatan ketua tim?
 *
 * KEMBARAN SQL: `qTenggat` di `server/services/notifikasiService.ts` memakai
 * `d.isWajib = 1 AND d.penanggungJawab = 'ketua_tim'`. Kalau salah satunya
 * diubah, ubah keduanya — kalau tidak, dashboard dan lonceng notifikasi akan
 * bercerita berbeda tentang kegiatan yang sama.
 */
export const menahanTenggatKetuaTim = (
  dok: Pick<Dokumen, "isWajib" | "penanggungJawab">,
): boolean => Boolean(dok.isWajib) && !dikelolaKeuangan(dok);

/** Label singkat untuk badge di layar. */
export const labelPenanggungJawab = (dok?: DokumenPenanggungJawab | null): string =>
  dikelolaKeuangan(dok) ? "Tim Keuangan" : "Ketua Tim";
