import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Edit, Save, X, DollarSign, TrendingUp, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PPLHonorData } from "@shared/api";
import { cn } from "@/lib/utils";

const months = [ "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des" ];
const currentYear = new Date().getFullYear(); // <-- Mengambil tahun saat ini secara dinamis
const getCurrentMonth = () => new Date().getMonth();

const fetchHonorData = async (bulan: number, tahun: number): Promise<PPLHonorData[]> => {
    const res = await fetch(`/api/honor?bulan=${bulan}&tahun=${tahun}`);
    if (!res.ok) throw new Error("Gagal memuat data honor");
    return res.json();
}

const fetchHonorDetail = async (pplId: string, tahun: number): Promise<number[]> => {
    const res = await fetch(`/api/honor/${pplId}/detail?tahun=${tahun}`);
    if (!res.ok) throw new Error("Gagal memuat detail honor");
    return res.json();
};

const HonorDetailModal = ({ ppl, currentMonth, onClose }: { ppl: PPLHonorData | null; currentMonth: number; onClose: () => void; }) => {
    const { data: honorHistory = [], isLoading } = useQuery({
        queryKey: ['honorDetail', ppl?.id, currentYear],
        queryFn: () => fetchHonorDetail(ppl!.id, currentYear),
        enabled: !!ppl, // Hanya jalankan query jika PPL dipilih
    });

    return (
        <Dialog open={!!ppl} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Detail Honor: {ppl?.nama}</DialogTitle></DialogHeader>
                {isLoading ? <p>Memuat riwayat...</p> : (
                    <div className="space-y-4">
                        <p>Riwayat honor 12 bulan terakhir untuk tahun {currentYear}:</p>
                        <div className="grid grid-cols-6 gap-2 text-center text-sm">
                            {honorHistory.map((honor: number, i: number) => (
                                <div key={i} className={cn("p-2 rounded border", i === currentMonth && "bg-blue-50 border-blue-200")}>
                                    <div className="font-semibold">{months[i]}</div>
                                    <div>{(honor / 1000000).toFixed(1)}M</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default function ManajemenHonor() {
  const [globalSettings, setGlobalSettings] = useState({ batasHonorBulananGlobal: 3000000, selectedMonth: getCurrentMonth() });
  const [isEditingGlobalLimit, setIsEditingGlobalLimit] = useState(false);
  const [tempGlobalLimit, setTempGlobalLimit] = useState(globalSettings.batasHonorBulananGlobal);
  const [selectedPPL, setSelectedPPL] = useState<PPLHonorData | null>(null);

  const { data: pplData = [], isLoading } = useQuery({
      // Menggunakan tahun dinamis di query key dan query function
      queryKey: ['honor', globalSettings.selectedMonth, currentYear],
      queryFn: () => fetchHonorData(globalSettings.selectedMonth, currentYear),
  });

  const stats = useMemo(() => {
    const totalHonor = pplData.reduce((sum, p) => sum + p.honorBulanIni, 0);
    return {
        totalPPL: pplData.length,
        pplOverLimit: pplData.filter(p => p.honorBulanIni > globalSettings.batasHonorBulananGlobal).length,
        totalHonorBulanIni: totalHonor,
        rataRataHonorBulanan: pplData.length > 0 ? Math.round(totalHonor / pplData.length) : 0
    };
  }, [pplData, globalSettings.batasHonorBulananGlobal]);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div><h1 className="text-3xl font-bold text-gray-900">Manajemen Honor PPL</h1><p className="text-gray-600 mt-1">Kelola akumulasi honor bulanan dengan batas global untuk semua PPL</p></div>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2"><Label className="text-sm font-medium">Pilih Bulan:</Label><Select value={String(globalSettings.selectedMonth)} onValueChange={(val) => setGlobalSettings(p => ({...p, selectedMonth: Number(val)}))}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{months.map((month, i) => (<SelectItem key={i} value={String(i)}>{month} {currentYear}</SelectItem>))}</SelectContent></Select></div>
            <div className="flex items-center gap-2"><Label className="text-sm font-medium">Batas Global:</Label>{isEditingGlobalLimit ? (<div className="flex items-center gap-2"><Input type="number" value={tempGlobalLimit} onChange={e => setTempGlobalLimit(Number(e.target.value))} className="w-36 h-8" placeholder="Honor limit"/><Button size="sm" onClick={() => { setGlobalSettings(p => ({...p, batasHonorBulananGlobal: tempGlobalLimit})); setIsEditingGlobalLimit(false); }} className="h-8 w-8 p-0"><Save className="w-3 h-3" /></Button><Button size="sm" variant="outline" onClick={() => setIsEditingGlobalLimit(false)} className="h-8 w-8 p-0"><X className="w-3 h-3" /></Button></div>) : (<div className="flex items-center gap-2"><Badge variant="outline" className="bg-bps-blue-50 text-bps-blue-700 font-semibold">Rp {globalSettings.batasHonorBulananGlobal.toLocaleString('id-ID')}</Badge><Button size="sm" variant="outline" onClick={() => { setTempGlobalLimit(globalSettings.batasHonorBulananGlobal); setIsEditingGlobalLimit(true); }} className="h-6 w-6 p-0"><Edit className="w-3 h-3" /></Button></div>)}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-bps-blue-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total PPL</p><p className="text-2xl font-bold text-gray-900">{stats.totalPPL}</p></div><Users className="w-8 h-8 text-bps-blue-500" /></div></CardContent></Card>
          <Card className="border-l-4 border-l-red-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">PPL Melebihi Batas</p><p className="text-2xl font-bold text-gray-900">{stats.pplOverLimit}</p></div><AlertTriangle className="w-8 h-8 text-red-500" /></div></CardContent></Card>
          <Card className="border-l-4 border-l-bps-green-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total Honor Bulan Ini</p><p className="text-2xl font-bold text-gray-900">{(stats.totalHonorBulanIni / 1000000).toFixed(1)}M</p></div><DollarSign className="w-8 h-8 text-bps-green-500" /></div></CardContent></Card>
          <Card className="border-l-4 border-l-bps-orange-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Rata-rata Honor Bulanan</p><p className="text-2xl font-bold text-gray-900">{(stats.rataRataHonorBulanan / 1000000).toFixed(1)}M</p></div><TrendingUp className="w-8 h-8 text-bps-orange-500" /></div></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Akumulasi Honor PPL - {months[globalSettings.selectedMonth]} {currentYear}</CardTitle></CardHeader>
          <CardContent>
             {isLoading ? <p>Memuat...</p> : <Table><TableHeader><TableRow><TableHead>Nama PPL</TableHead><TableHead>Honor Bulan Terpilih</TableHead><TableHead>Kegiatan Bulan Ini</TableHead><TableHead>Selisih dengan Batas</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{pplData.map((ppl) => { const overLimit = ppl.honorBulanIni > globalSettings.batasHonorBulananGlobal; const difference = ppl.honorBulanIni - globalSettings.batasHonorBulananGlobal; return ( <TableRow key={ppl.id} className={overLimit ? "bg-red-50" : ""}><TableCell className="font-medium">{ppl.nama}</TableCell><TableCell className={cn("font-semibold", overLimit && "text-red-600")}>Rp {ppl.honorBulanIni.toLocaleString('id-ID')}</TableCell><TableCell><Badge variant="outline">{ppl.activitiesCount} Kegiatan</Badge></TableCell><TableCell>{difference === 0 ? <span className="text-gray-600">Tepat batas</span> : difference > 0 ? <span className="text-red-600 font-semibold">+Rp {difference.toLocaleString('id-ID')}</span> : <span className="text-green-600">-Rp {Math.abs(difference).toLocaleString('id-ID')}</span>}</TableCell><TableCell>{overLimit ? <Badge variant="destructive">Melebihi Batas</Badge> : <Badge className="bg-green-600">Normal</Badge>}</TableCell><TableCell><Button variant="outline" size="sm" onClick={() => setSelectedPPL(ppl)}>Detail</Button></TableCell></TableRow> )})}</TableBody></Table>}
          </CardContent>
        </Card>
        <HonorDetailModal 
            ppl={selectedPPL} 
            currentMonth={globalSettings.selectedMonth} 
            onClose={() => setSelectedPPL(null)} 
        />
      </div>
    </Layout>
  );
}