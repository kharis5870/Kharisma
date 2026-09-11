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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // FIX: Added DialogFooter back
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Edit, RefreshCw, Trash2, Activity, FileText, AlertTriangle, Search, Filter, BarChart, Layers, ClipboardCheck, Archive, ArchiveRestore, ChevronUp, ChevronDown, History } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Kegiatan, PPL, Dokumen, ProgressType } from "@shared/api";
import { cn } from "@/lib/utils";
import { format, isPast, parseISO, differenceInDays, formatDistanceToNow } from "date-fns";
import { id as localeID } from 'date-fns/locale';
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import { GAYA_STATUS_KEGIATAN, NADA_STATUS, IKON_PERINGATAN } from "@/lib/statusStyles";
import { menahanTenggatKetuaTim } from "@/lib/hakDokumen";
import { bolehMenyuntingKegiatan, bolehMemperbaruiProgress } from "@shared/hakKegiatan";
import DashboardCharts from "@/components/DashboardCharts";
import RiwayatKegiatanPanel from "@/components/RiwayatKegiatanPanel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { validasiPerpindahanProgress, statusPengawasanPML, hapusGalatPpl, kunciGalat, type StatusPengawasan } from "@/lib/progressMitra";

type EditableProgressKey = 'submit' | 'diperiksa' | 'approved' | 'sudah_entry' | 'validasi' | 'clean';
type ProgressTypeFilter = 'submit' | 'approved' | 'sudah_entry' | 'clean';

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

const fetchActivities = async (): Promise<Kegiatan[]> => {
    return apiClient.get<Kegiatan[]>("/kegiatan");
};

const deleteActivity = async (id: number): Promise<void> => {
    await apiClient.delete(`/kegiatan/${id}`);
};

const setArsipActivity = async ({ id, isArsip, username }: { id: number; isArsip: boolean; username?: string }) => {
    return apiClient.put(`/kegiatan/${id}/arsip`, { isArsip, username });
};

const updatePplProgress = async ({ pplId, progressData, username }: { pplId: number; progressData: any; username?: string }) => {
    return apiClient.put(`/kegiatan/ppl/${pplId}/progress`, { progressData, username });
};

