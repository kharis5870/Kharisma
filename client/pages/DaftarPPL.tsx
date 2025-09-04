// client/pages/DaftarPPL.tsx

import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { usePPL } from "@/contexts/PPLContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem
} from "@/components/ui/pagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Users,
  UserCheck,
  Search,
  ChevronUp,
  ChevronDown,
  UserPlus,
  MapPin,
  Phone,
  List,
  UserX,
  ChevronLeft,
  ChevronRight,
  XCircle,
  CheckSquare
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PPLAdminData, PPLMaster } from "@shared/api";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/apiClient";

const fetchPPLs = async (): Promise<PPLAdminData[]> => {
    return apiClient.get<PPLAdminData[]>('/admin/ppl');
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


export default function DaftarPPL() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setSelectedPPLsForActivity } = usePPL();

  const sourcePage = location.state?.from || 'daftar-ppl'; 
  const sourceTahap = location.state?.tahap || 'persiapan';
  const kegiatanId = location.state?.kegiatanId;
  const existingPplIds = location.state?.existingPplIds || [];

  const { data: pplList = [], isLoading } = useQuery({ queryKey: ['pplAdmin'], queryFn: fetchPPLs });
  
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

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (location.state?.from) {
      setSelectionMode(true);
    }
  }, [location.state]);

  const filteredAndSortedData = useMemo(() => {
    let data = [...pplList].filter(ppl => 
        ppl.namaPPL.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ppl.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ppl.alamat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ppl.noTelepon.includes(searchTerm)
    );
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
  }, [pplList, searchTerm, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredAndSortedData.slice(startIndex, endIndex);
  }, [filteredAndSortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);

  const handleSelectPPL = (pplId: string) => {
    if (!selectionMode || existingPplIds.includes(pplId)) return;
    setSelectedPPLs(prev => prev.includes(pplId) ? prev.filter(id => id !== pplId) : [...prev, pplId]);
  };
  
  const handleBulkAddToActivity = () => {
    const selectedPPLObjects: PPLMaster[] = pplList
        .filter(ppl => selectedPPLs.includes(ppl.id))
        .map(p => ({ id: p.id, namaPPL: p.namaPPL }));

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
    if (!sortConfig || sortConfig.key !== columnKey) return <ChevronUp className="w-4 h-4 text-gray-300" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  const handleOpenDetailModal = (ppl: PPLAdminData) => {
    setSelectedPplDetails(ppl);
    setIsDetailModalOpen(true);
  };

  const stats = useMemo(() => ({
    totalPPL: pplList.length,
    activePPL: pplList.filter(p => p.totalKegiatan > 0).length,
    inactivePPL: pplList.filter(p => p.totalKegiatan === 0).length,
  }), [pplList]);

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
            <h1 className="text-3xl font-bold text-gray-900">Daftar PPL</h1>
            <p className="text-gray-600 mt-1">{selectionMode ? "Pilih PPL untuk ditambahkan ke kegiatan" : "Lihat dan kelola daftar PPL"}</p>
            {selectionMode && selectedPPLs.length > 0 && (
                 <button onClick={() => setShowSelectedPPLsModal(true)} className="text-sm text-blue-600 mt-1 hover:underline">
                    {selectedPPLs.length} PPL dipilih
                </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectionMode ? (
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
            ) : (
                <Button variant="outline" onClick={() => setSelectionMode(true)}>
                    <CheckSquare className="w-4 h-4 mr-2"/>
                    Pilih PPL
                </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-bps-blue-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total PPL</p><p className="text-2xl font-bold text-gray-900">{stats.totalPPL}</p></div><Users className="w-8 h-8 text-bps-blue-500" /></div></CardContent></Card>
            <Card className="border-l-4 border-l-bps-green-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">PPL Aktif</p><p className="text-2xl font-bold text-gray-900">{stats.activePPL}</p></div><UserCheck className="w-8 h-8 text-bps-green-500" /></div></CardContent></Card>
            <Card className="border-l-4 border-l-gray-400"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">PPL Non Aktif</p><p className="text-2xl font-bold text-gray-900">{stats.inactivePPL}</p></div><UserX className="w-8 h-8 text-gray-400" /></div></CardContent></Card>
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
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    {selectionMode && <TableHead className="w-12"></TableHead>}
                    <TableHead className="w-24"><button onClick={() => handleSort('id')} className="flex items-center gap-1">ID{getSortIcon('id')}</button></TableHead>
                    <TableHead className="w-48"><button onClick={() => handleSort('namaPPL')} className="flex items-center gap-1">Nama{getSortIcon('namaPPL')}</button></TableHead>
                    <TableHead className="w-32"><button onClick={() => handleSort('totalKegiatan')} className="flex items-center gap-1">Kegiatan{getSortIcon('totalKegiatan')}</button></TableHead>
                    <TableHead className="w-64"><button onClick={() => handleSort('alamat')} className="flex items-center gap-1">Alamat{getSortIcon('alamat')}</button></TableHead>
                    <TableHead className="w-40"><button onClick={() => handleSort('noTelepon')} className="flex items-center gap-1">Telepon{getSortIcon('noTelepon')}</button></TableHead>
                    <TableHead className="w-28"><button onClick={() => handleSort('status')} className="flex items-center gap-1">Status{getSortIcon('status')}</button></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (<TableRow><TableCell colSpan={7} className="text-center">Memuat...</TableCell></TableRow>) : 
                  paginatedData.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">Tidak ada data PPL</TableCell></TableRow>
                  ) : (
                      paginatedData.map((ppl) => {
                          const isActive = ppl.totalKegiatan > 0;
                          const isAlreadyAdded = existingPplIds.includes(ppl.id);
                          const isSelected = selectedPPLs.includes(ppl.id);
                          return (
                            <TableRow 
                                key={ppl.id} 
                                data-state={isSelected && "selected"}
                                className={cn(
                                    isAlreadyAdded && "bg-gray-100 text-gray-400 cursor-not-allowed",
                                    selectionMode && !isAlreadyAdded && "cursor-pointer"
                                )}
                                onClick={() => handleSelectPPL(ppl.id)}
                            >
                                {selectionMode && (
                                    <TableCell className="w-12">
                                        <Checkbox 
                                            checked={isSelected}
                                            disabled={isAlreadyAdded}
                                        />
                                    </TableCell>
                                )}
                                <TableCell className="font-medium truncate">{ppl.id}</TableCell>
                                <TableCell className="font-medium truncate">{ppl.namaPPL}</TableCell>
                                <TableCell>
                                  <Button variant="link" className="p-0 h-auto text-blue-600" onClick={(e) => { e.stopPropagation(); handleOpenDetailModal(ppl); }}>
                                      {ppl.totalKegiatan} Kegiatan
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2 truncate">
                                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                          <span className="truncate">{ppl.alamat}</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{ppl.alamat}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 truncate">
                                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{ppl.noTelepon}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="default" className={isActive ? "bg-bps-green-600" : "bg-gray-400 text-gray-800"}>
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
                                <li key={ppl.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                    <span>{ppl.namaPPL}</span>
                                    <span className="text-xs text-gray-500">ID: {ppl.id}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-center py-4">Belum ada PPL yang dipilih.</p>
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
      </div>
    </Layout>
  );
}