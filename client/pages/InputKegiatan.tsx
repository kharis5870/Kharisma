// client/pages/InputKegiatan.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
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
import { CalendarIcon, Plus, Trash2, Link2, X, Lock, Check, ChevronsUpDown, Users } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useInputKegiatanStore from "@/stores/useInputKegiatanStore";
import { PPLMaster, KetuaTim, PPL } from "@shared/api";
import { useAuth } from "@/contexts/AuthContext";

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
const createActivity = async (data: any) => {
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

// **Komponen PPL Item yang Dioptimalkan**
const PPLAllocationItem = React.memo(({ ppl, index, onRemove, pplList, store }: any) => {
    const [bebanKerja, setBebanKerja] = useState(ppl.bebanKerja);
    const [namaPML, setNamaPML] = useState(ppl.namaPML);
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);
    
    const honorariumTahap = useInputKegiatanStore(state => state.honorarium[ppl.tahap as keyof typeof state.honorarium]);

    useEffect(() => {
        setBebanKerja(ppl.bebanKerja);
        setNamaPML(ppl.namaPML);
    }, [ppl.bebanKerja, ppl.namaPML]);

    const totalHonor = useMemo(() => {
        const beban = parseInt(String(bebanKerja)) || 0;
        const harga = parseInt(parseHonor(honorariumTahap.hargaSatuan)) || 0;
        return (beban * harga).toString();
    }, [bebanKerja, honorariumTahap.hargaSatuan]);
    
    const handleBebanKerjaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBebanKerja(e.target.value);
    };

    const handleBebanKerjaBlur = () => {
        if (bebanKerja !== ppl.bebanKerja) {
            store.getState().updatePPL(ppl.id, 'bebanKerja', bebanKerja);
        }
    };
    
    const handleNamaPMLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNamaPML(e.target.value);
    };
    
    const handleNamaPMLBlur = () => {
        if (namaPML !== ppl.namaPML) {
            store.getState().updatePPL(ppl.id, 'namaPML', namaPML);
        }
    };

    useEffect(() => {
        if (ppl.besaranHonor !== totalHonor) {
            store.getState().updatePPL(ppl.id, 'besaranHonor', totalHonor);
        }
    }, [totalHonor, ppl.id, ppl.besaranHonor, store]);
    
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
                    <Input 
                        id={`namaPML-${ppl.id}`}
                        name={`namaPML-${ppl.id}`}
                        placeholder="Nama PML" 
                        value={namaPML} 
                        onChange={handleNamaPMLChange}
                        onBlur={handleNamaPMLBlur}
                    />
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
  
  const [activeTab, setActiveTab] = useState("info-dasar");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAutoPopulateMessage, setShowAutoPopulateMessage] = useState(false);

  const store = useInputKegiatanStore();

  useEffect(() => {
    if (selectedPPLsForActivity.length > 0) {
        const newAllocations = selectedPPLsForActivity.map(ppl => ({
            id: `ppl-${ppl.id}-${Date.now()}`,
            ppl_master_id: ppl.id,
            namaPPL: ppl.namaPPL,
            bebanKerja: "",
            besaranHonor: "0",
            namaPML: "",
            tahap: "persiapan" as const
        }));
        store.setPplAllocations(newAllocations);
        setShowAutoPopulateMessage(true);
        setActiveTab("persiapan"); 
        setTimeout(() => setShowAutoPopulateMessage(false), 5000);
        clearSelectedPPLsForActivity();
    }
  }, [selectedPPLsForActivity, store.setPplAllocations, clearSelectedPPLsForActivity]);


  const mutation = useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
      setShowSuccessModal(true);
      store.resetForm();
    },
  });

  const validateForm = () => {
    return store.namaKegiatan && store.ketua_tim_id && 
           store.tanggalMulaiPersiapan && store.tanggalSelesaiPersiapan &&
           store.tanggalMulaiPengumpulanData && store.tanggalSelesaiPengumpulanData &&
           store.tanggalMulaiPengolahanAnalisis && store.tanggalSelesaiPengolahanAnalisis &&
           store.tanggalMulaiDiseminasiEvaluasi && store.tanggalSelesaiDiseminasiEvaluasi &&
           store.pplAllocations.every(ppl => ppl.ppl_master_id && ppl.bebanKerja && ppl.besaranHonor && ppl.namaPML);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
        alert("Harap lengkapi semua field bertanda *.");
        return;
    }
    mutation.mutate({
        ...store,
        username: user?.username,
        tanggalMulaiPersiapan: format(store.tanggalMulaiPersiapan!, 'yyyy-MM-dd'),
        tanggalSelesaiPersiapan: format(store.tanggalSelesaiPersiapan!, 'yyyy-MM-dd'),
        tanggalMulaiPengumpulanData: format(store.tanggalMulaiPengumpulanData!, 'yyyy-MM-dd'),
        tanggalSelesaiPengumpulanData: format(store.tanggalSelesaiPengumpulanData!, 'yyyy-MM-dd'),
        tanggalMulaiPengolahanAnalisis: format(store.tanggalMulaiPengolahanAnalisis!, 'yyyy-MM-dd'),
        tanggalSelesaiPengolahanAnalisis: format(store.tanggalSelesaiPengolahanAnalisis!, 'yyyy-MM-dd'),
        tanggalMulaiDiseminasiEvaluasi: format(store.tanggalMulaiDiseminasiEvaluasi!, 'yyyy-MM-dd'),
        tanggalSelesaiDiseminasiEvaluasi: format(store.tanggalSelesaiDiseminasiEvaluasi!, 'yyyy-MM-dd'),
    });
  };

  const handleSuccessAction = () => navigate('/dashboard');

  const AlokasiPPLContent = () => {
    const tahap = 'persiapan';
    const pplForStage = useInputKegiatanStore(state => state.pplAllocations.filter(p => p.tahap === tahap));
    const honorariumTahap = useInputKegiatanStore(state => state.honorarium[tahap]);
    const { updateHonorariumTahap, addPPL, removePPL } = useInputKegiatanStore.getState();
    
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

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Alokasi PPL & PML (Tahap Persiapan)</CardTitle>
                        <CardDescription>Atur detail honorarium untuk tahap ini, lalu alokasikan PPL.</CardDescription>
                    </div>
                    <Button variant="outline" asChild>
                        <Link to="/daftar-ppl"><Users className="w-4 h-4 mr-2" />Pilih dari Daftar PPL</Link>
                    </Button>
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
                            store={useInputKegiatanStore}
                        />
                    ))}
                    <Button type="button" variant="outline" onClick={() => addPPL('persiapan')} className="w-full border-dashed"><Plus className="w-4 h-4 mr-2"/>Tambah Alokasi PPL</Button>
                </div>
            </CardContent>
        </Card>
    );
  };
  
  const DokumenContent = ({ tipe, title }: { tipe: "persiapan" | "pengumpulan-data" | "pengolahan-analisis" | "diseminasi-evaluasi", title: string }) => {
    const documents = store.documents.filter(d => d.tipe === tipe);
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Dokumen {title}</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => store.addDocumentLink(tipe)} className="flex items-center gap-2"><Plus className="w-4 h-4" />Tambah Dokumen Pendukung</Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {documents.length === 0 ? (<div className="text-center py-8 text-gray-500"><p>Belum ada dokumen untuk fase ini.</p></div>) : (
                    documents.map(doc => (
                         <div key={doc.id} className={cn("flex items-center gap-3 p-3 border rounded-lg", doc.isWajib ? "bg-blue-50 border-blue-200" : "bg-gray-50/50")}>
                            <div className="flex-grow space-y-2">
                                {doc.isWajib ? (
                                    <Label className="font-semibold">{doc.nama}</Label>
                                ) : (
                                    <Input placeholder="Nama Dokumen Pendukung" value={doc.nama} onChange={(e) => store.updateDocument(doc.id, 'nama', e.target.value)} />
                                )}
                                <div className="flex items-center gap-2">
                                    <Link2 className="w-4 h-4 text-gray-400"/>
                                    <Input placeholder="https://drive.google.com/..." value={doc.link} onChange={(e) => store.updateDocument(doc.id, 'link', e.target.value)} />
                                </div>
                            </div>
                            {!doc.isWajib ? (<Button type="button" variant="ghost" size="icon" onClick={() => store.removeDocument(doc.id)} className="self-center"><X className="w-4 h-4 text-gray-500"/></Button>) : (<div className="self-center p-2" title="Dokumen Wajib"><Lock className="w-4 h-4 text-gray-400"/></div>)}
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
  };

  const StageTabContent = ({ tipe, title }: { tipe: PPL['tahap'], title: string }) => (
    <Tabs defaultValue="alokasi-ppl" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="alokasi-ppl">Alokasi PPL</TabsTrigger>
            <TabsTrigger value="dokumen">Dokumen</TabsTrigger>
        </TabsList>
        <TabsContent value="alokasi-ppl">
            {tipe === 'persiapan' ? <AlokasiPPLContent /> : (
                <Card><CardContent className="p-6 text-center text-gray-500">Manajemen alokasi PPL untuk tahap ini tersedia di halaman Edit Kegiatan setelah kegiatan dibuat.</CardContent></Card>
            )}
        </TabsContent>
        <TabsContent value="dokumen">
            <DokumenContent tipe={tipe} title={title} />
        </TabsContent>
    </Tabs>
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Input Kegiatan</h1>
            <p className="text-gray-600">Lengkapi semua informasi kegiatan dalam satu halaman</p>
            {showAutoPopulateMessage && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">✅ {store.pplAllocations.length} PPL telah ditambahkan ke Tahap Persiapan.</p>
                </div>
            )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="info-dasar">Info Dasar</TabsTrigger>
                  <TabsTrigger value="persiapan">Persiapan</TabsTrigger>
                  <TabsTrigger value="pengumpulan-data">Pengumpulan Data</TabsTrigger>
                  <TabsTrigger value="pengolahan-analisis">Pengolahan & Analisis</TabsTrigger>
                  <TabsTrigger value="diseminasi-evaluasi">Diseminasi & Evaluasi</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info-dasar" className="space-y-6">
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
                        {([ 
                            {label: 'Mulai Persiapan', field: 'tanggalMulaiPersiapan'}, {label: 'Selesai Persiapan', field: 'tanggalSelesaiPersiapan'},
                            {label: 'Mulai Pengumpulan Data', field: 'tanggalMulaiPengumpulanData'}, {label: 'Selesai Pengumpulan Data', field: 'tanggalSelesaiPengumpulanData'},
                            {label: 'Mulai Pengolahan & Analisis', field: 'tanggalMulaiPengolahanAnalisis'}, {label: 'Selesai Pengolahan & Analisis', field: 'tanggalSelesaiPengolahanAnalisis'},
                            {label: 'Mulai Diseminasi & Evaluasi', field: 'tanggalMulaiDiseminasiEvaluasi'}, {label: 'Selesai Diseminasi & Evaluasi', field: 'tanggalSelesaiDiseminasiEvaluasi'}
                        ] as {label: string, field: DateFieldName}[]).map(({label, field}) => (
                            <div key={field} className="space-y-2">
                                <Label>{label}</Label>
                                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !store[field] && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{store[field] ? format(store[field]!, "dd MMMM yyyy") : <span>Pilih tanggal</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={store[field] as Date} onSelect={(date) => store.updateFormField(field, date)} /></PopoverContent></Popover>
                            </div>
                        ))}
                    </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="persiapan"><StageTabContent tipe="persiapan" title="Persiapan"/></TabsContent>
              <TabsContent value="pengumpulan-data"><StageTabContent tipe="pengumpulan-data" title="Pengumpulan Data"/></TabsContent>
              <TabsContent value="pengolahan-analisis"><StageTabContent tipe="pengolahan-analisis" title="Pengolahan & Analisis"/></TabsContent>
              <TabsContent value="diseminasi-evaluasi"><StageTabContent tipe="diseminasi-evaluasi" title="Diseminasi & Evaluasi"/></TabsContent>
            </Tabs>

            <div className="flex justify-center mt-8">
                <Button type="submit" size="lg" disabled={!validateForm() || mutation.isPending} className="min-w-48 bg-bps-green-600 hover:bg-bps-green-700">
                    {mutation.isPending ? "Menyimpan..." : "Simpan Kegiatan"}
                </Button>
            </div>
        </form>
        <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} onAction={handleSuccessAction} title="Kegiatan Berhasil Disimpan!" description={`Kegiatan "${store.namaKegiatan}" telah berhasil dibuat.`} actionLabel="Ke Dashboard" />
      </div>
    </Layout>
  );
}