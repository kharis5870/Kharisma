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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Search, 
  Star,
  StarOff,
  Save,
  Filter,
  Users,
  Award,
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react";
import { PenilaianMitra as PenilaianMitraType, PenilaianRequest } from "@shared/api";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/apiClient";

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

  const getRatingColor = (value: string | number) => {
    const num = Number(value);
    if (num >= 8) return "text-green-600";
    if (num >= 6) return "text-yellow-600";
    return "text-red-600";
  };

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
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Penilaian Mitra: {penilaian.namaPPL}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="bg-slate-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-slate-600">Kegiatan</Label>
                  <p className="font-medium">{penilaian.namaKegiatan}</p>
                </div>
                <div>
                  <Label className="text-slate-600">PML</Label>
                  <p className="font-medium">{penilaian.namaPML || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">Kriteria Penilaian</h3>
            {[
              { label: "Sikap dan Perilaku", value: sikapPerilaku, setter: setSikapPerilaku },
              { label: "Kualitas Pekerjaan", value: kualitasPekerjaan, setter: setKualitasPekerjaan },
              { label: "Ketepatan Waktu Penyelesaian", value: ketepatanWaktu, setter: setKetepatanWaktu }
            ].map(item => (
              <div key={item.label}>
                <Label>{item.label}</Label>
                <Select value={item.value} onValueChange={item.setter}>
                  <SelectTrigger><SelectValue placeholder="Pilih nilai (1-10)" /></SelectTrigger>
                  <SelectContent position="popper" className="max-h-56">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{num}</span>
                          <div className="flex">
                            {Array.from({ length: num }).map((_, j) => (
                              <Star key={j} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            
            {averageScore !== "0.0" && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900">Rata-rata Nilai:</span>
                    <div className="flex items-center space-x-2">
                      <span className={cn("text-2xl font-bold", getRatingColor(averageScore))}>
                        {averageScore}
                      </span>
                      <div className="flex">
                        {Array.from({ length: Math.round(parseFloat(averageScore)) }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
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
    const [searchQuery, setSearchQuery] = useState("");
    const [filterKegiatan, setFilterKegiatan] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
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
  
    const filteredData = useMemo(() => {
      if (!penilaianData) return [];
      return penilaianData.filter(item => {
        const pmlName = item.namaPML || "";
        const matchesSearch = 
          item.namaPPL.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.namaKegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pmlName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesKegiatan = filterKegiatan === "all" || item.namaKegiatan === filterKegiatan;
        const matchesStatus = filterStatus === "all" || 
          (filterStatus === "sudah" && item.sudahDinilai) ||
          (filterStatus === "belum" && !item.sudahDinilai);
  
        return matchesSearch && matchesKegiatan && matchesStatus;
      });
    }, [penilaianData, searchQuery, filterKegiatan, filterStatus]);

    const totalPages = useMemo(() => {
        return Math.ceil(filteredData.length / pageSize);
    }, [filteredData, pageSize]);

    const paginatedData = useMemo(() => {
        const start = pageIndex * pageSize;
        const end = start + pageSize;
        return filteredData.slice(start, end);
    }, [filteredData, pageIndex, pageSize]);
    
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
  
    return (
      <Layout>
      <div className="p-6 space-y-6 bg-slate-50 min-h-full">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Penilaian Mitra</h1>
                        <p className="text-slate-600">Kelola dan nilai performa mitra PPL pada setiap kegiatan.</p>
                    </div>
                    <Button asChild>
                        <Link to="/rekap-penilaian">
                            <Award className="w-4 h-4 mr-2" />
                            Lihat Rekap Penilaian
                        </Link>
                    </Button>
                </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4 flex items-center justify-between"><div className="space-y-1"><p className="text-sm font-medium text-slate-600">Total Mitra</p><p className="text-2xl font-bold">{stats.total}</p></div><Users className="w-8 h-8 text-blue-500" /></CardContent></Card>
            <Card className="border-l-4 border-l-green-500"><CardContent className="p-4 flex items-center justify-between"><div className="space-y-1"><p className="text-sm font-medium text-slate-600">Sudah Dinilai</p><p className="text-2xl font-bold">{stats.sudahDinilai}</p></div><CheckCircle className="w-8 h-8 text-green-500" /></CardContent></Card>
            <Card className="border-l-4 border-l-yellow-500"><CardContent className="p-4 flex items-center justify-between"><div className="space-y-1"><p className="text-sm font-medium text-slate-600">Belum Dinilai</p><p className="text-2xl font-bold">{stats.total - stats.sudahDinilai}</p></div><Clock className="w-8 h-8 text-yellow-500" /></CardContent></Card>
            <Card className="border-l-4 border-l-purple-500"><CardContent className="p-4 flex items-center justify-between"><div className="space-y-1"><p className="text-sm font-medium text-slate-600">Rata-rata Nilai</p><p className="text-2xl font-bold">{stats.rataRataKeseluruhan.toFixed(1)}</p></div><Award className="w-8 h-8 text-purple-500" /></CardContent></Card>
        </div>
  
        <Card>
          <CardHeader>
            <CardTitle>Filter dan Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label>Cari Mitra/Kegiatan</Label>
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><Input placeholder="Cari nama PPL..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/></div>
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
            </div>
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader>
            <CardTitle>Daftar Penilaian Mitra</CardTitle>
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
                  <TableRow><TableCell colSpan={6} className="text-center text-red-500 py-8">Gagal memuat data.</TableCell></TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-slate-500 py-8"><Users className="w-8 h-8 mx-auto mb-2" /><p>Tidak ada data ditemukan</p></TableCell></TableRow>
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
                              <span className="text-slate-500 font-normal ml-1">({item.tahap?.replace('-', ' ')?.replace(/\b\w/g, l => l.toUpperCase())})</span>
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
                                        item.sudahDinilai && "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
                                        isButtonDisabled && "bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200"
                                    )}
                                >
                                    <Star className="w-3 h-3 mr-1" />
                                    {item.sudahDinilai ? "Edit Nilai" : "Beri Nilai"}
                                </Button>
                            </TableCell>
                            <TableCell className="text-center">
                                {item.rataRata !== null ? (
                                    <Badge variant="secondary" className={cn("font-bold", item.rataRata >= 8 ? "bg-green-100 text-green-700" : item.rataRata >= 6 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700")}>
                                        {typeof item.rataRata === 'number' ? item.rataRata.toFixed(1) : item.rataRata}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-slate-500"><StarOff className="w-3 h-3 mr-1" />Belum dinilai</Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    );
                })
            )}
        </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-4 pt-4">
            <div className="flex items-center space-x-2 text-sm">
                <span>Baris per halaman</span>
                <Select
                    value={`${pageSize}`}
                    onValueChange={(value) => {
                        setPageSize(Number(value));
                        setPageIndex(0); // Kembali ke halaman pertama saat ukuran diubah
                    }}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent>
                        {[10, 20, 50, 100].map((size) => (
                            <SelectItem key={size} value={`${size}`}>
                                {size}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="text-sm font-medium">
                Halaman {pageIndex + 1} dari {totalPages}
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageIndex(pageIndex - 1)}
                    disabled={pageIndex === 0}
                >
                    Sebelumnya
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageIndex(pageIndex + 1)}
                    disabled={pageIndex >= totalPages - 1}
                >
                    Berikutnya
                </Button>
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