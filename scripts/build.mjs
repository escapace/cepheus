import { build } from 'esbuild'
import { execa } from 'execa'
import fse from 'fs-extra'
import { mkdir } from 'fs/promises'
import path from 'path'
import process from 'process'
import { cwd, external, version, name } from './constants.mjs'

const tsconfig = fse.existsSync(path.join(cwd, 'tsconfig-build.json'))
  ? path.join(cwd, 'tsconfig-build.json')
  : path.join(cwd, 'tsconfig.json')

const getOptions = (format) => ({
  format,
  outdir: path.join(cwd, `lib/${format}`),
  tsconfig,
  entryPoints:
    name === 'cli'
      ? ['src/index.ts', 'src/worker.ts', 'src/cli.ts']
      : ['src/index.ts'],
  splitting: name === 'cli'
  /* name === 'yeux' */
  /*   ? ['lib/tsc/index.js', 'lib/tsc/cli.js'] */
  /*   : ['src/index.ts'] */
})

const formats = ['esm']

process.umask(0o022)
process.chdir(cwd)

await fse.remove(path.join(cwd, 'lib'))

await execa(
  path.join(cwd, 'node_modules', '.bin', 'tsc'),
  [
    '-p',
    path.relative(cwd, tsconfig),
    '--declaration',
    '--emitDeclarationOnly'
  ],
  {
    all: true,
    cwd
  }
).catch((reason) => {
  console.error(reason.all)
  process.exit(reason.exitCode)
})

await Promise.all(
  formats.map(async (format) => {
    const options = getOptions(format)
    await fse.remove(options.outdir)
    await mkdir(options.outdir, { recursive: true })

    await build({
      bundle: true,
      external: [
        'cepheus',
        '@cepheus/*',
        'cassiopeia',
        '@cassiopeia/*',
        'vue',
        '@vue/*',
        ...external
      ],
      define: {
        VERSION: JSON.stringify(version)
      },
      logLevel: 'info',
      outExtension: { '.js': `.${options.format === 'esm' ? 'mjs' : 'cjs'}` },
      platform: 'node',
      sourcemap: true,
      ...options
    })
  })
)
