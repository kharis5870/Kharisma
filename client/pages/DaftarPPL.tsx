// client/pages/DaftarPPL.tsx

import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import { PilihCari, NILAI_SEMUA } from "@/components/ui/pilih-cari";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { exportToExcel, type KolomEkspor } from "@/lib/exportUtils";
import { kueriPeriode, rentangPeriode, LABEL_PERIODE, URUTAN_PERIODE, type KunciPeriode } from "@/lib/periodePreset";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectPortal } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem
} from "@/components/ui/pagination";
import {
  Users,
  UserCheck,
  Search,
  ChevronUp,
  ChevronDown,
  UserPlus,
  List,
  UserX,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PPLAdminData, PPLMaster, Kecamatan, Desa } from "@shared/api";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/apiClient";
import { useHalamanAman } from "@/hooks/useHalamanAman";
import { GAYA_POSISI_PPL, NADA_STATUS } from "@/lib/statusStyles";

const fetchKecamatan = async (): Promise<Kecamatan[]> => apiClient.get('/alamat/kecamatan');
const fetchDesa = async (kecamatanId: string): Promise<Desa[]> => apiClient.get(`/alamat/desa?kecamatanId=${kecamatanId}`);

/**
 * Tanpa periode, kolom Kegiatan memuat SELURUH riwayat penugasan mitra. Dengan
 * periode, ia hanya memuat kegiatan yang honornya jatuh pada rentang itu —
 * itulah yang dibutuhkan saat menilai siapa yang masih longgar bulan depan.
 */
const fetchPPLs = async (periode: KunciPeriode): Promise<PPLAdminData[]> => {
    return apiClient.get<PPLAdminData[]>(`/admin/ppl${kueriPeriode(rentangPeriode(periode))}`);
};

