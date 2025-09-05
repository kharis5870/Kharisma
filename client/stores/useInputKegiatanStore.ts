// client/stores/useInputKegiatanStore.ts

import { create } from 'zustand';
import { produce } from 'immer';
import { persist } from 'zustand/middleware';
import { Dokumen, PPLMaster, PPL } from "@shared/api";

export interface HonorariumDetail {
    jenis_pekerjaan: 'listing' | 'pencacahan' | 'pengolahan';
    bebanKerja: string;
    besaranHonor: string;
}

export interface HonorariumSettings {
    satuanBebanKerja: string;
    hargaSatuan: string;
}

export interface PPLItem {
  id: string;
  ppl_master_id?: string;
  namaPPL?: string;
  namaPML: string;
  tahap: PPL['tahap']; // Menggunakan tipe dari shared/api.ts
  honorarium: HonorariumDetail[];
}

export interface DocumentItem extends Omit<Dokumen, 'id' | 'kegiatanId' | 'status' | 'uploadedAt'> {
  id: string;
}

export type State = {
  namaKegiatan: string;
  ketua_tim_id?: string;
  deskripsiKegiatan: string;
  adaListing: boolean;
  isFasih: boolean;
  bulanHonorListing?: string;
  bulanHonorPencacahan?: string;
  bulanHonorPengolahan?: string;
  pplAllocations: PPLItem[];
  documents: DocumentItem[];
  honorariumSettings: {
    'pengumpulan-data-listing': HonorariumSettings;
    'pengumpulan-data-pencacahan': HonorariumSettings;
    'pengolahan-analisis': HonorariumSettings;
  };
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
  updateFormField: (field: keyof Omit<State, 'pplAllocations' | 'documents' | 'honorariumSettings'>, value: any) => void;
  updateHonorariumSetting: (tahap: keyof State['honorariumSettings'], field: keyof HonorariumSettings, value: string) => void;
  addPPL: (tahap: PPL['tahap']) => void;
  addBulkPPLs: (ppls: PPLMaster[], tahap: PPL['tahap']) => void;
  removePPL: (id: string) => void;
  updatePPL: (id: string, field: keyof PPLItem, value: any) => void;
  updatePPLBebanKerja: (pplId: string, jenisPekerjaan: HonorariumDetail['jenis_pekerjaan'], bebanKerja: string) => void;
  addDocumentLink: (tipe: Dokumen['tipe']) => void;
  updateDocument: (id: string, field: 'nama' | 'link', value: string) => void;
  removeDocument: (id: string) => void;
  setPplAllocations: (allocations: PPLItem[]) => void;
  resetForm: () => void;
  clearPPLsByTahap: (tahap: PPL['tahap']) => void;
};

const mandatoryDocs: Omit<DocumentItem, 'id' | 'link' >[] = [
    { nama: 'SK ', jenis: 'link', tipe: 'persiapan', isWajib: true },
    { nama: 'Surat Tugas', jenis: 'link', tipe: 'persiapan', isWajib: true },
    { nama: 'Undangan', jenis: 'link', tipe: 'persiapan', isWajib: true },
    { nama: 'Daftar Hadir', jenis: 'link', tipe: 'persiapan', isWajib: true },
    { nama: 'Notulensi', jenis: 'link', tipe: 'persiapan', isWajib: true },
    { nama: 'Laporan Pelatihan', jenis: 'link', tipe: 'persiapan', isWajib: true },
    { nama: 'KAK', jenis: 'link', tipe: 'pengumpulan-data', isWajib: true },
    { nama: 'SK', jenis: 'link', tipe: 'pengumpulan-data', isWajib: true },
    { nama: 'ST', jenis: 'link', tipe: 'pengumpulan-data', isWajib: true },
    { nama: 'Visum', jenis: 'link', tipe: 'pengumpulan-data', isWajib: true },
    { nama: 'BAST', jenis: 'link', tipe: 'pengumpulan-data', isWajib: true },
    { nama: 'Laporan Pengumpulan Data', jenis: 'link', tipe: 'pengumpulan-data', isWajib: true },
    { nama: 'Laporan Pengolahan & Analisis', jenis: 'link', tipe: 'pengolahan-analisis', isWajib: true },
    { nama: 'Dokumentasi', jenis: 'link', tipe: 'pengolahan-analisis', isWajib: true },
    { nama: 'Laporan Diseminasi & Evaluasi', jenis: 'link', tipe: 'diseminasi-evaluasi', isWajib: true },
];

const parseHonor = (value: string | number): number => {
    return parseInt(String(value).replace(/\./g, '')) || 0;
}

