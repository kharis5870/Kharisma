// client/pages/InputKegiatan.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import { periksaKelengkapanAlokasi, teksPeringatan, type KelompokPeringatan, type TahapAlokasi } from "@/lib/kelengkapanAlokasi";
import ConfirmationModal from "@/components/ConfirmationModal";
import PilihPembebananHonor from "@/components/PilihPembebananHonor";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Link2, X, Lock, Users, XCircle, ChevronsUpDown, Check, Loader2, History, Search, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useInputKegiatanStore, { HonorariumSettings, TahapHonor } from "@/stores/useInputKegiatanStore";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { bulanDalamRentang, keTeksTanggal, keTanggal, pembebananBelumLengkap, labelRentang } from "@/lib/honorPeriode";
import { Badge } from "@/components/ui/badge";
import { PPLMaster, KetuaTim, Kegiatan, UserData, PPL, HonorariumDetail, Dokumen } from "@shared/api";
import { periksaTautan } from "@shared/tautanDokumen";
import AlertModal from "@/components/AlertModal";
import { apiClient } from "@/lib/apiClient";

type DateFieldName =
  | 'tanggalMulaiPersiapan' | 'tanggalSelesaiPersiapan'
  | 'tanggalMulaiPengumpulanData' | 'tanggalSelesaiPengumpulanData'
  | 'tanggalMulaiPengolahanAnalisis' | 'tanggalSelesaiPengolahanAnalisis'
  | 'tanggalMulaiDiseminasiEvaluasi' | 'tanggalSelesaiDiseminasiEvaluasi';

// formatHonor/parseHonor kini dipakai bersama dari @/lib/angka - sebelumnya
// disalin identik di sini dan di EditActivity.tsx.
import { formatHonor, parseHonor, sanitizeJumlah, parseHonorNumber } from "@/lib/angka";


