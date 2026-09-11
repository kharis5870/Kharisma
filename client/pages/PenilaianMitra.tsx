// client/pages/PenilaianMitra.tsx (VERSI FINAL DENGAN UI/UX SESUAI PROTOTIPE)

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout"; 
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Search, 
  Star,
  StarOff,
  Save,
  Users,
  Award,
  CheckCircle,
  Clock,
  Loader2,
  FileDown,
  Sheet,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { PenilaianMitra as PenilaianMitraType, PenilaianRequest } from "@shared/api";
import { exportToPdf, exportToExcel, type KolomEkspor } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SKALA_NILAI, tingkatMutu } from "@shared/mutuPenilaian";
import { NADA_TOMBOL_MUTU, NADA_TEKS_MUTU } from "@/lib/statusStyles";
import { apiClient } from "@/lib/apiClient";
import { useHalamanAman } from "@/hooks/useHalamanAman";

//================================================================================
// MODAL COMPONENT (SESUAI PROTOTIPE)
//================================================================================
interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  penilaian: PenilaianMitraType | null;
  onSave: (data: PenilaianRequest) => void;
  isSaving: boolean;
}

function EvaluationModal({ isOpen, onClose, penilaian, onSave, isSaving }: EvaluationModalProps) {
  const { user } = useAuth();
  const [sikapPerilaku, setSikapPerilaku] = useState<string>("");
  const [kualitasPekerjaan, setKualitasPekerjaan] = useState<string>("");
  const [ketepatanWaktu, setKetepatanWaktu] = useState<string>("");

  useEffect(() => {
    if (isOpen && penilaian) {
      setSikapPerilaku(penilaian.sikapPelikaku?.toString() || "");
      setKualitasPekerjaan(penilaian.kualitasPekerjaan?.toString() || "");
      setKetepatanWaktu(penilaian.ketepatanWaktu?.toString() || "");
    }
  }, [isOpen, penilaian]);

  const handleSave = () => {
    if (!sikapPerilaku || !kualitasPekerjaan || !ketepatanWaktu) {
      toast.error("Semua kriteria penilaian harus diisi!");
      return;
    }
    if (!penilaian || !user) return;

    const data: PenilaianRequest = {
      pplId: penilaian.pplId,
      kegiatanId: penilaian.kegiatanId,
      pmlId: penilaian.pmlId,
      sikapPelikaku: parseInt(sikapPerilaku),
      kualitasPekerjaan: parseInt(kualitasPekerjaan),
      ketepatanWaktu: parseInt(ketepatanWaktu),
      dinilaiOleh_userId: user.id,
    };
    onSave(data);
  };

  // Ambang 8/6 dulu tersalin di sini dan di badge tabel. Sekarang keduanya
  // memakai `tingkatMutu` dari @shared/mutuPenilaian.
  const getRatingColor = (value: string | number) =>
    NADA_TEKS_MUTU[tingkatMutu(value) ?? 'kurang'];

  const averageScore = useMemo(() => {
    if (!sikapPerilaku || !kualitasPekerjaan || !ketepatanWaktu) return "0.0";
    return ((parseInt(sikapPerilaku) + parseInt(kualitasPekerjaan) + parseInt(ketepatanWaktu)) / 3).toFixed(1);
  }, [sikapPerilaku, kualitasPekerjaan, ketepatanWaktu]);

  if (!penilaian) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500 dark:text-yellow-400" />
            Penilaian Mitra: {penilaian.namaPPL}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="bg-muted">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Kegiatan</Label>
                  <p className="font-medium">{penilaian.namaKegiatan}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">PML</Label>
                  <p className="font-medium">{penilaian.namaPML || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Kriteria Penilaian</h3>
            {[
              { label: "Sikap dan Perilaku", value: sikapPerilaku, setter: setSikapPerilaku },
              { label: "Kualitas Pekerjaan", value: kualitasPekerjaan, setter: setKualitasPekerjaan },
              { label: "Ketepatan Waktu Penyelesaian", value: ketepatanWaktu, setter: setKetepatanWaktu }
            ].map(item => (
              <div key={item.label}>
                <Label>{item.label}</Label>
                {/* Deretan tombol, bukan dropdown: seluruh skala terlihat
                    sekaligus dan memberi nilai cukup satu klik, tanpa membuka
                    daftar lalu menggulirnya. */}
                <ToggleGroup
                  type="single"
                  value={item.value}
                  // Radix mengirim "" bila tombol yang sama ditekan lagi.
                  // Diabaikan: ketiga aspek wajib terisi, dan menghapus nilai
                  // tanpa sengaja lebih merepotkan daripada mengubahnya.
                  onValueChange={(nilai) => { if (nilai) item.setter(nilai); }}
                  variant="outline"
                  className="mt-1 flex-wrap justify-start gap-1"
                >
                  {SKALA_NILAI.map(num => (
                    <ToggleGroupItem
                      key={num}
                      value={String(num)}
                      aria-label={`${item.label}: ${num}`}
                      className={cn("h-9 w-9 p-0 font-semibold", NADA_TOMBOL_MUTU[tingkatMutu(num)!])}
                    >
                      {num}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            ))}
            
            {averageScore !== "0.0" && (
              <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900 dark:text-blue-300">Rata-rata Nilai:</span>
                    <div className="flex items-center space-x-2">
                      <span className={cn("text-2xl font-bold", getRatingColor(averageScore))}>
                        {averageScore}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Batal</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Simpan Penilaian</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

//================================================================================
// MAIN PAGE COMPONENT (SESUAI PROTOTIPE)
//================================================================================
const fetchPenilaianData = async (tahun: number, triwulan: number): Promise<PenilaianMitraType[]> => {
    const params = triwulan > 0 ? `?tahun=${tahun}&triwulan=${triwulan}` : '';
    return apiClient.get<PenilaianMitraType[]>(`/penilaian${params}`);
};

const savePenilaian = async (penilaianData: PenilaianRequest) => {
  const result = await apiClient.post('/penilaian', penilaianData);
  return result;
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const triwulans = [
    { value: 0, label: 'Semua Triwulan' }, // Opsi untuk menampilkan semua
    { value: 1, label: 'Triwulan 1 (Jan-Mar)' },
    { value: 2, label: 'Triwulan 2 (Apr-Jun)' },
    { value: 3, label: 'Triwulan 3 (Jul-Sep)' },
    { value: 4, label: 'Triwulan 4 (Okt-Des)' }
];
const getCurrentTriwulan = () => Math.floor(new Date().getMonth() / 3) + 1;

export default function PenilaianMitraPage() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterKegiatan, setFilterKegiatan] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    // Penyaring mitra yang dinilai akun ini, sejajar dengan modal Update
    // Progress: seorang PML biasanya hanya mengurus sebagian mitra.
    const [filterPML, setFilterPML] = useState<'saya-dulu' | 'hanya-saya' | 'semua'>('saya-dulu');
    const [selectedTahun, setSelectedTahun] = useState(currentYear);
    const [selectedTriwulan, setSelectedTriwulan] = useState(getCurrentTriwulan());
    const [selectedPenilaian, setSelectedPenilaian] = useState<PenilaianMitraType | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10); // Default 10 baris per halaman
  
    const { data: penilaianData, isLoading, error } = useQuery({
        queryKey: ['penilaianMitra', selectedTahun, selectedTriwulan],
        queryFn: () => fetchPenilaianData(selectedTahun, selectedTriwulan)
    });
  
    const { mutate: saveEvaluation, isPending: isSaving } = useMutation({
      mutationFn: savePenilaian,
      onSuccess: () => {
        toast.success(`Penilaian untuk ${selectedPenilaian?.namaPPL} berhasil disimpan!`);
        queryClient.invalidateQueries({ queryKey: ['penilaianMitra'] });
        setModalOpen(false);
      },
      onError: () => {
        toast.error("Gagal menyimpan penilaian. Coba lagi.");
      },
    });
  
    const handleEvaluate = (penilaian: PenilaianMitraType) => {
      setSelectedPenilaian(penilaian);
      setModalOpen(true);
    };
  
    /** Mitra ini diawasi oleh akun yang sedang login? */
    const milikSaya = (item: PenilaianMitraType) => String(item.pmlId) === String(user?.id);

    const filteredData = useMemo(() => {
      if (!penilaianData) return [];
      const hasil = penilaianData.filter(item => {
        const pmlName = item.namaPML || "";
        const matchesSearch =
          item.namaPPL.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.namaKegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pmlName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesKegiatan = filterKegiatan === "all" || item.namaKegiatan === filterKegiatan;
        const matchesStatus = filterStatus === "all" ||
          (filterStatus === "sudah" && item.sudahDinilai) ||
          (filterStatus === "belum" && !item.sudahDinilai);
        const matchesPML = filterPML !== "hanya-saya" || milikSaya(item);

        return matchesSearch && matchesKegiatan && matchesStatus && matchesPML;
      });

      // Urutan stabil: mitra yang dinilai akun ini naik ke atas, sisanya tetap
      // urut nama. Mengikuti pola penyaring yang sama di modal Update Progress.
      if (filterPML === "saya-dulu") {
        return [...hasil].sort((a, b) => {
          const beda = Number(milikSaya(b)) - Number(milikSaya(a));
          return beda !== 0 ? beda : (a.namaPPL || "").localeCompare(b.namaPPL || "");
        });
      }
      return hasil;
    }, [penilaianData, searchQuery, filterKegiatan, filterStatus, filterPML, user?.id]);

    const totalPages = useMemo(() => {
        return Math.ceil(filteredData.length / pageSize);
    }, [filteredData, pageSize]);

    const paginatedData = useMemo(() => {
        const start = pageIndex * pageSize;
        const end = start + pageSize;
        return filteredData.slice(start, end);
    }, [filteredData, pageIndex, pageSize]);

    // Halaman ini berbasis indeks (mulai 0), berbeda dengan halaman lain yang
    // mulai dari 1 — karena itu argumen terakhirnya 0.
    useHalamanAman(pageIndex, totalPages, setPageIndex, 0);
    
    const uniqueKegiatan = useMemo(() => {
      if (!penilaianData) return [];
      return Array.from(new Set(penilaianData.map(p => p.namaKegiatan)));
    }, [penilaianData]);
  
    const stats = useMemo(() => {
      const total = penilaianData?.length || 0;
      const sudahDinilai = penilaianData?.filter(p => p.sudahDinilai).length || 0;
      const dinilaiData = penilaianData?.filter(p => p.rataRata !== null) || [];
      const totalNilai = dinilaiData.reduce((acc, p) => acc + (p.rataRata || 0), 0);
      const rataRataKeseluruhan = dinilaiData.length > 0 ? totalNilai / dinilaiData.length : 0;
      return { total, sudahDinilai, rataRataKeseluruhan };
    }, [penilaianData]);

    // Diekspor: seluruh hasil filter, bukan hanya halaman yang tampil.
    const konteksEkspor = () => ({
      judul: 'Daftar Penilaian Mitra',
      subJudul: `Triwulan ${selectedTriwulan} ${selectedTahun}`,
      kolom: [
        { header: 'No', nilai: (_r: PenilaianMitraType, i: number) => i + 1, lebar: 'auto' },
        { header: 'Kegiatan', nilai: (r: PenilaianMitraType) => r.namaKegiatan, lebar: '*' },
        { header: 'Tahap', nilai: (r: PenilaianMitraType) => r.tahap, lebar: 'auto' },
        { header: 'Nama PPL', nilai: (r: PenilaianMitraType) => r.namaPPL, lebar: '*' },
        { header: 'Nama PML', nilai: (r: PenilaianMitraType) => r.namaPML ?? '-', lebar: '*' },
        { header: 'Sikap & Perilaku', nilai: (r: PenilaianMitraType) => r.sikapPelikaku ?? '-', lebar: 'auto', rataKanan: true },
        { header: 'Kualitas Pekerjaan', nilai: (r: PenilaianMitraType) => r.kualitasPekerjaan ?? '-', lebar: 'auto', rataKanan: true },
        { header: 'Ketepatan Waktu', nilai: (r: PenilaianMitraType) => r.ketepatanWaktu ?? '-', lebar: 'auto', rataKanan: true },
        { header: 'Rata-rata', nilai: (r: PenilaianMitraType) => r.rataRata ?? '-', lebar: 'auto', rataKanan: true },
        { header: 'Status', nilai: (r: PenilaianMitraType) => r.sudahDinilai ? 'Sudah Dinilai' : 'Belum Dinilai', lebar: 'auto' },
      ] as KolomEkspor<PenilaianMitraType>[],
      baris: filteredData,
      namaFile: 'penilaian-mitra',
      orientasi: 'landscape' as const,
    });

    return (
      <Layout>
      {/* Mengikuti pola baku halaman lain: tanpa padding dan latar sendiri —
          Layout sudah memberi p-6. `p-6 bg-muted min-h-full` yang lama
          menumpuk padding jadi 48px dan mengecat kotak abu di atas latar
          halaman, sehingga halaman ini terlihat beda sendiri. */}
      <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        {/* Judul dibedakan dari judul di Header (yang juga
                            "Penilaian Mitra") supaya tidak tertulis dua kali. */}
                        <h1 className="text-3xl font-bold text-foreground">Penilaian Kinerja Mitra</h1>
                        <p className="text-muted-foreground mt-1">Kelola dan nilai performa mitra PPL pada setiap kegiatan.</p>
                    </div>
                    <Button asChild>
                        <Link to="/rekap-penilaian">
                            <Award className="w-4 h-4 mr-2" />
                            Lihat Rekap Penilaian
                        </Link>
                    </Button>
                </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4 flex items-center justify-between"><div className="space-y-1"><p className="text-sm font-medium text-muted-foreground">Total Mitra</p><p className="text-2xl font-bold">{stats.total}</p></div><Users className="w-8 h-8 text-blue-500 dark:text-blue-400" /></CardContent></Card>
            <Card className="border-l-4 border-l-green-500"><CardContent className="p-4 flex items-center justify-between"><div className="space-y-1"><p className="text-sm font-medium text-muted-foreground">Sudah Dinilai</p><p className="text-2xl font-bold">{stats.sudahDinilai}</p></div><CheckCircle className="w-8 h-8 text-green-500 dark:text-green-400" /></CardContent></Card>
            <Card className="border-l-4 border-l-yellow-500"><CardContent className="p-4 flex items-center justify-between"><div className="space-y-1"><p className="text-sm font-medium text-muted-foreground">Belum Dinilai</p><p className="text-2xl font-bold">{stats.total - stats.sudahDinilai}</p></div><Clock className="w-8 h-8 text-yellow-500 dark:text-yellow-400" /></CardContent></Card>
            <Card className="border-l-4 border-l-purple-500"><CardContent className="p-4 flex items-center justify-between"><div className="space-y-1"><p className="text-sm font-medium text-muted-foreground">Rata-rata Nilai</p><p className="text-2xl font-bold">{stats.rataRataKeseluruhan.toFixed(1)}</p></div><Award className="w-8 h-8 text-purple-500 dark:text-purple-400" /></CardContent></Card>
        </div>
  
        <Card>
          <CardHeader>
            <CardTitle>Filter dan Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <Label>Cari Mitra/Kegiatan</Label>
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" /><Input placeholder="Cari nama PPL..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/></div>
              </div>
              <div>
                  <Label>Tahun</Label>
                  <Select value={String(selectedTahun)} onValueChange={(v) => setSelectedTahun(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                          {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <div>
                  <Label>Triwulan</Label>
                  <Select value={String(selectedTriwulan)} onValueChange={(v) => setSelectedTriwulan(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                          {triwulans.map(t => <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <div>
                <Label>Filter Kegiatan</Label>
                <Select value={filterKegiatan} onValueChange={setFilterKegiatan}>
                  <SelectTrigger><SelectValue placeholder="Pilih kegiatan" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Semua Kegiatan</SelectItem>{uniqueKegiatan.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status Penilaian</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Semua Status</SelectItem><SelectItem value="sudah">Sudah Dinilai</SelectItem><SelectItem value="belum">Belum Dinilai</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tampilkan Mitra</Label>
                <Select value={filterPML} onValueChange={(v) => { setFilterPML(v as typeof filterPML); setPageIndex(0); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saya-dulu">Mitra saya di atas</SelectItem>
                    <SelectItem value="hanya-saya">Hanya mitra saya</SelectItem>
                    <SelectItem value="semua">Semua mitra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle>Daftar Penilaian Mitra</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={filteredData.length === 0} onClick={() => exportToPdf(konteksEkspor())}>
                  <FileDown className="w-4 h-4 mr-1" />PDF
                </Button>
                <Button variant="outline" size="sm" disabled={filteredData.length === 0} onClick={() => exportToExcel(konteksEkspor())}>
                  <Sheet className="w-4 h-4 mr-1" />Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead className="w-[50px]">No</TableHead><TableHead>Kegiatan</TableHead><TableHead>Nama PPL</TableHead><TableHead>Nama PML</TableHead><TableHead className="text-center">Nilai</TableHead><TableHead className="text-center">Rata-rata</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell><Skeleton className="h-4 w-4" /></TableCell><TableCell><Skeleton className="h-4 w-40" /></TableCell><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell className="text-center"><Skeleton className="h-8 w-24 mx-auto" /></TableCell><TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell></TableRow>
                  ))
                ) : error ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-red-500 dark:text-red-400 py-8">Gagal memuat data.</TableCell></TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8"><Users className="w-8 h-8 mx-auto mb-2" /><p>Tidak ada data ditemukan</p></TableCell></TableRow>
                ) : (
                  paginatedData.map((item: PenilaianMitraType, index: number) => {
                    // ✔️ 'useAuth' dipanggil di dalam map agar selalu mendapat konteks terbaru
                    const { user } = useAuth();
                    const isAuthorizedPML = String(user?.id) === String(item.pmlId);
                    const isButtonDisabled = !(isAuthorizedPML || user?.role === 'admin');

                    return (
                        <TableRow key={item.id}>
                            <TableCell>{pageIndex * pageSize + index + 1}</TableCell>
                            <TableCell className="font-medium">
                              {item.namaKegiatan}
                              <span className="text-muted-foreground font-normal ml-1">({item.tahap?.replace('-', ' ')?.replace(/\b\w/g, l => l.toUpperCase())})</span>
                            </TableCell>
                            <TableCell>{item.namaPPL}</TableCell>
                            <TableCell>{item.namaPML || '-'}</TableCell>
                            <TableCell className="text-center">
                                <Button 
                                    variant={item.sudahDinilai ? "outline" : "default"} 
                                    size="sm" 
                                    onClick={() => handleEvaluate(item)} 
                                    disabled={isButtonDisabled}
                                    title={isButtonDisabled ? "Hanya PML yang bersangkutan atau Admin yang dapat menilai" : ""}
                                    className={cn(
                                        item.sudahDinilai && "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-100 dark:bg-green-900/40",
                                        isButtonDisabled && "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
                                    )}
                                >
                                    <Star className="w-3 h-3 mr-1" />
                                    {item.sudahDinilai ? "Edit Nilai" : "Beri Nilai"}
                                </Button>
                            </TableCell>
                            <TableCell className="text-center">
                                {item.rataRata !== null ? (
                                    <Badge variant="secondary" className={cn("font-bold", item.rataRata >= 8 ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" : item.rataRata >= 6 ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300" : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300")}>
                                        {typeof item.rataRata === 'number' ? item.rataRata.toFixed(1) : item.rataRata}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-muted-foreground"><StarOff className="w-3 h-3 mr-1" />Belum dinilai</Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    );
                })
            )}
        </TableBody>
            </Table>
            {/* Struktur paginasi disamakan dengan Manajemen Honor: keterangan
                jumlah di kiri, pengatur baris + navigasi di kanan, dan tombol
                panah alih-alih "Sebelumnya/Berikutnya". */}
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                    Menampilkan <strong>{paginatedData.length}</strong> dari <strong>{filteredData.length}</strong> data
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Baris per halaman:</span>
                        <Select
                            value={`${pageSize}`}
                            onValueChange={(value) => {
                                setPageSize(Number(value));
                                setPageIndex(0); // Kembali ke halaman pertama saat ukuran diubah
                            }}
                        >
                            <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[10, 25, 50, 100].map((size) => (
                                    <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <Button variant="outline" size="sm" onClick={() => { if (pageIndex > 0) setPageIndex(pageIndex - 1); }} disabled={pageIndex === 0}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                            </PaginationItem>
                            <PaginationItem className="text-sm font-medium px-3">
                                {pageIndex + 1} / {totalPages || 1}
                            </PaginationItem>
                            <PaginationItem>
                                <Button variant="outline" size="sm" onClick={() => { if (pageIndex < totalPages - 1) setPageIndex(pageIndex + 1); }} disabled={pageIndex >= totalPages - 1}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
          </CardContent>
        </Card>
        
        <EvaluationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          penilaian={selectedPenilaian}
          onSave={saveEvaluation}
          isSaving={isSaving}
        />
      </div>
      </Layout>
    );
  }