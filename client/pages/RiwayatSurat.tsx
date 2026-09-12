// client/pages/RiwayatSurat.tsx

/**
 * Riwayat Penyuratan: seluruh Surat PK/BAST satu tahun dalam satu tabel.
 *
 * Halaman ini menjawab satu pertanyaan yang selama ini hanya bisa dijawab
 * dengan membuka database: "nomor 005 ke mana?". Surat yang tidak jadi dipakai
 * TIDAK hilang — ia ditandai batal beserta catatan alasannya dan tetap tampil
 * di sini. Nomor yang benar-benar kosong (suratnya dihapus) ditampilkan
 * terpisah sebagai celah.
 *
 * Tiga tindakan yang tersedia, dari yang paling ringan:
 *  - mengganti nomor urut sebuah surat, mis. menyesuaikan buku agenda manual;
 *  - membatalkan surat (wajib memberi catatan) sehingga mitra bisa menerima
 *    surat pengganti dengan nomor baru;
 *  - menghapus permanen surat yang SUDAH batal, supaya riwayat tidak penuh
 *    nomor ganda yang membingungkan. Penghapusannya sendiri tetap tercatat.
 */

import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Ban, Check, Loader2, MessageSquare, Pencil, Sheet, ShieldAlert, Trash2, Wand2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RiwayatSuratItem, RiwayatSuratTahun } from "@shared/api";
import type { RencanaRapikan } from "@shared/penomoranSurat";
import { FRASA_KONFIRMASI_ATUR_ULANG, konfirmasiAturUlangSah } from "@shared/aturUlangNomor";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import { labelRentang, labelRentangSingkat } from "@/lib/honorPeriode";
import { formatRupiah } from "@/lib/terbilang";
import { exportToExcel, type KolomEkspor } from "@/lib/exportUtils";
import AlertModal from "@/components/AlertModal";

type HasilRapikan = RencanaRapikan & { diterapkan: number };

