// client/components/kontrak/TabBast.tsx

/**
 * Tab "Generate BAST" pada halaman Generate Surat Mitra.
 *
 * Dipisah ke berkas sendiri semata agar `GenerateKontrak.tsx` tidak membengkak;
 * secara alur ia menempel erat pada tab SPK dan sengaja memakai periode, data
 * mitra, serta cache query yang sama.
 *
 * BAST tidak punya penomoran sendiri: nomornya mengikuti nomor SPK mitra yang
 * bersangkutan. Karena itu mitra yang SPK-nya belum dibuat TIDAK bisa
 * dibuatkan BAST — dan tetap ditampilkan di daftar, bukan disembunyikan, supaya
 * terlihat siapa yang tertinggal.
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { FileDown, Loader2, Package, AlertTriangle, Sheet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { DataKontrakMitra, TemplateSurat } from "@shared/api";
import { apiClient } from "@/lib/apiClient";
import { DatePicker } from "@/components/ui/date-picker";
import { labelRentang } from "@/lib/honorPeriode";
import { unduhBast, bastKeBlob, namaBerkasBast } from "@/lib/bastPdf";
import { unduhBlob, exportToExcel, type KolomEkspor } from "@/lib/exportUtils";
import type { RentangTanggal } from "@/components/ui/date-range-picker";

const FORMAT_TANGGAL = "yyyy-MM-dd";

interface Props {
  rentang: RentangTanggal;
  template?: TemplateSurat;
  dataMitra: DataKontrakMitra[];
  memuatMitra: boolean;
  bolehMengubah: boolean;
  username?: string;
  onPindahKeTabSpk: () => void;
  onSukses: (pesan: string) => void;
  onGagal: (judul: string, pesan: string) => void;
}

export default function TabBast({
  rentang, template, dataMitra, memuatMitra, bolehMengubah, username,
  onPindahKeTabSpk, onSukses, onGagal,
}: Props) {
  const queryClient = useQueryClient();
  // Tanggal serah terima. Diletakkan di dalam tab ini, bukan di kartu Periode
  // bersama, karena tidak berlaku untuk tab lain.
  const [tanggalBast, setTanggalBast] = useState(format(new Date(), FORMAT_TANGGAL));
  const [sedangGenerate, setSedangGenerate] = useState(false);
  const [progres, setProgres] = useState({ selesai: 0, total: 0 });

  const mitraSiap = useMemo(() => dataMitra.filter(m => !!m.nomorSurat), [dataMitra]);
  const mitraTanpaSpk = useMemo(() => dataMitra.filter(m => !m.nomorSurat), [dataMitra]);

  /**
   * Menetapkan nomor BAST lebih dulu, karena nomor wajib tercetak di surat.
   * Idempoten di server: mitra yang sudah punya nomor menerima nomor yang sama.
   */
  const pastikanNomorBast = async (daftar: DataKontrakMitra[]): Promise<DataKontrakMitra[]> => {
    const jawaban = await apiClient.post<{
      hasil: Record<string, { nomorBast: string; tanggalBast: string }>;
      tanpaSpk: string[];
    }>("/kontrak/bast/nomor", {
      periodeMulai: rentang.mulai,
      periodeSelesai: rentang.selesai,
      tanggalBast,
      username,
      daftarPplMasterId: daftar.map(m => m.pplMasterId),
    });
    queryClient.invalidateQueries({ queryKey: ["kontrakData"] });
    return daftar
      .map(m => ({ ...m, ...jawaban.hasil[m.pplMasterId] }))
      .filter(m => !!m.nomorBast);
  };

  const unduhSatu = async (mitra: DataKontrakMitra) => {
    if (!template) return;
    setSedangGenerate(true);
    try {
      const [lengkap] = await pastikanNomorBast([mitra]);
      if (!lengkap) {
        onGagal("Belum Ada Nomor SPK", `Surat PK untuk ${mitra.nama} belum dibuat. Nomor BAST mengikuti nomor SPK, jadi buat Surat PK-nya lebih dulu.`);
        return;
      }
      await unduhBast(lengkap, template, new Date(`${tanggalBast}T00:00:00`));
    } catch (error: any) {
      onGagal("Gagal Membuat BAST", error.message);
    } finally {
      setSedangGenerate(false);
    }
  };

  const unduhSemua = async () => {
    if (!template || mitraSiap.length === 0) return;
    setSedangGenerate(true);
    setProgres({ selesai: 0, total: mitraSiap.length });
    try {
      const lengkap = await pastikanNomorBast(mitraSiap);
      // JSZip hanya dibutuhkan di sini, jadi dimuat saat tombol ditekan.
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const tanggal = new Date(`${tanggalBast}T00:00:00`);
      // Berurutan agar bar kemajuan bermakna dan memori tidak melonjak.
      for (let i = 0; i < lengkap.length; i++) {
        zip.file(namaBerkasBast(lengkap[i]), await bastKeBlob(lengkap[i], template, tanggal));
        setProgres({ selesai: i + 1, total: lengkap.length });
      }
      unduhBlob(await zip.generateAsync({ type: "blob" }), `BAST_${rentang.mulai}_sd_${rentang.selesai}.zip`);
      const dilewati = mitraTanpaSpk.length > 0
        ? ` ${mitraTanpaSpk.length} mitra dilewati karena Surat PK-nya belum dibuat.`
        : "";
      onSukses(`${lengkap.length} Surat BAST berhasil dibuat dan diunduh dalam satu berkas ZIP.${dilewati}`);
    } catch (error: any) {
      onGagal("Gagal Membuat BAST", error.message);
    } finally {
      setSedangGenerate(false);
      setProgres({ selesai: 0, total: 0 });
    }
  };

  /**
   * Rekap Excel sengaja TIDAK menetapkan nomor BAST — sama seperti rekap SPK.
   * Menetapkan nomor tercatat permanen, jadi sekadar mengunduh rekap untuk
   * diperiksa tidak boleh menghanguskan nomor.
   */
  const unduhRekapExcel = async () => {
    const kolom: KolomEkspor<DataKontrakMitra>[] = [
      { header: "No", nilai: (_m, i) => i + 1 },
      { header: "Nomor BAST", nilai: m => m.nomorBast ?? "(belum dibuat)" },
      { header: "Nomor SPK", nilai: m => m.nomorSurat ?? "(belum digenerate)" },
      { header: "Nama Mitra", nilai: m => m.nama },
      {
        header: "Jangka Waktu",
        nilai: m => labelRentang(m.jangkaWaktuMulai ?? undefined, m.jangkaWaktuSelesai ?? undefined),
      },
      { header: "Status", nilai: m => (m.nomorSurat ? (m.nomorBast ? "BAST sudah dibuat" : "Siap dibuat") : "Belum ada SPK") },
    ];
    await exportToExcel({
      judul: "Rekap Berita Acara Serah Terima",
      subJudul: `Periode ${labelRentang(rentang.mulai, rentang.selesai)} · Tanggal serah terima ${tanggalBast}`,
      kolom,
      baris: dataMitra,
      namaFile: `rekap-bast-${rentang.mulai}-sd-${rentang.selesai}`,
    });
  };

  return (
    <Card>
      {/* Mengikuti pola header tab Generate SPK: kelas flex diletakkan pada
          <div> DI DALAM CardHeader, bukan pada CardHeader itu sendiri —
          CardHeader sudah membawa `flex flex-col space-y-1.5 p-6`, dan
          menimpanya membuat jarak antarelemen saling bertabrakan. */}
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Daftar Mitra — {labelRentang(rentang.mulai, rentang.selesai)}</CardTitle>
            <CardDescription>
              Berita Acara Serah Terima. Nomornya mengikuti nomor Surat PK mitra yang sama.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={unduhRekapExcel}
              disabled={sedangGenerate || dataMitra.length === 0}>
              <Sheet className="w-4 h-4 mr-2" /> Rekap Excel
            </Button>
            <Button onClick={unduhSemua}
              disabled={!bolehMengubah || sedangGenerate || mitraSiap.length === 0 || !template}>
              {sedangGenerate && progres.total > 0
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Membuat {progres.selesai}/{progres.total}...</>
                : <><Package className="w-4 h-4 mr-2" /> Generate Semua BAST (ZIP)</>}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pemilih tanggal dipindah keluar dari header. DatePicker merender
            <Button className="w-full ...">, jadi di dalam baris aksi ia
            mendorong tombol lain turun dan labelnya tertimpa. Lebarnya kini
            dipegang pembungkus, sama seperti Tanggal Surat di kartu Periode. */}
        <div className="space-y-2 sm:w-52">
          <Label htmlFor="tanggalBast">Tanggal Serah Terima</Label>
          <DatePicker
            id="tanggalBast"
            value={tanggalBast}
            // Mengosongkan tanggal tidak diizinkan: nomor BAST butuh tanggal
            // untuk menentukan penanda bulannya.
            onChange={nilai => setTanggalBast(nilai ?? tanggalBast)}
            disabled={!bolehMengubah}
          />
        </div>
        {!template && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-300 mt-0.5 shrink-0" />
            <span>Template surat belum tersedia. Isi dulu di halaman Template Surat.</span>
          </div>
        )}

        {mitraTanpaSpk.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-300 shrink-0" />
            <span className="flex-1">
              {mitraTanpaSpk.length} mitra belum punya nomor Surat PK. Nomor BAST mengikuti
              nomor SPK, jadi Surat PK-nya harus dibuat lebih dulu.
            </span>
            <Button variant="outline" size="sm" onClick={onPindahKeTabSpk}>
              Ke tab Generate SPK
            </Button>
          </div>
        )}

        {memuatMitra ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : dataMitra.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            Tidak ada mitra dengan honor pada periode ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. BAST</TableHead>
                  <TableHead>No. SPK</TableHead>
                  <TableHead>Nama Mitra</TableHead>
                  <TableHead className="text-center">Baris</TableHead>
                  <TableHead>Jangka Waktu</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataMitra.map(m => {
                  const siap = !!m.nomorSurat;
                  return (
                    <TableRow key={m.pplMasterId} className={siap ? undefined : "opacity-60"}>
                      <TableCell>
                        {m.nomorBast
                          ? <Badge variant="outline" className="font-mono">{m.nomorBast}</Badge>
                          : <span className="text-xs text-muted-foreground">belum dibuat</span>}
                      </TableCell>
                      <TableCell>
                        {m.nomorSurat
                          ? <Badge variant="outline" className="font-mono">{m.nomorSurat}</Badge>
                          : <span className="text-xs text-muted-foreground">belum ada SPK</span>}
                      </TableCell>
                      <TableCell className="font-medium">{m.nama}</TableCell>
                      <TableCell className="text-center">{m.baris.length}</TableCell>
                      <TableCell>{labelRentang(m.jangkaWaktuMulai ?? "", m.jangkaWaktuSelesai ?? "")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm"
                          onClick={() => unduhSatu(m)}
                          disabled={!bolehMengubah || sedangGenerate || !template || !siap}
                          title={siap ? undefined : "Surat PK mitra ini belum dibuat"}>
                          <FileDown className="w-4 h-4 mr-1" /> PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
