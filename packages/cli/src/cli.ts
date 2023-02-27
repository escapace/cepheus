import arg from 'arg'
import chalk from 'chalk'
import { readFileSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { isError, isInteger, isString, map, repeat, throttle } from 'lodash-es'
import ora from 'ora'
import path, { resolve } from 'path'
import { promisify } from 'util'
import { gzip } from 'zlib'
import { DEFAULT_ITERATIONS, DEFAULT_N_DIVISOR, N_DIVISORS } from './constants'
import { selectorModel } from './store/selector-model'
import {
  selectorOptimizeTasksCount,
  selectorOptimizeTasksNotPending
} from './store/selector-optimize-tasks'
import { selectorState } from './store/selector-state'
import { selectorStatistics } from './store/selector-statistics'
import { selectorTriangleTasksCount } from './store/wip'
import { OptimizeTask, TypeCepheusState } from './types'

const compress = promisify(gzip)

const HELP = `${chalk.bold('Usage:')}
  cepheus --seed <string> (--color <color>)...
        [--color-space p3|srgb] [--prng xoshiro128++|xorwow|xorshift128|sfc32]
        [--iterations <number>] [--levels ${N_DIVISORS.join('|')}]
        [--restore <file>] [--save <file>]
  cepheus -h | --help
  cepheus --version

${chalk.bold('Options:')}
  --seed          Pseudorandom number generator seed.
  --color         Foreground color.
  --output        Write output palette model to file.
  --color-space   Ensure that colors are inside the color space gamut. [default: p3]
  --hue-angle     Hue angle for each sampling step. [default: 30]
  --prng          Pseudorandom number generator. [default: xoshiro128++]
  --levels        Number of uniform sampling steps along each square axis. [default: ${DEFAULT_N_DIVISOR}]
  --iterations    Number of iterations. [default: ${DEFAULT_ITERATIONS}]
  --save          Save session to file.
  --restore       Restore session from file.
  -v, --version   Show version.
  -h, --help      Displays this message.

${chalk.bold('Example:')}
  cepheus --seed 'f7d4a9b6-1ea8-476d-9440-fb29251d5d73' \\
    --color '#1473e6' --color '#d7373f' --color '#da7b11' --color '#268e6c' \\
    --output palette.json
`

const run = async () => {
  const args = arg(
    {
      '--seed': String,
      '--color': [String],
      '--output': String,
      '--color-space': String,
      '--prng': String,
      '--hue-angle': Number,
      '--levels': Number,
      '--iterations': Number,
      '--save': String,
      '--restore': String,
      '--help': Boolean,
      '--version': Boolean,
      '-v': '--version',
      '-h': '--help'
    },
    { permissive: false, argv: process.argv.slice(2) }
  )

  if (args['--version'] === true) {
    const { version } = JSON.parse(
      readFileSync(resolve('../../package.json'), 'utf8')
    ) as Record<'version', string>

    console.log(`${chalk.bold('cepheus')} v${version}`)
    process.exit(0)
  }

  if (args['--help'] === true) {
    console.log(HELP)
    process.exit(0)
  }

  const colorSpace = args['--color-space'] as 'p3' | 'srgb' | undefined
  const colors = args['--color']
  const levels = args['--levels']
  const randomSource = args['--prng'] as
    | 'xoshiro128++'
    | 'xorwow'
    | 'xorshift128'
    | 'sfc32'
    | undefined
  const randomSeed = args['--seed']
  const iterations = args['--iterations']
  const output = args['--output']
  const hueAngle = args['--hue-angle']

  // required

  if (randomSeed === undefined) {
    console.log(HELP)
    console.error(`Option '--seed' must be defined.`)
    process.exit(1)
  }

  if (output === undefined) {
    console.log(HELP)
    console.error(`Option '--output' must be defined.`)
    process.exit(1)
  }

  if (colors === undefined || colors.length <= 1) {
    console.log(HELP)
    console.error(`At lest two '--color' options must be provided.`)
    process.exit(1)
  }

  // optional

  if (colorSpace !== undefined && !['p3', 'srgb'].includes(colorSpace)) {
    console.log(HELP)
    console.error(`Option '--color-space' must be either 'p3' or 'srgb'.`)
    process.exit(1)
  }

  if (
    randomSource !== undefined &&
    !['xoshiro128++', 'xorwow', 'xorshift128', 'sfc32'].includes(randomSource)
  ) {
    console.log(HELP)
    console.error(
      `Option '--prng' must be one of 'xoshiro128++', 'xorwow', 'xorshift128', 'sfc32'.`
    )
    process.exit(1)
  }

  if (levels !== undefined && !N_DIVISORS.includes(levels)) {
    console.log(HELP)
    console.error(`Option '--levels' must be one of ${N_DIVISORS.join(', ')}.`)
    process.exit(1)
  }

  if (iterations !== undefined && !(isInteger(iterations) && iterations >= 1)) {
    console.log(HELP)
    console.error(
      `Option '--iterations' must be an integer greater or equal to 1.`
    )
    process.exit(1)
  }

  if (hueAngle !== undefined && !(isInteger(hueAngle) && hueAngle >= 1)) {
    console.log(HELP)
    console.error(
      `Option '--hue-angle' must be an integer greater or equal to 1.`
    )
    process.exit(1)
  }

  if (args._.length !== 0) {
    console.log(HELP)
    process.exit(1)
  }

  const { cepheus } = await import('./index')

  const initialState = isString(args['--restore'])
    ? (JSON.parse(
        await readFile(path.resolve(process.cwd(), args['--restore']), 'utf8')
      ) as Record<string, OptimizeTask>)
    : undefined

  const spinner = ora({ text: 'Preparing' }).start()

  const instance = cepheus({
    hueAngle,
    colorSpace,
    colors: map(colors, (colors) =>
      colors.split(',').map((value) => value.trim())
    ),
    initialState,
    levels,
    randomSeed,
    randomSource,
    iterations
  })

  const ns = (n: number, base: number) => {
    const string = n.toString()

    return `${repeat('0', base.toString().length - string.length)}${string}`
  }

  const updateSpinner = throttle(
    (type: TypeCepheusState) => {
      if (type === TypeCepheusState.Optimization) {
        const { total, rejected, fulfilled } = selectorOptimizeTasksCount(
          instance.store
        )
        const done = rejected + fulfilled

        spinner.text = `Palette optimization \t${ns(done, total)} / ${total}`
      } else if (type === TypeCepheusState.OptimizationDone) {
        const { total, rejected, fulfilled } = selectorOptimizeTasksCount(
          instance.store
        )
        const done = rejected + fulfilled

        spinner.succeed(`Palette optimization \t${ns(done, total)} / ${total}`)
      } else if (type === TypeCepheusState.TriangleFitting) {
        if (!spinner.isSpinning) {
          spinner.start('Triangle fitting …')
        }

        const { total, rejected, fulfilled } = selectorTriangleTasksCount(
          instance.store
        )
        const done = rejected + fulfilled

        if (total === 0) {
          spinner.text = 'Triangle fitting …'
        } else {
          spinner.text = `Triangle fitting     \t${ns(done, total)} / ${total}`
        }
      } else if (type === TypeCepheusState.TriangleFittingDone) {
        const { total, rejected, fulfilled } = selectorTriangleTasksCount(
          instance.store
        )
        const done = rejected + fulfilled

        spinner.succeed(`Triangle fitting     \t${ns(done, total)} / ${total}`)
      } else if (type === TypeCepheusState.Abort) {
        spinner.fail()
      } else if (type === TypeCepheusState.Error) {
        spinner.fail()
      }
    },
    200,
    { leading: true }
  )

  instance.store.on('optimizeTask', async () => {
    if (args['--save'] !== undefined) {
      await writeFile(
        path.resolve(process.cwd(), args['--save']),
        JSON.stringify(selectorOptimizeTasksNotPending(instance.store)),
        'utf8'
      )
    }

    updateSpinner(TypeCepheusState.Optimization)
  })

  instance.store.on('triangleTask', () => {
    updateSpinner(TypeCepheusState.TriangleFitting)
  })

  instance.store.on(['state'], ({ type }) => {
    updateSpinner.cancel()
    updateSpinner(type)
  })

  return await instance.then(async () => {
    updateSpinner.flush()
    instance.store.clearListeners()
    spinner.stop()

    const state = selectorState(instance.store)

    if (state.type === TypeCepheusState.Done) {
      const content = JSON.stringify(selectorModel(instance.store))
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
        `${chalk.white(chalk.bold(relativeFilePath))}${gap}${chalk.grey(
          `${kibs.toFixed(2)} KiB${compressedSize}`
        )}`
      )

      console.log(
        `${prefix}${chalk.grey(
          `${(
            statistics.colors * statistics.squaresRemaining
          ).toString()} (${statistics.colors.toString()} * ${statistics.squaresRemaining.toString()}) colors`
        )}`
      )
      console.log(
        `${prefix}${chalk.grey(
          `∧ ${statistics.costMin.toFixed(5)}  ∨ ${statistics.costMax.toFixed(
            5
          )}`
        )}`
      )

      console.log(
        `${prefix}${chalk.grey(
          `μ ${statistics.costMean.toFixed(5)}  σ ${statistics.costSd.toFixed(
            5
          )}`
        )}`
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

      if (isString(error)) {
        console.error(`${chalk.bgRed('ERROR')} ${error}`)
      } else if (isError(error)) {
        console.error(`${chalk.bgRed('ERROR')} ${error.message}`)
      }

      process.exit(1)
    }

    // Array.from(store.cubes().entries()).map(([num, task]) => {
    //   return [num, task.state.colors]
    // })
  })
}

async function getCompressedSize(code: string | Uint8Array): Promise<string> {
  return ` / gzip: ${(
    (await compress(typeof code === 'string' ? code : Buffer.from(code)))
      .length / 1024
  ).toFixed(2)} KiB`
}

await run()
