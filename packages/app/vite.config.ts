import { cassiopeia } from '@cassiopeia/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig(() => ({
  build: {
    rollupOptions: {
      external: ['__STATIC_CONTENT_MANIFEST'],
    },
  },
  define: {
    __VUE_OPTIONS_API__: 'false',
  },
  plugins: [cassiopeia(), vue()],
  server: {
    allowedHosts: true as const,
  },
}))
