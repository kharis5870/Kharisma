import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Edit, Save, X, DollarSign, TrendingUp, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface PPLHonorData {
  id: string;
  nama: string;
  honorPerBulan: number[];
  activities: string[]; // List of activity names for current month
}

interface GlobalHonorSettings {
  batasHonorBulananGlobal: number;
  selectedMonth: number; // 0-11 for Jan-Dec
}

const months = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
];

const getCurrentMonth = () => new Date().getMonth(); // 0-11

// Global honor settings
const initialGlobalSettings: GlobalHonorSettings = {
  batasHonorBulananGlobal: 3000000, // 3 million rupiah per month per person
  selectedMonth: getCurrentMonth()
};

const mockPPLData: PPLHonorData[] = [
  {
    id: "1",
    nama: "Budi Santoso",
    honorPerBulan: [2400000, 2200000, 2400000, 0, 2100000, 2400000, 2300000, 2400000, 2200000, 3600000, 0, 0],
    activities: ["Sensus Penduduk 2024", "Survei Ekonomi RT"]
  },
  {
    id: "2",
    nama: "Rina Kartika",
    honorPerBulan: [1900000, 1800000, 1900000, 1700000, 1900000, 1800000, 1900000, 1800000, 1900000, 1800000, 1900000, 2000000],
    activities: ["Sensus Penduduk 2024"]
  },
  {
    id: "3",
    nama: "Dedi Kurniawan",
    honorPerBulan: [2200000, 2000000, 2200000, 2100000, 2200000, 0, 2300000, 2200000, 2100000, 2200000, 0, 0],
    activities: ["Sensus Penduduk 2024"]
  },
  {
    id: "4",
    nama: "Agus Priyanto",
    honorPerBulan: [1600000, 1500000, 1600000, 1500000, 1600000, 1500000, 1600000, 1500000, 1600000, 1500000, 1600000, 1700000],
    activities: ["Survei Ekonomi RT"]
  },
  {
    id: "5",
    nama: "Maya Indira",
    honorPerBulan: [1700000, 1600000, 1700000, 1600000, 1700000, 1600000, 1700000, 1600000, 1700000, 0, 0, 0],
    activities: []
  }
];

