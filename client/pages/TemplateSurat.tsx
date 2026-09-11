// client/pages/TemplateSurat.tsx

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, ShieldAlert, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TemplateSurat as TemplateSuratType } from "@shared/api";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import { KETERANGAN_PENANDA, contohNomorSurat, penandaTidakDikenal, polaTanpaNomor } from "@/lib/polaNomorSurat";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SuccessModal from "@/components/SuccessModal";
import AlertModal from "@/components/AlertModal";

const fetchTemplate = (): Promise<TemplateSuratType> => apiClient.get<TemplateSuratType>("/kontrak/template");

const KOSONG: TemplateSuratType = {
  id: 0,
  nama_template: "",
  format_nomor: "{nomor}/SPK/{BULAN}/{ROMAWI}/{tahun}",
  format_nomor_bast: "{nomor}/BAST/{BULAN}/{ROMAWI}/{tahun}",
  ppk_nama: "",
  ppk_nip: "",
  ppk_jabatan: "Pejabat Pembuat Komitmen",
  satker_nama: "",
  satker_alamat: "",
  kota: "",
  pengadilan_negeri: "",
};

/**
 * Peringatan pola nomor. Dipakai dua kali — Surat PK dan BAST — sehingga
 * aturannya tidak tersalin dan tidak bisa menyimpang antara keduanya.
 */
const PeringatanPola = ({ label, tanpaNomor, penandaSalah }: {
  label: string; tanpaNomor: boolean; penandaSalah: string[];
}) => {
  // Pola tanpa {nomor} jauh lebih berbahaya daripada penanda salah tulis:
  // hasilnya bukan surat yang aneh, melainkan puluhan surat bernomor sama.
  if (tanpaNomor) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Pola nomor {label} tidak memuat <code className="font-mono mx-1">{"{nomor}"}</code>.
          Semua mitra akan menerima surat dengan nomor yang sama persis.
        </AlertDescription>
      </Alert>
    );
  }
  if (penandaSalah.length === 0) return null;
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Penanda tidak dikenal pada pola {label}:{" "}
        {penandaSalah.map(p => <code key={p} className="font-mono mx-1">{p}</code>)}.
        Penanda ini akan tercetak apa adanya di surat. Perhatikan huruf besar-kecilnya.
      </AlertDescription>
    </Alert>
  );
};

