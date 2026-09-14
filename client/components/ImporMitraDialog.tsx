/**
 * Impor daftar mitra dari berkas Excel aplikasi SOBAT.
 *
 * Alurnya bertahap dan SELALU berhenti untuk dikonfirmasi sebelum menulis:
 *
 *   1. pilih   - unduh template dan pilih berkas
 *   2. petakan - hanya bila header tidak dikenali: pengguna menunjuk sendiri
 *                baris header dan kolom mana berisi apa
 *   3. tinjau  - tiap baris digolongkan (baru / cocok / perlu dipastikan) dan
 *                pengguna menentukan tindakannya; ringkasannya dihitung server
 *                lewat mode pratinjau yang tidak menulis apa pun
 *   4. nonaktif- mitra yang tidak ada di berkas ditawarkan untuk dinonaktifkan,
 *                satu per satu dengan centang, tidak pernah otomatis
 *
 * Yang menentukan orang adalah ID SOBAT, bukan nama. Baris yang hanya cocok
 * namanya digolongkan "perlu dipastikan" dan BAWAANNYA dilewati — menggabungkan
 * dua orang berbeda berarti honor dan riwayat seseorang menempel ke orang lain,
 * dan itu tidak menimbulkan galat apa pun yang bisa memberi tahu.
 */

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PPLAdminData } from "@shared/api";
import {
  bacaBaris, cariBarisHeader, kolomWajibHilang, periksaImpor, petakanKolom,
  ringkasTemuan, tidakAdaDiBerkas,
  type BarisImpor, type KolomMitra, type MitraTersimpan, type Temuan,
} from "@shared/imporMitra";
import { bacaBerkasMitra, contohAlias, unduhTemplateMitra, KOLOM_TEMPLATE } from "@/lib/bacaBerkasMitra";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

type Langkah = "pilih" | "petakan" | "tinjau" | "nonaktif";
type Tindakan = "tambah" | "perbarui" | "lewati";

interface HasilImpor {
  pratinjau: boolean;
  ditambah: number;
  diperbarui: number;
  dilewati: number;
  dinonaktifkan: number;
  peringatan: { nomorBaris: number; pesan: string }[];
  ditolak: { nomorBaris: number; pesan: string }[];
}

const LABEL_TEMUAN: Record<Temuan["jenis"], string> = {
  baru: "Baru",
  cocok: "Cocok",
  mirip: "Perlu dipastikan",
  ganda: "Ganda di berkas",
  "tidak-sah": "Tidak sah",
};

const NADA_TEMUAN: Record<Temuan["jenis"], string> = {
  baru: "border-green-300 text-green-700 dark:border-green-800 dark:text-green-300",
  cocok: "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-300",
  mirip: "border-amber-400 text-amber-800 dark:border-amber-700 dark:text-amber-300",
  ganda: "border-red-300 text-red-700 dark:border-red-800 dark:text-red-300",
  "tidak-sah": "border-red-300 text-red-700 dark:border-red-800 dark:text-red-300",
};

/**
 * Tindakan bawaan untuk tiap golongan.
 *
 * 'mirip' sengaja dilewati: kecocokan nama hanyalah dugaan, dan menggabungkan
 * orang yang keliru tidak bisa dibatalkan dengan mudah karena riwayat, honor,
 * dan kontraknya ikut menempel.
 */
const tindakanBawaan = (t: Temuan): Tindakan =>
  t.jenis === "baru" ? "tambah" : t.jenis === "cocok" ? "perbarui" : "lewati";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pplList: PPLAdminData[];
  onSelesai: (pesan: string) => void;
  onGagal: (judul: string, pesan: string) => void;
}

