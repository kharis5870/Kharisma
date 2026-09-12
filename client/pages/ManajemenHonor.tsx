// client/pages/ManajemenHonor.tsx

import { useState, useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem 
} from "@/components/ui/pagination";
import { AlertTriangle, Edit, Save, X, DollarSign, TrendingUp, Users, Search, ChevronUp, ChevronDown, List, ChevronLeft, ChevronRight, Loader2, FileDown, Sheet } from "lucide-react";
import { exportToPdf, exportToExcel, type KolomEkspor } from "@/lib/exportUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PPLHonorData } from "@shared/api";
import { cn } from "@/lib/utils";
import { batasPeriode, bulanDilalui } from "@shared/pembebananHonor";
import { useAuth } from "@/contexts/AuthContext";
import AlertModal from "@/components/AlertModal";
import SuccessModal from "@/components/SuccessModal";
import { apiClient } from "@/lib/apiClient";
import { DateRangePicker, type RentangTanggal } from "@/components/ui/date-range-picker";
import { labelRentang } from "@/lib/honorPeriode";
import {
  format, startOfMonth, endOfMonth, addMonths,
  startOfQuarter, endOfQuarter, startOfYear, endOfYear,
} from "date-fns";
import { useHalamanAman } from "@/hooks/useHalamanAman";

const FORMAT_TANGGAL = "yyyy-MM-dd";

/** Rentang default saat halaman dibuka: bulan berjalan. */
const rentangBulanIni = (): RentangTanggal => ({
    mulai: format(startOfMonth(new Date()), FORMAT_TANGGAL),
    selesai: format(endOfMonth(new Date()), FORMAT_TANGGAL),
});

const presetRentang: { label: string; hitung: () => RentangTanggal }[] = [
    { label: "Bulan Ini", hitung: rentangBulanIni },
    // "Bulan Depan", bukan "Bulan Lalu": kegiatan biasanya diinput di akhir
    // bulan untuk dijalankan awal bulan berikutnya, jadi yang perlu dipantau
    // sebelum menambah alokasi adalah beban honor bulan DEPAN.
    {
        label: "Bulan Depan",
        hitung: () => {
            const depan = addMonths(new Date(), 1);
            return {
                mulai: format(startOfMonth(depan), FORMAT_TANGGAL),
                selesai: format(endOfMonth(depan), FORMAT_TANGGAL),
            };
        },
    },
    {
        label: "Triwulan Ini",
        hitung: () => ({
            mulai: format(startOfQuarter(new Date()), FORMAT_TANGGAL),
            selesai: format(endOfQuarter(new Date()), FORMAT_TANGGAL),
        }),
    },
    {
        label: "Tahun Ini",
        hitung: () => ({
            mulai: format(startOfYear(new Date()), FORMAT_TANGGAL),
            selesai: format(endOfYear(new Date()), FORMAT_TANGGAL),
        }),
    },
];

// Rekap honor sekarang berbasis rentang tanggal: sebuah kegiatan ikut terhitung
// bila rentang honornya beririsan dengan rentang filter.
const fetchHonorData = async (mulai: string, selesai: string): Promise<PPLHonorData[]> => {
    return apiClient.get<PPLHonorData[]>(`/honor?tanggalMulai=${mulai}&tanggalSelesai=${selesai}`);
}

/**
 * HONOR_LIMIT berlaku per PPL per BULAN, sedangkan rentang filter bisa mencakup
 * beberapa bulan. Jadi status "melebihi batas" harus dinilai dari bulan
 * pembebanan tertinggi, bukan dari total rentang — kalau tidak, memfilter satu
 * triwulan akan menandai hampir semua mitra sebagai melanggar.
 */
const honorBulananTertinggi = (ppl: PPLHonorData): number => {
    const perBulan = Object.values(ppl.honorPerBulanPembebanan ?? {});
    if (perBulan.length === 0) return ppl.honorBulanIni;
    return Math.max(...perBulan);
};

const fetchHonorLimit = async (): Promise<number> => {
    const data = await apiClient.get<{ value: string | number }>('/settings/HONOR_LIMIT');
    return Number(data.value);
}

const updateHonorLimit = async (newLimit: number): Promise<any> => {
    return apiClient.put('/settings/HONOR_LIMIT', { value: newLimit });
}

