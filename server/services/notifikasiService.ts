// server/services/notifikasiService.ts

import { RowDataPacket } from 'mysql2';
import pool from '../db';
import { AppNotification } from '@shared/api';
import { suratBerubahSejakTerbit } from './kontrakService';

/**
 * Notifikasi DIHITUNG SAAT DIBACA, tidak disimpan di tabel.
 *
 * Kenapa begitu: proyek ini tidak punya penjadwal, dan target deploy Netlify
 * memang tidak bisa menjalankan setInterval yang hidup terus. Dengan menghitung
 * saat dibaca, aturan "H-3/H-2/H-1" cukup jadi DATEDIFF dan isinya selalu
 * akurat tanpa pekerjaan latar belakang. Konsekuensinya tidak ada "tandai
 * dibaca" — notifikasi hilang sendiri begitu penyebabnya beres.
 *
 * Pengunggah/penolak dicari lewat COALESCE(lastEditedBy_userId,
 * diunggahOleh_userId): kolom-kolom itu menyimpan USERNAME (berbeda dari
 * kegiatan.createdBy_userId yang menyimpan id), dan dokumen yang baru diunggah
 * hanya mengisi diunggahOleh_userId — persis dokumen yang jadi isi notifikasi.
 * Query lama hanya melihat lastEditedBy_userId sehingga namanya selalu kosong.
 */

const angka = (v: unknown): number => Number(v ?? 0);

