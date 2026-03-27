import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// Stub out Figma Make's virtual modules so the app can run standalone
function figmaStubPlugin(): Plugin {
  return {
    name: 'figma-stub',
    resolveId(id) {
      if (id === 'figma:foundry-client-api') return id
      if (id.startsWith('figma:asset/')) return id
    },
    load(id) {
      if (id === 'figma:foundry-client-api') return 'export default {}'
      if (id.startsWith('figma:asset/')) return 'export default ""'
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    figmaStubPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
