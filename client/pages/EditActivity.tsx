// client/pages/EditActivity.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Link2, X, CalendarIcon, Plus, Trash2, Lock, Notebook, FileText, Check, ChevronsUpDown, Users, XCircle } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format, parseISO, isValid } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Kegiatan, PPL, Dokumen, PPLMaster, KetuaTim, UserData } from "@shared/api";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import AlertModal from "@/components/AlertModal";
import { Skeleton } from "@/components/ui/skeleton";

type Tahap = 'persiapan' | 'pengumpulan-data' | 'pengolahan-analisis' | 'diseminasi-evaluasi';

interface HonorariumTahap {
  satuanBebanKerja: string;
  hargaSatuan: string;
}

type ClientPPL = Omit<PPL, 'satuanBebanKerja' | 'hargaSatuan'> & { clientId: string };
type ClientDokumen = Dokumen & { clientId: string };

type FormState = Omit<Kegiatan, 'ppl' | 'dokumen' | 'lastUpdated' | 'lastUpdatedBy' | 'namaKetua' | 'tanggalMulaiPersiapan' | 'tanggalSelesaiPersiapan' | 'tanggalMulaiPengumpulanData' | 'tanggalSelesaiPengumpulanData' | 'tanggalMulaiPengolahanAnalisis' | 'tanggalSelesaiPengolahanAnalisis' | 'tanggalMulaiDiseminasiEvaluasi' | 'tanggalSelesaiDiseminasiEvaluasi'> & {
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
    honorarium: Record<Tahap, HonorariumTahap>;
};

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

