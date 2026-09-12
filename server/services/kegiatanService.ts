// server/services/kegiatanService.ts

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { catatRiwayat } from './riwayatService';
import {
    batasHonorBulanan, galatBatasHonor, hitungPembebanan,
    rentangHonorTahap, simpanPembebanan,
    type AlokasiUntukPembebanan,
} from './pembebananService';
// Jalur relatif, BUKAN '@shared/...' — alias itu tidak tersedia saat
// vite.config.ts memuat kode server lewat Node, dan ini nilai runtime.
import type { MetodePembebanan, PembebananPerBulan } from '../../shared/pembebananHonor';
import { Kegiatan, Dokumen, PPL, ProgressType, HonorariumDetail } from '@shared/api';
// Jalur relatif, BUKAN @shared: impor di atas hanya TIPE (terhapus saat
// kompilasi), sedangkan ini nilai runtime. Alias @shared tidak tersedia saat
// vite.config.ts memuat kode server lewat Node.
import { periksaTautan } from '../../shared/tautanDokumen';
import { normalkanKetuaTimId, pesanKetuaTimTidakDikenal } from '../../shared/ketuaTim';

/**
 * Galat link dokumen, ditandai 400.
 *
 * Route `PUT /kegiatan/:id` sudah menghormati `error.statusCode`; tanpa penanda
 * ini link yang salah ketik akan dilaporkan sebagai 500 seolah aplikasinya yang
 * rusak, padahal itu murni kesalahan masukan yang bisa diperbaiki pengguna.
 */
