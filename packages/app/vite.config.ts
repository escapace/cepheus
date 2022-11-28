import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import unocss from 'unocss/vite'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
  build: {
    outDir: 'lib/vite'
  },
  plugins: [
    glsl(),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('sl-')
        }
      }
    }),
    unocss()
  ]
})
