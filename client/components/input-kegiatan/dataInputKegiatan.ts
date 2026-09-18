// Dipisah dari client/pages/InputKegiatan.tsx tanpa mengubah isinya.

import { PPLMaster, UserData } from "@shared/api";
import { apiClient } from "@/lib/apiClient";

export const fetchPPLs = async (): Promise<PPLMaster[]> => {
    return apiClient.get<PPLMaster[]>('/ppl');
};

export const fetchPMLs = async (): Promise<UserData[]> => {
    return apiClient.get<UserData[]>('/admin/pml');
};
