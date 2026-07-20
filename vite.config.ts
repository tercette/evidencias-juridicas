import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O base do GitHub Pages (projeto) precisa ser "/NOME_DO_REPO/".
// Em dev fica "/". No deploy o workflow define VITE_BASE=/evidencias-juridicas/.
// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
})
