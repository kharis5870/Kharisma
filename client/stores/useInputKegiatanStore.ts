// client/stores/useInputKegiatanStore.ts

import { create } from 'zustand';
// Satu daftar dokumen wajib dipakai bersama halaman Edit Kegiatan, yang perlu
// memunculkannya lagi saat tahap yang sempat dimatikan dinyalakan kembali.
import { DOKUMEN_WAJIB as mandatoryDocs } from '@/lib/dokumenWajib';
import { produce } from 'immer';
import { persist } from 'zustand/middleware';
import { Dokumen, PPLMaster, PPL, Kegiatan } from "@shared/api";
import type { MetodePembebanan } from "@shared/pembebananHonor";
import { bulanPembebananSetelahUbah, rentangHonorBawaan, FORMAT_TANGGAL } from "@/lib/honorPeriode";
import { format } from "date-fns";

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
  /** Id user PML pengawas; dikirim ke kolom `ppl.pml_id`. */
  pml_id?: string;
  tahap: PPL['tahap']; // Menggunakan tipe dari shared/api.ts
  honorarium: HonorariumDetail[];
  /**
   * Cara membebankan honor alokasi ini ke bulan-bulan yang dilalui periode
   * honornya. Hanya berarti bila periodenya melintasi lebih dari satu bulan;
   * server memperlakukan periode satu bulan sebagai satu bulan itu saja.
   *
   * Per ALOKASI, bukan per kegiatan: batas SBML berlaku per mitra, jadi mitra
   * yang kuotanya longgar dan yang hampir mentok bisa diatur berbeda di
   * kegiatan yang sama.
   */
  metodePembebanan?: MetodePembebanan;
  /** Bulan 'MM-YYYY' untuk metode 'bulan_tertentu'. */
  bulanPembebananDipilih?: string | null;
}

export interface DocumentItem extends Omit<Dokumen, 'id' | 'kegiatanId' | 'status' | 'uploadedAt'> {
  id: string;
}

