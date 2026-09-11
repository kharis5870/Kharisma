// client/components/PencarianGlobal.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import type { Kegiatan } from "@shared/api";
import { HALAMAN_APLIKASI } from "@/lib/halaman";

/**
 * Pencarian global (Ctrl+K).
 *
 * Menggantikan kotak cari di header yang sebelumnya BENAR-BENAR mati — tanpa
 * value, tanpa onChange, tanpa handler apa pun. Pengguna mengetik lalu tidak
 * terjadi apa-apa.
 *
 * Tidak ada permintaan jaringan baru:
 * - mitra, ketua tim, dan pengguna sudah dimuat `AdminProvider` di semua rute;
 * - daftar kegiatan memakai kunci query `['kegiatan']` yang SAMA dengan
 *   Dashboard, jadi cache-nya dipakai bersama, bukan diambil dua kali.
 */
export default function PencarianGlobal() {
  const [buka, setBuka] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userList, ketuaTimList, pplAdminList } = useAdmin();

  const { data: kegiatanList = [] } = useQuery({
    queryKey: ['kegiatan'],
    queryFn: () => apiClient.get<Kegiatan[]>("/kegiatan"),
    enabled: buka, // baru diambil saat palet pertama kali dibuka
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setBuka(b => !b);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const pergi = (tujuan: string) => {
    setBuka(false);
    navigate(tujuan);
  };

  // Halaman disaring sesuai peran, mengikuti aturan yang sama dengan sidebar —
  // hasil pencarian tidak boleh menawarkan halaman yang tidak boleh dibuka.
  const halamanBoleh = useMemo(
    () => HALAMAN_APLIKASI.filter(h => !h.peran || h.peran.includes(user?.role ?? 'user')),
    [user?.role],
  );

  return (
    <>
      {/* Pemicu terlihat, supaya fiturnya bisa ditemukan tanpa tahu pintasannya. */}
      <Button
        variant="outline"
        onClick={() => setBuka(true)}
        className="relative hidden md:flex h-9 w-64 items-center justify-start px-3 text-sm font-normal text-muted-foreground"
      >
        <Search className="mr-2 h-4 w-4 shrink-0" />
        Cari...
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium lg:flex">
          Ctrl K
        </kbd>
      </Button>

      <CommandDialog open={buka} onOpenChange={setBuka}>
        <CommandInput placeholder="Cari kegiatan, mitra, ketua tim, pengguna, atau halaman..." />
        <CommandList>
          <CommandEmpty>Tidak ada hasil.</CommandEmpty>

          {kegiatanList.length > 0 && (
            <CommandGroup heading="Kegiatan">
              {kegiatanList.slice(0, 40).map(k => (
                <CommandItem
                  key={`keg-${k.id}`}
                  // `value` menentukan apa yang dicocokkan cmdk; sertakan ketua
                  // dan tim supaya bisa dicari lewat itu juga.
                  value={`${k.namaKegiatan} ${k.namaKetua ?? ''} ${k.timKetua ?? ''}`}
                  onSelect={() => pergi(`/view-documents/${k.id}`)}
                >
                  <span className="truncate">{k.namaKegiatan}</span>
                  {k.namaKetua && (
                    <span className="ml-2 text-xs text-muted-foreground truncate">· {k.namaKetua}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {pplAdminList.length > 0 && (
            <CommandGroup heading="Mitra (PPL)">
              {pplAdminList.slice(0, 40).map(p => (
                <CommandItem
                  key={`ppl-${p.id}`}
                  value={`${p.namaPPL} ${p.id} ${p.alamat ?? ''}`}
                  onSelect={() => pergi("/daftar-ppl")}
                >
                  <span className="truncate">{p.namaPPL}</span>
                  <span className="ml-2 text-xs text-muted-foreground">· {p.id}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {ketuaTimList.length > 0 && (
            <CommandGroup heading="Ketua Tim">
              {ketuaTimList.map(kt => (
                <CommandItem
                  key={`kt-${kt.id}`}
                  value={`${kt.nama} ${kt.nip ?? ''} ${kt.tim ?? ''}`}
                  onSelect={() => pergi("/manajemen-admin")}
                >
                  <span className="truncate">{kt.nama}</span>
                  {kt.tim && <span className="ml-2 text-xs text-muted-foreground">· {kt.tim}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Daftar pengguna hanya berguna bagi admin, dan halaman tujuannya
              memang khusus admin. */}
          {user?.role === 'admin' && userList.length > 0 && (
            <CommandGroup heading="Pengguna">
              {userList.map(u => (
                <CommandItem
                  key={`usr-${u.id}`}
                  value={`${u.namaLengkap} ${u.username} ${u.role}`}
                  onSelect={() => pergi("/manajemen-admin")}
                >
                  <span className="truncate">{u.namaLengkap}</span>
                  <span className="ml-2 text-xs text-muted-foreground">· {u.username}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />
          <CommandGroup heading="Halaman">
            {halamanBoleh.map(h => (
              <CommandItem key={h.path} value={h.judul} onSelect={() => pergi(h.path)}>
                {h.judul}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
