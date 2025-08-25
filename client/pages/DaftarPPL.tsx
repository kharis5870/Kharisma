import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import { usePPL } from "@/contexts/PPLContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  UserCheck, 
  Search,
  ChevronUp,
  ChevronDown,
  UserPlus,
  MapPin,
  Phone,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PPLAdminData } from "@shared/api";

const fetchPPLs = async (): Promise<PPLAdminData[]> => {
    const res = await fetch('/api/admin/ppl');
    if (!res.ok) throw new Error('Gagal memuat daftar PPL');
    return res.json();
};

export default function DaftarPPL() {
  const navigate = useNavigate();
  const { setSelectedPPLsForActivity } = usePPL();
  const { data: pplList = [], isLoading } = useQuery({ queryKey: ['pplAdmin'], queryFn: fetchPPLs });
  
  const [showBulkSuccessModal, setShowBulkSuccessModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof PPLAdminData; direction: 'asc' | 'desc'; } | null>(null);
  const [selectedPPLs, setSelectedPPLs] = useState<string[]>([]);

  const filteredAndSortedData = useMemo(() => {
    let data = [...pplList].filter(ppl => 
        ppl.namaPPL.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ppl.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ppl.alamat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ppl.noTelepon.includes(searchTerm)
    );
    if (sortConfig) {
        data.sort((a, b) => {
            const aValue = a[sortConfig.key] as any;
            const bValue = b[sortConfig.key] as any;
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return data;
  }, [pplList, searchTerm, sortConfig]);

  const isAllSelected = useMemo(() => filteredAndSortedData.length > 0 && selectedPPLs.length === filteredAndSortedData.length, [selectedPPLs, filteredAndSortedData]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedPPLs(checked ? filteredAndSortedData.map(ppl => ppl.id) : []);
  };
  
  const handleSelectPPL = (pplId: string, checked: boolean) => {
    setSelectedPPLs(prev => checked ? [...prev, pplId] : prev.filter(id => id !== pplId));
  };
  
  const handleBulkAddToActivity = () => {
    const selectedPPLObjects = pplList.filter(ppl => selectedPPLs.includes(ppl.id));
    setSelectedPPLsForActivity(selectedPPLObjects.map(p => ({ id: p.id, namaPPL: p.namaPPL })));
    setSelectedPPLs([]);
    setShowBulkSuccessModal(true);
  };
  
  const handleSort = (key: keyof PPLAdminData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) return <ChevronUp className="w-4 h-4 text-gray-300" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  const stats = useMemo(() => ({
    totalPPL: pplList.length,
    activePPL: pplList.length,
    totalKegiatan: pplList.reduce((sum, ppl) => sum + ppl.totalKegiatan, 0),
    avgKegiatan: pplList.length > 0 ? Math.round(pplList.reduce((sum, ppl) => sum + ppl.totalKegiatan, 0) / pplList.length) : 0
  }), [pplList]);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daftar PPL</h1>
            <p className="text-gray-600 mt-1">Pilih PPL untuk ditambahkan ke Input Kegiatan</p>
            {selectedPPLs.length > 0 && <p className="text-sm text-blue-600 mt-1">{selectedPPLs.length} PPL dipilih</p>}
          </div>
          {selectedPPLs.length > 0 && <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleBulkAddToActivity}><UserPlus className="w-4 h-4 mr-2" />Tambahkan ke Input Kegiatan ({selectedPPLs.length})</Button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-bps-blue-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total PPL</p><p className="text-2xl font-bold text-gray-900">{stats.totalPPL}</p></div><Users className="w-8 h-8 text-bps-blue-500" /></div></CardContent></Card>
            <Card className="border-l-4 border-l-bps-green-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">PPL Aktif</p><p className="text-2xl font-bold text-gray-900">{stats.activePPL}</p></div><UserCheck className="w-8 h-8 text-bps-green-500" /></div></CardContent></Card>
            <Card className="border-l-4 border-l-orange-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total Kegiatan</p><p className="text-2xl font-bold text-gray-900">{stats.totalKegiatan}</p></div><Activity className="w-8 h-8 text-orange-500" /></div></CardContent></Card>
            <Card className="border-l-4 border-l-purple-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Rata-rata Kegiatan</p><p className="text-2xl font-bold text-gray-900">{stats.avgKegiatan}</p></div><Activity className="w-8 h-8 text-purple-500" /></div></CardContent></Card>
        </div>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Daftar PPL</CardTitle>
              <div className="sm:w-64"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><Input type="text" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/></div></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"><Checkbox checked={isAllSelected} onCheckedChange={(checked) => handleSelectAll(!!checked)} /></TableHead>
                    <TableHead><button onClick={() => handleSort('id')} className="flex items-center gap-1">ID{getSortIcon('id')}</button></TableHead>
                    <TableHead><button onClick={() => handleSort('namaPPL')} className="flex items-center gap-1">Nama{getSortIcon('namaPPL')}</button></TableHead>
                    <TableHead><button onClick={() => handleSort('totalKegiatan')} className="flex items-center gap-1">Kegiatan{getSortIcon('totalKegiatan')}</button></TableHead>
                    <TableHead><button onClick={() => handleSort('alamat')} className="flex items-center gap-1">Alamat{getSortIcon('alamat')}</button></TableHead>
                    <TableHead><button onClick={() => handleSort('noTelepon')} className="flex items-center gap-1">Telepon{getSortIcon('noTelepon')}</button></TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (<TableRow><TableCell colSpan={7} className="text-center">Memuat...</TableCell></TableRow>) : 
                  filteredAndSortedData.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">Tidak ada data PPL</TableCell></TableRow>
                  ) : (
                      filteredAndSortedData.map((ppl) => (
                          <TableRow key={ppl.id} data-state={selectedPPLs.includes(ppl.id) && "selected"}>
                              <TableCell><Checkbox checked={selectedPPLs.includes(ppl.id)} onCheckedChange={(checked) => handleSelectPPL(ppl.id, !!checked)} /></TableCell>
                              <TableCell className="font-medium">{ppl.id}</TableCell>
                              <TableCell className="font-medium">{ppl.namaPPL}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {ppl.totalKegiatan} kegiatan
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span>{ppl.alamat}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span>{ppl.noTelepon}</span>
                                </div>
                              </TableCell>
                              <TableCell><Badge variant="default" className="bg-bps-green-600">Aktif</Badge></TableCell>
                          </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <SuccessModal 
            isOpen={showBulkSuccessModal} 
            onClose={() => setShowBulkSuccessModal(false)} 
            onAction={() => { setShowBulkSuccessModal(false); navigate('/input-kegiatan'); }} 
            title="PPL Berhasil Ditambahkan!" 
            description={`${selectedPPLs.length} PPL yang dipilih telah ditambahkan ke form Input Kegiatan.`} 
            actionLabel="Ke Input Kegiatan" 
        />
      </div>
    </Layout>
  );
}
