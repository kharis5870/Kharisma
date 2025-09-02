// client/pages/Dashboard.tsx

import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import AlertModal from "@/components/AlertModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Edit, RefreshCw, Trash2, FileCheck, Users, Activity, FileText, AlertTriangle, Search, Filter, BarChart, BookOpen, Send, CheckSquare, Layers, ClipboardCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Kegiatan, PPL, Dokumen, ProgressType } from "@shared/api";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { format, isPast, parseISO, differenceInDays, formatDistanceToNow } from "date-fns";
import { id as localeID } from 'date-fns/locale';
import { useAuth } from "@/contexts/AuthContext";

type EditableProgressKey = 'submit' | 'diperiksa' | 'approved' | 'sudah_entry' | 'validasi' | 'clean';
type ProgressTypeFilter = 'submit' | 'approved' | 'sudah_entry' | 'clean';

// --- Tipe Data Frontend ---
type PPLWithProgress = PPL & {
  progress: Partial<Record<ProgressType, number>>;
};

type KegiatanWithDynamicStatus = Kegiatan & {
  dynamicStatus: {
    status: Kegiatan['status'];
    color: string;
    warnings: string[];
  }
};

// --- API Functions ---
const fetchActivities = async (): Promise<Kegiatan[]> => {
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
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal update progress");
    }
    return res.json();
};

// --- Helper Functions ---
const calculateActivityStatus = (kegiatan: Kegiatan): KegiatanWithDynamicStatus['dynamicStatus'] => {
    const warnings: string[] = [];
    const now = new Date();

    const checkTahapanWarning = (
        tanggalSelesai: string | undefined,
        tipeDokumen: Dokumen['tipe'],
        namaTahapan: string
    ) => {
        if (tanggalSelesai && isPast(parseISO(tanggalSelesai))) {
            const dokumenTahapan = kegiatan.dokumen.filter(d => d.tipe === tipeDokumen && d.isWajib);
            if (dokumenTahapan.length > 0 && !dokumenTahapan.every(d => d.status === 'Approved')) {
                warnings.push(`Laporan ${namaTahapan} terlambat disetujui`);
            }
        }
    };

    checkTahapanWarning(kegiatan.tanggalSelesaiPersiapan, 'persiapan', 'Persiapan');
    checkTahapanWarning(kegiatan.tanggalSelesaiPengumpulanData, 'pengumpulan-data', 'Pengumpulan Data');
    checkTahapanWarning(kegiatan.tanggalSelesaiPengolahanAnalisis, 'pengolahan-analisis', 'Pengolahan & Analisis');
    checkTahapanWarning(kegiatan.tanggalSelesaiDiseminasiEvaluasi, 'diseminasi-evaluasi', 'Diseminasi & Evaluasi');

    let status: Kegiatan['status'] = kegiatan.status;
    let color = 'bg-blue-100 text-blue-700';

    if (kegiatan.tanggalSelesaiDiseminasiEvaluasi && isPast(parseISO(kegiatan.tanggalSelesaiDiseminasiEvaluasi))) {
        status = 'Selesai';
    } else if (kegiatan.tanggalMulaiDiseminasiEvaluasi && now >= parseISO(kegiatan.tanggalMulaiDiseminasiEvaluasi)) {
        status = 'Diseminasi & Evaluasi';
    } else if (kegiatan.tanggalMulaiPengolahanAnalisis && now >= parseISO(kegiatan.tanggalMulaiPengolahanAnalisis)) {
        status = 'Pengolahan & Analisis';
    } else if (kegiatan.tanggalMulaiPengumpulanData && now >= parseISO(kegiatan.tanggalMulaiPengumpulanData)) {
        status = 'Pengumpulan Data';
    } else {
        status = 'Persiapan';
    }

    if ((status === 'Pengumpulan Data' || status === 'Pengolahan & Analisis') && differenceInDays(now, parseISO(kegiatan.lastUpdated)) > 2) {
        warnings.push(`Tidak ada pembaruan progress selama lebih dari 2 hari pada tahap ${status}.`);
    }

    switch (status) {
        case 'Pengumpulan Data': color = 'bg-yellow-100 text-yellow-700'; break;
        case 'Pengolahan & Analisis': color = 'bg-green-100 text-green-700'; break;
        case 'Diseminasi & Evaluasi': color = 'bg-indigo-100 text-indigo-700'; break;
        case 'Selesai': color = 'bg-purple-100 text-purple-700'; break;
    }

    return { status, color, warnings };
};


const getProgressBarValue = (ppl: PPLWithProgress) => {
    const totalBeban = parseInt(ppl.bebanKerja as any) || 0;
    if (totalBeban === 0) return 0;
    const approvedValue = ppl.tahap === 'pengolahan-analisis' ? (ppl.progress.clean ?? 0) : (ppl.progress.approved ?? 0);
    return ((approvedValue) / totalBeban) * 100;
};

