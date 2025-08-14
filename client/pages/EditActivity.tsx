import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Plus, Trash2, ArrowLeft, Save, Upload, Link2, X, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Kegiatan, PPL, Dokumen } from "@shared/api";
import { cn } from "@/lib/utils";

// --- Tipe Data Frontend ---
type ClientPPL = PPL & { clientId: string };
type ClientDokumen = Dokumen & { clientId: string };

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
    const [formData, setFormData] = useState<Partial<Kegiatan & { ppl: ClientPPL[], dokumen: ClientDokumen[] }>>({ dokumen: [], ppl: [] });
    const [showSuccessModal, setShowSuccessModal] = useState(false);

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

    const handleSuccessAction = () => navigate('/dashboard');
    const handleSubmit = () => {
        const dataToSubmit = {
            ...formData,
            tanggalMulaiPelatihan: formData.tanggalMulaiPelatihan ? format(formData.tanggalMulaiPelatihan as Date, 'yyyy-MM-dd') : null,
            tanggalSelesaiPelatihan: formData.tanggalSelesaiPelatihan ? format(formData.tanggalSelesaiPelatihan as Date, 'yyyy-MM-dd') : null,
            tanggalMulaiPendataan: formData.tanggalMulaiPendataan ? format(formData.tanggalMulaiPendataan as Date, 'yyyy-MM-dd') : null,
            tanggalSelesaiPendataan: formData.tanggalSelesaiPendataan ? format(formData.tanggalSelesaiPendataan as Date, 'yyyy-MM-dd') : null,
        };
        mutation.mutate(dataToSubmit as Partial<Kegiatan> & {id: number});
    };
    
    // Document Management
    const addDocument = (tipe: Dokumen['tipe']) => {
        const newDoc: ClientDokumen = { clientId: Date.now().toString(), tipe, nama: "", link: "", jenis: 'link' };
        setFormData(prev => ({...prev, dokumen: [...(prev.dokumen || []), newDoc] }));
    };
    const updateDocument = (clientId: string, field: 'nama' | 'link', value: string) => {
        setFormData(prev => ({ ...prev, dokumen: prev.dokumen?.map(d => (d.clientId === clientId ? { ...d, [field]: value } : d)) }));
    };
    const removeDocument = (clientId: string) => {
        setFormData(prev => ({ ...prev, dokumen: prev.dokumen?.filter(d => d.clientId !== clientId) }));
    };

    const renderDocumentSection = (tipe: Dokumen['tipe'], title: string) => {
        const documents = formData.dokumen?.filter(d => d.tipe === tipe) || [];
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Dokumen {title}
                        <Button variant="outline" size="sm" onClick={() => addDocument(tipe)} className="flex items-center gap-2"><Link2 className="w-4 h-4" />Tambah Dokumen (Link)</Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {documents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500"><p>Belum ada dokumen.</p></div>
                    ) : (
                        documents.map(doc => (
                            <div key={doc.clientId} className="flex items-center gap-3 p-3 border rounded-lg">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2"><Link2 className="w-4 h-4 text-blue-600" /><Input placeholder="Nama dokumen" value={doc.nama} onChange={(e) => updateDocument(doc.clientId, 'nama', e.target.value)} /></div>
                                    <Input placeholder="https://drive.google.com/..." value={doc.link} onChange={(e) => updateDocument(doc.clientId, 'link', e.target.value)} />
                                </div>
                                <Button variant="outline" size="sm" onClick={() => removeDocument(doc.clientId)} className="text-red-600 hover:text-red-700"><X className="w-4 h-4" /></Button>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        );
    };

    if (isLoading) return <Layout><div>Memuat...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" asChild><Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Kembali</Link></Button>
                    <div><h1 className="text-3xl font-bold">Edit Kegiatan</h1><p className="text-gray-600">Perbarui informasi dan kelola dokumen.</p></div>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="persiapan">Persiapan</TabsTrigger>
                        <TabsTrigger value="pelatihan">Pelatihan</TabsTrigger>
                        <TabsTrigger value="pendataan">Pendataan</TabsTrigger>
                        <TabsTrigger value="basic">Info Dasar</TabsTrigger>
                    </TabsList>
                    <TabsContent value="persiapan" className="space-y-6">{renderDocumentSection('persiapan', 'Persiapan')}</TabsContent>
                    <TabsContent value="pelatihan" className="space-y-6">{renderDocumentSection('pasca-pelatihan', 'Pasca Pelatihan')}</TabsContent>
                    <TabsContent value="pendataan" className="space-y-6">{renderDocumentSection('pasca-pendataan', 'Pendataan')}</TabsContent>
                    <TabsContent value="basic" className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Informasi Kegiatan</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label>Nama Kegiatan *</Label><Input value={formData.namaKegiatan || ''} onChange={(e) => setFormData(p => ({...p, namaKegiatan: e.target.value}))} /></div>
                                {/* ... inputs lainnya untuk ketuaTim, timKerja, dll. */}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Jadwal Kegiatan</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                {/* ... Popover Kalender untuk tanggal ... */}
                            </CardContent>
                        </Card>
                        {/* ... Card untuk alokasi PPL ... */}
                    </TabsContent>
                </Tabs>
                <div className="flex justify-center mt-8">
                    <Button onClick={handleSubmit} disabled={mutation.isPending} className="min-w-48 bg-bps-green-600 hover:bg-bps-green-700" size="lg"><Save className="w-4 h-4 mr-2" />Simpan Perubahan</Button>
                </div>
                <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} onAction={handleSuccessAction} title="Kegiatan Berhasil Diperbarui!" description={`Perubahan untuk "${formData.namaKegiatan}" telah disimpan.`} actionLabel="Ke Dashboard" />
            </div>
        </Layout>
    );
}