export type State = {
  namaKegiatan: string;
  ketua_tim_id?: string;
  deskripsiKegiatan: string;
  adaListing: boolean;
  /**
   * Tahap Pengolahan & Analisis / Diseminasi & Evaluasi dikerjakan kabupaten?
   *
   * Di kantor ini keduanya umumnya ditangani provinsi atau pusat. Kalau
   * dimatikan, jadwal dan dokumen wajib tahap itu tidak diminta sama sekali.
   *
   * TIDAK ada hubungannya dengan alokasi mitra bertahap 'pengolahan-analisis':
   * mitra itu bekerja pada masa PENDATAAN (entri dan cleaning), jadi tabnya
   * tetap ada walau `adaPengolahan` dimatikan.
   */
  adaPengolahan: boolean;
  adaDiseminasi: boolean;
  isFasih: boolean;
  /** Bulan pembebanan honor ("MM-yyyy"), dasar validasi HONOR_LIMIT. */
  bulanHonorListing?: string;
  bulanHonorPencacahan?: string;
  bulanHonorPengolahan?: string;
  /**
   * Rentang tanggal honor ("yyyy-MM-dd"). Disimpan sebagai string, bukan Date,
   * karena store ini di-persist ke localStorage dan objek Date tidak selamat
   * melewati serialisasi JSON.
   */
  tanggalMulaiHonorListing?: string;
  tanggalSelesaiHonorListing?: string;
  tanggalMulaiHonorPencacahan?: string;
  tanggalSelesaiHonorPencacahan?: string;
  tanggalMulaiHonorPengolahan?: string;
  tanggalSelesaiHonorPengolahan?: string;
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

/** Tahap honor, sesuai akhiran kolom `*Honor<Tahap>` di tabel kegiatan. */
export type TahapHonor = 'Listing' | 'Pencacahan' | 'Pengolahan';

export type Actions = {
  updateFormField: (field: keyof Omit<State, 'pplAllocations' | 'documents' | 'honorariumSettings'>, value: any) => void;
  /** Menulis kedua ujung jadwal sebuah tahap dalam satu pembaruan. */
  setRentangTahap: (
    fieldMulai: keyof State,
    fieldSelesai: keyof State,
    mulai: Date | undefined,
    selesai: Date | undefined,
  ) => void;
  setRentangHonor: (tahap: TahapHonor, mulai?: string, selesai?: string) => void;
  setBulanPembebanan: (tahap: TahapHonor, bulan?: string) => void;
  updateHonorariumSetting: (tahap: keyof State['honorariumSettings'], field: keyof HonorariumSettings, value: string) => void;
  addPPL: (tahap: PPL['tahap']) => void;
  addBulkPPLs: (ppls: PPLMaster[], tahap: PPL['tahap']) => void;
  removePPL: (id: string) => void;
  updatePPL: (id: string, field: keyof PPLItem, value: any) => void;
  updatePPLBebanKerja: (pplId: string, jenisPekerjaan: HonorariumDetail['jenis_pekerjaan'], bebanKerja: string) => void;
  /** Catatan tahap; isinya disimpan di kolom `nama`, sama seperti di Edit Kegiatan. */
  addCatatan: (tipe: Dokumen['tipe']) => void;
  addDocumentLink: (tipe: Dokumen['tipe']) => void;
  updateDocument: (id: string, field: 'nama' | 'link', value: string) => void;
  removeDocument: (id: string) => void;
  setPplAllocations: (allocations: PPLItem[]) => void;
  resetForm: () => void;
  clearPPLsByTahap: (tahap: PPL['tahap']) => void;
  loadFromHistory: (kegiatan: Kegiatan) => void;
};


const parseHonor = (value: string | number): number => {
    return parseInt(String(value).replace(/\./g, '')) || 0;
}

export const initialState: State = {
  namaKegiatan: "",
  ketua_tim_id: undefined,
  deskripsiKegiatan: "",
  adaListing: false,
  adaPengolahan: true,
  adaDiseminasi: true,
  isFasih: false,
  bulanHonorListing: undefined,
  bulanHonorPencacahan: undefined,
  bulanHonorPengolahan: undefined,
  tanggalMulaiHonorListing: undefined,
  tanggalSelesaiHonorListing: undefined,
  tanggalMulaiHonorPencacahan: undefined,
  tanggalSelesaiHonorPencacahan: undefined,
  tanggalMulaiHonorPengolahan: undefined,
  tanggalSelesaiHonorPengolahan: undefined,
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
      /**
       * Mengubah satu field — dan, khusus jadwal pendataan, sekaligus mengisi
       * rentang honor yang masih kosong.
       *
       * Ketiga jenis alokasi bekerja pada masa pendataan (mitra "pengolahan"
       * pun mengerjakan entri dan cleaning di masa itu), jadi jadwal pendataan
       * adalah tebakan awal yang benar. Yang sudah disetel tidak ditimpa.
       */
      updateFormField: (field, value) => set(produce((state: State) => {
        (state as any)[field] = value;
        if (field === 'tanggalMulaiPengumpulanData' || field === 'tanggalSelesaiPengumpulanData') {
          const keTeks = (d?: Date) => (d ? format(d, FORMAT_TANGGAL) : undefined);
          Object.assign(state, rentangHonorBawaan(
            keTeks(state.tanggalMulaiPengumpulanData),
            keTeks(state.tanggalSelesaiPengumpulanData),
            state as any));
        }
      })),

      // Rentang dan bulan pembebanan selalu diubah bersama-sama supaya keduanya
      // tidak pernah bertentangan: bulan yang dibebankan harus selalu salah satu
      // bulan yang benar-benar disentuh rentangnya.
      setRentangHonor: (tahap, mulai, selesai) => set(produce((state: State) => {
        state[`tanggalMulaiHonor${tahap}`] = mulai;
        state[`tanggalSelesaiHonor${tahap}`] = selesai;
        state[`bulanHonor${tahap}`] = bulanPembebananSetelahUbah(
          mulai,
          selesai,
          state[`bulanHonor${tahap}`],
        );
      })),

      /**
       * Kedua ujung jadwal ditulis SEKALIGUS.
       *
       * Kalau ditulis dua kali berurutan lewat `updateFormField`, efek samping
       * "isi rentang honor dari jadwal pendataan" berjalan pada penulisan
       * pertama — saat tanggal selesainya masih nilai lama — lalu penulisan
       * kedua menganggap rentang honornya sudah terisi dan melewatinya. Rentang
       * honor jadi mengikuti pasangan tanggal yang tidak pernah ada.
       */
      setRentangTahap: (fieldMulai, fieldSelesai, mulai, selesai) => set(produce((state: State) => {
        (state as any)[fieldMulai] = mulai;
        (state as any)[fieldSelesai] = selesai;
        if (fieldMulai === 'tanggalMulaiPengumpulanData') {
          const keTeks = (d?: Date) => (d ? format(d, FORMAT_TANGGAL) : undefined);
          Object.assign(state, rentangHonorBawaan(keTeks(mulai), keTeks(selesai), state as any));
        }
      })),

      setBulanPembebanan: (tahap, bulan) => set(produce((state: State) => {
        state[`bulanHonor${tahap}`] = bulan;
      })),


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
      
      addCatatan: (tipe) => set(produce((state: State) => {
        state.documents.push({
          id: `catatan-${Date.now()}`,
          nama: '',
          link: '',
          jenis: 'catatan',
          tipe,
          isWajib: false,
        } as DocumentItem);
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
      })),

      /**
       * Menyalin sebuah kegiatan lama sebagai titik awal kegiatan baru.
       *
       * Yang disalin: identitas kegiatan, pengaturan honorarium, seluruh
       * alokasi mitra beserta beban kerjanya, dan susunan dokumen (termasuk
       * dokumen tambahan non-wajib).
       *
       * Yang TIDAK disalin: seluruh tanggal (jadwal maupun honor), progress,
       * status, dan isi link dokumen — semuanya khas periode dan harus diisi
       * ulang. Form hanya diisi, tidak langsung disubmit.
       */
      loadFromHistory: (kegiatan) => set(produce((state: State) => {
        state.namaKegiatan = kegiatan.namaKegiatan || '';
        state.ketua_tim_id = kegiatan.ketua_tim_id || undefined;
        state.deskripsiKegiatan = kegiatan.deskripsiKegiatan || '';
        state.adaListing = Boolean(kegiatan.adaListing);
        // `?? true`: kegiatan lama (dan respons yang di-cache sebelum kolomnya
        // ada) tidak memuat kunci ini, dan semuanya memang punya kedua tahap.
        // Boolean(): database mengirim 0/1, dan angka 0 tercetak sebagai "0" di JSX.
        state.adaPengolahan = Boolean(kegiatan.adaPengolahan ?? true);
        state.adaDiseminasi = Boolean(kegiatan.adaDiseminasi ?? true);
        state.isFasih = Boolean(kegiatan.isFasih);

        const sumber = kegiatan.honorariumSettings;
        if (sumber) {
          (Object.keys(state.honorariumSettings) as (keyof State['honorariumSettings'])[]).forEach(kunci => {
            const asal = sumber[kunci];
            if (asal) {
              state.honorariumSettings[kunci] = {
                satuanBebanKerja: asal.satuanBebanKerja || '',
                hargaSatuan: String(asal.hargaSatuan ?? ''),
              };
            }
          });
        }

        state.pplAllocations = (kegiatan.ppl || [])
          .filter(p => p.ppl_master_id)
          .map((p, i) => ({
            id: `ppl-hist-${i}`,
            ppl_master_id: p.ppl_master_id,
            namaPPL: p.namaPPL,
            namaPML: p.namaPML || '',
            pml_id: p.pml_id || undefined,
            tahap: p.tahap,
            honorarium: (p.honorarium || []).map(h => ({
              jenis_pekerjaan: h.jenis_pekerjaan,
              bebanKerja: String(h.bebanKerja ?? ''),
              besaranHonor: String(h.besaranHonor ?? '0'),
            })),
          })) as PPLItem[];

        state.documents = (kegiatan.dokumen || [])
          // Catatan terikat pada kegiatan aslinya, jadi tidak ikut disalin.
          .filter(d => d.jenis !== 'catatan')
          .map((d, i) => ({
            id: `doc-hist-${i}`,
            nama: d.nama,
            link: '',
            tipe: d.tipe,
            jenis: d.jenis || 'link',
            isWajib: Boolean(d.isWajib),
          }));

        // Semua tanggal dikosongkan — kegiatan baru punya periodenya sendiri.
        state.tanggalMulaiPersiapan = undefined;
        state.tanggalSelesaiPersiapan = undefined;
        state.tanggalMulaiPengumpulanData = undefined;
        state.tanggalSelesaiPengumpulanData = undefined;
        state.tanggalMulaiPengolahanAnalisis = undefined;
        state.tanggalSelesaiPengolahanAnalisis = undefined;
        state.tanggalMulaiDiseminasiEvaluasi = undefined;
        state.tanggalSelesaiDiseminasiEvaluasi = undefined;
        state.bulanHonorListing = undefined;
        state.bulanHonorPencacahan = undefined;
        state.bulanHonorPengolahan = undefined;
        state.tanggalMulaiHonorListing = undefined;
        state.tanggalSelesaiHonorListing = undefined;
        state.tanggalMulaiHonorPencacahan = undefined;
        state.tanggalSelesaiHonorPencacahan = undefined;
        state.tanggalMulaiHonorPengolahan = undefined;
        state.tanggalSelesaiHonorPengolahan = undefined;
      }))
    }),
    {
      name: 'input-kegiatan-storage',
    }
  )
);

export default useInputKegiatanStore;