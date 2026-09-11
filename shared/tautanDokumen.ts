/**
 * Validasi dan normalisasi tautan dokumen kegiatan.
 *
 * Dokumen kegiatan dikumpulkan sebagai tautan Google Drive, dan sampai sekarang
 * TIDAK ada validasi sama sekali: salah ketik diterima diam-diam lalu baru
 * ketahuan berbulan-bulan kemudian saat seseorang mengkliknya.
 *
 * Modul ini dipakai klien DAN server, jadi ia harus murni — hanya `URL` dan
 * string, tanpa impor apa pun. `URL` tersedia di semua peramban dan Node 18+.
 *
 * PENTING untuk kode server: impor lewat jalur relatif
 * (`../../shared/tautanDokumen`), BUKAN `@shared/...`. Alias itu tidak tersedia
 * saat `vite.config.ts` memuat kode server lewat Node — impor tipe memang
 * terhapus saat kompilasi, tapi nilai runtime seperti fungsi di sini tidak.
 */

/**
 * Batas panjang tautan.
 *
 * WAJIB sama dengan lebar kolom `dokumen.link` (VARCHAR(512), lihat migrasi
 * `db/migrations/2026-09-12-tautan-dokumen.sql`). Kolomnya dulu VARCHAR(255),
 * dan pada MariaDB yang tidak berjalan di mode STRICT — bawaan banyak cPanel —
 * kelebihannya DIPOTONG tanpa pesan galat: tautan tampak tersimpan tapi rusak
 * saat dibuka. Menolak di sini jauh lebih baik daripada memotong diam-diam.
 */
export const BATAS_PANJANG_TAUTAN = 512;

export interface HasilPeriksaTautan {
  sah: boolean;
  /** Tautan yang sudah dirapikan. INI yang disimpan, bukan masukan mentah. */
  tautan: string;
  /** Pesan siap tampil untuk pengguna. Kosong bila sah. */
  galat?: string;
  /** Catatan yang TIDAK menghalangi simpan, mis. "bukan tautan Google Drive". */
  peringatan?: string;
}

/**
 * Parameter Google Drive yang aman dibuang.
 *
 * Semuanya penanda asal-klik, bukan penunjuk isi. `authuser` sengaja ikut
 * dibuang: ia mengunci tautan ke akun tertentu di peramban pembuka, dan justru
 * itulah penyebab umum pesan "Anda perlu akses" pada tautan yang sebetulnya
 * sudah dibagikan.
 */
const PARAMETER_DIBUANG = [
  "usp",
  "usp_dm",
  "sharingaction",
  "ouid",
  "rtpof",
  "sd",
  "pli",
  "authuser",
];

/** Host yang diperlakukan sebagai Google, untuk normalisasi parameter. */
const HOST_GOOGLE = /(^|\.)google\.com$/i;

/**
 * Membersihkan hasil tempelan.
 *
 * Menempel dari Drive atau dari chat kerap membawa spasi, baris baru, tanda
 * kutip pembungkus, dan karakter zero-width (U+200B..U+200D, U+FEFF) yang tidak
 * terlihat di kotak isian tapi membuat URL gagal diurai.
 */
export const rapikanTautan = (mentah: string): string =>
  String(mentah ?? "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/^["'<]+|["'>]+$/g, "")
    .trim();

/**
 * Menormalkan tautan Google Drive/Docs/Sheets.
 *
 * Sengaja konservatif — hanya membuang yang PASTI sampah. Tidak mengubah
 * `/edit` menjadi `/view` atau sebaliknya, tidak menulis ulang `open?id=`, dan
 * tidak menaikkan http ke https: semua itu mengubah arti tautan, dan kalau
 * tebakannya meleset dokumennya jadi tidak bisa dibuka.
 *
 * Fragment (`#gid=`, `#heading=`) DIPERTAHANKAN — itu jangkar isi, bukan sampah.
 *
 * Harus idempoten: menormalkan hasil normalisasi tidak boleh mengubah apa pun.
 */
