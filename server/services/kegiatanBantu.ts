// Dipisah dari server/services/kegiatanService.ts tanpa mengubah isinya.

import { RowDataPacket } from 'mysql2';
import db from '../db';
import { Kegiatan, PPL, ProgressType } from '@shared/api';
import { normalkanKetuaTimId, pesanKetuaTimTidakDikenal } from '../../shared/ketuaTim';

/**
 * Galat link dokumen, ditandai 400.
 *
 * Route `PUT /kegiatan/:id` sudah menghormati `error.statusCode`; tanpa penanda
 * ini link yang salah ketik akan dilaporkan sebagai 500 seolah aplikasinya yang
 * rusak, padahal itu murni kesalahan masukan yang bisa diperbaiki pengguna.
 */
export const galatTautan = (namaDokumen: string, pesan?: string) => {
    const galat: any = new Error(`Link dokumen "${namaDokumen}" tidak valid: ${pesan}`);
    galat.statusCode = 400;
    return galat;
};

/**
 * Menormalkan lalu MEMVERIFIKASI ketua tim sebelum kegiatan disimpan.
 *
 * `ketua_tim_id` adalah satu-satunya field di fungsi simpan yang selama ini
 * dikirim mentah tanpa penjaga, padahal ia punya foreign key. Akibatnya id yang
 * sudah tidak ada — misalnya karena ketua timnya dihapus sementara halaman Edit
 * Kegiatan masih memegang salinan lama — membuat MySQL menolak SELURUH
 * penyimpanan dengan pesan constraint yang tidak bisa dibaca pengguna.
 *
 * Dipanggil SEBELUM `beginTransaction()` supaya tidak ada transaksi yang perlu
 * di-rollback hanya untuk memeriksa satu baris.
 *
 * `null` diteruskan apa adanya: kolomnya nullable dan foreign key-nya
 * ON DELETE SET NULL, jadi kegiatan tanpa ketua tim itu keadaan yang sah.
 */
export const pastikanKetuaTimAda = async (nilai: unknown): Promise<string | null> => {
    const id = normalkanKetuaTimId(nilai);
    if (id === null) return null;

    const [rows] = await db.query<RowDataPacket[]>(
        'SELECT id FROM ketua_tim WHERE id = ? LIMIT 1', [id]
    );
    if (rows.length === 0) {
        const galat: any = new Error(pesanKetuaTimTidakDikenal(id));
        galat.statusCode = 400;
        // Dibaca klien untuk memaksa pilih ulang, bukan sekadar menampilkan pesan.
        galat.details = { code: 'KETUA_TIM_TIDAK_DITEMUKAN', ketuaTimId: id };
        throw galat;
    }
    return id;
};

// --- TYPE DEFINITIONS ---
export interface HonorariumSettings {
    satuanBebanKerja: string;
    hargaSatuan: string;
}

export interface KegiatanPacket extends Kegiatan, RowDataPacket {}
export interface PPLPacket extends PPL, RowDataPacket {}
export interface ProgressPacket extends RowDataPacket {
    ppl_id: number;
    progress_type: ProgressType;
    value: number;
}
export interface HonorariumPacket extends RowDataPacket {
    ppl_id: number;
    jenis_pekerjaan: 'listing' | 'pencacahan' | 'pengolahan';
    bebanKerja: number;
    satuanBebanKerja: string;
    hargaSatuan: number;
    besaranHonor: number;
}
// --- END OF TYPE DEFINITIONS ---

// Klien kadang mengirim nilai rupiah sebagai string ter-format dengan titik
// ribuan ("1.2002" untuk 12002). parseInt() polos akan memotongnya jadi 1,
// yang merusak ppl_honorarium.hargaSatuan. Selalu lewatkan nilai rupiah dari
// klien ke sini sebelum disimpan.
export const parseRupiah = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  return parseInt(String(value).replace(/\./g, ''), 10) || 0;
};

