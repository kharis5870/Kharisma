import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Edit, RefreshCw, Trash2, FileCheck, Users, Calendar, Activity, Upload, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityData {
  id: string;
  namaKegiatan: string;
  ketuaTim: string;
  progressKeseluruhan: number;
  status: 'Planning' | 'Training' | 'Data Collection' | 'Review' | 'Completed';
  tanggalMulai: string;
  tanggalSelesai: string;
  tanggalSelesaiPelatihan: string;
  tanggalSelesaiPendataan: string;
  timKerja: string;
  tipeKegiatan: string;
  lastUpdated: string;
  pplData: {
    nama: string;
    pml: string;
    bebanKerja: number;
    honor: number;
    progressData: {
      open: number;
      submit: number;
      diperiksa: number;
      approved: number;
    };
  }[];
  documents: {
    nama: string;
    status: 'Pending' | 'Reviewed' | 'Approved';
    uploadedAt?: string;
  }[];
  reports: {
    pelatihanReport: {
      uploaded: boolean;
      deadline: string;
      uploadedAt?: string;
      isOverdue: boolean;
    };
    pendataanReport: {
      uploaded: boolean;
      deadline: string;
      uploadedAt?: string;
      isOverdue: boolean;
    };
  };
}

const mockActivities: ActivityData[] = [
  {
    id: "1",
    namaKegiatan: "Sensus Penduduk Tahun 2024",
    ketuaTim: "Dr. Ahmad Surya",
    progressKeseluruhan: 75,
    status: 'Data Collection',
    tanggalMulai: "2024-01-15",
    tanggalSelesai: "2024-03-30",
    tanggalSelesaiPelatihan: "2024-01-20",
    tanggalSelesaiPendataan: "2024-03-25",
    timKerja: "Tim terdiri dari 12 enumerator yang dibagi menjadi 4 sub-tim dengan area coverage masing-masing",
    tipeKegiatan: "Sensus Penduduk",
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    pplData: [
      {
        nama: "Budi Santoso",
        pml: "Siti Rahma",
        bebanKerja: 120,
        honor: 2400000,
        progressData: { open: 0, submit: 0, diperiksa: 0, approved: 120 }
      },
      {
        nama: "Rina Kartika",
        pml: "Hendra Wijaya",
        bebanKerja: 95,
        honor: 1900000,
        progressData: { open: 15, submit: 20, diperiksa: 60, approved: 0 }
      },
      {
        nama: "Dedi Kurniawan",
        pml: "Ahmad Fauzi",
        bebanKerja: 110,
        honor: 2200000,
        progressData: { open: 40, submit: 70, diperiksa: 0, approved: 0 }
      },
    ],
    documents: [
      { nama: "Proposal Kegiatan", status: 'Approved', uploadedAt: "2024-01-10" },
      { nama: "Daftar Enumerator", status: 'Reviewed', uploadedAt: "2024-01-12" },
      { nama: "Peta Wilayah", status: 'Pending' },
    ],
    reports: {
      pelatihanReport: {
        uploaded: true,
        deadline: "2024-01-23",
        uploadedAt: "2024-01-22",
        isOverdue: false
      },
      pendataanReport: {
        uploaded: false,
        deadline: "2024-04-01",
        isOverdue: false
      }
    }
  },
  {
    id: "2",
    namaKegiatan: "Survei Ekonomi Rumah Tangga",
    ketuaTim: "Dra. Siti Rahma",
    progressKeseluruhan: 40,
    status: 'Training',
    tanggalMulai: "2024-02-01",
    tanggalSelesai: "2024-04-15",
    tanggalSelesaiPelatihan: "2024-02-10",
    tanggalSelesaiPendataan: "2024-04-10",
    timKerja: "Tim survei dengan 8 petugas lapangan dan 2 supervisor untuk wilayah urban dan rural",
    tipeKegiatan: "Survei Ekonomi",
    lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    pplData: [
      {
        nama: "Agus Priyanto",
        pml: "Wulan Sari",
        bebanKerja: 80,
        honor: 1600000,
        progressData: { open: 80, submit: 0, diperiksa: 0, approved: 0 }
      },
      {
        nama: "Maya Indira",
        pml: "Rizky Pratama",
        bebanKerja: 85,
        honor: 1700000,
        progressData: { open: 65, submit: 20, diperiksa: 0, approved: 0 }
      },
    ],
    documents: [
      { nama: "Kuesioner Survei", status: 'Approved', uploadedAt: "2024-01-25" },
      { nama: "Manual Enumerator", status: 'Reviewed', uploadedAt: "2024-01-28" },
    ],
    reports: {
      pelatihanReport: {
        uploaded: false,
        deadline: "2024-02-13",
        isOverdue: true
      },
      pendataanReport: {
        uploaded: false,
        deadline: "2024-04-17",
        isOverdue: false
      }
    }
  },
  {
    id: "3",
    namaKegiatan: "Pendataan Potensi Desa",
    ketuaTim: "M. Budi Santoso, S.St",
    progressKeseluruhan: 90,
    status: 'Review',
    tanggalMulai: "2023-12-01",
    tanggalSelesai: "2024-02-28",
    tanggalSelesaiPelatihan: "2023-12-10",
    tanggalSelesaiPendataan: "2024-02-20",
    timKerja: "Tim pendataan desa dengan koordinator kecamatan dan petugas desa",
    tipeKegiatan: "Survei Sosial",
    lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    pplData: [
      {
        nama: "Lina Marlina",
        pml: "Budi Hermawan",
        bebanKerja: 150,
        honor: 3000000,
        progressData: { open: 0, submit: 0, diperiksa: 0, approved: 150 }
      },
      {
        nama: "Dian Pratiwi",
        pml: "Eko Susanto",
        bebanKerja: 140,
        honor: 2800000,
        progressData: { open: 0, submit: 0, diperiksa: 0, approved: 140 }
      },
    ],
    documents: [
      { nama: "Formulir Podes", status: 'Approved', uploadedAt: "2023-11-25" },
      { nama: "Laporan Hasil", status: 'Approved', uploadedAt: "2024-02-25" },
      { nama: "Dokumentasi Foto", status: 'Reviewed', uploadedAt: "2024-02-26" },
    ],
    reports: {
      pelatihanReport: {
        uploaded: true,
        deadline: "2023-12-13",
        uploadedAt: "2023-12-12",
        isOverdue: false
      },
      pendataanReport: {
        uploaded: true,
        deadline: "2024-02-27",
        uploadedAt: "2024-02-26",
        isOverdue: false
      }
    }
  }
];

