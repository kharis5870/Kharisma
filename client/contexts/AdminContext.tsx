import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { UserData, KetuaTimData, PPLAdminData } from '@shared/api';

// --- API Functions ---
const fetchUsers = async (): Promise<UserData[]> => (await fetch('/api/admin/users')).json();
const fetchKetuaTim = async (): Promise<KetuaTimData[]> => (await fetch('/api/admin/ketua-tim')).json();
const fetchPPLs = async (): Promise<PPLAdminData[]> => (await fetch('/api/admin/ppl')).json();

const addUserAPI = async (data: UserData) => (await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
const updateUserAPI = async ({ id, data }: { id: string, data: UserData }) => (await fetch(`/api/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
const deleteUserAPI = async (id: string) => (await fetch(`/api/admin/users/${id}`, { method: 'DELETE' }));

const addKetuaTimAPI = async (data: KetuaTimData) => (await fetch('/api/admin/ketua-tim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
const updateKetuaTimAPI = async ({ id, data }: { id: string, data: KetuaTimData }) => (await fetch(`/api/admin/ketua-tim/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
const deleteKetuaTimAPI = async (id: string) => (await fetch(`/api/admin/ketua-tim/${id}`, { method: 'DELETE' }));

const addPPLAPI = async (data: PPLAdminData) => (await fetch('/api/admin/ppl', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
const updatePPLAPI = async ({ id, data }: { id: string, data: PPLAdminData }) => (await fetch(`/api/admin/ppl/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
const deletePPLAPI = async (id: string) => (await fetch(`/api/admin/ppl/${id}`, { method: 'DELETE' }));

// --- Context ---
interface AdminContextType {
  userList: UserData[];
  addUser: UseMutationResult<UserData, Error, UserData>['mutate'];
  updateUser: (id: string, data: UserData) => void;
  removeUser: UseMutationResult<Response, Error, string>['mutate'];
  ketuaTimList: KetuaTimData[];
  addKetuaTim: UseMutationResult<KetuaTimData, Error, KetuaTimData>['mutate'];
  updateKetuaTim: (id: string, data: KetuaTimData) => void;
  removeKetuaTim: UseMutationResult<Response, Error, string>['mutate'];
  pplAdminList: PPLAdminData[];
  addPPLAdmin: UseMutationResult<PPLAdminData, Error, PPLAdminData>['mutate'];
  updatePPLAdmin: (id: string, data: PPLAdminData) => void;
  removePPLAdmin: UseMutationResult<Response, Error, string>['mutate'];
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
