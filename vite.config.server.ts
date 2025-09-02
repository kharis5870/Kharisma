import { defineConfig } from "vite";
import path from "path";

// Server build configuration
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/node-build.ts"),
      name: "server",
      // UBAH fileName menjadi nama file yang Anda inginkan
      fileName: "node-build",
      // UBAH formats menjadi ["cjs"]
      formats: ["cjs"],
    },
    outDir: "dist/server",
    target: "node22",
    ssr: true,
    rollupOptions: {
      external: [
        "fs", "path", "url", "http", "https", "os", "crypto",
        "stream", "util", "events", "buffer", "querystring",
        "child_process", "express", "cors",
      ],
      output: {
        // PASTIKAN format adalah 'cjs'
        format: "cjs",
        // PASTIKAN entryFileNames menghasilkan .cjs
        entryFileNames: "[name].cjs",
      },
    },
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});