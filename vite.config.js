import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 🔹 importante para GitHub Pages (use o nome EXATO do repositório)
  base: '/Elite-Anestesia-Ficha/',
})
