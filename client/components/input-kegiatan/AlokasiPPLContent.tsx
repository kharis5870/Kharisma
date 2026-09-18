// Dipisah dari client/pages/InputKegiatan.tsx tanpa mengubah isinya.

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, Users, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import useInputKegiatanStore, { HonorariumSettings, TahapHonor } from "@/stores/useInputKegiatanStore";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { bulanDalamRentang, keTeksTanggal, labelRentang } from "@/lib/honorPeriode";
import { Badge } from "@/components/ui/badge";
import { PPL } from "@shared/api";
import { formatHonor } from "@/lib/angka";
import { fetchPPLs, fetchPMLs } from "@/components/input-kegiatan/dataInputKegiatan";
import { PPLAllocationItem } from "@/components/input-kegiatan/PPLAllocationItem";

export const AlokasiPPLContent = ({ tahap, title }: { tahap: PPL['tahap'], title: string }) => {
    const store = useInputKegiatanStore();
    
    // Nama kolom di store/DB memakai akhiran "Pengolahan", sedangkan tahap
    // di sisi PPL bernama "pengolahan-analisis".
    const tahapHonor: TahapHonor =
        tahap === 'listing' ? 'Listing' : tahap === 'pencacahan' ? 'Pencacahan' : 'Pengolahan';

    const rentangHonor = {
        mulai: store[`tanggalMulaiHonor${tahapHonor}`],
        selesai: store[`tanggalSelesaiHonor${tahapHonor}`],
    };

    // Rentang honor memang boleh berbeda dari jadwal pendataan, tapi yang jauh
    // lebih sering terjadi adalah salah pilih tanggal. Diberi tanda kuning.
    const mulaiPendataan = keTeksTanggal(store.tanggalMulaiPengumpulanData);
    const selesaiPendataan = keTeksTanggal(store.tanggalSelesaiPengumpulanData);
    const bedaDenganPendataan = Boolean(
        rentangHonor.mulai && rentangHonor.selesai && mulaiPendataan && selesaiPendataan
        && (rentangHonor.mulai !== mulaiPendataan || rentangHonor.selesai !== selesaiPendataan));

    // Kalau rentang menyentuh lebih dari satu bulan, pengguna harus memilih
    // salah satunya sebagai bulan pembebanan: HONOR_LIMIT berlaku per bulan,
    // jadi honor tidak boleh dihitung di dua bulan sekaligus.
    const opsiBulanPembebanan = useMemo(
        () => bulanDalamRentang(rentangHonor.mulai, rentangHonor.selesai),
        [rentangHonor.mulai, rentangHonor.selesai],
    );

    const pplForStage = store.pplAllocations.filter(p => p.tahap === tahap);
    const storeActions = useInputKegiatanStore.getState();

    const { data: pplList = [] } = useQuery({ queryKey: ['pplMaster'], queryFn: fetchPPLs });
    const { data: pmlList = [] } = useQuery({ queryKey: ['pmls'], queryFn: fetchPMLs });
    const [showClearConfirmModal, setShowClearConfirmModal] = useState<{isOpen: boolean; tahap: PPL['tahap'] | null}>({isOpen: false, tahap: null});
    /**
     * Alokasi PPL yang menunggu konfirmasi hapus; null = tidak ada.
     *
     * Satu kartu alokasi memuat PPL, PML, beban kerja, dan honor yang sudah
     * diketik, dan tidak ada urungkan — salah klik berarti mengetik ulang
     * semuanya. Namanya ikut disimpan supaya dialognya bisa menyebut kartu
     * mana yang akan hilang; di tahap yang ramai, kartunya mirip semua.
     */
    const [konfirmasiHapusPPL, setKonfirmasiHapusPPL] = useState<{ id: string; nama: string } | null>(null);
    
    const honorSettings = store.honorariumSettings;
    
    const getHonorSettingsKey = (): keyof typeof honorSettings | null => {
        if (tahap === 'listing') return 'pengumpulan-data-listing';
        if (tahap === 'pencacahan') return 'pengumpulan-data-pencacahan';
        if (tahap === 'pengolahan-analisis') return 'pengolahan-analisis';
        return null;
    }
    const honorSettingKey = getHonorSettingsKey();

    const handleClearPPLs = () => {
       storeActions.clearPPLsByTahap(tahap);
       setShowClearConfirmModal({isOpen: false, tahap: null});
    }

    // FIX: Menambahkan tipe eksplisit untuk 'field'
    /**
     * Pengaturan honor langsung disetor ke store setiap diketik, sama seperti
     * di Edit Kegiatan. `updateHonorariumSetting` sekaligus menghitung ulang
     * honor setiap alokasi, jadi total honor mitra di bawahnya ikut berubah
     * seketika — tidak lagi menunggu kotaknya ditinggalkan.
     */
    const handleSettingChange = (field: keyof HonorariumSettings, value: string) => {
        if (!honorSettingKey) return;
        storeActions.updateHonorariumSetting(honorSettingKey, field, value);
    };

    // FIX: Menambahkan tipe eksplisit untuk 'field'
    


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
                           <Link 
                               to="/daftar-ppl"
                               state={{ 
                                   from: 'input-kegiatan',
                                   tahap: tahap,
                                   existingPplIds: pplForStage.map(p => p.ppl_master_id).filter(Boolean)
                               }}
                           >
                               <Users className="w-4 h-4 mr-2" />
                               Pilih dari Daftar PPL
                           </Link>
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
                            <Input placeholder="Contoh: Dokumen" value={honorSettingKey ? honorSettings[honorSettingKey].satuanBebanKerja : ''} onChange={e => handleSettingChange('satuanBebanKerja', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Harga per Satuan (Rp)</Label>
                            <Input placeholder="Contoh: 15000" value={honorSettingKey ? formatHonor(honorSettings[honorSettingKey].hargaSatuan) : ''} onChange={e => handleSettingChange('hargaSatuan', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                           <Label>Rentang Tanggal Honor *</Label>
                           <DateRangePicker
                               value={rentangHonor}
                               onChange={({ mulai, selesai }) => storeActions.setRentangHonor(tahapHonor, mulai, selesai)}
                               defaultMonth={store.tanggalMulaiPersiapan}
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
                               key={ppl.id} 
                               tahap={tahap}
                               opsiBulan={opsiBulanPembebanan}
                               ppl={ppl} 
                               index={index} 
                               onRemove={() => setKonfirmasiHapusPPL({ id: ppl.id, nama: ppl.namaPPL || '' })} 
                               pmlList={pmlList} 
                               pplList={pplList} 
                               store={useInputKegiatanStore} 
                               existingPplIds={existingPplIdsForCurrentStage}
                           />
                       );
                    })}
                    <Button type="button" variant="outline" onClick={() => storeActions.addPPL(tahap)} className="w-full border-dashed"><Plus className="w-4 h-4 mr-2"/>Tambah Alokasi PPL Manual</Button>
                </div>
                <ConfirmationModal
                   isOpen={konfirmasiHapusPPL !== null}
                   onClose={() => setKonfirmasiHapusPPL(null)}
                   onConfirm={() => {
                       if (konfirmasiHapusPPL) storeActions.removePPL(konfirmasiHapusPPL.id);
                       setKonfirmasiHapusPPL(null);
                   }}
                   title="Hapus Alokasi PPL?"
                   description={`Alokasi ${konfirmasiHapusPPL?.nama || 'ini'} beserta PML, beban kerja, dan honor yang sudah diisi akan dihapus dari daftar.`}
                   confirmLabel="Ya, Hapus"
                   cancelLabel="Batal"
                   variant="danger"
                   icon={<Trash2 className="w-6 h-6" />}
                />
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
