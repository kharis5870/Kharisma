// Dipisah dari client/pages/EditActivity.tsx tanpa mengubah isinya.

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, X, Lock, MessageSquare } from "lucide-react";
import { periksaTautan } from "@shared/tautanDokumen";
import { dikelolaKeuangan } from "@/lib/hakDokumen";
import { cn } from "@/lib/utils";

/**
 * Satu baris dokumen di tab Dokumen.
 *
 * TIDAK ADA lagi mode "Edit → Selesai". Sejak seluruh perubahan dokumen ditahan
 * sampai tombol "Simpan Perubahan", tombol Selesai hanya menutup pengeditan
 * baris — tidak menyimpan apa pun — sehingga ia cuma satu langkah tambahan yang
 * mudah dikira sudah menyimpan. Kotak isiannya kini selalu aktif, dan isinya
 * disetor ke `formData` saat kotaknya ditinggalkan (blur).
 *
 * Kenapa blur, bukan setiap ketikan: link diperiksa (dan dinormalkan) saat
 * disetor, dan memunculkan "link tidak valid" di setiap huruf yang baru
 * setengah diketik hanya mengganggu. Alasan lamanya — komponen yang dipasang
 * ulang setiap `formData` berubah — sudah tidak berlaku sejak `DokumenContent`
 * dan `AlokasiPPLContent` berdiri di tingkat modul.
 */
