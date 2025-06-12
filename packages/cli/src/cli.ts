#!/usr/bin/env node

import arg from 'arg'
import { asyncExitHook, gracefulExit } from 'exit-hook'
import { isError, isInteger, isString, map, repeat, throttle } from 'lodash-es'
import { readFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path, { resolve } from 'node:path'
import { promisify } from 'node:util'
import { gzip } from 'node:zlib'
import { Spinner } from 'picospinner'
import chalk from 'picocolors'
import {
  DEFAULT_DELTA_E,
  DEFAULT_HUE_ANGLE,
  DEFAULT_ITERATIONS,
  DEFAULT_N_DIVISOR,
  DEFAULT_PRECISION,
  N_DIVISORS,
} from './constants'
import { selectorPalette } from './store/selector-palette'
import {
  selectorOptimizeTasksCount,
  selectorOptimizeTasksNotPending,
} from './store/selector-optimize-tasks'
import { selectorState } from './store/selector-state'
import { selectorStatistics } from './store/selector-statistics'
import { type OptimizeTask, TypeCepheusState } from './types'
import { isFile } from './utilities/is-file'

const padNumber = (n: number, base: number) => {
  const string = n.toString()

  return `${repeat('0', base.toString().length - string.length)}${string}`
}

const compress = promisify(gzip)

const HELP = `${chalk.bold('Usage:')}
  cepheus --seed <string> (--color <color>)...
        [--color-gamut p3|srgb] [--color-space oklch|oklrch] [--prng xoshiro128++|xorwow|xorshift128|sfc32]
        [--delta-e jzczhz|ok2] [--iterations <number>] [--levels ${N_DIVISORS.join('|')}]
        [--restore <file>] [--save <file>]
  cepheus -h | --help
  cepheus --version

${chalk.bold('Options:')}
  --seed          Pseudorandom number generator seed.
  --color         Foreground color.
  --output        Write output palette to file.
  --color-gamut   Ensure that colors are inside the color gamut. [default: p3]
  --color-space   Preferred iteration color space. [default: oklrch]
  --hue-angle     Hue angle for each sampling step. [default: ${DEFAULT_HUE_ANGLE}]
  --prng          Pseudorandom number generator. [default: xoshiro128++]
  --levels        Number of uniform sampling steps (${N_DIVISORS.join(',')})
                  along each square axis. [default: ${DEFAULT_N_DIVISOR}]
  --iterations    Number of iterations. [default: ${DEFAULT_ITERATIONS}]
  --session       Use a session to file.
  --precision     Number of significant digits to round to. [default: ${DEFAULT_PRECISION}]
  --delta-e       DeltaE algorithm. [default: ${DEFAULT_DELTA_E}]

  -v, --version   Show version.
  -h, --help      Displays this message.

${chalk.bold('Example:')}
  cepheus --seed 'f7d4a9b6-1ea8-476d-9440-fb29251d5d73' \\
    --color '#1473e6' --color '#d7373f' --color '#da7b11' --color '#268e6c' \\
    --output palette.json
`

const run = async () => {
  const arguments_ = arg(
    {
      '--color': [String],
      '--color-gamut': String,
      '--color-space': String,
      '--delta-e': String,
      '--help': Boolean,
      '--hue-angle': Number,
      '--iterations': Number,
      '--levels': Number,
      '--output': String,
      '--precision': Number,
      '--prng': String,
      '--seed': String,
      '--session': String,
      '--version': Boolean,
      '-h': '--help',
      '-v': '--version',
    },
    { argv: process.argv.slice(2), permissive: false },
  )

  if (arguments_['--version'] === true) {
    const { version } = JSON.parse(readFileSync(resolve('../../package.json'), 'utf8')) as Record<
      'version',
      string
    >

    console.log(`${chalk.bold('cepheus')} v${version}`)
    return gracefulExit(0)
  }

  if (arguments_['--help'] === true) {
    console.log(HELP)
    return gracefulExit(0)
  }

  const colorGamut = arguments_['--color-gamut'] as 'p3' | 'srgb' | undefined
  const colorSpace = arguments_['--color-space'] as 'oklch' | 'oklrch' | undefined
  const deltaE = arguments_['--delta-e'] as 'jzczhz' | 'ok2' | undefined
  const colors = arguments_['--color']
  const levels = arguments_['--levels']
  const randomSource = arguments_['--prng'] as
    | 'sfc32'
    | 'xorshift128'
    | 'xorwow'
    | 'xoshiro128++'
    | undefined
  const randomSeed = arguments_['--seed']
  const iterations = arguments_['--iterations']
  const output = arguments_['--output']
  const hueAngle = arguments_['--hue-angle']
  const precision = arguments_['--precision']

  // required

  if (randomSeed === undefined) {
    console.log(HELP)
    console.error(`Option '--seed' must be defined.`)
    return gracefulExit(1)
  }

  if (output === undefined) {
    console.log(HELP)
    console.error(`Option '--output' must be defined.`)
    return gracefulExit(1)
  }

  if (colors === undefined || colors.length <= 1) {
    console.log(HELP)
    console.error(`At lest two '--color' options must be provided.`)
    return gracefulExit(1)
  }

  // optional

  if (deltaE !== undefined && !['jzczhz', 'ok2'].includes(deltaE)) {
    console.log(HELP)
    console.error(`Option '--delta-e' must be either 'jzczhz' or 'ok2'.`)
    return gracefulExit(1)
  }

  if (colorGamut !== undefined && !['p3', 'srgb'].includes(colorGamut)) {
    console.log(HELP)
    console.error(`Option '--color-gamut' must be either 'p3' or 'srgb'.`)
    return gracefulExit(1)
  }

  if (colorSpace !== undefined && !['oklch', 'oklrch'].includes(colorSpace)) {
    console.log(HELP)
    console.error(`Option '--color-gamut' must be either 'oklch' or 'oklrch'.`)
    return gracefulExit(1)
  }

  if (
    randomSource !== undefined &&
    !['sfc32', 'xorshift128', 'xorwow', 'xoshiro128++'].includes(randomSource)
  ) {
    console.log(HELP)
    console.error(
      `Option '--prng' must be one of 'xoshiro128++', 'xorwow', 'xorshift128', 'sfc32'.`,
    )
    return gracefulExit(1)
  }

  if (levels !== undefined && !N_DIVISORS.includes(levels)) {
    console.log(HELP)
    console.error(`Option '--levels' must be one of ${N_DIVISORS.join(', ')}.`)
    return gracefulExit(1)
  }

  if (iterations !== undefined && (!isInteger(iterations) || iterations < 1)) {
    console.log(HELP)
    console.error(`Option '--iterations' must be an integer greater or equal to 1.`)
    return gracefulExit(1)
  }

  if (hueAngle !== undefined && (!isInteger(hueAngle) || hueAngle < 1)) {
    console.log(HELP)
    console.error(`Option '--hue-angle' must be an integer greater or equal to 1.`)
    return gracefulExit(1)
  }

  if (precision !== undefined && (!isInteger(precision) || precision < 2 || precision > 10)) {
    console.log(HELP)
    console.error(
      `Option '--precision' must be an integer greater or equal to 2, and smaller or equal to 10.`,
    )
    return gracefulExit(1)
  }

  if (arguments_._.length !== 0) {
    console.log(HELP)
    return gracefulExit(1)
  }

  const { cepheus } = await import('./index')

  const session = isString(arguments_['--session'])
    ? path.resolve(process.cwd(), arguments_['--session'])
    : undefined

  const initialState =
    session !== undefined && (await isFile(session))
      ? (JSON.parse(await readFile(session, 'utf8')) as Record<string, OptimizeTask>)
      : undefined

  const spinner = new Spinner({ text: 'Preparing' })
  spinner.start()

  const instance = cepheus({
    colorGamut,
    colors: map(colors, (colors) => colors.split(',').map((value) => value.trim())),
    colorSpace,
    deltaE,
    hueAngle,
    initialState,
    iterations,
    levels,
    precision,
    randomSeed,
    randomSource,
  })

  const updateSpinner = throttle(
    (type: TypeCepheusState) => {
      if (type === TypeCepheusState.Optimization) {
        const { fulfilled, minTotal, pending, rejected } = selectorOptimizeTasksCount(
          instance.store,
        )
        const done = rejected + fulfilled
        const total = Math.max(pending + done, minTotal)

        spinner.setText(`Palette optimization \t${padNumber(done, total)} / ~${total}`)
      } else if (type === TypeCepheusState.OptimizationDone) {
        const { fulfilled, minTotal, pending, rejected } = selectorOptimizeTasksCount(
          instance.store,
        )
        const done = rejected + fulfilled
        const total = Math.max(pending + done, minTotal)

        spinner.succeed(`Palette optimization \t${padNumber(done, total)} / ~${total}`)
      } else if (type === TypeCepheusState.Abort) {
        spinner.fail()
      } else if (type === TypeCepheusState.Error) {
        spinner.fail()
      }
    },
    200,
    { leading: true },
  )

  instance.store.on('optimizeTask', async () => {
    if (session !== undefined) {
      await writeFile(
        session,
        JSON.stringify(selectorOptimizeTasksNotPending(instance.store)),
        'utf8',
      )
    }

    updateSpinner(TypeCepheusState.Optimization)
  })

  instance.store.on(['state'], ({ type }) => {
    updateSpinner.cancel()
    updateSpinner(type)
  })

  asyncExitHook(
    () => {
      instance.abort()
    },
    {
      wait: 300,
    },
  )

  return await instance.then(async () => {
    updateSpinner.flush()
    instance.store.clearListeners()
    spinner.stop()

    const state = selectorState(instance.store)

    if (state.type === TypeCepheusState.Done) {
      const content = JSON.stringify(selectorPalette(instance.store))
      const filePath = path.resolve(process.cwd(), output)
      const relativeFilePath = path.relative(process.cwd(), output)

      await writeFile(filePath, content, 'utf8')

      const statistics = selectorStatistics(instance.store)

      const kibs = content.length / 1024
      const compressedSize = await getCompressedSize(content)

      console.log()
      const gap = '   '
      const prefix = `${repeat(' ', relativeFilePath.length)}${gap}`

      console.log(
        `${chalk.white(chalk.bold(relativeFilePath))}${gap}${chalk.gray(
          `${kibs.toFixed(2)} KiB${compressedSize}`,
        )}`,
      )

      console.log(
        `${prefix}${chalk.gray(
          `${(
            statistics.colors * statistics.squaresRemaining
          ).toString()} (${statistics.colors.toString()} * ${statistics.squaresRemaining.toString()}) colors`,
        )}`,
      )
      console.log(
        `${prefix}${chalk.gray(
          `∧ ${statistics.costMin.toFixed(5)}  ∨ ${statistics.costMax.toFixed(5)}`,
        )}`,
      )

      console.log(
        `${prefix}${chalk.gray(
          `μ ${statistics.costMean.toFixed(5)}  σ ${statistics.costSd.toFixed(5)}`,
        )}`,
      )

      // console.log(
      //   wrap(
      //     `${stats.squaresRemaining} out of ${
      //       stats.squaresTotal
      //     } squares remaining. Cost range is (${stats.costMin.toFixed(
      //       6
      //     )} … ${stats.costMax.toFixed(6)}) with ${stats.costMean.toFixed(
      //       6
      //     )} mean, and ${stats.costSd.toFixed(6)} standard deviation.`,
      //     80
      //   )
      // )
    } else if (state.type === TypeCepheusState.Error) {
      const error = state.error

      console.log(error)

      if (isString(error)) {
        console.error(`${chalk.bgRed('ERROR')} ${error}`)
      } else if (isError(error)) {
        console.error(`${chalk.bgRed('ERROR')} ${error.message}`)
      }

      return gracefulExit(1)
    }

    // Array.from(store.cubes().entries()).map(([num, task]) => {
    //   return [num, task.state.colors]
    // })
  })
}

async function getCompressedSize(code: string | Uint8Array): Promise<string> {
  return ` / gzip: ${(
    (await compress(typeof code === 'string' ? code : Buffer.from(code))).length / 1024
  ).toFixed(2)} KiB`
}

await run()
