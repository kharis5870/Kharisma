// client/pages/ViewDocuments.tsx

import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Link2, ExternalLink, Eye, CheckCircle, Clock, Users, Activity, Notebook, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Kegiatan, Dokumen } from "@shared/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ConfirmationModal from "@/components/ConfirmationModal";
import { apiClient } from "@/lib/apiClient";

const fetchActivityDetails = async (id: string): Promise<Kegiatan> => {
    return apiClient.get<Kegiatan>(`/kegiatan/${id}`);
};

const updateDocumentStatus = async ({ dokumenId, status, username }: { dokumenId: number, status: Dokumen['status'], username: string }) => {
    return apiClient.put(`/kegiatan/dokumen/${dokumenId}/status`, { status, username });
};

const approveTahapan = async ({ kegiatanId, tipe, username }: { kegiatanId: number, tipe: Dokumen['tipe'], username: string }) => {
    return apiClient.put(`/kegiatan/${kegiatanId}/tahapan/approve`, { tipe, username });
};

export default function ViewDocuments() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const tahapFromNotif = searchParams.get('tahap');
    const { user } = useAuth(); 
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("persiapan");
    const [noteViewModal, setNoteViewModal] = useState<{ isOpen: boolean; title: string; content: string }>({ isOpen: false, title: '', content: '' });
    const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean; onConfirm: () => void; title: string; description: string }>({ isOpen: false, onConfirm: () => {}, title: '', description: '' });

    const { data: activityData, isLoading } = useQuery({
        queryKey: ['kegiatan', id],
        queryFn: () => fetchActivityDetails(id!),
        enabled: !!id,
    });

    const statusMutation = useMutation({
        mutationFn: updateDocumentStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kegiatan', id] });
        }
    });

    const tahapanMutation = useMutation({
        mutationFn: approveTahapan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kegiatan', id] });
        }
    });

    const handleStatusChange = (dokumenId: number, currentStatus: Dokumen['status']) => {
        const newStatus = currentStatus === 'Approved' ? 'Pending' : 'Approved';
        statusMutation.mutate({ dokumenId, status: newStatus, username: user!.username });
    };
    
    const handleApproveTahapan = (tipe: Dokumen['tipe']) => {
        setConfirmationModal({
            isOpen: true,
            title: `Setujui Semua Dokumen?`,
            description: `Anda akan menyetujui semua dokumen untuk tahap "${tipe.replace(/-/g, ' ')}". Aksi ini tidak dapat dibatalkan secara massal.`,
            onConfirm: () => tahapanMutation.mutate({ kegiatanId: parseInt(id!), tipe, username: user!.username })
        });
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-700';
            case 'Reviewed': return 'bg-blue-100 text-blue-700';
            case 'Approved': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'Pending': return <Clock className="w-3 h-3" />;
            case 'Reviewed': return <Eye className="w-3 h-3" />;
            case 'Approved': return <CheckCircle className="w-3 h-3" />;
            default: return null;
        }
    };

    const getRelativeTime = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const renderDocumentTable = (documents: Dokumen[] | undefined) => {
        if (!documents || documents.length === 0) {
            return <div className="text-center py-12 text-gray-500"><FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>Belum ada dokumen atau catatan untuk fase ini.</p></div>;
        }
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama Dokumen</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Last Approved</TableHead>
                        <TableHead>Aksi</TableHead>
                        <TableHead>Persetujuan</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents.map((doc) => {
                        const isApproved = doc.status === 'Approved';
                        const isApprovalDisabled = user?.role === 'user'; // <-- Cek role
                        return (
                            <TableRow key={doc.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    {doc.jenis === 'link' ? <Link2 className="w-4 h-4 text-blue-600" /> : doc.jenis === 'catatan' ? <Notebook className="w-4 h-4 text-orange-600" /> : <FileText className="w-4 h-4 text-green-600" />} 
                                    {doc.nama}
                                </TableCell>
                                <TableCell><Badge variant="outline">{doc.jenis === 'link' ? 'Drive Link' : doc.jenis === 'catatan' ? 'Catatan' : 'File'}</Badge></TableCell>
                                <TableCell><Badge className={cn("flex items-center gap-1 w-fit", getStatusColor(doc.status))}>{getStatusIcon(doc.status)} {doc.status || 'N/A'}</Badge></TableCell>
                                <TableCell>{getRelativeTime(doc.uploadedAt)}</TableCell>
                                <TableCell>
                                    {doc.lastApproved ? (
                                        <div className="text-xs">
                                            <p className="font-medium">{getRelativeTime(doc.lastApproved)}</p>
                                            <p className="text-gray-500">oleh {doc.lastApprovedBy}</p>
                                        </div>
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                    {doc.jenis === 'catatan' ? (
                                        <Button variant="outline" size="sm" onClick={() => setNoteViewModal({ isOpen: true, title: doc.nama, content: doc.link })} className="flex items-center gap-1">
                                            <Notebook className="w-3 h-3" /> Lihat Catatan
                                        </Button>
                                    ) : (
                                        doc.link ? (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={doc.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                    <ExternalLink className="w-3 h-3" /> Buka
                                                </a>
                                            </Button>
                                        ) : <span className="text-xs text-gray-500">Link kosong</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button 
                                        variant={isApproved ? "destructive" : "default"} 
                                        size="sm" 
                                        onClick={() => handleStatusChange(doc.id!, doc.status)}
                                        disabled={isApprovalDisabled} // <-- Terapkan disabled
                                        className={cn("flex items-center gap-1", isApproved ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700")}
                                        title={isApprovalDisabled ? "Anda tidak memiliki izin untuk aksi ini" : ""}
                                    >
                                        {isApproved ? <ThumbsDown className="w-3 h-3" /> : <ThumbsUp className="w-3 h-3" />}
                                        {isApproved ? 'Batal' : 'Setujui'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    };

    const renderTahapanContent = (tipe: Dokumen['tipe'], title: string) => {
        const documents = activityData?.dokumen.filter(d => d.tipe === tipe);
        const allApproved = documents && documents.length > 0 ? documents.every(d => d.status === 'Approved') : false;
        const isApprovalDisabled = user?.role === 'user'; // <-- Cek role

        return (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{title}</CardTitle>
                        <Button
                            size="sm"
                            onClick={() => handleApproveTahapan(tipe)}
                            disabled={allApproved || !documents || documents.length === 0 || isApprovalDisabled} // <-- Terapkan disabled
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                            title={isApprovalDisabled ? "Anda tidak memiliki izin untuk aksi ini" : ""}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {allApproved ? 'Tahap Disetujui' : 'Setujui Tahap Ini'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {renderDocumentTable(documents)}
                </CardContent>
            </Card>
        );
    };

    if (isLoading) return <Layout><p>Memuat...</p></Layout>;
    if (!activityData) return <Layout><p>Kegiatan tidak ditemukan.</p></Layout>;

    const docsByTipe = (tipe: Dokumen['tipe']) => activityData.dokumen.filter(d => d.tipe === tipe);
    const totalDocuments = activityData.dokumen.length;
    const approvedDocuments = activityData.dokumen.filter(d => d.status === 'Approved').length;

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" asChild><Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Kembali</Link></Button>
                    <div><h1 className="text-3xl font-bold">{activityData.namaKegiatan}</h1><p className="text-gray-600">Ringkasan dan daftar semua dokumen terkait.</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Total Dokumen</p><p className="text-2xl font-bold">{totalDocuments}</p></div><FileText className="w-8 h-8 text-blue-500" /></div></CardContent></Card>
                    <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Approved</p><p className="text-2xl font-bold">{approvedDocuments}</p></div><CheckCircle className="w-8 h-8 text-green-500" /></div></CardContent></Card>
                    <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Ketua Tim</p><p className="text-lg font-medium">{activityData.namaKetua}</p></div><Users className="w-8 h-8 text-purple-500" /></div></CardContent></Card>
                    <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Status Kegiatan</p><Badge>{activityData.status}</Badge></div><Activity className="w-8 h-8 text-orange-500" /></div></CardContent></Card>
                </div>
                <Tabs 
                    defaultValue={tahapFromNotif || 'persiapan'} 
                    className="space-y-6"
                    >
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="persiapan">Persiapan <Badge variant="secondary" className="ml-2">{docsByTipe('persiapan').length}</Badge></TabsTrigger>
                        <TabsTrigger value="pengumpulan-data">Pengumpulan Data <Badge variant="secondary" className="ml-2">{docsByTipe('pengumpulan-data').length}</Badge></TabsTrigger>
                        <TabsTrigger value="pengolahan-analisis">Pengolahan & Analisis <Badge variant="secondary" className="ml-2">{docsByTipe('pengolahan-analisis').length}</Badge></TabsTrigger>
                        <TabsTrigger value="diseminasi-evaluasi">Diseminasi & Evaluasi <Badge variant="secondary" className="ml-2">{docsByTipe('diseminasi-evaluasi').length}</Badge></TabsTrigger>
                    </TabsList>
                    <TabsContent value="persiapan">{renderTahapanContent('persiapan', 'Dokumen Persiapan')}</TabsContent>
                    <TabsContent value="pengumpulan-data">{renderTahapanContent('pengumpulan-data', 'Dokumen Pengumpulan Data')}</TabsContent>
                    <TabsContent value="pengolahan-analisis">{renderTahapanContent('pengolahan-analisis', 'Dokumen Pengolahan & Analisis')}</TabsContent>
                    <TabsContent value="diseminasi-evaluasi">{renderTahapanContent('diseminasi-evaluasi', 'Dokumen Diseminasi & Evaluasi')}</TabsContent>
                </Tabs>
                <div className="mt-8 p-4 bg-blue-50 border rounded-lg"><div className="flex items-center justify-between"><div><h4 className="font-medium text-blue-900">Perlu Menambah atau Mengedit Dokumen?</h4><p className="text-blue-700 text-sm mt-1">Gunakan halaman Edit untuk mengelola semua dokumen dan laporan.</p></div><Button asChild className="bg-blue-600 hover:bg-blue-700"><Link to={`/edit-activity/${activityData.id}`}>Ke Halaman Edit</Link></Button></div></div>
            </div>

            <Dialog open={noteViewModal.isOpen} onOpenChange={(isOpen) => !isOpen && setNoteViewModal({ isOpen: false, title: '', content: '' })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{noteViewModal.title}</DialogTitle>
                        <DialogDescription>Catatan untuk tahap ini.</DialogDescription>
                    </DialogHeader>
                    <div className="prose prose-sm max-w-none py-4 whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-gray-800 max-h-[50vh] overflow-y-auto">
                        {noteViewModal.content || "Belum ada catatan yang ditambahkan."}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNoteViewModal({ isOpen: false, title: '', content: '' })}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ConfirmationModal 
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                onConfirm={() => {
                    confirmationModal.onConfirm();
                    setConfirmationModal({ ...confirmationModal, isOpen: false });
                }}
                title={confirmationModal.title}
                description={confirmationModal.description}
                variant="info"
            />
        </Layout>
    );
}