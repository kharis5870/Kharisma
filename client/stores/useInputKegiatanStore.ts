// client/stores/useInputKegiatanStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Dokumen, PPL } from "@shared/api";

// --- Tipe Data Frontend ---
interface PPLItem extends Omit<PPL, 'id' | 'kegiatanId' | 'namaPPL'> {
  id: string; // Ini adalah ID unik untuk state di frontend, bukan ID database
  namaPPL: string; // Nama tetap disimpan untuk tampilan di UI
}

interface DocumentItem extends Omit<Dokumen, 'id' | 'kegiatanId' | 'status' | 'uploadedAt'> {
  id: string;
}

export type State = {
  namaKegiatan: string;
  ketua_tim_id?: string;
  deskripsiKegiatan: string;
  adaListing: boolean;
  pplAllocations: PPLItem[];
  documents: DocumentItem[];

  // Jadwal baru per tahapan
  tanggalMulaiPersiapan?: Date;
  tanggalSelesaiPersiapan?: Date;
  tanggalMulaiPengumpulanData?: Date;
  tanggalSelesaiPengumpulanData?: Date;
  tanggalMulaiPengolahanAnalisis?: Date;
  tanggalSelesaiPengolahanAnalisis?: Date;
  tanggalMulaiDiseminasiEvaluasi?: Date;
  tanggalSelesaiDiseminasiEvaluasi?: Date;
};

export type Actions = {
  updateFormField: (field: keyof State, value: any) => void;
  addPPL: (tahap: PPL['tahap']) => void; // <-- Diperbarui
  removePPL: (id: string) => void;
  updatePPL: (id: string, field: keyof PPLItem, value: string | number) => void;
  addDocumentLink: (tipe: Dokumen['tipe']) => void;
  updateDocument: (id: string, field: 'nama' | 'link', value: string) => void;
  removeDocument: (id: string) => void;
  setPplAllocations: (allocations: PPLItem[]) => void;
  setDocuments: (documents: DocumentItem[]) => void;
  resetForm: () => void;
};

const mandatoryDocs: Omit<DocumentItem, 'id' | 'link'>[] = [
    { nama: 'SK ', tipe: 'persiapan', isWajib: true, jenis: 'link' },
    { nama: 'Surat Tugas', tipe: 'persiapan', isWajib: true, jenis: 'link' },
    { nama: 'Undangan', tipe: 'persiapan', isWajib: true, jenis: 'link' },
    { nama: 'Daftar Hadir', tipe: 'persiapan', isWajib: true, jenis: 'link' },
    { nama: 'Notulensi', tipe: 'persiapan', isWajib: true, jenis: 'link' },
    { nama: 'Laporan Pelatihan', tipe: 'persiapan', isWajib: true, jenis: 'link' },
    { nama: 'KAK', tipe: 'pengumpulan-data', isWajib: true, jenis: 'link' },
    { nama: 'SK', tipe: 'pengumpulan-data', isWajib: true, jenis: 'link' },
    { nama: 'ST', tipe: 'pengumpulan-data', isWajib: true, jenis: 'link' },
    { nama: 'Visum', tipe: 'pengumpulan-data', isWajib: true, jenis: 'link' },
    { nama: 'BAST', tipe: 'pengumpulan-data', isWajib: true, jenis: 'link' },
    { nama: 'Laporan Pengumpulan Data', tipe: 'pengumpulan-data', isWajib: true, jenis: 'link' },
    { nama: 'Laporan Pengolahan & Analisis', tipe: 'pengolahan-analisis', isWajib: true, jenis: 'link' },
    { nama: 'Dokumentasi', tipe: 'pengolahan-analisis', isWajib: true, jenis: 'link' },
    { nama: 'Laporan Diseminasi & Evaluasi', tipe: 'diseminasi-evaluasi', isWajib: true, jenis: 'link' },
];

const initialState: State = {
  namaKegiatan: "",
  ketua_tim_id: undefined,
  deskripsiKegiatan: "",
  adaListing: false,
  pplAllocations: [], 
  documents: mandatoryDocs.map((doc, i) => ({ ...doc, id: `wajib-initial-${i}`, link: '' })),
  tanggalMulaiPersiapan: undefined,
  tanggalSelesaiPersiapan: undefined,
  tanggalMulaiPengumpulanData: undefined,
  tanggalSelesaiPengumpulanData: undefined,
  tanggalMulaiPengolahanAnalisis: undefined,
  tanggalSelesaiPengolahanAnalisis: undefined,
  tanggalMulaiDiseminasiEvaluasi: undefined,
  tanggalSelesaiDiseminasiEvaluasi: undefined,
};

const useInputKegiatanStore = create<State & Actions>()(
  persist(
    (set): State & Actions => ({
      ...initialState,
      updateFormField: (field: keyof State, value: any) => set({ [field as any]: value }),
      addPPL: (tahap) => set((state: State) => ({ 
        pplAllocations: [
            ...state.pplAllocations, 
            { 
                id: Date.now().toString(), 
                ppl_master_id: "", 
                namaPPL: "", 
                bebanKerja: "", 
                satuanBebanKerja: "",
                hargaSatuan: "", 
                besaranHonor: "", 
                namaPML: "",
                tahap: tahap // <-- Tahap ditambahkan
            }
        ] 
      })),
      removePPL: (id: string) => set((state: State) => ({ pplAllocations: state.pplAllocations.filter((ppl: PPLItem) => ppl.id !== id) })),
      updatePPL: (id: string, field: keyof PPLItem, value: string | number) => set((state: State) => ({
        pplAllocations: state.pplAllocations.map((ppl: PPLItem) =>
          ppl.id === id ? { ...ppl, [field]: value } : ppl
        )
      })),
      addDocumentLink: (tipe) => set((state: State) => ({
        documents: [...state.documents, { id: Date.now().toString(), nama: "", jenis: 'link', tipe, link: '', isWajib: false }]
      })),
      updateDocument: (id: string, field: 'nama' | 'link', value: string) => set((state: State) => ({
        documents: state.documents.map((doc: DocumentItem) =>
          doc.id === id ? { ...doc, [field]: value } : doc
        )
      })),
      removeDocument: (id: string) => set((state: State) => ({ documents: state.documents.filter((doc: DocumentItem) => doc.id !== id) })),
      setPplAllocations: (allocations: PPLItem[]) => set({ pplAllocations: allocations }),
      setDocuments: (documents: DocumentItem[]) => set({ documents }),
      resetForm: () => set(initialState),
    }),
    {
      name: 'input-kegiatan-storage',
    }
  )
);

export default useInputKegiatanStore;