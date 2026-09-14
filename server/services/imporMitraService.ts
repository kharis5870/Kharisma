// server/services/imporMitraService.ts

/**
 * Menerapkan impor daftar mitra dari aplikasi SOBAT.
 *
 * Aturan pembacaan berkas dan pencocokan orangnya ada di dua modul murni yang
 * dipakai bersama layar dan server, supaya pratinjau yang dilihat pengguna
 * benar-benar sama dengan yang nanti ditulis:
 *   ../../shared/imporMitra.ts         - kolom dan pencocokan orang
 *   ../../shared/terapkanImporMitra.ts - wilayah dan pembagian ID
 *
 * TIGA ATURAN YANG TIDAK BOLEH DILANGGAR
 *
 * 1. TIDAK PERNAH MENGHAPUS. Mitra yang tidak ada lagi di berkas hanya
 *    dinonaktifkan. Menghapusnya akan menghanguskan surat perjanjiannya
 *    (kontrak_mitra ON DELETE CASCADE) dan memutus alokasi kegiatannya
 *    (ppl.ppl_master_id ON DELETE SET NULL) — tanpa satu pun pesan galat.
 *
 * 2. SATU TRANSAKSI. Impor yang gagal di tengah jalan meninggalkan daftar mitra
 *    setengah berubah, dan tidak ada yang tahu bagian mana yang sudah masuk.
 *
 * 3. PRATINJAU TIDAK MENULIS APA PUN. Angka yang diperlihatkan sebelum
 *    konfirmasi dihitung lewat jalur yang sama dengan penulisannya, supaya
 *    keduanya tidak mungkin berbeda.
 */

import { RowDataPacket } from 'mysql2';
import db from '../db';
// Jalur relatif, BUKAN '@shared/...': alias itu tidak tersedia saat
// vite.config.ts memuat kode server lewat Node, dan ini nilai runtime.
import type { BarisImpor } from '../../shared/imporMitra';
import {
    alokasiIdMitra, cocokkanWilayah, type WilayahRef,
} from '../../shared/terapkanImporMitra';

export type TindakanBaris = 'tambah' | 'perbarui' | 'lewati';

export interface KeputusanBaris {
    nomorBaris: number;
    tindakan: TindakanBaris;
    /** Wajib untuk 'perbarui': mitra mana yang diperbarui. */
    mitraId?: string;
}

export interface PermintaanImpor {
    baris: BarisImpor[];
    keputusan: KeputusanBaris[];
    /** Mitra yang tidak ada di berkas dan disetujui pengguna untuk dinonaktifkan. */
    nonaktifkan?: string[];
    /** True berarti hanya menghitung; tidak ada satu pun tulisan ke database. */
    pratinjau: boolean;
}

export interface MasalahBaris {
    nomorBaris: number;
    pesan: string;
}

export interface HasilImpor {
    pratinjau: boolean;
    ditambah: number;
    diperbarui: number;
    dilewati: number;
    dinonaktifkan: number;
    /**
     * Hal-hal yang PERLU DIKETAHUI tapi tidak menggagalkan impor, mis. nama
     * desa yang tidak dikenali. Barisnya tetap masuk, wilayahnya saja yang
     * dikosongkan — satu nama desa salah ketik tidak pantas membatalkan impor
     * seratus mitra.
     */
    peringatan: MasalahBaris[];
    /** Hal yang MENGGAGALKAN barisnya, mis. ID SOBAT bentrok dengan mitra lain. */
    ditolak: MasalahBaris[];
}

interface MitraTersimpanDb {
    id: string;
    sobat_id: string | null;
    namaPPL: string;
}

/**
 * Menjalankan impor, atau menghitungnya saja bila `pratinjau`.
 *
 * Seluruh pemeriksaan dilakukan LEBIH DULU, sebelum satu baris pun ditulis:
 * dengan begitu pratinjau dan penulisan menempuh jalur yang sama, dan kegagalan
 * yang bisa diperkirakan (ID SOBAT bentrok) ketahuan sebelum transaksi dimulai.
 */
