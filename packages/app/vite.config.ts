import { cassiopeia } from '@cassiopeia/vite'
import vue from '@vitejs/plugin-vue'
import unocss from 'unocss/vite'
import { defineConfig, splitVendorChunkPlugin } from 'vite'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('sl-')
        }
      }
    }),
    unocss(),
    cassiopeia(),
    splitVendorChunkPlugin()
  ]
})
