import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import AlertModal from "@/components/AlertModal"; // Import AlertModal
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Edit, RefreshCw, Trash2, FileCheck, Users, Calendar, Activity, FileText, AlertTriangle, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Kegiatan, PPL } from "@shared/api";
import { cn } from "@/lib/utils";
import { toDate, format } from "date-fns";
import { id as localeID } from 'date-fns/locale';

// --- Tipe Data Frontend ---
type PPLWithProgress = PPL & {
  progressOpen: number;
  progressSubmit: number;
  progressDiperiksa: number;
  progressApproved: number;
};
type KegiatanWithRelations = Kegiatan & {
  ppl: PPLWithProgress[];
};

// --- API Functions ---
const fetchActivities = async (): Promise<KegiatanWithRelations[]> => {
  const res = await fetch("/api/kegiatan");
  if (!res.ok) throw new Error("Gagal memuat kegiatan");
  return res.json();
};

const deleteActivity = async (id: number): Promise<void> => {
    const res = await fetch(`/api/kegiatan/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Gagal menghapus kegiatan");
};

const updatePplProgress = async ({ pplId, progressData }: { pplId: number; progressData: any }) => {
    const res = await fetch(`/api/kegiatan/ppl/${pplId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData)
    });
    if (!res.ok) throw new Error("Gagal update progress");
    return res.json();
};

// --- Helper Functions ---
const getDynamicStatus = (kegiatan: Kegiatan): { status: string; color: string; warnings: string[] } => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const warnings: string[] = [];
    let status: string = 'Persiapan';

    const mulaiPelatihan = kegiatan.tanggalMulaiPelatihan ? toDate(new Date(kegiatan.tanggalMulaiPelatihan)) : null;
    const selesaiPelatihan = kegiatan.tanggalSelesaiPelatihan ? toDate(new Date(kegiatan.tanggalSelesaiPelatihan)) : null;
    const mulaiPendataan = kegiatan.tanggalMulaiPendataan ? toDate(new Date(kegiatan.tanggalMulaiPendataan)) : null;
    
    if (mulaiPendataan && today >= mulaiPendataan) {
        status = 'Pendataan';
        const deadlineLaporan = new Date(mulaiPendataan); deadlineLaporan.setDate(deadlineLaporan.getDate() + 7);
        if (today > deadlineLaporan && !kegiatan.dokumen.some(d => d.tipe === 'pasca-pendataan')) {
            warnings.push("Belum upload laporan pendataan (lewat 7 hari)");
        }
    } else if (mulaiPelatihan && selesaiPelatihan && today >= mulaiPelatihan) {
        status = 'Pelatihan';
        if (today > selesaiPelatihan) {
            const deadlineLaporan = new Date(selesaiPelatihan); deadlineLaporan.setDate(deadlineLaporan.getDate() + 3);
            if (today > deadlineLaporan && !kegiatan.dokumen.some(d => d.tipe === 'pasca-pelatihan')) {
                warnings.push("Belum upload laporan pasca pelatihan (lewat 3 hari)");
            }
        }
    }
    
    const color = status === 'Pendataan' ? 'bg-green-100 text-green-700' : status === 'Pelatihan' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700';
    return { status, warnings, color };
};

const getProgressBarValue = (ppl: PPLWithProgress) => {
    const totalBeban = parseInt(ppl.bebanKerja as any) || 0;
    if (totalBeban === 0) return 0;
    return ((ppl.progressApproved || 0) / totalBeban) * 100;
};

