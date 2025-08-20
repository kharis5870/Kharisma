import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { CalendarIcon, Plus, Trash2, Download, FileSpreadsheet, Link2, X, Lock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useInputKegiatanStore, { State as InputKegiatanState, Actions as InputKegiatanActions } from "@/stores/useInputKegiatanStore";
import { Dokumen, PPL } from "@shared/api";

// --- Tipe Data Frontend ---
interface PPLItem extends Omit<PPL, 'id' | 'kegiatanId'> {
  id: string;
}

interface DocumentItem extends Omit<Dokumen, 'id' | 'kegiatanId' | 'status' | 'uploadedAt'> {
  id: string;
}

type DateFieldName = 'tanggalMulaiPelatihan' | 'tanggalSelesaiPelatihan' | 'tanggalMulaiPendataan' | 'tanggalSelesaiPendataan';

// --- Fungsi API ---
const createActivity = async (data: any) => {
    const sanitizedData = {
        ...data,
        documents: data.documents.map(({ id, ...rest }: DocumentItem) => rest),
        pplAllocations: data.pplAllocations.map(({ id, ...rest }: PPLItem) => rest),
    };
    const res = await fetch('/api/kegiatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData),
    });
    if (!res.ok) throw new Error('Gagal membuat kegiatan');
    return res.json();
}

type InputKegiatanStore = InputKegiatanState & InputKegiatanActions;

