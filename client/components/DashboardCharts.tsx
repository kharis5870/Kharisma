// client/components/DashboardCharts.tsx

import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Kegiatan, PPL, ProgressType } from "@shared/api";

/**
 * Panel visualisasi Dashboard.
 *
 * Seluruh datanya dihitung dari daftar kegiatan yang SUDAH dimuat halaman —
 * tidak ada permintaan jaringan tambahan. recharts dan komponen chart shadcn
 * memang sudah terpasang di proyek ini tapi belum pernah dipakai.
 */

type KegiatanDenganStatus = Kegiatan & {
  dynamicStatus: { status: Kegiatan['status']; color: string; warnings: string[] };
};

// Warna diambil dari palet Tailwind agar tetap terbaca di mode terang & gelap.
const WARNA_STATUS: Record<string, string> = {
  'Persiapan': '#3b82f6',
  'Pengumpulan Data': '#eab308',
  'Pengolahan & Analisis': '#22c55e',
  'Diseminasi & Evaluasi': '#6366f1',
  'Selesai': '#a855f7',
};

const WARNA_TAHAP = ['#94a3b8', '#3b82f6', '#eab308', '#22c55e'];

const LABEL_TAHAP: Record<string, string> = {
  open: 'Open', submit: 'Submit', diperiksa: 'Diperiksa', approved: 'Approved',
  belum_entry: 'Belum Entry', sudah_entry: 'Dientry', validasi: 'Validasi', clean: 'Clean',
};

