import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { UserData, KetuaTimData, PPLAdminData } from '@shared/api';
import { apiClient } from '@/lib/apiClient';

// --- API Functions ---
const fetchUsers = (): Promise<UserData[]> => apiClient.get<UserData[]>('/admin/users');
const fetchKetuaTim = (): Promise<KetuaTimData[]> => apiClient.get<KetuaTimData[]>('/admin/ketua-tim');
const fetchPPLs = (): Promise<PPLAdminData[]> => apiClient.get<PPLAdminData[]>('/admin/ppl');

const addUserAPI = (data: UserData): Promise<UserData> => apiClient.post<UserData>('/admin/users', data);
const updateUserAPI = ({ id, data }: { id: string, data: UserData }): Promise<UserData> => apiClient.put<UserData>(`/admin/users/${id}`, data);
const deleteUserAPI = (id: string): Promise<void> => apiClient.delete(`/admin/users/${id}`);

const addKetuaTimAPI = (data: KetuaTimData): Promise<KetuaTimData> => apiClient.post<KetuaTimData>('/admin/ketua-tim', data);
const updateKetuaTimAPI = ({ id, data }: { id: string, data: KetuaTimData }): Promise<KetuaTimData> => apiClient.put<KetuaTimData>(`/api/admin/ketua-tim/${id}`, data);
const deleteKetuaTimAPI = (id: string): Promise<void> => apiClient.delete(`/api/admin/ketua-tim/${id}`);

const addPPLAPI = (data: PPLAdminData): Promise<PPLAdminData> => apiClient.post<PPLAdminData>('/admin/ppl', data);
const updatePPLAPI = ({ id, data }: { id: string, data: PPLAdminData }): Promise<PPLAdminData> => apiClient.put<PPLAdminData>(`/admin/ppl/${id}`, data);
const deletePPLAPI = (id: string): Promise<void> => apiClient.delete(`/admin/ppl/${id}`);

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
  pplAdminList: PPLAdminData[];
  addPPLAdmin: UseMutationResult<PPLAdminData, Error, PPLAdminData>['mutate'];
  updatePPLAdmin: (id: string, data: PPLAdminData) => void;
  removePPLAdmin: UseMutationResult<void, Error, string>['mutate'];
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

  const { data: userList = [], isLoading: usersLoading } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
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

  const pplAddMutation = useAdminMutation(addPPLAPI, ['pplAdmin']);
  const pplUpdateMutation = useAdminMutation(updatePPLAPI, ['pplAdmin']);
  const pplDeleteMutation = useAdminMutation(deletePPLAPI, ['pplAdmin']);

  const value: AdminContextType = {
    userList,
    addUser: userAddMutation.mutate,
    updateUser: (id: string, data: UserData) => userUpdateMutation.mutate({ id, data }),
    removeUser: userDeleteMutation.mutate,
    ketuaTimList,
    addKetuaTim: ktAddMutation.mutate,
    updateKetuaTim: (id: string, data: KetuaTimData) => ktUpdateMutation.mutate({ id, data }),
    removeKetuaTim: ktDeleteMutation.mutate,
    pplAdminList,
    addPPLAdmin: pplAddMutation.mutate,
    updatePPLAdmin: (id: string, data: PPLAdminData) => pplUpdateMutation.mutate({ id, data }),
    removePPLAdmin: pplDeleteMutation.mutate,
    isLoading: usersLoading || ktLoading || pplLoading,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
