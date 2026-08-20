import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['st.mse.name.my'],
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