export const terapkanImpor = async (
    permintaan: PermintaanImpor,
): Promise<HasilImpor> => {
    const { baris, keputusan, nonaktifkan = [], pratinjau } = permintaan;

    const [kecRows] = await db.query<RowDataPacket[]>('SELECT id, nama FROM kecamatan');
    const [desaRows] = await db.query<RowDataPacket[]>('SELECT id, nama, kecamatan_id FROM desa');
    const [mitraRows] = await db.query<RowDataPacket[]>(
        'SELECT id, sobat_id, namaPPL FROM ppl_master');

    const kecamatan: WilayahRef[] = kecRows.map(r => ({ id: Number(r.id), nama: r.nama }));
    const desa: WilayahRef[] = desaRows.map(r => ({
        id: Number(r.id), nama: r.nama, kecamatanId: Number(r.kecamatan_id),
    }));
    const tersimpan = mitraRows as MitraTersimpanDb[];

    const perNomor = new Map<number, BarisImpor>(baris.map(b => [b.nomorBaris, b]));
    // sobat_id -> pemiliknya sekarang, untuk menangkap bentrok sebelum database
    // menolaknya di tengah transaksi.
    const pemilikSobatId = new Map<string, string>();
    for (const m of tersimpan) {
        if (m.sobat_id) pemilikSobatId.set(m.sobat_id.trim(), m.id);
    }

    const peringatan: MasalahBaris[] = [];
    const ditolak: MasalahBaris[] = [];

    interface Rencana {
        nomorBaris: number;
        tindakan: 'tambah' | 'perbarui';
        mitraId?: string;
        sobatId: string | null;
        nama: string;
        posisi: string;
        alamat: string | null;
        telepon: string | null;
        kecamatanId: number | null;
        desaId: number | null;
    }
    const rencana: Rencana[] = [];
    let dilewati = 0;

    for (const k of keputusan) {
        if (k.tindakan === 'lewati') { dilewati++; continue; }

        const b = perNomor.get(k.nomorBaris);
        if (!b) {
            ditolak.push({ nomorBaris: k.nomorBaris, pesan: 'Baris tidak ditemukan di berkas.' });
            continue;
        }
        if (b.nama.trim() === '') {
            ditolak.push({ nomorBaris: k.nomorBaris, pesan: 'Nama kosong.' });
            continue;
        }
        if (k.tindakan === 'perbarui' && !k.mitraId) {
            ditolak.push({ nomorBaris: k.nomorBaris, pesan: 'Tidak jelas mitra mana yang diperbarui.' });
            continue;
        }

        // ID SOBAT hanya boleh dimiliki satu mitra. Bentrok ditangkap di sini
        // supaya tidak menggagalkan transaksi yang sudah berjalan separuh.
        const sobatId = b.sobatId?.trim() || null;
        if (sobatId) {
            const pemilik = pemilikSobatId.get(sobatId);
            if (pemilik && pemilik !== k.mitraId) {
                ditolak.push({
                    nomorBaris: k.nomorBaris,
                    pesan: `ID SOBAT ${sobatId} sudah dipakai mitra ${pemilik}.`,
                });
                continue;
            }
        }

        // Wilayah yang bermasalah TIDAK menggagalkan baris: mitranya tetap
        // masuk dengan wilayah kosong, dan masalahnya dilaporkan agar bisa
        // dibetulkan belakangan.
        const wilayah = cocokkanWilayah(b.kecamatan, b.desa, kecamatan, desa);
        if (wilayah.masalah) {
            peringatan.push({ nomorBaris: k.nomorBaris, pesan: wilayah.pesan ?? wilayah.masalah });
        }

        rencana.push({
            nomorBaris: k.nomorBaris,
            tindakan: k.tindakan,
            mitraId: k.mitraId,
            sobatId,
            nama: b.nama.trim(),
            // Posisi yang tidak dikenali jatuh ke bawaan kolomnya, dan itu
            // dilaporkan supaya tidak tampak seolah tertulis di berkas.
            posisi: b.posisi ?? 'Pendataan',
            alamat: b.alamat ?? null,
            telepon: b.telepon ?? null,
            kecamatanId: wilayah.kecamatanId,
            desaId: wilayah.desaId,
        });
        if (!b.posisi) {
            peringatan.push({
                nomorBaris: k.nomorBaris,
                pesan: 'Posisi tidak dikenali; disetel sebagai Pendataan.',
            });
        }
    }

    const perluId = rencana.filter(r => r.tindakan === 'tambah');
    const idBaru = alokasiIdMitra(tersimpan.map(m => m.id), perluId.length);
    perluId.forEach((r, i) => { r.mitraId = idBaru[i]; });

    const hasil: HasilImpor = {
        pratinjau,
        ditambah: perluId.length,
        diperbarui: rencana.length - perluId.length,
        dilewati,
        dinonaktifkan: nonaktifkan.length,
        peringatan,
        ditolak,
    };

    if (pratinjau) return hasil;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        for (const r of rencana) {
            if (r.tindakan === 'tambah') {
                await connection.execute(
                    `INSERT INTO ppl_master
                        (id, sobat_id, namaPPL, posisi, alamat, noTelepon, kecamatan_id, desa_id, aktif)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                    [r.mitraId, r.sobatId, r.nama, r.posisi, r.alamat, r.telepon, r.kecamatanId, r.desaId]
                );
            } else {
                // Wilayah hanya ditimpa bila berkasnya memang menyebutkannya:
                // berkas yang tidak memuat kolom desa tidak boleh MENGHAPUS
                // desa yang sudah tercatat.
                await connection.execute(
                    `UPDATE ppl_master
                        SET sobat_id = COALESCE(?, sobat_id),
                            namaPPL = ?,
                            posisi = ?,
                            alamat = COALESCE(?, alamat),
                            noTelepon = COALESCE(?, noTelepon),
                            kecamatan_id = COALESCE(?, kecamatan_id),
                            desa_id = COALESCE(?, desa_id),
                            aktif = 1,
                            nonaktifSejak = NULL
                      WHERE id = ?`,
                    [r.sobatId, r.nama, r.posisi, r.alamat, r.telepon, r.kecamatanId, r.desaId, r.mitraId]
                );
            }
        }

        for (const id of nonaktifkan) {
            await connection.execute(
                'UPDATE ppl_master SET aktif = 0, nonaktifSejak = CURDATE() WHERE id = ?', [id]);
        }

        await connection.commit();
        return hasil;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