/** Dokumen kegiatan ketua tim ini yang ditolak. */
const qDitolak = async (userId: string): Promise<AppNotification[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          CONCAT('rejected-', d.id)               AS id,
          k.id                                    AS kegiatanId,
          k.namaKegiatan                          AS namaKegiatan,
          d.tipe                                  AS tahap,
          d.id                                    AS dokumenId,
          d.nama                                  AS namaDokumen,
          d.link                                  AS linkFile,
          COALESCE(ru.nama_lengkap, d.rejectedBy) AS actorName,
          d.rejectionNote                         AS note,
          COALESCE(d.rejectedAt, d.uploadedAt)    AS occurredAt
        FROM dokumen d
        JOIN kegiatan  k  ON k.id  = d.kegiatanId
        JOIN ketua_tim kt ON kt.id = k.ketua_tim_id
        LEFT JOIN users ru ON ru.username = d.rejectedBy
        WHERE kt.user_id = ?
          AND k.isArsip  = 0
          AND d.status   = 'Rejected'
        ORDER BY d.rejectedAt DESC
        LIMIT 20
    `, [userId]);

    return rows.map(r => ({
        ...r,
        kind: 'document_rejected',
        severity: 'critical',
        tahap: r.tahap,
    })) as AppNotification[];
};

/**
 * Tenggat tahap: H-3/H-2/H-1 sekaligus yang sudah terlewat.
 *
 * SATU query, bukan empat yang di-UNION. Keempat tenggat adalah empat KOLOM
 * pada baris yang sama, jadi UNION ALL akan memindai `kegiatan` empat kali dan
 * menjalankan agregat dokumen empat kali. CROSS JOIN ke tabel turunan 4 baris
 * memekarkan tiap kegiatan jadi 4 baris di memori (±1200 baris untuk 300
 * kegiatan) dan menggabungkan agregatnya sekali.
 *
 * Alasan keterbacaannya lebih kuat lagi: 'segera' dan 'terlambat' jatuh dari
 * satu DATEDIFF + CASE, bukan delapan blok SQL nyaris kembar yang pasti
 * menyimpang begitu ada yang menyunting salah satunya. Pemetaan tahap→kolom
 * muncul tepat satu kali.
 */
const qTenggat = async (userId: string): Promise<AppNotification[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          CONCAT('deadline-', ph.kegiatanId, '-', ph.tipe)  AS id,
          ph.kegiatanId,
          ph.namaKegiatan,
          ph.tipe                                           AS tahap,
          DATE_FORMAT(ph.deadline, '%Y-%m-%d')              AS deadline,
          DATEDIFF(ph.deadline, CURDATE())                  AS daysLeft,
          (agg.totalWajib - agg.approvedWajib)              AS pendingCount,
          NOW()                                             AS occurredAt
        FROM (
          SELECT
            k.id AS kegiatanId, k.namaKegiatan AS namaKegiatan, t.tipe AS tipe,
            CASE t.tipe
              WHEN 'persiapan'           THEN k.tanggalSelesaiPersiapan
              WHEN 'pengumpulan-data'    THEN k.tanggalSelesaiPengumpulanData
              WHEN 'pengolahan-analisis' THEN k.tanggalSelesaiPengolahanAnalisis
              WHEN 'diseminasi-evaluasi' THEN k.tanggalSelesaiDiseminasiEvaluasi
            END AS deadline
          FROM kegiatan k
          JOIN ketua_tim kt ON kt.id = k.ketua_tim_id
          CROSS JOIN (          SELECT 'persiapan'           AS tipe
                      UNION ALL SELECT 'pengumpulan-data'
                      UNION ALL SELECT 'pengolahan-analisis'
                      UNION ALL SELECT 'diseminasi-evaluasi') t
          WHERE kt.user_id = ? AND k.isArsip = 0
        ) ph
        JOIN (
          SELECT d.kegiatanId, d.tipe,
                 COUNT(*)                   AS totalWajib,
                 SUM(d.status = 'Approved') AS approvedWajib
          FROM dokumen d
          -- Dokumen yang tanggung jawabnya dialihkan ke tim keuangan tetap
          -- wajib, tapi berhenti membebani ketua tim: ia tidak bisa mengisinya,
          -- jadi tenggatnya bukan urusannya. KEMBARAN di klien:
          -- menahanTenggatKetuaTim di client/lib/hakDokumen.ts — ubah keduanya.
          -- Bila SELURUH dokumen wajib satu tahap milik keuangan, tahap itu tidak
          -- menghasilkan baris agregat sama sekali dan gugur dari JOIN. Itu
          -- memang hasil yang diinginkan.
          WHERE d.isWajib = 1 AND d.penanggungJawab = 'ketua_tim'
          GROUP BY d.kegiatanId, d.tipe
        ) agg
          ON agg.kegiatanId = ph.kegiatanId AND agg.tipe = ph.tipe
        WHERE ph.deadline IS NOT NULL
          AND agg.approvedWajib < agg.totalWajib
        HAVING daysLeft <= 3
        ORDER BY daysLeft ASC
        LIMIT 30
    `, [userId]);
    // HAVING, bukan WHERE: MySQL/MariaDB mengizinkan alias di HAVING sehingga
    // seluruh CASE tidak perlu diulang di dalam DATEDIFF.

    return rows.map(r => {
        const sisa = angka(r.daysLeft);
        return {
            ...r,
            daysLeft: sisa,
            pendingCount: angka(r.pendingCount), // SUM() -> DECIMAL di MariaDB
            kind: sisa < 0 ? 'deadline_overdue' : 'deadline_soon',
            severity: sisa < 0 ? 'critical' : 'warning',
        };
    }) as AppNotification[];
};

