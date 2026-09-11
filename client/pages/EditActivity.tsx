import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Checkbox } from "@/components/ui/checkbox";
import PilihPembebananHonor from "@/components/PilihPembebananHonor";
import { dokumenWajibTahap } from "@/lib/dokumenWajib";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ShieldAlert, ArrowLeft, Save, Link2, X, Plus, Trash2, Lock, Check, ChevronsUpDown, Users, XCircle, Loader2, MessageSquare, RotateCcw } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format, parseISO, isValid } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Kegiatan, PPL, Dokumen, PPLMaster, KetuaTim, UserData, HonorariumDetail as ApiHonorariumDetail } from "@shared/api";
import { periksaTautan } from "@shared/tautanDokumen";
import { idKetuaTimDikenal, pesanKetuaTimTidakDikenal } from "@shared/ketuaTim";
import { bolehMenyuntingKegiatan } from "@shared/hakKegiatan";
import { dikelolaKeuangan } from "@/lib/hakDokumen";
import { cn } from "@/lib/utils";
import AlertModal from "@/components/AlertModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/apiClient";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { bulanDalamRentang, bulanPembebananSetelahUbah, rentangHonorBawaan, FORMAT_TANGGAL, keTeksTanggal, keTanggal, pembebananBelumLengkap } from "@/lib/honorPeriode";
import type { TahapHonor } from "@/stores/useInputKegiatanStore";

type TahapDokumen = 'persiapan' | 'pengumpulan-data' | 'pengolahan-analisis' | 'diseminasi-evaluasi';

export interface HonorariumDetail extends ApiHonorariumDetail {}

type ClientPPL = Omit<PPL, 'honorarium'> & { clientId: string; honorarium: HonorariumDetail[] };
type ClientDokumen = Dokumen & { clientId: string };

type HonorariumSettings = {
    'pengumpulan-data-listing': { satuanBebanKerja: string, hargaSatuan: string };
    'pengumpulan-data-pencacahan': { satuanBebanKerja: string, hargaSatuan: string };
    'pengolahan-analisis': { satuanBebanKerja: string, hargaSatuan: string };
};

