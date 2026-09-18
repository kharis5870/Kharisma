// Dipisah dari client/pages/EditActivity.tsx tanpa mengubah isinya.

import { Kegiatan, PPLMaster, KetuaTim, UserData } from "@shared/api";
import { apiClient } from "@/lib/apiClient";
import { FormState } from "@/components/edit-kegiatan/tipeEditKegiatan";

export const fetchActivityDetails = async (id: string): Promise<Kegiatan> => {
    return apiClient.get<Kegiatan>(`/kegiatan/${id}`);
}

export const fetchPPLs = async (): Promise<PPLMaster[]> => {
    return apiClient.get<PPLMaster[]>('/ppl');
};

export const fetchKetuaTim = async (): Promise<KetuaTim[]> => {
    return apiClient.get<KetuaTim[]>('/ketua-tim');
};

export const fetchPMLs = async (): Promise<UserData[]> => {
    return apiClient.get<UserData[]>('/admin/pml');
};

export const updateActivity = async (kegiatan: Partial<FormState> & {id: number}): Promise<Kegiatan> => {
    const sanitizedData = {
        ...kegiatan,
        dokumen: kegiatan.dokumen,
        ppl: kegiatan.ppl?.map(({ clientId, namaPPL, ...rest }) => rest),
    };
    return apiClient.put<Kegiatan>(`/kegiatan/${kegiatan.id}`, sanitizedData);
};