export default function Dashboard() {
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [editingProgress, setEditingProgress] = useState<{ pplIndex: number; field: string; value: number } | null>(null);
  const [activities, setActivities] = useState<ActivityData[]>(mockActivities);
  const [showProgressSuccessModal, setShowProgressSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<ActivityData | null>(null);

  const getStatusColor = (status: ActivityData['status']) => {
    switch (status) {
      case 'Planning': return 'bg-gray-100 text-gray-700';
      case 'Training': return 'bg-blue-100 text-blue-700';
      case 'Data Collection': return 'bg-yellow-100 text-yellow-700';
      case 'Review': return 'bg-orange-100 text-orange-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getProgressBarValue = (progressData: any) => {
    const total = progressData.open + progressData.submit + progressData.diperiksa + progressData.approved;
    return total > 0 ? (progressData.approved / total) * 100 : 0;
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-red-100 text-red-700';
      case 'Reviewed': return 'bg-yellow-100 text-yellow-700';
      case 'Approved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleEdit = (activity: ActivityData) => {
    alert(`Mengedit kegiatan: ${activity.namaKegiatan}`);
  };

  const handleUpdate = (activity: ActivityData) => {
    alert(`Memperbarui progress: ${activity.namaKegiatan}`);
  };

  const handleDelete = (activity: ActivityData) => {
    setActivityToDelete(activity);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (activityToDelete) {
      // Remove activity from state
      setActivities(prev => prev.filter(activity => activity.id !== activityToDelete.id));
      alert(`Kegiatan "${activityToDelete.namaKegiatan}" berhasil dihapus dari sistem.`);
      setActivityToDelete(null);
    }
  };

  const handleDocumentReview = (docName: string) => {
    alert(`Memeriksa dokumen: ${docName}`);
  };

  const handleApproveDocument = (docName: string) => {
    if (confirm(`Approve dokumen: ${docName}?`)) {
      alert(`Dokumen disetujui: ${docName}`);
    }
  };


  const [updateModalActivity, setUpdateModalActivity] = useState<ActivityData | null>(null);

  const handleUpdateProgress = (activity: ActivityData) => {
    setUpdateModalActivity(activity);
  };

  const updatePPLProgress = (activityId: string, pplIndex: number, field: string, newValue: number) => {
    setActivities(prev => prev.map(activity => {
      if (activity.id === activityId) {
        const updatedPPLData = [...activity.pplData];
        const ppl = updatedPPLData[pplIndex];
        const oldValue = ppl.progressData[field as keyof typeof ppl.progressData];

        // Update the field
        updatedPPLData[pplIndex] = {
          ...ppl,
          progressData: {
            ...ppl.progressData,
            [field]: newValue
          }
        };

        // Auto-adjust other fields based on business logic
        if (field === 'submit' && newValue > oldValue) {
          const increase = newValue - oldValue;
          updatedPPLData[pplIndex].progressData.open = Math.max(0, ppl.progressData.open - increase);
        }

        const updatedActivity = {
          ...activity,
          pplData: updatedPPLData,
          lastUpdated: new Date().toISOString()
        };

        // Update selected activity if it's the same one
        if (selectedActivity?.id === activityId) {
          setSelectedActivity(updatedActivity);
        }

        // Update update modal activity if it's the same one
        if (updateModalActivity?.id === activityId) {
          setUpdateModalActivity(updatedActivity);
        }

        return updatedActivity;
      }
      return activity;
    }));
  };

  const isReportOverdue = (deadline: string, uploaded: boolean) => {
    if (uploaded) return false;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return now > deadlineDate;
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
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`;

    return date.toLocaleDateString('id-ID');
  };

  const stats = {
    totalKegiatan: mockActivities.length,
    kegiatanAktif: mockActivities.filter(a => ['Training', 'Data Collection'].includes(a.status)).length,
    kegiatanSelesai: mockActivities.filter(a => a.status === 'Completed').length,
    rataRataProgress: Math.round(mockActivities.reduce((acc, act) => acc + act.progressKeseluruhan, 0) / mockActivities.length)
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Monitoring</h1>
            <p className="text-gray-600 mt-1">Pantau progress dan kelola semua kegiatan</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-bps-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Kegiatan</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalKegiatan}</p>
                </div>
                <Activity className="w-8 h-8 text-bps-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-bps-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kegiatan Aktif</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.kegiatanAktif}</p>
                </div>
                <Users className="w-8 h-8 text-bps-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-bps-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kegiatan Selesai</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.kegiatanSelesai}</p>
                </div>
                <FileCheck className="w-8 h-8 text-bps-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rata-rata Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rataRataProgress}%</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight">{activity.namaKegiatan}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Ketua: {activity.ketuaTim}</p>
                  </div>
                  <Badge className={cn("ml-2", getStatusColor(activity.status))}>
                    {activity.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress Keseluruhan</span>
                    <span className="text-sm font-bold text-bps-blue-600">{activity.progressKeseluruhan}%</span>
                  </div>
                  <Progress value={activity.progressKeseluruhan} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Mulai</p>
                    <p className="font-medium">{new Date(activity.tanggalMulai).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Selesai</p>
                    <p className="font-medium">{new Date(activity.tanggalSelesai).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <span>Terakhir diupdate:</span>
                  <span className="font-medium text-bps-blue-600">{getRelativeTime(activity.lastUpdated)}</span>
                </div>

                {/* Report Deadline Warnings */}
                {(activity.reports.pelatihanReport.isOverdue || activity.reports.pendataanReport.isOverdue) && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span className="text-red-700">
                      {activity.reports.pelatihanReport.isOverdue && "Laporan pelatihan terlambat"}
                      {activity.reports.pelatihanReport.isOverdue && activity.reports.pendataanReport.isOverdue && " & "}
                      {activity.reports.pendataanReport.isOverdue && "Laporan pendataan terlambat"}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedActivity(activity)}
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Lihat
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detail Kegiatan: {selectedActivity?.namaKegiatan}</DialogTitle>
                      </DialogHeader>
                      
                      {selectedActivity && (
                        <div className="space-y-6">
                          {/* Simplified Overview Only */}
                          <div className="space-y-4">
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
                                    <Badge className={cn(getStatusColor(selectedActivity.status))}>
                                      {selectedActivity.status}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Terakhir Update:</span>
                                    <span className="font-medium text-bps-blue-600">{getRelativeTime(selectedActivity.lastUpdated)}</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Progress Keseluruhan</h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Progress</span>
                                    <span className="text-lg font-bold text-bps-blue-600">{selectedActivity.progressKeseluruhan}%</span>
                                  </div>
                                  <Progress value={selectedActivity.progressKeseluruhan} className="h-3" />

                                  <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                    <div>
                                      <span className="text-gray-500">Tanggal Mulai:</span>
                                      <p className="font-medium">{new Date(selectedActivity.tanggalMulai).toLocaleDateString('id-ID')}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Tanggal Selesai:</span>
                                      <p className="font-medium">{new Date(selectedActivity.tanggalSelesai).toLocaleDateString('id-ID')}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Tim Kerja</h4>
                              <p className="text-sm text-gray-600 leading-relaxed">{selectedActivity.timKerja}</p>
                            </div>

                            {/* Navigation Info */}
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start gap-3">
                                <FileCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                  <h4 className="font-medium text-blue-900">Informasi Akses</h4>
                                  <p className="text-blue-700 text-sm mt-1">
                                    Untuk mengakses detail progress PPL, honor, dan dokumen, gunakan menu terpisah:
                                    <strong> Manajemen Honor</strong> dan tombol <strong>Upload Docs</strong>.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Update Progress Modal */}
                  <Dialog open={!!updateModalActivity} onOpenChange={() => setUpdateModalActivity(null)}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Update Progress: {updateModalActivity?.namaKegiatan}</DialogTitle>
                      </DialogHeader>

                      {updateModalActivity && (
                        <div className="space-y-6">
                          <div className="space-y-6">
                            <h4 className="font-semibold text-gray-900">Update Progress PPL</h4>

                            {updateModalActivity.pplData.map((ppl, index) => (
                              <Card key={index} className="p-4">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h5 className="font-medium text-gray-900">{ppl.nama}</h5>
                                      <p className="text-sm text-gray-600">PML: {ppl.pml}</p>
                                      <p className="text-sm text-gray-600">Total Beban Kerja: {ppl.bebanKerja} hari</p>
                                      <p className="text-sm text-gray-600">Honor: Rp {ppl.honor.toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-bps-blue-600">
                                        {getProgressBarValue(ppl.progressData).toFixed(1)}%
                                      </div>
                                      <div className="text-xs text-gray-500">Progress Approved</div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-4 gap-4">
                                    <div className="text-center">
                                      <Label className="text-xs text-gray-600">Open</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max={ppl.bebanKerja}
                                        value={ppl.progressData.open}
                                        onChange={(e) => updatePPLProgress(updateModalActivity.id, index, 'open', parseInt(e.target.value) || 0)}
                                        className="mt-1 text-center"
                                      />
                                      <div className="text-xs text-gray-500 mt-1">{ppl.progressData.open} hari</div>
                                    </div>

                                    <div className="text-center">
                                      <Label className="text-xs text-gray-600">Submit</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max={ppl.bebanKerja}
                                        value={ppl.progressData.submit}
                                        onChange={(e) => updatePPLProgress(updateModalActivity.id, index, 'submit', parseInt(e.target.value) || 0)}
                                        className="mt-1 text-center"
                                      />
                                      <div className="text-xs text-gray-500 mt-1">{ppl.progressData.submit} hari</div>
                                    </div>

                                    <div className="text-center">
                                      <Label className="text-xs text-gray-600">Diperiksa</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max={ppl.bebanKerja}
                                        value={ppl.progressData.diperiksa}
                                        onChange={(e) => updatePPLProgress(updateModalActivity.id, index, 'diperiksa', parseInt(e.target.value) || 0)}
                                        className="mt-1 text-center"
                                      />
                                      <div className="text-xs text-gray-500 mt-1">{ppl.progressData.diperiksa} hari</div>
                                    </div>

                                    <div className="text-center">
                                      <Label className="text-xs text-gray-600">Approved</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max={ppl.bebanKerja}
                                        value={ppl.progressData.approved}
                                        onChange={(e) => updatePPLProgress(updateModalActivity.id, index, 'approved', parseInt(e.target.value) || 0)}
                                        className="mt-1 text-center"
                                      />
                                      <div className="text-xs text-gray-500 mt-1">{ppl.progressData.approved} hari</div>
                                    </div>
                                  </div>

                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-bps-green-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${getProgressBarValue(ppl.progressData)}%` }}
                                    ></div>
                                  </div>

                                  <div className="text-xs text-gray-500 text-center">
                                    Total: {ppl.progressData.open + ppl.progressData.submit + ppl.progressData.diperiksa + ppl.progressData.approved} / {ppl.bebanKerja} hari
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>

                          <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                              variant="outline"
                              onClick={() => setUpdateModalActivity(null)}
                            >
                              Tutup
                            </Button>
                            <Button
                              onClick={() => {
                                setUpdateModalActivity(null);
                                setShowProgressSuccessModal(true);
                              }}
                              className="bg-bps-blue-600 hover:bg-bps-blue-700"
                            >
                              Simpan Progress
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to={`/edit-activity/${activity.id}`}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateProgress(activity)}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Update
                  </Button>

                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to={`/upload-documents/${activity.id}`}>
                      <Upload className="w-4 h-4 mr-1" />
                      Upload Docs
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(activity)}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 col-span-2"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress Update Success Modal */}
        <SuccessModal
          isOpen={showProgressSuccessModal}
          onClose={() => setShowProgressSuccessModal(false)}
          title="Progress Berhasil Diperbarui!"
          description="Data progress PPL telah berhasil disimpan dan diperbarui di sistem."
          autoCloseDelay={2000}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setActivityToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Konfirmasi Hapus Kegiatan"
          description={
            activityToDelete
              ? `Apakah Anda yakin ingin menghapus kegiatan "${activityToDelete.namaKegiatan}"? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait termasuk progress PPL dan dokumen.`
              : ""
          }
          confirmLabel="Ya, Hapus"
          cancelLabel="Batal"
          variant="danger"
          icon={<Trash2 className="w-6 h-6" />}
        />
      </div>
    </Layout>
  );
}