const calculateActivityStatus = (kegiatan: Kegiatan): KegiatanWithDynamicStatus['dynamicStatus'] => {
    const warnings: string[] = [];
    const now = new Date();

    const checkTahapanWarning = (
        tanggalSelesai: string | undefined,
        tipeDokumen: Dokumen['tipe'],
        namaTahapan: string
    ) => {
        if (tanggalSelesai && isPast(parseISO(tanggalSelesai))) {
            // Aturannya sama dengan qTenggat di notifikasiService: dokumen yang
            // dialihkan ke tim keuangan tidak lagi memerahkan dashboard ketua
            // tim, karena ia memang tidak bisa mengisinya. Dipakai lewat helper
            // supaya klien dan SQL tidak menyimpang diam-diam.
            const dokumenTahapan = kegiatan.dokumen.filter(
                d => d.tipe === tipeDokumen && menahanTenggatKetuaTim(d));
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
    // Anotasi `string` perlu: NADA_STATUS pakai `as const`, tanpa ini TS
    // menyimpulkan tipe literal dan menolak penugasan ulang di bawah.
    let color: string = NADA_STATUS.biru; // default: Persiapan

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

    // Warna status dipusatkan di @/lib/statusStyles supaya konsisten dengan
    // ViewDocuments dan tetap terbaca di mode gelap.
    color = GAYA_STATUS_KEGIATAN[status] ?? color;

    return { status, color, warnings };
};

const getProgressBarValue = (ppl: PPLWithProgress) => {
    const totalBeban = parseInt(ppl.bebanKerja as any) || 0;
    if (totalBeban === 0) return 0;
    const approvedValue = (ppl.tahap === 'listing' || ppl.tahap === 'pencacahan')
        ? (ppl.progress.approved ?? 0)
        : (ppl.progress.clean ?? 0);
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
    const { tampilGrafik, toggleGrafik } = useSidebarStore();
    const [selectedActivity, setSelectedActivity] = useState<KegiatanWithDynamicStatus | null>(null);
    // Riwayat tertutup secara bawaan, dan HARUS direset tiap dialog dibuka —
    // kalau tidak, riwayat kegiatan sebelumnya tampak sudah terbuka untuk
    // kegiatan berikutnya.
    const [riwayatTerbuka, setRiwayatTerbuka] = useState(false);
    const [updateModalActivity, setUpdateModalActivity] = useState<KegiatanWithDynamicStatus | null>(null);
    const [activityToDelete, setActivityToDelete] = useState<Kegiatan | null>(null);
    const [showProgressSuccessModal, setShowProgressSuccessModal] = useState(false);
    const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
    const [deletedActivityName, setDeletedActivityName] = useState("");
    const [localPplProgress, setLocalPplProgress] = useState<PPLWithProgress[]>([]);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "" });
    const [activityToArchive, setActivityToArchive] = useState<KegiatanWithDynamicStatus | null>(null);
    const [showArchivedSection, setShowArchivedSection] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [timFilter, setTimFilter] = useState("all");
    const [progressView, setProgressView] = useState<'keseluruhan' | 'listing' | 'pencacahan' | 'pengolahan'>('keseluruhan');
    const [progressType, setProgressType] = useState<ProgressTypeFilter>('approved');
    const [pplSearchView, setPplSearchView] = useState("");
    const [pplSearchUpdate, setPplSearchUpdate] = useState("");
    // Error per kotak isian, berkunci `${pplId}:${field}`.
    const [progressErrors, setProgressErrors] = useState<Record<string, string>>({});
    // Dinaikkan setiap validasi gagal, untuk memaksa kartu mengembalikan
    // nilai lokalnya ke angka yang tersimpan.
    const [revertNonce, setRevertNonce] = useState(0);
    // Penyaring mitra di modal Update Progress, memudahkan PML yang hanya
    // mengurus sebagian mitra dalam satu kegiatan.
    const [filterPML, setFilterPML] = useState<'saya-dulu' | 'hanya-saya' | 'semua'>('saya-dulu');
    const [warningModalContent, setWarningModalContent] = useState<{title: string; warnings: string[]} | null>(null);
    const [showWarningList, setShowWarningList] = useState(false);

    useEffect(() => {
    // Gabungkan 'listing' dan 'pencacahan' ke dalam logika 'pendataan'
    if (progressView === 'listing' || progressView === 'pencacahan') {
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

    const arsipMutation = useMutation({
        mutationFn: setArsipActivity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
            setActivityToArchive(null);
        },
        onError: (error: any) => {
            setAlertModal({ isOpen: true, title: "Gagal Mengarsipkan", message: error.message });
            setActivityToArchive(null);
        },
    });

    const progressMutation = useMutation({
        mutationFn: updatePplProgress,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
        },
        onError: (error: any) => {
            setAlertModal({ isOpen: true, title: "Update Gagal", message: error.message });
            if (updateModalActivity) {
                setLocalPplProgress(JSON.parse(JSON.stringify(updateModalActivity.ppl || [])));
            }
        }
    });

    // Kegiatan yang diarsipkan dipisah dari daftar utama. Semua filter, kartu
    // statistik, dan pencarian hanya berlaku untuk yang aktif; yang diarsipkan
    // punya bagian sendiri di bagian bawah halaman.
    const activeActivities = useMemo(
        () => processedActivities.filter(a => !a.isArsip),
        [processedActivities],
    );
    const archivedActivities = useMemo(
        () => processedActivities.filter(a => Boolean(a.isArsip)),
        [processedActivities],
    );

    // Daftar tim untuk dropdown filter, diambil dari kegiatan yang ada supaya
    // hanya tim yang benar-benar dipakai yang muncul.
    const timOptions = useMemo(() => {
        const set = new Set<string>();
        activeActivities.forEach(a => { if (a.timKetua) set.add(a.timKetua); });
        return Array.from(set).sort();
    }, [activeActivities]);

    const filteredActivities = useMemo(() => {
        return activeActivities.filter(activity => {
            const { status, warnings } = activity.dynamicStatus;
            const matchesSearch = activity.namaKegiatan.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "all" ||
                (statusFilter === "warning" ? warnings.length > 0 : status === statusFilter);
            const matchesTim = timFilter === "all" || activity.timKetua === timFilter;
            return matchesSearch && matchesStatus && matchesTim;
        });
    }, [activeActivities, searchTerm, statusFilter, timFilter]);

    // Kartu statistik dihapus karena grafik sudah menampilkannya lebih baik.
    // Yang tersisa hanya daftar kegiatan bermasalah, untuk dropdown Peringatan.
    const kegiatanBermasalah = useMemo(
        () => activeActivities.filter(a => a.dynamicStatus.warnings.length > 0),
        [activeActivities],
    );

    const handleOpenUpdateModal = (activity: KegiatanWithDynamicStatus) => {
        setLocalPplProgress(JSON.parse(JSON.stringify(activity.ppl || [])));
        // Galat dari sesi sebelumnya tidak berlaku lagi: isian dimuat ulang
        // dari nilai tersimpan, jadi tidak ada angka tertolak yang tersisa.
        setProgressErrors({});
        setUpdateModalActivity(activity);
    };

    /**
     * Memvalidasi satu perubahan progress lalu menandai kotak yang bermasalah.
     *
     * Dulu ketiga kegagalan di sini memunculkan satu AlertModal global tanpa
     * keterangan kotak mana yang salah — state-nya memang hanya
     * { isOpen, title, message }, tanpa pplId maupun field. Sekarang errornya
     * disimpan per kotak sehingga bisa disorot langsung di tempatnya.
     */
    const handleUpdatePPL = (pplId: number, field: EditableProgressKey, value: string) => {
        const target = localPplProgress.find(p => p.id === pplId);
        if (!target) return;

        const hasil = validasiPerpindahanProgress(target, field, value);

        if (!hasil.ok) {
            // Paling banyak SATU galat per PPL. Setiap kali fokus meninggalkan
            // sebuah kotak — berhasil maupun gagal — seluruh isian kartu
            // disegarkan ke nilai tersimpan, jadi galat lama di kotak lain
            // sudah tidak menggambarkan apa pun yang tampil di layar.
            setProgressErrors(prev => ({
                ...hapusGalatPpl(prev, pplId),
                [kunciGalat(pplId, field)]: hasil.pesan!,
            }));
            // Kembalikan nilai yang ditolak, kalau tidak kotaknya tetap
            // menampilkan angka salah sampai render berikutnya.
            setRevertNonce(n => n + 1);
            return;
        }

        // Bersihkan galat SELURUH kotak PPL ini, bukan hanya kotak yang
        // disunting: satu perubahan menyentuh dua tahap sekaligus (menurunkan
        // 'diperiksa' menambah 'submit'), jadi peringatan di kotak tetangga
        // ikut kedaluwarsa begitu perubahan ini tersimpan.
        setProgressErrors(prev => hapusGalatPpl(prev, pplId));

        setLocalPplProgress(prev =>
            prev.map(p => (p.id === pplId ? { ...p, progress: hasil.progressBaru! } : p))
        );
    };

    const handleSaveProgress = async () => {
        // Jangan simpan selama masih ada kotak bermasalah.
        if (Object.keys(progressErrors).length > 0) {
            setAlertModal({
                isOpen: true,
                title: "Masih Ada Isian Bermasalah",
                message: "Perbaiki dulu kotak yang bertanda merah sebelum menyimpan.",
            });
            return;
        }

        const perubahan = localPplProgress.filter(ppl => {
            const asli = updateModalActivity?.ppl.find(op => op.id === ppl.id);
            return JSON.stringify(ppl.progress) !== JSON.stringify(asli?.progress);
        });

        if (perubahan.length === 0) {
            setUpdateModalActivity(null);
            return;
        }

        try {
            // Ditunggu sampai selesai. Sebelumnya modal langsung ditutup dan
            // modal sukses ditampilkan SEBELUM respons tiba, sehingga kegagalan
            // di server tetap terlihat seperti berhasil.
            await Promise.all(perubahan.map(ppl => {
                const { username, ...progressValues } = ppl.progress as any;
                return progressMutation.mutateAsync({
                    pplId: ppl.id!,
                    progressData: progressValues,
                    username: user?.username,
                });
            }));
            setUpdateModalActivity(null);
            setShowProgressSuccessModal(true);
        } catch {
            // progressMutation.onError sudah menampilkan pesannya.
        }
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
                                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                                            {(ppl.namaPPL || 'P').split(' ').map((n: string) => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-medium text-foreground">{ppl.namaPPL}</h4>
                                        <p className="text-sm text-muted-foreground">PML: {ppl.namaPML}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-bps-blue-600">{getProgressBarValue(ppl).toFixed(0)}%</div>
                                </div>
                            </div>
                            <div>
                                <Progress value={getProgressBarValue(ppl)} className="h-2" />
                                <div className="grid grid-cols-4 gap-2 text-center mt-2">
                                    {(ppl.tahap === 'listing' || ppl.tahap === 'pencacahan') ? (
                                        <>
                                            <div className="bg-blue-50 dark:bg-blue-950/40 p-2 rounded"><div className="text-xs text-blue-600 dark:text-blue-300 font-medium">Open</div><div className="text-lg font-bold text-blue-800 dark:text-blue-300">{ppl.progress.open}</div></div>
                                            <div className="bg-yellow-50 dark:bg-yellow-950/40 p-2 rounded"><div className="text-xs text-yellow-600 dark:text-yellow-300 font-medium">Submit</div><div className="text-lg font-bold text-yellow-800 dark:text-yellow-300">{ppl.progress.submit}</div></div>
                                            <div className="bg-orange-50 dark:bg-orange-950/40 p-2 rounded"><div className="text-xs text-orange-600 dark:text-orange-300 font-medium">Diperiksa</div><div className="text-lg font-bold text-orange-800 dark:text-orange-300">{ppl.progress.diperiksa}</div></div>
                                            <div className="bg-green-50 dark:bg-green-950/40 p-2 rounded"><div className="text-xs text-green-600 dark:text-green-300 font-medium">Approved</div><div className="text-lg font-bold text-green-800 dark:text-green-300">{ppl.progress.approved}</div></div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-muted p-2 rounded"><div className="text-xs text-muted-foreground font-medium">Belum Entry</div><div className="text-lg font-bold text-foreground">{ppl.progress.belum_entry}</div></div>
                                            <div className="bg-blue-50 dark:bg-blue-950/40 p-2 rounded"><div className="text-xs text-blue-600 dark:text-blue-300 font-medium">Dientry</div><div className="text-lg font-bold text-blue-800 dark:text-blue-300">{ppl.progress.sudah_entry}</div></div>
                                            <div className="bg-yellow-50 dark:bg-yellow-950/40 p-2 rounded"><div className="text-xs text-yellow-600 dark:text-yellow-300 font-medium">Validasi</div><div className="text-lg font-bold text-yellow-800 dark:text-yellow-300">{ppl.progress.validasi}</div></div>
                                            <div className="bg-green-50 dark:bg-green-950/40 p-2 rounded"><div className="text-xs text-green-600 dark:text-green-300 font-medium">Clean</div><div className="text-lg font-bold text-green-800 dark:text-green-300">{ppl.progress.clean}</div></div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                                <span>Beban Kerja: {ppl.bebanKerja}</span>
                                <span>Honor: Rp {parseInt(ppl.besaranHonor).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
            {pplList.filter((p: PPLWithProgress) => (p.namaPPL || '').toLowerCase().includes(search.toLowerCase())).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <p>{pplList.length === 0 ? "Belum ada PPL yang dialokasikan untuk tahap ini." : "PPL tidak ditemukan."}</p>
                </div>
            )}
        </div>
    );

    const PPLUpdateCard = ({ ppl, handleUpdatePPL, user }: { 
        ppl: PPLWithProgress, 
        handleUpdatePPL: (pplId: number, field: EditableProgressKey, value: string) => void,
        user: any
    }) => {
        const [localProgress, setLocalProgress] = useState(ppl.progress);

        // revertNonce ikut jadi dependensi: saat validasi gagal, nilainya
        // dinaikkan supaya kotak kembali ke angka tersimpan alih-alih terus
        // menampilkan angka yang baru saja ditolak.
        useEffect(() => {
            setLocalProgress(ppl.progress);
        }, [ppl.progress, revertNonce]);
        const isAuthorized = bolehMemperbaruiProgress(user as any, ppl as any);
        const isPendataan = ppl.tahap === 'listing' || ppl.tahap === 'pencacahan';
        const honorDetail = ppl.honorarium?.[0];
        const targetBebanKerja = honorDetail?.bebanKerja || '0';

        const handleLocalChange = (field: EditableProgressKey, value: string) => {
            const numValue = parseInt(value, 10);
            setLocalProgress(prev => ({
                ...prev,
                [field]: isNaN(numValue) ? 0 : numValue
            }));
        };

        // 3. Buat handler untuk onBlur (menyimpan ke state global)
        const handleBlur = (field: EditableProgressKey) => {
            handleUpdatePPL(ppl.id!, field, String(localProgress[field] ?? '0'));
        };

        // Satu kotak isian + pesan galatnya. Kotak yang bermasalah diberi tepi
        // merah dan pesan tepat di bawahnya, menggantikan modal global yang
        // tidak memberi tahu kotak mana yang salah.
        //
        // PENTING: ini fungsi biasa yang DIPANGGIL, bukan komponen yang
        // dirender lewat <KotakProgress />. Mendeklarasikan komponen di dalam
        // badan komponen lain membuat identitasnya berubah pada setiap render;
        // React lalu menganggapnya tipe baru, melepas <Input> yang lama dan
        // memasang yang baru. Akibatnya fokus hilang di tiap ketikan dan
        // onBlur TIDAK PERNAH menyala — perpindahan progress tidak tersimpan
        // sehingga tahap sebelumnya (mis. Open) tidak ikut berkurang.
        const kotakProgress = (field: EditableProgressKey, label: string) => {
            const galat = progressErrors[kunciGalat(ppl.id!, field)];
            return (
                <div key={field}>
                    <Label className="text-xs text-muted-foreground capitalize">{label}</Label>
                    <Input
                        type="number"
                        min="0"
                        value={localProgress[field] ?? 0}
                        onChange={e => handleLocalChange(field, e.target.value)}
                        onBlur={() => handleBlur(field)}
                        disabled={!isAuthorized}
                        aria-invalid={!!galat}
                        aria-errormessage={galat ? `err-${ppl.id}-${field}` : undefined}
                        title={!isAuthorized ? "Hanya PML yang bersangkutan atau Admin yang dapat mengubah progress" : ""}
                        className={cn(
                            "mt-1 text-center",
                            galat && "border-destructive ring-1 ring-destructive focus-visible:ring-destructive"
                        )}
                    />
                    {galat && (
                        <p id={`err-${ppl.id}-${field}`} className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {galat}
                        </p>
                    )}
                </div>
            );
        };

        const renderProgressInputs = () => {
            if (isPendataan) {
                const stages: EditableProgressKey[] = ['submit', 'diperiksa', 'approved'];
                return (
                    <div className="grid grid-cols-4 gap-3 items-start">
                        <div><Label className="text-xs text-muted-foreground">Open</Label><Input type="number" value={localProgress.open ?? 0} disabled className="mt-1 text-center bg-muted"/></div>
                        {stages.map(field => kotakProgress(field, field))}
                    </div>
                );
            }

            const pengolahanStages: EditableProgressKey[] = ['sudah_entry', 'validasi', 'clean'];
            return (
                <div className="grid grid-cols-4 gap-3 items-start">
                    <div><Label className="text-xs text-muted-foreground">Belum Entry</Label><Input type="number" value={localProgress.belum_entry ?? 0} disabled className="mt-1 text-center bg-muted"/></div>
                    {pengolahanStages.map(field =>
                        kotakProgress(field, field === 'sudah_entry' ? 'Dientry' : field)
                    )}
                </div>
            );
        };

        const adaGalat = Object.keys(progressErrors).some(k => k.startsWith(`${ppl.id}:`));

        return (
            <Card key={ppl.id} className={cn(adaGalat && "border-destructive")}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                                    {(ppl.namaPPL || 'P').split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h4 className="font-medium text-foreground">{ppl.namaPPL}</h4>
                                <p className="text-sm text-muted-foreground">PML: {ppl.namaPML}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold text-bps-blue-600">{getProgressBarValue(ppl).toFixed(0)}%</div>
                            <div className="text-xs text-muted-foreground -mt-1">{isPendataan ? 'Approved' : 'Clean'}</div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
                        <Label className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2 block capitalize">
                            Progress {ppl.tahap.replace('-', ' ')} (Target: {targetBebanKerja})
                        </Label>
                        {renderProgressInputs()}
                        <Progress value={getProgressBarValue(ppl)} className="h-2 mt-2" />
                    </div>
                </CardContent>
            </Card>
        );
    };

    /**
     * Titik kecil di pojok tombol "Update" yang meringkas keadaan mitra
     * yang diawasi akun ini pada kegiatan tersebut.
     *
     * Semua datanya sudah tersedia di klien (processedActivities melengkapi
     * kedelapan bucket progress), jadi tidak perlu query tambahan.
     * Tenggat per baris memakai rentang honor per tahap — inilah tenggat
     * paling presisi yang memetakan 1:1 ke `ppl.tahap`.
     */
    // Fungsi biasa yang dipanggil, bukan komponen bersarang — lihat catatan
    // pada `kotakProgress` di atas soal identitas komponen yang berubah tiap render.
    const titikPengawasan = (activity: KegiatanWithDynamicStatus) => {
        const status = statusPengawasanPML(
            (activity.ppl || []) as PPLWithProgress[],
            user?.id,
            {
                'listing': activity.tanggalSelesaiHonorListing,
                'pencacahan': activity.tanggalSelesaiHonorPencacahan,
                'pengolahan-analisis': activity.tanggalSelesaiHonorPengolahan,
            },
        );

        if (status === 'tidak-mengawasi') return null;

        const PETA: Record<Exclude<StatusPengawasan, 'tidak-mengawasi'>, { warna: string; judul: string }> = {
            selesai: { warna: 'bg-green-500', judul: 'Semua mitra yang Anda awasi sudah selesai' },
            berjalan: { warna: 'bg-yellow-500', judul: 'Masih ada mitra yang Anda awasi belum selesai' },
            terlambat: { warna: 'bg-red-500', judul: 'Ada mitra yang belum selesai dan sudah lewat tenggat' },
        };
        const gaya = PETA[status];

        return (
            <span
                title={gaya.judul}
                aria-label={gaya.judul}
                className={cn(
                    "absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full ring-2 ring-card",
                    gaya.warna,
                )}
            />
        );
    };

    const renderPPLUpdate = (pplList: PPLWithProgress[], search: string) => {
        const milikSaya = (p: PPLWithProgress) => String(p.pml_id) === String(user?.id);

        let tampil = pplList.filter(p => (p.namaPPL || '').toLowerCase().includes(search.toLowerCase()));

        if (filterPML === 'hanya-saya') {
            tampil = tampil.filter(milikSaya);
        } else if (filterPML === 'saya-dulu') {
            // Urutan stabil: mitra yang diawasi akun ini naik ke atas,
            // sisanya tetap urut nama.
            tampil = [...tampil].sort((a, b) => {
                const beda = Number(milikSaya(b)) - Number(milikSaya(a));
                return beda !== 0 ? beda : (a.namaPPL || '').localeCompare(b.namaPPL || '');
            });
        }

        return (
            <div className="space-y-4">
                {tampil.map(ppl => (
                    <PPLUpdateCard key={ppl.id} ppl={ppl} handleUpdatePPL={handleUpdatePPL} user={user} />
                ))}
                {tampil.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                        {pplList.length === 0
                            ? "Tidak ada alokasi PPL untuk tahap ini."
                            : filterPML === 'hanya-saya'
                                ? "Tidak ada mitra yang Anda awasi pada tahap ini."
                                : "PPL tidak ditemukan."}
                    </p>
                )}
            </div>
        );
    };

    if (isLoading) return <Layout><div className="text-center p-8">Memuat...</div></Layout>;

    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex items-start justify-between gap-4">
                    <div><h1 className="text-3xl font-bold">Dashboard Monitoring</h1><p className="text-muted-foreground mt-1">Pantau progress dan kelola semua kegiatan</p></div>
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Peringatan dipindah ke sini dari baris filter: ini
                            ringkasan seluruh dashboard, bukan alat penyaring
                            daftar, jadi tempatnya di kepala halaman bersama
                            tombol grafik. Hanya muncul kalau memang ada. */}
                        {kegiatanBermasalah.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowWarningList(true)}
                                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                            >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                {kegiatanBermasalah.length} Peringatan
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={toggleGrafik}>
                            <BarChart className="w-4 h-4 mr-2" />
                            {tampilGrafik ? 'Sembunyikan Grafik' : 'Tampilkan Grafik'}
                        </Button>
                    </div>
                </div>

                {/* Panel grafik. Disembunyikan secara bawaan sehingga halaman
                    utama tetap seperti sebelumnya; pilihannya ikut tersimpan. */}
                {/* filteredActivities, bukan activeActivities: grafik harus ikut
                    filter status/tim/pencarian seperti yang diminta. */}
                {tampilGrafik && <DashboardCharts activities={filteredActivities} />}

                <div className="flex flex-col sm:flex-row gap-4 bg-card p-6 rounded-lg border">
                    <div className="flex-1">
                        <Label htmlFor="search" className="text-sm font-medium text-foreground mb-2 block">Cari Kegiatan</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input id="search" type="text" placeholder="Cari nama kegiatan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        {progressView !== 'keseluruhan' && (
                        <div className="sm:w-48">
                            <Label htmlFor="progress-type" className="text-sm font-medium text-foreground mb-2 block">Tipe Progress</Label>
                            <Select value={progressType} onValueChange={(v) => setProgressType(v as ProgressTypeFilter)}>
                                <SelectTrigger>
                                    <ClipboardCheck className="w-4 h-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(progressView === 'listing' || progressView === 'pencacahan') ? (
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
                    )}
                        <div className="sm:w-48">
                            <Label htmlFor="progress-view" className="text-sm font-medium text-foreground mb-2 block">Tahap Progress</Label>
                            <Select value={progressView} onValueChange={(v) => setProgressView(v as any)}>
                                <SelectTrigger>
                                    <Layers className="w-4 h-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="keseluruhan">Keseluruhan</SelectItem>
                                    <SelectItem value="listing">Listing</SelectItem>
                                    <SelectItem value="pencacahan">Pencacahan</SelectItem>
                                    <SelectItem value="pengolahan">Pengolahan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="sm:w-64">
                            <Label htmlFor="status-filter" className="text-sm font-medium text-foreground mb-2 block">Filter Status</Label>
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
                        {/* Tim berasal dari master ketua tim (JOIN ke ketua_tim). */}
                        <div className="sm:w-64">
                            <Label htmlFor="tim-filter" className="text-sm font-medium text-foreground mb-2 block">Filter Tim</Label>
                            <Select value={timFilter} onValueChange={setTimFilter}>
                                <SelectTrigger id="tim-filter">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Semua Tim" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tim</SelectItem>
                                    {timOptions.map(tim => (
                                        <SelectItem key={tim} value={tim}>{tim}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredActivities.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <div className="text-muted-foreground mb-4"><Activity className="w-16 h-16 mx-auto" /></div>
                            <h3 className="text-lg font-medium text-foreground mb-2">Tidak ada kegiatan ditemukan</h3>
                            <p className="text-muted-foreground">{searchTerm ? `Tidak ada kegiatan yang cocok dengan "${searchTerm}"` : 'Tidak ada kegiatan dengan filter yang dipilih'}</p>
                        </div>
                    ) : (
                        filteredActivities.map((activity) => {
                            const { status, color, warnings } = activity.dynamicStatus;
                            // Ketua tim dikenali lewat akun yang ditautkan
                            // (ketua_tim.user_id), bukan lewat ketua_tim_id.
                            // Membandingkan user.id ke ketua_tim_id tidak pernah
                            // benar: users memakai USR### dan ketua_tim memakai
                            // KT### — dua ruang ID yang tidak beririsan, sehingga
                            // selama ini ketua tim tidak pernah bisa mengedit
                            // kegiatannya sendiri.
                            const canEdit = bolehMenyuntingKegiatan(user as any, activity as any);

                            let progressValue = 0;
                            let progressLabel = "";

                            switch (progressView) {
                                case 'listing':
                                    progressValue = progressType === 'submit'
                                        ? activity.progressListingSubmit
                                        : activity.progressListingApproved;
                                    progressLabel = `Progress Listing (${progressType === 'submit' ? 'Submit' : 'Approved'})`;
                                    break;
                                case 'pencacahan':
                                    progressValue = progressType === 'submit'
                                        ? activity.progressPencacahanSubmit
                                        : activity.progressPencacahanApproved;
                                    progressLabel = `Progress Pencacahan (${progressType === 'submit' ? 'Submit' : 'Approved'})`;
                                    break;
                                case 'pengolahan':
                                    progressValue = progressType === 'sudah_entry'
                                        ? activity.progressPengolahanSubmit
                                        : activity.progressPengolahanApproved;
                                    progressLabel = `Progress Pengolahan (${progressType === 'sudah_entry' ? 'Dientry' : 'Clean'})`;
                                    break;
                                case 'keseluruhan':
                                default:
                                    progressValue = activity.progressKeseluruhan;
                                    progressLabel = 'Progress Keseluruhan';
                                    break;
                            }

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
                                            <div><p className="text-muted-foreground">Selesai Pada</p><p className="font-medium">{formatDate(activity.tanggalSelesaiDiseminasiEvaluasi)}</p></div>
                                        );
                                }
                                return (
                                    <>
                                        <div><p className="text-muted-foreground">Mulai {stageLabel}</p><p className="font-medium">{formatDate(startDate)}</p></div>
                                        <div><p className="text-muted-foreground">Selesai {stageLabel}</p><p className="font-medium">{formatDate(endDate)}</p></div>
                                    </>
                                );
                            };

                            return (
                                <Card key={activity.id} className="hover:shadow-lg transition-shadow flex flex-col">
                                    <CardHeader className="pb-3"><div className="flex items-start justify-between"><div className="flex-1"><CardTitle className="text-lg leading-tight">{activity.namaKegiatan}</CardTitle><p className="text-sm text-muted-foreground mt-1">Ketua: {activity.namaKetua}</p></div><Badge className={cn("ml-2 whitespace-nowrap", warnings.length > 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' : color)}>{warnings.length > 0 ? 'Warning' : status}</Badge></div></CardHeader>
                                    <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium">{progressLabel}</span><span className="text-sm font-bold text-bps-blue-600">{progressValue || 0}%</span></div>
                                            <Progress value={progressValue || 0} className="h-2" />
                                            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                                {getStageDates()}
                                            </div>
                                            {/* Dua baris "Edit" dan "Update" digabung; riwayat lengkapnya
                                                ada di dialog "Lihat". */}
                                            {(() => {
                                                const waktuEdit = activity.lastEdited ? parseISO(activity.lastEdited) : null;
                                                const waktuUpdate = activity.lastUpdated ? parseISO(activity.lastUpdated) : null;
                                                const pakaiEdit = waktuEdit && (!waktuUpdate || waktuEdit > waktuUpdate);
                                                const stempel = pakaiEdit ? activity.lastEdited : activity.lastUpdated;
                                                const pelaku = pakaiEdit ? activity.lastEditedBy : activity.lastUpdatedBy;
                                                return (
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                                                        <History className="w-3 h-3" />
                                                        <span>Terakhir:</span>
                                                        <span className="font-medium text-bps-blue-600">{getRelativeTime(stempel!)}</span>
                                                        {pelaku && (<><span>oleh</span><span className="font-medium text-bps-blue-600">{pelaku}</span></>)}
                                                    </div>
                                                );
                                            })()}
                                            {warnings.length > 0 && (
                                                <Button
                                                    variant="link"
                                                    className="p-0 h-auto text-red-600 dark:text-red-300 text-xs mt-2"
                                                    onClick={() => setWarningModalContent({ title: activity.namaKegiatan, warnings })}
                                                >
                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                    Lihat {warnings.length} Peringatan
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-4 border-t mt-4">
                                            <Button variant="outline" size="sm" onClick={() => { setSelectedActivity(activity); setPplSearchView(""); setRiwayatTerbuka(false); }}><Eye className="w-4 h-4 mr-1" />Lihat</Button>
                                            {canEdit ? (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link to={`/edit-activity/${activity.id}`}>
                                                        <Edit className="w-4 h-4 mr-1" />Edit
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button variant="outline" size="sm" disabled title="Hanya Admin, Ketua Tim, atau pembuat yang bisa mengedit">
                                                    <Edit className="w-4 h-4 mr-1" />Edit
                                                </Button>
                                            )}
                                            <Button variant="outline" size="sm" className="relative" onClick={() => { handleOpenUpdateModal(activity); setPplSearchUpdate(""); }}>
                                                <RefreshCw className="w-4 h-4 mr-1" />Update
                                                {titikPengawasan(activity)}
                                            </Button>
                                            <Button variant="outline" size="sm" asChild><Link to={`/view-documents/${activity.id}`}><FileText className="w-4 h-4 mr-1" />View Docs</Link></Button>
                                            {user?.role === 'admin' && (
                                                <>
                                                    <Button variant="destructive" size="sm" onClick={() => setActivityToDelete(activity)} className="col-span-2"><Trash2 className="w-4 h-4 mr-1" />Hapus</Button>
                                                    <Button variant="outline" size="sm" onClick={() => setActivityToArchive(activity)} className="col-span-2"><Archive className="w-4 h-4 mr-1" />Arsipkan</Button>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>

                {/* KEGIATAN YANG DIARSIPKAN */}
                {archivedActivities.length > 0 && (
                    <div className="mt-10 border-t pt-6">
                        <Button
                            variant="ghost"
                            onClick={() => setShowArchivedSection(v => !v)}
                            className="text-muted-foreground"
                        >
                            <Archive className="w-4 h-4 mr-2" />
                            Lihat kegiatan yang diarsipkan ({archivedActivities.length})
                            {showArchivedSection
                                ? <ChevronUp className="w-4 h-4 ml-2" />
                                : <ChevronDown className="w-4 h-4 ml-2" />}
                        </Button>

                        {showArchivedSection && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
                                {archivedActivities.map((activity) => (
                                    <Card key={activity.id} className="flex flex-col bg-muted border-dashed">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg leading-tight text-foreground">{activity.namaKegiatan}</CardTitle>
                                                    <p className="text-sm text-muted-foreground mt-1">Ketua: {activity.namaKetua}</p>
                                                    {activity.timKetua && <p className="text-xs text-muted-foreground mt-1">Tim: {activity.timKetua}</p>}
                                                </div>
                                                <Badge variant="outline" className="ml-2 whitespace-nowrap">Diarsipkan</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-grow flex flex-col justify-between">
                                            <p className="text-xs text-muted-foreground">
                                                Diarsipkan {getRelativeTime(activity.arsipAt || activity.lastUpdated)}
                                                {activity.arsipBy && ` oleh ${activity.arsipBy}`}
                                            </p>
                                            <div className="grid grid-cols-2 gap-2 pt-4 border-t mt-4">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link to={`/view-documents/${activity.id}`}><FileText className="w-4 h-4 mr-1" />View Docs</Link>
                                                </Button>
                                                {user?.role === 'admin' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={arsipMutation.isPending}
                                                        onClick={() => arsipMutation.mutate({ id: activity.id, isArsip: false, username: user?.username })}
                                                    >
                                                        <ArchiveRestore className="w-4 h-4 mr-1" />Batalkan Arsip
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* MODAL LIHAT DETAIL */}
                <Dialog open={!!selectedActivity} onOpenChange={(isOpen) => { if (!isOpen) { setSelectedActivity(null); setRiwayatTerbuka(false); } }}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Detail Kegiatan: {selectedActivity?.namaKegiatan}</DialogTitle></DialogHeader>
                        {selectedActivity && (
                            <div className="space-y-6 p-4">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-3">Informasi Kegiatan</h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between"><span className="text-muted-foreground">Nama Kegiatan:</span><span className="font-medium text-right max-w-xs">{selectedActivity.namaKegiatan}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Ketua Tim:</span><span className="font-medium">{selectedActivity.namaKetua}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-muted-foreground">Status:</span><Badge className={cn(selectedActivity.dynamicStatus.color)}>{selectedActivity.dynamicStatus.status}</Badge></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Terakhir Update:</span><span className="font-medium text-bps-blue-600">{getRelativeTime(selectedActivity.lastUpdated)}</span></div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-3">Jadwal Lengkap Kegiatan</h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between"><span className="text-muted-foreground">Persiapan:</span><span className="font-medium">{selectedActivity.tanggalMulaiPersiapan ? `${format(new Date(selectedActivity.tanggalMulaiPersiapan), 'dd MMM yyyy', { locale: localeID })} - ${format(new Date(selectedActivity.tanggalSelesaiPersiapan!), 'dd MMM yyyy', { locale: localeID })}` : '-'}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Pengumpulan Data:</span><span className="font-medium">{selectedActivity.tanggalMulaiPengumpulanData ? `${format(new Date(selectedActivity.tanggalMulaiPengumpulanData), 'dd MMM yyyy', { locale: localeID })} - ${format(new Date(selectedActivity.tanggalSelesaiPengumpulanData!), 'dd MMM yyyy', { locale: localeID })}` : '-'}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Pengolahan & Analisis:</span><span className="font-medium">{selectedActivity.tanggalMulaiPengolahanAnalisis ? `${format(new Date(selectedActivity.tanggalMulaiPengolahanAnalisis), 'dd MMM yyyy', { locale: localeID })} - ${format(new Date(selectedActivity.tanggalSelesaiPengolahanAnalisis!), 'dd MMM yyyy', { locale: localeID })}` : '-'}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Diseminasi & Evaluasi:</span><span className="font-medium">{selectedActivity.tanggalMulaiDiseminasiEvaluasi ? `${format(new Date(selectedActivity.tanggalMulaiDiseminasiEvaluasi), 'dd MMM yyyy', { locale: localeID })} - ${format(new Date(selectedActivity.tanggalSelesaiDiseminasiEvaluasi!), 'dd MMM yyyy', { locale: localeID })}` : '-'}</span></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Riwayat disembunyikan di balik tombol: dialog ini
                                    sudah padat, dan riwayat jarang diperlukan setiap
                                    kali detail dibuka. */}
                                <Collapsible open={riwayatTerbuka} onOpenChange={setRiwayatTerbuka}>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <History className="w-4 h-4 mr-2" />
                                            {riwayatTerbuka ? 'Sembunyikan Riwayat Aktivitas' : 'Lihat Riwayat Aktivitas'}
                                            <ChevronDown className={cn('w-4 h-4 ml-2 transition-transform', riwayatTerbuka && 'rotate-180')} />
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-3">
                                        {/* Gerbang render eksplisit, bukan mubazir: ini yang
                                            menjamin permintaan /kegiatan/:id/riwayat tidak
                                            pernah ditembak sebelum tombolnya ditekan, tanpa
                                            bergantung pada cara Radix memasang isinya. */}
                                        {riwayatTerbuka && <RiwayatKegiatanPanel kegiatanId={selectedActivity.id} />}
                                    </CollapsibleContent>
                                </Collapsible>

                                <div className="min-w-0"><h4 className="font-semibold text-foreground mb-2">Deskripsi Kegiatan</h4><p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">{selectedActivity.deskripsiKegiatan}</p></div>
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold text-foreground">Progress PPL</h4>
                                        <div className="w-64"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" /><Input type="text" placeholder="Cari nama PPL..." value={pplSearchView} onChange={(e) => setPplSearchView(e.target.value)} className="pl-10 h-8 text-sm" /></div></div>
                                    </div>
                                    <Tabs defaultValue="listing">
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="listing">Listing</TabsTrigger>
                                            <TabsTrigger value="pencacahan">Pencacahan</TabsTrigger>
                                            <TabsTrigger value="pengolahan-analisis">Pengolahan</TabsTrigger>
                                        </TabsList>
                                        <div className="mt-4 max-h-[55vh] overflow-y-auto pr-2">
                                            <TabsContent value="listing">{renderPPLProgress(selectedActivity.ppl.filter(p => p.tahap === 'listing') as PPLWithProgress[], pplSearchView)}</TabsContent>
                                            <TabsContent value="pencacahan">{renderPPLProgress(selectedActivity.ppl.filter(p => p.tahap === 'pencacahan') as PPLWithProgress[], pplSearchView)}</TabsContent>
                                            <TabsContent value="pengolahan-analisis">{renderPPLProgress(selectedActivity.ppl.filter(p => p.tahap === 'pengolahan-analisis') as PPLWithProgress[], pplSearchView)}</TabsContent>
                                        </div>
                                    </Tabs>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* MODAL UPDATE PROGRESS */}
                <Dialog open={!!updateModalActivity} onOpenChange={(isOpen) => { if (!isOpen) setUpdateModalActivity(null); }}>
                    <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                        <DialogHeader><DialogTitle>Update Progress: {updateModalActivity?.namaKegiatan}</DialogTitle></DialogHeader>
                        {updateModalActivity && (
                            <div className="flex-grow overflow-hidden flex flex-col">
                                <Tabs defaultValue="listing" className="flex-grow flex flex-col overflow-hidden">
                                    <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
                                        <TabsTrigger value="listing">Listing</TabsTrigger>
                                        <TabsTrigger value="pencacahan">Pencacahan</TabsTrigger>
                                        <TabsTrigger value="pengolahan-analisis">Pengolahan</TabsTrigger>
                                    </TabsList>
                                    <div className="mt-4 mb-4 flex flex-col sm:flex-row gap-2 flex-shrink-0">
                                        <div className="relative flex-grow">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                            <Input type="text" placeholder="Cari nama PPL..." value={pplSearchUpdate} onChange={(e) => setPplSearchUpdate(e.target.value)} className="pl-10 h-8 text-sm" />
                                        </div>
                                        {/* Memudahkan PML yang hanya mengurus sebagian mitra
                                            dalam satu kegiatan menemukan miliknya. */}
                                        <Select value={filterPML} onValueChange={(v) => setFilterPML(v as typeof filterPML)}>
                                            <SelectTrigger className="h-8 text-sm w-full sm:w-52"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="saya-dulu">Mitra saya di atas</SelectItem>
                                                <SelectItem value="hanya-saya">Hanya mitra saya</SelectItem>
                                                <SelectItem value="semua">Semua mitra</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="overflow-y-auto flex-grow pr-2">
                                        <TabsContent value="listing">{renderPPLUpdate(localPplProgress.filter(p => p.tahap === 'listing'), pplSearchUpdate)}</TabsContent>
                                        <TabsContent value="pencacahan">{renderPPLUpdate(localPplProgress.filter(p => p.tahap === 'pencacahan'), pplSearchUpdate)}</TabsContent>
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

                {/* Sisa Modal Lainnya */}
                {/* Daftar seluruh peringatan, dibuka dari tombol di kepala halaman.
                    Semua peringatan langsung terlihat — tidak perlu klik kedua per
                    kegiatan seperti pada dropdown sebelumnya. */}
                <Dialog open={showWarningList} onOpenChange={setShowWarningList}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className={cn("w-5 h-5", IKON_PERINGATAN)} />
                                {kegiatanBermasalah.length} Kegiatan Bermasalah
                            </DialogTitle>
                            <DialogDescription>
                                Kegiatan yang butuh perhatian, beserta alasannya.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-2">
                            {kegiatanBermasalah.map(k => (
                                <div key={k.id} className="rounded-lg border p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <h4 className="font-semibold text-foreground">{k.namaKegiatan}</h4>
                                        <Button variant="outline" size="sm" className="shrink-0" onClick={() => {
                                            setShowWarningList(false);
                                            setSelectedActivity(k);
                                            setRiwayatTerbuka(false);
                                            setPplSearchView("");
                                        }}>
                                            <Eye className="w-3 h-3 mr-1" />Lihat
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        {k.namaKetua ? `Ketua: ${k.namaKetua}` : 'Tanpa ketua tim'}
                                        {k.timKetua ? ` · ${k.timKetua}` : ''}
                                    </p>
                                    <ul className="space-y-1">
                                        {k.dynamicStatus.warnings.map((w, i) => (
                                            <li key={i} className="flex items-start gap-2 rounded bg-red-50 px-2 py-1 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
                                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                                <span>{w}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
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
                                <div key={index} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-md">
                                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-300 mt-1 flex-shrink-0" />
                                    <span className="text-red-800 dark:text-red-300 text-sm">{warning}</span>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

                <ConfirmationModal isOpen={!!activityToDelete} onConfirm={handleDeleteConfirm} onClose={() => setActivityToDelete(null)} title="Konfirmasi Hapus" description={`Yakin ingin menghapus "${activityToDelete?.namaKegiatan}"?`} />
                <ConfirmationModal
                    isOpen={!!activityToArchive}
                    onConfirm={() => activityToArchive && arsipMutation.mutate({ id: activityToArchive.id, isArsip: true, username: user?.username })}
                    onClose={() => setActivityToArchive(null)}
                    title="Konfirmasi Arsip"
                    description={`Arsipkan "${activityToArchive?.namaKegiatan}"? Kegiatan akan disembunyikan dari daftar utama, tapi datanya tetap tersimpan dan masih terhitung di rekap honor. Anda bisa membatalkan arsip kapan saja.`}
                />
                <SuccessModal isOpen={showProgressSuccessModal} onClose={() => setShowProgressSuccessModal(false)} title="Progress Berhasil Diperbarui!" autoCloseDelay={2000} />
                <SuccessModal isOpen={showDeleteSuccessModal} onClose={() => setShowDeleteSuccessModal(false)} title="Kegiatan Berhasil Dihapus!" description={`Kegiatan "${deletedActivityName}" telah berhasil dihapus dari sistem.`} autoCloseDelay={2000} />
                <AlertModal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ isOpen: false, title: "", message: "" })} title={alertModal.title} description={alertModal.message} />
            </div>
        </Layout>
    );
}