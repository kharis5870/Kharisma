// client/pages/EditActivity.tsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { ArrowLeft, Save, Link2, X, CalendarIcon, Plus, Trash2, Lock, Check, ChevronsUpDown, Users, XCircle } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge"; 
import { format, parseISO, isValid, getMonth, getYear, eachMonthOfInterval, format as formatDateFns } from "date-fns";
import { id as localeID } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Kegiatan, PPL, Dokumen, PPLMaster, KetuaTim, UserData } from "@shared/api";
import { cn } from "@/lib/utils";
import AlertModal from "@/components/AlertModal";
import { Skeleton } from "@/components/ui/skeleton";

// --- Type Definitions ---
type Tahap = 'persiapan' | 'pengumpulan-data' | 'pengolahan-analisis' | 'diseminasi-evaluasi';
type TahapPPL = 'pengumpulan-data' | 'pengolahan-analisis';

export interface HonorariumDetail {
    jenis_pekerjaan: 'listing' | 'pencacahan' | 'pengolahan';
    bebanKerja: string;
    satuanBebanKerja?: string | null;
    hargaSatuan?: string | null;
    besaranHonor: string;
}

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
    bulanPembayaranHonor?: string;
    honorariumSettings: HonorariumSettings;
};

type DateFieldName =
  | 'tanggalMulaiPersiapan' | 'tanggalSelesaiPersiapan'
  | 'tanggalMulaiPengumpulanData' | 'tanggalSelesaiPengumpulanData'
  | 'tanggalMulaiPengolahanAnalisis' | 'tanggalSelesaiPengolahanAnalisis'
  | 'tanggalMulaiDiseminasiEvaluasi' | 'tanggalSelesaiDiseminasiEvaluasi';

// --- Helper Functions ---
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

