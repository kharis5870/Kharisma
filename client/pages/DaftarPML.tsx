// Di dalam file: client/pages/DaftarPML.tsx

import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import {
    Users,
    UserCheck, 
    Search,
    List,
    ChevronUp,
    ChevronDown,
    UserX,      
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PMLAdminData } from "@shared/api";
import { apiClient } from "@/lib/apiClient";

// Fungsi untuk mengambil data dari API yang baru kita buat
const fetchPMLs = async (): Promise<PMLAdminData[]> => {
    return apiClient.get<PMLAdminData[]>('/pml');
};

const ActivityDetailModal = ({ isOpen, onClose, pmlData }: { 
    isOpen: boolean, 
    onClose: () => void, 
    pmlData: PMLAdminData | null 
}) => {
    if (!pmlData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Detail Kegiatan: {pmlData.namaPML}</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar semua kegiatan yang ditangani oleh PML ini.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 max-h-80 overflow-y-auto">
                    {pmlData.kegiatanDetails && pmlData.kegiatanDetails.length > 0 ? (
                        <ul className="space-y-2">
                            {pmlData.kegiatanDetails.map((keg, index) => (
                                <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                                    <List className="w-4 h-4 text-bps-blue-500 mt-1 flex-shrink-0" />
                                    <span>
                                        {keg.nama}
                                        <span className="text-slate-500 font-normal ml-1 capitalize">
                                            ({keg.tahap?.replace('-', ' ')})
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-center py-4">Tidak ada kegiatan tercatat.</p>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <Button variant="outline" onClick={onClose}>Tutup</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function DaftarPML() {
    const { data: pmlList = [], isLoading } = useQuery({ 
        queryKey: ['pmlAdmin'], 
        queryFn: fetchPMLs 
    });
    
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: keyof PMLAdminData; direction: 'asc' | 'desc'; } | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedPmlDetails, setSelectedPmlDetails] = useState<PMLAdminData | null>(null);
    
    const handleOpenDetailModal = (pml: PMLAdminData) => {
        setSelectedPmlDetails(pml);
        setIsDetailModalOpen(true);
    };

    const stats = useMemo(() => ({
        totalPML: pmlList.length,
        activePML: pmlList.filter(p => p.totalKegiatan > 0).length,
        inactivePML: pmlList.filter(p => p.totalKegiatan === 0).length,
    }), [pmlList]);

    const filteredAndSortedData = useMemo(() => {
        let data = [...pmlList].filter(pml => 
            (pml.namaPML || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (pml.id || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfig) {
            data.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                // ✔️ PERBAIKAN: Tangani jika salah satu nilai null
                if (aValue == null) return 1;  // Pindahkan null ke akhir
                if (bValue == null) return -1; // Pindahkan null ke akhir

                // Perbandingan normal jika kedua nilai ada
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                
                return 0;
            });
        }
        return data;
    }, [pmlList, searchTerm, sortConfig]);
    const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredAndSortedData.slice(startIndex, endIndex);
    }, [filteredAndSortedData, currentPage, rowsPerPage]);

    const handleSort = (key: keyof PMLAdminData) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const getSortIcon = (columnKey: string) => {
        if (!sortConfig || sortConfig.key !== columnKey) return <ChevronUp className="w-4 h-4 text-gray-300" />;
        return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />;
    };

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Daftar PML</h1>
                    <p className="text-gray-600 mt-1">Lihat dan kelola daftar Pengawas Mitra Lapangan (PML)</p>
                </div>

                {/* ✔️ TAMBAHKAN BLOK KARTU STATISTIK INI */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-l-4 border-l-bps-blue-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total PML</p><p className="text-2xl font-bold text-gray-900">{stats.totalPML}</p></div><Users className="w-8 h-8 text-bps-blue-500" /></div></CardContent></Card>
                    <Card className="border-l-4 border-l-bps-green-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">PML Aktif</p><p className="text-2xl font-bold text-gray-900">{stats.activePML}</p></div><UserCheck className="w-8 h-8 text-bps-green-500" /></div></CardContent></Card>
                    <Card className="border-l-4 border-l-gray-400"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">PML Non Aktif</p><p className="text-2xl font-bold text-gray-900">{stats.inactivePML}</p></div><UserX className="w-8 h-8 text-gray-400" /></div></CardContent></Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Semua PML ({pmlList.length})</CardTitle>
                            <div className="w-64">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input 
                                        type="text" 
                                        placeholder="Cari nama atau ID PML..." 
                                        value={searchTerm} 
                                        onChange={(e) => setSearchTerm(e.target.value)} 
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">No</TableHead>
                                    <TableHead className="w-[150px]">
                                        <button onClick={() => handleSort('id')} className="flex items-center gap-1">ID PML {getSortIcon('id')}</button>
                                    </TableHead>
                                    <TableHead>
                                        <button onClick={() => handleSort('namaPML')} className="flex items-center gap-1">Nama PML {getSortIcon('namaPML')}</button>
                                    </TableHead>
                                    <TableHead className="w-[200px]">
                                        <button onClick={() => handleSort('totalKegiatan')} className="flex items-center gap-1">Jumlah Kegiatan {getSortIcon('totalKegiatan')}</button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center">Memuat...</TableCell></TableRow>
                                ) : paginatedData.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">Tidak ada data PML</TableCell></TableRow>
                                ) : (
                                    paginatedData.map((pml, index) => (
                                        <TableRow key={pml.id}>
                                            <TableCell>{(currentPage - 1) * rowsPerPage + index + 1}</TableCell>
                                            <TableCell className="font-mono">{pml.id}</TableCell>
                                            <TableCell className="font-medium">{pml.namaPML}</TableCell>
                                            <TableCell>
                                                <Button 
                                                    variant="link" 
                                                    className="p-0 h-auto text-blue-600" 
                                                    onClick={() => handleOpenDetailModal(pml)}
                                                    disabled={pml.totalKegiatan === 0}
                                                >
                                                    {pml.totalKegiatan} Kegiatan
                                                </Button>
                                                </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-600">
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
                                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                        </PaginationItem>
                                        <PaginationItem className="text-sm font-medium px-3">
                                            {currentPage} / {totalPages || 1}
                                        </PaginationItem>
                                        <PaginationItem>
                                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
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
                pmlData={selectedPmlDetails}
            />
        </Layout>
    );
}