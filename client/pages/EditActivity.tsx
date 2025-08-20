// client/pages/EditActivity.tsx

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Link2, X, CalendarIcon, Plus, Trash2, Lock, Notebook } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Kegiatan, PPL, Dokumen } from "@shared/api";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// --- Tipe Data Frontend ---
type ClientPPL = PPL & { clientId: string };
type ClientDokumen = Dokumen & { clientId: string };

type FormState = Omit<Kegiatan, 'ppl' | 'dokumen' | 'tipeKegiatan' | 'tanggalMulaiPelatihan' | 'tanggalSelesaiPelatihan' | 'tanggalMulaiPendataan' | 'tanggalSelesaiPendataan'> & {
    tanggalMulaiPelatihan?: Date;
    tanggalSelesaiPelatihan?: Date;
    tanggalMulaiPendataan?: Date;
    tanggalSelesaiPendataan?: Date;
    ppl: ClientPPL[];
    dokumen: ClientDokumen[];
};

type DateFieldName = 'tanggalMulaiPelatihan' | 'tanggalSelesaiPelatihan' | 'tanggalMulaiPendataan' | 'tanggalSelesaiPendataan';

// --- API Functions ---
const fetchActivityDetails = async (id: string): Promise<Kegiatan> => {
    const res = await fetch(`/api/kegiatan/${id}`);
    if (!res.ok) throw new Error("Kegiatan tidak ditemukan");
    return res.json();
}

