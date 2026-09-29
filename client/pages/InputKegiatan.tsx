// client/pages/InputKegiatan.tsx

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import { periksaKelengkapanAlokasi, teksPeringatan, type KelompokPeringatan, type TahapAlokasi } from "@/lib/kelengkapanAlokasi";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, History, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useInputKegiatanStore, { TahapHonor } from "@/stores/useInputKegiatanStore";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { bulanDalamRentang, keTeksTanggal, keTanggal, pembebananBelumLengkap } from "@/lib/honorPeriode";
import { ketuaTimTahun, tahunCadangan, tahunUntukKetuaTim } from "@/lib/ketuaTimTahun";
import { Badge } from "@/components/ui/badge";
import { PPLMaster, KetuaTim, Kegiatan, PPL, Dokumen } from "@shared/api";
import { periksaTautan } from "@shared/tautanDokumen";
import AlertModal from "@/components/AlertModal";
import { apiClient } from "@/lib/apiClient";

type DateFieldName =
  | 'tanggalMulaiPersiapan' | 'tanggalSelesaiPersiapan'
  | 'tanggalMulaiPengumpulanData' | 'tanggalSelesaiPengumpulanData'
  | 'tanggalMulaiPengolahanAnalisis' | 'tanggalSelesaiPengolahanAnalisis'
  | 'tanggalMulaiDiseminasiEvaluasi' | 'tanggalSelesaiDiseminasiEvaluasi';

// formatHonor/parseHonor kini dipakai bersama dari @/lib/angka - sebelumnya
// disalin identik di sini dan di EditActivity.tsx.
import { formatHonor, parseHonor, parseHonorNumber } from "@/lib/angka";
import { AlokasiPPLContent } from "@/components/input-kegiatan/AlokasiPPLContent";
import { DokumenContent } from "@/components/input-kegiatan/DokumenContent";
import PanelImporAlokasi from "@/components/PanelImporAlokasi";
import { fetchPPLs, fetchPMLs } from "@/components/input-kegiatan/dataInputKegiatan";

const createActivity = async (data: any): Promise<Kegiatan> => {
    return apiClient.post<Kegiatan>('/kegiatan', data);
}

const fetchKetuaTim = async (): Promise<KetuaTim[]> => {
    return apiClient.get<KetuaTim[]>('/ketua-tim');
};