/** Kegiatan berjalan yang progressnya tidak diperbarui > 2 hari. */
const qMandek = async (userId: string): Promise<AppNotification[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          CONCAT('stale-', k.id)                   AS id,
          k.id                                     AS kegiatanId,
          k.namaKegiatan                           AS namaKegiatan,
          NULL                                     AS tahap,
          DATEDIFF(CURDATE(), DATE(k.lastUpdated)) AS daysLeft,
          k.lastUpdated                            AS occurredAt
        FROM kegiatan  k
        JOIN ketua_tim kt ON kt.id = k.ketua_tim_id
        WHERE kt.user_id     = ?
          AND k.isArsip      = 0
          AND k.lastUpdated IS NOT NULL
          AND DATEDIFF(CURDATE(), DATE(k.lastUpdated)) > 2
          AND k.tanggalMulaiPengumpulanData IS NOT NULL
          AND CURDATE() >= k.tanggalMulaiPengumpulanData
          AND (k.tanggalSelesaiDiseminasiEvaluasi IS NULL
               OR CURDATE() <= k.tanggalSelesaiDiseminasiEvaluasi)
        ORDER BY k.lastUpdated ASC
        LIMIT 10
    `, [userId]);

    return rows.map(r => ({
        ...r,
        daysLeft: angka(r.daysLeft),
        kind: 'progress_stale',
        severity: 'info',
    })) as AppNotification[];
};

/**
 * Dokumen menunggu persetujuan (supervisor + admin).
 *
 * Sengaja tetap global. Tidak ada kolom yang membatasi seorang supervisor ke
 * sebagian kegiatan — `users` hanya punya role dan isPML, sedangkan
 * `ketua_tim.tim` adalah tim si ketua, bukan tim supervisornya. Membatasinya
 * sekarang berarti menebak, dan di kantor ini supervisor memang penyetuju
 * untuk seluruh satker.
 */
const qMenunggu = async (): Promise<AppNotification[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          CONCAT('pending-', d.id) AS id,
          k.id                     AS kegiatanId,
          k.namaKegiatan           AS namaKegiatan,
          d.tipe                   AS tahap,
          d.id                     AS dokumenId,
          d.nama                   AS namaDokumen,
          d.link                   AS linkFile,
          u.nama_lengkap           AS actorName,
          d.uploadedAt             AS occurredAt
        FROM dokumen d
        JOIN kegiatan k ON k.id = d.kegiatanId
        LEFT JOIN users u
               ON u.username = COALESCE(d.lastEditedBy_userId, d.diunggahOleh_userId)
        WHERE d.status = 'Pending'
          AND d.link IS NOT NULL AND d.link <> ''
          AND k.isArsip = 0
          AND d.resubmittedAt IS NULL
        ORDER BY d.uploadedAt DESC
        LIMIT 20
    `);

    return rows.map(r => ({
        ...r,
        kind: 'document_pending',
        severity: 'warning',
    })) as AppNotification[];
};

/**
 * Dokumen yang ditolak lalu diunggah ulang (supervisor + admin).
 *
 * Syarat `resubmittedAt >= rejectedAt` membuat baris ini kembali jadi
 * 'document_pending' biasa bila supervisor menolaknya LAGI — penolakan baru
 * mengosongkan resubmittedAt. Tidak perlu pekerjaan bersih-bersih.
 *
 * Perbandingannya `>=`, bukan `>`: kolomnya DATETIME berpresisi DETIK, jadi
 * dokumen yang ditolak lalu langsung diperbaiki dalam detik yang sama akan
 * punya stempel waktu identik dan luput dari `>`. Tidak ada kasus di mana
 * keduanya sama tapi BUKAN unggah ulang, karena penolakan selalu meng-NULL-kan
 * resubmittedAt lebih dulu.
 */