/** Rupiah ringkas untuk sumbu grafik: 2500000 -> "2,5 jt". */
const rupiahSingkat = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} rb`;
  return String(n);
};

/** Tooltip memakai token tema supaya ikut gelap. */
const gayaTooltip = {
  contentStyle: {
    background: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.5rem',
    color: 'hsl(var(--popover-foreground))',
    fontSize: '0.8rem',
  },
  labelStyle: { color: 'hsl(var(--popover-foreground))' },
} as const;

export default function DashboardCharts({ activities }: { activities: KegiatanDenganStatus[] }) {
  const dataStatus = useMemo(() => {
    const hitung = activities.reduce((acc, a) => {
      const s = a.dynamicStatus.status;
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(hitung)
      .filter(([, n]) => n > 0)
      .map(([nama, jumlah]) => ({ nama, jumlah }));
  }, [activities]);

  const dataTim = useMemo(() => {
    const hitung = activities.reduce((acc, a) => {
      const tim = a.timKetua || 'Tanpa Tim';
      acc[tim] = (acc[tim] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(hitung)
      .map(([tim, jumlah]) => ({ tim, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah);
  }, [activities]);

  // Corong progress mitra: menjumlahkan kedelapan bucket lintas kegiatan,
  // dipisah antara alur pendataan dan alur pengolahan karena tahapnya beda.
  const dataCorong = useMemo(() => {
    const total: Record<string, number> = {};
    activities.forEach(a => {
      (a.ppl || []).forEach((p: PPL) => {
        const tahapPendataan = p.tahap === 'listing' || p.tahap === 'pencacahan';
        const kunci: ProgressType[] = tahapPendataan
          ? ['open', 'submit', 'diperiksa', 'approved']
          : ['belum_entry', 'sudah_entry', 'validasi', 'clean'];
        kunci.forEach(k => { total[k] = (total[k] || 0) + (p.progress?.[k] ?? 0); });
      });
    });

    const pendataan = ['open', 'submit', 'diperiksa', 'approved']
      .map(k => ({ tahap: LABEL_TAHAP[k], jumlah: total[k] || 0 }));
    const pengolahan = ['belum_entry', 'sudah_entry', 'validasi', 'clean']
      .map(k => ({ tahap: LABEL_TAHAP[k], jumlah: total[k] || 0 }));

    const adaPengolahan = pengolahan.some(d => d.jumlah > 0);
    return { pendataan, pengolahan, adaPengolahan };
  }, [activities]);

  /** 10 kegiatan dengan progres terendah — yang paling perlu diperhatikan. */
  const dataPeringkat = useMemo(() => {
    return activities
      .map(a => ({
        nama: a.namaKegiatan.length > 22 ? a.namaKegiatan.slice(0, 21) + '…' : a.namaKegiatan,
        persen: Math.round(Number(a.progressKeseluruhan ?? 0)),
      }))
      .sort((a, b) => a.persen - b.persen)
      .slice(0, 10);
  }, [activities]);

  /**
   * Selisih Submit vs Approved per tahap.
   *
   * Bedanya = pekerjaan yang sudah dikirim mitra tapi belum diperiksa. Inilah
   * antrean pemeriksaan yang tidak terlihat di grafik mana pun sebelumnya.
   */
  const dataSelisih = useMemo(() => {
    const rerata = (ambil: (a: KegiatanDenganStatus) => number) =>
      activities.length === 0 ? 0
        : Math.round(activities.reduce((s, a) => s + Number(ambil(a) ?? 0), 0) / activities.length);

    return [
      { tahap: 'Listing', submit: rerata(a => a.progressListingSubmit), approved: rerata(a => a.progressListingApproved) },
      { tahap: 'Pencacahan', submit: rerata(a => a.progressPencacahanSubmit), approved: rerata(a => a.progressPencacahanApproved) },
      { tahap: 'Pengolahan', submit: rerata(a => a.progressPengolahanSubmit), approved: rerata(a => a.progressPengolahanApproved) },
    ];
  }, [activities]);

  /** Total honor per tim ketua. */
  const dataHonorTim = useMemo(() => {
    const total: Record<string, number> = {};
    activities.forEach(a => {
      const tim = a.timKetua || 'Tanpa Tim';
      (a.ppl || []).forEach((p: PPL) => {
        total[tim] = (total[tim] || 0) + (parseInt(String(p.besaranHonor), 10) || 0);
      });
    });
    return Object.entries(total)
      .map(([tim, honor]) => ({ tim, honor }))
      .sort((a, b) => b.honor - a.honor);
  }, [activities]);

  /** Beban tiap PML: jumlah mitra yang diawasi dan total honornya. */
  const dataBebanPML = useMemo(() => {
    const per: Record<string, { mitra: number; honor: number }> = {};
    activities.forEach(a => {
      (a.ppl || []).forEach((p: PPL) => {
        const nama = p.namaPML || 'Tanpa PML';
        if (!per[nama]) per[nama] = { mitra: 0, honor: 0 };
        per[nama].mitra += 1;
        per[nama].honor += parseInt(String(p.besaranHonor), 10) || 0;
      });
    });
    return Object.entries(per)
      .map(([pml, v]) => ({ pml: pml.length > 18 ? pml.slice(0, 17) + '…' : pml, ...v }))
      .sort((a, b) => b.mitra - a.mitra)
      .slice(0, 10);
  }, [activities]);

  const dataDokumen = useMemo(() => {
    const hitung: Record<string, number> = {};
    activities.forEach(a => {
      (a.dokumen || []).forEach(d => {
        const s = d.status || 'Pending';
        hitung[s] = (hitung[s] || 0) + 1;
      });
    });
    const urutan = ['Pending', 'Reviewed', 'Approved', 'Rejected'];
    const warna: Record<string, string> = {
      Pending: '#eab308', Reviewed: '#3b82f6', Approved: '#22c55e', Rejected: '#ef4444',
    };
    return urutan
      .filter(s => hitung[s])
      .map(s => ({ status: s, jumlah: hitung[s], warna: warna[s] }));
  }, [activities]);

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Belum ada kegiatan untuk divisualisasikan.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Kegiatan per status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kegiatan per Status</CardTitle>
          <CardDescription>Sebaran {activities.length} kegiatan aktif.</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={dataStatus} dataKey="jumlah" nameKey="nama" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {dataStatus.map(d => (
                  <Cell key={d.nama} fill={WARNA_STATUS[d.nama] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip {...gayaTooltip} />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Kegiatan per tim */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kegiatan per Tim</CardTitle>
          <CardDescription>Beban kegiatan tiap tim ketua.</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataTim} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="category" dataKey="tim" width={110} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip {...gayaTooltip} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Bar dataKey="jumlah" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Corong progress pendataan */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Corong Progress Pendataan</CardTitle>
          <CardDescription>Total dokumen di tiap tahap, seluruh kegiatan aktif.</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataCorong.pendataan} margin={{ left: -12, right: 8 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="tahap" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip {...gayaTooltip} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Bar dataKey="jumlah" radius={[4, 4, 0, 0]}>
                {dataCorong.pendataan.map((_, i) => <Cell key={i} fill={WARNA_TAHAP[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Corong pengolahan bila ada datanya, kalau tidak tampilkan dokumen */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {dataCorong.adaPengolahan ? 'Corong Progress Pengolahan' : 'Dokumen per Status'}
          </CardTitle>
          <CardDescription>
            {dataCorong.adaPengolahan
              ? 'Total dokumen di tiap tahap pengolahan.'
              : 'Status seluruh dokumen kegiatan aktif.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {dataCorong.adaPengolahan ? (
              <BarChart data={dataCorong.pengolahan} margin={{ left: -12, right: 8 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="tahap" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip {...gayaTooltip} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="jumlah" radius={[4, 4, 0, 0]}>
                  {dataCorong.pengolahan.map((_, i) => <Cell key={i} fill={WARNA_TAHAP[i]} />)}
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={dataDokumen} margin={{ left: -12, right: 8 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip {...gayaTooltip} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="jumlah" radius={[4, 4, 0, 0]}>
                  {dataDokumen.map(d => <Cell key={d.status} fill={d.warna} />)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Peringkat kegiatan menurut progres */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kegiatan Paling Tertinggal</CardTitle>
          <CardDescription>10 progres terendah — yang paling perlu diperhatikan.</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataPeringkat} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="category" dataKey="nama" width={130} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip {...gayaTooltip} cursor={{ fill: 'hsl(var(--muted))' }} formatter={(v: number) => [`${v}%`, 'Progres']} />
              <Bar dataKey="persen" radius={[0, 4, 4, 0]}>
                {/* Merah di bawah 40%, kuning sampai 75%, hijau di atasnya. */}
                {dataPeringkat.map((d, i) => (
                  <Cell key={i} fill={d.persen < 40 ? '#ef4444' : d.persen < 75 ? '#eab308' : '#22c55e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Selisih Submit vs Approved */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Antrean Pemeriksaan</CardTitle>
          <CardDescription>Selisih Submit dan Approved = pekerjaan yang menunggu diperiksa.</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataSelisih} margin={{ left: -12, right: 8 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="tahap" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip {...gayaTooltip} cursor={{ fill: 'hsl(var(--muted))' }} formatter={(v: number) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Bar dataKey="submit" name="Submit" fill="#eab308" radius={[4, 4, 0, 0]} />
              <Bar dataKey="approved" name="Approved" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Honor per tim */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Honor per Tim</CardTitle>
          <CardDescription>Sebaran beban anggaran honor mitra tiap tim.</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataHonorTim} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tickFormatter={rupiahSingkat} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="category" dataKey="tim" width={110} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip {...gayaTooltip} cursor={{ fill: 'hsl(var(--muted))' }}
                formatter={(v: number) => [v.toLocaleString('id-ID'), 'Honor (Rp)']} />
              <Bar dataKey="honor" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Beban mitra per PML */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Beban Mitra per PML</CardTitle>
          <CardDescription>Jumlah alokasi mitra yang diawasi tiap PML.</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataBebanPML} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="category" dataKey="pml" width={120} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip {...gayaTooltip} cursor={{ fill: 'hsl(var(--muted))' }}
                formatter={(v: number, nama: string) =>
                  nama === 'honor' ? [v.toLocaleString('id-ID'), 'Honor (Rp)'] : [v, 'Alokasi mitra']} />
              <Bar dataKey="mitra" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