export default function ManajemenHonor() {
  const [pplData, setPPLData] = useState<PPLHonorData[]>(mockPPLData);
  const [globalSettings, setGlobalSettings] = useState<GlobalHonorSettings>(initialGlobalSettings);
  const [isEditingGlobalLimit, setIsEditingGlobalLimit] = useState(false);
  const [tempGlobalLimit, setTempGlobalLimit] = useState(initialGlobalSettings.batasHonorBulananGlobal);
  const [selectedPPL, setSelectedPPL] = useState<PPLHonorData | null>(null);

  const updateGlobalLimit = (newLimit: number) => {
    setGlobalSettings(prev => ({ ...prev, batasHonorBulananGlobal: newLimit }));
    setIsEditingGlobalLimit(false);
  };

  const handleMonthChange = (monthIndex: number) => {
    setGlobalSettings(prev => ({ ...prev, selectedMonth: monthIndex }));
  };

  const getHonorForMonth = (ppl: PPLHonorData, monthIndex: number) => {
    return ppl.honorPerBulan[monthIndex] || 0;
  };

  const isOverLimit = (ppl: PPLHonorData, monthIndex: number) => {
    return getHonorForMonth(ppl, monthIndex) > globalSettings.batasHonorBulananGlobal;
  };

  const stats = {
    totalPPL: pplData.length,
    pplOverLimit: pplData.filter(ppl => isOverLimit(ppl, globalSettings.selectedMonth)).length,
    totalHonorBulanIni: pplData.reduce((sum, ppl) => sum + getHonorForMonth(ppl, globalSettings.selectedMonth), 0),
    rataRataHonorBulanan: Math.round(
      pplData.reduce((sum, ppl) => sum + getHonorForMonth(ppl, globalSettings.selectedMonth), 0) / pplData.length
    )
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Honor PPL</h1>
            <p className="text-gray-600 mt-1">Kelola akumulasi honor bulanan dengan batas global untuk semua PPL</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Month Selector */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Pilih Bulan:</Label>
              <Select
                value={globalSettings.selectedMonth.toString()}
                onValueChange={(value) => handleMonthChange(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month} 2024
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Global Honor Limit */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Batas Global:</Label>
              {isEditingGlobalLimit ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={tempGlobalLimit}
                    onChange={(e) => setTempGlobalLimit(parseInt(e.target.value) || 0)}
                    className="w-36 h-8"
                    placeholder="Honor limit"
                  />
                  <Button
                    size="sm"
                    onClick={() => updateGlobalLimit(tempGlobalLimit)}
                    className="h-8 w-8 p-0"
                  >
                    <Save className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingGlobalLimit(false);
                      setTempGlobalLimit(globalSettings.batasHonorBulananGlobal);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-bps-blue-50 text-bps-blue-700 font-semibold">
                    Rp {globalSettings.batasHonorBulananGlobal.toLocaleString('id-ID')}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingGlobalLimit(true);
                      setTempGlobalLimit(globalSettings.batasHonorBulananGlobal);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-bps-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total PPL</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPPL}</p>
                </div>
                <Users className="w-8 h-8 text-bps-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">PPL Melebihi Batas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pplOverLimit}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-bps-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Honor Bulan Ini</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats.totalHonorBulanIni / 1000000).toFixed(1)}M
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-bps-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-bps-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rata-rata Honor Bulanan</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats.rataRataHonorBulanan / 1000000).toFixed(1)}M
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-bps-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Honor Management Table */}
        <Card>
          <CardHeader>
            <CardTitle>Akumulasi Honor PPL - Bulan {months[globalSettings.selectedMonth]} 2024</CardTitle>
            <div className="text-sm text-gray-600 mt-2">
              Batas Global: <strong>Rp {globalSettings.batasHonorBulananGlobal.toLocaleString('id-ID')}</strong> per PPL per bulan
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-40">Nama PPL</TableHead>
                    <TableHead className="min-w-40">Honor Bulan Terpilih</TableHead>
                    <TableHead className="min-w-48">Kegiatan Bulan Ini</TableHead>
                    <TableHead className="min-w-32">Selisih dengan Batas</TableHead>
                    <TableHead className="min-w-20">Status</TableHead>
                    <TableHead className="min-w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pplData.map((ppl) => {
                    const monthlyHonor = getHonorForMonth(ppl, globalSettings.selectedMonth);
                    const difference = monthlyHonor - globalSettings.batasHonorBulananGlobal;
                    const pplOverLimit = isOverLimit(ppl, globalSettings.selectedMonth);
                    
                    return (
                      <TableRow key={ppl.id} className={pplOverLimit ? "bg-red-50" : ""}>
                        <TableCell className="font-medium">{ppl.nama}</TableCell>
                        <TableCell className="font-semibold">
                          <span className={pplOverLimit ? "text-red-600" : "text-gray-900"}>
                            Rp {monthlyHonor.toLocaleString('id-ID')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {globalSettings.selectedMonth === getCurrentMonth() && ppl.activities.length > 0 ? (
                              ppl.activities.map((activity, index) => (
                                <Badge key={index} variant="outline" className="text-xs block w-fit">
                                  {activity}
                                </Badge>
                              ))
                            ) : monthlyHonor > 0 ? (
                              <Badge variant="outline" className="text-xs">
                                Ada kegiatan
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">Tidak ada kegiatan</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {difference === 0 ? (
                            <span className="text-gray-600 text-sm">Tepat batas</span>
                          ) : difference > 0 ? (
                            <span className="text-red-600 text-sm font-semibold">
                              +Rp {difference.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="text-green-600 text-sm">
                              -Rp {Math.abs(difference).toLocaleString('id-ID')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {pplOverLimit ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              Melebihi Batas
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-bps-green-600 w-fit">
                              Normal
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPPL(ppl)}
                              >
                                Detail
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Detail Honor: {selectedPPL?.nama}</DialogTitle>
                              </DialogHeader>
                              {selectedPPL && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-6">
                                    <div>
                                      <Label>Batas Honor Bulanan (Global)</Label>
                                      <p className="text-2xl font-bold text-bps-blue-600">
                                        Rp {globalSettings.batasHonorBulananGlobal.toLocaleString('id-ID')}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Honor Bulan {months[globalSettings.selectedMonth]}</Label>
                                      <p className={cn(
                                        "text-2xl font-bold",
                                        isOverLimit(selectedPPL, globalSettings.selectedMonth) ? "text-red-600" : "text-bps-green-600"
                                      )}>
                                        Rp {getHonorForMonth(selectedPPL, globalSettings.selectedMonth).toLocaleString('id-ID')}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label>Kegiatan Bulan Ini</Label>
                                    <div className="space-y-2 mt-2">
                                      {globalSettings.selectedMonth === getCurrentMonth() && selectedPPL.activities.length > 0 ? (
                                        selectedPPL.activities.map((activity, index) => (
                                          <div key={index} className="p-3 bg-gray-50 rounded border">
                                            <span className="font-medium">{activity}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="p-3 bg-gray-50 rounded border">
                                          <span className="text-gray-500">
                                            {getHonorForMonth(selectedPPL, globalSettings.selectedMonth) > 0 
                                              ? "Ada kegiatan pada bulan ini" 
                                              : "Tidak ada kegiatan pada bulan ini"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <Label>Riwayat Honor 12 Bulan Terakhir</Label>
                                    <div className="grid grid-cols-6 gap-4 mt-2">
                                      {months.map((month, index) => (
                                        <div key={month} className="text-center">
                                          <div className={cn(
                                            "text-sm mb-1",
                                            index === globalSettings.selectedMonth ? "text-bps-blue-600 font-semibold" : "text-gray-500"
                                          )}>
                                            {month}
                                          </div>
                                          <div className={cn(
                                            "p-2 rounded border",
                                            index === globalSettings.selectedMonth ? "bg-bps-blue-50 border-bps-blue-200" : "bg-gray-50"
                                          )}>
                                            {selectedPPL.honorPerBulan[index] > 0 ? (
                                              <span className="text-sm font-medium">
                                                {(selectedPPL.honorPerBulan[index] / 1000000).toFixed(1)}M
                                              </span>
                                            ) : (
                                              <span className="text-gray-400">-</span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {isOverLimit(selectedPPL, globalSettings.selectedMonth) && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                      <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                        <div>
                                          <h4 className="font-medium text-red-900">Peringatan: Melebihi Batas Honor Bulanan</h4>
                                          <p className="text-red-700 text-sm mt-1">
                                            PPL ini telah melebihi batas honor bulanan global sebesar{' '}
                                            <span className="font-semibold">
                                              Rp {(getHonorForMonth(selectedPPL, globalSettings.selectedMonth) - globalSettings.batasHonorBulananGlobal).toLocaleString('id-ID')}
                                            </span>
                                            . Hal ini terjadi karena PPL terdaftar di multiple kegiatan dalam bulan ini.
                                          </p>
                                          <p className="text-red-700 text-xs mt-2">
                                            <strong>Catatan:</strong> Batas honor akan reset otomatis di awal bulan depan.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Warning Summary */}
        {stats.pplOverLimit > 0 && (
          <Card className="border-l-4 border-l-red-500 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">
                    Peringatan: {stats.pplOverLimit} PPL Melebihi Batas Honor Global
                  </h3>
                  <p className="text-red-700 text-sm">
                    Beberapa PPL telah melebihi batas honor bulanan global sebesar Rp {globalSettings.batasHonorBulananGlobal.toLocaleString('id-ID')} 
                    pada bulan {months[globalSettings.selectedMonth]}. Batas akan reset otomatis di awal bulan depan.
                  </p>
                  <div className="mt-3">
                    <p className="text-red-700 text-sm font-medium">PPL yang melebihi batas bulan ini:</p>
                    <ul className="list-disc list-inside text-red-700 text-sm mt-1">
                      {pplData.filter(ppl => isOverLimit(ppl, globalSettings.selectedMonth)).map(ppl => (
                        <li key={ppl.id}>
                          {ppl.nama} - Kelebihan: Rp {(getHonorForMonth(ppl, globalSettings.selectedMonth) - globalSettings.batasHonorBulananGlobal).toLocaleString('id-ID')}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-blue-700 text-xs">
                      <strong>Info:</strong> Sistem honor bulanan menggunakan batas global yang berlaku untuk semua PPL. 
                      Batas dapat disesuaikan sesuai kebijakan dan akan reset setiap awal bulan.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
