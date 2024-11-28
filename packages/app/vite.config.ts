import { cassiopeia } from '@cassiopeia/vite'
import vue from '@vitejs/plugin-vue'
import unocss from 'unocss/vite'
import { defineConfig, splitVendorChunkPlugin } from 'vite'

export default defineConfig(() => ({
  build: {
    rollupOptions: {
      external: ['__STATIC_CONTENT_MANIFEST'],
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler' as const,
      },
    },
  },
  define: {
    __VUE_OPTIONS_API__: 'false',
  },
  plugins: [vue(), unocss(), cassiopeia(), splitVendorChunkPlugin()],
}))
