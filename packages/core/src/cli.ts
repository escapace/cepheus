import arg from 'arg'
import { readFileSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { isInteger, isString } from 'lodash-es'
import ora from 'ora'
import path, { resolve } from 'path'
import { INTERVAL, Task, TypeBruniState } from './types'
import chalk from 'chalk'
import wrap from 'wrap-ansi'

const HELP = `${chalk.bold('Usage:')}
  bruni --seed <string> --background <color> (--color <color>)...
        [--color-space p3|srgb] [--prng xoshiro128++|xorwow|xorshift128|sfc32]
        [--tries <number>] [--levels 50|25|20|10|5|4|2]
        [--restore <file>] [--save <file>]
  bruni -h | --help
  bruni --version

${chalk.bold('Options:')}
  --seed          Pseudorandom number generator seed.
  --color         Foreground color.
  --background    Background color for calculation contrast value using
                  Advanced Perception of Color Algorithm (APCA).
  --output        Write output palette model to file.
  --color-space   Ensure that colors are inside the color space gamut. [default: p3]
  --prng          Pseudorandom number generator. [default: xoshiro128++]
  --levels        Number of uniform sampling steps along each cube axis. [default: 4]
  --tries         Optimization tries per each cube vertex. [default: 3]
  --save          Save session to file.
  --restore       Restore session from file.
  -v, --version   Show version.
  -h, --help      Displays this message.

${chalk.bold('Example:')}
  bruni --seed 'f7d4a9b6-1ea8-476d-9440-fb29251d5d73' \\
    --background '#ffffff' \\
    --color '#1473e6' --color '#d7373f' --color '#da7b11' --color '#268e6c' \\
    --output palette.json
`

const run = async () => {
  const args = arg(
    {
      '--seed': String,
      '--color': [String],
      '--background': String,
      '--output': String,
      '--color-space': String,
      '--prng': String,
      '--levels': Number,
      '--tries': Number,
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

    console.log(`${chalk.bold('bruni')} v${version}`)
    process.exit(0)
  }

  if (args['--help'] === true) {
    console.log(HELP)
    process.exit(0)
  }

  const background = args['--background']
  const colorSpace = args['--color-space'] as 'p3' | 'srgb' | undefined
  const colors = args['--color']
  const levels = args['--levels'] as INTERVAL | undefined
  const randomSource = args['--prng'] as
    | 'xoshiro128++'
    | 'xorwow'
    | 'xorshift128'
    | 'sfc32'
    | undefined
  const randomSeed = args['--seed']
  const tries = args['--tries']
  const output = args['--output']

  // required

  if (randomSeed === undefined) {
    console.log(HELP)
    console.error(`Option '--seed' must be defined.`)
    process.exit(1)
  }

  if (background === undefined) {
    console.log(HELP)
    console.error(`Option '--background' must be defined.`)
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

  if (levels !== undefined && ![2, 4, 5, 10, 20, 25, 50].includes(levels)) {
    console.log(HELP)
    console.error(`Option '--levels' must be one of 2, 4, 5, 10, 20, 25, 50.`)
    process.exit(1)
  }

  if (tries !== undefined && !(isInteger(tries) && tries >= 1)) {
    console.log(HELP)
    console.error(`Option '--tries' must be an integer greater or equal to 1.`)
    process.exit(1)
  }

  if (args._.length !== 0) {
    console.log(HELP)
    process.exit(1)
  }

  const { bruni } = await import('./index')

  const initialState = isString(args['--restore'])
    ? (JSON.parse(
        await readFile(path.resolve(process.cwd(), args['--restore']), 'utf8')
      ) as Record<string, Task>)
    : undefined

  const spinner = ora({ text: 'Starting up' }).start()

  const instance = bruni({
    background,
    colorSpace,
    colors,
    initialState,
    levels,
    randomSeed,
    randomSource,
    tries
  })

  const updateSpinnerOptimization = (type: TypeBruniState) => {
    const { pending, rejected, fulfilled } = instance.store.tasksCount()
    const done = rejected + fulfilled
    const total = pending + done

    spinner.text = `${done}/${total} palette optimization`

    switch (type) {
      case TypeBruniState.OptimizationDone:
        spinner.succeed()
        break
      case TypeBruniState.OptimizationAbort:
        spinner.fail()
        break
      case TypeBruniState.OptimizationError:
        spinner.fail()
        break
    }
  }

  instance.store.on('task', async () => {
    if (args['--save'] !== undefined) {
      await writeFile(
        path.resolve(process.cwd(), args['--save']),
        JSON.stringify(instance.store.tasksNotPending()),
        'utf8'
      )
    }

    updateSpinnerOptimization(TypeBruniState.None)
  })

  instance.store.on(['state'], ({ type }) => {
    switch (type) {
      case TypeBruniState.OptimizationDone:
        updateSpinnerOptimization(type)
        break
      case TypeBruniState.OptimizationAbort:
        updateSpinnerOptimization(type)
        break
      case TypeBruniState.OptimizationError:
        updateSpinnerOptimization(type)
        break
    }
  })

  return await instance.then(() => {
    spinner.stop()
    instance.store.clearListeners()

    const state = instance.store.state()

    if (state.type === TypeBruniState.Done) {
      // await writeFile(
      //   path.resolve(process.cwd(), output),
      //   JSON.stringify(instance.store.model()),
      //   'utf8'
      // )

      const stats = instance.store.stats()

      console.log()
      console.log(
        wrap(
          `${stats.cubesRemaining} out of ${
            stats.cubesTotal
          } cubes remaining. Cost range is (${stats.costMin.toFixed(
            6
          )} … ${stats.costMax.toFixed(6)}) with ${stats.costMean.toFixed(
            6
          )} mean, and ${stats.costSd.toFixed(6)} standard deviation.`,
          80
        )
      )
    } else {
      process.exit(1)
    }

    // Array.from(store.cubes().entries()).map(([num, task]) => {
    //   return [num, task.state.colors]
    // })
  })
}

await run()
