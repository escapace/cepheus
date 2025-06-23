import { type PlainColorObject, deltaEJz, deltaEOK2, P3, sRGB } from 'colorjs.io/fn'

type ColorSpace = 'p3' | 'srgb'
type DeltaEMethod = 'jzczhz' | 'oklab'

function findMaxDelta(colorSpace: ColorSpace, method: DeltaEMethod, samples = 2_000_000): number {
  let maxDeltaE = 0
  const space = colorSpace === 'p3' ? P3 : sRGB

  for (let index = 0; index < samples; index++) {
    // Generate random colors in target space
    const c1: PlainColorObject = {
      alpha: 1,
      coords: [Math.random(), Math.random(), Math.random()],
      space,
    }

    const c2: PlainColorObject = {
      alpha: 1,
      coords: [Math.random(), Math.random(), Math.random()],
      space,
    }

    // Calculate and compare
    const currentDelta = (method === 'jzczhz' ? deltaEJz : deltaEOK2)(c1, c2)
    if (currentDelta > maxDeltaE) {
      maxDeltaE = currentDelta
    }

    // Progress reporting
    if (index % 100_000 === 0) {
      console.log(`Processed ${index} samples... Current max: ${maxDeltaE}`)
    }
  }

  return maxDeltaE
}

const options: Array<[ColorSpace, DeltaEMethod, number | undefined]> = [
  ['srgb', 'jzczhz', undefined],
  ['srgb', 'oklab', undefined],
  ['p3', 'jzczhz', undefined],
  ['p3', 'oklab', undefined],
]

for (const option of options) {
  const [space, method] = option
  console.log()
  console.log(`Testing ${space} with ${method}...`)
  const maxDelta = findMaxDelta(space, method)
  console.log(`${space}/${method} maximum ΔE:`, maxDelta.toFixed(4))

  option[2] = maxDelta
}

console.log()
console.log(JSON.stringify(options, null, 2))