// --- API Fetching Functions ---
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
    const sanitizedData = {
        ...kegiatan,
        dokumen: kegiatan.dokumen,
        ppl: kegiatan.ppl?.map(({ clientId, namaPPL, ...rest }) => rest),
    };

    const res = await fetch(`/api/kegiatan/${kegiatan.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sanitizedData) });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal memperbarui kegiatan");
    }
    return res.json();
};


// --- Sub-Components ---

const HonorPaymentMonthSelector = ({ formData, handleFormFieldChange }: { formData: Partial<FormState>, handleFormFieldChange: (field: keyof FormState, value: any) => void }) => {
    const { tanggalMulaiPersiapan, tanggalSelesaiDiseminasiEvaluasi, bulanPembayaranHonor } = formData;
    const [showOtherMonths, setShowOtherMonths] = useState(false);

    useEffect(() => {
        if (tanggalMulaiPersiapan && tanggalSelesaiDiseminasiEvaluasi) {
            const start = tanggalMulaiPersiapan;
            const end = tanggalSelesaiDiseminasiEvaluasi;
            if (getMonth(start) === getMonth(end) && getYear(start) === getYear(end)) {
                const autoSelectedMonth = formatDateFns(start, 'MM-yyyy');
                if (bulanPembayaranHonor !== autoSelectedMonth) {
                    handleFormFieldChange('bulanPembayaranHonor', autoSelectedMonth);
                }
            }
        }
    }, [tanggalMulaiPersiapan, tanggalSelesaiDiseminasiEvaluasi, bulanPembayaranHonor, handleFormFieldChange]);

    const paymentMonthOptions = useMemo(() => {
        if (!tanggalMulaiPersiapan || !tanggalSelesaiDiseminasiEvaluasi) return [];
        const months = eachMonthOfInterval({ start: tanggalMulaiPersiapan, end: tanggalSelesaiDiseminasiEvaluasi });
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

    if (!tanggalMulaiPersiapan || !tanggalSelesaiDiseminasiEvaluasi || (getMonth(tanggalMulaiPersiapan) === getMonth(tanggalSelesaiDiseminasiEvaluasi) && getYear(tanggalMulaiPersiapan) === getYear(tanggalSelesaiDiseminasiEvaluasi))) {
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
                        handleFormFieldChange('bulanPembayaranHonor', '');
                    } else {
                        handleFormFieldChange('bulanPembayaranHonor', value);
                    }
                }}
            >
                <SelectTrigger id="bulanPembayaran"><SelectValue placeholder="Pilih bulan pembayaran honor" /></SelectTrigger>
                <SelectContent>
                    {(showOtherMonths ? allYearMonths : paymentMonthOptions).map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                    {!showOtherMonths && <SelectItem value="lainnya">Pilih Bulan Lainnya...</SelectItem>}
                </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Pilih bulan di mana honor untuk kegiatan ini akan dibayarkan.</p>
        </div>
    );
};


const PPLAllocationItem = React.memo(({ ppl, index, onRemove, onUpdate, pplList, pmlList, honorariumSettings, existingPplIds }: {
    ppl: ClientPPL;
    index: number;
    onRemove: (clientId: string) => void;
    onUpdate: (clientId: string, field: keyof PPL | 'honorarium', value: any) => void;
    pplList: PPLMaster[];
    pmlList: UserData[];
    honorariumSettings: FormState['honorariumSettings'];
    existingPplIds: (string | number)[];
}) => {
    const [openPPL, setOpenPPL] = useState(false);
    const [openPML, setOpenPML] = useState(false);
    const [localBebanKerja, setLocalBebanKerja] = useState<Record<string, string>>({});

    useEffect(() => {
        const initialBeban: Record<string, string> = {};
        ppl.honorarium.forEach(h => {
          initialBeban[h.jenis_pekerjaan] = h.bebanKerja || '';
        });
        setLocalBebanKerja(initialBeban);
    }, [ppl.honorarium]);

    const handleBebanKerjaChange = (jenis: string, value: string) => {
      setLocalBebanKerja(prev => ({ ...prev, [jenis]: value }));
    };

    const handleBebanKerjaBlur = (jenis: HonorariumDetail['jenis_pekerjaan']) => {
        const newBebanKerja = localBebanKerja[jenis] || '0';
        const honorDetail = ppl.honorarium.find(h => h.jenis_pekerjaan === jenis);
        if (honorDetail && honorDetail.bebanKerja !== newBebanKerja) {
            const updatedHonorarium = ppl.honorarium.map(h => {
                if (h.jenis_pekerjaan === jenis) {
                    let hargaSatuanKey: keyof typeof honorariumSettings;
                    if (jenis === 'listing') hargaSatuanKey = 'pengumpulan-data-listing';
                    else if (jenis === 'pencacahan') hargaSatuanKey = 'pengumpulan-data-pencacahan';
                    else hargaSatuanKey = 'pengolahan-analisis';
                    const hargaSatuan = parseInt(parseHonor(honorariumSettings[hargaSatuanKey].hargaSatuan)) || 0;
                    return {
                        ...h,
                        bebanKerja: newBebanKerja,
                        besaranHonor: (parseInt(newBebanKerja) * hargaSatuan).toString()
                    };
                }
                return h;
            });
            onUpdate(ppl.clientId, 'honorarium', updatedHonorarium);
        }
    };
    
    const getHonorDetail = (jenis: HonorariumDetail['jenis_pekerjaan']) => {
        return ppl.honorarium?.find(h => h.jenis_pekerjaan === jenis) || { jenis_pekerjaan: jenis, bebanKerja: '', besaranHonor: '0' };
    };

    const totalHonorPPL = ppl.honorarium?.reduce((sum, h) => sum + parseInt(h.besaranHonor || '0'), 0) || 0;
    const selectedPML = pmlList.find(p => p.namaLengkap === ppl.namaPML);
    const selectedPPL = pplList.find(p => String(p.id) === String(ppl.ppl_master_id));
    
    const availablePplList = pplList.filter(
        (p: PPLMaster) => !existingPplIds.includes(String(p.id)) || p.id === selectedPPL?.id
    );
    
    return (
        <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
            <div className="flex justify-between items-center">
                <h4 className="font-medium">{ppl.namaPPL || `Alokasi Baru ${index + 1}`}</h4>
                <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(ppl.clientId)}>
                    <Trash2 className="w-4 h-4 text-red-500"/>
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
                                            {availablePplList.map(p => (
                                                <CommandItem key={p.id} value={`${p.id} ${p.namaPPL}`} onSelect={() => {
                                                    onUpdate(ppl.clientId, 'ppl_master_id', p.id);
                                                    onUpdate(ppl.clientId, 'namaPPL', p.namaPPL);
                                                    setOpenPPL(false);
                                                }}>
                                                    <Check className={cn("mr-2 h-4 w-4", String(ppl.ppl_master_id) === String(p.id) ? "opacity-100" : "opacity-0")} />
                                                    <div>{p.namaPPL} <span className="text-xs text-gray-500">({p.id})</span></div>
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
                                                <CommandItem
                                                    key={pml.id}
                                                    value={`${pml.id} ${pml.namaLengkap}`}
                                                    onSelect={() => {
                                                        onUpdate(ppl.clientId, 'namaPML', pml.namaLengkap);
                                                        setOpenPML(false);
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

                {ppl.tahap === 'pengumpulan-data' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                        <div className="md:col-span-3 font-medium text-sm">Detail Beban Kerja</div>
                        <div className="space-y-2">
                            <Label>Beban Kerja Listing</Label>
                            <Input type="number" placeholder="Jumlah..." value={localBebanKerja.listing || ''} onChange={(e) => handleBebanKerjaChange('listing', e.target.value)} onBlur={() => handleBebanKerjaBlur('listing')} />
                        </div>
                        <div className="space-y-2">
                            <Label>Honor Listing (Rp)</Label>
                            <Input value={formatHonor(getHonorDetail('listing').besaranHonor || 0)} readOnly className="bg-gray-100"/>
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
                            <Input value={formatHonor(getHonorDetail('pencacahan').besaranHonor || 0)} readOnly className="bg-gray-100"/>
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

const DokumenItem = React.memo(({ doc, removeDocument, onDocumentSaved, isDeleting }: {
    doc: ClientDokumen;
    removeDocument: (clientId: string, docId?: number) => void;
    onDocumentSaved: (updatedDoc: Dokumen, oldClientId: string) => void;
    isDeleting: boolean;
}) => {
    const { id, isWajib, status, nama, link, kegiatanId, tipe, clientId } = doc;
    const isNew = !id; 

    const [isEditing, setIsEditing] = useState(isNew);
    const [localNama, setLocalNama] = useState(nama);
    const [localLink, setLocalLink] = useState(link ?? '');

    const isApproved = status === 'Approved';

    const mutation = useMutation({
        mutationFn: (documentData: Partial<Dokumen>) => {
            const url = isNew ? `/api/kegiatan/dokumen` : `/api/kegiatan/dokumen/${id}`;
            const method = isNew ? 'POST' : 'PUT';
            return fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(documentData)
            }).then(res => {
                if (!res.ok) throw new Error(`Gagal menyimpan dokumen.`);
                return res.json();
            });
        },
        onSuccess: (savedData: Dokumen) => {
            onDocumentSaved(savedData, clientId);
            setIsEditing(false);
        },
        onError: (error: any) => alert(`Error: ${error.message}`)
    });

    const handleSave = () => {
        mutation.mutate({ nama: localNama, link: localLink, kegiatanId, tipe, isWajib });
    };

    const handleCancel = () => {
        if (isNew) {
            removeDocument(clientId);
        } else {
            setLocalNama(nama);
            setLocalLink(link ?? '');
            setIsEditing(false);
        }
    };

    return (
        <div className={cn("flex items-start gap-3 p-3 border rounded-lg", isApproved ? "bg-green-50" : isEditing ? "bg-yellow-50" : "bg-gray-50/50")}>
            <div className="flex-grow space-y-2">
                {isWajib ? (
                    <Label className="font-semibold pt-2 block">{nama} *</Label>
                ) : (
                    <Input placeholder="Nama Dokumen" value={localNama} onChange={(e) => setLocalNama(e.target.value)} disabled={!isEditing || mutation.isPending || isApproved} />
                )}
                <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-gray-400" />
                    <Input placeholder="https://..." value={localLink} onChange={(e) => setLocalLink(e.target.value)} disabled={!isEditing || mutation.isPending || isApproved} />
                </div>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-[80px]">
                {isApproved ? (
                    <div className="p-2" title="Disetujui"><Lock className="w-4 h-4 text-green-600"/></div>
                ) : isEditing ? (
                    <>
                        <Button type="button" size="sm" onClick={handleSave} disabled={!localNama.trim() || mutation.isPending} className="bg-green-500 hover:bg-green-600">
                            {mutation.isPending ? '...' : 'Simpan'}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={handleCancel} disabled={mutation.isPending}>Batal</Button>
                    </>
                ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                )}
                {!isWajib && !isApproved && !isEditing && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(clientId, id)} className="mt-1" disabled={isDeleting}>
                        <X className="w-4 h-4 text-gray-500"/>
                    </Button>
                )}
            </div>
        </div>
    );
});

// --- Main Component ---
export default function EditActivity() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const location = useLocation();

    const [mainTab, setMainTab] = useState("info-dasar");
    const [pplStageTab, setPplStageTab] = useState<TahapPPL>("pengumpulan-data");
    const [docStageTab, setDocStageTab] = useState<Tahap>("persiapan");
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
    const [showClearConfirmModal, setShowClearConfirmModal] = useState<{isOpen: boolean; tahap: TahapPPL | null}>({isOpen: false, tahap: null});
    const submitButtonRef = useRef<HTMLButtonElement>(null); 


    const handleFormFieldChange = useCallback((field: keyof FormState, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const addPPL = useCallback((tahap: TahapPPL, pplsToAdd: PPLMaster[] = []) => {
        setPplStageTab(tahap);

        const newAllocations: ClientPPL[] = pplsToAdd.length > 0
            ? pplsToAdd.map(ppl => {
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
                if (tahap === 'pengumpulan-data') {
                    newPpl.honorarium = [
                        { jenis_pekerjaan: 'listing', bebanKerja: '', besaranHonor: '0' },
                        { jenis_pekerjaan: 'pencacahan', bebanKerja: '', besaranHonor: '0' }
                    ];
                } else if (tahap === 'pengolahan-analisis') {
                    newPpl.honorarium = [
                        { jenis_pekerjaan: 'pengolahan', bebanKerja: '', besaranHonor: '0' }
                    ];
                }
                return newPpl;
            })
            : [{
                clientId: `new-ppl-${Date.now()}`,
                ppl_master_id: '',
                namaPML: "",
                tahap: tahap,
                bebanKerja: '',
                besaranHonor: '0',
                honorarium: tahap === 'pengumpulan-data'
                    ? [{ jenis_pekerjaan: 'listing', bebanKerja: '', besaranHonor: '0' },{ jenis_pekerjaan: 'pencacahan', bebanKerja: '', besaranHonor: '0' }]
                    : [{ jenis_pekerjaan: 'pengolahan', bebanKerja: '', besaranHonor: '0' }]
            } as ClientPPL];
        setFormData(prev => ({ ...prev, ppl: [...(prev.ppl || []), ...newAllocations]}));
    }, []);
    
    useEffect(() => {
        const { newPpls, tahap, from } = location.state || {};

        if (from === 'daftar-ppl' && newPpls && tahap && Array.isArray(newPpls) && newPpls.length > 0) {
            setFormData(currentFormData => {
                const existingPplIds = currentFormData.ppl?.map(p => String(p.ppl_master_id)) || [];
                const pplsToAdd = newPpls.filter((p: PPLMaster) => !existingPplIds.includes(String(p.id)));

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
                        if (tahap === 'pengumpulan-data') {
                            newPpl.honorarium = [{ jenis_pekerjaan: 'listing', bebanKerja: '', besaranHonor: '0' }, { jenis_pekerjaan: 'pencacahan', bebanKerja: '', besaranHonor: '0' }];
                        } else if (tahap === 'pengolahan-analisis') {
                            newPpl.honorarium = [{ jenis_pekerjaan: 'pengolahan', bebanKerja: '', besaranHonor: '0' }];
                        }
                        return newPpl;
                    });

                    setAddedPPLCount(pplsToAdd.length);
                    setShowAutoPopulateMessage(true);
                    setTimeout(() => setShowAutoPopulateMessage(false), 5000);

                    return { ...currentFormData, ppl: [...(currentFormData.ppl || []), ...newAllocations] };
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
    }, [location.state, addPPL, formData]);

    const [showHonorWarningModal, setShowHonorWarningModal] = useState(false);
    const [honorWarningDetails, setHonorWarningDetails] = useState<{ pplName: string; totalHonor: number; limit: number } | null>(null);

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
            
            setFormData({
                ...initialData,
                bulanPembayaranHonor: String(initialData.bulanPembayaranHonor || ''),
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
        }
    }, [initialData]);

    const removePPL = (clientId: string) => {
        setFormData(prev => ({ ...prev, ppl: prev.ppl?.filter(p => p.clientId !== clientId)}));
    };
    
    const updatePPL = useCallback((clientId: string, field: keyof ClientPPL, value: any) => {
        setFormData(prev => {
            if (!prev.ppl) return prev;
            const newPplList = prev.ppl.map(p => p.clientId === clientId ? { ...p, [field]: value } : p);
            return { ...prev, ppl: newPplList };
        });
    }, []);
    
    const mutation = useMutation({
        mutationFn: updateActivity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kegiatan', id] });
            queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
            setShowSuccessModal(true);
        },
        onError: (error) => {
            console.error("Gagal menyimpan:", error);
            setAlertModal({ isOpen: true, title: "Gagal Menyimpan", message: `Terjadi kesalahan saat menyimpan: ${error.message}` });
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
                const prevStage = stages[i - 1];
                if (prevStage.start && stage.start && stage.start < prevStage.start) {
                    return `Urutan jadwal tidak valid: Tahap ${stage.name} tidak boleh dimulai sebelum tahap ${prevStage.name} dimulai.`;
                }
            }
        }
        return null;
    };

    const proceedToSubmit = () => {
        if (!formData.id) return;
        
        const dataToSubmit = {
            ...formData,
            id: formData.id,
            lastEditedBy: user?.username,
            lastUpdatedBy: user?.username,
        };
        
        mutation.mutate(dataToSubmit as Partial<FormState> & {id: number});
    }

    const handleSubmit = async () => {
    // Secara paksa pindahkan fokus ke tombol submit.
    // Ini akan memicu event onBlur pada input field yang sedang aktif.
    submitButtonRef.current?.focus();

    // Beri jeda sesaat untuk memastikan state dari onBlur sudah selesai diperbarui
    await new Promise(resolve => setTimeout(resolve, 50));

    if (!formData.id) return alert("Error: ID Kegiatan tidak ditemukan.");

    const dateError = validateDates();
    if (dateError) {
      setAlertModal({ isOpen: true, title: "Kesalahan Jadwal Kegiatan", message: dateError });
      return;
    }

    if (!formData.ppl || formData.ppl.length === 0) {
      proceedToSubmit();
      return;
    }

    const HONOR_LIMIT = 3000000;
    let validationMonth: number, validationYear: number;

    const singleMonthActivity = formData.tanggalMulaiPersiapan ? formatDateFns(formData.tanggalMulaiPersiapan, 'MM-yyyy') : null;
    const selectedMonth = formData.bulanPembayaranHonor;
    const collectionDate = formData.tanggalMulaiPengumpulanData;

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

    for (const ppl of formData.ppl ?? []) {
        if (!ppl.ppl_master_id) continue;
        const currentActivityHonor = ppl.honorarium.reduce((sum, h) => sum + (parseInt(h.besaranHonor || '0') || 0), 0);
        const validationResponse = await fetch('/api/honor/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pplMasterId: ppl.ppl_master_id,
          bulan: validationMonth,
          tahun: validationYear,
          currentActivityHonor: currentActivityHonor,
          kegiatanIdToExclude: id
        })
      });
      const result = await validationResponse.json();

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

    const handleConfirmHonorWarning = () => {
        setShowHonorWarningModal(false);
        proceedToSubmit();
    };

    const AlokasiPPLContent = ({ tahap, title }: { tahap: TahapPPL, title: string }) => {
        const pplForStage = useMemo(() => formData.ppl?.filter(p => p.tahap === tahap) || [], [formData.ppl, tahap]);
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

        const handleSettingChange = (key: keyof HonorariumSettings, field: 'satuanBebanKerja' | 'hargaSatuan', value: string) => {
            setLocalHonorSettings(prev => {
                const newSettings = { ...prev };
                newSettings[key] = {
                    ...newSettings[key],
                    [field]: value
                };
                return newSettings;
            });
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
                            <CardDescription>Atur honorarium, lalu alokasikan PPL.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {pplForStage.length > 0 && (
                                <Button   type="button"  variant ="destructive"  size ="sm"  onClick ={() => setShowClearConfirmModal({isOpen: true, tahap})}>
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
                     <div className="p-4 border rounded-lg bg-blue-50/50 space-y-4">
                         <h4 className="font-medium text-gray-800">Pengaturan Honorarium {title}</h4>
                         {tahap === 'pengumpulan-data' && (
                             <>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="font-semibold text-sm md:col-span-2 pt-2 border-t">Updating/Listing</div>
                                     <div className="space-y-2"><Label>Satuan Beban Kerja</Label><Input value={localHonorSettings['pengumpulan-data-listing'].satuanBebanKerja} onChange={e => handleSettingChange('pengumpulan-data-listing', 'satuanBebanKerja', e.target.value)} onBlur={handleSettingBlur} /></div>
                                     <div className="space-y-2"><Label>Harga per Satuan (Rp)</Label><Input value={formatHonor(localHonorSettings['pengumpulan-data-listing'].hargaSatuan)} onChange={e => handleSettingChange('pengumpulan-data-listing', 'hargaSatuan', e.target.value)} onBlur={handleSettingBlur} /></div>
                                     <div className="font-semibold text-sm md:col-span-2 pt-2 border-t">Pendataan/Pencacahan</div>
                                     <div className="space-y-2"><Label>Satuan Beban Kerja</Label><Input value={localHonorSettings['pengumpulan-data-pencacahan'].satuanBebanKerja} onChange={e => handleSettingChange('pengumpulan-data-pencacahan', 'satuanBebanKerja', e.target.value)} onBlur={handleSettingBlur} /></div>
                                     <div className="space-y-2"><Label>Harga per Satuan (Rp)</Label><Input value={formatHonor(localHonorSettings['pengumpulan-data-pencacahan'].hargaSatuan)} onChange={e => handleSettingChange('pengumpulan-data-pencacahan', 'hargaSatuan', e.target.value)} onBlur={handleSettingBlur} /></div>
                                 </div>
                             </>
                         )}
                         {tahap === 'pengolahan-analisis' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="space-y-2"><Label>Satuan Beban Kerja</Label><Input value={localHonorSettings['pengolahan-analisis'].satuanBebanKerja} onChange={e => handleSettingChange('pengolahan-analisis', 'satuanBebanKerja', e.target.value)} onBlur={handleSettingBlur} /></div>
                                 <div className="space-y-2"><Label>Harga per Satuan (Rp)</Label><Input value={formatHonor(localHonorSettings['pengolahan-analisis'].hargaSatuan)} onChange={e => handleSettingChange('pengolahan-analisis', 'hargaSatuan', e.target.value)} onBlur={handleSettingBlur} /></div>
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
                                    ppl={ppl}
                                    index={index}
                                    onRemove={removePPL}
                                    onUpdate={updatePPL}
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
    
    const DokumenContent = ({ tipe, title }: { tipe: Dokumen['tipe'], title: string }) => {
    const documents = useMemo(() => formData.dokumen?.filter(d => d.tipe === tipe) || [], [formData.dokumen, tipe]);

    const deleteMutation = useMutation({
        mutationFn: (docId: number) => 
            fetch(`/api/kegiatan/dokumen/${docId}`, { method: 'DELETE' }),
        onSuccess: (response, docId) => {
            if (!response.ok) throw new Error('Gagal menghapus dokumen.');
            setFormData(prev => ({
                ...prev,
                dokumen: prev.dokumen?.filter(d => d.id !== docId)
            }));
        },
        onError: (error: any) => alert(`Error: ${error.message}`)
    });

    const removeDocument = (clientId: string, docId?: number) => {
        if (docId) {
            deleteMutation.mutate(docId);
        } else {
            setFormData(prev => ({
                ...prev,
                dokumen: prev.dokumen?.filter(d => d.clientId !== clientId)
            }));
        }
    };

    const handleDocumentSaved = (savedDoc: Dokumen, oldClientId: string) => {
        setFormData(prev => {
            const newDokumenList = prev.dokumen?.map(d => 
                d.clientId === oldClientId ? { ...savedDoc, clientId: oldClientId } : d
            );
            return { ...prev, dokumen: newDokumenList };
        });
    };

    const addDocument = (tipe: Dokumen['tipe']) => {
        const newDoc: ClientDokumen = { 
            clientId: `new-doc-${Date.now()}`, 
            kegiatanId: Number(id), 
            tipe, 
            nama: "", link: "", jenis: 'link', isWajib: false, 
            status: 'Pending', uploadedAt: new Date().toISOString() 
        };
        setFormData(prev => ({...prev, dokumen: [...(prev.dokumen || []), newDoc] }));
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Dokumen {title}</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => addDocument(tipe)} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />Tambah Dokumen
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {documents.map(doc => (
                    <DokumenItem 
                        key={doc.clientId} 
                        doc={doc} 
                        removeDocument={removeDocument}
                        onDocumentSaved={handleDocumentSaved}
                        isDeleting={deleteMutation.isPending}
                    />
                ))}
            </CardContent>
        </Card>
    );
};

    if (isLoading) {
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
            <div className="max-w-4xl mx-auto pb-12">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" asChild><Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Kembali ke Dashboard</Link></Button>
                    <h1 className="text-3xl font-bold">Edit Kegiatan</h1>
                </div>
                {showAutoPopulateMessage && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm"> ✅ {addedPPLCount} PPL telah ditambahkan ke Tahap {pplStageTab.replace('-', ' ')}.</p>
                </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8">
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
                                            <Select value={String(formData.ketua_tim_id)} onValueChange={(value) => handleFormFieldChange('ketua_tim_id', value)}>
                                                <SelectTrigger id="ketuaTim"><SelectValue placeholder="Pilih ketua tim" /></SelectTrigger>
                                                <SelectContent>{ketuaTimList.map((ketua) => (<SelectItem key={ketua.id} value={String(ketua.id)}>{ketua.namaKetua}</SelectItem>))}</SelectContent>
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
                                                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !formData[field] && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{formData[field] ? format(formData[field]!, "dd MMMM yyyy", { locale: localeID }) : <span>Pilih tanggal</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData[field]} onSelect={(date) => handleFormFieldChange(field, date as Date)} /></PopoverContent></Popover>
                                            </div>
                                        ))}
                                    </CardContent>
                                    <CardContent>
                                         <HonorPaymentMonthSelector formData={formData} handleFormFieldChange={handleFormFieldChange} />
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                        <TabsContent value="alokasi-ppl" className="mt-6">
                            <Tabs value={pplStageTab} onValueChange={(val) => setPplStageTab(val as TahapPPL)}>
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
                            <Tabs value={docStageTab} onValueChange={(val) => setDocStageTab(val as Tahap)}>
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
                        <Button
                            ref={submitButtonRef}
                            type="submit" 
                            disabled={mutation.isPending} 
                            className="min-w-48 bg-bps-green-600 hover:bg-bps-green-700" 
                            size="lg"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
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
                 <ConfirmationModal
                    isOpen={showHonorWarningModal}
                    onClose={() => setShowHonorWarningModal(false)}
                    onConfirm={handleConfirmHonorWarning}
                    title="Peringatan Batas Honor"
                    description={`Total honor untuk ${honorWarningDetails?.pplName} di bulan terpilih akan menjadi ${formatHonor(honorWarningDetails?.totalHonor || 0)}, melebihi batas ${formatHonor(honorWarningDetails?.limit || 0)}. Lanjutkan?`}
                    confirmLabel="Ya, Lanjutkan"
                    variant="warning"
               />
            </div>
            <AlertModal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ isOpen: false, title: "", message: "" })} title={alertModal.title} description={alertModal.message} />
        </Layout>
    );
}