const galatTautan = (namaDokumen: string, pesan?: string) => {
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
const pastikanKetuaTimAda = async (nilai: unknown): Promise<string | null> => {
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
interface HonorariumSettings {
    satuanBebanKerja: string;
    hargaSatuan: string;
}

interface KegiatanPacket extends Kegiatan, RowDataPacket {}
interface PPLPacket extends PPL, RowDataPacket {}
interface ProgressPacket extends RowDataPacket {
    ppl_id: number;
    progress_type: ProgressType;
    value: number;
}
interface HonorariumPacket extends RowDataPacket {
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
const parseRupiah = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  return parseInt(String(value).replace(/\./g, ''), 10) || 0;
};

const formatDateForDb = (dateInput: string | Date | null | undefined): string | null => {
  if (!dateInput) {
    return null;
  }
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return null;
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Gagal memformat tanggal:", dateInput, error);
    return null;
  }
};

// =================================================================
// START OF MODIFICATION: calculateProgress function
// =================================================================
const calculateProgress = (ppl: PPL[], tahap: PPL['tahap'] | 'pendataan', type: 'Approved' | 'Submitted'): number => {
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

interface HonorariumSettingPacket extends RowDataPacket {
    kegiatanId: number;
    jenis_pekerjaan: 'listing' | 'pencacahan' | 'pengolahan';
    satuan_beban_kerja: string;
    harga_satuan: string;
}

const getKegiatanWithRelations = async (whereClause: string, params: any[]): Promise<Kegiatan[]> => {
    const query = `
        SELECT
            k.*,
            kt.nama_ketua AS namaKetua,
            kt.tim AS timKetua,
            -- Akun users yang memegang ketua tim ini. Dipakai untuk menentukan
            -- hak edit. JANGAN membandingkan user.id ke k.ketua_tim_id: kedua
            -- tabel memakai ruang ID yang berbeda (USR### vs KT###) sehingga
            -- perbandingannya tidak pernah benar.
            kt.user_id AS ketuaTimUserId,
            -- Pool mysql2 mengembalikan kolom DATE sebagai objek Date JS, yang
            -- bisa bergeser sehari saat diserialisasi dari zona WIB. Kolom honor
            -- dipakai untuk "Jangka Waktu" di Surat PK, jadi harus persis.
            DATE_FORMAT(k.tanggalMulaiHonorListing, '%Y-%m-%d') AS tanggalMulaiHonorListing,
            DATE_FORMAT(k.tanggalSelesaiHonorListing, '%Y-%m-%d') AS tanggalSelesaiHonorListing,
            DATE_FORMAT(k.tanggalMulaiHonorPencacahan, '%Y-%m-%d') AS tanggalMulaiHonorPencacahan,
            DATE_FORMAT(k.tanggalSelesaiHonorPencacahan, '%Y-%m-%d') AS tanggalSelesaiHonorPencacahan,
            DATE_FORMAT(k.tanggalMulaiHonorPengolahan, '%Y-%m-%d') AS tanggalMulaiHonorPengolahan,
            DATE_FORMAT(k.tanggalSelesaiHonorPengolahan, '%Y-%m-%d') AS tanggalSelesaiHonorPengolahan
        FROM kegiatan k
        LEFT JOIN ketua_tim kt ON k.ketua_tim_id = kt.id
        ${whereClause}
    `;
    const [kegiatanRows] = await db.query<KegiatanPacket[]>(query, params);
    if (kegiatanRows.length === 0) return [];
    const kegiatanIds = kegiatanRows.map(k => k.id);
    const placeholders = kegiatanIds.map(() => '?').join(',');

   const [honorSettingsRows] = await db.query<HonorariumSettingPacket[]>('SELECT * FROM honorarium_kegiatan WHERE kegiatanId IN (' + placeholders + ')', kegiatanIds);
   const honorSettingsMap = new Map<number, any>();
   honorSettingsRows.forEach(row => {
     if (!honorSettingsMap.has(row.kegiatanId)) {
         honorSettingsMap.set(row.kegiatanId, {});
     }
     const currentSettings = honorSettingsMap.get(row.kegiatanId);
     let key: string;
     if (row.jenis_pekerjaan === 'listing') key = 'pengumpulan-data-listing';
     else if (row.jenis_pekerjaan === 'pencacahan') key = 'pengumpulan-data-pencacahan';
     else key = 'pengolahan-analisis';

     currentSettings[key] = {
         satuanBebanKerja: row.satuan_beban_kerja,
         hargaSatuan: row.harga_satuan
     };
   });

    const [dokumenRows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE kegiatanId IN (' + placeholders + ')', kegiatanIds);
    const [pplRows] = await db.query<PPLPacket[]>(
        'SELECT p.*, pm.namaPPL, u.nama_lengkap AS namaPML FROM ppl p LEFT JOIN ppl_master pm ON p.ppl_master_id = pm.id LEFT JOIN users u ON p.pml_id = u.id WHERE p.kegiatanId IN (' + placeholders + ')', kegiatanIds);
    
    if (pplRows.length > 0) {
        const pplIds = pplRows.map(p => p.id).filter(id => id !== undefined) as number[];
        if (pplIds.length > 0) {
            const pplPlaceholders = pplIds.map(() => '?').join(',');
            const [progressRows] = await db.query<ProgressPacket[]>('SELECT * FROM ppl_progress WHERE ppl_id IN (' + pplPlaceholders + ')', pplIds);
            const [honorRows] = await db.query<HonorariumPacket[]>('SELECT * FROM ppl_honorarium WHERE ppl_id IN (' + pplPlaceholders + ')', pplIds);

            const progressMap = new Map<number, Partial<Record<ProgressType, number>>>();
            progressRows.forEach(row => {
                if (!progressMap.has(row.ppl_id)) {
                    progressMap.set(row.ppl_id, {});
                }
                progressMap.get(row.ppl_id)![row.progress_type] = row.value;
            });

            const honorMap = new Map<number, HonorariumDetail[]>();
            honorRows.forEach(row => {
                if (!honorMap.has(row.ppl_id)) {
                    honorMap.set(row.ppl_id, []);
                }
                honorMap.get(row.ppl_id)!.push({
                    jenis_pekerjaan: row.jenis_pekerjaan,
                    bebanKerja: String(row.bebanKerja),
                    satuanBebanKerja: row.satuanBebanKerja,
                    hargaSatuan: String(row.hargaSatuan),
                    besaranHonor: String(row.besaranHonor)
                });
            });

            pplRows.forEach(ppl => {
                ppl.progress = progressMap.get(ppl.id!) || {};
                ppl.honorarium = honorMap.get(ppl.id!) || [];
            });
        }
    }

    for (const kegiatan of kegiatanRows) {
        kegiatan.dokumen = dokumenRows.filter(d => d.kegiatanId === kegiatan.id) as Dokumen[];
        kegiatan.honorariumSettings = honorSettingsMap.get(kegiatan.id) || {};
        kegiatan.ppl = pplRows.filter(p => p.kegiatanId === kegiatan.id) as PPL[];
        
        // =================================================================
        // START OF MODIFICATION: Progress calculation call
        // =================================================================
        kegiatan.progressListingApproved = calculateProgress(kegiatan.ppl, 'listing', 'Approved');
        kegiatan.progressListingSubmit = calculateProgress(kegiatan.ppl, 'listing', 'Submitted');
        kegiatan.progressPencacahanApproved = calculateProgress(kegiatan.ppl, 'pencacahan', 'Approved');
        kegiatan.progressPencacahanSubmit = calculateProgress(kegiatan.ppl, 'pencacahan', 'Submitted');
        kegiatan.progressPengolahanApproved = calculateProgress(kegiatan.ppl, 'pengolahan-analisis', 'Approved');
        kegiatan.progressPengolahanSubmit = calculateProgress(kegiatan.ppl, 'pengolahan-analisis', 'Submitted');
        // =================================================================
        // END OF MODIFICATION: Progress calculation call
        // =================================================================

        // Kalkulasi untuk progress keseluruhan
        const totalBeban = kegiatan.ppl.reduce((acc, p) => acc + (parseInt(p.bebanKerja, 10) || 0), 0);
        const totalApprovedClean = kegiatan.ppl.reduce((acc, p) => acc + (p.progress?.approved || 0) + (p.progress?.clean || 0), 0);
        kegiatan.progressKeseluruhan = totalBeban > 0 ? Math.round((totalApprovedClean / totalBeban) * 100) : 0;
        
        // Tetap sediakan properti lama untuk kompatibilitas jika masih ada yang memakai
        kegiatan.progressPendataanApproved = calculateProgress(kegiatan.ppl, 'pendataan', 'Approved');
        kegiatan.progressPendataanSubmit = calculateProgress(kegiatan.ppl, 'pendataan', 'Submitted');
    }
    return kegiatanRows;
};

export const getAllKegiatan = async (): Promise<Kegiatan[]> => {
    return getKegiatanWithRelations('ORDER BY k.lastUpdated DESC', []);
};

export const getKegiatanById = async (id: number): Promise<Kegiatan | null> => {
    const kegiatan = await getKegiatanWithRelations('WHERE k.id = ?', [id]);
    return kegiatan.length > 0 ? kegiatan[0] : null;
};

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
const tahapAktif = (nilai: unknown): boolean => nilai === undefined || nilai === null || Boolean(nilai);

/** Tahap alokasi -> kunci harga satuannya di `honorariumSettings`. */
const KUNCI_HARGA_TAHAP = {
    'listing': 'pengumpulan-data-listing',
    'pencacahan': 'pengumpulan-data-pencacahan',
    'pengolahan-analisis': 'pengolahan-analisis',
} as const;

/**
 * Menghitung pembebanan honor SELURUH alokasi PPL sebuah kegiatan.
 *
 * Dijalankan SEBELUM transaksi dibuka, karena ia hanya membaca — dan karena
 * pelanggaran batas harus menghentikan penyimpanan tanpa meninggalkan transaksi
 * yang perlu di-rollback.
 *
 * Hasilnya dikunci oleh INDEKS di dalam array `ppl`, bukan oleh
 * `ppl_master_id`: satu mitra bisa muncul lebih dari sekali dalam satu kegiatan
 * (tahap berbeda), dan tabel `ppl` memang tidak punya unique key untuk itu.
 */
const siapkanPembebanan = async (
    daftarPpl: any[] | undefined,
    data: any,
    kegiatanIdDikecualikan: number | null,
    bypassHonorLimit: boolean,
): Promise<Map<number, PembebananPerBulan>> => {
    const hasil = new Map<number, PembebananPerBulan>();
    if (!daftarPpl || daftarPpl.length === 0) return hasil;

    const batas = await batasHonorBulanan();

    for (let i = 0; i < daftarPpl.length; i++) {
        const ppl = daftarPpl[i];
        if (!ppl?.ppl_master_id) continue;

        // Yang dibagi ke bulan-bulan adalah MUATAN (unit beban kerja), bukan
        // rupiah: Surat PK honor lintas bulan dipecah menurut muatannya, dan
        // rupiah tiap bulan mengikuti — volume x harga satuan tahap ini.
        const volume = ppl.honorarium?.reduce(
            (jumlah: number, h: any) => jumlah + parseRupiah(h.bebanKerja), 0) || 0;
        const kunciHarga = KUNCI_HARGA_TAHAP[ppl.tahap as keyof typeof KUNCI_HARGA_TAHAP];
        const hargaSatuan = kunciHarga ? parseRupiah(data.honorariumSettings?.[kunciHarga]?.hargaSatuan) : 0;

        const alokasi: AlokasiUntukPembebanan = {
            ppl_master_id: ppl.ppl_master_id,
            tahap: ppl.tahap,
            volume,
            hargaSatuan,
            metode: (ppl.metodePembebanan as MetodePembebanan) || 'bulan_tertentu',
            bulanDipilih: ppl.bulanPembebananDipilih ?? null,
        };

        const { perBulan, bulanMelanggar } = await hitungPembebanan(
            alokasi, rentangHonorTahap(data, ppl.tahap), kegiatanIdDikecualikan, batas);

        // Peringatan batas tetap dilaporkan per BULAN, bukan atas total periode:
        // honor yang menumpuk di satu bulan itulah yang melanggar SBML, dan
        // membandingkan totalnya dengan batas dikali jumlah bulan akan
        // meloloskannya.
        if (!bypassHonorLimit && bulanMelanggar.length > 0) {
            const pelanggaran = bulanMelanggar[0];
            throw galatBatasHonor(
                ppl.ppl_master_id, pelanggaran.bulan, pelanggaran.total, batas);
        }

        hasil.set(i, perBulan);
    }

    return hasil;
};

export const createKegiatan = async (data: any, bypassHonorLimit = false): Promise<Kegiatan> => {
    const connection = await db.getConnection();
    try {

        const {
            namaKegiatan, ketua_tim_id, deskripsiKegiatan, adaListing, isFasih,
            adaPengolahan, adaDiseminasi,
            bulanHonorListing, bulanHonorPencacahan, bulanHonorPengolahan,
            tanggalMulaiHonorListing, tanggalSelesaiHonorListing,
            tanggalMulaiHonorPencacahan, tanggalSelesaiHonorPencacahan,
            tanggalMulaiHonorPengolahan, tanggalSelesaiHonorPengolahan,
            tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
            tanggalMulaiPengumpulanData, tanggalSelesaiPengumpulanData,
            tanggalMulaiPengolahanAnalisis, tanggalSelesaiPengolahanAnalisis,
            tanggalMulaiDiseminasiEvaluasi, tanggalSelesaiDiseminasiEvaluasi,
            ppl: pplAllocations,
            documents, username,
            honorariumSettings,
            createdBy_userId
        } = data;

        // Menggantikan pemeriksaan lama yang membaca kolom `bulanHonor*`.
        // Kolom itu hanya bisa menyebut SATU bulan per tahap, sehingga honor
        // yang periodenya melintasi beberapa bulan selalu dinilai utuh di satu
        // bulan saja. `siapkanPembebanan` memakai rentang tanggal honornya,
        // membagi sesuai metode tiap alokasi, lalu menilai batas SBML per bulan
        // hasil pembagian itu.
        const pengolahanAktif = tahapAktif(adaPengolahan);
        const diseminasiAktif = tahapAktif(adaDiseminasi);

        const pembebanan = await siapkanPembebanan(pplAllocations, data, null, bypassHonorLimit);
        
        const ketuaTimSah = await pastikanKetuaTimAda(ketua_tim_id);

        await connection.beginTransaction();

        const {
            'pengumpulan-data-listing': listingSettings,
            'pengumpulan-data-pencacahan': pencacahanSettings,
            'pengolahan-analisis': pengolahanSettings
        } = honorariumSettings;

        // Perbarui query INSERT
        const kegiatanQuery = `
            INSERT INTO kegiatan
            (namaKegiatan, ketua_tim_id, createdBy_userId, deskripsiKegiatan, adaListing, isFasih,
            adaPengolahan, adaDiseminasi,
            bulanHonorListing, bulanHonorPencacahan, bulanHonorPengolahan,
            tanggalMulaiHonorListing, tanggalSelesaiHonorListing,
            tanggalMulaiHonorPencacahan, tanggalSelesaiHonorPencacahan,
            tanggalMulaiHonorPengolahan, tanggalSelesaiHonorPengolahan,
            tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
            tanggalMulaiPengumpulanData, tanggalSelesaiPengumpulanData,
            tanggalMulaiPengolahanAnalisis, tanggalSelesaiPengolahanAnalisis,
            tanggalMulaiDiseminasiEvaluasi, tanggalSelesaiDiseminasiEvaluasi,
            status, lastUpdatedBy, lastEditedBy,
            progressKeseluruhan, progressPendataanApproved, progressPengolahanApproved,
            progressPendataanSubmit, progressPengolahanSubmit,
            progressListingApproved, progressListingSubmit,
            progressPencacahanApproved, progressPencacahanSubmit)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Persiapan', ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0)
        `;
        const [kegiatanResult] = await connection.execute<OkPacket>(kegiatanQuery, [
            namaKegiatan, ketuaTimSah, createdBy_userId, deskripsiKegiatan, adaListing || false, isFasih || false,
            pengolahanAktif, diseminasiAktif,
            // Masukkan tiga bulan honor baru
            bulanHonorListing || null, bulanHonorPencacahan || null, bulanHonorPengolahan || null,
            // Rentang tanggal honor per tahap
            formatDateForDb(tanggalMulaiHonorListing),
            formatDateForDb(tanggalSelesaiHonorListing),
            formatDateForDb(tanggalMulaiHonorPencacahan),
            formatDateForDb(tanggalSelesaiHonorPencacahan),
            formatDateForDb(tanggalMulaiHonorPengolahan),
            formatDateForDb(tanggalSelesaiHonorPengolahan),
            formatDateForDb(tanggalMulaiPersiapan),
            formatDateForDb(tanggalSelesaiPersiapan),
            formatDateForDb(tanggalMulaiPengumpulanData),
            formatDateForDb(tanggalSelesaiPengumpulanData),
            // Jadwal tahap yang dimatikan dikosongkan, bukan sekadar
            // disembunyikan: notifikasi tenggat membaca kolom ini langsung, dan
            // ketua tim akan tetap ditagih tenggat tahap yang sudah dinyatakan
            // tidak ada.
            pengolahanAktif ? formatDateForDb(tanggalMulaiPengolahanAnalisis) : null,
            pengolahanAktif ? formatDateForDb(tanggalSelesaiPengolahanAnalisis) : null,
            diseminasiAktif ? formatDateForDb(tanggalMulaiDiseminasiEvaluasi) : null,
            diseminasiAktif ? formatDateForDb(tanggalSelesaiDiseminasiEvaluasi) : null,
            username, username
        ]);
        const kegiatanId = kegiatanResult.insertId;

        // ... (sisa logika fungsi createKegiatan tidak berubah)
        const honorSettingsQuery = 'INSERT INTO honorarium_kegiatan (kegiatanId, jenis_pekerjaan, satuan_beban_kerja, harga_satuan) VALUES ?';
        const honorSettingsValues = [   ['listing', listingSettings],   ['pencacahan', pencacahanSettings],   ['pengolahan', pengolahanSettings]  ].map(([jenis, settings]) => [kegiatanId, jenis, settings.satuanBebanKerja, String(parseRupiah(settings.hargaSatuan))]);
        await connection.query(honorSettingsQuery, [honorSettingsValues]);
        if (pplAllocations && pplAllocations.length > 0) {
            for (const [indeksPpl, ppl] of pplAllocations.entries()) {
                if (!ppl.ppl_master_id) {
                    console.warn("Melewatkan PPL tanpa ppl_master_id:", ppl);
                    continue;
                }
                const totalHonor = ppl.honorarium?.reduce((sum: number, h: HonorariumDetail) => sum + parseRupiah(h.besaranHonor), 0) || 0;
                const totalBeban = ppl.honorarium?.reduce((sum: number, h: HonorariumDetail) => sum + parseRupiah(h.bebanKerja), 0) || 0;

                const pplQuery = 'INSERT INTO ppl (kegiatanId, ppl_master_id, pml_id, bebanKerja, besaranHonor, tahap, metodePembebanan, bulanPembebananDipilih) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                const [pplResult] = await connection.execute<OkPacket>(pplQuery, [
                   kegiatanId, 
                   ppl.ppl_master_id, 
                   ppl.pml_id || null,
                   totalBeban, 
                   totalHonor, 
                   ppl.tahap,
                   ppl.metodePembebanan || 'bulan_tertentu',
                   ppl.bulanPembebananDipilih || null
                ]);
                const pplId = pplResult.insertId;

                // Pembebanan per bulan ditulis dari hasil yang sudah dihitung
                // sebelum transaksi dibuka.
                await simpanPembebanan(connection, pplId, pembebanan.get(indeksPpl) ?? {});

                if (ppl.honorarium && ppl.honorarium.length > 0) {
                    const honorQuery = 'INSERT INTO ppl_honorarium (ppl_id, jenis_pekerjaan, bebanKerja, satuanBebanKerja, hargaSatuan, besaranHonor) VALUES ?';
                    
                    const honorValues = ppl.honorarium.map((h: HonorariumDetail) => {
                        let settings: HonorariumSettings | undefined;
                        if (h.jenis_pekerjaan === 'listing') settings = listingSettings;
                        if (h.jenis_pekerjaan === 'pencacahan') settings = pencacahanSettings;
                        if (h.jenis_pekerjaan === 'pengolahan') settings = pengolahanSettings;

                        return [
                            pplId,
                            h.jenis_pekerjaan,
                            parseRupiah(h.bebanKerja),
                            settings?.satuanBebanKerja || '',
                            parseRupiah(settings?.hargaSatuan),
                            parseRupiah(h.besaranHonor)
                        ];
                    });

                    if (honorValues.length > 0) {
                        await connection.query(honorQuery, [honorValues]);
                    }
                }

                // Perbarui logika progress type berdasarkan tahap baru
                const progressType = (ppl.tahap === 'listing' || ppl.tahap === 'pencacahan') ? 'open' : 'belum_entry';
                if (totalBeban > 0) {
                    const progressQuery = 'INSERT INTO ppl_progress (ppl_id, progress_type, value) VALUES (?, ?, ?)';
                    await connection.execute(progressQuery, [pplId, progressType, totalBeban]);
                }
            }
        }
        
        // Dokumen tahap yang dimatikan tidak ikut disimpan. Disaring di server,
        // bukan hanya di layar: payload bisa datang dari mana saja, dan dokumen
        // wajib yang terlanjur masuk akan menahan kelengkapan tahap yang
        // sebenarnya tidak dikerjakan kabupaten ini.
        const dokumenDipakai = (documents ?? []).filter((doc: Dokumen) =>
            (doc.tipe !== 'pengolahan-analisis' || pengolahanAktif) &&
            (doc.tipe !== 'diseminasi-evaluasi' || diseminasiAktif));

        if (dokumenDipakai.length > 0) {
            const docQuery = 'INSERT INTO dokumen (kegiatanId, nama, link, jenis, tipe, uploadedAt, isWajib) VALUES ?';
            const docValues = dokumenDipakai.map(( doc :  Dokumen ) => {
                // Kegiatan baru: semua tautannya baru diketik, jadi tidak ada
                // data warisan yang perlu ditoleransi seperti di updateKegiatan.
                const tautan = periksaTautan(doc.link);
                if (!tautan.sah) {
                    throw galatTautan(doc.nama, tautan.galat);
                }
                return [kegiatanId, doc.nama, tautan.tautan || null, doc.jenis, doc.tipe, new Date(), doc.isWajib || false];
            });
            await connection.query(docQuery, [docValues]);
        }

        // Satu-satunya sumber "siapa membuat kegiatan ini dan kapan":
        // tabel kegiatan tidak punya kolom createdAt sama sekali.
        await catatRiwayat(connection, {
            kegiatanId,
            aksi: 'kegiatan_dibuat',
            entitas: 'kegiatan',
            entitasId: kegiatanId,
            aktorUserId: data.createdBy_userId ?? null,
            ringkasan: data.namaKegiatan,
        });
        if (dokumenDipakai.length > 0) {
            await catatRiwayat(connection, {
                kegiatanId,
                aksi: 'dokumen_ditambah',
                entitas: 'dokumen',
                jumlah: dokumenDipakai.length,
                aktorUserId: data.createdBy_userId ?? null,
                ringkasan: `${dokumenDipakai.length} dokumen awal`,
            });
        }

        await connection.commit();
        const newKegiatan = await getKegiatanById(kegiatanId);
        if (!newKegiatan) throw new Error("Gagal mengambil kegiatan yang baru dibuat");
        return newKegiatan;

    } catch (error: any) {
        await connection.rollback();
        console.error("❌ TRANSACTION ROLLED BACK");
        console.error("Code:", error.code);
        console.error("Message:", error.sqlMessage || error.message);
        console.error("Query:", error.sql);
        console.error("Stack:", error.stack);
        throw error;
    } finally {
        connection.release();
    }
}
// =================================================================
// END OF MODIFICATION: createKegiatan function
// =================================================================


// =================================================================
// START OF MODIFICATION: updateKegiatan function
// =================================================================
export const updateKegiatan = async (id: number, data: any, bypassHonorLimit = false): Promise<Kegiatan> => {
    const connection = await db.getConnection();
    try {

        const {
            namaKegiatan, ketua_tim_id, deskripsiKegiatan, adaListing, isFasih,
            adaPengolahan, adaDiseminasi,
            bulanHonorListing, bulanHonorPencacahan, bulanHonorPengolahan,
            tanggalMulaiHonorListing, tanggalSelesaiHonorListing,
            tanggalMulaiHonorPencacahan, tanggalSelesaiHonorPencacahan,
            tanggalMulaiHonorPengolahan, tanggalSelesaiHonorPengolahan,
            tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
            tanggalMulaiPengumpulanData, tanggalSelesaiPengumpulanData,
            tanggalMulaiPengolahanAnalisis, tanggalSelesaiPengolahanAnalisis,
            tanggalMulaiDiseminasiEvaluasi, tanggalSelesaiDiseminasiEvaluasi,
            ppl, lastEditedBy,
        } = data;

        // Klien (EditActivity) mengirim kunci `dokumen`, sedangkan kode ini dulu
        // hanya membaca `documents` — sehingga SELURUH blok simpan dokumen di
        // bawah tidak pernah dieksekusi dari tombol "Simpan Perubahan".
        // Terima keduanya supaya jalur itu hidup kembali tanpa memaksa klien
        // berubah nama.
        const documents = data.documents ?? data.dokumen;

        // Diberi nilai bawaan: klien membangunnya dengan `settings && {...}`,
        // jadi bila settings falsy hasilnya `undefined` dan JSON.stringify
        // MEMBUANG kuncinya. Tanpa penjaga ini, destructure di bawah melempar
        // TypeError setelah transaksi dibuka dan berakhir jadi 500 generik
        // "Error updating kegiatan".
        const honorariumSettings: Partial<Record<string, HonorariumSettings>> =
            data.honorariumSettings ?? {};

        // `id` dikecualikan: honor LAMA kegiatan ini harus dikeluarkan dari
        // hitungan bulan berjalan, kalau tidak ia dihitung dua kali bersama
        // honor barunya dan setiap penyuntingan akan tampak melanggar batas.
        const pengolahanAktif = tahapAktif(adaPengolahan);
        const diseminasiAktif = tahapAktif(adaDiseminasi);

        const pembebanan = await siapkanPembebanan(ppl, data, id, bypassHonorLimit);

        const ketuaTimSah = await pastikanKetuaTimAda(ketua_tim_id);

        await connection.beginTransaction();

        const {
            'pengumpulan-data-listing': listingSettings,
            'pengumpulan-data-pencacahan': pencacahanSettings,
            'pengolahan-analisis': pengolahanSettings
        } = honorariumSettings;

        // Perbarui query UPDATE
        const kegiatanQuery = `
            UPDATE kegiatan SET
            namaKegiatan = ?, ketua_tim_id = ?, deskripsiKegiatan = ?, adaListing = ?, isFasih = ?,
            adaPengolahan = ?, adaDiseminasi = ?,
            bulanHonorListing = ?, bulanHonorPencacahan = ?, bulanHonorPengolahan = ?,
            tanggalMulaiHonorListing = ?, tanggalSelesaiHonorListing = ?,
            tanggalMulaiHonorPencacahan = ?, tanggalSelesaiHonorPencacahan = ?,
            tanggalMulaiHonorPengolahan = ?, tanggalSelesaiHonorPengolahan = ?,
            tanggalMulaiPersiapan = ?, tanggalSelesaiPersiapan = ?,
            tanggalMulaiPengumpulanData = ?, tanggalSelesaiPengumpulanData = ?,
            tanggalMulaiPengolahanAnalisis = ?, tanggalSelesaiPengolahanAnalisis = ?,
            tanggalMulaiDiseminasiEvaluasi = ?, tanggalSelesaiDiseminasiEvaluasi = ?,
            lastEdited = CURRENT_TIMESTAMP,
            lastEditedBy = ?
            WHERE id = ?
        `;
        await connection.execute(kegiatanQuery, [
            namaKegiatan, ketuaTimSah, deskripsiKegiatan, adaListing || false, isFasih || false,
            pengolahanAktif, diseminasiAktif,
            // Masukkan tiga bulan honor baru
            bulanHonorListing || null, bulanHonorPencacahan || null, bulanHonorPengolahan || null,
            // Rentang tanggal honor per tahap
            formatDateForDb(tanggalMulaiHonorListing),
            formatDateForDb(tanggalSelesaiHonorListing),
            formatDateForDb(tanggalMulaiHonorPencacahan),
            formatDateForDb(tanggalSelesaiHonorPencacahan),
            formatDateForDb(tanggalMulaiHonorPengolahan),
            formatDateForDb(tanggalSelesaiHonorPengolahan),
            formatDateForDb(tanggalMulaiPersiapan),
            formatDateForDb(tanggalSelesaiPersiapan),
            formatDateForDb(tanggalMulaiPengumpulanData),
            formatDateForDb(tanggalSelesaiPengumpulanData),
            // Jadwal tahap yang dimatikan dikosongkan, bukan sekadar
            // disembunyikan: notifikasi tenggat membaca kolom ini langsung, dan
            // ketua tim akan tetap ditagih tenggat tahap yang sudah dinyatakan
            // tidak ada.
            pengolahanAktif ? formatDateForDb(tanggalMulaiPengolahanAnalisis) : null,
            pengolahanAktif ? formatDateForDb(tanggalSelesaiPengolahanAnalisis) : null,
            diseminasiAktif ? formatDateForDb(tanggalMulaiDiseminasiEvaluasi) : null,
            diseminasiAktif ? formatDateForDb(tanggalSelesaiDiseminasiEvaluasi) : null,
            lastEditedBy,
            id
        ]);
        
        // ... (sisa logika fungsi updateKegiatan tidak berubah, tapi ada satu penyesuaian di progress)
        // uraian_tugas dan kode_anggaran diisi lewat menu Generate Kontrak, bukan
        // lewat form Edit Kegiatan. Karena baris honorarium_kegiatan dihapus lalu
        // dibuat ulang di bawah, keduanya harus diselamatkan dulu supaya tidak
        // ikut terhapus setiap kali kegiatan disunting.
        const [kontrakLama] = await connection.query<RowDataPacket[]>(
            'SELECT jenis_pekerjaan, uraian_tugas, kode_anggaran FROM honorarium_kegiatan WHERE kegiatanId = ?',
            [id]
        );
        const kontrakPerJenis = new Map<string, { uraian_tugas: string | null; kode_anggaran: string | null }>(
            kontrakLama.map(row => [row.jenis_pekerjaan, { uraian_tugas: row.uraian_tugas, kode_anggaran: row.kode_anggaran }])
        );

        await connection.execute('DELETE FROM honorarium_kegiatan WHERE kegiatanId = ?', [id]);
        const honorSettingsQuery = 'INSERT INTO honorarium_kegiatan (kegiatanId, jenis_pekerjaan, satuan_beban_kerja, harga_satuan, uraian_tugas, kode_anggaran) VALUES ?';
        // Tiap tahap diberi nilai bawaan. Sebelumnya `settings.satuanBebanKerja`
        // diakses langsung, sehingga satu tahap yang hilang dari payload cukup
        // untuk melempar TypeError di tengah transaksi dan berakhir jadi 500.
        const KOSONG: HonorariumSettings = { satuanBebanKerja: '', hargaSatuan: '' };
        const pasangan: Array<[string, HonorariumSettings]> = [
            ['listing', listingSettings ?? KOSONG],
            ['pencacahan', pencacahanSettings ?? KOSONG],
            ['pengolahan', pengolahanSettings ?? KOSONG],
        ];
        const honorSettingsValues = pasangan.map(([jenis, settings]) => [
            id,
            jenis,
            settings.satuanBebanKerja ?? '',
            String(parseRupiah(settings.hargaSatuan)),
            kontrakPerJenis.get(jenis)?.uraian_tugas ?? null,
            kontrakPerJenis.get(jenis)?.kode_anggaran ?? null,
        ]);
        await connection.query(honorSettingsQuery, [honorSettingsValues]);

        // Dokumen tahap yang dimatikan dihapus PERMANEN — termasuk yang wajib,
        // yang justru tidak tersentuh oleh pembersihan `isWajib = false` di
        // bawah. Dijalankan sebelum blok dokumen supaya baris yang sudah hilang
        // tidak ikut disisipkan ulang dari payload.
        const tahapMati: string[] = [];
        if (!pengolahanAktif) tahapMati.push('pengolahan-analisis');
        if (!diseminasiAktif) tahapMati.push('diseminasi-evaluasi');
        if (tahapMati.length > 0) {
            await connection.query(
                'DELETE FROM dokumen WHERE kegiatanId = ? AND tipe IN (?)', [id, tahapMati]);
        }

        if (documents) {
            const submittedDocIds = documents.map((doc: any) => doc.id).filter(Boolean);
            if (submittedDocIds.length > 0) {
                 const placeholders = submittedDocIds.map(() => '?').join(',');
                 await connection.execute(
                     `DELETE FROM dokumen WHERE kegiatanId = ? AND isWajib = false AND id NOT IN (${placeholders})`,
                     [id, ...submittedDocIds]
                 );
            } else {
                 await connection.execute(
                     'DELETE FROM dokumen WHERE kegiatanId = ? AND isWajib = false',
                     [id]
                 );
            }
            for (const doc of documents) {
                if (doc.id) {
                    const [existingDoc] = await connection.query<RowDataPacket[]>(
                        'SELECT nama, link, status, penanggungJawab FROM dokumen WHERE id = ?', [doc.id]
                    );
                    const lama = existingDoc[0];
                    if (!lama) continue;

                    // Dokumen yang tanggung jawabnya sudah dialihkan ke tim
                    // keuangan hanya diisi lewat View Documents. Tanpa penjagaan
                    // ini, ketua tim bisa mengosongkan kembali link yang baru
                    // diisi tim keuangan hanya dengan menekan Simpan — payload
                    // Edit Kegiatan miliknya masih memuat nilai lama yang kosong.
                    if (lama.penanggungJawab === 'keuangan') continue;

                    const namaBaru = doc.nama ?? lama.nama;
                    let linkBaru = doc.link ?? lama.link;
                    const adaPerubahan = (lama.nama ?? '') !== (namaBaru ?? '')
                        || (lama.link ?? '') !== (linkBaru ?? '');

                    // Menyimpan kegiatan TANPA menyentuh dokumen tidak boleh
                    // mengubah status persetujuannya. Kalau tidak, sekadar
                    // menekan Simpan akan menandai dokumen sebagai "diunggah
                    // ulang" dan mengirim notifikasi palsu ke supervisor.
                    if (!adaPerubahan) continue;

                    // Divalidasi HANYA saat linknya berubah. Kalau seluruh
                    // dokumen diperiksa, kegiatan lama yang menyimpan tautan
                    // warisan bermasalah tidak akan pernah bisa disimpan lagi —
                    // termasuk saat pengguna hanya ingin mengubah hal lain.
                    if ((lama.link ?? '') !== (linkBaru ?? '')) {
                        const tautan = periksaTautan(linkBaru);
                        if (!tautan.sah) {
                            throw galatTautan(namaBaru, tautan.galat);
                        }
                        linkBaru = tautan.tautan;
                    }

                    // Isi dokumen benar-benar berubah. Bila sebelumnya DITOLAK,
                    // inilah perbaikannya: statusnya kembali menunggu tinjauan
                    // dan ditandai sebagai unggah ulang supaya supervisor tahu.
                    // Jalur ini yang dipakai halaman Edit Kegiatan — bukan
                    // updateSingleDocument.
                    const diperbaiki = lama.status === 'Rejected';
                    const statusBaru = diperbaiki ? 'Pending' : (lama.status || 'Pending');
                    const setUlang = diperbaiki ? ', resubmittedAt = CURRENT_TIMESTAMP' : '';

                    // Pengunggah pertama dicatat hanya saat link sebelumnya kosong.
                    const isiPengunggah = !lama.link && linkBaru;
                    // Begitu link-nya terisi, pengingat "belum diisi" kehilangan
                    // alasannya. Dikosongkan supaya dokumen yang kelak dikosongkan
                    // lagi bisa diingatkan sekali lagi.
                    const hapusPengingat = linkBaru ? ', pengingatDikirimPada = NULL, pengingatDikirimOleh = NULL' : '';
                    const kolomPengunggah = isiPengunggah ? ', diunggahOleh_userId = ?' : '';
                    const params: any[] = [namaBaru, linkBaru, statusBaru];
                    if (isiPengunggah) params.push(lastEditedBy);
                    params.push(doc.id);

                    await connection.execute(
                        `UPDATE dokumen SET nama = ?, link = ?, status = ?${kolomPengunggah}${setUlang}${hapusPengingat} WHERE id = ?`,
                        params
                    );
                } else {
                // Dokumen baru: seluruh isinya berasal dari masukan pengguna,
                // jadi tidak ada data warisan yang perlu ditoleransi.
                const tautanBaru = periksaTautan(doc.link);
                if (!tautanBaru.sah) {
                    throw galatTautan(doc.nama, tautanBaru.galat);
                }
                const insertDocQuery = 'INSERT INTO dokumen (kegiatanId, nama, link, jenis, tipe, uploadedAt, isWajib, status, diunggahOleh_userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                await connection.execute(insertDocQuery, [
                    id,
                    doc.nama,
                    tautanBaru.tautan || null,
                    doc.jenis || 'link',
                    doc.tipe,
                    new Date(),
                    doc.isWajib || false,
                    doc.status || 'Pending',
                    lastEditedBy
                ]);
                }
            }
        }
        // ---------------------------------------------------------------
        // Alokasi PPL: DICOCOKKAN, bukan dihapus lalu dibuat ulang.
        //
        // Sebelumnya baris ini `DELETE FROM ppl WHERE kegiatanId = ?`. Karena
        // `penilaian_mitra.pplId` punya foreign key ON DELETE CASCADE ke
        // `ppl.id`, setiap kali kegiatan disunting SELURUH penilaian mitranya
        // ikut terhapus permanen — 12 dari 16 penilaian di database sudah
        // hilang karena ini. Dengan mempertahankan `ppl.id` untuk alokasi yang
        // masih ada, penilaian yang menggantung padanya ikut selamat.
        //
        // Kunci pencocokan (ppl_master_id, tahap): satu mitra tidak masuk akal
        // dialokasikan dua kali ke tahap yang sama dalam satu kegiatan. Antrean
        // id dipakai supaya duplikat lama (kalau ada) tetap tertangani.
        // ---------------------------------------------------------------
        const [pplLama] = await connection.query<RowDataPacket[]>(
            'SELECT id, ppl_master_id, tahap FROM ppl WHERE kegiatanId = ?', [id]
        );
        const kunciPpl = (masterId: string, tahap: string) => `${masterId}|${tahap}`;
        const antreanId = new Map<string, number[]>();
        for (const baris of pplLama) {
            const k = kunciPpl(baris.ppl_master_id, baris.tahap);
            if (!antreanId.has(k)) antreanId.set(k, []);
            antreanId.get(k)!.push(baris.id);
        }
        const idDipertahankan = new Set<number>();

        if (ppl && ppl.length > 0) {
            for (const [indeksPpl, p] of ppl.entries()) {
                if (!p.ppl_master_id) continue;

                const totalHonor = p.honorarium?.reduce((sum: number, h: HonorariumDetail) => sum + parseRupiah(h.besaranHonor), 0) || 0;
                const totalBeban = p.honorarium?.reduce((sum: number, h: HonorariumDetail) => sum + parseRupiah(h.bebanKerja), 0) || 0;

                const antrean = antreanId.get(kunciPpl(p.ppl_master_id, p.tahap));
                const idLama = antrean && antrean.length > 0 ? antrean.shift()! : null;

                let pplId: number;
                if (idLama !== null) {
                    await connection.execute(
                        `UPDATE ppl SET pml_id = ?, bebanKerja = ?, besaranHonor = ?,
                                metodePembebanan = ?, bulanPembebananDipilih = ?
                          WHERE id = ?`,
                        [p.pml_id || null, totalBeban, totalHonor,
                         p.metodePembebanan || 'bulan_tertentu',
                         p.bulanPembebananDipilih || null, idLama]
                    );
                    pplId = idLama;
                    // Baris honorarium ditulis ulang; tidak ada tabel lain yang
                    // merujuknya, jadi aman dihapus.
                    await connection.execute('DELETE FROM ppl_honorarium WHERE ppl_id = ?', [pplId]);
                    // Progress HANYA ditulis ulang bila payload memang membawanya.
                    // Kalau tidak, biarkan progress berjalan apa adanya —
                    // menghapusnya lalu menyemai ulang akan memundurkan progress
                    // lapangan ke nol hanya karena kegiatan disunting.
                    if (p.progress && Object.keys(p.progress).length > 0) {
                        await connection.execute('DELETE FROM ppl_progress WHERE ppl_id = ?', [pplId]);
                    }
                } else {
                    const pplQuery = 'INSERT INTO ppl (kegiatanId, ppl_master_id, pml_id, bebanKerja, besaranHonor, tahap, metodePembebanan, bulanPembebananDipilih) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                    const [pplResult] = await connection.execute<OkPacket>(pplQuery, [
                       id, p.ppl_master_id, p.pml_id || null, totalBeban, totalHonor, p.tahap,
                       p.metodePembebanan || 'bulan_tertentu', p.bulanPembebananDipilih || null
                    ]);
                    pplId = pplResult.insertId;
                }
                idDipertahankan.add(pplId);

                // Ditulis untuk baris lama MAUPUN baru: mengubah rentang honor
                // atau metodenya mengubah pembagian walau alokasinya itu-itu juga.
                await simpanPembebanan(connection, pplId, pembebanan.get(indeksPpl) ?? {});

                if (p.honorarium && p.honorarium.length > 0) {
                    const honorQuery = 'INSERT INTO ppl_honorarium (ppl_id, jenis_pekerjaan, bebanKerja, satuanBebanKerja, hargaSatuan, besaranHonor) VALUES ?';
                    
                    const honorValues = p.honorarium.map((h: HonorariumDetail) => {
                        let settings: HonorariumSettings | undefined;
                        if (h.jenis_pekerjaan === 'listing') settings = listingSettings;
                        if (h.jenis_pekerjaan === 'pencacahan') settings = pencacahanSettings;
                        if (h.jenis_pekerjaan === 'pengolahan') settings = pengolahanSettings;
                        
                        return [
                            pplId,
                            h.jenis_pekerjaan,
                            parseRupiah(h.bebanKerja),
                            settings?.satuanBebanKerja || '',
                            parseRupiah(settings?.hargaSatuan),
                            parseRupiah(h.besaranHonor)
                        ];
                    });

                    if (honorValues.length > 0) {
                      await connection.query(honorQuery, [honorValues]);
                    }
                }

                if (p.progress && Object.keys(p.progress).length > 0) {
                  const progressEntries = Object.entries(p.progress);
                  if (progressEntries.length > 0) {
                        const progressQuery = 'INSERT INTO ppl_progress (ppl_id, progress_type, value) VALUES ?';
                        const progressValues = progressEntries.map(([type, value]) => [pplId, type, value]);
                        await connection.query(progressQuery, [progressValues]);
                    }
                } else if (idLama === null) {
                  // Penyemaian awal HANYA untuk alokasi yang benar-benar baru.
                  // Untuk baris yang dipertahankan, progress lamanya masih ada
                  // dan menyisipkan lagi akan menabrak UNIQUE (ppl_id, progress_type).
                  if (totalBeban > 0) {
                      // Perbarui logika progress type berdasarkan tahap baru
                      const progressType = (p.tahap === 'listing' || p.tahap === 'pencacahan') ? 'open' : 'belum_entry';
                      const progressQuery = 'INSERT INTO ppl_progress (ppl_id, progress_type, value) VALUES (?, ?, ?)';
                      await connection.execute(progressQuery, [pplId, progressType, totalBeban]);
                  }
                }
            }
        }

        // Alokasi yang benar-benar dicabut dari kegiatan ini baru dihapus.
        // Di sini penilaiannya memang seharusnya ikut hilang — mitranya tidak
        // lagi terlibat. Yang tidak boleh adalah menghapus SEMUANYA seperti dulu.
        const idDibuang = pplLama.map(r => r.id).filter((x: number) => !idDipertahankan.has(x));
        if (idDibuang.length > 0) {
            await connection.query('DELETE FROM ppl WHERE id IN (?)', [idDibuang]);
        }


        await catatRiwayat(connection, {
            kegiatanId: id,
            aksi: 'kegiatan_disunting',
            entitas: 'kegiatan',
            entitasId: id,
            aktorNama: lastEditedBy,
        });

        await connection.commit();

        const updatedKegiatan = await getKegiatanById(id);
        if (!updatedKegiatan) throw new Error("Gagal mengambil kegiatan setelah update");
        return updatedKegiatan;

    } catch (error: any) {
        await connection.rollback();
        console.error("❌ TRANSACTION ROLLED BACK");
        console.error("Code:", error.code);
        console.error("Message:", error.sqlMessage || error.message);
        console.error("Query:", error.sql);
        console.error("Stack:", error.stack);
        throw error;
    } finally {
        connection.release();
    }
}
// =================================================================
// END OF MODIFICATION: updateKegiatan function
// =================================================================