const updateActivity = async (kegiatan: Partial<Kegiatan> & {id: number}): Promise<Kegiatan> => {
    const sanitizedData = {
        ...kegiatan,
        dokumen: kegiatan.dokumen?.map(({ clientId, ...rest }: any) => rest),
        ppl: kegiatan.ppl?.map(({ clientId, ...rest }: any) => rest)
    };
    const res = await fetch(`/api/kegiatan/${kegiatan.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sanitizedData) });
    if (!res.ok) throw new Error("Gagal memperbarui kegiatan");
    return res.json();
}

export default function EditActivity() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("persiapan");
    const [formData, setFormData] = useState<Partial<FormState>>({ dokumen: [], ppl: [] });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [noteModal, setNoteModal] = useState<{ isOpen: boolean; tipe: Dokumen['tipe'] | null; content: string }>({ isOpen: false, tipe: null, content: '' });

    const { data: initialData, isLoading } = useQuery({
        queryKey: ['kegiatan', id],
        queryFn: () => fetchActivityDetails(id!),
        enabled: !!id,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                tanggalMulaiPelatihan: initialData.tanggalMulaiPelatihan ? parseISO(initialData.tanggalMulaiPelatihan) : undefined,
                tanggalSelesaiPelatihan: initialData.tanggalSelesaiPelatihan ? parseISO(initialData.tanggalSelesaiPelatihan) : undefined,
                tanggalMulaiPendataan: initialData.tanggalMulaiPendataan ? parseISO(initialData.tanggalMulaiPendataan) : undefined,
                tanggalSelesaiPendataan: initialData.tanggalSelesaiPendataan ? parseISO(initialData.tanggalSelesaiPendataan) : undefined,
                dokumen: initialData.dokumen.map(d => ({...d, clientId: d.id?.toString() || Date.now().toString() })),
                ppl: initialData.ppl.map(p => ({...p, clientId: p.id?.toString() || Date.now().toString() }))
            });
        }
    }, [initialData]);

    const mutation = useMutation({
        mutationFn: updateActivity,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['kegiatan'] }); setShowSuccessModal(true); }
    });
    
    const handleFormFieldChange = (field: keyof FormState, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const titleCase = (str: string) => str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const handleNoteSubmit = () => {
        if (!noteModal.tipe) return;
        const tipe = noteModal.tipe;
        
        setFormData(prev => {
            const existingNote = prev.dokumen?.find(d => d.tipe === tipe && d.jenis === 'catatan');
            if (existingNote) {
                // Update existing note
                const updatedDocs = prev.dokumen!.map(d => 
                    d.clientId === existingNote.clientId ? { ...d, link: noteModal.content } : d
                );
                return { ...prev, dokumen: updatedDocs };
            } else {
                // Add new note
                const noteDoc: ClientDokumen = {
                    clientId: `catatan-${tipe}-${Date.now()}`,
                    tipe: tipe,
                    nama: `Catatan Tahap ${titleCase(tipe.replace('-', ' '))}`,
                    link: noteModal.content,
                    jenis: 'catatan',
                    isWajib: false,
                };
                return { ...prev, dokumen: [...(prev.dokumen || []), noteDoc] };
            }
        });

        setNoteModal({ isOpen: false, tipe: null, content: '' });
    };

    // PPL Management Handlers
    const addPPL = () => {
        const newPPL: ClientPPL = {
            clientId: Date.now().toString(),
            namaPPL: "",
            namaPML: "",
            bebanKerja: "",
            satuanBebanKerja: "",
            besaranHonor: ""
        };
        setFormData(prev => ({ ...prev, ppl: [...(prev.ppl || []), newPPL]}));
    };

    const removePPL = (clientId: string) => {
        setFormData(prev => ({ ...prev, ppl: prev.ppl?.filter(p => p.clientId !== clientId)}));
    };

    const updatePPL = (clientId: string, field: keyof PPL, value: string) => {
        setFormData(prev => ({
            ...prev,
            ppl: prev.ppl?.map(p => p.clientId === clientId ? { ...p, [field]: value } : p)
        }));
    };

    const handleSuccessAction = () => navigate('/dashboard');
    const handleSubmit = () => {
        const dataToSubmit = {
            ...formData,
            tanggalMulaiPelatihan: formData.tanggalMulaiPelatihan ? format(formData.tanggalMulaiPelatihan, 'yyyy-MM-dd') : null,
            tanggalSelesaiPelatihan: formData.tanggalSelesaiPelatihan ? format(formData.tanggalSelesaiPelatihan, 'yyyy-MM-dd') : null,
            tanggalMulaiPendataan: formData.tanggalMulaiPendataan ? format(formData.tanggalMulaiPendataan, 'yyyy-MM-dd') : null,
            tanggalSelesaiPendataan: formData.tanggalSelesaiPendataan ? format(formData.tanggalSelesaiPendataan, 'yyyy-MM-dd') : null,
        };
        mutation.mutate(dataToSubmit as Partial<Kegiatan> & {id: number});
    };
    
    // Document Management
    const addDocument = (tipe: Dokumen['tipe']) => {
        const newDoc: ClientDokumen = { clientId: Date.now().toString(), tipe, nama: "", link: "", jenis: 'link', isWajib: false };
        setFormData(prev => ({...prev, dokumen: [...(prev.dokumen || []), newDoc] as ClientDokumen[] }));
    };
    const updateDocument = (clientId: string, field: 'nama' | 'link', value: string) => {
        setFormData(prev => ({ ...prev, dokumen: prev.dokumen?.map(d => (d.clientId === clientId ? { ...d, [field]: value } : d)) as ClientDokumen[] }));
    };
    const removeDocument = (clientId: string) => {
        setFormData(prev => ({ ...prev, dokumen: prev.dokumen?.filter(d => d.clientId !== clientId) as ClientDokumen[] }));
    };

    const renderDocumentSection = (tipe: Dokumen['tipe'], title: string) => {
        const documents = formData.dokumen?.filter(d => d.tipe === tipe && d.jenis !== 'catatan') || [];
        const note = formData.dokumen?.find(d => d.tipe === tipe && d.jenis === 'catatan');
        
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle>Dokumen {title}</CardTitle>
                            <CardDescription className="mt-1">
                                Isi link untuk dokumen wajib, tambahkan dokumen pendukung, dan kelola catatan.
                            </CardDescription>
                        </div>
                        <div className="flex flex-shrink-0 gap-2">
                           <Button type="button" variant="outline" size="sm" onClick={() => setNoteModal({ isOpen: true, tipe, content: note?.link || '' })} className="flex items-center gap-2">
                               <Notebook className="w-4 h-4" />{note ? 'Edit' : 'Tambah'} Catatan
                           </Button>
                           <Button type="button" variant="outline" size="sm" onClick={() => addDocument(tipe)} className="flex items-center gap-2"><Plus className="w-4 h-4" />Dokumen</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {note && (
                         <div className="flex items-center gap-3 p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                            <div className="flex-grow space-y-2">
                                <Label className="font-semibold">{note.nama}</Label>
                                <p className="text-sm text-gray-600 truncate">{note.link || 'Catatan kosong. Klik edit untuk mengisi.'}</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => setNoteModal({ isOpen: true, tipe, content: note.link })} className="self-center"><Notebook className="w-4 h-4 text-gray-500"/></Button>
                        </div>
                    )}
                    {documents.map(doc => (
                         <div key={doc.clientId} className={cn("flex items-center gap-3 p-3 border rounded-lg", doc.isWajib ? "bg-blue-50 border-blue-200" : "bg-gray-50/50")}>
                            <div className="flex-grow space-y-2">
                                {doc.isWajib ? (
                                    <Label className="font-semibold">{doc.nama} *</Label>
                                ) : (
                                    <Input placeholder="Nama Dokumen Pendukung" value={doc.nama} onChange={(e) => updateDocument(doc.clientId, 'nama', e.target.value)} />
                                )}
                                <div className="flex items-center gap-2">
                                    <Link2 className="w-4 h-4 text-gray-400"/>
                                    <Input placeholder="https://drive.google.com/..." value={doc.link} onChange={(e) => updateDocument(doc.clientId, 'link', e.target.value)} />
                                </div>
                            </div>
                            {!doc.isWajib ? (
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(doc.clientId)} className="self-center"><X className="w-4 h-4 text-gray-500"/></Button>
                            ) : (
                                <div className="self-center p-2" title="Dokumen Wajib">
                                    <Lock className="w-4 h-4 text-gray-400"/>
                                </div>
                            )}
                        </div>
                    ))}
                    {documents.length === 0 && !note && (
                        <div className="text-center py-8 text-gray-500"><p>Belum ada dokumen atau catatan untuk fase ini.</p></div>
                    )}
                </CardContent>
            </Card>
        );
    };

    if (isLoading) return <Layout><div>Memuat...</div></Layout>;
    
    const ketuaTimOptions = ["Dr. Ahmad Surya", "Dra. Siti Rahma", "M. Budi Santoso, S.St"];

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" asChild><Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Kembali</Link></Button>
                    <div><h1 className="text-3xl font-bold">Edit Kegiatan</h1><p className="text-gray-600">Perbarui informasi dan kelola dokumen.</p></div>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="basic">Info Dasar</TabsTrigger>
                        <TabsTrigger value="persiapan">Persiapan</TabsTrigger>
                        <TabsTrigger value="pengumpulan-data">Pengumpulan Data</TabsTrigger>
                        <TabsTrigger value="pengolahan-analisis">Pengolahan & Analisis</TabsTrigger>
                        <TabsTrigger value="diseminasi-evaluasi">Diseminasi & Evaluasi</TabsTrigger>
                    </TabsList>
                    <TabsContent value="basic" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Kegiatan</CardTitle>
                                <CardDescription>Perbarui detail dasar mengenai kegiatan yang akan dilaksanakan.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="namaKegiatan">Nama Kegiatan *</Label>
                                    <Input id="namaKegiatan" value={formData.namaKegiatan || ''} onChange={(e) => handleFormFieldChange('namaKegiatan', e.target.value)} placeholder="Contoh: Sensus Penduduk 2024" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ketuaTim">Nama Ketua Tim *</Label>
                                    <Select value={formData.ketuaTim || ''} onValueChange={(value) => handleFormFieldChange('ketuaTim', value)}>
                                        <SelectTrigger><SelectValue placeholder="Pilih ketua tim" /></SelectTrigger>
                                        <SelectContent>{ketuaTimOptions.map((nama) => (<SelectItem key={nama} value={nama}>{nama}</SelectItem>))}</SelectContent>
                                    </Select>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="timKerja">Tim Kerja</Label>
                                <Textarea id="timKerja" value={formData.timKerja || ''} onChange={(e) => handleFormFieldChange('timKerja', e.target.value)} placeholder="Deskripsikan tim kerja dan pembagian tugas secara singkat." />
                              </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Jadwal Kegiatan *</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {([ {label: 'Mulai Pelatihan', field: 'tanggalMulaiPelatihan'}, {label: 'Selesai Pelatihan', field: 'tanggalSelesaiPelatihan'}, {label: 'Mulai Pendataan', field: 'tanggalMulaiPendataan'}, {label: 'Selesai Pendataan', field: 'tanggalSelesaiPendataan'} ] as {label: string, field: DateFieldName}[]).map(({label, field}) => (
                                    <div key={field} className="space-y-2">
                                        <Label>{label}</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn("w-full justify-start", !formData[field] && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {formData[field] ? format(formData[field]!, "dd MMMM yyyy") : <span>Pilih tanggal</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData[field]} onSelect={(date) => handleFormFieldChange(field, date)} /></PopoverContent>
                                        </Popover>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    Alokasi PPL & PML
                                </CardTitle>
                                <CardDescription>
                                    Perbarui data Petugas Pencacah Lapangan (PPL) dan Petugas Pemeriksa Lapangan (PML).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {formData.ppl?.map((ppl, index) => (
                                    <div key={ppl.clientId} className="p-4 border rounded-lg space-y-4 bg-gray-50">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-medium">PPL {index + 1}</h4>
                                            {formData.ppl && formData.ppl.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removePPL(ppl.clientId)}><Trash2 className="w-4 h-4 text-red-500"/></Button>}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Nama PPL *</Label>
                                                <Input placeholder="Nama PPL" value={ppl.namaPPL} onChange={e => updatePPL(ppl.clientId, 'namaPPL', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Nama PML *</Label>
                                                <Input placeholder="Nama PML" value={ppl.namaPML} onChange={e => updatePPL(ppl.clientId, 'namaPML', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Beban Kerja *</Label>
                                                <Input placeholder="Beban Kerja" value={ppl.bebanKerja} onChange={e => updatePPL(ppl.clientId, 'bebanKerja', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Satuan Beban Kerja</Label>
                                                <Input placeholder="Satuan Beban Kerja" value={ppl.satuanBebanKerja} onChange={e => updatePPL(ppl.clientId, 'satuanBebanKerja', e.target.value)} />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label>Besaran Honor (Rp) *</Label>
                                                <Input placeholder="Besaran Honor (Rp)" value={ppl.besaranHonor} onChange={e => updatePPL(ppl.clientId, 'besaranHonor', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" onClick={addPPL} className="w-full border-dashed"><Plus className="w-4 h-4 mr-2"/>Tambah PPL Manual</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="persiapan">{renderDocumentSection('persiapan', 'Persiapan')}</TabsContent>
                    <TabsContent value="pengumpulan-data">{renderDocumentSection('pengumpulan-data', 'Pengumpulan Data')}</TabsContent>
                    <TabsContent value="pengolahan-analisis">{renderDocumentSection('pengolahan-analisis', 'Pengolahan & Analisis')}</TabsContent>
                    <TabsContent value="diseminasi-evaluasi">{renderDocumentSection('diseminasi-evaluasi', 'Diseminasi & Evaluasi')}</TabsContent>
                </Tabs>
                <div className="flex justify-center mt-8">
                    <Button onClick={handleSubmit} disabled={mutation.isPending} className="min-w-48 bg-bps-green-600 hover:bg-bps-green-700" size="lg"><Save className="w-4 h-4 mr-2" />Simpan Perubahan</Button>
                </div>
                <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} onAction={handleSuccessAction} title="Kegiatan Berhasil Diperbarui!" description={`Perubahan untuk "${formData.namaKegiatan}" telah disimpan.`} actionLabel="Ke Dashboard" />
            </div>
            <Dialog open={noteModal.isOpen} onOpenChange={(isOpen) => !isOpen && setNoteModal({ isOpen: false, tipe: null, content: '' })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah/Edit Catatan</DialogTitle>
                        <DialogDescription>
                            Isi catatan untuk tahap ini. Catatan ini akan disimpan sebagai dokumen terpisah.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea 
                        value={noteModal.content}
                        onChange={(e) => setNoteModal(prev => ({...prev, content: e.target.value}))}
                        rows={8}
                        placeholder="Tulis catatan di sini..."
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNoteModal({ isOpen: false, tipe: null, content: '' })}>Batal</Button>
                        <Button onClick={handleNoteSubmit}>Simpan Catatan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}