export const normalkanTautanDrive = (tautan: string): string => {
  let url: URL;
  try {
    url = new URL(tautan);
  } catch {
    return tautan; // bukan URL sah; biarkan `periksaTautan` yang menolaknya
  }

  if (!HOST_GOOGLE.test(url.hostname)) return tautan;

  for (const parameter of PARAMETER_DIBUANG) url.searchParams.delete(parameter);

  // `URL.toString()` menyisakan '?' menggantung saat kuerinya jadi kosong.
  return url.toString().replace(/\?(?=#|$)/, "");
};

/**
 * Satu pintu validasi dan normalisasi. Dipakai UI maupun server.
 *
 * @param opsi.wajib bila true, tautan kosong dianggap galat
 */
export const periksaTautan = (
  mentah: string | null | undefined,
  opsi: { wajib?: boolean } = {},
): HasilPeriksaTautan => {
  const bersih = rapikanTautan(mentah ?? "");

  if (!bersih) {
    return opsi.wajib
      ? { sah: false, tautan: "", galat: "Link dokumen belum diisi." }
      : { sah: true, tautan: "" };
  }

  // Menempel dari bilah alamat kerap kehilangan skemanya. Ini kasus paling
  // sering dan paling aman untuk ditolong, bukan ditolak.
  const berskema = /^[a-z][a-z0-9+.-]*:/i.test(bersih);
  const calon = berskema ? bersih : `https://${bersih}`;

  let url: URL;
  try {
    url = new URL(calon);
  } catch {
    return {
      sah: false,
      tautan: bersih,
      galat: "Format link tidak dikenali. Contoh yang benar: https://drive.google.com/…",
    };
  }

  // Penolakan yang paling penting. `ViewDocuments` merender tautan ini sebagai
  // `<a href>`, jadi skema `javascript:` yang tersimpan akan benar-benar
  // dieksekusi saat dibuka orang lain.
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      sah: false,
      tautan: bersih,
      galat: `Link harus diawali http:// atau https:// (yang diisi: ${url.protocol.replace(":", "")}).`,
    };
  }

  if (!url.hostname.includes(".")) {
    return { sah: false, tautan: bersih, galat: "Alamat link tidak lengkap." };
  }

  const hasil = normalkanTautanDrive(url.toString());

  if (hasil.length > BATAS_PANJANG_TAUTAN) {
    return {
      sah: false,
      tautan: hasil,
      galat: `Link terlalu panjang (${hasil.length} karakter, maksimal ${BATAS_PANJANG_TAUTAN}).`,
    };
  }

  // Host non-Google TIDAK ditolak: sebagian dokumen sah memang berada di
  // SharePoint atau OneDrive kantor. Cukup diberi catatan supaya salah tempel
  // yang kebetulan berupa URL sah tetap terlihat oleh pengisinya.
  const peringatan = HOST_GOOGLE.test(url.hostname)
    ? undefined
    : `Link ini bukan Google Drive (${url.hostname}). Pastikan alamatnya benar.`;

  return { sah: true, tautan: hasil, ...(peringatan ? { peringatan } : {}) };
};

/**
 * Penjaga sisi BACA: href yang aman dirender di `<a>`, atau null bila bukan
 * http/https.
 *
 * Sengaja TIDAK menolak maupun mengubah data. Baris lama yang tersimpan sebelum
 * validasi ada harus tetap bisa dibuka; yang ditolak di sini hanya skema yang
 * berbahaya bila diklik.
 */
export const hrefAman = (tautan?: string | null): string | null => {
  const bersih = rapikanTautan(tautan ?? "");
  if (!bersih) return null;
  try {
    const url = new URL(bersih);
    return url.protocol === "http:" || url.protocol === "https:" ? bersih : null;
  } catch {
    return null;
  }
};