/**
 * Tanggal kalender WIB, apa pun zona waktu mesin servernya.
 *
 * Sebelumnya dihitung dengan getter lokal (`getDate()` dst.), yang mengikuti
 * zona waktu MESIN. Di laptop (WIB) hasilnya benar, tetapi server cPanel
 * umumnya berjalan dalam UTC: tanggal 8 September yang dipilih di layar tiba
 * sebagai "2026-09-07T17:00:00.000Z" dan tersimpan sebagai 7 September.
 */
export const FORMAT_TANGGAL_WIB = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
});

export const formatDateForDb = (dateInput: string | Date | null | undefined): string | null => {
  if (!dateInput) {
    return null;
  }
  // Sudah berbentuk tanggal kalender: dipakai apa adanya, tanpa lewat Date
  // yang bisa menggesernya.
  if (typeof dateInput === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateInput)) {
    return dateInput;
  }
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return null;
    }
    // en-CA menghasilkan yyyy-MM-dd.
    return FORMAT_TANGGAL_WIB.format(date);
  } catch (error) {
    console.error("Gagal memformat tanggal:", dateInput, error);
    return null;
  }
};

// =================================================================
// START OF MODIFICATION: calculateProgress function
// =================================================================
export const calculateProgress = (ppl: PPL[], tahap: PPL['tahap'] | 'pendataan', type: 'Approved' | 'Submitted'): number => {
    // Menangani kasus gabungan 'listing' dan 'pencacahan'
    const pplTahap = tahap === 'pendataan'
        ? ppl.filter(p => p.tahap === 'listing' || p.tahap === 'pencacahan')
        : ppl.filter(p => p.tahap === tahap);

    if (pplTahap.length === 0) return 0;

    const totalBebanKerja = pplTahap.reduce((acc, p) => acc + (parseInt(p.bebanKerja) || 0), 0);
    if (totalBebanKerja === 0) return 0;

    const totalProgress = pplTahap.reduce((acc, p) => {
        const progress = p.progress || {};
        // Logika untuk 'listing' dan 'pencacahan' digabung
        if (p.tahap === 'listing' || p.tahap === 'pencacahan') {
            if (type === 'Approved') {
                return acc + (progress.approved || 0);
            }
            if (type === 'Submitted') {
                return acc + (progress.submit || 0) + (progress.diperiksa || 0);
            }
        }
        if (p.tahap === 'pengolahan-analisis') {
            const clean = progress.clean || 0;
            if (type === 'Approved') {
                return acc + clean;
            }
            return acc + (progress.sudah_entry || 0) + (progress.validasi || 0);
        }
        return acc;
    }, 0);

    return Math.round((totalProgress / totalBebanKerja) * 100);
};
// =================================================================
// END OF MODIFICATION: calculateProgress function
// =================================================================

export interface HonorariumSettingPacket extends RowDataPacket {
    kegiatanId: number;
    jenis_pekerjaan: 'listing' | 'pencacahan' | 'pengolahan';
    satuan_beban_kerja: string;
    harga_satuan: string;
}

/**
 * Tahap yang dimatikan tidak boleh menyimpan jadwal.
 *
 * Tanpa ini, mematikan tahap hanya menyembunyikannya di layar sementara
 * tanggalnya tetap tersimpan — lalu muncul lagi utuh begitu tahapnya dinyalakan
 * kembali, seolah tidak pernah dimatikan. Lebih buruk: notifikasi tenggat
 * membaca kolom tanggal langsung, jadi ketua tim tetap ditagih tenggat tahap
 * yang sudah dinyatakan tidak ada.
 *
 * `undefined` diperlakukan sebagai AKTIF: respons dan cache lama tidak memuat
 * kolom ini, dan seluruh kegiatan sebelum migrasi 2026-09-18 memang punya
 * kedua tahap tersebut.
 */
export const tahapAktif = (nilai: unknown): boolean => nilai === undefined || nilai === null || Boolean(nilai);

/** Tahap alokasi -> kunci harga satuannya di `honorariumSettings`. */
export const KUNCI_HARGA_TAHAP = {
    'listing': 'pengumpulan-data-listing',
    'pencacahan': 'pengumpulan-data-pencacahan',
    'pengolahan-analisis': 'pengolahan-analisis',
} as const;