const getRelativeTime = (dateString: string) => {
    if (!dateString) return "-";
    const date = parseISO(dateString);
    const now = new Date();
    const diffDays = differenceInDays(now, date);
  
    if (diffDays > 30) {
      return format(date, 'dd MMM yyyy', { locale: localeID });
    }
    return formatDistanceToNow(date, { addSuffix: true, locale: localeID });
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState<KegiatanWithDynamicStatus | null>(null);
  const [updateModalActivity, setUpdateModalActivity] = useState<KegiatanWithDynamicStatus | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<Kegiatan | null>(null);
  const [showProgressSuccessModal, setShowProgressSuccessModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [deletedActivityName, setDeletedActivityName] = useState("");
  const [localPplProgress, setLocalPplProgress] = useState<PPLWithProgress[]>([]);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [progressView, setProgressView] = useState<'pendataan' | 'pengolahan'>('pendataan');
  const [progressType, setProgressType] = useState<ProgressTypeFilter>('approved');
  const [pplSearchView, setPplSearchView] = useState("");
  const [pplSearchUpdate, setPplSearchUpdate] = useState("");
  const [warningModalContent, setWarningModalContent] = useState<{title: string; warnings: string[]} | null>(null);

  // --- Effect to sync filters ---
  useEffect(() => {
    if (progressView === 'pendataan') {
      if (progressType !== 'submit' && progressType !== 'approved') {
        setProgressType('approved');
      }
    } else if (progressView === 'pengolahan') {
        if (progressType !== 'sudah_entry' && progressType !== 'clean') {
            setProgressType('clean');
        }
    }
  }, [progressView, progressType]);

  const { data: activities = [], isLoading } = useQuery<Kegiatan[]>({ queryKey: ['kegiatan'], queryFn: fetchActivities });

  const processedActivities: KegiatanWithDynamicStatus[] = useMemo(() => {
    return activities.map(activity => ({
        ...activity,
        ppl: (activity.ppl || []).map(p => ({
            ...p,
            progress: {
                open: p.progress?.open ?? 0,
                submit: p.progress?.submit ?? 0,
                diperiksa: p.progress?.diperiksa ?? 0,
                approved: p.progress?.approved ?? 0,
                belum_entry: p.progress?.belum_entry ?? 0,
                sudah_entry: p.progress?.sudah_entry ?? 0,
                validasi: p.progress?.validasi ?? 0,
                clean: p.progress?.clean ?? 0,
            }
        })),
        dynamicStatus: calculateActivityStatus(activity),
    }));
  }, [activities]);

  const deleteMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
      setShowDeleteSuccessModal(true);
      setActivityToDelete(null);
    },
  });

  const progressMutation = useMutation({ 
    mutationFn: updatePplProgress, 
    onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: ['kegiatan'] }); 
    },
    onError: (error) => {
        setAlertModal({ isOpen: true, title: "Update Gagal", message: error.message });
        if (updateModalActivity) {
            setLocalPplProgress(JSON.parse(JSON.stringify(updateModalActivity.ppl || [])));
        }
    }
  });

  const filteredActivities = useMemo(() => {
    return processedActivities.filter(activity => {
        const { status, warnings } = activity.dynamicStatus;
        const matchesSearch = activity.namaKegiatan.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" ||
                                (statusFilter === "warning" ? warnings.length > 0 : status === statusFilter);
        return matchesSearch && matchesStatus;
    });
  }, [processedActivities, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const statusCounts = processedActivities.reduce((acc, act) => {
        const { status } = act.dynamicStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        totalKegiatan: processedActivities.length,
        persiapan: statusCounts['Persiapan'] || 0,
        pengumpulanData: statusCounts['Pengumpulan Data'] || 0,
        pengolahan: statusCounts['Pengolahan & Analisis'] || 0,
        diseminasi: statusCounts['Diseminasi & Evaluasi'] || 0,
        selesai: statusCounts['Selesai'] || 0,
        jumlahWarning: processedActivities.filter(a => a.dynamicStatus.warnings.length > 0).length,
    };
  }, [processedActivities]);

  const handleOpenUpdateModal = (activity: KegiatanWithDynamicStatus) => { setLocalPplProgress(JSON.parse(JSON.stringify(activity.ppl || []))); setUpdateModalActivity(activity); };

  const handleUpdatePPL = (pplId: number, field: EditableProgressKey, value: string) => {
    setLocalPplProgress(prev =>
        prev.map(p => {
            if (p.id !== pplId) return p;

            const updatedPpl = { ...p, progress: { ...p.progress } };
            const newValue = parseInt(value, 10);
            if (isNaN(newValue) || newValue < 0) {
                return p;
            }
            
            updatedPpl.progress[field] = newValue;
            
            const totalBeban = parseInt(updatedPpl.bebanKerja, 10) || 0;
            if (updatedPpl.tahap === 'pengumpulan-data') {
                const totalUsed = (updatedPpl.progress.submit ?? 0) + (updatedPpl.progress.diperiksa ?? 0) + (updatedPpl.progress.approved ?? 0);
                if (totalUsed > totalBeban) {
                    setAlertModal({ isOpen: true, title: "Validasi Gagal", message: "Total progress tidak boleh melebihi total beban kerja." });
                    return p;
                }
                updatedPpl.progress.open = totalBeban - totalUsed;
            } else if (updatedPpl.tahap === 'pengolahan-analisis') {
                const totalUsed = (updatedPpl.progress.sudah_entry ?? 0) + (updatedPpl.progress.validasi ?? 0) + (updatedPpl.progress.clean ?? 0);
                if (totalUsed > totalBeban) {
                    setAlertModal({ isOpen: true, title: "Validasi Gagal", message: "Total progress tidak boleh melebihi total beban kerja." });
                    return p;
                }
                updatedPpl.progress.belum_entry = totalBeban - totalUsed;
            }

            return updatedPpl;
        })
    );
  };

  const handleSaveProgress = () => {
    localPplProgress.forEach(ppl => {
      const originalPpl = updateModalActivity?.ppl.find(op => op.id === ppl.id);
      if (JSON.stringify(ppl.progress) !== JSON.stringify(originalPpl?.progress)) {
          progressMutation.mutate({
            pplId: ppl.id!,
            progressData: {
              ...ppl.progress,
              username: user?.username
            }
          });
      }
    });
    setUpdateModalActivity(null);
    setShowProgressSuccessModal(true);
  };

  const handleDeleteConfirm = () => {
    if (activityToDelete) {
        setDeletedActivityName(activityToDelete.namaKegiatan);
        deleteMutation.mutate(activityToDelete.id);
    }
  };

  const renderPPLProgress = (pplList: PPLWithProgress[], search: string) => (
    <div className="space-y-3">
        {pplList.filter(p => (p.namaPPL || '').toLowerCase().includes(search.toLowerCase())).map((ppl) => (
            <Card key={ppl.id}>
                <CardContent className="p-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                        {(ppl.namaPPL || 'P').split(' ').map((n: string) => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-medium text-slate-900">{ppl.namaPPL}</h4>
                                    <p className="text-sm text-slate-600">PML: {ppl.namaPML}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-bps-blue-600">{getProgressBarValue(ppl).toFixed(0)}%</div>
                                <div className="text-xs text-slate-500 -mt-1">Progress {ppl.tahap === 'pengolahan-analisis' ? 'Clean' : 'Approved'}</div>
                            </div>
                        </div>
                        
                        <div>
                            <Progress value={getProgressBarValue(ppl)} className="h-2" />
                            <div className="grid grid-cols-4 gap-2 text-center mt-2">
                            {ppl.tahap === 'pengumpulan-data' ? (
                                <>
                                    <div className="bg-blue-50 p-2 rounded"><div className="text-xs text-blue-600 font-medium">Open</div><div className="text-lg font-bold text-blue-800">{ppl.progress.open}</div></div>
                                    <div className="bg-yellow-50 p-2 rounded"><div className="text-xs text-yellow-600 font-medium">Submit</div><div className="text-lg font-bold text-yellow-800">{ppl.progress.submit}</div></div>
                                    <div className="bg-orange-50 p-2 rounded"><div className="text-xs text-orange-600 font-medium">Diperiksa</div><div className="text-lg font-bold text-orange-800">{ppl.progress.diperiksa}</div></div>
                                    <div className="bg-green-50 p-2 rounded"><div className="text-xs text-green-600 font-medium">Approved</div><div className="text-lg font-bold text-green-800">{ppl.progress.approved}</div></div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-slate-50 p-2 rounded"><div className="text-xs text-slate-600 font-medium">Belum Entry</div><div className="text-lg font-bold text-slate-800">{ppl.progress.belum_entry}</div></div>
                                    <div className="bg-blue-50 p-2 rounded"><div className="text-xs text-blue-600 font-medium">Dientry</div><div className="text-lg font-bold text-blue-800">{ppl.progress.sudah_entry}</div></div>
                                    <div className="bg-yellow-50 p-2 rounded"><div className="text-xs text-yellow-600 font-medium">Validasi</div><div className="text-lg font-bold text-yellow-800">{ppl.progress.validasi}</div></div>
                                    <div className="bg-green-50 p-2 rounded"><div className="text-xs text-green-600 font-medium">Clean</div><div className="text-lg font-bold text-green-800">{ppl.progress.clean}</div></div>
                                </>
                            )}
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t">
                            <span>Beban Kerja: {ppl.bebanKerja}</span>
                            <span>Honor: Rp {parseInt(ppl.besaranHonor).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}
        {pplList.filter((p: PPLWithProgress) => (p.namaPPL || '').toLowerCase().includes(search.toLowerCase())).length === 0 && (
            <div className="text-center py-8 text-slate-500">
                <p>{pplList.length === 0 ? "Belum ada PPL yang dialokasikan untuk tahap ini." : "PPL tidak ditemukan."}</p>
            </div>
        )}
    </div>
  );

  const renderPPLUpdate = (pplList: PPLWithProgress[], search: string) => (
    <div className="space-y-4">
        {pplList.filter(p => (p.namaPPL || '').toLowerCase().includes(search.toLowerCase())).map(ppl => (
            <PPLUpdateCard key={ppl.id} ppl={ppl} handleUpdatePPL={handleUpdatePPL} />
        ))}
        {pplList.filter(p => (p.namaPPL || '').toLowerCase().includes(search.toLowerCase())).length === 0 && (
            <p className="text-center text-gray-500 py-4">
                {pplList.length === 0 ? "Tidak ada alokasi PPL untuk tahap ini." : "PPL tidak ditemukan."}
            </p>
        )}
    </div>
  );

  const PPLUpdateCard = ({ ppl, handleUpdatePPL }: { ppl: PPLWithProgress, handleUpdatePPL: (pplId: number, field: EditableProgressKey, value: string) => void }) => {
      const honorListing = ppl.honorarium?.find(h => h.jenis_pekerjaan === 'listing');
      const honorPencacahan = ppl.honorarium?.find(h => h.jenis_pekerjaan === 'pencacahan');
  
      const [listingProgress, setListingProgress] = useState({ submit: ppl.progress.submit ?? 0, diperiksa: ppl.progress.diperiksa ?? 0, approved: ppl.progress.approved ?? 0 });
      const [pencacahanProgress, setPencacahanProgress] = useState({ submit: ppl.progress.submit ?? 0, diperiksa: ppl.progress.diperiksa ?? 0, approved: ppl.progress.approved ?? 0 });
  
      const handleSeparateProgressChange = (
          type: 'listing' | 'pencacahan',
          field: 'submit' | 'diperiksa' | 'approved',
          value: string
      ) => {
          const numericValue = parseInt(value) || 0;
          let newListingProgress = { ...listingProgress };
          let newPencacahanProgress = { ...pencacahanProgress };
  
          if (type === 'listing') {
              newListingProgress[field] = numericValue;
              setListingProgress(newListingProgress);
          } else {
              newPencacahanProgress[field] = numericValue;
              setPencacahanProgress(newPencacahanProgress);
          }
  
          const totalValue = newListingProgress[field] + newPencacahanProgress[field];
          handleUpdatePPL(ppl.id!, field, String(totalValue));
      };
  
    return (
        <Card key={ppl.id}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                                {(ppl.namaPPL || 'P').split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h4 className="font-medium text-slate-900">{ppl.namaPPL}</h4>
                            <p className="text-sm text-slate-600">PML: {ppl.namaPML}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-bps-blue-600">{getProgressBarValue(ppl).toFixed(0)}%</div>
                        <div className="text-xs text-slate-500 -mt-1">Approved</div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {ppl.tahap === 'pengumpulan-data' && (
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Label className="text-sm font-medium text-blue-900 mb-2 block">Progress Listing (Target: {honorListing?.bebanKerja || 0})</Label>
                            <div className="grid grid-cols-4 gap-3">
                                <div><Label className="text-xs text-slate-600">Open</Label><Input type="number" value={(parseInt(honorListing?.bebanKerja || '0')) - (listingProgress.submit + listingProgress.diperiksa + listingProgress.approved)} disabled className="mt-1 text-center bg-slate-100"/></div>
                                {(['submit', 'diperiksa', 'approved'] as const).map(field => (<div key={`listing-${field}`}><Label className="text-xs text-slate-600 capitalize">{field}</Label><Input type="number" min="0" value={listingProgress[field]} onChange={e => handleSeparateProgressChange('listing', field, e.target.value)} className="mt-1 text-center" /></div>))}
                            </div>
                            <Progress value={((listingProgress.approved / (parseInt(honorListing?.bebanKerja || '1')) * 100))} className="h-2 mt-2" />
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <Label className="text-sm font-medium text-green-900 mb-2 block">Progress Pencacahan (Target: {honorPencacahan?.bebanKerja || 0})</Label>
                            <div className="grid grid-cols-4 gap-3">
                                <div><Label className="text-xs text-slate-600">Open</Label><Input type="number" value={(parseInt(honorPencacahan?.bebanKerja || '0')) - (pencacahanProgress.submit + pencacahanProgress.diperiksa + pencacahanProgress.approved)} disabled className="mt-1 text-center bg-slate-100"/></div>
                                {(['submit', 'diperiksa', 'approved'] as const).map(field => (<div key={`pencacahan-${field}`}><Label className="text-xs text-slate-600 capitalize">{field}</Label><Input type="number" min="0" value={pencacahanProgress[field]} onChange={e => handleSeparateProgressChange('pencacahan', field, e.target.value)} className="mt-1 text-center" /></div>))}
                            </div>
                            <Progress value={((pencacahanProgress.approved / (parseInt(honorPencacahan?.bebanKerja || '1')) * 100))} className="h-2 mt-2" />
                        </div>
                    </div>
                )}

                {ppl.tahap === 'pengolahan-analisis' && (
                    <div className="p-3 bg-purple-50 rounded-lg">
                        <Label className="text-sm font-medium text-purple-900 mb-2 block">Progress Pengolahan (Beban: {ppl.bebanKerja})</Label>
                        <div className="grid grid-cols-4 gap-3">
                            <div><Label className="text-xs text-slate-600">Belum Entry</Label><Input type="number" value={ppl.progress.belum_entry} disabled className="mt-1 text-center bg-slate-100"/></div>
                            {(['sudah_entry', 'validasi', 'clean'] as const).map(field => (
                                <div key={field}>
                                    <Label className="text-xs text-slate-600 capitalize">{field === 'sudah_entry' ? 'Dientry' : field}</Label>
                                    <Input type="number" min="0" value={ppl.progress[field]} onChange={e => handleUpdatePPL(ppl.id!, field, e.target.value)} className="mt-1 text-center" />
                                </div>
                            ))}
                        </div>
                        <Progress value={getProgressBarValue(ppl)} className="h-2 mt-2" />
                    </div>
                )}
            </CardContent>
        </Card>
    )}

  if (isLoading) return <Layout><div className="text-center p-8">Memuat...</div></Layout>;

    return (
        <Layout>
            <div className="space-y-8">
                <div><h1 className="text-3xl font-bold">Dashboard Monitoring</h1><p className="text-gray-600 mt-1">Pantau progress dan kelola semua kegiatan</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
                    <Card className="border-l-4 border-l-bps-blue-500"><CardContent className="p-6"><div className="flex justify-between items-center"><div><p className="text-sm font-medium">Total Kegiatan</p><p className="text-2xl font-bold">{stats.totalKegiatan}</p></div><Activity className="w-8 h-8 text-bps-blue-500"/></div></CardContent></Card>
                    <Card className="border-l-4 border-l-blue-500"><CardContent className="p-6"><div className="flex justify-between items-center"><div><p className="text-sm font-medium">Persiapan</p><p className="text-2xl font-bold">{stats.persiapan}</p></div><BookOpen className="w-8 h-8 text-blue-500"/></div></CardContent></Card>
                    <Card className="border-l-4 border-l-yellow-500"><CardContent className="p-6"><div className="flex justify-between items-center"><div><p className="text-sm font-medium">Pengumpulan Data</p><p className="text-2xl font-bold">{stats.pengumpulanData}</p></div><Users className="w-8 h-8 text-yellow-500"/></div></CardContent></Card>
                    <Card className="border-l-4 border-l-green-500"><CardContent className="p-6"><div className="flex justify-between items-center"><div><p className="text-sm font-medium">Pengolahan</p><p className="text-2xl font-bold">{stats.pengolahan}</p></div><BarChart className="w-8 h-8 text-green-500"/></div></CardContent></Card>
                    <Card className="border-l-4 border-l-indigo-500"><CardContent className="p-6"><div className="flex justify-between items-center"><div><p className="text-sm font-medium">Diseminasi</p><p className="text-2xl font-bold">{stats.diseminasi}</p></div><Send className="w-8 h-8 text-indigo-500"/></div></CardContent></Card>
                    <Card className="border-l-4 border-l-purple-500"><CardContent className="p-6"><div className="flex justify-between items-center"><div><p className="text-sm font-medium">Selesai</p><p className="text-2xl font-bold">{stats.selesai}</p></div><CheckSquare className="w-8 h-8 text-purple-500"/></div></CardContent></Card>
                    <Card className="border-l-4 border-l-red-500"><CardContent className="p-6"><div className="flex justify-between items-center"><div><p className="text-sm font-medium">Jumlah Warning</p><p className="text-2xl font-bold">{stats.jumlahWarning}</p></div><AlertTriangle className="w-8 h-8 text-red-500"/></div></CardContent></Card>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 bg-white p-6 rounded-lg border">
                    <div className="flex-1">
                        <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">Cari Kegiatan</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input id="search" type="text" placeholder="Cari nama kegiatan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="sm:w-48">
                            <Label htmlFor="progress-type" className="text-sm font-medium text-gray-700 mb-2 block">Tipe Progress</Label>
                            <Select value={progressType} onValueChange={(v) => setProgressType(v as ProgressTypeFilter)}>
                                <SelectTrigger>
                                    <ClipboardCheck className="w-4 h-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {progressView === 'pendataan' ? (
                                        <>
                                            <SelectItem value="submit">Submit</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                        </>
                                    ) : (
                                        <>
                                            <SelectItem value="sudah_entry">Dientry</SelectItem>
                                            <SelectItem value="clean">Clean</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="sm:w-48">
                            <Label htmlFor="progress-view" className="text-sm font-medium text-gray-700 mb-2 block">Tahap Progress</Label>
                            <Select value={progressView} onValueChange={(v) => setProgressView(v as 'pendataan' | 'pengolahan')}>
                                <SelectTrigger>
                                    <Layers className="w-4 h-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pendataan">Pendataan</SelectItem>
                                    <SelectItem value="pengolahan">Pengolahan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="sm:w-64">
                            <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mb-2 block">Filter Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="Persiapan">Persiapan</SelectItem>
                                    <SelectItem value="Pengumpulan Data">Pengumpulan Data</SelectItem>
                                    <SelectItem value="Pengolahan & Analisis">Pengolahan & Analisis</SelectItem>
                                    <SelectItem value="Diseminasi & Evaluasi">Diseminasi & Evaluasi</SelectItem>
                                    <SelectItem value="Selesai">Selesai</SelectItem>
                                    <SelectItem value="warning">Ada Warning</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredActivities.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                    <div className="text-gray-400 mb-4"><Activity className="w-16 h-16 mx-auto" /></div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada kegiatan ditemukan</h3>
                    <p className="text-gray-500">{searchTerm ? `Tidak ada kegiatan yang cocok dengan "${searchTerm}"` : 'Tidak ada kegiatan dengan filter yang dipilih'}</p>
                    </div>
                ) : (
                    filteredActivities.map((activity) => {
                    const { status, color, warnings } = activity.dynamicStatus;
                    
                    let progressValue = 0;
                    if (progressView === 'pendataan') {
                        progressValue = progressType === 'submit' 
                            ? activity.progressPendataanSubmit 
                            : activity.progressPendataanApproved;
                    } else { // pengolahan
                        progressValue = progressType === 'sudah_entry' 
                            ? activity.progressPengolahanSubmit
                            : activity.progressPengolahanApproved;
                    }

                    const progressLabel = `Progress ${progressView === 'pendataan' ? 'Pendataan' : 'Pengolahan'} (${
                        progressType === 'submit' ? 'Submit' : 
                        progressType === 'approved' ? 'Approved' :
                        progressType === 'sudah_entry' ? 'Dientry' : 'Clean'
                    })`;


                    const getStageDates = () => {
                        const formatDate = (dateString?: string) => dateString ? format(new Date(dateString), 'dd MMM yyyy', { locale: localeID }) : '-';
                        let stageLabel = "Persiapan";
                        let startDate = activity.tanggalMulaiPersiapan;
                        let endDate = activity.tanggalSelesaiPersiapan;

                        switch (status) {
                            case 'Pengumpulan Data':
                                stageLabel = "Pengumpulan Data";
                                startDate = activity.tanggalMulaiPengumpulanData;
                                endDate = activity.tanggalSelesaiPengumpulanData;
                                break;
                            case 'Pengolahan & Analisis':
                                stageLabel = "Pengolahan & Analisis";
                                startDate = activity.tanggalMulaiPengolahanAnalisis;
                                endDate = activity.tanggalSelesaiPengolahanAnalisis;
                                break;
                            case 'Diseminasi & Evaluasi':
                                stageLabel = "Diseminasi & Evaluasi";
                                startDate = activity.tanggalMulaiDiseminasiEvaluasi;
                                endDate = activity.tanggalSelesaiDiseminasiEvaluasi;
                                break;
                            case 'Selesai':
                                return (
                                    <div><p className="text-gray-500">Selesai Pada</p><p className="font-medium">{formatDate(activity.tanggalSelesaiDiseminasiEvaluasi)}</p></div>
                                );
                        }
                        return (
                            <>
                                <div><p className="text-gray-500">Mulai {stageLabel}</p><p className="font-medium">{formatDate(startDate)}</p></div>
                                <div><p className="text-gray-500">Selesai {stageLabel}</p><p className="font-medium">{formatDate(endDate)}</p></div>
                            </>
                        );
                    };

                    return (
                        <Card key={activity.id} className="hover:shadow-lg transition-shadow flex flex-col">
                            <CardHeader className="pb-3"><div className="flex items-start justify-between"><div className="flex-1"><CardTitle className="text-lg leading-tight">{activity.namaKegiatan}</CardTitle><p className="text-sm text-gray-600 mt-1">Ketua: {activity.namaKetua}</p></div><Badge className={cn("ml-2 whitespace-nowrap", warnings.length > 0 ? 'bg-red-100 text-red-700' : color)}>{warnings.length > 0 ? 'Warning' : status}</Badge></div></CardHeader>
                            <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium">{progressLabel}</span><span className="text-sm font-bold text-bps-blue-600">{progressValue || 0}%</span></div>
                                    <Progress value={progressValue || 0} className="h-2" />
                                    <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                        {getStageDates()}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-2"><span>Edit:</span><span className="font-medium text-bps-blue-600">{getRelativeTime(activity.lastEdited || activity.lastUpdated)}</span>{activity.lastEditedBy && (<><span>oleh</span><span className="font-medium text-bps-blue-600">{activity.lastEditedBy}</span></>)}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><span>Update:</span><span className="font-medium text-bps-blue-600">{getRelativeTime(activity.lastUpdated)}</span>{activity.lastUpdatedBy && (<><span>oleh</span><span className="font-medium text-bps-blue-600">{activity.lastUpdatedBy}</span></>)}</div>
                                    {warnings.length > 0 && (
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto text-red-600 text-xs mt-2"
                                            onClick={() => setWarningModalContent({ title: activity.namaKegiatan, warnings })}
                                        >
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            Lihat {warnings.length} Peringatan
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-4 border-t mt-4">
                                    <Button variant="outline" size="sm" onClick={() => { setSelectedActivity(activity); setPplSearchView(""); }}><Eye className="w-4 h-4 mr-1" />Lihat</Button>
                                    <Button variant="outline" size="sm" asChild><Link to={`/edit-activity/${activity.id}`}><Edit className="w-4 h-4 mr-1" />Edit</Link></Button>
                                    <Button variant="outline" size="sm" onClick={() => { handleOpenUpdateModal(activity); setPplSearchUpdate(""); }}><RefreshCw className="w-4 h-4 mr-1" />Update</Button>
                                    <Button variant="outline" size="sm" asChild><Link to={`/view-documents/${activity.id}`}><FileText className="w-4 h-4 mr-1" />View Docs</Link></Button>
                                    {user?.role === 'admin' && (
                                        <Button variant="destructive" size="sm" onClick={() => setActivityToDelete(activity)} className="col-span-2"><Trash2 className="w-4 h-4 mr-1" />Hapus</Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )})
                )}
                </div>

                <Dialog open={!!selectedActivity} onOpenChange={(isOpen) => { if (!isOpen) setSelectedActivity(null); }}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Detail Kegiatan: {selectedActivity?.namaKegiatan}</DialogTitle></DialogHeader>
                        {selectedActivity && (
                            <div className="space-y-6 p-4">
                                <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Informasi Kegiatan</h4>
                                    <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">Nama Kegiatan:</span><span className="font-medium text-right max-w-xs">{selectedActivity.namaKegiatan}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Ketua Tim:</span><span className="font-medium">{selectedActivity.namaKetua}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-gray-500">Status:</span><Badge className={cn(selectedActivity.dynamicStatus.color)}>{selectedActivity.dynamicStatus.status}</Badge></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Terakhir Update:</span><span className="font-medium text-bps-blue-600">{getRelativeTime(selectedActivity.lastUpdated)}</span></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Jadwal Lengkap Kegiatan</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">Persiapan:</span><span className="font-medium">{selectedActivity.tanggalMulaiPersiapan ? `${format(new Date(selectedActivity.tanggalMulaiPersiapan), 'dd MMM yyyy', { locale: localeID })} - ${format(new Date(selectedActivity.tanggalSelesaiPersiapan!), 'dd MMM yyyy', { locale: localeID })}` : '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Pengumpulan Data:</span><span className="font-medium">{selectedActivity.tanggalMulaiPengumpulanData ? `${format(new Date(selectedActivity.tanggalMulaiPengumpulanData), 'dd MMM yyyy', { locale: localeID })} - ${format(new Date(selectedActivity.tanggalSelesaiPengumpulanData!), 'dd MMM yyyy', { locale: localeID })}` : '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Pengolahan & Analisis:</span><span className="font-medium">{selectedActivity.tanggalMulaiPengolahanAnalisis ? `${format(new Date(selectedActivity.tanggalMulaiPengolahanAnalisis), 'dd MMM yyyy', { locale: localeID })} - ${format(new Date(selectedActivity.tanggalSelesaiPengolahanAnalisis!), 'dd MMM yyyy', { locale: localeID })}` : '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Diseminasi & Evaluasi:</span><span className="font-medium">{selectedActivity.tanggalMulaiDiseminasiEvaluasi ? `${format(new Date(selectedActivity.tanggalMulaiDiseminasiEvaluasi), 'dd MMM yyyy', { locale: localeID })} - ${format(new Date(selectedActivity.tanggalSelesaiDiseminasiEvaluasi!), 'dd MMM yyyy', { locale: localeID })}` : '-'}</span></div>
                                    </div>
                                </div>
                                </div>
                                <div className="min-w-0"><h4 className="font-semibold text-gray-900 mb-2">Deskripsi Kegiatan</h4><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words">{selectedActivity.deskripsiKegiatan}</p></div>
                                <div>
                                <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold text-gray-900">Progress PPL</h4>
                                    <div className="w-64">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input type="text" placeholder="Cari nama PPL..." value={pplSearchView} onChange={(e) => setPplSearchView(e.target.value)} className="pl-10 h-8 text-sm" />
                                        </div>
                                    </div>
                                </div>
                                    <Tabs defaultValue="pengumpulan-data">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="pengumpulan-data">Pengumpulan Data</TabsTrigger>
                                        <TabsTrigger value="pengolahan-analisis">Pengolahan & Analisis</TabsTrigger>
                                    </TabsList>
                                    <div className="mt-4 max-h-[40vh] overflow-y-auto pr-2">
                                        <TabsContent value="pengumpulan-data">{renderPPLProgress(selectedActivity.ppl.filter(p => p.tahap === 'pengumpulan-data') as PPLWithProgress[], pplSearchView)}</TabsContent>
                                        <TabsContent value="pengolahan-analisis">{renderPPLProgress(selectedActivity.ppl.filter(p => p.tahap === 'pengolahan-analisis') as PPLWithProgress[], pplSearchView)}</TabsContent>
                                    </div>
                                </Tabs>
                                </div>
                                {selectedActivity.dynamicStatus.warnings.length > 0 && (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <h4 className="font-semibold text-yellow-900 mb-2 flex items-center"><AlertTriangle className="w-5 h-5 mr-2"/> Peringatan Terdeteksi</h4>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                                            {selectedActivity.dynamicStatus.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog open={!!updateModalActivity} onOpenChange={(isOpen) => { if (!isOpen) setUpdateModalActivity(null); }}>
                    <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                        <DialogHeader><DialogTitle>Update Progress: {updateModalActivity?.namaKegiatan}</DialogTitle></DialogHeader>
                        {updateModalActivity && (
                            <div className="flex-grow overflow-hidden flex flex-col">
                                <Tabs defaultValue="pengumpulan-data" className="flex-grow flex flex-col overflow-hidden">
                                    <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                                        <TabsTrigger value="pengumpulan-data">Pengumpulan Data</TabsTrigger>
                                        <TabsTrigger value="pengolahan-analisis">Pengolahan & Analisis</TabsTrigger>
                                    </TabsList>
                                    <div className="relative mt-4 flex-shrink-0">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input type="text" placeholder="Cari nama PPL..." value={pplSearchUpdate} onChange={(e) => setPplSearchUpdate(e.target.value)} className="pl-10 mb-4 h-8 text-sm" />
                                    </div>
                                    <div className="overflow-y-auto flex-grow pr-2">
                                        <TabsContent value="pengumpulan-data">{renderPPLUpdate(localPplProgress.filter(p => p.tahap === 'pengumpulan-data'), pplSearchUpdate)}</TabsContent>
                                        <TabsContent value="pengolahan-analisis">{renderPPLUpdate(localPplProgress.filter(p => p.tahap === 'pengolahan-analisis'), pplSearchUpdate)}</TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        )}
                        <DialogFooter className="pt-4 border-t mt-4 flex-shrink-0">
                            <Button onClick={handleSaveProgress}>Simpan Progress</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={!!warningModalContent} onOpenChange={() => setWarningModalContent(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Peringatan untuk: {warningModalContent?.title}</DialogTitle>
                            <DialogDescription>
                                Berikut adalah daftar peringatan yang terdeteksi untuk kegiatan ini.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 space-y-2">
                            {warningModalContent?.warnings.map((warning: string, index: number) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                    <AlertTriangle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                                    <span className="text-red-800 text-sm">{warning}</span>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

                <ConfirmationModal isOpen={!!activityToDelete} onConfirm={handleDeleteConfirm} onClose={() => setActivityToDelete(null)} title="Konfirmasi Hapus" description={`Yakin ingin menghapus "${activityToDelete?.namaKegiatan}"?`} />
                <SuccessModal isOpen={showProgressSuccessModal} onClose={() => setShowProgressSuccessModal(false)} title="Progress Berhasil Diperbarui!" autoCloseDelay={2000} />
                <SuccessModal isOpen={showDeleteSuccessModal} onClose={() => setShowDeleteSuccessModal(false)} title="Kegiatan Berhasil Dihapus!" description={`Kegiatan "${deletedActivityName}" telah berhasil dihapus dari sistem.`} autoCloseDelay={2000} />
                <AlertModal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ isOpen: false, title: "", message: "" })} title={alertModal.title} description={alertModal.message} />
            </div>
        </Layout>
    );
}