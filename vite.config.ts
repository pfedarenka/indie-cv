import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three.js lives in its own lazily loaded chunk (~570 kB raw), which is fine.
    chunkSizeWarningLimit: 650,
  },
})
