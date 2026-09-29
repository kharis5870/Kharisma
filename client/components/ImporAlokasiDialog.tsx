/**
 * Impor alokasi mitra satu kegiatan dari berkas Excel.
 *
 * MASALAHNYA: menyusun alokasi lewat layar berarti, untuk setiap mitra,
 * memilih nama dari daftar panjang, memilih PML, mengetik beban kerja, dan
 * menentukan pembebanan honornya. Kegiatan besar memegang puluhan mitra, dan
 * daftarnya hampir selalu sudah ada sebagai tabel di komputer si pengolah.
 *
 * Alurnya sama dengan impor mitra dan berhenti untuk ditinjau sebelum menulis:
 *
 *   1. pilih   - unduh templat dan pilih berkas
 *   2. petakan - hanya bila judul kolomnya tidak dikenali
 *   3. tinjau  - tiap baris dicocokkan ke mitra dan PML yang ada, masalahnya
 *                disebut satu per satu, lalu barisnya dimasukkan ke form
 *
 * TIDAK ADA PENULISAN KE DATABASE di sini: hasilnya masuk ke form yang sedang
 * dibuka, persis seperti mengetikkannya sendiri, dan baru tersimpan ketika
 * kegiatannya disimpan. Itu sebabnya impor ini tidak punya endpoint sendiri.
 *
 * SATU BERKAS MEMUAT SEMUA TAHAP. Kolom Tahap yang menentukan tiap baris masuk
 * ke tab mana, jadi satu unggahan mengisi Listing, Pencacahan, dan Pengolahan
 * sekaligus - bukan tiga kali mengunggah berkas yang sama.
 */

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import type { PPLMaster, UserData } from "@shared/api";
import {
  bacaBarisAlokasi, barisBisaDipakai, cariBarisHeaderAlokasi, cocokkanBarisAlokasi,
  kolomWajibAlokasiHilang, petakanKolomAlokasi, ringkasImporAlokasi, susunAlokasiImpor,
  tandaiBarisKembar, tandaiSudahDialokasikan,
  type AlokasiTerimpor, type KolomAlokasi, type MitraRef, type PmlRef, type TahapAlokasi,
} from "@shared/imporAlokasi";
import { bacaBerkasAlokasi, unduhTemplateAlokasi, KOLOM_TEMPLATE_ALOKASI } from "@/lib/bacaBerkasAlokasi";
import { formatHonor } from "@/lib/angka";

type Langkah = "pilih" | "petakan" | "tinjau";

const LABEL_TAHAP: Record<TahapAlokasi, string> = {
  listing: "Listing",
  pencacahan: "Pencacahan",
  "pengolahan-analisis": "Pengolahan",
};

export interface ImporAlokasiDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Mitra aktif; sumber pencocokan ID SOBAT dan nama. */
  pplList: PPLMaster[];
  /** Calon PML; dicocokkan lewat nama lengkapnya. */
  pmlList: UserData[];
  /** Alokasi yang sudah ada di form, supaya tidak terisi dua kali. */
  alokasiSudahAda: { mitraId: string; tahap: TahapAlokasi }[];
  /** Harga satuan per tahap yang sedang berlaku di form, dalam rupiah. */
  hargaSatuan: Partial<Record<TahapAlokasi, number>>;
  namaKegiatan?: string;
  onTerapkan: (alokasi: AlokasiTerimpor[]) => void;
  onGagal: (judul: string, pesan: string) => void;
}

