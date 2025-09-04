/**
 * Base URL untuk API.
 * Di produksi: semua endpoint ada di bawah /kharisma/api
 * Di lokal dev: bisa override lewat VITE_API_URL di .env.development
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "/kharisma/api";

/**
 * Fungsi terpusat untuk semua request ke API.
 */
async function request(endpoint: string, options: RequestInit = {}) {
  // Gabungkan base URL dengan endpoint API
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(fullUrl, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Request Gagal: ${response.status} ${response.statusText}`,
    }));
    throw new Error(errorData.message || "Terjadi kesalahan pada server.");
  }

  if (response.status === 204) {
    return; // Handle respons "No Content"
  }
  return response.json();
}

// Ekspor objek siap pakai untuk semua jenis request
export const apiClient = {
  get: <T>(endpoint: string): Promise<T> => request(endpoint),
  post: <T>(endpoint: string, body: any): Promise<T> =>
    request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body: any): Promise<T> =>
    request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T>(endpoint: string): Promise<T> =>
    request(endpoint, {
      method: "DELETE",
    }),
};
