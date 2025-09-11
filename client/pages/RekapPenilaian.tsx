// Di dalam file: client/pages/RekapPenilaian.tsx

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { ArrowLeft, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Award, Users, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { RekapPenilaian } from "@shared/api";
import { apiClient } from "@/lib/apiClient";

const fetchRekapPenilaian = async (tahun: number, triwulan: number): Promise<RekapPenilaian[]> => {
    return apiClient.get(`/penilaian/rekap?tahun=${tahun}&triwulan=${triwulan}`);
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const triwulans = [ { value: 1, label: 'Triwulan 1 (Jan-Mar)' }, { value: 2, label: 'Triwulan 2 (Apr-Jun)' }, { value: 3, label: 'Triwulan 3 (Jul-Sep)' }, { value: 4, label: 'Triwulan 4 (Okt-Des)' }];

const getCurrentTriwulan = () => Math.floor(new Date().getMonth() / 3) + 1;

export default function RekapPenilaian() {
    const [filters, setFilters] = useState({
        tahun: currentYear,
        triwulan: getCurrentTriwulan(),
    });
    const [sortConfig, setSortConfig] = useState<{ key: keyof RekapPenilaian; direction: 'asc' | 'desc' } | null>({ key: 'nilaiAkhir', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const { data: rekapData = [], isLoading } = useQuery({
        queryKey: ['rekapPenilaian', filters.tahun, filters.triwulan],
        queryFn: () => fetchRekapPenilaian(filters.tahun, filters.triwulan),
    });

    const sortedData = useMemo(() => {
        let data = [...rekapData];
        if (sortConfig) {
            data.sort((a, b) => {
                const aValue = a[sortConfig.key] ?? -1;
                const bValue = b[sortConfig.key] ?? -1;
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return data;
    }, [rekapData, sortConfig]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return sortedData.slice(startIndex, endIndex);
    }, [sortedData, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(sortedData.length / rowsPerPage);

    const handleSort = (key: keyof RekapPenilaian) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey: string) => {
        if (!sortConfig || sortConfig.key !== columnKey) return <ChevronUp className="w-4 h-4 text-gray-300" />;
        return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />;
    };

    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" asChild><Link to="/penilaian-mitra"><ArrowLeft className="w-4 h-4 mr-2" />Kembali</Link></Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Rekapitulasi Penilaian Mitra</h1>
                        <p className="text-gray-600 mt-1">Peringkat performa PPL berdasarkan penilaian dan jumlah kegiatan.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Filter Data</CardTitle>
                            <div className="flex items-center gap-2">
                                <Select value={String(filters.triwulan)} onValueChange={(v) => setFilters(f => ({ ...f, triwulan: Number(v) }))}>
                                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>{triwulans.map(t => <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>)}</SelectContent>
                                </Select>
                                <Select value={String(filters.tahun)} onValueChange={(v) => setFilters(f => ({ ...f, tahun: Number(v) }))}>
                                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">No</TableHead>
                                    <TableHead><div onClick={() => handleSort('namaPPL')} className="flex items-center gap-1 cursor-pointer">Nama PPL {getSortIcon('namaPPL')}</div></TableHead>
                                    <TableHead className="w-[180px] text-center"><div onClick={() => handleSort('totalKegiatan')} className="flex items-center justify-center gap-1 cursor-pointer">Total Kegiatan {getSortIcon('totalKegiatan')}</div></TableHead>
                                    <TableHead className="w-[180px] text-center"><div onClick={() => handleSort('rataRataNilai')} className="flex items-center justify-center gap-1 cursor-pointer">Rata-rata Nilai {getSortIcon('rataRataNilai')}</div></TableHead>
                                    <TableHead className="w-[180px] text-center"><div onClick={() => handleSort('nilaiAkhir')} className="flex items-center justify-center gap-1 cursor-pointer">Nilai Akhir {getSortIcon('nilaiAkhir')}</div></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (<TableRow><TableCell colSpan={5} className="text-center">Memuat...</TableCell></TableRow>)
                                : paginatedData.length === 0 ? (<TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Tidak ada data penilaian untuk periode ini.</TableCell></TableRow>)
                                : (paginatedData.map((item, index) => (
                                    <TableRow key={item.pplId}>
                                        <TableCell className="text-center">{(currentPage - 1) * rowsPerPage + index + 1}</TableCell>
                                        <TableCell className="font-medium">{item.namaPPL}</TableCell>
                                        <TableCell className="text-center">{item.totalKegiatan}</TableCell>
                                        <TableCell className="text-center">{item.rataRataNilai?.toFixed(2) || '-'}</TableCell>
                                        <TableCell className="text-center font-bold text-blue-600">{item.nilaiAkhir?.toFixed(2) || '-'}</TableCell>
                                    </TableRow>
                                )))}
                            </TableBody>
                        </Table>
                         <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-600">Menampilkan <strong>{paginatedData.length}</strong> dari <strong>{sortedData.length}</strong> data</div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2"><span className="text-sm">Baris per halaman:</span><Select value={String(rowsPerPage)} onValueChange={value => { setRowsPerPage(Number(value)); setCurrentPage(1); }}><SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger><SelectContent>{[10, 25, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}</SelectContent></Select></div>
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button></PaginationItem>
                                        <PaginationItem className="text-sm font-medium px-3">{currentPage} / {totalPages || 1}</PaginationItem>
                                        <PaginationItem><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}><ChevronRight className="w-4 h-4" /></Button></PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}