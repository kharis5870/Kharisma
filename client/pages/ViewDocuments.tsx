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
import { ArrowLeft, FileText, Link2, ExternalLink, Eye, CheckCircle, Clock, Users, Activity, Notebook, ThumbsUp, ThumbsDown, XCircle, Pencil, Plus, Trash2, AlertTriangle, Wrench, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Kegiatan, Dokumen } from "@shared/api";
import { hrefAman, periksaTautan } from "@shared/tautanDokumen";
import { bolehMenyuntingKegiatan } from "@shared/hakKegiatan";
import {
  dikelolaKeuangan, labelPenanggungJawab,
  bolehMengisiLinkKeuangan, bolehKetuaTimMenyunting,
} from "@/lib/hakDokumen";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiClient } from "@/lib/apiClient";
import { GAYA_STATUS_DOKUMEN, NADA_STATUS } from "@/lib/statusStyles";

/**
 * Tombol aksi berbentuk ikon dengan keterangan saat disorot.
 *
 * Satu komponen untuk tiga bentuk yang dipakai tabel ini — tombol biasa,
 * tautan luar (`href`), dan tautan dalam aplikasi (`to`) — supaya ukuran,
 * jarak, dan cara keterangannya muncul tidak menyimpang antar-baris.
 *
 * `aria-label` WAJIB ada: isinya cuma ikon, jadi tanpa label itu pembaca layar
 * hanya mendengar "tombol". Tooltip Radix tidak menggantikannya — ia baru
 * terpasang saat disorot atau difokus.
 */
const AksiIkon = ({ label, onClick, href, to, className, children }: {
    label: string;
    onClick?: () => void;
    href?: string;
    to?: string;
    className?: string;
    children: React.ReactNode;
}) => {
    const gaya = cn("h-8 w-8", className);
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {href ? (
                    <Button variant="outline" size="icon" className={gaya} asChild>
                        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>{children}</a>
                    </Button>
                ) : to ? (
                    <Button variant="outline" size="icon" className={gaya} asChild>
                        <Link to={to} aria-label={label}>{children}</Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="icon" className={gaya} onClick={onClick} aria-label={label}>
                        {children}
                    </Button>
                )}
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
};

const fetchActivityDetails = async (id: string): Promise<Kegiatan> => {
    return apiClient.get<Kegiatan>(`/kegiatan/${id}`);
};

const updateDocumentStatus = async ({ dokumenId, status, username, rejectionNote }: { dokumenId: number, status: Dokumen['status'], username: string, rejectionNote?: string }) => {
    return apiClient.put(`/kegiatan/dokumen/${dokumenId}/status`, { status, username, rejectionNote });
};

const approveTahapan = async ({ kegiatanId, tipe, username }: { kegiatanId: number, tipe: Dokumen['tipe'], username: string }) => {
    return apiClient.put(`/kegiatan/${kegiatanId}/tahapan/approve`, { tipe, username });
};

/**
 * Endpoint terpisah dari simpan dokumen biasa: mengalihkan tanggung jawab tidak
 * boleh mengubah status persetujuan dokumen yang sudah disetujui.
 */
const ubahPenanggungJawab = async (
    { dokumenId, penanggungJawab, username }:
    { dokumenId: number; penanggungJawab: 'ketua_tim' | 'keuangan'; username: string },
) => apiClient.put(`/kegiatan/dokumen/${dokumenId}/penanggung-jawab`, { penanggungJawab, username });

/**
 * Menambah dokumen dari View Documents.
 *
 * Dipakai tim keuangan untuk mendaftarkan dokumen yang mereka tahu diperlukan
 * sementara ketua tim belum tentu tahu. Yang MENGISI tetap ketua tim, jadi
 * `penanggungJawab` sengaja 'ketua_tim' dan dokumennya ditandai wajib supaya
 * ikut menahan tenggat sampai benar-benar diisi.
 */
const tambahDokumen = async (
    { kegiatanId, nama, tipe, username }:
    { kegiatanId: number; nama: string; tipe: Dokumen['tipe']; username: string },
) => apiClient.post('/kegiatan/dokumen', {
    username,
    documentData: {
        kegiatanId, nama, tipe,
        jenis: 'link', isWajib: true, penanggungJawab: 'ketua_tim',
    },
});

/**
 * Mengirim pengingat "dokumen ini belum diisi" ke ketua tim dan pembuat kegiatan.
 * Server menolak dengan 409 bila pengingatnya sudah pernah dikirim.
 */
const kirimPengingat = async (dokumenId: number) =>
    apiClient.post(`/kegiatan/dokumen/${dokumenId}/pengingat`, {});

/** Ganti nama dokumen. Tidak menyentuh status — bukan pengunggahan ulang. */
const gantiNamaDokumen = async ({ dokumenId, nama }: { dokumenId: number; nama: string }) =>
    apiClient.put(`/kegiatan/dokumen/${dokumenId}/nama`, { nama });

const hapusDokumen = async (dokumenId: number) =>
    apiClient.delete(`/kegiatan/dokumen/${dokumenId}`);

