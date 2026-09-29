// server/services/adminService.ts

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { UserData, KetuaTimData, PPLAdminData } from '@shared/api';
import bcrypt from 'bcryptjs'; 
import * as pplService from './pplService';
// Jalur relatif, BUKAN @shared — nilai runtime di kode server.
import { periksaPassword } from '../../shared/aturanPassword';
import { alokasiIdMitra } from '../../shared/terapkanImporMitra';

const SALT_ROUNDS = 10;

// --- User Management (Tidak ada perubahan) ---
export const getAllUsers = async (): Promise<UserData[]> => {
    const [rows] = await db.query<RowDataPacket[]>('SELECT id, username, nama_lengkap AS namaLengkap, nip, role, isPML FROM users ORDER BY nama_lengkap ASC');
    return rows as UserData[];
};

/** NIP kosong disimpan sebagai NULL, bukan string kosong, supaya "belum diisi" hanya punya satu bentuk. */
const nipTersimpan = (nip: unknown): string | null => {
    const teks = String(nip ?? '').trim();
    return teks === '' ? null : teks;
};

export const createUser = async (user: UserData): Promise<UserData> => {
    const { id, username, password, namaLengkap, nip, role, isPML } = user;
    // Aturan password ditegakkan DI SERVER, bukan hanya di form Manajemen
    // Admin: permintaan yang dikirim langsung ke API tidak melewati form.
    const galatPassword = periksaPassword(password, username);
    if (galatPassword || !password) {
        throw Object.assign(new Error(galatPassword ?? 'Password wajib diisi.'), { statusCode: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await db.execute('INSERT INTO users (id, username, password, nama_lengkap, nip, role, isPML) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, username, hashedPassword, namaLengkap, nipTersimpan(nip), role, isPML || false]);
    return { ...user, password: '' };
};

export const updateUser = async (id: string, user: UserData): Promise<UserData> => {
    const { username, password, namaLengkap, nip, role, isPML } = user;
    if (password) {
        const galatPassword = periksaPassword(password, username);
        if (galatPassword) throw Object.assign(new Error(galatPassword), { statusCode: 400 });
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        // tokenVersi naik: password yang direset admin mencabut semua sesi
        // yang masih terbuka dengan password lama.
        await db.execute('UPDATE users SET username = ?, password = ?, tokenVersi = tokenVersi + 1, nama_lengkap = ?, nip = ?, role = ?, isPML = ? WHERE id = ?', [username, hashedPassword, namaLengkap, nipTersimpan(nip), role, isPML || false, id]);
    } else {
        await db.execute('UPDATE users SET username = ?, nama_lengkap = ?, nip = ?, role = ?, isPML = ? WHERE id = ?', [username, namaLengkap, nipTersimpan(nip), role, isPML || false, id]);
    }
    return { ...user, password: '' };
};

/**
 * Menghapus akun — DITOLAK bila akun itu masih dipakai sebagai PML atau
 * ditautkan ke ketua tim.
 *
 * `ppl.pml_id` tidak punya foreign key. Menghapus akun PML yang masih
 * mengawasi mitra meninggalkan mitra "yatim": kolom PML-nya menunjuk akun
 * yang tidak ada, tidak ada PML yang bisa memperbarui progresnya (hanya
 * admin), dan jumlahnya diam-diam hilang dari Daftar PML. Tautan ketua tim
 * memang SET NULL, tetapi akibatnya ketua tim itu berhenti menerima
 * notifikasi kegiatan timnya tanpa ada yang tahu.
 */
export const deleteUser = async (id: string): Promise<boolean> => {
    const [[pakai]] = await db.query<RowDataPacket[]>(
        `SELECT (SELECT COUNT(*) FROM ppl WHERE pml_id = ?) AS alokasi,
                (SELECT COUNT(DISTINCT kegiatanId) FROM ppl WHERE pml_id = ?) AS kegiatan,
                (SELECT GROUP_CONCAT(CONCAT(COALESCE(tim, 'tanpa tim'), ' ', tahun)
                                     ORDER BY tahun, tim SEPARATOR ', ')
                   FROM ketua_tim WHERE user_id = ?) AS ketuaTim`,
        [id, id, id]);
    const alasan: string[] = [];
    const langkah: string[] = [];
    if (Number(pakai.alokasi) > 0) {
        alasan.push(`masih menjadi PML untuk ${pakai.alokasi} alokasi mitra di ${pakai.kegiatan} kegiatan`);
        langkah.push('pindahkan mitra tersebut ke PML lain lewat Edit Kegiatan');
    }
    if (pakai.ketuaTim) {
        // Kepengurusan disebut sebagai tim dan tahunnya, karena nama orangnya
        // justru datang dari akun yang sedang hendak dihapus ini.
        alasan.push(`masih tercatat sebagai ketua tim ${pakai.ketuaTim}`);
        langkah.push('hapus atau pindahkan kepengurusan tersebut di tab Ketua Tim');
    }
    if (alasan.length > 0) {
        throw Object.assign(
            new Error(`User ini tidak bisa dihapus karena ${alasan.join(' dan ')}. Sebelum menghapus, ${langkah.join(', lalu ')}.`),
            { statusCode: 409 });
    }

    const [result] = await db.execute<OkPacket>('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

export const getAllPMLs = async (): Promise<UserData[]> => {
    const [rows] = await db.query<RowDataPacket[]>("SELECT id, nama_lengkap AS namaLengkap FROM users WHERE isPML = TRUE ORDER BY nama_lengkap ASC");
    return rows as UserData[];
};

// --- Ketua Tim Management ---

/**
 * Tahun kepengurusan yang masuk akal.
 *
 * Kolomnya `SMALLINT UNSIGNED NOT NULL`, jadi nilai yang tidak sah ditolak
 * database dengan galat mentah. Diperiksa di sini supaya pesannya bisa dibaca,
 * dan supaya salah ketik (2 0 2 6 menjadi 20026) tidak melahirkan kepengurusan
 * yang tidak pernah muncul di dropdown mana pun.
 */
const tahunKetuaTimSah = (tahun: unknown): number => {
    const n = Number(tahun);
    if (!Number.isInteger(n) || n < 2000 || n > 2100) {
        throw Object.assign(
            new Error('Tahun kepengurusan harus berupa tahun antara 2000 dan 2100.'),
            { statusCode: 400 });
    }
    return n;
};
/**
 * Akun yang wajib ada di balik setiap kepengurusan.
 *
 * Sejak nama dan NIP dibaca dari `users`, baris kepengurusan tanpa akun tidak
 * punya nama sama sekali — ia akan hilang dari dropdown ketua tim karena
 * kueri-kueri itu menyambung ke `users`. Ditolak di sini supaya pesannya bisa
 * dibaca, bukan menunggu galat foreign key yang tidak berarti apa-apa bagi
 * pengguna.
 */
const akunKetuaTimSah = (userId: unknown): string => {
    const id = String(userId ?? '').trim();
    if (id === '') {
        throw Object.assign(
            new Error('Ketua tim harus ditautkan ke sebuah akun pengguna; nama dan NIP-nya diambil dari akun itu.'),
            { statusCode: 400 });
    }
    return id;
};

export const getAllKetuaTim = async (): Promise<KetuaTimData[]> => {
    // Terbaru lebih dulu: yang dicari sehari-hari adalah kepengurusan tahun
    // berjalan, sedangkan tahun-tahun lama hanya dibutuhkan sebagai arsip.
    //
    // Nama dan NIP datang dari `users`, tidak disimpan di baris ini — lihat
    // migrasi 2026-09-28-ketua-tim-ikut-akun.
    const [rows] = await db.query<RowDataPacket[]>(`SELECT kt.id, u.nama_lengkap AS nama, kt.tahun, u.nip, kt.tim,
                 kt.user_id AS userId
            FROM ketua_tim kt
            JOIN users u ON u.id = kt.user_id
           ORDER BY kt.tahun DESC, u.nama_lengkap ASC`);
    return rows as KetuaTimData[];
};
export const createKetuaTim = async (data: KetuaTimData): Promise<KetuaTimData> => {
    const { id, tim } = data;
    await db.execute(
        'INSERT INTO ketua_tim (id, tahun, tim, user_id) VALUES (?, ?, ?, ?)',
        [id, tahunKetuaTimSah(data.tahun), tim || null, akunKetuaTimSah(data.userId)]);
    return data;
};
export const updateKetuaTim = async (id: string, data: KetuaTimData): Promise<KetuaTimData> => {
    const { tim } = data;
    await db.execute(
        'UPDATE ketua_tim SET tahun = ?, tim = ?, user_id = ? WHERE id = ?',
        [tahunKetuaTimSah(data.tahun), tim || null, akunKetuaTimSah(data.userId), id]);
    return data;
};
/**
 * Menghapus ketua tim — DITOLAK bila ia masih memegang kegiatan.
 *
 * `kegiatan.ketua_tim_id` ber-foreign key ON DELETE SET NULL, jadi database
 * TIDAK menolak penghapusan: kegiatannya diam-diam kehilangan ketua tim. Yang
 * ikut hilang bersamanya tidak kelihatan dari layar mana pun — notifikasi
 * ketua tim (dokumen ditolak, tenggat, progres mandek) semuanya menyaring
 * lewat `JOIN ketua_tim kt ON kt.id = k.ketua_tim_id`, sehingga kegiatan itu
 * lenyap dari lonceng siapa pun, dan wewenang menyuntingnya ikut kosong.
 *
 * Sama seperti penghapusan akun di atas: yang ditawarkan bukan "tidak bisa",
 * melainkan langkah berikutnya yang harus dilakukan lebih dulu.
 */
export const deleteKetuaTim = async (id: string): Promise<boolean> => {
    const [[pakai]] = await db.query<RowDataPacket[]>(
        `SELECT u.nama_lengkap AS nama,
                (SELECT COUNT(*) FROM kegiatan k WHERE k.ketua_tim_id = kt.id) AS kegiatan
           FROM ketua_tim kt
           JOIN users u ON u.id = kt.user_id
          WHERE kt.id = ?`, [id]);

    if (pakai && Number(pakai.kegiatan) > 0) {
        throw Object.assign(
            new Error(`${pakai.nama} tidak bisa dihapus karena masih memegang ${pakai.kegiatan} kegiatan. `
                + `Pindahkan kegiatan tersebut ke ketua tim lain lewat Edit Kegiatan, lalu hapus.`),
            { statusCode: 409 });
    }

    const [result] = await db.execute<OkPacket>('DELETE FROM ketua_tim WHERE id = ?', [id]);
    return result.affectedRows > 0;
};


// =================================================================
// START OF MODIFICATION: Fungsi getAllPPLAdmin diperbarui
// =================================================================
/**
 * Menyalin seluruh kepengurusan satu tahun ke tahun lain.
 *
 * Pergantian tahun berarti mendaftarkan ulang enam ketua tim; tanpa ini
 * pekerjaannya mengetik ulang enam baris yang isinya hampir sama persis.
 *
 * Tim yang di tahun tujuan SUDAH ada dilewati, bukan menggagalkan seluruh
 * penyalinan: kunci unik `(tim, tahun)` akan menolaknya, dan menggagalkan
 * semuanya karena satu tim yang sudah lebih dulu diisi jelas bukan yang
 * diinginkan. Jumlah yang disalin dan dilewati dikembalikan supaya layar bisa
 * mengatakannya apa adanya.
 *
 * Ketua tim TANPA tim selalu ikut disalin: kunci uniknya memperlakukan NULL
 * sebagai selalu berbeda, jadi tidak ada yang bisa dianggap "sudah ada".
 */
export const salinKetuaTim = async (
    dariTahun: unknown, keTahun: unknown,
): Promise<{ disalin: number; dilewati: string[] }> => {
    const dari = tahunKetuaTimSah(dariTahun);
    const ke = tahunKetuaTimSah(keTahun);
    if (dari === ke) {
        throw Object.assign(
            new Error('Tahun asal dan tahun tujuan tidak boleh sama.'), { statusCode: 400 });
    }

    // Cukup tim dan akunnya: nama serta NIP tidak lagi tersimpan di baris ini,
    // jadi menyalin kepengurusan benar-benar hanya memindahkan pasangan
    // orang-dan-tim ke tahun berikutnya.
    const [sumber] = await db.query<RowDataPacket[]>(
        'SELECT tim, user_id FROM ketua_tim WHERE tahun = ? ORDER BY tim', [dari]);
    if (sumber.length === 0) {
        throw Object.assign(
            new Error(`Belum ada ketua tim tahun ${dari} untuk disalin.`), { statusCode: 404 });
    }

    const [sudahAda] = await db.query<RowDataPacket[]>(
        'SELECT tim FROM ketua_tim WHERE tahun = ? AND tim IS NOT NULL', [ke]);
    const timTerpakai = new Set(sudahAda.map(r => String(r.tim)));

    const perluDisalin = sumber.filter(r => !(r.tim && timTerpakai.has(String(r.tim))));
    const dilewati = sumber
        .filter(r => r.tim && timTerpakai.has(String(r.tim)))
        .map(r => String(r.tim));

    if (perluDisalin.length === 0) return { disalin: 0, dilewati };

    const [semuaId] = await db.query<RowDataPacket[]>('SELECT id FROM ketua_tim');
    const idBaru = alokasiIdMitra(
        semuaId.map(r => String(r.id)), perluDisalin.length, 'KT', 3);

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        for (let i = 0; i < perluDisalin.length; i++) {
            const r = perluDisalin[i];
            await connection.execute(
                'INSERT INTO ketua_tim (id, tahun, tim, user_id) VALUES (?, ?, ?, ?)',
                [idBaru[i], ke, r.tim ?? null, r.user_id]);
        }
        await connection.commit();
    } catch (galat) {
        await connection.rollback();
        throw galat;
    } finally {
        connection.release();
    }

    return { disalin: perluDisalin.length, dilewati };
};

/**
 * Mengganti NAMA sebuah tim di seluruh baris yang memakainya.
 *
 * Nama tim bisa berubah — "Neraca" menjadi "Neraca dan Analisis Statistik" —
 * dan tanpa ini satu-satunya cara adalah menyunting baris satu per satu untuk
 * setiap tahun, atau membuat tim baru sehingga keduanya menumpuk di dropdown
 * dan di grafik Dashboard sebagai dua tim berbeda.
 *
 * `tahun` opsional: diisi berarti hanya kepengurusan tahun itu yang berubah
 * (nama lama tetap tercatat pada tahun-tahun sebelumnya), dikosongkan berarti
 * seluruh tahun ikut berubah.
 */
export const gantiNamaTim = async (
    lama: unknown, baru: unknown, tahun?: unknown,
): Promise<{ diubah: number }> => {
    const namaLama = String(lama ?? '').trim();
    const namaBaru = String(baru ?? '').replace(/\s+/g, ' ').trim();
    if (namaLama === '' || namaBaru === '') {
        throw Object.assign(
            new Error('Nama tim lama dan baru harus diisi.'), { statusCode: 400 });
    }
    const dibatasiTahun = tahun === undefined || tahun === null || tahun === ''
        ? null : tahunKetuaTimSah(tahun);

    // Bentrok diperiksa lebih dulu supaya pesannya bisa dibaca; kalau tidak,
    // kunci unik (tim, tahun) menolaknya sebagai galat SQL mentah.
    const [bentrok] = await db.query<RowDataPacket[]>(
        `SELECT lama.tahun
           FROM ketua_tim lama
           JOIN ketua_tim baru ON baru.tahun = lama.tahun AND baru.tim = ?
          WHERE lama.tim = ? ${dibatasiTahun !== null ? 'AND lama.tahun = ?' : ''}`,
        dibatasiTahun !== null ? [namaBaru, namaLama, dibatasiTahun] : [namaBaru, namaLama]);
    if (bentrok.length > 0) {
        throw Object.assign(
            new Error(`Tahun ${bentrok[0].tahun} sudah punya tim bernama "${namaBaru}". `
                + 'Dua tim dengan nama sama di satu tahun tidak dapat dibedakan.'),
            { statusCode: 409 });
    }

    const [hasil] = await db.execute<OkPacket>(
        `UPDATE ketua_tim SET tim = ? WHERE tim = ? ${dibatasiTahun !== null ? 'AND tahun = ?' : ''}`,
        dibatasiTahun !== null ? [namaBaru, namaLama, dibatasiTahun] : [namaBaru, namaLama]);

    if (hasil.affectedRows === 0) {
        throw Object.assign(
            new Error(`Tidak ada ketua tim bertim "${namaLama}" untuk diubah.`), { statusCode: 404 });
    }
    return { diubah: hasil.affectedRows };
};

export const getAllPPLAdmin = async (
    periode?: pplService.PeriodeFilter,
): Promise<PPLAdminData[]> => {
    return pplService.getPplAdminData(periode);
};

export const createPPLAdmin = async (data: PPLAdminData): Promise<PPLAdminData> => {
    return pplService.createMasterPPL(data);
};

export const updatePPLAdmin = async (id: string, data: PPLAdminData): Promise<PPLAdminData> => {
    return pplService.updateMasterPPL(id, data);
};

export const deletePPLAdmin = async (id: string): Promise<boolean> => {
    return pplService.deleteMasterPPL(id);
};