// server/services/__uji__/bacaSumberLayanan.ts
//
// Dipakai HANYA oleh tes (*.spec.ts). Tidak diimpor kode aplikasi, jadi tidak
// ikut ter-bundle ke build server.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DIR_LAYANAN = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Teks sumber sebuah layanan BESERTA modul pecahannya, untuk tes yang
 * memeriksa teks sumber.
 *
 * kegiatanService.ts dan kontrakService.ts dipecah per tanggung jawab
 * (kegiatanBaca, kegiatanSimpan, kontrakData, kontrakPenomoran, ...), dan
 * berkas aslinya kini hanya mengekspor ulang. Tes yang dulu membaca satu berkas
 * membaca gabungan ini, supaya aturan yang dikunci tetap berlaku di mana pun
 * kodenya kini berada — bukan diam-diam hijau karena berkas aslinya kosong.
 *
 * Modul pecahan dikenali dari awalan namanya ("kontrakService.ts" -> semua
 * "kontrak*.ts"). Urutannya: berkas asli, lalu pecahan menurut urutan
 * kemunculannya di ekspor ulang (= urutan kode sebelum dipecah), lalu sisanya
 * menurut abjad. Layanan yang tidak dipecah dikembalikan apa adanya.
 *
 * @param berkas nama berkas layanan, boleh diawali "./"
 */
export const bacaSumberLayanan = (berkas: string): string => {
  const nama = berkas.replace(/^\.\//, "");
  const induk = readFileSync(join(DIR_LAYANAN, nama), "utf8");
  if (!nama.endsWith("Service.ts")) return induk;

  const awalan = nama.slice(0, -"Service.ts".length);
  const urutanEkspor = [...induk.matchAll(/from ['"]\.\/([A-Za-z0-9]+)['"]/g)].map(m => m[1] + ".ts");
  const pecahan = readdirSync(DIR_LAYANAN)
    .filter(n => n.startsWith(awalan) && n !== nama && n.endsWith(".ts") && !n.endsWith(".spec.ts"))
    .sort((a, b) => {
      const ia = urutanEkspor.indexOf(a);
      const ib = urutanEkspor.indexOf(b);
      return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib)
        || a.localeCompare(b);
    });

  return [induk, ...pecahan.map(n => readFileSync(join(DIR_LAYANAN, n), "utf8"))].join("\n");
};
