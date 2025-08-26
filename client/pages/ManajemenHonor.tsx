// client/pages/ManajemenHonor.tsx

import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, Edit, Save, X, DollarSign, TrendingUp, Users, Search, ChevronUp, ChevronDown, List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PPLHonorData } from "@shared/api";
import { cn } from "@/lib/utils";

const months = [ "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des" ];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i); // Buat daftar 5 tahun terakhir

const getCurrentMonth = () => new Date().getMonth();

const fetchHonorData = async (bulan: number, tahun: number): Promise<PPLHonorData[]> => {
    const res = await fetch(`/api/honor?bulan=${bulan}&tahun=${tahun}`);
    if (!res.ok) throw new Error("Gagal memuat data honor");
    return res.json();
}

// Komponen Modal Detail Kegiatan (Tidak ada perubahan)
const ActivityDetailModal = ({ isOpen, onClose, pplData, selectedMonth, selectedYear }: { isOpen: boolean, onClose: () => void, pplData: PPLHonorData | null, selectedMonth: number, selectedYear: number }) => {
    if (!pplData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Detail Kegiatan: {pplData.nama}</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar kegiatan yang diikuti pada bulan {months[selectedMonth]} {selectedYear}.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 max-h-80 overflow-y-auto">
                    {pplData.kegiatanNames && pplData.kegiatanNames.length > 0 ? (
                        <ul className="space-y-2">
                            {pplData.kegiatanNames.map((kegiatan, index) => (
                                <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                                    <List className="w-4 h-4 text-bps-blue-500 mt-1 flex-shrink-0" />
                                    <span>{kegiatan}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-center py-4">Tidak ada kegiatan tercatat untuk bulan ini.</p>
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
  const [globalSettings, setGlobalSettings] = useState({ 
      batasHonorBulananGlobal: 3000000, 
      selectedMonth: getCurrentMonth(),
      selectedYear: currentYear // <-- Tambahkan state untuk tahun
  });
  const [isEditingGlobalLimit, setIsEditingGlobalLimit] = useState(false);
  const [tempGlobalLimit, setTempGlobalLimit] = useState(globalSettings.batasHonorBulananGlobal);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPplDetails, setSelectedPplDetails] = useState<PPLHonorData | null>(null);

  const { data: pplData = [], isLoading } = useQuery({
      queryKey: ['honor', globalSettings.selectedMonth, globalSettings.selectedYear], // <-- Tambahkan tahun ke queryKey
      queryFn: () => fetchHonorData(globalSettings.selectedMonth, globalSettings.selectedYear),
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
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />;
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
          case 'selisih':
            aValue = a.honorBulanIni - globalSettings.batasHonorBulananGlobal;
            bValue = b.honorBulanIni - globalSettings.batasHonorBulananGlobal;
            break;
          case 'status':
            aValue = a.honorBulanIni > globalSettings.batasHonorBulananGlobal ? 1 : 0;
            bValue = b.honorBulanIni > globalSettings.batasHonorBulananGlobal ? 1 : 0;
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

  const stats = useMemo(() => {
    const totalHonor = pplData.reduce((sum, p) => sum + p.honorBulanIni, 0);
    return {
        totalPPL: pplData.length,
        pplOverLimit: pplData.filter(p => p.honorBulanIni > globalSettings.batasHonorBulananGlobal).length,
        totalHonorBulanIni: totalHonor,
        rataRataHonorBulanan: pplData.length > 0 ? Math.round(totalHonor / pplData.length) : 0
    };
  }, [pplData, globalSettings.batasHonorBulananGlobal]);
  
  const handleOpenDetailModal = (ppl: PPLHonorData) => {
    setSelectedPplDetails(ppl);
    setIsDetailModalOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div><h1 className="text-3xl font-bold text-gray-900">Manajemen Honor PPL</h1><p className="text-gray-600 mt-1">Kelola akumulasi honor bulanan dengan batas global untuk semua PPL</p></div>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* PERBAIKAN: Pisahkan pemilihan bulan dan tahun */}
            <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Periode:</Label>
                <Select value={String(globalSettings.selectedMonth)} onValueChange={(val) => setGlobalSettings(p => ({...p, selectedMonth: Number(val)}))}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>{months.map((month, i) => (<SelectItem key={i} value={String(i)}>{month}</SelectItem>))}</SelectContent>
                </Select>
                <Select value={String(globalSettings.selectedYear)} onValueChange={(val) => setGlobalSettings(p => ({...p, selectedYear: Number(val)}))}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>{years.map((year) => (<SelectItem key={year} value={String(year)}>{year}</SelectItem>))}</SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2"><Label className="text-sm font-medium">Batas Global:</Label>{isEditingGlobalLimit ? (<div className="flex items-center gap-2"><Input type="number" value={tempGlobalLimit} onChange={e => setTempGlobalLimit(Number(e.target.value))} className="w-36 h-8" placeholder="Honor limit"/><Button size="sm" onClick={() => { setGlobalSettings(p => ({...p, batasHonorBulananGlobal: tempGlobalLimit})); setIsEditingGlobalLimit(false); }} className="h-8 w-8 p-0"><Save className="w-3 h-3" /></Button><Button size="sm" variant="outline" onClick={() => setIsEditingGlobalLimit(false)} className="h-8 w-8 p-0"><X className="w-3 h-3" /></Button></div>) : (<div className="flex items-center gap-2"><Badge variant="outline" className="bg-bps-blue-50 text-bps-blue-700 font-semibold">Rp {globalSettings.batasHonorBulananGlobal.toLocaleString('id-ID')}</Badge><Button size="sm" variant="outline" onClick={() => { setTempGlobalLimit(globalSettings.batasHonorBulananGlobal); setIsEditingGlobalLimit(true); }} className="h-6 w-6 p-0"><Edit className="w-3 h-3" /></Button></div>)}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-bps-blue-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total PPL</p><p className="text-2xl font-bold text-gray-900">{stats.totalPPL}</p></div><Users className="w-8 h-8 text-bps-blue-500" /></div></CardContent></Card>
          <Card className="border-l-4 border-l-red-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">PPL Melebihi Batas</p><p className="text-2xl font-bold text-gray-900">{stats.pplOverLimit}</p></div><AlertTriangle className="w-8 h-8 text-red-500" /></div></CardContent></Card>
          <Card className="border-l-4 border-l-bps-green-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total Honor Bulan Ini</p><p className="text-2xl font-bold text-gray-900">Rp {stats.totalHonorBulanIni.toLocaleString('id-ID')}</p></div><DollarSign className="w-8 h-8 text-bps-green-500" /></div></CardContent></Card>
          <Card className="border-l-4 border-l-bps-orange-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Rata-rata Honor Bulanan</p><p className="text-2xl font-bold text-gray-900">Rp {stats.rataRataHonorBulanan.toLocaleString('id-ID')}</p></div><TrendingUp className="w-8 h-8 text-bps-orange-500" /></div></CardContent></Card>
        </div>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Akumulasi Honor PPL - {months[globalSettings.selectedMonth]} {globalSettings.selectedYear}</CardTitle>
                <div className="text-sm text-gray-600 mt-2">Batas Global: <strong>Rp {globalSettings.batasHonorBulananGlobal.toLocaleString('id-ID')}</strong> per PPL per bulan</div>
              </div>
              <div className="sm:w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input type="text" placeholder="Cari nama PPL..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-40"><button onClick={() => handleSort('nama')} className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded -ml-1">Nama PPL{getSortIcon('nama')}</button></TableHead>
                    <TableHead className="min-w-40"><button onClick={() => handleSort('honorBulanIni')} className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded -ml-1">Honor Bulan Terpilih{getSortIcon('honorBulanIni')}</button></TableHead>
                    <TableHead className="min-w-48"><button onClick={() => handleSort('activitiesCount')} className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded -ml-1">Kegiatan Bulan Ini{getSortIcon('activitiesCount')}</button></TableHead>
                    <TableHead className="min-w-32"><button onClick={() => handleSort('selisih')} className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded -ml-1">Selisih dengan Batas{getSortIcon('selisih')}</button></TableHead>
                    <TableHead className="min-w-20"><button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded -ml-1">Status{getSortIcon('status')}</button></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">Memuat data...</TableCell></TableRow>
                  ) : filteredAndSortedData.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">{searchTerm ? `Tidak ada PPL yang cocok dengan "${searchTerm}"` : 'Tidak ada data PPL'}</TableCell></TableRow>
                  ) : (
                    filteredAndSortedData.map((ppl) => {
                      const overLimit = ppl.honorBulanIni > globalSettings.batasHonorBulananGlobal;
                      const difference = ppl.honorBulanIni - globalSettings.batasHonorBulananGlobal;
                      return (
                        <TableRow key={ppl.id} className={overLimit ? "bg-red-50" : ""}>
                          <TableCell className="font-medium">{ppl.nama}</TableCell>
                          <TableCell className={cn("font-semibold", overLimit && "text-red-600")}>Rp {ppl.honorBulanIni.toLocaleString('id-ID')}</TableCell>
                          <TableCell>
                            <Button variant="link" className="p-0 h-auto text-blue-600" onClick={() => handleOpenDetailModal(ppl)}>
                                {ppl.activitiesCount} Kegiatan
                            </Button>
                          </TableCell>
                          <TableCell>{difference === 0 ? <span className="text-gray-600">Tepat batas</span> : difference > 0 ? <span className="text-red-600 font-semibold">+Rp {difference.toLocaleString('id-ID')}</span> : <span className="text-green-600">-Rp {Math.abs(difference).toLocaleString('id-ID')}</span>}</TableCell>
                          <TableCell>{overLimit ? <Badge variant="destructive">Melebihi Batas</Badge> : <Badge className="bg-green-600">Normal</Badge>}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ActivityDetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        pplData={selectedPplDetails}
        selectedMonth={globalSettings.selectedMonth}
        selectedYear={globalSettings.selectedYear}
      />
    </Layout>
  );
}