export default function InputKegiatan() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: ketuaTimList = [] } = useQuery({ queryKey: ['ketuaTim'], queryFn: fetchKetuaTim });
    const location = useLocation();
    
    const [mainTab, setMainTab] = useState("info-dasar");
    const [pplStageTab, setPplStageTab] = useState<PPL['tahap']>("listing");
    const [docStageTab, setDocStageTab] = useState<Dokumen['tipe']>("persiapan");

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastActivityName, setLastActivityName] = useState("");
    /** Kegiatan yang baru saja dibuat, selama modal sukses masih terbuka. */
    const [kegiatanBaru, setKegiatanBaru] = useState<{ id: number } | null>(null);
    const [sedangMengurungkan, setSedangMengurungkan] = useState(false);
    /** Peringatan kelengkapan alokasi yang menunggu konfirmasi "Tetap Simpan". */
    const [peringatanKelengkapan, setPeringatanKelengkapan] = useState<{ daftar: KelompokPeringatan[]; bypassHonorLimit: boolean } | null>(null);
    const [showAutoPopulateMessage, setShowAutoPopulateMessage] = useState(false);
    const [addedPPLCount, setAddedPPLCount] = useState(0);
    /**
     * Ringkasan hasil impor Excel; null selama belum ada impor.
     *
     * Dibuat terpisah dari pesan "Pilih dari Daftar PPL" di atas karena satu
     * berkas impor mengisi beberapa tahap sekaligus, sedangkan pesan itu selalu
     * menyebut satu tahap yang sedang dibuka — kalimat yang akan salah begitu
     * berkasnya memuat Listing dan Pencacahan bersamaan.
     */
    const [pesanImpor, setPesanImpor] = useState<string | null>(null);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "" });
    
    const store = useInputKegiatanStore();

    /**
     * Jadwal per tahap kini satu pemilih RENTANG, bukan dua pemilih tanggal
     * tunggal — konsisten dengan Rentang Tanggal Honor: klik pertama tanggal
     * mulai, klik kedua tanggal selesai.
     */
    const jadwalTahap = [
        { label: 'Persiapan', mulai: 'tanggalMulaiPersiapan', selesai: 'tanggalSelesaiPersiapan' },
        { label: 'Pengumpulan Data', mulai: 'tanggalMulaiPengumpulanData', selesai: 'tanggalSelesaiPengumpulanData' },
        ...(store.adaPengolahan ? [{ label: 'Pengolahan & Analisis', mulai: 'tanggalMulaiPengolahanAnalisis', selesai: 'tanggalSelesaiPengolahanAnalisis' }] : []),
        ...(store.adaDiseminasi ? [{ label: 'Diseminasi & Evaluasi', mulai: 'tanggalMulaiDiseminasiEvaluasi', selesai: 'tanggalSelesaiDiseminasiEvaluasi' }] : []),
    ] as { label: string; mulai: DateFieldName; selesai: DateFieldName }[];

    const storeActions = useInputKegiatanStore.getState();

    // ---------------------------------------------------------------- impor
    // Bahan untuk impor alokasi dari Excel. Daftar mitra dan PML memakai kunci
    // kueri yang sama dengan kartu alokasi di bawah, jadi tidak ada permintaan
    // tambahan ke server — React Query memakai kembali hasil yang sudah ada.
    const { data: pplMasterList = [] } = useQuery({ queryKey: ['pplMaster'], queryFn: fetchPPLs });
    const { data: pmlUserList = [] } = useQuery({ queryKey: ['pmls'], queryFn: fetchPMLs });

    const alokasiSudahAda = useMemo(
        () => store.pplAllocations
            .filter(p => p.ppl_master_id)
            .map(p => ({ mitraId: String(p.ppl_master_id), tahap: p.tahap })),
        [store.pplAllocations]);

    // Harga satuan diambil dari setelan tahap yang sedang berlaku di form, bukan
    // dari berkasnya: berkas impor tidak boleh menjadi sumber harga kedua.
    const hargaSatuanTahap = useMemo(() => ({
        listing: parseHonorNumber(store.honorariumSettings['pengumpulan-data-listing'].hargaSatuan),
        pencacahan: parseHonorNumber(store.honorariumSettings['pengumpulan-data-pencacahan'].hargaSatuan),
        'pengolahan-analisis': parseHonorNumber(store.honorariumSettings['pengolahan-analisis'].hargaSatuan),
    }), [store.honorariumSettings]);

    const jumlahTahapDokumen = 2 + (store.adaPengolahan ? 1 : 0) + (store.adaDiseminasi ? 1 : 0);
    // Tab yang sedang dibuka bisa lenyap saat tahapnya dimatikan. Tanpa ini,
    // Radix kehilangan tab aktifnya dan isi tab dokumen jadi kosong sama sekali.
    useEffect(() => {
        if (docStageTab === 'pengolahan-analisis' && !store.adaPengolahan) setDocStageTab('persiapan');
        if (docStageTab === 'diseminasi-evaluasi' && !store.adaDiseminasi) setDocStageTab('persiapan');
    }, [docStageTab, store.adaPengolahan, store.adaDiseminasi]);

    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [historyLoadedName, setHistoryLoadedName] = useState<string | null>(null);
    const [historySearch, setHistorySearch] = useState("");
    const [loadingHistoryId, setLoadingHistoryId] = useState<number | null>(null);

    // Daftar kegiatan untuk dipilih sebagai sumber salinan. Query ini sudah
    // dipakai dashboard, jadi biasanya sudah ada di cache react-query.
    const { data: riwayatKegiatan = [] } = useQuery({
        queryKey: ['kegiatan'],
        queryFn: () => apiClient.get<Kegiatan[]>('/kegiatan'),
        enabled: showHistoryDialog,
    });

    const riwayatTersaring = useMemo(() => {
        const kata = historySearch.toLowerCase();
        return riwayatKegiatan.filter(k => k.namaKegiatan.toLowerCase().includes(kata));
    }, [riwayatKegiatan, historySearch]);

    // Daftar kegiatan tidak memuat relasi lengkap, jadi detailnya diambil dulu
    // supaya alokasi PPL dan dokumen ikut tersalin.
    const handlePilihHistoris = async (kegiatanId: number) => {
        setLoadingHistoryId(kegiatanId);
        try {
            const detail = await apiClient.get<Kegiatan>(`/kegiatan/${kegiatanId}`);
            store.loadFromHistory(detail);
            setHistoryLoadedName(detail.namaKegiatan);
            setShowHistoryDialog(false);
            setHistorySearch("");
            setMainTab("info-dasar");
        } catch (error: any) {
            setAlertModal({ isOpen: true, title: "Gagal Mengambil Data", message: error.message });
        } finally {
            setLoadingHistoryId(null);
        }
    };

    // Tim melekat pada master ketua tim, jadi cukup ditampilkan (read-only)
    // begitu ketua tim dipilih — tidak perlu diinput ulang per kegiatan.
    // Diisi hanya bila pengguna menyetujui memakai kepengurusan tahun lain
    // karena tahun kegiatannya belum didaftarkan.
    const [tahunPakai, setTahunPakai] = useState<number | null>(null);

    // Ketua tim dicatat per tahun; yang ditawarkan hanya kepengurusan tahun
    // jadwal persiapan kegiatan ini (tahun berjalan selama jadwal kosong).
    const tahunKetuaTim = useMemo(
        () => tahunUntukKetuaTim(store.tanggalMulaiPersiapan),
        [store.tanggalMulaiPersiapan]);

    const ketuaTimTahunIni = useMemo(
        () => ketuaTimTahun(ketuaTimList, tahunPakai ?? tahunKetuaTim),
        [ketuaTimList, tahunKetuaTim, tahunPakai]);

    const tahunCadanganTersedia = useMemo(
        () => tahunCadangan(ketuaTimList, tahunKetuaTim),
        [ketuaTimList, tahunKetuaTim]);

    // Jadwal persiapan berganti tahun: pilihan ketua tim dikosongkan, karena
    // orang yang sudah dipilih mungkin bukan pengurus tahun yang baru. Tahun
    // cadangan yang sempat disetujui ikut dilupakan.
    const tahunSebelumnya = useRef(tahunKetuaTim);
    useEffect(() => {
        if (tahunSebelumnya.current === tahunKetuaTim) return;
        tahunSebelumnya.current = tahunKetuaTim;
        setTahunPakai(null);
        if (store.ketua_tim_id) store.updateFormField('ketua_tim_id', '');
    }, [tahunKetuaTim, store]);

    const timKetuaTerpilih = useMemo(
        () => ketuaTimList.find(k => String(k.id) === String(store.ketua_tim_id))?.tim,
        [ketuaTimList, store.ketua_tim_id],
    );

    useEffect(() => {
     const { newPpls, tahap, from } = location.state || {};
     if (from === 'daftar-ppl' && newPpls && tahap) {
       const currentPplsInStage = store.pplAllocations.filter(p => p.tahap === tahap);
       const newPplsToAdd = newPpls.filter(
         (newPpl: PPLMaster) => !currentPplsInStage.some(
           (existingPpl: any) => existingPpl.ppl_master_id === String(newPpl.id)
         )
       );
       if (newPplsToAdd.length > 0) {
         store.addBulkPPLs(newPplsToAdd, tahap);
         setAddedPPLCount(newPplsToAdd.length);
         setShowAutoPopulateMessage(true);
         setTimeout(() => setShowAutoPopulateMessage(false), 5000);
       }
       setMainTab('alokasi-ppl');
       setPplStageTab(tahap);
       window.history.replaceState({}, document.title);
     } else if (from === 'batal-pilih' && tahap) {
       setMainTab('alokasi-ppl');
       setPplStageTab(tahap);
       window.history.replaceState({}, document.title);
     }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state, navigate]);

   const validateDates = (): string | null => {
       const {
           tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
           tanggalMulaiPengumpulanData, tanggalSelesaiPengumpulanData,
           tanggalMulaiPengolahanAnalisis, tanggalSelesaiPengolahanAnalisis,
           tanggalMulaiDiseminasiEvaluasi, tanggalSelesaiDiseminasiEvaluasi
       } = store;
   
       const stages = [
        // Tahap yang dimatikan dikeluarkan dari pemeriksaan urutan. Tanggalnya
        // masih tersimpan di state (server yang mengosongkannya saat disimpan),
        // jadi tanpa penyaringan ini jadwal tahap yang sudah dinyatakan tidak
        // ada bisa menolak penyimpanan.
           { start: tanggalMulaiPersiapan, end: tanggalSelesaiPersiapan, name: 'Persiapan' },
           { start: tanggalMulaiPengumpulanData, end: tanggalSelesaiPengumpulanData, name: 'Pengumpulan Data' },
           ...(store.adaPengolahan ? [{ start: tanggalMulaiPengolahanAnalisis, end: tanggalSelesaiPengolahanAnalisis, name: 'Pengolahan & Analisis' }] : []),
           ...(store.adaDiseminasi ? [{ start: tanggalMulaiDiseminasiEvaluasi, end: tanggalSelesaiDiseminasiEvaluasi, name: 'Diseminasi & Evaluasi' }] : []),
          ];
   
       for (let i = 0; i < stages.length; i++) {
           const stage = stages[i];
           
           if (stage.start && stage.end && stage.start > stage.end) {
               return `Jadwal ${stage.name} tidak valid: Tanggal selesai tidak boleh sebelum tanggal mulai.`;
           }
   
           if (i > 0) {
               const prevStage = stages[i-1];
               if (prevStage.start && stage.start && stage.start < prevStage.start) {
                   return `Urutan jadwal tidak valid: Tahap ${stage.name} tidak boleh dimulai sebelum tahap ${prevStage.name} dimulai.`;
               }
           }
       }
   
       return null;
   };

   const mutation = useMutation({
     mutationFn: createActivity,
     // Form sengaja TIDAK dikosongkan di sini. Selama modal sukses terbuka,
     // pengguna masih bisa menekan "Batal Simpan Kegiatan"; kalau form sudah
     // kosong, membatalkan berarti kehilangan seluruh isian. Pengosongan
     // dipindah ke saat benar-benar dialihkan ke Dashboard.
     onSuccess: (dibuat: Kegiatan) => {
       queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
       setKegiatanBaru(dibuat && dibuat.id ? { id: dibuat.id } : null);
       setShowSuccessModal(true);
     },
     onError: (error: any) => {
      // Cek apakah error memiliki struktur yang kita harapkan dari server
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        const errorDetails = errorData.details;

        // Jika ada 'details' dan kodenya sesuai, tampilkan modal konfirmasi
        if (errorDetails && errorDetails.code === 'HONOR_LIMIT_EXCEEDED') {
            const pplWithError = store.pplAllocations.find(p => p.ppl_master_id === errorDetails.ppl_master_id);
            
            setHonorWarningDetails({
                pplName: pplWithError?.namaPPL || 'salah satu PPL',
                totalHonor: errorDetails.projectedTotal,
                limit: errorDetails.limit
            });
            setShowHonorWarningModal(true);
            return; // <-- PENTING: Hentikan eksekusi di sini agar modal error tidak muncul
        }
      }
      
      // Jika errornya bukan soal honor, atau strukturnya berbeda, tampilkan modal error umum
      setAlertModal({ 
        isOpen: true, 
        title: "Gagal Menyimpan", 
        message: `Terjadi kesalahan: ${error.response?.data?.message || error.message}` 
      });
   }
    });

   const isFormIncomplete = (): boolean => {
     const {
       namaKegiatan, ketua_tim_id,
       tanggalMulaiPersiapan, tanggalSelesaiPersiapan,
     } = store;
     if (!namaKegiatan || !ketua_tim_id || !tanggalMulaiPersiapan || !tanggalSelesaiPersiapan) return true;

     // Setiap tahap yang punya alokasi mitra wajib punya rentang honor lengkap,
     // dan — bila rentangnya melintasi lebih dari satu bulan — setiap alokasi
     // wajib sudah ditentukan cara pembebanannya. Tanpa itu, HONOR_LIMIT tidak
     // bisa dinilai dan honornya tidak muncul di rekap mana pun.
     const tahapTerpakai: { tahap: PPL['tahap']; kolom: TahapHonor }[] = [
       { tahap: 'listing', kolom: 'Listing' },
       { tahap: 'pencacahan', kolom: 'Pencacahan' },
       { tahap: 'pengolahan-analisis', kolom: 'Pengolahan' },
     ];
     return tahapTerpakai.some(({ tahap, kolom }) => {
       const adaMitra = store.pplAllocations.some(p => p.tahap === tahap && p.ppl_master_id);
       if (!adaMitra) return false;
       const mulai = store[`tanggalMulaiHonor${kolom}`];
       const selesai = store[`tanggalSelesaiHonor${kolom}`];
       if (!mulai || !selesai) return true;
       // Dulu di sini diperiksa `bulanHonor${kolom}`. Sejak bulan pembebanan
       // dipilih PER ALOKASI, kolom tahap itu memang dibiarkan kosong untuk
       // periode lintas bulan — memeriksanya akan membuat kegiatan seperti itu
       // tidak pernah bisa disimpan.
       return pembebananBelumLengkap(
         bulanDalamRentang(mulai, selesai),
         store.pplAllocations.filter(p => p.tahap === tahap && p.ppl_master_id));
     });
   };
   
   const [showHonorWarningModal, setShowHonorWarningModal] = useState(false);
   const [honorWarningDetails, setHonorWarningDetails] = useState<{ pplName: string; totalHonor: number; limit: number } | null>(null);

   const handleFormSubmit = (bypassHonorLimit = false, lewatiKelengkapan = false) => {
        const dateError = validateDates();
        if (dateError) {
            setAlertModal({ isOpen: true, title: "Kesalahan Jadwal Kegiatan", message: dateError });
            return;
        }

        // Jalur pembuatan kegiatan memasukkan seluruh dokumennya sekaligus,
        // jadi ia perlu penjagaan sendiri di samping tombol simpan per-dokumen
        // di halaman Edit Kegiatan.
        const dokumenBermasalah = store.documents
            .filter(d => d.jenis !== 'catatan')
            .map(d => ({ nama: d.nama, hasil: periksaTautan(d.link) }))
            .filter(d => !d.hasil.sah);
        if (dokumenBermasalah.length > 0) {
            const daftar = dokumenBermasalah
                .map(d => `• ${d.nama || '(tanpa nama)'}: ${d.hasil.galat}`)
                .join('\n');
            setAlertModal({
                isOpen: true,
                title: "Link Dokumen Tidak Valid",
                message: `Perbaiki link berikut sebelum menyimpan:\n\n${daftar}`,
            });
            return;
        }

        setLastActivityName(store.namaKegiatan);

        const formatDateForSubmission = (date: Date | undefined) => {
            if (!date) return undefined;
            return isValid(date) ? date.toISOString() : undefined;
        };
        
        const dataToSubmit = {
          // Pembuat kegiatan TIDAK dikirim: server mengambilnya dari token sesi.
          namaKegiatan: store.namaKegiatan,
          ketua_tim_id: store.ketua_tim_id,
          deskripsiKegiatan: store.deskripsiKegiatan,
          adaListing: store.adaListing,
          adaPengolahan: store.adaPengolahan,
          adaDiseminasi: store.adaDiseminasi,
          isFasih: store.isFasih,
          ppl: store.pplAllocations,
          // Catatan yang dibiarkan kosong tidak ikut disimpan.
          documents: store.documents.filter(d => d.jenis !== 'catatan' || d.nama.trim() !== ''),
          honorariumSettings: {
              'pengumpulan-data-listing': {
                  satuanBebanKerja: store.honorariumSettings['pengumpulan-data-listing'].satuanBebanKerja,
                  hargaSatuan: parseHonor(store.honorariumSettings['pengumpulan-data-listing'].hargaSatuan),
              },
              'pengumpulan-data-pencacahan': {
                  satuanBebanKerja: store.honorariumSettings['pengumpulan-data-pencacahan'].satuanBebanKerja,
                  hargaSatuan: parseHonor(store.honorariumSettings['pengumpulan-data-pencacahan'].hargaSatuan),
              },
              'pengolahan-analisis': {
                  satuanBebanKerja: store.honorariumSettings['pengolahan-analisis'].satuanBebanKerja,
                  hargaSatuan: parseHonor(store.honorariumSettings['pengolahan-analisis'].hargaSatuan),
              },
          },
          tanggalMulaiPersiapan: formatDateForSubmission(store.tanggalMulaiPersiapan),
          tanggalSelesaiPersiapan: formatDateForSubmission(store.tanggalSelesaiPersiapan),
          tanggalMulaiPengumpulanData: formatDateForSubmission(store.tanggalMulaiPengumpulanData),
          tanggalSelesaiPengumpulanData: formatDateForSubmission(store.tanggalSelesaiPengumpulanData),
          tanggalMulaiPengolahanAnalisis: formatDateForSubmission(store.tanggalMulaiPengolahanAnalisis),
          tanggalSelesaiPengolahanAnalisis: formatDateForSubmission(store.tanggalSelesaiPengolahanAnalisis),
          tanggalMulaiDiseminasiEvaluasi: formatDateForSubmission(store.tanggalMulaiDiseminasiEvaluasi),
          tanggalSelesaiDiseminasiEvaluasi: formatDateForSubmission(store.tanggalSelesaiDiseminasiEvaluasi),
          bulanHonorListing: store.bulanHonorListing,
          bulanHonorPencacahan: store.bulanHonorPencacahan,
          bulanHonorPengolahan: store.bulanHonorPengolahan,
          tanggalMulaiHonorListing: store.tanggalMulaiHonorListing,
          tanggalSelesaiHonorListing: store.tanggalSelesaiHonorListing,
          tanggalMulaiHonorPencacahan: store.tanggalMulaiHonorPencacahan,
          tanggalSelesaiHonorPencacahan: store.tanggalSelesaiHonorPencacahan,
          tanggalMulaiHonorPengolahan: store.tanggalMulaiHonorPengolahan,
          tanggalSelesaiHonorPengolahan: store.tanggalSelesaiHonorPengolahan,
          bypassHonorLimit: bypassHonorLimit
        };

        // Peringatan, bukan larangan: kegiatan boleh disimpan setengah jadi, tapi
        // beban kerja 0, mitra tanpa PML, atau pengaturan honor yang kosong hampir
        // selalu berarti lupa. Aturannya ada di kelengkapanAlokasi.ts.
        if (!lewatiKelengkapan) {
            const kunciHonor = { 'listing': ['pengumpulan-data-listing', 'Listing'], 'pencacahan': ['pengumpulan-data-pencacahan', 'Pencacahan'], 'pengolahan-analisis': ['pengolahan-analisis', 'Pengolahan'] } as const;
            const peringatan = periksaKelengkapanAlokasi(
                store.pplAllocations.map(ppl => ({
                    tahap: ppl.tahap as TahapAlokasi,
                    nama: ppl.namaPPL,
                    adaMitra: !!ppl.ppl_master_id,
                    bebanKerja: parseHonorNumber(ppl.honorarium?.[0]?.bebanKerja ?? 0),
                    adaPml: !!ppl.pml_id,
                })),
                (Object.keys(kunciHonor) as TahapAlokasi[]).map(t => {
                    const [kunci, kolom] = kunciHonor[t];
                    const atur = store.honorariumSettings[kunci];
                    return {
                        tahap: t,
                        satuanBebanKerja: atur?.satuanBebanKerja,
                        hargaSatuan: parseHonorNumber(atur?.hargaSatuan ?? 0),
                        adaRentang: Boolean(store[`tanggalMulaiHonor${kolom}`] && store[`tanggalSelesaiHonor${kolom}`]),
                    };
                }),
            );
            if (peringatan.length > 0) {
                setPeringatanKelengkapan({ daftar: peringatan, bypassHonorLimit });
                return;
            }
        }
        mutation.mutate(dataToSubmit);
    };

   const handleSuccessAction = () => {
     store.resetForm();
     setHistoryLoadedName(null);
     setKegiatanBaru(null);
     navigate('/dashboard');
   };

   /**
    * "Batal Simpan Kegiatan": kegiatan yang baru dibuat dihapus lagi lewat
    * pintu khusus di server (hanya pembuatnya, hanya sesaat setelah dibuat),
    * lalu pengguna tetap di halaman ini dengan isian form masih utuh.
    */
   const urungkanSimpan = async () => {
     if (!kegiatanBaru || sedangMengurungkan) return;
     setSedangMengurungkan(true);
     try {
       await apiClient.delete(`/kegiatan/${kegiatanBaru.id}/urungkan`);
       queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
       setShowSuccessModal(false);
       setKegiatanBaru(null);
       setAlertModal({
         isOpen: true,
         title: 'Penyimpanan Dibatalkan',
         message: `Kegiatan "${lastActivityName}" batal disimpan. Isian form masih utuh, silakan periksa lalu simpan lagi.`,
       });
     } catch (error: any) {
       setShowSuccessModal(false);
       setAlertModal({ isOpen: true, title: 'Gagal Membatalkan', message: error.message });
     } finally {
       setSedangMengurungkan(false);
     }
   };

   return (
     <Layout>
       <div className="max-w-4xl mx-auto pb-12">
         <div className="mb-8">
           <div className="flex items-start justify-between gap-4">
             <div>
               <h1 className="text-3xl font-bold text-foreground mb-2">Input Kegiatan</h1>
               <p className="text-muted-foreground">Lengkapi semua informasi kegiatan dalam satu halaman</p>
             </div>
             <Button type="button" variant="outline" onClick={() => setShowHistoryDialog(true)}>
               <History className="w-4 h-4 mr-2" />
               Ambil dari Historis
             </Button>
           </div>
           {historyLoadedName && (
               <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg">
                   <p className="text-green-800 dark:text-green-300 text-sm">
                       ✅ Data disalin dari <strong>{historyLoadedName}</strong>. Tanggal dan isi link dokumen sengaja
                       dikosongkan — silakan lengkapi, semua masih bisa diubah sebelum disimpan.
                   </p>
               </div>
           )}
           {showAutoPopulateMessage && (
               <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg">
                   <p className="text-blue-800 dark:text-blue-300 text-sm">✅ {addedPPLCount} PPL telah ditambahkan ke Tahap {pplStageTab.replace('-', ' ')}.</p>
               </div>
           )}
           {pesanImpor && (
               <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg">
                   <p className="text-green-800 dark:text-green-300 text-sm">✅ {pesanImpor}</p>
               </div>
           )}
         </div>
         <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(false); }} className="space-y-8">
           <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
               <TabsList className="grid w-full grid-cols-3">
                   <TabsTrigger value="info-dasar">Info Dasar & Jadwal</TabsTrigger>
                   <TabsTrigger value="alokasi-ppl">Alokasi PPL</TabsTrigger>
                   <TabsTrigger value="dokumen">Dokumen</TabsTrigger>
               </TabsList>

               <TabsContent value="info-dasar" className="mt-6">
                 <div className="space-y-6">
                     <Card>
                         <CardHeader><CardTitle>Informasi Kegiatan</CardTitle><CardDescription>Masukkan detail dasar mengenai kegiatan.</CardDescription></CardHeader>
                         <CardContent className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="space-y-2"><Label htmlFor="namaKegiatan">Nama Kegiatan *</Label><Input id="namaKegiatan" value={store.namaKegiatan} onChange={(e) => store.updateFormField('namaKegiatan', e.target.value)} placeholder="Contoh: Sensus Penduduk 2020" /></div>
                                 <div className="space-y-2"><Label htmlFor="ketuaTim">Nama Ketua Tim *</Label>
                                     <Select value={store.ketua_tim_id} onValueChange={(value: string) => store.updateFormField('ketua_tim_id', value)}>
                                         <SelectTrigger id="ketuaTim"><SelectValue placeholder="Pilih ketua tim" /></SelectTrigger>
                                         <SelectContent>{ketuaTimTahunIni.map((ketua) => (<SelectItem key={ketua.id} value={String(ketua.id)}>{ketua.namaKetua}</SelectItem>))}</SelectContent>
                                     </Select>
                                     <p className="text-xs text-muted-foreground">
                                         Ketua tim mengikuti tahun jadwal persiapan — sekarang {tahunPakai ?? tahunKetuaTim}.
                                     </p>
                                     {ketuaTimTahunIni.length === 0 && (
                                         <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                                             Belum ada ketua tim untuk tahun {tahunKetuaTim}.{' '}
                                             {tahunCadanganTersedia !== null ? (
                                                 <>Mau pakai kepengurusan {tahunCadanganTersedia} saja?{' '}
                                                 <button type="button" className="underline underline-offset-2 font-medium"
                                                     onClick={() => setTahunPakai(tahunCadanganTersedia)}>
                                                     Ya, pakai {tahunCadanganTersedia}
                                                 </button></>
                                             ) : (
                                                 <>Tambahkan dulu di Manajemen Admin &rsaquo; Manajemen Ketua Tim.</>
                                             )}
                                         </div>
                                     )}
                                     {/* Tim mengikuti master ketua tim, diatur di Manajemen Admin. */}
                                     {timKetuaTerpilih && (
                                         <p className="text-sm text-muted-foreground">Tim: <Badge variant="outline">{timKetuaTerpilih}</Badge></p>
                                     )}
                                 </div>
                             </div>
                             <div className="space-y-2"><Label htmlFor="deskripsiKegiatan">Deskripsi Kegiatan</Label><Textarea id="deskripsiKegiatan" value={store.deskripsiKegiatan} onChange={(e) => store.updateFormField('deskripsiKegiatan', e.target.value)} placeholder="Deskripsikan kegiatan secara singkat..." /></div>
                         </CardContent>
                     </Card>
                     <Card>
                         <CardHeader>
                             <CardTitle>Jadwal Kegiatan *</CardTitle>
                             {/* Sakelar diletakkan DI SINI, bukan di tab Dokumen:
                                 keputusannya soal ruang lingkup kegiatan, dan
                                 akibatnya paling terlihat pada daftar jadwal
                                 tepat di bawahnya. */}
                             <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:gap-6">
                                 <label className="flex items-center gap-2 text-sm">
                                     <Checkbox
                                         checked={store.adaPengolahan}
                                         onCheckedChange={(v) => store.updateFormField('adaPengolahan', v === true)}
                                     />
                                     Ada tahap Pengolahan &amp; Analisis
                                 </label>
                                 <label className="flex items-center gap-2 text-sm">
                                     <Checkbox
                                         checked={store.adaDiseminasi}
                                         onCheckedChange={(v) => store.updateFormField('adaDiseminasi', v === true)}
                                     />
                                     Ada tahap Diseminasi &amp; Evaluasi
                                 </label>
                             </div>
                             <p className="pt-1 text-xs text-muted-foreground">
                                 Matikan bila tahap itu dikerjakan provinsi atau pusat. Jadwal dan
                                 dokumen wajibnya tidak akan diminta. Alokasi mitra Pengolahan tetap
                                 ada &mdash; pekerjaannya (entri dan cleaning) berlangsung di masa pendataan.
                             </p>
                         </CardHeader>
                         <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                             {jadwalTahap.map(({ label, mulai, selesai }) => (
                                 <div key={label} className="space-y-2">
                                     <Label>{label}</Label>
                                     <DateRangePicker
                                         value={{ mulai: keTeksTanggal(store[mulai]), selesai: keTeksTanggal(store[selesai]) }}
                                         onChange={(r) => storeActions.setRentangTahap(mulai, selesai, keTanggal(r.mulai), keTanggal(r.selesai))}
                                         defaultMonth={store[mulai] ?? store.tanggalMulaiPersiapan}
                                         placeholder="Pilih rentang..."
                                     />
                                 </div>
                             ))}
                         </CardContent>
                     </Card>
                 </div>
               </TabsContent>
               
                <TabsContent value="alokasi-ppl" className="mt-6">
                  {/* Di ATAS ketiga tab, karena satu berkas mengisi ketiganya
                      sekaligus; tombol di dalam kartu "Listing" yang juga
                      menambah alokasi Pencacahan akan menyesatkan. */}
                  <PanelImporAlokasi
                      pplList={pplMasterList}
                      pmlList={pmlUserList}
                      alokasiSudahAda={alokasiSudahAda}
                      hargaSatuan={hargaSatuanTahap}
                      namaKegiatan={store.namaKegiatan}
                      onTerapkan={(alokasi) => {
                          storeActions.tambahAlokasiImpor(alokasi);
                          // Pindah ke tahap yang paling banyak terisi supaya
                          // hasilnya langsung terlihat, bukan tersembunyi di
                          // tab sebelah.
                          const terbanyak = alokasi.reduce<Record<string, number>>(
                              (acc, a) => ({ ...acc, [a.tahap]: (acc[a.tahap] ?? 0) + 1 }), {});
                          const tahapTerbanyak = Object.keys(terbanyak)
                              .sort((a, b) => terbanyak[b] - terbanyak[a])[0];
                          if (tahapTerbanyak) setPplStageTab(tahapTerbanyak as PPL['tahap']);
                          const rincian = Object.entries(terbanyak)
                              .map(([t, n]) => `${n} ${t.replace('-', ' ')}`).join(', ');
                          setPesanImpor(`${alokasi.length} alokasi masuk dari berkas (${rincian}). Belum tersimpan sampai kegiatan ini disimpan.`);
                      }}
                      onGagal={(title, message) => setAlertModal({ isOpen: true, title, message })}
                  />
                  <Tabs value={pplStageTab} onValueChange={(val) => setPplStageTab(val as PPL['tahap'])}>
                      <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="listing">Listing</TabsTrigger>
                          <TabsTrigger value="pencacahan">Pencacahan</TabsTrigger>
                          <TabsTrigger value="pengolahan-analisis">Pengolahan</TabsTrigger>
                      </TabsList>
                      <TabsContent value="listing" className="mt-4">
                          <AlokasiPPLContent tahap="listing" title="Listing" />
                      </TabsContent>
                      <TabsContent value="pencacahan" className="mt-4">
                          <AlokasiPPLContent tahap="pencacahan" title="Pencacahan" />
                      </TabsContent>
                      <TabsContent value="pengolahan-analisis" className="mt-4">
                          <AlokasiPPLContent tahap="pengolahan-analisis" title="Pengolahan" />
                      </TabsContent>
                  </Tabs>
                </TabsContent>

               <TabsContent value="dokumen" className="mt-6">
                 <Tabs value={docStageTab} onValueChange={(val) => setDocStageTab(val as Dokumen['tipe'])}>
                     <TabsList className={cn("grid w-full", jumlahTahapDokumen === 4 ? "grid-cols-4" : jumlahTahapDokumen === 3 ? "grid-cols-3" : "grid-cols-2")}>
                         <TabsTrigger value="persiapan">Persiapan</TabsTrigger>
                         <TabsTrigger value="pengumpulan-data">Pengumpulan Data</TabsTrigger>
                         {!!store.adaPengolahan && <TabsTrigger value="pengolahan-analisis">Pengolahan</TabsTrigger>}
                         {!!store.adaDiseminasi && <TabsTrigger value="diseminasi-evaluasi">Diseminasi</TabsTrigger>}
                     </TabsList>
                     <TabsContent value="persiapan" className="mt-4"><DokumenContent tipe="persiapan" title="Persiapan" /></TabsContent>
                     <TabsContent value="pengumpulan-data" className="mt-4"><DokumenContent tipe="pengumpulan-data" title="Pengumpulan Data" /></TabsContent>
                     {!!store.adaPengolahan && <TabsContent value="pengolahan-analisis" className="mt-4"><DokumenContent tipe="pengolahan-analisis" title="Pengolahan & Analisis" /></TabsContent>}
                     {!!store.adaDiseminasi && <TabsContent value="diseminasi-evaluasi" className="mt-4"><DokumenContent tipe="diseminasi-evaluasi" title="Diseminasi & Evaluasi" /></TabsContent>}
                 </Tabs>
               </TabsContent>
             </Tabs>
           <div className="flex justify-center mt-8">
            <Button 
                type="submit" 
                size="lg" 
                disabled={isFormIncomplete() || mutation.isPending} 
                className="min-w-48 bg-bps-green-600 hover:bg-bps-green-700"
            >
                {mutation.isPending ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
            </>
        ) : (
            "Simpan Kegiatan"
        )}
    </Button>
