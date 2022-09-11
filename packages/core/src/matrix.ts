import {
  ColorSpace,
  LCH,
  OKLab,
  HSL,
  OKLCH,
  parse,
  sRGB,
  P3,
  convert,
  Color
} from '@escapace/bruni-color'
import { isString, keys, range } from 'lodash-es'
import { optimize, OptimizeOptions } from './optimize'
import { cartesianProduct } from './utilities/cartesian-product'
import { szudzik } from './utilities/szudzik'
import { hash } from './utilities/hash'
/* import Piscina from 'piscina' */

ColorSpace.register(HSL)
ColorSpace.register(P3)
ColorSpace.register(OKLab)
ColorSpace.register(OKLCH)
ColorSpace.register(sRGB)
ColorSpace.register(LCH)

const createDistribution = (step = 5) => {
  const half = range(0, 50, step)
    .map((y) => 51 - Math.round(((y * 2 - 100) ** 3 / 10 ** 4 + 100) * 0.5))
    .filter((value, index, array) => array.indexOf(value) === index)

  return [...half, ...half.map((y) => 100 - y)].sort((a, b) => a - b)
}

const rangeFrom = (distribution: number[], value: number): [number, number] => {
  const index = distribution.indexOf(value)

  if (index === -1) {
    throw new Error(`rangeFrom() index ${value} not present`)
  }

  return [distribution[index - 1] ?? 0, distribution[index + 1] ?? 100]
}

interface MainOptions
  extends Omit<
    OptimizeOptions,
    'colors' | 'background' | 'lightness' | 'chroma' | 'contrast'
  > {
  colors: Color[] | string[]
  background: Color | string
  tries?: number
}

interface RequiredMainOptions
  extends Omit<MainOptions, 'colors' | 'background'> {
  colors: Array<[number, number, number]>
  background: [number, number, number]
  distribution: number[]
  tries: number
}

const normalizeOptions = (options: MainOptions): RequiredMainOptions => {
  const colors = options.colors.map(
    (value) =>
      convert(isString(value) ? parse(value) : value, OKLCH, {
        inGamut: true
      }).coords
  )

  const background = convert(
    isString(options.background)
      ? parse(options.background)
      : options.background,
    OKLCH,
    {
      inGamut: true
    }
  ).coords

  const distribution = createDistribution()

  return {
    ...options,
    tries: options.tries ?? 3,
    colors,
    background,
    distribution
  }
}

interface Task {
  options: OptimizeOptions
}

const createTasks = (options: RequiredMainOptions): Record<string, Task[]> =>
  Object.fromEntries(
    cartesianProduct(
      options.distribution,
      options.distribution,
      options.distribution
    ).map((value) => {
      const key = szudzik(...value)

      const lightness: OptimizeOptions['lightness'] = {
        range: rangeFrom(options.distribution, value[0]),
        target: value[0]
      }

      const chroma: OptimizeOptions['chroma'] = {
        range: rangeFrom(options.distribution, value[1]),
        target: value[1]
      }

      const contrast: OptimizeOptions['contrast'] = {
        range: rangeFrom(options.distribution, value[2]),
        target: value[2]
      }

      const tasks: Task[] = range(options.tries).map(
        (n): Task => ({
          options: {
            randomSeed: hash(n, key, options.randomSeed),
            randomSource: options.randomSource,
            colors: options.colors,
            background: options.background,
            colorSpace: options.colorSpace,
            hyperparameters: options.hyperparameters,
            weights: options.weights,
            lightness,
            chroma,
            contrast
          }
        })
      )

      return [key, tasks]
    })
  )

export const main = (options: MainOptions) => {
  const normalizedOptions = normalizeOptions(options)
  const tasks = createTasks(normalizedOptions)

  /* const piscina = new Piscina({ */
  /*   // The URL must be a file:// URL */
  /*   filename: new URL('./worker.mjs', import.meta.url).href */
  /* }) */

  console.log(optimize(tasks[keys(tasks)[0]][0].options))

  /* const result = await piscina.run(tasks[keys(tasks)[0]][0].options, { name: 'optimize' }); */

  /* console.log(result) */
}

/* console.log(qwe2.length) */

/* console.log( */
/*   cartesianProduct(qwe2, qwe2, qwe2).map((value) => szudzik(...value)) */
/* ) */

/* const n = 6 */
/**/
/* console.log(cartesianProduct(qwe2, qwe2, qwe2) */
/*     .map((value) => szudzik(...value)) */
/*     .slice(-2) */
/* ) */
/**/
/* const obj = Object.fromEntries( */
/*   cartesianProduct(qwe2, qwe2, qwe2) */
/*     .map((value) => szudzik(...value)) */
/*     .map((key) => [key, range(n).map(() => [0.123456, 0.123456, 0.123456])]) */
/* ) */

/*
 * given
 *   n colors
 *   v variants
 *
 * Header
 *   2 Uint8Array 2x1 = 2 bytes // n, v
 * Variants
 *   v^3 Uint32Array = v^3 x 4 // Index
 *   v^3 x (n x 3) Uint32Array = v^3 x (n x 3) x 4 // colors
 */
/* console.log(Buffer.from(JSON.stringify(obj)).byteLength / 1000) */