// Komponen Utama
export default function InputKegiatan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("persiapan");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showExcelSuccessModal, setShowExcelSuccessModal] = useState(false);
  const [importedPplCount, setImportedPplCount] = useState(0);

  const {
    formData,
    updateFormField,
    addPPL,
    removePPL,
    updatePPL,
    addDocumentLink,
    updateDocument,
    removeDocument,
    setPplAllocations,
    resetForm
  } = useInputKegiatanStore((state: InputKegiatanStore) => ({ formData: state, ...state }));

  const mutation = useMutation({ mutationFn: createActivity, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['kegiatan'] }); setShowSuccessModal(true); resetForm(); }, });
  const downloadTemplate = () => { const headers = ['Nama PPL', 'Beban Kerja', 'Satuan Beban Kerja', 'Besaran Honor (Rp)', 'Nama PML']; const csvContent = headers.join(',') + '\n' + 'Contoh PPL 1,120,Hari,2400000,Contoh PML 1\n'; const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'Template_PPL.csv'; link.click(); };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').slice(1);
        const newPPLItems: PPLItem[] = lines
            .map((line, i) => {
                const data = line.split(',');
                if (data.length >= 5 && data[0].trim()) {
                    return {
                        id: Date.now().toString() + i,
                        namaPPL: data[0].trim(),
                        bebanKerja: data[1].trim(),
                        satuanBebanKerja: data[2].trim(),
                        besaranHonor: data[3].trim(),
                        namaPML: data[4].trim()
                    };
                }
                return null;
            })
            .filter((item): item is PPLItem => item !== null);

        if (newPPLItems.length > 0) {
            setPplAllocations(newPPLItems);
            setImportedPplCount(newPPLItems.length);
            setShowExcelSuccessModal(true);
        } else {
            alert('Tidak ada data valid yang ditemukan dalam file.');
        }
    };
    reader.readAsText(file);
  };

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) parseExcelFile(file); event.target.value = ''; };
  const validateForm = () => {
    return formData.namaKegiatan && formData.ketuaTim && formData.tanggalMulaiPelatihan && formData.tanggalSelesaiPelatihan && formData.tanggalMulaiPendataan && formData.tanggalSelesaiPendataan && formData.pplAllocations.every((ppl: PPLItem) => ppl.namaPPL && ppl.besaranHonor);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
        alert("Harap lengkapi semua field bertanda *.");
        return;
    }
    mutation.mutate({
        ...formData,
        tanggalMulaiPelatihan: format(formData.tanggalMulaiPelatihan!, 'yyyy-MM-dd'),
        tanggalSelesaiPelatihan: format(formData.tanggalSelesaiPelatihan!, 'yyyy-MM-dd'),
        tanggalMulaiPendataan: format(formData.tanggalMulaiPendataan!, 'yyyy-MM-dd'),
        tanggalSelesaiPendataan: format(formData.tanggalSelesaiPendataan!, 'yyyy-MM-dd')
    });
  };

  const handleSuccessAction = () => { navigate('/dashboard'); };
  const ketuaTimOptions = ["Dr. Ahmad Surya", "Dra. Siti Rahma", "M. Budi Santoso, S.St"];
  
  const renderDocumentSection = (tipe: Dokumen['tipe'], title: string) => {
        const documents = formData.documents?.filter(d => d.tipe === tipe) || [];
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Dokumen {title}</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={() => addDocumentLink(tipe)} className="flex items-center gap-2"><Plus className="w-4 h-4" />Tambah Dokumen Pendukung</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {documents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500"><p>Belum ada dokumen untuk fase ini.</p></div>
                    ) : (
                        documents.map(doc => (
                             <div key={doc.id} className={cn("flex items-center gap-3 p-3 border rounded-lg", doc.isWajib ? "bg-blue-50 border-blue-200" : "bg-gray-50/50")}>
                                <div className="flex-grow space-y-2">
                                    {doc.isWajib ? (
                                        <Label className="font-semibold">{doc.nama}</Label>
                                    ) : (
                                        <Input placeholder="Nama Dokumen Pendukung" value={doc.nama} onChange={(e) => updateDocument(doc.id, 'nama', e.target.value)} />
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Link2 className="w-4 h-4 text-gray-400"/>
                                        <Input placeholder="https://drive.google.com/..." value={doc.link} onChange={(e) => updateDocument(doc.id, 'link', e.target.value)} />
                                    </div>
                                </div>
                                {!doc.isWajib ? (
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(doc.id)} className="self-center"><X className="w-4 h-4 text-gray-500"/></Button>
                                ) : (
                                    <div className="self-center p-2" title="Dokumen Wajib">
                                        <Lock className="w-4 h-4 text-gray-400"/>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        );
    };


  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Input Kegiatan</h1>
            <p className="text-gray-600">Lengkapi semua informasi kegiatan dalam satu halaman</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
                <CardTitle>Informasi Kegiatan</CardTitle>
                <CardDescription>Masukkan detail dasar mengenai kegiatan yang akan dilaksanakan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="namaKegiatan">Nama Kegiatan *</Label>
                    <Input id="namaKegiatan" value={formData.namaKegiatan} onChange={(e) => updateFormField('namaKegiatan', e.target.value)} placeholder="Contoh: Sensus Penduduk 2024" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ketuaTim">Nama Ketua Tim *</Label>
                    <Select value={formData.ketuaTim} onValueChange={(value) => updateFormField('ketuaTim', value)}>
                        <SelectTrigger><SelectValue placeholder="Pilih ketua tim" /></SelectTrigger>
                        <SelectContent>{ketuaTimOptions.map((nama) => (<SelectItem key={nama} value={nama}>{nama}</SelectItem>))}</SelectContent>
                    </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timKerja">Tim Kerja</Label>
                <Textarea id="timKerja" value={formData.timKerja} onChange={(e) => updateFormField('timKerja', e.target.value)} placeholder="Deskripsikan tim kerja dan pembagian tugas secara singkat." />
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
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData[field]} onSelect={(date) => updateFormField(field, date)} /></PopoverContent>
                        </Popover>
                    </div>
                ))}
            </CardContent>
          </Card>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="persiapan">Persiapan</TabsTrigger>
                  <TabsTrigger value="pengumpulan-data">Pengumpulan Data</TabsTrigger>
                  <TabsTrigger value="pengolahan-analisis">Pengolahan & Analisis</TabsTrigger>
                  <TabsTrigger value="diseminasi-evaluasi">Diseminasi & Evaluasi</TabsTrigger>
              </TabsList>
              <TabsContent value="persiapan">{renderDocumentSection('persiapan', 'Persiapan')}</TabsContent>
              <TabsContent value="pengumpulan-data">{renderDocumentSection('pengumpulan-data', 'Pengumpulan Data')}</TabsContent>
              <TabsContent value="pengolahan-analisis">{renderDocumentSection('pengolahan-analisis', 'Pengolahan & Analisis')}</TabsContent>
              <TabsContent value="diseminasi-evaluasi">{renderDocumentSection('diseminasi-evaluasi', 'Diseminasi & Evaluasi')}</TabsContent>
          </Tabs>

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
                <CardDescription>
                    Input data Petugas Pencacah Lapangan (PPL) dan Petugas Pemeriksa Lapangan (PML) secara manual atau unggah melalui file CSV.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {formData.pplAllocations.map((ppl: PPLItem, index: number) => (
                    <div key={ppl.id} className="p-4 border rounded-lg space-y-4 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium">PPL {index + 1}</h4>
                            {formData.pplAllocations.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removePPL(ppl.id)}><Trash2 className="w-4 h-4 text-red-500"/></Button>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nama PPL *</Label>
                                <Input placeholder="Nama PPL" value={ppl.namaPPL} onChange={e => updatePPL(ppl.id, 'namaPPL', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Nama PML *</Label>
                                <Input placeholder="Nama PML" value={ppl.namaPML} onChange={e => updatePPL(ppl.id, 'namaPML', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Beban Kerja *</Label>
                                <Input placeholder="Beban Kerja" value={ppl.bebanKerja} onChange={e => updatePPL(ppl.id, 'bebanKerja', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Satuan Beban Kerja</Label>
                                <Input placeholder="Satuan Beban Kerja" value={ppl.satuanBebanKerja} onChange={e => updatePPL(ppl.id, 'satuanBebanKerja', e.target.value)} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Besaran Honor (Rp) *</Label>
                                <Input placeholder="Besaran Honor (Rp)" value={ppl.besaranHonor} onChange={e => updatePPL(ppl.id, 'besaranHonor', e.target.value)} />
                            </div>
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
        <SuccessModal
            isOpen={showExcelSuccessModal}
            onClose={() => setShowExcelSuccessModal(false)}
            title="Data PPL Berhasil Diimpor!"
            description={`${importedPplCount} data PPL/PML telah berhasil dimuat dari file.`}
            autoCloseDelay={2000}
        />
      </div>
    </Layout>
  );
}
