// client/stores/useInputKegiatanStore.ts

import { create } from 'zustand';
import { produce } from 'immer';
import { persist } from 'zustand/middleware';
import { Dokumen } from "@shared/api";

type TahapPPL = 'pengumpulan-data' | 'pengolahan-analisis';
type TahapDokumen = 'persiapan' | 'pengumpulan-data' | 'pengolahan-analisis' | 'diseminasi-evaluasi';

// Detail honor yang ada di SETIAP PPL
export interface HonorariumDetail {
   jenis_pekerjaan: 'listing' | 'pencacahan' | 'pengolahan';
   bebanKerja: string;
   besaranHonor: string;
}

// PENGATURAN honor per TAHAP
export interface HonorariumSettings {
    satuanBebanKerja: string;
    hargaSatuan: string;
}

// PPLItem sekarang tidak lagi menyimpan harga/satuan
export interface PPLItem {
  id: string;
  ppl_master_id?: string;
  namaPPL?: string;
  namaPML: string;
  tahap: TahapPPL;
  honorarium: HonorariumDetail[];
}

export interface DocumentItem extends Omit<Dokumen, 'id' | 'kegiatanId' | 'status' | 'uploadedAt'> {
  id: string;
}

// State utama
export type State = {
  namaKegiatan: string;
  ketua_tim_id?: string;
  deskripsiKegiatan: string;
  adaListing: boolean;
  isFasih: boolean;
  bulanPembayaranHonor?: string;
  pplAllocations: PPLItem[];
  documents: DocumentItem[];
  // State baru untuk menyimpan pengaturan honor per tahap
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

// Aksi/Fungsi untuk mengubah state
export type Actions = {
  updateFormField: (field: keyof Omit<State, 'pplAllocations' | 'documents' | 'honorariumSettings'>, value: any) => void;
  updateHonorariumSetting: (tahap: keyof State['honorariumSettings'], field: keyof HonorariumSettings, value: string) => void;
  addPPL: (tahap: TahapPPL) => void;
  removePPL: (id: string) => void;
  updatePPL: (id: string, field: keyof PPLItem, value: any) => void;
  updatePPLBebanKerja: (pplId: string, jenisPekerjaan: HonorariumDetail['jenis_pekerjaan'], bebanKerja: string) => void;
  addDocumentLink: (tipe: TahapDokumen) => void;
  updateDocument: (id: string, field: 'nama' | 'link', value: string) => void;
  removeDocument: (id: string) => void;
  setPplAllocations: (allocations: PPLItem[]) => void;
  resetForm: () => void;
  clearPPLsByTahap: (tahap: TahapPPL) => void;
};

const mandatoryDocs: Omit<DocumentItem, 'id' | 'link'>[] = [
    // ... (daftar dokumen wajib tetap sama)
];

const parseHonor = (value: string | number): number => {
    return parseInt(String(value).replace(/\./g, '')) || 0;
}

// State awal yang baru
export const initialState: State = {
  namaKegiatan: "",
  ketua_tim_id: undefined,
  deskripsiKegiatan: "",
  adaListing: false,
  isFasih: false,
  bulanPembayaranHonor: undefined,
  pplAllocations: [],
  documents: mandatoryDocs.map((doc, i) => ({ ...doc, id: `wajib-initial-${i}`, link: '' })),
  honorariumSettings: {
    'pengumpulan-data-listing': { satuanBebanKerja: 'Dokumen', hargaSatuan: '' },
    'pengumpulan-data-pencacahan': { satuanBebanKerja: 'Responden', hargaSatuan: '' },
    'pengolahan-analisis': { satuanBebanKerja: 'Dokumen', hargaSatuan: '' },
  },
  tanggalMulaiPersiapan: undefined,
  // ... (tanggal lainnya)
};

const useInputKegiatanStore = create<State & Actions>()(
  persist(
    (set, get): State & Actions => ({
      ...initialState,
      updateFormField: (field, value) => set({ [field as any]: value }),
      
      updateHonorariumSetting: (tahap, field, value) => set(produce((state: State) => {
          state.honorariumSettings[tahap][field] = value;
          // Hitung ulang semua honor PPL di tahap yang relevan
          const hargaSatuan = parseHonor(state.honorariumSettings[tahap].hargaSatuan);
          const jenisPekerjaan = tahap.split('-').pop() as HonorariumDetail['jenis_pekerjaan'];
          
          state.pplAllocations.forEach(ppl => {
              if (ppl.tahap.startsWith(tahap.split('-')[0])) {
                  const honorDetail = ppl.honorarium.find(h => h.jenis_pekerjaan === jenisPekerjaan);
                  if (honorDetail) {
                      const bebanKerja = parseHonor(honorDetail.bebanKerja);
                      honorDetail.besaranHonor = (bebanKerja * hargaSatuan).toString();
                  }
              }
          });
      })),
      
      addPPL: (tahap) => set(produce((state: State) => {
        const newPpl: PPLItem = {
            id: `new-ppl-${Date.now()}`,
            namaPML: '',
            tahap: tahap,
            honorarium: []
        };
        if (tahap === 'pengumpulan-data') {
            newPpl.honorarium = [
                { jenis_pekerjaan: 'listing', bebanKerja: '', besaranHonor: '0' },
                { jenis_pekerjaan: 'pencacahan', bebanKerja: '', besaranHonor: '0' }
            ];
        } else if (tahap === 'pengolahan-analisis') {
            newPpl.honorarium = [
                { jenis_pekerjaan: 'pengolahan', bebanKerja: '', besaranHonor: '0' }
            ];
        }
        state.pplAllocations.push(newPpl);
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
                  // Ambil harga satuan dari setting global
                  let hargaSatuanKey: keyof State['honorariumSettings'];
                  if (jenisPekerjaan === 'listing') hargaSatuanKey = 'pengumpulan-data-listing';
                  else if (jenisPekerjaan === 'pencacahan') hargaSatuanKey = 'pengumpulan-data-pencacahan';
                  else hargaSatuanKey = 'pengolahan-analisis';
                  
                  const hargaSatuan = parseHonor(state.honorariumSettings[hargaSatuanKey].hargaSatuan);
                  honorDetail.besaranHonor = (parseHonor(bebanKerja) * hargaSatuan).toString();
              }
          }
      })),
      
      // ... (aksi dokumen lainnya tetap sama)
      addDocumentLink: (tipe) => { /* ... */ },
      updateDocument: (id, field, value) => { /* ... */ },
      removeDocument: (id) => { /* ... */ },
      
      setPplAllocations: (allocations) => set({ pplAllocations: allocations }),
      resetForm: () => set(initialState),
      clearPPLsByTahap: (tahap) => set(state => ({
        pplAllocations: state.pplAllocations.filter(p => p.tahap !== tahap)
      }))
    }),
    {
      name: 'input-kegiatan-storage',
      // ... (konfigurasi persist)
    }
  )
);

export default useInputKegiatanStore;