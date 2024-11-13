import { build } from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pointe } from 'pointe'

const cwd = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
process.chdir(cwd)

await pointe({ command: 'build', directory: cwd })

await build({
  allowOverwrite: true,
  banner: {
    js: `import { Buffer } from 'node:buffer';`,
  },
  bundle: true,
  conditions: ['workerd', 'default'],
  define: {
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  },
  entryPoints: ['./dist/server/entry-server.js'],
  external: ['__STATIC_CONTENT_MANIFEST'],
  format: 'esm',
  logOverride: {
    'ignored-bare-import': 'silent',
  },
  mainFields: ['module', 'main'],
  minify: true,
  outfile: './dist/worker/index.js',
  platform: 'neutral',
  target: 'es2022',
  treeShaking: true,
})