// ... (sisa file tidak berubah)

export const createSingleDocument = async (data: Partial<Dokumen>, username: string): Promise<Dokumen> => {
    const { kegiatanId, nama, link, jenis, tipe, isWajib, penanggungJawab } = data;

    if (!kegiatanId || !nama || !tipe) {
        throw new Error("Kegiatan ID, Nama, dan Tipe dokumen diperlukan.");
    }

    const query = `
        INSERT INTO dokumen
        (kegiatanId, nama, link, jenis, tipe, isWajib, penanggungJawab, status, uploadedAt, diunggahOleh_userId)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
    `;
    const [result] = await db.execute<OkPacket>(query, [
        kegiatanId,
        nama,
        link || null,
        jenis || 'link',
        tipe,
        isWajib || false,
        // Tim keuangan boleh menambahkan dokumen yang ia tahu diperlukan, tapi
        // yang mengisinya tetap ketua tim — itu nilai bawaannya.
        penanggungJawab === 'keuangan' ? 'keuangan' : 'ketua_tim',
        new Date(),
        username // Menyimpan siapa yang menambah
    ]);

    const newDocId = result.insertId;
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [newDocId]);
    if (rows.length === 0) {
        throw new Error("Gagal mengambil dokumen yang baru dibuat.");
    }
    return rows[0] as Dokumen;
};

