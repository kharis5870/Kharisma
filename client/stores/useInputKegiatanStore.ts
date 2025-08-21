import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Dokumen, PPL } from "@shared/api";

// --- Tipe Data Frontend ---
interface PPLItem extends Omit<PPL, 'id' | 'kegiatanId'> {
  id: string;
}

interface DocumentItem extends Omit<Dokumen, 'id' | 'kegiatanId' | 'status' | 'uploadedAt'> {
  id: string;
}

export type State = {
  namaKegiatan: string;
  ketuaTim: string;
  timKerja: string;
  adaListing: boolean;
  pplAllocations: PPLItem[];
  tanggalMulaiPelatihan?: Date;
  tanggalSelesaiPelatihan?: Date;
  tanggalMulaiPendataan?: Date;
  tanggalSelesaiPendataan?: Date;
  documents: DocumentItem[];
};

export type Actions = {
  updateFormField: (field: keyof State, value: any) => void;
  addPPL: () => void;
  removePPL: (id: string) => void;
  updatePPL: (id: string, field: keyof Omit<PPLItem, 'id'>, value: string) => void;
  addDocumentLink: (tipe: Dokumen['tipe']) => void;
  updateDocument: (id: string, field: 'nama' | 'link', value: string) => void;
  removeDocument: (id: string) => void;
  setPplAllocations: (allocations: PPLItem[]) => void;
  setDocuments: (documents: DocumentItem[]) => void;
  resetForm: () => void;
};

const mandatoryDocs: Omit<DocumentItem, 'id' | 'link'>[] = [
    { nama: 'Surat Tugas', tipe: 'persiapan', isWajib: true, jenis: 'link' },
    { nama: 'Undangan', tipe: 'persiapan', isWajib: true, jenis: 'link' },
    { nama: 'Daftar Hadir', tipe: 'persiapan', isWajib: true, jenis: 'link' },
    { nama: 'Notulensi', tipe: 'persiapan', isWajib: true, jenis: 'link' },
    { nama: 'KAK', tipe: 'pengumpulan-data', isWajib: true, jenis: 'link' },
    { nama: 'SK', tipe: 'pengumpulan-data', isWajib: true, jenis: 'link' },
    { nama: 'ST', tipe: 'pengumpulan-data', isWajib: true, jenis: 'link' },
    { nama: 'Visum', tipe: 'pengumpulan-data', isWajib: true, jenis: 'link' },
    { nama: 'Laporan Pengumpulan Data', tipe: 'pengumpulan-data', isWajib: true, jenis: 'link' },
    { nama: 'Laporan Pengolahan & Analisis Wajib', tipe: 'pengolahan-analisis', isWajib: true, jenis: 'link' },
    { nama: 'Laporan Kegiatan', tipe: 'diseminasi-evaluasi', isWajib: true, jenis: 'link' },
    { nama: 'Publikasi', tipe: 'diseminasi-evaluasi', isWajib: true, jenis: 'link' },
    { nama: 'Laporan Diseminasi & Evaluasi Wajib', tipe: 'diseminasi-evaluasi', isWajib: true, jenis: 'link' },
];

const initialState: State = {
  namaKegiatan: "",
  ketuaTim: "",
  timKerja: "",
  adaListing: false,
  pplAllocations: [{ id: "1", namaPPL: "", bebanKerja: "", satuanBebanKerja: "", besaranHonor: "", namaPML: "" }],
  tanggalMulaiPelatihan: undefined,
  tanggalSelesaiPelatihan: undefined,
  tanggalMulaiPendataan: undefined,
  tanggalSelesaiPendataan: undefined,
  documents: mandatoryDocs.map((doc, i) => ({ ...doc, id: `wajib-initial-${i}`, link: '' }))
};

const useInputKegiatanStore = create<State & Actions>()(
  persist(
    (set): State & Actions => ({
      ...initialState,
      updateFormField: (field: keyof State, value: any) => set({ [field as any]: value }),
      addPPL: () => set((state: State) => ({ pplAllocations: [...state.pplAllocations, { id: Date.now().toString(), namaPPL: "", bebanKerja: "", satuanBebanKerja: "", besaranHonor: "", namaPML: "" }] })),
      removePPL: (id: string) => set((state: State) => ({ pplAllocations: state.pplAllocations.filter((ppl: PPLItem) => ppl.id !== id) })),
      updatePPL: (id: string, field: keyof Omit<PPLItem, 'id'>, value: string) => set((state: State) => ({
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
