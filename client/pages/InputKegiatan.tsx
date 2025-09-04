// client/pages/InputKegiatan.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import ConfirmationModal from "@/components/ConfirmationModal";
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
import { eachMonthOfInterval, getMonth, getYear, format as formatDateFns } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { apiClient } from "@/lib/apiClient";

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

const parseHonor = (value: string | number): string => {
    if (value === '' || value === null || value === undefined) return '';
    return String(value).replace(/\./g, '');
};


const createActivity = async (data: any): Promise<Kegiatan> => {
    // apiClient sudah menangani JSON parsing dan error, jadi lebih ringkas
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
                                                     updatePPL(ppl.id, 'namaPML', pml.namaLengkap);
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
                                <Input value={formatHonor(localSettings['pengolahan-analisis'].hargaSatuan)} onChange={e => handleSettingChange('pengolahan-analisis', 'hargaSatuan', e.target.value)} onBlur={() => handleSettingBlur('pengolahan-analisis', 'hargaSatuan')} />
                            </div>
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
                               ppl={ppl} 
                               index={index} 
                               onRemove={() => storeActions.removePPL(ppl.id)} 
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

 const HonorPaymentMonthSelector = () => {
      const store = useInputKegiatanStore();
      const { tanggalMulaiPersiapan, tanggalSelesaiDiseminasiEvaluasi, bulanPembayaranHonor, updateFormField } = store;
      const [showOtherMonths, setShowOtherMonths] = useState(false);

      useEffect(() => {
         if (tanggalMulaiPersiapan && tanggalSelesaiDiseminasiEvaluasi) {
             const start = tanggalMulaiPersiapan;
             const end = tanggalSelesaiDiseminasiEvaluasi;

             if (getMonth(start) === getMonth(end) && getYear(start) === getYear(end)) {
                 const autoSelectedMonth = formatDateFns(start, 'MM-yyyy');
                 if (bulanPembayaranHonor !== autoSelectedMonth) {
                     updateFormField('bulanPembayaranHonor', autoSelectedMonth);
                 }
             }
         }
       }, [tanggalMulaiPersiapan, tanggalSelesaiDiseminasiEvaluasi, bulanPembayaranHonor, updateFormField]);
      const paymentMonthOptions = useMemo(() => {
           if (!tanggalMulaiPersiapan || !tanggalSelesaiDiseminasiEvaluasi) {
               return [];
           }

           const start = tanggalMulaiPersiapan;
           const end = tanggalSelesaiDiseminasiEvaluasi;

           const months = eachMonthOfInterval({ start, end });
           return months.map(monthDate => ({
               value: formatDateFns(monthDate, 'MM-yyyy'),
               label: formatDateFns(monthDate, 'MMMM yyyy', { locale: localeID }),
           }));
      }, [tanggalMulaiPersiapan, tanggalSelesaiDiseminasiEvaluasi]);

      const allYearMonths = useMemo(() => {
         const currentYear = getYear(new Date());
         return Array.from({ length: 12 }, (_, i) => {
             const monthDate = new Date(currentYear, i, 1);
             return {
                 value: formatDateFns(monthDate, 'MM-yyyy'),
                 label: formatDateFns(monthDate, 'MMMM yyyy', { locale: localeID }),
             };
         });
      }, []);

      if (!tanggalMulaiPersiapan || !tanggalSelesaiDiseminasiEvaluasi || 
          (getMonth(tanggalMulaiPersiapan) === getMonth(tanggalSelesaiDiseminasiEvaluasi) && 
           getYear(tanggalMulaiPersiapan) === getYear(tanggalSelesaiDiseminasiEvaluasi))
         ) 
      {
        return null;
      }

      return (
          <div className="space-y-2 pt-4 border-t mt-4">
               <Label htmlFor="bulanPembayaran">Bulan Pembayaran Honor *</Label>
               <Select 
                 value={bulanPembayaranHonor} 
                 onValueChange={(value) => {
                     if (value === 'lainnya') {
                         setShowOtherMonths(true);
                         updateFormField('bulanPembayaranHonor', '');
                     } else {
                         updateFormField('bulanPembayaranHonor', value);
                     }
                 }}
               >
                    <SelectTrigger id="bulanPembayaran">
                        <SelectValue placeholder="Pilih bulan pembayaran honor" />
                    </SelectTrigger>
                    <SelectContent>
                        {(showOtherMonths ? allYearMonths : paymentMonthOptions).map(option => (
                             <SelectItem key={option.value} value={option.value}>
                                 {option.label}
                             </SelectItem>
                        ))}
                        {!showOtherMonths && (
                             <SelectItem value="lainnya">Pilih Bulan Lainnya...</SelectItem>
                        )}
                    </SelectContent>
               </Select>
               <p className="text-xs text-gray-500">Pilih bulan di mana honor untuk kegiatan ini akan dibayarkan.</p>
           </div>
      );
 };

export default function InputKegiatan() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: ketuaTimList = [] } = useQuery({ queryKey: ['ketuaTim'], queryFn: fetchKetuaTim });
    const location = useLocation();
    
    const [mainTab, setMainTab] = useState("info-dasar");
    const [pplStageTab, setPplStageTab] = useState<'pengumpulan-data' | 'pengolahan-analisis'>("pengumpulan-data");
    const [docStageTab, setDocStageTab] = useState("persiapan");

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastActivityName, setLastActivityName] = useState("");
    const [showAutoPopulateMessage, setShowAutoPopulateMessage] = useState(false);
    const [addedPPLCount, setAddedPPLCount] = useState(0);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "" });
    
    const store = useInputKegiatanStore();

    useEffect(() => {
        const { newPpls, tahap, from } = location.state || {};
        if (from === 'daftar-ppl' && newPpls && tahap) {
      const currentPplsInStage = store.pplAllocations.filter(p => p.tahap === tahap);
      const newPplsToAdd = newPpls.filter(
        (newPpl: PPLMaster) => !currentPplsInStage.some(
          (existingPpl: PPLItem) => existingPpl.ppl_master_id === String(newPpl.id)
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
    } else if (from === 'batal-pilih' && tahap) { // <-- TAMBAHKAN BLOK INI
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
            { start: tanggalMulaiPersiapan, end: tanggalSelesaiPersiapan, name: 'Persiapan' },
            { start: tanggalMulaiPengumpulanData, end: tanggalSelesaiPengumpulanData, name: 'Pengumpulan Data' },
            { start: tanggalMulaiPengolahanAnalisis, end: tanggalSelesaiPengolahanAnalisis, name: 'Pengolahan & Analisis' },
            { start: tanggalMulaiDiseminasiEvaluasi, end: tanggalSelesaiDiseminasiEvaluasi, name: 'Diseminasi & Evaluasi' }
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
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
       setShowSuccessModal(true);
       store.resetForm();
     },
     onError: (error) => {
        setAlertModal({ isOpen: true, title: "Gagal Menyimpan", message: `Terjadi kesalahan saat menyimpan: ${error.message}` });
     }
   });
 
   const isFormIncomplete = (): boolean => {
     const {
         namaKegiatan, ketua_tim_id,
         tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
     } = store;
     return !namaKegiatan || !ketua_tim_id || !tanggalMulaiPersiapan || !tanggalSelesaiPersiapan; 
   };
 
   const [showHonorWarningModal, setShowHonorWarningModal] = useState(false);
   const [honorWarningDetails, setHonorWarningDetails] = useState<{ pplName: string; totalHonor: number; limit: number } | null>(null);

   
   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateError = validateDates();
    if (dateError) {
      setAlertModal({ isOpen: true, title: "Kesalahan Jadwal Kegiatan", message: dateError });
      return;
    }

    const { pplAllocations } = store;

    // Jika tidak ada PPL, langsung simpan
    if (!pplAllocations || pplAllocations.length === 0) {
      proceedToSubmit();
      return;
    }

    // Jika ADA PPL, validasi honor WAJIB dijalankan
    const HONOR_LIMIT = 3000000; // Ganti ini dengan impor dari file konstanta nanti
    let validationMonth: number, validationYear: number;

    // Otomatis tentukan bulan validasi dari state Zustand
    const singleMonthActivity = store.tanggalMulaiPersiapan ? formatDateFns(store.tanggalMulaiPersiapan, 'MM-yyyy') : null;
    const selectedMonth = store.bulanPembayaranHonor;
    const collectionDate = store.tanggalMulaiPengumpulanData;

    if (selectedMonth) {
      const [month, year] = selectedMonth.split('-');
      validationMonth = parseInt(month);
      validationYear = parseInt(year);
    } else if (collectionDate) {
      validationMonth = getMonth(collectionDate) + 1;
      validationYear = getYear(collectionDate);
    } else if (singleMonthActivity) {
      const [month, year] = singleMonthActivity.split('-');
      validationMonth = parseInt(month);
      validationYear = parseInt(year);
    } else {
      setAlertModal({ isOpen: true, title: "Informasi Kurang", message: "Untuk validasi honor, Anda harus mengisi setidaknya 'Tanggal Mulai Persiapan' atau 'Tanggal Mulai Pengumpulan Data'." });
      return;
    }

    for (const ppl of pplAllocations ?? []) {
      if (!ppl.ppl_master_id) continue;
      const currentActivityHonor = ppl.honorarium.reduce((sum, h) => sum + (parseInt(h.besaranHonor) || 0), 0);
      const result = await apiClient.post<{ isOverLimit: boolean; projectedTotal: number; limit: number }>('/honor/validate', {
        pplMasterId: ppl.ppl_master_id,
        bulan: validationMonth,
        tahun: validationYear,
        currentActivityHonor: currentActivityHonor,
        kegiatanIdToExclude: null
      });
      
      if (result.isOverLimit) {
        setHonorWarningDetails({
          pplName: ppl.namaPPL || 'PPL',
          totalHonor: result.projectedTotal,
          limit: result.limit,
        });
        setShowHonorWarningModal(true);
        return;
      }
    }

    proceedToSubmit();
   };

   const proceedToSubmit = () => {
       setLastActivityName(store.namaKegiatan);

     const formatDateForSubmission = (date: Date | undefined) => {
         if (!date) return undefined;
         return isValid(date) ? date.toISOString() : undefined;
     };
     
     const dataToSubmit = {
        namaKegiatan: store.namaKegiatan,
        ketua_tim_id: store.ketua_tim_id,
        deskripsiKegiatan: store.deskripsiKegiatan,
        adaListing: store.adaListing,
        isFasih: store.isFasih,
        username: user?.username,
        ppl: store.pplAllocations,
        documents: store.documents, // Perbaikan: 'dokumen' menjadi 'documents'
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
        bulanPembayaranHonor: store.bulanPembayaranHonor
    };
     mutation.mutate(dataToSubmit);
   };
  const handleConfirmHonorWarning = () => {
       setShowHonorWarningModal(false);
       proceedToSubmit();
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
                   <p className="text-blue-800 text-sm">✅ {addedPPLCount} PPL telah ditambahkan ke Tahap {pplStageTab.replace('-', ' ')}.</p>
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
                                          <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !store[field] && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{store[field] ? format(store[field]!, "dd MMMM yyyy", { locale: localeID }) : <span>Pilih tanggal</span>}</Button></PopoverTrigger>
                                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={store[field]} onSelect={(date) => store.updateFormField(field, date)} /></PopoverContent>
                                      </Popover>
                                  </div>
                              ))}
                          </CardContent>
                          <CardContent>
                               <HonorPaymentMonthSelector />
                           </CardContent>
                      </Card>
                  </div>
               </TabsContent>
                   
               <TabsContent value="alokasi-ppl" className="mt-6">
                  <Tabs value={pplStageTab} onValueChange={(val) => setPplStageTab(val as 'pengumpulan-data' | 'pengolahan-analisis')}>
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
         <ConfirmationModal
                isOpen={showHonorWarningModal}
                onClose={() => setShowHonorWarningModal(false)}
                onConfirm={handleConfirmHonorWarning}
                title="Peringatan Batas Honor"
                description={`Total honor untuk ${honorWarningDetails?.pplName} di bulan terpilih akan menjadi ${formatHonor(honorWarningDetails?.totalHonor || 0)}, melebihi batas ${formatHonor(honorWarningDetails?.limit || 0)}. Lanjutkan?`}
                confirmLabel="Ya, Lanjutkan"
                variant="warning"
           />
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