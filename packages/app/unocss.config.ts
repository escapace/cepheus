import {
  defineConfig,
  presetIcons,
  transformerCompileClass,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss'

import { presetEscapace } from 'unocss-preset-escapace'

export default defineConfig({
  shortcuts: [
    ['container', '']
    // [
    //   'icon-btn',
    //   'inline-block cursor-pointer select-none opacity-75 transition duration-200 ease-in-out hover:opacity-100 hover:text-teal-600'
    // ]
  ],
  presets: [
    presetEscapace(),
    // presetAttributify({
    //   prefix: 'un-',
    //   prefixedOnly: true
    // }),
    presetIcons({
      scale: 1.2,
      warn: true
    })
    // presetTypography()
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
    transformerCompileClass()
  ]
  // safelist: 'prose prose-sm m-auto text-left'.split(' ')
})
