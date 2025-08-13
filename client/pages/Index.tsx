import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, Users, TrendingUp, ArrowRight, Activity, Clock, CheckCircle } from "lucide-react";

export default function Index() {
  const features = [
    {
      icon: FileText,
      title: "Input Kegiatan",
      description: "Buat dan kelola kegiatan baru dengan sistem 3 tahap yang terstruktur",
      color: "text-bps-blue-600",
      bgColor: "bg-bps-blue-50",
      link: "/input-kegiatan"
    },
    {
      icon: BarChart3,
      title: "Dashboard Monitoring",
      description: "Pantau progress semua kegiatan dalam satu tampilan yang komprehensif",
      color: "text-bps-green-600",
      bgColor: "bg-bps-green-50",
      link: "/dashboard"
    },
    {
      icon: Users,
      title: "Manajemen PPL & PML",
      description: "Kelola alokasi petugas dan monitor progress kerja secara real-time",
      color: "text-bps-orange-600",
      bgColor: "bg-bps-orange-50",
      link: "/dashboard"
    },
    {
      icon: TrendingUp,
      title: "Laporan Terintegrasi",
      description: "Akses laporan lengkap dengan visualisasi data yang informatif",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/dashboard"
    }
  ];

  const workflowSteps = [
    {
      step: "1",
      title: "Pembuatan Kegiatan",
      description: "Input data kegiatan, tim kerja, dokumen, dan alokasi PPL/PML",
      icon: FileText,
      status: "Informasi Kegiatan"
    },
    {
      step: "2", 
      title: "Pelatihan Petugas",
      description: "Atur jadwal pelatihan dan deadline input laporan",
      icon: Users,
      status: "Penjadwalan"
    },
    {
      step: "3",
      title: "Pendataan",
      description: "Tentukan tipe kegiatan dan periode pelaksanaan pendataan",
      icon: Activity,
      status: "Eksekusi"
    }
  ];

  const stats = [
    { label: "Total Kegiatan", value: "24", icon: Activity, color: "text-bps-blue-600" },
    { label: "Sedang Berjalan", value: "8", icon: Clock, color: "text-bps-orange-600" },
    { label: "Selesai", value: "16", icon: CheckCircle, color: "text-bps-green-600" },
  ];

  return (
    <Layout>
      <div className="space-y-12">
        {/* Hero Section */}
        <section className="text-center py-12 bg-gradient-to-br from-bps-blue-50 to-bps-green-50 rounded-2xl">
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Sistem Manajemen Kegiatan
              <span className="block text-bps-blue-600 mt-2">KHARISMA</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Platform terintegrasi untuk input, monitoring, dan pengelolaan kegiatan 
              BPS Kabupaten Bengkulu Selatan dengan efisiensi dan transparansi tinggi
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-bps-blue-600 hover:bg-bps-blue-700">
                <Link to="/input-kegiatan">
                  <FileText className="mr-2 h-5 w-5" />
                  Mulai Input Kegiatan
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/dashboard">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Lihat Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <div className={`p-3 rounded-full bg-gray-50 mb-4`}>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Features Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fitur Utama</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Kelola seluruh siklus kegiatan dengan tools yang powerful dan user-friendly
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <Button asChild variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground">
                    <Link to={feature.link}>
                      Akses Fitur
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Workflow Section */}
        <section className="bg-gray-50 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Alur Kerja Sistem</h2>
            <p className="text-lg text-gray-600">
              Proses input kegiatan yang terstruktur dan sistematis
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {workflowSteps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-bps-blue-600 text-white rounded-full text-xl font-bold mb-4">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 mb-2">{step.description}</p>
                    <div className="inline-flex items-center gap-2 text-sm text-bps-blue-600 font-medium">
                      <step.icon className="w-4 h-4" />
                      {step.status}
                    </div>
                  </div>
                  
                  {index < workflowSteps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full">
                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-6 h-6 text-gray-300" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-bps-green-600 hover:bg-bps-green-700">
              <Link to="/input-kegiatan">
                Mulai Buat Kegiatan Baru
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-bps-blue-600 to-bps-green-600 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Siap Memulai?</h2>
          <p className="text-xl mb-8 opacity-90">
            Bergabunglah dengan sistem manajemen kegiatan yang modern dan efisien
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/input-kegiatan">
                Input Kegiatan Baru
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-bps-blue-600">
              <Link to="/dashboard">
                Monitoring Dashboard
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
