// Dipisah dari client/pages/Dashboard.tsx tanpa mengubah isinya.

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { bolehMemperbaruiProgress, PESAN_PROGRES_BELUM_DIBUKA } from "@shared/hakKegiatan";
import { kunciGalat } from "@/lib/progressMitra";
import { EditableProgressKey, PPLWithProgress, getProgressBarValue } from "@/components/dashboard/logikaDashboard";

/**
 * Kartu pembaruan progress satu alokasi PPL.
 *
 * DIDEFINISIKAN DI TINGKAT MODUL, bukan di dalam `Dashboard`. Saat masih di
 * dalam, React melihat tipe komponen BARU pada setiap render Dashboard dan
 * memasang ulang semua kartu — `localProgress` yang sedang diketik ikut hilang
 * setiap kali Dashboard render ulang, misalnya saat data disegarkan otomatis
 * ketika jendela kembali difokuskan. `revertNonce` dan `progressErrors` milik
 * Dashboard karena itu dioper sebagai prop.
 */
export const PPLUpdateCard = ({ ppl, handleUpdatePPL, user, revertNonce, progressErrors,
    belumDibuka = false }: {
    ppl: PPLWithProgress,
    handleUpdatePPL: (pplId: number, field: EditableProgressKey, value: string) => void,
    user: any,
    revertNonce: number,
    progressErrors: Record<string, string>,
    /**
     * Kegiatannya masih dalam masa persiapan. Angkanya tetap ditampilkan —
     * hanya pengisiannya yang ditutup, bukan pembacaannya.
     */
    belumDibuka?: boolean,
}) => {
    const [localProgress, setLocalProgress] = useState(ppl.progress);

    // revertNonce ikut jadi dependensi: saat validasi gagal, nilainya
    // dinaikkan supaya kotak kembali ke angka tersimpan alih-alih terus
    // menampilkan angka yang baru saja ditolak. Kini ia prop, bukan nilai
    // milik Dashboard — dependensi yang sah bagi efek ini.
    useEffect(() => {
        setLocalProgress(ppl.progress);
    }, [ppl.progress, revertNonce]);
    // Dua syarat berbeda yang keduanya harus lolos: SIAPA (PML pengawasnya)
    // dan KAPAN (sudah masuk masa pengumpulan data). Digabung di sini supaya
    // setiap kotak isian cukup memeriksa satu nilai.
    const bolehSecaraWewenang = bolehMemperbaruiProgress(user as any, ppl as any);
    const isAuthorized = bolehSecaraWewenang && !belumDibuka;
    const alasanTerkunci = belumDibuka
        ? PESAN_PROGRES_BELUM_DIBUKA
        : (!bolehSecaraWewenang
            ? "Hanya PML yang bersangkutan atau Admin yang dapat mengubah progress"
            : "");
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
    /**
     * Menambah atau mengurangi satu, LANGSUNG tersimpan.
     *
     * Panah bawaan `<input type="number">` sengaja tidak dipakai: klik panah
     * dan ketikan memicu `onChange` yang sama persis, dan tidak ada cara andal
     * lintas peramban untuk membedakan keduanya. Padahal keduanya memang harus
     * berbeda — menambah satu per satu ingin langsung terlihat berpindah,
     * sedangkan angka yang diketik baru boleh disimpan setelah selesai diketik
     * (kalau tidak, mengetik "12" akan tersimpan dulu sebagai "1").
     *
     * Nilai barunya dikirim LANGSUNG ke handleUpdatePPL, bukan lewat state
     * lokal: setState tidak berlaku seketika, dan nilai tersimpannya toh datang
     * kembali lewat `ppl.progress` — jalur itulah yang membuat tahap tetangga
     * ikut menyesuaikan (menambah 'approved' mengurangi 'diperiksa').
     */
    const ubahSatu = (field: EditableProgressKey, delta: number) => {
        const sekarang = Number(localProgress[field] ?? 0);
        const baru = Math.max(0, sekarang + delta);
        if (baru === sekarang) return;
        handleUpdatePPL(ppl.id!, field, String(baru));
    };

    const kotakProgress = (field: EditableProgressKey, label: string) => {
        const galat = progressErrors[kunciGalat(ppl.id!, field)];
        const nilai = Number(localProgress[field] ?? 0);
        return (
            <div key={field}>
                <Label className="text-xs text-muted-foreground capitalize">{label}</Label>
                <div className="mt-1 flex items-center gap-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-7 shrink-0"
                        disabled={!isAuthorized || nilai <= 0}
                        onClick={() => ubahSatu(field, -1)}
                        aria-label={`Kurangi ${label}`}
                    >
                        <Minus className="w-3 h-3" />
                    </Button>
                    <Input
                        type="number"
                        min="0"
                        value={localProgress[field] ?? 0}
                        onChange={e => handleLocalChange(field, e.target.value)}
                        onBlur={() => handleBlur(field)}
                        disabled={!isAuthorized}
                        aria-invalid={!!galat}
                        aria-errormessage={galat ? `err-${ppl.id}-${field}` : undefined}
                        title={alasanTerkunci}
                        className={cn(
                            // Panah bawaan disembunyikan supaya hanya ada SATU cara
                            // menambah satu per satu — yang tersimpan seketika.
                            "text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                            galat && "border-destructive ring-1 ring-destructive focus-visible:ring-destructive"
                        )}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-7 shrink-0"
                        disabled={!isAuthorized}
                        onClick={() => ubahSatu(field, 1)}
                        aria-label={`Tambah ${label}`}
                    >
                        <Plus className="w-3 h-3" />
                    </Button>
                </div>
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
