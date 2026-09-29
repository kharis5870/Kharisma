-- db/migrations/2026-09-28-nip-di-akun.sql
--
-- TAHAP 1 dari dua. Aman dijalankan SEBELUM kode baru diunggah: seluruhnya
-- menambah, tidak ada yang dibuang, jadi aplikasi yang sedang berjalan tidak
-- terganggu.
--
-- NIP PINDAH KE AKUN.
--
-- KENAPA PERLU: NIP adalah milik ORANG, bukan milik jabatan. Selama ia
-- tersimpan di `ketua_tim`, setiap pergantian tahun kepengurusan membuat satu
-- salinan baru nama dan NIP orang yang sama — padahal barisnya sudah menunjuk
-- akunnya lewat `user_id`. Akibatnya, memperbaiki satu salah ketik NIP di
-- kepengurusan 2027 tidak memperbaiki baris 2026, dan setelah beberapa tahun
-- satu orang punya beberapa versi NIP yang bisa berbeda-beda.
--
-- BOLEH KOSONG, dan itu disengaja. Tidak semua akun punya NIP tercatat saat
-- dibuat, dan memaksa NIP diisi saat menambah akun berarti pembuatan akun
-- tertahan hanya karena satu nomor yang bisa dilengkapi kapan saja. Ketua tim
-- yang akunnya belum ber-NIP tetap bisa didaftarkan; NIP-nya menyusul lewat
-- menu Users, dan begitu diisi langsung ikut di semua tahun kepengurusannya.

ALTER TABLE users ADD COLUMN nip VARCHAR(50) NULL AFTER nama_lengkap;

-- Memindahkan NIP yang sudah tercatat di ketua_tim ke akunnya.
--
-- Diambil yang TERPANJANG bila satu akun punya beberapa baris kepengurusan
-- dengan NIP berbeda: perbedaan semacam itu hampir selalu karena salah satunya
-- terpotong saat diketik ulang, bukan karena NIP-nya benar-benar berganti.
UPDATE users u
   JOIN (
        SELECT user_id, MAX(nip) AS nip
          FROM ketua_tim
         WHERE user_id IS NOT NULL AND nip IS NOT NULL AND nip <> ''
         GROUP BY user_id
   ) k ON k.user_id = u.id
    SET u.nip = k.nip
  WHERE u.nip IS NULL;
