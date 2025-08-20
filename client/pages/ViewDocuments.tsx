import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Link2, ExternalLink, Eye, CheckCircle, Clock, Users, Activity, Notebook } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Kegiatan, Dokumen } from "@shared/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const fetchActivityDetails = async (id: string): Promise<Kegiatan> => {
    const res = await fetch(`/api/kegiatan/${id}`);
    if (!res.ok) throw new Error("Kegiatan tidak ditemukan");
    return res.json();
};

export default function ViewDocuments() {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState("persiapan");
    const [noteViewModal, setNoteViewModal] = useState<{ isOpen: boolean; title: string; content: string }>({ isOpen: false, title: '', content: '' });

    const { data: activityData, isLoading } = useQuery({
        queryKey: ['kegiatan', id],
        queryFn: () => fetchActivityDetails(id!),
        enabled: !!id,
    });

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'Pending': return 'bg-red-100 text-red-700';
            case 'Reviewed': return 'bg-yellow-100 text-yellow-700';
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

    const renderDocumentTable = (documents: Dokumen[], fase: string) => {
        const uploadedDocuments = documents.filter(doc => doc.jenis === 'catatan' || (doc.link && doc.link.trim() !== ''));

        if (uploadedDocuments.length === 0) {
            return <div className="text-center py-12 text-gray-500"><FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>Belum ada dokumen yang diunggah untuk fase {fase}.</p></div>;
        }
        return (
            <Table>
                <TableHeader><TableRow><TableHead>Nama Dokumen</TableHead><TableHead>Jenis</TableHead><TableHead>Status</TableHead><TableHead>Tanggal</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                    {uploadedDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                                {doc.jenis === 'link' ? <Link2 className="w-4 h-4 text-blue-600" /> : doc.jenis === 'catatan' ? <Notebook className="w-4 h-4 text-orange-600" /> : <FileText className="w-4 h-4 text-green-600" />} 
                                {doc.nama}
                            </TableCell>
                            <TableCell><Badge variant="outline">{doc.jenis === 'link' ? 'Drive Link' : doc.jenis === 'catatan' ? 'Catatan' : 'File'}</Badge></TableCell>
                            <TableCell><Badge className={cn("flex items-center gap-1 w-fit", getStatusColor(doc.status))}>{getStatusIcon(doc.status)} {doc.status || 'N/A'}</Badge></TableCell>
                            <TableCell>{getRelativeTime(doc.uploadedAt)}</TableCell>
                            <TableCell>
                                {doc.jenis === 'catatan' ? (
                                    <Button variant="outline" size="sm" onClick={() => setNoteViewModal({ isOpen: true, title: doc.nama, content: doc.link })} className="flex items-center gap-1">
                                        <Notebook className="w-3 h-3" /> Lihat Catatan
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={doc.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" /> Buka
                                        </a>
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    if (isLoading) return <Layout><p>Memuat...</p></Layout>;
    if (!activityData) return <Layout><p>Kegiatan tidak ditemukan.</p></Layout>;

    const docsByTipe = (tipe: Dokumen['tipe']) => activityData.dokumen.filter(d => d.tipe === tipe);
    const totalDocuments = activityData.dokumen.filter(doc => doc.link && doc.link.trim() !== '').length;
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
                    <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Ketua Tim</p><p className="text-lg font-medium">{activityData.ketuaTim}</p></div><Users className="w-8 h-8 text-purple-500" /></div></CardContent></Card>
                    <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Status Kegiatan</p><Badge>{activityData.status}</Badge></div><Activity className="w-8 h-8 text-orange-500" /></div></CardContent></Card>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="persiapan">Persiapan <Badge variant="secondary" className="ml-2">{docsByTipe('persiapan').filter(d => d.link).length}</Badge></TabsTrigger>
                        <TabsTrigger value="pengumpulan-data">Pengumpulan Data <Badge variant="secondary" className="ml-2">{docsByTipe('pengumpulan-data').filter(d => d.link).length}</Badge></TabsTrigger>
                        <TabsTrigger value="pengolahan-analisis">Pengolahan & Analisis <Badge variant="secondary" className="ml-2">{docsByTipe('pengolahan-analisis').filter(d => d.link).length}</Badge></TabsTrigger>
                        <TabsTrigger value="diseminasi-evaluasi">Diseminasi & Evaluasi <Badge variant="secondary" className="ml-2">{docsByTipe('diseminasi-evaluasi').filter(d => d.link).length}</Badge></TabsTrigger>
                    </TabsList>
                    <TabsContent value="persiapan"><Card><CardHeader><CardTitle>Dokumen Persiapan</CardTitle></CardHeader><CardContent>{renderDocumentTable(docsByTipe('persiapan'), 'persiapan')}</CardContent></Card></TabsContent>
                    <TabsContent value="pengumpulan-data"><Card><CardHeader><CardTitle>Dokumen Pengumpulan Data</CardTitle></CardHeader><CardContent>{renderDocumentTable(docsByTipe('pengumpulan-data'), 'pengumpulan data')}</CardContent></Card></TabsContent>
                    <TabsContent value="pengolahan-analisis"><Card><CardHeader><CardTitle>Dokumen Pengolahan & Analisis</CardTitle></CardHeader><CardContent>{renderDocumentTable(docsByTipe('pengolahan-analisis'), 'pengolahan & analisis')}</CardContent></Card></TabsContent>
                    <TabsContent value="diseminasi-evaluasi"><Card><CardHeader><CardTitle>Dokumen Diseminasi & Evaluasi</CardTitle></CardHeader><CardContent>{renderDocumentTable(docsByTipe('diseminasi-evaluasi'), 'diseminasi & evaluasi')}</CardContent></Card></TabsContent>
                </Tabs>
                <div className="mt-8 p-4 bg-blue-50 border rounded-lg"><div className="flex items-center justify-between"><div><h4 className="font-medium text-blue-900">Perlu Menambah atau Mengedit Dokumen?</h4><p className="text-blue-700 text-sm mt-1">Gunakan halaman Edit untuk mengelola semua dokumen dan laporan.</p></div><Button asChild className="bg-blue-600 hover:bg-blue-700"><Link to={`/edit-activity/${activityData.id}`}>Ke Halaman Edit</Link></Button></div></div>
            </div>

            <Dialog open={noteViewModal.isOpen} onOpenChange={() => setNoteViewModal({ isOpen: false, title: '', content: '' })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{noteViewModal.title}</DialogTitle>
                        <DialogDescription>Catatan untuk tahap ini.</DialogDescription>
                    </DialogHeader>
                    <div className="prose prose-sm max-w-none py-4 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                        {noteViewModal.content || "Belum ada catatan yang ditambahkan."}
                    </div>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