</div>
         </form>
         <ConfirmationModal
             isOpen={showHonorWarningModal}
             onClose={() => setShowHonorWarningModal(false)}
             onConfirm={() => {
                setShowHonorWarningModal(false);
                handleFormSubmit(true, true); // Kirim dengan flag bypass
             }}
             title="Peringatan Batas Honor"
             description={`Total honor untuk ${honorWarningDetails?.pplName} di bulan terpilih akan menjadi ${formatHonor(honorWarningDetails?.totalHonor || 0)}, melebihi batas ${formatHonor(honorWarningDetails?.limit || 0)}. Lanjutkan?`}
             confirmLabel="Ya, Lanjutkan"
             variant="warning"
           />
         <SuccessModal
           isOpen={showSuccessModal}
           onClose={handleSuccessAction}
           onAction={handleSuccessAction}
           title="Kegiatan Berhasil Disimpan!"
           description={`Kegiatan "${lastActivityName}" telah berhasil dibuat.`}
           actionLabel="Ke Dashboard"
           aksiKedua={{ label: sedangMengurungkan ? 'Membatalkan...' : 'Batal Simpan Kegiatan', onClick: urungkanSimpan }}
           autoCloseDelay={6000}
         />
         <ConfirmationModal
           isOpen={peringatanKelengkapan !== null}
           onClose={() => setPeringatanKelengkapan(null)}
           onConfirm={() => { const b = peringatanKelengkapan?.bypassHonorLimit ?? false; setPeringatanKelengkapan(null); handleFormSubmit(b, true); }}
           title="Periksa Lagi Sebelum Menyimpan?"
           description={teksPeringatan(peringatanKelengkapan?.daftar ?? [])}
           confirmLabel="Tetap Simpan"
           cancelLabel="Periksa Lagi"
           variant="warning"
         />
         <AlertModal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ isOpen: false, title: "", message: "" })} title={alertModal.title} description={alertModal.message} />

         <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
           <DialogContent className="max-w-2xl">
             <DialogHeader>
               <DialogTitle>Ambil dari Historis</DialogTitle>
               <DialogDescription>
                 Pilih kegiatan yang sudah ada untuk disalin. Informasi kegiatan, pengaturan honorarium,
                 alokasi mitra, dan susunan dokumen akan terisi otomatis. Tanggal dan isi link dokumen
                 tetap kosong. Data hanya diisikan ke form — belum tersimpan, jadi masih bisa diubah.
               </DialogDescription>
             </DialogHeader>

             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
               <Input
                 placeholder="Cari nama kegiatan..."
                 value={historySearch}
                 onChange={(e) => setHistorySearch(e.target.value)}
                 className="pl-10"
               />
             </div>

             <div className="max-h-80 overflow-y-auto space-y-2">
               {riwayatTersaring.length === 0 ? (
                 <p className="text-center text-muted-foreground py-8">
                   {historySearch ? `Tidak ada kegiatan yang cocok dengan "${historySearch}"` : 'Belum ada kegiatan yang bisa disalin'}
                 </p>
               ) : (
                 riwayatTersaring.map(k => (
                   <button
                     key={k.id}
                     type="button"
                     disabled={loadingHistoryId !== null}
                     onClick={() => handlePilihHistoris(k.id)}
                     className="w-full text-left p-3 rounded-md border hover:bg-accent disabled:opacity-50 flex items-center justify-between gap-3"
                   >
                     <div className="min-w-0">
                       <p className="font-medium truncate">{k.namaKegiatan}</p>
                       <p className="text-sm text-muted-foreground truncate">
                         Ketua: {k.namaKetua || '-'}
                         {k.timKetua ? ` · Tim ${k.timKetua}` : ''}
                       </p>
                     </div>
                     {loadingHistoryId === k.id && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                   </button>
                 ))
               )}
             </div>
           </DialogContent>
         </Dialog>
       </div>
     </Layout>
   );
 }