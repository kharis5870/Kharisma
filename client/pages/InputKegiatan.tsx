// client/pages/InputKegiatan.tsx

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { usePPL } from "@/contexts/PPLContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Plus, Trash2, Link2, X, Lock, Users, XCircle, ChevronsUpDown, Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useInputKegiatanStore, { PPLItem, HonorariumDetail, HonorariumSettings } from "@/stores/useInputKegiatanStore";
import { PPLMaster, KetuaTim, Kegiatan, UserData } from "@shared/api";
import { useAuth } from "@/contexts/AuthContext";
import AlertModal from "@/components/AlertModal";

type DateFieldName =
  | 'tanggalMulaiPersiapan' | 'tanggalSelesaiPersiapan'
  | 'tanggalMulaiPengumpulanData' | 'tanggalSelesaiPengumpulanData'
  | 'tanggalMulaiPengolahanAnalisis' | 'tanggalSelesaiPengolahanAnalisis'
  | 'tanggalMulaiDiseminasiEvaluasi' | 'tanggalSelesaiDiseminasiEvaluasi';

const formatHonor = (value: string | number): string => {
  if (value === '' || value === null || value === undefined) return '';
  const numString = String(value).replace(/[^0-9]/g, '');
  const num = Number(numString);
  if (isNaN(num)) return '';
  return num.toLocaleString('id-ID');
};

const createActivity = async (data: any): Promise<Kegiatan> => {
    const res = await fetch('/api/kegiatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Gagal membuat kegiatan');
    return res.json();
}

const fetchPPLs = async (): Promise<PPLMaster[]> => {
    const res = await fetch('/api/ppl');
    if (!res.ok) throw new Error('Gagal memuat daftar PPL');
    return res.json();
};

const fetchKetuaTim = async (): Promise<KetuaTim[]> => {
    const res = await fetch('/api/ketua-tim');
    if (!res.ok) throw new Error('Gagal memuat daftar Ketua Tim');
    return res.json();
};

const fetchPMLs = async (): Promise<UserData[]> => {
    const res = await fetch('/api/admin/pml');
    if (!res.ok) throw new Error('Gagal memuat daftar PML');
    return res.json();
};

