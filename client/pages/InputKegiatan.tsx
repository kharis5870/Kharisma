import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { CalendarIcon, Plus, Trash2, Link2, X, Lock, Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useInputKegiatanStore, { State as InputKegiatanState } from "@/stores/useInputKegiatanStore";
import { Dokumen, PPLMaster } from "@shared/api";

type DateFieldName = 'tanggalMulaiPelatihan' | 'tanggalSelesaiPelatihan' | 'tanggalMulaiPendataan' | 'tanggalSelesaiPendataan';

// --- API Functions ---
const createActivity = async (data: any) => {
    const sanitizedData = {
        ...data,
        documents: data.documents.map(({ id, ...rest }: any) => rest),
        pplAllocations: data.pplAllocations.map(({ id, ...rest }: any) => rest),
    };
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

export default function InputKegiatan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedPPLsForActivity, clearSelectedPPLsForActivity } = usePPL();
  const { data: pplList = [] } = useQuery({ queryKey: ['pplMaster'], queryFn: fetchPPLs });
  
  const [activeTab, setActiveTab] = useState("persiapan");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAutoPopulateMessage, setShowAutoPopulateMessage] = useState(false);
  const [pplComboboxStates, setPplComboboxStates] = useState<{ [key: string]: boolean }>({});

  const store = useInputKegiatanStore();

  useEffect(() => {
    if (selectedPPLsForActivity.length > 0) {
        const newAllocations = selectedPPLsForActivity.map(ppl => ({
            id: `ppl-${ppl.id}-${Date.now()}`,
            pplId: ppl.id,
            namaPPL: ppl.namaPPL,
            bebanKerja: "",
            satuanBebanKerja: "",
            besaranHonor: "",
            namaPML: ""
        }));
        store.setPplAllocations(newAllocations);
        setShowAutoPopulateMessage(true);
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
    return store.namaKegiatan && store.ketuaTim && store.tanggalMulaiPelatihan && store.tanggalSelesaiPelatihan && store.tanggalMulaiPendataan && store.tanggalSelesaiPendataan && store.pplAllocations.every(ppl => ppl.pplId && ppl.bebanKerja && ppl.besaranHonor && ppl.namaPML);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
        alert("Harap lengkapi semua field bertanda *.");
        return;
    }
    mutation.mutate({
        ...store,
        tanggalMulaiPelatihan: format(store.tanggalMulaiPelatihan!, 'yyyy-MM-dd'),
        tanggalSelesaiPelatihan: format(store.tanggalSelesaiPelatihan!, 'yyyy-MM-dd'),
        tanggalMulaiPendataan: format(store.tanggalMulaiPendataan!, 'yyyy-MM-dd'),
        tanggalSelesaiPendataan: format(store.tanggalSelesaiPendataan!, 'yyyy-MM-dd')
    });
  };

  const handleSuccessAction = () => navigate('/dashboard');
  const ketuaTimOptions = ["MOHAMMAD FATHAN ROMDHONI, S.ST., M.Si", "ENGKY HENDARMADI R, S.E", "ROSSI BETTEGA, S.E", "NOPTI RIANAH, SP", "EDIANTO, SE", "WILSON, SE", "YAYUK KURNIA NINGSIH, S.I.KOM", "ANDI OKTA FENGKI, SSI., M.SI", "DEFRI ARIYANTO, SSI., M.SI"];
  
  const renderDocumentSection = (tipe: Dokumen['tipe'], title: string) => {
    const documents = store.documents?.filter(d => d.tipe === tipe) || [];
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Dokumen {title}</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => store.addDocumentLink(tipe)} className="flex items-center gap-2"><Plus className="w-4 h-4" />Tambah Dokumen Pendukung</Button>
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
                                    <Input placeholder="Nama Dokumen Pendukung" value={doc.nama} onChange={(e) => store.updateDocument(doc.id, 'nama', e.target.value)} />
                                )}
                                <div className="flex items-center gap-2">
                                    <Link2 className="w-4 h-4 text-gray-400"/>
                                    <Input placeholder="https://drive.google.com/..." value={doc.link} onChange={(e) => store.updateDocument(doc.id, 'link', e.target.value)} />
                                </div>
                            </div>
                            {!doc.isWajib ? (
                                <Button type="button" variant="ghost" size="icon" onClick={() => store.removeDocument(doc.id)} className="self-center"><X className="w-4 h-4 text-gray-500"/></Button>
                            ) : (
                                <div className="self-center p-2" title="Dokumen Wajib"><Lock className="w-4 h-4 text-gray-400"/></div>
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
            {showAutoPopulateMessage && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">✅ {store.pplAllocations.length} PPL telah ditambahkan dari halaman Manajemen PPL.</p>
                </div>
            )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader><CardTitle>Informasi Kegiatan</CardTitle><CardDescription>Masukkan detail dasar mengenai kegiatan.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="namaKegiatan">Nama Kegiatan *</Label><Input id="namaKegiatan" value={store.namaKegiatan} onChange={(e) => store.updateFormField('namaKegiatan', e.target.value)} placeholder="Contoh: Sensus Penduduk 2024" /></div>
                <div className="space-y-2"><Label htmlFor="ketuaTim">Nama Ketua Tim *</Label><Select value={store.ketuaTim} onValueChange={(value) => store.updateFormField('ketuaTim', value)}><SelectTrigger><SelectValue placeholder="Pilih ketua tim" /></SelectTrigger><SelectContent>{ketuaTimOptions.map((nama) => (<SelectItem key={nama} value={nama}>{nama}</SelectItem>))}</SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label htmlFor="timKerja">Tim Kerja</Label><Textarea id="timKerja" value={store.timKerja} onChange={(e) => store.updateFormField('timKerja', e.target.value)} placeholder="Deskripsikan tim kerja..." /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Jadwal Kegiatan *</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {([ {label: 'Mulai Pelatihan', field: 'tanggalMulaiPelatihan'}, {label: 'Selesai Pelatihan', field: 'tanggalSelesaiPelatihan'}, {label: 'Mulai Pendataan', field: 'tanggalMulaiPendataan'}, {label: 'Selesai Pendataan', field: 'tanggalSelesaiPendataan'} ] as {label: string, field: DateFieldName}[]).map(({label, field}) => (
                    <div key={field} className="space-y-2">
                        <Label>{label}</Label>
                        <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !store[field] && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{store[field] ? format(store[field]!, "dd MMMM yyyy") : <span>Pilih tanggal</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={store[field] as Date} onSelect={(date) => store.updateFormField(field, date)} /></PopoverContent></Popover>
                    </div>
                ))}
            </CardContent>
          </Card>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="persiapan">Persiapan</TabsTrigger><TabsTrigger value="pengumpulan-data">Pengumpulan Data</TabsTrigger><TabsTrigger value="pengolahan-analisis">Pengolahan & Analisis</TabsTrigger><TabsTrigger value="diseminasi-evaluasi">Diseminasi & Evaluasi</TabsTrigger></TabsList>
              <TabsContent value="persiapan">{renderDocumentSection('persiapan', 'Persiapan')}</TabsContent>
              <TabsContent value="pengumpulan-data">{renderDocumentSection('pengumpulan-data', 'Pengumpulan Data')}</TabsContent>
              <TabsContent value="pengolahan-analisis">{renderDocumentSection('pengolahan-analisis', 'Pengolahan & Analisis')}</TabsContent>
              <TabsContent value="diseminasi-evaluasi">{renderDocumentSection('diseminasi-evaluasi', 'Diseminasi & Evaluasi')}</TabsContent>
          </Tabs>

          <Card>
            <CardHeader><CardTitle>Alokasi PPL & PML</CardTitle><CardDescription>Pilih PPL dari daftar yang tersedia dan isi detail alokasinya.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
                {store.pplAllocations.map((ppl, index) => (
                    <div key={ppl.id} className="p-4 border rounded-lg space-y-4 bg-gray-50">
                        <div className="flex justify-between items-center"><h4 className="font-medium">Alokasi {index + 1}</h4>{store.pplAllocations.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => store.removePPL(ppl.id)}><Trash2 className="w-4 h-4 text-red-500"/></Button>}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2 lg:col-span-3">
                                <Label>Pilih PPL *</Label>
                                <Popover open={pplComboboxStates[ppl.id] || false} onOpenChange={(open) => setPplComboboxStates(prev => ({ ...prev, [ppl.id]: open }))}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between">{ppl.namaPPL || "Pilih PPL..."}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Cari PPL..." /><CommandList><CommandEmpty>PPL tidak ditemukan.</CommandEmpty><CommandGroup>
                                        {pplList.map((pplOption) => (
                                            <CommandItem key={pplOption.id} value={`${pplOption.id} ${pplOption.namaPPL}`} onSelect={() => { store.updatePPL(ppl.id, 'pplId', pplOption.id); store.updatePPL(ppl.id, 'namaPPL', pplOption.namaPPL); setPplComboboxStates(prev => ({ ...prev, [ppl.id]: false })); }}>
                                                <Check className={cn("mr-2 h-4 w-4", ppl.pplId === pplOption.id ? "opacity-100" : "opacity-0")} />
                                                <div className="flex flex-col"><span>{pplOption.namaPPL}</span><span className="text-xs text-gray-500">ID: {pplOption.id}</span></div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup></CommandList></Command></PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2"><Label>Beban Kerja *</Label><Input placeholder="Beban Kerja" value={ppl.bebanKerja} onChange={e => store.updatePPL(ppl.id, 'bebanKerja', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Satuan</Label><Input placeholder="Contoh: Hari" value={ppl.satuanBebanKerja} onChange={e => store.updatePPL(ppl.id, 'satuanBebanKerja', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Honor (Rp) *</Label><Input placeholder="Contoh: 2000000" value={ppl.besaranHonor} onChange={e => store.updatePPL(ppl.id, 'besaranHonor', e.target.value)} /></div>
                            <div className="space-y-2 md:col-span-2 lg:col-span-3"><Label>Nama PML *</Label><Input placeholder="Nama PML" value={ppl.namaPML} onChange={e => store.updatePPL(ppl.id, 'namaPML', e.target.value)} /></div>
                        </div>
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={store.addPPL} className="w-full border-dashed"><Plus className="w-4 h-4 mr-2"/>Tambah Alokasi PPL</Button>
            </CardContent>
          </Card>
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
