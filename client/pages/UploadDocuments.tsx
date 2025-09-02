import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Plus, Trash2, FileCheck, ArrowLeft, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentFile {
  id: string;
  name: string;
  description: string;
  file: File | null;
  status: 'Pending' | 'Uploaded' | 'Approved';
}

interface ReportFile {
  id: string;
  type: 'training' | 'datacollection';
  name: string;
  file: File | null;
  deadline: string;
  isOverdue: boolean;
  status: 'Pending' | 'Uploaded' | 'Approved';
}

// Mock activity data - in real app this would come from API based on ID
const mockActivityData = {
  id: "1",
  namaKegiatan: "Sensus Penduduk Tahun 2024",
  ketuaTim: "Dr. Ahmad Surya",
  status: "Data Collection",
  tanggalSelesaiPelatihan: "2024-01-20",
  tanggalSelesaiPendataan: "2024-03-25"
};

export default function UploadDocuments() {
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [generalDocuments, setGeneralDocuments] = useState<DocumentFile[]>([
    { id: "1", name: "Proposal Kegiatan", description: "", file: null, status: 'Pending' },
    { id: "2", name: "Daftar Enumerator", description: "", file: null, status: 'Pending' },
  ]);

  const [reports, setReports] = useState<ReportFile[]>([
    {
      id: "1",
      type: 'training',
      name: "Laporan Pelatihan",
      file: null,
      deadline: "2024-01-23", // 3 days after training
      isOverdue: false,
      status: 'Pending'
    },
    {
      id: "2",
      type: 'datacollection',
      name: "Laporan Pendataan",
      file: null,
      deadline: "2024-04-01", // 7 days after data collection
      isOverdue: false,
      status: 'Pending'
    }
  ]);

  const addGeneralDocument = () => {
    const newDoc: DocumentFile = {
      id: Date.now().toString(),
      name: "",
      description: "",
      file: null,
      status: 'Pending'
    };
    setGeneralDocuments(prev => [...prev, newDoc]);
  };

  const removeGeneralDocument = (id: string) => {
    setGeneralDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const updateGeneralDocument = (id: string, field: keyof DocumentFile, value: any) => {
    setGeneralDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, [field]: value } : doc
    ));
  };

  const updateReportFile = (id: string, file: File | null) => {
    setReports(prev => prev.map(report => 
      report.id === id ? { ...report, file, status: file ? 'Uploaded' : 'Pending' } : report
    ));
  };

  const handleFileUpload = (id: string, files: FileList | null, type: 'general' | 'report') => {
    if (files && files[0]) {
      if (type === 'general') {
        updateGeneralDocument(id, 'file', files[0]);
        updateGeneralDocument(id, 'status', 'Uploaded');
      } else {
        updateReportFile(id, files[0]);
      }
    }
  };

  const handleSubmit = () => {
    // Validate required uploads
    const hasRequiredUploads = reports.every(report => report.file !== null);

    if (!hasRequiredUploads) {
      alert("Harap upload semua laporan yang wajib!");
      return;
    }

    setShowSuccessModal(true);
  };

  const handleSuccessAction = () => {
    navigate('/dashboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Uploaded': return 'bg-blue-100 text-blue-700';
      case 'Approved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isReportOverdue = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return now > deadlineDate;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Dokumen</h1>
            <p className="text-gray-600 mt-1">{mockActivityData.namaKegiatan}</p>
          </div>
        </div>

        {/* Activity Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Kegiatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Nama Kegiatan:</span>
                <p className="font-medium">{mockActivityData.namaKegiatan}</p>
              </div>
              <div>
                <span className="text-gray-500">Ketua Tim:</span>
                <p className="font-medium">{mockActivityData.ketuaTim}</p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <Badge className="ml-2">{mockActivityData.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* General Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Dokumen Umum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {generalDocuments.map((doc) => (
              <div key={doc.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor={`doc-name-${doc.id}`}>Nama Dokumen</Label>
                      <Input
                        id={`doc-name-${doc.id}`}
                        value={doc.name}
                        onChange={(e) => updateGeneralDocument(doc.id, 'name', e.target.value)}
                        placeholder="Masukkan nama dokumen"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`doc-desc-${doc.id}`}>Deskripsi (Opsional)</Label>
                      <Textarea
                        id={`doc-desc-${doc.id}`}
                        value={doc.description}
                        onChange={(e) => updateGeneralDocument(doc.id, 'description', e.target.value)}
                        placeholder="Deskripsi dokumen"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`doc-file-${doc.id}`}>File Dokumen</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id={`doc-file-${doc.id}`}
                          type="file"
                          onChange={(e) => handleFileUpload(doc.id, e.target.files, 'general')}
                          className="flex-1"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        />
                        <Upload className="w-4 h-4 text-gray-400" />
                      </div>
                      {doc.file && (
                        <p className="text-xs text-green-600 mt-1">
                          File: {doc.file.name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                    
                    {generalDocuments.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeGeneralDocument(doc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addGeneralDocument}
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Dokumen Lain
            </Button>
          </CardContent>
        </Card>

        {/* Report Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Laporan Wajib</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className={cn(
                "p-4 border rounded-lg",
                isReportOverdue(report.deadline) && !report.file ? "border-red-300 bg-red-50" : ""
              )}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <FileCheck className={cn(
                        "w-5 h-5",
                        report.file ? "text-green-600" : "text-gray-400"
                      )} />
                      <div>
                        <h4 className="font-medium">{report.name}</h4>
                        <p className="text-sm text-gray-600">
                          Deadline: {new Date(report.deadline).toLocaleDateString('id-ID')}
                        </p>
                        {isReportOverdue(report.deadline) && !report.file && (
                          <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Terlambat upload!</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`report-${report.id}`}>Upload File</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id={`report-${report.id}`}
                          type="file"
                          onChange={(e) => handleFileUpload(report.id, e.target.files, 'report')}
                          className="flex-1"
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                        />
                        <Upload className="w-4 h-4 text-gray-400" />
                      </div>
                      {report.file && (
                        <p className="text-xs text-green-600 mt-1">
                          File: {report.file.name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Badge className={cn(
                      getStatusColor(report.status),
                      isReportOverdue(report.deadline) && !report.file ? "bg-red-100 text-red-700" : ""
                    )}>
                      {report.status}
                      {isReportOverdue(report.deadline) && !report.file && " - Terlambat"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}

            {/* Deadline Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Informasi Deadline</h4>
                  <div className="text-blue-700 text-sm mt-1 space-y-1">
                    <p>• Laporan Pelatihan: Wajib diupload maksimal 3 hari setelah pelatihan selesai</p>
                    <p>• Laporan Pendataan: Wajib diupload maksimal 7 hari setelah pendataan selesai</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="outline" asChild>
            <Link to="/dashboard">
              Kembali
            </Link>
          </Button>
          
          <Button
            onClick={handleSubmit}
            className="bg-bps-green-600 hover:bg-bps-green-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Simpan Semua Dokumen
          </Button>
        </div>

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          onAction={handleSuccessAction}
          title="Dokumen Berhasil Diupload!"
          description="Semua dokumen dan laporan telah berhasil diupload dan disimpan ke sistem."
          actionLabel="Ke Dashboard"
          autoCloseDelay={3000}
        />
      </div>
    </Layout>
  );
}