export default function ImporAlokasiDialog({
  isOpen, onClose, pplList, pmlList, alokasiSudahAda, hargaSatuan, namaKegiatan,
  onTerapkan, onGagal,
}: ImporAlokasiDialogProps) {
  const [langkah, setLangkah] = useState<Langkah>("pilih");
  const [namaBerkas, setNamaBerkas] = useState("");
  const [sedangMembaca, setSedangMembaca] = useState(false);
  const [isiBerkas, setIsiBerkas] = useState<unknown[][]>([]);
  const [barisHeader, setBarisHeader] = useState(0);
  const [petaManual, setPetaManual] = useState<Record<KolomAlokasi, number | null>>();

  const mitra: MitraRef[] = useMemo(
    () => pplList.map(p => ({ id: p.id, sobatId: p.sobatId, nama: p.namaPPL })),
    [pplList]);

  // Hanya pengguna yang ditandai PML yang boleh dicocokkan: menulis nama
  // pengguna mana pun di berkas tidak boleh diam-diam menjadikannya pengawas.
  const pml: PmlRef[] = useMemo(
    () => pmlList.filter(u => u.isPML !== false).map(u => ({ id: u.id, nama: u.namaLengkap })),
    [pmlList]);

  const peta = useMemo(
    () => petaManual ?? petakanKolomAlokasi(isiBerkas[barisHeader] ?? []),
    [petaManual, isiBerkas, barisHeader]);

  const hasil = useMemo(() => {
    if (isiBerkas.length === 0) return [];
    const baris = isiBerkas
      .slice(barisHeader + 1)
      // Nomor baris mengikuti nomor di Excel supaya "baris 12" menunjuk baris
      // yang sama dengan yang dilihat pengguna di berkasnya.
      .map((sel, i) => bacaBarisAlokasi(sel, peta, barisHeader + 2 + i))
      .filter(b => !b.kosong);
    const dicocokkan = baris.map(b => cocokkanBarisAlokasi(b, mitra, pml));
    return tandaiSudahDialokasikan(tandaiBarisKembar(dicocokkan), alokasiSudahAda);
  }, [isiBerkas, barisHeader, peta, mitra, pml, alokasiSudahAda]);

  const ringkasan = useMemo(() => ringkasImporAlokasi(hasil), [hasil]);
  const alokasi = useMemo(() => susunAlokasiImpor(hasil, hargaSatuan), [hasil, hargaSatuan]);

  const tahapTanpaHarga = useMemo(() => {
    const tahap = Object.keys(ringkasan.perTahap) as TahapAlokasi[];
    return tahap.filter(t => ringkasan.perTahap[t] > 0 && !(Number(hargaSatuan[t]) > 0));
  }, [ringkasan, hargaSatuan]);

  const bersihkan = () => {
    setLangkah("pilih");
    setNamaBerkas("");
    setIsiBerkas([]);
    setBarisHeader(0);
    setPetaManual(undefined);
  };

  const tutup = () => { bersihkan(); onClose(); };

  const pilihBerkas = async (berkas: File | undefined) => {
    if (!berkas) return;
    setSedangMembaca(true);
    try {
      const isi = await bacaBerkasAlokasi(berkas);
      const header = cariBarisHeaderAlokasi(isi);
      setNamaBerkas(berkas.name);
      setIsiBerkas(isi);
      setPetaManual(undefined);
      // Header tidak dikenali berarti pengguna yang menunjuk kolomnya, bukan
      // impor yang menyerah: berkas susunan orang lain tetap bisa dipakai.
      setBarisHeader(header < 0 ? 0 : header);
      setLangkah(header < 0 ? "petakan" : "tinjau");
    } catch (e: any) {
      onGagal("Berkas Tidak Terbaca", e?.message || "Berkas ini tidak bisa dibaca sebagai Excel.");
    } finally {
      setSedangMembaca(false);
    }
  };

  const terapkan = () => {
    onTerapkan(alokasi);
    tutup();
  };

  return (
    <Dialog open={isOpen} onOpenChange={buka => { if (!buka) tutup(); }}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Impor Alokasi Mitra dari Excel</DialogTitle>
          <DialogDescription>
            {langkah === "pilih" && "Satu berkas mengisi ketiga tahap sekaligus; kolom Tahap yang menentukan."}
            {langkah === "petakan" && "Judul kolom pada berkas ini belum dikenali. Tunjukkan barisnya dan isi tiap kolom."}
            {langkah === "tinjau" && "Periksa dulu. Belum ada satu pun alokasi yang masuk ke form."}
          </DialogDescription>
        </DialogHeader>

        {/* ---------------------------- 1. pilih ---------------------------- */}
        {langkah === "pilih" && (
          <div className="space-y-4">
            <div className="rounded-md border p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Lima kolom: ID SOBAT, Nama Mitra, Tahap, PML, dan Beban Kerja. Urutannya boleh
                berbeda dan berkasnya boleh punya kolom tambahan &mdash; yang dicocokkan judulnya.
                Nama PML cukup nama panggilan selama menunjuk satu orang.
              </p>
              <p className="text-sm text-muted-foreground">
                Harga satuan, bulan, dan metode pembebanan tidak diisi di berkas. Harga adalah
                setelan per tahap di kegiatan ini; bulan dan metode pembebanan hanya ditanyakan
                kalau rentang honor tahapnya melintasi lebih dari satu bulan, dan form yang
                menagihnya.
              </p>
              <Button variant="outline" onClick={() => void unduhTemplateAlokasi(namaKegiatan)}>
                <Download className="w-4 h-4 mr-2" />
                Unduh Template Excel
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="berkasAlokasi">Berkas Excel (.xlsx)</Label>
              <input
                id="berkasAlokasi"
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
              {KOLOM_TEMPLATE_ALOKASI.map(({ kolom, judul }) => (
                <div key={kolom} className="space-y-1">
                  <Label className="text-xs">
                    {judul}
                    {(kolom === "tahap" || kolom === "bebanKerja") && <span className="text-destructive"> *</span>}
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
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Mitra dikenali dari ID SOBAT atau Nama Mitra &mdash; salah satu harus ditunjuk.
            </p>
          </div>
        )}

        {/* --------------------------- 3. tinjau ---------------------------- */}
        {langkah === "tinjau" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">{namaBerkas}</Badge>
              <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-800 dark:text-green-300">
                {ringkasan.siap} siap
              </Badge>
              {ringkasan.perluDiperiksa > 0 && (
                <Badge variant="outline" className="border-amber-400 text-amber-800 dark:border-amber-700 dark:text-amber-300">
                  {ringkasan.perluDiperiksa} perlu diperiksa
                </Badge>
              )}
              {ringkasan.ditolak > 0 && (
                <Badge variant="outline" className="border-red-300 text-red-700 dark:border-red-800 dark:text-red-300">
                  {ringkasan.ditolak} tidak bisa dipakai
                </Badge>
              )}
              {(Object.keys(LABEL_TAHAP) as TahapAlokasi[])
                .filter(t => ringkasan.perTahap[t] > 0)
                .map(t => (
                  <Badge key={t} variant="secondary">
                    {LABEL_TAHAP[t]}: {ringkasan.perTahap[t]}
                  </Badge>
                ))}
            </div>

            {tahapTanpaHarga.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-300" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Harga satuan tahap {tahapTanpaHarga.map(t => LABEL_TAHAP[t]).join(", ")} belum diisi,
                  jadi honornya masuk sebagai Rp 0. Isi harga satuannya di kartu tahap itu &mdash;
                  seluruh honor akan dihitung ulang sendiri.
                </p>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Baris</TableHead>
                    <TableHead>Mitra</TableHead>
                    <TableHead className="w-28">Tahap</TableHead>
                    <TableHead className="w-36">PML</TableHead>
                    <TableHead className="w-24 text-right">Beban</TableHead>
                    <TableHead className="w-28 text-right">Honor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hasil.map(h => {
                    const dipakai = barisBisaDipakai(h);
                    const honor = alokasi.find(a => a.nomorBaris === h.baris.nomorBaris);
                    return (
                      <TableRow key={h.baris.nomorBaris} className={dipakai ? undefined : "opacity-60"}>
                        <TableCell className="text-muted-foreground">{h.baris.nomorBaris}</TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {h.namaMitra || h.baris.nama || h.baris.sobatId || "(kosong)"}
                          </span>
                          {h.pesan.map((p, i) => (
                            <p key={i} className={dipakai
                              ? "text-xs text-amber-700 dark:text-amber-300"
                              : "text-xs text-red-700 dark:text-red-300"}>{p}</p>
                          ))}
                        </TableCell>
                        <TableCell>
                          {h.baris.tahap ? LABEL_TAHAP[h.baris.tahap] : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>{h.namaPml || <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell className="text-right">{h.baris.bebanKerja ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          {honor ? `Rp ${formatHonor(honor.besaranHonor)}` : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {hasil.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Tidak ada baris data setelah baris judul.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">
              Baris yang tidak bisa dipakai dilewati, bukan menggagalkan seluruh berkas. Perbaiki
              barisnya di Excel lalu impor lagi &mdash; mitra yang sudah masuk tidak akan terisi dua kali.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={tutup}>Batal</Button>

          {langkah === "petakan" && (
            <Button
              disabled={kolomWajibAlokasiHilang(peta).length > 0}
              onClick={() => setLangkah("tinjau")}
            >
              Lanjut
            </Button>
          )}

          {langkah === "tinjau" && (
            <>
              <Button variant="outline" onClick={() => setLangkah("petakan")}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />Atur Kolom
              </Button>
              <Button disabled={alokasi.length === 0} onClick={terapkan}>
                <Upload className="w-4 h-4 mr-2" />
                Masukkan {alokasi.length} Alokasi
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