export const initialState: State = {
  namaKegiatan: "",
  ketua_tim_id: undefined,
  deskripsiKegiatan: "",
  adaListing: false,
  isFasih: false,
  bulanHonorListing: undefined,
  bulanHonorPencacahan: undefined,
  bulanHonorPengolahan: undefined,
  pplAllocations: [],
  documents: mandatoryDocs.map((doc, i) => ({ ...doc, id: `wajib-initial-${i}`, link: '' })),
  honorariumSettings: {
    'pengumpulan-data-listing': { satuanBebanKerja: 'Dokumen', hargaSatuan: '' },
    'pengumpulan-data-pencacahan': { satuanBebanKerja: 'Responden', hargaSatuan: '' },
    'pengolahan-analisis': { satuanBebanKerja: 'Dokumen', hargaSatuan: '' },
  },
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
      
      updateHonorariumSetting: (tahap, field, value) => set(produce((state: State) => {
          state.honorariumSettings[tahap][field] = value;
          const hargaSatuan = parseHonor(state.honorariumSettings[tahap].hargaSatuan);
          let jenisPekerjaan: HonorariumDetail['jenis_pekerjaan'] | undefined;
          if(tahap === 'pengumpulan-data-listing') jenisPekerjaan = 'listing';
          if(tahap === 'pengumpulan-data-pencacahan') jenisPekerjaan = 'pencacahan';
          if(tahap === 'pengolahan-analisis') jenisPekerjaan = 'pengolahan';

          if (jenisPekerjaan) {
            state.pplAllocations.forEach(ppl => {
                const honorDetail = ppl.honorarium.find(h => h.jenis_pekerjaan === jenisPekerjaan);
                if (honorDetail) {
                    const bebanKerja = parseHonor(honorDetail.bebanKerja);
                    honorDetail.besaranHonor = (bebanKerja * hargaSatuan).toString();
                }
            });
          }
      })),
      
      addPPL: (tahap) => set(produce((state: State) => {
        const newPpl: PPLItem = {
            id: `new-ppl-${Date.now()}`,
            namaPML: '',
            tahap: tahap,
            honorarium: []
        };
        if (tahap === 'listing') {
            newPpl.honorarium = [{ jenis_pekerjaan: 'listing', bebanKerja: '', besaranHonor: '0' }];
        } else if (tahap === 'pencacahan') {
            newPpl.honorarium = [{ jenis_pekerjaan: 'pencacahan', bebanKerja: '', besaranHonor: '0' }];
        } else if (tahap === 'pengolahan-analisis') {
            newPpl.honorarium = [{ jenis_pekerjaan: 'pengolahan', bebanKerja: '', besaranHonor: '0' }];
        }
        state.pplAllocations.push(newPpl);
      })),
      
      addBulkPPLs: (ppls, tahap) => set(produce((state: State) => {
        const newAllocations: PPLItem[] = ppls.map(ppl => {
            const newPpl: PPLItem = {
                id: `ppl-${ppl.id}-${tahap}-${Date.now()}`,
                ppl_master_id: String(ppl.id),
                namaPPL: ppl.namaPPL,
                namaPML: '',
                tahap: tahap,
                honorarium: []
            };
            if (tahap === 'listing') {
                newPpl.honorarium = [{ jenis_pekerjaan: 'listing', bebanKerja: '', besaranHonor: '0' }];
            } else if (tahap === 'pencacahan') {
                newPpl.honorarium = [{ jenis_pekerjaan: 'pencacahan', bebanKerja: '', besaranHonor: '0' }];
            } else if (tahap === 'pengolahan-analisis') {
                newPpl.honorarium = [{ jenis_pekerjaan: 'pengolahan', bebanKerja: '', besaranHonor: '0' }];
            }
            return newPpl;
        });
        state.pplAllocations.push(...newAllocations);
      })),

      removePPL: (id) => set(state => ({ pplAllocations: state.pplAllocations.filter((ppl) => ppl.id !== id) })),
      
      updatePPL: (id, field, value) => set(produce((state: State) => {
          const ppl = state.pplAllocations.find(p => p.id === id);
          if (ppl) {
            (ppl as any)[field] = value;
          }
      })),

      updatePPLBebanKerja: (pplId, jenisPekerjaan, bebanKerja) => set(produce((state: State) => {
          const ppl = state.pplAllocations.find(p => p.id === pplId);
          if (ppl) {
              const honorDetail = ppl.honorarium.find(h => h.jenis_pekerjaan === jenisPekerjaan);
              if (honorDetail) {
                  honorDetail.bebanKerja = bebanKerja;
                  let hargaSatuanKey: keyof State['honorariumSettings'];
                  if (jenisPekerjaan === 'listing') hargaSatuanKey = 'pengumpulan-data-listing';
                  else if (jenisPekerjaan === 'pencacahan') hargaSatuanKey = 'pengumpulan-data-pencacahan';
                  else hargaSatuanKey = 'pengolahan-analisis';
                  
                  const hargaSatuan = parseHonor(state.honorariumSettings[hargaSatuanKey].hargaSatuan);
                  honorDetail.besaranHonor = (parseHonor(bebanKerja) * hargaSatuan).toString();
              }
          }
      })),
      
      addDocumentLink: (tipe) => set(produce((state: State) => {
        const newDoc: DocumentItem = {
            id: `custom-${Date.now()}`,
            nama: '',
            link: '',
            tipe: tipe,
            jenis: 'link',
            isWajib: false,
        };
        state.documents.push(newDoc);
      })),
      updateDocument: (id, field, value) => set(produce((state: State) => {
        const doc = state.documents.find(d => d.id === id);
        if (doc) {
            (doc as any)[field] = value;
        }
      })),
      removeDocument: (id) => set(produce((state: State) => {
        state.documents = state.documents.filter(d => d.id !== id);
      })),
      
      setPplAllocations: (allocations) => set({ pplAllocations: allocations }),
      resetForm: () => set({ ...initialState, documents: mandatoryDocs.map((doc, i) => ({ ...doc, id: `wajib-reset-${i}`, link: '' })) }),
      clearPPLsByTahap: (tahap) => set(state => ({
        pplAllocations: state.pplAllocations.filter(p => p.tahap !== tahap)
      }))
    }),
    {
      name: 'input-kegiatan-storage',
    }
  )
);

export default useInputKegiatanStore;