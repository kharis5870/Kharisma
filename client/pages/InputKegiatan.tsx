import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, AlertCircle, Download, Upload, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PPLItem {
  id: string;
  namaPPL: string;
  bebanKerja: string;
  satuanBebanKerja: string;
  besaranHonor: string;
  namaPML: string;
}

interface FormData {
  // Step 1
  namaKegiatan: string;
  ketuaTim: string;
  timKerja: string;
  pplAllocations: PPLItem[];
  
  // Step 2
  tanggalMulaiPelatihan: Date | undefined;
  tanggalSelesaiPelatihan: Date | undefined;
  
  // Step 3
  tipeKegiatan: string;
  tanggalMulaiPendataan: Date | undefined;
  tanggalSelesaiPendataan: Date | undefined;
}

export default function InputKegiatan() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    namaKegiatan: "",
    ketuaTim: "",
    timKerja: "",
    pplAllocations: [{ id: "1", namaPPL: "", bebanKerja: "", satuanBebanKerja: "", besaranHonor: "", namaPML: "" }],
    tanggalMulaiPelatihan: undefined,
    tanggalSelesaiPelatihan: undefined,
    tipeKegiatan: "",
    tanggalMulaiPendataan: undefined,
    tanggalSelesaiPendataan: undefined,
  });

  const steps = [
    { number: 1, title: "Pembuatan Kegiatan", description: "Data kegiatan dan alokasi" },
    { number: 2, title: "Pelatihan Petugas", description: "Jadwal pelatihan" },
    { number: 3, title: "Pendataan", description: "Tipe dan jadwal pendataan" },
  ];

  const ketuaTimOptions = [
    "Dr. Ahmad Surya",
    "Dra. Siti Rahma",
    "M. Budi Santoso, S.St",
    "Rina Kartika, M.Si",
    "Drs. Hendra Wijaya"
  ];

  const tipeKegiatanOptions = [
    "Sensus Penduduk",
    "Survei Ekonomi",
    "Survei Pertanian",
    "Sensus Ekonomi",
    "Survei Sosial"
  ];

  const addPPL = () => {
    const newPPL: PPLItem = {
      id: Date.now().toString(),
      namaPPL: "",
      bebanKerja: "",
      satuanBebanKerja: "",
      besaranHonor: "",
      namaPML: ""
    };
    setFormData(prev => ({
      ...prev,
      pplAllocations: [...prev.pplAllocations, newPPL]
    }));
  };

  const removePPL = (id: string) => {
    setFormData(prev => ({
      ...prev,
      pplAllocations: prev.pplAllocations.filter(ppl => ppl.id !== id)
    }));
  };

  const updatePPL = (id: string, field: keyof PPLItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      pplAllocations: prev.pplAllocations.map(ppl =>
        ppl.id === id ? { ...ppl, [field]: value } : ppl
      )
    }));
  };

  const validateStep1 = () => {
    return formData.namaKegiatan && formData.ketuaTim && formData.timKerja &&
           formData.pplAllocations.some(ppl => ppl.namaPPL && ppl.bebanKerja && ppl.besaranHonor && ppl.namaPML);
  };

  const validateStep2 = () => {
    return formData.tanggalMulaiPelatihan && formData.tanggalSelesaiPelatihan;
  };

  const validateStep3 = () => {
    return formData.tipeKegiatan && formData.tanggalMulaiPendataan && formData.tanggalSelesaiPendataan;
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      alert("Harap lengkapi semua field yang wajib diisi!");
      return;
    }

    // Show success modal
    setShowSuccessModal(true);
  };

  const handleSuccessAction = () => {
    // Navigate to dashboard
    navigate('/dashboard');
  };

  // Excel/Spreadsheet Integration Functions
  const downloadTemplate = () => {
    // Create CSV template with headers
    const headers = ['Nama PPL', 'Beban Kerja', 'Satuan Beban Kerja', 'Besaran Honor (Rp)', 'Nama PML'];
    const csvContent = headers.join(',') + '\n' +
                      'Contoh PPL 1,120,Hari,2400000,Contoh PML 1\n' +
                      'Contoh PPL 2,95,Hari,1900000,Contoh PML 2';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_PPL_PML.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');

      // Parse CSV data and convert to PPL items
      const newPPLItems: PPLItem[] = [];

      for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(',');
        if (data.length >= 5 && data[0].trim()) {
          newPPLItems.push({
            id: Date.now().toString() + i,
            namaPPL: data[0].trim(),
            bebanKerja: data[1].trim(),
            satuanBebanKerja: data[2].trim(),
            besaranHonor: data[3].trim(),
            namaPML: data[4].trim()
          });
        }
      }

      if (newPPLItems.length > 0) {
        setFormData(prev => ({
          ...prev,
          pplAllocations: newPPLItems
        }));
        alert(`Berhasil memuat ${newPPLItems.length} data PPL/PML dari file Excel!`);
      } else {
        alert('Tidak ada data valid yang ditemukan dalam file!');
      }
    };

    reader.readAsText(file);
  };

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        parseExcelFile(file);
      } else {
        alert('Silakan upload file CSV. Gunakan template yang telah disediakan.');
      }
    }
    // Reset input value
    event.target.value = '';
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Input Kegiatan</h1>
          <p className="text-gray-600">Lengkapi informasi kegiatan melalui tahapan berikut</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
                      currentStep >= step.number
                        ? "bg-bps-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {step.number}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={cn(
                      "text-sm font-medium",
                      currentStep >= step.number ? "text-bps-blue-600" : "text-gray-500"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-4",
                      currentStep > step.number ? "bg-bps-blue-600" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className="bg-bps-blue-50 text-bps-blue-600 border-bps-blue-200">
                Tahap {currentStep}
              </Badge>
              {steps[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <>
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Informasi Kegiatan</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="namaKegiatan">Nama Kegiatan *</Label>
                      <Input
                        id="namaKegiatan"
                        value={formData.namaKegiatan}
                        onChange={(e) => setFormData(prev => ({ ...prev, namaKegiatan: e.target.value }))}
                        placeholder="Masukkan nama kegiatan"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ketuaTim">Nama Ketua Tim *</Label>
                      <Select
                        value={formData.ketuaTim}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, ketuaTim: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih ketua tim" />
                        </SelectTrigger>
                        <SelectContent>
                          {ketuaTimOptions.map((nama) => (
                            <SelectItem key={nama} value={nama}>
                              {nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timKerja">Tim Kerja *</Label>
                    <Textarea
                      id="timKerja"
                      value={formData.timKerja}
                      onChange={(e) => setFormData(prev => ({ ...prev, timKerja: e.target.value }))}
                      placeholder="Deskripsikan tim kerja dan pembagian tugas"
                      rows={3}
                    />
                  </div>
                </div>

                {/* PPL & PML Allocation */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Alokasi PPL & PML</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadTemplate}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Template
                      </Button>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleExcelUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="excel-upload"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          asChild
                        >
                          <label htmlFor="excel-upload" className="cursor-pointer">
                            <Upload className="w-4 h-4" />
                            Upload Excel/CSV
                          </label>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Excel Integration Info */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Integrasi Excel/Spreadsheet</h4>
                        <p className="text-blue-700 text-sm mt-1">
                          1. Download template Excel dengan kolom yang sesuai<br/>
                          2. Isi data PPL/PML di template tersebut<br/>
                          3. Upload file yang sudah diisi untuk mengimpor data secara otomatis<br/>
                          4. Data dari Excel akan langsung terintegrasi ke database
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Manual Input Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-700">Input Manual (atau hasil import Excel)</h4>
                      <Badge variant="outline" className="text-xs">
                        {formData.pplAllocations.length} PPL terdaftar
                      </Badge>
                    </div>

                    {formData.pplAllocations.map((ppl, index) => (
                      <div key={ppl.id} className="p-4 border rounded-lg space-y-4 bg-gray-50">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">PPL {index + 1}</h4>
                          {formData.pplAllocations.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removePPL(ppl.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Nama PPL *</Label>
                            <Input
                              value={ppl.namaPPL}
                              onChange={(e) => updatePPL(ppl.id, 'namaPPL', e.target.value)}
                              placeholder="Nama PPL"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Beban Kerja *</Label>
                            <Input
                              type="number"
                              value={ppl.bebanKerja}
                              onChange={(e) => updatePPL(ppl.id, 'bebanKerja', e.target.value)}
                              placeholder="Beban kerja"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Satuan Beban Kerja</Label>
                            <Input
                              value={ppl.satuanBebanKerja}
                              onChange={(e) => updatePPL(ppl.id, 'satuanBebanKerja', e.target.value)}
                              placeholder="Hari/Bulan/Tahun"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Besaran Honor (Rp) *</Label>
                            <Input
                              type="number"
                              value={ppl.besaranHonor}
                              onChange={(e) => updatePPL(ppl.id, 'besaranHonor', e.target.value)}
                              placeholder="Honor dalam rupiah"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label>Nama PML *</Label>
                            <Input
                              value={ppl.namaPML}
                              onChange={(e) => updatePPL(ppl.id, 'namaPML', e.target.value)}
                              placeholder="Nama PML"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      onClick={addPPL}
                      className="w-full border-dashed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah PPL Manual
                    </Button>
                  </div>
                </div>

                {!validateStep1() && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm text-yellow-700">Harap lengkapi semua field yang wajib diisi (*)</p>
                  </div>
                )}
              </>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Jadwal Pelatihan</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Tanggal Mulai Pelatihan *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.tanggalMulaiPelatihan && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.tanggalMulaiPelatihan ? (
                            format(formData.tanggalMulaiPelatihan, "dd MMMM yyyy")
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.tanggalMulaiPelatihan}
                          onSelect={(date) => setFormData(prev => ({ ...prev, tanggalMulaiPelatihan: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal Selesai Pelatihan *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.tanggalSelesaiPelatihan && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.tanggalSelesaiPelatihan ? (
                            format(formData.tanggalSelesaiPelatihan, "dd MMMM yyyy")
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.tanggalSelesaiPelatihan}
                          onSelect={(date) => setFormData(prev => ({ ...prev, tanggalSelesaiPelatihan: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Informasi Penting</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Batas waktu input laporan adalah 3 hari setelah pelatihan selesai. 
                        Pastikan semua petugas telah memahami prosedur dan deadline yang ditetapkan.
                      </p>
                    </div>
                  </div>
                </div>

                {!validateStep2() && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm text-yellow-700">Harap pilih tanggal mulai dan selesai pelatihan</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Informasi Pendataan</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipe Kegiatan *</Label>
                    <Select
                      value={formData.tipeKegiatan}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tipeKegiatan: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe kegiatan" />
                      </SelectTrigger>
                      <SelectContent>
                        {tipeKegiatanOptions.map((tipe) => (
                          <SelectItem key={tipe} value={tipe}>
                            {tipe}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Tanggal Mulai Pendataan *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.tanggalMulaiPendataan && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.tanggalMulaiPendataan ? (
                              format(formData.tanggalMulaiPendataan, "dd MMMM yyyy")
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.tanggalMulaiPendataan}
                            onSelect={(date) => setFormData(prev => ({ ...prev, tanggalMulaiPendataan: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Tanggal Selesai Pendataan *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.tanggalSelesaiPendataan && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.tanggalSelesaiPendataan ? (
                              format(formData.tanggalSelesaiPendataan, "dd MMMM yyyy")
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.tanggalSelesaiPendataan}
                            onSelect={(date) => setFormData(prev => ({ ...prev, tanggalSelesaiPendataan: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {!validateStep3() && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm text-yellow-700">Harap lengkapi semua informasi pendataan</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="min-w-32"
          >
            Kembali
          </Button>
          
          <div className="flex gap-4">
            {currentStep < 3 ? (
              <Button
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && !validateStep1()) ||
                  (currentStep === 2 && !validateStep2())
                }
                className="min-w-32 bg-bps-blue-600 hover:bg-bps-blue-700"
              >
                Selanjutnya
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!validateStep3()}
                className="min-w-32 bg-bps-green-600 hover:bg-bps-green-700"
              >
                Simpan Kegiatan
              </Button>
            )}
          </div>
        </div>

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          onAction={handleSuccessAction}
          title="Kegiatan Berhasil Disimpan!"
          description={`Kegiatan "${formData.namaKegiatan}" telah berhasil dibuat dan disimpan ke sistem.`}
          actionLabel="Ke Dashboard"
          autoCloseDelay={3000}
        />
      </div>
    </Layout>
  );
}
