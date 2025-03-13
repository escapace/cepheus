import { type PlainColorObject, deltaEJz, /* deltaEOK2, */ P3, sRGB } from 'colorjs.io/fn'

// Monte Carlo sampler
function findMaxDelta(colorSpace: 'p3' | 'srgb', samples = 2_000_000): number {
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
    const currentDelta = deltaEJz(c1, c2)
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

console.log('Testing sRGB...')
const srgbMax = findMaxDelta('srgb')
console.log('sRGB maximum ΔE:', srgbMax.toFixed(4))

console.log('\nTesting P3...')
const p3Max = findMaxDelta('p3')
console.log('P3 maximum ΔE:', p3Max.toFixed(4))

// import { type PlainColorObject, deltaEJz, P3, sRGB } from 'colorjs.io/fn'
// // Predefined high-chroma pairs for quick testing
// const EXTREME_PAIRS: Record<
//   'p3' | 'srgb',
//   Array<[[number, number, number], [number, number, number]]>
// > = {
//   p3: [
//     [
//       [1, 0, 0],
//       [0, 1, 1],
//     ], // P3 Red vs Cyan
//     [
//       [0, 1, 0],
//       [1, 0.95, 0],
//     ], // P3 Green vs Yellow
//     [
//       [0.46, 0.16, 1],
//       [1, 0.46, 0.16],
//     ], // P3 Purple vs Orange
//   ],
//   srgb: [
//     [
//       [1, 0, 0],
//       [0, 1, 1],
//     ], // Red vs Cyan
//     [
//       [0, 1, 0],
//       [1, 0, 1],
//     ], // Green vs Magenta
//     [
//       [0, 0, 1],
//       [1, 1, 0],
//     ], // Blue vs Yellow
//     [
//       [1, 1, 1],
//       [0, 0, 0],
//     ], // White vs Black
//   ],
// }
//
// const randColor = () =>
//   Array.from({ length: 3 }, () => (Math.random() < 0.7 ? Math.random() ** 2 : Math.random())) as [
//     number,
//     number,
//     number,
//   ]
//
// function findMaxDeltaEJz(colorSpace: 'p3' | 'srgb', samples = 50_000): number {
//   const space = colorSpace === 'p3' ? P3 : sRGB
//   let maxDeltaE = 0
//
//   // 1. Test known extreme pairs first
//   for (const [c1, c2] of EXTREME_PAIRS[colorSpace]) {
//     const colorA = { alpha: 1, coords: c1, space }
//     const colorB = { alpha: 1, coords: c2, space }
//     const dE = deltaEJz(colorA, colorB)
//     if (dE > maxDeltaE) {
//       maxDeltaE = dE
//       console.log('Extreme pair:', c1, 'vs', c2, 'ΔE:', dE.toFixed(4))
//     }
//   }
//
//   // 2. Biased random sampling with chroma focus
//   for (let index = 0; index < samples; index++) {
//     const c1 = { alpha: 1, coords: randColor(), space }
//     const c2 = { alpha: 1, coords: randColor(), space }
//
//     const dE = deltaEJz(c1, c2)
//     if (dE > maxDeltaE) {
//       maxDeltaE = dE
//       console.log('New max:', maxDeltaE.toFixed(4), 'at sample', index)
//     }
//   }
//
//   return maxDeltaE
// }
//
// // Sanity check for red vs cyan (should be ~1.6-1.8 in sRGB)
// const red: PlainColorObject = { alpha: 1, coords: [1, 0, 0], space: sRGB }
// const cyan: PlainColorObject = { alpha: 1, coords: [0, 1, 1], space: sRGB }
// console.log('Sanity check:', deltaEJz(red, cyan).toFixed(4))
//
// // Run tests
// console.log('Testing sRGB...')
// console.log('sRGB max ΔE:', findMaxDeltaEJz('srgb').toFixed(4))
//
// console.log('\nTesting P3...')
// console.log('P3 max ΔE:', findMaxDeltaEJz('p3').toFixed(4))