type FormState = Omit<Kegiatan, 'ppl' | 'dokumen' | 'lastUpdated' | 'lastUpdatedBy' | 'namaKetua' | 'bulanPembayaranHonor' | 'tanggalMulaiPersiapan' | 'tanggalSelesaiPersiapan' | 'tanggalMulaiPengumpulanData' | 'tanggalSelesaiPengumpulanData' | 'tanggalMulaiPengolahanAnalisis' | 'tanggalSelesaiPengolahanAnalisis' | 'tanggalMulaiDiseminasiEvaluasi' | 'tanggalSelesaiDiseminasiEvaluasi'> & {
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

type DateFieldName =
    | 'tanggalMulaiPersiapan' | 'tanggalSelesaiPersiapan'
    | 'tanggalMulaiPengumpulanData' | 'tanggalSelesaiPengumpulanData'
    | 'tanggalMulaiPengolahanAnalisis' | 'tanggalSelesaiPengolahanAnalisis'
    | 'tanggalMulaiDiseminasiEvaluasi' | 'tanggalSelesaiDiseminasiEvaluasi';

// Dipakai bersama dari @/lib/angka (dulu salinan identik dari InputKegiatan.tsx).
import { hitungBesaranHonor, hitungTotalHonorPPL } from "@/lib/honorPPL";
import { formatHonor, parseHonor, sanitizeJumlah } from "@/lib/angka";

/** Nilai tahap dokumen yang sah, untuk memvalidasi parameter URL dari notifikasi. */
const TAHAP_DOKUMEN_SAH: TahapDokumen[] = ['persiapan', 'pengumpulan-data', 'pengolahan-analisis', 'diseminasi-evaluasi'];

const fetchActivityDetails = async (id: string): Promise<Kegiatan> => {
    return apiClient.get<Kegiatan>(`/kegiatan/${id}`);
}

const fetchPPLs = async (): Promise<PPLMaster[]> => {
    return apiClient.get<PPLMaster[]>('/ppl');
};

const fetchKetuaTim = async (): Promise<KetuaTim[]> => {
    return apiClient.get<KetuaTim[]>('/ketua-tim');
};

const fetchPMLs = async (): Promise<UserData[]> => {
    return apiClient.get<UserData[]>('/admin/pml');
};

const updateActivity = async (kegiatan: Partial<FormState> & {id: number}): Promise<Kegiatan> => {
    const sanitizedData = {
        ...kegiatan,
        dokumen: kegiatan.dokumen,
        ppl: kegiatan.ppl?.map(({ clientId, namaPPL, ...rest }) => rest),
    };
    return apiClient.put<Kegiatan>(`/kegiatan/${kegiatan.id}`, sanitizedData);
};

// --- Sub-Components ---
const PPLAllocationItem = React.memo(({ ppl, index, onRemove, onUpdate, pplList, pmlList, honorariumSettings, existingPplIds, setAlertModal, tahap, opsiBulan }: any) => {
    const [openPPL, setOpenPPL] = useState(false);
    const [openPML, setOpenPML] = useState(false);
    
    const honorDetail = ppl.honorarium[0];
    const jenisPekerjaan = honorDetail.jenis_pekerjaan;
    
    const [localBebanKerja, setLocalBebanKerja] = useState(honorDetail.bebanKerja);

    useEffect(() => {
        setLocalBebanKerja(honorDetail.bebanKerja);
    }, [honorDetail.bebanKerja]);

    const handleBebanKerjaBlur = () => {
        const oldBebanKerja = parseInt(honorDetail.bebanKerja || '0', 10);
        const newBebanKerja = parseInt(localBebanKerja || '0', 10);
        const delta = newBebanKerja - oldBebanKerja;

        if (delta === 0) return;

        const firstStageType = (ppl.tahap === 'listing' || ppl.tahap === 'pencacahan') ? 'open' : 'belum_entry';
        const currentFirstStageValue = ppl.progress?.[firstStageType] ?? 0;

        if (delta < 0 && currentFirstStageValue < Math.abs(delta)) {
            setAlertModal({
            isOpen: true,
            title: "Validasi Gagal",
            message: `Tidak bisa mengurangi beban kerja sebanyak ${Math.abs(delta)}. Selesaikan progress yang sedang berjalan dahulu. Progress 'Open' saat ini: ${currentFirstStageValue}.`
            });
            setLocalBebanKerja(oldBebanKerja.toString());
            return;
        }
        
        const updatedHonorarium = ppl.honorarium.map((h: any) => {
            if (h.jenis_pekerjaan === jenisPekerjaan) {
                return {
                    ...h,
                    bebanKerja: newBebanKerja.toString(),
                    // Rumus yang sama dengan yang dipakai tampilan dan payload
                    // simpan, supaya ketiganya tidak bisa menyimpang.
                    besaranHonor: String(hitungBesaranHonor(newBebanKerja, jenisPekerjaan, honorariumSettings)),
                };
            }
            return h;
        });

        const updatedProgress = {
            ...ppl.progress,
            [firstStageType]: currentFirstStageValue + delta
        };
        
        onUpdate(ppl.clientId, 'honorarium', updatedHonorarium);
        onUpdate(ppl.clientId, 'progress', updatedProgress);

        const newTotalBebanKerjaPPL = updatedHonorarium.reduce((sum: number, h: any) => sum + parseInt(h.bebanKerja || '0'), 0);
        onUpdate(ppl.clientId, 'bebanKerja', newTotalBebanKerjaPPL.toString());
    };
    
    /**
     * DIHITUNG dari beban kerja × harga satuan, bukan dijumlahkan dari
     * `besaranHonor` yang tersimpan di state.
     *
     * Nilai tersimpan itu hanya diperbarui saat beban kerja disunting, jadi
     * mengubah harga satuan tidak mengubah apa pun di layar sampai beban
     * kerjanya ikut disentuh — persis bug yang dilaporkan. Menghitungnya di
     * sini juga berarti "Batalkan Perubahan" otomatis mengembalikan angkanya:
     * tidak ada honor yang disimpan terpisah dari kedua faktornya.
     */
    const totalHonorPPL = hitungTotalHonorPPL(ppl.honorarium, honorariumSettings);
    const selectedPML = pmlList.find((p: UserData) => String(p.id) === String(ppl.pml_id));
    const selectedPPL = pplList.find((p: PPLMaster) => String(p.id) === String(ppl.ppl_master_id));
    
    const availablePplList = useMemo(() => {
        return pplList.filter((p: PPLMaster) => {
            // Logika 1: Jangan tampilkan PPL yang sudah dialokasikan di tahap ini
            const isAlreadySelected = existingPplIds.includes(String(p.id));
            if (isAlreadySelected && p.id !== selectedPPL?.id) {
                return false;
            }

            // ✔️ LOGIKA FILTER UTAMA BERDASARKAN POSISI
            if (tahap === 'listing' || tahap === 'pencacahan') {
                return p.posisi === 'Pendataan' || p.posisi === 'Pendataan/Pengolahan';
            }
            if (tahap === 'pengolahan-analisis') {
                return p.posisi === 'Pengolahan' || p.posisi === 'Pendataan/Pengolahan';
            }
            return false; // Tahap tidak valid, sembunyikan semua
        });
    }, [pplList, existingPplIds, selectedPPL, tahap]);

    const getBebanKerjaLabel = () => {
        switch(jenisPekerjaan) {
            case 'listing': return 'Beban Kerja Listing';
            case 'pencacahan': return 'Beban Kerja Pencacahan';
            case 'pengolahan': return 'Beban Kerja Pengolahan';
            default: return 'Beban Kerja';
        }
    };
    
    return (
        <div className="p-4 border rounded-lg space-y-4 bg-muted">
            <div className="flex justify-between items-center">
                <h4 className="font-medium">{ppl.namaPPL || `Alokasi Baru ${index + 1}`}</h4>
                {/* Merah baru muncul penuh saat disorot: ikon tempat sampah
                    yang selalu menyala merah di setiap kartu membuat seluruh
                    daftar alokasi terlihat penuh peringatan. Latar merah muda
                    saat disorot juga menegaskan sasaran kliknya — targetnya
                    kecil dan berdempetan dengan judul kartu. */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(ppl.clientId)}
                    title="Hapus alokasi PPL ini"
                    aria-label={`Hapus alokasi ${ppl.namaPPL || `Alokasi Baru ${index + 1}`}`}
                    className="text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                >
                    <Trash2 className="w-4 h-4"/>
                </Button>
            </div>
            <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Pilih PPL *</Label>
                            <Popover open={openPPL} onOpenChange={setOpenPPL}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {selectedPPL ? selectedPPL.namaPPL : "Pilih PPL..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari PPL..." />
                                        <CommandList>
                                            <CommandEmpty>PPL tidak ditemukan atau sudah dialokasikan.</CommandEmpty>
                                            <CommandGroup>
                                                {availablePplList.map((p: PPLMaster) => (
                                                    <CommandItem key={p.id} value={`${p.id} ${p.namaPPL}`} onSelect={() => {
                                                        onUpdate(ppl.clientId, 'ppl_master_id', p.id);
                                                        onUpdate(ppl.clientId, 'namaPPL', p.namaPPL);
                                                        setOpenPPL(false);
                                                    }}>
                                                        <Check className={cn("mr-2 h-4 w-4", String(ppl.ppl_master_id) === String(p.id) ? "opacity-100" : "opacity-0")} />
                                                        <div>{p.namaPPL} <span className="text-xs text-muted-foreground">({p.id})</span></div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Nama PML *</Label>
                            <Popover open={openPML} onOpenChange={setOpenPML}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {selectedPML ? selectedPML.namaLengkap : "Pilih PML..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari PML..." />
                                        <CommandList>
                                            <CommandEmpty>PML tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {pmlList.map((pml: UserData) => (
                                                    <CommandItem key={pml.id} 
                                                    value={`${pml.id} ${pml.namaLengkap}`} 
                                                    onSelect={() => {
                                                        onUpdate(ppl.clientId, 'pml_id', pml.id);
                                                        setOpenPML(false);
                                                    }}>
                                                        <Check className={cn("mr-2 h-4 w-4", String(ppl.pml_id) === String(pml.id) ? "opacity-100" : "opacity-0")} />
                                                        <div className="flex flex-col">
                                                            <span>{pml.namaLengkap}</span>
                                                            <span className="text-xs text-muted-foreground">ID: {pml.id}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-2">
                            <Label>{getBebanKerjaLabel()}</Label>
                            <Input type="number" min="1" inputMode="numeric" placeholder="Jumlah..." value={localBebanKerja} onChange={(e) => setLocalBebanKerja(sanitizeJumlah(e.target.value))} onBlur={handleBebanKerjaBlur} />
                        </div>
                        <div className="space-y-2">
                            <Label>Total Honor (Rp)</Label>
                            <Input value={formatHonor(totalHonorPPL)} readOnly className="bg-muted font-bold"/>
                        </div>
                        <PilihPembebananHonor
                            opsiBulan={opsiBulan ?? []}
                            metode={ppl.metodePembebanan}
                            bulanDipilih={ppl.bulanPembebananDipilih}
                            onChange={(metode, bulan) => {
                                onUpdate(ppl.clientId, 'metodePembebanan', metode);
                                onUpdate(ppl.clientId, 'bulanPembebananDipilih', bulan);
                            }}
                        />
                    </div>
            </div>
        </div>
    );
});

/**
 * Satu baris dokumen di tab Dokumen.
 *
 * TIDAK ADA lagi mode "Edit → Selesai". Sejak seluruh perubahan dokumen ditahan
 * sampai tombol "Simpan Perubahan", tombol Selesai hanya menutup pengeditan
 * baris — tidak menyimpan apa pun — sehingga ia cuma satu langkah tambahan yang
 * mudah dikira sudah menyimpan. Kotak isiannya kini selalu aktif, dan isinya
 * disetor ke `formData` saat kotaknya ditinggalkan (blur).
 *
 * Kenapa blur, bukan setiap ketikan: `EditActivity` masih mendefinisikan
 * beberapa komponen di dalam badannya, jadi setiap perubahan `formData`
 * memasang ulang subpohon itu. Menyetor per ketikan berarti memasang ulang
 * seluruh daftar alokasi PPL pada tiap huruf yang diketik.
 */
const DokumenItem = React.memo(({ doc, removeDocument, onDocumentSaved, onNoteClick, disorot }: any) => {
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


/**
 * Daftar dokumen satu tahap.
 *
 * DIDEFINISIKAN DI LUAR `EditActivity`, dan itu bukan sekadar kerapian: saat ia
 * masih berada di dalam badan komponen, React melihat TIPE komponen yang baru
 * pada setiap render `EditActivity`, lalu memasang ulang seluruh subpohonnya.
 * Semua state baris dokumen tereset setiap kali `formData` berubah — itulah
 * sebabnya tombol "Selesai" dulu tampak tidak melakukan apa-apa: namanya
 * sebenarnya masuk, tapi barisnya langsung dipasang ulang ke keadaan awal.
 */
const DokumenContent = ({ tipe, title, dokumen, setFormData, kegiatanId, onNoteClick }: {
    tipe: Dokumen['tipe'];
    title: string;
    dokumen: ClientDokumen[];
    setFormData: React.Dispatch<React.SetStateAction<Partial<FormState>>>;
    kegiatanId: number;
    onNoteClick: (doc: ClientDokumen) => void;
}) => {
    const documents = useMemo(
        () => (dokumen || []).filter(d => d.tipe === tipe).sort((a) => (a.jenis === 'catatan' ? -1 : 1)),
        [dokumen, tipe]);

    const [barusanDitambah, setBarusanDitambah] = useState<string | null>(null);
    useEffect(() => {
        if (!barusanDitambah) return;
        const timer = setTimeout(() => setBarusanDitambah(null), 2500);
        return () => clearTimeout(timer);
    }, [barusanDitambah]);

    /**
     * Penghapusan hanya dilakukan di state form. Barisnya baru benar-benar
     * hilang dari database saat "Simpan Perubahan" ditekan: `updateKegiatan`
     * membuang dokumen tidak wajib yang tidak lagi ikut terkirim.
     *
     * Dulu ini langsung memanggil DELETE, sehingga dokumen sudah lenyap
     * permanen sebelum pengguna sempat berubah pikiran — dan "Batalkan
     * Perubahan" tidak bisa mengembalikannya.
     */
    const removeDocument = (clientId: string) => {
        setFormData(prev => ({
            ...prev,
            dokumen: prev.dokumen?.filter(d => d.clientId !== clientId)
        }));
    };

    /**
     * Menggabung, bukan menimpa: tiap kotak isian menyetor bidangnya sendiri
     * saat ditinggalkan, jadi setoran nama tidak boleh mengembalikan link ke
     * nilai lama yang masih terbawa di props baris itu.
     */
    const handleDocumentSaved = (perubahan: Partial<Dokumen>, clientId: string) => {
        setFormData(prev => ({
            ...prev,
            dokumen: prev.dokumen?.map(d => d.clientId === clientId ? { ...d, ...perubahan } : d),
        }));
    };

    const addDocument = () => {
        const clientId = `new-doc-${Date.now()}`;
        const newDoc: ClientDokumen = {
            clientId,
            kegiatanId,
            tipe,
            nama: "", link: "", jenis: 'link', isWajib: false,
            status: 'Pending', uploadedAt: new Date().toISOString()
        };
        setFormData(prev => ({ ...prev, dokumen: [...(prev.dokumen || []), newDoc] }));
        setBarusanDitambah(clientId);
        // Barisnya baru ada di DOM setelah render berikutnya, jadi penggulirannya
        // ditunda satu tick. Fokus langsung ke kotak namanya: itu satu-satunya
        // bidang yang wajib diisi sebelum kegiatan bisa disimpan.
        setTimeout(() => {
            const baris = document.querySelector(`[data-doc-id="${clientId}"]`);
            baris?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            baris?.querySelector('input')?.focus({ preventScroll: true });
        }, 60);
    };

    const addNote = () => {
        const newNoteTemplate: ClientDokumen = {
            clientId: `new-note-${Date.now()}`,
            kegiatanId,
            tipe,
            nama: "", // Isi catatan akan diisi di modal
            link: "",
            jenis: 'catatan',
            isWajib: false,
            status: 'Pending',
            uploadedAt: new Date().toISOString()
        };
        // Langsung buka modal untuk catatan baru
        onNoteClick(newNoteTemplate);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle>Dokumen {title}</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={addNote} className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />Tambah Catatan
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={addDocument} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />Tambah Dokumen
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Konsekuensi dari penundaan: tanpa keterangan ini, tidak ada
                    apa pun di layar yang memberi tahu bahwa isian dokumen belum
                    tersimpan sampai tombol di bawah halaman ditekan. */}
                <p className="text-xs text-muted-foreground">
                    Penambahan, penghapusan, dan penyuntingan dokumen maupun catatan
                    di sini baru tersimpan setelah Anda menekan <strong>Simpan Perubahan</strong>
                    {' '}di bawah halaman.
                </p>
                {documents.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Belum ada dokumen atau catatan.</p>}
                {documents.map(doc => (
                    <DokumenItem
                        key={doc.clientId}
                        doc={doc}
                        removeDocument={removeDocument}
                        onDocumentSaved={handleDocumentSaved}
                        onNoteClick={onNoteClick}
                        disorot={doc.clientId === barusanDitambah}
                    />
                ))}
            </CardContent>
        </Card>
    );
};


// --- Main Component ---
export default function EditActivity() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const location = useLocation();

    const [mainTab, setMainTab] = useState("info-dasar");
    const [pplStageTab, setPplStageTab] = useState<PPL['tahap']>("listing");
    const [docStageTab, setDocStageTab] = useState<TahapDokumen>("persiapan");

    // Tombol "Perbaiki Dokumen" di View Documents menautkan ke sini dengan
    // ?tab=dokumen&tahap=…&dok=<id>. Tanpa ini, tautannya mendarat di kegiatan
    // yang benar tapi tab yang salah, dan barisnya harus dicari manual.
    const [searchParams] = useSearchParams();
    const dokDituju = searchParams.get('dok');
    useEffect(() => {
        const tab = searchParams.get('tab');
        const tahap = searchParams.get('tahap');
        if (tab) setMainTab(tab);
        if (tahap && TAHAP_DOKUMEN_SAH.includes(tahap as TahapDokumen)) {
            setDocStageTab(tahap as TahapDokumen);
        }
    }, [searchParams]);

    // Gulirkan ke dokumen yang dituju setelah tab-nya berpindah dan barisnya
    // benar-benar terpasang di DOM. `clientId` untuk dokumen tersimpan selalu
    // sama dengan String(doc.id), jadi bisa dipakai sebagai penanda.
    useEffect(() => {
        if (!dokDituju) return;
        const timer = setTimeout(() => {
            document
                .querySelector(`[data-doc-id="${dokDituju}"]`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 250);
        return () => clearTimeout(timer);
    }, [dokDituju, mainTab, docStageTab]);
    const [showAutoPopulateMessage, setShowAutoPopulateMessage] = useState(false);
    const [addedPPLCount, setAddedPPLCount] = useState(0);
    const [formData, setFormData] = useState<Partial<FormState>>({ 
        dokumen: [], 
        ppl: [], 
        honorariumSettings: {
            'pengumpulan-data-listing': { satuanBebanKerja: '', hargaSatuan: '' },
            'pengumpulan-data-pencacahan': { satuanBebanKerja: '', hargaSatuan: '' },
            'pengolahan-analisis': { satuanBebanKerja: '', hargaSatuan: '' },
        }
    });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "" });
    const [showClearConfirmModal, setShowClearConfirmModal] = useState<{isOpen: boolean; tahap: PPL['tahap'] | null}>({isOpen: false, tahap: null});
    const submitButtonRef = useRef<HTMLButtonElement>(null); 
    const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

    
    // State for Note Modal
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [currentNote, setCurrentNote] = useState<ClientDokumen | null>(null);

    /**
     * Mengubah satu field form — dan, khusus untuk jadwal pendataan, sekaligus
     * mengisi rentang honor yang masih kosong.
     *
     * Ketiga jenis alokasi (listing, pencacahan, pengolahan) sama-sama bekerja
     * pada masa pendataan, jadi jadwal itu tebakan awal yang benar. `rentangHonorBawaan`
     * hanya mengisi yang kosong: menggeser jadwal pendataan tidak boleh diam-diam
     * memindahkan bulan pembebanan honor yang sudah diputuskan.
     */
    const handleFormFieldChange = useCallback((field: keyof FormState, value: any) => {
        setFormData(prev => {
            const berikut: any = { ...prev, [field]: value };
            if (field === 'tanggalMulaiPengumpulanData' || field === 'tanggalSelesaiPengumpulanData') {
                Object.assign(berikut, rentangHonorBawaan(
                    berikut.tanggalMulaiPengumpulanData
                        ? format(berikut.tanggalMulaiPengumpulanData, FORMAT_TANGGAL) : undefined,
                    berikut.tanggalSelesaiPengumpulanData
                        ? format(berikut.tanggalSelesaiPengumpulanData, FORMAT_TANGGAL) : undefined,
                    berikut));
            }
            return berikut;
        });
    }, []);

    const addPPL = useCallback((tahap: PPL['tahap'], pplsToAdd: PPLMaster[] = []) => {
        setPplStageTab(tahap);
        const newAllocations: ClientPPL[] = (pplsToAdd.length > 0 ? pplsToAdd : [{ id: '', namaPPL: '' }]).map(ppl => {
            const newPpl: ClientPPL = {
                clientId: `new-ppl-${Date.now()}-${ppl.id || Math.random()}`,
                ppl_master_id: ppl.id,
                namaPPL: ppl.namaPPL,
                namaPML: "",
                tahap: tahap,
                bebanKerja: '',
                besaranHonor: '0',
                honorarium: []
            };
            if (tahap === 'listing') newPpl.honorarium = [{ jenis_pekerjaan: 'listing', bebanKerja: '', besaranHonor: '0' }];
            if (tahap === 'pencacahan') newPpl.honorarium = [{ jenis_pekerjaan: 'pencacahan', bebanKerja: '', besaranHonor: '0' }];
            if (tahap === 'pengolahan-analisis') newPpl.honorarium = [{ jenis_pekerjaan: 'pengolahan', bebanKerja: '', besaranHonor: '0' }];
            return newPpl;
        });

        setFormData(prev => ({ ...prev, ppl: [...(prev.ppl || []), ...newAllocations]}));
    }, []);
    
    useEffect(() => {
        if (!isInitialDataLoaded) {
            return;
        }

        const { newPpls, tahap, from } = location.state || {};

        if (from === 'daftar-ppl' && newPpls && tahap && Array.isArray(newPpls) && newPpls.length > 0) {
            setFormData(currentFormData => {
                const currentPplsInStage = currentFormData.ppl?.filter(p => p.tahap === tahap) || [];
                const existingPplIds = new Set(currentPplsInStage.map(p => String(p.ppl_master_id)));
                const pplsToAdd = newPpls.filter((p: PPLMaster) => !existingPplIds.has(String(p.id)));

                if (pplsToAdd.length > 0) {
                    const newAllocations = pplsToAdd.map((ppl: PPLMaster) => {
                        const newPpl: ClientPPL = {
                            clientId: `new-ppl-${Date.now()}-${ppl.id}`,
                            ppl_master_id: ppl.id,
                            namaPPL: ppl.namaPPL,
                            namaPML: "",
                            tahap: tahap,
                            bebanKerja: '',
                            besaranHonor: '0',
                            honorarium: []
                        };
                        if (tahap === 'listing') newPpl.honorarium = [{ jenis_pekerjaan: 'listing', bebanKerja: '', besaranHonor: '0' }];
                        if (tahap === 'pencacahan') newPpl.honorarium = [{ jenis_pekerjaan: 'pencacahan', bebanKerja: '', besaranHonor: '0' }];
                        if (tahap === 'pengolahan-analisis') newPpl.honorarium = [{ jenis_pekerjaan: 'pengolahan', bebanKerja: '', besaranHonor: '0' }];
                        return newPpl;
                    });

                    setAddedPPLCount(pplsToAdd.length);
                    setShowAutoPopulateMessage(true);
                    setTimeout(() => setShowAutoPopulateMessage(false), 5000);

                    return { 
                        ...currentFormData, 
                        ppl: [...(currentFormData.ppl || []), ...newAllocations] 
                    };
                }
                return currentFormData;
            });

            setMainTab('alokasi-ppl');
            setPplStageTab(tahap);
            window.history.replaceState({}, document.title);
            
        } else if (from === 'batal-pilih' && tahap) {
            setMainTab('alokasi-ppl');
            setPplStageTab(tahap);
            window.history.replaceState({}, document.title);
        }
    }, [location.state, isInitialDataLoaded]);
    
    const [showHonorWarningModal, setShowHonorWarningModal] = useState(false);
    const [konfirmasiBatal, setKonfirmasiBatal] = useState(false);
    const [batalSukses, setBatalSukses] = useState(false);
    /** clientId alokasi PPL yang menunggu konfirmasi hapus; null = tidak ada. */
    const [konfirmasiHapusPPL, setKonfirmasiHapusPPL] = useState<string | null>(null);
    /** Tahap yang menunggu konfirmasi untuk dimatikan; null = tidak ada. */
    const [konfirmasiMatikanTahap, setKonfirmasiMatikanTahap] = useState<TahapDokumen | null>(null);
    const [honorWarningDetails, setHonorWarningDetails] = useState<{ pplName: string; totalHonor: number; limit: number } | null>(null);

    /**
     * `staleTime` DITARGETKAN di sini, bukan dipasang global di QueryClient.
     *
     * Halaman ini menyalin data server ke state form SEKALI saja (lihat penjaga
     * `isInitialDataLoaded`), supaya refetch latar belakang tidak menimpa apa
     * yang sedang diketik. Konsekuensinya, salinan yang sangat basi ikut
     * membeku — termasuk `ketua_tim_id` yang ketua timnya sudah dihapus, yang
     * lalu ditolak foreign key saat disimpan.
     *
     * Global `staleTime` TIDAK dipakai: Dashboard dan lonceng notifikasi justru
     * mengandalkan refetch-on-focus untuk menampilkan progres dan dokumen
     * terbaru; memberi mereka staleTime membuat angka basi tampil tanpa tanda.
     */
    const { data: initialData, isLoading, isError } = useQuery({
        queryKey: ['kegiatan', id],
        queryFn: () => fetchActivityDetails(id!),
        enabled: !!id,
        staleTime: 5 * 60_000,
        refetchOnWindowFocus: false,
    });

    // Hak sunting memakai akun yang ditautkan ke ketua tim (ketua_tim.user_id),
    // bukan ketua_tim_id: `users` memakai pola USR### sedangkan `ketua_tim`
    // memakai KT###, dua ruang ID yang tidak beririsan.
    const bolehMengedit = useMemo(() => {
        if (!initialData) return true;   // biarkan pemuatan berjalan dulu
        // Aturannya dipakai bersama server (lihat @shared/hakKegiatan), jadi
        // tombol yang tampil di layar dan yang benar-benar diizinkan API
        // tidak bisa menyimpang.
        return bolehMenyuntingKegiatan(user as any, initialData as any);
    }, [initialData, user]);

    const { data: pplList = [] } = useQuery({ queryKey: ['pplMaster'], queryFn: fetchPPLs });
    // staleTime-nya dipasang terpusat di App.tsx bersama data master lain.
    const { data: ketuaTimList = [] } = useQuery({ queryKey: ['ketuaTim'], queryFn: fetchKetuaTim });

    /**
     * Ketua tim yang tersimpan di form sudah tidak ada di daftar.
     *
     * Terjadi bila ketua timnya dihapus setelah halaman ini dibuka, atau bila
     * form terhidrasi dari salinan lama. Sebelumnya keadaan ini hanya membuat
     * pemilihnya TAMPAK KOSONG tanpa memberi tahu apa pun, lalu penyimpanan
     * gagal dengan pesan foreign key yang tidak bisa dibaca.
     *
     * Menunggu daftarnya termuat lebih dulu; tanpa itu peringatannya berkedip
     * setiap kali halaman dibuka.
     */
    const ketuaTimTidakDikenal = useMemo(
        () => isInitialDataLoaded
            && ketuaTimList.length > 0
            && !!formData.ketua_tim_id
            && !idKetuaTimDikenal(ketuaTimList, formData.ketua_tim_id),
        [isInitialDataLoaded, ketuaTimList, formData.ketua_tim_id],
    );

    // Tim melekat pada master ketua tim, jadi hanya ditampilkan (read-only).
    const timKetuaTerpilih = useMemo(
        () => ketuaTimList.find(k => String(k.id) === String(formData.ketua_tim_id))?.tim,
        [ketuaTimList, formData.ketua_tim_id],
    );
    const { data: pmlList = [] } = useQuery({ queryKey: ['pmls'], queryFn: fetchPMLs });

    useEffect(() => {
        // Hanya hidrasi SEKALI. Tanpa penjaga ini, setiap refetch latar belakang
        // (staleTime 0 + refetchOnWindowFocus) membuat identitas `initialData`
        // berubah dan menimpa seluruh isian dengan data server — apa pun yang
        // sedang diketik pengguna hilang begitu saja. Inilah sebabnya "buka View
        // Documents dulu, baru kembali ke Edit" terasa memperbaiki keadaan:
        // cache-nya sudah tenang sehingga reset itu mendarat tidak berbahaya.
        if (initialData && !isInitialDataLoaded) {
            const parseDate = (dateString?: string): Date | undefined => {
                if (!dateString) return undefined;
                const date = parseISO(dateString);
                return isValid(date) ? date : undefined;
            };

            setFormData({
                ...initialData,
                bulanHonorListing: initialData.bulanHonorListing || '',
                bulanHonorPencacahan: initialData.bulanHonorPencacahan || '',
                bulanHonorPengolahan: initialData.bulanHonorPengolahan || '',
                // Rentang honor dibiarkan sebagai string "yyyy-MM-dd" apa adanya
                // dari server; server sudah mengirimnya lewat DATE_FORMAT supaya
                // tidak bergeser sehari karena zona waktu.
                tanggalMulaiHonorListing: initialData.tanggalMulaiHonorListing || undefined,
                tanggalSelesaiHonorListing: initialData.tanggalSelesaiHonorListing || undefined,
                tanggalMulaiHonorPencacahan: initialData.tanggalMulaiHonorPencacahan || undefined,
                tanggalSelesaiHonorPencacahan: initialData.tanggalSelesaiHonorPencacahan || undefined,
                tanggalMulaiHonorPengolahan: initialData.tanggalMulaiHonorPengolahan || undefined,
                tanggalSelesaiHonorPengolahan: initialData.tanggalSelesaiHonorPengolahan || undefined,
                honorariumSettings: initialData.honorariumSettings || {
                    'pengumpulan-data-listing': { satuanBebanKerja: '', hargaSatuan: '' },
                    'pengumpulan-data-pencacahan': { satuanBebanKerja: '', hargaSatuan: '' },
                    'pengolahan-analisis': { satuanBebanKerja: '', hargaSatuan: '' },
                },
                tanggalMulaiPersiapan: parseDate(initialData.tanggalMulaiPersiapan),
                tanggalSelesaiPersiapan: parseDate(initialData.tanggalSelesaiPersiapan),
                tanggalMulaiPengumpulanData: parseDate(initialData.tanggalMulaiPengumpulanData),
                tanggalSelesaiPengumpulanData: parseDate(initialData.tanggalSelesaiPengumpulanData),
                tanggalMulaiPengolahanAnalisis: parseDate(initialData.tanggalMulaiPengolahanAnalisis),
                tanggalSelesaiPengolahanAnalisis: parseDate(initialData.tanggalSelesaiPengolahanAnalisis),
                tanggalMulaiDiseminasiEvaluasi: parseDate(initialData.tanggalMulaiDiseminasiEvaluasi),
                tanggalSelesaiDiseminasiEvaluasi: parseDate(initialData.tanggalSelesaiDiseminasiEvaluasi),
                dokumen: initialData.dokumen.map((d: Dokumen, i) => ({...d, clientId: d.id?.toString() || `doc-${Date.now()}-${i}` })),
                ppl: initialData.ppl.map((p, i) => ({
                    ...p,
                    clientId: p.id?.toString() || `ppl-${Date.now()}-${i}`,
                    honorarium: (p.honorarium || []).map(h => ({
                        ...h,
                        bebanKerja: h.bebanKerja || '',
                        besaranHonor: h.besaranHonor || '0'
                    }))
                }))
            });
            setIsInitialDataLoaded(true);
        }
    }, [initialData, isInitialDataLoaded]);

    /**
     * Menghapus alokasi PPL — SELALU lewat konfirmasi.
     *
     * Satu kartu alokasi memuat PPL, PML, beban kerja, dan honor yang sudah
     * diketik; tidak ada urungkan, dan salah klik berarti mengetik ulang
     * semuanya. Nama PPL-nya disebut di dialog supaya jelas kartu mana yang
     * akan hilang — di tahap yang ramai, kartunya mirip semua.
     */
    const mintaHapusPPL = useCallback((clientId: string) => {
        setKonfirmasiHapusPPL(clientId);
    }, []);

    const removePPL = useCallback((clientId: string) => {
    setFormData(prev => ({
        ...prev,
        ppl: prev.ppl?.filter(p => p.clientId !== clientId) || [] 
    }));
}, []); 
    
    const updatePPL = useCallback((clientId: string, field: keyof ClientPPL, value: any) => {
        setFormData(prev => {
            if (!prev.ppl) return prev;
            const newPplList = prev.ppl.map(p => p.clientId === clientId ? { ...p, [field]: value } : p);
            return { ...prev, ppl: newPplList };
        });
    }, []);
    
    const mutation = useMutation({
        mutationFn: updateActivity,
        onSuccess: async () => {
            /**
             * Penjaga hidrasi dilepas SETELAH pengambilan ulang selesai — dan
             * urutan itu bukan kerapian, melainkan inti perbaikannya.
             *
             * Form ini menyalin data server SEKALI, lalu `isInitialDataLoaded`
             * menutup pintunya. Melepas penjaga sebelum data baru tiba membuat
             * efek hidrasi berjalan atas isi cache yang MASIH LAMA: form
             * seketika kembali ke keadaan sebelum disimpan, penjaganya menutup
             * lagi, dan data baru yang datang sesaat kemudian tidak pernah
             * disalin. Persis itu yang terlihat sebagai "PPL yang ditambah atau
             * dihapus tidak berubah sampai halaman dibuka ulang" — datanya
             * sudah benar di server, hanya layarnya yang tertinggal.
             *
             * Satu invalidate dengan awalan ['kegiatan'] sudah mencakup
             * ['kegiatan', id] milik halaman ini sekaligus daftar Dashboard,
             * jadi tidak perlu dua panggilan yang membuat halaman ini mengambil
             * ulang dua kali.
             *
             * `finally`: kalau pengambilan ulang gagal, modal sukses tetap
             * harus muncul — datanya sungguh tersimpan, dan menyembunyikan
             * konfirmasinya hanya membuat pengguna menekan Simpan lagi.
             */
            try {
                await queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
            } finally {
                // Dokumen dan catatan baru masih tanpa `id` di state form —
                // id-nya baru lahir di server pada simpan ini. Tanpa pengisian
                // ulang, menekan Simpan sekali lagi akan MENYISIPKAN dokumen
                // yang sama untuk kedua kalinya.
                setIsInitialDataLoaded(false);
                setShowSuccessModal(true);
            }
        },
        onError: (error: any) => {
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                const errorDetails = errorData.details;

                if (errorDetails && errorDetails.code === 'HONOR_LIMIT_EXCEEDED') {
                    const pplWithError = formData.ppl?.find((p: any) => String(p.ppl_master_id) === String(errorDetails.ppl_master_id));

                    setHonorWarningDetails({
                        pplName: pplWithError?.namaPPL || 'salah satu PPL',
                        totalHonor: errorDetails.projectedTotal,
                        limit: errorDetails.limit
                    });
                    setShowHonorWarningModal(true);
                    return;
                }
            }
        
            console.error("Gagal menyimpan:", error);

            // Server menolak ketua tim yang sudah tidak ada. Daftarnya disegarkan
            // dan pilihannya dikosongkan supaya pengguna memilih ulang, bukan
            // menekan Simpan berkali-kali dengan nilai yang sama.
            if (error.response?.data?.details?.code === 'KETUA_TIM_TIDAK_DITEMUKAN') {
                queryClient.invalidateQueries({ queryKey: ['ketuaTim'] });
                handleFormFieldChange('ketua_tim_id', '');
                setMainTab('info-dasar');
                setAlertModal({
                    isOpen: true,
                    title: "Ketua Tim Tidak Ditemukan",
                    message: error.response?.data?.message || error.message,
                });
                return;
            }
            setAlertModal({ 
                isOpen: true, 
                title: "Gagal Menyimpan", 
                message: `Terjadi kesalahan: ${error.response?.data?.message || error.message}` 
            });
        }
    });

    const validateDates = (): string | null => {
        const {
            tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
            tanggalMulaiPengumpulanData, tanggalSelesaiPengumpulanData,
            tanggalMulaiPengolahanAnalisis, tanggalSelesaiPengolahanAnalisis,
            tanggalMulaiDiseminasiEvaluasi, tanggalSelesaiDiseminasiEvaluasi
        } = formData;

        const stages = [
        // Tahap yang dimatikan dikeluarkan dari pemeriksaan urutan. Tanggalnya
        // masih tersimpan di state (server yang mengosongkannya saat disimpan),
        // jadi tanpa penyaringan ini jadwal tahap yang sudah dinyatakan tidak
        // ada bisa menolak penyimpanan.
            { start: tanggalMulaiPersiapan, end: tanggalSelesaiPersiapan, name: 'Persiapan' },
            { start: tanggalMulaiPengumpulanData, end: tanggalSelesaiPengumpulanData, name: 'Pengumpulan Data' },
            ...(pengolahanAktif ? [{ start: tanggalMulaiPengolahanAnalisis, end: tanggalSelesaiPengolahanAnalisis, name: 'Pengolahan & Analisis' }] : []),
            ...(diseminasiAktif ? [{ start: tanggalMulaiDiseminasiEvaluasi, end: tanggalSelesaiDiseminasiEvaluasi, name: 'Diseminasi & Evaluasi' }] : []),
           ];

        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            if (stage.start && stage.end && stage.start > stage.end) {
                return `Jadwal ${stage.name} tidak valid: Tanggal selesai tidak boleh sebelum tanggal mulai.`;
            }

            if (i > 0) {
                const prevStage = stages[i - 1];
                if (prevStage.start && stage.start && stage.start < prevStage.start) {
                    return `Urutan jadwal tidak valid: Tahap ${stage.name} tidak boleh dimulai sebelum tahap ${prevStage.name} dimulai.`;
                }
            }
        }
        return null;
    };

    const handleFormSubmit = (bypassHonorLimit = false) => {
        if (!formData.id) return alert("Error: ID Kegiatan tidak ditemukan.");
    
        // Ketua tim wajib dan harus masih ada. Lewat alert, bukan tombol yang
        // dimatikan: formnya bertab, dan tombol yang diam-diam mati di tab lain
        // justru membingungkan.
        if (!formData.ketua_tim_id || ketuaTimTidakDikenal) {
            setMainTab('info-dasar');
            setAlertModal({
                isOpen: true,
                title: "Ketua Tim Belum Dipilih",
                message: formData.ketua_tim_id
                    ? pesanKetuaTimTidakDikenal(String(formData.ketua_tim_id))
                    : "Pilih ketua tim terlebih dahulu sebelum menyimpan kegiatan.",
            });
            return;
        }

        const dateError = validateDates();
        if (dateError) {
            setAlertModal({ isOpen: true, title: "Kesalahan Jadwal Kegiatan", message: dateError });
            return;
        }

        /**
         * Setiap tahap yang punya alokasi mitra dan periode honornya melintasi
         * lebih dari satu bulan wajib sudah ditentukan cara pembebanannya per
         * alokasi. Tanpa penjaga ini, server jatuh ke bawaan "semuanya di bulan
         * pertama" tanpa pengguna pernah tahu bulan mana yang dipilihkan.
         */
        const tahapBelumLengkap = ([
            { tahap: 'listing', kolom: 'Listing', nama: 'Listing' },
            { tahap: 'pencacahan', kolom: 'Pencacahan', nama: 'Pencacahan' },
            { tahap: 'pengolahan-analisis', kolom: 'Pengolahan', nama: 'Pengolahan' },
        ] as const).find(({ tahap, kolom }) => {
            const alokasi = (formData.ppl || []).filter(p => p.tahap === tahap && p.ppl_master_id);
            if (alokasi.length === 0) return false;
            return pembebananBelumLengkap(
                bulanDalamRentang(
                    formData[`tanggalMulaiHonor${kolom}`],
                    formData[`tanggalSelesaiHonor${kolom}`]),
                alokasi);
        });
        if (tahapBelumLengkap) {
            setMainTab('alokasi-ppl');
            setPplStageTab(tahapBelumLengkap.tahap);
            setAlertModal({
                isOpen: true,
                title: "Pembebanan Honor Belum Lengkap",
                message: `Periode honor tahap ${tahapBelumLengkap.nama} melintasi lebih dari satu bulan. `
                    + `Tentukan dulu Pembebanan Honor pada setiap kartu alokasi PPL di tahap itu.`,
            });
            return;
        }

        // Dokumen tanpa nama dulu tidak mungkin lolos: tombol Simpan per-baris
        // mati selama namanya kosong, dan barisnya belum pernah sampai ke
        // server. Sekarang dokumen ditahan di state form sampai simpan massal,
        // jadi baris yang ditambahkan lalu ditinggalkan kosong akan ikut
        // tersimpan kalau tidak dijaga di sini.
        const tanpaNama = (formData.dokumen || []).filter(d => !d.nama?.trim());
        if (tanpaNama.length > 0) {
            setAlertModal({
                isOpen: true,
                title: "Ada Dokumen Tanpa Nama",
                message: `Ada ${tanpaNama.length} dokumen atau catatan yang belum diberi nama/isi. `
                    + `Lengkapi namanya, atau hapus barisnya dengan tombol silang, sebelum menyimpan.`,
            });
            return;
        }

        // Jalur simpan massal punya pintu masuknya sendiri ke tabel dokumen,
        // terpisah dari tombol Simpan per-dokumen, jadi ia perlu penjagaan
        // sendiri. Catatan dilewati: kolom `link`-nya memang selalu kosong.
        const dokumenBermasalah = (formData.dokumen || [])
            .filter(d => d.jenis !== 'catatan')
            .map(d => ({ nama: d.nama, hasil: periksaTautan(d.link) }))
            .filter(d => !d.hasil.sah);
        if (dokumenBermasalah.length > 0) {
            const daftar = dokumenBermasalah
                .map(d => `• ${d.nama || '(tanpa nama)'}: ${d.hasil.galat}`)
                .join('\n');
            setAlertModal({
                isOpen: true,
                title: "Link Dokumen Tidak Valid",
                message: `Perbaiki link berikut sebelum menyimpan:\n\n${daftar}`,
            });
            return;
        }

        // hargaSatuan disimpan di state sebagai string ter-format ("24.000"),
        // jadi harus dinormalkan sebelum dikirim. Tanpa ini server menerima
        // "1.2002" dan menyimpannya sebagai 1 di ppl_honorarium.hargaSatuan.
        const settings = formData.honorariumSettings;
        const normalizedHonorSettings = settings && {
            'pengumpulan-data-listing': {
                ...settings['pengumpulan-data-listing'],
                hargaSatuan: parseHonor(settings['pengumpulan-data-listing'].hargaSatuan),
            },
            'pengumpulan-data-pencacahan': {
                ...settings['pengumpulan-data-pencacahan'],
                hargaSatuan: parseHonor(settings['pengumpulan-data-pencacahan'].hargaSatuan),
            },
            'pengolahan-analisis': {
                ...settings['pengolahan-analisis'],
                hargaSatuan: parseHonor(settings['pengolahan-analisis'].hargaSatuan),
            },
        };

        const dataToSubmit = {
            ...formData,
            honorariumSettings: normalizedHonorSettings,
            // Link dikirim dalam bentuk ternormalisasi supaya yang tersimpan
            // sama persis dengan yang disimpan lewat tombol per-dokumen.
            dokumen: (formData.dokumen || []).map(d =>
                d.jenis === 'catatan' ? d : { ...d, link: periksaTautan(d.link).tautan }),
            ppl: (formData.ppl || []).map(p => ({
                ...p,
                // besaranHonor DIHITUNG ULANG di sini, tidak diambil dari state.
                //
                // Bukan sekadar demi angka yang tersimpan benar: server memakai
                // nilai ini untuk memeriksa batas honor bulanan seorang mitra
                // (`validatePplHonor`). Mengirim hasil kali harga satuan yang
                // LAMA membuat peringatan batas itu dihitung atas angka yang
                // salah — bisa lolos padahal seharusnya memperingatkan.
                honorarium: (p.honorarium || []).map(h => ({
                    ...h,
                    bebanKerja: parseHonor(h.bebanKerja ?? '0'),
                    besaranHonor: String(hitungBesaranHonor(
                        h.bebanKerja, h.jenis_pekerjaan, formData.honorariumSettings)),
                })),
            })),
            id: formData.id,
            lastEditedBy: user?.username,
            lastUpdatedBy: user?.username,
            bulanPembayaranHonor: undefined,
            bypassHonorLimit: bypassHonorLimit
        };

        mutation.mutate(dataToSubmit as Partial<FormState> & {id: number});
    };

    /**
     * Mengembalikan form ke kondisi tersimpan di server.
     *
     * Bukan sekadar menyalin ulang `initialData` yang ada di memori: data itu
     * bisa sudah ikut berubah. Cache disegarkan lebih dulu, lalu penjaga
     * hidrasi dilepas supaya efek pengisian form berjalan lagi dari data yang
     * baru diambil.
     *
     * Sejak perubahan dokumen dan catatan ditahan sampai Simpan, tombol ini
     * membatalkan SELURUH sesi penyuntingan — termasuk dokumen yang dihapus,
     * ditambah, atau disunting di tab Dokumen. Dulu tidak begitu: ketiganya
     * memakai endpoint per-dokumen yang langsung menulis ke server, sehingga
     * tombol ini tampak tidak berefek apa-apa.
     */
    const batalkanPerubahan = async () => {
        setKonfirmasiBatal(false);
        await queryClient.invalidateQueries({ queryKey: ['kegiatan', id] });
        setIsInitialDataLoaded(false);
        // Tanpa penanda ini, membatalkan terasa seperti tidak terjadi apa-apa:
        // formnya kembali ke isi semula, dan itu memang sulit dibedakan dari
        // tombol yang macet.
        setBatalSukses(true);
    };

    // Dihitung di sini, bukan di dalam JSX modal: `find` di dalam props modal
    // akan berjalan pada setiap render halaman, bukan hanya saat modalnya buka.
    const namaPPLDikonfirmasi = useMemo(() => {
        if (!konfirmasiHapusPPL) return '';
        const ppl = formData.ppl?.find(p => p.clientId === konfirmasiHapusPPL);
        return ppl?.namaPPL || 'ini';
    }, [konfirmasiHapusPPL, formData.ppl]);

    /**
     * `?? true` di kedua tempat: kegiatan yang tersimpan sebelum migrasi
     * 2026-09-18 tidak memuat kunci ini, dan semuanya memang menjalankan kedua
     * tahap. Menganggapnya false akan membuat seluruh kegiatan lama tiba-tiba
     * kehilangan jadwal dan dokumennya begitu halaman ini dibuka.
     */
    const pengolahanAktif = formData.adaPengolahan ?? true;
    const diseminasiAktif = formData.adaDiseminasi ?? true;
    const jumlahTahapDokumen = 2 + (pengolahanAktif ? 1 : 0) + (diseminasiAktif ? 1 : 0);

    /** Dokumen yang akan ikut terhapus bila sebuah tahap dimatikan. */
    const dokumenTahap = (tahap: TahapDokumen) =>
        (formData.dokumen || []).filter(d => d.tipe === tahap);

    /**
     * Mematikan tahap MENGHAPUS dokumennya secara permanen di server, jadi
     * pengguna dikonfirmasi lebih dulu — dan hanya kalau memang ada yang akan
     * hilang. Menyalakan tahap tidak perlu konfirmasi: tidak ada yang hilang.
     *
     * Seperti perubahan lain di halaman ini, penghapusannya baru benar-benar
     * terjadi saat "Simpan Perubahan" ditekan.
     */
    const mintaUbahTahap = (tahap: TahapDokumen, aktif: boolean) => {
        const kunci = tahap === 'pengolahan-analisis' ? 'adaPengolahan' : 'adaDiseminasi';
        if (aktif) {
            // Dokumen wajibnya disemai ulang. Mematikan tahap menghapusnya
            // permanen, jadi tanpa ini tahap yang dinyalakan kembali hidup tanpa
            // satu pun dokumen yang dituntut — dan kelengkapannya jadi palsu.
            // Link lama TIDAK kembali; itu konsekuensi penghapusan permanen.
            setFormData(prev => {
                const daftar = prev.dokumen || [];
                const sudahAda = daftar.some(d => d.tipe === tahap);
                const tambahan: ClientDokumen[] = sudahAda ? [] : dokumenWajibTahap(tahap).map((d, i) => ({
                    ...d,
                    clientId: `wajib-${tahap}-${Date.now()}-${i}`,
                    kegiatanId: Number(id),
                    link: '',
                    status: 'Pending',
                    uploadedAt: new Date().toISOString(),
                }));
                return { ...prev, [kunci]: true, dokumen: [...daftar, ...tambahan] };
            });
            return;
        }
        if (dokumenTahap(tahap).length > 0) {
            setKonfirmasiMatikanTahap(tahap);
            return;
        }
        setFormData(prev => ({ ...prev, [kunci]: false }));
    };

    const matikanTahap = () => {
        const tahap = konfirmasiMatikanTahap;
        setKonfirmasiMatikanTahap(null);
        if (!tahap) return;
        const kunci = tahap === 'pengolahan-analisis' ? 'adaPengolahan' : 'adaDiseminasi';
        // Dokumennya ikut dibuang dari state supaya daftar dan penjaga
        // "dokumen tanpa nama" tidak lagi menghitung tahap yang sudah mati.
        setFormData(prev => ({
            ...prev,
            [kunci]: false,
            dokumen: prev.dokumen?.filter(d => d.tipe !== tahap),
        }));
        if (docStageTab === tahap) setDocStageTab('persiapan');
    };

    /**
     * Jadwal per tahap kini satu pemilih RENTANG, bukan dua pemilih tanggal
     * tunggal — konsisten dengan Rentang Tanggal Honor: klik pertama tanggal
     * mulai, klik kedua tanggal selesai.
     */
    const jadwalTahap = [
        { label: 'Persiapan', mulai: 'tanggalMulaiPersiapan', selesai: 'tanggalSelesaiPersiapan' },
        { label: 'Pengumpulan Data', mulai: 'tanggalMulaiPengumpulanData', selesai: 'tanggalSelesaiPengumpulanData' },
        ...(pengolahanAktif ? [{ label: 'Pengolahan & Analisis', mulai: 'tanggalMulaiPengolahanAnalisis', selesai: 'tanggalSelesaiPengolahanAnalisis' }] : []),
        ...(diseminasiAktif ? [{ label: 'Diseminasi & Evaluasi', mulai: 'tanggalMulaiDiseminasiEvaluasi', selesai: 'tanggalSelesaiDiseminasiEvaluasi' }] : []),
    ] as { label: string; mulai: DateFieldName; selesai: DateFieldName }[];

    /**
     * Kedua ujung ditulis dalam SATU pembaruan state.
     *
     * Kalau ditulis dua kali berurutan lewat `handleFormFieldChange`, efek
     * samping "isi rentang honor dari jadwal pendataan" akan berjalan pada
     * penulisan pertama — saat tanggal selesainya masih nilai lama — lalu
     * penulisan kedua menganggap rentang honornya sudah terisi dan melewatinya.
     * Hasilnya rentang honor mengikuti pasangan tanggal yang tidak pernah ada.
     */
    const ubahJadwalTahap = (
        fieldMulai: DateFieldName,
        fieldSelesai: DateFieldName,
        rentang: { mulai?: string; selesai?: string },
    ) => {
        const mulai = keTanggal(rentang.mulai);
        const selesai = keTanggal(rentang.selesai);
        setFormData(prev => {
            const berikut: any = { ...prev, [fieldMulai]: mulai, [fieldSelesai]: selesai };
            if (fieldMulai === 'tanggalMulaiPengumpulanData') {
                Object.assign(berikut, rentangHonorBawaan(rentang.mulai, rentang.selesai, berikut));
            }
            return berikut;
        });
    };

    const handleNoteClick = (doc: ClientDokumen) => {
        setCurrentNote(doc);
        setIsNoteModalOpen(true);
    };

    /**
     * Catatan hanya masuk ke state form, sama seperti dokumen.
     *
     * `addNote` sengaja TIDAK menaruh catatan barunya ke `formData` — ia cuma
     * membuka modalnya. Jadi catatan yang ditutup tanpa disimpan tidak
     * meninggalkan baris kosong, dan di sini catatan baru perlu ditambahkan,
     * bukan sekadar diganti.
     */
    const handleSaveNote = () => {
        if (!currentNote) return;
        const catatan: ClientDokumen = { ...currentNote, jenis: 'catatan', link: '' };
        setFormData(prev => {
            const daftar = prev.dokumen || [];
            const sudahAda = daftar.some(d => d.clientId === catatan.clientId);
            return {
                ...prev,
                dokumen: sudahAda
                    ? daftar.map(d => d.clientId === catatan.clientId ? catatan : d)
                    : [...daftar, catatan],
            };
        });
        setIsNoteModalOpen(false);
        setCurrentNote(null);
    };
    
    const AlokasiPPLContent = ({ tahap, title }: { tahap: PPL['tahap'], title: string, setAlertModal: React.Dispatch<React.SetStateAction<{isOpen: boolean; title: string; message: string;}>> }) => {
        const pplForStage = useMemo(() => formData.ppl?.filter(p => p.tahap === tahap) || [], [formData.ppl, tahap]);
        
        // Nama kolom honor memakai akhiran "Pengolahan", sedangkan tahap PPL
        // bernama "pengolahan-analisis".
        const tahapHonor: TahapHonor =
            tahap === 'listing' ? 'Listing' : tahap === 'pencacahan' ? 'Pencacahan' : 'Pengolahan';

        const rentangHonor = {
            mulai: formData[`tanggalMulaiHonor${tahapHonor}`],
            selesai: formData[`tanggalSelesaiHonor${tahapHonor}`],
        };

        const opsiBulanPembebanan = useMemo(
            () => bulanDalamRentang(rentangHonor.mulai, rentangHonor.selesai),
            [rentangHonor.mulai, rentangHonor.selesai],
        );

        // Rentang dan bulan pembebanan diubah bersama supaya bulan yang
        // dibebani selalu benar-benar tersentuh oleh rentangnya.
        const handleRentangChange = ({ mulai, selesai }: { mulai?: string; selesai?: string }) => {
            setFormData(prev => ({
                ...prev,
                [`tanggalMulaiHonor${tahapHonor}`]: mulai,
                [`tanggalSelesaiHonor${tahapHonor}`]: selesai,
                [`bulanHonor${tahapHonor}`]: bulanPembebananSetelahUbah(mulai, selesai, prev[`bulanHonor${tahapHonor}`]),
            }));
        };

        const [localHonorSettings, setLocalHonorSettings] = useState<HonorariumSettings>(
            formData.honorariumSettings || {
                'pengumpulan-data-listing': { satuanBebanKerja: '', hargaSatuan: '' },
                'pengumpulan-data-pencacahan': { satuanBebanKerja: '', hargaSatuan: '' },
                'pengolahan-analisis': { satuanBebanKerja: '', hargaSatuan: '' },
            }
        );

        useEffect(() => {
            if(formData.honorariumSettings){
                setLocalHonorSettings(formData.honorariumSettings);
            }
        }, [formData.honorariumSettings]);

        const getHonorSettingsKey = (): keyof HonorariumSettings | null => {
            if (tahap === 'listing') return 'pengumpulan-data-listing';
            if (tahap === 'pencacahan') return 'pengumpulan-data-pencacahan';
            if (tahap === 'pengolahan-analisis') return 'pengolahan-analisis';
            return null;
        }
        const honorSettingKey = getHonorSettingsKey();

        const handleSettingChange = (field: 'satuanBebanKerja' | 'hargaSatuan', value: string) => {
            if (!honorSettingKey) return;
            setLocalHonorSettings(prev => ({
                ...prev,
                [honorSettingKey!]: { ...prev[honorSettingKey!], [field]: value }
            }));
        };

        const handleSettingBlur = () => {
            handleFormFieldChange('honorariumSettings', localHonorSettings);
        };

        if (!localHonorSettings) return <Skeleton className="h-40 w-full" />;

        const handleClearPPLs = () => {
            setFormData(prev => ({ ...prev, ppl: prev.ppl?.filter(p => p.tahap !== tahap)}));
            setShowClearConfirmModal({isOpen: false, tahap: null});
        }
        
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Alokasi PPL & PML ({title})</CardTitle>
                            <CardDescription>Atur honorarium, bulan pembayaran, lalu alokasikan PPL.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {pplForStage.length > 0 && (
                                <Button type="button" variant="destructive" size="sm" onClick={() => setShowClearConfirmModal({isOpen: true, tahap})}>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Clear PPL
                                </Button>
                            )}
                            <Button variant="outline" size="sm" asChild>
                                <Link to="/daftar-ppl" state={{ from: 'daftar-ppl', kegiatanId: id, tahap: tahap, existingPplIds: pplForStage.map(p => p.ppl_master_id).filter(Boolean) }}><Users className="w-4 h-4 mr-2" />Pilih dari Daftar PPL</Link>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/40 space-y-4">
                        <h4 className="font-medium text-foreground">Pengaturan Honorarium & Pembayaran</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Satuan Beban Kerja</Label>
                                <Input value={honorSettingKey ? localHonorSettings[honorSettingKey].satuanBebanKerja : ''} onChange={e => handleSettingChange('satuanBebanKerja', e.target.value)} onBlur={handleSettingBlur} />
                            </div>
                            <div className="space-y-2">
                                <Label>Harga per Satuan (Rp)</Label>
                                <Input value={honorSettingKey ? formatHonor(localHonorSettings[honorSettingKey].hargaSatuan) : ''} onChange={e => handleSettingChange('hargaSatuan', e.target.value)} onBlur={handleSettingBlur} />
                            </div>
                            <div className="space-y-2">
                                <Label>Rentang Tanggal Honor *</Label>
                                <DateRangePicker
                                    value={rentangHonor}
                                    onChange={handleRentangChange}
                                    defaultMonth={formData.tanggalMulaiPersiapan}
                                    placeholder="Pilih rentang..."
                                />
                            </div>
                        </div>

                        {opsiBulanPembebanan.length > 1 && (
                            <p className="text-sm text-muted-foreground">
                                Rentang honor melintasi {opsiBulanPembebanan.length} bulan. Pilihan bulannya
                                ada di tiap kartu alokasi PPL di bawah &mdash; batas honor dihitung per mitra
                                per bulan, jadi tiap mitra bisa berbeda.
                            </p>
                        )}

                        {opsiBulanPembebanan.length === 1 && (
                            <div className="text-sm text-muted-foreground">
                                Dibebankan pada bulan{' '}
                                <Badge variant="outline" className="font-medium">{opsiBulanPembebanan[0].label}</Badge>
                            </div>
                        )}
                    </div>
                    <div className="space-y-4">
                        {pplForStage.map((ppl, index) => {
                            const existingPplIdsForCurrentStage = pplForStage
                                .map(p => p.ppl_master_id)
                                .filter(id => id && id !== ppl.ppl_master_id) as string[];

                            return (
                                <PPLAllocationItem 
                                    key={ppl.clientId}
                                    tahap={tahap}
                                    opsiBulan={opsiBulanPembebanan}
                                    ppl={ppl}
                                    index={index}
                                    onRemove={mintaHapusPPL}
                                    onUpdate={updatePPL}
                                    setAlertModal={setAlertModal}
                                    pplList={pplList}
                                    pmlList={pmlList}
                                    honorariumSettings={formData.honorariumSettings!}
                                    existingPplIds={existingPplIdsForCurrentStage}
                                />
                            )
                        })}
                        <Button type="button" variant="outline" onClick={() => addPPL(tahap)} className="w-full border-dashed"><Plus className="w-4 h-4 mr-2"/>Tambah Alokasi PPL Manual</Button>
                    </div>
                    <ConfirmationModal
                        isOpen={showClearConfirmModal.isOpen && showClearConfirmModal.tahap === tahap}
                        onClose={() => setShowClearConfirmModal({isOpen: false, tahap: null})}
                        onConfirm={handleClearPPLs}
                        title="Hapus Semua PPL?"
                        description={`Anda akan menghapus semua (${pplForStage.length}) alokasi PPL di tahap ini. Aksi ini tidak dapat dibatalkan.`}
                        confirmLabel="Ya, Hapus Semua"
                        variant="danger"
                    />
                </CardContent>
            </Card>
        );
    };
    
    /**
     * Skeleton ditahan sampai formData BENAR-BENAR terisi, bukan sekadar sampai
     * permintaan selesai.
     *
     * Di antara keduanya ada satu render: data kegiatan sudah ada, skeleton
     * sudah hilang, tetapi efek hidrasi belum berjalan sehingga
     * `formData.ketua_tim_id` masih undefined. Pada render itu Radix Select
     * terpasang TANPA `value`, artinya dalam mode tak-terkendali — dan nilai
     * yang datang sesudahnya tidak lagi selalu ia ikuti. Gejalanya: kolom Ketua
     * Tim tampak kosong padahal datanya ada, dan sempat dikira ketua timnya
     * hilang.
     */
    if (isLoading || (initialData && !isInitialDataLoaded)) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
                        <div className="flex items-center gap-4 mb-8">
                            <Skeleton className="h-10 w-48" />
                            <Skeleton className="h-10 w-48" />
                        </div>
                        <Skeleton className="h-12 w-full mb-6" />
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-8 w-1/2" />
                                <Skeleton className="h-4 w-3/4 mt-2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-40 w-full" />
                            </CardContent>
                        </Card>
                </div>
            </Layout>
        );
    }
    if (isError) return <Layout><div>Gagal memuat data. Silakan coba lagi.</div></Layout>;

    // Gerbang hak akses. Sebelumnya halaman ini sama sekali tidak punya
    // pemeriksaan: `canEdit` di Dashboard hanya menyembunyikan tombolnya,
    // sehingga siapa pun bisa mengetik /edit-activity/66 dan mendapat form
    // yang berfungsi penuh — termasuk supervisor, yang tugasnya memeriksa,
    // bukan menyunting.
    if (initialData && !bolehMengedit) {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
                    <ShieldAlert className="w-12 h-12 mx-auto text-muted-foreground" />
                    <h1 className="text-2xl font-bold text-foreground">Tidak Punya Akses</h1>
                    <p className="text-muted-foreground">
                        Hanya admin, ketua tim yang bertanggung jawab, atau pembuat kegiatan
                        yang dapat menyunting <strong>{initialData.namaKegiatan}</strong>.
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                        <Button variant="outline" asChild>
                            <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Kembali ke Dashboard</Link>
                        </Button>
                        <Button asChild>
                            <Link to={`/view-documents/${initialData.id}`}>Lihat Dokumen</Link>
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto pb-12">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" asChild><Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Kembali ke Dashboard</Link></Button>
                    <h1 className="text-3xl font-bold">Edit Kegiatan</h1>
                </div>
                {showAutoPopulateMessage && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-800 dark:text-blue-300 text-sm"> ✅ {addedPPLCount} PPL telah ditambahkan ke Tahap {pplStageTab.replace('-', ' ')}.</p>
                </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(false); }} className="space-y-8">
                    <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="info-dasar">Info Dasar & Jadwal</TabsTrigger>
                            <TabsTrigger value="alokasi-ppl">Alokasi PPL</TabsTrigger>
                            <TabsTrigger value="dokumen">Dokumen</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="info-dasar" className="mt-6">
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader><CardTitle>Informasi Kegiatan</CardTitle><CardDescription>Perbarui detail dasar mengenai kegiatan.</CardDescription></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2"><Label htmlFor="namaKegiatan">Nama Kegiatan *</Label><Input id="namaKegiatan" value={formData.namaKegiatan || ''} onChange={(e) => handleFormFieldChange('namaKegiatan', e.target.value)} placeholder="Contoh: Sensus Penduduk 2024" /></div>
                                            <div className="space-y-2"><Label htmlFor="ketuaTim">Nama Ketua Tim *</Label>
                                                {/* `undefined`, bukan String(...): String(undefined) menghasilkan
                                                    teks "undefined" yang tidak cocok dengan item mana pun, sehingga
                                                    placeholder-nya tidak pernah muncul dan kolomnya tampak kosong
                                                    tanpa penjelasan. */}
                                                <Select value={formData.ketua_tim_id ? String(formData.ketua_tim_id) : undefined} onValueChange={(value) => handleFormFieldChange('ketua_tim_id', value)}>
                                                    <SelectTrigger id="ketuaTim" className={cn(ketuaTimTidakDikenal && "border-amber-400 dark:border-amber-700")}><SelectValue placeholder="Pilih ketua tim" /></SelectTrigger>
                                                    <SelectContent>{ketuaTimList.map((ketua) => (<SelectItem key={ketua.id} value={String(ketua.id)}>{ketua.namaKetua}</SelectItem>))}</SelectContent>
                                                </Select>
                                                {ketuaTimTidakDikenal && (
                                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                                        {pesanKetuaTimTidakDikenal(String(formData.ketua_tim_id))}
                                                    </p>
                                                )}
                                                {/* Tim mengikuti master ketua tim, diatur di Manajemen Admin. */}
                                                {timKetuaTerpilih && (
                                                    <p className="text-sm text-muted-foreground">Tim: <Badge variant="outline">{timKetuaTerpilih}</Badge></p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2"><Label htmlFor="deskripsiKegiatan">Deskripsi Kegiatan</Label><Textarea id="deskripsiKegiatan" value={formData.deskripsiKegiatan || ''} onChange={(e) => handleFormFieldChange('deskripsiKegiatan', e.target.value)} placeholder="Deskripsikan kegiatan dan pembagian tugas secara singkat." /></div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Jadwal Kegiatan *</CardTitle>
                                        <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:gap-6">
                                            <label className="flex items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={pengolahanAktif}
                                                    onCheckedChange={(v) => mintaUbahTahap('pengolahan-analisis', v === true)}
                                                />
                                                Ada tahap Pengolahan &amp; Analisis
                                            </label>
                                            <label className="flex items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={diseminasiAktif}
                                                    onCheckedChange={(v) => mintaUbahTahap('diseminasi-evaluasi', v === true)}
                                                />
                                                Ada tahap Diseminasi &amp; Evaluasi
                                            </label>
                                        </div>
                                        <p className="pt-1 text-xs text-muted-foreground">
                                            Matikan bila tahap itu dikerjakan provinsi atau pusat. Alokasi mitra
                                            Pengolahan tetap ada &mdash; pekerjaannya (entri dan cleaning)
                                            berlangsung di masa pendataan.
                                        </p>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        {jadwalTahap.map(({ label, mulai, selesai }) => (
                                            <div key={label} className="space-y-2">
                                                <Label>{label}</Label>
                                                <DateRangePicker
                                                    value={{ mulai: keTeksTanggal(formData[mulai]), selesai: keTeksTanggal(formData[selesai]) }}
                                                    onChange={(r) => ubahJadwalTahap(mulai, selesai, r)}
                                                    defaultMonth={formData[mulai] ?? formData.tanggalMulaiPersiapan}
                                                    placeholder="Pilih rentang..."
                                                />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                        <TabsContent value="alokasi-ppl" className="mt-6">
                            <Tabs value={pplStageTab} onValueChange={(val) => setPplStageTab(val as PPL['tahap'])}>
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="listing">Listing</TabsTrigger>
                                    <TabsTrigger value="pencacahan">Pencacahan</TabsTrigger>
                                    <TabsTrigger value="pengolahan-analisis">Pengolahan</TabsTrigger>
                                </TabsList>
                                <TabsContent value="listing" className="mt-4">
                                    <AlokasiPPLContent tahap="listing" title="Listing" setAlertModal={setAlertModal} />
                                </TabsContent>
                                <TabsContent value="pencacahan" className="mt-4">
                                    <AlokasiPPLContent tahap="pencacahan" title="Pencacahan" setAlertModal={setAlertModal} />
                                </TabsContent>
                                <TabsContent value="pengolahan-analisis" className="mt-4">
                                    <AlokasiPPLContent tahap="pengolahan-analisis" title="Pengolahan & Analisis" setAlertModal={setAlertModal} />
                                </TabsContent>
                            </Tabs>
                        </TabsContent>
                        <TabsContent value="dokumen" className="mt-6">
                            <Tabs value={docStageTab} onValueChange={(val) => setDocStageTab(val as TahapDokumen)}>
                                <TabsList className={cn("grid w-full", jumlahTahapDokumen === 4 ? "grid-cols-4" : jumlahTahapDokumen === 3 ? "grid-cols-3" : "grid-cols-2")}>
                                    <TabsTrigger value="persiapan">Persiapan</TabsTrigger>
                                    <TabsTrigger value="pengumpulan-data">Pengumpulan Data</TabsTrigger>
                                    {pengolahanAktif && <TabsTrigger value="pengolahan-analisis">Pengolahan</TabsTrigger>}
                                    {diseminasiAktif && <TabsTrigger value="diseminasi-evaluasi">Diseminasi</TabsTrigger>}
                                </TabsList>
                                <TabsContent value="persiapan" className="mt-4">
                                    <DokumenContent tipe="persiapan" title="Persiapan"
                                        dokumen={formData.dokumen || []}
                                        setFormData={setFormData}
                                        kegiatanId={Number(id)}
                                        onNoteClick={handleNoteClick} />
                                </TabsContent>
                                <TabsContent value="pengumpulan-data" className="mt-4">
                                    <DokumenContent tipe="pengumpulan-data" title="Pengumpulan Data"
                                        dokumen={formData.dokumen || []}
                                        setFormData={setFormData}
                                        kegiatanId={Number(id)}
                                        onNoteClick={handleNoteClick} />
                                </TabsContent>
                                {pengolahanAktif && (
                                <TabsContent value="pengolahan-analisis" className="mt-4">
                                    <DokumenContent tipe="pengolahan-analisis" title="Pengolahan & Analisis"
                                        dokumen={formData.dokumen || []}
                                        setFormData={setFormData}
                                        kegiatanId={Number(id)}
                                        onNoteClick={handleNoteClick} />
                                </TabsContent>
                                )}
                                {diseminasiAktif && (
                                <TabsContent value="diseminasi-evaluasi" className="mt-4">
                                    <DokumenContent tipe="diseminasi-evaluasi" title="Diseminasi & Evaluasi"
                                        dokumen={formData.dokumen || []}
                                        setFormData={setFormData}
                                        kegiatanId={Number(id)}
                                        onNoteClick={handleNoteClick} />
                                </TabsContent>
                                )}
                            </Tabs>
                        </TabsContent>
                    </Tabs>
                    
                    <div className="flex flex-wrap justify-center gap-3 mt-8">
                        {/* Di sebelah kiri Simpan, supaya urutannya terbaca
                            "batalkan atau simpan" — bukan tersembunyi di tempat lain. */}
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => setKonfirmasiBatal(true)}
                            disabled={mutation.isPending}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Batalkan Perubahan
                        </Button>
                        <Button
                            ref={submitButtonRef}
                            type="submit" 
                            disabled={mutation.isPending} 
                            className="min-w-48 bg-bps-green-600 hover:bg-bps-green-700" 
                            size="lg"
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Simpan Perubahan
                                </>
                            )}
                        </Button>
                    </div>
                </form>
                <SuccessModal 
                    isOpen={showSuccessModal} 
                    onClose={() => setShowSuccessModal(false)} 
                    onAction={() => navigate('/dashboard')} 
                    title="Kegiatan Berhasil Diperbarui!"
                    description={`Perubahan pada "${formData.namaKegiatan}" telah disimpan.`}
                    actionLabel="Ke Dashboard" 
                />
                {/* autoCloseDelay 0: aksi utamanya berpindah halaman, jadi
                    modal yang menutup sendiri akan menyeret pengguna ke
                    dashboard hanya karena ia berhenti membaca sebentar. */}
                <SuccessModal
                    isOpen={batalSukses}
                    onClose={() => setBatalSukses(false)}
                    title="Perubahan Dibatalkan"
                    description="Semua perubahan yang belum disimpan sudah dikembalikan ke data terakhir yang tersimpan."
                    closeLabel="Tetap di Halaman Edit"
                    actionLabel="Ke Dashboard"
                    onAction={() => navigate('/dashboard')}
                    autoCloseDelay={0}
                />
                <ConfirmationModal
                    isOpen={konfirmasiMatikanTahap !== null}
                    onClose={() => setKonfirmasiMatikanTahap(null)}
                    onConfirm={matikanTahap}
                    title="Matikan Tahap Ini?"
                    description={konfirmasiMatikanTahap
                        ? `${dokumenTahap(konfirmasiMatikanTahap).length} dokumen dan catatan pada tahap ${konfirmasiMatikanTahap.replace(/-/g, ' ')} akan DIHAPUS PERMANEN beserta link yang sudah diisi, dan jadwalnya dikosongkan. Penghapusan terjadi saat Anda menekan Simpan Perubahan. Alokasi mitra Pengolahan tidak ikut terhapus.`
                        : ''}
                    confirmLabel="Ya, Matikan"
                    cancelLabel="Batal"
                    variant="danger"
                    icon={<Trash2 className="w-6 h-6" />}
                />
                <ConfirmationModal
                    isOpen={konfirmasiHapusPPL !== null}
                    onClose={() => setKonfirmasiHapusPPL(null)}
                    onConfirm={() => {
                        if (konfirmasiHapusPPL) removePPL(konfirmasiHapusPPL);
                        setKonfirmasiHapusPPL(null);
                    }}
                    title="Hapus Alokasi PPL?"
                    description={`Alokasi ${namaPPLDikonfirmasi} beserta PML, beban kerja, dan honor yang sudah diisi akan dihapus dari daftar. Perubahan ini baru permanen setelah Anda menekan Simpan Perubahan.`}
                    confirmLabel="Ya, Hapus"
                    cancelLabel="Batal"
                    variant="danger"
                    icon={<Trash2 className="w-6 h-6" />}
                />
                <ConfirmationModal
                    isOpen={konfirmasiBatal}
                    onClose={() => setKonfirmasiBatal(false)}
                    onConfirm={batalkanPerubahan}
                    title="Batalkan Perubahan?"
                    description="Semua perubahan yang belum disimpan akan dibuang, dan form kembali seperti data terakhir yang tersimpan. Dokumen yang sudah disimpan lewat tombol Simpan pada masing-masing dokumen TIDAK ikut dibatalkan, karena sudah tercatat di server."
                    confirmLabel="Ya, Batalkan"
                    variant="warning"
                />
                <ConfirmationModal
                    isOpen={showHonorWarningModal}
                    onClose={() => setShowHonorWarningModal(false)}
                    onConfirm={() => {
                        setShowHonorWarningModal(false);
                        handleFormSubmit(true);
                    }}
                    title="Peringatan Batas Honor"
                    description={`Total honor untuk ${honorWarningDetails?.pplName} di bulan terpilih akan menjadi ${formatHonor(honorWarningDetails?.totalHonor || 0)}, melebihi batas ${formatHonor(honorWarningDetails?.limit || 0)}. Lanjutkan?`}
                    confirmLabel="Ya, Lanjutkan"
                    variant="warning"
                />
            </div>

            {/* Note Modal */}
            <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{currentNote?.id ? 'Edit Catatan' : 'Tambah Catatan Baru'}</DialogTitle>
                        <DialogDescription>
                           Tuliskan catatan atau informasi penting terkait tahap kegiatan ini. Klik simpan untuk menyimpan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Isi catatan di sini..."
                            value={currentNote?.nama || ''}
                            onChange={(e) =>
                                setCurrentNote(prev => prev ? { ...prev, nama: e.target.value } : null)
                            }
                            rows={8}
                            className="w-full"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>Batal</Button>
                        <Button onClick={handleSaveNote} disabled={!currentNote?.nama.trim()}>Simpan Catatan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertModal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ isOpen: false, title: "", message: "" })} title={alertModal.title} description={alertModal.message} />
        </Layout>
    );
}