const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return "Baru saja";
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} hari yang lalu`;
};

// --- Main Dashboard Component ---
export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedActivity, setSelectedActivity] = useState<KegiatanWithRelations | null>(null);
  const [updateModalActivity, setUpdateModalActivity] = useState<KegiatanWithRelations | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<Kegiatan | null>(null);
  const [showProgressSuccessModal, setShowProgressSuccessModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [deletedActivityName, setDeletedActivityName] = useState("");
  const [localPplProgress, setLocalPplProgress] = useState<PPLWithProgress[]>([]);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "" });

  const { data: activities = [], isLoading } = useQuery<KegiatanWithRelations[]>({ queryKey: ['kegiatan'], queryFn: fetchActivities });
  
  const deleteMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
      setShowDeleteSuccessModal(true);
      setActivityToDelete(null);
    },
  });

  const progressMutation = useMutation({ mutationFn: updatePplProgress, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['kegiatan'] }); } });

  const stats = useMemo(() => {
    if (!activities) return { totalKegiatan: 0, persiapan: 0, pelatihan: 0, pendataan: 0, rataRataProgress: 0 };
    const statusCounts = activities.reduce((acc, act) => { const status = getDynamicStatus(act).status; acc[status] = (acc[status] || 0) + 1; return acc; }, {} as Record<string, number>);
    const totalProgress = activities.reduce((acc, act) => acc + (act.progressKeseluruhan || 0), 0);
    return { totalKegiatan: activities.length, persiapan: statusCounts['Persiapan'] || 0, pelatihan: statusCounts['Pelatihan'] || 0, pendataan: statusCounts['Pendataan'] || 0, rataRataProgress: activities.length > 0 ? Math.round(totalProgress / activities.length) : 0 };
  }, [activities]);

  const handleOpenUpdateModal = (activity: KegiatanWithRelations) => { setLocalPplProgress(JSON.parse(JSON.stringify(activity.ppl || []))); setUpdateModalActivity(activity); };

  const handleUpdatePPL = (pplId: number, field: keyof PPLWithProgress, value: string) => {
    setLocalPplProgress(prev =>
        prev.map(p => {
            if (p.id === pplId) {
                const newValue = parseInt(value) || 0;
                const oldValue = p[field] as number;
                const diff = newValue - oldValue;
                const bebanKerja = parseInt(p.bebanKerja) || 0;

                if (newValue > bebanKerja) {
                    setAlertModal({ isOpen: true, title: "Validasi Gagal", message: `Nilai tidak boleh melebihi total beban kerja (${bebanKerja}).` });
                    return p;
                }

                const updatedPpl = { ...p, [field]: newValue };

                if (diff !== 0) {
                    switch (field) {
                        case 'progressSubmit':
                            if (diff > 0 && p.progressOpen - diff < 0) {
                                setAlertModal({ isOpen: true, title: "Validasi Gagal", message: "Submit tidak bisa lebih besar dari Open!" });
                                return p;
                            }
                            updatedPpl.progressOpen -= diff;
                            break;
                        case 'progressDiperiksa':
                            if (diff > 0 && p.progressSubmit - diff < 0) {
                                setAlertModal({ isOpen: true, title: "Validasi Gagal", message: "Diperiksa tidak bisa lebih besar dari Submit!" });
                                return p;
                            }
                            updatedPpl.progressSubmit -= diff;
                            break;
                        case 'progressApproved':
                            if (diff > 0 && p.progressDiperiksa - diff < 0) {
                                setAlertModal({ isOpen: true, title: "Validasi Gagal", message: "Approved tidak bisa lebih besar dari Diperiksa!" });
                                return p;
                            }
                            updatedPpl.progressDiperiksa -= diff;
                            break;
                        default:
                            break;
                    }
                }
                return updatedPpl;
            }
            return p;
        })
    );
  };
  
  const handleSaveProgress = () => { localPplProgress.forEach(ppl => { progressMutation.mutate({ pplId: ppl.id!, progressData: { open: ppl.progressOpen, submit: ppl.progressSubmit, diperiksa: ppl.progressDiperiksa, approved: ppl.progressApproved } }); }); setUpdateModalActivity(null); setShowProgressSuccessModal(true); };

  const handleDeleteConfirm = () => {
    if (activityToDelete) {
        setDeletedActivityName(activityToDelete.namaKegiatan);
        deleteMutation.mutate(activityToDelete.id);
    }
  };

  if (isLoading) return <Layout><div className="text-center p-8">Memuat...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        <div><h1 className="text-3xl font-bold">Dashboard Monitoring</h1><p className="text-gray-600 mt-1">Pantau progress dan kelola semua kegiatan</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="border-l-4 border-l-bps-blue-500"><CardContent className="p-6"><div className="flex justify-between items-center"><div><p className="text-sm font-medium">Total Kegiatan</p><p className="text-2xl font-bold">{stats.totalKegiatan}</p></div><Activity className="w-8 h-8 text-bps-blue-500"/></div></CardContent></Card>
          <Card className="border-l-4 border-l-blue-500"><CardContent className="p-6"><div className="flex justify-between items-center"><div><p className="text-sm font-medium">Persiapan</p><p className="text-2xl font-bold">{stats.persiapan}</p></div><Clock className="w-8 h-8 text-blue-500"/></div></CardContent></Card>
          <Card className="border-l-4 border-l-yellow-500"><CardContent className="p-6"><div className="flex justify-between items-center"><div><p className="text-sm font-medium">Pelatihan</p><p className="text-2xl font-bold">{stats.pelatihan}</p></div><Users className="w-8 h-8 text-yellow-500"/></div></CardContent></Card>
          <Card className="border-l-4 border-l-green-500"><CardContent className="p-6"><div className="flex justify-between items-center"><div><p className="text-sm font-medium">Pendataan</p><p className="text-2xl font-bold">{stats.pendataan}</p></div><FileCheck className="w-8 h-8 text-green-500"/></div></CardContent></Card>
          <Card className="border-l-4 border-l-purple-500"><CardContent className="p-6"><div className="flex justify-between items-center"><div><p className="text-sm font-medium">Rata-rata Progress</p><p className="text-2xl font-bold">{stats.rataRataProgress}%</p></div><Calendar className="w-8 h-8 text-purple-500"/></div></CardContent></Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {activities.map((activity) => {
              const { status, warnings, color } = getDynamicStatus(activity);
              return (
                <Card key={activity.id} className="hover:shadow-lg transition-shadow flex flex-col">
                    <CardHeader className="pb-3"><div className="flex items-start justify-between"><div className="flex-1"><CardTitle className="text-lg leading-tight">{activity.namaKegiatan}</CardTitle><p className="text-sm text-gray-600 mt-1">Ketua: {activity.ketuaTim}</p></div><Badge className={cn("ml-2 whitespace-nowrap", color)}>{status}</Badge></div></CardHeader>
                    <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium">Progress Keseluruhan</span><span className="text-sm font-bold text-bps-blue-600">{activity.progressKeseluruhan || 0}%</span></div>
                            <Progress value={activity.progressKeseluruhan || 0} className="h-2" />
                            <div className="grid grid-cols-2 gap-4 text-sm mt-4"><div><p className="text-gray-500">Pelatihan</p><p className="font-medium">{activity.tanggalMulaiPelatihan ? format(new Date(activity.tanggalMulaiPelatihan), 'dd MMM yyyy', { locale: localeID }) : '-'}</p></div><div><p className="text-gray-500">Pendataan</p><p className="font-medium">{activity.tanggalMulaiPendataan ? format(new Date(activity.tanggalMulaiPendataan), 'dd MMM yyyy', { locale: localeID }) : '-'}</p></div></div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-2"><span>Terakhir diupdate:</span><span className="font-medium text-bps-blue-600">{getRelativeTime(activity.lastUpdated)}</span></div>
                            {warnings.length > 0 && (<div className="space-y-1 mt-2">{warnings.map((warning, index) => (<div key={index} className="flex items-center gap-2 p-2 bg-red-50 border rounded text-xs"><AlertTriangle className="w-3 h-3 text-red-600" /><span className="text-red-700">{warning}</span></div>))}</div>)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-4 border-t mt-4">
                            <Button variant="outline" size="sm" onClick={() => setSelectedActivity(activity)}><Eye className="w-4 h-4 mr-1" />Lihat</Button>
                            <Button variant="outline" size="sm" asChild><Link to={`/edit-activity/${activity.id}`}><Edit className="w-4 h-4 mr-1" />Edit</Link></Button>
                            <Button variant="outline" size="sm" onClick={() => handleOpenUpdateModal(activity)}><RefreshCw className="w-4 h-4 mr-1" />Update</Button>
                            <Button variant="outline" size="sm" asChild><Link to={`/view-documents/${activity.id}`}><FileText className="w-4 h-4 mr-1" />View Docs</Link></Button>
                            <Button variant="destructive" size="sm" onClick={() => setActivityToDelete(activity)} className="col-span-2"><Trash2 className="w-4 h-4 mr-1" />Hapus</Button>
                        </div>
                    </CardContent>
                </Card>
            )})}
        </div>
        
        <Dialog open={!!selectedActivity} onOpenChange={(isOpen) => !isOpen && setSelectedActivity(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detail Kegiatan: {selectedActivity?.namaKegiatan}</DialogTitle>
                </DialogHeader>
                {selectedActivity && (
                    <div className="space-y-6 p-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Informasi Kegiatan</h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Nama Kegiatan:</span>
                                <span className="font-medium text-right max-w-xs">{selectedActivity.namaKegiatan}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Ketua Tim:</span>
                                <span className="font-medium">{selectedActivity.ketuaTim}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Tipe Kegiatan:</span>
                                <span className="font-medium">{selectedActivity.tipeKegiatan}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Status:</span>
                                <Badge className={cn(getDynamicStatus(selectedActivity).color)}>
                                  {getDynamicStatus(selectedActivity).status}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Terakhir Update:</span>
                                <span className="font-medium text-bps-blue-600">{getRelativeTime(selectedActivity.lastUpdated)}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Jadwal Kegiatan</h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Pelatihan:</span>
                                <span className="font-medium">
                                  {format(new Date(selectedActivity.tanggalMulaiPelatihan!), 'dd MMM yyyy', { locale: localeID })} - {format(new Date(selectedActivity.tanggalSelesaiPelatihan!), 'dd MMM yyyy', { locale: localeID })}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Pendataan:</span>
                                <span className="font-medium">
                                  {format(new Date(selectedActivity.tanggalMulaiPendataan!), 'dd MMM yyyy', { locale: localeID })} - {format(new Date(selectedActivity.tanggalSelesaiPendataan!), 'dd MMM yyyy', { locale: localeID })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Tim Kerja</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{selectedActivity.timKerja}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4">Progress PPL</h4>
                          <div className="space-y-4">
                            {selectedActivity.ppl.map((ppl) => (
                              <Card key={ppl.id} className="p-4 bg-gray-50">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h5 className="font-medium text-gray-900">{ppl.namaPPL}</h5>
                                      <p className="text-sm text-gray-600">PML: {ppl.namaPML}</p>
                                      <p className="text-sm text-gray-600">Total Beban Kerja: {ppl.bebanKerja} {ppl.satuanBebanKerja}</p>
                                      <p className="text-sm text-gray-600">Honor: Rp {parseInt(ppl.besaranHonor).toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-bps-blue-600">
                                        {getProgressBarValue(ppl).toFixed(1)}%
                                      </div>
                                      <div className="text-xs text-gray-500">Progress Approved</div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-4 gap-4">
                                    <div className="text-center">
                                      <Label className="text-xs text-gray-600">Open</Label>
                                      <div className="mt-1 p-2 bg-white border border-gray-200 rounded text-center text-sm font-medium">
                                        {ppl.progressOpen || 0}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">{ppl.progressOpen || 0} {ppl.satuanBebanKerja}</div>
                                    </div>

                                    <div className="text-center">
                                      <Label className="text-xs text-gray-600">Submit</Label>
                                      <div className="mt-1 p-2 bg-white border border-gray-200 rounded text-center text-sm font-medium">
                                        {ppl.progressSubmit || 0}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">{ppl.progressSubmit || 0} {ppl.satuanBebanKerja}</div>
                                    </div>

                                    <div className="text-center">
                                      <Label className="text-xs text-gray-600">Diperiksa</Label>
                                      <div className="mt-1 p-2 bg-white border border-gray-200 rounded text-center text-sm font-medium">
                                        {ppl.progressDiperiksa || 0}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">{ppl.progressDiperiksa || 0} {ppl.satuanBebanKerja}</div>
                                    </div>

                                    <div className="text-center">
                                      <Label className="text-xs text-gray-600">Approved</Label>
                                      <div className="mt-1 p-2 bg-white border border-gray-200 rounded text-center text-sm font-medium">
                                        {ppl.progressApproved || 0}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">{ppl.progressApproved || 0} {ppl.satuanBebanKerja}</div>
                                    </div>
                                  </div>

                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-bps-green-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${getProgressBarValue(ppl)}%` }}
                                    ></div>
                                  </div>

                                  <div className="text-xs text-gray-500 text-center">
                                    Total: {(ppl.progressOpen ?? 0) + (ppl.progressSubmit ?? 0) + (ppl.progressDiperiksa ?? 0) + (ppl.progressApproved ?? 0)} / {ppl.bebanKerja} {ppl.satuanBebanKerja}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <FileCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-900">Informasi Akses</h4>
                              <p className="text-blue-700 text-sm mt-1">
                                Gunakan tombol <strong>Edit</strong> untuk mengakses dan mengupload dokumen semua fase (persiapan, pelatihan, pendataan).
                                Tombol <strong>View Docs</strong> untuk melihat semua dokumen.
                              </p>
                            </div>
                          </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>

        <Dialog open={!!updateModalActivity} onOpenChange={(isOpen) => !isOpen && setUpdateModalActivity(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Update Progress: {updateModalActivity?.namaKegiatan}</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                    {localPplProgress.map(ppl => (
                        <Card key={ppl.id} className="p-4 mb-4">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h5 className="font-medium text-gray-900">{ppl.namaPPL}</h5>
                                        <p className="text-sm text-gray-600">PML: {ppl.namaPML}</p>
                                        <p className="text-sm text-gray-600">Total Beban Kerja: {ppl.bebanKerja} {ppl.satuanBebanKerja}</p>
                                        <p className="text-sm text-gray-600">Honor: Rp {parseInt(ppl.besaranHonor).toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-bps-blue-600">
                                            {getProgressBarValue(ppl).toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-gray-500">Progress Approved</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    {['open', 'submit', 'diperiksa', 'approved'].map(field => (
                                        <div key={field} className="text-center">
                                            <Label className="text-xs text-gray-600 capitalize">{field}</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={(ppl as any)[`progress${field.charAt(0).toUpperCase() + field.slice(1)}`]}
                                                onChange={e => handleUpdatePPL(ppl.id!, `progress${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof PPLWithProgress, e.target.value)}
                                                className="mt-1 text-center"
                                            />
                                            <div className="text-xs text-gray-500 mt-1">{(ppl as any)[`progress${field.charAt(0).toUpperCase() + field.slice(1)}`]} {ppl.satuanBebanKerja}</div>
                                        </div>
                                    ))}
                                </div>
                                <Progress value={getProgressBarValue(ppl)} className="h-2" />
                                <div className="text-xs text-gray-500 text-center">
                                    Total: {(ppl.progressOpen ?? 0) + (ppl.progressSubmit ?? 0) + (ppl.progressDiperiksa ?? 0) + (ppl.progressApproved ?? 0)} / {ppl.bebanKerja} {ppl.satuanBebanKerja}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
                <div className="flex justify-end p-4 border-t">
                    <Button onClick={handleSaveProgress}>Simpan Progress</Button>
                </div>
            </DialogContent>
        </Dialog>
        
        <ConfirmationModal 
            isOpen={!!activityToDelete} 
            onConfirm={handleDeleteConfirm} 
            onClose={() => setActivityToDelete(null)} 
            title="Konfirmasi Hapus" 
            description={`Yakin ingin menghapus "${activityToDelete?.namaKegiatan}"?`} 
        />
        
        <SuccessModal 
            isOpen={showProgressSuccessModal} 
            onClose={() => setShowProgressSuccessModal(false)} 
            title="Progress Berhasil Diperbarui!" 
            autoCloseDelay={2000} 
        />

        <SuccessModal
            isOpen={showDeleteSuccessModal}
            onClose={() => setShowDeleteSuccessModal(false)}
            title="Kegiatan Berhasil Dihapus!"
            description={`Kegiatan "${deletedActivityName}" telah berhasil dihapus dari sistem.`}
            autoCloseDelay={2000}
        />
        
        <AlertModal
            isOpen={alertModal.isOpen}
            onClose={() => setAlertModal({ isOpen: false, title: "", message: "" })}
            title={alertModal.title}
            description={alertModal.message}
        />
      </div>
    </Layout>
  );
}