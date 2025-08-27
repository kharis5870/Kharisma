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
import { CalendarIcon, Plus, Trash2, Link2, X, Lock, Check, ChevronsUpDown, Users, XCircle } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useInputKegiatanStore, { PPLItem, DocumentItem } from "@/stores/useInputKegiatanStore"; 
import { PPLMaster, KetuaTim, PPL, Kegiatan, UserData } from "@shared/api";
import { useAuth } from "@/contexts/AuthContext";
import AlertModal from "@/components/AlertModal";

type DateFieldName =
  | 'tanggalMulaiPersiapan' | 'tanggalSelesaiPersiapan'
  | 'tanggalMulaiPengumpulanData' | 'tanggalSelesaiPengumpulanData'
  | 'tanggalMulaiPengolahanAnalisis' | 'tanggalSelesaiPengolahanAnalisis'
  | 'tanggalMulaiDiseminasiEvaluasi' | 'tanggalSelesaiDiseminasiEvaluasi';

// Helper functions for honorarium formatting
const formatHonor = (value: string | number): string => {
  if (value === '' || value === null || value === undefined) return '';
  const numString = String(value).replace(/[^0-9]/g, '');
  const num = Number(numString);
  if (isNaN(num)) return '';
  return num.toLocaleString('id-ID');
};

const parseHonor = (value: string): string => String(value).replace(/\./g, '');