export default function ImporMitraDialog({ isOpen, onClose, pplList, onSelesai, onGagal }: Props) {
  const queryClient = useQueryClient();

  const [langkah, setLangkah] = useState<Langkah>("pilih");
  const [namaBerkas, setNamaBerkas] = useState("");
  const [sedangMembaca, setSedangMembaca] = useState(false);
  const [isiBerkas, setIsiBerkas] = useState<unknown[][]>([]);
  const [barisHeader, setBarisHeader] = useState(0);
  const [petaManual, setPetaManual] = useState<Record<KolomMitra, number | null>>();
  const [keputusan, setKeputusan] = useState<Record<number, Tindakan>>({});
  const [pratinjau, setPratinjau] = useState<HasilImpor | null>(null);
  const [pilihNonaktif, setPilihNonaktif] = useState<Set<string>>(new Set());

  const tersimpan: MitraTersimpan[] = useMemo(
    () => pplList.map(p => ({ id: p.id, sobatId: p.sobatId, nama: p.namaPPL })),
    [pplList]);

  const peta = useMemo(() => {
    if (petaManual) return petaManual;
    return petakanKolom(isiBerkas[barisHeader] ?? []);
  }, [petaManual, isiBerkas, barisHeader]);

  /** Baris data: seluruh baris SETELAH baris header. */
  const baris: BarisImpor[] = useMemo(() => {
    if (isiBerkas.length === 0) return [];
    return isiBerkas
      .slice(barisHeader + 1)
      // Nomor baris mengikuti nomor di Excel (berbasis 1) supaya pesan
      // "baris 12" menunjuk baris yang sama dengan yang dilihat pengguna.
      .map((sel, i) => bacaBaris(sel, peta, barisHeader + 2 + i))
      .filter(b => b.nama !== "" || b.sobatId);
  }, [isiBerkas, barisHeader, peta]);

  const temuan = useMemo(() => periksaImpor(baris, tersimpan), [baris, tersimpan]);
  const ringkasan = useMemo(() => ringkasTemuan(temuan), [temuan]);
  const belumAdaDiBerkas = useMemo(() => tidakAdaDiBerkas(baris, tersimpan), [baris, tersimpan]);

  const bersihkan = () => {
    setLangkah("pilih");
    setNamaBerkas("");
    setIsiBerkas([]);
    setBarisHeader(0);
    setPetaManual(undefined);
    setKeputusan({});
    setPratinjau(null);
    setPilihNonaktif(new Set());
  };

  const tutup = () => { bersihkan(); onClose(); };

  const pilihBerkas = async (berkas: File | undefined) => {
    if (!berkas) return;
    setSedangMembaca(true);
    try {
      const isi = await bacaBerkasMitra(berkas);
      const header = cariBarisHeader(isi);
      setNamaBerkas(berkas.name);
      setIsiBerkas(isi);
      setPetaManual(undefined);
      if (header < 0) {
        // Header tidak dikenali: pengguna yang menunjuk, bukan impor yang
        // menyerah. Inilah yang membuat perubahan format dari SOBAT tidak
        // menuntut ubah kode.
        setBarisHeader(0);
        setLangkah("petakan");
      } else {
        setBarisHeader(header);
        setKeputusan({});
        setLangkah("tinjau");
      }
    } catch (e: any) {
      onGagal("Berkas Tidak Terbaca", e?.message || "Berkas ini tidak bisa dibaca sebagai Excel.");
    } finally {
      setSedangMembaca(false);
    }
  };

  const daftarKeputusan = () =>
    temuan.map(t => {
      const tindakan = keputusan[t.baris.nomorBaris] ?? tindakanBawaan(t);
      return {
        nomorBaris: t.baris.nomorBaris,
        tindakan,
        mitraId: tindakan === "perbarui" ? t.mitraId : undefined,
      };
    });

  const kirim = useMutation({
    mutationFn: (mode: { pratinjau: boolean }) =>
      apiClient.post<HasilImpor>("/admin/ppl/impor", {
        baris,
        keputusan: daftarKeputusan(),
        nonaktifkan: mode.pratinjau ? [] : Array.from(pilihNonaktif),
        pratinjau: mode.pratinjau,
      }),
    onSuccess: (hasil) => {
      if (hasil.pratinjau) { setPratinjau(hasil); return; }
      queryClient.invalidateQueries({ queryKey: ["pplAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["pplMaster"] });
      onSelesai(
        `${hasil.ditambah} mitra ditambahkan, ${hasil.diperbarui} diperbarui, ` +
        `${hasil.dilewati} dilewati, ${hasil.dinonaktifkan} dinonaktifkan.`);
      tutup();
    },
    onError: (e: any) => onGagal("Gagal Mengimpor", e?.message || "Terjadi kesalahan."),
  });

  const adaYangDitulis = ringkasan.baru + ringkasan.cocok > 0
    || Object.values(keputusan).some(t => t !== "lewati");

  return (
    <Dialog open={isOpen} onOpenChange={buka => { if (!buka) tutup(); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Impor Mitra dari Excel SOBAT</DialogTitle>
          <DialogDescription>
            {langkah === "pilih" && "Unduh template bila perlu, lalu pilih berkas Excel dari aplikasi SOBAT."}
            {langkah === "petakan" && "Judul kolom pada berkas ini belum dikenali. Tunjukkan barisnya dan isi tiap kolom."}
            {langkah === "tinjau" && "Periksa dulu sebelum disimpan. Belum ada satu pun data yang berubah."}
            {langkah === "nonaktif" && "Mitra berikut tidak ada di berkas. Centang yang sudah tidak menjadi mitra."}
          </DialogDescription>
        </DialogHeader>

        {/* ---------------------------- 1. pilih ---------------------------- */}
        {langkah === "pilih" && (
          <div className="space-y-4">
            <div className="rounded-md border p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Berkas boleh memiliki kolom tambahan dan urutan kolom yang berbeda — yang dicocokkan
                nama judulnya, bukan urutannya. Baris judul di atas header juga ikut dilewati.
              </p>
              <Button variant="outline" onClick={() => void unduhTemplateMitra()}>
                <Download className="w-4 h-4 mr-2" />
                Unduh Template Excel
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="berkasMitra">Berkas Excel (.xlsx)</Label>
              <input
                id="berkasMitra"
                type="file"
                accept=".xlsx"
                disabled={sedangMembaca}
                onChange={e => void pilihBerkas(e.target.files?.[0])}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-2 file:text-sm"
              />
              {sedangMembaca && (
                <p className="text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />Membaca berkas...
                </p>
              )}
            </div>
          </div>
        )}

        {/* --------------------------- 2. petakan --------------------------- */}
        {langkah === "petakan" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Baris mana yang berisi judul kolom?</Label>
              <Select value={String(barisHeader)} onValueChange={v => setBarisHeader(Number(v))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {isiBerkas.slice(0, 10).map((sel, i) => (
                    <SelectItem key={i} value={String(i)}>
                      Baris {i + 1}: {sel.slice(0, 5).map(s => String(s ?? "")).join(" | ").slice(0, 60) || "(kosong)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto">
              {KOLOM_TEMPLATE.map(({ kolom, judul }) => (
                <div key={kolom} className="space-y-1">
                  <Label className="text-xs">
                    {judul}
                    {kolom === "nama" && <span className="text-destructive"> *</span>}
                  </Label>
                  <Select
                    value={peta[kolom] === null ? "-" : String(peta[kolom])}
                    onValueChange={v =>
                      setPetaManual({ ...peta, [kolom]: v === "-" ? null : Number(v) })}
                  >
                    <SelectTrigger><SelectValue placeholder="Tidak ada" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">Tidak ada</SelectItem>
                      {(isiBerkas[barisHeader] ?? []).map((sel, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {String(sel ?? "") || `Kolom ${i + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">Dikenali otomatis: {contohAlias(kolom)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------- 3. tinjau ---------------------------- */}
        {langkah === "tinjau" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">{namaBerkas}</Badge>
              <Badge variant="outline" className={NADA_TEMUAN.baru}>{ringkasan.baru} baru</Badge>
              <Badge variant="outline" className={NADA_TEMUAN.cocok}>{ringkasan.cocok} cocok</Badge>
              {ringkasan.mirip > 0 && (
                <Badge variant="outline" className={NADA_TEMUAN.mirip}>{ringkasan.mirip} perlu dipastikan</Badge>
              )}
              {(ringkasan.ganda + ringkasan.tidakSah) > 0 && (
                <Badge variant="outline" className={NADA_TEMUAN.ganda}>
                  {ringkasan.ganda + ringkasan.tidakSah} bermasalah
                </Badge>
              )}
            </div>

            {ringkasan.mirip > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-300" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Baris bertanda &quot;perlu dipastikan&quot; hanya cocok NAMANYA, dan nama kembar itu biasa.
                  Bawaannya dilewati; ubah menjadi &quot;Perbarui&quot; hanya bila Anda yakin itu orang yang sama.
                </p>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Baris</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="w-32">ID SOBAT</TableHead>
                    <TableHead className="w-40">Status</TableHead>
                    <TableHead className="w-40">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {temuan.map(t => {
                    const nomor = t.baris.nomorBaris;
                    const tindakan = keputusan[nomor] ?? tindakanBawaan(t);
                    const terkunci = t.jenis === "ganda" || t.jenis === "tidak-sah";
                    return (
                      <TableRow key={nomor}>
                        <TableCell className="text-muted-foreground">{nomor}</TableCell>
                        <TableCell className="font-medium">
                          {t.baris.nama || <span className="text-muted-foreground">(kosong)</span>}
                          {t.pesan && <p className="text-xs text-muted-foreground">{t.pesan}</p>}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{t.baris.sobatId || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={NADA_TEMUAN[t.jenis]}>{LABEL_TEMUAN[t.jenis]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={terkunci ? "lewati" : tindakan}
                            disabled={terkunci}
                            onValueChange={v => setKeputusan(p => ({ ...p, [nomor]: v as Tindakan }))}
                          >
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lewati">Lewati</SelectItem>
                              {t.jenis === "baru" && <SelectItem value="tambah">Tambahkan</SelectItem>}
                              {(t.jenis === "cocok" || t.jenis === "mirip") && (
                                <SelectItem value="perbarui">Perbarui {t.mitraId}</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {pratinjau && (
              <div className="rounded-md border p-3 text-sm space-y-2">
                <p className="font-medium">
                  Akan ditambahkan {pratinjau.ditambah}, diperbarui {pratinjau.diperbarui}, dilewati {pratinjau.dilewati}.
                </p>
                {pratinjau.ditolak.length > 0 && (
                  <div className="text-red-700 dark:text-red-300">
                    <p className="font-medium">Ditolak:</p>
                    <ul className="list-disc pl-5">
                      {pratinjau.ditolak.map((m, i) => <li key={i}>Baris {m.nomorBaris}: {m.pesan}</li>)}
                    </ul>
                  </div>
                )}
                {pratinjau.peringatan.length > 0 && (
                  <div className="text-amber-700 dark:text-amber-300">
                    <p className="font-medium">Perlu diperhatikan (tetap diimpor):</p>
                    <ul className="list-disc pl-5">
                      {pratinjau.peringatan.map((m, i) => <li key={i}>Baris {m.nomorBaris}: {m.pesan}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* -------------------------- 4. nonaktif --------------------------- */}
        {langkah === "nonaktif" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Mitra yang dinonaktifkan TIDAK dihapus: seluruh honor, kontrak, dan riwayatnya tetap
              utuh, dan ia hanya berhenti muncul saat memilih mitra untuk kegiatan baru. Berkas
              Anda mungkin hanya memuat sebagian mitra, jadi tidak ada yang dicentang otomatis.
            </p>
            <div className="max-h-72 overflow-y-auto rounded-md border divide-y">
              {belumAdaDiBerkas.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">
                  Semua mitra tersimpan ada di berkas ini.
                </p>
              )}
              {belumAdaDiBerkas.map(m => (
                <label key={m.id} className="flex items-center gap-3 p-2 cursor-pointer">
                  <Checkbox
                    checked={pilihNonaktif.has(m.id)}
                    onCheckedChange={() => setPilihNonaktif(prev => {
                      const baru = new Set(prev);
                      if (baru.has(m.id)) baru.delete(m.id); else baru.add(m.id);
                      return baru;
                    })}
                  />
                  <span className="text-sm"><span className="font-mono text-xs">{m.id}</span> &middot; {m.nama}</span>
                </label>
              ))}
            </div>
            {pilihNonaktif.size > 0 && (
              <p className="text-sm font-medium">{pilihNonaktif.size} mitra akan dinonaktifkan.</p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={tutup}>Batal</Button>

          {langkah === "petakan" && (
            <Button
              disabled={kolomWajibHilang(peta).length > 0}
              onClick={() => { setKeputusan({}); setLangkah("tinjau"); }}
            >
              Lanjut
            </Button>
          )}

          {langkah === "tinjau" && (
            <>
              <Button variant="outline" onClick={() => setLangkah("petakan")}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />Atur Kolom
              </Button>
              <Button
                variant="outline"
                disabled={kirim.isPending || baris.length === 0}
                onClick={() => kirim.mutate({ pratinjau: true })}
              >
                {kirim.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Hitung Ulang
              </Button>
              <Button
                disabled={baris.length === 0 || !adaYangDitulis}
                onClick={() => setLangkah("nonaktif")}
              >
                Lanjut
              </Button>
            </>
          )}

          {langkah === "nonaktif" && (
            <Button
              className={cn(pilihNonaktif.size > 0 && "bg-amber-600 hover:bg-amber-700")}
              disabled={kirim.isPending}
              onClick={() => kirim.mutate({ pratinjau: false })}
            >
              {kirim.isPending
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <Upload className="w-4 h-4 mr-2" />}
              Simpan Impor
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
