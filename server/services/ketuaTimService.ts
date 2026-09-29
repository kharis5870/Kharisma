import { RowDataPacket } from 'mysql2';
import db from '../db';
import { KetuaTim } from '@shared/api'; 

interface KetuaTimPacket extends KetuaTim, RowDataPacket {}

/**
 * Seluruh baris ketua tim, semua tahun kepengurusan sekaligus.
 *
 * `tahun` WAJIB ikut terbawa: form kegiatan menyaring daftar ini menurut tahun
 * kegiatannya (`ketuaTimTahun`), jadi tanpa kolom itu penyaringnya membuang
 * semua baris dan dropdownnya tampak kosong meski datanya ada.
 *
 * Penyaringan dikerjakan di layar, bukan di query, karena satu form bisa
 * berpindah tahun saat tanggal persiapannya diubah — dan kegiatan lama tetap
 * harus bisa menampilkan ketua tim dari tahun kepengurusan lamanya.
 *
 * Nama dan NIP datang dari `users`, bukan dari baris kepengurusannya, supaya
 * koreksi ejaan nama cukup dilakukan sekali dan langsung berlaku untuk semua
 * tahun. `JOIN` biasa, bukan `LEFT JOIN`: sejak migrasi
 * 2026-09-28-ketua-tim-ikut-akun, setiap kepengurusan wajib punya akun.
 */
export const getAllKetuaTim = async (): Promise<KetuaTim[]> => {
    const [rows] = await db.query<KetuaTimPacket[]>(
        `SELECT kt.id, u.nama_lengkap AS namaKetua, kt.tahun, u.nip, kt.tim,
                kt.user_id AS userId
           FROM ketua_tim kt
           JOIN users u ON u.id = kt.user_id
          ORDER BY kt.tahun DESC, u.nama_lengkap ASC`);
    return rows;
};
