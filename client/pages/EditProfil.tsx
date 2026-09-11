// client/pages/EditProfil.tsx

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Info, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

const gantiPassword = async (payload: { username: string; passwordLama: string; passwordBaru: string }) =>
  apiClient.put('/auth/password', payload);

export default function EditProfil() {
  const { user } = useAuth();

  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [lihatPassword, setLihatPassword] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [sukses, setSukses] = useState(false);

  const mutation = useMutation({
    mutationFn: gantiPassword,
    onSuccess: () => {
      setSukses(true);
      setPasswordLama("");
      setPasswordBaru("");
      setKonfirmasi("");
      setGalat(null);
    },
    onError: (e: any) => setGalat(e?.message ?? 'Gagal mengubah password.'),
  });

  // Validasi dilakukan di sini supaya pesannya muncul di dekat formnya,
  // bukan sebagai modal yang menutupi isian.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGalat(null);

    if (!passwordLama || !passwordBaru || !konfirmasi) {
      return setGalat('Semua kolom wajib diisi.');
    }
    if (passwordBaru.length < 6) {
      return setGalat('Password baru minimal 6 karakter.');
    }
    if (passwordBaru !== konfirmasi) {
      return setGalat('Konfirmasi password tidak cocok dengan password baru.');
    }
    if (passwordBaru === passwordLama) {
      return setGalat('Password baru harus berbeda dari password lama.');
    }

    mutation.mutate({ username: user!.username, passwordLama, passwordBaru });
  };

  const inisial = user?.namaLengkap?.charAt(0)?.toUpperCase()
    ?? user?.username?.charAt(0)?.toUpperCase()
    ?? 'G';

  return (
    <Layout>
      <div className="space-y-8 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pengaturan Profil</h1>
          <p className="text-muted-foreground mt-1">Kelola akun dan keamanan Anda.</p>
        </div>

        {/* Identitas — sengaja read-only */}
        <Card>
          <CardHeader>
            <CardTitle>Identitas Akun</CardTitle>
            <CardDescription>Data ini hanya dapat diubah oleh administrator.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-muted text-muted-foreground text-xl font-semibold">
                  {inisial}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold text-foreground">{user?.namaLengkap ?? '-'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="capitalize">{user?.role ?? '-'}</Badge>
                  {user?.isPML && <Badge variant="outline">PML</Badge>}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={user?.username ?? ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input value={user?.namaLengkap ?? ''} readOnly className="bg-muted" />
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Username dan nama lengkap dikunci agar identitas pada riwayat kegiatan,
                dokumen, dan surat kontrak tetap dapat ditelusuri. Hubungi administrator
                bila ada yang perlu diperbaiki.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Ganti password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Ganti Password
            </CardTitle>
            <CardDescription>Minimal 6 karakter dan harus berbeda dari password lama.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passwordLama">Password Lama</Label>
                <Input
                  id="passwordLama"
                  type={lihatPassword ? 'text' : 'password'}
                  value={passwordLama}
                  onChange={(e) => setPasswordLama(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="passwordBaru">Password Baru</Label>
                  <Input
                    id="passwordBaru"
                    type={lihatPassword ? 'text' : 'password'}
                    value={passwordBaru}
                    onChange={(e) => setPasswordBaru(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="konfirmasi">Ulangi Password Baru</Label>
                  <Input
                    id="konfirmasi"
                    type={lihatPassword ? 'text' : 'password'}
                    value={konfirmasi}
                    onChange={(e) => setKonfirmasi(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLihatPassword((v) => !v)}
                className="text-muted-foreground"
              >
                {lihatPassword ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {lihatPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              </Button>

              {galat && (
                <Alert variant="destructive">
                  <AlertDescription>{galat}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                    : <><ShieldCheck className="w-4 h-4 mr-2" /> Simpan Password Baru</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <SuccessModal
        isOpen={sukses}
        onClose={() => setSukses(false)}
        title="Password Berhasil Diubah"
        description="Gunakan password baru Anda saat login berikutnya."
      />
    </Layout>
  );
}