export default function RiwayatSurat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Tim keuangan diwakili role supervisor; admin juga diberi akses.
  const bolehMengubah = user?.role === "admin" || user?.role === "supervisor";

  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [draftNomor, setDraftNomor] = useState<Record<number, string>>({});
  const [dialogBatal, setDialogBatal] = useState<RiwayatSuratItem | null>(null);
  const [dialogCatatan, setDialogCatatan] = useState<RiwayatSuratItem | null>(null);
  const [dialogHapus, setDialogHapus] = useState<RiwayatSuratItem | null>(null);
  const [dialogRapikan, setDialogRapikan] = useState<HasilRapikan | null>(null);
  /** Rincian kegiatan yang tercakup sebuah surat. */
  const [dialogRincian, setDialogRincian] = useState<RiwayatSuratItem | null>(null);
  /** Apa yang berbeda antara isi surat saat terbit dan data sekarang. */
  const [dialogPerubahan, setDialogPerubahan] = useState<RiwayatSuratItem | null>(null);
  const [teksCatatan, setTeksCatatan] = useState("");
  const [teksKonfirmasi, setTeksKonfirmasi] = useState("");
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["riwayatSurat", tahun],
    queryFn: () => apiClient.get<RiwayatSuratTahun>(`/kontrak/riwayat?tahun=${tahun}`),
    enabled: bolehMengubah,
  });

  const surat = useMemo(() => data?.surat ?? [], [data]);
  const jumlahAktif = surat.filter(s => s.status === "aktif").length;
  const jumlahBatal = surat.length - jumlahAktif;

  const segarkan = () => queryClient.invalidateQueries({ queryKey: ["riwayatSurat"] });
  const gagal = (title: string) => (error: any) =>
    setAlertModal({ isOpen: true, title, message: error?.message || "Terjadi kesalahan." });

  const ubahNomor = useMutation({
    mutationFn: ({ id, nomor }: { id: number; nomor: number }) =>
      apiClient.put(`/kontrak/surat/${id}/nomor`, { nomor }),
    onSuccess: (_hasil, { id }) => {
      setDraftNomor(d => { const baru = { ...d }; delete baru[id]; return baru; });
      segarkan();
    },
    onError: gagal("Gagal Mengubah Nomor"),
  });

  const batalkan = useMutation({
    mutationFn: ({ id, catatan }: { id: number; catatan: string }) =>
      apiClient.post(`/kontrak/surat/${id}/batal`, { catatan }),
    onSuccess: () => { setDialogBatal(null); setTeksCatatan(""); segarkan(); },
    onError: gagal("Gagal Membatalkan Surat"),
  });

  const simpanCatatan = useMutation({
    mutationFn: ({ id, catatan }: { id: number; catatan: string }) =>
      apiClient.put(`/kontrak/surat/${id}/catatan`, { catatan }),
    onSuccess: () => { setDialogCatatan(null); setTeksCatatan(""); segarkan(); },
    onError: gagal("Gagal Menyimpan Catatan"),
  });

  const hapus = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/kontrak/surat/${id}`),
    onSuccess: () => { setDialogHapus(null); segarkan(); },
    onError: gagal("Gagal Menghapus Surat"),
  });

  /** Pratinjau dulu: pengguna harus melihat pergeserannya sebelum menyetujui. */
  const pratinjauRapikan = useMutation({
    mutationFn: () => apiClient.post<HasilRapikan>("/kontrak/nomor/rapikan", { tahun, pratinjau: true }),
    onSuccess: hasil => {
      if (hasil.perubahan.length === 0) {
        setAlertModal({
          isOpen: true,
          title: "Nomor Sudah Rapat",
          message: `Tidak ada nomor yang perlu digeser pada tahun ${tahun}.`,
        });
        return;
      }
      setTeksKonfirmasi("");
      setDialogRapikan(hasil);
    },
    onError: gagal("Gagal Menyiapkan Perapian Nomor"),
  });

  const terapkanRapikan = useMutation({
    mutationFn: () => apiClient.post<HasilRapikan>("/kontrak/nomor/rapikan", {
      tahun, konfirmasi: teksKonfirmasi,
    }),
    onSuccess: hasil => {
      setDialogRapikan(null);
      setTeksKonfirmasi("");
      segarkan();
      setAlertModal({
        isOpen: true,
        title: "Nomor Dirapikan",
        message: `${hasil.diterapkan} surat berpindah nomor pada tahun ${tahun}.`,
      });
    },
    onError: gagal("Gagal Merapikan Nomor"),
  });

  if (!bolehMengubah) {
    return (
      <Layout>
        <Card className="max-w-xl mx-auto mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Halaman Khusus Tim Keuangan
            </CardTitle>
            <CardDescription>
              Riwayat penyuratan hanya bisa dibuka oleh tim keuangan dan admin.
            </CardDescription>
          </CardHeader>
        </Card>
      </Layout>
    );
  }

  /**
   * Ekspor satu tahun penyuratan, SPK dan BAST dalam satu berkas.
   *
   * Surat batal ikut diekspor beserta catatannya: berkas ini dipakai
   * mencocokkan dengan buku agenda manual, dan di buku itu nomor yang batal
   * juga tetap tertulis.
   */
  const ekspor = () => {
    const kolom: KolomEkspor<RiwayatSuratItem>[] = [
      { header: "No. Urut", nilai: s => s.nomorUrut },
      { header: "Nomor SPK", nilai: s => s.nomorSurat },
      { header: "Tanggal SPK", nilai: s => s.tanggalSurat },
      { header: "Nomor BAST", nilai: s => s.nomorBast || "-" },
      { header: "Tanggal BAST", nilai: s => s.tanggalBast || "-" },
      { header: "Mitra", nilai: s => s.namaPPL },
      { header: "Periode", nilai: s => labelRentang(s.periodeMulai, s.periodeSelesai) },
      { header: "Total Honor", nilai: s => s.totalHonor, rataKanan: true },
      { header: "Status", nilai: s => (s.status === "batal" ? "Batal" : "Berlaku") },
      { header: "Catatan", nilai: s => s.catatan || "" },
    ];
    void exportToExcel({
      judul: "Riwayat Penyuratan Mitra",
      subJudul: `Tahun ${tahun} · ${jumlahAktif} surat berlaku, ${jumlahBatal} batal`,
      kolom,
      baris: surat,
      namaFile: `riwayat-penyuratan-${tahun}`,
    });
  };

  const simpanNomor = (item: RiwayatSuratItem) => {
    const nomor = Number(draftNomor[item.id]);
    if (!Number.isInteger(nomor) || nomor < 1) {
      setAlertModal({ isOpen: true, title: "Nomor Tidak Valid", message: "Nomor surat harus bilangan bulat mulai dari 1." });
      return;
    }
    ubahNomor.mutate({ id: item.id, nomor });
  };

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Riwayat Penyuratan</h1>
          <p className="text-muted-foreground">
            Seluruh Surat PK dan BAST yang pernah terbit, termasuk yang dibatalkan, beserta alasannya.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div className="space-y-2 sm:w-40">
                <Label htmlFor="tahunRiwayat">Tahun Surat</Label>
                <Input
                  id="tahunRiwayat"
                  type="number"
                  value={tahun}
                  min={2000}
                  max={2999}
                  onChange={e => setTahun(Number(e.target.value) || new Date().getFullYear())}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={ekspor} disabled={surat.length === 0}>
                  <Sheet className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => pratinjauRapikan.mutate()}
                  disabled={pratinjauRapikan.isPending || surat.length === 0}
                >
                  {pratinjauRapikan.isPending
                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    : <Wand2 className="w-4 h-4 mr-2" />}
                  Rapikan Nomor
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">{jumlahAktif} surat berlaku</Badge>
              {jumlahBatal > 0 && (
                <Badge variant="outline" className="border-red-300 text-red-700 dark:border-red-800 dark:text-red-300">
                  {jumlahBatal} surat batal
                </Badge>
              )}
              {(data?.celah?.length ?? 0) > 0 && (
                <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300">
                  Nomor kosong: {data?.celah.join(", ")}
                </Badge>
              )}
            </div>

            {(data?.celah?.length ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground">
                Nomor kosong adalah nomor yang suratnya sudah dihapus permanen. Jejak penghapusannya
                tetap tersimpan di log penyuratan, dan &quot;Rapikan Nomor&quot; bisa merapatkannya.
              </p>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Nomor</TableHead>
                    {/* Sengaja sempit: nomor surat panjang dan berpola, jadi
                        ujungnya dipotong dan ditampilkan utuh saat disentuh
                        kursor. Yang membedakan antar baris ada di awal teks. */}
                    <TableHead className="w-[9rem]">No. SPK</TableHead>
                    <TableHead className="w-[9rem]">No. BAST</TableHead>
                    <TableHead>Mitra</TableHead>
                    <TableHead className="w-36">Periode</TableHead>
                    <TableHead className="w-24 text-center">Kegiatan</TableHead>
                    <TableHead className="text-right">Total Honor</TableHead>
                    <TableHead className="w-40">Status</TableHead>
                    <TableHead className="w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                        Memuat riwayat surat...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && surat.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Belum ada surat yang terbit pada tahun {tahun}.
                      </TableCell>
                    </TableRow>
                  )}
                  {surat.map(item => {
                    const batal = item.status === "batal";
                    // Namanya sengaja spesifik: di baris yang sama sudah ada
                    // `berubah` untuk NOMOR surat yang sedang disunting, dan
                    // keduanya hidup di lingkup yang persis sama.
                    const isiBerubah = (item.perubahan?.length ?? 0) > 0;
                    const draft = draftNomor[item.id];
                    const berubah = draft !== undefined && Number(draft) !== item.nomorUrut;
                    return (
                      <TableRow key={item.id} className={batal ? "bg-red-50/60 dark:bg-red-950/20" : undefined}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Input
                              className="h-8 w-16"
                              value={draft ?? String(item.nomorUrut)}
                              onChange={e => setDraftNomor(d => ({ ...d, [item.id]: e.target.value }))}
                            />
                            {berubah && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-green-700"
                                    onClick={() => simpanNomor(item)}
                                    disabled={ubahNomor.isPending}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Simpan nomor baru</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={batal ? "line-through text-muted-foreground" : "font-medium"}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block max-w-[8rem] truncate">{item.nomorSurat}</span>
                            </TooltipTrigger>
                            <TooltipContent>{item.nomorSurat}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className={batal ? "line-through text-muted-foreground" : undefined}>
                          {item.nomorBast ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block max-w-[8rem] truncate">{item.nomorBast}</span>
                              </TooltipTrigger>
                              <TooltipContent>{item.nomorBast}</TooltipContent>
                            </Tooltip>
                          ) : <span className="text-muted-foreground">&mdash;</span>}
                        </TableCell>
                        <TableCell>{item.namaPPL}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {/* Tanpa tahun: tahunnya sudah ditentukan filter di atas
                              tabel, jadi mengulangnya hanya memakan lebar kolom. */}
                          {labelRentangSingkat(item.periodeMulai, item.periodeSelesai)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-blue-600 dark:text-blue-300"
                            disabled={item.baris.length === 0}
                            onClick={() => setDialogRincian(item)}
                          >
                            {item.baris.length}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {formatRupiah(item.totalHonor)}
                        </TableCell>
                        <TableCell>
                          {/* Tiga keadaan, dan yang tengah paling penting: surat
                              masih berlaku TETAPI isinya sudah tidak sesuai data
                              sekarang, jadi perlu dipastikan sebelum dibayarkan.
                              Catatan pembatalan tidak lagi dicetak di sini —
                              kolomnya sempit dan teksnya panjang; kini ia ada di
                              balik ikon peringatan pada kolom Aksi. */}
                          {batal ? (
                            <Badge variant="outline" className="border-red-300 text-red-700 dark:border-red-800 dark:text-red-300">
                              Batal
                            </Badge>
                          ) : isiBerubah ? (
                            <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                              Butuh Konfirmasi
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-800 dark:text-green-300">
                              Berlaku
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {/* Peringatan isi berubah: sama seperti di Generate
                                Surat, tapi di sini hanya menampilkan apa yang
                                berbeda. Memperbarui kontraknya tetap dilakukan
                                dari Generate Surat, tempat datanya dihitung. */}
                            {isiBerubah && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon" variant="ghost"
                                    className="h-8 w-8 text-amber-700 dark:text-amber-300"
                                    onClick={() => setDialogPerubahan(item)}
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Isi surat berubah sejak terbit</TooltipContent>
                              </Tooltip>
                            )}
                            {/* Catatan pembatalan: dipindah ke sini dari kolom
                                Status, karena teksnya panjang dan kolomnya sempit. */}
                            {batal && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon" variant="ghost" className="h-8 w-8 text-red-600"
                                    onClick={() => { setTeksCatatan(item.catatan ?? ""); setDialogCatatan(item); }}
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Lihat alasan pembatalan</TooltipContent>
                              </Tooltip>
                            )}
                            {!batal && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon" variant="ghost" className="h-8 w-8 text-red-600"
                                    onClick={() => { setTeksCatatan(""); setDialogBatal(item); }}
                                  >
                                    <Ban className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Batalkan surat</TooltipContent>
                              </Tooltip>
                            )}
                            {!batal && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon" variant="ghost" className="h-8 w-8"
                                    onClick={() => { setTeksCatatan(item.catatan ?? ""); setDialogCatatan(item); }}
                                  >
                                    {/* Ikonnya yang membedakan, bukan hanya tooltipnya:
                                        ada-tidaknya catatan harus terbaca sekilas tanpa
                                        perlu menyentuh setiap baris satu per satu. */}
                                    {item.catatan
                                      ? <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                      : <Pencil className="w-4 h-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{item.catatan ? "Ubah catatan" : "Tambah catatan"}</TooltipContent>
                              </Tooltip>
                            )}
                            {batal && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon" variant="ghost" className="h-8 w-8 text-red-600"
                                    onClick={() => setDialogHapus(item)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Hapus permanen</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pembatalan wajib berkatatan: riwayat yang tidak bisa dibaca orang lain
          sama saja dengan surat yang hilang. */}
      <Dialog open={dialogBatal !== null} onOpenChange={buka => { if (!buka) setDialogBatal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Surat {dialogBatal?.nomorSurat}?</DialogTitle>
            <DialogDescription>
              Nomornya tetap tercatat di riwayat ini, tidak dipakai ulang otomatis. Setelah dibatalkan,
              {" "}{dialogBatal?.namaPPL} dianggap belum punya surat untuk periode tersebut sehingga
              surat pengganti bisa digenerate dengan nomor baru.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="catatanBatal">Alasan pembatalan *</Label>
            <Textarea
              id="catatanBatal"
              value={teksCatatan}
              onChange={e => setTeksCatatan(e.target.value)}
              placeholder="Contoh: muatan berubah setelah revisi target, diganti surat nomor 012."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogBatal(null)}>Batal</Button>
            <Button
              variant="destructive"
              disabled={teksCatatan.trim().length === 0 || batalkan.isPending}
              onClick={() => dialogBatal && batalkan.mutate({ id: dialogBatal.id, catatan: teksCatatan.trim() })}
            >
              {batalkan.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Batalkan Surat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogCatatan !== null} onOpenChange={buka => { if (!buka) setDialogCatatan(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catatan untuk {dialogCatatan?.nomorSurat}</DialogTitle>
            <DialogDescription>
              Catatan tampil di riwayat ini, supaya orang lain paham kenapa surat ini begini.
            </DialogDescription>
          </DialogHeader>
          <Textarea value={teksCatatan} onChange={e => setTeksCatatan(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCatatan(null)}>Batal</Button>
            <Button
              disabled={simpanCatatan.isPending}
              onClick={() => dialogCatatan && simpanCatatan.mutate({ id: dialogCatatan.id, catatan: teksCatatan.trim() })}
            >
              {simpanCatatan.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan Catatan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kegiatan apa saja yang tercakup surat ini, beserta muatan dan honornya.
          Isinya diambil dari salinan surat SAAT TERBIT bila ada, supaya yang
          terbaca adalah apa yang benar-benar tertulis di surat — bukan keadaan
          data hari ini, yang justru menjadi bahan perbandingan di dialog lain. */}
      <Dialog open={dialogRincian !== null} onOpenChange={buka => { if (!buka) setDialogRincian(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Isi surat {dialogRincian?.nomorSurat}</DialogTitle>
            <DialogDescription>
              {dialogRincian?.namaPPL} &middot; {labelRentang(dialogRincian?.periodeMulai, dialogRincian?.periodeSelesai)}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kegiatan</TableHead>
                  <TableHead className="w-28 text-right">Muatan</TableHead>
                  <TableHead className="w-32 text-right">Harga Satuan</TableHead>
                  <TableHead className="w-36 text-right">Honor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(dialogRincian?.baris ?? []).map((b, i) => (
                  <TableRow key={b.kunci || i}>
                    <TableCell className="font-medium">{b.uraianTugas}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{b.volume} {b.satuan}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatRupiah(b.hargaSatuan)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatRupiah(b.nilaiPerjanjian)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">Total</TableCell>
                  <TableCell className="text-right font-semibold whitespace-nowrap">
                    {formatRupiah((dialogRincian?.baris ?? []).reduce((j, b) => j + b.nilaiPerjanjian, 0))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {dialogRincian && dialogRincian.baris.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Surat ini tidak punya rincian yang bisa ditampilkan. Kemungkinan mitra sudah tidak
              punya honor pada periode tersebut.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogPerubahan !== null} onOpenChange={buka => { if (!buka) setDialogPerubahan(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Perubahan pada surat {dialogPerubahan?.nomorSurat}</DialogTitle>
            <DialogDescription>
              Berikut yang berbeda antara isi surat saat terbit dan data {dialogPerubahan?.namaPPL} sekarang.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto space-y-3">
            {(dialogPerubahan?.perubahan ?? []).map((p, i) => (
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
            Menyelaraskan isinya dilakukan dari halaman Generate Surat lewat tombol
            &quot;Perbarui Kontrak&quot;, yang tidak mengubah nomor surat.
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogHapus !== null} onOpenChange={buka => { if (!buka) setDialogHapus(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Permanen {dialogHapus?.nomorSurat}?</DialogTitle>
            <DialogDescription>
              Barisnya hilang dari riwayat dan nomor {dialogHapus?.nomorUrut} menjadi kosong.
              Penghapusan ini sendiri tetap tercatat di log penyuratan, jadi pertanyaan
              &quot;nomor ini ke mana&quot; masih bisa ditelusuri. Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogHapus(null)}>Batal</Button>
            <Button
              variant="destructive"
              disabled={hapus.isPending}
              onClick={() => dialogHapus && hapus.mutate(dialogHapus.id)}
            >
              {hapus.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Perapian nomor menggeser banyak surat sekaligus, jadi pergeserannya
          diperlihatkan lebih dulu dan disetujui dengan mengetik frasa. */}
      <Dialog open={dialogRapikan !== null} onOpenChange={buka => { if (!buka) setDialogRapikan(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rapikan Nomor Tahun {tahun}</DialogTitle>
            <DialogDescription>
              {dialogRapikan?.perubahan.length} surat akan berpindah nomor agar tidak ada nomor yang
              kosong. Surat yang sudah terlanjur dicetak TIDAK ikut berubah, jadi pastikan berkas
              cetaknya diperbarui setelah ini.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-56 overflow-y-auto rounded-md border p-3 text-sm space-y-1">
            {dialogRapikan?.perubahan.map(p => (
              <div key={p.id} className="flex justify-between">
                <span className="text-muted-foreground">Nomor {p.lama}</span>
                <span className="font-medium">menjadi {p.baru}</span>
              </div>
            ))}
          </div>

          {(dialogRapikan?.bentrokDenganBatal.length ?? 0) > 0 && (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Nomor {dialogRapikan?.bentrokDenganBatal.join(", ")} juga dipegang surat yang sudah
              batal, jadi nomor itu akan tampil dua kali di riwayat. Hapus surat batalnya bila
              ingin riwayat tetap bersih.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="konfirmasiRapikan">
              Ketik {FRASA_KONFIRMASI_ATUR_ULANG} untuk melanjutkan
            </Label>
            <Input
              id="konfirmasiRapikan"
              value={teksKonfirmasi}
              onChange={e => setTeksKonfirmasi(e.target.value)}
              placeholder={FRASA_KONFIRMASI_ATUR_ULANG}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogRapikan(null)}>Batal</Button>
            <Button
              disabled={!konfirmasiAturUlangSah(teksKonfirmasi) || terapkanRapikan.isPending}
              onClick={() => terapkanRapikan.mutate()}
            >
              {terapkanRapikan.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Rapikan Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, title: "", message: "" })}
        title={alertModal.title}
        description={alertModal.message}
      />
    </Layout>
  );
}