export const DokumenItem = React.memo(({ doc, removeDocument, onDocumentSaved, onNoteClick, disorot }: any) => {
    const { isWajib, status, nama, link, clientId, jenis } = doc;
    const isDitolak = status === 'Rejected';
    const rejectionNote = doc.rejectionNote;

    const [localNama, setLocalNama] = useState(nama);
    const [localLink, setLocalLink] = useState(link ?? '');
    // Galat dan peringatan link ditampilkan di bawah kotaknya, bukan lewat
    // alert(): pengguna perlu tetap melihat apa yang diketiknya saat membetulkan.
    const [galatTautan, setGalatTautan] = useState('');
    const [peringatanTautan, setPeringatanTautan] = useState('');

    /**
     * Menyelaraskan isian lokal ketika nilainya berubah dari luar — misalnya
     * setelah "Batalkan Perubahan" atau setelah simpan berhasil.
     *
     * Dulu penyelarasan ini tidak perlu, karena baris ini ikut dipasang ulang
     * setiap `formData` berubah. Sekarang `DokumenContent` sudah di luar badan
     * `EditActivity` sehingga barisnya bertahan — dan tanpa ini, isian lama
     * yang sudah dibatalkan akan tetap terlihat di layar.
     *
     * Pesan galat/peringatan ikut dihitung ulang dari nilai yang masuk, bukan
     * sekadar dikosongkan: peringatan "bukan tautan Google Drive" harus tetap
     * menggambarkan isi kotaknya yang sekarang.
     */
    const [dasar, setDasar] = useState({ nama, link: link ?? '' });
    if (dasar.nama !== nama || dasar.link !== (link ?? '')) {
        const hasil = periksaTautan(link ?? '');
        setDasar({ nama, link: link ?? '' });
        setLocalNama(nama);
        setLocalLink(link ?? '');
        setGalatTautan(hasil.sah ? '' : (hasil.galat ?? ''));
        setPeringatanTautan(hasil.sah ? (hasil.peringatan ?? '') : '');
    }

    const isApproved = status === 'Approved';
    const isNote = jenis === 'catatan';
    /**
     * Dokumen yang tanggung jawabnya dialihkan ke tim keuangan dikunci di sini —
     * termasuk bagi admin. Satu dokumen sebaiknya hanya punya satu jalur
     * pengisian, supaya tidak ada dua layar yang bisa saling menimpa.
     *
     * Sengaja DIKUNCI, bukan disembunyikan: dokumen wajib yang lenyap dari
     * daftar akan dikira terhapus, dan ketua tim tetap perlu tahu kelengkapan
     * kegiatannya.
     */
    const dikunciKeuangan = dikelolaKeuangan(doc);
    const terkunci = isApproved || dikunciKeuangan;

    /** Hanya bidang yang berubah yang disetor, supaya dua blur beruntun tidak saling menimpa. */
    const setorNama = () => {
        if (localNama === nama) return;
        onDocumentSaved({ nama: localNama }, clientId);
    };

    const setorTautan = () => {
        const hasil = periksaTautan(localLink);
        setGalatTautan(hasil.sah ? '' : (hasil.galat ?? 'Link tidak valid.'));
        setPeringatanTautan(hasil.sah ? (hasil.peringatan ?? '') : '');
        // Tautan yang belum sah tetap disetor apa adanya, tidak dibuang diam-diam:
        // ketikan itu milik pengguna, dan `handleFormSubmit` yang akan menahan
        // simpan sambil menyebut baris mana yang salah.
        const nilai = hasil.sah ? hasil.tautan : localLink;
        if (hasil.sah) setLocalLink(hasil.tautan);
        if (nilai !== (link ?? '')) onDocumentSaved({ link: nilai, jenis: 'link' }, clientId);
    };

    if (isNote) {
        return (
            <div
                className="flex items-start gap-3 p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/40 hover:bg-yellow-100 dark:bg-yellow-900/40 cursor-pointer transition-colors"
                onClick={() => onNoteClick(doc)}
            >
                <MessageSquare className="w-5 h-5 text-yellow-700 dark:text-yellow-300 mt-1 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-300">Catatan</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{nama || <i className="text-muted-foreground">Klik untuk menambah isi catatan...</i>}</p>
                </div>
                {!isWajib && (
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); removeDocument(clientId); }}
                        className="flex-shrink-0 text-muted-foreground hover:text-red-500 dark:text-red-400"
                        title="Hapus Catatan"
                    >
                        <X className="w-4 h-4"/>
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div
            data-doc-id={clientId}
            className={cn(
                "flex items-start gap-3 p-3 border rounded-lg scroll-mt-24 transition-shadow",
                dikunciKeuangan ? "bg-indigo-50 dark:bg-indigo-950/40"
                    : isApproved ? "bg-green-50 dark:bg-green-950/40"
                    : isDitolak ? "border-red-400 bg-red-50 ring-1 ring-red-300 dark:border-red-700 dark:bg-red-950/40 dark:ring-red-800"
                    : "bg-muted/50",
                // Sorotan sementara untuk baris yang baru ditambahkan, supaya
                // jelas ke mana halaman barusan menggulir.
                disorot && "ring-2 ring-blue-400 dark:ring-blue-600"
            )}
        >
            <div className="flex-grow space-y-2">
                {/* Alasan penolakan ditampilkan DI SINI. Sebelumnya halaman ini
                    tidak pernah menunjukkannya, padahal notifikasi penolakan
                    justru mengarahkan ke sini — ketua tim tidak pernah tahu apa
                    yang harus diperbaiki. */}
                {isDitolak && rejectionNote && (
                    <p className="rounded bg-red-100 px-2 py-1 text-xs italic text-red-800 dark:bg-red-900/40 dark:text-red-300">
                        Ditolak: "{rejectionNote}"
                    </p>
                )}
                {isWajib ? ( <Label className="font-semibold pt-2 block">{nama} *</Label> ) : (
                    <Input
                        placeholder="Nama Dokumen"
                        value={localNama}
                        onChange={(e) => setLocalNama(e.target.value)}
                        onBlur={setorNama}
                        disabled={terkunci}
                    />
                )}
                <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="https://drive.google.com/..."
                        value={localLink}
                        onChange={(e) => { setLocalLink(e.target.value); setGalatTautan(''); setPeringatanTautan(''); }}
                        onBlur={setorTautan}
                        disabled={terkunci}
                        aria-invalid={!!galatTautan}
                        className={cn(galatTautan && "border-red-400 focus-visible:ring-red-400 dark:border-red-700")}
                    />
                </div>
                {galatTautan && (
                    <p className="pl-6 text-xs text-red-600 dark:text-red-300">{galatTautan}</p>
                )}
                {!galatTautan && peringatanTautan && (
                    <p className="pl-6 text-xs text-amber-700 dark:text-amber-300">{peringatanTautan}</p>
                )}
                {dikunciKeuangan && (
                    <p className="pl-6 text-xs text-muted-foreground">
                        Diisi oleh tim keuangan di halaman View Documents.
                    </p>
                )}
            </div>
            <div className="flex flex-col items-center gap-1 min-w-[40px]">
                {dikunciKeuangan ? ( <div className="p-2" title="Diisi tim keuangan"><Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-300"/></div>
                ) : isApproved ? ( <div className="p-2" title="Disetujui"><Lock className="w-4 h-4 text-green-600 dark:text-green-300"/></div>
                ) : !isWajib ? (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(clientId)} title="Hapus dokumen ini dari daftar">
                        <X className="w-4 h-4 text-muted-foreground"/>
                    </Button>
                ) : null}
            </div>
        </div>
    );
});