export const updateSingleDocument = async (dokumenId: number, data: { link?: string, nama?: string }, username: string): Promise<Dokumen> => {
    const { link, nama } = data;

    if (link === undefined && nama === undefined) {
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
        if (rows.length === 0) throw new Error("Dokumen tidak ditemukan.");
        return rows[0] as Dokumen;
    }

    const [oldDocRows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
    if (oldDocRows.length === 0) throw new Error("Dokumen tidak ditemukan untuk diupdate.");
    const oldDoc = oldDocRows[0];

    // Kalau dokumen yang diperbaiki tadinya DITOLAK, tandai sebagai unggah
    // ulang supaya supervisor mendapat notifikasi "sudah diperbaiki" dan bukan
    // sekadar "menunggu persetujuan" seperti dokumen baru.
    const diunggahUlang = oldDoc.status === 'Rejected';

    // Pengingat "dokumen ini belum diisi" kehilangan alasannya begitu link-nya
    // terisi. Dikosongkan di sini, bukan dibiarkan menggantung, supaya dokumen
    // yang kelak dikosongkan lagi bisa diingatkan sekali lagi.
    const linkBaru = link ?? oldDoc.link;
    const hapusPengingat = linkBaru
        ? ', pengingatDikirimPada = NULL, pengingatDikirimOleh = NULL'
        : '';

    const query = `
        UPDATE dokumen
        SET
            link = ?,
            nama = ?,
            status = 'Pending',
            updatedAt = CURRENT_TIMESTAMP,
            resubmittedAt = ${diunggahUlang ? 'CURRENT_TIMESTAMP' : 'resubmittedAt'},
            lastEditedBy_userId = ?${hapusPengingat}
        WHERE id = ?
    `;

    await db.execute(query, [
        linkBaru,
        nama ?? oldDoc.nama,
        username,
        dokumenId
    ]);

    const [updatedDocRows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
    if (updatedDocRows.length === 0) {
        throw new Error("Gagal mengambil dokumen setelah update.");
    }
    
    return updatedDocRows[0] as Dokumen;
};

/**
 * @param bolehHapusWajib dokumen WAJIB hanya boleh dihapus tim keuangan/admin.
 *   Ketua tim tetap tidak bisa menghilangkan syarat kelengkapan kegiatannya
 *   sendiri, tetapi tim keuangan perlu bisa membatalkan dokumen yang keliru ia
 *   tambahkan — dan dokumen tambahan itu selalu bertanda wajib.
 */
export const deleteSingleDocument = async (id: number, bolehHapusWajib = false): Promise<boolean> => {
    const query = bolehHapusWajib
        ? 'DELETE FROM dokumen WHERE id = ?'
        : 'DELETE FROM dokumen WHERE id = ? AND isWajib = false';
    const [result] = await db.execute<OkPacket>(query, [id]);
    return result.affectedRows > 0;
};

/**
 * Mengganti NAMA dokumen saja.
 *
 * Terpisah dari `updateSingleDocument` yang selalu mengembalikan status ke
 * 'Pending': mengganti nama bukan pengunggahan ulang, jadi dokumen yang sudah
 * disetujui tidak boleh kehilangan persetujuannya hanya karena namanya
 * dirapikan.
 */
export const ubahNamaDokumen = async (id: number, nama: string, username: string): Promise<Dokumen> => {
    const [lamaRows] = await db.query<RowDataPacket[]>(
        'SELECT id, kegiatanId, nama FROM dokumen WHERE id = ? LIMIT 1', [id]);
    const lama = lamaRows[0];
    if (!lama) throw new Error('Dokumen tidak ditemukan.');

    await db.execute(
        'UPDATE dokumen SET nama = ?, lastEditedBy_userId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [nama, username, id]);

    await catatRiwayat(null, {
        kegiatanId: lama.kegiatanId,
        aksi: 'dokumen_diganti_nama',
        entitas: 'dokumen',
        entitasId: id,
        aktorNama: username,
        ringkasan: `Nama dokumen "${lama.nama}" diubah menjadi "${nama}"`,
    });

    const [baruRows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [id]);
    return baruRows[0] as Dokumen;
};

/**
 * Tim keuangan mengirim pengingat untuk dokumen yang link-nya masih kosong.
 *
 * Tidak ada baris notifikasi yang ditulis: notifikasi di aplikasi ini dihitung
 * saat dibaca. Yang disimpan di sini hanyalah FAKTA bahwa pengingatnya sudah
 * dikirim — dan fakta itu sekaligus jadi syarat kemunculan notifikasinya di
 * lonceng ketua tim dan pembuat kegiatan (lihat `qPengingatDokumen`).
 *
 * Dua penolakan yang disengaja:
 * - link sudah terisi → tidak ada yang perlu diingatkan lagi;
 * - pengingat sudah pernah dikirim → mencegah tombolnya dipakai berulang kali
 *   untuk membanjiri lonceng orang lain.
 *
 * Keduanya memakai keadaan yang dibaca ULANG dari database di dalam satu
 * UPDATE bersyarat, bukan dari hasil SELECT sebelumnya: dua permintaan yang
 * datang hampir bersamaan sama-sama akan lolos pemeriksaan SELECT, tetapi
 * hanya satu yang bisa membuat `affectedRows` menjadi 1.
 */
export const kirimPengingatDokumen = async (
    dokumenId: number,
    username: string,
): Promise<Dokumen> => {
    const [rows] = await db.query<RowDataPacket[]>(
        'SELECT id, kegiatanId, nama, link, jenis, pengingatDikirimPada FROM dokumen WHERE id = ? LIMIT 1',
        [dokumenId]);
    const doc = rows[0];
    if (!doc) {
        const galat: any = new Error('Dokumen tidak ditemukan.');
        galat.statusCode = 404;
        throw galat;
    }
    if (doc.jenis === 'catatan') {
        const galat: any = new Error('Catatan tidak punya link, jadi tidak ada yang perlu diingatkan.');
        galat.statusCode = 400;
        throw galat;
    }
    if (doc.link) {
        const galat: any = new Error(`Link dokumen "${doc.nama}" sudah diisi.`);
        galat.statusCode = 400;
        throw galat;
    }

    const [hasil] = await db.execute<OkPacket>(
        `UPDATE dokumen
            SET pengingatDikirimPada = CURRENT_TIMESTAMP, pengingatDikirimOleh = ?
          WHERE id = ?
            AND pengingatDikirimPada IS NULL
            AND (link IS NULL OR link = '')`,
        [username, dokumenId]);

    if (hasil.affectedRows === 0) {
        const galat: any = new Error(`Pengingat untuk dokumen "${doc.nama}" sudah pernah dikirim.`);
        galat.statusCode = 409;
        throw galat;
    }

    await catatRiwayat(null, {
        kegiatanId: doc.kegiatanId,
        aksi: 'pengingat_dokumen_dikirim',
        entitas: 'dokumen',
        entitasId: dokumenId,
        aktorNama: username,
        ringkasan: `Pengingat pengisian dokumen "${doc.nama}" dikirim ke ketua tim dan pembuat kegiatan`,
    });

    const [baru] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
    return baru[0] as Dokumen;
};

// =================================================================
// START OF MODIFICATION: updatePplProgress function
// =================================================================
export const updatePplProgress = async (pplId: number, progressData: Partial<Record<ProgressType, number>>, username: string) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [pplRows] = await connection.query<RowDataPacket[]>('SELECT kegiatanId, bebanKerja, tahap FROM ppl WHERE id = ?', [pplId]);
        if (pplRows.length === 0) {
            throw new Error("PPL tidak ditemukan");
        }
        const currentPpl = pplRows[0];
        const totalBebanKerja = parseInt(currentPpl.bebanKerja, 10) || 0;

        // Perbarui logika penentuan stages
        const stages = (currentPpl.tahap === 'listing' || currentPpl.tahap === 'pencacahan')
            ? ['open', 'submit', 'diperiksa', 'approved']
            : ['belum_entry', 'sudah_entry', 'validasi', 'clean'];
        
        const firstStage = stages[0];
        const editableStages = stages.slice(1);

        let editableProgressSum = 0;
        for (const stage of editableStages) {
            if (progressData[stage as ProgressType] !== undefined) {
                editableProgressSum += Number(progressData[stage as ProgressType]);
            }
        }
        
        const firstStageValue = totalBebanKerja - editableProgressSum;
        
        if (firstStageValue < 0) {
            throw new Error(`Total progres (${editableProgressSum}) tidak bisa melebihi total beban kerja (${totalBebanKerja}).`);
        }

        const fullProgressData = { ...progressData };
        (fullProgressData as any)[firstStage] = firstStageValue;

        await connection.execute('DELETE FROM ppl_progress WHERE ppl_id = ?', [pplId]);
        const progressEntries = Object.entries(fullProgressData).filter(([, value]) => value !== undefined && value !== null);
        if (progressEntries.length > 0) {
            const progressQuery = 'INSERT INTO ppl_progress (ppl_id, progress_type, value) VALUES ?';
            const progressValues = progressEntries.map(([type, value]) => [pplId, type, Number(value) || 0]);
            await connection.query(progressQuery, [progressValues]);
        }

        const kegiatanId = currentPpl.kegiatanId;

        // Satu-satunya jejak "siapa mengubah progress kapan": tabel
        // ppl_progress sama sekali tidak punya kolom waktu maupun pelaku.
        await catatRiwayat(connection, {
            kegiatanId,
            aksi: 'progress_diupdate',
            entitas: 'progress',
            entitasId: pplId,
            jumlah: editableProgressSum,
            aktorNama: username,
            ringkasan: currentPpl.tahap,
        });

        const [allPplForKegiatan] = await connection.query<PPLPacket[]>('SELECT * FROM ppl WHERE kegiatanId = ?', [kegiatanId]);
        if (allPplForKegiatan.length > 0) {
            const pplIds = allPplForKegiatan.map(p => p.id).filter(id => id !== undefined) as number[];
            if (pplIds.length > 0) {
                 const pplPlaceholders = pplIds.map(() => '?').join(',');
                 const [progressRows] = await db.query<ProgressPacket[]>('SELECT * FROM ppl_progress WHERE ppl_id IN (' + pplPlaceholders + ')', pplIds);

                 const progressMap = new Map<number, Partial<Record<ProgressType, number>>>();
                 progressRows.forEach(row => {
                      if (!progressMap.has(row.ppl_id)) {
                           progressMap.set(row.ppl_id, {});
                      }
                      progressMap.get(row.ppl_id)![row.progress_type] = row.value;
                 });
                 allPplForKegiatan.forEach(p => {
                      p.progress = progressMap.get(p.id!) || {};
                 });
            }
        }
        
        const progressListingApproved = calculateProgress(allPplForKegiatan, 'listing', 'Approved');
    const progressListingSubmit = calculateProgress(allPplForKegiatan, 'listing', 'Submitted');
    const progressPencacahanApproved = calculateProgress(allPplForKegiatan, 'pencacahan', 'Approved');
    const progressPencacahanSubmit = calculateProgress(allPplForKegiatan, 'pencacahan', 'Submitted');
    const progressPengolahanApproved = calculateProgress(allPplForKegiatan, 'pengolahan-analisis', 'Approved');
    const progressPengolahanSubmit = calculateProgress(allPplForKegiatan, 'pengolahan-analisis', 'Submitted');
    
    // Tetap hitung progress gabungan
    const progressPendataanApproved = calculateProgress(allPplForKegiatan, 'pendataan', 'Approved');
    const progressPendataanSubmit = calculateProgress(allPplForKegiatan, 'pendataan', 'Submitted');
    
    const totalBebanKerjaKegiatan = allPplForKegiatan.reduce((acc, p) => acc + (parseInt(p.bebanKerja, 10) || 0), 0);
    const totalApproved = allPplForKegiatan.reduce((acc, p) => {
        const approvedValue = (p.progress?.approved || 0) + (p.progress?.clean || 0);
        return acc + approvedValue;
    }, 0);
    const progressKeseluruhan = totalBebanKerjaKegiatan > 0 ? Math.round((totalApproved / totalBebanKerjaKegiatan) * 100) : 0;
    
    // Perbarui query UPDATE untuk menyertakan semua kolom baru
    await connection.execute(
        `UPDATE kegiatan SET 
            lastUpdated = CURRENT_TIMESTAMP, lastUpdatedBy = ?, progressKeseluruhan = ?, 
            progressPendataanApproved = ?, progressPengolahanApproved = ?, 
            progressPendataanSubmit = ?, progressPengolahanSubmit = ?,
            progressListingApproved = ?, progressListingSubmit = ?,
            progressPencacahanApproved = ?, progressPencacahanSubmit = ?
         WHERE id = ?`,
        [
            username, progressKeseluruhan, 
            progressPendataanApproved, progressPengolahanApproved, 
            progressPendataanSubmit, progressPengolahanSubmit,
            progressListingApproved, progressListingSubmit,
            progressPencacahanApproved, progressPencacahanSubmit,
            kegiatanId
        ]
    );
        
        await connection.commit();
        
        const [updatedPplRows] = await db.query<RowDataPacket[]>('SELECT * FROM ppl WHERE id = ?', [pplId]);
        const updatedPpl = updatedPplRows[0] as PPL;
        const [newProgressRows] = await db.query<ProgressPacket[]>('SELECT * FROM ppl_progress WHERE ppl_id = ?', [pplId]);
        updatedPpl.progress = {};
        newProgressRows.forEach(row => {
            updatedPpl.progress![row.progress_type] = row.value;
        });

        return updatedPpl;

    } catch (error: any) {
        await connection.rollback();
        console.error("❌ TRANSACTION ROLLED BACK");
        console.error("Code:", error.code);
        console.error("Message:", error.sqlMessage || error.message);
        console.error("Query:", error.sql);
        console.error("Stack:", error.stack);
        throw new Error('Terjadi kesalahan di server saat menyimpan data.');
    } finally {
        connection.release();
    }
};
// =================================================================
// END OF MODIFICATION: updatePplProgress function
// =================================================================

/** Berapa lama setelah dibuat, sebuah kegiatan masih boleh diurungkan pembuatnya. */
export const BATAS_URUNGKAN_MENIT = 15;

export type HasilUrungkan = 'ok' | 'tidak-ada' | 'bukan-pembuat' | 'kedaluwarsa';

/**
 * Mengurungkan pembuatan kegiatan yang BARU SAJA dibuat — tombol "Batal Simpan
 * Kegiatan" di modal sukses Input Kegiatan.
 *
 * Penghapusan kegiatan biasa khusus admin. Pintu ini sengaja sempit supaya
 * tidak menjadi jalan belakang: hanya PEMBUATNYA (atau admin), dan hanya dalam
 * `BATAS_URUNGKAN_MENIT` sejak dibuat. Waktu pembuatan diambil dari riwayat
 * 'kegiatan_dibuat' karena tabel kegiatan tidak punya kolom createdAt.
 */
export const urungkanPembuatanKegiatan = async (
    id: number,
    userId: string,
    role: string,
): Promise<HasilUrungkan> => {
    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT k.createdBy_userId,
                (SELECT TIMESTAMPDIFF(SECOND, MAX(r.terjadiPada), NOW())
                   FROM riwayat_kegiatan r
                  WHERE r.kegiatanId = k.id AND r.aksi = 'kegiatan_dibuat') AS umurDetik
           FROM kegiatan k WHERE k.id = ?`,
        [id]);
    const k = rows[0];
    if (!k) return 'tidak-ada';
    if (role !== 'admin' && k.createdBy_userId !== userId) return 'bukan-pembuat';
    if (k.umurDetik === null || Number(k.umurDetik) > BATAS_URUNGKAN_MENIT * 60) return 'kedaluwarsa';
    await deleteKegiatan(id);
    return 'ok';
};

export const deleteKegiatan = async (id: number): Promise<boolean> => {
    const [result] = await db.execute<OkPacket>('DELETE FROM kegiatan WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

/**
 * Arsipkan atau batalkan arsip sebuah kegiatan.
 *
 * Berbeda dengan deleteKegiatan yang menghapus permanen (beserta seluruh ppl,
 * dokumen, dan honor lewat ON DELETE CASCADE), arsip hanya menyembunyikan
 * kegiatan dari daftar utama dashboard. Datanya tetap ikut terhitung di rekap
 * honor dan penilaian.
 */
export const setArsipKegiatan = async (id: number, isArsip: boolean, username?: string): Promise<Kegiatan | null> => {
    const [result] = await db.execute<OkPacket>(
        'UPDATE kegiatan SET isArsip = ?, arsipAt = ?, arsipBy = ? WHERE id = ?',
        [isArsip ? 1 : 0, isArsip ? new Date() : null, isArsip ? (username || null) : null, id]
    );
    if (result.affectedRows === 0) return null;
    await catatRiwayat(null, {
        kegiatanId: id,
        aksi: isArsip ? 'kegiatan_diarsipkan' : 'arsip_dibatalkan',
        entitas: 'kegiatan',
        entitasId: id,
        aktorNama: username ?? null,
    });
    return getKegiatanById(id);
};

export const updateDocumentStatus = async (
    dokumenId: number,
    status: Dokumen['status'],
    username: string,
    rejectionNote?: string,
): Promise<Dokumen> => {
    if (status === 'Approved') {
        const query = 'UPDATE dokumen SET status = ?, lastApproved = CURRENT_TIMESTAMP, lastApprovedBy = ? WHERE id = ?';
        await db.execute(query, [status, username, dokumenId]);
    } else if (status === 'Rejected') {
        // resubmittedAt dikosongkan supaya penolakan ULANG membuat dokumen
        // kembali jadi 'menunggu persetujuan' biasa, bukan tetap tercatat
        // sebagai "sudah diperbaiki".
        const query = `UPDATE dokumen
                          SET status = 'Rejected',
                              rejectionNote = ?,
                              rejectedAt = CURRENT_TIMESTAMP,
                              rejectedBy = ?,
                              resubmittedAt = NULL
                        WHERE id = ?`;
        await db.execute(query, [rejectionNote ?? null, username, dokumenId]);
    } else {
        const query = 'UPDATE dokumen SET status = ? WHERE id = ?';
        await db.execute(query, [status, dokumenId]);
    }

    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
    if (rows.length === 0) {
        throw new Error("Dokumen tidak ditemukan setelah update");
    }
    const dok = rows[0] as Dokumen;

    const aksiPerStatus: Record<string, string> = {
        Approved: 'dokumen_disetujui',
        Rejected: 'dokumen_ditolak',
    };
    if (dok.kegiatanId && aksiPerStatus[status ?? '']) {
        await catatRiwayat(null, {
            kegiatanId: dok.kegiatanId,
            aksi: aksiPerStatus[status!],
            entitas: 'dokumen',
            entitasId: dokumenId,
            aktorNama: username,
            ringkasan: dok.nama,
        });
    }
    return dok;
};

export const approveDocumentsByTipe = async (kegiatanId: number, tipe: Dokumen['tipe'], username: string): Promise<OkPacket> => {
    const query = 'UPDATE dokumen SET status = ?, lastApproved = CURRENT_TIMESTAMP, lastApprovedBy = ? WHERE kegiatanId = ? AND tipe = ? AND status != ?';
    const [result] = await db.execute<OkPacket>(query, ['Approved', username, kegiatanId, tipe, 'Approved']);
    if (result.affectedRows > 0) {
        await catatRiwayat(null, {
            kegiatanId,
            aksi: 'dokumen_disetujui',
            entitas: 'dokumen',
            jumlah: result.affectedRows,
            aktorNama: username,
            ringkasan: `tahap ${tipe.replace(/-/g, ' ')}`,
        });
    }
    return result;
};
/**
 * Mengalihkan tanggung jawab pengisian sebuah dokumen.
 *
 * SENGAJA tidak menyentuh status, link, maupun resubmittedAt — dan karena itu
 * TIDAK menumpang `updateSingleDocument`, yang selalu memaksa status kembali
 * 'Pending'. Mengalihkan tanggung jawab bukan pengunggahan ulang; dokumen yang
 * sudah disetujui tidak boleh kehilangan persetujuannya hanya karena tim
 * keuangan mengambil alih pengisiannya di kemudian hari.
 */
export const ubahPenanggungJawabDokumen = async (
    dokumenId: number,
    penanggungJawab: 'ketua_tim' | 'keuangan',
    username: string,
): Promise<Dokumen> => {
    const [lamaRows] = await db.query<RowDataPacket[]>(
        'SELECT id, kegiatanId, nama, penanggungJawab FROM dokumen WHERE id = ?', [dokumenId]);
    const lama = lamaRows[0];
    if (!lama) throw new Error('Dokumen tidak ditemukan.');

    await db.execute(
        `UPDATE dokumen
            SET penanggungJawab = ?, penanggungJawabDiubahOleh = ?,
                penanggungJawabDiubahPada = CURRENT_TIMESTAMP
          WHERE id = ?`,
        [penanggungJawab, username, dokumenId]
    );

    // Di luar transaksi, jadi argumen pertamanya null (lihat riwayatService).
    await catatRiwayat(null, {
        kegiatanId: lama.kegiatanId,
        aksi: 'ubah_penanggung_jawab',
        entitas: 'dokumen',
        entitasId: dokumenId,
        aktorNama: username,
        ringkasan: `Penanggung jawab dokumen "${lama.nama}" diubah menjadi ${
            penanggungJawab === 'keuangan' ? 'Tim Keuangan' : 'Ketua Tim'}`,
    });

    const [barisBaru] = await db.query<RowDataPacket[]>('SELECT * FROM dokumen WHERE id = ?', [dokumenId]);
    return barisBaru[0] as Dokumen;
};