const ActivityDetailModal = ({ isOpen, onClose, pplData, rentang }: { isOpen: boolean, onClose: () => void, pplData: PPLHonorData | null, rentang: RentangTanggal }) => {
    if (!pplData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Detail Kegiatan: {pplData.nama}</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar kegiatan yang honornya jatuh pada rentang {labelRentang(rentang.mulai, rentang.selesai)}.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 max-h-80 overflow-y-auto">
                    {pplData.kegiatanNames && pplData.kegiatanNames.length > 0 ? (
                        <ul className="space-y-2">
                            {pplData.kegiatanNames.map((kegiatan, index) => (
                                <li key={index} className="flex items-start gap-3 p-3 bg-muted rounded-md">
                                    <List className="w-4 h-4 text-bps-blue-500 mt-1 flex-shrink-0" />
                                    {/* Nama kegiatan sekarang akan menampilkan (Listing), (Pencacahan), dll. */}
                                    <span>{kegiatan}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Tidak ada kegiatan tercatat untuk bulan ini.</p>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <Button variant="outline" onClick={onClose}>Tutup</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function ManajemenHonor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [globalSettings, setGlobalSettings] = useState({ batasHonorBulananGlobal: 3000000 });
  const [rentang, setRentang] = useState<RentangTanggal>(rentangBulanIni);
  const [isEditingGlobalLimit, setIsEditingGlobalLimit] = useState(false);
  const [tempGlobalLimit, setTempGlobalLimit] = useState(globalSettings.batasHonorBulananGlobal);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: "", message: "" });
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: "", message: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPplDetails, setSelectedPplDetails] = useState<PPLHonorData | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: pplData = [], isLoading } = useQuery({
      queryKey: ['honor', rentang.mulai, rentang.selesai],
      queryFn: () => fetchHonorData(rentang.mulai!, rentang.selesai!),
      // Rentang yang belum lengkap (baru satu ujung dipilih) tidak bisa difilter.
      enabled: Boolean(rentang.mulai && rentang.selesai),
  });

  /**
   * Batas untuk SELURUH rentang yang sedang difilter: batas bulanan x jumlah
   * bulan yang tercakup.
   *
   * Angka ini HANYA konteks pembacaan gap. Status "Melebihi Batas" tetap
   * dinilai dari bulan pembebanan TERTINGGI, bukan dari total rentang — kalau
   * totalnya yang dibandingkan, mitra yang menerima 4 juta di Januari saja
   * (batas 3 juta/bulan) tidak akan tertandai pada filter triwulan, karena
   * 4 juta masih di bawah 9 juta. Pelanggaran nyata jadi lolos.
   */
  const jumlahBulanRentang = useMemo(
    () => Math.max(1, bulanDilalui(rentang.mulai, rentang.selesai).length),
    [rentang.mulai, rentang.selesai]);
  const batasRentang = useMemo(
    () => batasPeriode(globalSettings.batasHonorBulananGlobal, rentang.mulai, rentang.selesai),
    [globalSettings.batasHonorBulananGlobal, rentang.mulai, rentang.selesai]);

  const { data: honorLimitData, isLoading: isLoadingHonorLimit } = useQuery({
    queryKey: ['settings', 'HONOR_LIMIT'],
    queryFn: fetchHonorLimit,
  });

  useEffect(() => {
    if (honorLimitData !== undefined) {
      setGlobalSettings(prev => ({ ...prev, batasHonorBulananGlobal: honorLimitData }));
      setTempGlobalLimit(honorLimitData);
    }
  }, [honorLimitData]);

  const updateMutation = useMutation({
    mutationFn: updateHonorLimit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'HONOR_LIMIT'] });
      setIsEditingGlobalLimit(false);
      setSuccessModal({isOpen: true, title: "Sukses", message: "Batas honor berhasil diperbarui."});
    },
    onError: (error) => {
        setErrorModal({isOpen: true, title: "Gagal", message: `Gagal memperbarui batas honor: ${error.message}`});
    }
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronUp className="w-4 h-4 text-border" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-300" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-300" />;
  };

  const filteredAndSortedData = useMemo(() => {
    let sortedData = [...pplData]
        .filter(ppl => ppl.nama.toLowerCase().includes(searchTerm.toLowerCase()));

    if (sortConfig !== null) {
      sortedData.sort((a, b) => {
        const { key, direction } = sortConfig;
        let aValue, bValue;

        switch (key) {
          case 'nama':
            aValue = a.nama.toLowerCase();
            bValue = b.nama.toLowerCase();
            break;
          case 'honorBulanIni':
            aValue = a.honorBulanIni;
            bValue = b.honorBulanIni;
            break;
          case 'activitiesCount':
            aValue = a.activitiesCount;
            bValue = b.activitiesCount;
            break;
          case 'sisaPagu':
            aValue = a.honorBulanIni;
            bValue = b.honorBulanIni;
            break;
          case 'selisih':
            aValue = honorBulananTertinggi(a) - globalSettings.batasHonorBulananGlobal;
            bValue = honorBulananTertinggi(b) - globalSettings.batasHonorBulananGlobal;
            break;
          case 'status':
            aValue = honorBulananTertinggi(a) > globalSettings.batasHonorBulananGlobal ? 1 : 0;
            bValue = honorBulananTertinggi(b) > globalSettings.batasHonorBulananGlobal ? 1 : 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortedData;
  }, [pplData, searchTerm, sortConfig, globalSettings.batasHonorBulananGlobal]);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredAndSortedData.slice(startIndex, endIndex);
  }, [filteredAndSortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);
  useHalamanAman(currentPage, totalPages, setCurrentPage);

  const stats = useMemo(() => {
    const totalHonor = pplData.reduce((sum, p) => sum + p.honorBulanIni, 0);
    return {
        totalPPL: pplData.length,
        pplOverLimit: pplData.filter(p => honorBulananTertinggi(p) > globalSettings.batasHonorBulananGlobal).length,
        totalHonorBulanIni: totalHonor,
        rataRataHonorBulanan: pplData.length > 0 ? Math.round(totalHonor / pplData.length) : 0
    };
  }, [pplData, globalSettings.batasHonorBulananGlobal]);
  
  const handleOpenDetailModal = (ppl: PPLHonorData) => {
    setSelectedPplDetails(ppl);
    setIsDetailModalOpen(true);
  };

  // Yang diekspor adalah SELURUH hasil filter, bukan hanya halaman yang tampil.
  const kolomEkspor: KolomEkspor<PPLHonorData>[] = useMemo(() => [
    { header: 'Nama PPL', nilai: p => p.nama, lebar: '*' },
    { header: 'Honor Periode Ini', nilai: p => p.honorBulanIni, lebar: 'auto', rataKanan: true },
    { header: 'Jumlah Kegiatan', nilai: p => p.activitiesCount, lebar: 'auto', rataKanan: true },
    { header: 'Puncak Bulanan', nilai: p => honorBulananTertinggi(p), lebar: 'auto', rataKanan: true },
    {
      header: 'Selisih vs Batas',
      nilai: p => honorBulananTertinggi(p) - globalSettings.batasHonorBulananGlobal,
      lebar: 'auto',
      rataKanan: true,
    },
    {
      header: 'Status',
      nilai: p => honorBulananTertinggi(p) > globalSettings.batasHonorBulananGlobal ? 'Melebihi Batas' : 'Normal',
      lebar: 'auto',
    },
    { header: 'Kegiatan', nilai: p => p.kegiatanNames.join('; '), lebar: '*' },
  ], [globalSettings.batasHonorBulananGlobal]);

  const konteksEkspor = () => ({
    judul: 'Rekap Honor Mitra',
    subJudul: `Periode ${labelRentang(rentang.mulai, rentang.selesai)} · Batas honor Rp ${globalSettings.batasHonorBulananGlobal.toLocaleString('id-ID')} per PPL per bulan pembebanan`,
    kolom: kolomEkspor,
    baris: filteredAndSortedData,
    namaFile: 'rekap-honor',
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div><h1 className="text-3xl font-bold text-foreground">Manajemen Honor PPL</h1><p className="text-muted-foreground mt-1">Kelola akumulasi honor bulanan dengan batas honor untuk semua PPL</p></div>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium whitespace-nowrap">Periode:</Label>
                    <div className="w-72">
                        <DateRangePicker value={rentang} onChange={setRentang} />
                    </div>
                </div>
                <div className="flex flex-wrap gap-1">
                    {presetRentang.map(preset => (
                        <Button
                            key={preset.label}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => { setRentang(preset.hitung()); setCurrentPage(1); }}
                        >
                            {preset.label}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Batas Honor:</Label>
              {isEditingGlobalLimit ? (
                <div className="flex items-center gap-2">
                  <Input type="number" value={tempGlobalLimit} onChange={e => setTempGlobalLimit(Number(e.target.value))} className="w-36 h-8" placeholder="Honor limit" disabled={updateMutation.isPending}/>
                  <Button size="sm" onClick={() => updateMutation.mutate(tempGlobalLimit)} className="h-8 w-8 p-0" disabled={updateMutation.isPending || isLoadingHonorLimit}>
                    {updateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingGlobalLimit(false)} className="h-8 w-8 p-0" disabled={updateMutation.isPending || isLoadingHonorLimit}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-bps-blue-50 text-bps-blue-700 font-semibold">Rp {globalSettings.batasHonorBulananGlobal.toLocaleString('id-ID')}</Badge>
                  {(user?.role === 'admin' || user?.role === 'supervisor') && (
                    <Button size="sm" variant="outline" onClick={() => { setTempGlobalLimit(globalSettings.batasHonorBulananGlobal); setIsEditingGlobalLimit(true); }} className="h-6 w-6 p-0" disabled={isLoadingHonorLimit}><Edit className="w-3 h-3" /></Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-bps-blue-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Total PPL</p><p className="text-2xl font-bold text-foreground">{stats.totalPPL}</p></div><Users className="w-8 h-8 text-bps-blue-500" /></div></CardContent></Card>
          <Card className="border-l-4 border-l-red-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">PPL Melebihi Batas</p><p className="text-2xl font-bold text-foreground">{stats.pplOverLimit}</p></div><AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" /></div></CardContent></Card>
          <Card className="border-l-4 border-l-bps-green-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Total Honor Periode Ini</p><p className="text-2xl font-bold text-foreground">Rp {stats.totalHonorBulanIni.toLocaleString('id-ID')}</p></div><DollarSign className="w-8 h-8 text-bps-green-500" /></div></CardContent></Card>
          <Card className="border-l-4 border-l-bps-orange-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Rata-rata Honor per PPL</p><p className="text-2xl font-bold text-foreground">Rp {stats.rataRataHonorBulanan.toLocaleString('id-ID')}</p></div><TrendingUp className="w-8 h-8 text-bps-orange-500" /></div></CardContent></Card>
        </div>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Akumulasi Honor PPL — {labelRentang(rentang.mulai, rentang.selesai)}</CardTitle>
                <div className="text-sm text-muted-foreground mt-2">
                  Batas Honor: <strong>Rp {globalSettings.batasHonorBulananGlobal.toLocaleString('id-ID')}</strong> per PPL per bulan pembebanan
                  {jumlahBulanRentang > 1 && (
                    <> — rentang ini mencakup <strong>{jumlahBulanRentang} bulan</strong>, jadi pagu totalnya <strong>Rp {batasRentang.toLocaleString('id-ID')}</strong>.</>
                  )}
                </div>
                {jumlahBulanRentang > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Status tetap dinilai dari bulan pembebanan tertinggi, bukan dari total rentang —
                    honor yang menumpuk di satu bulan itulah yang melanggar SBML.
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="sm:w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input type="text" placeholder="Cari nama PPL..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={filteredAndSortedData.length === 0} onClick={() => exportToPdf(konteksEkspor())}>
                    <FileDown className="w-4 h-4 mr-1" />PDF
                  </Button>
                  <Button variant="outline" size="sm" disabled={filteredAndSortedData.length === 0} onClick={() => exportToExcel(konteksEkspor())}>
                    <Sheet className="w-4 h-4 mr-1" />Excel
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/4"><button onClick={() => handleSort('nama')} className="flex items-center gap-1 hover:bg-muted/50 p-1 rounded -ml-1">Nama PPL{getSortIcon('nama')}</button></TableHead>
                    <TableHead className="w-1/5"><button onClick={() => handleSort('honorBulanIni')} className="flex items-center gap-1 hover:bg-muted/50 p-1 rounded -ml-1">Honor Periode Ini{getSortIcon('honorBulanIni')}</button></TableHead>
                    <TableHead className="w-1/5"><button onClick={() => handleSort('activitiesCount')} className="flex items-center gap-1 hover:bg-muted/50 p-1 rounded -ml-1">Jumlah Kegiatan{getSortIcon('activitiesCount')}</button></TableHead>
                    <TableHead className="w-1/5"><button onClick={() => handleSort('selisih')} className="flex items-center gap-1 hover:bg-muted/50 p-1 rounded -ml-1">Puncak Bulanan vs Batas{getSortIcon('selisih')}</button></TableHead>
                    {/* Hanya muncul saat rentangnya memang lebih dari satu bulan.
                        Pada filter bulanan kolom ini akan mengulang isi kolom
                        "Honor Periode Ini" dibanding batas yang sama. */}
                    {jumlahBulanRentang > 1 && (
                      <TableHead className="w-1/5"><button onClick={() => handleSort('sisaPagu')} className="flex items-center gap-1 hover:bg-muted/50 p-1 rounded -ml-1">Sisa Pagu Periode{getSortIcon('sisaPagu')}</button></TableHead>
                    )}
                    <TableHead className="w-1/6"><button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:bg-muted/50 p-1 rounded -ml-1">Status{getSortIcon('status')}</button></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={jumlahBulanRentang > 1 ? 6 : 5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow><TableCell colSpan={jumlahBulanRentang > 1 ? 6 : 5} className="text-center py-8 text-muted-foreground">{searchTerm ? `Tidak ada PPL yang cocok dengan "${searchTerm}"` : 'Tidak ada data honor untuk periode ini'}</TableCell></TableRow>
                  ) : (
                    paginatedData.map((ppl) => {
                      const puncakBulanan = honorBulananTertinggi(ppl);
                      const overLimit = puncakBulanan > globalSettings.batasHonorBulananGlobal;
                      const difference = puncakBulanan - globalSettings.batasHonorBulananGlobal;
                      const sisaPagu = batasRentang - ppl.honorBulanIni;
                      return (
                        <TableRow key={ppl.id} className={overLimit ? "bg-red-50 dark:bg-red-950/40" : ""}>
                          <TableCell className="font-medium truncate">{ppl.nama}</TableCell>
                          <TableCell className={cn("font-semibold", overLimit && "text-red-600 dark:text-red-300")}>Rp {ppl.honorBulanIni.toLocaleString('id-ID')}</TableCell>
                          <TableCell>
                            <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-300" onClick={() => handleOpenDetailModal(ppl)}>
                                {ppl.activitiesCount} Kegiatan
                            </Button>
                          </TableCell>
                          <TableCell>{difference === 0 ? <span className="text-muted-foreground">Tepat batas</span> : difference > 0 ? <span className="text-red-600 dark:text-red-300 font-semibold">+Rp {difference.toLocaleString('id-ID')}</span> : <span className="text-green-600 dark:text-green-300">-Rp {Math.abs(difference).toLocaleString('id-ID')}</span>}</TableCell>
                          {jumlahBulanRentang > 1 && (
                            <TableCell>
                              {/* Gap terhadap pagu seluruh rentang. Sengaja TIDAK
                                  mewarnai baris atau mengubah status: pagu periode
                                  bukan aturan SBML, hanya bantuan membaca. */}
                              <span className={cn(sisaPagu < 0 && "text-red-600 dark:text-red-300 font-semibold")}>
                                {sisaPagu < 0 ? '+' : ''}Rp {Math.abs(sisaPagu).toLocaleString('id-ID')}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                dari Rp {batasRentang.toLocaleString('id-ID')}
                              </span>
                            </TableCell>
                          )}
                          <TableCell>{overLimit ? <Badge variant="destructive">Melebihi Batas</Badge> : <Badge className="bg-green-600">Normal</Badge>}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                    Menampilkan <strong>{paginatedData.length}</strong> dari <strong>{filteredAndSortedData.length}</strong> data
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
                                {currentPage} / {totalPages || 1}
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
      </div>

      <ActivityDetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        pplData={selectedPplDetails}
        rentang={rentang}
      />
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, title: "", message: ""})}
        title={successModal.title}
        description={successModal.message}
        onAction={() => setSuccessModal({ isOpen: false, title: "", message: ""})}
      />
      <AlertModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: "", message: "" })}
        title={errorModal.title}
        description={errorModal.message}
      />
    </Layout>
  );
}