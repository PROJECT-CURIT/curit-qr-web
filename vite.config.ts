import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const deploymentBase = `${(process.env.VITE_BASE_PATH || "").replace(/\/$/, "")}/`

export default defineConfig({
  base: deploymentBase,
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.CURIT_API_PROXY || "http://localhost:4100",
        changeOrigin: true,
      },
      "/health": {
        target: process.env.CURIT_API_PROXY || "http://localhost:4100",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
})
