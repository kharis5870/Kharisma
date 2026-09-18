// Dipisah dari client/pages/InputKegiatan.tsx tanpa mengubah isinya.

import React, { useState, useEffect, useMemo } from "react";
import PilihPembebananHonor from "@/components/PilihPembebananHonor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, ChevronsUpDown, Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { PPLMaster, UserData, HonorariumDetail } from "@shared/api";
import { formatHonor, sanitizeJumlah } from "@/lib/angka";

export const PPLAllocationItem = React.memo(({ ppl, index, onRemove, pmlList, pplList, store, existingPplIds, tahap, opsiBulan }: any) => {
    const { updatePPL, updatePPLBebanKerja } = store.getState();
    const [openPPL, setOpenPPL] = useState(false);
    const [openPML, setOpenPML] = useState(false);
    
    const honorDetail = ppl.honorarium[0];
    const jenisPekerjaan = honorDetail.jenis_pekerjaan;
    
    const [localBebanKerja, setLocalBebanKerja] = useState(honorDetail.bebanKerja);

    useEffect(() => {
        setLocalBebanKerja(honorDetail.bebanKerja);
    }, [honorDetail.bebanKerja]);

    const handleBebanKerjaBlur = () => {
        updatePPLBebanKerja(ppl.id, jenisPekerjaan, localBebanKerja);
    };

    const totalHonorPPL = ppl.honorarium?.reduce((sum: number, h: HonorariumDetail) => sum + parseInt(h.besaranHonor || '0'), 0) || 0;
    const selectedPML = pmlList.find((pml: UserData) => pml.namaLengkap === ppl.namaPML);
    const selectedPPL = pplList.find((p: PPLMaster) => String(p.id) === ppl.ppl_master_id);
    
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
                    onClick={onRemove}
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
                                <Button variant="outline" role="combobox" aria-expanded={openPPL} className="w-full justify-between">
                                    {selectedPPL ? selectedPPL.namaPPL : "Pilih PPL..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Cari PPL..." />
                                    <CommandEmpty>PPL tidak ditemukan atau sudah dialokasikan.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandList>
                                            {availablePplList.map((p: PPLMaster) => (
                                                <CommandItem key={p.id} value={`${p.id} ${p.namaPPL}`} onSelect={() => {
                                                    updatePPL(ppl.id, 'ppl_master_id', String(p.id));
                                                    updatePPL(ppl.id, 'namaPPL', p.namaPPL);
                                                    setOpenPPL(false);
                                                }}>
                                                    <Check className={cn("mr-2 h-4 w-4", ppl.ppl_master_id === String(p.id) ? "opacity-100" : "opacity-0")} />
                                                    <div className="flex flex-col">
                                                        <span>{p.namaPPL}</span>
                                                        <span className="text-xs text-muted-foreground">ID: {p.id}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandList>
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                         <Label>Nama PML *</Label>
                            <Popover open={openPML} onOpenChange={setOpenPML}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" aria-expanded={openPML} className="w-full justify-between">
                                        {selectedPML ? `${selectedPML.namaLengkap}` : "Pilih PML..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari PML..." />
                                        <CommandEmpty>PML tidak ditemukan.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandList>
                                                {pmlList.map((pml: UserData) => (
                                                    <CommandItem key={pml.id} value={`${pml.id} ${pml.namaLengkap}`} onSelect={() => {
                                                        updatePPL(ppl.id, 'namaPML', pml.namaLengkap);
                                                        updatePPL(ppl.id, 'pml_id', pml.id);  
                                                        setOpenPML(false);
                                                    }}>
                                                        <Check className={cn("mr-2 h-4 w-4", String(ppl.pml_id) === String(pml.id) ? "opacity-100" : "opacity-0")} />
                                                        <div className="flex flex-col">
                                                            <span>{pml.namaLengkap}</span>
                                                            <span className="text-xs text-muted-foreground">ID: {pml.id}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandList>
                                        </CommandGroup>
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
                            updatePPL(ppl.id, 'metodePembebanan', metode);
                            updatePPL(ppl.id, 'bulanPembebananDipilih', bulan);
                        }}
                    />
                </div>
            </div>
        </div>
    );
});
