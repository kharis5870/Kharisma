// Dipisah dari client/pages/EditActivity.tsx tanpa mengubah isinya.

import React, { useState, useEffect, useMemo } from "react";
import PilihPembebananHonor from "@/components/PilihPembebananHonor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { PPLMaster, UserData } from "@shared/api";
import { cn } from "@/lib/utils";
import { hitungBesaranHonor, hitungTotalHonorPPL } from "@/lib/honorPPL";
import { formatHonor, sanitizeJumlah } from "@/lib/angka";

// --- Sub-Components ---
export const PPLAllocationItem = React.memo(({ ppl, index, onRemove, onUpdate, pplList, pmlList, honorariumSettings, existingPplIds, setAlertModal, tahap, opsiBulan }: any) => {
    const [openPPL, setOpenPPL] = useState(false);
    const [openPML, setOpenPML] = useState(false);
    
    const honorDetail = ppl.honorarium[0];
    const jenisPekerjaan = honorDetail.jenis_pekerjaan;
    
    const [localBebanKerja, setLocalBebanKerja] = useState(honorDetail.bebanKerja);

    useEffect(() => {
        setLocalBebanKerja(honorDetail.bebanKerja);
    }, [honorDetail.bebanKerja]);

    const handleBebanKerjaBlur = () => {
        const oldBebanKerja = parseInt(honorDetail.bebanKerja || '0', 10);
        const newBebanKerja = parseInt(localBebanKerja || '0', 10);
        const delta = newBebanKerja - oldBebanKerja;

        if (delta === 0) return;

        const firstStageType = (ppl.tahap === 'listing' || ppl.tahap === 'pencacahan') ? 'open' : 'belum_entry';
        const currentFirstStageValue = ppl.progress?.[firstStageType] ?? 0;

        if (delta < 0 && currentFirstStageValue < Math.abs(delta)) {
            setAlertModal({
            isOpen: true,
            title: "Validasi Gagal",
            message: `Tidak bisa mengurangi beban kerja sebanyak ${Math.abs(delta)}. Selesaikan progress yang sedang berjalan dahulu. Progress 'Open' saat ini: ${currentFirstStageValue}.`
            });
            setLocalBebanKerja(oldBebanKerja.toString());
            return;
        }
        
        const updatedHonorarium = ppl.honorarium.map((h: any) => {
            if (h.jenis_pekerjaan === jenisPekerjaan) {
                return {
                    ...h,
                    bebanKerja: newBebanKerja.toString(),
                    // Rumus yang sama dengan yang dipakai tampilan dan payload
                    // simpan, supaya ketiganya tidak bisa menyimpang.
                    besaranHonor: String(hitungBesaranHonor(newBebanKerja, jenisPekerjaan, honorariumSettings)),
                };
            }
            return h;
        });

        const updatedProgress = {
            ...ppl.progress,
            [firstStageType]: currentFirstStageValue + delta
        };
        
        onUpdate(ppl.clientId, 'honorarium', updatedHonorarium);
        onUpdate(ppl.clientId, 'progress', updatedProgress);

        const newTotalBebanKerjaPPL = updatedHonorarium.reduce((sum: number, h: any) => sum + parseInt(h.bebanKerja || '0'), 0);
        onUpdate(ppl.clientId, 'bebanKerja', newTotalBebanKerjaPPL.toString());
    };
    
    /**
     * DIHITUNG dari beban kerja × harga satuan, bukan dijumlahkan dari
     * `besaranHonor` yang tersimpan di state.
     *
     * Nilai tersimpan itu hanya diperbarui saat beban kerja disunting, jadi
     * mengubah harga satuan tidak mengubah apa pun di layar sampai beban
     * kerjanya ikut disentuh — persis bug yang dilaporkan. Menghitungnya di
     * sini juga berarti "Batalkan Perubahan" otomatis mengembalikan angkanya:
     * tidak ada honor yang disimpan terpisah dari kedua faktornya.
     */
    const totalHonorPPL = hitungTotalHonorPPL(ppl.honorarium, honorariumSettings);
    const selectedPML = pmlList.find((p: UserData) => String(p.id) === String(ppl.pml_id));
    const selectedPPL = pplList.find((p: PPLMaster) => String(p.id) === String(ppl.ppl_master_id));
    
    const availablePplList = useMemo(() => {
        return pplList.filter((p: PPLMaster) => {
            // Logika 1: Jangan tampilkan PPL yang sudah dialokasikan di tahap ini
            const isAlreadySelected = existingPplIds.includes(String(p.id));
            if (isAlreadySelected && p.id !== selectedPPL?.id) {
                return false;
            }

            // ✔️ LOGIKA FILTER UTAMA BERDASARKAN POSISI
            if (tahap === 'listing' || tahap === 'pencacahan') {
                return p.posisi === 'Pendataan' || p.posisi === 'Pendataan/Pengolahan';
            }
            if (tahap === 'pengolahan-analisis') {
                return p.posisi === 'Pengolahan' || p.posisi === 'Pendataan/Pengolahan';
            }
            return false; // Tahap tidak valid, sembunyikan semua
        });
    }, [pplList, existingPplIds, selectedPPL, tahap]);

    const getBebanKerjaLabel = () => {
        switch(jenisPekerjaan) {
            case 'listing': return 'Beban Kerja Listing';
            case 'pencacahan': return 'Beban Kerja Pencacahan';
            case 'pengolahan': return 'Beban Kerja Pengolahan';
            default: return 'Beban Kerja';
        }
    };
    
    return (
        <div className="p-4 border rounded-lg space-y-4 bg-muted">
            <div className="flex justify-between items-center">
                <h4 className="font-medium">{ppl.namaPPL || `Alokasi Baru ${index + 1}`}</h4>
                {/* Merah baru muncul penuh saat disorot: ikon tempat sampah
                    yang selalu menyala merah di setiap kartu membuat seluruh
                    daftar alokasi terlihat penuh peringatan. Latar merah muda
                    saat disorot juga menegaskan sasaran kliknya — targetnya
                    kecil dan berdempetan dengan judul kartu. */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(ppl.clientId)}
                    title="Hapus alokasi PPL ini"
                    aria-label={`Hapus alokasi ${ppl.namaPPL || `Alokasi Baru ${index + 1}`}`}
                    className="text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                >
                    <Trash2 className="w-4 h-4"/>
                </Button>
            </div>
            <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Pilih PPL *</Label>
                            <Popover open={openPPL} onOpenChange={setOpenPPL}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {selectedPPL ? selectedPPL.namaPPL : "Pilih PPL..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari PPL..." />
                                        <CommandList>
                                            <CommandEmpty>PPL tidak ditemukan atau sudah dialokasikan.</CommandEmpty>
                                            <CommandGroup>
                                                {availablePplList.map((p: PPLMaster) => (
                                                    <CommandItem key={p.id} value={`${p.id} ${p.namaPPL}`} onSelect={() => {
                                                        onUpdate(ppl.clientId, 'ppl_master_id', p.id);
                                                        onUpdate(ppl.clientId, 'namaPPL', p.namaPPL);
                                                        setOpenPPL(false);
                                                    }}>
                                                        <Check className={cn("mr-2 h-4 w-4", String(ppl.ppl_master_id) === String(p.id) ? "opacity-100" : "opacity-0")} />
                                                        <div>{p.namaPPL} <span className="text-xs text-muted-foreground">({p.id})</span></div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Nama PML *</Label>
                            <Popover open={openPML} onOpenChange={setOpenPML}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {selectedPML ? selectedPML.namaLengkap : "Pilih PML..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari PML..." />
                                        <CommandList>
                                            <CommandEmpty>PML tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {pmlList.map((pml: UserData) => (
                                                    <CommandItem key={pml.id} 
                                                    value={`${pml.id} ${pml.namaLengkap}`} 
                                                    onSelect={() => {
                                                        onUpdate(ppl.clientId, 'pml_id', pml.id);
                                                        setOpenPML(false);
                                                    }}>
                                                        <Check className={cn("mr-2 h-4 w-4", String(ppl.pml_id) === String(pml.id) ? "opacity-100" : "opacity-0")} />
                                                        <div className="flex flex-col">
                                                            <span>{pml.namaLengkap}</span>
                                                            <span className="text-xs text-muted-foreground">ID: {pml.id}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-2">
                            <Label>{getBebanKerjaLabel()}</Label>
                            <Input type="number" min="1" inputMode="numeric" placeholder="Jumlah..." value={localBebanKerja} onChange={(e) => setLocalBebanKerja(sanitizeJumlah(e.target.value))} onBlur={handleBebanKerjaBlur} />
                        </div>
                        <div className="space-y-2">
                            <Label>Total Honor (Rp)</Label>
                            <Input value={formatHonor(totalHonorPPL)} readOnly className="bg-muted font-bold"/>
                        </div>
                        <PilihPembebananHonor
                            opsiBulan={opsiBulan ?? []}
                            metode={ppl.metodePembebanan}
                            bulanDipilih={ppl.bulanPembebananDipilih}
                            onChange={(metode, bulan) => {
                                onUpdate(ppl.clientId, 'metodePembebanan', metode);
                                onUpdate(ppl.clientId, 'bulanPembebananDipilih', bulan);
                            }}
                        />
                    </div>
            </div>
        </div>
    );
});
