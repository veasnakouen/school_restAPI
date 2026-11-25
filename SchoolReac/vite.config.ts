import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material', '@mui/x-date-pickers'],
          'vendor-charts': ['@mui/x-charts'],
          'vendor-motion': ['framer-motion'],
          'vendor-export': ['xlsx', 'jspdf', 'jspdf-autotable', 'html2canvas'],
        },
      },
    },
  },
})
