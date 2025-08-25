import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { usePPL } from "@/contexts/PPLContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit, Users, UserCheck, Search, ChevronUp, ChevronDown, Save, UserPlus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PPLMaster } from "@shared/api";

// API Functions
const fetchPPLs = async (): Promise<PPLMaster[]> => {
    const res = await fetch('/api/ppl');
    if (!res.ok) throw new Error('Gagal memuat daftar PPL');
    return res.json();
};

const addPPLAPI = async (ppl: PPLMaster): Promise<PPLMaster> => {
    const res = await fetch('/api/ppl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ppl),
    });
    if (!res.ok) throw new Error('Gagal menambahkan PPL');
    return res.json();
};

const updatePPLAPI = async ({ originalId, pplData }: { originalId: string, pplData: PPLMaster }): Promise<PPLMaster> => {
    const res = await fetch(`/api/ppl/${originalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pplData),
    });
    if (!res.ok) throw new Error('Gagal memperbarui PPL');
    return res.json();
};

const deletePPLAPI = async (id: string): Promise<void> => {
    const res = await fetch(`/api/ppl/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus PPL');
};


export default function ManajemenPPL() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setSelectedPPLsForActivity } = usePPL();

    const { data: pplList = [], isLoading } = useQuery({ queryKey: ['pplMaster'], queryFn: fetchPPLs });

    const addMutation = useMutation({ mutationFn: addPPLAPI, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pplMaster'] }) });
    const updateMutation = useMutation({ mutationFn: updatePPLAPI, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pplMaster'] }) });
    const deleteMutation = useMutation({ mutationFn: deletePPLAPI, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pplMaster'] }) });
    
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showBulkSuccessModal, setShowBulkSuccessModal] = useState(false);
    
    const [newPPLId, setNewPPLId] = useState("");
    const [newPPLName, setNewPPLName] = useState("");
    const [editPPLId, setEditPPLId] = useState("");
    const [editPPLName, setEditPPLName] = useState("");
    const [editPPLNewId, setEditPPLNewId] = useState("");
    const [deletePPLId, setDeletePPLId] = useState("");
    const [deletePPLName, setDeletePPLName] = useState("");
    
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: 'id' | 'namaPPL'; direction: 'asc' | 'desc'; } | null>(null);

    const [selectedPPLs, setSelectedPPLs] = useState<string[]>([]);
    
    const filteredAndSortedData = useMemo(() => {
        let data = [...pplList].filter(ppl => ppl.namaPPL.toLowerCase().includes(searchTerm.toLowerCase()));
        if (sortConfig) {
            data.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return data;
    }, [pplList, searchTerm, sortConfig]);

    const isAllSelected = useMemo(() => {
        return filteredAndSortedData.length > 0 && selectedPPLs.length === filteredAndSortedData.length;
    }, [selectedPPLs, filteredAndSortedData]);

    const isValidPPLId = (id: string) => id.trim().length >= 1;
    const isValidPPLName = (name: string) => name.trim().length >= 2;
    const isDuplicateId = (id: string, excludeId?: string) => pplList.some(ppl => ppl.id === id && ppl.id !== excludeId);
    const isDuplicateName = (name: string, excludeId?: string) => pplList.some(ppl => ppl.namaPPL.toLowerCase() === name.toLowerCase() && ppl.id !== excludeId);
    
    const handleAddPPL = () => {
        const trimmedId = newPPLId.trim();
        const trimmedName = newPPLName.trim();
        if (!isValidPPLId(trimmedId)) return alert("ID PPL harus diisi!");
        if (!isValidPPLName(trimmedName)) return alert("Nama PPL harus minimal 2 karakter!");
        if (isDuplicateId(trimmedId)) return alert("ID PPL sudah ada!");
        if (isDuplicateName(trimmedName)) return alert("Nama PPL sudah ada!");

        addMutation.mutate({ id: trimmedId, namaPPL: trimmedName }, {
            onSuccess: () => {
                setNewPPLId("");
                setNewPPLName("");
                setShowAddModal(false);
                setSuccessMessage(`PPL "${trimmedName}" berhasil ditambahkan!`);
                setShowSuccessModal(true);
            }
        });
    };
    
    const handleEditPPL = () => {
        const trimmedNewId = editPPLNewId.trim();
        const trimmedName = editPPLName.trim();
        if (!isValidPPLId(trimmedNewId)) return alert("ID PPL harus diisi!");
        if (!isValidPPLName(trimmedName)) return alert("Nama PPL harus minimal 2 karakter!");
        if (isDuplicateId(trimmedNewId, editPPLId)) return alert("ID PPL sudah ada!");
        if (isDuplicateName(trimmedName, editPPLId)) return alert("Nama PPL sudah ada!");

        updateMutation.mutate({ originalId: editPPLId, pplData: { id: trimmedNewId, namaPPL: trimmedName } }, {
            onSuccess: () => {
                setShowEditModal(false);
                setSuccessMessage(`PPL "${trimmedName}" berhasil diperbarui!`);
                setShowSuccessModal(true);
            }
        });
    };
    
    const handleDeletePPL = () => {
        deleteMutation.mutate(deletePPLId, {
            onSuccess: () => {
                setShowDeleteModal(false);
                setSuccessMessage(`PPL "${deletePPLName}" berhasil dihapus!`);
                setShowSuccessModal(true);
            }
        });
    };
    
    const openEditModal = (ppl: PPLMaster) => {
        setEditPPLId(ppl.id);
        setEditPPLNewId(ppl.id);
        setEditPPLName(ppl.namaPPL);
        setShowEditModal(true);
    };
    
    const openDeleteModal = (ppl: PPLMaster) => {
        setDeletePPLId(ppl.id);
        setDeletePPLName(ppl.namaPPL);
        setShowDeleteModal(true);
    };
    
    const handleSort = (key: 'id' | 'namaPPL') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };
    
    const getSortIcon = (columnKey: string) => {
        if (!sortConfig || sortConfig.key !== columnKey) return <ChevronUp className="w-4 h-4 text-gray-300" />;
        return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />;
    };
    
    const handleSelectAll = (checked: boolean) => {
        setSelectedPPLs(checked ? filteredAndSortedData.map(ppl => ppl.id) : []);
    };

    const handleSelectPPL = (pplId: string, checked: boolean) => {
        setSelectedPPLs(prev => checked ? [...prev, pplId] : prev.filter(id => id !== pplId));
    };

    const handleBulkAddToActivity = () => {
        const selectedPPLObjects = pplList.filter(ppl => selectedPPLs.includes(ppl.id));
        setSelectedPPLsForActivity(selectedPPLObjects);
        setSelectedPPLs([]);
        setShowBulkSuccessModal(true);
    };
    
    const stats = { totalPPL: pplList.length, activePPL: pplList.length };
    
    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Manajemen PPL</h1>
                        <p className="text-gray-600 mt-1">Kelola daftar Petugas Pencacah Lapangan (PPL)</p>
                        {selectedPPLs.length > 0 && <p className="text-sm text-blue-600 mt-1">{selectedPPLs.length} PPL dipilih</p>}
                    </div>
                    <div className="flex gap-2">
                        {selectedPPLs.length > 0 && (
                            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleBulkAddToActivity}>
                                <UserPlus className="w-4 h-4 mr-2" /> Tambahkan ke Input Kegiatan ({selectedPPLs.length})
                            </Button>
                        )}
                        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                            <DialogTrigger asChild>
                                <Button className="bg-bps-green-600 hover:bg-bps-green-700">
                                    <Plus className="w-4 h-4 mr-2" /> Tambah PPL Baru
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Tambah PPL Baru</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="newPPLId">ID PPL *</Label>
                                        <Input id="newPPLId" value={newPPLId} onChange={(e) => setNewPPLId(e.target.value)} placeholder="Contoh: PPL001" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newPPLName">Nama PPL *</Label>
                                        <Input id="newPPLName" value={newPPLName} onChange={(e) => setNewPPLName(e.target.value)} placeholder="Masukkan nama PPL" onKeyDown={(e) => e.key === 'Enter' && handleAddPPL()} />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setShowAddModal(false)}>Batal</Button>
                                        <Button onClick={handleAddPPL} className="bg-bps-green-600 hover:bg-bps-green-700"><Save className="w-4 h-4 mr-2" />Simpan</Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-l-4 border-l-bps-blue-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total PPL</p><p className="text-2xl font-bold text-gray-900">{stats.totalPPL}</p></div><Users className="w-8 h-8 text-bps-blue-500" /></div></CardContent></Card>
                    <Card className="border-l-4 border-l-bps-green-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">PPL Aktif</p><p className="text-2xl font-bold text-gray-900">{stats.activePPL}</p></div><UserCheck className="w-8 h-8 text-bps-green-500" /></div></CardContent></Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <CardTitle>Daftar PPL</CardTitle>
                            <div className="sm:w-64"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><Input type="text" placeholder="Cari nama PPL..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/></div></div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12"><Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} aria-label="Select all" /></TableHead>
                                        <TableHead className="w-40"><button onClick={() => handleSort('id')} className="flex items-center gap-1">ID PPL{getSortIcon('id')}</button></TableHead>
                                        <TableHead><button onClick={() => handleSort('namaPPL')} className="flex items-center gap-1">Nama PPL{getSortIcon('namaPPL')}</button></TableHead>
                                        <TableHead className="w-32">Status</TableHead>
                                        <TableHead className="w-32">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (<TableRow><TableCell colSpan={5} className="text-center">Memuat...</TableCell></TableRow>) : 
                                    filteredAndSortedData.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Tidak ada data PPL</TableCell></TableRow>
                                    ) : (
                                        filteredAndSortedData.map((ppl) => (
                                            <TableRow key={ppl.id} data-state={selectedPPLs.includes(ppl.id) && "selected"}>
                                                <TableCell><Checkbox checked={selectedPPLs.includes(ppl.id)} onCheckedChange={(checked) => handleSelectPPL(ppl.id, !!checked)} /></TableCell>
                                                <TableCell className="font-medium">{ppl.id}</TableCell>
                                                <TableCell className="font-medium">{ppl.namaPPL}</TableCell>
                                                <TableCell><Badge variant="default" className="bg-bps-green-600">Aktif</Badge></TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => openEditModal(ppl)}><Edit className="w-4 h-4" /></Button>
                                                        <Button variant="outline" size="sm" onClick={() => openDeleteModal(ppl)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Edit PPL</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2"><Label htmlFor="editPPLNewId">ID PPL *</Label><Input id="editPPLNewId" value={editPPLNewId} onChange={(e) => setEditPPLNewId(e.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="editPPLName">Nama PPL *</Label><Input id="editPPLName" value={editPPLName} onChange={(e) => setEditPPLName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleEditPPL()} /></div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowEditModal(false)}>Batal</Button>
                                <Button onClick={handleEditPPL} className="bg-blue-600 hover:bg-blue-700"><Save className="w-4 h-4 mr-2" />Simpan</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <ConfirmationModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeletePPL} title="Konfirmasi Hapus" description={`Yakin ingin menghapus PPL "${deletePPLName}"?`} variant="danger" />
                <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Berhasil!" description={successMessage} autoCloseDelay={2000} />
                <SuccessModal isOpen={showBulkSuccessModal} onClose={() => setShowBulkSuccessModal(false)} onAction={() => { setShowBulkSuccessModal(false); navigate('/input-kegiatan'); }} title="PPL Berhasil Ditambahkan!" description={`${selectedPPLs.length} PPL yang dipilih telah ditambahkan ke form Input Kegiatan.`} actionLabel="Ke Input Kegiatan" autoCloseDelay={0} />
            </div>
        </Layout>
    );
}
