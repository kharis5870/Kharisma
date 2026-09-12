// eslint.config.mjs
//
// "Mata" statis untuk Kharisma: membaca kode tanpa menjalankannya dan menandai
// pola yang rawan bug. Ini MELENGKAPI typecheck (`pnpm typecheck`), bukan
// menggantikannya — tsc sudah menangkap salah tipe dan variabel tak terpakai;
// linter menambah aturan yang tidak dikenal tsc, terutama aturan React.
//
// CARA PAKAI YANG AMAN
// - Jalankan `pnpm lint`. Hanya MELAPOR; tidak ada kode yang diubah.
// - Linter TIDAK disambungkan ke `pnpm build` maupun tes, dan paketnya hanya
//   devDependency — tidak ikut ke hasil build yang diunggah ke server.
// - JANGAN memakai `eslint --fix` untuk aturan yang menyentuh logika. Perbaiki
//   temuan satu per satu, lalu jalankan typecheck dan tes sesudahnya.
//
// PEMBAGIAN TINGKAT
// - "error": aturan yang hampir pasti menandai bug sungguhan — hook yang
//   dipanggil bersyarat, komponen yang didefinisikan di dalam komponen lain,
//   kunci objek ganda, kode yang tak terjangkau, dan sejenisnya.
// - "warn": gaya penulisan dan hal yang perlu DINILAI, bukan dituruti mentah-
//   mentah. Yang paling penting di sini adalah `react-hooks/exhaustive-deps`:
//   aturan itu akan menyarankan menambah dependensi pada beberapa useEffect,
//   termasuk efek hidrasi form di Edit Kegiatan yang dependensinya SENGAJA
//   dibatasi. Menurutinya begitu saja mengembalikan bug lama — isian yang
//   sedang diketik tertimpa data server.

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "public/**", "db/**"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ---------------------------------------------------------------- React
  {
    files: ["client/**/*.{ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: { globals: globals.browser },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.flat.recommended.rules,
      // Proyek memakai JSX runtime otomatis (Vite), jadi `import React`
      // tidak wajib di setiap berkas.
      ...react.configs.flat["jsx-runtime"].rules,

      // Hook yang dipanggil bersyarat atau di dalam loop: urutan hook bergeser
      // antar-render dan state tertukar. Selalu bug.
      "react-hooks/rules-of-hooks": "error",
      // Dinilai kasus per kasus — lihat catatan di kepala berkas.
      "react-hooks/exhaustive-deps": "warn",

      // Komponen yang didefinisikan DI DALAM komponen lain dipasang ulang pada
      // setiap render induknya, dan seluruh state-nya hilang. Inilah penyebab
      // bug tombol "Selesai" yang tidak berefek di Edit Kegiatan.
      "react/no-unstable-nested-components": ["error", { allowAsProps: true }],

      // TypeScript sudah memeriksa tipe props.
      "react/prop-types": "off",
      // Hanya menyangkut nama tampilan di React DevTools, bukan perilaku.
      "react/display-name": "warn",
      // Tanda kutip di teks JSX — gaya, bukan bug.
      "react/no-unescaped-entities": "warn",
      // Atribut `cmdk-*` adalah kait gaya milik pustaka cmdk yang dipakai komponen
      // Command bawaan shadcn — bukan properti yang salah ketik.
      "react/no-unknown-property": ["error", { ignore: ["cmdk-input-wrapper"] }],
    },
  },

  // ---------------------------------------------------------------- Server & konfigurasi
  {
    files: ["server/**/*.ts", "shared/**/*.ts", "*.ts", "*.mjs"],
    languageOptions: { globals: globals.node },
  },

  // ---------------------------------------------------------------- Seluruh berkas
  {
    rules: {
      // Banyak `any` warisan; ditandai supaya terlihat, tidak diwajibkan hilang.
      "@typescript-eslint/no-explicit-any": "warn",
      // tsc (noUnusedLocals) sudah menjadi penjaga utamanya.
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true,
      }],
      // Aturan gaya: dilaporkan, tidak dianggap bug.
      "prefer-const": "warn",
      "no-useless-escape": "warn",
      "no-empty": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-require-imports": "warn",
    },
  },
);