const qDiunggahUlang = async (): Promise<AppNotification[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          CONCAT('resubmit-', d.id) AS id,
          k.id                      AS kegiatanId,
          k.namaKegiatan            AS namaKegiatan,
          d.tipe                    AS tahap,
          d.id                      AS dokumenId,
          d.nama                    AS namaDokumen,
          d.link                    AS linkFile,
          u.nama_lengkap            AS actorName,
          d.rejectionNote           AS note,
          d.resubmittedAt           AS occurredAt
        FROM dokumen d
        JOIN kegiatan k ON k.id = d.kegiatanId
        LEFT JOIN users u
               ON u.username = COALESCE(d.lastEditedBy_userId, d.diunggahOleh_userId)
        WHERE d.status = 'Pending'
          AND k.isArsip = 0
          AND d.resubmittedAt IS NOT NULL
          AND (d.rejectedAt IS NULL OR d.resubmittedAt >= d.rejectedAt)
        ORDER BY d.resubmittedAt DESC
        LIMIT 20
    `);

    return rows.map(r => ({
        ...r,
        kind: 'document_resubmitted',
        severity: 'warning',
    })) as AppNotification[];
};

/**
 * Dokumen bertanda Tim Keuangan yang linknya masih kosong (supervisor + admin).
 *
 * Tanpa notifikasi ini, mengalihkan dokumen ke tim keuangan justru MENGHILANGKAN
 * seluruh tekanan untuk mengisinya: ia berhenti muncul di peringatan ketua tim
 * (lihat qTenggat) dan belum pernah muncul di antrean persetujuan karena
 * antrean itu mensyaratkan link. Dokumennya jadi lubang hitam yang senyap.
 * Baris ini yang membuat penanda baru itu menegakkan dirinya sendiri.
 */
const qBelumDiisiKeuangan = async (): Promise<AppNotification[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          CONCAT('keuangan-', d.id) AS id,
          k.id                      AS kegiatanId,
          k.namaKegiatan            AS namaKegiatan,
          d.tipe                    AS tahap,
          d.id                      AS dokumenId,
          d.nama                    AS namaDokumen,
          d.penanggungJawab         AS penanggungJawab,
          COALESCE(pu.nama_lengkap, d.penanggungJawabDiubahOleh) AS actorName,
          COALESCE(d.penanggungJawabDiubahPada, d.uploadedAt)    AS occurredAt
        FROM dokumen d
        JOIN kegiatan k ON k.id = d.kegiatanId
        LEFT JOIN users pu ON pu.username = d.penanggungJawabDiubahOleh
        WHERE d.penanggungJawab = 'keuangan'
          AND (d.link IS NULL OR d.link = '')
          AND d.jenis <> 'catatan'
          AND k.isArsip = 0
        ORDER BY occurredAt DESC
        LIMIT 20
    `);

    return rows.map(r => ({
        ...r,
        kind: 'document_keuangan_kosong',
        severity: 'warning',
    })) as AppNotification[];
};

/**
 * Dokumen kosong yang SUDAH diingatkan tim keuangan.
 *
 * Penerimanya dua orang sekaligus: ketua tim kegiatan itu dan pembuat
 * kegiatannya — dua peran yang sama-sama berhak menyunting kegiatan (lihat
 * `shared/hakKegiatan.ts`), jadi keduanya memang bisa menindaklanjuti.
 *
 * Syarat `pengingatDikirimPada IS NOT NULL` yang membuat notifikasi ini muncul
 * hanya bila tim keuangan benar-benar menekan tombolnya. Syarat link kosong
 * yang membuatnya hilang sendiri begitu dokumennya diisi — tanpa ada yang
 * perlu menandainya sebagai sudah dibaca.
 *
 * `k.createdBy_userId` menyimpan users.id, sedangkan `kt.user_id` juga users.id
 * — berbeda dari kolom pelaku lain di tabel dokumen yang menyimpan username.
 */
