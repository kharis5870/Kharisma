/**
 * Base URL untuk API.
 * Di produksi: semua endpoint ada di bawah /kharisma/api
 * Di lokal dev: bisa override lewat VITE_API_URL di .env.development
 */
import { ambilToken, hapusToken } from "./tokenSesi";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "/kharisma/api";

/**
 * Fungsi terpusat untuk semua request ke API.
 */
async function request(endpoint: string, options: RequestInit = {}) {
  // Gabungkan base URL dengan endpoint API
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  // Token login dilampirkan di SATU tempat ini, sehingga setiap permintaan
  // membawa bukti identitas tanpa perlu diingat di tiap pemanggil. Server
  // memakainya menggantikan `username` yang dulu dikirim di badan permintaan.
  const token = ambilToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(fullUrl, { ...options, headers });

  // Sesi habis atau token tidak sah. Dibersihkan lalu halaman dimuat ulang ke
  // Login — kalau tidak, aplikasi tampak masih masuk padahal setiap permintaan
  // berikutnya akan gagal, dan pengguna hanya melihat galat beruntun.
  //
  // Endpoint login DIKECUALIKAN. Ia membalas 401 untuk password yang salah,
  // dan memperlakukannya sebagai "sesi berakhir" membuat kesalahan ketik
  // password tampil sebagai pesan yang menakutkan dan menyesatkan — seolah ada
  // masalah sesi, padahal pengguna memang belum masuk. Biarkan pesan asli dari
  // server ("Username atau password salah") yang sampai ke layar.
  const endpointLogin = endpoint.startsWith("/auth/login");

  if (response.status === 401 && !endpointLogin) {
    hapusToken();
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    if (!window.location.pathname.endsWith("/login")) {
      window.location.assign(`${import.meta.env.BASE_URL}login`);
    }
    throw new Error("Sesi Anda sudah berakhir. Silakan login kembali.");
  }

  if (!response.ok) {
    // 1. Ambil seluruh data JSON dari respons error (termasuk 'details')
    const errorData = await response.json().catch(() => ({
      message: `Request Gagal: ${response.status} ${response.statusText}`,
    }));
    
    // 2. Buat objek Error standar dengan pesan yang jelas
    const error = new Error(errorData.message || "Terjadi kesalahan pada server.");

    // 3. Tempelkan seluruh data respons ke dalam objek error
    //    agar bisa diakses di komponen (mirip struktur Axios)
    (error as any).response = { data: errorData };
    
    // 4. Lempar error yang sudah diperkaya dengan detail
    throw error;
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
