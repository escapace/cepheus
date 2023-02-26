import { build } from 'esbuild'
import { execa } from 'execa'
import fse from 'fs-extra'
import path from 'path'
import process from 'process'
import { cwd, external, name, version } from './constants.mjs'

const tsconfig = fse.existsSync(path.join(cwd, 'tsconfig-build.json'))
  ? path.join(cwd, 'tsconfig-build.json')
  : path.join(cwd, 'tsconfig.json')

process.umask(0o022)
process.chdir(cwd)

await fse.remove(path.join(cwd, 'lib'))

await execa(
  path.join(cwd, 'node_modules', '.bin', 'tsc'),
  [
    '-p',
    path.relative(cwd, tsconfig),
    '--declaration',
    '--emitDeclarationOnly',
    '--declarationDir',
    'lib/types'
  ],
  {
    all: true,
    cwd
  }
).catch((reason) => {
  console.error(reason.all)
  process.exit(reason.exitCode)
})

const buildOptions = {
  bundle: true,
  define: {
    __VERSION__: JSON.stringify(version)
  },
  mainFields: ['module'],
  entryPoints: ['src/index.ts'],
  external: ['cassiopeia', '@cassiopeia/*', 'vue', ...external],
  format: 'esm',
  logLevel: 'info',
  outExtension: { '.js': '.mjs' },
  outdir: path.join(cwd, `lib/esm`),
  platform: 'neutral',
  sourcemap: true,
  splitting: true,
  tsconfig
}

if (name === '@cepheus/cli') {
  await build({ ...buildOptions, platform: 'node' })
} else {
  await build(buildOptions)
}
