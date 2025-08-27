// client/stores/useInputKegiatanStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Dokumen, PPL } from "@shared/api";

type Tahap = 'persiapan' | 'pengumpulan-data' | 'pengolahan-analisis' | 'diseminasi-evaluasi';

interface HonorariumTahap {
  satuanBebanKerja: string;
  hargaSatuan: string;
}

export interface PPLItem extends Omit<PPL, 'id' | 'kegiatanId' | 'namaPPL' | 'satuanBebanKerja' | 'hargaSatuan'> {
  id: string;
  namaPPL: string;
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
  honorarium: Record<Tahap, HonorariumTahap>;
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
  updateFormField: (field: keyof Omit<State, 'honorarium' | 'pplAllocations' | 'documents'>, value: any) => void;
  updateHonorariumTahap: (tahap: Tahap, field: keyof HonorariumTahap, value: string) => void;
  addPPL: (tahap: PPL['tahap']) => void;
  removePPL: (id: string) => void;
  updatePPL: (id: string, field: keyof PPLItem, value: string | number) => void;
  addDocumentLink: (tipe: Dokumen['tipe']) => void;
  updateDocument: (id: string, field: 'nama' | 'link', value: string) => void;
  removeDocument: (id: string) => void;
  setPplAllocations: (allocations: PPLItem[]) => void;
  setDocuments: (documents: DocumentItem[]) => void;
  resetForm: () => void;
  duplicatePersiapanToPengumpulanData: () => void;
  clearPPLsByTahap: (tahap: Tahap) => void;
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

const parseHonor = (value: string): string => String(value).replace(/\./g, '');

const initialHonorariumState: Record<Tahap, HonorariumTahap> = {
  persiapan: { satuanBebanKerja: '', hargaSatuan: '' },
  'pengumpulan-data': { satuanBebanKerja: '', hargaSatuan: '' },
  'pengolahan-analisis': { satuanBebanKerja: '', hargaSatuan: '' },
  'diseminasi-evaluasi': { satuanBebanKerja: '', hargaSatuan: '' },
};

export const initialState: State = {
  namaKegiatan: "",
  ketua_tim_id: undefined,
  deskripsiKegiatan: "",
  adaListing: false,
  pplAllocations: [],
  documents: mandatoryDocs.map((doc, i) => ({ ...doc, id: `wajib-initial-${i}`, link: '' })),
  honorarium: initialHonorariumState,
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
      updateFormField: (field, value) => set({ [field as any]: value }),
      
      updateHonorariumTahap: (tahap, field, value) => set(state => {
          const newHonorariumState = {
              ...state.honorarium,
              [tahap]: { ...state.honorarium[tahap], [field]: value }
          };

          const updatedPplAllocations = state.pplAllocations.map(ppl => {
              if (ppl.tahap === tahap) {
                  const bebanKerja = parseInt(ppl.bebanKerja) || 0;
                  const hargaSatuan = field === 'hargaSatuan' ? parseInt(parseHonor(value)) || 0 : parseInt(parseHonor(newHonorariumState[tahap].hargaSatuan)) || 0;
                  return { ...ppl, besaranHonor: (bebanKerja * hargaSatuan).toString() };
              }
              return ppl;
          });

          return { honorarium: newHonorariumState, pplAllocations: updatedPplAllocations };
      }),

      addPPL: (tahap) => set((state) => ({ 
        pplAllocations: [
            ...state.pplAllocations, 
            { 
                id: Date.now().toString(), 
                ppl_master_id: "", 
                namaPPL: "", 
                bebanKerja: "", 
                besaranHonor: "0", 
                namaPML: "",
                tahap: tahap
            }
        ] 
      })),
      
      removePPL: (id) => set((state) => ({ pplAllocations: state.pplAllocations.filter((ppl) => ppl.id !== id) })),
      
      updatePPL: (id, field, value) => set((state) => ({
        pplAllocations: state.pplAllocations.map((ppl) => {
          if (ppl.id === id) {
            const updatedPpl = { ...ppl, [field]: value };
            if (field === 'bebanKerja') {
              const bebanKerja = parseInt(String(value)) || 0;
              const hargaSatuan = parseInt(parseHonor(state.honorarium[ppl.tahap].hargaSatuan)) || 0;
              updatedPpl.besaranHonor = (bebanKerja * hargaSatuan).toString();
            }
            return updatedPpl;
          }
          return ppl;
        })
      })),

      addDocumentLink: (tipe) => set((state) => ({
        documents: [...state.documents, { id: Date.now().toString(), nama: "", jenis: 'link', tipe, link: '', isWajib: false }]
      })),
      
      updateDocument: (id, field, value) => set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === id ? { ...doc, [field]: value } : doc
        )
      })),

      removeDocument: (id) => set((state) => ({ documents: state.documents.filter((doc) => doc.id !== id) })),
      
      setPplAllocations: (allocations) => set({ pplAllocations: allocations }),
      
      setDocuments: (documents) => set({ documents }),
      
      resetForm: () => set(initialState),

      duplicatePersiapanToPengumpulanData: () => set(state => {
        const persiapanPpls = state.pplAllocations.filter(p => p.tahap === 'persiapan');
        const pengumpulanDataPpls = persiapanPpls.map(ppl => ({
          ...ppl,
          id: `ppl-${ppl.ppl_master_id}-${Date.now()}`,
          tahap: 'pengumpulan-data' as const,
          bebanKerja: "",
          besaranHonor: "0",
          namaPML: "",
        }));
        return {
          pplAllocations: [...state.pplAllocations, ...pengumpulanDataPpls]
        };
      }),
      
      clearPPLsByTahap: (tahap: Tahap) => set(state => ({
        pplAllocations: state.pplAllocations.filter(p => p.tahap !== tahap)
      }))
    }),
    {
      name: 'input-kegiatan-storage',
    }
  )
);

export default useInputKegiatanStore;