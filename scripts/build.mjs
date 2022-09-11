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

const options = {
  esm: {
    outdir: path.join(cwd, 'lib/esm'),
    tsconfig,
    entryPoints:
      name === 'core'
        ? ['src/index.ts', 'src/worker.ts', 'src/cli.ts']
        : ['src/index.ts'],
    splitting: name === 'core'
    /* name === 'yeux' */
    /*   ? ['lib/tsc/index.js', 'lib/tsc/cli.js'] */
    /*   : ['src/index.ts'] */
  }
}

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
  Object.keys(options).map(async (format) => {
    const { outdir } = options[format]

    await fse.remove(outdir)
    await mkdir(outdir, { recursive: true })

    await build({
      bundle: true,
      external,
      format,
      define: {
        VERSION: JSON.stringify(version)
      },
      logLevel: 'info',
      outExtension: { '.js': `.${format === 'esm' ? 'mjs' : 'cjs'}` },
      splitting: options.splitting,
      platform: 'node',
      sourcemap: true,
      ...options[format]
    })
  })
)