const PPLAllocationItem = React.memo(({ ppl, index, onRemove, pmlList, pplList, store, existingPplIds }: any) => {
    const { updatePPL, updatePPLBebanKerja } = store.getState();
    const [openPPL, setOpenPPL] = useState(false);
    const [openPML, setOpenPML] = useState(false);
    
    const [localBebanKerja, setLocalBebanKerja] = useState<Record<string, string>>({});

    useEffect(() => {
        const initialBebanKerja: Record<string, string> = {};
        ppl.honorarium.forEach((h: HonorariumDetail) => {
            initialBebanKerja[h.jenis_pekerjaan] = h.bebanKerja;
        });
        setLocalBebanKerja(initialBebanKerja);
    }, [ppl.honorarium]);

    const handleBebanKerjaChange = (jenis: string, value: string) => {
        setLocalBebanKerja(prev => ({ ...prev, [jenis]: value }));
    };
    
    const handleBebanKerjaBlur = (jenis: HonorariumDetail['jenis_pekerjaan']) => {
        updatePPLBebanKerja(ppl.id, jenis, localBebanKerja[jenis]);
    };

    const getHonorDetail = (jenis: HonorariumDetail['jenis_pekerjaan']): HonorariumDetail => {
        return ppl.honorarium?.find((h: HonorariumDetail) => h.jenis_pekerjaan === jenis) || { jenis_pekerjaan: jenis, bebanKerja: '', besaranHonor: '0' };
    };

    const totalHonorPPL = ppl.honorarium?.reduce((sum: number, h: HonorariumDetail) => sum + parseInt(h.besaranHonor || '0'), 0) || 0;
    const selectedPML = pmlList.find((pml: UserData) => pml.namaLengkap === ppl.namaPML);
    const selectedPPL = pplList.find((p: PPLMaster) => String(p.id) === ppl.ppl_master_id);
    const availablePplList = pplList.filter(
        (p: PPLMaster) => !existingPplIds.includes(String(p.id)) || p.id === selectedPPL?.id
    );

    return (
        <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
            <div className="flex justify-between items-center">
                <h4 className="font-medium">{ppl.namaPPL || `Alokasi Baru ${index + 1}`}</h4>
                <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
                    <Trash2 className="w-4 h-4 text-red-500"/>
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
                                                       <span className="text-xs text-gray-500">ID: {p.id}</span>
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
+                                                     updatePPL(ppl.id, 'namaPML', pml.namaLengkap);
                                                     setOpenPML(false);
                                                 }}>
                                                     <Check className={cn("mr-2 h-4 w-4", ppl.namaPML === pml.namaLengkap ? "opacity-100" : "opacity-0")} />
                                                    <div className="flex flex-col">
                                                        <span>{pml.namaLengkap}</span>
                                                        <span className="text-xs text-gray-500">ID: {pml.id}</span>
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

                {ppl.tahap === 'pengumpulan-data' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                        <div className="md:col-span-3 font-medium text-sm">Detail Beban Kerja</div>
                        <div className="space-y-2">
                            <Label>Beban Kerja Listing</Label>
                            <Input type="number" placeholder="Jumlah..." value={localBebanKerja.listing || ''} onChange={(e) => handleBebanKerjaChange('listing', e.target.value)} onBlur={() => handleBebanKerjaBlur('listing')} />
                        </div>
                        <div className="space-y-2">
                            <Label>Honor Listing (Rp)</Label>
                            <Input value={formatHonor(getHonorDetail('listing').besaranHonor)} readOnly className="bg-gray-100"/>
                        </div>
                        <div className="space-y-2">
                            <Label>Total Honor (Rp)</Label>
                            <Input value={formatHonor(totalHonorPPL)} readOnly className="bg-gray-100 font-bold"/>
                        </div>
                        <div className="space-y-2">
                            <Label>Beban Kerja Pencacahan</Label>
                            <Input type="number" placeholder="Jumlah..." value={localBebanKerja.pencacahan || ''} onChange={(e) => handleBebanKerjaChange('pencacahan', e.target.value)} onBlur={() => handleBebanKerjaBlur('pencacahan')} />
                        </div>
                         <div className="space-y-2">
                            <Label>Honor Pencacahan (Rp)</Label>
                            <Input value={formatHonor(getHonorDetail('pencacahan').besaranHonor)} readOnly className="bg-gray-100"/>
                        </div>
                    </div>
                )}
                {ppl.tahap === 'pengolahan-analisis' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-2">
                            <Label>Beban Kerja Pengolahan</Label>
                            <Input type="number" placeholder="Jumlah..." value={localBebanKerja.pengolahan || ''} onChange={(e) => handleBebanKerjaChange('pengolahan', e.target.value)} onBlur={() => handleBebanKerjaBlur('pengolahan')} />
                        </div>
                        <div className="space-y-2">
                            <Label>Total Honor (Rp)</Label>
                            <Input value={formatHonor(totalHonorPPL)} readOnly className="bg-gray-100 font-bold"/>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

const AlokasiPPLContent = ({ tahap, title }: { tahap: 'pengumpulan-data' | 'pengolahan-analisis', title: string }) => {
    const pplForStage = useInputKegiatanStore(state => state.pplAllocations.filter(p => p.tahap === tahap));
    const storeActions = useInputKegiatanStore.getState();
    const { data: pplList = [] } = useQuery({ queryKey: ['pplMaster'], queryFn: fetchPPLs });
    const { data: pmlList = [] } = useQuery({ queryKey: ['pmls'], queryFn: fetchPMLs });
    const [showClearConfirmModal, setShowClearConfirmModal] = useState<{isOpen: boolean; tahap: 'pengumpulan-data' | 'pengolahan-analisis' | null}>({isOpen: false, tahap: null});
    
    const honorSettings = useInputKegiatanStore(state => state.honorariumSettings);
    
    const [localSettings, setLocalSettings] = useState(honorSettings);
    useEffect(() => setLocalSettings(honorSettings), [honorSettings]);

    const handleClearPPLs = () => {
       storeActions.clearPPLsByTahap(tahap);
       setShowClearConfirmModal({isOpen: false, tahap: null});
   }

    const handleSettingChange = (tahapKey: keyof typeof honorSettings, field: keyof HonorariumSettings, value: string) => {
        setLocalSettings(prev => ({
            ...prev,
            [tahapKey]: {
                ...prev[tahapKey],
                [field]: value,
            }
        }));
    };

    const handleSettingBlur = (tahapKey: keyof typeof honorSettings, field: keyof HonorariumSettings) => {
        storeActions.updateHonorariumSetting(tahapKey, field, localSettings[tahapKey][field]);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Alokasi PPL & PML ({title})</CardTitle>
                        <CardDescription>Atur honorarium, lalu alokasikan PPL.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                       {pplForStage.length > 0 && (
                           <Button variant="destructive" size="sm" onClick={() => setShowClearConfirmModal({isOpen: true, tahap})}>
                               <XCircle className="w-4 h-4 mr-2" />
                               Clear PPL
                           </Button>
                       )}
                       <Button variant="outline" size="sm" asChild>
                           <Link 
                               to="/daftar-ppl"
                               state={{ 
                                   from: 'input-kegiatan',
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
                <div className="p-4 border rounded-lg bg-blue-50/50 space-y-4">
                    <h4 className="font-medium text-gray-800">Pengaturan Honorarium {title}</h4>
                    {tahap === 'pengumpulan-data' && (
                        <>
                            <p className="text-sm text-gray-600">Atur harga satuan untuk pekerjaan listing dan pencacahan pada tahap ini.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
       <div className="font-semibold text-sm md:col-span-2">Updating/Listing</div>
       <div className="space-y-2">
           <Label>Satuan Beban Kerja</Label>
           <Input placeholder="Contoh: Dokumen" value={localSettings['pengumpulan-data-listing'].satuanBebanKerja} onChange={e => handleSettingChange('pengumpulan-data-listing', 'satuanBebanKerja', e.target.value)} onBlur={() => handleSettingBlur('pengumpulan-data-listing', 'satuanBebanKerja')} />
       </div>
       <div className="space-y-2">
           <Label>Harga per Satuan (Rp)</Label>
           <Input placeholder="Contoh: 15000" value={formatHonor(localSettings['pengumpulan-data-listing'].hargaSatuan)} onChange={e => handleSettingChange('pengumpulan-data-listing', 'hargaSatuan', e.target.value)} onBlur={() => handleSettingBlur('pengumpulan-data-listing', 'hargaSatuan')} />
       </div>
       <div className="font-semibold text-sm md:col-span-2 pt-2 border-t">Pendataan/Pencacahan</div>
        <div className="space-y-2">
           <Label>Satuan Beban Kerja</Label>
           <Input placeholder="Contoh: Responden" value={localSettings['pengumpulan-data-pencacahan'].satuanBebanKerja} onChange={e => handleSettingChange('pengumpulan-data-pencacahan', 'satuanBebanKerja', e.target.value)} onBlur={() => handleSettingBlur('pengumpulan-data-pencacahan', 'satuanBebanKerja')} />
       </div>
       <div className="space-y-2">
           <Label>Harga per Satuan (Rp)</Label>
           <Input placeholder="Contoh: 25000" value={formatHonor(localSettings['pengumpulan-data-pencacahan'].hargaSatuan)} onChange={e => handleSettingChange('pengumpulan-data-pencacahan', 'hargaSatuan', e.target.value)} onBlur={() => handleSettingBlur('pengumpulan-data-pencacahan', 'hargaSatuan')} />
       </div>
   </div>
                        </>
                    )}
                    {tahap === 'pengolahan-analisis' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Satuan Beban Kerja</Label>
                                <Input value={localSettings['pengolahan-analisis'].satuanBebanKerja} onChange={e => handleSettingChange('pengolahan-analisis', 'satuanBebanKerja', e.target.value)} onBlur={() => handleSettingBlur('pengolahan-analisis', 'satuanBebanKerja')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Harga per Satuan (Rp)</Label>
                                <Input value={formatHonor(localSettings['pengolahan-analisis'].hargaSatuan)} onChange={e => handleSettingChange('pengolahan-analisis', 'hargaSatuan', formatHonor(e.target.value))} onBlur={() => handleSettingBlur('pengolahan-analisis', 'hargaSatuan')} />
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="space-y-4">
                    {pplForStage.map((ppl, index) => {
                       const existingPplIds = pplForStage
                           .map(p => p.ppl_master_id)
                           .filter(id => id && id !== ppl.ppl_master_id) as string[];

                       return (
                           <PPLAllocationItem 
                               key={ppl.id} 
                               ppl={ppl} 
                               index={index} 
                               onRemove={() => storeActions.removePPL(ppl.id)} 
                               pmlList={pmlList} 
                               pplList={pplList} 
                               store={useInputKegiatanStore} 
                               existingPplIds={existingPplIds}
                           />
                       );
                   })}
                    <Button type="button" variant="outline" onClick={() => storeActions.addPPL(tahap)} className="w-full border-dashed"><Plus className="w-4 h-4 mr-2"/>Tambah Alokasi PPL Manual</Button>
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

const DokumenContent = ({ tipe, title }: { tipe: "persiapan" | "pengumpulan-data" | "pengolahan-analisis" | "diseminasi-evaluasi", title: string }) => {
    const documents = useInputKegiatanStore(state => state.documents.filter(d => d.tipe === tipe));
    const { addDocumentLink, removeDocument, updateDocument } = useInputKegiatanStore.getState();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Dokumen {title}</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => addDocumentLink(tipe)} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />Tambah Dokumen Pendukung
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {documents.map(doc => (
                    <div key={doc.id} className={cn("flex items-center gap-3 p-3 border rounded-lg", doc.isWajib ? "bg-blue-50 border-blue-200" : "bg-gray-50/50")}>
                        <div className="flex-grow space-y-2">
                            {doc.isWajib ? <Label className="font-semibold">{doc.nama}</Label> : <Input placeholder="Nama Dokumen Pendukung" value={doc.nama} onChange={(e) => updateDocument(doc.id, 'nama', e.target.value)} />}
                            <div className="flex items-center gap-2">
                                <Link2 className="w-4 h-4 text-gray-400"/>
                                <Input placeholder="https://drive.google.com/..." value={doc.link} onChange={(e) => updateDocument(doc.id, 'link', e.target.value)} />
                            </div>
                        </div>
                        {!doc.isWajib ? (<Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(doc.id)} className="self-center"><X className="w-4 h-4 text-gray-500"/></Button>) : (<div className="self-center p-2" title="Dokumen Wajib"><Lock className="w-4 h-4 text-gray-400"/></div>)}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
  };


export default function InputKegiatan() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { selectedPPLsForActivity, clearSelectedPPLsForActivity } = usePPL();
    const { data: ketuaTimList = [] } = useQuery({ queryKey: ['ketuaTim'], queryFn: fetchKetuaTim });
    
    const [mainTab, setMainTab] = useState("info-dasar");
    const [pplStageTab, setPplStageTab] = useState("pengumpulan-data");
    const [docStageTab, setDocStageTab] = useState("persiapan");

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastActivityName, setLastActivityName] = useState("");
    const [showAutoPopulateMessage, setShowAutoPopulateMessage] = useState(false);
    const [addedPPLCount, setAddedPPLCount] = useState(0);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "" });
    
    const store = useInputKegiatanStore();
  
    useEffect(() => {
      if (selectedPPLsForActivity.length > 0) {
        const tahap = "pengumpulan-data" as const;
        
        const newAllocations: PPLItem[] = selectedPPLsForActivity.map(ppl => ({
            id: `ppl-${ppl.id}-${Date.now()}`,
            ppl_master_id: String(ppl.id),
            namaPPL: ppl.namaPPL,
            namaPML: "",
            tahap: tahap,
            honorarium: [
              { jenis_pekerjaan: 'listing', bebanKerja: '', besaranHonor: '0' },
              { jenis_pekerjaan: 'pencacahan', bebanKerja: '', besaranHonor: '0' }
            ]
        }));
  
        const currentPpls = store.pplAllocations;
        const newPplsToAdd = newAllocations.filter(np => 
            !currentPpls.some((ep: PPLItem) => ep.ppl_master_id === np.ppl_master_id && ep.tahap === tahap)
        );
  
        if (newPplsToAdd.length > 0) {
            store.setPplAllocations([...currentPpls, ...newPplsToAdd]);
            setAddedPPLCount(newPplsToAdd.length);
            setShowAutoPopulateMessage(true);
            setTimeout(() => setShowAutoPopulateMessage(false), 5000);
        }
        
        setMainTab('alokasi-ppl');
        setPplStageTab('pengumpulan-data');
        
        clearSelectedPPLsForActivity();
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPPLsForActivity]);
  
    const mutation = useMutation({
      mutationFn: createActivity,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
        setShowSuccessModal(true);
        store.resetForm();
      },
    });
  
    const isFormIncomplete = (): boolean => {
      const {
          namaKegiatan, ketua_tim_id,
          tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
      } = store;
      return !namaKegiatan || !ketua_tim_id || !tanggalMulaiPersiapan || !tanggalSelesaiPersiapan;
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setLastActivityName(store.namaKegiatan);
  
      const formatDateForSubmission = (date: Date | undefined) => {
          if (!date) return undefined;
          return isValid(date) ? date.toISOString() : undefined;
      };
      
      const dataToSubmit = {
        ...store,
        username: user?.username,
        tanggalMulaiPersiapan: formatDateForSubmission(store.tanggalMulaiPersiapan),
        tanggalSelesaiPersiapan: formatDateForSubmission(store.tanggalSelesaiPersiapan),
        tanggalMulaiPengumpulanData: formatDateForSubmission(store.tanggalMulaiPengumpulanData),
        tanggalSelesaiPengumpulanData: formatDateForSubmission(store.tanggalSelesaiPengumpulanData),
        tanggalMulaiPengolahanAnalisis: formatDateForSubmission(store.tanggalMulaiPengolahanAnalisis),
        tanggalSelesaiPengolahanAnalisis: formatDateForSubmission(store.tanggalSelesaiPengolahanAnalisis),
        tanggalMulaiDiseminasiEvaluasi: formatDateForSubmission(store.tanggalMulaiDiseminasiEvaluasi),
        tanggalSelesaiDiseminasiEvaluasi: formatDateForSubmission(store.tanggalSelesaiDiseminasiEvaluasi),
      };
      mutation.mutate(dataToSubmit);
    };
  
    const handleSuccessAction = () => {
      navigate('/dashboard');
    };
  
    return (
      <Layout>
        <div className="max-w-4xl mx-auto pb-12">
          <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Input Kegiatan</h1>
              <p className="text-gray-600">Lengkapi semua informasi kegiatan dalam satu halaman</p>
              {showAutoPopulateMessage && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 text-sm">✅ {addedPPLCount} PPL telah ditambahkan ke Tahap Pengumpulan Data.</p>
                  </div>
              )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
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
                                    </div>
                                </div>
                                <div className="space-y-2"><Label htmlFor="deskripsiKegiatan">Deskripsi Kegiatan</Label><Textarea id="deskripsiKegiatan" value={store.deskripsiKegiatan} onChange={(e) => store.updateFormField('deskripsiKegiatan', e.target.value)} placeholder="Deskripsikan kegiatan secara singkat..." /></div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Jadwal Kegiatan *</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                {([ {label: 'Mulai Persiapan', field: 'tanggalMulaiPersiapan'}, {label: 'Selesai Persiapan', field: 'tanggalSelesaiPersiapan'}, {label: 'Mulai Pengumpulan Data', field: 'tanggalMulaiPengumpulanData'}, {label: 'Selesai Pengumpulan Data', field: 'tanggalSelesaiPengumpulanData'}, {label: 'Mulai Pengolahan & Analisis', field: 'tanggalMulaiPengolahanAnalisis'}, {label: 'Selesai Pengolahan & Analisis', field: 'tanggalSelesaiPengolahanAnalisis'}, {label: 'Mulai Diseminasi & Evaluasi', field: 'tanggalMulaiDiseminasiEvaluasi'}, {label: 'Selesai Diseminasi & Evaluasi', field: 'tanggalSelesaiDiseminasiEvaluasi'} ] as {label: string, field: DateFieldName}[]).map(({label, field}) => (
                                    <div key={field} className="space-y-2">
                                        <Label>{label}</Label>
                                        <Popover>
                                          <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !store[field] && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{store[field] ? format(store[field]!, "dd MMMM yyyy") : <span>Pilih tanggal</span>}</Button></PopoverTrigger>
                                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={store[field]} onSelect={(date) => store.updateFormField(field, date)} /></PopoverContent>
                                        </Popover>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                     </div>
                  </TabsContent>
                     
                  <TabsContent value="alokasi-ppl" className="mt-6">
                     <Tabs value={pplStageTab} onValueChange={setPplStageTab}>
                        <TabsList className="grid w-full grid-cols-2">
                           <TabsTrigger value="pengumpulan-data">Pengumpulan Data</TabsTrigger>
                           <TabsTrigger value="pengolahan-analisis">Pengolahan</TabsTrigger>
                        </TabsList>
                        <TabsContent value="pengumpulan-data" className="mt-4">
                           <AlokasiPPLContent tahap="pengumpulan-data" title="Pengumpulan Data" />
                        </TabsContent>
                        <TabsContent value="pengolahan-analisis" className="mt-4">
                           <AlokasiPPLContent tahap="pengolahan-analisis" title="Pengolahan & Analisis" />
                        </TabsContent>
                     </Tabs>
                  </TabsContent>
  
                  <TabsContent value="dokumen" className="mt-6">
                     <Tabs value={docStageTab} onValueChange={setDocStageTab}>
                        <TabsList className="grid w-full grid-cols-4">
                           <TabsTrigger value="persiapan">Persiapan</TabsTrigger>
                           <TabsTrigger value="pengumpulan-data">Pengumpulan Data</TabsTrigger>
                           <TabsTrigger value="pengolahan-analisis">Pengolahan</TabsTrigger>
                           <TabsTrigger value="diseminasi-evaluasi">Diseminasi</TabsTrigger>
                        </TabsList>
                        <TabsContent value="persiapan" className="mt-4"><DokumenContent tipe="persiapan" title="Persiapan" /></TabsContent>
                        <TabsContent value="pengumpulan-data" className="mt-4"><DokumenContent tipe="pengumpulan-data" title="Pengumpulan Data" /></TabsContent>
                        <TabsContent value="pengolahan-analisis" className="mt-4"><DokumenContent tipe="pengolahan-analisis" title="Pengolahan & Analisis" /></TabsContent>
                        <TabsContent value="diseminasi-evaluasi" className="mt-4"><DokumenContent tipe="diseminasi-evaluasi" title="Diseminasi & Evaluasi" /></TabsContent>
                     </Tabs>
                  </TabsContent>
               </Tabs>
              <div className="flex justify-center mt-8">
                  <Button type="submit" size="lg" disabled={isFormIncomplete() || mutation.isPending} className="min-w-48 bg-bps-green-600 hover:bg-bps-green-700">
                      {mutation.isPending ? "Menyimpan..." : "Simpan Kegiatan"}
                  </Button>
              </div>
          </form>
          <SuccessModal 
              isOpen={showSuccessModal} 
              onClose={() => setShowSuccessModal(false)} 
              onAction={handleSuccessAction} 
              title="Kegiatan Berhasil Disimpan!" 
              description={`Kegiatan "${lastActivityName}" telah berhasil dibuat.`} 
              actionLabel="Ke Dashboard" 
          />
          <AlertModal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ isOpen: false, title: "", message: "" })} title={alertModal.title} description={alertModal.message} />
        </div>
      </Layout>
    );
  }
  