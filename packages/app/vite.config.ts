import vue from '@vitejs/plugin-vue'
import unocss from 'unocss/vite'
import { defineConfig } from 'vite'
import { cassiopeia } from '@cassiopeia/vite'

export default defineConfig({
  build: {
    outDir: 'lib/vite'
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('sl-')
        }
      }
    }),
    cassiopeia(),
    unocss()
  ]
})
