// client/pages/GenerateKontrak.tsx

import { useState, useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileDown, Save, Loader2, Package, ShieldAlert, AlertTriangle, Sheet, RotateCcw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { UraianTugasKontrak, DataKontrakMitra, TemplateSurat, NomorTerpakaiTahun, HasilAturUlangNomor } from "@shared/api";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import type { RentangTanggal } from "@/components/ui/date-range-picker";
import { MonthPicker, bulanSekarang } from "@/components/ui/month-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { labelRentang, rentangDariBulan } from "@/lib/honorPeriode";
import { formatRupiah } from "@/lib/terbilang";
import { FRASA_KONFIRMASI_ATUR_ULANG, ringkasNomorPeriode } from "@shared/aturUlangNomor";
import { unduhKontrak, kontrakKeBlob, namaBerkasKontrak } from "@/lib/kontrakPdf";
import { unduhBlob, exportToExcel, type KolomEkspor } from "@/lib/exportUtils";
import TabBast from "@/components/kontrak/TabBast";
import DialogAturUlangNomor from "@/components/kontrak/DialogAturUlangNomor";
import SuccessModal from "@/components/SuccessModal";
import AlertModal from "@/components/AlertModal";

const FORMAT_TANGGAL = "yyyy-MM-dd";

const LABEL_TAHAP: Record<string, string> = {
  listing: "Listing",
  pencacahan: "Pencacahan",
  pengolahan: "Pengolahan",
};

export default function GenerateKontrak() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Tim keuangan diwakili role supervisor; admin juga diberi akses.
  const bolehMengubah = user?.role === "admin" || user?.role === "supervisor";

  // Surat PK diikat per mitra per BULAN, sesuai praktik tim keuangan, jadi
  // periodenya SELALU satu bulan kalender penuh dan diturunkan dari pilihan
  // bulan. Dulu di sini ada pemilih rentang bebas: setiap kali rentangnya
  // digeser sedikit, aplikasi menganggapnya periode baru lalu memesan nomor
  // surat baru, sehingga satu mitra bisa memegang tiga nomor untuk pekerjaan
  // yang sama (001, 005, dan 007 pada data nyata).
  const [bulan, setBulan] = useState(bulanSekarang());
  const rentang: RentangTanggal = useMemo(() => rentangDariBulan(bulan), [bulan]);
  const [tanggalSurat, setTanggalSurat] = useState(format(new Date(), FORMAT_TANGGAL));
  // Tab awal bisa ditentukan lewat `?tab=`, dipakai notifikasi "isi surat
  // berubah" untuk mendaratkan tim keuangan langsung di tab Generate SPK —
  // tempat peringatan per mitra dan tombol perbaikannya berada.
  const [paramTab] = useSearchParams();
  const tabDiminta = paramTab.get('tab');
  const [tabAktif, setTabAktif] = useState(
    tabDiminta === 'generate' || tabDiminta === 'bast' ? tabDiminta : "uraian");
  const [dialogAturUlang, setDialogAturUlang] = useState(false);
  const [draftUraian, setDraftUraian] = useState<Record<string, { uraian_tugas: string; kode_anggaran: string }>>({});
  const [sedangGenerate, setSedangGenerate] = useState(false);
  const [progresGenerate, setProgresGenerate] = useState({ selesai: 0, total: 0 });
  const [successModal, setSuccessModal] = useState({ isOpen: false, description: "" });
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "" });

  const periodeLengkap = Boolean(rentang.mulai && rentang.selesai);
  const kueriPeriode = `tanggalMulai=${rentang.mulai}&tanggalSelesai=${rentang.selesai}`;

  const { data: template } = useQuery({
    queryKey: ["templateSurat"],
    queryFn: () => apiClient.get<TemplateSurat>("/kontrak/template"),
  });

  const { data: daftarUraian = [], isLoading: memuatUraian } = useQuery({
    queryKey: ["kontrakUraian", rentang.mulai, rentang.selesai],
    queryFn: () => apiClient.get<UraianTugasKontrak[]>(`/kontrak/uraian?${kueriPeriode}`),
    enabled: periodeLengkap,
  });

  const { data: dataMitra = [], isLoading: memuatMitra } = useQuery({
    queryKey: ["kontrakData", rentang.mulai, rentang.selesai],
    queryFn: () => apiClient.get<DataKontrakMitra[]>(`/kontrak/data?${kueriPeriode}`),
    enabled: periodeLengkap,
  });

  // Draft disinkronkan ulang setiap data server berubah, supaya kolom yang
  // diedit tidak menimpa hasil penyimpanan sebelumnya.
  useEffect(() => {
    const awal: Record<string, { uraian_tugas: string; kode_anggaran: string }> = {};
    daftarUraian.forEach(u => {
      awal[`${u.kegiatanId}-${u.jenis_pekerjaan}`] = {
        uraian_tugas: u.uraian_tugas,
        kode_anggaran: u.kode_anggaran,
      };
    });
    setDraftUraian(awal);
  }, [daftarUraian]);

  const simpanUraian = useMutation({
    mutationFn: () =>
      apiClient.put("/kontrak/uraian", {
        daftar: daftarUraian.map(u => ({
          kegiatanId: u.kegiatanId,
          jenis_pekerjaan: u.jenis_pekerjaan,
          ...draftUraian[`${u.kegiatanId}-${u.jenis_pekerjaan}`],
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kontrakUraian"] });
      queryClient.invalidateQueries({ queryKey: ["kontrakData"] });
      setSuccessModal({
        isOpen: true,
        description: "Uraian tugas dan kode beban anggaran tersimpan, dan langsung berlaku untuk semua mitra pada kegiatan dan tahap tersebut.",
      });
    },
    onError: (error: any) => setAlertModal({ isOpen: true, title: "Gagal Menyimpan", message: error.message }),
  });

  const ubahDraft = (kunci: string, kolom: "uraian_tugas" | "kode_anggaran", nilai: string) =>
    setDraftUraian(prev => ({ ...prev, [kunci]: { ...prev[kunci], [kolom]: nilai } }));

  /** Memesan nomor surat lebih dulu, karena nomor wajib tercetak di surat. */
  const pastikanNomor = async (mitra: DataKontrakMitra[]): Promise<DataKontrakMitra[]> => {
    const hasil = await apiClient.post<Record<string, { nomorUrut: number; nomorSurat: string }>>(
      "/kontrak/nomor",
      {
        periodeMulai: rentang.mulai,
        periodeSelesai: rentang.selesai,
        tanggalSurat,
        // `baris` ikut dikirim supaya server bisa menyimpan salinan isi surat
        // saat terbit. Tanpa itu, perubahan honor atau muatan setelah surat
        // ditandatangani tidak bisa ditunjukkan, hanya selisih totalnya.
        daftarMitra: mitra.map(m => ({
          pplMasterId: m.pplMasterId,
          totalHonor: m.totalHonor,
          baris: m.baris,
        })),
      },
    );
    queryClient.invalidateQueries({ queryKey: ["kontrakData"] });
    return mitra.map(m => ({ ...m, ...hasil[m.pplMasterId] }));
  };

  const mitraTanpaMAK = useMemo(
    () => dataMitra.filter(m => m.baris.some(b => !b.kodeAnggaran)).length,
    [dataMitra],
  );

  // Nomor surat dimaterialisasi saat dipesan, jadi mengubah tanggal setelahnya
  // membuat isi surat dan nomornya menyebut bulan berbeda. Diberi peringatan
  // alih-alih dilarang, karena tanggalnya memang kadang perlu digeser.
  const sudahAdaNomor = useMemo(() => dataMitra.some(m => !!m.nomorSurat), [dataMitra]);

  /**
   * Nomor tertinggi tahun berjalan, DARI SERVER.
   *
   * Dulu dihitung di sini dari `dataMitra`, yaitu periode yang sedang tampil
   * saja — padahal server memakai MAX seluruh tahun. Akibatnya peringatan
   * "nomor sudah terpakai" bisa diam-diam gagal muncul: isi 5 pada periode yang
   * belum bernomor sementara Januari sudah sampai 010, layar diam saja dan
   * suratnya terbit bernomor 011.
   */
  const tahunSurat = Number(tanggalSurat.slice(0, 4));
  const { data: nomorTahun } = useQuery({
    queryKey: ["kontrakMaksNomor", tahunSurat],
    queryFn: () => apiClient.get<NomorTerpakaiTahun>(`/kontrak/nomor-terpakai?tahun=${tahunSurat}`),
    enabled: Number.isInteger(tahunSurat) && tahunSurat > 2000,
  });
  const maksTerpakaiTahun = nomorTahun?.maksTerpakai ?? 0;

  /** Ringkasan nomor periode yang sedang tampil, untuk dialog atur ulang. */
  const ringkasanNomor = useMemo(() => ringkasNomorPeriode(dataMitra), [dataMitra]);

  /**
   * Mitra yang suratnya SUDAH terbit tetapi isinya tidak lagi sesuai data
   * sekarang — honor direvisi, muatan bertambah, atau ada kegiatan baru yang
   * masuk setelah surat ditandatangani. Dihitung server (lihat
   * `bandingkanIsiSurat`) supaya layar dan notifikasi tidak pernah berbeda.
   */
  const mitraBerubah = useMemo(() => dataMitra.filter(m => (m.perubahan?.length ?? 0) > 0), [dataMitra]);
  const [suratDiperiksa, setSuratDiperiksa] = useState<DataKontrakMitra | null>(null);

  /**
   * "Perbarui Kontrak": isi surat disegarkan mengikuti data sekarang, NOMORNYA
   * TETAP. Bagi tim keuangan ini surat yang sama yang dicetak ulang — memberi
   * nomor baru justru menciptakan dua surat untuk satu pekerjaan.
   */
  const perbaruiKontrak = useMutation({
    mutationFn: (suratId: number) => apiClient.post(`/kontrak/surat/${suratId}/perbarui`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kontrakData"] });
      setSuratDiperiksa(null);
      setSuccessModal({
        isOpen: true,
        description: "Isi kontrak diperbarui mengikuti data terbaru. Nomor suratnya tidak berubah — cetak ulang PDF-nya agar berkasnya ikut sesuai.",
      });
    },
    onError: (error: any) =>
      setAlertModal({ isOpen: true, title: "Gagal Memperbarui Kontrak", message: error.message }),
  });

  const aturUlangNomor = useMutation({
    mutationFn: () => apiClient.post<HasilAturUlangNomor>("/kontrak/nomor/atur-ulang", {
      periodeMulai: rentang.mulai,
      periodeSelesai: rentang.selesai,
      konfirmasi: FRASA_KONFIRMASI_ATUR_ULANG,
    }),
    onSuccess: (hasil) => {
      queryClient.invalidateQueries({ queryKey: ["kontrakData"] });
      // Wajib: MAX tahun berjalan ikut berubah setelah nomor dihapus. Tanpa ini
      // keterangan "sekarang N" tetap menampilkan angka lama.
      queryClient.invalidateQueries({ queryKey: ["kontrakMaksNomor"] });
      setDialogAturUlang(false);
      // Angka diambil dari SERVER, bukan dari pratinjau: `dataMitra` hanya
      // memuat mitra yang MASIH punya honor di periode ini, sedangkan
      // penghapusan mengenai seluruh baris periode tersebut.
      const catatanBast = hasil.jumlahBast > 0
        ? ` ${hasil.jumlahBast} nomor BAST ikut terhapus dan harus dibuat ulang.`
        : "";
      setSuccessModal({
        isOpen: true,
        description: `${hasil.terhapus} nomor surat pada periode ini dihapus.${catatanBast} Periode ini sekarang bisa dinomori ulang.`,
      });
    },
    onError: (error: any) =>
      setAlertModal({ isOpen: true, title: "Gagal Mengatur Ulang Nomor", message: error.message }),
  });

  const unduhSatu = async (mitra: DataKontrakMitra) => {
    if (!template) return;
    setSedangGenerate(true);
    try {
      const [lengkap] = await pastikanNomor([mitra]);
      await unduhKontrak(lengkap, template, new Date(`${tanggalSurat}T00:00:00`));
    } catch (error: any) {
      setAlertModal({ isOpen: true, title: "Gagal Membuat Surat", message: error.message });
    } finally {
      setSedangGenerate(false);
    }
  };

  /**
   * Rekap Excel: SATU baris per mitra, bukan satu berkas per mitra.
   *
   * Sengaja TIDAK memesan nomor surat. Memesan nomor adalah tindakan yang
   * tidak bisa dibatalkan (tercatat permanen di `kontrak_mitra`), jadi
   * sekadar mengunduh rekap untuk diperiksa tidak boleh menghanguskan nomor.
   * Mitra yang belum punya nomor ditandai "belum digenerate".
   */
  const unduhRekapExcel = async () => {
    const kolom: KolomEkspor<DataKontrakMitra>[] = [
      { header: "No", nilai: (_m, i) => i + 1 },
      { header: "Nomor Surat", nilai: m => m.nomorSurat ?? "(belum digenerate)" },
      { header: "Nama Mitra", nilai: m => m.nama },
      { header: "Alamat", nilai: m => m.alamat ?? "-" },
      { header: "Jumlah Rincian", nilai: m => m.baris.length },
      {
        header: "Jangka Waktu",
        nilai: m => labelRentang(m.jangkaWaktuMulai ?? undefined, m.jangkaWaktuSelesai ?? undefined),
      },
      { header: "Total Honor", nilai: m => m.totalHonor, rataKanan: true },
    ];

    await exportToExcel({
      judul: "Rekap Surat Perjanjian Kerja",
      subJudul: `Periode ${labelRentang(rentang.mulai, rentang.selesai)} · Tanggal surat ${tanggalSurat}`,
      kolom,
      baris: dataMitra,
      namaFile: `rekap-spk-${rentang.mulai}-sd-${rentang.selesai}`,
    });
  };

  const unduhSemua = async () => {
    if (!template || dataMitra.length === 0) return;
    setSedangGenerate(true);
    setProgresGenerate({ selesai: 0, total: dataMitra.length });
    try {
      const lengkap = await pastikanNomor(dataMitra);
      // JSZip hanya dibutuhkan di sini, jadi dimuat saat tombol ditekan.
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const tanggal = new Date(`${tanggalSurat}T00:00:00`);
      // Dibuat berurutan agar bar kemajuan bermakna dan memori tidak melonjak
      // saat jumlah mitranya banyak.
      for (let i = 0; i < lengkap.length; i++) {
        const blob = await kontrakKeBlob(lengkap[i], template, tanggal);
        zip.file(namaBerkasKontrak(lengkap[i]), blob);
        setProgresGenerate({ selesai: i + 1, total: lengkap.length });
      }
      const isiZip = await zip.generateAsync({ type: "blob" });
      unduhBlob(isiZip, `SPK_${rentang.mulai}_sd_${rentang.selesai}.zip`);
      setSuccessModal({
        isOpen: true,
        description: `${lengkap.length} Surat PK berhasil dibuat dan diunduh dalam satu berkas ZIP.`,
      });
    } catch (error: any) {
      setAlertModal({ isOpen: true, title: "Gagal Membuat Surat", message: error.message });
    } finally {
      setSedangGenerate(false);
      setProgresGenerate({ selesai: 0, total: 0 });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Generate Surat Mitra</h1>
          <p className="text-muted-foreground mt-1">
            Membuat Surat Perjanjian Kerja dan Berita Acara Serah Terima per mitra, otomatis dari data kegiatan pada suatu periode.
          </p>
        </div>

        {!bolehMengubah && (
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                Halaman ini untuk tim keuangan (role supervisor) dan admin. Anda hanya dapat melihat.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Periode</CardTitle>
            <CardDescription>
              Mitra dan kegiatan yang honornya jatuh pada rentang ini yang akan dibuatkan surat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-2 sm:w-80">
                <Label htmlFor="bulanSurat">Bulan Honor</Label>
                <MonthPicker id="bulanSurat" value={bulan} onChange={setBulan} />
                <p className="text-xs text-muted-foreground">
                  Satu surat per mitra per bulan. Honor yang melintasi dua bulan sudah dipecah
                  menurut muatannya, jadi tiap bulan punya suratnya sendiri.
                </p>
              </div>
              <div className="space-y-2 sm:w-52">
                <Label htmlFor="tanggalSurat">Tanggal Surat</Label>
                {/* Diganti dari <input type="date"> supaya SELURUH kotaknya bisa
                    diklik — konsisten dengan pemilih periode di sebelahnya. */}
                <DatePicker id="tanggalSurat" value={tanggalSurat}
                  onChange={v => setTanggalSurat(v ?? tanggalSurat)} />
                {sudahAdaNomor && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Sebagian mitra sudah punya nomor surat. Mengubah tanggal
                    tidak akan mengubah nomor yang terlanjur dipesan.
                  </p>
                )}
              </div>
              <div className="space-y-2 sm:w-44">
                {/* Isian "Mulai dari Nomor" dihapus: nomor yang sudah dipesan
                    bersifat permanen, jadi isian itu tidak berlaku bagi mitra
                    yang sudah bernomor dan justru menimbulkan keluhan "sudah
                    diisi 7 tapi nomornya tetap dari 1". Penyesuaian nomor kini
                    dilakukan per surat di halaman Riwayat Penyuratan. */}
                <Label>Penomoran</Label>
                <p className="text-xs text-muted-foreground">
                  Nomor melanjutkan nomor tertinggi tahun {tahunSurat}
                  {maksTerpakaiTahun > 0 ? ` (sekarang ${maksTerpakaiTahun})` : ""}.
                  Nomor tiap surat bisa disesuaikan di halaman Riwayat Penyuratan.
                </p>
                {/* Penyebab keluhan "sudah diisi 7 tapi nomornya tetap dari 1":
                    nomor yang terlanjur dipesan bersifat permanen, jadi isian ini
                    tidak berlaku bagi mitra yang sudah punya nomor. */}
                {ringkasanNomor.jumlah > 0 && (
                  <>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {ringkasanNomor.jumlah} mitra pada periode ini sudah punya nomor, dan
                      nomornya tidak akan berubah. Isian di atas hanya berlaku untuk mitra
                      yang belum bernomor.
                    </p>
                    {/* Diletakkan di sini, bukan di baris aksi: tombolnya
                        mengubah penomoran, jadi tempatnya di sebelah kendali
                        penomoran — sekaligus menjaga baris aksi tetap dua
                        tombol supaya tidak membungkus. */}
                    <Button variant="outline" size="sm" onClick={() => setDialogAturUlang(true)}
                      disabled={!bolehMengubah || sedangGenerate}
                      className="w-full border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Atur Ulang Nomor
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terkendali, supaya banner "buat SPK dulu" di tab BAST bisa
            memindahkan pengguna ke tab SPK. */}
        <Tabs value={tabAktif} onValueChange={setTabAktif}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="uraian">1. Atur Uraian &amp; Beban Anggaran</TabsTrigger>
            <TabsTrigger value="generate">2. Generate SPK</TabsTrigger>
            <TabsTrigger value="bast">3. Generate BAST</TabsTrigger>
          </TabsList>

          {/* --------------------- Langkah 1 --------------------- */}
          <TabsContent value="uraian" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle>Uraian Tugas &amp; Kode Beban Anggaran</CardTitle>
                    <CardDescription>
                      Diatur sekali per kegiatan dan tahap, lalu berlaku untuk semua mitra di dalamnya.
                      Uraian sudah terisi bawaan dari nama kegiatan — silakan sesuaikan bila perlu.
                    </CardDescription>
                  </div>
                  {bolehMengubah && (
                    <Button onClick={() => simpanUraian.mutate()} disabled={simpanUraian.isPending || daftarUraian.length === 0}>
                      {simpanUraian.isPending
                        ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        : <Save className="w-4 h-4 mr-2" />}
                      Simpan
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[22%]">Kegiatan</TableHead>
                      <TableHead className="w-[12%]">Tahap</TableHead>
                      <TableHead className="w-[8%]">Mitra</TableHead>
                      <TableHead className="w-[29%]">Uraian Tugas</TableHead>
                      <TableHead className="w-[29%]">Kode Beban Anggaran</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memuatUraian ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : daftarUraian.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Tidak ada kegiatan dengan mitra pada periode ini.
                      </TableCell></TableRow>
                    ) : (
                      daftarUraian.map(u => {
                        const kunci = `${u.kegiatanId}-${u.jenis_pekerjaan}`;
                        const draft = draftUraian[kunci] || { uraian_tugas: "", kode_anggaran: "" };
                        return (
                          <TableRow key={kunci}>
                            <TableCell className="font-medium">{u.namaKegiatan}</TableCell>
                            <TableCell><Badge variant="outline">{LABEL_TAHAP[u.jenis_pekerjaan]}</Badge></TableCell>
                            <TableCell>{u.jumlahMitra}</TableCell>
                            <TableCell>
                              <Input value={draft.uraian_tugas} disabled={!bolehMengubah}
                                onChange={e => ubahDraft(kunci, "uraian_tugas", e.target.value)} />
                            </TableCell>
                            <TableCell>
                              <Input value={draft.kode_anggaran} disabled={!bolehMengubah}
                                placeholder="2906.BMA.006.005.A.521213"
                                onChange={e => ubahDraft(kunci, "kode_anggaran", e.target.value)} />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --------------------- Langkah 2 --------------------- */}
          <TabsContent value="generate" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle>Daftar Mitra — {labelRentang(rentang.mulai, rentang.selesai)}</CardTitle>
                    <CardDescription>
                      Setiap mitra menghasilkan satu berkas PDF. Nomor surat dipesan saat pertama kali
                      digenerate dan tidak berubah bila digenerate ulang.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {/* Rekap satu baris per mitra — bukan satu berkas per mitra
                        seperti PDF-nya. Berguna untuk pemeriksaan dan lampiran SPJ. */}
                    <Button variant="outline" onClick={unduhRekapExcel}
                      disabled={sedangGenerate || dataMitra.length === 0}>
                      <Sheet className="w-4 h-4 mr-2" />
                      Rekap Excel
                    </Button>
                    <Button onClick={unduhSemua} disabled={!bolehMengubah || sedangGenerate || dataMitra.length === 0 || !template}>
                      {sedangGenerate
                        ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        : <Package className="w-4 h-4 mr-2" />}
                      {sedangGenerate && progresGenerate.total > 0
                        ? `Membuat ${progresGenerate.selesai}/${progresGenerate.total}...`
                        : "Generate Semua (ZIP)"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!template && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-300 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      Template surat belum tersedia. Isi dulu di menu Template Surat.
                    </p>
                  </div>
                )}
                {mitraBerubah.length > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-md">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-300 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-300">
                      <p className="font-medium">
                        {mitraBerubah.length} surat sudah terbit tetapi isinya tidak lagi sesuai data sekarang.
                      </p>
                      <p>
                        Honor atau muatannya berubah, atau ada kegiatan baru yang masuk setelah surat dibuat.
                        Klik lencana &quot;Berubah&quot; pada barisnya untuk melihat apa yang berbeda.
                      </p>
                    </div>
                  </div>
                )}
                {mitraTanpaMAK > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-300 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      {mitraTanpaMAK} mitra punya baris tanpa kode beban anggaran. Suratnya tetap bisa
                      dibuat, tapi kolom Beban Anggaran akan tercetak "-". Isi dulu di langkah 1 bila perlu.
                    </p>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[8%]">No. Surat</TableHead>
                      <TableHead className="w-[26%]">Nama Mitra</TableHead>
                      <TableHead className="w-[10%]">Baris</TableHead>
                      <TableHead className="w-[20%]">Jangka Waktu</TableHead>
                      <TableHead className="w-[18%]">Total Honor</TableHead>
                      <TableHead className="w-[18%]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memuatMitra ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : dataMitra.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Tidak ada mitra dengan honor pada periode ini.
                      </TableCell></TableRow>
                    ) : (
                      dataMitra.map(m => (
                        <TableRow key={m.pplMasterId}>
                          <TableCell>
                            {m.nomorUrut
                              ? <Badge variant="outline">{m.nomorUrut}</Badge>
                              : <span className="text-muted-foreground">belum</span>}
                          </TableCell>
                          <TableCell className="font-medium">{m.nama}</TableCell>
                          <TableCell>{m.baris.length}</TableCell>
                          <TableCell className="text-sm">{labelRentang(m.jangkaWaktuMulai ?? undefined, m.jangkaWaktuSelesai ?? undefined)}</TableCell>
                          <TableCell className="font-semibold">{formatRupiah(m.totalHonor)}</TableCell>
                          <TableCell>
                            {/* Peringatan diletakkan di kolom aksi, di bawah tombol
                                PDF, bukan menempel pada nama mitra: ia adalah
                                TINDAKAN yang perlu diambil, dan menaruhnya di kolom
                                nama membuat kolom itu berantakan. */}
                            <div className="flex flex-col items-start gap-1">
                              <Button variant="outline" size="sm" disabled={!bolehMengubah || sedangGenerate || !template}
                                onClick={() => unduhSatu(m)}>
                                <FileDown className="w-4 h-4 mr-1" />PDF
                              </Button>
                              {(m.perubahan?.length ?? 0) > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-amber-400 text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/40"
                                  onClick={() => setSuratDiperiksa(m)}
                                >
                                  <AlertTriangle className="w-4 h-4 mr-1" />
                                  Berubah
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --------------------- Langkah 3 --------------------- */}
          <TabsContent value="bast" className="mt-6">
            <TabBast
              rentang={rentang}
              template={template}
              dataMitra={dataMitra}
              memuatMitra={memuatMitra}
              bolehMengubah={bolehMengubah}
              onPindahKeTabSpk={() => setTabAktif("generate")}
              onSukses={description => setSuccessModal({ isOpen: true, description })}
              onGagal={(title, message) => setAlertModal({ isOpen: true, title, message })}
            />
          </TabsContent>
        </Tabs>
      </div>

      <DialogAturUlangNomor
        isOpen={dialogAturUlang}
        onClose={() => setDialogAturUlang(false)}
        onKonfirmasi={() => aturUlangNomor.mutate()}
        labelPeriode={labelRentang(rentang.mulai, rentang.selesai)}
        ringkasan={ringkasanNomor}
        sedangProses={aturUlangNomor.isPending}
      />

      {/* Apa yang berbeda sejak surat terbit.
          "Abaikan dulu" sengaja TIDAK menyimpan apa pun: peringatannya harus
          tetap ada selama isinya belum diselaraskan, karena yang dipastikan ke
          ketua tim adalah datanya, bukan peringatannya. */}
      <Dialog open={suratDiperiksa !== null} onOpenChange={buka => { if (!buka) setSuratDiperiksa(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Perubahan pada surat {suratDiperiksa?.nomorSurat || suratDiperiksa?.nama}
            </DialogTitle>
            <DialogDescription>
              Berikut yang berbeda antara isi surat saat terbit dan data {suratDiperiksa?.nama} sekarang.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto space-y-3">
            {(suratDiperiksa?.perubahan ?? []).map((p, i) => (
              <div key={i} className="rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      p.jenis === "baru" ? "border-green-300 text-green-700 dark:border-green-800 dark:text-green-300"
                      : p.jenis === "hilang" ? "border-red-300 text-red-700 dark:border-red-800 dark:text-red-300"
                      : "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300"
                    }
                  >
                    {p.jenis === "baru" ? "Kegiatan baru"
                      : p.jenis === "hilang" ? "Tidak ada lagi"
                      : p.jenis === "total" ? "Total berubah" : "Berubah"}
                  </Badge>
                  <span className="text-sm font-medium">{p.judul}</span>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {p.rincian.map((r, j) => <li key={j}>{r}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Memperbarui kontrak menyelaraskan isinya dengan data sekarang dan TIDAK mengubah nomor
            surat. Berkas PDF yang sudah dicetak perlu dicetak ulang setelahnya.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSuratDiperiksa(null)}>
              Abaikan Dulu
            </Button>
            <Button
              disabled={!bolehMengubah || !suratDiperiksa?.suratId || perbaruiKontrak.isPending}
              onClick={() => suratDiperiksa?.suratId && perbaruiKontrak.mutate(suratDiperiksa.suratId)}
            >
              {perbaruiKontrak.isPending
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <RotateCcw className="w-4 h-4 mr-2" />}
              Perbarui Kontrak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, description: "" })}
        onAction={() => setSuccessModal({ isOpen: false, description: "" })}
        title="Berhasil"
        description={successModal.description}
      />
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, title: "", message: "" })}
        title={alertModal.title}
        description={alertModal.message}
      />
    </Layout>
  );
}
