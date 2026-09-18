import { useEffect, useMemo, useRef, useState } from "react";
import { useHalamanAman } from "@/hooks/useHalamanAman";

/**
 * State pagination sebuah tabel: halaman, jumlah baris per halaman, dan potongan
 * data untuk halaman yang sedang tampil.
 *
 * Dipakai tabel Generate SPK, Generate BAST, dan Riwayat Penyuratan. Halaman
 * lain (Daftar PPL, Manajemen Honor, Penilaian) menulis logika yang sama
 * masing-masing; tiga tabel baru ini memakai satu sumber supaya perilakunya
 * tidak menyimpang satu sama lain.
 *
 * @param data          seluruh baris yang sudah disaring dan diurutkan
 * @param barisAwal     jumlah baris per halaman saat pertama tampil
 * @param kunciReset    bila berubah (mis. kata kunci pencarian), kembali ke
 *                      halaman 1 — hasil pencarian baru selalu dilihat dari awal
 */
export function usePaginasiTabel<T>(data: T[], barisAwal = 10, kunciReset?: unknown) {
  const [halaman, setHalaman] = useState(1);
  const [barisPerHalaman, setBarisPerHalamanMentah] = useState(barisAwal);

  const totalHalaman = Math.ceil(data.length / barisPerHalaman);
  // Halaman tidak boleh melewati jumlah halaman yang ada, mis. setelah data
  // menyusut karena pencarian atau penghapusan.
  useHalamanAman(halaman, totalHalaman, setHalaman);

  const kunciSebelumnya = useRef(kunciReset);
  useEffect(() => {
    if (kunciSebelumnya.current !== kunciReset) {
      kunciSebelumnya.current = kunciReset;
      setHalaman(1);
    }
  }, [kunciReset]);

  const dataHalaman = useMemo(
    () => data.slice((halaman - 1) * barisPerHalaman, halaman * barisPerHalaman),
    [data, halaman, barisPerHalaman],
  );

  /** Mengganti jumlah baris per halaman selalu kembali ke halaman 1. */
  const setBarisPerHalaman = (jumlah: number) => {
    setBarisPerHalamanMentah(jumlah);
    setHalaman(1);
  };

  return { halaman, setHalaman, barisPerHalaman, setBarisPerHalaman, totalHalaman, dataHalaman, jumlahData: data.length };
}

export type PaginasiTabel<T> = ReturnType<typeof usePaginasiTabel<T>>;
