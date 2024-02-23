import { cassiopeia } from '@cassiopeia/vite'
import vue from '@vitejs/plugin-vue'
import unocss from 'unocss/vite'
import { defineConfig, splitVendorChunkPlugin } from 'vite'

export default defineConfig(() => ({
  // ssr: {
  //   target: 'webworker'
  // },
  build: {
    rollupOptions: {
      external: ['__STATIC_CONTENT_MANIFEST']
    }
  },
  plugins: [vue(), unocss(), cassiopeia(), splitVendorChunkPlugin()]
}))
