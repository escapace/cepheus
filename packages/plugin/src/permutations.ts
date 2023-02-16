/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

export function permutations<O extends Record<string | number, any[]>>(obj: O) {
  let combos: Array<{ [k in keyof O]: O[k][number] }> = []

  for (const key in obj) {
    const values = obj[key]
    const all: Array<{ [k in keyof O]: O[k][number] }> = []

    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < (combos.length > 0 || 1); j++) {
        const newCombo = { ...combos[j], [key]: values[i] }
        all.push(newCombo)
      }
    }

    combos = all
  }

  return combos
}
