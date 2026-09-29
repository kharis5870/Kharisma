import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { UserData, KetuaTimData, PPLAdminData } from '@shared/api';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { simpanToken } from '@/lib/tokenSesi';

// --- API Functions ---
const fetchUsers = (): Promise<UserData[]> => apiClient.get<UserData[]>('/admin/users');
const fetchKetuaTim = (): Promise<KetuaTimData[]> => apiClient.get<KetuaTimData[]>('/admin/ketua-tim');
const fetchPPLs = (): Promise<PPLAdminData[]> => apiClient.get<PPLAdminData[]>('/admin/ppl');

const addUserAPI = (data: UserData): Promise<UserData> => apiClient.post<UserData>('/admin/users', data);
// Admin yang mengganti password AKUNNYA SENDIRI menerima token pengganti:
// mengganti password mencabut semua sesi lama akun itu, termasuk sesi ini.
const updateUserAPI = async ({ id, data }: { id: string, data: UserData }): Promise<UserData> => {
  const hasil = await apiClient.put<UserData & { token?: string }>(`/admin/users/${id}`, data);
  if (hasil?.token) simpanToken(hasil.token);
  return hasil;
};
const deleteUserAPI = (id: string): Promise<void> => apiClient.delete(`/admin/users/${id}`);

const addKetuaTimAPI = (data: KetuaTimData): Promise<KetuaTimData> => apiClient.post<KetuaTimData>('/admin/ketua-tim', data);
// apiClient sudah menambahkan prefiks "/api" sendiri, jadi path di sini tidak
// boleh mengulanginya — sebelumnya kedua URL ini punya "/api" ganda.
const updateKetuaTimAPI = ({ id, data }: { id: string, data: KetuaTimData }): Promise<KetuaTimData> => apiClient.put<KetuaTimData>(`/admin/ketua-tim/${id}`, data);
const deleteKetuaTimAPI = (id: string): Promise<void> => apiClient.delete(`/admin/ketua-tim/${id}`);

export interface HasilSalinKetuaTim { disalin: number; dilewati: string[] }
const salinKetuaTimAPI = (data: { dariTahun: number; keTahun: number }): Promise<HasilSalinKetuaTim> =>
  apiClient.post<HasilSalinKetuaTim>('/admin/ketua-tim/salin', data);

const gantiNamaTimAPI = (data: { lama: string; baru: string; tahun?: number | null }): Promise<{ diubah: number }> =>
  apiClient.put<{ diubah: number }>('/admin/tim/ganti-nama', data);

const addPPLAPI = (data: PPLAdminData): Promise<PPLAdminData> => apiClient.post<PPLAdminData>('/admin/ppl', data);
const updatePPLAPI = ({ id, data }: { id: string, data: PPLAdminData }): Promise<PPLAdminData> => apiClient.put<PPLAdminData>(`/admin/ppl/${id}`, data);
const deletePPLAPI = (id: string): Promise<void> => apiClient.delete(`/admin/ppl/${id}`);
const ubahAktifPPLAPI = ({ id, aktif }: { id: string; aktif: boolean }): Promise<void> =>
  apiClient.put(`/admin/ppl/${id}/aktif`, { aktif });