const ActivityDetailModal = ({ isOpen, onClose, pplData }: { isOpen: boolean, onClose: () => void, pplData: PPLAdminData | null }) => {
    if (!pplData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Detail Kegiatan: {pplData.namaPPL}</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar semua kegiatan yang pernah diikuti.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 max-h-80 overflow-y-auto">
                    {/* ✔️ PERBAIKAN: Gunakan 'kegiatanDetails' */}
                    {pplData.kegiatanDetails && pplData.kegiatanDetails.length > 0 ? (
                        <ul className="space-y-2">
                            {pplData.kegiatanDetails.map((keg, index) => (
                                <li key={index} className="flex items-start gap-3 p-3 bg-muted rounded-md">
                                    <List className="w-4 h-4 text-bps-blue-500 mt-1 flex-shrink-0" />
                                    <span>
                                        {keg.nama}
                                        <span className="text-muted-foreground font-normal ml-1 capitalize">
                                            ({keg.tahap?.replace('-', ' ')})
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Tidak ada kegiatan tercatat.</p>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <Button variant="outline" onClick={onClose}>Tutup</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const PPLInfoModal = ({ isOpen, onClose, pplData }: { isOpen: boolean, onClose: () => void, pplData: PPLAdminData | null }) => {
    if (!pplData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Informasi Detail: {pplData.namaPPL}</DialogTitle>
                    <DialogDescription>
                        Detail kontak dan alamat untuk PPL yang dipilih.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="alamat" className="text-right">Alamat</Label>
                        <Input id="alamat" value={pplData.alamat || '-'} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="telepon" className="text-right">Telepon</Label>
                        <Input id="telepon" value={pplData.noTelepon || '-'} readOnly className="col-span-3" />
                    </div>
                    
                    {/* ✔️ TAMPILKAN DATA KECAMATAN & DESA */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="kecamatan" className="text-right">Kecamatan</Label>
                        <Input id="kecamatan" value={pplData.namaKecamatan || 'Belum diatur'} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="desa" className="text-right">Desa</Label>
                        <Input id="desa" value={pplData.namaDesa || 'Belum diatur'} readOnly className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function DaftarPPL() {
    const location = useLocation();
    const navigate = useNavigate();

    const sourcePage = location.state?.from || 'daftar-ppl'; 
    const sourceTahap = location.state?.tahap || 'persiapan';
    const kegiatanId = location.state?.kegiatanId;
    const existingPplIds = location.state?.existingPplIds || [];

    const [periodeFilter, setPeriodeFilter] = useState<KunciPeriode>('semua');
    // Periode ikut di dalam kunci query: tanpa itu, mengganti periode akan
    // menampilkan hasil periode sebelumnya dari cache.
    const { data: pplList = [], isLoading } = useQuery({
        queryKey: ['pplAdmin', periodeFilter],
        queryFn: () => fetchPPLs(periodeFilter),
    });
    
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successModalConfig, setSuccessModalConfig] = useState({ title: "", description: "", actionLabel: "", onAction: () => {} });

    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: keyof PPLAdminData | 'status'; direction: 'asc' | 'desc'; } | null>(null);
    const [selectedPPLs, setSelectedPPLs] = useState<string[]>([]);
    const [selectionMode, setSelectionMode] = useState(sourcePage !== 'daftar-ppl');

    const [showSelectedPPLsModal, setShowSelectedPPLsModal] = useState(false);
    const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedPplDetails, setSelectedPplDetails] = useState<PPLAdminData | null>(null);

    const [posisiFilter, setPosisiFilter] = useState<string>("Semua");
    const [selectedKecamatan, setSelectedKecamatan] = useState('all');
    const [selectedDesa, setSelectedDesa] = useState('all');
    const [desaOptions, setDesaOptions] = useState<Desa[]>([]);

    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [selectedPplForInfo, setSelectedPplForInfo] = useState<PPLAdminData | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const { data: kecamatanList = [] } = useQuery({ queryKey: ['kecamatan'], queryFn: fetchKecamatan });


    useEffect(() => {
        if (location.state?.from) {
        setSelectionMode(true);
        }
    }, [location.state]);

    useEffect(() => {
        // Reset pilihan desa dan opsi jika kecamatan berubah
        setSelectedDesa('all');
        setDesaOptions([]);

        if (selectedKecamatan !== 'all') {
            // Ambil data desa untuk kecamatan yang dipilih
            fetchDesa(selectedKecamatan).then(setDesaOptions);
        }
    }, [selectedKecamatan]);

  const filteredAndSortedData = useMemo(() => {
    let data = [...pplList];

    if (posisiFilter !== "Semua") {
            data = data.filter(ppl => ppl.posisi === posisiFilter);
        }
        
    // ✔️ Filter berdasarkan Kecamatan
    if (selectedKecamatan !== 'all') {
        data = data.filter(ppl => String(ppl.kecamatanId) === selectedKecamatan);
    }

    // ✔️ Filter berdasarkan Desa
    if (selectedDesa !== 'all') {
        data = data.filter(ppl => String(ppl.desaId) === selectedDesa);
    }

    // ✔️ PERBAIKAN UTAMA: Filter berdasarkan posisi HANYA jika dalam mode pemilihan
    if (selectionMode) {
        data = data.filter(ppl => {
            if (sourceTahap === 'listing' || sourceTahap === 'pencacahan') {
                return ppl.posisi === 'Pendataan' || ppl.posisi === 'Pendataan/Pengolahan';
            }
            if (sourceTahap === 'pengolahan-analisis') {
                return ppl.posisi === 'Pengolahan' || ppl.posisi === 'Pendataan/Pengolahan';
            }
            return false; // Seharusnya tidak terjadi untuk tahap lain
        });
    }

    // Filter pencarian yang sudah ada, dijalankan setelah filter posisi
    if (searchTerm) {
        data = data.filter(ppl => 
            ppl.namaPPL.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ppl.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    // Logika sorting tidak berubah
    if (sortConfig) {
        data.sort((a, b) => {
            let aValue, bValue;
            if (sortConfig.key === 'status') {
                aValue = a.totalKegiatan > 0 ? 1 : 0;
                bValue = b.totalKegiatan > 0 ? 1 : 0;
            } else {
                aValue = a[sortConfig.key as keyof PPLAdminData] as any;
                bValue = b[sortConfig.key as keyof PPLAdminData] as any;
            }
            
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return data;
}, [pplList, searchTerm, sortConfig, selectionMode, sourceTahap, posisiFilter, selectedKecamatan, selectedDesa]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredAndSortedData.slice(startIndex, endIndex);
  }, [filteredAndSortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);
  useHalamanAman(currentPage, totalPages, setCurrentPage);

  const handleSelectPPL = (pplId: string) => {
    if (!selectionMode || existingPplIds.includes(pplId)) return;
    setSelectedPPLs(prev => prev.includes(pplId) ? prev.filter(id => id !== pplId) : [...prev, pplId]);
  };
  
  const handleOpenInfoModal = (ppl: PPLAdminData) => {
        setSelectedPplForInfo(ppl);
        setIsInfoModalOpen(true);
    };

  const handleBulkAddToActivity = () => {
    const selectedPPLObjects: PPLMaster[] = pplList
        .filter(ppl => selectedPPLs.includes(ppl.id))
        .map(p => ({ 
            id: p.id, 
            namaPPL: p.namaPPL, 
            posisi: p.posisi,
            alamat: p.alamat, // <-- Tambahkan ini
            noTelepon: p.noTelepon // <-- Tambahkan ini
        })); 

    if (sourcePage === 'daftar-ppl' && kegiatanId) {
      setShowSuccessModal(true);
      setSuccessModalConfig({
        title: "PPL Berhasil Ditambahkan!",
        description: `${selectedPPLObjects.length} PPL yang dipilih akan ditambahkan ke tahap ${sourceTahap.replace(/-/g, ' ')}.`,
        actionLabel: "Kembali ke Edit Kegiatan",
        onAction: () => {
            navigate(`/edit-activity/${kegiatanId}`, { 
                state: { newPpls: selectedPPLObjects, tahap: sourceTahap, from: 'daftar-ppl' }
            });
            setSelectedPPLs([]);
            setSelectionMode(false);
          }
      });
    } else { // from 'input-kegiatan'
        setShowSuccessModal(true);
        setSuccessModalConfig({
            title: "PPL Berhasil Ditambahkan!",
            description: `${selectedPPLObjects.length} PPL yang dipilih telah ditambahkan ke form Input Kegiatan.`,
            actionLabel: "Ke Input Kegiatan",
            onAction: () => {
                navigate('/input-kegiatan', { 
                    state: { newPpls: selectedPPLObjects, tahap: sourceTahap, from: 'daftar-ppl' } 
                });
                setSelectedPPLs([]);
                setSelectionMode(false);
              }
        });
    }

  };
  
  const handleSort = (key: keyof PPLAdminData | 'status') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) return <ChevronUp className="w-4 h-4 text-border" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-300" /> : <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-300" />;
  };

  const handleOpenDetailModal = (ppl: PPLAdminData) => {
    setSelectedPplDetails(ppl);
    setIsDetailModalOpen(true);
  };

  /**
   * Sorotan dari pencarian global: `/daftar-ppl?sorot=<id mitra>`.
   *
   * Filter dikosongkan lebih dulu, kalau tidak mitra yang dicari bisa
   * tersembunyi oleh filter yang sedang aktif dan pengguna dibawa ke halaman
   * ini tanpa menemukan apa-apa. Halamannya ikut dipindah karena tabel ini
   * berpaginasi — mitra yang dicari sering tidak ada di halaman pertama.
   */
  const paramSorot = new URLSearchParams(location.search).get('sorot');
  const [pplDisorot, setPplDisorot] = useState<string | null>(null);
  const sorotDitangani = useRef<string | null>(null);

  useEffect(() => {
    if (!paramSorot) { sorotDitangani.current = null; return; }
    if (sorotDitangani.current === paramSorot) return;
    sorotDitangani.current = paramSorot;
    setSearchTerm('');
    setPosisiFilter('Semua');
    setSelectedKecamatan(NILAI_SEMUA);
    setSelectedDesa(NILAI_SEMUA);
    setPplDisorot(paramSorot);
    window.setTimeout(() => setPplDisorot(null), 3500);
  }, [paramSorot]);

  // Pencarian barisnya dipisah ke efek kedua: pengosongan filter di atas baru
  // berlaku pada render berikutnya, jadi menghitung posisi baris di efek yang
  // sama akan memakai hasil penyaringan yang lama.
  useEffect(() => {
    if (!pplDisorot) return;
    const posisi = filteredAndSortedData.findIndex(p => p.id === pplDisorot);
    if (posisi < 0) return;
    setCurrentPage(Math.floor(posisi / rowsPerPage) + 1);
    window.setTimeout(() => {
      document.querySelector(`[data-ppl-id="${pplDisorot}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  }, [pplDisorot, filteredAndSortedData, rowsPerPage]);

  /** Ekspor daftar yang SEDANG tersaring, bukan seluruh data. */
  const eksporPpl = () => {
    const kolom: KolomEkspor<PPLAdminData>[] = [
      { header: "ID", nilai: p => p.id },
      { header: "Nama", nilai: p => p.namaPPL },
      { header: "Posisi", nilai: p => p.posisi },
      { header: "Kecamatan", nilai: p => p.namaKecamatan || "-" },
      { header: "Desa", nilai: p => p.namaDesa || "-" },
      { header: "Alamat", nilai: p => p.alamat || "-" },
      { header: "No. Telepon", nilai: p => p.noTelepon || "-" },
      { header: "Jumlah Kegiatan", nilai: p => p.totalKegiatan, rataKanan: true },
      { header: "Status", nilai: p => (p.totalKegiatan > 0 ? "Aktif" : "Non Aktif") },
    ];
    void exportToExcel({
      judul: "Daftar Mitra (PPL)",
      subJudul: `${filteredAndSortedData.length} mitra sesuai filter yang sedang aktif`,
      kolom,
      baris: filteredAndSortedData,
      namaFile: "daftar-ppl",
    });
  };

  const stats = useMemo(() => {
        const totalPPL = pplList.length;
        const activePPL = pplList.filter(p => p.totalKegiatan > 0).length;
        return {
            totalPPL,
            activePPL,
            inactivePPL: totalPPL - activePPL,
            persentaseAktif: totalPPL > 0 ? (activePPL / totalPPL) * 100 : 0,
        };
    }, [pplList]);

  const handleCancelSelection = () => {
    if (selectedPPLs.length > 0) {
        setShowCancelConfirmModal(true);
    } else {
      // Jika tidak ada PPL yang dipilih, langsung kembali dengan state
      const targetPath = sourcePage === 'input-kegiatan' ? '/input-kegiatan' : `/edit-activity/${kegiatanId}`;
      navigate(targetPath, {
          state: { from: 'batal-pilih', tahap: sourceTahap }
      });
    }
  };

  const confirmCancelSelection = () => {
    // Jika user mengonfirmasi, kembali dengan state
    const targetPath = sourcePage === 'input-kegiatan' ? '/input-kegiatan' : `/edit-activity/${kegiatanId}`;
    navigate(targetPath, {
        state: { from: 'batal-pilih', tahap: sourceTahap }
    });
    setShowCancelConfirmModal(false);
  };
  
  const selectedPPLObjects = useMemo(() => {
    return pplList.filter(ppl => selectedPPLs.includes(ppl.id));
  }, [selectedPPLs, pplList]);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Daftar PPL</h1>
            <p className="text-muted-foreground mt-1">{selectionMode ? "Pilih PPL untuk ditambahkan ke kegiatan" : "Lihat dan kelola daftar PPL"}</p>
            {selectionMode && selectedPPLs.length > 0 && (
                 <button onClick={() => setShowSelectedPPLsModal(true)} className="text-sm text-blue-600 dark:text-blue-300 mt-1 hover:underline">
                    {selectedPPLs.length} PPL dipilih
                </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectionMode && (
                <>
                    <Button variant="destructive" onClick={handleCancelSelection}>
                        <XCircle className="w-4 h-4 mr-2"/>
                        Batal Pilih
                    </Button>
                    <Button 
                        className="bg-blue-600 hover:bg-blue-700" 
                        onClick={handleBulkAddToActivity}
                        disabled={selectedPPLs.length === 0}
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Tambahkan PPL ({selectedPPLs.length})
                    </Button>
                </>
            )}
        </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-bps-blue-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Total PPL</p><p className="text-2xl font-bold text-foreground">{stats.totalPPL}</p></div><Users className="w-8 h-8 text-bps-blue-500" /></div></CardContent></Card>
            <Card className="border-l-4 border-l-bps-green-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">PPL Aktif</p><p className="text-2xl font-bold text-foreground">{stats.activePPL}</p></div><UserCheck className="w-8 h-8 text-bps-green-500" /></div></CardContent></Card>
            <Card className="border-l-4 border-l-gray-400"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">PPL Non Aktif</p><p className="text-2xl font-bold text-foreground">{stats.inactivePPL}</p></div><UserX className="w-8 h-8 text-muted-foreground" /></div></CardContent></Card>
            <Card className="border-l-4 border-l-bps-orange-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Persentase Aktif</p><p className="text-2xl font-bold text-foreground">{stats.persentaseAktif.toFixed(1)}%</p></div><Activity className="w-8 h-8 text-bps-orange-500" /></div></CardContent></Card>
        </div>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Daftar PPL</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {/* Menyaring KOLOM KEGIATAN, bukan daftar mitranya: mitra yang
                    tidak kebagian kegiatan pada periode ini tetap tampil dengan
                    0, karena justru merekalah yang dicari saat membagi beban. */}
                <Select value={periodeFilter} onValueChange={v => setPeriodeFilter(v as KunciPeriode)}>
                    <SelectTrigger className="w-full sm:w-[170px]"><SelectValue placeholder="Periode..." /></SelectTrigger>
                    <SelectPortal>
                    <SelectContent position="popper" className="max-h-56">
                        {URUTAN_PERIODE.map(k => (
                            <SelectItem key={k} value={k}>{LABEL_PERIODE[k]}</SelectItem>
                        ))}
                    </SelectContent>
                    </SelectPortal>
                </Select>

                <Select value={posisiFilter} onValueChange={setPosisiFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter Posisi..." /></SelectTrigger>
                    <SelectPortal>
                    <SelectContent position="popper" className="max-h-56">
                        <SelectItem value="Semua">Semua Posisi</SelectItem>
                        <SelectItem value="Pendataan">Pendataan</SelectItem>
                        <SelectItem value="Pengolahan">Pengolahan</SelectItem>
                        <SelectItem value="Pendataan/Pengolahan">Pendataan/Pengolahan</SelectItem>
                    </SelectContent>
                    </SelectPortal>
                </Select>

                {/* Bisa dicari, bukan digulir: daftar desa di kabupaten ini
                    terlalu panjang untuk ditemukan dengan menggulir. */}
                <PilihCari
                    className="w-full sm:w-[180px]"
                    nilai={selectedKecamatan}
                    onUbah={setSelectedKecamatan}
                    opsi={kecamatanList.map(kec => ({ nilai: String(kec.id), label: kec.nama }))}
                    labelSemua="Semua Kecamatan"
                    placeholder="Filter Kecamatan..."
                    cariPlaceholder="Cari kecamatan..."
                    pesanKosong="Kecamatan tidak ditemukan."
                />

                <PilihCari
                    className="w-full sm:w-[180px]"
                    nilai={selectedDesa}
                    onUbah={setSelectedDesa}
                    opsi={desaOptions.map(desa => ({ nilai: String(desa.id), label: desa.nama }))}
                    labelSemua="Semua Desa"
                    placeholder="Filter Desa..."
                    cariPlaceholder="Cari desa..."
                    pesanKosong="Desa tidak ditemukan."
                    disabled={selectedKecamatan === NILAI_SEMUA}
                />

                <div className="relative sm:w-auto flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input type="text" placeholder="Cari ID/Nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                </div>
            </div>
        </div>
    </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
    <TableHeader>
        <TableRow>
            {selectionMode && <TableHead className="w-[50px]"></TableHead>}
            {/* ✔️ No. dibuat lebih kecil */}
            <TableHead className="w-[50px]">No</TableHead> 
            <TableHead className="w-[120px]">
                <div onClick={() => handleSort('id')} className="flex items-center gap-1 cursor-pointer">ID{getSortIcon('id')}</div>
            </TableHead>
            {/* ✔️ Kolom Nama dibiarkan fleksibel */}
            <TableHead> 
                <div onClick={() => handleSort('namaPPL')} className="flex items-center gap-1 cursor-pointer">Nama{getSortIcon('namaPPL')}</div>
            </TableHead>
            <TableHead className="w-[200px]">
                <div onClick={() => handleSort('posisi')} className="flex items-center gap-1 cursor-pointer">Posisi{getSortIcon('posisi')}</div>
            </TableHead>
            {/* ✔️ Kolom berikut dibuat terpusat (center-aligned) */}
            <TableHead className="w-[140px] text-center">
                <div onClick={() => handleSort('totalKegiatan')} className="flex items-center justify-center gap-1 cursor-pointer">Kegiatan{getSortIcon('totalKegiatan')}</div>
            </TableHead>
            <TableHead className="w-[160px] text-center">Informasi Detail</TableHead>
            <TableHead className="w-[120px] text-center">
                <div onClick={() => handleSort('status')} className="flex items-center justify-center gap-1 cursor-pointer">Status{getSortIcon('status')}</div>
            </TableHead>
        </TableRow>
    </TableHeader>
    <TableBody>
        {isLoading ? ( <TableRow><TableCell colSpan={8} className="text-center">Memuat...</TableCell></TableRow> ) : 
        paginatedData.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Tidak ada data PPL</TableCell></TableRow>
        ) : (
            paginatedData.map((ppl, index) => {
                const isActive = ppl.totalKegiatan > 0;
                const isAlreadyAdded = existingPplIds.includes(ppl.id);
                const isSelected = selectedPPLs.includes(ppl.id);
                return (
                    <TableRow 
                        key={ppl.id} 
                        data-state={isSelected && "selected"}
                        className={cn(
                            isAlreadyAdded && "bg-muted text-muted-foreground cursor-not-allowed",
                            selectionMode && !isAlreadyAdded && "cursor-pointer",
                            "scroll-mt-24",
                            pplDisorot === ppl.id && "ring-2 ring-inset ring-blue-400 dark:ring-blue-500"
                        )}
                        data-ppl-id={ppl.id}
                        onClick={() => handleSelectPPL(ppl.id)}
                    >
                        {selectionMode && (
                            <TableCell>
                                {/* Mitra yang SUDAH ada di kegiatan ini tampil tercentang
                                    dan terkunci. Sebelumnya kotaknya kosong dan mati tanpa
                                    keterangan, sehingga terlihat seperti kegagalan memilih. */}
                                {isAlreadyAdded ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex">
                                                <Checkbox checked disabled />
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>PPL sudah ditambahkan ke kegiatan ini</TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <Checkbox checked={isSelected} />
                                )}
                            </TableCell>
                        )}
                        {/* ✔️ No. juga dibuat terpusat */}
                        <TableCell className="text-center">{(currentPage - 1) * rowsPerPage + index + 1}</TableCell>
                        <TableCell className="font-mono">{ppl.id}</TableCell>
                        <TableCell className="font-medium">{ppl.namaPPL}</TableCell>
                        <TableCell>
                <Badge className={cn("font-semibold", GAYA_POSISI_PPL[ppl.posisi] ?? NADA_STATUS.netral)}>
                    {ppl.posisi}
                </Badge>
            </TableCell>
                        {/* ✔️ Kolom berikut dibuat terpusat (center-aligned) */}
                        <TableCell className="text-center">
                            <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-300" onClick={(e) => { e.stopPropagation(); handleOpenDetailModal(ppl); }}>
                                {ppl.totalKegiatan} Kegiatan
                            </Button>
                        </TableCell>
                        <TableCell className="text-center">
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenInfoModal(ppl); }}>
                                Lihat Info
                            </Button>
                        </TableCell>
                        <TableCell className="text-center">
                            <Badge variant="default" className={isActive ? "bg-bps-green-600" : "bg-muted text-muted-foreground"}>
                                {isActive ? "Aktif" : "Non Aktif"}
                            </Badge>
                        </TableCell>
                    </TableRow>
                );
            })
        )}
    </TableBody>
</Table>
            </div>
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">
                        Menampilkan <strong>{paginatedData.length}</strong> dari <strong>{filteredAndSortedData.length}</strong> data
                    </div>
                    {/* Hanya di luar mode pemilihan: saat sedang memilih mitra untuk
                        sebuah kegiatan, mengunduh daftar bukan yang dicari pengguna
                        dan tombolnya justru mengalihkan perhatian. */}
                    {!selectionMode && (
                        <Button variant="outline" size="sm" onClick={eksporPpl}
                            disabled={filteredAndSortedData.length === 0}>
                            Export Excel
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Baris per halaman:</span>
                        <Select value={String(rowsPerPage)} onValueChange={value => { setRowsPerPage(Number(value)); setCurrentPage(1); }}>
                            <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[10, 25, 50, 100].map(size => (
                                    <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <Button variant="outline" size="sm" onClick={() => { if(currentPage > 1) setCurrentPage(currentPage - 1); }} disabled={currentPage === 1}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                            </PaginationItem>
                            <PaginationItem className="text-sm font-medium px-3">
                                {currentPage} / {totalPages}
                            </PaginationItem>
                            <PaginationItem>
                                <Button variant="outline" size="sm" onClick={() => { if(currentPage < totalPages) setCurrentPage(currentPage + 1); }} disabled={currentPage === totalPages}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
          </CardContent>
        </Card>
        <SuccessModal 
            isOpen={showSuccessModal} 
            onClose={() => setShowSuccessModal(false)} 
            onAction={() => { setShowSuccessModal(false); successModalConfig.onAction(); }} 
            title={successModalConfig.title} 
            description={successModalConfig.description} 
            actionLabel={successModalConfig.actionLabel}
            aksiKedua={{
                label: "Batal Tambah PPL",
                // Belum ada yang tersimpan: mitra pilihan baru dikirim ke form
                // saat pengalihan. Jadi membatalkan cukup menutup dialog, dan
                // pilihannya sengaja DIPERTAHANKAN supaya bisa disesuaikan.
                onClick: () => setShowSuccessModal(false),
            }} 
        />
        <ActivityDetailModal 
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            pplData={selectedPplDetails}
        />
        <Dialog open={showSelectedPPLsModal} onOpenChange={setShowSelectedPPLsModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>PPL yang Dipilih ({selectedPPLObjects.length})</DialogTitle>
                    <DialogDescription>Berikut adalah daftar PPL yang telah Anda pilih.</DialogDescription>
                </DialogHeader>
                <div className="mt-4 max-h-80 overflow-y-auto">
                    {selectedPPLObjects.length > 0 ? (
                        <ul className="space-y-2">
                            {selectedPPLObjects.map((ppl) => (
                                <li key={ppl.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                    <span>{ppl.namaPPL}</span>
                                    <span className="text-xs text-muted-foreground">ID: {ppl.id}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Belum ada PPL yang dipilih.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
        <ConfirmationModal
            isOpen={showCancelConfirmModal}
            onClose={() => setShowCancelConfirmModal(false)}
            onConfirm={confirmCancelSelection}
            title="Batalkan Pilihan?"
            description={`Anda akan menghapus ${selectedPPLs.length} PPL yang telah dipilih. Lanjutkan?`}
            confirmLabel="Ya, Batalkan"
            variant="danger"
        />
        <PPLInfoModal 
            isOpen={isInfoModalOpen}
            onClose={() => setIsInfoModalOpen(false)}
            pplData={selectedPplForInfo}
        />
      </div>
    </Layout>
  );
}