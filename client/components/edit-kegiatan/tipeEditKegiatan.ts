// Dipisah dari client/pages/EditActivity.tsx tanpa mengubah isinya.

import { Kegiatan, PPL, Dokumen, HonorariumDetail as ApiHonorariumDetail } from "@shared/api";

export type TahapDokumen = 'persiapan' | 'pengumpulan-data' | 'pengolahan-analisis' | 'diseminasi-evaluasi';

export interface HonorariumDetail extends ApiHonorariumDetail {}

export type ClientPPL = Omit<PPL, 'honorarium'> & { clientId: string; honorarium: HonorariumDetail[] };
export type ClientDokumen = Dokumen & { clientId: string };

export type HonorariumSettings = {
    'pengumpulan-data-listing': { satuanBebanKerja: string, hargaSatuan: string };
    'pengumpulan-data-pencacahan': { satuanBebanKerja: string, hargaSatuan: string };
    'pengolahan-analisis': { satuanBebanKerja: string, hargaSatuan: string };
};

export type FormState = Omit<Kegiatan, 'ppl' | 'dokumen' | 'lastUpdated' | 'lastUpdatedBy' | 'namaKetua' | 'bulanPembayaranHonor' | 'tanggalMulaiPersiapan' | 'tanggalSelesaiPersiapan' | 'tanggalMulaiPengumpulanData' | 'tanggalSelesaiPengumpulanData' | 'tanggalMulaiPengolahanAnalisis' | 'tanggalSelesaiPengolahanAnalisis' | 'tanggalMulaiDiseminasiEvaluasi' | 'tanggalSelesaiDiseminasiEvaluasi'> & {
    tanggalMulaiPersiapan?: Date;
    tanggalSelesaiPersiapan?: Date;
    tanggalMulaiPengumpulanData?: Date;
    tanggalSelesaiPengumpulanData?: Date;
    tanggalMulaiPengolahanAnalisis?: Date;
    tanggalSelesaiPengolahanAnalisis?: Date;
    tanggalMulaiDiseminasiEvaluasi?: Date;
    tanggalSelesaiDiseminasiEvaluasi?: Date;
    ppl: ClientPPL[];
    dokumen: ClientDokumen[];
    honorariumSettings: HonorariumSettings;
    bulanHonorListing?: string;
    bulanHonorPencacahan?: string;
    bulanHonorPengolahan?: string;
    tanggalMulaiHonorListing?: string;
    tanggalSelesaiHonorListing?: string;
    tanggalMulaiHonorPencacahan?: string;
    tanggalSelesaiHonorPencacahan?: string;
    tanggalMulaiHonorPengolahan?: string;
    tanggalSelesaiHonorPengolahan?: string;
};

export type DateFieldName =
    | 'tanggalMulaiPersiapan' | 'tanggalSelesaiPersiapan'
    | 'tanggalMulaiPengumpulanData' | 'tanggalSelesaiPengumpulanData'
    | 'tanggalMulaiPengolahanAnalisis' | 'tanggalSelesaiPengolahanAnalisis'
    | 'tanggalMulaiDiseminasiEvaluasi' | 'tanggalSelesaiDiseminasiEvaluasi';

/** Nilai tahap dokumen yang sah, untuk memvalidasi parameter URL dari notifikasi. */
export const TAHAP_DOKUMEN_SAH: TahapDokumen[] = ['persiapan', 'pengumpulan-data', 'pengolahan-analisis', 'diseminasi-evaluasi'];