// --- Context ---
interface AdminContextType {
  userList: UserData[];
  addUser: UseMutationResult<UserData, Error, UserData>['mutate'];
  updateUser: (id: string, data: UserData) => void;
  removeUser: UseMutationResult<void, Error, string>['mutate'];
  ketuaTimList: KetuaTimData[];
  addKetuaTim: UseMutationResult<KetuaTimData, Error, KetuaTimData>['mutate'];
  updateKetuaTim: (id: string, data: KetuaTimData) => void;
  removeKetuaTim: UseMutationResult<void, Error, string>['mutate'];
  salinKetuaTim: UseMutationResult<HasilSalinKetuaTim, Error, { dariTahun: number; keTahun: number }>['mutate'];
  gantiNamaTim: UseMutationResult<{ diubah: number }, Error, { lama: string; baru: string; tahun?: number | null }>['mutate'];
  pplAdminList: PPLAdminData[];
  addPPLAdmin: UseMutationResult<PPLAdminData, Error, PPLAdminData>['mutate'];
  updatePPLAdmin: (id: string, data: PPLAdminData) => void;
  removePPLAdmin: UseMutationResult<void, Error, string>['mutate'];
  ubahAktifPPLAdmin: UseMutationResult<void, Error, { id: string; aktif: boolean }>['mutate'];
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within an AdminProvider');
  return context;
};

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Daftar akun hanya boleh dibaca admin (server membalas 403 untuk peran
  // lain), dan satu-satunya pemakainya halaman Manajemen Admin. Provider ini
  // terpasang di SEMUA halaman, jadi tanpa `enabled` setiap non-admin memicu
  // permintaan yang pasti ditolak di tiap halaman yang dibukanya.
  const { data: userList = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'], queryFn: fetchUsers, enabled: user?.role === 'admin',
  });
  const { data: ketuaTimList = [], isLoading: ktLoading } = useQuery({ queryKey: ['ketuaTimAdmin'], queryFn: fetchKetuaTim });
  const { data: pplAdminList = [], isLoading: pplLoading } = useQuery({ queryKey: ['pplAdmin'], queryFn: fetchPPLs });

  const useAdminMutation = <TData, TVariables>(mutationFn: (vars: TVariables) => Promise<TData>, queryKeyToInvalidate: string[]) => {
    return useMutation<TData, Error, TVariables>({
        mutationFn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
        },
    });
  };

  const userAddMutation = useAdminMutation(addUserAPI, ['users']);
  const userUpdateMutation = useAdminMutation(updateUserAPI, ['users']);
  const userDeleteMutation = useAdminMutation(deleteUserAPI, ['users']);
  
  const ktAddMutation = useAdminMutation(addKetuaTimAPI, ['ketuaTimAdmin']);
  const ktUpdateMutation = useAdminMutation(updateKetuaTimAPI, ['ketuaTimAdmin']);
  const ktDeleteMutation = useAdminMutation(deleteKetuaTimAPI, ['ketuaTimAdmin']);
  const ktSalinMutation = useAdminMutation(salinKetuaTimAPI, ['ketuaTimAdmin']);
  // Nama tim ikut tampil di kegiatan (JOIN ke ketua_tim), jadi daftar kegiatan
  // juga harus disegarkan setelah penggantian nama.
  const timGantiNamaMutation = useAdminMutation(gantiNamaTimAPI, ['ketuaTimAdmin']);

  const pplAddMutation = useAdminMutation(addPPLAPI, ['pplAdmin']);
  const pplUpdateMutation = useAdminMutation(updatePPLAPI, ['pplAdmin']);
  const pplDeleteMutation = useAdminMutation(deletePPLAPI, ['pplAdmin']);
  const pplAktifMutation = useMutation<void, Error, { id: string; aktif: boolean }>({
    mutationFn: ubahAktifPPLAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pplAdmin'] });
      // Pilihan mitra di Input/Edit Kegiatan hanya memuat mitra aktif.
      queryClient.invalidateQueries({ queryKey: ['pplMaster'] });
    },
  });

  const value: AdminContextType = {
    userList,
    addUser: userAddMutation.mutate,
    updateUser: (id: string, data: UserData) => userUpdateMutation.mutate({ id, data }),
    removeUser: userDeleteMutation.mutate,
    ketuaTimList,
    addKetuaTim: ktAddMutation.mutate,
    updateKetuaTim: (id: string, data: KetuaTimData) => ktUpdateMutation.mutate({ id, data }),
    removeKetuaTim: ktDeleteMutation.mutate,
    salinKetuaTim: ktSalinMutation.mutate,
    gantiNamaTim: timGantiNamaMutation.mutate,
    pplAdminList,
    addPPLAdmin: pplAddMutation.mutate,
    updatePPLAdmin: (id: string, data: PPLAdminData) => pplUpdateMutation.mutate({ id, data }),
    removePPLAdmin: pplDeleteMutation.mutate,
    ubahAktifPPLAdmin: pplAktifMutation.mutate,
    isLoading: usersLoading || ktLoading || pplLoading,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