export default function TemplateSurat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TemplateSuratType>(KOSONG);
  const [successModal, setSuccessModal] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "" });

  // Pengaturan template adalah wewenang tim keuangan, yang di aplikasi ini
  // diwakili role supervisor, ditambah admin.
  const bolehMengubah = user?.role === "admin" || user?.role === "supervisor";

  const { data: template, isLoading } = useQuery({ queryKey: ["templateSurat"], queryFn: fetchTemplate });

  useEffect(() => {
    if (template) setForm(template);
  }, [template]);

  const mutation = useMutation({
    mutationFn: (data: TemplateSuratType) =>
      apiClient.put(`/kontrak/template/${data.id}`, { ...data, username: user?.username }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templateSurat"] });
      setSuccessModal(true);
    },
    onError: (error: any) =>
      setAlertModal({ isOpen: true, title: "Gagal Menyimpan", message: error.message }),
  });

  const ubah = (kunci: keyof TemplateSuratType, nilai: string) =>
    setForm(prev => ({ ...prev, [kunci]: nilai }));

  const penandaSalah = penandaTidakDikenal(form.format_nomor);
  const penandaSalahBast = penandaTidakDikenal(form.format_nomor_bast);
  // Pola tanpa {nomor} menghasilkan teks yang sama untuk setiap mitra, sehingga
  // seluruh surat satu periode terbit dengan nomor identik. Pemeriksaan penanda
  // salah tulis tidak menangkapnya: pola seperti "097/SPK/FEBRUARI/II/2026"
  // memang tidak punya penanda sama sekali, dan pernah benar-benar tersimpan.
  const tanpaNomor = polaTanpaNomor(form.format_nomor);
  const tanpaNomorBast = polaTanpaNomor(form.format_nomor_bast);

  const simpan = () => {
    const polaBermasalah = [
      { label: "Surat PK", salah: penandaSalah, kosong: tanpaNomor },
      { label: "BAST", salah: penandaSalahBast, kosong: tanpaNomorBast },
    ];
    for (const p of polaBermasalah) {
      if (p.kosong) {
        setAlertModal({
          isOpen: true,
          title: `Pola Nomor ${p.label} Tidak Valid`,
          message: `Pola nomor ${p.label} harus memuat {nomor}. Tanpa penanda itu, semua mitra akan menerima surat dengan nomor yang sama persis.`,
        });
        return;
      }
      if (p.salah.length > 0) {
        setAlertModal({
          isOpen: true,
          title: `Pola Nomor ${p.label} Tidak Valid`,
          message: `Penanda ${p.salah.join(", ")} tidak dikenali dan akan tercetak apa adanya di surat. Periksa huruf besar-kecilnya.`,
        });
        return;
      }
    }
    if (!form.ppk_nama.trim() || !form.ppk_nip.trim() || !form.satker_nama.trim()) {
      setAlertModal({
        isOpen: true,
        title: "Data Belum Lengkap",
        message: "Nama PPK, NIP PPK, dan nama satuan kerja wajib diisi.",
      });
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Template Surat (PK & BAST)</h1>
          <p className="text-muted-foreground mt-1">
            Data tetap yang dipakai setiap Surat PK. Bagian yang berubah per mitra —
            nama, alamat, beban kerja, dan honor — diambil otomatis dari data kegiatan.
          </p>
        </div>

        {!bolehMengubah && (
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                Anda hanya dapat melihat template ini. Perubahan hanya bisa dilakukan oleh
                tim keuangan (role supervisor) atau admin.
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Identitas Surat</CardTitle>
                <CardDescription>Nama template dan pola penomoran surat.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama_template">Nama Template</Label>
                  <Input id="nama_template" value={form.nama_template} disabled={!bolehMengubah}
                    onChange={e => ubah("nama_template", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format_nomor">Pola Nomor Surat PK</Label>
                  <Input id="format_nomor" value={form.format_nomor} disabled={!bolehMengubah}
                    onChange={e => ubah("format_nomor", e.target.value)} />
                  <p className="text-sm">
                    Contoh hasil hari ini:{" "}
                    <strong className="text-foreground">{contohNomorSurat(form.format_nomor)}</strong>
                  </p>
                  <PeringatanPola label="Surat PK" tanpaNomor={tanpaNomor} penandaSalah={penandaSalah} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format_nomor_bast">Pola Nomor Surat BAST</Label>
                  <Input id="format_nomor_bast" value={form.format_nomor_bast} disabled={!bolehMengubah}
                    onChange={e => ubah("format_nomor_bast", e.target.value)} />
                  <p className="text-sm">
                    Contoh hasil hari ini:{" "}
                    <strong className="text-foreground">{contohNomorSurat(form.format_nomor_bast)}</strong>
                  </p>
                  <PeringatanPola label="BAST" tanpaNomor={tanpaNomorBast} penandaSalah={penandaSalahBast} />
                </div>

                <div className="space-y-2">
                  {/* Seluruh penanda didaftar dari satu sumber — sebelumnya
                      {bulan} ada di server tapi tidak pernah disebut di sini. */}
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Penanda yang tersedia untuk kedua pola:</p>
                    <ul className="space-y-0.5">
                      {KETERANGAN_PENANDA.map(k => (
                        <li key={k.penanda} className="flex items-baseline gap-2">
                          <Badge variant="outline" className="font-mono">{k.penanda}</Badge>
                          <span>{k.arti}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="pt-1">
                      Nomor urut Surat PK otomatis, melanjutkan nomor tertinggi di tahun yang
                      sama dan mulai lagi dari 1 tiap ganti tahun.
                    </p>
                    <p>
                      Nomor BAST <strong className="text-foreground">mengikuti nomor Surat PK</strong>{" "}
                      mitra yang sama, jadi keduanya selalu berpasangan. Yang diambil dari tanggal
                      BAST hanya penanda bulan dan tahunnya.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pihak Pertama</CardTitle>
                <CardDescription>Pejabat Pembuat Komitmen yang menandatangani surat.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ppk_nama">Nama PPK *</Label>
                    <Input id="ppk_nama" value={form.ppk_nama} disabled={!bolehMengubah}
                      onChange={e => ubah("ppk_nama", e.target.value)} placeholder="Defri Ariyanto, SST.,M.M" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ppk_nip">NIP PPK *</Label>
                    <Input id="ppk_nip" value={form.ppk_nip} disabled={!bolehMengubah}
                      onChange={e => ubah("ppk_nip", e.target.value)} placeholder="198701272009121002" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ppk_jabatan">Jabatan</Label>
                  <Input id="ppk_jabatan" value={form.ppk_jabatan} disabled={!bolehMengubah}
                    onChange={e => ubah("ppk_jabatan", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Satuan Kerja</CardTitle>
                <CardDescription>Dipakai pada kepala surat, Pasal 1, Pasal 2, dan Pasal 12.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="satker_nama">Nama Satuan Kerja *</Label>
                  <Input id="satker_nama" value={form.satker_nama} disabled={!bolehMengubah}
                    onChange={e => ubah("satker_nama", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="satker_alamat">Alamat Kantor</Label>
                  <Textarea id="satker_alamat" value={form.satker_alamat || ""} disabled={!bolehMengubah}
                    onChange={e => ubah("satker_alamat", e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kota">Kota</Label>
                    <Input id="kota" value={form.kota || ""} disabled={!bolehMengubah}
                      onChange={e => ubah("kota", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pengadilan_negeri">Domisili Hukum (Pasal 12)</Label>
                    <Input id="pengadilan_negeri" value={form.pengadilan_negeri || ""} disabled={!bolehMengubah}
                      onChange={e => ubah("pengadilan_negeri", e.target.value)}
                      placeholder="Panitera Pengadilan Negeri Manna, Kabupaten Bengkulu Selatan" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {bolehMengubah && (
              <div className="flex justify-end">
                <Button onClick={simpan} disabled={mutation.isPending}>
                  {mutation.isPending
                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    : <Save className="w-4 h-4 mr-2" />}
                  Simpan Template
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <SuccessModal
        isOpen={successModal}
        onClose={() => setSuccessModal(false)}
        onAction={() => setSuccessModal(false)}
        title="Template Tersimpan"
        description="Template surat berhasil diperbarui dan akan dipakai pada Surat PK berikutnya."
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
