import { build, type BuildOptions } from 'esroll'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pointe } from 'pointe'

const dirname = path.resolve(import.meta.dirname, '../')
process.chdir(dirname)

await pointe({ command: 'build', directory: dirname })

const packageJSON = JSON.parse(await readFile(path.join(dirname, 'package.json'), 'utf-8')) as {
  version: string
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

const constants = JSON.parse(
  await readFile(path.join(import.meta.dirname, 'constants.json'), 'utf-8'),
) as {
  builds: Record<string, BuildOptions>
}

for (const value of Object.values(constants.builds)) {
  await build({
    absWorkingDir: dirname,
    external: value.external ?? [],
    sourcemap: true,
    sourcesContent: false,
    splitting: false,
    treeShaking: true,
    tsconfig: 'tsconfig-build.json',
    ...value,
    define: {
      __VERSION__: JSON.stringify(packageJSON.version),
      ...value.define,
    },
    rollup: {
      experimentalLogSideEffects: true,
      ...value.rollup,
    },
    supported: {
      'const-and-let': true,
      ...value.supported,
    },
  })
}