const fetchActivityDetails = async (id: string): Promise<Kegiatan> => {
    const res = await fetch(`/api/kegiatan/${id}`);
    if (!res.ok) throw new Error("Kegiatan tidak ditemukan");
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

const updateActivity = async (kegiatan: Partial<FormState> & {id: number}): Promise<Kegiatan> => {
    const sanitizedPpl = kegiatan.ppl?.map(({ clientId, namaPPL, besaranHonor, ...rest }) => ({
        ...rest,
        besaranHonor: parseHonor(besaranHonor as string),
        satuanBebanKerja: kegiatan.honorarium?.[rest.tahap as keyof typeof kegiatan.honorarium]?.satuanBebanKerja || '',
        hargaSatuan: parseHonor(kegiatan.honorarium?.[rest.tahap as keyof typeof kegiatan.honorarium]?.hargaSatuan || '0'),
    }));

    const sanitizedData = {
        ...kegiatan,
        dokumen: kegiatan.dokumen?.map(({ clientId, ...rest }) => rest),
        ppl: sanitizedPpl
    };
    delete (sanitizedData as any).honorarium;

    const res = await fetch(`/api/kegiatan/${kegiatan.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sanitizedData) });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal memperbarui kegiatan");
    }
    return res.json();
};

const PPLAllocationItem = React.memo(({ ppl, index, onRemove, onUpdate, pplList, pmlList }: {
    ppl: ClientPPL;
    index: number;
    onRemove: (clientId: string) => void;
    onUpdate: (clientId: string, field: keyof PPL, value: string | number) => void;
    pplList: PPLMaster[];
    pmlList: UserData[];
}) => {
    const [bebanKerja, setBebanKerja] = useState(ppl.bebanKerja);
    const [isPmlComboboxOpen, setIsPmlComboboxOpen] = useState(false);
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);
    
    useEffect(() => {
        setBebanKerja(ppl.bebanKerja);
    }, [ppl.bebanKerja]);

    const handleBebanKerjaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBebanKerja(e.target.value);
    };

    const handleBebanKerjaBlur = () => {
        if (bebanKerja !== ppl.bebanKerja) {
            onUpdate(ppl.clientId, 'bebanKerja', bebanKerja);
        }
    };
    
    return (
        <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
            <div className="flex justify-between items-center">
                <h4 className="font-medium">Alokasi {index + 1}</h4>
                <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(ppl.clientId)}>
                    <Trash2 className="w-4 h-4 text-red-500"/>
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor={`ppl-select-${ppl.clientId}`}>Pilih PPL *</Label>
                     <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                        <PopoverTrigger asChild>
                            <Button id={`ppl-select-${ppl.clientId}`} variant="outline" role="combobox" className="w-full justify-between">
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
                                                    onUpdate(ppl.clientId, 'ppl_master_id', pplOption.id);
                                                    onUpdate(ppl.clientId, 'namaPPL', pplOption.namaPPL);
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
                    <Label htmlFor={`bebanKerja-${ppl.clientId}`}>Jumlah Beban Kerja *</Label>
                    <Input 
                        id={`bebanKerja-${ppl.clientId}`}
                        name={`bebanKerja-${ppl.clientId}`}
                        placeholder="Contoh: 12" 
                        value={bebanKerja}
                        onChange={handleBebanKerjaChange}
                        onBlur={handleBebanKerjaBlur}
                        type="number"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`besaranHonor-${ppl.clientId}`}>Total Honor (Rp) *</Label>
                    <Input id={`besaranHonor-${ppl.clientId}`} name={`besaranHonor-${ppl.clientId}`} value={formatHonor(ppl.besaranHonor)} readOnly className="bg-gray-100"/>
                </div>
                <div className="space-y-2 lg:col-span-5">
                    <Label htmlFor={`namaPML-${ppl.clientId}`}>Nama PML *</Label>
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
                                                    onUpdate(ppl.clientId, 'namaPML', pml.namaLengkap);
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

const DokumenItem = React.memo(({ doc, updateDocument, removeDocument }: {
    doc: ClientDokumen;
    updateDocument: (clientId: string, field: 'nama' | 'link', value: string) => void;
    removeDocument: (clientId: string) => void;
}) => {
    const [nama, setNama] = useState(doc.nama);
    const [link, setLink] = useState(doc.link);
    const isApproved = doc.status === 'Approved';

    const handleNamaBlur = () => {
        if (nama !== doc.nama) {
            updateDocument(doc.clientId, 'nama', nama);
        }
    };

    const handleLinkBlur = () => {
        if (link !== doc.link) {
            updateDocument(doc.clientId, 'link', link);
        }
    };

    useEffect(() => {
        setNama(doc.nama);
        setLink(doc.link);
    }, [doc.nama, doc.link]);

    return (
        <div className={cn("flex items-center gap-3 p-3 border rounded-lg", isApproved ? "bg-green-50 border-green-200" : (doc.isWajib ? "bg-blue-50 border-blue-200" : "bg-gray-50/50"))}>
            <div className="flex-grow space-y-2">
                {doc.isWajib ? <Label className="font-semibold">{doc.nama} *</Label> : <Input placeholder="Nama Dokumen Pendukung" value={nama} onChange={(e) => setNama(e.target.value)} onBlur={handleNamaBlur} disabled={isApproved} />}
                <div className="flex items-center gap-2"><Link2 className="w-4 h-4 text-gray-400"/><Input placeholder="https://drive.google.com/..." value={link} onChange={(e) => setLink(e.target.value)} onBlur={handleLinkBlur} disabled={isApproved} /></div>
            </div>
            {!doc.isWajib && !isApproved ? (<Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(doc.clientId)} className="self-center"><X className="w-4 h-4 text-gray-500"/></Button>) : (<div className="self-center p-2" title={isApproved ? "Dokumen Disetujui" : "Dokumen Wajib"}><Lock className="w-4 h-4 text-gray-400"/></div>)}
        </div>
    );
});

export default function EditActivity() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const location = useLocation();
    const [topLevelTab, setTopLevelTab] = useState("alokasi-ppl");
    const [stageTab, setStageTab] = useState("info-dasar");
    const [formData, setFormData] = useState<Partial<FormState>>({ dokumen: [], ppl: [] });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successModalConfig, setSuccessModalConfig] = useState({ title: "", description: "", action: () => {} });
    const [noteModal, setNoteModal] = useState<{ isOpen: boolean; tipe: Dokumen['tipe'] | null; content: string; isApproved: boolean }>({ isOpen: false, tipe: null, content: '', isApproved: false });
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "" });
    const [notification, setNotification] = useState<string | null>(null);
    const [showClearConfirmModal, setShowClearConfirmModal] = useState<{isOpen: boolean; tahap: Tahap | null}>({isOpen: false, tahap: null});
    const [isInitializing, setIsInitializing] = useState(true);

    const { data: initialData, isLoading, isError } = useQuery({
        queryKey: ['kegiatan', id],
        queryFn: () => fetchActivityDetails(id!),
        enabled: !!id,
    });

    const { data: pplList = [] } = useQuery({ queryKey: ['pplMaster'], queryFn: fetchPPLs });
    const { data: ketuaTimList = [] } = useQuery({ queryKey: ['ketuaTim'], queryFn: fetchKetuaTim });
    const { data: pmlList = [] } = useQuery({ queryKey: ['pmls'], queryFn: fetchPMLs });

    useEffect(() => {
        if (initialData) {
            const parseDate = (dateString?: string): Date | undefined => {
                if (!dateString) return undefined;
                const date = parseISO(dateString);
                return isValid(date) ? date : undefined;
            };
            
            const honorarium: Record<Tahap, HonorariumTahap> = {
              persiapan: { satuanBebanKerja: '', hargaSatuan: '' },
              'pengumpulan-data': { satuanBebanKerja: '', hargaSatuan: '' },
              'pengolahan-analisis': { satuanBebanKerja: '', hargaSatuan: '' },
              'diseminasi-evaluasi': { satuanBebanKerja: '', hargaSatuan: '' },
            };

            (['persiapan', 'pengumpulan-data', 'pengolahan-analisis', 'diseminasi-evaluasi'] as Tahap[]).forEach(tahap => {
                const firstPplInStage = initialData.ppl.find(p => p.tahap === tahap);
                if (firstPplInStage) {
                    honorarium[tahap] = {
                        satuanBebanKerja: firstPplInStage.satuanBebanKerja,
                        hargaSatuan: firstPplInStage.hargaSatuan,
                    };
                }
            });

            setFormData({
                ...initialData,
                honorarium,
                tanggalMulaiPersiapan: parseDate(initialData.tanggalMulaiPersiapan),
                tanggalSelesaiPersiapan: parseDate(initialData.tanggalSelesaiPersiapan),
                tanggalMulaiPengumpulanData: parseDate(initialData.tanggalMulaiPengumpulanData),
                tanggalSelesaiPengumpulanData: parseDate(initialData.tanggalSelesaiPengumpulanData),
                tanggalMulaiPengolahanAnalisis: parseDate(initialData.tanggalMulaiPengolahanAnalisis),
                tanggalSelesaiPengolahanAnalisis: parseDate(initialData.tanggalSelesaiPengolahanAnalisis),
                tanggalMulaiDiseminasiEvaluasi: parseDate(initialData.tanggalMulaiDiseminasiEvaluasi),
                tanggalSelesaiDiseminasiEvaluasi: parseDate(initialData.tanggalSelesaiDiseminasiEvaluasi),
                dokumen: initialData.dokumen.map((d: Dokumen, i) => ({...d, clientId: d.id?.toString() || `doc-${Date.now()}-${i}` })),
                ppl: initialData.ppl.map((p, i) => ({...p, clientId: p.id?.toString() || `ppl-${Date.now()}-${i}` }))
            });
            
            setIsInitializing(false);

            if (location.state?.from === 'create') {
                setStageTab(location.state.tahap);
            }
        }
    }, [initialData]);

    useEffect(() => {
        if (!isInitializing && location.state?.newPpls && location.state?.tahap) {
            const { newPpls, tahap } = location.state;

            setFormData(prev => {
                const existingPplIds = prev.ppl?.filter(p => p.tahap === tahap).map(p => p.ppl_master_id) || [];
                
                const pplsToAdd = newPpls.filter((ppl: PPLMaster) => !existingPplIds.includes(ppl.id));
                const duplicates = newPpls.filter((ppl: PPLMaster) => existingPplIds.includes(ppl.id));

                if (duplicates.length > 0) {
                    setAlertModal({ isOpen: true, title: "PPL Sudah Ada", message: `PPL berikut sudah dialokasikan pada tahap ini: ${duplicates.map((d: PPLMaster) => d.namaPPL).join(', ')}.` });
                }

                if (pplsToAdd.length > 0) {
                    const newAllocations: ClientPPL[] = pplsToAdd.map((ppl: PPLMaster) => ({
                        clientId: `new-ppl-${Date.now()}-${ppl.id}`,
                        ppl_master_id: ppl.id,
                        namaPPL: ppl.namaPPL,
                        namaPML: "",
                        bebanKerja: "",
                        besaranHonor: "0",
                        tahap: tahap,
                    }));
        
                    setNotification(`${pplsToAdd.length} PPL berhasil ditambahkan ke tahap ${tahap.replace(/-/g, ' ')}.`);
                    setTimeout(() => setNotification(null), 5000);
                    setStageTab(tahap);
                    setTopLevelTab('alokasi-ppl');

                    return { ...prev, ppl: [...(prev.ppl || []), ...newAllocations] };
                }
                return prev;
            });

            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, isInitializing, navigate]);

    const mutation = useMutation({
        mutationFn: updateActivity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kegiatan', id] });
            queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
            setSuccessModalConfig({
                title: "Kegiatan Berhasil Diperbarui!",
                description: `Perubahan untuk "${formData.namaKegiatan}" telah disimpan.`,
                action: () => navigate('/dashboard')
            });
            setShowSuccessModal(true);
        },
        onError: (error) => {
            console.error("Gagal menyimpan:", error);
            setAlertModal({ isOpen: true, title: "Gagal Menyimpan", message: `Terjadi kesalahan saat menyimpan: ${error.message}` });
        }
    });

    const handleFormFieldChange = (field: keyof FormState, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const titleCase = (str: string) => str.replace(/-/g, ' ').toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const handleNoteSubmit = () => {
        if (!noteModal.tipe) return;
        const tipe = noteModal.tipe;

        setFormData(prev => {
            const newDocs = [...(prev.dokumen || [])];
            const existingNoteIndex = newDocs.findIndex(d => d.tipe === tipe && d.jenis === 'catatan');

            if (existingNoteIndex > -1) {
                newDocs[existingNoteIndex] = { ...newDocs[existingNoteIndex], link: noteModal.content };
            } else {
                const noteDoc: ClientDokumen = {
                    clientId: `catatan-${tipe}-${Date.now()}`,
                    tipe: tipe,
                    nama: `Catatan Tahap ${titleCase(tipe)}`,
                    link: noteModal.content,
                    jenis: 'catatan',
                    isWajib: false,
                };
                newDocs.push(noteDoc);
            }
            return { ...prev, dokumen: newDocs };
        });

        setNoteModal({ isOpen: false, tipe: null, content: '', isApproved: false });
    };

    const addPPL = (tahap: PPL['tahap']) => {
        const newPPL: ClientPPL = { clientId: `new-ppl-${Date.now()}`, ppl_master_id: "", namaPPL: "", namaPML: "", bebanKerja: "", besaranHonor: "0", tahap };
        setFormData(prev => ({ ...prev, ppl: [...(prev.ppl || []), newPPL]}));
    };

    const removePPL = (clientId: string) => {
        setFormData(prev => ({ ...prev, ppl: prev.ppl?.filter(p => p.clientId !== clientId)}));
    };
    
    const handleHonorariumTahapChange = (tahap: Tahap, field: keyof HonorariumTahap, value: string) => {
        setFormData(prev => {
            if (!prev.honorarium) return prev;
            const newHonorariumState = {
                ...prev.honorarium,
                [tahap]: { ...prev.honorarium[tahap], [field]: value }
            };

            const updatedPpl = prev.ppl?.map(p => {
                if (p.tahap === tahap) {
                    const bebanKerja = parseInt(p.bebanKerja) || 0;
                    const hargaSatuan = field === 'hargaSatuan' ? parseInt(parseHonor(value)) || 0 : parseInt(parseHonor(newHonorariumState[tahap].hargaSatuan)) || 0;
                    return { ...p, besaranHonor: (bebanKerja * hargaSatuan).toString() };
                }
                return p;
            });

            return { ...prev, honorarium: newHonorariumState, ppl: updatedPpl };
        });
    };

    const updatePPL = useCallback((clientId: string, field: keyof PPL, value: string | number) => {
        setFormData(prev => {
            if (!prev.ppl) return prev;
    
            const newPplList = prev.ppl.map(p => {
                if (p.clientId === clientId) {
                    const updatedPpl = { ...p, [field]: value };
                    if (field === 'bebanKerja' && prev.honorarium) {
                        const bebanKerja = parseInt(String(value)) || 0;
                        const hargaSatuan = parseInt(parseHonor(prev.honorarium[p.tahap].hargaSatuan)) || 0;
                        updatedPpl.besaranHonor = (bebanKerja * hargaSatuan).toString();
                    }
                    return updatedPpl;
                }
                return p;
            });
            return { ...prev, ppl: newPplList };
        });
    }, []);

    const handleSuccessAction = () => {
        setShowSuccessModal(false);
        successModalConfig.action();
    };

    const validateDates = (data: Partial<FormState>): boolean => {
        const {
            tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
            tanggalMulaiPengumpulanData, tanggalSelesaiPengumpulanData,
            tanggalMulaiPengolahanAnalisis, tanggalSelesaiPengolahanAnalisis,
            tanggalMulaiDiseminasiEvaluasi, tanggalSelesaiDiseminasiEvaluasi
        } = data;

        if (!tanggalMulaiPersiapan || !tanggalSelesaiPersiapan || !tanggalMulaiPengumpulanData || !tanggalSelesaiPengumpulanData || !tanggalMulaiPengolahanAnalisis || !tanggalSelesaiPengolahanAnalisis || !tanggalMulaiDiseminasiEvaluasi || !tanggalSelesaiDiseminasiEvaluasi) {
            setAlertModal({ isOpen: true, title: "Validasi Gagal", message: "Semua field jadwal kegiatan wajib diisi." });
            return false;
        }

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
        return true;
    };

    const handleSubmit = () => {
        if (!formData.id) {
            alert("Error: ID Kegiatan tidak ditemukan.");
            return;
        }
        if (!validateDates(formData)) {
            return;
        }
        const dataToSubmit = {
            ...formData,
            id: formData.id,
            username: user?.username,
            tanggalMulaiPersiapan: formData.tanggalMulaiPersiapan && isValid(formData.tanggalMulaiPersiapan) ? format(formData.tanggalMulaiPersiapan, 'yyyy-MM-dd') : undefined,
            tanggalSelesaiPersiapan: formData.tanggalSelesaiPersiapan && isValid(formData.tanggalSelesaiPersiapan) ? format(formData.tanggalSelesaiPersiapan, 'yyyy-MM-dd') : undefined,
            tanggalMulaiPengumpulanData: formData.tanggalMulaiPengumpulanData && isValid(formData.tanggalMulaiPengumpulanData) ? format(formData.tanggalMulaiPengumpulanData, 'yyyy-MM-dd') : undefined,
            tanggalSelesaiPengumpulanData: formData.tanggalSelesaiPengumpulanData && isValid(formData.tanggalSelesaiPengumpulanData) ? format(formData.tanggalSelesaiPengumpulanData, 'yyyy-MM-dd') : undefined,
            tanggalMulaiPengolahanAnalisis: formData.tanggalMulaiPengolahanAnalisis && isValid(formData.tanggalMulaiPengolahanAnalisis) ? format(formData.tanggalMulaiPengolahanAnalisis, 'yyyy-MM-dd') : undefined,
            tanggalSelesaiPengolahanAnalisis: formData.tanggalSelesaiPengolahanAnalisis && isValid(formData.tanggalSelesaiPengolahanAnalisis) ? format(formData.tanggalSelesaiPengolahanAnalisis, 'yyyy-MM-dd') : undefined,
            tanggalMulaiDiseminasiEvaluasi: formData.tanggalMulaiDiseminasiEvaluasi && isValid(formData.tanggalMulaiDiseminasiEvaluasi) ? format(formData.tanggalMulaiDiseminasiEvaluasi, 'yyyy-MM-dd') : undefined,
            tanggalSelesaiDiseminasiEvaluasi: formData.tanggalSelesaiDiseminasiEvaluasi && isValid(formData.tanggalSelesaiDiseminasiEvaluasi) ? format(formData.tanggalSelesaiDiseminasiEvaluasi, 'yyyy-MM-dd') : undefined,
        };
        mutation.mutate(dataToSubmit as Partial<FormState> & {id: number});
    };

    const AlokasiPPLContent = ({ tahap }: { tahap: PPL['tahap'] }) => {
        const pplForStage = useMemo(() => formData.ppl?.filter(p => p.tahap === tahap) || [], [formData.ppl, tahap]);
        const honorariumTahap = formData.honorarium?.[tahap];
        
        const [localSatuan, setLocalSatuan] = useState(honorariumTahap?.satuanBebanKerja || '');
        const [localHarga, setLocalHarga] = useState(formatHonor(honorariumTahap?.hargaSatuan || ''));

        useEffect(() => {
            if(honorariumTahap) {
                setLocalSatuan(honorariumTahap.satuanBebanKerja);
                setLocalHarga(formatHonor(honorariumTahap.hargaSatuan));
            }
        }, [honorariumTahap]);
        
        const handleHargaBlur = () => {
            if (honorariumTahap && parseHonor(localHarga) !== parseHonor(honorariumTahap.hargaSatuan)) {
                handleHonorariumTahapChange(tahap, 'hargaSatuan', localHarga);
            }
        };
        
        const handleSatuanBlur = () => {
            if (honorariumTahap && localSatuan !== honorariumTahap.satuanBebanKerja) {
                handleHonorariumTahapChange(tahap, 'satuanBebanKerja', localSatuan);
            }
        };

        const handleClearPPLs = () => {
            setFormData(prev => ({ ...prev, ppl: prev.ppl?.filter(p => p.tahap !== tahap)}));
            setShowClearConfirmModal({isOpen: false, tahap: null});
        }

        if (!honorariumTahap) return <div>Memuat...</div>;

        return (
            <Card>
                <CardHeader>
                     <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Alokasi PPL & PML</CardTitle>
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
                                <Link to="/daftar-ppl" state={{ from: 'edit', kegiatanId: id, tahap: tahap, existingPplIds: pplForStage.map(p => p.ppl_master_id) }}><Users className="w-4 h-4 mr-2" />Pilih dari Daftar PPL</Link>
                            </Button>
                         </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="p-4 border rounded-lg bg-blue-50/50 space-y-4">
                        <h4 className="font-medium text-gray-800">Pengaturan Honorarium Tahap {titleCase(tahap)}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`satuanBebanKerja-${tahap}`}>Satuan Beban Kerja</Label>
                                <Input 
                                    id={`satuanBebanKerja-${tahap}`}
                                    name={`satuanBebanKerja-${tahap}`}
                                    placeholder="Contoh: Dokumen" 
                                    value={localSatuan} 
                                    onChange={e => setLocalSatuan(e.target.value)} 
                                    onBlur={handleSatuanBlur}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`hargaSatuan-${tahap}`}>Harga per Satuan (Rp)</Label>
                                <Input 
                                    id={`hargaSatuan-${tahap}`}
                                    name={`hargaSatuan-${tahap}`}
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
                                key={ppl.clientId}
                                ppl={ppl}
                                index={index}
                                onRemove={removePPL}
                                onUpdate={updatePPL}
                                pplList={pplList}
                                pmlList={pmlList}
                            />
                        ))}
                        <Button type="button" variant="outline" onClick={() => addPPL(tahap)} className="w-full border-dashed"><Plus className="w-4 h-4 mr-2"/>Tambah Alokasi PPL</Button>
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
    
    const DokumenContent = ({ tipe, title }: { tipe: Dokumen['tipe'], title: string }) => {
        const documents = useMemo(() => formData.dokumen?.filter(d => d.tipe === tipe && d.jenis !== 'catatan') || [], [formData.dokumen, tipe]);
        const note = useMemo(() => formData.dokumen?.find(d => d.tipe === tipe && d.jenis === 'catatan'), [formData.dokumen, tipe]);
        const isNoteApproved = note?.status === 'Approved';

        const updateDocument = (clientId: string, field: 'nama' | 'link', value: string) => {
            setFormData(prev => ({ ...prev, dokumen: prev.dokumen?.map(d => (d.clientId === clientId ? { ...d, [field]: value } : d)) }));
        };
        const removeDocument = (clientId: string) => {
            setFormData(prev => ({ ...prev, dokumen: prev.dokumen?.filter(d => d.clientId !== clientId) }));
        };
         const addDocument = (tipe: Dokumen['tipe']) => {
            const newDoc: ClientDokumen = { clientId: `new-doc-${Date.now()}`, tipe, nama: "", link: "", jenis: 'link', isWajib: false };
            setFormData(prev => ({...prev, dokumen: [...(prev.dokumen || []), newDoc] }));
        };

        return (
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div><CardTitle>Dokumen {title}</CardTitle><CardDescription className="mt-1">Isi link untuk dokumen wajib, tambahkan dokumen pendukung, dan kelola catatan.</CardDescription></div>
                        <div className="flex flex-shrink-0 gap-2">
                           <Button type="button" variant="outline" size="sm" onClick={() => setNoteModal({ isOpen: true, tipe, content: note?.link || '', isApproved: isNoteApproved })} className="flex items-center gap-2"><Notebook className="w-4 h-4" />{note ? 'Edit' : 'Tambah'} Catatan</Button>
                           <Button type="button" variant="outline" size="sm" onClick={() => addDocument(tipe)} className="flex items-center gap-2"><Plus className="w-4 h-4" />Dokumen</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {note && (
                         <div className={cn("flex items-center gap-3 p-3 border rounded-lg", isNoteApproved ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200")}>
                            <div className="flex-grow space-y-2"><Label className="font-semibold">{note.nama}</Label><p className="text-sm text-gray-600 truncate">{note.link || 'Catatan kosong. Klik edit untuk mengisi.'}</p></div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => setNoteModal({ isOpen: true, tipe, content: note.link, isApproved: isNoteApproved })} className="self-center"><Notebook className="w-4 h-4 text-gray-500"/></Button>
                        </div>
                    )}
                    {documents.map(doc => (
                        <DokumenItem key={doc.clientId} doc={doc} updateDocument={updateDocument} removeDocument={removeDocument} />
                    ))}
                    {documents.length === 0 && !note && (<div className="text-center py-8 text-gray-500"><p>Belum ada dokumen atau catatan untuk fase ini.</p></div>)}
                </CardContent>
            </Card>
        );
    };

    if (isLoading || isInitializing) {
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

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" asChild><Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Kembali</Link></Button>
                    <Button variant="outline" asChild><Link to={`/view-documents/${id}`}><FileText className="w-4 h-4 mr-2" />Lihat Dokumen</Link></Button>
                    <div className="ml-4"><h1 className="text-3xl font-bold">Edit Kegiatan</h1><p className="text-gray-600">Perbarui informasi dan kelola dokumen.</p></div>
                </div>
                {notification && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                        ✅ {notification}
                    </div>
                )}
                
                {stageTab !== 'info-dasar' && (
                    <Tabs value={topLevelTab} onValueChange={setTopLevelTab} className="mb-6">
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
                                <CardHeader><CardTitle>Informasi Kegiatan</CardTitle><CardDescription>Perbarui detail dasar mengenai kegiatan.</CardDescription></CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><Label htmlFor="namaKegiatan">Nama Kegiatan *</Label><Input id="namaKegiatan" value={formData.namaKegiatan || ''} onChange={(e) => handleFormFieldChange('namaKegiatan', e.target.value)} placeholder="Contoh: Sensus Penduduk 2024" /></div>
                                    <div className="space-y-2"><Label htmlFor="ketuaTim">Nama Ketua Tim *</Label>
                                        <Select value={formData.ketua_tim_id} onValueChange={(value) => handleFormFieldChange('ketua_tim_id', value)}>
                                            <SelectTrigger id="ketuaTim"><SelectValue placeholder="Pilih ketua tim" /></SelectTrigger>
                                            <SelectContent>{ketuaTimList.map((ketua) => (<SelectItem key={ketua.id} value={ketua.id}>{ketua.namaKetua}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>
                                  </div>
                                  <div className="space-y-2"><Label htmlFor="deskripsiKegiatan">Deskripsi Kegiatan</Label><Textarea id="deskripsiKegiatan" value={formData.deskripsiKegiatan || ''} onChange={(e) => handleFormFieldChange('deskripsiKegiatan', e.target.value)} placeholder="Deskripsikan kegiatan dan pembagian tugas secara singkat." /></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Jadwal Kegiatan *</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    {([ {label: 'Mulai Persiapan', field: 'tanggalMulaiPersiapan'}, {label: 'Selesai Persiapan', field: 'tanggalSelesaiPersiapan'},{label: 'Mulai Pengumpulan Data', field: 'tanggalMulaiPengumpulanData'}, {label: 'Selesai Pengumpulan Data', field: 'tanggalSelesaiPengumpulanData'}, {label: 'Mulai Pengolahan & Analisis', field: 'tanggalMulaiPengolahanAnalisis'}, {label: 'Selesai Pengolahan & Analisis', field: 'tanggalSelesaiPengolahanAnalisis'}, {label: 'Mulai Diseminasi & Evaluasi', field: 'tanggalMulaiDiseminasiEvaluasi'}, {label: 'Selesai Diseminasi & Evaluasi', field: 'tanggalSelesaiDiseminasiEvaluasi'}] as {label: string, field: DateFieldName}[]).map(({label, field}) => (
                                        <div key={field} className="space-y-2"><Label>{label}</Label>
                                            <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !formData[field] && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{formData[field] ? format(formData[field]!, "dd MMMM yyyy") : <span>Pilih tanggal</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData[field]} onSelect={(date) => handleFormFieldChange(field, date as Date)} /></PopoverContent></Popover>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    
                    <TabsContent value="info-dasar" />

                    <TabsContent value="persiapan">
                        {topLevelTab === 'alokasi-ppl' ? <AlokasiPPLContent tahap="persiapan" /> : <DokumenContent tipe="persiapan" title="Persiapan"/>}
                    </TabsContent>
                    <TabsContent value="pengumpulan-data">
                        {topLevelTab === 'alokasi-ppl' ? <AlokasiPPLContent tahap="pengumpulan-data" /> : <DokumenContent tipe="pengumpulan-data" title="Pengumpulan Data"/>}
                    </TabsContent>
                    <TabsContent value="pengolahan-analisis">
                        {topLevelTab === 'alokasi-ppl' ? <AlokasiPPLContent tahap="pengolahan-analisis" /> : <DokumenContent tipe="pengolahan-analisis" title="Pengolahan & Analisis"/>}
                    </TabsContent>
                    <TabsContent value="diseminasi-evaluasi">
                        {topLevelTab === 'alokasi-ppl' ? <AlokasiPPLContent tahap="diseminasi-evaluasi" /> : <DokumenContent tipe="diseminasi-evaluasi" title="Diseminasi & Evaluasi"/>}
                    </TabsContent>
                </Tabs>
                
                <div className="flex justify-center mt-8">
                    <Button onClick={handleSubmit} disabled={mutation.isPending} className="min-w-48 bg-bps-green-600 hover:bg-bps-green-700" size="lg"><Save className="w-4 h-4 mr-2" />{mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
                </div>
                
                <SuccessModal 
                    isOpen={showSuccessModal} 
                    onClose={() => setShowSuccessModal(false)} 
                    onAction={handleSuccessAction} 
                    title={successModalConfig.title} 
                    description={successModalConfig.description} 
                    actionLabel="Ke Dashboard" 
                />
            </div>
            <Dialog open={noteModal.isOpen} onOpenChange={(isOpen) => !isOpen && setNoteModal({ isOpen: false, tipe: null, content: '', isApproved: false })}>
                <DialogContent><DialogHeader><DialogTitle>Tambah/Edit Catatan</DialogTitle><DialogDescription>Isi catatan untuk tahap ini. {noteModal.isApproved && "Catatan ini sudah disetujui dan tidak bisa diedit."}</DialogDescription></DialogHeader><Textarea value={noteModal.content} onChange={(e) => setNoteModal(prev => ({...prev, content: e.target.value}))} rows={8} placeholder="Tulis catatan di sini..." disabled={noteModal.isApproved} /><DialogFooter><Button variant="outline" onClick={() => setNoteModal({ isOpen: false, tipe: null, content: '', isApproved: false })}>Batal</Button><Button onClick={handleNoteSubmit} disabled={noteModal.isApproved}>Simpan Catatan</Button></DialogFooter></DialogContent>
            </Dialog>
            <AlertModal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ isOpen: false, title: "", message: "" })} title={alertModal.title} description={alertModal.message} />
        </Layout>
    );
}