const qPengingatDokumen = async (userId: string): Promise<AppNotification[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          CONCAT('pengingat-', d.id) AS id,
          k.id                       AS kegiatanId,
          k.namaKegiatan             AS namaKegiatan,
          d.tipe                     AS tahap,
          d.id                       AS dokumenId,
          d.nama                     AS namaDokumen,
          COALESCE(pu.nama_lengkap, d.pengingatDikirimOleh) AS actorName,
          d.pengingatDikirimPada     AS occurredAt
        FROM dokumen d
        JOIN kegiatan k ON k.id = d.kegiatanId
        LEFT JOIN ketua_tim kt ON kt.id = k.ketua_tim_id
        LEFT JOIN users pu ON pu.username = d.pengingatDikirimOleh
        WHERE d.pengingatDikirimPada IS NOT NULL
          AND (d.link IS NULL OR d.link = '')
          AND d.jenis <> 'catatan'
          AND k.isArsip = 0
          AND (kt.user_id = ? OR k.createdBy_userId = ?)
        ORDER BY d.pengingatDikirimPada DESC
        LIMIT 20
    `, [userId, userId]);

    return rows.map(r => ({
        ...r,
        kind: 'document_reminder',
        severity: 'critical',
    })) as AppNotification[];
};

/**
 * Surat yang sudah terbit tetapi isinya tidak lagi sesuai (supervisor + admin).
 *
 * Inilah yang membuat perubahan setelah penandatanganan tidak lolos diam-diam:
 * tim keuangan tidak mungkin membuka layar Generate Surat setiap hari untuk
 * memeriksa apakah ada honor yang direvisi atau kegiatan baru yang masuk.
 *
 * SATU notifikasi per SURAT, bukan per baris yang berubah. Sebuah kegiatan yang
 * muatannya direvisi bisa menyentuh banyak baris sekaligus, dan memecahnya
 * menjadi banyak notifikasi akan menenggelamkan notifikasi lain — padahal
 * tindakannya sama: buka suratnya, periksa, perbarui atau batalkan.
 *
 * Tidak memakai kueri sendiri melainkan `suratBerubahSejakTerbit`, yang memakai
 * perhitungan yang sama persis dengan layarnya. Notifikasi yang berhitung
 * sendiri cepat atau lambat akan berbeda dari yang terlihat di layar, dan
 * selisih semacam itu sangat sulit dikenali karena keduanya tampak masuk akal.
 */
const qSuratBerubah = async (): Promise<AppNotification[]> => {
    const berubah = await suratBerubahSejakTerbit();

    const perSurat = new Map<number, typeof berubah>();
    for (const b of berubah) {
        const kumpulan = perSurat.get(b.suratId);
        if (kumpulan) kumpulan.push(b); else perSurat.set(b.suratId, [b]);
    }

    return Array.from(perSurat.values()).map(daftar => {
        const utama = daftar[0];
        const lainnya = daftar.length - 1;
        return {
            id: `surat-berubah-${utama.suratId}`,
            kind: 'surat_berubah',
            severity: 'warning',
            kegiatanId: utama.kegiatanId ?? 0,
            namaKegiatan: utama.namaKegiatan,
            tahap: null,
            namaDokumen: utama.nomorSurat,
            actorName: utama.namaPPL,
            note: lainnya > 0
                ? `${utama.ringkasan} (dan ${lainnya} perubahan lain)`
                : utama.ringkasan,
            occurredAt: utama.occurredAt,
        } as AppNotification;
    }).slice(0, 20);
};

const PERINGKAT = { critical: 0, warning: 1, info: 2 } as const;

export const getNotificationsFor = async (
    userId: string,
    role: 'admin' | 'supervisor' | 'user',
): Promise<AppNotification[]> => {
    // Apakah akun ini memegang sebuah ketua tim?
    const [ktRows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM ketua_tim WHERE user_id = ? LIMIT 1', [userId]);

    const adalahKetuaTim = ktRows.length > 0;
    const adalahPenyetuju = role === 'supervisor' || role === 'admin';

    const tugas: Promise<AppNotification[]>[] = [];
    if (adalahKetuaTim) tugas.push(qDitolak(userId), qTenggat(userId), qMandek(userId));
    if (adalahPenyetuju) tugas.push(qMenunggu(), qDiunggahUlang(), qBelumDiisiKeuangan(), qSuratBerubah());
    // TANPA syarat peran: pengingat ditujukan ke ketua tim DAN pembuat
    // kegiatan, dan pembuat kegiatan bisa siapa saja — semua pengguna boleh
    // membuat kegiatan. Penyaringnya ada di dalam query, bukan di sini.
    tugas.push(qPengingatDokumen(userId));

    const semua = (await Promise.all(tugas)).flat();

    // Seorang admin yang sekaligus ketua tim mendapat keduanya — disengaja,
    // dan prefiks pada `id` menjamin tidak ada tabrakan kunci.
    return semua
        .sort((a, b) =>
            PERINGKAT[a.severity] - PERINGKAT[b.severity] ||
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
        .slice(0, 30);
};
