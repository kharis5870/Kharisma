// Dipisah dari client/pages/EditActivity.tsx tanpa mengubah isinya.

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Users, XCircle } from "lucide-react";
import { PPL, PPLMaster, UserData } from "@shared/api";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { bulanDalamRentang, bulanPembebananSetelahUbah, keTeksTanggal, labelRentang } from "@/lib/honorPeriode";
import type { TahapHonor } from "@/stores/useInputKegiatanStore";
import { formatHonor } from "@/lib/angka";
import { ClientPPL, HonorariumSettings, FormState } from "@/components/edit-kegiatan/tipeEditKegiatan";
import { PPLAllocationItem } from "@/components/edit-kegiatan/PPLAllocationItem";

/** Semua yang dibutuhkan `AlokasiPPLContent` dari `EditActivity`, dioper eksplisit. */
export interface AlokasiPPLContentProps {
    tahap: PPL['tahap'];
    title: string;
    formData: Partial<FormState>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<FormState>>>;
    kegiatanId: string | undefined;
    showClearConfirmModal: { isOpen: boolean; tahap: PPL['tahap'] | null };
    setShowClearConfirmModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; tahap: PPL['tahap'] | null }>>;
    setAlertModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; title: string; message: string }>>;
    addPPL: (tahap: PPL['tahap'], pplsToAdd?: PPLMaster[]) => void;
    mintaHapusPPL: (clientId: string) => void;
    updatePPL: (clientId: string, field: keyof ClientPPL, value: any) => void;
    pplList: PPLMaster[];
    pmlList: UserData[];
}

/**
 * Isi satu tab Alokasi PPL: pengaturan honorarium lalu daftar alokasinya.
 *
 * DIDEFINISIKAN DI TINGKAT MODUL, bukan di dalam `EditActivity`. Saat masih di
 * dalam, React melihat tipe komponen BARU pada setiap render EditActivity dan
 * memasang ulang seluruh tab setiap kali `formData` berubah — state lokalnya
 * (isian harga satuan yang sedang diketik) dan semua kartu alokasi di bawahnya
 * ikut dibongkar. Kelas bug yang sama dengan tombol "Selesai" di tab Dokumen.
 */