/** Tim keuangan mengisi link lewat endpoint simpan dokumen yang sudah ada. */
const simpanLinkDokumen = async (
    { dokumenId, link, username }: { dokumenId: number; link: string; username: string },
) => apiClient.put(`/kegiatan/dokumen/${dokumenId}`, { documentData: { link }, username });

export default function ViewDocuments() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const tahapFromNotif = searchParams.get('tahap');
    const { user } = useAuth(); 
    const queryClient = useQueryClient();
    const [noteViewModal, setNoteViewModal] = useState<{ isOpen: boolean; title: string; content: string }>({ isOpen: false, title: '', content: '' });
    const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean; onConfirm: () => void; title: string; description: string }>({ isOpen: false, onConfirm: () => {}, title: '', description: '' });
    const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; dokumenId: number; namaDokumen: string; alasan: string }>({ isOpen: false, dokumenId: 0, namaDokumen: '', alasan: '' });
    const [linkModal, setLinkModal] = useState<{ isOpen: boolean; dokumenId: number; namaDokumen: string; link: string; galat: string }>({ isOpen: false, dokumenId: 0, namaDokumen: '', link: '', galat: '' });
    // Tab dikendalikan supaya tombol "Tambah Dokumen" tahu tahap mana yang
    // sedang dibuka, tanpa memaksa pengguna memilihnya lagi.
    const [tahapAktif, setTahapAktif] = useState<Dokumen['tipe']>(
        (tahapFromNotif as Dokumen['tipe']) || 'persiapan');
    const [catatanModal, setCatatanModal] = useState<{ isOpen: boolean; tahap: string; isi: string[] }>({ isOpen: false, tahap: '', isi: [] });
    const [tambahModal, setTambahModal] = useState<{ isOpen: boolean; nama: string; galat: string }>({ isOpen: false, nama: '', galat: '' });
    const [konfirmasiPengingat, setKonfirmasiPengingat] = useState<{ isOpen: boolean; dokumenId: number; namaDokumen: string }>(
        { isOpen: false, dokumenId: 0, namaDokumen: '' });
    const [kelolaModal, setKelolaModal] = useState<{ isOpen: boolean; dokumenId: number; namaAwal: string; nama: string; isWajib: boolean; galat: string }>(
        { isOpen: false, dokumenId: 0, namaAwal: '', nama: '', isWajib: false, galat: '' });

    // Persetujuan adalah wewenang admin & supervisor. Sebelumnya kontrolnya
    // hanya di-`disabled`, sehingga peran lain tetap melihat kolom dan tombol
    // yang tidak akan pernah bisa mereka pakai.
    const bolehMenyetujui = user?.role === 'admin' || user?.role === 'supervisor';

    const { data: activityData, isLoading } = useQuery({
        queryKey: ['kegiatan', id],
        queryFn: () => fetchActivityDetails(id!),
        enabled: !!id,
    });

    // Perbaikan dokumen adalah wewenang pemilik kegiatan, bukan pemeriksanya.
    // Aturan yang sama dipakai server; lihat @shared/hakKegiatan.
    const bolehMengedit = bolehMenyuntingKegiatan(user as any, activityData as any);

    /**
     * Tab tahap mengikuti pengaturan kegiatan: tahap Pengolahan/Diseminasi yang
     * dimatikan tidak ditampilkan sama sekali, dan muncul lagi begitu kegiatan
     * disunting menjadi punya jadwal tahap itu. Boolean() karena database
     * mengirim 0/1 — angka 0 di JSX tercetak sebagai "0".
     */
    const pengolahanAktif = Boolean(activityData?.adaPengolahan ?? true);
    const diseminasiAktif = Boolean(activityData?.adaDiseminasi ?? true);
    const jumlahTab = 2 + (pengolahanAktif ? 1 : 0) + (diseminasiAktif ? 1 : 0);

    // Tautan notifikasi bisa menunjuk tahap yang kini sudah dimatikan; tanpa
    // ini Radix kehilangan tab aktifnya dan halaman tampak kosong.
    useEffect(() => {
        if ((tahapAktif === 'pengolahan-analisis' && !pengolahanAktif)
            || (tahapAktif === 'diseminasi-evaluasi' && !diseminasiAktif)) {
            setTahapAktif('persiapan');
        }
    }, [tahapAktif, pengolahanAktif, diseminasiAktif]);

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

    const penanggungJawabMutation = useMutation({
        mutationFn: ubahPenanggungJawab,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kegiatan', id] }),
    });

    const linkMutation = useMutation({
        mutationFn: simpanLinkDokumen,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kegiatan', id] });
            setLinkModal({ isOpen: false, dokumenId: 0, namaDokumen: '', link: '', galat: '' });
        },
        onError: (error: any) => setLinkModal(prev => ({ ...prev, galat: error.message })),
    });

    const tambahMutation = useMutation({
        mutationFn: tambahDokumen,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kegiatan', id] });
            setTambahModal({ isOpen: false, nama: '', galat: '' });
        },
        onError: (error: any) => setTambahModal(prev => ({ ...prev, galat: error.message })),
    });

    const handleTambahDokumen = () => {
        const nama = tambahModal.nama.trim();
        if (!nama) {
            setTambahModal(prev => ({ ...prev, galat: 'Nama dokumen wajib diisi.' }));
            return;
        }
        tambahMutation.mutate({
            kegiatanId: activityData!.id, nama, tipe: tahapAktif, username: user!.username,
        });
    };

    const pengingatMutation = useMutation({
        mutationFn: kirimPengingat,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kegiatan', id] });
            setKonfirmasiPengingat({ isOpen: false, dokumenId: 0, namaDokumen: '' });
        },
        onError: (error: any) => {
            // Termasuk 409 "sudah pernah dikirim": itu keadaan yang wajar bila
            // dua tab dibuka bersamaan, bukan kerusakan. Daftarnya disegarkan
            // supaya layar langsung menampilkan keadaan yang sebenarnya.
            queryClient.invalidateQueries({ queryKey: ['kegiatan', id] });
            setKonfirmasiPengingat({ isOpen: false, dokumenId: 0, namaDokumen: '' });
            setNoteViewModal({ isOpen: true, title: 'Pengingat Tidak Terkirim', content: error.message });
        },
    });

    const namaMutation = useMutation({
        mutationFn: gantiNamaDokumen,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kegiatan', id] });
            setKelolaModal(m => ({ ...m, isOpen: false }));
        },
        onError: (error: any) => setKelolaModal(m => ({ ...m, galat: error.message })),
    });

    const hapusMutation = useMutation({
        mutationFn: hapusDokumen,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kegiatan', id] });
            setKelolaModal(m => ({ ...m, isOpen: false }));
        },
        onError: (error: any) => setKelolaModal(m => ({ ...m, galat: error.message })),
    });

    const handleGantiNama = () => {
        const nama = kelolaModal.nama.trim();
        if (!nama) {
            setKelolaModal(m => ({ ...m, galat: 'Nama dokumen wajib diisi.' }));
            return;
        }
        namaMutation.mutate({ dokumenId: kelolaModal.dokumenId, nama });
    };

    /**
     * Penghapusan dikonfirmasi terpisah, dan peringatannya menyebut akibatnya
     * secara spesifik — dokumen wajib yang hilang berarti syarat kelengkapan
     * kegiatan ikut hilang, bukan sekadar satu baris tabel.
     */
    const handleHapusDokumen = () => {
        setConfirmationModal({
            isOpen: true,
            title: 'Hapus Dokumen?',
            description: kelolaModal.isWajib
                ? `Dokumen "${kelolaModal.namaAwal}" adalah dokumen WAJIB. Menghapusnya berarti dokumen ini tidak lagi dituntut pada kegiatan ini, dan link yang sudah diisi ikut hilang. Tindakan ini tidak bisa dibatalkan.`
                : `Dokumen "${kelolaModal.namaAwal}" akan dihapus beserta link yang sudah diisi. Tindakan ini tidak bisa dibatalkan.`,
            onConfirm: () => {
                hapusMutation.mutate(kelolaModal.dokumenId);
                setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            },
        });
    };

    const handleSimpanLink = () => {
        const hasil = periksaTautan(linkModal.link, { wajib: true });
        if (!hasil.sah) {
            setLinkModal(prev => ({ ...prev, galat: hasil.galat ?? 'Link tidak valid.' }));
            return;
        }
        linkMutation.mutate({ dokumenId: linkModal.dokumenId, link: hasil.tautan, username: user!.username });
    };

    const handleAlihkan = (doc: Dokumen) => {
        const keKeuangan = !dikelolaKeuangan(doc);
        setConfirmationModal({
            isOpen: true,
            title: keKeuangan ? 'Alihkan ke Tim Keuangan?' : 'Kembalikan ke Ketua Tim?',
            description: keKeuangan
                ? `Dokumen "${doc.nama}" akan diisi tim keuangan dari halaman ini. Dokumen ini tidak lagi menahan tenggat maupun peringatan dashboard ketua tim.`
                : `Dokumen "${doc.nama}" kembali menjadi tanggung jawab ketua tim, diisi lewat halaman Edit Kegiatan, dan kembali menahan tenggat.`,
            onConfirm: () => {
                penanggungJawabMutation.mutate({
                    dokumenId: doc.id!,
                    penanggungJawab: keKeuangan ? 'keuangan' : 'ketua_tim',
                    username: user!.username,
                });
                setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            },
        });
    };

    const handleStatusChange = (dokumenId: number, status: Dokumen['status']) => {
        statusMutation.mutate({ dokumenId, status, username: user!.username });
    };

    const handleTolak = () => {
        if (!rejectModal.alasan.trim()) return;
        statusMutation.mutate({
            dokumenId: rejectModal.dokumenId,
            status: 'Rejected',
            username: user!.username,
            rejectionNote: rejectModal.alasan.trim(),
        });
        setRejectModal({ isOpen: false, dokumenId: 0, namaDokumen: '', alasan: '' });
    };
    
    const handleApproveTahapan = (tipe: Dokumen['tipe']) => {
        setConfirmationModal({
            isOpen: true,
            title: `Setujui Semua Dokumen?`,
            description: `Anda akan menyetujui semua dokumen untuk tahap "${tipe.replace(/-/g, ' ')}". Aksi ini tidak dapat dibatalkan secara massal.`,
            onConfirm: () => tahapanMutation.mutate({ kegiatanId: parseInt(id!), tipe, username: user!.username })
        });
    };

    // Warna status dipusatkan di @/lib/statusStyles supaya konsisten dengan
    // Dashboard dan tetap terbaca di mode gelap.
    const getStatusColor = (status?: string) =>
        GAYA_STATUS_DOKUMEN[status ?? ''] ?? NADA_STATUS.netral;

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'Pending': return <Clock className="w-3 h-3" />;
            case 'Reviewed': return <Eye className="w-3 h-3" />;
            case 'Approved': return <CheckCircle className="w-3 h-3" />;
            case 'Rejected': return <XCircle className="w-3 h-3" />;
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
            return <div className="text-center py-12 text-muted-foreground"><FileText className="w-12 h-12 mx-auto mb-4 text-border" /><p>Belum ada dokumen untuk fase ini.</p></div>;
        }
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        {/* Kolom "Jenis" dibuang: setelah catatan dikeluarkan dari
                            tabel ini, seluruh barisnya adalah dokumen — kolomnya
                            hanya mengulang kata yang sama di setiap baris. */}
                        <TableHead>Nama Dokumen</TableHead>
                        {/* Kolom ini TANPA syarat. Penggerbangan peran terjadi di
                            DALAM selnya, bukan di sekeliling kolomnya — kolom
                            bersyarat yang kondisinya menyimpang antara kepala dan
                            isi pernah menggeser seluruh tabel. Satu-satunya kolom
                            bersyarat yang boleh ada di sini adalah "Persetujuan". */}
                        <TableHead>Penanggung Jawab</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Last Approved</TableHead>
                        <TableHead>Aksi</TableHead>
                        {bolehMenyetujui && <TableHead>Persetujuan</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents.map((doc) => {
                        const isApproved = doc.status === 'Approved';
                        
                        // Tentukan apakah item ini adalah catatan
                        const isNote = doc.jenis === 'catatan';

                        return (
                            <TableRow key={doc.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-start gap-2">
                                        {isNote ? <Notebook className="w-4 h-4 text-orange-600 dark:text-orange-300 mt-1 flex-shrink-0" /> : <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-300 mt-1 flex-shrink-0" />} 
                                        {/* ✔️ Logika Tampilan Baru */}
                                        {isNote ? (
                                            <p className="text-foreground whitespace-pre-wrap break-words">{doc.nama}</p>
                                        ) : (
                                            <p>{doc.nama}</p>
                                        )}
                                    </div>
                                </TableCell>
                                {/* Sel pasangan kolom "Penanggung Jawab". Selalu
                                    dirender; hanya isinya yang bergantung peran. */}
                                <TableCell>
                                    {isNote ? (
                                        <span className="text-xs text-muted-foreground">—</span>
                                    ) : (
                                        <div className="space-y-1">
                                            <Badge className={cn("font-semibold", dikelolaKeuangan(doc)
                                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300")}>
                                                {labelPenanggungJawab(doc)}
                                            </Badge>
                                            {bolehMenyetujui && (
                                                <Button variant="ghost" size="sm"
                                                    className="h-6 px-1 text-xs text-muted-foreground hover:text-foreground"
                                                    onClick={() => handleAlihkan(doc)}
                                                    disabled={penanggungJawabMutation.isPending}>
                                                    {dikelolaKeuangan(doc) ? 'Kembalikan ke Ketua Tim' : 'Alihkan ke Tim Keuangan'}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn("flex items-center gap-1 w-fit", getStatusColor(doc.status))}>{getStatusIcon(doc.status)} {doc.status || 'N/A'}</Badge>
                                    {/* Alasan penolakan ditampilkan langsung supaya ketua tim
                                        tahu apa yang harus diperbaiki tanpa membuka apa pun. */}
                                    {doc.status === 'Rejected' && doc.rejectionNote && (
                                        <p className="mt-1 max-w-[16rem] text-xs italic text-red-600 dark:text-red-300">
                                            "{doc.rejectionNote}"
                                        </p>
                                    )}
                                </TableCell>
                                <TableCell>{getRelativeTime(doc.uploadedAt)}</TableCell>
                                <TableCell>
                                    {doc.lastApproved ? (
                                        <div className="text-xs">
                                            <p className="font-medium">{getRelativeTime(doc.lastApproved)}</p>
                                            <p className="text-muted-foreground">oleh {doc.lastApprovedBy}</p>
                                        </div>
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                  {/* Ikon berderet, keterangannya muncul saat
                                      disorot. Sebelumnya tombol berlabel penuh
                                      ditumpuk vertikal, dan pada dokumen yang
                                      punya tiga aksi sekaligus barisnya jadi
                                      setinggi tiga tombol. */}
                                  <div className="flex items-center gap-1">
                                    {isNote ? (
                                        <AksiIkon
                                            label="Lihat Detail"
                                            onClick={() => setNoteViewModal({
                                                isOpen: true,
                                                title: `Catatan ${doc.tipe.replace('-', ' ')}`,
                                                content: doc.nama,
                                            })}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </AksiIkon>
                                    ) : (
                                        // Tautan disaring saat DIRENDER, bukan ditolak: baris
                                        // lama tersimpan sebelum ada validasi, dan sebagiannya
                                        // berisi teks sembarang, bukan alamat. Skema selain
                                        // http/https tidak boleh jadi href sama sekali — nilai
                                        // ini dulu dipasang mentah, sehingga `javascript:` yang
                                        // tersimpan akan benar-benar berjalan saat diklik.
                                        hrefAman(doc.link) ? (
                                            <AksiIkon label="Buka Link" href={hrefAman(doc.link)!}>
                                                <ExternalLink className="w-4 h-4" />
                                            </AksiIkon>
                                        ) : doc.link ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="inline-flex h-8 w-8 items-center justify-center text-amber-600 dark:text-amber-400">
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>Link tidak valid — perbaiki di Edit Kegiatan</TooltipContent>
                                            </Tooltip>
                                        ) : null
                                        // Link kosong sengaja TIDAK diberi keterangan di sini:
                                        // keterangannya pindah ke kolom Persetujuan, bersama
                                        // tombol pengingatnya.
                                    )}

                                    {/* Tim keuangan merapikan atau membatalkan dokumen —
                                        terutama dokumen yang ia tambahkan sendiri dan
                                        ternyata keliru. */}
                                    {bolehMenyetujui && !isNote && (
                                        <AksiIkon
                                            label="Kelola (ganti nama / hapus)"
                                            onClick={() => setKelolaModal({
                                                isOpen: true, dokumenId: doc.id!, namaAwal: doc.nama,
                                                nama: doc.nama, isWajib: Boolean(doc.isWajib), galat: '',
                                            })}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </AksiIkon>
                                    )}

                                    {/* Tim keuangan mengisi link dokumennya di sini,
                                        karena Edit Kegiatan hanya bisa diakses ketua
                                        tim. Dialog, bukan input inline: tabel ini
                                        sudah delapan kolom dan akan membungkus buruk
                                        di layar laptop bila disisipi kotak teks. */}
                                    {bolehMengisiLinkKeuangan(doc, user?.role) && !isNote && (
                                        <AksiIkon
                                            label={doc.link ? 'Ubah Link' : 'Isi Link'}
                                            onClick={() => setLinkModal({
                                                isOpen: true, dokumenId: doc.id!, namaDokumen: doc.nama,
                                                link: doc.link ?? '', galat: '',
                                            })}
                                        >
                                            <Link2 className="w-4 h-4" />
                                        </AksiIkon>
                                    )}

                                    {/* Jalan pintas perbaikan. Hanya muncul pada dokumen
                                        yang ditolak, dan hanya bagi yang berhak menyunting —
                                        pemeriksa tidak perlu melihatnya. Dokumen keuangan
                                        sengaja dikecualikan: mengarahkan ketua tim ke
                                        halaman yang mengunci dokumen itu hanya membuatnya
                                        bingung. */}
                                    {doc.status === 'Rejected' && bolehKetuaTimMenyunting(doc, bolehMengedit) && !isNote && (
                                        <AksiIkon
                                            label="Perbaiki Dokumen"
                                            to={`/edit-activity/${activityData?.id}?tab=dokumen&tahap=${doc.tipe}&dok=${doc.id}`}
                                            className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                                        >
                                            <Wrench className="w-4 h-4" />
                                        </AksiIkon>
                                    )}
                                  </div>
                                </TableCell>
                                {/* Kolom ini HARUS memakai kondisi yang sama dengan
                                    kepala kolomnya, kalau tidak jumlah kolomnya bergeser. */}
                                {bolehMenyetujui && (
                                    <TableCell>
                                        {/* Dokumen tanpa link tidak bisa disetujui maupun
                                            ditolak — tidak ada apa pun untuk dinilai. Jadi
                                            kolom ini berubah peran: ia menjelaskan kenapa
                                            kosong, dan menawarkan satu-satunya tindakan yang
                                            masuk akal, yaitu menegur yang harus mengisinya. */}
                                        {!isNote && !doc.link ? (
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Link dokumen belum diisi</p>
                                                {doc.pengingatDikirimPada ? (
                                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                                        Pengingat terkirim {getRelativeTime(doc.pengingatDikirimPada)}
                                                        {doc.pengingatDikirimOleh ? ` oleh ${doc.pengingatDikirimOleh}` : ''}
                                                    </p>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center gap-1"
                                                        disabled={pengingatMutation.isPending}
                                                        onClick={() => setKonfirmasiPengingat({
                                                            isOpen: true, dokumenId: doc.id!, namaDokumen: doc.nama,
                                                        })}
                                                    >
                                                        <BellRing className="w-3 h-3" /> Kirim Notifikasi
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                        <div className="flex items-center gap-1">
                                            {!isApproved && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleStatusChange(doc.id!, 'Approved')}
                                                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <ThumbsUp className="w-3 h-3" /> Setujui
                                                </Button>
                                            )}
                                            {/* "Tolak" menggantikan "Batal": menulis Pending seperti dulu
                                                tidak bisa dibedakan dari dokumen yang baru diunggah, sehingga
                                                ketua tim tidak pernah tahu dokumennya ditolak. */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setRejectModal({ isOpen: true, dokumenId: doc.id!, namaDokumen: doc.nama, alasan: '' })}
                                                className="flex items-center gap-1 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
                                            >
                                                <ThumbsDown className="w-3 h-3" /> Tolak
                                            </Button>
                                        </div>
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    };

    const renderTahapanContent = (tipe: Dokumen['tipe'], title: string) => {
        const semua = activityData?.dokumen.filter(d => d.tipe === tipe) ?? [];
        // Catatan bukan dokumen: ia tidak punya link, tidak disetujui, dan tidak
        // menahan tenggat. Dikeluarkan dari tabel dan dipindah ke tombol
        // "Catatan" di kepala kartu ini.
        const documents = semua.filter(d => d.jenis !== 'catatan');
        const catatan = semua.filter(d => d.jenis === 'catatan');
        const allApproved = documents.length > 0 ? documents.every(d => d.status === 'Approved') : false;

        return (
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap justify-between items-center gap-2">
                        <CardTitle>{title}</CardTitle>
                        <div className="flex items-center gap-2">
                        {/* Catatan tahap ini, ditulis dari halaman Edit Kegiatan. */}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCatatanModal({
                                isOpen: true, tahap: title, isi: catatan.map(c => c.nama),
                            })}
                            disabled={catatan.length === 0}
                            title={catatan.length === 0 ? 'Belum ada catatan untuk tahap ini' : undefined}
                        >
                            <Notebook className="w-4 h-4 mr-2" />
                            Catatan{catatan.length > 0 ? ` (${catatan.length})` : ''}
                        </Button>
                        {bolehMenyetujui && (
                            <Button
                                size="sm"
                                onClick={() => handleApproveTahapan(tipe)}
                                disabled={allApproved || !documents || documents.length === 0}
                                className="disabled:bg-muted disabled:text-muted-foreground"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {allApproved ? 'Tahap Disetujui' : 'Setujui Tahap Ini'}
                            </Button>
                        )}
                        </div>
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
                    <div><h1 className="text-3xl font-bold">{activityData.namaKegiatan}</h1><p className="text-muted-foreground">Ringkasan dan daftar semua dokumen terkait.</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Total Dokumen</p><p className="text-2xl font-bold">{totalDocuments}</p></div><FileText className="w-8 h-8 text-blue-500 dark:text-blue-400" /></div></CardContent></Card>
                    <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Approved</p><p className="text-2xl font-bold">{approvedDocuments}</p></div><CheckCircle className="w-8 h-8 text-green-500 dark:text-green-400" /></div></CardContent></Card>
                    <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Ketua Tim</p><p className="text-lg font-medium">{activityData.namaKetua}</p></div><Users className="w-8 h-8 text-purple-500 dark:text-purple-400" /></div></CardContent></Card>
                    <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Status Kegiatan</p><Badge>{activityData.status}</Badge></div><Activity className="w-8 h-8 text-orange-500 dark:text-orange-400" /></div></CardContent></Card>
                </div>
                <Tabs 
                    value={tahapAktif}
                    onValueChange={(v) => setTahapAktif(v as Dokumen['tipe'])} 
                    className="space-y-6"
                    >
                    <TabsList className={cn("grid w-full", jumlahTab === 4 ? "grid-cols-4" : jumlahTab === 3 ? "grid-cols-3" : "grid-cols-2")}>
                        <TabsTrigger value="persiapan">Persiapan <Badge variant="secondary" className="ml-2">{docsByTipe('persiapan').length}</Badge></TabsTrigger>
                        <TabsTrigger value="pengumpulan-data">Pengumpulan Data <Badge variant="secondary" className="ml-2">{docsByTipe('pengumpulan-data').length}</Badge></TabsTrigger>
                        {pengolahanAktif && (<TabsTrigger value="pengolahan-analisis">Pengolahan & Analisis <Badge variant="secondary" className="ml-2">{docsByTipe('pengolahan-analisis').length}</Badge></TabsTrigger>)}
                        {diseminasiAktif && (<TabsTrigger value="diseminasi-evaluasi">Diseminasi & Evaluasi <Badge variant="secondary" className="ml-2">{docsByTipe('diseminasi-evaluasi').length}</Badge></TabsTrigger>)}
                    </TabsList>
                    <TabsContent value="persiapan">{renderTahapanContent('persiapan', 'Dokumen Persiapan')}</TabsContent>
                    <TabsContent value="pengumpulan-data">{renderTahapanContent('pengumpulan-data', 'Dokumen Pengumpulan Data')}</TabsContent>
                    {pengolahanAktif && (<TabsContent value="pengolahan-analisis">{renderTahapanContent('pengolahan-analisis', 'Dokumen Pengolahan & Analisis')}</TabsContent>)}
                    {diseminasiAktif && (<TabsContent value="diseminasi-evaluasi">{renderTahapanContent('diseminasi-evaluasi', 'Dokumen Diseminasi & Evaluasi')}</TabsContent>)}
                </Tabs>
                {/* Hanya bagi yang berhak menyunting. Sebelumnya banner ini tampil
                    untuk semua peran, sehingga supervisor pun diarahkan ke halaman
                    yang seharusnya bukan wewenangnya. */}
                {/* Tim keuangan tidak menyunting dokumen, tapi boleh MENDAFTARKAN
                    dokumen yang ia tahu diperlukan — sering kali ketua tim belum
                    tahu sesuatu itu disyaratkan. Yang mengisinya tetap ketua tim. */}
                {!bolehMengedit && bolehMenyetujui && (
                    <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-950/40 border rounded-lg">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h4 className="font-medium text-indigo-900 dark:text-indigo-300">Perlu Menambah Dokumen?</h4>
                                <p className="text-indigo-700 dark:text-indigo-300 text-sm mt-1">
                                    Daftarkan dokumen yang diperlukan pada tahap yang sedang dibuka.
                                    Pengisiannya menjadi tugas ketua tim.
                                </p>
                            </div>
                            <Button onClick={() => setTambahModal({ isOpen: true, nama: '', galat: '' })}>
                                <Plus className="w-4 h-4 mr-2" /> Tambah Dokumen
                            </Button>
                        </div>
                    </div>
                )}
                {bolehMengedit && (
                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/40 border rounded-lg"><div className="flex items-center justify-between"><div><h4 className="font-medium text-blue-900 dark:text-blue-300">Perlu Menambah atau Mengedit Dokumen?</h4><p className="text-blue-700 dark:text-blue-300 text-sm mt-1">Gunakan halaman Edit untuk mengelola semua dokumen dan laporan.</p></div><Button asChild className="bg-blue-600 hover:bg-blue-700"><Link to={`/edit-activity/${activityData.id}?tab=dokumen&tahap=${tahapAktif}`}>Ke Halaman Edit</Link></Button></div></div>
                )}
            </div>

            <Dialog open={noteViewModal.isOpen} onOpenChange={(isOpen) => !isOpen && setNoteViewModal({ isOpen: false, title: '', content: '' })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{noteViewModal.title}</DialogTitle>
                        <DialogDescription>Catatan untuk tahap ini.</DialogDescription>
                    </DialogHeader>
                    <div className="prose prose-sm max-w-none py-4 whitespace-pre-wrap bg-muted p-4 rounded-md text-foreground max-h-[50vh] overflow-y-auto">
                        {noteViewModal.content || "Belum ada catatan yang ditambahkan."}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNoteViewModal({ isOpen: false, title: '', content: '' })}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Dialog penolakan. Alasannya wajib — notifikasi penolakan ke ketua
                tim tidak berguna kalau tidak menyebutkan apa yang harus dibetulkan. */}
            <Dialog
                open={rejectModal.isOpen}
                onOpenChange={(open) => !open && setRejectModal({ isOpen: false, dokumenId: 0, namaDokumen: '', alasan: '' })}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Dokumen</DialogTitle>
                        <DialogDescription>
                            Jelaskan apa yang perlu diperbaiki pada "{rejectModal.namaDokumen}".
                            Alasan ini akan muncul di notifikasi ketua tim.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={rejectModal.alasan}
                        onChange={(e) => setRejectModal(m => ({ ...m, alasan: e.target.value }))}
                        placeholder="Contoh: Tabel 3 belum diisi, dan periode datanya masih tahun lalu."
                        rows={4}
                        autoFocus
                    />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectModal({ isOpen: false, dokumenId: 0, namaDokumen: '', alasan: '' })}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleTolak}
                            disabled={!rejectModal.alasan.trim() || statusMutation.isPending}
                        >
                            <ThumbsDown className="w-4 h-4 mr-2" /> Tolak Dokumen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pengisian link oleh tim keuangan. Divalidasi dengan aturan yang
                sama seperti jalur ketua tim, jadi tidak ada pintu belakang yang
                lebih longgar. */}
            <Dialog
                open={linkModal.isOpen}
                onOpenChange={(open) => !open && setLinkModal({ isOpen: false, dokumenId: 0, namaDokumen: '', link: '', galat: '' })}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Isi Link Dokumen</DialogTitle>
                        <DialogDescription>
                            Tautan untuk "{linkModal.namaDokumen}". Setelah disimpan, dokumen ini
                            masuk antrean persetujuan seperti unggahan lainnya.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={linkModal.link}
                        onChange={(e) => setLinkModal(m => ({ ...m, link: e.target.value, galat: '' }))}
                        placeholder="https://drive.google.com/..."
                        autoFocus
                        aria-invalid={!!linkModal.galat}
                        className={cn(linkModal.galat && "border-red-400 focus-visible:ring-red-400 dark:border-red-700")}
                    />
                    {linkModal.galat && (
                        <p className="text-xs text-red-600 dark:text-red-300">{linkModal.galat}</p>
                    )}
                    <DialogFooter>
                        <Button variant="outline"
                            onClick={() => setLinkModal({ isOpen: false, dokumenId: 0, namaDokumen: '', link: '', galat: '' })}>
                            Batal
                        </Button>
                        <Button onClick={handleSimpanLink} disabled={linkMutation.isPending}>
                            <Link2 className="w-4 h-4 mr-2" /> Simpan Link
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Catatan tahap: ditulis dari halaman Edit Kegiatan, dibaca di sini. */}
            <Dialog
                open={catatanModal.isOpen}
                onOpenChange={(open) => !open && setCatatanModal({ isOpen: false, tahap: '', isi: [] })}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Catatan — {catatanModal.tahap}</DialogTitle>
                        <DialogDescription>
                            Catatan ditambahkan dari halaman Edit Kegiatan oleh ketua tim.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        {catatanModal.isi.map((teks, i) => (
                            <p key={i} className="whitespace-pre-wrap break-words rounded bg-muted p-3 text-sm text-foreground">
                                {teks}
                            </p>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Tim keuangan mendaftarkan dokumen yang diperlukan. */}
            <Dialog
                open={tambahModal.isOpen}
                onOpenChange={(open) => !open && setTambahModal({ isOpen: false, nama: '', galat: '' })}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Dokumen</DialogTitle>
                        <DialogDescription>
                            Dokumen ditambahkan ke tahap <strong>{tahapAktif.replace(/-/g, ' ')}</strong>,
                            ditandai wajib, dan pengisiannya menjadi tugas ketua tim.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={tambahModal.nama}
                        onChange={(e) => setTambahModal(m => ({ ...m, nama: e.target.value, galat: '' }))}
                        placeholder="Contoh: Surat Tugas Pengawas"
                        autoFocus
                        aria-invalid={!!tambahModal.galat}
                        className={cn(tambahModal.galat && "border-red-400 focus-visible:ring-red-400 dark:border-red-700")}
                    />
                    {tambahModal.galat && (
                        <p className="text-xs text-red-600 dark:text-red-300">{tambahModal.galat}</p>
                    )}
                    <DialogFooter>
                        <Button variant="outline"
                            onClick={() => setTambahModal({ isOpen: false, nama: '', galat: '' })}>
                            Batal
                        </Button>
                        <Button onClick={handleTambahDokumen} disabled={tambahMutation.isPending}>
                            <Plus className="w-4 h-4 mr-2" /> Tambah
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pengingat hanya bisa dikirim SEKALI selama link-nya masih
                kosong, jadi ia dikonfirmasi lebih dulu — tidak ada tombol
                "batalkan pengiriman" setelahnya. */}
            <ConfirmationModal
                isOpen={konfirmasiPengingat.isOpen}
                onClose={() => setKonfirmasiPengingat({ isOpen: false, dokumenId: 0, namaDokumen: '' })}
                onConfirm={() => pengingatMutation.mutate(konfirmasiPengingat.dokumenId)}
                title="Kirim Pengingat?"
                description={`Ketua tim dan pembuat kegiatan akan menerima notifikasi bahwa link dokumen "${konfirmasiPengingat.namaDokumen}" belum diisi. Pengingat hanya bisa dikirim sekali, dan hilang sendiri begitu dokumennya diisi.`}
                confirmLabel="Ya, Kirim"
                cancelLabel="Batal"
            />

            {/* Kelola dokumen: ganti nama atau hapus. */}
            <Dialog
                open={kelolaModal.isOpen}
                onOpenChange={(open) => !open && setKelolaModal(m => ({ ...m, isOpen: false }))}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kelola Dokumen</DialogTitle>
                        <DialogDescription>
                            Ganti nama dokumen, atau hapus bila memang tidak diperlukan.
                            Mengganti nama tidak mengubah status persetujuannya.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="namaDokumen">Nama Dokumen</Label>
                        <Input
                            id="namaDokumen"
                            value={kelolaModal.nama}
                            onChange={(e) => setKelolaModal(m => ({ ...m, nama: e.target.value, galat: '' }))}
                            autoFocus
                            aria-invalid={!!kelolaModal.galat}
                            className={cn(kelolaModal.galat && "border-red-400 focus-visible:ring-red-400 dark:border-red-700")}
                        />
                        {kelolaModal.isWajib && (
                            <p className="text-xs text-muted-foreground">
                                Dokumen ini ditandai <strong>wajib</strong> untuk kegiatan ini.
                            </p>
                        )}
                        {kelolaModal.galat && (
                            <p className="text-xs text-red-600 dark:text-red-300">{kelolaModal.galat}</p>
                        )}
                    </div>
                    <DialogFooter className="sm:justify-between">
                        <Button variant="destructive" onClick={handleHapusDokumen}
                            disabled={hapusMutation.isPending}>
                            <Trash2 className="w-4 h-4 mr-2" /> Hapus Dokumen
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline"
                                onClick={() => setKelolaModal(m => ({ ...m, isOpen: false }))}>
                                Batal
                            </Button>
                            <Button onClick={handleGantiNama}
                                disabled={namaMutation.isPending || kelolaModal.nama.trim() === kelolaModal.namaAwal}>
                                Simpan Nama
                            </Button>
                        </div>
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