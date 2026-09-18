// Dipisah dari server/services/kontrakService.ts tanpa mengubah isinya.

import { RowDataPacket } from 'mysql2';
import db from '../db';
import { DataKontrakMitra } from '@shared/api';
import { keBarisIsi, getDataKontrak } from './kontrakData';

export type HasilPerbaruiIsi = 'ok' | 'tidak-ada' | 'tidak-aktif' | 'tanpa-data';

/**
 * "Perbarui kontrak": isi surat disegarkan mengikuti data sekarang, DENGAN
 * NOMOR YANG SAMA.
 *
 * Dipakai saat honor atau muatan berubah setelah surat terbit, atau ada
 * kegiatan baru yang masuk. Nomor sengaja tidak berubah — bagi tim keuangan
 * ini surat yang sama yang dicetak ulang, bukan surat baru; menerbitkan nomor
 * baru justru menciptakan dua surat untuk satu pekerjaan, persis masalah yang
 * baru saja ditutup.
 *
 * Setelah ini peringatan "isi berubah" hilang dengan sendirinya, karena
 * salinan isi yang dibandingkan sudah sama dengan data sekarang.
 */
export const perbaruiIsiSurat = async (id: number, username?: string): Promise<HasilPerbaruiIsi> => {
    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT ppl_master_id, status, nomor_surat,
                DATE_FORMAT(periode_mulai,   '%Y-%m-%d') AS periode_mulai,
                DATE_FORMAT(periode_selesai, '%Y-%m-%d') AS periode_selesai
           FROM kontrak_mitra WHERE id = ?`,
        [id]
    );
    const surat = rows[0];
    if (!surat) return 'tidak-ada';
    // Surat batal tidak diperbarui: ia arsip, dan isinya harus tetap
    // memperlihatkan keadaan saat ia dibatalkan.
    if (surat.status !== 'aktif') return 'tidak-aktif';

    const data = await getDataKontrak(surat.periode_mulai, surat.periode_selesai);
    const mitra = data.find(m => m.pplMasterId === surat.ppl_master_id);
    // Mitra sudah tidak punya honor sama sekali di periode ini: memperbarui
    // akan menghasilkan surat kosong. Yang benar adalah membatalkan suratnya,
    // dan itu keputusan manusia, bukan efek samping tombol perbarui.
    if (!mitra || mitra.baris.length === 0) return 'tanpa-data';

    const isi = mitra.baris.map(keBarisIsi);
    await db.execute(
        `UPDATE kontrak_mitra
            SET total_honor = ?, isi_terbit = ?, total_volume = ?, jumlah_baris = ?,
                diperbaruiPada = NOW(), diperbaruiOleh = ?
          WHERE id = ?`,
        [mitra.totalHonor, JSON.stringify(isi), isi.reduce((j, b) => j + b.volume, 0),
         isi.length, username ?? null, id]
    );
    await db.execute(
        `INSERT INTO riwayat_surat
            (aksi, periode_mulai, periode_selesai, jumlah, jumlah_bast, nomor_surat, nomor_bast, aktorNama)
         VALUES ('perbarui_kontrak', ?, ?, 1, 0, ?, NULL, ?)`,
        [surat.periode_mulai, surat.periode_selesai, surat.nomor_surat, username ?? null]
    );
    return 'ok';
};

export interface SuratBerubah {
    suratId: number;
    nomorSurat: string;
    pplMasterId: string;
    namaPPL: string;
    periodeMulai: string;
    periodeSelesai: string;
    /** Kegiatan penyebab perubahan; null bila tidak bisa ditelusuri. */
    kegiatanId: number | null;
    namaKegiatan: string;
    /** Kalimat singkat perubahannya, mis. "Muatan 10 → 12 Dokumen". */
    ringkasan: string;
    occurredAt: string;
}

/**
 * Surat yang SUDAH terbit tetapi isinya tidak lagi sesuai data sekarang.
 *
 * Menjadi dasar notifikasi untuk tim keuangan. Sengaja memakai `getDataKontrak`
 * yang sama dengan layar Generate Surat, bukan kueri agregat tersendiri:
 * notifikasi yang memakai perhitungan sendiri cepat atau lambat akan berbeda
 * dari yang terlihat di layar, dan yang salah justru sulit dikenali karena
 * keduanya sama-sama "masuk akal".
 *
 * Biayanya satu `getDataKontrak` per periode yang punya surat aktif. Karena
 * surat dibuat per bulan, itu berarti segelintir periode saja.
 *
 * `occurredAt` memakai waktu surat terbit atau terakhir diperbarui, BUKAN waktu
 * perubahan datanya — kapan tepatnya honor diubah tidak tercatat di sini.
 * Akibatnya notifikasi ini tidak naik ke atas saat perubahan baru terjadi, dan
 * itu disengaja: yang penting ia ADA selama ketidaksesuaiannya belum dibereskan.
 */
export const suratBerubahSejakTerbit = async (): Promise<SuratBerubah[]> => {
    const [periode] = await db.query<RowDataPacket[]>(
        `SELECT DISTINCT
                DATE_FORMAT(periode_mulai,   '%Y-%m-%d') AS mulai,
                DATE_FORMAT(periode_selesai, '%Y-%m-%d') AS selesai
           FROM kontrak_mitra WHERE status = 'aktif'`
    );

    const [suratAktif] = await db.query<RowDataPacket[]>(
        `SELECT km.id, km.ppl_master_id, km.nomor_surat,
                COALESCE(pm.namaPPL, km.ppl_master_id) AS namaPPL,
                DATE_FORMAT(km.periode_mulai,   '%Y-%m-%d') AS periode_mulai,
                DATE_FORMAT(km.periode_selesai, '%Y-%m-%d') AS periode_selesai,
                COALESCE(km.diperbaruiPada, km.tanggal_surat) AS waktu
           FROM kontrak_mitra km
           LEFT JOIN ppl_master pm ON pm.id = km.ppl_master_id
          WHERE km.status = 'aktif'`
    );
    const waktuSurat = new Map<number, string>(
        suratAktif.map(r => [Number(r.id), new Date(r.waktu).toISOString()])
    );

    /** Data sekarang per periode, disimpan untuk dipakai lagi di bawah. */
    const dataPerPeriode = new Map<string, DataKontrakMitra[]>();
    const kunciPeriode = (mulai: string, selesai: string) => `${mulai}|${selesai}`;

    const hasil: SuratBerubah[] = [];
    for (const p of periode) {
        const data = await getDataKontrak(p.mulai, p.selesai);
        dataPerPeriode.set(kunciPeriode(p.mulai, p.selesai), data);
        for (const mitra of data) {
            if (!mitra.suratId || !mitra.perubahan?.length) continue;
            for (const beda of mitra.perubahan) {
                // `kunci` berbentuk "<kegiatanId>-<jenis>"; lihat BarisKontrak.kunci.
                const dariKunci = mitra.baris.find(b => b.uraianTugas === beda.judul)?.kunci;
                const kegiatanId = dariKunci ? Number(dariKunci.split('-')[0]) : NaN;
                hasil.push({
                    suratId: mitra.suratId,
                    nomorSurat: mitra.nomorSurat ?? '',
                    pplMasterId: mitra.pplMasterId,
                    namaPPL: mitra.nama,
                    periodeMulai: p.mulai,
                    periodeSelesai: p.selesai,
                    kegiatanId: Number.isInteger(kegiatanId) ? kegiatanId : null,
                    namaKegiatan: beda.judul,
                    ringkasan: beda.rincian.join(' '),
                    occurredAt: waktuSurat.get(mitra.suratId) ?? new Date().toISOString(),
                });
            }
        }
    }
    // Surat yang mitranya sudah TIDAK punya pekerjaan sama sekali pada periode
    // itu — kegiatannya dihapus, alokasinya dicabut, atau muatannya berpindah
    // seluruhnya ke bulan lain.
    //
    // Tidak mungkin tertangkap di atas: perbandingan berjalan per mitra yang
    // MASIH muncul di data sekarang, sedangkan mitra ini sudah lenyap dari
    // daftar. Padahal justru inilah perubahan terbesar yang bisa terjadi pada
    // sebuah surat, dan tanpa bagian ini ia satu-satunya yang lolos tanpa
    // peringatan — surat tetap berlaku untuk pekerjaan yang sudah tidak ada.
    for (const s of suratAktif) {
        const data = dataPerPeriode.get(kunciPeriode(s.periode_mulai, s.periode_selesai)) ?? [];
        const mitra = data.find(m => m.pplMasterId === s.ppl_master_id);
        if (mitra && mitra.baris.length > 0) continue;
        hasil.push({
            suratId: Number(s.id),
            nomorSurat: s.nomor_surat,
            pplMasterId: s.ppl_master_id,
            namaPPL: s.namaPPL,
            periodeMulai: s.periode_mulai,
            periodeSelesai: s.periode_selesai,
            kegiatanId: null,
            namaKegiatan: 'Tidak ada pekerjaan tersisa',
            ringkasan: 'Mitra sudah tidak punya honor sama sekali pada periode ini. Surat ini sebaiknya dibatalkan, bukan diperbarui.',
            occurredAt: waktuSurat.get(Number(s.id)) ?? new Date().toISOString(),
        });
    }

    return hasil;
};
