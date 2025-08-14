import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { CalendarIcon, Plus, Trash2, Upload, Download, FileSpreadsheet, Link2, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dokumen, PPL } from "@shared/api";

// Tipe Data untuk State Frontend
interface PPLItem extends Omit<PPL, 'id' | 'kegiatanId'> {
  id: string; 
}

interface DocumentItem extends Omit<Dokumen, 'id' | 'kegiatanId' | 'status' | 'uploadedAt'> {
  id: string; 
  file?: File;
  url?: string;
}

type DateFieldName = 'tanggalMulaiPelatihan' | 'tanggalSelesaiPelatihan' | 'tanggalMulaiPendataan' | 'tanggalSelesaiPendataan';

// Fungsi API
const createActivity = async (data: any) => {
    const sanitizedData = { ...data, documents: data.documents.map(({ id, file, url, ...rest }: DocumentItem) => ({...rest, link: url || ''})), pplAllocations: data.pplAllocations.map(({ id, ...rest }: PPLItem) => rest), };
    const res = await fetch('/api/kegiatan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sanitizedData), });
    if (!res.ok) throw new Error('Gagal membuat kegiatan');
    return res.json();
}

// Komponen Utama
export default function InputKegiatan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    namaKegiatan: "", ketuaTim: "", timKerja: "", tipeKegiatan: "",
    pplAllocations: [{ id: "1", namaPPL: "", bebanKerja: "", satuanBebanKerja: "", besaranHonor: "", namaPML: "" }] as PPLItem[],
    tanggalMulaiPelatihan: undefined as Date | undefined,
    tanggalSelesaiPelatihan: undefined as Date | undefined,
    tanggalMulaiPendataan: undefined as Date | undefined,
    tanggalSelesaiPendataan: undefined as Date | undefined,
    documents: [] as DocumentItem[]
  });

  const mutation = useMutation({ mutationFn: createActivity, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['kegiatan'] }); setShowSuccessModal(true); }, });
  const addPPL = () => { setFormData(prev => ({ ...prev, pplAllocations: [...prev.pplAllocations, { id: Date.now().toString(), namaPPL: "", bebanKerja: "", satuanBebanKerja: "", besaranHonor: "", namaPML: "" }]})); };
  const removePPL = (id: string) => { setFormData(prev => ({...prev, pplAllocations: prev.pplAllocations.filter(ppl => ppl.id !== id)})); };
  const updatePPL = (id: string, field: keyof Omit<PPLItem, 'id'>, value: string) => { setFormData(prev => ({...prev, pplAllocations: prev.pplAllocations.map(ppl => ppl.id === id ? { ...ppl, [field]: value } : ppl)})); };
  const addDocumentLink = () => { const newDoc: DocumentItem = { id: Date.now().toString(), nama: "", jenis: 'link', url: "", tipe: 'persiapan', link: ''}; setFormData(prev => ({...prev, documents: [...prev.documents, newDoc]})); };
  const addDocumentFile = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) { const newDoc: DocumentItem = { id: Date.now().toString(), nama: file.name, jenis: 'file', file, tipe: 'persiapan', link: '' }; setFormData(prev => ({...prev, documents: [...prev.documents, newDoc]})); } event.target.value = ''; };
  const updateDocument = (id: string, field: 'nama' | 'url', value: string) => { setFormData(prev => ({...prev, documents: prev.documents.map(doc => doc.id === id ? { ...doc, [field]: value } : doc)})); };
  const removeDocument = (id: string) => { setFormData(prev => ({ ...prev, documents: prev.documents.filter(doc => doc.id !== id)})); };
  const downloadTemplate = () => { const headers = ['Nama PPL', 'Beban Kerja', 'Satuan Beban Kerja', 'Besaran Honor (Rp)', 'Nama PML']; const csvContent = headers.join(',') + '\n' + 'Contoh PPL 1,120,Hari,2400000,Contoh PML 1\n'; const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'Template_PPL.csv'; link.click(); };
  const parseExcelFile = (file: File) => { const reader = new FileReader(); reader.onload = (e) => { const text = e.target?.result as string; const lines = text.split('\n').slice(1); const newPPLItems: PPLItem[] = lines.map((line, i) => { const data = line.split(','); return data.length >= 5 && data[0].trim() ? { id: Date.now().toString() + i, namaPPL: data[0].trim(), bebanKerja: data[1].trim(), satuanBebanKerja: data[2].trim(), besaranHonor: data[3].trim(), namaPML: data[4].trim()} : null }).filter((item): item is PPLItem => item !== null); if (newPPLItems.length > 0) { setFormData(prev => ({...prev, pplAllocations: newPPLItems})); alert(`Berhasil memuat ${newPPLItems.length} data PPL/PML.`); } else { alert('Tidak ada data valid.'); } }; reader.readAsText(file); };
  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) parseExcelFile(file); event.target.value = ''; };
  const validateForm = () => formData.namaKegiatan && formData.ketuaTim && formData.tipeKegiatan && formData.tanggalMulaiPelatihan && formData.tanggalSelesaiPelatihan && formData.tanggalMulaiPendataan && formData.tanggalSelesaiPendataan && formData.pplAllocations.every(ppl => ppl.namaPPL && ppl.besaranHonor);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!validateForm()) { alert("Harap lengkapi semua field bertanda *"); return; } mutation.mutate({ ...formData, tanggalMulaiPelatihan: format(formData.tanggalMulaiPelatihan!, 'yyyy-MM-dd'), tanggalSelesaiPelatihan: format(formData.tanggalSelesaiPelatihan!, 'yyyy-MM-dd'), tanggalMulaiPendataan: format(formData.tanggalMulaiPendataan!, 'yyyy-MM-dd'), tanggalSelesaiPendataan: format(formData.tanggalSelesaiPendataan!, 'yyyy-MM-dd') }); };
  const handleSuccessAction = () => { navigate('/dashboard'); };
  const ketuaTimOptions = ["Dr. Ahmad Surya", "Dra. Siti Rahma", "M. Budi Santoso, S.St"];
  const tipeKegiatanOptions = ["Sensus Penduduk", "Survei Ekonomi", "Survei Pertanian"];
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Input Kegiatan</h1>
            <p className="text-gray-600">Lengkapi semua informasi kegiatan dalam satu halaman</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader><CardTitle>Informasi Kegiatan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="namaKegiatan">Nama Kegiatan *</Label><Input id="namaKegiatan" value={formData.namaKegiatan} onChange={(e) => setFormData(prev => ({ ...prev, namaKegiatan: e.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="ketuaTim">Nama Ketua Tim *</Label><Select value={formData.ketuaTim} onValueChange={(value) => setFormData(prev => ({ ...prev, ketuaTim: value }))}><SelectTrigger><SelectValue placeholder="Pilih ketua tim" /></SelectTrigger><SelectContent>{ketuaTimOptions.map((nama) => (<SelectItem key={nama} value={nama}>{nama}</SelectItem>))}</SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label htmlFor="tipeKegiatan">Tipe Kegiatan *</Label><Select value={formData.tipeKegiatan} onValueChange={(value) => setFormData(prev => ({ ...prev, tipeKegiatan: value }))}><SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger><SelectContent>{tipeKegiatanOptions.map((tipe) => (<SelectItem key={tipe} value={tipe}>{tipe}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="timKerja">Tim Kerja</Label><Textarea id="timKerja" value={formData.timKerja} onChange={(e) => setFormData(prev => ({ ...prev, timKerja: e.target.value }))} /></div>
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
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData[field]} onSelect={(date) => setFormData(p => ({...p, [field]: date}))} /></PopoverContent>
                        </Popover>
                    </div>
                ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    Dokumen Persiapan
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={addDocumentLink}><Link2 className="w-4 h-4 mr-2"/>Tambah Link</Button>
                        <Input type="file" id="doc-upload" className="hidden" onChange={addDocumentFile}/>
                        <Button type="button" variant="outline" size="sm" asChild><label htmlFor="doc-upload" className="cursor-pointer"><Upload className="w-4 h-4 mr-2"/>Upload File</label></Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {formData.documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50/50">
                        <div className="flex-grow space-y-2"><Label>Nama Dokumen</Label><Input value={doc.nama} onChange={e => updateDocument(doc.id, 'nama', e.target.value)}/></div>
                        {doc.jenis === 'link' && <div className="flex-grow space-y-2"><Label>Link Google Drive</Label><Input value={doc.url} onChange={e => updateDocument(doc.id, 'url', e.target.value)}/></div>}
                        {doc.jenis === 'file' && <div className="flex-grow text-sm self-end pb-2">File: {doc.file?.name}</div>}
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(doc.id)} className="self-end"><X className="w-4 h-4 text-gray-500"/></Button>
                    </div>
                ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    Alokasi PPL & PML
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}><Download className="w-4 h-4 mr-2"/>Template</Button>
                        <Input type="file" id="excel-upload" accept=".csv" onChange={handleExcelUpload} className="hidden"/>
                        <Button type="button" variant="outline" size="sm" asChild><label htmlFor="excel-upload" className="cursor-pointer"><FileSpreadsheet className="w-4 h-4 mr-2"/>Upload</label></Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {formData.pplAllocations.map((ppl, index) => (
                    <div key={ppl.id} className="p-4 border rounded-lg space-y-4 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium">PPL {index + 1}</h4>
                            {formData.pplAllocations.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removePPL(ppl.id)}><Trash2 className="w-4 h-4 text-red-500"/></Button>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input placeholder="Nama PPL *" value={ppl.namaPPL} onChange={e => updatePPL(ppl.id, 'namaPPL', e.target.value)} />
                            <Input placeholder="Nama PML *" value={ppl.namaPML} onChange={e => updatePPL(ppl.id, 'namaPML', e.target.value)} />
                            <Input placeholder="Beban Kerja *" value={ppl.bebanKerja} onChange={e => updatePPL(ppl.id, 'bebanKerja', e.target.value)} />
                            <Input placeholder="Satuan Beban Kerja" value={ppl.satuanBebanKerja} onChange={e => updatePPL(ppl.id, 'satuanBebanKerja', e.target.value)} />
                            <Input placeholder="Besaran Honor (Rp) *" value={ppl.besaranHonor} onChange={e => updatePPL(ppl.id, 'besaranHonor', e.target.value)} className="md:col-span-2"/>
                        </div>
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={addPPL} className="w-full border-dashed"><Plus className="w-4 h-4 mr-2"/>Tambah PPL Manual</Button>
            </CardContent>
          </Card>
          <div className="flex justify-center mt-8">
            <Button type="submit" size="lg" disabled={!validateForm() || mutation.isPending} className="min-w-48 bg-bps-green-600 hover:bg-bps-green-700">
                {mutation.isPending ? "Menyimpan..." : "Simpan Kegiatan"}
            </Button>
          </div>
        </form>
        <SuccessModal 
            isOpen={showSuccessModal} 
            onClose={() => setShowSuccessModal(false)} 
            onAction={handleSuccessAction} 
            title="Kegiatan Berhasil Disimpan!" 
            description={`Kegiatan "${formData.namaKegiatan}" telah berhasil dibuat.`} 
            actionLabel="Ke Dashboard" 
        />
      </div>
    </Layout>
  );
}