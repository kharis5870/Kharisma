// Dipisah dari server/services/kegiatanService.ts tanpa mengubah isinya.

import { RowDataPacket, OkPacket } from 'mysql2';
import db from '../db';
import { catatRiwayat } from './riwayatService';
import {
    batasHonorBulanan, galatBatasHonor, hitungPembebanan,
    rentangHonorTahap, simpanPembebanan,
    type AlokasiUntukPembebanan,
} from './pembebananService';
import type { MetodePembebanan, PembebananPerBulan } from '../../shared/pembebananHonor';
import { Kegiatan, Dokumen, HonorariumDetail } from '@shared/api';
import { periksaTautan } from '../../shared/tautanDokumen';
import { galatTautan, pastikanKetuaTimAda, HonorariumSettings, parseRupiah, formatDateForDb, tahapAktif, KUNCI_HARGA_TAHAP } from './kegiatanBantu';
import { getKegiatanById } from './kegiatanBaca';

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
export const siapkanPembebanan = async (
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
    // Pemeriksaan batas honor dan ketua tim membaca database lewat POOL, jadi
    // dijalankan SEBELUM meminjam koneksi transaksi. Dulu keduanya berjalan
    // sambil memegang koneksi itu: satu simpanan memakai dua koneksi dari pool
    // yang hanya berisi 10, dan beberapa simpanan serentak bisa saling menunggu
    // koneksi kedua sampai server berhenti menjawab.
    const pembebanan = await siapkanPembebanan(data.ppl, data, null, bypassHonorLimit);
    const ketuaTimSah = await pastikanKetuaTimAda(data.ketua_tim_id);

    const connection = await db.getConnection();
    let kegiatanIdTersimpan = 0;
    try {

        const {
            namaKegiatan, deskripsiKegiatan, adaListing, isFasih,
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
        kegiatanIdTersimpan = kegiatanId;

    } catch (error: any) {
        await connection.rollback();
        // Penolakan yang disengaja (batas honor, versi berubah, progres berjalan)
        // bukan kerusakan; mencetak jejak galatnya hanya memenuhi log.
        if (!error.statusCode) {
            console.error("❌ TRANSACTION ROLLED BACK");
            console.error("Code:", error.code);
            console.error("Message:", error.sqlMessage || error.message);
            console.error("Query:", error.sql);
            console.error("Stack:", error.stack);
        }
        throw error;
    } finally {
        connection.release();
    }

    // Diambil SETELAH koneksi transaksi dikembalikan ke pool: getKegiatanById
    // meminjam koneksinya sendiri.
    const newKegiatan = await getKegiatanById(kegiatanIdTersimpan);
    if (!newKegiatan) throw new Error("Gagal mengambil kegiatan yang baru dibuat");
    return newKegiatan;
}
// =================================================================
// END OF MODIFICATION: createKegiatan function
// =================================================================


// =================================================================
// START OF MODIFICATION: updateKegiatan function
// =================================================================
export const updateKegiatan = async (id: number, data: any, bypassHonorLimit = false): Promise<Kegiatan> => {
    // Pemeriksaan batas honor dan ketua tim membaca database lewat POOL, jadi
    // dijalankan SEBELUM meminjam koneksi transaksi. Dulu keduanya berjalan
    // sambil memegang koneksi itu: satu simpanan memakai dua koneksi dari pool
    // yang hanya berisi 10, dan beberapa simpanan serentak bisa saling menunggu
    // koneksi kedua sampai server berhenti menjawab.
    //
    // `id` dikecualikan dari hitungan batas honor: honor LAMA kegiatan ini
    // tidak boleh dihitung dua kali bersama honor barunya.
    const pembebanan = await siapkanPembebanan(data.ppl, data, id, bypassHonorLimit);
    const ketuaTimSah = await pastikanKetuaTimAda(data.ketua_tim_id);

    const connection = await db.getConnection();
    try {

        const {
            namaKegiatan, deskripsiKegiatan, adaListing, isFasih,
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

        // Versi kegiatan saat halaman Edit dibuka. Bila terisi, simpanan hanya
        // diterima kalau belum ada orang lain yang menyimpan sejak itu — lihat
        // UPDATE di bawah. Pemanggil yang tidak mengirimnya tetap diterima
        // seperti sebelumnya.
        const versiKlien = Number.isInteger(data.versi) ? Number(data.versi) : null;

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
            lastEditedBy = ?,
            versi = versi + 1
            WHERE id = ?${versiKlien !== null ? ' AND versi = ?' : ''}
        `;
        const [hasilUbah] = await connection.execute<OkPacket>(kegiatanQuery, [
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
            id,
            ...(versiKlien !== null ? [versiKlien] : []),
        ]);

        // Tidak ada baris yang berubah: kegiatannya sudah dihapus, atau — yang
        // jauh lebih mungkin — orang lain sudah menyimpannya setelah halaman
        // ini dibuka. Dulu simpanan kedua menimpa simpanan pertama tanpa pesan:
        // mitra yang baru ditambahkan orang lain hilang begitu saja.
        if (hasilUbah.affectedRows === 0) {
            const [kini] = await connection.query<RowDataPacket[]>(
                `SELECT lastEditedBy, DATE_FORMAT(lastEdited, '%H:%i') AS jam FROM kegiatan WHERE id = ?`, [id]);
            if (!kini[0]) {
                throw Object.assign(new Error('Kegiatan tidak ditemukan.'), { statusCode: 404 });
            }
            const oleh = kini[0].lastEditedBy ? ` oleh ${kini[0].lastEditedBy}` : '';
            const jam = kini[0].jam ? ` pukul ${kini[0].jam}` : '';
            throw Object.assign(
                new Error(`Kegiatan ini sudah disimpan${oleh}${jam} setelah halaman Anda dibuka, jadi perubahan Anda belum disimpan agar tidak menimpanya. Muat ulang halaman untuk melihat data terbaru, lalu ulangi perubahan Anda.`),
                { statusCode: 409, details: { code: 'KEGIATAN_BERUBAH' } });
        }
        
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
            'SELECT id, ppl_master_id, tahap, bebanKerja FROM ppl WHERE kegiatanId = ? FOR UPDATE', [id]
        );
        const kunciPpl = (masterId: string, tahap: string) => `${masterId}|${tahap}`;
        const antreanId = new Map<string, number[]>();
        for (const baris of pplLama) {
            const k = kunciPpl(baris.ppl_master_id, baris.tahap);
            if (!antreanId.has(k)) antreanId.set(k, []);
            antreanId.get(k)!.push(baris.id);
        }
        const idDipertahankan = new Set<number>();
        // Beban kerja tersimpan tiap alokasi, untuk menghitung selisih beban.
        const bebanLamaPerId = new Map<number, number>(pplLama.map(r => [Number(r.id), parseInt(r.bebanKerja, 10) || 0]));

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
                    // PROGRES ALOKASI LAMA TIDAK DIAMBIL DARI LAYAR.
                    //
                    // Dulu progres dari halaman Edit menimpa progres di database.
                    // Halaman itu memuat progres SAAT DIBUKA, jadi progres yang
                    // diisi PML sesudahnya mundur ke angka lama begitu kegiatan
                    // disimpan — terbukti: PML mengisi 21, lalu kembali ke 13.
                    //
                    // Satu-satunya pengaruh Edit Kegiatan pada progres adalah
                    // perubahan beban kerja: tahap pertama (open/belum_entry)
                    // bergeser sebesar selisihnya, sama dengan aturan di layar.
                    // Selisih itu diterapkan ke nilai TERBARU di database, dan
                    // pengurangan yang melebihi sisa tahap pertama ditolak.
                    const selisihBeban = totalBeban - (bebanLamaPerId.get(idLama) ?? 0);
                    if (selisihBeban !== 0) {
                        const tahapPertama = (p.tahap === 'listing' || p.tahap === 'pencacahan') ? 'open' : 'belum_entry';
                        const [barisPertama] = await connection.query<RowDataPacket[]>(
                            'SELECT value FROM ppl_progress WHERE ppl_id = ? AND progress_type = ? FOR UPDATE', [pplId, tahapPertama]);
                        const nilaiKini = barisPertama[0] ? (Number(barisPertama[0].value) || 0) : null;
                        const nilaiBaru = (nilaiKini ?? 0) + selisihBeban;
                        if (nilaiBaru < 0) {
                            throw Object.assign(
                                new Error(`Beban kerja mitra ${p.ppl_master_id} tidak bisa dikurangi ${Math.abs(selisihBeban)}: progres yang belum dikerjakan tinggal ${nilaiKini ?? 0} karena sudah diperbarui PML. Muat ulang halaman, lalu sesuaikan lagi.`),
                                { statusCode: 409, details: { code: 'PROGRES_BERJALAN' } });
                        }
                        if (nilaiKini === null) {
                            await connection.execute('INSERT INTO ppl_progress (ppl_id, progress_type, value) VALUES (?, ?, ?)', [pplId, tahapPertama, nilaiBaru]);
                        } else {
                            await connection.execute('UPDATE ppl_progress SET value = ? WHERE ppl_id = ? AND progress_type = ?', [nilaiBaru, pplId, tahapPertama]);
                        }
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

                // Progres dari layar hanya dipakai untuk alokasi BARU. Alokasi lama
                // disesuaikan lewat selisih beban di atas, tidak ditimpa.
                if (idLama === null && p.progress && Object.keys(p.progress).length > 0) {
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

    } catch (error: any) {
        await connection.rollback();
        // Penolakan yang disengaja (batas honor, versi berubah, progres berjalan)
        // bukan kerusakan; mencetak jejak galatnya hanya memenuhi log.
        if (!error.statusCode) {
            console.error("❌ TRANSACTION ROLLED BACK");
            console.error("Code:", error.code);
            console.error("Message:", error.sqlMessage || error.message);
            console.error("Query:", error.sql);
            console.error("Stack:", error.stack);
        }
        throw error;
    } finally {
        connection.release();
    }

    // Diambil SETELAH koneksi transaksi dikembalikan ke pool.
    const updatedKegiatan = await getKegiatanById(id);
    if (!updatedKegiatan) throw new Error("Gagal mengambil kegiatan setelah update");
    return updatedKegiatan;
}
