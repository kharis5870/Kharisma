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
  tipeKegiatan: string;
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
  addDocumentLink: () => void;
  updateDocument: (id: string, field: 'nama' | 'link', value: string) => void;
  removeDocument: (id: string) => void;
  setPplAllocations: (allocations: PPLItem[]) => void;
  setDocuments: (documents: DocumentItem[]) => void;
  resetForm: () => void;
};

const initialState: State = {
  namaKegiatan: "",
  ketuaTim: "",
  timKerja: "",
  tipeKegiatan: "",
  pplAllocations: [{ id: "1", namaPPL: "", bebanKerja: "", satuanBebanKerja: "", besaranHonor: "", namaPML: "" }],
  tanggalMulaiPelatihan: undefined,
  tanggalSelesaiPelatihan: undefined,
  tanggalMulaiPendataan: undefined,
  tanggalSelesaiPendataan: undefined,
  documents: []
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
      addDocumentLink: () => set((state: State) => ({
        documents: [...state.documents, { id: Date.now().toString(), nama: "", jenis: 'link', tipe: 'persiapan', link: '', isWajib: false }]
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
      name: 'input-kegiatan-storage', // Nama untuk penyimpanan di local storage
    }
  )
);

export default useInputKegiatanStore;
