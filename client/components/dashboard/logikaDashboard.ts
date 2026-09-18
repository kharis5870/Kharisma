// Dipisah dari client/pages/Dashboard.tsx tanpa mengubah isinya.

import { Kegiatan, PPL, Dokumen, ProgressType } from "@shared/api";
import { format, isPast, parseISO, differenceInDays, formatDistanceToNow, endOfDay } from "date-fns";
import { id as localeID } from 'date-fns/locale';
import { GAYA_STATUS_KEGIATAN, NADA_STATUS } from "@/lib/statusStyles";
import { menahanTenggatKetuaTim } from "@/lib/hakDokumen";

export type EditableProgressKey = 'submit' | 'diperiksa' | 'approved' | 'sudah_entry' | 'validasi' | 'clean';
export type ProgressTypeFilter = 'submit' | 'approved' | 'sudah_entry' | 'clean';

export type PPLWithProgress = PPL & {
    progress: Partial<Record<ProgressType, number>>;
};

export type KegiatanWithDynamicStatus = Kegiatan & {
    dynamicStatus: {
        status: Kegiatan['status'];
        color: string;
        warnings: string[];
    }
};

export const calculateActivityStatus = (kegiatan: Kegiatan): KegiatanWithDynamicStatus['dynamicStatus'] => {
    const warnings: string[] = [];
    const now = new Date();

    const checkTahapanWarning = (
        tanggalSelesai: string | undefined,
        tipeDokumen: Dokumen['tipe'],
        namaTahapan: string
    ) => {
        if (tanggalSelesai && isPast(parseISO(tanggalSelesai))) {
            // Aturannya sama dengan qTenggat di notifikasiService: dokumen yang
            // dialihkan ke tim keuangan tidak lagi memerahkan dashboard ketua
            // tim, karena ia memang tidak bisa mengisinya. Dipakai lewat helper
            // supaya klien dan SQL tidak menyimpang diam-diam.
            const dokumenTahapan = kegiatan.dokumen.filter(
                d => d.tipe === tipeDokumen && menahanTenggatKetuaTim(d));
            if (dokumenTahapan.length > 0 && !dokumenTahapan.every(d => d.status === 'Approved')) {
                warnings.push(`Laporan ${namaTahapan} terlambat disetujui`);
            }
        }
    };

    checkTahapanWarning(kegiatan.tanggalSelesaiPersiapan, 'persiapan', 'Persiapan');
    checkTahapanWarning(kegiatan.tanggalSelesaiPengumpulanData, 'pengumpulan-data', 'Pengumpulan Data');
    checkTahapanWarning(kegiatan.tanggalSelesaiPengolahanAnalisis, 'pengolahan-analisis', 'Pengolahan & Analisis');
    checkTahapanWarning(kegiatan.tanggalSelesaiDiseminasiEvaluasi, 'diseminasi-evaluasi', 'Diseminasi & Evaluasi');

    let status: Kegiatan['status'] = kegiatan.status;
    // Anotasi `string` perlu: NADA_STATUS pakai `as const`, tanpa ini TS
    // menyimpulkan tipe literal dan menolak penugasan ulang di bawah.
    let color: string = NADA_STATUS.biru; // default: Persiapan

    if (kegiatan.tanggalSelesaiDiseminasiEvaluasi && isPast(parseISO(kegiatan.tanggalSelesaiDiseminasiEvaluasi))) {
        status = 'Selesai';
    } else if (kegiatan.tanggalMulaiDiseminasiEvaluasi && now >= parseISO(kegiatan.tanggalMulaiDiseminasiEvaluasi)) {
        status = 'Diseminasi & Evaluasi';
    } else if (kegiatan.tanggalMulaiPengolahanAnalisis && now >= parseISO(kegiatan.tanggalMulaiPengolahanAnalisis)) {
        status = 'Pengolahan & Analisis';
    } else if (kegiatan.tanggalMulaiPengumpulanData && now >= parseISO(kegiatan.tanggalMulaiPengumpulanData)) {
        status = 'Pengumpulan Data';
    } else {
        status = 'Persiapan';
    }

    // Peringatan progres mandek HANYA selama masa pengumpulan data: di situlah
    // PML mengisi progres, termasuk untuk mitra Pengolahan yang juga bekerja
    // pada masa pendataan. Sesudah masa itu tidak ada lagi yang bisa
    // diperbarui, jadi peringatannya hanya menjadi bising.
    //
    // Kegiatan tanpa alokasi mitra dan kegiatan yang progresnya sudah penuh
    // juga dilewati: tidak ada tindakan yang bisa diambil.
    //
    // KEMBARAN di server: `qMandek` di server/services/notifikasiService.ts
    // memakai aturan yang sama untuk notifikasi Ketua Tim — ubah keduanya
    // bersamaan.
    const mulaiPendataan = kegiatan.tanggalMulaiPengumpulanData;
    const selesaiPendataan = kegiatan.tanggalSelesaiPengumpulanData;
    const masaPendataan = Boolean(mulaiPendataan)
        && now >= parseISO(mulaiPendataan!)
        && (!selesaiPendataan || now <= endOfDay(parseISO(selesaiPendataan)));
    const adaYangBisaDiperbarui = (kegiatan.ppl?.length ?? 0) > 0
        && (kegiatan.progressKeseluruhan ?? 0) < 100;

    if (masaPendataan && adaYangBisaDiperbarui && differenceInDays(now, parseISO(kegiatan.lastUpdated)) > 2) {
        warnings.push('Tidak ada pembaruan progress selama lebih dari 2 hari pada masa pengumpulan data.');
    }

    // Warna status dipusatkan di @/lib/statusStyles supaya konsisten dengan
    // ViewDocuments dan tetap terbaca di mode gelap.
    color = GAYA_STATUS_KEGIATAN[status] ?? color;

    return { status, color, warnings };
};

export const getProgressBarValue = (ppl: PPLWithProgress) => {
    const totalBeban = parseInt(ppl.bebanKerja as any) || 0;
    if (totalBeban === 0) return 0;
    const approvedValue = (ppl.tahap === 'listing' || ppl.tahap === 'pencacahan')
        ? (ppl.progress.approved ?? 0)
        : (ppl.progress.clean ?? 0);
    return ((approvedValue) / totalBeban) * 100;
};

export const getRelativeTime = (dateString: string) => {
    if (!dateString) return "-";
    const date = parseISO(dateString);
    const now = new Date();
    const diffDays = differenceInDays(now, date);

    if (diffDays > 30) {
        return format(date, 'dd MMM yyyy', { locale: localeID });
    }
    return formatDistanceToNow(date, { addSuffix: true, locale: localeID });
};
