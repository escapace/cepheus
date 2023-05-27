import { yeux } from 'yeux'
import { build } from 'esbuild'
import path from 'path'
import { fileURLToPath } from 'url'

const cwd = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
process.chdir(cwd)

await yeux({ command: 'build', directory: cwd })

await build({
  entryPoints: ['./dist/server/entry-server.mjs'],
  outfile: './dist/worker/index.mjs',
  bundle: true,
  treeShaking: true,
  platform: 'neutral',
  minify: true,
  format: 'esm',
  banner: {
    'js': `import { Buffer } from 'node:buffer';`
  },
  external: ['__STATIC_CONTENT_MANIFEST'],
  allowOverwrite: true,
  conditions: ['workerd', 'default'],
  mainFields: ['module', 'main'],
  target: 'es2022',
  logOverride: {
    'ignored-bare-import': 'silent'
  },
  define: {
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false'
  }
})