export const AlokasiPPLContent = ({
    tahap, title, formData, setFormData, kegiatanId,
    showClearConfirmModal, setShowClearConfirmModal, setAlertModal,
    addPPL, mintaHapusPPL, updatePPL, pplList, pmlList,
}: AlokasiPPLContentProps) => {
    const pplForStage = useMemo(() => formData.ppl?.filter(p => p.tahap === tahap) || [], [formData.ppl, tahap]);
    
    // Nama kolom honor memakai akhiran "Pengolahan", sedangkan tahap PPL
    // bernama "pengolahan-analisis".
    const tahapHonor: TahapHonor =
        tahap === 'listing' ? 'Listing' : tahap === 'pencacahan' ? 'Pencacahan' : 'Pengolahan';

    const rentangHonor = {
        mulai: formData[`tanggalMulaiHonor${tahapHonor}`],
        selesai: formData[`tanggalSelesaiHonor${tahapHonor}`],
    };

    /**
     * Rentang honor sengaja bisa berbeda dari jadwal pendataan, tapi yang
     * sering terjadi adalah salah pilih tanggal. Bedanya diberi tanda kuning
     * — sekadar pengingat untuk memeriksa, bukan larangan.
     */
    const mulaiPendataan = keTeksTanggal(formData.tanggalMulaiPengumpulanData);
    const selesaiPendataan = keTeksTanggal(formData.tanggalSelesaiPengumpulanData);
    const bedaDenganPendataan = Boolean(
        rentangHonor.mulai && rentangHonor.selesai && mulaiPendataan && selesaiPendataan
        && (rentangHonor.mulai !== mulaiPendataan || rentangHonor.selesai !== selesaiPendataan));

    const opsiBulanPembebanan = useMemo(
        () => bulanDalamRentang(rentangHonor.mulai, rentangHonor.selesai),
        [rentangHonor.mulai, rentangHonor.selesai],
    );

    // Rentang dan bulan pembebanan diubah bersama supaya bulan yang
    // dibebani selalu benar-benar tersentuh oleh rentangnya.
    const handleRentangChange = ({ mulai, selesai }: { mulai?: string; selesai?: string }) => {
        setFormData(prev => ({
            ...prev,
            [`tanggalMulaiHonor${tahapHonor}`]: mulai,
            [`tanggalSelesaiHonor${tahapHonor}`]: selesai,
            [`bulanHonor${tahapHonor}`]: bulanPembebananSetelahUbah(mulai, selesai, prev[`bulanHonor${tahapHonor}`]),
        }));
    };

    /**
     * Pengaturan honor dibaca LANGSUNG dari `formData`, tanpa salinan lokal.
     *
     * Dulu ada salinan lokal yang baru disetor ke `formData` saat kotaknya
     * ditinggalkan (blur), karena komponen ini masih didefinisikan di dalam
     * `EditActivity` dan dipasang ulang setiap `formData` berubah — menyetor per
     * ketikan akan membuat kotaknya kehilangan fokus di setiap huruf. Sejak
     * komponen ini berdiri di tingkat modul, alasan itu hilang: harga satuan
     * kini masuk ke form setiap diketik, dan total honor tiap mitra di bawahnya
     * ikut berubah seketika.
     *
     * Bonus: "Batalkan Perubahan" tidak lagi perlu efek penyelaras — tidak ada
     * salinan yang bisa tertinggal dari isi form.
     */
    const pengaturanHonor: HonorariumSettings = formData.honorariumSettings || {
        'pengumpulan-data-listing': { satuanBebanKerja: '', hargaSatuan: '' },
        'pengumpulan-data-pencacahan': { satuanBebanKerja: '', hargaSatuan: '' },
        'pengolahan-analisis': { satuanBebanKerja: '', hargaSatuan: '' },
    };

    const getHonorSettingsKey = (): keyof HonorariumSettings | null => {
        if (tahap === 'listing') return 'pengumpulan-data-listing';
        if (tahap === 'pencacahan') return 'pengumpulan-data-pencacahan';
        if (tahap === 'pengolahan-analisis') return 'pengolahan-analisis';
        return null;
    }
    const honorSettingKey = getHonorSettingsKey();

    const handleSettingChange = (field: 'satuanBebanKerja' | 'hargaSatuan', value: string) => {
        if (!honorSettingKey) return;
        setFormData(prev => {
            const sekarang = prev.honorariumSettings || pengaturanHonor;
            return {
                ...prev,
                honorariumSettings: {
                    ...sekarang,
                    [honorSettingKey]: { ...sekarang[honorSettingKey], [field]: value },
                },
            };
        });
    };

    const handleClearPPLs = () => {
        setFormData(prev => ({ ...prev, ppl: prev.ppl?.filter(p => p.tahap !== tahap)}));
        setShowClearConfirmModal({isOpen: false, tahap: null});
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Alokasi PPL & PML ({title})</CardTitle>
                        <CardDescription>Atur honorarium, bulan pembayaran, lalu alokasikan PPL.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {pplForStage.length > 0 && (
                            <Button type="button" variant="destructive" size="sm" onClick={() => setShowClearConfirmModal({isOpen: true, tahap})}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Clear PPL
                            </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                            <Link to="/daftar-ppl" state={{ from: 'daftar-ppl', kegiatanId, tahap: tahap, existingPplIds: pplForStage.map(p => p.ppl_master_id).filter(Boolean) }}><Users className="w-4 h-4 mr-2" />Pilih dari Daftar PPL</Link>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/40 space-y-4">
                    <h4 className="font-medium text-foreground">Pengaturan Honorarium & Pembayaran</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Satuan Beban Kerja</Label>
                            <Input value={honorSettingKey ? pengaturanHonor[honorSettingKey].satuanBebanKerja : ''} onChange={e => handleSettingChange('satuanBebanKerja', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Harga per Satuan (Rp)</Label>
                            <Input value={honorSettingKey ? formatHonor(pengaturanHonor[honorSettingKey].hargaSatuan) : ''} onChange={e => handleSettingChange('hargaSatuan', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Rentang Tanggal Honor *</Label>
                            <DateRangePicker
                                value={rentangHonor}
                                onChange={handleRentangChange}
                                defaultMonth={formData.tanggalMulaiPersiapan}
                                placeholder="Pilih rentang..."
                            />
                            {bedaDenganPendataan && (
                                <p className="text-xs text-amber-700 dark:text-amber-300">
                                    Berbeda dengan jadwal pendataan ({labelRentang(mulaiPendataan, selesaiPendataan)}).
                                    Pastikan ini disengaja, bukan salah pilih tanggal.
                                </p>
                            )}
                        </div>
                    </div>

                    {opsiBulanPembebanan.length > 1 && (
                        <p className="text-sm text-muted-foreground">
                            Rentang honor melintasi {opsiBulanPembebanan.length} bulan. Pilihan bulannya
                            ada di tiap kartu alokasi PPL di bawah &mdash; batas honor dihitung per mitra
                            per bulan, jadi tiap mitra bisa berbeda.
                        </p>
                    )}

                    {opsiBulanPembebanan.length === 1 && (
                        <div className="text-sm text-muted-foreground">
                            Dibebankan pada bulan{' '}
                            <Badge variant="outline" className="font-medium">{opsiBulanPembebanan[0].label}</Badge>
                        </div>
                    )}
                </div>
                <div className="space-y-4">
                    {pplForStage.map((ppl, index) => {
                        const existingPplIdsForCurrentStage = pplForStage
                            .map(p => p.ppl_master_id)
                            .filter(id => id && id !== ppl.ppl_master_id) as string[];

                        return (
                            <PPLAllocationItem 
                                key={ppl.clientId}
                                tahap={tahap}
                                opsiBulan={opsiBulanPembebanan}
                                ppl={ppl}
                                index={index}
                                onRemove={mintaHapusPPL}
                                onUpdate={updatePPL}
                                setAlertModal={setAlertModal}
                                pplList={pplList}
                                pmlList={pmlList}
                                honorariumSettings={formData.honorariumSettings!}
                                existingPplIds={existingPplIdsForCurrentStage}
                            />
                        )
                    })}
                    <Button type="button" variant="outline" onClick={() => addPPL(tahap)} className="w-full border-dashed"><Plus className="w-4 h-4 mr-2"/>Tambah Alokasi PPL Manual</Button>
                </div>
                <ConfirmationModal
                    isOpen={showClearConfirmModal.isOpen && showClearConfirmModal.tahap === tahap}
                    onClose={() => setShowClearConfirmModal({isOpen: false, tahap: null})}
                    onConfirm={handleClearPPLs}
                    title="Hapus Semua PPL?"
                    description={`Anda akan menghapus semua (${pplForStage.length}) alokasi PPL di tahap ini. Aksi ini tidak dapat dibatalkan.`}
                    confirmLabel="Ya, Hapus Semua"
                    variant="danger"
                />
            </CardContent>
        </Card>
    );
};
