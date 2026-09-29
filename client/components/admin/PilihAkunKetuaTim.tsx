import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserData } from "@shared/api";

/**
 * Pemilih akun untuk modal Tambah dan Edit Ketua Tim.
 *
 * Akun adalah SATU-SATUNYA yang perlu ditunjuk tentang orangnya: nama dan NIP
 * ketua tim dibaca dari akun itu, tidak lagi diketik ulang setiap kali
 * kepengurusan tahun baru dibuat. Dulu keduanya harus ditulis ulang padahal
 * barisnya sudah menunjuk akun yang sama, dan salah ketik di satu tahun tidak
 * ikut terperbaiki di tahun lainnya.
 *
 * NIP ditampilkan apa adanya di bawah pilihannya, termasuk ketika kosong.
 * Kosong bukan penghalang: kepengurusannya tetap bisa disimpan, dan NIP-nya
 * dilengkapi kapan saja lewat tab Users — begitu diisi, seluruh tahun
 * kepengurusan orang itu langsung ikut terisi.
 */
export default function PilihAkunKetuaTim({
  id, nilai, daftarUser, onUbah,
}: {
  id: string;
  nilai: string | null | undefined;
  daftarUser: UserData[];
  onUbah: (userId: string) => void;
}) {
  const terpilih = daftarUser.find(u => u.id === nilai);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Akun Pengguna *</Label>
      <Select value={nilai || undefined} onValueChange={onUbah}>
        <SelectTrigger id={id}><SelectValue placeholder="Pilih akun" /></SelectTrigger>
        <SelectContent>
          {daftarUser.map(u => (
            <SelectItem key={u.id} value={u.id}>{u.namaLengkap} ({u.username})</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {terpilih ? (
        <p className="text-xs text-muted-foreground">
          Nama dan NIP mengikuti akun ini. NIP:{' '}
          {terpilih.nip
            ? <span className="font-medium text-foreground">{terpilih.nip}</span>
            : <span>belum diisi &mdash; boleh dilengkapi nanti di tab Users.</span>}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Menentukan nama, NIP, dan siapa yang menerima notifikasi kegiatan tim ini.
        </p>
      )}
    </div>
  );
}
