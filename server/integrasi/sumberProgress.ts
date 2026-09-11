// server/integrasi/sumberProgress.ts

/**
 * Titik sambung sumber progres pendataan.
 *
 * Hari ini progres mitra diisi manual oleh PML lewat layar Update Progress, dan
 * tersimpan di tabel `ppl_progress`. Ke depan, untuk kegiatan yang memakai
 * FASIH, angka yang sama sudah ada di FASIH dan seharusnya tidak diketik ulang.
 *
 * Berkas ini menyiapkan pergantian itu sebagai SATU titik, bukan perubahan yang
 * menyebar. Yang perlu ditulis saat FASIH tersedia hanyalah isi
 * `ambilProgress()` pada `sumberFasih` — sisanya, termasuk cara memilih sumber
 * dan bentuk datanya, sudah ditentukan di sini.
 *
 * Kenapa bisa sesederhana itu: tabel `kegiatan` SUDAH punya kolom `isFasih`,
 * jadi penanda kegiatan mana yang datang dari FASIH tidak perlu dibuat baru.
 *
 * Yang SENGAJA tidak ditebak: alamat endpoint FASIH, bentuk JSON-nya, dan cara
 * autentikasinya. Ketiganya belum ada spesifikasinya, dan menuliskannya
 * sekarang hanya akan menghasilkan kode yang tampak siap tapi harus dibongkar.
 * Yang dibutuhkan dari pengelola FASIH didaftar di `docs/integrasi-fasih.md`.
 */

import type { ProgressType } from '../../shared/api';

/**
 * Bentuk baku progres satu mitra, apa pun sumbernya.
 *
 * INI kontraknya: adaptor FASIH nanti cukup menghasilkan bentuk ini, dan
 * seluruh aplikasi tidak perlu tahu dari mana angkanya berasal.
 */
export interface ProgresMitra {
    /** `ppl_master.id` — identitas mitra yang dipakai lintas kegiatan. */
    pplMasterId: string;
    /** Tahap pekerjaan, mengikuti kolom `ppl.tahap`. */
    tahap: string;
    /**
     * Angka per jenis progres, memakai enum yang sudah ada di `ppl_progress`:
     * pendataan  -> open, submit, diperiksa, approved
     * pengolahan -> belum_entry, sudah_entry, validasi, clean
     */
    nilai: Partial<Record<ProgressType, number>>;
}

export interface SumberProgress {
    /** Nama untuk ditampilkan dan dicatat di log. */
    readonly nama: string;
    /** Siap dipakai? Dipakai untuk memilih sumber dan untuk endpoint status. */
    tersedia(): boolean;
    /** Mengambil progres seluruh mitra sebuah kegiatan. */
    ambilProgress(kegiatanId: number): Promise<ProgresMitra[]>;
}

/**
 * Sumber yang berjalan sekarang: angka diketik PML, tersimpan di
 * `ppl_progress`. Pembacaannya sudah dilakukan `getKegiatanWithRelations`
 * bersama data kegiatan lain, jadi di sini tidak ada kueri tambahan — sumber
 * ini menandai bahwa jalur manual itulah yang sedang aktif.
 */
export const sumberManual: SumberProgress = {
    nama: 'Manual (diisi PML)',
    tersedia: () => true,
    ambilProgress: async () => [],
};

/** Konfigurasi FASIH, dibaca dari .env. Belum diisi = belum tersambung. */
export const konfigurasiFasih = () => ({
    baseUrl: process.env.FASIH_BASE_URL || '',
    token: process.env.FASIH_TOKEN || '',
});

/**
 * Sumber FASIH — KERANGKA, belum tersambung.
 *
 * Saat spesifikasi API FASIH tersedia, yang perlu ditulis hanya isi
 * `ambilProgress`: panggil endpointnya, lalu petakan jawabannya ke
 * `ProgresMitra[]`. Tidak ada berkas lain yang perlu diubah.
 */
export const sumberFasih: SumberProgress = {
    nama: 'FASIH',
    tersedia: () => {
        const { baseUrl, token } = konfigurasiFasih();
        return Boolean(baseUrl && token);
    },
    ambilProgress: async () => {
        throw new Error(
            'Integrasi FASIH belum tersambung. Isi FASIH_BASE_URL dan FASIH_TOKEN di .env, ' +
            'lalu lengkapi sumberFasih.ambilProgress sesuai docs/integrasi-fasih.md.'
        );
    },
};

/**
 * Memilih sumber untuk sebuah kegiatan.
 *
 * FASIH dipakai hanya bila kegiatannya memang ditandai FASIH DAN sambungannya
 * sudah dikonfigurasi. Bila salah satu belum, jatuh ke jalur manual — sehingga
 * memasang integrasi ini tidak pernah menghentikan pekerjaan yang sedang
 * berjalan, dan mematikannya kembali cukup dengan mengosongkan .env.
 */
export const pilihSumber = (
    kegiatan: { isFasih?: boolean | number | null },
    sumber: { manual: SumberProgress; fasih: SumberProgress } = { manual: sumberManual, fasih: sumberFasih },
): SumberProgress =>
    kegiatan?.isFasih && sumber.fasih.tersedia() ? sumber.fasih : sumber.manual;

/** Ringkasan untuk endpoint status; dipakai saat menjelaskan kesiapan aplikasi. */
export const statusIntegrasiFasih = () => {
    const { baseUrl } = konfigurasiFasih();
    const siap = sumberFasih.tersedia();
    return {
        tersambung: siap,
        baseUrl: baseUrl || null,
        // Token TIDAK ikut dilaporkan.
        keterangan: siap
            ? 'FASIH terkonfigurasi. Kegiatan bertanda FASIH akan mengambil progres dari sana.'
            : 'FASIH belum dikonfigurasi. Semua kegiatan memakai progres yang diisi PML.',
        langkahBerikutnya: siap ? [] : [
            'Isi FASIH_BASE_URL dan FASIH_TOKEN di .env',
            'Lengkapi sumberFasih.ambilProgress di server/integrasi/sumberProgress.ts',
            'Rincian kebutuhan ada di docs/integrasi-fasih.md',
        ],
    };
};
