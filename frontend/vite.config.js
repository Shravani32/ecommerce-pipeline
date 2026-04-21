import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxies /api/* → http://localhost:8000/*
      // This avoids CORS issues during development
      "/products": "http://localhost:8000",
      "/orders":   "http://localhost:8000",
      "/health":   "http://localhost:8000",
    },
  },
});