// API functions
const createActivity = async (data: any): Promise<Kegiatan> => {
    // Menyesuaikan data PPL untuk backend
    const sanitizedPplAllocations = data.pplAllocations.map((ppl: any) => ({
        ...ppl,
        besaranHonor: parseHonor(ppl.besaranHonor),
        satuanBebanKerja: data.honorarium[ppl.tahap as keyof typeof data.honorarium].satuanBebanKerja,
        hargaSatuan: parseHonor(data.honorarium[ppl.tahap as keyof typeof data.honorarium].hargaSatuan),
    }));

    const sanitizedData = {
        ...data,
        documents: data.documents.map(({ id, ...rest }: any) => rest),
        pplAllocations: sanitizedPplAllocations,
    };
    
    delete sanitizedData.honorarium;

    const res = await fetch('/api/kegiatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData),
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

// **Komponen PPL Item yang Dioptimalkan**
const PPLAllocationItem = React.memo(({ ppl, index, onRemove, pplList, pmlList, store }: any) => {
    const [bebanKerja, setBebanKerja] = useState(ppl.bebanKerja);
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);
    const [isPmlComboboxOpen, setIsPmlComboboxOpen] = useState(false);
    
    useEffect(() => {
        setBebanKerja(ppl.bebanKerja);
    }, [ppl.bebanKerja]);

    const handleBebanKerjaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBebanKerja(e.target.value);
    };

    const handleBebanKerjaBlur = () => {
        if (bebanKerja !== ppl.bebanKerja) {
            store.getState().updatePPL(ppl.id, 'bebanKerja', bebanKerja);
        }
    };
    
    return (
        <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
            <div className="flex justify-between items-center">
                <h4 className="font-medium">Alokasi {index + 1}</h4>
                <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
                    <Trash2 className="w-4 h-4 text-red-500"/>
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor={`ppl-select-${ppl.id}`}>Pilih PPL *</Label>
                    <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                        <PopoverTrigger asChild>
                            <Button id={`ppl-select-${ppl.id}`} variant="outline" role="combobox" className="w-full justify-between">
                                {ppl.namaPPL || "Pilih PPL..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Cari PPL..." />
                                <CommandList>
                                    <CommandEmpty>PPL tidak ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                        {pplList.map((pplOption: PPLMaster) => (
                                            <CommandItem 
                                                key={pplOption.id} 
                                                value={`${pplOption.id} ${pplOption.namaPPL}`} 
                                                onSelect={() => {
                                                    store.getState().updatePPL(ppl.id, 'ppl_master_id', pplOption.id);
                                                    store.getState().updatePPL(ppl.id, 'namaPPL', pplOption.namaPPL);
                                                    setIsComboboxOpen(false);
                                                }}>
                                                <Check className={cn("mr-2 h-4 w-4", ppl.ppl_master_id === pplOption.id ? "opacity-100" : "opacity-0")} />
                                                <div className="flex flex-col">
                                                    <span>{pplOption.namaPPL}</span>
                                                    <span className="text-xs text-gray-500">ID: {pplOption.id}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`bebanKerja-${ppl.id}`}>Jumlah Beban Kerja *</Label>
                    <Input 
                        id={`bebanKerja-${ppl.id}`}
                        name={`bebanKerja-${ppl.id}`}
                        placeholder="Contoh: 12" 
                        value={bebanKerja} 
                        onChange={handleBebanKerjaChange}
                        onBlur={handleBebanKerjaBlur}
                        type="number"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`besaranHonor-${ppl.id}`}>Total Honor (Rp) *</Label>
                    <Input 
                        id={`besaranHonor-${ppl.id}`}
                        name={`besaranHonor-${ppl.id}`}
                        value={formatHonor(ppl.besaranHonor)} 
                        readOnly 
                        className="bg-gray-100" 
                    />
                </div>
                <div className="space-y-2 lg:col-span-5">
                    <Label htmlFor={`namaPML-${ppl.id}`}>Nama PML *</Label>
                    <Popover open={isPmlComboboxOpen} onOpenChange={setIsPmlComboboxOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                {ppl.namaPML || "Pilih PML..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Cari nama PML..." />
                                <CommandList>
                                    <CommandEmpty>PML tidak ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                        {pmlList.map((pml: UserData) => (
                                            <CommandItem
                                                key={pml.id}
                                                value={`${pml.id} ${pml.namaLengkap}`}
                                                onSelect={() => {
                                                    store.getState().updatePPL(ppl.id, 'namaPML', pml.namaLengkap);
                                                    setIsPmlComboboxOpen(false);
                                                }}>
                                                <Check className={cn("mr-2 h-4 w-4", ppl.namaPML === pml.namaLengkap ? "opacity-100" : "opacity-0")} />
                                                <div className="flex flex-col">
                                                    <span>{pml.namaLengkap}</span>
                                                    <span className="text-xs text-gray-500">ID: {pml.id}</span>
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
        </div>
    );
});

export default function InputKegiatan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedPPLsForActivity, clearSelectedPPLsForActivity } = usePPL();
  const { data: pplList = [] } = useQuery({ queryKey: ['pplMaster'], queryFn: fetchPPLs });
  const { data: ketuaTimList = [] } = useQuery({ queryKey: ['ketuaTim'], queryFn: fetchKetuaTim });
  const { data: pmlList = [] } = useQuery({ queryKey: ['pmls'], queryFn: fetchPMLs });
  
  const [activeTab, setActiveTab] = useState("info-dasar");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newActivityId, setNewActivityId] = useState<number | null>(null);
  const [lastActivityName, setLastActivityName] = useState("");
  const [showAutoPopulateMessage, setShowAutoPopulateMessage] = useState(false);
  const [addedPPLCount, setAddedPPLCount] = useState(0);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<{isOpen: boolean; tahap: 'persiapan' | 'pengumpulan-data' | 'pengolahan-analisis' | 'diseminasi-evaluasi' | null}>({isOpen: false, tahap: null});
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "" });
  const [topLevelTab, setTopLevelTab] = useState("alokasi-ppl");
  const [stageTab, setStageTab] = useState("info-dasar");

  const store = useInputKegiatanStore();

  useEffect(() => {
    // Jalankan hanya jika ada PPL yang baru dipilih
    if (selectedPPLsForActivity.length > 0) {
        const tahap = "persiapan" as const;
        
        const newAllocations: PPLItem[] = selectedPPLsForActivity.map(ppl => ({
            id: `ppl-${ppl.id}-${Date.now()}`,
            ppl_master_id: ppl.id,
            namaPPL: ppl.namaPPL,
            bebanKerja: "",
            besaranHonor: "0",
            namaPML: "",
            tahap: tahap
        }));

        // Ambil state PPL saat ini dari store
        const currentPpls = store.pplAllocations;
        
        // Filter PPL baru untuk menghindari duplikasi
        const newPplsToAdd = newAllocations.filter(np => 
            !currentPpls.some((ep: PPLItem) => ep.ppl_master_id === np.ppl_master_id && ep.tahap === tahap)
        );

        // Hanya update state jika ada PPL baru yang akan ditambahkan
        if (newPplsToAdd.length > 0) {
            store.setPplAllocations([...currentPpls, ...newPplsToAdd]);
            setAddedPPLCount(newPplsToAdd.length);
            setShowAutoPopulateMessage(true);
            setTimeout(() => setShowAutoPopulateMessage(false), 5000);
        }
        
        // Atur tab aktif ke lokasi yang benar
        setStageTab(tahap);
        setTopLevelTab('alokasi-ppl');
        
        // Bersihkan PPL yang dipilih dari context agar useEffect tidak berjalan lagi
        clearSelectedPPLsForActivity();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPPLsForActivity]);


  const mutation = useMutation({
    mutationFn: createActivity,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
      setNewActivityId(data.id);
      setShowSuccessModal(true);
      store.resetForm();
    },
  });

  const isFormIncomplete = (): boolean => {
    const {
        namaKegiatan, ketua_tim_id,
        tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
        tanggalMulaiPengumpulanData, tanggalSelesaiPengumpulanData,
        tanggalMulaiPengolahanAnalisis, tanggalSelesaiPengolahanAnalisis,
        tanggalMulaiDiseminasiEvaluasi, tanggalSelesaiDiseminasiEvaluasi
    } = store;

    return !namaKegiatan || !ketua_tim_id || !tanggalMulaiPersiapan || !tanggalSelesaiPersiapan || !tanggalMulaiPengumpulanData || !tanggalSelesaiPengumpulanData || !tanggalMulaiPengolahanAnalisis || !tanggalSelesaiPengolahanAnalisis || !tanggalMulaiDiseminasiEvaluasi || !tanggalSelesaiDiseminasiEvaluasi;
  };

  const validateForm = () => {
    const {
        namaKegiatan, ketua_tim_id, pplAllocations,
        tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
        tanggalMulaiPengumpulanData, tanggalSelesaiPengumpulanData,
        tanggalMulaiPengolahanAnalisis, tanggalSelesaiPengolahanAnalisis,
        tanggalMulaiDiseminasiEvaluasi, tanggalSelesaiDiseminasiEvaluasi
    } = store;

    // Validasi field wajib
    if (!namaKegiatan || !ketua_tim_id || !tanggalMulaiPersiapan || !tanggalSelesaiPersiapan || !tanggalMulaiPengumpulanData || !tanggalSelesaiPengumpulanData || !tanggalMulaiPengolahanAnalisis || !tanggalSelesaiPengolahanAnalisis || !tanggalMulaiDiseminasiEvaluasi || !tanggalSelesaiDiseminasiEvaluasi) {
        setAlertModal({ isOpen: true, title: "Validasi Gagal", message: "Harap lengkapi semua field jadwal yang bertanda *." });
        return false;
    }
    
    // Validasi urutan tanggal
    if (tanggalSelesaiPersiapan < tanggalMulaiPersiapan) {
        setAlertModal({ isOpen: true, title: "Tanggal Tidak Valid", message: "Tanggal Selesai Persiapan harus setelah atau sama dengan Tanggal Mulai Persiapan." });
        return false;
    }
    if (tanggalMulaiPengumpulanData < tanggalMulaiPersiapan) {
        setAlertModal({ isOpen: true, title: "Tanggal Tidak Valid", message: "Tanggal Mulai Pengumpulan Data harus setelah atau sama dengan Tanggal Mulai Persiapan." });
        return false;
    }
    if (tanggalSelesaiPengumpulanData < tanggalMulaiPengumpulanData) {
        setAlertModal({ isOpen: true, title: "Tanggal Tidak Valid", message: "Tanggal Selesai Pengumpulan Data harus setelah atau sama dengan Tanggal Mulai Pengumpulan Data." });
        return false;
    }
    if (tanggalMulaiPengolahanAnalisis < tanggalMulaiPengumpulanData) {
        setAlertModal({ isOpen: true, title: "Tanggal Tidak Valid", message: "Tanggal Mulai Pengolahan & Analisis harus setelah atau sama dengan Tanggal Mulai Pengumpulan Data." });
        return false;
    }
    if (tanggalSelesaiPengolahanAnalisis < tanggalMulaiPengolahanAnalisis) {
        setAlertModal({ isOpen: true, title: "Tanggal Tidak Valid", message: "Tanggal Selesai Pengolahan & Analisis harus setelah atau sama dengan Tanggal Mulai Pengolahan & Analisis." });
        return false;
    }
    if (tanggalMulaiDiseminasiEvaluasi < tanggalMulaiPengolahanAnalisis) {
        setAlertModal({ isOpen: true, title: "Tanggal Tidak Valid", message: "Tanggal Mulai Diseminasi & Evaluasi harus setelah atau sama dengan Tanggal Mulai Pengolahan & Analisis." });
        return false;
    }
    if (tanggalSelesaiDiseminasiEvaluasi < tanggalMulaiDiseminasiEvaluasi) {
        setAlertModal({ isOpen: true, title: "Tanggal Tidak Valid", message: "Tanggal Selesai Diseminasi & Evaluasi harus setelah atau sama dengan Tanggal Mulai Diseminasi & Evaluasi." });
        return false;
    }

    // Validasi PPL
    if (!pplAllocations.filter(p => p.tahap === 'persiapan').every(ppl => ppl.ppl_master_id && ppl.bebanKerja && ppl.namaPML)) {
        setAlertModal({ isOpen: true, title: "Validasi Gagal", message: "Harap lengkapi semua data alokasi PPL di tahap persiapan." });
        return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Panggil fungsi validasi lengkap di sini. Jika gagal, modal akan muncul dan proses berhenti.
    if (!validateForm()) {
        return;
    }
    
    setLastActivityName(store.namaKegiatan);
    const dataToSubmit = {
      ...store,
      ppl: store.pplAllocations,
      dokumen: store.documents,
      honorarium: store.honorarium,
      tanggalMulaiPersiapan: store.tanggalMulaiPersiapan?.toISOString(),
      tanggalSelesaiPersiapan: store.tanggalSelesaiPersiapan?.toISOString(),
      tanggalMulaiPengumpulanData: store.tanggalMulaiPengumpulanData?.toISOString(),
      tanggalSelesaiPengumpulanData: store.tanggalSelesaiPengumpulanData?.toISOString(),
      tanggalMulaiPengolahanAnalisis: store.tanggalMulaiPengolahanAnalisis?.toISOString(),
      tanggalSelesaiPengolahanAnalisis: store.tanggalSelesaiPengolahanAnalisis?.toISOString(),
      tanggalMulaiDiseminasiEvaluasi: store.tanggalMulaiDiseminasiEvaluasi?.toISOString(),
      tanggalSelesaiDiseminasiEvaluasi: store.tanggalSelesaiDiseminasiEvaluasi?.toISOString()
    };
    mutation.mutate(dataToSubmit);
  };

  const handleSuccessAction = () => {
    navigate('/dashboard'); // Selalu arahkan ke dashboard
  };

  const AlokasiPPLContent = () => {
    const tahap = 'persiapan';
    const pplForStage = useInputKegiatanStore(state => state.pplAllocations.filter(p => p.tahap === tahap));
    const honorariumTahap = useInputKegiatanStore(state => state.honorarium[tahap]);
    const { updateHonorariumTahap, addPPL, removePPL, clearPPLsByTahap } = useInputKegiatanStore.getState();
    
    // State lokal untuk input honorarium agar tidak lag
    const [localSatuan, setLocalSatuan] = useState(honorariumTahap.satuanBebanKerja);
    const [localHarga, setLocalHarga] = useState(formatHonor(honorariumTahap.hargaSatuan));

    useEffect(() => {
        setLocalSatuan(honorariumTahap.satuanBebanKerja);
        setLocalHarga(formatHonor(honorariumTahap.hargaSatuan));
    }, [honorariumTahap]);

    const handleHargaBlur = () => {
        if (parseHonor(localHarga) !== parseHonor(honorariumTahap.hargaSatuan)) {
            updateHonorariumTahap(tahap, 'hargaSatuan', localHarga);
        }
    };
    
    const handleSatuanBlur = () => {
        if (localSatuan !== honorariumTahap.satuanBebanKerja) {
            updateHonorariumTahap(tahap, 'satuanBebanKerja', localSatuan);
        }
    };

    const handleClearPPLs = () => {
        clearPPLsByTahap(tahap);
        setShowClearConfirmModal({isOpen: false, tahap: null});
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Alokasi PPL & PML (Tahap Persiapan)</CardTitle>
                        <CardDescription>Atur detail honorarium untuk tahap ini, lalu alokasikan PPL.</CardDescription>
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
                    <h4 className="font-medium text-gray-800">Pengaturan Honorarium Tahap Persiapan</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="satuanBebanKerja">Satuan Beban Kerja</Label>
                            <Input 
                                id="satuanBebanKerja"
                                name="satuanBebanKerja"
                                placeholder="Contoh: Dokumen, Responden" 
                                value={localSatuan} 
                                onChange={e => setLocalSatuan(e.target.value)}
                                onBlur={handleSatuanBlur}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hargaSatuan">Harga per Satuan (Rp)</Label>
                            <Input 
                                id="hargaSatuan"
                                name="hargaSatuan"
                                placeholder="Contoh: 50.000" 
                                value={localHarga} 
                                onChange={e => setLocalHarga(formatHonor(e.target.value))}
                                onBlur={handleHargaBlur}
                                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                                inputMode="numeric"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {pplForStage.map((ppl, index) => (
                        <PPLAllocationItem 
                            key={ppl.id} 
                            ppl={ppl} 
                            index={index}
                            onRemove={() => removePPL(ppl.id)}
                            pplList={pplList}
                            pmlList={pmlList}
                            store={useInputKegiatanStore}
                        />
                    ))}
                    <Button type="button" variant="outline" onClick={() => addPPL('persiapan')} className="w-full border-dashed"><Plus className="w-4 h-4 mr-2"/>Tambah Alokasi PPL</Button>
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
  
  const DokumenItem = ({ doc, store }: { doc: DocumentItem, store: any }) => {
    const [nama, setNama] = useState(doc.nama);
    const [link, setLink] = useState(doc.link);

    const handleNamaBlur = () => {
        if (nama !== doc.nama) {
            store.updateDocument(doc.id, 'nama', nama);
        }
    };

    const handleLinkBlur = () => {
        if (link !== doc.link) {
            store.updateDocument(doc.id, 'link', link);
        }
    };
    
    // Sinkronisasi jika data dari store berubah (misalnya setelah reset)
    useEffect(() => {
        setNama(doc.nama);
        setLink(doc.link);
    }, [doc.nama, doc.link]);

    return (
        <div key={doc.id} className={cn("flex items-center gap-3 p-3 border rounded-lg", doc.isWajib ? "bg-blue-50 border-blue-200" : "bg-gray-50/50")}>
            <div className="flex-grow space-y-2">
                {doc.isWajib ? (
                    <Label className="font-semibold">{doc.nama}</Label>
                ) : (
                    <Input placeholder="Nama Dokumen Pendukung" value={nama} onChange={(e) => setNama(e.target.value)} onBlur={handleNamaBlur} />
                )}
                <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-gray-400"/>
                    <Input placeholder="https://drive.google.com/..." value={link} onChange={(e) => setLink(e.target.value)} onBlur={handleLinkBlur} />
                </div>
            </div>
            {!doc.isWajib ? (<Button type="button" variant="ghost" size="icon" onClick={() => store.removeDocument(doc.id)} className="self-center"><X className="w-4 h-4 text-gray-500"/></Button>) : (<div className="self-center p-2" title="Dokumen Wajib"><Lock className="w-4 h-4 text-gray-400"/></div>)}
        </div>
    );
};
  
  const DokumenContent = ({ tipe, title }: { tipe: "persiapan" | "pengumpulan-data" | "pengolahan-analisis" | "diseminasi-evaluasi", title: string }) => {
    const documents = useInputKegiatanStore(state => state.documents.filter(d => d.tipe === tipe));
    const storeActions = useInputKegiatanStore.getState();
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Dokumen {title}</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => storeActions.addDocumentLink(tipe)} className="flex items-center gap-2"><Plus className="w-4 h-4" />Tambah Dokumen Pendukung</Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {documents.length === 0 ? (<div className="text-center py-8 text-gray-500"><p>Belum ada dokumen untuk fase ini.</p></div>) : (
                    documents.map(doc => (
                         <DokumenItem key={doc.id} doc={doc} store={storeActions} />
                    ))
                )}
            </CardContent>
        </Card>
    );
};

  const StageContent = ({ tipe, title }: { tipe: PPL['tahap'], title: string }) => {
    // Konten stage sekarang bergantung pada topLevelTab
    if (topLevelTab === 'alokasi-ppl') {
      // Hanya tahap persiapan yang punya alokasi PPL di halaman input
      return tipe === 'persiapan' 
        ? <AlokasiPPLContent /> 
        : <Card><CardContent className="p-6 text-center text-gray-500">Manajemen alokasi PPL untuk tahap ini tersedia di halaman Edit Kegiatan setelah kegiatan dibuat.</CardContent></Card>;
    }
    if (topLevelTab === 'dokumen') {
      return <DokumenContent tipe={tipe} title={title} />;
    }
    return null;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Input Kegiatan</h1>
            <p className="text-gray-600">Lengkapi semua informasi kegiatan dalam satu halaman</p>
            {showAutoPopulateMessage && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">✅ {addedPPLCount} PPL telah ditambahkan ke Tahap Persiapan.</p>
                </div>
            )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          {stageTab !== 'info-dasar' && (
                        <Tabs value={topLevelTab} onValueChange={setTopLevelTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="alokasi-ppl">Alokasi PPL</TabsTrigger>
                                <TabsTrigger value="dokumen">Dokumen</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}
            
            <Tabs value={stageTab} onValueChange={setStageTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info-dasar">Info Dasar</TabsTrigger>
            <TabsTrigger value="persiapan">Persiapan</TabsTrigger>
            <TabsTrigger value="pengumpulan-data">Pengumpulan Data</TabsTrigger>
            <TabsTrigger value="pengolahan-analisis">Pengolahan & Analisis</TabsTrigger>
            <TabsTrigger value="diseminasi-evaluasi">Diseminasi & Evaluasi</TabsTrigger>
          </TabsList>
              
              <div className={cn(stageTab !== 'info-dasar' && 'hidden')}>
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader><CardTitle>Informasi Kegiatan</CardTitle><CardDescription>Masukkan detail dasar mengenai kegiatan.</CardDescription></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2"><Label htmlFor="namaKegiatan">Nama Kegiatan *</Label><Input id="namaKegiatan" value={store.namaKegiatan} onChange={(e) => store.updateFormField('namaKegiatan', e.target.value)} placeholder="Contoh: Sensus Penduduk 2020" /></div>
                                            <div className="space-y-2"><Label htmlFor="ketuaTim">Nama Ketua Tim *</Label>
                                                <Select value={store.ketua_tim_id} onValueChange={(value) => store.updateFormField('ketua_tim_id', value)}>
                                                    <SelectTrigger id="ketuaTim"><SelectValue placeholder="Pilih ketua tim" /></SelectTrigger>
                                                    <SelectContent>{ketuaTimList.map((ketua) => (<SelectItem key={ketua.id} value={ketua.id}>{ketua.namaKetua}</SelectItem>))}</SelectContent>
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
                                                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !store[field] && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{store[field] ? format(store[field]!, "dd MMMM yyyy") : <span>Pilih tanggal</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={store[field] as Date} onSelect={(date) => store.updateFormField(field, date)} /></PopoverContent></Popover>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
              
              <TabsContent value="persiapan"><StageContent tipe="persiapan" title="Persiapan" /></TabsContent>
          <TabsContent value="pengumpulan-data"><StageContent tipe="pengumpulan-data" title="Pengumpulan Data" /></TabsContent>
          <TabsContent value="pengolahan-analisis"><StageContent tipe="pengolahan-analisis" title="Pengolahan & Analisis" /></TabsContent>
          <TabsContent value="diseminasi-evaluasi"><StageContent tipe="diseminasi-evaluasi" title="Diseminasi & Evaluasi" /></TabsContent>
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