const createActivity = async (data: any): Promise<Kegiatan> => {
    return apiClient.post<Kegiatan>('/kegiatan', data);
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

const PPLAllocationItem = React.memo(({ ppl, index, onRemove, pmlList, pplList, store, existingPplIds, tahap, opsiBulan }: any) => {
    const { updatePPL, updatePPLBebanKerja } = store.getState();
    const [openPPL, setOpenPPL] = useState(false);
    const [openPML, setOpenPML] = useState(false);
    
    const honorDetail = ppl.honorarium[0];
    const jenisPekerjaan = honorDetail.jenis_pekerjaan;
    
    const [localBebanKerja, setLocalBebanKerja] = useState(honorDetail.bebanKerja);

    useEffect(() => {
        setLocalBebanKerja(honorDetail.bebanKerja);
    }, [honorDetail.bebanKerja]);

    const handleBebanKerjaBlur = () => {
        updatePPLBebanKerja(ppl.id, jenisPekerjaan, localBebanKerja);
    };

    const totalHonorPPL = ppl.honorarium?.reduce((sum: number, h: HonorariumDetail) => sum + parseInt(h.besaranHonor || '0'), 0) || 0;
    const selectedPML = pmlList.find((pml: UserData) => pml.namaLengkap === ppl.namaPML);
    const selectedPPL = pplList.find((p: PPLMaster) => String(p.id) === ppl.ppl_master_id);
    
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
                    onClick={onRemove}
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
                                <Button variant="outline" role="combobox" aria-expanded={openPPL} className="w-full justify-between">
                                    {selectedPPL ? selectedPPL.namaPPL : "Pilih PPL..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Cari PPL..." />
                                    <CommandEmpty>PPL tidak ditemukan atau sudah dialokasikan.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandList>
                                            {availablePplList.map((p: PPLMaster) => (
                                                <CommandItem key={p.id} value={`${p.id} ${p.namaPPL}`} onSelect={() => {
                                                    updatePPL(ppl.id, 'ppl_master_id', String(p.id));
                                                    updatePPL(ppl.id, 'namaPPL', p.namaPPL);
                                                    setOpenPPL(false);
                                                }}>
                                                    <Check className={cn("mr-2 h-4 w-4", ppl.ppl_master_id === String(p.id) ? "opacity-100" : "opacity-0")} />
                                                    <div className="flex flex-col">
                                                        <span>{p.namaPPL}</span>
                                                        <span className="text-xs text-muted-foreground">ID: {p.id}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandList>
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                         <Label>Nama PML *</Label>
                            <Popover open={openPML} onOpenChange={setOpenPML}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" aria-expanded={openPML} className="w-full justify-between">
                                        {selectedPML ? `${selectedPML.namaLengkap}` : "Pilih PML..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari PML..." />
                                        <CommandEmpty>PML tidak ditemukan.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandList>
                                                {pmlList.map((pml: UserData) => (
                                                    <CommandItem key={pml.id} value={`${pml.id} ${pml.namaLengkap}`} onSelect={() => {
                                                        updatePPL(ppl.id, 'namaPML', pml.namaLengkap);
                                                        updatePPL(ppl.id, 'pml_id', pml.id);  
                                                        setOpenPML(false);
                                                    }}>
                                                        <Check className={cn("mr-2 h-4 w-4", String(ppl.pml_id) === String(pml.id) ? "opacity-100" : "opacity-0")} />
                                                        <div className="flex flex-col">
                                                            <span>{pml.namaLengkap}</span>
                                                            <span className="text-xs text-muted-foreground">ID: {pml.id}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandList>
                                        </CommandGroup>
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
                            updatePPL(ppl.id, 'metodePembebanan', metode);
                            updatePPL(ppl.id, 'bulanPembebananDipilih', bulan);
                        }}
                    />
                </div>
            </div>
        </div>
    );
});

const AlokasiPPLContent = ({ tahap, title }: { tahap: PPL['tahap'], title: string }) => {
    const store = useInputKegiatanStore();
    
    // Nama kolom di store/DB memakai akhiran "Pengolahan", sedangkan tahap
    // di sisi PPL bernama "pengolahan-analisis".
    const tahapHonor: TahapHonor =
        tahap === 'listing' ? 'Listing' : tahap === 'pencacahan' ? 'Pencacahan' : 'Pengolahan';

    const rentangHonor = {
        mulai: store[`tanggalMulaiHonor${tahapHonor}`],
        selesai: store[`tanggalSelesaiHonor${tahapHonor}`],
    };

    // Rentang honor memang boleh berbeda dari jadwal pendataan, tapi yang jauh
    // lebih sering terjadi adalah salah pilih tanggal. Diberi tanda kuning.
    const mulaiPendataan = keTeksTanggal(store.tanggalMulaiPengumpulanData);
    const selesaiPendataan = keTeksTanggal(store.tanggalSelesaiPengumpulanData);
    const bedaDenganPendataan = Boolean(
        rentangHonor.mulai && rentangHonor.selesai && mulaiPendataan && selesaiPendataan
        && (rentangHonor.mulai !== mulaiPendataan || rentangHonor.selesai !== selesaiPendataan));

    // Kalau rentang menyentuh lebih dari satu bulan, pengguna harus memilih
    // salah satunya sebagai bulan pembebanan: HONOR_LIMIT berlaku per bulan,
    // jadi honor tidak boleh dihitung di dua bulan sekaligus.
    const opsiBulanPembebanan = useMemo(
        () => bulanDalamRentang(rentangHonor.mulai, rentangHonor.selesai),
        [rentangHonor.mulai, rentangHonor.selesai],
    );

    const pplForStage = store.pplAllocations.filter(p => p.tahap === tahap);
    const storeActions = useInputKegiatanStore.getState();

    const { data: pplList = [] } = useQuery({ queryKey: ['pplMaster'], queryFn: fetchPPLs });
    const { data: pmlList = [] } = useQuery({ queryKey: ['pmls'], queryFn: fetchPMLs });
    const [showClearConfirmModal, setShowClearConfirmModal] = useState<{isOpen: boolean; tahap: PPL['tahap'] | null}>({isOpen: false, tahap: null});
    /**
     * Alokasi PPL yang menunggu konfirmasi hapus; null = tidak ada.
     *
     * Satu kartu alokasi memuat PPL, PML, beban kerja, dan honor yang sudah
     * diketik, dan tidak ada urungkan — salah klik berarti mengetik ulang
     * semuanya. Namanya ikut disimpan supaya dialognya bisa menyebut kartu
     * mana yang akan hilang; di tahap yang ramai, kartunya mirip semua.
     */
    const [konfirmasiHapusPPL, setKonfirmasiHapusPPL] = useState<{ id: string; nama: string } | null>(null);
    
    const honorSettings = store.honorariumSettings;
    
    const getHonorSettingsKey = (): keyof typeof honorSettings | null => {
        if (tahap === 'listing') return 'pengumpulan-data-listing';
        if (tahap === 'pencacahan') return 'pengumpulan-data-pencacahan';
        if (tahap === 'pengolahan-analisis') return 'pengolahan-analisis';
        return null;
    }
    const honorSettingKey = getHonorSettingsKey();

    const handleClearPPLs = () => {
       storeActions.clearPPLsByTahap(tahap);
       setShowClearConfirmModal({isOpen: false, tahap: null});
    }

    // FIX: Menambahkan tipe eksplisit untuk 'field'
    /**
     * Pengaturan honor langsung disetor ke store setiap diketik, sama seperti
     * di Edit Kegiatan. `updateHonorariumSetting` sekaligus menghitung ulang
     * honor setiap alokasi, jadi total honor mitra di bawahnya ikut berubah
     * seketika — tidak lagi menunggu kotaknya ditinggalkan.
     */
    const handleSettingChange = (field: keyof HonorariumSettings, value: string) => {
        if (!honorSettingKey) return;
        storeActions.updateHonorariumSetting(honorSettingKey, field, value);
    };

    // FIX: Menambahkan tipe eksplisit untuk 'field'
    


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
                           <Link 
                               to="/daftar-ppl"
                               state={{ 
                                   from: 'input-kegiatan',
                                   tahap: tahap,
                                   existingPplIds: pplForStage.map(p => p.ppl_master_id).filter(Boolean)
                               }}
                           >
                               <Users className="w-4 h-4 mr-2" />
                               Pilih dari Daftar PPL
                           </Link>
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
                            <Input placeholder="Contoh: Dokumen" value={honorSettingKey ? honorSettings[honorSettingKey].satuanBebanKerja : ''} onChange={e => handleSettingChange('satuanBebanKerja', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Harga per Satuan (Rp)</Label>
                            <Input placeholder="Contoh: 15000" value={honorSettingKey ? formatHonor(honorSettings[honorSettingKey].hargaSatuan) : ''} onChange={e => handleSettingChange('hargaSatuan', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                           <Label>Rentang Tanggal Honor *</Label>
                           <DateRangePicker
                               value={rentangHonor}
                               onChange={({ mulai, selesai }) => storeActions.setRentangHonor(tahapHonor, mulai, selesai)}
                               defaultMonth={store.tanggalMulaiPersiapan}
                               placeholder="Pilih rentang..."
                           />
                            {bedaDenganPendataan && (
                                <p className="text-xs text-amber-700 dark:text-amber-300">
                                    Berbeda dengan jadwal pendataan ({labelRentang(mulaiPendataan, selesaiPendataan)}).
                                    Pastikan ini disengaja, bukan salah pilih tanggal.
                                </p>
                            )}
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
                               key={ppl.id} 
                               tahap={tahap}
                               opsiBulan={opsiBulanPembebanan}
                               ppl={ppl} 
                               index={index} 
                               onRemove={() => setKonfirmasiHapusPPL({ id: ppl.id, nama: ppl.namaPPL || '' })} 
                               pmlList={pmlList} 
                               pplList={pplList} 
                               store={useInputKegiatanStore} 
                               existingPplIds={existingPplIdsForCurrentStage}
                           />
                       );
                    })}
                    <Button type="button" variant="outline" onClick={() => storeActions.addPPL(tahap)} className="w-full border-dashed"><Plus className="w-4 h-4 mr-2"/>Tambah Alokasi PPL Manual</Button>
                </div>
                <ConfirmationModal
                   isOpen={konfirmasiHapusPPL !== null}
                   onClose={() => setKonfirmasiHapusPPL(null)}
                   onConfirm={() => {
                       if (konfirmasiHapusPPL) storeActions.removePPL(konfirmasiHapusPPL.id);
                       setKonfirmasiHapusPPL(null);
                   }}
                   title="Hapus Alokasi PPL?"
                   description={`Alokasi ${konfirmasiHapusPPL?.nama || 'ini'} beserta PML, beban kerja, dan honor yang sudah diisi akan dihapus dari daftar.`}
                   confirmLabel="Ya, Hapus"
                   cancelLabel="Batal"
                   variant="danger"
                   icon={<Trash2 className="w-6 h-6" />}
                />
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
 * Dokumen dan catatan satu tahap.
 *
 * "Tambah Catatan" dulu hanya ada di Edit Kegiatan, sehingga catatan tahap baru
 * bisa ditulis SETELAH kegiatannya tersimpan. Sekarang disamakan: catatan bisa
 * langsung ditulis saat kegiatan dibuat, dan tampil paling atas seperti di
 * halaman Edit.
 */
const DokumenContent = ({ tipe, title }: { tipe: Dokumen['tipe'], title: string }) => {
    const documents = useInputKegiatanStore(state => state.documents.filter(d => d.tipe === tipe));
    const { addDocumentLink, addCatatan, removeDocument, updateDocument } = useInputKegiatanStore.getState();
    const catatan = documents.filter(d => d.jenis === 'catatan');
    const dokumen = documents.filter(d => d.jenis !== 'catatan');

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle>Dokumen {title}</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => addCatatan(tipe)} className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />Tambah Catatan
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => addDocumentLink(tipe)} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />Tambah Dokumen Pendukung
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {catatan.map(doc => (
                    <div key={doc.id} className="flex items-start gap-3 p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/40">
                        <MessageSquare className="w-5 h-5 text-yellow-700 dark:text-yellow-300 mt-1 flex-shrink-0" />
                        <div className="flex-grow space-y-1">
                            <Label className="font-semibold text-yellow-800 dark:text-yellow-300">Catatan</Label>
                            <Textarea
                                placeholder="Tulis catatan untuk tahap ini..."
                                value={doc.nama}
                                rows={3}
                                onChange={(e) => updateDocument(doc.id, 'nama', e.target.value)}
                            />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(doc.id)} title="Hapus Catatan">
                            <X className="w-4 h-4 text-muted-foreground"/>
                        </Button>
                    </div>
                ))}
                {dokumen.map(doc => (
                    <div key={doc.id} className={cn("flex items-center gap-3 p-3 border rounded-lg", doc.isWajib ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" : "bg-muted/50")}>
                        <div className="flex-grow space-y-2">
                            {doc.isWajib ? <Label className="font-semibold">{doc.nama}</Label> : <Input placeholder="Nama Dokumen Pendukung" value={doc.nama} onChange={(e) => updateDocument(doc.id, 'nama', e.target.value)} />}
                            <div className="flex items-center gap-2">
                                <Link2 className="w-4 h-4 text-muted-foreground"/>
                                <Input placeholder="https://drive.google.com/..." value={doc.link} onChange={(e) => updateDocument(doc.id, 'link', e.target.value)} />
                            </div>
                        </div>
                        {!doc.isWajib ? (<Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(doc.id)} className="self-center"><X className="w-4 h-4 text-muted-foreground"/></Button>) : (<div className="self-center p-2" title="Dokumen Wajib"><Lock className="w-4 h-4 text-muted-foreground"/></div>)}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default function InputKegiatan() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: ketuaTimList = [] } = useQuery({ queryKey: ['ketuaTim'], queryFn: fetchKetuaTim });
    const location = useLocation();
    
    const [mainTab, setMainTab] = useState("info-dasar");
    const [pplStageTab, setPplStageTab] = useState<PPL['tahap']>("listing");
    const [docStageTab, setDocStageTab] = useState<Dokumen['tipe']>("persiapan");

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastActivityName, setLastActivityName] = useState("");
    /** Kegiatan yang baru saja dibuat, selama modal sukses masih terbuka. */
    const [kegiatanBaru, setKegiatanBaru] = useState<{ id: number } | null>(null);
    const [sedangMengurungkan, setSedangMengurungkan] = useState(false);
    /** Peringatan kelengkapan alokasi yang menunggu konfirmasi "Tetap Simpan". */
    const [peringatanKelengkapan, setPeringatanKelengkapan] = useState<{ daftar: KelompokPeringatan[]; bypassHonorLimit: boolean } | null>(null);
    const [showAutoPopulateMessage, setShowAutoPopulateMessage] = useState(false);
    const [addedPPLCount, setAddedPPLCount] = useState(0);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "" });
    
    const store = useInputKegiatanStore();

    /**
     * Jadwal per tahap kini satu pemilih RENTANG, bukan dua pemilih tanggal
     * tunggal — konsisten dengan Rentang Tanggal Honor: klik pertama tanggal
     * mulai, klik kedua tanggal selesai.
     */
    const jadwalTahap = [
        { label: 'Persiapan', mulai: 'tanggalMulaiPersiapan', selesai: 'tanggalSelesaiPersiapan' },
        { label: 'Pengumpulan Data', mulai: 'tanggalMulaiPengumpulanData', selesai: 'tanggalSelesaiPengumpulanData' },
        ...(store.adaPengolahan ? [{ label: 'Pengolahan & Analisis', mulai: 'tanggalMulaiPengolahanAnalisis', selesai: 'tanggalSelesaiPengolahanAnalisis' }] : []),
        ...(store.adaDiseminasi ? [{ label: 'Diseminasi & Evaluasi', mulai: 'tanggalMulaiDiseminasiEvaluasi', selesai: 'tanggalSelesaiDiseminasiEvaluasi' }] : []),
    ] as { label: string; mulai: DateFieldName; selesai: DateFieldName }[];

    const storeActions = useInputKegiatanStore.getState();

    const jumlahTahapDokumen = 2 + (store.adaPengolahan ? 1 : 0) + (store.adaDiseminasi ? 1 : 0);
    // Tab yang sedang dibuka bisa lenyap saat tahapnya dimatikan. Tanpa ini,
    // Radix kehilangan tab aktifnya dan isi tab dokumen jadi kosong sama sekali.
    useEffect(() => {
        if (docStageTab === 'pengolahan-analisis' && !store.adaPengolahan) setDocStageTab('persiapan');
        if (docStageTab === 'diseminasi-evaluasi' && !store.adaDiseminasi) setDocStageTab('persiapan');
    }, [docStageTab, store.adaPengolahan, store.adaDiseminasi]);

    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [historyLoadedName, setHistoryLoadedName] = useState<string | null>(null);
    const [historySearch, setHistorySearch] = useState("");
    const [loadingHistoryId, setLoadingHistoryId] = useState<number | null>(null);

    // Daftar kegiatan untuk dipilih sebagai sumber salinan. Query ini sudah
    // dipakai dashboard, jadi biasanya sudah ada di cache react-query.
    const { data: riwayatKegiatan = [] } = useQuery({
        queryKey: ['kegiatan'],
        queryFn: () => apiClient.get<Kegiatan[]>('/kegiatan'),
        enabled: showHistoryDialog,
    });

    const riwayatTersaring = useMemo(() => {
        const kata = historySearch.toLowerCase();
        return riwayatKegiatan.filter(k => k.namaKegiatan.toLowerCase().includes(kata));
    }, [riwayatKegiatan, historySearch]);

    // Daftar kegiatan tidak memuat relasi lengkap, jadi detailnya diambil dulu
    // supaya alokasi PPL dan dokumen ikut tersalin.
    const handlePilihHistoris = async (kegiatanId: number) => {
        setLoadingHistoryId(kegiatanId);
        try {
            const detail = await apiClient.get<Kegiatan>(`/kegiatan/${kegiatanId}`);
            store.loadFromHistory(detail);
            setHistoryLoadedName(detail.namaKegiatan);
            setShowHistoryDialog(false);
            setHistorySearch("");
            setMainTab("info-dasar");
        } catch (error: any) {
            setAlertModal({ isOpen: true, title: "Gagal Mengambil Data", message: error.message });
        } finally {
            setLoadingHistoryId(null);
        }
    };

    // Tim melekat pada master ketua tim, jadi cukup ditampilkan (read-only)
    // begitu ketua tim dipilih — tidak perlu diinput ulang per kegiatan.
    const timKetuaTerpilih = useMemo(
        () => ketuaTimList.find(k => String(k.id) === String(store.ketua_tim_id))?.tim,
        [ketuaTimList, store.ketua_tim_id],
    );

    useEffect(() => {
     const { newPpls, tahap, from } = location.state || {};
     if (from === 'daftar-ppl' && newPpls && tahap) {
       const currentPplsInStage = store.pplAllocations.filter(p => p.tahap === tahap);
       const newPplsToAdd = newPpls.filter(
         (newPpl: PPLMaster) => !currentPplsInStage.some(
           (existingPpl: any) => existingPpl.ppl_master_id === String(newPpl.id)
         )
       );
       if (newPplsToAdd.length > 0) {
         store.addBulkPPLs(newPplsToAdd, tahap);
         setAddedPPLCount(newPplsToAdd.length);
         setShowAutoPopulateMessage(true);
         setTimeout(() => setShowAutoPopulateMessage(false), 5000);
       }
       setMainTab('alokasi-ppl');
       setPplStageTab(tahap);
       window.history.replaceState({}, document.title);
     } else if (from === 'batal-pilih' && tahap) {
       setMainTab('alokasi-ppl');
       setPplStageTab(tahap);
       window.history.replaceState({}, document.title);
     }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state, navigate]);

   const validateDates = (): string | null => {
       const {
           tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
           tanggalMulaiPengumpulanData, tanggalSelesaiPengumpulanData,
           tanggalMulaiPengolahanAnalisis, tanggalSelesaiPengolahanAnalisis,
           tanggalMulaiDiseminasiEvaluasi, tanggalSelesaiDiseminasiEvaluasi
       } = store;
   
       const stages = [
        // Tahap yang dimatikan dikeluarkan dari pemeriksaan urutan. Tanggalnya
        // masih tersimpan di state (server yang mengosongkannya saat disimpan),
        // jadi tanpa penyaringan ini jadwal tahap yang sudah dinyatakan tidak
        // ada bisa menolak penyimpanan.
           { start: tanggalMulaiPersiapan, end: tanggalSelesaiPersiapan, name: 'Persiapan' },
           { start: tanggalMulaiPengumpulanData, end: tanggalSelesaiPengumpulanData, name: 'Pengumpulan Data' },
           ...(store.adaPengolahan ? [{ start: tanggalMulaiPengolahanAnalisis, end: tanggalSelesaiPengolahanAnalisis, name: 'Pengolahan & Analisis' }] : []),
           ...(store.adaDiseminasi ? [{ start: tanggalMulaiDiseminasiEvaluasi, end: tanggalSelesaiDiseminasiEvaluasi, name: 'Diseminasi & Evaluasi' }] : []),
          ];
   
       for (let i = 0; i < stages.length; i++) {
           const stage = stages[i];
           
           if (stage.start && stage.end && stage.start > stage.end) {
               return `Jadwal ${stage.name} tidak valid: Tanggal selesai tidak boleh sebelum tanggal mulai.`;
           }
   
           if (i > 0) {
               const prevStage = stages[i-1];
               if (prevStage.start && stage.start && stage.start < prevStage.start) {
                   return `Urutan jadwal tidak valid: Tahap ${stage.name} tidak boleh dimulai sebelum tahap ${prevStage.name} dimulai.`;
               }
           }
       }
   
       return null;
   };

   const mutation = useMutation({
     mutationFn: createActivity,
     // Form sengaja TIDAK dikosongkan di sini. Selama modal sukses terbuka,
     // pengguna masih bisa menekan "Batal Simpan Kegiatan"; kalau form sudah
     // kosong, membatalkan berarti kehilangan seluruh isian. Pengosongan
     // dipindah ke saat benar-benar dialihkan ke Dashboard.
     onSuccess: (dibuat: Kegiatan) => {
       queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
       setKegiatanBaru(dibuat && dibuat.id ? { id: dibuat.id } : null);
       setShowSuccessModal(true);
     },
     onError: (error: any) => {
      // Cek apakah error memiliki struktur yang kita harapkan dari server
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        const errorDetails = errorData.details;

        // Jika ada 'details' dan kodenya sesuai, tampilkan modal konfirmasi
        if (errorDetails && errorDetails.code === 'HONOR_LIMIT_EXCEEDED') {
            const pplWithError = store.pplAllocations.find(p => p.ppl_master_id === errorDetails.ppl_master_id);
            
            setHonorWarningDetails({
                pplName: pplWithError?.namaPPL || 'salah satu PPL',
                totalHonor: errorDetails.projectedTotal,
                limit: errorDetails.limit
            });
            setShowHonorWarningModal(true);
            return; // <-- PENTING: Hentikan eksekusi di sini agar modal error tidak muncul
        }
      }
      
      // Jika errornya bukan soal honor, atau strukturnya berbeda, tampilkan modal error umum
      setAlertModal({ 
        isOpen: true, 
        title: "Gagal Menyimpan", 
        message: `Terjadi kesalahan: ${error.response?.data?.message || error.message}` 
      });
   }
    });

   const isFormIncomplete = (): boolean => {
     const {
       namaKegiatan, ketua_tim_id,
       tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
     } = store;
     if (!namaKegiatan || !ketua_tim_id || !tanggalMulaiPersiapan || !tanggalSelesaiPersiapan) return true;

     // Setiap tahap yang punya alokasi mitra wajib punya rentang honor lengkap,
     // dan — bila rentangnya melintasi lebih dari satu bulan — setiap alokasi
     // wajib sudah ditentukan cara pembebanannya. Tanpa itu, HONOR_LIMIT tidak
     // bisa dinilai dan honornya tidak muncul di rekap mana pun.
     const tahapTerpakai: { tahap: PPL['tahap']; kolom: TahapHonor }[] = [
       { tahap: 'listing', kolom: 'Listing' },
       { tahap: 'pencacahan', kolom: 'Pencacahan' },
       { tahap: 'pengolahan-analisis', kolom: 'Pengolahan' },
     ];
     return tahapTerpakai.some(({ tahap, kolom }) => {
       const adaMitra = store.pplAllocations.some(p => p.tahap === tahap && p.ppl_master_id);
       if (!adaMitra) return false;
       const mulai = store[`tanggalMulaiHonor${kolom}`];
       const selesai = store[`tanggalSelesaiHonor${kolom}`];
       if (!mulai || !selesai) return true;
       // Dulu di sini diperiksa `bulanHonor${kolom}`. Sejak bulan pembebanan
       // dipilih PER ALOKASI, kolom tahap itu memang dibiarkan kosong untuk
       // periode lintas bulan — memeriksanya akan membuat kegiatan seperti itu
       // tidak pernah bisa disimpan.
       return pembebananBelumLengkap(
         bulanDalamRentang(mulai, selesai),
         store.pplAllocations.filter(p => p.tahap === tahap && p.ppl_master_id));
     });
   };
   
   const [showHonorWarningModal, setShowHonorWarningModal] = useState(false);
   const [honorWarningDetails, setHonorWarningDetails] = useState<{ pplName: string; totalHonor: number; limit: number } | null>(null);

   const handleFormSubmit = (bypassHonorLimit = false, lewatiKelengkapan = false) => {
        const dateError = validateDates();
        if (dateError) {
            setAlertModal({ isOpen: true, title: "Kesalahan Jadwal Kegiatan", message: dateError });
            return;
        }

        // Jalur pembuatan kegiatan memasukkan seluruh dokumennya sekaligus,
        // jadi ia perlu penjagaan sendiri di samping tombol simpan per-dokumen
        // di halaman Edit Kegiatan.
        const dokumenBermasalah = store.documents
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

        setLastActivityName(store.namaKegiatan);

        const formatDateForSubmission = (date: Date | undefined) => {
            if (!date) return undefined;
            return isValid(date) ? date.toISOString() : undefined;
        };
        
        const dataToSubmit = {
          // Pembuat kegiatan TIDAK dikirim: server mengambilnya dari token sesi.
          namaKegiatan: store.namaKegiatan,
          ketua_tim_id: store.ketua_tim_id,
          deskripsiKegiatan: store.deskripsiKegiatan,
          adaListing: store.adaListing,
          adaPengolahan: store.adaPengolahan,
          adaDiseminasi: store.adaDiseminasi,
          isFasih: store.isFasih,
          ppl: store.pplAllocations,
          // Catatan yang dibiarkan kosong tidak ikut disimpan.
          documents: store.documents.filter(d => d.jenis !== 'catatan' || d.nama.trim() !== ''),
          honorariumSettings: {
              'pengumpulan-data-listing': {
                  satuanBebanKerja: store.honorariumSettings['pengumpulan-data-listing'].satuanBebanKerja,
                  hargaSatuan: parseHonor(store.honorariumSettings['pengumpulan-data-listing'].hargaSatuan),
              },
              'pengumpulan-data-pencacahan': {
                  satuanBebanKerja: store.honorariumSettings['pengumpulan-data-pencacahan'].satuanBebanKerja,
                  hargaSatuan: parseHonor(store.honorariumSettings['pengumpulan-data-pencacahan'].hargaSatuan),
              },
              'pengolahan-analisis': {
                  satuanBebanKerja: store.honorariumSettings['pengolahan-analisis'].satuanBebanKerja,
                  hargaSatuan: parseHonor(store.honorariumSettings['pengolahan-analisis'].hargaSatuan),
              },
          },
          tanggalMulaiPersiapan: formatDateForSubmission(store.tanggalMulaiPersiapan),
          tanggalSelesaiPersiapan: formatDateForSubmission(store.tanggalSelesaiPersiapan),
          tanggalMulaiPengumpulanData: formatDateForSubmission(store.tanggalMulaiPengumpulanData),
          tanggalSelesaiPengumpulanData: formatDateForSubmission(store.tanggalSelesaiPengumpulanData),
          tanggalMulaiPengolahanAnalisis: formatDateForSubmission(store.tanggalMulaiPengolahanAnalisis),
          tanggalSelesaiPengolahanAnalisis: formatDateForSubmission(store.tanggalSelesaiPengolahanAnalisis),
          tanggalMulaiDiseminasiEvaluasi: formatDateForSubmission(store.tanggalMulaiDiseminasiEvaluasi),
          tanggalSelesaiDiseminasiEvaluasi: formatDateForSubmission(store.tanggalSelesaiDiseminasiEvaluasi),
          bulanHonorListing: store.bulanHonorListing,
          bulanHonorPencacahan: store.bulanHonorPencacahan,
          bulanHonorPengolahan: store.bulanHonorPengolahan,
          tanggalMulaiHonorListing: store.tanggalMulaiHonorListing,
          tanggalSelesaiHonorListing: store.tanggalSelesaiHonorListing,
          tanggalMulaiHonorPencacahan: store.tanggalMulaiHonorPencacahan,
          tanggalSelesaiHonorPencacahan: store.tanggalSelesaiHonorPencacahan,
          tanggalMulaiHonorPengolahan: store.tanggalMulaiHonorPengolahan,
          tanggalSelesaiHonorPengolahan: store.tanggalSelesaiHonorPengolahan,
          bypassHonorLimit: bypassHonorLimit
        };


        // Peringatan, bukan larangan: kegiatan boleh disimpan setengah jadi, tapi
        // beban kerja 0, mitra tanpa PML, atau pengaturan honor yang kosong hampir
        // selalu berarti lupa. Aturannya ada di kelengkapanAlokasi.ts.
        if (!lewatiKelengkapan) {
            const kunciHonor = { 'listing': ['pengumpulan-data-listing', 'Listing'], 'pencacahan': ['pengumpulan-data-pencacahan', 'Pencacahan'], 'pengolahan-analisis': ['pengolahan-analisis', 'Pengolahan'] } as const;
            const peringatan = periksaKelengkapanAlokasi(
                store.pplAllocations.map(ppl => ({
                    tahap: ppl.tahap as TahapAlokasi,
                    nama: ppl.namaPPL,
                    adaMitra: !!ppl.ppl_master_id,
                    bebanKerja: parseHonorNumber(ppl.honorarium?.[0]?.bebanKerja ?? 0),
                    adaPml: !!ppl.pml_id,
                })),
                (Object.keys(kunciHonor) as TahapAlokasi[]).map(t => {
                    const [kunci, kolom] = kunciHonor[t];
                    const atur = store.honorariumSettings[kunci];
                    return {
                        tahap: t,
                        satuanBebanKerja: atur?.satuanBebanKerja,
                        hargaSatuan: parseHonorNumber(atur?.hargaSatuan ?? 0),
                        adaRentang: Boolean(store[`tanggalMulaiHonor${kolom}`] && store[`tanggalSelesaiHonor${kolom}`]),
                    };
                }),
            );
            if (peringatan.length > 0) {
                setPeringatanKelengkapan({ daftar: peringatan, bypassHonorLimit });
                return;
            }
        }
        mutation.mutate(dataToSubmit);
    };

   const handleSuccessAction = () => {
     store.resetForm();
     setHistoryLoadedName(null);
     setKegiatanBaru(null);
     navigate('/dashboard');
   };

   /**
    * "Batal Simpan Kegiatan": kegiatan yang baru dibuat dihapus lagi lewat
    * pintu khusus di server (hanya pembuatnya, hanya sesaat setelah dibuat),
    * lalu pengguna tetap di halaman ini dengan isian form masih utuh.
    */
   const urungkanSimpan = async () => {
     if (!kegiatanBaru || sedangMengurungkan) return;
     setSedangMengurungkan(true);
     try {
       await apiClient.delete(`/kegiatan/${kegiatanBaru.id}/urungkan`);
       queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
       setShowSuccessModal(false);
       setKegiatanBaru(null);
       setAlertModal({
         isOpen: true,
         title: 'Penyimpanan Dibatalkan',
         message: `Kegiatan "${lastActivityName}" batal disimpan. Isian form masih utuh, silakan periksa lalu simpan lagi.`,
       });
     } catch (error: any) {
       setShowSuccessModal(false);
       setAlertModal({ isOpen: true, title: 'Gagal Membatalkan', message: error.message });
     } finally {
       setSedangMengurungkan(false);
     }
   };

   return (
     <Layout>
       <div className="max-w-4xl mx-auto pb-12">
         <div className="mb-8">
           <div className="flex items-start justify-between gap-4">
             <div>
               <h1 className="text-3xl font-bold text-foreground mb-2">Input Kegiatan</h1>
               <p className="text-muted-foreground">Lengkapi semua informasi kegiatan dalam satu halaman</p>
             </div>
             <Button type="button" variant="outline" onClick={() => setShowHistoryDialog(true)}>
               <History className="w-4 h-4 mr-2" />
               Ambil dari Historis
             </Button>
           </div>
           {historyLoadedName && (
               <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg">
                   <p className="text-green-800 dark:text-green-300 text-sm">
                       ✅ Data disalin dari <strong>{historyLoadedName}</strong>. Tanggal dan isi link dokumen sengaja
                       dikosongkan — silakan lengkapi, semua masih bisa diubah sebelum disimpan.
                   </p>
               </div>
           )}
           {showAutoPopulateMessage && (
               <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg">
                   <p className="text-blue-800 dark:text-blue-300 text-sm">✅ {addedPPLCount} PPL telah ditambahkan ke Tahap {pplStageTab.replace('-', ' ')}.</p>
               </div>
           )}
         </div>
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
                         <CardHeader><CardTitle>Informasi Kegiatan</CardTitle><CardDescription>Masukkan detail dasar mengenai kegiatan.</CardDescription></CardHeader>
                         <CardContent className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="space-y-2"><Label htmlFor="namaKegiatan">Nama Kegiatan *</Label><Input id="namaKegiatan" value={store.namaKegiatan} onChange={(e) => store.updateFormField('namaKegiatan', e.target.value)} placeholder="Contoh: Sensus Penduduk 2020" /></div>
                                 <div className="space-y-2"><Label htmlFor="ketuaTim">Nama Ketua Tim *</Label>
                                     <Select value={store.ketua_tim_id} onValueChange={(value: string) => store.updateFormField('ketua_tim_id', value)}>
                                         <SelectTrigger id="ketuaTim"><SelectValue placeholder="Pilih ketua tim" /></SelectTrigger>
                                         <SelectContent>{ketuaTimList.map((ketua) => (<SelectItem key={ketua.id} value={String(ketua.id)}>{ketua.namaKetua}</SelectItem>))}</SelectContent>
                                     </Select>
                                     {/* Tim mengikuti master ketua tim, diatur di Manajemen Admin. */}
                                     {timKetuaTerpilih && (
                                         <p className="text-sm text-muted-foreground">Tim: <Badge variant="outline">{timKetuaTerpilih}</Badge></p>
                                     )}
                                 </div>
                             </div>
                             <div className="space-y-2"><Label htmlFor="deskripsiKegiatan">Deskripsi Kegiatan</Label><Textarea id="deskripsiKegiatan" value={store.deskripsiKegiatan} onChange={(e) => store.updateFormField('deskripsiKegiatan', e.target.value)} placeholder="Deskripsikan kegiatan secara singkat..." /></div>
                         </CardContent>
                     </Card>
                     <Card>
                         <CardHeader>
                             <CardTitle>Jadwal Kegiatan *</CardTitle>
                             {/* Sakelar diletakkan DI SINI, bukan di tab Dokumen:
                                 keputusannya soal ruang lingkup kegiatan, dan
                                 akibatnya paling terlihat pada daftar jadwal
                                 tepat di bawahnya. */}
                             <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:gap-6">
                                 <label className="flex items-center gap-2 text-sm">
                                     <Checkbox
                                         checked={store.adaPengolahan}
                                         onCheckedChange={(v) => store.updateFormField('adaPengolahan', v === true)}
                                     />
                                     Ada tahap Pengolahan &amp; Analisis
                                 </label>
                                 <label className="flex items-center gap-2 text-sm">
                                     <Checkbox
                                         checked={store.adaDiseminasi}
                                         onCheckedChange={(v) => store.updateFormField('adaDiseminasi', v === true)}
                                     />
                                     Ada tahap Diseminasi &amp; Evaluasi
                                 </label>
                             </div>
                             <p className="pt-1 text-xs text-muted-foreground">
                                 Matikan bila tahap itu dikerjakan provinsi atau pusat. Jadwal dan
                                 dokumen wajibnya tidak akan diminta. Alokasi mitra Pengolahan tetap
                                 ada &mdash; pekerjaannya (entri dan cleaning) berlangsung di masa pendataan.
                             </p>
                         </CardHeader>
                         <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                             {jadwalTahap.map(({ label, mulai, selesai }) => (
                                 <div key={label} className="space-y-2">
                                     <Label>{label}</Label>
                                     <DateRangePicker
                                         value={{ mulai: keTeksTanggal(store[mulai]), selesai: keTeksTanggal(store[selesai]) }}
                                         onChange={(r) => storeActions.setRentangTahap(mulai, selesai, keTanggal(r.mulai), keTanggal(r.selesai))}
                                         defaultMonth={store[mulai] ?? store.tanggalMulaiPersiapan}
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
                          <AlokasiPPLContent tahap="listing" title="Listing" />
                      </TabsContent>
                      <TabsContent value="pencacahan" className="mt-4">
                          <AlokasiPPLContent tahap="pencacahan" title="Pencacahan" />
                      </TabsContent>
                      <TabsContent value="pengolahan-analisis" className="mt-4">
                          <AlokasiPPLContent tahap="pengolahan-analisis" title="Pengolahan" />
                      </TabsContent>
                  </Tabs>
                </TabsContent>

               <TabsContent value="dokumen" className="mt-6">
                 <Tabs value={docStageTab} onValueChange={(val) => setDocStageTab(val as Dokumen['tipe'])}>
                     <TabsList className={cn("grid w-full", jumlahTahapDokumen === 4 ? "grid-cols-4" : jumlahTahapDokumen === 3 ? "grid-cols-3" : "grid-cols-2")}>
                         <TabsTrigger value="persiapan">Persiapan</TabsTrigger>
                         <TabsTrigger value="pengumpulan-data">Pengumpulan Data</TabsTrigger>
                         {!!store.adaPengolahan && <TabsTrigger value="pengolahan-analisis">Pengolahan</TabsTrigger>}
                         {!!store.adaDiseminasi && <TabsTrigger value="diseminasi-evaluasi">Diseminasi</TabsTrigger>}
                     </TabsList>
                     <TabsContent value="persiapan" className="mt-4"><DokumenContent tipe="persiapan" title="Persiapan" /></TabsContent>
                     <TabsContent value="pengumpulan-data" className="mt-4"><DokumenContent tipe="pengumpulan-data" title="Pengumpulan Data" /></TabsContent>
                     {!!store.adaPengolahan && <TabsContent value="pengolahan-analisis" className="mt-4"><DokumenContent tipe="pengolahan-analisis" title="Pengolahan & Analisis" /></TabsContent>}
                     {!!store.adaDiseminasi && <TabsContent value="diseminasi-evaluasi" className="mt-4"><DokumenContent tipe="diseminasi-evaluasi" title="Diseminasi & Evaluasi" /></TabsContent>}
                 </Tabs>
               </TabsContent>
             </Tabs>
           <div className="flex justify-center mt-8">
            <Button 
                type="submit" 
                size="lg" 
                disabled={isFormIncomplete() || mutation.isPending} 
                className="min-w-48 bg-bps-green-600 hover:bg-bps-green-700"
            >
                {mutation.isPending ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
            </>
        ) : (
            "Simpan Kegiatan"
        )}
    </Button>
</div>
         </form>
         <ConfirmationModal
             isOpen={showHonorWarningModal}
             onClose={() => setShowHonorWarningModal(false)}
             onConfirm={() => {
                setShowHonorWarningModal(false);
                handleFormSubmit(true, true); // Kirim dengan flag bypass
             }}
             title="Peringatan Batas Honor"
             description={`Total honor untuk ${honorWarningDetails?.pplName} di bulan terpilih akan menjadi ${formatHonor(honorWarningDetails?.totalHonor || 0)}, melebihi batas ${formatHonor(honorWarningDetails?.limit || 0)}. Lanjutkan?`}
             confirmLabel="Ya, Lanjutkan"
             variant="warning"
           />
         <SuccessModal
           isOpen={showSuccessModal}
           onClose={handleSuccessAction}
           onAction={handleSuccessAction}
           title="Kegiatan Berhasil Disimpan!"
           description={`Kegiatan "${lastActivityName}" telah berhasil dibuat.`}
           actionLabel="Ke Dashboard"
           aksiKedua={{ label: sedangMengurungkan ? 'Membatalkan...' : 'Batal Simpan Kegiatan', onClick: urungkanSimpan }}
           autoCloseDelay={6000}
         />
         <ConfirmationModal
           isOpen={peringatanKelengkapan !== null}
           onClose={() => setPeringatanKelengkapan(null)}
           onConfirm={() => { const b = peringatanKelengkapan?.bypassHonorLimit ?? false; setPeringatanKelengkapan(null); handleFormSubmit(b, true); }}
           title="Periksa Lagi Sebelum Menyimpan?"
           description={teksPeringatan(peringatanKelengkapan?.daftar ?? [])}
           confirmLabel="Tetap Simpan"
           cancelLabel="Periksa Lagi"
           variant="warning"
         />
         <AlertModal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ isOpen: false, title: "", message: "" })} title={alertModal.title} description={alertModal.message} />

         <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
           <DialogContent className="max-w-2xl">
             <DialogHeader>
               <DialogTitle>Ambil dari Historis</DialogTitle>
               <DialogDescription>
                 Pilih kegiatan yang sudah ada untuk disalin. Informasi kegiatan, pengaturan honorarium,
                 alokasi mitra, dan susunan dokumen akan terisi otomatis. Tanggal dan isi link dokumen
                 tetap kosong. Data hanya diisikan ke form — belum tersimpan, jadi masih bisa diubah.
               </DialogDescription>
             </DialogHeader>

             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
               <Input
                 placeholder="Cari nama kegiatan..."
                 value={historySearch}
                 onChange={(e) => setHistorySearch(e.target.value)}
                 className="pl-10"
               />
             </div>

             <div className="max-h-80 overflow-y-auto space-y-2">
               {riwayatTersaring.length === 0 ? (
                 <p className="text-center text-muted-foreground py-8">
                   {historySearch ? `Tidak ada kegiatan yang cocok dengan "${historySearch}"` : 'Belum ada kegiatan yang bisa disalin'}
                 </p>
               ) : (
                 riwayatTersaring.map(k => (
                   <button
                     key={k.id}
                     type="button"
                     disabled={loadingHistoryId !== null}
                     onClick={() => handlePilihHistoris(k.id)}
                     className="w-full text-left p-3 rounded-md border hover:bg-accent disabled:opacity-50 flex items-center justify-between gap-3"
                   >
                     <div className="min-w-0">
                       <p className="font-medium truncate">{k.namaKegiatan}</p>
                       <p className="text-sm text-muted-foreground truncate">
                         Ketua: {k.namaKetua || '-'}
                         {k.timKetua ? ` · Tim ${k.timKetua}` : ''}
                       </p>
                     </div>
                     {loadingHistoryId === k.id && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                   </button>
                 ))
               )}
             </div>
           </DialogContent>
         </Dialog>
       </div>
     </Layout>
   );
 }